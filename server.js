import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createServer } from 'node:http';

const rootDir = resolve(process.cwd());
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function sendFile(res, absolutePath) {
  const ext = extname(absolutePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const { size } = statSync(absolutePath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': size,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
  });

  createReadStream(absolutePath).pipe(res);
}

createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const rawPath = (req.url || '/').split('?')[0];
  const requestPath = rawPath === '/' ? '/index.html' : normalize(rawPath);
  const absolutePath = resolve(rootDir, `.${requestPath}`);

  if (!absolutePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  if (existsSync(absolutePath) && statSync(absolutePath).isFile()) {
    if (method === 'HEAD') {
      const ext = extname(absolutePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream'
      });
      res.end();
      return;
    }
    sendFile(res, absolutePath);
    return;
  }

  const fallback = join(rootDir, 'index.html');
  if (existsSync(fallback)) {
    sendFile(res, fallback);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
}).listen(port, '0.0.0.0', () => {
  console.log(`ADMAV server listening on port ${port}`);
});
