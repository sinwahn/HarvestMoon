# Re-enable File Grouping in Windows 11 - Revert to Default
# This script re-enables automatic grouping if you want to revert the previous change

# Self-elevate if not already admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "Running as administrator." -ForegroundColor Green

# ── 1. Restore the legacy Explorer\Advanced key ──
$advPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
if (-not (Test-Path $advPath)) {
    New-Item -Path $advPath -Force | Out-Null
}
Set-ItemProperty -Path $advPath -Name "UseAutoGrouping" -Value 1 -Type DWord -Force
Write-Host "Set UseAutoGrouping = 1 in Explorer\Advanced." -ForegroundColor Green

# ── 2. Clear Shell Bags so Windows regenerates defaults (with grouping) ──
$bagPaths = @(
    "HKCU:\SOFTWARE\Classes\Local Settings\Software\Microsoft\Windows\Shell\Bags",
    "HKCU:\SOFTWARE\Classes\Local Settings\Software\Microsoft\Windows\Shell\BagMRU",
    "HKCU:\SOFTWARE\Microsoft\Windows\Shell\Bags",
    "HKCU:\SOFTWARE\Microsoft\Windows\Shell\BagMRU"
)

foreach ($path in $bagPaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Path $path -Recurse -Force
            Write-Host "Cleared: $path" -ForegroundColor Green
        } catch {
            Write-Host "Could not clear ${path}: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# ── 3. Restart File Explorer gracefully ──
Write-Host "`nRestarting File Explorer to apply changes..." -ForegroundColor Yellow
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Start-Process explorer.exe
Write-Host "File Explorer restarted." -ForegroundColor Green

Write-Host "`nDone! File grouping has been re-enabled (Windows default)." -ForegroundColor Cyan

Read-Host "`nPress Enter to exit"
