const packager = require('electron-packager');
const {spawnSync} = require("child_process");

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

const version = spawnSync('git log --format="%H" -n 1', {shell: true}).stdout.toString().trim();
const today = new Date(Date.now()).toLocaleString();
spawnSync(`echo ${today} : ${version} > dist/${packagerOptions.name}-${packagerOptions.platform}-${packagerOptions.arch}/gshtml5.version`, {shell: true});
