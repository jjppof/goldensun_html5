const { resolve } = require('path');
const { readdir } = require('fs').promises;
const TypeDoc = require("typedoc");

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

async function main() {
  const app = new TypeDoc.Application();

  app.options.addReader(new TypeDoc.TSConfigReader());

  app.bootstrap({
    entryPoints: await getFiles("./base"),
    exclude: ["**/{types,dist,code_docs,node_modules,static,scripts}/**/*.*"],
    name: "GS-HTML5 API"
  });

  const project = app.convert();

  if (project) {
    await app.generateDocs(project, "code_docs");
  }
}

main().catch(console.error);