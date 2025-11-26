const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendResetEmail } = require('../utils/email');

// POST /auth/register { email, password, firstName, lastName, products }
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, products = [] } = req.body;
  
  try {
    // Create user in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (userError) return res.status(400).json({ error: userError.message });

    const userId = userData.user.id;

    // Store profile details
    await supabase.from('profiles').insert({
      id: userId,
      first_name: firstName || null,
      last_name: lastName || null,
      push_tokens: []
    });

    // Store multiple products for registration
    for (const p of products) {
      if (!p.name) continue;
      await supabase.from('products').insert({
        id: uuidv4(),
        owner_id: userId,
        name: p.name,
        price: Number(p.price) || 0,
        qty: Number(p.qty) || 0
      });
    }

    const token = require('jsonwebtoken').sign(
      { userId, email },
      process.env.JWT_SECRET || 'maica_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      id: userId,
      name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
      email,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: error.message });

    const token = require('jsonwebtoken').sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET || 'maica_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      id: data.user.id,
      name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
      email: data.user.email,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/forgot { email }
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  
  try {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from('password_resets').insert({
      id: uuidv4(),
      email,
      token_hash: hashedToken,
      expires_at: expiresAt
    });

    const resetLink = `${process.env.MAICA_WEB_URL || 'https://maica.app'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendResetEmail(email, resetLink);
  } catch (error) {
    console.error('Forgot error:', error);
  }

  res.json({ ok: true });
});

// POST /auth/reset { token, email, password }
router.post('/reset', async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('token_hash', tokenHash)
      .limit(1);

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    if (new Date(data[0].expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    // Update user password
    const { error: passErr } = await supabase.auth.admin.updateUserByEmail(email, {
      password
    });

    if (passErr) return res.status(400).json({ error: passErr.message });

    // Delete used token
    await supabase.from('password_resets').delete().eq('id', data[0].id);

    res.json({ ok: true });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  res.json({ ok: true });
});

// POST /auth/save-push-token { userId, token }
router.post('/save-push-token', async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'Missing userId or token' });
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('push_tokens')
      .eq('id', userId)
      .single();

    const tokens = (data && data.push_tokens) || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
    }

    await supabase.from('profiles').update({ push_tokens: tokens }).eq('id', userId);

    res.json({ ok: true });
  } catch (error) {
    console.error('Save push token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
