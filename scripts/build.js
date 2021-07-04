#!/usr/bin/env node
const { build, scandir, watch, cliopts } = require("estrella");

// Build and minify our TypeScript files
build({
  entry: "base/GoldenSun.ts",
  outfile: "dist/bundle.js",
  target: ["es2017"],
  sourcemap: "inline",
  minify: true,
  bundle: true,
  tsc: true,
  external: ["dist/*", ".git", "code_docs", "scripts"],
});

// Watch our asset files for changes
const dir = "assets";
const filter = /\..*$/i;

scandir(dir, filter, { recursive: true }).then((files) => {
  cliopts.watch &&
    watch(dir, { filter, recursive: true }, (changes) => {
      changes.map((c) => console.log(`Reloading ${file} -> ${file}`));
    });
});

// Serve and reload our server
cliopts.watch &&
  require("serve-http").createServer({
    port: 9000,
    pubdir: require("path").join(__dirname, "../"),
  });
