// Compact only the runtime transport. Stable semantic keys and English sources
// stay in locales/messages.json for review and future language extensions.
export function fingerprint(text) {
  let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b, 33) ^ c; }
  return btoa(String.fromCharCode(a >>> 24, a >>> 16 & 255, a >>> 8 & 255, a & 255, b >>> 24, b >>> 16 & 255, b >>> 8 & 255, b & 255)).replace(/\+/g, "-").replace(/\//g, "_").slice(0, 11);
}
const placeholders = text => [...text.matchAll(/\{p(\d+)\}/g)].map(m => m[1]).sort().join(',');
export function compileCatalog(source) {
  const seenKeys = new Set(), seenText = new Map(), fingerprints = new Map();
  const locales = Object.fromEntries(Object.entries(source.locales).map(([code, label]) => [code, {label, messages: {}}]));
  if (!locales.en || !locales['zh-CN']) throw Error('English fallback and Chinese locale are required');
  const templates = [];
  for (const item of source.messages) {
    if (!/^[a-z][a-z0-9_.-]+$/.test(item.key) || seenKeys.has(item.key)) throw Error('Duplicate or invalid semantic key: ' + item.key);
    seenKeys.add(item.key);
    if (seenText.has(item.en)) throw Error('Duplicate English source: ' + item.en);
    seenText.set(item.en, item.key);
    const digest = fingerprint(item.en);
    if (fingerprints.has(digest)) throw Error('Message fingerprint collision: ' + item.key);
    fingerprints.set(digest, item.en);
    const indices = [...item.en.matchAll(/\{p(\d+)\}/g)].map(m => Number(m[1]));
    if (indices.some((index, position) => index !== position) || indices.length > 16 || !Number.isInteger(item.recursive || 0) || (item.recursive || 0) < 0 || (item.recursive || 0) >= 2 ** indices.length) throw Error('Invalid template captures: ' + item.key);
    const dynamic = /\{p\d+\}/.test(item.en), key = dynamic ? '$' + templates.length.toString(36) : digest;
    if (dynamic) {
      if (!item.en.replace(/\{p\d+\}/g, '').trim()) throw Error('An unanchored template can alter user data: ' + item.key);
      templates.push([item.en, key, item.recursive || 0]);
    }
    for (const code of Object.keys(locales)) {
      if (code === 'en') continue;
      const text = item[code];
      if (typeof text !== 'string' || !text || placeholders(text) !== placeholders(item.en)) throw Error('Missing translation or placeholder mismatch: ' + item.key + ' / ' + code);
      locales[code].messages[key] = text;
    }
  }
  return Buffer.from('"use strict";\nwindow.nb1LocaleCatalog=' + JSON.stringify({locales, templates}) + ';\n');
}
