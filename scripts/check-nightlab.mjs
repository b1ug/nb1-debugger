import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
import {nightlabNames,gzipNames,optionalNames} from './nightlab-assets.mjs';

const root=new URL('../',import.meta.url),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=fs.readFileSync(new URL('dist/manifest.json',root));
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.schema_version,2);assert.equal(manifest.build.tool,'static-nightlab/v1');
assert.equal(manifest.source.repository,'https://github.com/b1ug/nb1-workbench');
assert.deepEqual(Object.keys(manifest).sort(),['api_contracts','asset_base','build','files','product','schema_version','source']);
assert.ok(nightlabNames.every(name=>manifest.files.some(file=>file.path===name)));
let stored=manifestBytes.length,decoded=manifestBytes.length,base=manifestBytes.length;
for(const file of manifest.files){
  assert.deepEqual(Object.keys(file).sort(),['bytes','decoded_bytes','decoded_sha256','encoding','path','sha256']);
  const bytes=fs.readFileSync(new URL('dist/'+file.path,root));
  assert.equal(bytes.length,file.bytes,file.path);assert.equal(sha(bytes),file.sha256,file.path);
  const value=file.encoding==='gzip'?gunzipSync(bytes):bytes;
  assert.doesNotMatch(file.path,/^nightlab\/(?:screenshots|hardware-checks|docs)\/|project-led-faces/,file.path);
  assert.doesNotMatch(value.toString(),/\/(?:Users|home)\/[A-Za-z0-9._-]+\/|[A-Za-z]:\\Users\\|Notion(?:-| )?Doc|reference\/extracted/,file.path);
  assert.doesNotMatch(value.toString(),/"serial"\s*:\s*"(?!0{8}")[0-9]{8}"|"job_id"\s*:\s*"nb1-face-/i,file.path);
  assert.equal(value.length,file.decoded_bytes,file.path);assert.equal(sha(value),file.decoded_sha256,file.path);
  assert.equal(file.encoding,gzipNames.has(file.path)?'gzip':'identity');
  if(file.encoding==='gzip')assert.deepEqual(bytes,gzipSync(value,{level:9,mtime:0}),'Deterministic storage: '+file.path);
  if(file.path.endsWith('.html')){
    const html=value.toString();assert.equal(html.split('__NB1_STYLE_NONCE__').length,2,file.path);
    assert.doesNotMatch(html,/<style\b|\sstyle\s*=|\son\w+\s*=/i,file.path);
  }
  if(file.path.startsWith('nightlab/')&&file.path.endsWith('.js'))assert.doesNotMatch(value.toString(),/NB1_DESIGN_SIMULATION|nb1-design-report|__review|design-light-01|Object\.defineProperty\(navigator/,file.path);
  stored+=bytes.length;decoded+=value.length;if(!optionalNames.has(file.path))base+=value.length;
}
assert.ok(stored<=6*1024*1024);assert.ok(decoded<=16*1024*1024);assert.ok(base<=768*1024);
const tree=manifest.files.map(file=>`${file.path}\0${file.sha256}\n`).join('');assert.equal(sha(tree),manifest.source.tree_sha256);
const source=JSON.parse(fs.readFileSync(new URL('src/nightlab/model-assets/source.json',root)));
for(const file of source.assets)assert.equal(sha(fs.readFileSync(new URL('src/nightlab/model-assets/'+file.file,root))),file.sha256,file.file);
const loader=fs.readFileSync(new URL('src/nightlab/compiler-loader.js',root),'utf8');
assert.match(loader,/new Set\(\['info', 'planSequence'\]\)/);
assert.doesNotMatch(fs.readFileSync(new URL('src/nightlab/studio-preview.js',root),'utf8'),/callCompiler\(['"](?:resolveColor|compileAction|compileRequest)/);
const immutable=JSON.parse(fs.readFileSync(new URL('docs/NIGHTLAB-SOURCE.json',root)));
for(const [name,record] of Object.entries(immutable.unchanged_handoff_assets))assert.equal(sha(fs.readFileSync(new URL(name,root))),record.sha256,name);
console.log(JSON.stringify({status:'PASS',files:manifest.files.length,stored_bytes:stored,decoded_bytes:decoded,base_bytes:base,raw_cad_unchanged:true,hardware_access:false}));

// Public technical help must resolve through the exact current asset inventory.
const modelHTML=fs.readFileSync(new URL('src/nightlab/model.html',root),'utf8');
const paths=new Set(manifest.files.map(file=>file.path));
for(const match of modelHTML.matchAll(/href="([^"]+)"/g)){
 const href=match[1];
 if(/^(?:https?:|#)/.test(href))continue;
 const pathname=new URL(href,'http://127.0.0.1/demo/nightlab/model.html').pathname;
 assert.ok(pathname.startsWith('/demo/'),'Model help link escaped the workbench');
 const logical=pathname.slice('/demo/'.length)||'index.html';
 assert.ok(paths.has(logical),'Missing model help asset: '+logical);
}
for(const [name,record] of Object.entries(immutable.adapted_handoff_assets||{})){
 assert.equal(sha(fs.readFileSync(new URL(name,root))),record.sha256,name);
}
