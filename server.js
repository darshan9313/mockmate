const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Normalise URL path to avoid directory traversal
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Remove query parameters or hash from URL
  filePath = filePath.split('?')[0].split('#')[0];
  
  const absolutePath = path.resolve(__dirname, filePath);

  // Check if target is inside project directory
  if (!absolutePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);

    const stream = fs.createReadStream(absolutePath);
    stream.on('error', (streamErr) => {
      console.error(streamErr);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`  Interview Preparation Platform local server is active!`);
  console.log(`  Access URL: http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to terminate the server.`);
  console.log(`========================================================`);
});