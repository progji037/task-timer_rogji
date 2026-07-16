const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.setPath('userData', path.join(app.getPath('appData'), 'task-timer'));

app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  win.loadURL('file://' + path.join(__dirname, 'index.html'));
  win.webContents.executeJavaScript(localStorage.getItem("timerRecords")).then(data => {
    fs.writeFileSync('C:/Users/asd04/Desktop/timer/test-task-timer.json', data || 'empty');
    app.quit();
  }).catch(e => {
    fs.writeFileSync('C:/Users/asd04/Desktop/timer/test-task-timer.json', e.toString());
    app.quit();
  });
});
