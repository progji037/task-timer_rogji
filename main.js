const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// データの保存先（UserData）を以前の開発環境（task-timer）に固定し、記録を引き継げるようにする
app.setPath('userData', path.join(app.getPath('appData'), 'task-timer'));

let win;
function createWindow () {
  win = new BrowserWindow({
    width: 380,
    height: 650,
    autoHideMenuBar: true, // メニューバーを隠してすっきりさせる
    alwaysOnTop: true, // 常に最前面に表示する
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false // 最小化してもタイマーが進むようにする
    }
  });

  // index.htmlを読み込む
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Windowsのタスクバーにピン留め可能にするためのAppUserModelId設定
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.user.tasktimer');
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

 app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

