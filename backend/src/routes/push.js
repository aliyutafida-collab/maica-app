const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { sendExpoPush } = require('../utils/pushSender');

// POST /push/notify - send push notification to users
router.post('/notify', async (req, res) => {
  const { userIds, title, body } = req.body;

  if (!userIds || userIds.length === 0 || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get push tokens for these users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_tokens')
      .in('id', userIds);

    const allTokens = [];
    (profiles || []).forEach(profile => {
      if (profile.push_tokens && Array.isArray(profile.push_tokens)) {
        allTokens.push(...profile.push_tokens);
      }
    });

    if (allTokens.length > 0) {
      await sendExpoPush(allTokens, title, body);
    }

    res.json({ ok: true, tokensSent: allTokens.length });
  } catch (error) {
    console.error('Push notify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
