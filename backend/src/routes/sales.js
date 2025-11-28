const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const page = Number(req.query.page || 0);
    const perPage = Math.min(Number(req.query.perPage || 50), 200);
    const offset = page * perPage;

    const { data, error, count } = await supabase
      .from('sales')
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Get sales error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      data: data || [],
      total: count || 0,
      page,
      perPage
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { 
    product_id, 
    product_name, 
    quantity, 
    unit_price, 
    tax_rate, 
    discount, 
    tax_amount, 
    total 
  } = req.body;

  if (!product_name || quantity === undefined) {
    return res.status(400).json({ error: 'Product name and quantity are required' });
  }

  try {
    const saleData = {
      id: uuidv4(),
      owner_id: userId,
      product_id: product_id || null,
      product_name: product_name,
      quantity: Number(quantity) || 0,
      unit_price: Number(unit_price) || 0,
      tax_rate: Number(tax_rate) || 7.5,
      discount: Number(discount) || 0,
      tax_amount: Number(tax_amount) || 0,
      total: Number(total) || 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('sales')
      .insert(saleData)
      .select();

    if (error) {
      console.error('Create sale error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, qty')
        .eq('id', product_id)
        .eq('owner_id', userId)
        .single();
      
      if (!product) {
        console.warn('Product not found or not owned by user:', product_id);
      } else {
        const newQty = Math.max(0, (product.qty || 0) - Number(quantity));
        await supabase
          .from('products')
          .update({ qty: newQty })
          .eq('id', product_id)
          .eq('owner_id', userId);
      }
    }

    res.status(201).json({ ok: true, sale: data[0] });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const { data: existing } = await supabase
      .from('sales')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', userId);

    if (error) {
      console.error('Delete sale error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

module.exports = router;
