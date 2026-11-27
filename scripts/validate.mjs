// Imports every component and asserts the Pipedream registry shape rules.
import fs from "node:fs";
import path from "node:path";
import {
  pathToFileURL, fileURLToPath,
} from "node:url";
import { OPERATION_MAP } from "./operation-map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "components/crossly");
const errors = [];
const fail = (msg) => errors.push(msg);
const SEMVER = /^\d+\.\d+\.\d+$/;

const app = (await import(pathToFileURL(path.join(appDir, "crossly.app.mjs")))).default;
if (app.type !== "app") fail("app: type must be \"app\"");
if (app.app !== "crossly") fail("app: app must be \"crossly\"");
for (const [
  name,
  def,
] of Object.entries(app.propDefinitions || {})) {
  if (!def.type || !def.label) fail(`app.propDefinitions.${name}: type and label required`);
}

const ops = JSON.parse(fs.readFileSync(path.join(root, "scripts/operations.json"), "utf8")).operations;
for (const op of ops) {
  const m = OPERATION_MAP[op.key];
  if (!m) {
    fail(`operation ${op.key} has no mapping in operation-map.mjs`);
    continue;
  }
  if (typeof app.methods[m.method] !== "function") fail(`app method ${m.method} missing for ${op.key}`);
  if (!op.internal && !fs.existsSync(path.join(appDir, "actions", m.action, `${m.action}.mjs`))) {
    fail(`action ${m.action} missing for ${op.key}`);
  }
}

const events = JSON.parse(fs.readFileSync(path.join(root, "scripts/events.json"), "utf8"));
const keys = new Set();
const seenEvents = new Set();

async function check(kind, dir) {
  const file = path.join(appDir, kind, dir, `${dir}.mjs`);
  const id = `${kind}/${dir}`;
  if (!fs.existsSync(file)) {
    fail(`${id}: missing ${dir}.mjs`);
    return;
  }
  const c = (await import(pathToFileURL(file))).default;
  if (c.key !== `crossly-${dir}`) fail(`${id}: key must be crossly-${dir}, got ${c.key}`);
  if (keys.has(c.key)) fail(`${id}: duplicate key ${c.key}`);
  keys.add(c.key);
  if (!SEMVER.test(c.version || "")) fail(`${id}: version must be semver`);
  if (!c.name) fail(`${id}: name required`);
  if (!c.description || !c.description.includes("https://crossly.net/docs")) fail(`${id}: description must link the docs`);
  if (c.type !== (kind === "actions"
    ? "action"
    : "source")) fail(`${id}: wrong type ${c.type}`);
  if (c.props?.crossly !== app) fail(`${id}: props.crossly must be the crossly app`);
  if (typeof c.run !== "function") fail(`${id}: run() required`);
  for (const [
    name,
    p,
  ] of Object.entries(c.props || {})) {
    if (p?.propDefinition) {
      const [
        a,
        def,
      ] = p.propDefinition;
      if (a !== app || !app.propDefinitions[def]) fail(`${id}: prop ${name} references unknown propDefinition ${def}`);
    }
  }
  if (kind === "actions") {
    if (!fs.readFileSync(file, "utf8").includes("$.export(\"$summary\"")) fail(`${id}: must export $summary`);
    return;
  }
  if (![
    "unique",
    "greatest",
    "last",
  ].includes(c.dedupe)) fail(`${id}: dedupe required`);
  if (typeof c.hooks?.activate !== "function" || typeof c.hooks?.deactivate !== "function") {
    fail(`${id}: activate/deactivate hooks required`);
  }
  if (c.props?.http?.type !== "$.interface.http") fail(`${id}: http interface required`);
  const ev = c.methods.getEvent();
  if (!events[ev]) fail(`${id}: unknown Crossly event ${ev}`);
  seenEvents.add(ev);
  if (!c.sampleEmit || c.sampleEmit.type !== ev) fail(`${id}: sampleEmit must be a ${ev} envelope`);
  const summary = c.methods.getSummary(c.sampleEmit);
  if (typeof summary !== "string" || /undefined|NaN/.test(summary)) fail(`${id}: bad summary for sample: ${summary}`);
}

const list = (d) => fs.readdirSync(path.join(appDir, d), {
  withFileTypes: true,
}).filter((e) => e.isDirectory() && e.name !== "common")
  .map((e) => e.name);
for (const d of list("actions")) await check("actions", d);
for (const d of list("sources")) await check("sources", d);
for (const ev of Object.keys(events)) if (!seenEvents.has(ev)) fail(`event ${ev} has no source`);

if (errors.length) {
  console.error(errors.map((e) => `  - ${e}`).join("\n"));
  console.error(`${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`ok: app + ${list("actions").length} actions + ${list("sources").length} sources`);
