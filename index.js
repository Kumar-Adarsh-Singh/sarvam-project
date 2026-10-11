import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Explicitly serve static assets folder and root
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🎙️ SarvamCast running at http://localhost:${PORT}`);
  });
}

export default app;
