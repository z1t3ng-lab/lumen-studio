import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const address = 'http://127.0.0.1:4173';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const openBrowser = () => {
  if (process.argv.includes('--open') && process.platform === 'darwin') {
    spawn('open', [address], { stdio: 'ignore' }).on('error', () => {});
  }
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, address);
    const path = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) throw Error('Invalid path');
    if (!(await stat(file)).isFile()) throw Error('Not a file');
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
server.on('error', async error => {
  if (error.code === 'EADDRINUSE') {
    try {
      const existing = await fetch(address, { signal: AbortSignal.timeout(2000) });
      if ((await existing.text()).includes('<title>Lumen Studio — Your personal darkroom</title>')) {
        console.log('Lumen Studio is already running: ' + address);
        openBrowser();
        return;
      }
    } catch {}
  }
  console.error('Could not start Lumen Studio: ' + error.message);
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () => {
  console.log('Lumen Studio: ' + address);
  openBrowser();
});
