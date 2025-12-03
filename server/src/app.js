const path = require('path');
const express = require('express');
const cors = require('cors');
const entriesRouter = require('./routes/entries');

const app = express();
const clientDir = path.join(__dirname, '..', '..', 'client');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/entries', entriesRouter);

app.use(express.static(clientDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(clientDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('[API ERROR]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Unexpected error',
    details: err.details || null,
  });
});

module.exports = app;
