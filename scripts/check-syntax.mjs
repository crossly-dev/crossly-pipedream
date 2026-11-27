// `node --check` every .mjs file (syntax only, no execution).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const roots = ["components", "scripts", "test"];
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p); } else if (/\.m?js$/.test(e.name)) files.push(p);
  }
};
roots.filter((r) => fs.existsSync(r)).forEach(walk);
for (const f of files) execFileSync(process.execPath, ["--check", f], { stdio: "inherit" });
console.log(`syntax ok: ${files.length} files`);
