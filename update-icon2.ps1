$ErrorActionPreference = "Stop"
Copy-Item 'C:\Users\asd04\.gemini\antigravity\brain\410cbf28-efc9-4d43-9c79-cae12f7c3bac\simple_timer_icon_1773454330135.png' 'C:\Users\asd04\Desktop\timer\icon.png'

node -e "const fs=require('fs'),p=require('png2icons'); fs.writeFileSync('icon.ico', p.createICO(fs.readFileSync('icon.png'), p.BICUBIC2, 0, false, true))"

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('C:\Users\asd04\Desktop\timer\Task Timer.lnk')
$Shortcut.IconLocation = 'C:\Users\asd04\Desktop\timer\icon.ico'
$Shortcut.Save()
