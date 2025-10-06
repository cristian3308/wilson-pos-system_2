' Script VBS para iniciar el servidor sin mostrar ventanas
' Este archivo se ejecuta automáticamente al iniciar Windows

Set WshShell = CreateObject("WScript.Shell")

' Obtener la ruta del directorio donde está este script
ScriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Cambiar al directorio del proyecto
WshShell.CurrentDirectory = ScriptPath

' Iniciar Backend en modo oculto (sin ventana visible)
WshShell.Run "cmd /c cd /d """ & ScriptPath & "\backend"" && npm run dev", 0, False

' Esperar 3 segundos antes de iniciar el Frontend
WScript.Sleep 3000

' Iniciar Frontend en modo oculto (sin ventana visible)
WshShell.Run "cmd /c cd /d """ & ScriptPath & "\frontend"" && npm run dev", 0, False

' Liberar objetos
Set WshShell = Nothing
