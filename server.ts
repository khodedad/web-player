import express from 'express';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // High-performance direct proxy stream for Radio Navahang
  app.get('/api/stream/navahang.mp3', (req, res) => {
    const streamUrl = 'https://navairan.com/;stream.nsv';
    
    const clientReq = https.get(
      streamUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': '*/*',
          'Icy-MetaData': '0',
        },
      },
      (streamRes) => {
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Connection': 'keep-alive',
        });
        streamRes.pipe(res);
      }
    );

    clientReq.on('error', (err) => {
      console.warn('Navahang proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).send('Stream unavailable');
      }
    });

    req.on('close', () => {
      clientReq.destroy();
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', player: 'web play' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`web play server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
