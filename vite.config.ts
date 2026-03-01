import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { StreamClient } from '@stream-io/node-sdk'

function streamTokenPlugin() {
  return {
    name: 'stream-token-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/token', (req: any, res: any) => {
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

          const url = new URL(req.originalUrl || req.url || '/', `http://${req.headers.host}`);
          const userId = url.searchParams.get('user_id');

          if (!userId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'user_id is required' }));
            return;
          }

          const client = new StreamClient(apiKey, secret);
          const token = client.generateUserToken({ user_id: userId });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ token }));
        } catch (err: any) {
          console.error('Token generation error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || String(err) }));
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
})
