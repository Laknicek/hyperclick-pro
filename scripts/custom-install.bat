@echo off
setlocal EnableDelayedExpansion
title HyperClick Pro 2026 - Custom Installation Wizard
color 0B

:: ============================================================================
:: HyperClick Pro 2026 - Custom Windows Installation Wizard
:: ============================================================================

set "APP_NAME=HyperClick Pro"
set "APP_VERSION=1.0.0"
set "APP_EXE=HyperClick Pro.exe"
set "PUBLISHER=HyperClick Engineering"
set "REG_KEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\HyperClickPro"
set "DEFAULT_DIR=%LOCALAPPDATA%\Programs\HyperClick Pro"
set "DESKTOP_SHORTCUT=1"
set "STARTMENU_SHORTCUT=1"
set "AUTO_LAUNCH=1"
set "PORTABLE_MODE=0"
set "SILENT_MODE=0"

:: Parse command line arguments
:PARSE_ARGS
if "%~1"=="" goto ARGS_DONE
if /i "%~1"=="/SILENT" set "SILENT_MODE=1"
if /i "%~1"=="/S" set "SILENT_MODE=1"
if /i "%~1"=="/NO_DESKTOP" set "DESKTOP_SHORTCUT=0"
if /i "%~1"=="/NO_STARTMENU" set "STARTMENU_SHORTCUT=0"
if /i "%~1"=="/NO_LAUNCH" set "AUTO_LAUNCH=0"
if /i "%~1"=="/PORTABLE" set "PORTABLE_MODE=1"
if /i "%~1"=="/DIR" (
    shift
    set "DEFAULT_DIR=%~1"
)
shift
goto PARSE_ARGS
:ARGS_DONE

set "INSTALL_DIR=%DEFAULT_DIR%"

:: If silent mode, skip interactive UI
if "%SILENT_MODE%"=="1" goto DO_INSTALLATION

:: ============================================================================
:: Interactive Installer Banner & Menu
:: ============================================================================
:MAIN_MENU
cls
echo ===============================================================================
echo   _   _                     ____ _ _      _      ____            ____   ___ ____   __   
echo  ^| ^| ^| ^|_   _ _ __   ___ _ _/ ___^| ^(_^) ___^| ^| __ ^|  _ \ _ __ ___  ^|___ \ / _ \___ \ / /_  
echo  ^| ^|_^| ^| ^| ^| ^| '_ \ / _ \ '__^| ^|   ^| ^| ^|/ __^| ^|/ / ^| ^|_) ^| '__/ _ \   __) ^| ^| ^| ^|__) ^| '_ \ 
echo  ^|  _  ^| ^|_^| ^| ^|_) ^|  __/ ^|  ^| ^|___^| ^| ^| (__^|   ^<  ^|  __/^| ^| ^| ^(_) ^| / __/^| ^|_^| / __/^| ^(_) ^|
echo  ^|_^| ^|_^|\__, ^| .__/ \___^|_^|   \____^|_^|_^|\___^|_^|\_\ ^|_^|   ^|_^|  \___/ ^|_____^|\___/_____^|\___/ 
echo          ^|___/^|_^|                                                                   
echo ===============================================================================
echo                NEXT-GENERATION ULTRA-FAST AUTOMATION SUITE
echo ===============================================================================
echo.
echo  Target Install Directory:
echo  [%INSTALL_DIR%]
echo.
echo  Options:
echo    [1] Standard Installation (Recommended)
echo    [2] Browse / Choose Custom Installation Directory (GUI Picker)
echo    [3] Manually Type Target Directory Path
echo    [4] Portable / Standalone Extract (No Registry / No Shortcuts)
echo    [5] Customize Shortcuts & Launch Options
echo    [6] Exit Installer
echo.
echo ===============================================================================
set /p "CHOICE=Select an option [1-6] (Default: 1): "

if "%CHOICE%"=="" set "CHOICE=1"
if "%CHOICE%"=="1" goto DO_INSTALLATION
if "%CHOICE%"=="2" goto BROWSE_DIR
if "%CHOICE%"=="3" goto TYPE_DIR
if "%CHOICE%"=="4" goto SET_PORTABLE
if "%CHOICE%"=="5" goto CUSTOMIZE_OPTIONS
if "%CHOICE%"=="6" goto EXIT_INSTALLER

echo Invalid option selected.
timeout /t 2 >nul
goto MAIN_MENU

:: ============================================================================
:: PowerShell GUI Directory Picker Dialog
:: ============================================================================
:BROWSE_DIR
echo.
echo Opening folder selection dialog...
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Select HyperClick Pro Installation Folder'; $f.SelectedPath = [System.Environment]::ExpandEnvironmentVariables('%INSTALL_DIR%'); $f.ShowNewFolderButton = $true; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath } else { Write-Output '%INSTALL_DIR%' }"`) do (
    set "PICKED_DIR=%%I"
)

if not "%PICKED_DIR%"=="" (
    set "INSTALL_DIR=%PICKED_DIR%"
    echo Selected: %INSTALL_DIR%
)
timeout /t 1 >nul
goto MAIN_MENU

:: ============================================================================
:: Manual Path Typing
:: ============================================================================
:TYPE_DIR
echo.
echo Enter the full path for installation:
set /p "MANUAL_DIR=> "
if not "%MANUAL_DIR%"=="" (
    set "INSTALL_DIR=%MANUAL_DIR%"
)
goto MAIN_MENU

:: ============================================================================
:: Set Portable Mode
:: ============================================================================
:SET_PORTABLE
set "PORTABLE_MODE=1"
set "DESKTOP_SHORTCUT=0"
set "STARTMENU_SHORTCUT=0"
echo.
echo Portable mode enabled. Files will be extracted without registry shortcuts.
echo Default portable directory: %CD%\HyperClickPro_Portable
set "INSTALL_DIR=%CD%\HyperClickPro_Portable"
timeout /t 2 >nul
goto MAIN_MENU

:: ============================================================================
:: Customize Shortcuts & Options
:: ============================================================================
:CUSTOMIZE_OPTIONS
cls
echo ===============================================================================
echo                     CUSTOMIZE INSTALLATION SETTINGS
echo ===============================================================================
echo.
echo  [D] Desktop Shortcut      : [!DESKTOP_SHORTCUT!] (1 = Enabled, 0 = Disabled)
echo  [S] Start Menu Shortcut   : [!STARTMENU_SHORTCUT!] (1 = Enabled, 0 = Disabled)
echo  [L] Auto-Launch After Inst: [!AUTO_LAUNCH!] (1 = Enabled, 0 = Disabled)
echo  [B] Back to Main Menu
echo.
set /p "OPT_CHOICE=Select setting to toggle (D/S/L/B): "

if /i "%OPT_CHOICE%"=="D" (
    if "!DESKTOP_SHORTCUT!"=="1" (set "DESKTOP_SHORTCUT=0") else (set "DESKTOP_SHORTCUT=1")
    goto CUSTOMIZE_OPTIONS
)
if /i "%OPT_CHOICE%"=="S" (
    if "!STARTMENU_SHORTCUT!"=="1" (set "STARTMENU_SHORTCUT=0") else (set "STARTMENU_SHORTCUT=1")
    goto CUSTOMIZE_OPTIONS
)
if /i "%OPT_CHOICE%"=="L" (
    if "!AUTO_LAUNCH!"=="1" (set "AUTO_LAUNCH=0") else (set "AUTO_LAUNCH=1")
    goto CUSTOMIZE_OPTIONS
)
if /i "%OPT_CHOICE%"=="B" goto MAIN_MENU
goto CUSTOMIZE_OPTIONS

:: ============================================================================
:: Execute Installation
:: ============================================================================
:DO_INSTALLATION
cls
echo ===============================================================================
echo                    INSTALLING HYPERCLICK PRO 2026
echo ===============================================================================
echo.
echo  Target Path: "%INSTALL_DIR%"
echo.

:: 1. Detect Source Directory
set "SOURCE_DIR="
if exist "%~dp0..\release\win-unpacked" set "SOURCE_DIR=%~dp0..\release\win-unpacked"
if not defined SOURCE_DIR if exist "%~dp0win-unpacked" set "SOURCE_DIR=%~dp0win-unpacked"
if not defined SOURCE_DIR if exist "%~dp0..\dist" set "SOURCE_DIR=%~dp0.."
if not defined SOURCE_DIR set "SOURCE_DIR=%~dp0.."

echo [*] Source Directory: "%SOURCE_DIR%"

:: 2. Create Target Directory
echo [*] Creating target directory...
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%" 2>nul
    if errorlevel 1 (
        echo [ERROR] Failed to create "%INSTALL_DIR%". Please run as Administrator if installing to Program Files.
        pause
        exit /b 1
    )
)

:: 3. Copy Application Files
echo [*] Copying core binaries and resources...
if exist "%SOURCE_DIR%\HyperClick Pro.exe" (
    robocopy "%SOURCE_DIR%" "%INSTALL_DIR%" /E /IS /IT /NP /NC /NS /NJS /NJH /NFL /NDL >nul
) else if exist "%SOURCE_DIR%\release\win-unpacked" (
    robocopy "%SOURCE_DIR%\release\win-unpacked" "%INSTALL_DIR%" /E /IS /IT /NP /NC /NS /NJS /NJH /NFL /NDL >nul
) else (
    echo [i] Syncing workspace build output files...
    if exist "%SOURCE_DIR%\dist" robocopy "%SOURCE_DIR%\dist" "%INSTALL_DIR%\dist" /E /NP /NJS /NJH >nul
    if exist "%SOURCE_DIR%\dist-electron" robocopy "%SOURCE_DIR%\dist-electron" "%INSTALL_DIR%\dist-electron" /E /NP /NJS /NJH >nul
    if exist "%SOURCE_DIR%\public" robocopy "%SOURCE_DIR%\public" "%INSTALL_DIR%\public" /E /NP /NJS /NJH >nul
    if exist "%SOURCE_DIR%\package.json" copy /Y "%SOURCE_DIR%\package.json" "%INSTALL_DIR%\" >nul
)

:: Copy uninstaller and icon into install folder
if exist "%~dp0custom-uninstall.bat" copy /Y "%~dp0custom-uninstall.bat" "%INSTALL_DIR%\uninstall.bat" >nul
if exist "%SOURCE_DIR%\public\icon.ico" copy /Y "%SOURCE_DIR%\public\icon.ico" "%INSTALL_DIR%\icon.ico" >nul

echo [OK] Files installed successfully.

:: 4. Create Shortcuts (Unless Portable Mode)
if "%PORTABLE_MODE%"=="0" (
    if "%DESKTOP_SHORTCUT%"=="1" (
        echo [*] Creating Desktop Shortcut...
        powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'HyperClick Pro.lnk')); $s.TargetPath = [System.IO.Path]::Combine('%INSTALL_DIR%', 'HyperClick Pro.exe'); if (!(Test-Path $s.TargetPath)) { $s.TargetPath = [System.IO.Path]::Combine('%INSTALL_DIR%', 'node_modules', '.bin', 'electron.cmd'); $s.Arguments = '.' }; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'HyperClick Pro - Ultra-Fast 2026 Auto-Clicker & Automation Suite'; if (Test-Path '%INSTALL_DIR%\icon.ico') { $s.IconLocation = '%INSTALL_DIR%\icon.ico,0' }; $s.Save()" >nul 2>&1
        echo [OK] Desktop Shortcut created.
    )

    if "%STARTMENU_SHORTCUT%"=="1" (
        echo [*] Creating Start Menu Shortcut...
        set "SM_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\HyperClick Pro"
        if not exist "!SM_FOLDER!" mkdir "!SM_FOLDER!" >nul 2>&1
        powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Programs'), 'HyperClick Pro', 'HyperClick Pro.lnk')); $s.TargetPath = [System.IO.Path]::Combine('%INSTALL_DIR%', 'HyperClick Pro.exe'); if (!(Test-Path $s.TargetPath)) { $s.TargetPath = [System.IO.Path]::Combine('%INSTALL_DIR%', 'node_modules', '.bin', 'electron.cmd'); $s.Arguments = '.' }; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'HyperClick Pro - Next-Gen Auto Clicker'; if (Test-Path '%INSTALL_DIR%\icon.ico') { $s.IconLocation = '%INSTALL_DIR%\icon.ico,0' }; $s.Save()" >nul 2>&1
        echo [OK] Start Menu Shortcut created.
    )

    :: 5. Register in Windows Add/Remove Programs
    echo [*] Registering in Windows Add/Remove Programs...
    reg add "%REG_KEY%" /v "DisplayName" /t REG_SZ /d "%APP_NAME%" /f >nul 2>&1
    reg add "%REG_KEY%" /v "DisplayVersion" /t REG_SZ /d "%APP_VERSION%" /f >nul 2>&1
    reg add "%REG_KEY%" /v "Publisher" /t REG_SZ /d "%PUBLISHER%" /f >nul 2>&1
    reg add "%REG_KEY%" /v "InstallLocation" /t REG_SZ /d "%INSTALL_DIR%" /f >nul 2>&1
    reg add "%REG_KEY%" /v "DisplayIcon" /t REG_SZ /d "%INSTALL_DIR%\icon.ico" /f >nul 2>&1
    reg add "%REG_KEY%" /v "UninstallString" /t REG_SZ /d "\"%INSTALL_DIR%\uninstall.bat\"" /f >nul 2>&1
    reg add "%REG_KEY%" /v "QuietUninstallString" /t REG_SZ /d "\"%INSTALL_DIR%\uninstall.bat\" /SILENT" /f >nul 2>&1
    reg add "%REG_KEY%" /v "URLInfoAbout" /t REG_SZ /d "https://github.com/Laknicek/hyperclick-pro" /f >nul 2>&1
    reg add "%REG_KEY%" /v "NoModify" /t REG_DWORD /d 1 /f >nul 2>&1
    reg add "%REG_KEY%" /v "NoRepair" /t REG_DWORD /d 1 /f >nul 2>&1
    echo [OK] Registered in Windows Registry.
)

echo.
echo ===============================================================================
echo          🎉 HYPERCLICK PRO 2026 HAS BEEN INSTALLED SUCCESSFULLY!
echo ===============================================================================
echo.
echo  Installation Path : %INSTALL_DIR%
echo  Version           : %APP_VERSION%
echo.

:: 6. Launch Application
if "%AUTO_LAUNCH%"=="1" (
    echo [*] Launching HyperClick Pro...
    if exist "%INSTALL_DIR%\HyperClick Pro.exe" (
        start "" "%INSTALL_DIR%\HyperClick Pro.exe"
    ) else (
        echo [i] Build mode active - ready to run via npm start / electron.
    )
)

if "%SILENT_MODE%"=="0" (
    echo Press any key to finish installation...
    pause >nul
)

:EXIT_INSTALLER
exit /b 0
