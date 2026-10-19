/**
 * db.js — Dual Database Driver
 * - Uses Supabase PostgreSQL (via pg.Pool) when DATABASE_URL is set in environment.
 * - Falls back to pure JavaScript SQLite (via sql.js WebAssembly) when DATABASE_URL is not set.
 * 
 * Provides an async prepare() API compatible across both engines.
 */
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const dataDir = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads');
const dbPath = path.join(dataDir, 'portfolio.db');
const { syncPermanentSeedCode, importContentIntoDb, seedJsonPath } = require('./seedSync');

// ─── Supabase PostgreSQL Wrapper ──────────────────────────────────────────────
function wrapPg(pool) {
  function flatParams(args) {
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  }

  return {
    isPg: true,
    async exec(sql) {
      await pool.query(sql);
    },
    prepare(sql) {
      let paramIndex = 1;
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const isInsert = /^\s*insert\s+/i.test(pgSql);
      let runSql = pgSql;
      if (isInsert && !/returning/i.test(pgSql) && !/on conflict/i.test(pgSql)) {
        runSql = `${pgSql} RETURNING id`;
      }

      return {
        async get(...args) {
          const params = flatParams(args);
          const res = await pool.query(pgSql, params);
          return res.rows[0] || null;
        },
        async all(...args) {
          const params = flatParams(args);
          const res = await pool.query(pgSql, params);
          return res.rows;
        },
        async run(...args) {
          const params = flatParams(args);
          try {
            const res = await pool.query(runSql, params);
            return { lastInsertRowid: res.rows?.[0]?.id || null, changes: res.rowCount };
          } catch (e) {
            const res = await pool.query(pgSql, params);
            return { lastInsertRowid: null, changes: res.rowCount };
          }
        },
      };
    },
  };
}

// ─── sql.js SQLite Wrapper ────────────────────────────────────────────────────
function wrapSqlJs(sqlJsDb) {
  function saveToFile() {
    try {
      const data = sqlJsDb.export();
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  }

  function flatParams(args) {
    if (args.length === 1 && Array.isArray(args[0])) return args[0];
    return args;
  }

  function normalizeRow(row) {
    if (!row) return null;
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  }

  return {
    isPg: false,
    async exec(sql) {
      try {
        sqlJsDb.run(sql);
      } catch (e) {}
    },
    prepare(sql) {
      return {
        async get(...args) {
          const params = flatParams(args);
          const stmt = sqlJsDb.prepare(sql);
          try {
            if (params.length) stmt.bind(params);
            if (!stmt.step()) return null;
            return normalizeRow(stmt.getAsObject());
          } finally {
            stmt.free();
          }
        },
        async all(...args) {
          const params = flatParams(args);
          const stmt = sqlJsDb.prepare(sql);
          const rows = [];
          try {
            if (params.length) stmt.bind(params);
            while (stmt.step()) rows.push(normalizeRow(stmt.getAsObject()));
          } finally {
            stmt.free();
          }
          return rows;
        },
        async run(...args) {
          const params = flatParams(args);
          sqlJsDb.run(sql, params);
          const lastId = sqlJsDb.exec('SELECT last_insert_rowid()');
          const rowid = lastId[0]?.values[0][0] ?? null;
          saveToFile();
          return { lastInsertRowid: rowid, changes: sqlJsDb.getRowsModified() };
        },
      };
    },
  };
}

// ─── Internal database handle ─────────────────────────────────────────────────
let _db = null;
let _pool = null;

// ─── Async initializer (called once at server startup) ───────────────────────
async function initDb() {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    console.log('⚡ Connecting to Supabase PostgreSQL...');
    _pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    _db = wrapPg(_pool);
    await _pool.query('SELECT 1');
    console.log('✅ Supabase PostgreSQL connected and verified successfully!');
    return _db;
  }

  // Fallback to SQLite (sql.js)
  console.log('📁 No DATABASE_URL found. Initializing local SQLite database...');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  let sqlJsDb;
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    sqlJsDb = new SQL.Database(buf);
  } else {
    sqlJsDb = new SQL.Database();
  }

  _db = wrapSqlJs(sqlJsDb);
  console.log('✅ SQLite database initialized successfully!');
  return _db;
}

// ─── Proxy: forwards property access to _db ──────────────────────────────────
const db = new Proxy({}, {
  get(_, prop) {
    if (prop === 'initDb') return initDb;
    if (!_db) throw new Error('Database not initialized. Wait for initDb() to resolve.');
    const val = _db[prop];
    return typeof val === 'function' ? val.bind(_db) : val;
  },
});

module.exports = db;
