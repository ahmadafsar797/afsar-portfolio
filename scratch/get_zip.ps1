$html = (Invoke-WebRequest -Uri "https://freefontdl.com/pogonia/" -UserAgent "Mozilla/5.0" -UseBasicParsing).Content
$pattern = 'https?://[^\s"''<>]+\.zip'
[regex]::Matches($html, $pattern) | ForEach-Object { $_.Value }
