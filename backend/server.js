import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import productsRouter    from './src/routes/products.js';
import usersRouter       from './src/routes/users.js';
// settings removed — table dropped
import contactRouter     from './src/routes/contact.js';
import supportRouter     from './src/routes/support.js';
import servicesRouter    from './src/routes/services.js';
import reviewsRouter     from './src/routes/reviews.js';
import inventoryRouter   from './src/routes/inventory.js';
import quotationsRouter  from './src/routes/quotations.js';
import wishlistRouter    from './src/routes/wishlist.js';
import analyticsRouter   from './src/routes/analytics.js';
import auditRouter       from './src/routes/audit.js';
import { sanitizeBody }  from './src/middleware/sanitize.js';

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// ── Security ────────────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Rate limiting ───────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// ── Body parsing & compression ──────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// ── Logging ─────────────────────────────────────────────────
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ── Input sanitization ──────────────────────────────────────
app.use(sanitizeBody);

// ── Routes ──────────────────────────────────────────────────

// Core
app.use('/api/products',   productsRouter);
app.use('/api/users',      usersRouter);
app.use('/api/contact',    strictLimiter, contactRouter);
app.use('/api/support',    supportRouter);

// New features
app.use('/api/services',   servicesRouter);
app.use('/api/reviews',    reviewsRouter);
app.use('/api/inventory',  inventoryRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/wishlist',   wishlistRouter);
app.use('/api/analytics',  analyticsRouter);
app.use('/api/audit-logs', auditRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(isProduction ? 500 : err.status || 500).json({
    error: isProduction ? 'Internal server error' : err.message || 'Internal server error',
  });
});

// ── Start server ────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✔ Proteam API running on http://localhost:${PORT} [${isProduction ? 'production' : 'development'}]`);
  console.log(`  Routes: products, quotations, users, services, reviews, inventory, wishlist, analytics, audit-logs`);
});

// ── Graceful shutdown ───────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
