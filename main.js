const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 420,
    height: 600,
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
