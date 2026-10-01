$rootPath = "C:\Users\asus\Desktop\Personal Portfolio website\src"

$extensions = @("*.tsx", "*.ts", "*.css")
$files = @()
foreach ($ext in $extensions) {
    $files += Get-ChildItem -Path $rootPath -Filter $ext -Recurse
}

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $updated = $content `
        -replace '#F9A916', '#C96A24' `
        -replace '#f9a916', '#C96A24' `
        -replace '#e59b14', '#b05d1d' `
        -replace '#e9950c', '#b05d1d' `
        -replace '#e5990e', '#b05d1d'
    if ($updated -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $updated, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Done replacing golden -> burnt orange"
