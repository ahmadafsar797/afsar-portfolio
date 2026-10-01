$path = "src/components/admin/AdminDashboard.tsx"
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$content = $content.Replace("bg-[#FF4D4D] text-white", "bg-[#F9A916] text-[#2B170F] font-bold")
$content = $content.Replace("#FF4D4D", "#F9A916")
$content = $content.Replace("font-serif", "font-pogonia")
$content = $content.Replace("font-sans", "font-montserrat")
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "AdminDashboard updated successfully"
