const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { verifyToken } = require('../middleware/auth');
const { generateReportPDF, generateInvestorSummaryPDF } = require('../utils/pdfGenerator');

async function getDateRange(type, customStart, customEnd) {
  const now = new Date();
  let startDate, endDate;
  
  if (type === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (type === 'quarterly') {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
    endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
  } else if (type === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = now;
  }
  
  return { startDate, endDate };
}

async function fetchReportData(userId, startDate, endDate) {
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .eq('owner_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (salesError) {
    console.error('Error fetching sales:', salesError);
  }

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('owner_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (expensesError) {
    console.error('Error fetching expenses:', expensesError);
  }

  const salesData = sales || [];
  const expensesData = expenses || [];

  const totalSales = salesData.reduce((sum, s) => sum + (s.total || 0), 0);
  const taxCollected = salesData.reduce((sum, s) => sum + (s.tax_amount || 0), 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const transactionCount = salesData.length + expensesData.length;

  const productRevenue = {};
  salesData.forEach(sale => {
    const name = sale.product_name || 'Unknown';
    if (!productRevenue[name]) {
      productRevenue[name] = { name, revenue: 0, unitsSold: 0 };
    }
    productRevenue[name].revenue += sale.total || 0;
    productRevenue[name].unitsSold += sale.quantity || 0;
  });
  
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const expenseByCategory = {};
  expensesData.forEach(expense => {
    const category = expense.category || 'Other';
    if (!expenseByCategory[category]) {
      expenseByCategory[category] = { name: category, amount: 0 };
    }
    expenseByCategory[category].amount += expense.amount || 0;
  });
  
  const expenseCategories = Object.values(expenseByCategory)
    .sort((a, b) => b.amount - a.amount);

  return {
    totalSales,
    totalExpenses,
    netProfit,
    taxCollected,
    transactionCount,
    topProducts,
    expenseCategories
  };
}

async function getCompanyInfo(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, company_name, business_category')
    .eq('id', userId)
    .single();

  return {
    companyName: profile?.company_name || 
                 `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
                 'My Business',
    businessCategory: profile?.business_category || 'Retail'
  };
}

async function checkPremiumAccess(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, trial_ends_at')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  const plan = profile.subscription_plan || 'trial';
  
  if (plan === 'premium' || plan === 'standard') {
    return true;
  }
  
  if (plan === 'trial' && profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    return trialEnd > new Date();
  }

  return false;
}

async function uploadToSupabase(pdfBuffer, userId, reportType) {
  const timestamp = Date.now();
  const filename = `${reportType}_${timestamp}.pdf`;
  const filePath = `reports/${userId}/${filename}`;

  const { data, error } = await supabase.storage
    .from('reports')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error);
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('reports', {
      public: false
    });
    
    if (!bucketError || bucketError.message?.includes('already exists')) {
      const { data: retryData, error: retryError } = await supabase.storage
        .from('reports')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (retryError) throw retryError;
    } else {
      throw error;
    }
  }

  const { data: urlData } = await supabase.storage
    .from('reports')
    .createSignedUrl(filePath, 3600);

  return urlData?.signedUrl || null;
}

async function saveReportHistory(userId, reportType, pdfUrl, metadata) {
  try {
    await supabase.from('report_history').insert({
      user_id: userId,
      report_type: reportType,
      pdf_url: pdfUrl,
      metadata: metadata,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to save report history:', error);
  }
}

router.post('/monthly', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { language = 'en', isRTL = false } = req.body;

    const hasPremium = await checkPremiumAccess(userId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required for PDF reports',
        code: 'PREMIUM_REQUIRED'
      });
    }

    const { startDate, endDate } = await getDateRange('monthly');
    const reportData = await fetchReportData(userId, startDate, endDate);
    const { companyName, businessCategory } = await getCompanyInfo(userId);

    const pdfBuffer = await generateReportPDF({
      reportType: 'monthly',
      companyName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...reportData,
      isRTL,
      language
    });

    const pdfUrl = await uploadToSupabase(pdfBuffer, userId, 'monthly');

    await saveReportHistory(userId, 'monthly', pdfUrl, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...reportData
    });

    res.json({ 
      ok: true, 
      url: pdfUrl,
      reportType: 'monthly',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

router.post('/quarterly', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { language = 'en', isRTL = false } = req.body;

    const hasPremium = await checkPremiumAccess(userId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required for PDF reports',
        code: 'PREMIUM_REQUIRED'
      });
    }

    const { startDate, endDate } = await getDateRange('quarterly');
    const reportData = await fetchReportData(userId, startDate, endDate);
    const { companyName, businessCategory } = await getCompanyInfo(userId);

    const pdfBuffer = await generateReportPDF({
      reportType: 'quarterly',
      companyName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...reportData,
      isRTL,
      language
    });

    const pdfUrl = await uploadToSupabase(pdfBuffer, userId, 'quarterly');

    await saveReportHistory(userId, 'quarterly', pdfUrl, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...reportData
    });

    res.json({ 
      ok: true, 
      url: pdfUrl,
      reportType: 'quarterly',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Quarterly report error:', error);
    res.status(500).json({ error: 'Failed to generate quarterly report' });
  }
});

router.post('/yearly', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { language = 'en', isRTL = false } = req.body;

    const hasPremium = await checkPremiumAccess(userId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required for PDF reports',
        code: 'PREMIUM_REQUIRED'
      });
    }

    const { startDate, endDate } = await getDateRange('yearly');
    const reportData = await fetchReportData(userId, startDate, endDate);
    const { companyName, businessCategory } = await getCompanyInfo(userId);

    const pdfBuffer = await generateReportPDF({
      reportType: 'yearly',
      companyName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...reportData,
      isRTL,
      language
    });

    const pdfUrl = await uploadToSupabase(pdfBuffer, userId, 'yearly');

    await saveReportHistory(userId, 'yearly', pdfUrl, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...reportData
    });

    res.json({ 
      ok: true, 
      url: pdfUrl,
      reportType: 'yearly',
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Yearly report error:', error);
    res.status(500).json({ error: 'Failed to generate yearly report' });
  }
});

router.post('/investor-summary', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { language = 'en', isRTL = false } = req.body;

    const hasPremium = await checkPremiumAccess(userId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: 'Premium subscription required for investor reports',
        code: 'PREMIUM_REQUIRED'
      });
    }

    const { companyName, businessCategory } = await getCompanyInfo(userId);
    
    const currentYear = new Date().getFullYear();
    const yearData = [];
    
    for (let year = currentYear - 2; year <= currentYear; year++) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      const data = await fetchReportData(userId, startDate, endDate);
      yearData.push({
        year,
        revenue: data.totalSales,
        expenses: data.totalExpenses,
        profit: data.netProfit
      });
    }
    
    let growthRate = 0;
    if (yearData.length >= 2 && yearData[yearData.length - 2].revenue > 0) {
      const prevRevenue = yearData[yearData.length - 2].revenue;
      const currRevenue = yearData[yearData.length - 1].revenue;
      growthRate = ((currRevenue - prevRevenue) / prevRevenue * 100).toFixed(1);
    }
    
    const projectedRevenue = yearData[yearData.length - 1].revenue * (1 + growthRate / 100);

    const pdfBuffer = await generateInvestorSummaryPDF({
      companyName,
      businessCategory,
      yearData,
      growthRate,
      projectedRevenue,
      isRTL,
      language
    });

    const pdfUrl = await uploadToSupabase(pdfBuffer, userId, 'investor-summary');

    await saveReportHistory(userId, 'investor-summary', pdfUrl, {
      yearData,
      growthRate,
      projectedRevenue
    });

    res.json({ 
      ok: true, 
      url: pdfUrl,
      reportType: 'investor-summary'
    });
  } catch (error) {
    console.error('Investor summary error:', error);
    res.status(500).json({ error: 'Failed to generate investor summary' });
  }
});

router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('report_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ reports: data || [] });
  } catch (error) {
    console.error('Report history error:', error);
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
});

router.post('/tax-summary', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { revenue, expenses, salaries, result, isRTL = false, language = 'en' } = req.body;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_plan, trial_ends_at')
      .eq('id', userId)
      .single();

    const isPremium = profileData?.subscription_plan === 'premium';
    const isInTrial = profileData?.trial_ends_at && new Date(profileData.trial_ends_at) > new Date();

    if (!isPremium && !isInTrial) {
      return res.status(403).json({ error: 'Premium subscription required for PDF export' });
    }

    const { data: companyData } = await supabase
      .from('companies')
      .select('name')
      .eq('user_id', userId)
      .single();

    const companyName = companyData?.name || 'My Business';

    const PDFDocument = require('pdfkit');
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).fillColor('#0B234A').text('Tax Summary Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).fillColor('#333').text(companyName, { align: 'center' });
      doc.fontSize(10).fillColor('#666').text(new Date().toLocaleDateString('en-NG'), { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12).fillColor('#0B234A').text('Financial Summary');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Annual Revenue: ₦${Number(revenue || 0).toLocaleString()}`);
      doc.text(`Annual Expenses: ₦${Number(expenses || 0).toLocaleString()}`);
      doc.text(`Total Salaries: ₦${Number(salaries || 0).toLocaleString()}`);
      doc.text(`Taxable Profit: ₦${(result?.summary?.profit || 0).toLocaleString()}`);
      doc.moveDown(2);

      if (result?.taxes) {
        doc.fontSize(12).fillColor('#0B234A').text('Tax Breakdown');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333');
        
        const cit = result.taxes.companyIncomeTax;
        doc.text(`Company Income Tax (${cit.category} - ${cit.rate}%): ₦${cit.tax.toLocaleString()}`);
        
        const vat = result.taxes.vat;
        doc.text(`VAT Collectable (${vat.applicable ? '7.5%' : 'N/A'}): ₦${vat.vat.toLocaleString()}`);
        
        const edu = result.taxes.educationTax;
        doc.text(`Education Tax (${edu.rate}%): ₦${edu.amount.toLocaleString()}`);
        
        if (result.taxes.nitdaLevy.applicable) {
          doc.text(`NITDA Levy (${result.taxes.nitdaLevy.rate}%): ₦${result.taxes.nitdaLevy.amount.toLocaleString()}`);
        }
        
        if (result.taxes.paye) {
          doc.text(`Estimated PAYE: ₦${result.taxes.paye.estimatedPAYE.toLocaleString()}`);
        }
        
        doc.moveDown();
        doc.fontSize(12).fillColor('#0B234A').text(`Total Estimated Tax: ₦${(result.totalEstimatedTax || 0).toLocaleString()}`);
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999');
      doc.text('DISCLAIMER: This is an estimate for informational purposes only. Tax calculations may vary based on specific circumstances, exemptions, and current FIRS regulations. Please consult a qualified tax professional or contact FIRS for official tax computation.', { align: 'center' });

      doc.end();
    });

    const pdfUrl = await uploadToSupabase(pdfBuffer, userId, 'tax-summary');

    await saveReportHistory(userId, 'tax-summary', pdfUrl, {
      revenue,
      expenses,
      salaries,
      totalTax: result?.totalEstimatedTax
    });

    res.json({ 
      ok: true, 
      url: pdfUrl,
      reportType: 'tax-summary'
    });
  } catch (error) {
    console.error('Tax summary PDF error:', error);
    res.status(500).json({ error: 'Failed to generate tax summary PDF' });
  }
});

module.exports = router;
