Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

$asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.GetParameters().Count -eq 1 -and 
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
} | Select-Object -First 1

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.FileProperties.ThumbnailMode, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.FileProperties.ThumbnailOptions, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [Type[]]@([Windows.Storage.Streams.IRandomAccessStream]))

$uploadsDir = "C:\Users\asus\Desktop\Personal Portfolio website\uploads"
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)

$videos = Get-ChildItem -Path $uploadsDir -Filter "*.mp4"

foreach ($v in $videos) {
    try {
        $op1 = [Windows.Storage.StorageFile]::GetFileFromPathAsync($v.FullName)
        $task1 = $asTaskMethod.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($op1))
        $file = $task1.GetAwaiter().GetResult()

        # SingleItem with UseCurrentScale preserves the EXACT aspect ratio (no letterboxing/cropping)
        $op2 = $file.GetThumbnailAsync([Windows.Storage.FileProperties.ThumbnailMode]::SingleItem, 1080, [Windows.Storage.FileProperties.ThumbnailOptions]::UseCurrentScale)
        $task2 = $asTaskMethod.MakeGenericMethod([Windows.Storage.FileProperties.StorageItemThumbnail]).Invoke($null, @($op2))
        $thumb = $task2.GetAwaiter().GetResult()

        if ($null -eq $thumb -or $thumb.Size -eq 0) {
            Write-Warning "Could not extract thumbnail for $($v.Name)"
            continue
        }

        $netStream = $asStreamMethod.Invoke($null, @($thumb))
        $origImg = [System.Drawing.Image]::FromStream($netStream)

        $origW = $origImg.Width
        $origH = $origImg.Height

        # Determine target size preserving exact aspect ratio
        if ($origW -gt $origH) {
            # Landscape video (16:9)
            $targetW = 960
            $targetH = [int](960.0 * $origH / $origW)
        } else {
            # Vertical reel (9:16)
            $targetW = 540
            $targetH = [int](540.0 * $origH / $origW)
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
        $netStream.Close()

        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($v.Name)
        $thumbName = "$baseName-thumb.jpg"
        $outPath = Join-Path $uploadsDir $thumbName

        $bmp.Save($outPath, $jpegCodec, $encoderParams)
        $bmp.Dispose()

        $len = (Get-Item $outPath).Length
        Write-Output "Regenerated true aspect thumbnail for $($v.Name): ${targetW}x${targetH} ($([Math]::Round($len / 1024, 1)) KB)"
    } catch {
        Write-Error "Error processing $($v.Name): $_"
    }
}

Write-Output "All thumbnails regenerated with true native aspect ratio!"
