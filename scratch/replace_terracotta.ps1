$rootPath = "C:\Users\asus\Desktop\Personal Portfolio website\src"

$extensions = @("*.tsx", "*.ts", "*.css")
$files = @()
foreach ($ext in $extensions) {
    $files += Get-ChildItem -Path $rootPath -Filter $ext -Recurse
}

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $updated = $content `
        -replace '#C96A24', '#C65D45' `
        -replace '#c96a24', '#C65D45' `
        -replace '#b05d1d', '#a84d38' `
        -replace '#B05D1D', '#a84d38'
    if ($updated -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $updated, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done replacing burnt orange -> terracotta"
