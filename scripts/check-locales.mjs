import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { compileCatalog, fingerprint } from './catalog.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../locales/messages.json', import.meta.url), 'utf8'));
const bytes = compileCatalog(catalog), context = {window: {}};
vm.runInNewContext(bytes.toString(), context);
assert.equal(Object.keys(context.window.nb1LocaleCatalog.locales.en.messages).length, 0);
assert.deepEqual(Object.keys(context.window.nb1LocaleCatalog.locales), Object.keys(catalog.locales));
for (const item of catalog.messages) {
  const count = [...item.en.matchAll(/\{p(\d+)\}/g)].length;
  assert.ok(Number.isInteger(item.recursive || 0) && (item.recursive || 0) >= 0 && (item.recursive || 0) < 2 ** count, item.key + ': recursive capture bounds');
  if (!count) assert.equal(context.window.nb1LocaleCatalog.locales['zh-CN'].messages[fingerprint(item.en)], item['zh-CN']);
}
const broken = structuredClone(catalog); broken.messages[0]['zh-CN'] += '{p99}';
assert.throws(() => compileCatalog(broken), /placeholder mismatch/);
const duplicate = structuredClone(catalog); duplicate.messages.push({...duplicate.messages[0], key:'check.duplicate'});
assert.throws(() => compileCatalog(duplicate), /Duplicate English/);
const future = structuredClone(catalog); future.locales.zz = 'Test language';
assert.throws(() => compileCatalog(future), /Missing translation/);
for (const item of future.messages) item.zz = item.en;
assert.ok(compileCatalog(future).length > 0, 'Future locale registration');
process.stdout.write(JSON.stringify({status:'PASS', messages:catalog.messages.length, templates:context.window.nb1LocaleCatalog.templates.length, runtime_bytes:bytes.length, locales:Object.keys(catalog.locales)}) + '\n');
