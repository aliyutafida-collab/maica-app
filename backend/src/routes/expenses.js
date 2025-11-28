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
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error('Get expenses error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ 
      data: data || [],
      total: count || 0,
      page,
      perPage
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const userId = req.userId;
  const { category, amount, description } = req.body;

  if (!category || amount === undefined) {
    return res.status(400).json({ error: 'Category and amount are required' });
  }

  try {
    const expenseData = {
      id: uuidv4(),
      owner_id: userId,
      category: category || 'Other',
      amount: Number(amount) || 0,
      description: description || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select();

    if (error) {
      console.error('Create expense error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ ok: true, expense: data[0] });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const { data: existing } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', req.params.id)
      .eq('owner_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', userId);

    if (error) {
      console.error('Delete expense error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
