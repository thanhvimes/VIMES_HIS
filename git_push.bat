@echo off
echo === Current Git Status ===
git status
echo.
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="Update backend and modules"
echo.
echo Staging changes...
git add .
echo.
echo Committing changes...
git commit -m "%commit_msg%"
echo.
echo Pushing changes...
git push
echo.
echo === Done ===
pause
