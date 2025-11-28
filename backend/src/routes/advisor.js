const express = require('express');
const router = express.Router();
const { verifyToken, verifyPremium } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(messages, maxTokens = 1000) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function getBusinessData(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

  const [salesResult, expensesResult, productsResult] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .eq('owner_id', userId)
      .gte('created_at', thirtyDaysAgoStr),
    supabase
      .from('expenses')
      .select('*')
      .eq('owner_id', userId)
      .gte('created_at', thirtyDaysAgoStr),
    supabase
      .from('products')
      .select('*')
      .eq('owner_id', userId)
  ]);

  const sales = salesResult.data || [];
  const expenses = expensesResult.data || [];
  const products = productsResult.data || [];

  const totalSales = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const totalTax = sales.reduce((sum, s) => sum + (Number(s.tax_amount) || 0), 0);

  const productSales = {};
  sales.forEach(sale => {
    const name = sale.product_name || 'Unknown';
    if (!productSales[name]) {
      productSales[name] = { quantity: 0, revenue: 0 };
    }
    productSales[name].quantity += Number(sale.quantity) || 0;
    productSales[name].revenue += Number(sale.total) || 0;
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  const expensesByCategory = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'Other';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (Number(exp.amount) || 0);
  });

  return {
    totalSales,
    totalExpenses,
    netProfit,
    totalTax,
    salesCount: sales.length,
    productsCount: products.length,
    topProducts,
    expensesByCategory,
    profitMargin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0
  };
}

router.post('/ai-insights', verifyToken, verifyPremium, async (req, res) => {
  const userId = req.userId;
  const { question, language = 'en' } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(503).json({ 
      error: 'AI service not configured',
      fallback: true,
      message: 'AI Advisor is temporarily unavailable. Please try again later.'
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({ error: 'Question too long. Maximum 1000 characters.' });
  }

  try {
    const businessData = await getBusinessData(userId);

    const languageInstructions = {
      en: 'Respond in English.',
      fr: 'Répondez en français.',
      ha: 'Amsa da Hausa.',
      yo: 'Dahun ni Yoruba.',
      ig: 'Zaghachi na Igbo.',
      ar: 'أجب بالعربية.'
    };

    const langInstruction = languageInstructions[language] || languageInstructions.en;

    const systemPrompt = `You are an AI Business Advisor for Nigerian small and medium-sized enterprises. You analyze business data and provide practical, actionable advice.

${langInstruction}

IMPORTANT DISCLAIMER: Your advice is for informational purposes only. You are not a licensed financial advisor, accountant, or legal professional. Users should consult qualified professionals for official financial, tax, or legal decisions.

Current business data (last 30 days):
- Total Sales: ₦${businessData.totalSales.toLocaleString()}
- Total Expenses: ₦${businessData.totalExpenses.toLocaleString()}
- Net Profit: ₦${businessData.netProfit.toLocaleString()}
- Profit Margin: ${businessData.profitMargin}%
- Total Tax Collected: ₦${businessData.totalTax.toLocaleString()}
- Number of Sales: ${businessData.salesCount}
- Number of Products: ${businessData.productsCount}

Top Performing Products:
${businessData.topProducts.map(p => `- ${p.name}: ₦${p.revenue.toLocaleString()} (${p.quantity} units)`).join('\n') || 'No sales data available'}

Expenses by Category:
${Object.entries(businessData.expensesByCategory).map(([cat, amount]) => `- ${cat}: ₦${amount.toLocaleString()}`).join('\n') || 'No expense data available'}

Provide helpful, Nigeria-specific business advice. Consider local market conditions, Nigerian tax regulations (VAT at 7.5%, Company Income Tax brackets), and practical tips for small business owners.

Keep responses concise but actionable. Use bullet points where appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ];

    const aiResponse = await callOpenAI(messages);

    res.json({
      ok: true,
      response: aiResponse,
      disclaimer: 'This advice is for informational purposes only and should not be considered as professional financial, legal, or tax advice. Please consult with qualified professionals for official guidance.'
    });

  } catch (error) {
    console.error('AI Advisor error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable',
        fallback: true
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to get AI insights' });
  }
});

router.get('/quick-insights', verifyToken, verifyPremium, async (req, res) => {
  const userId = req.userId;

  try {
    const businessData = await getBusinessData(userId);

    const insights = [];

    if (businessData.profitMargin < 10 && businessData.totalSales > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Profit Margin',
        message: `Your profit margin is ${businessData.profitMargin}%. Consider reviewing your pricing or reducing expenses.`
      });
    }

    if (businessData.topProducts.length > 0) {
      const topProduct = businessData.topProducts[0];
      insights.push({
        type: 'success',
        title: 'Top Performer',
        message: `${topProduct.name} is your best-selling product with ₦${topProduct.revenue.toLocaleString()} in revenue.`
      });
    }

    const largestExpense = Object.entries(businessData.expensesByCategory)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (largestExpense) {
      insights.push({
        type: 'info',
        title: 'Largest Expense',
        message: `${largestExpense[0]} is your biggest expense category at ₦${largestExpense[1].toLocaleString()}.`
      });
    }

    if (businessData.totalTax > 0) {
      insights.push({
        type: 'info',
        title: 'Tax Collected',
        message: `You've collected ₦${businessData.totalTax.toLocaleString()} in VAT. Remember to remit to FIRS.`
      });
    }

    res.json({ ok: true, insights, summary: businessData });

  } catch (error) {
    console.error('Quick insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
