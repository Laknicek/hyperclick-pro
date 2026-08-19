; ==============================================================================
; HyperClick Pro 2026 - Electron Builder NSIS Include Hook
; ==============================================================================

!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "HyperClick Pro 2026 Setup"
  !define MUI_WELCOMEPAGE_TEXT "Welcome to the HyperClick Pro 2026 setup wizard.$\r$\n$\r$\nExperience next-generation ultra-fast click automation, multi-point macro sequences, humanized anti-detection timing, and burst mode.$\r$\n$\r$\nClick Next to continue."
  !define MUI_FINISHPAGE_RUN "$INSTDIR\HyperClick Pro.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch HyperClick Pro 2026"
!macroend

!macro customInit
  ; Terminate any existing running instance before update or install
  nsExec::Exec 'taskkill /F /IM "HyperClick Pro.exe"'
!macroend

!macro customInstall
  ; Register URL Protocol Handler (hyperclick://)
  WriteRegStr HKCU "Software\Classes\hyperclick" "" "URL:HyperClick Pro Protocol"
  WriteRegStr HKCU "Software\Classes\hyperclick" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\hyperclick\DefaultIcon" "" "$INSTDIR\HyperClick Pro.exe,0"
  WriteRegStr HKCU "Software\Classes\hyperclick\shell\open\command" "" '"$INSTDIR\HyperClick Pro.exe" "%1"'

  ; Copy custom uninstaller script to installation folder for offline manual maintenance
  CopyFiles /SILENT "$EXEDIR\custom-uninstall.bat" "$INSTDIR\custom-uninstall.bat"
  CopyFiles /SILENT "$EXEDIR\custom-install.bat" "$INSTDIR\custom-install.bat"
!macroend

!macro customUnInstall
  ; Terminate running instances
  nsExec::Exec 'taskkill /F /IM "HyperClick Pro.exe"'
  
  ; Remove URL Protocol Handler
  DeleteRegKey HKCU "Software\Classes\hyperclick"
  
  ; Clean Registry traces
  DeleteRegKey HKCU "Software\HyperClick Pro"
!macroend
