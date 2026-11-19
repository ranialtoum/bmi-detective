import { build } from "esbuild";
import fs from "fs";
const r = await build({ entryPoints: ["src/App.jsx"], bundle: true, minify: true, write: false, format: "iife", target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' }, jsx: "automatic", loader: { ".js": "jsx" } });
const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = fs.readFileSync("src/styles.css", "utf8");
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BMI Detective: Beyond the Number</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Noto+Naskh+Arabic:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>${css}</style>
<script>new MutationObserver(()=>{for(const c of document.querySelectorAll('.stack td:not([data-l])')){let i=0,p=c;while(p=p.previousElementSibling)i+=p.colSpan;c.dataset.l=c.closest('table').rows[0].cells[i]?.textContent||''}}).observe(document,{childList:true,subtree:true})</script>
</head><body><div id="root"></div><script>${js}</script></body></html>`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.html", html);
console.log("ok", (html.length / 1024).toFixed(0) + " KB");
