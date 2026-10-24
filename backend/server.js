import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errors.js';
import admin from './routes/admin.js';
import auth from './routes/auth.js';
import categories from './routes/categories.js';
import customers from './routes/customers.js';
import orders from './routes/orders.js';
import products from './routes/products.js';
import reviews from './routes/reviews.js';
import sellers from './routes/sellers.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173'
).split(',');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/auth', authRateLimiter, auth);
app.use('/api/products', products);
app.use('/api/categories', categories);
app.use('/api/sellers', sellers);
app.use('/api/seller', sellers);
app.use('/api/orders', orders);
app.use('/api/customers', customers);
app.use('/api/reviews', reviews);
app.use('/api/admin', admin);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CLARAYO API is healthy' });
});

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`CLARAYO API on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
