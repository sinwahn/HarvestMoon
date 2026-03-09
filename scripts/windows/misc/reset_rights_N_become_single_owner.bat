@echo off
set /p TARGET_DIR=target directory path:

if "%TARGET_DIR%"=="" (
    echo Error: empty directory
    pause
    exit /b 1
)

if not exist "%TARGET_DIR%" (
    echo Error: %TARGET_DIR% does not exist
    pause
    exit /b 1
)

icacls "%TARGET_DIR%" /reset /T /C
icacls "%TARGET_DIR%" /grant:r "%USERDOMAIN%\%USERNAME%:(OI)(CI)F" /T /C
icacls "%TARGET_DIR%" /inheritance:r
pause
