@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Checking git repository...
if not exist .git (
    echo Initializing git repository...
    git init
)

echo Checking remote repository...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding remote repository...
    git remote add origin https://github.com/cj5427533/CultureMap.git
) else (
    echo Remote repository already exists. Updating...
    git remote set-url origin https://github.com/cj5427533/CultureMap.git
)

echo Adding files...
git add .

echo Checking for changes...
git diff --cached --quiet
if errorlevel 1 (
    echo Committing changes...
    git commit -m "Initial commit"
) else (
    echo No changes to commit.
)

echo Setting branch to main...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done!
pause

