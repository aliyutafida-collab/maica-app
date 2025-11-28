const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, optionalAuth } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const page = Number(req.query.page || 0);
    const perPage = Math.min(Number(req.query.perPage || 50), 200);
    const offset = page * perPage;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Get products error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      data: data || [],
      total: count || 0,
      page,
      perPage
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .eq('owner_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { name, price, qty, cost, category, description, stock } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    const productData = {
      id: uuidv4(),
      owner_id: userId,
      name: name.trim(),
      price: Number(price) || 0,
      qty: Number(qty) || Number(stock) || 0,
      cost_price: Number(cost) || 0,
      category: category || 'General',
      description: description || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select();

    if (error) {
      console.error('Create product error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ ok: true, product: data[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.post('/bulk', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Products array is required' });
  }

  try {
    const productData = products
      .filter(p => p.name && p.name.trim())
      .map(p => ({
        id: uuidv4(),
        owner_id: userId,
        name: p.name.trim(),
        price: Number(p.price) || 0,
        qty: Number(p.qty) || Number(p.stock) || 0,
        cost_price: Number(p.cost) || Number(p.cost_price) || 0,
        category: p.category || 'General',
        description: p.description || null,
        created_at: new Date().toISOString()
      }));

    if (productData.length === 0) {
      return res.status(400).json({ error: 'No valid products provided' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select();

    if (error) {
      console.error('Bulk create error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ ok: true, products: data, count: data.length });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Failed to create products' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { name, price, qty, cost, category, description, stock } = req.body;

  try {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (qty !== undefined || stock !== undefined) updateData.qty = Number(qty ?? stock);
    if (cost !== undefined) updateData.cost_price = Number(cost);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('owner_id', userId)
      .select();

    if (error) {
      console.error('Update product error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ ok: true, product: data[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', userId);

    if (error) {
      console.error('Delete product error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
