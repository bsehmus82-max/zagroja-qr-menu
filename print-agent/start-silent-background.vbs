Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "python """ & Replace(WScript.ScriptFullName, "start-silent-background.vbs", "restiva-print-bridge.py") & """", 0, False
