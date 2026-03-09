# Add PowerShell Context Menu for PS1 Files
# Compatible with Windows 10 and Windows 11
#
# Non-admin entry: modifies the existing Windows.PowerShell.Run key which is
# already visible in the context menu. Changes its label (MUIVerb) and command
# to use -NoExit -File instead of the default -Command syntax.
#
# Admin entry: uses the runas key name (canonical Windows verb, always shown).

if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

$base = "HKLM:\SOFTWARE\Classes\SystemFileAssociations\.ps1\Shell"

# --- Clean up all stale entries from previous attempts ---
$staleKeys = @(
    "$base\run",
    "$base\run (admin)",
    "$base\RunPS",
    "$base\RunWithPowerShell",
    "$base\RunWithPS",
    "HKLM:\SOFTWARE\Classes\Microsoft.PowerShellScript.1\Shell\RunPS",
    "HKLM:\SOFTWARE\Classes\Microsoft.PowerShellScript.1\Shell\0"
)
foreach ($key in $staleKeys) {
    if (Test-Path $key) {
        Remove-Item -Path $key -Recurse -Force
        Write-Host "Cleaned up stale entry: $key" -ForegroundColor Gray
    }
}

try {
    # --- "run with ps" ---
    # Modifies the existing Windows.PowerShell.Run key which is already shown
    # in the context menu. Just changes its label and command.
    $runKey = "$base\Windows.PowerShell.Run"
    $runCmd = "$runKey\Command"
    if (-NOT (Test-Path $runCmd)) { New-Item -Path $runCmd -Force | Out-Null }
    Set-ItemProperty -Path $runKey -Name "MUIVerb" -Value "run with ps" -Force
    Set-ItemProperty -Path $runCmd -Name "(Default)" -Value 'powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%1"' -Force
    Write-Host "Added: run with ps" -ForegroundColor Green

    # --- "run with ps (admin)" ---
    $adminKey = "$base\runas"
    $adminCmd = "$adminKey\command"
    if (-NOT (Test-Path $adminCmd)) { New-Item -Path $adminCmd -Force | Out-Null }
    Set-ItemProperty -Path $adminKey -Name "(Default)"    -Value "run with ps (admin)" -Force
    Set-ItemProperty -Path $adminKey -Name "HasLUAShield" -Value "" -Force
    Set-ItemProperty -Path $adminCmd -Name "(Default)"    -Value 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%1"' -Force
    Write-Host "Added: run with ps (admin)" -ForegroundColor Green
}
catch {
    Write-Host "Error writing registry: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# --- Windows 11: legacy context menu offer ---
$winBuild = [System.Environment]::OSVersion.Version.Build
if ($winBuild -ge 22000) {
    Write-Host ""
    Write-Host "Windows 11 detected." -ForegroundColor Yellow
    Write-Host "Entries may be hidden inside 'Show more options' by default." -ForegroundColor Yellow
    Write-Host ""
    $answer = Read-Host "Restore the classic full right-click menu so entries show directly? (Y/N)"
    if ($answer -match '^[Yy]') {
        try {
            $clsidPath = "HKCU:\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32"
            New-Item -Path $clsidPath -Value "" -Force | Out-Null
            Write-Host "Classic context menu restored." -ForegroundColor Green
        }
        catch {
            Write-Host "Error restoring classic menu: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "Skipped. Access entries via right-click > Show more options." -ForegroundColor Gray
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
Write-Host "Done. Right-click any .ps1 file to see:" -ForegroundColor Green
Write-Host "  run with ps           (window stays open)" -ForegroundColor White
Write-Host "  run with ps (admin)   (triggers UAC prompt)" -ForegroundColor White

Read-Host "`nPress Enter to exit"
