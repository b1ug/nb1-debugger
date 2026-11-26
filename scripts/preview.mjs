// Serve the embedded bundle using the encodings in its distribution manifest.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const { files } = JSON.parse(readFileSync(new URL('manifest.json', dist), 'utf8'));
const assets = new Map(files.map(file => ['/demo/' + file.path, file]));
const review = readFileSync(new URL('preview.html', import.meta.url));
const types = {
  '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.wasm': 'application/wasm', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const pathname = request.url.split('?', 1)[0];
  if (pathname === '/') {
    response.writeHead(200, { 'Content-Type': types['.html'] }).end(review);
    return;
  }
  const file = assets.get(pathname === '/demo/' ? '/demo/index.html' : pathname);
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  const headers = { 'Content-Type': types[extname(file.path)] || 'application/octet-stream' };
  if (file.encoding === 'gzip') headers['Content-Encoding'] = 'gzip';
  response.writeHead(200, headers).end(readFileSync(new URL(file.path, dist)));
});
server.listen(Number(process.env.PORT ?? 4180), '127.0.0.1', () => {
  console.log('Model review: http://127.0.0.1:' + server.address().port + '/');
});
