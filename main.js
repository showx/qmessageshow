/**
 * 腾讯消息通知
 */
const { app, BrowserWindow,ipcMain } = require('electron');
const { switchAccountAndLogin,loginToTencentCloud } = require('./module')
const path = require('path');
// console.log(app);
// return;
function createWindow() {
    // 创建浏览器窗口
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 你可以在这里添加预加载脚本
        },
    });

    // 加载 index.html 文件
    mainWindow.loadFile('index.html');

    // 打开开发者工具（可选）
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
  
    app.on('activate', () => {
        // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，重新创建窗口
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 当所有窗口都关闭时退出应用程序
app.on('window-all-closed', () => {
    // 在 macOS 上，通常用户在关闭窗口后应用程序仍会保持激活状态
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('invoke-method', () => {
    loginToTencentCloud();
});


ipcMain.handle('invoke-method2', () => {
    switchAccountAndLogin();
});