$html = (Invoke-WebRequest -Uri "https://freefontdl.com/pogonia/" -UserAgent "Mozilla/5.0" -UseBasicParsing).Content
[regex]::Matches($html, '<a\s+[^>]*href="([^"]+)"[^>]*>.*?(?:download|Download).*?</a>') | ForEach-Object {
    Write-Host $_.Groups[1].Value
}
