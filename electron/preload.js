const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    log: (msg) => ipcRenderer.send('register-log', msg),
    resize_window: (width, height, battle_anim_tester) =>
        ipcRenderer.send('resize-window', width, height, battle_anim_tester)
});