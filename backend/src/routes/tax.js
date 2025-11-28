const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

const PIT_BRACKETS = [
  { min: 0, max: 300000, rate: 0.07 },
  { min: 300000, max: 600000, rate: 0.11 },
  { min: 600000, max: 1100000, rate: 0.15 },
  { min: 1100000, max: 1600000, rate: 0.19 },
  { min: 1600000, max: 3200000, rate: 0.21 },
  { min: 3200000, max: Infinity, rate: 0.24 }
];

const CIT_RATES = {
  small: { threshold: 25000000, rate: 0 },
  medium: { threshold: 100000000, rate: 0.20 },
  large: { threshold: Infinity, rate: 0.30 }
};

const VAT_RATE = 0.075;
const VAT_THRESHOLD = 25000000;

function calculatePIT(annualIncome) {
  let tax = 0;
  let remainingIncome = annualIncome;

  for (const bracket of PIT_BRACKETS) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return Math.round(tax);
}

function calculateCIT(annualProfit, companySize = 'auto') {
  if (annualProfit <= 0) return { tax: 0, rate: 0, category: 'loss' };

  let category;
  let rate;

  if (companySize === 'auto') {
    if (annualProfit <= CIT_RATES.small.threshold) {
      category = 'small';
      rate = CIT_RATES.small.rate;
    } else if (annualProfit <= CIT_RATES.medium.threshold) {
      category = 'medium';
      rate = CIT_RATES.medium.rate;
    } else {
      category = 'large';
      rate = CIT_RATES.large.rate;
    }
  } else {
    category = companySize;
    rate = CIT_RATES[companySize]?.rate || CIT_RATES.medium.rate;
  }

  return {
    tax: Math.round(annualProfit * rate),
    rate: rate * 100,
    category
  };
}

function calculateVAT(revenue, isVATRegistered = true) {
  if (!isVATRegistered || revenue < VAT_THRESHOLD) {
    return { vat: 0, applicable: false, reason: 'Below VAT threshold or not registered' };
  }

  return {
    vat: Math.round(revenue * VAT_RATE),
    applicable: true,
    rate: VAT_RATE * 100
  };
}

router.post('/calculate', verifyToken, async (req, res) => {
  const {
    revenue = 0,
    expenses = 0,
    salaries = 0,
    companySize = 'auto',
    isVATRegistered = true,
    calculatePAYE = false
  } = req.body;

  try {
    const revenueNum = Number(revenue) || 0;
    const expensesNum = Number(expenses) || 0;
    const salariesNum = Number(salaries) || 0;

    const profit = revenueNum - expensesNum - salariesNum;

    const citResult = calculateCIT(profit, companySize);

    const vatResult = calculateVAT(revenueNum, isVATRegistered);

    let payeResult = null;
    if (calculatePAYE && salariesNum > 0) {
      payeResult = {
        estimatedPAYE: calculatePIT(salariesNum),
        note: 'PAYE is calculated on individual employee salaries. This is an estimate based on total salaries.'
      };
    }

    const totalTaxLiability = citResult.tax + (calculatePAYE ? (payeResult?.estimatedPAYE || 0) : 0);

    const educationTax = profit > 0 ? Math.round(profit * 0.02) : 0;
    const nitdaLevy = revenueNum >= 100000000 ? Math.round(profit * 0.01) : 0;

    res.json({
      ok: true,
      summary: {
        revenue: revenueNum,
        expenses: expensesNum,
        salaries: salariesNum,
        profit
      },
      taxes: {
        companyIncomeTax: citResult,
        vat: vatResult,
        paye: payeResult,
        educationTax: {
          amount: educationTax,
          rate: 2,
          note: 'Tertiary Education Tax (2% of assessable profit)'
        },
        nitdaLevy: {
          amount: nitdaLevy,
          applicable: revenueNum >= 100000000,
          rate: 1,
          note: 'NITDA Levy (1% of profit before tax for companies with turnover >= ₦100M)'
        }
      },
      totalEstimatedTax: totalTaxLiability + educationTax + nitdaLevy,
      vatCollectable: vatResult.vat,
      disclaimer: 'This is an estimate for informational purposes only. Tax calculations may vary based on specific circumstances, exemptions, and current FIRS regulations. Please consult a qualified tax professional or contact FIRS for official tax computation.'
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate taxes' });
  }
});

router.post('/pit', verifyToken, async (req, res) => {
  const { annualIncome = 0 } = req.body;

  try {
    const income = Number(annualIncome) || 0;
    const tax = calculatePIT(income);
    const effectiveRate = income > 0 ? ((tax / income) * 100).toFixed(2) : 0;

    const breakdown = [];
    let remainingIncome = income;

    for (const bracket of PIT_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      const taxInBracket = taxableInBracket * bracket.rate;

      breakdown.push({
        range: bracket.max === Infinity 
          ? `Above ₦${bracket.min.toLocaleString()}`
          : `₦${bracket.min.toLocaleString()} - ₦${bracket.max.toLocaleString()}`,
        rate: `${(bracket.rate * 100).toFixed(0)}%`,
        taxableAmount: taxableInBracket,
        tax: Math.round(taxInBracket)
      });

      remainingIncome -= taxableInBracket;
    }

    res.json({
      ok: true,
      annualIncome: income,
      totalTax: tax,
      monthlyTax: Math.round(tax / 12),
      effectiveRate: `${effectiveRate}%`,
      breakdown,
      disclaimer: 'This is an estimate based on standard PIT rates. Actual tax may vary based on reliefs, allowances, and other factors. Consult a tax professional for accurate computation.'
    });

  } catch (error) {
    console.error('PIT calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate PIT' });
  }
});

router.get('/rates', verifyToken, async (req, res) => {
  res.json({
    ok: true,
    vat: {
      rate: VAT_RATE * 100,
      threshold: VAT_THRESHOLD,
      description: 'Value Added Tax - applicable to goods and services above threshold'
    },
    cit: {
      small: { ...CIT_RATES.small, rate: CIT_RATES.small.rate * 100 },
      medium: { ...CIT_RATES.medium, rate: CIT_RATES.medium.rate * 100 },
      large: { ...CIT_RATES.large, rate: CIT_RATES.large.rate * 100 },
      description: 'Company Income Tax rates based on company turnover'
    },
    pit: {
      brackets: PIT_BRACKETS.map(b => ({
        range: b.max === Infinity 
          ? `Above ₦${b.min.toLocaleString()}`
          : `₦${b.min.toLocaleString()} - ₦${b.max.toLocaleString()}`,
        rate: `${(b.rate * 100).toFixed(0)}%`
      })),
      description: 'Personal Income Tax progressive brackets'
    },
    other: {
      educationTax: { rate: 2, description: 'Tertiary Education Tax on assessable profit' },
      nitdaLevy: { rate: 1, threshold: 100000000, description: 'NITDA Levy for companies with turnover >= ₦100M' }
    },
    lastUpdated: '2024',
    source: 'FIRS Nigeria'
  });
});

module.exports = router;
