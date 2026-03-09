@echo off
REM Wrapper: Invoke PowerShell script with bypass
REM This batch file simply delegates to the PowerShell script with proper execution policy bypass

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Remove-PS1-ContextMenu.ps1"
pause
