import esbuildServe from "esbuild-serve";

esbuildServe(
  {
    entryPoints: ["./base/GoldenSun.ts"],
    bundle: true,
    minify: true,
    sourcemap: "inline",
    target: ["es2017"],
    outfile: "dist/bundle.js",
    external: ["dist/*", ".git", "code_docs", "scripts"]
  },
  {
    port: 9000,
    root: ".",
  }
);
