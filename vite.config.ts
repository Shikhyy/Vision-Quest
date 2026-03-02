import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Dev-only middleware that generates Stream Video tokens.
 * In production, the token endpoint should be provided via VITE_STREAM_TOKEN_URL
 * pointing to your backend (e.g., the Python agent server at /api/token).
 */
function streamTokenPlugin() {
  return {
    name: 'stream-token-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/token', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const envPath = path.resolve(process.cwd(), 'agent/.env');
          if (!fs.existsSync(envPath)) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'agent/.env not found' }));
            return;
          }
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const secretMatch = envContent.match(/STREAM_API_SECRET=(.+)/);
          const keyMatch = envContent.match(/STREAM_API_KEY=(.+)/);

          const secret = secretMatch ? secretMatch[1].trim() : '';
          const apiKey = keyMatch ? keyMatch[1].trim() : '';

          if (!apiKey || !secret) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Missing Stream credentials in agent/.env' }));
            return;
          }

          const host = req.headers.host ?? 'localhost';
          const rawUrl = (req as IncomingMessage & { originalUrl?: string }).originalUrl || req.url || '/';
          const url = new URL(rawUrl, `http://${host}`);
          const userId = url.searchParams.get('user_id');

          if (!userId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'user_id is required' }));
            return;
          }

          // Dynamic import to avoid bundling node-sdk into the client build
          const { StreamClient } = await import('@stream-io/node-sdk');
          const client = new StreamClient(apiKey, secret);
          const token = client.generateUserToken({ user_id: userId });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ token }));
        } catch (err: unknown) {
          console.error('Token generation error:', err);
          res.statusCode = 500;
          const message = err instanceof Error ? err.message : String(err);
          res.end(JSON.stringify({ error: message }));
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), streamTokenPlugin()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@stream-io')) return 'stream-sdk';
          if (id.includes('framer-motion')) return 'animation';
        },
      },
    },
    // Silence the chunk size warning (Stream SDK is large)
    chunkSizeWarningLimit: 900,
  },
})
