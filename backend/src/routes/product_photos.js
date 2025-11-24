const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');

// POST /:id/photos - add photo to product
router.post('/:id/photos', async (req, res) => {
  const productId = req.params.id;
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const { error } = await supabase.from('product_photos').insert({
      id: uuidv4(),
      product_id: productId,
      url
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ ok: true });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id/photos - get product photos
router.get('/:id/photos', async (req, res) => {
  const productId = req.params.id;

  try {
    const { data, error } = await supabase
      .from('product_photos')
      .select('url')
      .eq('product_id', productId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ data: (data || []).map(r => r.url) });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /photos/:photoId - delete photo
router.delete('/photos/:photoId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('product_photos')
      .delete()
      .eq('id', req.params.photoId);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
