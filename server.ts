import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './src/serverApp';

dotenv.config();

async function startServer() {
  const app = createExpressApp();
  const PORT = 3000;

  // Vite Middleware or Production Static Serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(require('express').static(distPath));
    app.get('*', (_req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOVE BALANCE 2 Express Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
