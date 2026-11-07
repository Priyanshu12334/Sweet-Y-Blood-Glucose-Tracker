import 'dotenv/config';
import express from 'express';
import authRouter from './routes/auth.js';
import readingRoutes from './routes/readingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();
app.use(express.json());

// Credentialed CORS must return the requesting origin, never "*".
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (origin && configuredOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    if (origin && !configuredOrigins.includes(origin)) return res.sendStatus(403);
    return res.sendStatus(204);
  }
  next();
});

app.use((req, res, next) => {
  const cookieHeader = req.headers?.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(pair => {
      const [key, ...val] = pair.trim().split('=');
      try {
        req.cookies[key] = decodeURIComponent(val.join('='));
      } catch {
        // Ignore malformed cookie values; auth middleware will treat the token as absent.
      }
    });
  }
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);

export default app;
