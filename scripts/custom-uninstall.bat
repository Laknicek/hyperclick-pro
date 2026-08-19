@echo off
setlocal EnableDelayedExpansion
title HyperClick Pro 2026 - Uninstaller
color 0C

:: ============================================================================
:: HyperClick Pro 2026 - Clean Windows Uninstaller
:: ============================================================================

set "APP_NAME=HyperClick Pro"
set "REG_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HyperClickPro"
set "SILENT_MODE=0"
set "KEEP_DATA=0"

:: Parse arguments
:PARSE_ARGS
if "%~1"=="" goto ARGS_DONE
if /i "%~1"=="/SILENT" (
    set "SILENT_MODE=1"
    shift
    goto PARSE_ARGS
)
if /i "%~1"=="/S" (
    set "SILENT_MODE=1"
    shift
    goto PARSE_ARGS
)
if /i "%~1"=="/KEEP_DATA" (
    set "KEEP_DATA=1"
    shift
    goto PARSE_ARGS
)
shift
goto PARSE_ARGS
:ARGS_DONE

:: Determine Install Directory (either from current script location or registry)
set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

:: Check registry for install directory if needed
for /f "tokens=1,2* delims=	 " %%A in ('reg query "%REG_KEY%" /v "InstallLocation" 2^>nul') do (
    if /i "%%A"=="InstallLocation" (
        set "INSTALL_DIR=%%C"
    )
)

if "%SILENT_MODE%"=="1" goto DO_UNINSTALL

:: ============================================================================
:: Interactive Confirmation
:: ============================================================================
cls
echo ===============================================================================
echo   _   _                     ____ _ _      _      ____            ____   ___ ____   __   
echo  ^| ^| ^| ^|_   _ _ __   ___ _ _/ ___^| ^(_^) ___^| ^| __ ^|  _ \ _ __ ___  ^|___ \ / _ \___ \ / /_  
echo  ^| ^|_^| ^| ^| ^| ^| '_ \ / _ \ '__^| ^|   ^| ^| ^|/ __^| ^|/ / ^| ^|_) ^| '__/ _ \   __) ^| ^| ^| ^|__) ^| '_ \ 
echo  ^|  _  ^| ^|_^| ^| ^|_) ^|  __/ ^|  ^| ^|___^| ^| ^| (__^|   ^<  ^|  __/^| ^| ^| ^(_) ^| / __/^| ^|_^| / __/^| ^(_) ^|
echo  ^|_^| ^|_^|\__, ^| .__/ \___^|_^|   \____^|_^|_^|\___^|_^|\_\ ^|_^|   ^|_^|  \___/ ^|_____^|\___/_____^|\___/ 
echo          ^|___/^|_^|                                                                   
echo ===============================================================================
echo                           UNINSTALLATION WIZARD
echo ===============================================================================
echo.
echo  Target to Remove: "%INSTALL_DIR%"
echo.
echo  WARNING: This will remove HyperClick Pro, its shortcuts, and registry entries.
echo.
set /p "CONFIRM=Are you sure you want to uninstall HyperClick Pro? (Y/N) [Default: N]: "
if /i not "%CONFIRM%"=="Y" (
    echo Uninstallation cancelled.
    timeout /t 2 >nul
    exit /b 0
)

echo.
set /p "CLEAN_CONFIG=Do you also want to remove saved click profiles and user configuration? (Y/N) [Default: N]: "
if /i "%CLEAN_CONFIG%"=="Y" (
    set "KEEP_DATA=0"
) else (
    set "KEEP_DATA=1"
)

:: ============================================================================
:: Execute Uninstallation
:: ============================================================================
:DO_UNINSTALL
if "%SILENT_MODE%"=="0" cls
echo ===============================================================================
echo                    REMOVING HYPERCLICK PRO 2026
echo ===============================================================================
echo.

:: 1. Terminate running instances
echo [*] Terminating running instances of HyperClick Pro...
taskkill /F /IM "HyperClick Pro.exe" >nul 2>&1
taskkill /F /IM "hyperclick.exe" >nul 2>&1

:: 2. Remove Desktop Shortcuts
echo [*] Removing Desktop shortcuts...
if exist "%USERPROFILE%\Desktop\HyperClick Pro.lnk" del /F /Q "%USERPROFILE%\Desktop\HyperClick Pro.lnk" >nul 2>&1
if exist "C:\Users\Public\Desktop\HyperClick Pro.lnk" del /F /Q "C:\Users\Public\Desktop\HyperClick Pro.lnk" >nul 2>&1

:: 3. Remove Start Menu Folder
echo [*] Removing Start Menu shortcuts...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HyperClick Pro" (
    rd /S /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\HyperClick Pro" >nul 2>&1
)
if exist "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\HyperClick Pro" (
    rd /S /Q "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\HyperClick Pro" >nul 2>&1
)

:: 4. Remove Windows Registry Keys
echo [*] Removing Windows Registry entries...
reg delete "%REG_KEY%" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\HyperClickPro" /f >nul 2>&1
reg delete "HKCU\Software\HyperClick Pro" /f >nul 2>&1
reg delete "HKCU\Software\Classes\hyperclick" /f >nul 2>&1

:: 5. Clean AppData user settings if requested
if "%KEEP_DATA%"=="0" (
    echo [*] Cleaning user settings ^& profile configs...
    if exist "%APPDATA%\hyperclick-pro" rd /S /Q "%APPDATA%\hyperclick-pro" >nul 2>&1
    if exist "%LOCALAPPDATA%\hyperclick-pro-updater" rd /S /Q "%LOCALAPPDATA%\hyperclick-pro-updater" >nul 2>&1
)

:: 6. Remove Installation Directory
echo [*] Deleting installed files...
if exist "%INSTALL_DIR%" (
    start "" /b cmd /c "ping 127.0.0.1 -n 2 >nul & rd /s /q \"%INSTALL_DIR%\" 2>nul"
)

echo.
echo ===============================================================================
echo          ✅ HYPERCLICK PRO 2026 HAS BEEN SUCCESSFULLY UNINSTALLED
echo ===============================================================================
echo.

if "%SILENT_MODE%"=="0" (
    echo Press any key to exit...
    pause >nul
)

exit /b 0
