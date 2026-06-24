@echo off
echo ========================================
echo Automatically syncing to GitHub...
echo ========================================

echo.
echo 1. Staging new files...
git add .

echo.
echo 2. Committing changes...
git commit -m "Auto-commit: %date% %time%"

echo.
echo 3. Pushing to GitHub...
set GCM_INTERACTIVE=false
set GIT_TERMINAL_PROMPT=0
git -c credential.helper= push -u origin main

echo.
echo ========================================
echo Sync Complete! You can close this window.
echo ========================================
pause
