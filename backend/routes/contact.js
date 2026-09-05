const router = require('express').Router();
const Contact = require('../models/contact.model');
const { sendContactNotification } = require('../utils/mailer');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 5000;

// Since every submission now triggers an email, throttle per IP so the
// endpoint can't be used to flood the inbox.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const submissions = new Map();

function isRateLimited(key) {
  const now = Date.now();

  // Opportunistic prune so the map can't grow without bound.
  if (submissions.size > 5000) {
    for (const [ip, times] of submissions) {
      if (times.every((t) => now - t >= WINDOW_MS)) submissions.delete(ip);
    }
  }

  const recent = (submissions.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    submissions.set(key, recent);
    return true;
  }

  recent.push(now);
  submissions.set(key, recent);
  return false;
}

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

router.post('/add', async (req, res) => {
  const name = asString(req.body.name);
  const email = asString(req.body.email);
  const message = asString(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are all required.' });
  }
  if (name.length > MAX_NAME) {
    return res.status(400).json({ error: `Name must be ${MAX_NAME} characters or fewer.` });
  }
  if (email.length > MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'That email address does not look valid.' });
  }
  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({ error: `Message must be ${MAX_MESSAGE} characters or fewer.` });
  }

  if (isRateLimited(req.ip)) {
    return res
      .status(429)
      .json({ error: 'Too many messages from this address. Please try again in a few minutes.' });
  }

  let saved;
  try {
    saved = await Contact.create({ name, email, message });
  } catch (err) {
    console.error('[contact] failed to save submission:', err.message);
    return res.status(500).json({ error: 'Could not save your message. Please try again shortly.' });
  }

  // The message is already persisted, so a mail failure must not fail the request.
  try {
    const result = await sendContactNotification({
      name,
      email,
      message,
      receivedAt: saved.createdAt || new Date(),
    });
    if (!result.sent) {
      console.warn(`[contact] saved ${saved._id} but no notification sent (${result.reason}).`);
    }
  } catch (err) {
    console.error(`[contact] saved ${saved._id} but notification email failed:`, err.message);
  }

  return res.status(201).json({ ok: true });
});

module.exports = router;
