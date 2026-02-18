@echo off
setlocal enabledelayedexpansion

set "GITHUB_API_URL=https://api.github.com/repos/sinwahn/HarvestMoon/commits"

echo Fetching latest commit hash from GitHub...

:: Fetch and parse in one go using curl with grep-like extraction
for /f "tokens=2 delims=:,^" %%A in ('curl -s "%GITHUB_API_URL%?per_page=1" ^| findstr "\"sha\""') do (
    set "COMMIT_HASH=%%A"
    set "COMMIT_HASH=!COMMIT_HASH:~1,40!"
    goto :display
)

echo Error: Failed to fetch commit hash
exit /b 1

:display
echo Latest Commit: !COMMIT_HASH!

pause
endlocal
exit /b 0