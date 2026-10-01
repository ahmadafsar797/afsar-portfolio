$html = (Invoke-WebRequest -Uri "https://freefontdl.com/pogonia/" -UserAgent "Mozilla/5.0" -UseBasicParsing).Content
$idx = $html.IndexOf("download-details")
if ($idx -gt 0) {
    $sub = $html.Substring($idx, [Math]::Min(1500, $html.Length - $idx))
    Write-Host $sub
} else {
    Write-Host "download-details not found"
}
