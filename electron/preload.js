const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
contextBridge.exposeInMainWorld("is_electron_env", true);