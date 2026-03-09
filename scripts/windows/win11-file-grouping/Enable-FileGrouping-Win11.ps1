# Re-enable File Grouping in Windows 11 - Revert to Default
# This script re-enables automatic grouping if you want to revert the previous change

# Requires admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script requires administrator privileges. Please run as Administrator." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
$regName = "UseAutoGrouping"
$regValue = 1

try {
    # Set the registry value back to 1 (enabled)
    Set-ItemProperty -Path $regPath -Name $regName -Value $regValue -Type DWord -Force
    Write-Host "`nSuccess! File grouping has been re-enabled." -ForegroundColor Green
    Write-Host "The setting will apply to all folders in Windows Explorer." -ForegroundColor Green

    # Restart File Explorer to apply changes
    Write-Host "`nRestarting File Explorer to apply changes..." -ForegroundColor Yellow
    Get-Process explorer | Stop-Process -Force
    Start-Sleep -Seconds 5
    Start-Process explorer
    Write-Host "File Explorer restarted." -ForegroundColor Green
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
