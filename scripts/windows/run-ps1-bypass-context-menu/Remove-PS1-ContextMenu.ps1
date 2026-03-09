# Remove PowerShell Context Menu for PS1 Files
# Compatible with Windows 10 and Windows 11

if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

$base = "HKLM:\SOFTWARE\Classes\SystemFileAssociations\.ps1\Shell"

try {
    # Restore Windows.PowerShell.Run to its original state
    $runKey = "$base\Windows.PowerShell.Run"
    $runCmd = "$runKey\Command"
    if (Test-Path $runKey) {
        Set-ItemProperty -Path $runKey -Name "MUIVerb" -Value '@"C:\WINDOWS\system32\windowspowershell\v1.0\powershell.exe ",-108' -Force
        if (Test-Path $runCmd) {
            Set-ItemProperty -Path $runCmd -Name "(Default)" -Value '"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" "-file" " %1 "' -Force
        }
        Write-Host "Restored: Windows.PowerShell.Run to original" -ForegroundColor Green
    }

    # Remove runas and all stale keys
    $keysToRemove = @(
        "$base\runas",
        "$base\run",
        "$base\run (admin)",
        "$base\RunPS",
        "$base\RunWithPS",
        "$base\RunWithPowerShell",
        "HKLM:\SOFTWARE\Classes\Microsoft.PowerShellScript.1\Shell\RunPS"
    )
    foreach ($key in $keysToRemove) {
        if (Test-Path $key) {
            Remove-Item -Path $key -Recurse -Force
            Write-Host "Removed: $key" -ForegroundColor Green
        } else {
            Write-Host "Not found (already removed): $key" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# --- Windows 11: offer to revert classic context menu ---
$winBuild = [System.Environment]::OSVersion.Version.Build
if ($winBuild -ge 22000) {
    $clsidPath = "HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32"
    if (Test-Path $clsidPath) {
        Write-Host ""
        Write-Host "The classic context menu override is still active on this machine." -ForegroundColor Yellow
        $answer = Read-Host "Revert to the Windows 11 compact context menu? (Y/N)"
        if ($answer -match '^[Yy]') {
            try {
                Remove-Item -Path $clsidPath -Force
                Write-Host "Reverted to Windows 11 compact context menu." -ForegroundColor Green
            }
            catch {
                Write-Host "Error reverting context menu: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# --- Restart Explorer ---
Write-Host ""
Write-Host "Restarting File Explorer to apply changes..." -ForegroundColor Cyan
try {
    Stop-Process -Name explorer -Force -ErrorAction Stop
    Start-Sleep -Seconds 1
    Start-Process explorer
    Write-Host "File Explorer restarted." -ForegroundColor Green
}
catch {
    Write-Host "Could not restart Explorer automatically: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please restart File Explorer manually via Task Manager." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done. Context menu entries have been removed." -ForegroundColor Green
Read-Host "Press Enter to exit"
