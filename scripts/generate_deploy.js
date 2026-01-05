const packager = require('electron-packager');
const {spawnSync} = require("child_process");
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

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

const promise = packager(packagerOptions);

promise.then(() => {
    const version = spawnSync('git log --format="%H" -n 1', {shell: true}).stdout.toString().trim();
    const today = new Date(Date.now()).toLocaleString();
    const base_path = `${packagerOptions.out}/${packagerOptions.name}-${packagerOptions.platform}-${packagerOptions.arch}`;

    const version_file_path = path.join(base_path, "gshtml5.version");
    spawnSync(`echo ${today} : ${version} > ${version_file_path}`, {shell: true});

    const locales_dir = path.join(base_path, 'locales');
    fs.readdirSync(locales_dir).forEach(file => {
        if (file !== 'en-US.pak') {
            try { fs.unlinkSync(path.join(locales_dir, file));  } catch (e) {}
        }
    });

    try { fs.unlinkSync(path.join(base_path, "LICENSES.chromium.html")); } catch (e) {}

    try {
        const output = fs.createWriteStream(`${base_path}.zip`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);
        archive.directory(base_path, false);
        archive.finalize();
    } catch (e) {
        console.error(e);
    }
});
