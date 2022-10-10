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
        resizable: false,
        center: true,
        useContentSize: true,
        autoHideMenuBar: true,
        maximizable: false,
        title: "Golden Sun Engine - HTML5",
        icon: path.join(__dirname, "../static/favicon.ico"),
        webPreferences: {
            experimentalFeatures: true,
            // spellcheck: false,  //not available in electron 4
            devTools: false,
            backgroundThrottling: false,
            contextIsolation: false,
            // disableDialogs: true, //not available in electron 4
            // autoplayPolicy: "no-user-gesture-required", //not available in electron 4
            // enableWebSQL: false //not available in electron 4
        }
    });

    win.loadFile('../index-electron.html');
}
app.commandLine.appendSwitch('limit-fps', '60');
app.commandLine.appendSwitch('disable-gpu-vsync');
// app.commandLine.appendSwitch('show-fps-counter');
app.commandLine.appendSwitch('force_high_performance_gpu');

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