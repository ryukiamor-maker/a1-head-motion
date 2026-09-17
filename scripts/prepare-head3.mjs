// Run before Blender: node scripts/prepare-head3.mjs
import fs from 'node:fs';
import ts from 'typescript';
const dir = new URL('../.toolcraft/browser-artifacts/', import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const moduleUrl = new URL('model3-geometry.mjs', dir);
fs.writeFileSync(moduleUrl, ts.transpile(fs.readFileSync(new URL('../src/app/robot-head/model3-geometry.ts', import.meta.url), 'utf8'), {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022,
}));
const { splitHead3Geometry } = await import(moduleUrl.href);
const bytes = fs.readFileSync(new URL('../public/head3/model3-geometry.bin', import.meta.url));
const parts = splitHead3Geometry(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const data = Object.fromEntries(['body', 'head', 'lowerHead'].map(name => [name,
  Object.fromEntries(['position', 'normal', 'uv'].map(attribute => [attribute, [...parts[name].getAttribute(attribute).array]])),
]));
fs.writeFileSync(new URL('head3-parts.json', dir), JSON.stringify(data));
