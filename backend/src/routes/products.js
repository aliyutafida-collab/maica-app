const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');

// GET /products - paginated list
router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page || 0);
    const perPage = Math.min(Number(req.query.perPage || 20), 200);
    const offset = page * perPage;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ data: data || [] });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /products/:id - get single product
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Not found' });

    res.json(data);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /products - create product
router.post('/', async (req, res) => {
  const { name, price, qty, ownerId, category, description } = req.body;

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        id: uuidv4(),
        owner_id: ownerId,
        name,
        price: Number(price) || 0,
        qty: Number(qty) || 0,
        category: category || null,
        description: description || null
      })
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ ok: true, product: data[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /products/:id - update product
router.put('/:id', async (req, res) => {
  const { name, price, qty, category, description } = req.body;

  try {
    const { data, error } = await supabase
      .from('products')
      .update({ name, price: Number(price), qty: Number(qty), category, description })
      .eq('id', req.params.id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ ok: true, product: data[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /products/:id - delete product
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
