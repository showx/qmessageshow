// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('myAPI', {
  invokeMethod: () => ipcRenderer.invoke('invoke-method'),
  invokeMethod2: () => ipcRenderer.invoke('invoke-method2')
});
