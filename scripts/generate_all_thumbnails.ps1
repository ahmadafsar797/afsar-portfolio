# Load WinRT and .NET assemblies
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.GetParameters().Count -eq 1 -and 
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
} | Select-Object -First 1

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.FileProperties.ThumbnailMode, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [Type[]]@([Windows.Storage.Streams.IRandomAccessStream]))

$rootDir = "C:\Users\asus\Desktop\Personal Portfolio website"
$uploadsDir = Join-Path $rootDir "uploads"

function Generate-VideoThumbnail($videoFullPath, $outputFullPath) {
    if (-not (Test-Path $videoFullPath)) {
        Write-Warning "Video not found: $videoFullPath"
        return $false
    }
    
    try {
        $op1 = [Windows.Storage.StorageFile]::GetFileFromPathAsync($videoFullPath)
        $task1 = $asTaskMethod.MakeGenericMethod([Windows.Storage.StorageFile]).Invoke($null, @($op1))
        $file = $task1.GetAwaiter().GetResult()

        $op2 = $file.GetThumbnailAsync([Windows.Storage.FileProperties.ThumbnailMode]::VideosView, 720)
        $task2 = $asTaskMethod.MakeGenericMethod([Windows.Storage.FileProperties.StorageItemThumbnail]).Invoke($null, @($op2))
        $thumb = $task2.GetAwaiter().GetResult()

        if ($null -eq $thumb -or $thumb.Size -eq 0) {
            Write-Warning "Could not extract thumbnail for $videoFullPath"
            return $false
        }

        $netStream = $asStreamMethod.Invoke($null, @($thumb))
        $fileStream = [System.IO.File]::Create($outputFullPath)
        $netStream.CopyTo($fileStream)
        $fileStream.Close()
        $netStream.Close()

        $len = (Get-Item $outputFullPath).Length
        Write-Output "Generated thumbnail for $(Split-Path $videoFullPath -Leaf) -> $(Split-Path $outputFullPath -Leaf) ($len bytes)"
        return $true
    } catch {
        Write-Error "Error extracting thumbnail: $_"
        return $false
    }
}

# Process all MP4s in uploads directory
$videos = Get-ChildItem -Path $uploadsDir -Filter "*.mp4"
foreach ($v in $videos) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($v.Name)
    $thumbName = "$baseName-thumb.jpg"
    $thumbPath = Join-Path $uploadsDir $thumbName
    
    if (-not (Test-Path $thumbPath)) {
        Generate-VideoThumbnail $v.FullName $thumbPath
    } else {
        Write-Output "Thumbnail already exists: $thumbName"
    }
}

Write-Output "All thumbnails processed successfully!"
