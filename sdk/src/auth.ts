import express from 'express';
import open from 'open';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), '.pandya-token');

export async function login(host: string) {
  return new Promise<void>((resolve, reject) => {
    const app = express();
    const port = 3001;

    app.get('/callback', (req, res) => {
      const token = req.query.token as string;
      if (token) {
        fs.writeFileSync(TOKEN_PATH, token, 'utf-8');
        res.send('<h1>Login successful!</h1><p>You can close this window and return to the CLI.</p>');
        console.log('Login successful! Token saved.');
        server.close();
        resolve();
        setTimeout(() => process.exit(0), 100);
      } else {
        res.status(400).send('No token provided');
        reject(new Error('No token provided'));
      }
    });

    const server = app.listen(port, async () => {
      const loginUrl = `${host}/cli-login?redirect=http://localhost:${port}/callback`;
      console.log(`Opening browser to authenticate...`);
      console.log(`If the browser does not open, please navigate to: ${loginUrl}`);
      try {
        await open(loginUrl);
      } catch (err) {
        console.error('Failed to open browser:', err);
      }
    });
  });
}

export function getToken(): string | null {
  if (fs.existsSync(TOKEN_PATH)) {
    return fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
  }
  return null;
}
