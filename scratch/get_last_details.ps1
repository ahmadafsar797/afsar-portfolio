$html = (Invoke-WebRequest -Uri "https://freefontdl.com/pogonia/" -UserAgent "Mozilla/5.0" -UseBasicParsing).Content
$idx = $html.LastIndexOf("download-details")
if ($idx -gt 0) {
    $sub = $html.Substring($idx, [Math]::Min(2500, $html.Length - $idx))
    Write-Host $sub
}
