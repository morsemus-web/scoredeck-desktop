; Custom NSIS page for the assisted installer.
;
; electron-builder can create a desktop shortcut unconditionally, but it has no
; built-in way to *ask*. This adds a page after the install-location step with
; two checkboxes, and honours them in customInstall.
;
; Wired up via build.nsis.include in package.json. Requires
; createDesktopShortcut:false there, otherwise the shortcut is made regardless
; and the checkbox is a lie.

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!macro customPageAfterChangeDir
  Page custom sdOptionsPage sdOptionsPageLeave
!macroend

; electron-builder compiles this same file again for the uninstaller, where the
; custom page is never inserted. NSIS then warns that the functions and their
; variables are unreferenced, and it builds with warnings-as-errors — so the
; whole installer-only block is skipped on that pass.
!ifndef BUILD_UNINSTALLER

Var Dialog
Var DesktopCheckbox
Var StartupCheckbox
Var CreateDesktopIcon
Var RunAtStartup

Function sdOptionsPage
  ; No MUI_HEADER_TEXT here: this file is included before MUI2.nsh, so that
  ; macro isn't defined yet and referencing it aborts the whole build.
  nsDialogs::Create 1018
  Pop $Dialog
  ${If} $Dialog == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 24u "ScoreDeck runs as a small always-on-top scoreboard with a tray icon."
  Pop $0

  ${NSD_CreateCheckbox} 0 34u 100% 12u "Create a desktop shortcut"
  Pop $DesktopCheckbox
  ${NSD_Check} $DesktopCheckbox

  ${NSD_CreateCheckbox} 0 52u 100% 12u "Start ScoreDeck when Windows starts"
  Pop $StartupCheckbox
  ${NSD_Check} $StartupCheckbox

  ${NSD_CreateLabel} 0 74u 100% 20u "You can change both of these later from the tray icon."
  Pop $0

  nsDialogs::Show
FunctionEnd

Function sdOptionsPageLeave
  ${NSD_GetState} $DesktopCheckbox $CreateDesktopIcon
  ${NSD_GetState} $StartupCheckbox $RunAtStartup
FunctionEnd

!endif

!macro customInstall
  ${If} $CreateDesktopIcon == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\${SHORTCUT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ${EndIf}

  ${If} $RunAtStartup == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ScoreDeck" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ScoreDeck"
  ${EndIf}
!macroend

!macro customUnInstall
  Delete "$DESKTOP\${SHORTCUT_NAME}.lnk"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ScoreDeck"
!macroend
