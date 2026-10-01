$files = Get-ChildItem -Path "src/components" -Filter "*.tsx" -Recurse
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    if ($content.Contains("font-serif")) {
        $content = $content.Replace("font-serif", "font-pogonia")
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated $($file.Name)"
    }
}
