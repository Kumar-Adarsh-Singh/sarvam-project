import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static assets from root directory
app.use(express.static(__dirname));

// Serve index.html for all page requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// For local development only (Vercel uses the exported app handler)
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🎙️ SarvamCast running at http://localhost:${PORT}`);
  });
}

export default app;
