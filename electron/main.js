const path = require('path');
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 480,
        height: 320,
        // resizable: false,
        center: true,
        useContentSize: true,
        autoHideMenuBar: true,
        maximizable: false,
        title: "Golden Sun Engine - HTML5",
        icon: path.join(__dirname, "../static/favicon.ico"),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            experimentalFeatures: true,
            spellcheck: false,
        }
    });

    win.loadFile('../index.html');
}

app.commandLine.appendSwitch(
    // would be nice if we could limit fps to 60.
    // "--disable-frame-rate-limit",
    // "--disable-gpu-vsync",
    // "--max-gum-fps=\"60\"",
    "--force_high_performance_gpu",
);

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('resize-window', (event, width, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.setContentSize(width, height);
});