$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "RestivAdisyon_FullBackup_$timestamp.zip"

$oneDriveBackupDir = "C:\Users\bsehm\OneDrive\RestivAdisyon_Bulut_Yedekleri"
$dDriveBackupDir = "D:\RestivAdisyon_Guvenli_Yedekler"
$gDriveBackupDir = "G:\RestivAdisyon_Yedekler"

if (!(Test-Path $oneDriveBackupDir)) { New-Item -ItemType Directory -Path $oneDriveBackupDir -Force | Out-Null }
if (!(Test-Path $dDriveBackupDir)) { New-Item -ItemType Directory -Path $dDriveBackupDir -Force | Out-Null }

$tempDir = Join-Path $env:TEMP "RestivaBackup_$timestamp"
if (Test-Path $tempDir) { Remove-Item -Path $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$sourceDir = "c:\Users\bsehm\OneDrive\Masaüstü\qr menu"

Get-ChildItem -Path $sourceDir -Force | Where-Object { $_.Name -ne "node_modules" -and $_.Name -ne "dist" -and $_.Name -ne ".git" } | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
}

$zipPathOneDrive = Join-Path $oneDriveBackupDir $backupName
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPathOneDrive -CompressionLevel Optimal -Force

Copy-Item -Path $zipPathOneDrive -Destination (Join-Path $dDriveBackupDir $backupName) -Force

if (Test-Path "G:\") {
    if (!(Test-Path $gDriveBackupDir)) { New-Item -ItemType Directory -Path $gDriveBackupDir -Force | Out-Null }
    Copy-Item -Path $zipPathOneDrive -Destination (Join-Path $gDriveBackupDir $backupName) -Force
}

Remove-Item -Path $tempDir -Recurse -Force
Write-Host "Tam Yedekleme Başarıyla Oluşturuldu: $backupName" -ForegroundColor Green
