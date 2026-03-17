@echo off
echo Cleaning previous build artifacts...
if exist "android\app\src\main\assets\public" (
    echo Renaming locked public folder...
    ren "android\app\src\main\assets\public" "public_old_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%" 2>nul
)
if exist "android\capacitor-cordova-android-plugins" (
    echo Renaming locked capacitor plugins folder...
    ren "android\capacitor-cordova-android-plugins" "capacitor-cordova-android-plugins_old_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%" 2>nul
)

echo Building Web Assets...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
echo Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 exit /b %errorlevel%
echo Building APK...
cd android
call gradlew.bat assembleDebug
cd ..
echo.
echo APK Built successfully!
echo Location: android\app\build\outputs\apk\debug\app-debug.apk
pause