require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { verifyMailer } = require('./utils/mailer');

const app = express();
const port = process.env.PORT || 5000;

// Needed for req.ip to reflect the real client when running behind a host proxy.
app.set('trust proxy', 1);

// Wide open by default; set ALLOWED_ORIGINS (comma-separated) to lock it down.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '64kb' }));

const uri = process.env.ATLAS_URI;
if (!uri) {
  console.error('[db] ATLAS_URI is not set — the API cannot reach MongoDB.');
} else {
  mongoose.connect(uri).catch((err) => console.error('[db] initial connection failed:', err.message));
}

const connection = mongoose.connection;
connection.once('open', () => console.log('[db] MongoDB connection established'));
connection.on('error', (err) => console.error('[db] connection error:', err.message));

app.get('/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/projects', require('./routes/projects'));
app.use('/experience', require('./routes/experience'));
app.use('/testimonials', require('./routes/testimonials'));
app.use('/hackathons', require('./routes/hackathons'));
app.use('/contact', require('./routes/contact'));

app.listen(port, () => {
  console.log(`[server] listening on port ${port}`);
  verifyMailer();
});
