Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\asd04\Desktop\timer"
WshShell.Run "cmd /c npm start", 0, False
