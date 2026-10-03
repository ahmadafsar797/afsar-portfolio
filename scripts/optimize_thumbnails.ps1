Add-Type -AssemblyName System.Drawing

$uploadsDir = "C:\Users\asus\Desktop\Personal Portfolio website\uploads"
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

$thumbs = Get-ChildItem -Path $uploadsDir -Filter "*-thumb.jpg"
foreach ($t in $thumbs) {
    $tempFile = "$($t.FullName).tmp"
    $origImg = [System.Drawing.Image]::FromFile($t.FullName)
    
    # Calculate scale: max width 540 or max height 960
    $w = $origImg.Width
    $h = $origImg.Height
    $targetW = $w
    $targetH = $h
    if ($w -gt 540 -or $h -gt 960) {
        $scale = [Math]::Min(540.0 / $w, 960.0 / $h)
        $targetW = [int]($w * $scale)
        $targetH = [int]($h * $scale)
    }

    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($origImg, 0, 0, $targetW, $targetH)
    $g.Dispose()
    $origImg.Dispose()

    $bmp.Save($tempFile, $jpegCodec, $encoderParams)
    $bmp.Dispose()

    Move-Item -Path $tempFile -Destination $t.FullName -Force
    $size = (Get-Item $t.FullName).Length
    Write-Output "Optimized $($t.Name): ${targetW}x${targetH}, $([Math]::Round($size / 1024, 1)) KB"
}
