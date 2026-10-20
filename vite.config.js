import { defineConfig } from "vite";
import { writeFileSync, readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const base = process.env.MIBODY_BASE || "/";
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) {
  throw new Error("MIBODY_BASE deve ser um caminho como / ou /MiBody/.");
}
export default defineConfig({
  base,
  plugins: [
    {
      name: "mibody-offline",
      closeBundle() {
        const assets = readdirSync("dist/assets").map((f) => "assets/" + f);
        const localFiles = [
          "index.html",
          "manifest.webmanifest",
          "icon.svg",
          "icon-192.png",
          "icon-512.png",
          ...assets,
        ];
        const files = [base, ...localFiles.map((f) => base + f)];
        const hash = createHash("sha256").update(base);
        localFiles.forEach((f) => hash.update(readFileSync("dist/" + f)));
        const version = hash.digest("hex").slice(0, 12);
        const prefix =
          "mibody-" +
          createHash("sha256").update(base).digest("hex").slice(0, 6) +
          "-";
        writeFileSync(
          "dist/sw.js",
          `const PREFIX=${JSON.stringify(prefix)};const CACHE=PREFIX+'${version}';const BASE=${JSON.stringify(base)};const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(BASE))return;event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request,{ignoreVary:true});if(hit)return hit;try{return await fetch(event.request);}catch(e){if(event.request.mode==='navigate')return cache.match(BASE+'index.html');throw e;}}));});`,
        );
      },
    },
  ],
});
