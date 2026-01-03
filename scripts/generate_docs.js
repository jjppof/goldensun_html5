const { resolve } = require("path");
const { readdir } = require("fs").promises;
const { Application, TSConfigReader } = require("typedoc");

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return files.flat();
}

async function main() {
  const app = await Application.bootstrap({
    entryPoints: await getFiles("./base"),
    exclude: ["**/{types,dist,code_docs,node_modules,static,scripts}/**/*.*"],
    name: "GS-HTML5 API",
  });

  app.options.addReader(new TSConfigReader());

  const project = await app.convert();
  if (!project) {
    throw new Error("TypeDoc conversion failed");
  }

  await app.generateDocs(project, "code_docs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
