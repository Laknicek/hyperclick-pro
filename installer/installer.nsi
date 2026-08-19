; ==============================================================================
; HyperClick Pro 2026 - NSIS Custom Installer Script
; High-Tech Gaming & Ultra-Fast Automation Suite
; ==============================================================================

Unicode True

!define PRODUCT_NAME "HyperClick Pro"
!define PRODUCT_VERSION "1.2.0"
!define PRODUCT_PUBLISHER "HyperClick Engineering"
!define PRODUCT_WEB_SITE "https://github.com/Laknicek/hyperclick-pro"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\HyperClick Pro.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKCU"
!define MAIN_EXECUTABLE "HyperClick Pro.exe"

; Modern UI 2
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

; Installer General Settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\release\HyperClick-Pro-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\HyperClick Pro"
InstallDirRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel user
SetCompressor /SOLID lzma

; Custom Branding / Visuals
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH

; Welcome Page
!define MUI_WELCOMEPAGE_TITLE "Welcome to HyperClick Pro 2026 Setup"
!define MUI_WELCOMEPAGE_TEXT "HyperClick Pro delivers ultra-fast click automation, multi-point macro sequences, humanized anti-detection timing, and dynamic burst profiles.\r\n\r\nClick Next to configure your installation."
!insertmacro MUI_PAGE_WELCOME

; Directory Selection Page (Custom Directory Picker)
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose the folder in which to install HyperClick Pro 2026."
!insertmacro MUI_PAGE_DIRECTORY

; Components / Options Page (Desktop Shortcut, Start Menu, Startup)
!insertmacro MUI_PAGE_COMPONENTS

; Installation Progress Page
!insertmacro MUI_PAGE_INSTFILES

; Finish Page
!define MUI_FINISHPAGE_RUN "$INSTDIR\${MAIN_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch HyperClick Pro 2026 now"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Open Documentation & Shortcut Guide"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OpenDocLink
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_LANGUAGE "Spanish"

; ==============================================================================
; Component Sections
; ==============================================================================

Section "!HyperClick Pro Core (Required)" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"
  
  ; Copy build directory payload
  File /r "..\dist\*"
  File /r "..\dist-electron\*"
  File /r "..\public\*"
  File "..\package.json"
  
  ; Write Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Write Registry Keys
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\${MAIN_EXECUTABLE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${MAIN_EXECUTABLE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1
SectionEnd

Section "Desktop Shortcut" SecDesktop
  SetOutPath "$INSTDIR"
  CreateShortCut "$DESKTOP\HyperClick Pro.lnk" "$INSTDIR\${MAIN_EXECUTABLE}" "" "$INSTDIR\icon.ico" 0 SW_SHOWNORMAL "" "HyperClick Pro 2026 - Ultra-Fast Auto-Clicker"
SectionEnd

Section "Start Menu Shortcut" SecStartMenu
  SetOutPath "$INSTDIR"
  CreateDirectory "$SMPROGRAMS\HyperClick Pro"
  CreateShortCut "$SMPROGRAMS\HyperClick Pro\HyperClick Pro.lnk" "$INSTDIR\${MAIN_EXECUTABLE}" "" "$INSTDIR\icon.ico" 0 SW_SHOWNORMAL "" "HyperClick Pro 2026"
  CreateShortCut "$SMPROGRAMS\HyperClick Pro\Uninstall HyperClick Pro.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
SectionEnd

Section /o "Run on Windows Startup" SecStartup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "HyperClickPro" '"$INSTDIR\${MAIN_EXECUTABLE}" --minimized'
SectionEnd

; Component Descriptions
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} "Essential application binaries, modern electron UI, and automation drivers."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Places a quick access icon on your Windows Desktop."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} "Adds HyperClick Pro into your Windows Start Menu folder."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartup} "Automatically runs HyperClick Pro minimized to system tray on Windows startup."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Custom Helper Functions
Function OpenDocLink
  ExecShell "open" "${PRODUCT_WEB_SITE}"
FunctionEnd

; ==============================================================================
; Uninstaller Section
; ==============================================================================
Section "Uninstall"
  ; Terminate running instances
  nsExec::Exec 'taskkill /F /IM "${MAIN_EXECUTABLE}"'

  ; Remove shortcuts
  Delete "$DESKTOP\HyperClick Pro.lnk"
  Delete "$SMPROGRAMS\HyperClick Pro\HyperClick Pro.lnk"
  Delete "$SMPROGRAMS\HyperClick Pro\Uninstall HyperClick Pro.lnk"
  RMDir "$SMPROGRAMS\HyperClick Pro"

  ; Remove Registry Keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "HyperClickPro"

  ; Remove Application Files
  RMDir /r "$INSTDIR"
  SetAutoClose true
SectionEnd
