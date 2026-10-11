// Local development server (zero dependencies, native Node.js)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import generateScriptHandler from './api/generate-script.js';
import synthesizeSpeechHandler from './api/synthesize-speech.js';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if present
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
} catch (e) {
  // .env optional
}

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Adapt req/res for Vercel-style handlers
  const adapt = (handler) => {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        req.body = bodyData ? JSON.parse(bodyData) : {};
      } catch (err) {
        req.body = {};
      }
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
      handler(req, res);
    });
  };

  if (pathname === '/api/generate-script') {
    return adapt(generateScriptHandler);
  }
  if (pathname === '/api/synthesize-speech') {
    return adapt(synthesizeSpeechHandler);
  }
  if (pathname === '/api/health') {
    return adapt(healthHandler);
  }

  // Serve static files from public/
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading ' + pathname);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(`🎙️  SarvamCast Studio running at http://localhost:${PORT}`);
});
