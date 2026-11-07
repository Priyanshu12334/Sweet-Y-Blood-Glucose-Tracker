// Entry point for Express application
import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import readingRoutes from './routes/readingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

// Simple CORS middleware (allow credentials)
app.use((req, res, next) => {
  const allowedOrigin = process.env.CLIENT_URL || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Simple cookie parser – attaches req.cookies object
app.use((req, res, next) => {
  const cookieHeader = req.headers?.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(pair => {
      const [key, ...val] = pair.trim().split('=');
      req.cookies[key] = decodeURIComponent(val.join('='));
    });
  }
  next();
});

// Register auth routes
app.use('/api/auth', authRouter);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);

export default app;
