const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

// GET /analytics/summaries - get sales and expense summaries
router.get('/summaries', async (req, res) => {
  try {
    // Get monthly sales (last 6 months) - requires RPC function
    const { data: monthlySales, error: sErr } = await supabase
      .rpc('monthly_sales_last_n_months', { n_months: 6 })
      .catch(() => ({ data: [] }));

    // Get expense categories
    const { data: categories, error: cErr } = await supabase
      .from('transactions')
      .select('category')
      .eq('type', 'expense');

    // Aggregate by category
    const expenseBreakdown = {};
    (categories || []).forEach(tx => {
      const cat = tx.category || 'Other';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + 1;
    });

    res.json({
      monthlySales: monthlySales || [],
      expenseCategories: Object.entries(expenseBreakdown).map(([name, value]) => ({
        name,
        value
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.json({ monthlySales: [], expenseCategories: [] });
  }
});

module.exports = router;
