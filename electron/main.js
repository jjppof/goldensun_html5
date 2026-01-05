const path = require('path');
const fs = require('fs');
const url = require('url');
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');

const code_mirror_editor_battle_anim_width = 350;

function createWindow() {
    const is_dev_env = process.argv[2] !== undefined && process.argv[2] == "dev";
    const win = new BrowserWindow({
        width: 240,
        height: 160,
        resizable: is_dev_env ? true : false,
        center: true,
        useContentSize: true,
        autoHideMenuBar: true,
        maximizable: false,
        backgroundColor: '#000000',
        title: "Golden Sun Engine - HTML5",
        icon: path.join(__dirname, "../static/favicon.ico"),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webgl: true,
            webgl2: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            experimentalFeatures: true,
            spellcheck: false,  //not available in electron 4
            devTools: is_dev_env ? true : false,
            backgroundThrottling: false,
            offscreen: false,
            contextIsolation: true,
            sandbox: false,
            disableDialogs: true, //not available in electron 4
            autoplayPolicy: "no-user-gesture-required", //not available in electron 4
            enableWebSQL: false //not available in electron 4
        }
    });

    win.once('ready-to-show', () => win.show());
    win.loadURL(url.format({
        pathname: path.join(__dirname, '../index-electron.html'),
        protocol: 'file:',
        slashes: true
    }));
}

app.commandLine.appendSwitch('max-gpu-frame-rate', '60');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('enable-features',
    'CanvasOopRasterization,UseSkiaRenderer,VaapiVideoDecoder'
);
if (process.platform === 'win32') {
    app.commandLine.appendSwitch('force_high_performance_gpu');
}
app.commandLine.appendSwitch('disable-features', [
    'MediaRouter',
    'Translate',
    'SpellChecker',
    'Autofill',
    'OptimizationHints',
    'BackForwardCache'
].join(','));

function initializeLogger() {
    const log_dir = path.join(__dirname, '../logs');
    if (!fs.existsSync(log_dir)){
        fs.mkdirSync(log_dir);
    }
    const log_filename = `gshtml5.${Date.now()}.log`;
    const log_full_path = path.join(log_dir, log_filename);
    const log_stream = fs.createWriteStream(log_full_path, {flags: 'a'});
    const writeLine = msg => log_stream.write(msg + "\n");
    try {
        const version_info = fs.readFileSync('gshtml5.version', 'utf8');
        writeLine(`VERSION: ${version_info.toString()}`);
    } catch(e) {
        writeLine("Could not get GSHTML5 version.");
    }
    ipcMain.on('register-log', (event, msg) => {
        writeLine(msg);
    });
}

app.whenReady().then(() => {
    createWindow();
    initializeLogger();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('resize-window', (event, width, height, battle_anim_tester) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.setContentSize(battle_anim_tester ? width + code_mirror_editor_battle_anim_width : width, height);
});