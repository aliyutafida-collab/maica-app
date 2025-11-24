const fetch = require('node-fetch');

async function sendExpoPush(tokens = [], title = '', body = '') {
  const messages = tokens.map(t => ({
    to: t,
    sound: 'default',
    title,
    body
  }));

  // Chunk into groups of 100 (Expo API limit)
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk)
      });
    } catch (error) {
      console.error('Push send error:', error);
    }
  }
}

module.exports = { sendExpoPush };
