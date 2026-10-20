import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

// Reuse the production bundle so the downloadable app follows the same tested code.
let html = readFileSync("dist/index.html", "utf8");
const moduleTag = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const styleTag = html.match(
  /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/,
);
if (!moduleTag || !styleTag)
  throw Error("Não foi possível localizar os arquivos do build.");
const js = readFileSync("dist/assets/" + basename(moduleTag[1]), "utf8");
const css = readFileSync("dist/assets/" + basename(styleTag[1]), "utf8");
const svg = readFileSync("public/icon.svg").toString("base64");
const png = readFileSync("public/icon-192.png").toString("base64");
html = html
  .replace('<html lang="pt-BR">', '<html lang="pt-BR" data-portable="true">')
  .replace(
    moduleTag[0],
    () =>
      '<script type="module">' +
      js.replace(/<\/script/gi, "<\\/script") +
      "</script>",
  )
  .replace(styleTag[0], () => "<style>" + css + "</style>")
  .replace(/<link[^>]+rel="manifest"[^>]*>/, "")
  .replace(
    /(<link[^>]+rel="icon"[^>]+href=")[^"]+/,
    (_, prefix) => prefix + "data:image/svg+xml;base64," + svg,
  )
  .replace(
    /(<link[^>]+rel="apple-touch-icon"[^>]+href=")[^"]+/,
    (_, prefix) => prefix + "data:image/png;base64," + png,
  );
writeFileSync("dist/MiBody.html", html);
if (process.argv.includes("--export")) writeFileSync("MiBody.html", html);
console.log("Versão autocontida gerada: dist/MiBody.html");
