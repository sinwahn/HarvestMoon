@echo off
setlocal enabledelayedexpansion

set "directoryFrom=%1"
set "directoryTo=%2"
set "ip=%3"
set "user=%4"
set "password=%5"

:validate_directoryFrom
if "!directoryFrom!"=="" (
    set /p directoryFrom="Enter directoryFrom (source path): "
    goto validate_directoryFrom
)

:validate_directoryTo
if "!directoryTo!"=="" (
    set /p directoryTo="Enter directoryTo (destination path): "
    goto validate_directoryTo
)

:validate_ip
if "!ip!"=="" (
    set /p ip="Enter ip (remote IP address): "
    goto validate_ip
)

:validate_user
if "!user!"=="" (
    set /p user="Enter user (remote username): "
    goto validate_user
)

:validate_password
if "!password!"=="" (
    set /p password="Enter password (remote password): "
    goto validate_password
)

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set "mytime=!mytime:AM=!"
set "mytime=!mytime:PM=!"
set "mytime=!mytime: =!"
set "tempSubdir=deploy_!mydate!_!mytime!"
set "remoteTempPath=/tmp/!tempSubdir!"

echo [*] Deploying from: !directoryFrom!
echo [*] Destination:   !directoryTo!
echo [*] Remote temp:   !remoteTempPath!

(
    cd /d "!directoryFrom!" 2>nul
    tar -czf - .
) | ssh !user!@!ip! "mkdir -p '!remoteTempPath!' && tar -xzf - -C '!remoteTempPath!' --strip-components=1 && echo '!password!' | sudo -S sh -c 'cp -r '\''!remoteTempPath!'\''/* '\''!directoryTo!'\''/ && rm -rf '\''!remoteTempPath!'\'' '"
if errorlevel 1 (
    echo Error: Deployment failed
    exit /b 1
)

echo [+] Deployment complete!
exit /b 0
