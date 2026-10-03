import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  Save,
  Upload,
  Film,
  Video,
  MessageSquareQuote,
  Briefcase,
  Layers,
  Settings,
  User,
  Inbox,
  LogOut,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Eye,
  RefreshCw,
  Lock,
  Camera,
} from 'lucide-react';
import { VideoFramePickerModal } from '../VideoFramePickerModal';
import { api } from '../../services/api';
import {
  Reel,
  HorizontalVideo,
  Testimonial,
  Project,
  Service,
  AboutData,
  SettingsData,
  ContactMessage,
} from '../../types';
import { isYouTubeUrl, getYouTubeThumbnail } from '../../utils/videoUtils';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, onDataChanged }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'reels' | 'horizontal' | 'testimonials' | 'projects' | 'services' | 'about' | 'messages' | 'settings'
  >('overview');

  // Loaded Data
  const [reels, setReels] = useState<Reel[]>([]);
  const [horizontalVideos, setHorizontalVideos] = useState<HorizontalVideo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [settings, setSettings] = useState<SettingsData>({});
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Feedback notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  // Editing state trackers
  const [editingReel, setEditingReel] = useState<Partial<Reel> | null>(null);
  const [editingHorizontal, setEditingHorizontal] = useState<Partial<HorizontalVideo> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  // Profile picture
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  // Showreel frame picker modal
  const [showreelPickerOpen, setShowreelPickerOpen] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showNotice('Please enter current and new password', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showNotice('New password must be at least 6 characters', 'error');
      return;
    }
    try {
      setPasswordLoading(true);
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showNotice('Admin password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showNotice(err.message || 'Failed to change password. Check current password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Check auth on open
  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const checkAuth = async () => {
    const token = localStorage.getItem('cinema_admin_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    try {
      await api.getMe();
      setIsAuthenticated(true);
      loadAllAdminData();
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await api.login(loginForm);
      setIsAuthenticated(true);
      loadAllAdminData();
      showNotice('Welcome back, Admin!');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    onDataChanged();
  };

  const loadAllAdminData = async () => {
    try {
      const [r, h, t, p, s, a, set, m] = await Promise.all([
        api.getReels(),
        api.getHorizontalVideos(),
        api.getTestimonials(),
        api.getProjects(),
        api.getServices(),
        api.getAbout(),
        api.getSettings(),
        api.getMessages(),
      ]);
      setReels(r);
      setHorizontalVideos(h);
      setTestimonials(t);
      setProjects(p);
      setServices(s);
      setAbout(a);
      setSettings(set);
      setMessages(m);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  // Helper file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice('Uploading media file...');
      const res = await api.uploadFile(file);
      callback(res.url);
      showNotice('Media uploaded successfully!');
    } catch (err: any) {
      showNotice(err.message || 'Failed to upload file', 'error');
    }
  };

  const handleProfilePicUpload = async (file: File) => {
    setProfilePicUploading(true);
    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setProfilePicPreview(localPreview);
    try {
      const res = await api.uploadProfilePicture(file);
      setSettings((prev) => ({ ...prev, profile_picture_url: res.url }));
      showNotice('Profile picture updated! Reload the page to see it in the navbar.');
    } catch (err: any) {
      setProfilePicPreview(null);
      showNotice(err.message || 'Failed to upload profile picture', 'error');
    } finally {
      setProfilePicUploading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    try {
      await api.removeProfilePicture();
      setSettings((prev) => ({ ...prev, profile_picture_url: undefined }));
      setProfilePicPreview(null);
      showNotice('Profile picture removed.');
    } catch (err: any) {
      showNotice(err.message || 'Failed to remove profile picture', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0c0c12] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Title Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e0e16]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C65D45]/20 border border-[#C65D45]/40 flex items-center justify-center text-[#C65D45]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pogonia text-2xl font-normal text-white">
                Studio Portfolio Manager
              </h2>
              <p className="text-[10px] font-montserrat uppercase tracking-wider text-white/50">
                Afsar Ahmad Post-Production CMS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {notice && (
              <span
                className={`text-xs px-3 py-1 rounded-full animate-in fade-in duration-300 font-montserrat ${
                  notice.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {notice.text}
              </span>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline font-montserrat text-[11px] uppercase">Logout</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unauthenticated View: Secure Login Form */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md p-8 rounded-3xl bg-[#12121a] border border-white/10 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#C65D45]/10 border border-[#C65D45]/30 flex items-center justify-center mx-auto mb-3 text-[#C65D45]">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="font-pogonia text-3xl font-normal text-white">
                  Editor Portal Authentication
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Enter your credentials to manage showreels, case studies, and inquiries.
                </p>
              </div>

              {loginError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-montserrat uppercase tracking-wider text-white/60 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C65D45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-montserrat uppercase tracking-wider text-white/60 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password..."
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C65D45]"
                  />
                  <span className="text-[10px] text-white/40 block mt-1">
                    Default: <code className="text-[#C65D45]">editor2026!</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-full text-xs font-montserrat uppercase tracking-widest font-semibold text-white bg-[#C65D45] hover:bg-[#ff3333] transition-all duration-300 mt-2 disabled:opacity-50"
                >
                  {loginLoading ? 'Authenticating...' : 'Sign In To Studio Dashboard'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Body */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0a0f] p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'overview' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('reels')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'reels' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Film className="w-4 h-4" />
                  <span>9:16 Reels</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {reels.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('horizontal')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'horizontal' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4" />
                  <span>16:9 Horizontal</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {horizontalVideos.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('testimonials')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'testimonials' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquareQuote className="w-4 h-4" />
                  <span>Testimonials</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {testimonials.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'projects' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4" />
                  <span>Case Studies</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {projects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'services' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Services</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {services.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'about' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>About & Bio</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'messages' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Inquiries</span>
                </div>
                {messages.filter((m) => m.status === 'unread').length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-black font-bold font-montserrat">
                    {messages.filter((m) => m.status === 'unread').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Site Settings</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0c0c12]">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white mb-1">
                      Portfolio Performance & Operations
                    </h3>
                    <p className="text-xs text-white/50">
                      Live content stats stored directly in the local SQLite engine.
                    </p>
                  </div>

                  {/* Summary metric cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">9:16 Reels</span>
                      <div className="font-pogonia text-4xl text-white font-semibold mt-1">
                        {reels.length}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">16:9 Films</span>
                      <div className="font-pogonia text-4xl text-white font-semibold mt-1">
                        {horizontalVideos.length}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">Testimonials</span>
                      <div className="font-pogonia text-4xl text-white font-semibold mt-1">
                        {testimonials.length}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">Client Leads</span>
                      <div className="font-pogonia text-4xl text-[#C65D45] font-semibold mt-1">
                        {messages.length}
                      </div>
                    </div>
                  </div>

                  {/* Recent messages summary */}
                  <div className="p-6 rounded-2xl bg-[#0f0f18] border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-pogonia text-xl font-normal text-white">
                        Latest Client Inquiries
                      </h4>
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="text-xs text-[#C65D45] hover:underline font-montserrat uppercase"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {messages.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{m.name} ({m.company || 'Direct'})</div>
                            <div className="text-white/50 mt-0.5 line-clamp-1">{m.message}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-[#C65D45] font-montserrat">{m.project_type}</span>
                            <div className="text-[10px] text-white/40">{m.budget}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REELS (9:16) */}
              {activeTab === 'reels' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage 9:16 Vertical Reels
                      </h3>
                      <p className="text-xs text-white/50">
                        Add, replace video files, update metrics, or delete short-form content.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingReel({
                          title: '',
                          category: 'Instagram Reels',
                          client: '',
                          video_url: '',
                          thumbnail_url: '',
                          views_count: '1.2M Views',
                          duration: '0:30',
                          is_featured: 1,
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload New Reel</span>
                    </button>
                  </div>

                  {/* Reel Edit Modal Form */}
                  {editingReel && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingReel.id ? 'Edit Reel' : 'Add New Reel'}
                        </h4>
                        <button onClick={() => setEditingReel(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editingReel.title || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="e.g. Kinetic Product Drop"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Category *
                          </label>
                          <select
                            value={editingReel.category || 'Instagram Reels'}
                            onChange={(e) => setEditingReel({ ...editingReel, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          >
                            <option value="Instagram Reels">Instagram Reels</option>
                            <option value="YouTube Shorts">YouTube Shorts</option>
                            <option value="Social Media Ads">Social Media Ads</option>
                            <option value="Talking Head Edits">Talking Head Edits</option>
                            <option value="Product Reels">Product Reels</option>
                            <option value="Cinematic Social Content">Cinematic Social Content</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Views Count Metric
                          </label>
                          <input
                            type="text"
                            value={editingReel.views_count || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, views_count: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="e.g. 2.4M Views"
                          />
                        </div>

                        {/* Video URL & File Upload */}
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Video URL (YouTube link, Shorts, or MP4) *
                          </label>
                          <input
                            type="text"
                            value={editingReel.video_url || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or .mp4"
                          />
                          {isYouTubeUrl(editingReel.video_url) && (
                            <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[#C65D45]/15 border border-[#C65D45]/30 text-xs text-[#C65D45]">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span>YouTube video detected! Thumbnail will auto-generate if left empty.</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Video File (MP4)</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) => setEditingReel({ ...editingReel, video_url: url }))
                              }
                            />
                          </label>
                        </div>

                        {/* Thumbnail URL & File Upload */}
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Poster Thumbnail URL (Optional — auto-generated from video/YouTube)
                          </label>
                          <input
                            type="text"
                            value={editingReel.thumbnail_url || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, thumbnail_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="Leave empty for auto thumbnail, or paste image URL"
                          />
                          {isYouTubeUrl(editingReel.video_url) && !editingReel.thumbnail_url && (
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={getYouTubeThumbnail(editingReel.video_url) || ''}
                                alt="Auto YouTube Thumbnail Preview"
                                className="w-16 h-10 object-cover rounded border border-white/20"
                              />
                              <span className="text-[11px] text-white/60">Auto-generated YouTube thumbnail</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Custom Thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) => setEditingReel({ ...editingReel, thumbnail_url: url }))
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingReel(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingReel.title || !editingReel.video_url) {
                              showNotice('Title and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingReel.id) {
                                await api.updateReel(editingReel.id, editingReel);
                                showNotice('Reel updated successfully!');
                              } else {
                                await api.createReel(editingReel);
                                showNotice('New reel created successfully!');
                              }
                              setEditingReel(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving reel', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Reel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reels Table */}
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e15]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase font-montserrat">
                        <tr>
                          <th className="p-3">Preview</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Views</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reels.map((r) => (
                          <tr key={r.id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <img
                                src={r.thumbnail_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=100&q=80'}
                                alt={r.title}
                                className="w-10 h-16 object-cover rounded-lg border border-white/10"
                              />
                            </td>
                            <td className="p-3 font-medium text-white max-w-[200px] truncate">{r.title}</td>
                            <td className="p-3 text-[#C65D45]">{r.category}</td>
                            <td className="p-3 text-white/50">{r.views_count}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingReel(r)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete reel "${r.title}"?`)) {
                                      await api.deleteReel(r.id);
                                      showNotice('Reel deleted');
                                      loadAllAdminData();
                                      onDataChanged();
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: HORIZONTAL VIDEOS (16:9) */}
              {activeTab === 'horizontal' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage 16:9 Horizontal Videos
                      </h3>
                      <p className="text-xs text-white/50">
                        Commercials, YouTube long-form, brand films, and documentary edits.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingHorizontal({
                          title: '',
                          category: 'Commercials',
                          client: '',
                          video_url: '',
                          thumbnail_url: '',
                          description: '',
                          duration: '02:30',
                          year: '2026',
                          is_featured: 1,
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload New Film</span>
                    </button>
                  </div>

                  {editingHorizontal && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingHorizontal.id ? 'Edit Horizontal Film' : 'Add New Horizontal Film'}
                        </h4>
                        <button onClick={() => setEditingHorizontal(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editingHorizontal.title || ''}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Category *
                          </label>
                          <select
                            value={editingHorizontal.category || 'Commercials'}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          >
                            <option value="Commercials">Commercials</option>
                            <option value="Brand films">Brand films</option>
                            <option value="YouTube videos">YouTube videos</option>
                            <option value="Corporate videos">Corporate videos</option>
                            <option value="Cinematic projects">Cinematic projects</option>
                            <option value="Long-form content">Long-form content</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={editingHorizontal.duration || ''}
                              onChange={(e) => setEditingHorizontal({ ...editingHorizontal, duration: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                              placeholder="03:45"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                              Year
                            </label>
                            <input
                              type="text"
                              value={editingHorizontal.year || ''}
                              onChange={(e) => setEditingHorizontal({ ...editingHorizontal, year: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                              placeholder="2026"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Video URL (YouTube link or MP4) *
                          </label>
                          <input
                            type="text"
                            value={editingHorizontal.video_url || ''}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or .mp4"
                          />
                          {isYouTubeUrl(editingHorizontal.video_url) && (
                            <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[#C65D45]/15 border border-[#C65D45]/30 text-xs text-[#C65D45]">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span>YouTube video detected! Thumbnail will auto-generate if left empty.</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Video File</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingHorizontal({ ...editingHorizontal, video_url: url })
                                )
                              }
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Thumbnail URL (Optional — auto-generated from YouTube if empty)
                          </label>
                          <input
                            type="text"
                            value={editingHorizontal.thumbnail_url || ''}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, thumbnail_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="Leave empty for auto thumbnail, or paste image URL"
                          />
                          {isYouTubeUrl(editingHorizontal.video_url) && !editingHorizontal.thumbnail_url && (
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={getYouTubeThumbnail(editingHorizontal.video_url) || ''}
                                alt="Auto YouTube Thumbnail Preview"
                                className="w-16 h-10 object-cover rounded border border-white/20"
                              />
                              <span className="text-[11px] text-white/60">Auto-generated YouTube thumbnail</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingHorizontal({ ...editingHorizontal, thumbnail_url: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Editorial Description / Story Synopsis
                        </label>
                        <textarea
                          rows={2}
                          value={editingHorizontal.description || ''}
                          onChange={(e) => setEditingHorizontal({ ...editingHorizontal, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingHorizontal(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingHorizontal.title || !editingHorizontal.video_url) {
                              showNotice('Title and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingHorizontal.id) {
                                await api.updateHorizontalVideo(editingHorizontal.id, editingHorizontal);
                                showNotice('Horizontal film updated!');
                              } else {
                                await api.createHorizontalVideo(editingHorizontal);
                                showNotice('New horizontal film created!');
                              }
                              setEditingHorizontal(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving video', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Film
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Horizontal Videos Table */}
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e15]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase font-montserrat">
                        <tr>
                          <th className="p-3">Thumbnail</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {horizontalVideos.map((v) => (
                          <tr key={v.id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <img
                                src={v.thumbnail_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80'}
                                alt={v.title}
                                className="w-20 h-12 object-cover rounded-lg border border-white/10"
                              />
                            </td>
                            <td className="p-3 font-medium text-white">{v.title}</td>
                            <td className="p-3 text-[#C65D45]">{v.category}</td>
                            <td className="p-3 text-white/50">{v.duration}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingHorizontal(v)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete video "${v.title}"?`)) {
                                      await api.deleteHorizontalVideo(v.id);
                                      showNotice('Horizontal video deleted');
                                      loadAllAdminData();
                                      onDataChanged();
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: TESTIMONIALS (9:16) */}
              {activeTab === 'testimonials' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage Client Video Testimonials
                      </h3>
                      <p className="text-xs text-white/50">
                        Upload 9:16 video feedback, edit quotes, names, and client titles.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingTestimonial({
                          client_name: '',
                          client_title: 'Marketing Director',
                          company: '',
                          avatar_url: '',
                          video_url: '',
                          thumbnail_url: '',
                          quote: '',
                          rating: 5,
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Testimonial</span>
                    </button>
                  </div>

                  {editingTestimonial && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingTestimonial.id ? 'Edit Testimonial' : 'Add New Client Video Testimonial'}
                        </h4>
                        <button onClick={() => setEditingTestimonial(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Client Name *
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.client_name || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, client_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Company / Brand *
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.company || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Client Role / Title
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.client_title || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, client_title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Avatar Photo URL
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.avatar_url || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            9:16 Video URL *
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.video_url || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Testimonial Video</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingTestimonial({ ...editingTestimonial, video_url: url })
                                )
                              }
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Thumbnail Poster URL
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.thumbnail_url || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, thumbnail_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingTestimonial({ ...editingTestimonial, thumbnail_url: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Written Review Quote
                        </label>
                        <textarea
                          rows={2}
                          value={editingTestimonial.quote || ''}
                          onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingTestimonial(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingTestimonial.client_name || !editingTestimonial.video_url) {
                              showNotice('Client name and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingTestimonial.id) {
                                await api.updateTestimonial(editingTestimonial.id, editingTestimonial);
                                showNotice('Testimonial updated!');
                              } else {
                                await api.createTestimonial(editingTestimonial);
                                showNotice('New testimonial created!');
                              }
                              setEditingTestimonial(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving testimonial', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Testimonial
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Testimonials List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-[#0e0e15] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={t.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                            alt={t.client_name}
                            className="w-12 h-16 object-cover rounded-lg border border-white/10"
                          />
                          <div>
                            <div className="font-semibold text-white">{t.client_name}</div>
                            <div className="text-xs text-[#C65D45]">{t.company}</div>
                            <div className="text-[11px] text-white/50 line-clamp-1 italic mt-1">"{t.quote}"</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingTestimonial(t)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete testimonial from "${t.client_name}"?`)) {
                                await api.deleteTestimonial(t.id);
                                showNotice('Testimonial deleted');
                                loadAllAdminData();
                                onDataChanged();
                              }
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: CASE STUDIES / PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage Case Studies & Before/After
                      </h3>
                      <p className="text-xs text-white/50">
                        Configure editorial breakdowns, raw vs color grade comparison images, and deliverables.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingProject({
                          title: '',
                          client: '',
                          category: 'Commercial Campaign',
                          video_url: '',
                          thumbnail_url: '',
                          brief: '',
                          approach: '',
                          deliverables: '',
                          software_used: 'Premiere Pro, AI Tools (Firefly, Runway ML)',
                          before_image_url: '',
                          after_image_url: '',
                          metrics: '',
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Case Study</span>
                    </button>
                  </div>

                  {editingProject && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingProject.id ? 'Edit Case Study' : 'Create Case Study'}
                        </h4>
                        <button onClick={() => setEditingProject(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Project Title *
                          </label>
                          <input
                            type="text"
                            value={editingProject.title || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={editingProject.category || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="e.g. Commercial Campaign"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Software Used
                          </label>
                          <input
                            type="text"
                            value={editingProject.software_used || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, software_used: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="Premiere Pro, AI Tools (Firefly, Runway ML)"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Video Master URL *
                          </label>
                          <input
                            type="text"
                            value={editingProject.video_url || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Video File</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingProject({ ...editingProject, video_url: url })
                                )
                              }
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Metrics / Impact
                          </label>
                          <input
                            type="text"
                            value={editingProject.metrics || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, metrics: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="e.g. 4.8M Impressions • 310% Lift"
                          />
                        </div>

                        {/* Before Image URL */}
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Before Image (Raw LOG Footage)
                          </label>
                          <input
                            type="text"
                            value={editingProject.before_image_url || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, before_image_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Before Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingProject({ ...editingProject, before_image_url: url })
                                )
                              }
                            />
                          </label>
                        </div>

                        {/* After Image URL */}
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            After Image (Final Color Master)
                          </label>
                          <input
                            type="text"
                            value={editingProject.after_image_url || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, after_image_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload After Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingProject({ ...editingProject, after_image_url: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          The Creative Brief
                        </label>
                        <textarea
                          rows={2}
                          value={editingProject.brief || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, brief: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Editing Approach & Narrative Techniques
                        </label>
                        <textarea
                          rows={2}
                          value={editingProject.approach || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, approach: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingProject(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingProject.title || !editingProject.video_url) {
                              showNotice('Title and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingProject.id) {
                                await api.updateProject(editingProject.id, editingProject);
                                showNotice('Case study updated!');
                              } else {
                                await api.createProject(editingProject);
                                showNotice('New case study created!');
                              }
                              setEditingProject(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving case study', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Case Study
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Projects List */}
                  <div className="space-y-3">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-[#0e0e15] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs text-[#C65D45] font-montserrat uppercase">{p.category}</div>
                          <h4 className="font-pogonia text-2xl text-white mt-0.5">{p.title}</h4>
                          <p className="text-xs text-white/50 line-clamp-1 mt-1">{p.brief}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingProject(p)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete case study "${p.title}"?`)) {
                                await api.deleteProject(p.id);
                                showNotice('Case study deleted');
                                loadAllAdminData();
                                onDataChanged();
                              }
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SERVICES */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage Offered Services
                      </h3>
                      <p className="text-xs text-white/50">
                        Edit service descriptions, turnaround times, and deliverables.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingService({
                          title: '',
                          slug: '',
                          icon_name: 'Film',
                          short_description: '',
                          deliverables: '',
                          turnaround: '2-3 Days',
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  {editingService && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingService.id ? 'Edit Service' : 'Add New Service'}
                        </h4>
                        <button onClick={() => setEditingService(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Service Title *
                          </label>
                          <input
                            type="text"
                            value={editingService.title || ''}
                            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Icon
                          </label>
                          <select
                            value={editingService.icon_name || 'Film'}
                            onChange={(e) => setEditingService({ ...editingService, icon_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          >
                            <option value="Smartphone">Smartphone (Reels)</option>
                            <option value="Youtube">Youtube</option>
                            <option value="Flame">Flame (Ads)</option>
                            <option value="Film">Film (Commercials)</option>
                            <option value="Package">Package (Product)</option>
                            <option value="Sparkles">Sparkles (Motion Graphics)</option>
                            <option value="Palette">Palette (Color Grading)</option>
                            <option value="Volume2">Volume2 (Sound Design)</option>
                            <option value="Briefcase">Briefcase (Corporate)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Typical Turnaround
                          </label>
                          <input
                            type="text"
                            value={editingService.turnaround || ''}
                            onChange={(e) => setEditingService({ ...editingService, turnaround: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="24-48 Hours"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Deliverables Summary
                          </label>
                          <input
                            type="text"
                            value={editingService.deliverables || ''}
                            onChange={(e) => setEditingService({ ...editingService, deliverables: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Short Description
                        </label>
                        <textarea
                          rows={2}
                          value={editingService.short_description || ''}
                          onChange={(e) => setEditingService({ ...editingService, short_description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingService(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingService.title) return;
                            try {
                              if (editingService.id) {
                                await api.updateService(editingService.id, editingService);
                                showNotice('Service updated!');
                              } else {
                                await api.createService(editingService);
                                showNotice('New service created!');
                              }
                              setEditingService(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving service', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Service
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-2xl bg-[#0e0e15] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-pogonia text-2xl text-white">{s.title}</div>
                          <div className="text-xs text-[#C65D45] font-montserrat mt-0.5">{s.turnaround}</div>
                          <div className="text-xs text-white/50 line-clamp-1 mt-1">{s.short_description}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingService(s)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete service "${s.title}"?`)) {
                                await api.deleteService(s.id);
                                showNotice('Service deleted');
                                loadAllAdminData();
                                onDataChanged();
                              }
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: ABOUT */}
              {activeTab === 'about' && about && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white">
                      Edit About & Career Statement
                    </h3>
                    <p className="text-xs text-white/50">
                      Update your creative philosophy, stats counter, and portrait.
                    </p>
                  </div>

                  <div className="space-y-4 p-6 rounded-2xl bg-[#101018] border border-white/10">
                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Core Headline / Philosophy
                      </label>
                      <input
                        type="text"
                        value={about.headline || ''}
                        onChange={(e) => setAbout({ ...about, headline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Professional Bio
                      </label>
                      <textarea
                        rows={3}
                        value={about.bio || ''}
                        onChange={(e) => setAbout({ ...about, bio: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Creative Philosophy
                      </label>
                      <textarea
                        rows={2}
                        value={about.philosophy || ''}
                        onChange={(e) => setAbout({ ...about, philosophy: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Years Exp
                        </label>
                        <input
                          type="text"
                          value={about.years_experience || ''}
                          onChange={(e) => setAbout({ ...about, years_experience: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Views Generated
                        </label>
                        <input
                          type="text"
                          value={about.views_generated || ''}
                          onChange={(e) => setAbout({ ...about, views_generated: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Projects
                        </label>
                        <input
                          type="text"
                          value={about.projects_delivered || ''}
                          onChange={(e) => setAbout({ ...about, projects_delivered: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Client Rate
                        </label>
                        <input
                          type="text"
                          value={about.client_satisfaction || ''}
                          onChange={(e) => setAbout({ ...about, client_satisfaction: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Portrait Image URL
                      </label>
                      <input
                        type="text"
                        value={about.avatar_url || ''}
                        onChange={(e) => setAbout({ ...about, avatar_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                      />
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                        <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                        <span>Upload New Portrait Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (url) => setAbout({ ...about, avatar_url: url }))
                          }
                        />
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          try {
                            await api.updateAbout(about);
                            showNotice('About details saved successfully!');
                            onDataChanged();
                          } catch (err: any) {
                            showNotice(err.message || 'Error saving about data', 'error');
                          }
                        }}
                        className="px-6 py-2.5 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                      >
                        Save About Information
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white">
                      Client Inquiries Inbox
                    </h3>
                    <p className="text-xs text-white/50">
                      Messages submitted by prospective clients through the contact section.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-white/40 text-sm">No inquiries in inbox yet.</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            m.status === 'unread'
                              ? 'bg-[#141420] border-[#C65D45]/50 shadow-lg'
                              : 'bg-[#0e0e15] border-white/10'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-pogonia text-2xl text-white">{m.name}</span>
                              {m.company && (
                                <span className="text-xs font-montserrat uppercase text-[#C65D45]">
                                  • {m.company}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-montserrat uppercase px-2.5 py-0.5 rounded-full ${
                                  m.status === 'unread'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-white/10 text-white/60'
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>

                            <span className="text-xs text-white/40 font-montserrat">
                              {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-white/70 mb-3">
                            <div>
                              <span className="text-white/40 font-montserrat uppercase mr-1">Email:</span>
                              <a href={`mailto:${m.email}`} className="text-[#C65D45] underline">
                                {m.email}
                              </a>
                            </div>
                            <div>
                              <span className="text-white/40 font-montserrat uppercase mr-1">Project Type:</span>
                              <span className="text-white">{m.project_type}</span>
                            </div>
                            <div>
                              <span className="text-white/40 font-montserrat uppercase mr-1">Budget:</span>
                              <span className="text-emerald-400 font-semibold">{m.budget}</span>
                            </div>
                          </div>

                          {m.brief_url && (
                            <div className="mb-3 text-xs">
                              <span className="text-white/40 font-montserrat uppercase mr-1">Brief / Footage Link:</span>
                              <a
                                href={m.brief_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#C65D45] underline inline-flex items-center gap-1"
                              >
                                <span>{m.brief_url}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-sm text-white/80 font-light leading-relaxed mb-4">
                            {m.message}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              {m.status === 'unread' ? (
                                <button
                                  onClick={async () => {
                                    await api.updateMessageStatus(m.id, 'read');
                                    showNotice('Marked as read');
                                    loadAllAdminData();
                                  }}
                                  className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-montserrat uppercase"
                                >
                                  Mark As Read
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    await api.updateMessageStatus(m.id, 'unread');
                                    showNotice('Marked as unread');
                                    loadAllAdminData();
                                  }}
                                  className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 font-montserrat uppercase"
                                >
                                  Mark Unread
                                </button>
                              )}

                              <a
                                href={`mailto:${m.email}?subject=RE: Video Editing Inquiry - ${m.project_type}`}
                                className="text-xs px-3 py-1 rounded-full bg-[#C65D45]/20 hover:bg-[#C65D45]/30 text-[#C65D45] border border-[#C65D45]/30 font-montserrat uppercase"
                              >
                                Reply Via Email
                              </a>
                            </div>

                            <button
                              onClick={async () => {
                                if (confirm('Delete this message?')) {
                                  await api.deleteMessage(m.id);
                                  showNotice('Message deleted');
                                  loadAllAdminData();
                                }
                              }}
                              className="text-white/40 hover:text-red-400 p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white">
                      Studio Settings & Social Links
                    </h3>
                    <p className="text-xs text-white/50">
                      Update contact channels, hero headline, showreel video URL, and availability.
                    </p>
                  </div>

                  {/* ── PROFILE PICTURE ────────────────────────────────── */}
                  <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Profile Picture</h4>
                      <p className="text-xs text-white/40 mt-0.5">Shown as your avatar in the navbar. Replaces the "A" letter.</p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Preview circle */}
                      <div className="w-20 h-20 rounded-full bg-[#C65D45] flex items-center justify-center shrink-0 overflow-hidden shadow-lg border-2 border-white/10">
                        {(profilePicPreview || settings.profile_picture_url) ? (
                          <img
                            src={profilePicPreview || settings.profile_picture_url}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-pogonia text-3xl font-bold text-[#2B170F]">A</span>
                        )}
                      </div>

                      {/* Upload & Remove */}
                      <div className="space-y-2 flex-1">
                        <label
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium
                            ${profilePicUploading
                              ? 'bg-white/5 border-white/10 text-white/30 pointer-events-none'
                              : 'bg-[#C65D45]/15 border-[#C65D45]/40 text-[#C65D45] hover:bg-[#C65D45]/25'
                            }`}
                        >
                          <Upload className="w-4 h-4" />
                          {profilePicUploading ? 'Uploading...' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={profilePicUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleProfilePicUpload(file);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {(profilePicPreview || settings.profile_picture_url) && (
                          <div>
                            <button
                              onClick={handleRemoveProfilePic}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove Picture
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-white/30">JPG, PNG, WebP · Max 5MB · Square crop recommended</p>
                      </div>
                    </div>
                  </div>
                  {/* ─────────────────────────────────────────────────────── */}

                  {/* ── CHANGE ADMIN PASSWORD ─────────────────────────── */}
                  <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#C65D45]" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Change Admin Password</h4>
                    </div>
                    <p className="text-xs text-white/50">
                      Update the password you use to log into this admin dashboard.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          placeholder="Current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] hover:bg-[#D76E56] font-semibold disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>
                  {/* ─────────────────────────────────────────────────────── */}

                  <div className="space-y-4 p-6 rounded-2xl bg-[#101018] border border-white/10">
                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Hero Headline
                      </label>
                      <input
                        type="text"
                        value={settings.hero_headline || ''}
                        onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Hero Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Live Availability Badge Text
                      </label>
                      <input
                        type="text"
                        value={settings.availability || ''}
                        onChange={(e) => setSettings({ ...settings, availability: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        placeholder="Available for Select Projects (Q1/Q2 2026)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Featured Master Showreel Video URL (YouTube link or MP4)
                      </label>
                      <input
                        type="text"
                        value={settings.featured_showreel_url || ''}
                        onChange={(e) => setSettings({ ...settings, featured_showreel_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                        placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or .mp4"
                      />
                      {isYouTubeUrl(settings.featured_showreel_url) && (
                        <div className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-[#C65D45]/15 border border-[#C65D45]/30">
                          <img
                            src={getYouTubeThumbnail(settings.featured_showreel_url) || ''}
                            alt="YouTube Showreel Thumbnail"
                            className="w-16 h-10 object-cover rounded border border-white/20 shrink-0"
                          />
                          <div className="text-xs text-[#C65D45]">
                            <span className="font-bold">YouTube Showreel Connected!</span>
                            <p className="text-[11px] text-white/60">Plays in fullscreen theater mode on click.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                          <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                          <span>Upload Showreel Video</span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) =>
                                setSettings({ ...settings, featured_showreel_url: url })
                              )
                            }
                          />
                        </label>

                        {/* Button to Choose Thumbnail from Video Frames */}
                        {settings.featured_showreel_url && (
                          <button
                            type="button"
                            onClick={() => setShowreelPickerOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C65D45]/20 hover:bg-[#C65D45]/30 text-xs font-bold text-[#C65D45] cursor-pointer border border-[#C65D45]/40 transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Choose Thumbnail from Video Frames</span>
                          </button>
                        )}
                      </div>

                      {/* Poster Thumbnail URL input & Preview */}
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Showreel Poster / Thumbnail URL (Auto from video frames or custom URL)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={settings.featured_showreel_poster || ''}
                            onChange={(e) => setSettings({ ...settings, featured_showreel_poster: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="Auto-generated from video or paste image URL"
                          />
                          {settings.featured_showreel_poster && (
                            <img
                              src={settings.featured_showreel_poster}
                              alt="Showreel Poster Preview"
                              className="w-14 h-9 object-cover rounded border border-white/20 shrink-0"
                            />
                          )}
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15 shrink-0">
                            <Upload className="w-3 h-3 text-[#C65D45]" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setSettings({ ...settings, featured_showreel_poster: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={settings.contact_email || ''}
                          onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={settings.whatsapp_number || ''}
                          onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          placeholder="+15553829014"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Instagram URL
                        </label>
                        <input
                          type="text"
                          value={settings.instagram_url || ''}
                          onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          value={settings.linkedin_url || ''}
                          onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          try {
                            await api.updateSettings(settings);
                            showNotice('Settings updated successfully!');
                            onDataChanged();
                          } catch (err: any) {
                            showNotice(err.message || 'Error updating settings', 'error');
                          }
                        }}
                        className="px-6 py-2.5 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Showreel Frame Picker Modal */}
      {settings.featured_showreel_url && (
        <VideoFramePickerModal
          isOpen={showreelPickerOpen}
          onClose={() => setShowreelPickerOpen(false)}
          videoUrl={settings.featured_showreel_url}
          currentPoster={settings.featured_showreel_poster}
          onSavePoster={async (url) => {
            setSettings((prev) => ({ ...prev, featured_showreel_poster: url }));
            try {
              await api.updateSettings({ ...settings, featured_showreel_poster: url });
              showNotice('Showreel thumbnail updated and saved successfully!');
              onDataChanged();
            } catch {
              showNotice('Thumbnail frame selected! Click "Save Settings" below to persist.');
            }
          }}
          title="Master Showreel"
        />
      )}
    </div>
  );
};
