const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
contextBridge.exposeInMainWorld("is_electron_env", true);

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".electron-remove").forEach(elem => {
        elem.remove();
    });
    document.body.classList.add("electron");
})