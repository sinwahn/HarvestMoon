# Disable File Grouping in Windows 11 - Global Setting
# This script disables automatic grouping in Windows Explorer for all folders

# Self-elevate if not already admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "Running as administrator." -ForegroundColor Green

# ── 1. Set the legacy Explorer\Advanced key (older Win11 / Win10 fallback) ──
$advPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
if (-not (Test-Path $advPath)) {
    New-Item -Path $advPath -Force | Out-Null
}
Set-ItemProperty -Path $advPath -Name "UseAutoGrouping" -Value 0 -Type DWord -Force
Write-Host "Set UseAutoGrouping = 0 in Explorer\Advanced." -ForegroundColor Green

# ── 2. Clear Shell Bags so per-folder grouping is reset (Win11 main fix) ──
# Removing these keys forces Explorer to regenerate folder view settings
# without the grouping state that was previously saved per-folder.
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

Write-Host "`nDone! File grouping has been disabled." -ForegroundColor Cyan
Write-Host "If some folders still show grouping, open them manually and set View > Group By > None." -ForegroundColor Cyan

Read-Host "`nPress Enter to exit"
