import express from 'express';
import path from 'path';
import { installLogin } from './login';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const APP_USERNAME = process.env.APP_USERNAME || 'user';
const APP_PASSWORD = process.env.APP_PASSWORD || '';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Health check (before auth so Docker/Traefik can reach it)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // In-page login form + session cookie (only when APP_PASSWORD is set)
  installLogin(app, { appName: 'محوّل الصور', username: APP_USERNAME, password: APP_PASSWORD, accent: '#9C3548' });

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    next();
  });

  // The conversion runs entirely in the browser; there is no other API.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (IS_PROD) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1y', immutable: true }));
    app.use(express.static(distPath, { index: false }));
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server on :${PORT} | auth: ${APP_PASSWORD ? 'on' : 'off'}`);
  });
}

startServer();
