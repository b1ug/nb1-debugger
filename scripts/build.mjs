import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { compileCatalog } from './catalog.mjs';
import { buildSync } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { nightlabNames, gzipNames, optionalNames } from './nightlab-assets.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const baseNames = ['demo.css', 'demo.js', 'index.html', 'locales.js', 'i18n.js', 'orbit.css', 'orbit.html', 'orbit.js', 'patterns.css', 'patterns.html', 'patterns.js',
  'action-icons.js', 'locale-menu.css', 'typography.css',
  'json-editor.js', 'json-editor.css', 'editor-LICENSES.txt',
  'assets/nb1-icon.png', 'assets/nb1-mascot.webp',
  'fonts/fredoka-700-latin.woff2', 'fonts/fredoka-700-latin-ext.woff2',
  'fonts/mplusround-500-latin.woff2', 'fonts/mplusround-700-latin.woff2',
  'fonts/Fredoka-OFL.txt', 'fonts/MPLUSRounded1c-OFL.txt'];
const names = [...baseNames, ...nightlabNames];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const fail = message => { throw new Error(message); };
const git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
const args = new Set(process.argv.slice(2));
for (const arg of args) if (!['--allow-dirty', '--check'].includes(arg)) fail(`Unknown option: ${arg}`);
if (args.has('--allow-dirty') && args.has('--check')) fail('--check requires a clean reproducible build');
const commit = git(['rev-parse', 'HEAD']);
if (!/^[0-9a-f]{40}$/.test(commit)) fail('Full source commit is required');
const dirty = git(['status', '--porcelain', '--untracked-files=all']) !== '';
if (dirty && !args.has('--allow-dirty')) fail('Commit the reviewed source first, or use build:dev for a non-importable preview');

function inventory(directory, allowed) {
  const rootInfo = fs.lstatSync(directory);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) fail('Asset root must be a regular directory');
  const result = [], parents = new Set();
  for (const name of allowed) { let parent = path.posix.dirname(name); while (parent !== '.') { parents.add(parent); parent = path.posix.dirname(parent); } }
  function walk(current, prefix = '') {
    for (const entry of fs.readdirSync(current)) {
      const name = prefix + entry, file = path.join(current, entry), stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) fail(`Linked asset: ${name}`);
      if (stat.isDirectory()) { if (!parents.has(name)) fail(`Unexpected asset directory: ${name}`); walk(file, name + '/'); }
      else { if (!stat.isFile() || stat.nlink !== 1) fail(`Asset must be a regular source file: ${name}`); result.push(name); }
    }
  }
  walk(directory); return result.sort();
}
// The model is a build-time dependency. Preserve its logical runtime paths
// so saved URLs and nb1's offline bundle inventory stay stable.
const modelDirectory = 'node_modules/@b1ug/blink1-models/models/mk2';
const modelManifest = fs.readFileSync(path.join(root, modelDirectory, 'manifest.json'));
if (hash(modelManifest) !== '8da04a0b8af074ad9f559921bd19c3a2fe0e6522d479012c3373b95d383bf38a') fail('Unexpected MK2 model manifest');
const modelSources = new Map();
for (const [relative, record] of Object.entries(JSON.parse(modelManifest).files)) {
  const logical = 'nightlab/' + relative;
  if (!names.includes(logical)) fail('Unexpected MK2 model file: ' + logical);
  const filename = path.join(modelDirectory, relative);
  const bytes = fs.readFileSync(path.join(root, filename));
  if (bytes.length !== record.bytes || hash(bytes) !== record.sha256) fail('MK2 model integrity mismatch: ' + relative);
  modelSources.set(logical, filename);
}
const sourceNames = inventory(path.join(root, 'src'), names);
if (JSON.stringify(sourceNames) !== JSON.stringify(names.filter(name => !modelSources.has(name) && !['locales.js', 'editor-LICENSES.txt'].includes(name)).sort())) fail('Unexpected or missing src file; update the reviewed asset contract explicitly');
// Bundle only the selected JSON editor extensions. There are no runtime imports
// or downloads; all third-party license texts travel with the static bundle.
const editor = buildSync({ absWorkingDir: root, entryPoints: ['src/json-editor.js'], bundle: true,
  minify: true, format: 'iife', platform: 'browser', target: ['es2020'], charset: 'utf8',
  write: false, metafile: true, legalComments: 'none', logLevel: 'silent' });
if (editor.outputFiles.length !== 1 || Object.values(editor.metafile.outputs).some(value => value.imports.length)) fail('Editor must be a single self-contained script');
const packages = new Set();
for (const name of Object.keys(editor.metafile.inputs)) {
  if (name === 'src/json-editor.js') continue;
  const match = /^node_modules\/(@[^/]+\/[^/]+|[^/]+)\//.exec(name);
  if (!match || name.includes('/node_modules/') || name.includes('..') || name.includes('\\')) fail(`Unreviewed editor input: ${name}`);
  packages.add(match[1]);
}
let editorNotices = 'nb1 JSON editor: third-party notices\n\n';
for (const name of [...packages].sort()) {
  const directory = path.join(root, 'node_modules', name);
  const info = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  if (info.license !== 'MIT') fail(`Review editor license before bundling: ${name}`);
  editorNotices += `${name} ${info.version}\n${fs.readFileSync(path.join(directory, 'LICENSE'), 'utf8').trim()}\n\n`;
}
// Bundle the unchanged approved model, light field and corrected enclosure into
// one local module. Raw STL loads keep their module-relative logical paths.
const threeInfo = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/three/package.json'), 'utf8'));
if (threeInfo.version !== '0.187.0' || threeInfo.license !== 'MIT') fail('Unreviewed Three.js package');
const viewer = buildSync({absWorkingDir:root, entryPoints:['src/nightlab/studio-3d.js'], bundle:true,
  minify:true, format:'esm', platform:'browser', target:['es2020'], charset:'utf8',
  write:false, metafile:true, legalComments:'none', logLevel:'silent'});
if (viewer.outputFiles.length !== 1 || Object.values(viewer.metafile.outputs).some(value=>value.imports.length)) fail('The viewer must be a single local module');
for(const input of Object.keys(viewer.metafile.inputs)) {
  if (!input.startsWith('node_modules/three/') && !['src/nightlab/studio-3d.js',modelSources.get('nightlab/light-model.js'),modelSources.get('nightlab/enclosure-fit.js')].includes(input)) fail(`Unreviewed viewer input: ${input}`);
}
const files = new Map();
const compilerDirectory = path.join(root, 'src/nightlab/compiler');
const compilerReceipt = JSON.parse(fs.readFileSync(path.join(compilerDirectory, 'compiler-source.json'), 'utf8'));
if (compilerReceipt.status !== 'PASS' || compilerReceipt.source_commit !== 'b5cfe68cbb412d81a80d948b845aee5b0aba586b') fail('Unreviewed screen planner compiler');
for (const name of ['nb1.wasm','wasm_exec.js','GO-LICENSE.txt','NB1-LICENSE.txt','COLORKIT-LICENSE.txt']) {
  const bytes=fs.readFileSync(path.join(compilerDirectory,name)),record=compilerReceipt.files?.[name];
  if (!record || record.bytes!==bytes.length || record.sha256!==hash(bytes)) fail(`Pinned screen planner integrity mismatch: ${name}`);
}
for (const name of names) {
  if (name === 'nightlab/studio-3d.js') { files.set(name, Buffer.from(viewer.outputFiles[0].contents)); continue; }
  if (name === 'json-editor.js') { files.set(name, Buffer.from(editor.outputFiles[0].contents)); continue; }
  if (name === 'editor-LICENSES.txt') { files.set(name, Buffer.from(editorNotices)); continue; }
  if (name === 'locales.js') {
    const catalogPath = path.join(root, 'locales/messages.json'), stat = fs.lstatSync(catalogPath);
    if (!stat.isFile() || stat.nlink !== 1 || stat.isSymbolicLink()) fail('Locale catalog must be a private regular source file');
    files.set(name, compileCatalog(JSON.parse(fs.readFileSync(catalogPath, 'utf8')))); continue;
  }
  const source = path.join(root, modelSources.get(name) ?? path.join('src', name));
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.nlink !== 1 || stat.isSymbolicLink()) fail(`Source must be a private regular file: ${name}`);
  const bytes = fs.readFileSync(source);
  if (name.endsWith('.woff2')) {
    if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2' || bytes.length > 48 * 1024) fail(`Invalid or oversized local font: ${name}`);
    files.set(name, bytes); continue;
  }
  if (name.endsWith('.webp')) {
    if (bytes.length < 20 || bytes.length > 24 * 1024 ||
        bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
        bytes.subarray(8, 12).toString('ascii') !== 'WEBP' ||
        bytes.readUInt32LE(4) !== bytes.length - 8) fail(`Invalid or oversized local mascot: ${name}`);
    files.set(name, bytes); continue;
  }
  if (name.startsWith('nightlab/screenshots/') && /\.(?:png|jpg)$/.test(name)) {
    if (bytes.length > 2 * 1024 * 1024) fail(`Oversized model reference image: ${name}`);
    files.set(name, bytes); continue;
  }
  if (name === 'nightlab/compiler/nb1.wasm') {
    if (!bytes.subarray(0,4).equals(Buffer.from([0,97,115,109])) || bytes.length > 5 * 1024 * 1024) fail('Invalid pinned planner WASM');
    files.set(name,bytes); continue;
  }
  if (name.endsWith('.png')) {
    if (bytes.length < 33 || bytes.length > 8 * 1024 ||
        !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.subarray(12, 16).toString('ascii') !== 'IHDR' ||
        bytes.readUInt32BE(16) !== 64 || bytes.readUInt32BE(20) !== 64) fail(`Invalid or oversized local favicon: ${name}`);
    files.set(name, bytes); continue;
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (name.endsWith('.html')) {
    const nonceTag = '<meta name="nb1-style-nonce" content="__NB1_STYLE_NONCE__">';
    if (text.split(nonceTag).length !== 2 || text.split('__NB1_STYLE_NONCE__').length !== 2 || text.split('nb1-style-nonce').length !== 2) fail(`Missing or ambiguous editor style nonce: ${name}`);
    if (/<style\b|\sstyle\s*=|\son\w+\s*=/i.test(text)) fail(`Inline styles/handlers are not compatible with the embedded CSP: ${name}`);
    for (const match of text.matchAll(/<(script|link|img)\b[^>]*(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(name), match[2]));
      if (!names.includes(target) && !target.startsWith('data:')) fail(`Nonlocal or unknown resource ${target} in ${name}`);
    }
  }
  if (name.endsWith('.css')) {
    if (/@import/i.test(text)) fail(`CSS imports are not allowed: ${name}`);
    for (const match of text.matchAll(/url\s*\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
      const target = match[1];
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
      if (/[:?#\\]/.test(target) || !target.startsWith('./fonts/') || !names.includes(resolved) || !resolved.endsWith('.woff2')) fail(`Unreviewed font resource ${target} in ${name}`);
    }
  }
  files.set(name, bytes);
}
const license = path.join(root, 'LICENSE');
if (!fs.lstatSync(license).isFile() || fs.lstatSync(license).nlink !== 1) fail('LICENSE must be a regular source file');
files.set('LICENSE.txt', fs.readFileSync(license));
const decodedFiles = new Map(files);
for (const name of gzipNames) files.set(name, gzipSync(decodedFiles.get(name), {level:9, mtime:0}));
const entries = [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, bytes]) => ({
  path:name, bytes:bytes.length, sha256:hash(bytes), encoding:gzipNames.has(name)?'gzip':'identity',
  decoded_bytes:decodedFiles.get(name).length, decoded_sha256:hash(decodedFiles.get(name))
}));
const tree = entries.map(f => `${f.path}\0${f.sha256}\n`).join('');
const manifest = {
  schema_version: 2, product: 'nb1-web', asset_base: './',
  source: { repository: 'https://github.com/b1ug/nb1-debugger', commit, dirty, tree_sha256: hash(tree) },
  build: { tool: 'static-nightlab/v1', node: process.version, lockfile_sha256: hash(fs.readFileSync(path.join(root, 'package-lock.json'))) },
  api_contracts: ['nb1-api/v1'], files: entries
};
const encoded = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
files.set('manifest.json', encoded);
const total = [...files.values()].reduce((sum, b) => sum + b.length, 0);
const decodedTotal = encoded.length + [...decodedFiles.values()].reduce((sum, bytes)=>sum+bytes.length,0);
const baseTotal = encoded.length + [...decodedFiles].filter(([name])=>!optionalNames.has(name)).reduce((sum,[,bytes])=>sum+bytes.length,0);
if (baseTotal > 768 * 1024) fail(`Base UI ${baseTotal} exceeds reviewed 768 KiB budget`);
if (total > 6 * 1024 * 1024 || decodedTotal > 16 * 1024 * 1024) fail(`Nightlab payload ${total} stored / ${decodedTotal} decoded exceeds reviewed budgets`);
const destination = path.join(root, 'dist');
if (args.has('--check')) {
  const actual = inventory(destination, [...files.keys()]);
  if (JSON.stringify(actual) !== JSON.stringify([...files.keys()].sort())) fail('dist file set differs from source build');
  for (const [name, bytes] of files) {
    const file = path.join(destination, name); const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.nlink !== 1 || !fs.readFileSync(file).equals(bytes)) fail(`dist mismatch: ${name}`);
  }
} else {
  const staging = fs.mkdtempSync(path.join(root, '.dist-build-'));
  try {
    for (const [name, bytes] of files) { const output = path.join(staging, name); fs.mkdirSync(path.dirname(output), {recursive: true}); fs.writeFileSync(output, bytes, { mode: 0o644, flag: 'wx' }); }
    fs.rmSync(destination, { force: true, recursive: true });
    fs.renameSync(staging, destination);
  } finally { fs.rmSync(staging, { force: true, recursive: true }); }
}
process.stdout.write(JSON.stringify({ source: commit, dirty, files: files.size, bytes: total, decoded_bytes: decodedTotal, base_bytes: baseTotal, manifest_sha256: hash(encoded), checked: args.has('--check') }) + '\n');
