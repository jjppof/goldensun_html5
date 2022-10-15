const packager = require('electron-packager');

const packagerOptions = {
    dir: '.',
    out: 'deploy',
    arch: 'x64',
    icon: 'static/favicon.ico',
    name: 'gshtml5',
    executableName: 'gshtml5',
    platform: 'win32',
    overwrite: true,
    ignore: '^\/(?!(dist|package\.json|assets|electron|static|index-electron\.html))'
};

packager(packagerOptions);