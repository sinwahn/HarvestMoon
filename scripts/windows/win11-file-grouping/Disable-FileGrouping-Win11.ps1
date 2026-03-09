# Disable File Grouping in Windows 11 - Global Setting
# This script disables automatic grouping in Windows Explorer for all folders

# Requires admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script requires administrator privileges. Please run as Administrator." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"
$regName = "UseAutoGrouping"
$regValue = 0

try {
    # Check if the registry path exists, if not create it
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
        Write-Host "Registry path created." -ForegroundColor Green
    }

    # Set the registry value
    Set-ItemProperty -Path $regPath -Name $regName -Value $regValue -Type DWord -Force
    Write-Host "`nSuccess! File grouping has been disabled globally." -ForegroundColor Green
    Write-Host "The setting will apply to all folders in Windows Explorer." -ForegroundColor Green

    # Restart File Explorer to apply changes
    Write-Host "`nRestarting File Explorer to apply changes..." -ForegroundColor Yellow
    Get-Process explorer | Stop-Process -Force
    Start-Sleep -Seconds 5
    Start-Process explorer
    Write-Host "File Explorer restarted." -ForegroundColor Green

    Write-Host "`nTo revert this change, run the accompanying re-enable script or:" -ForegroundColor Cyan
    Write-Host "Set UseAutoGrouping value to 1 in the same registry path." -ForegroundColor Cyan
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
