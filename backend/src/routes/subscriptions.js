const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fetch = require('node-fetch');
const { supabase } = require('../utils/supabaseClient');
const {
  SUBSCRIPTION_PLANS,
  getPlanByKey,
  getPlanByFlutterwaveId,
  getPlanByPaystackCode,
  formatCurrency,
  validateAmount
} = require('../config/subscriptions');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
const TEST_MODE = process.env.PAYMENT_TEST_MODE === 'true';

function createSuccessResponse(data, message = 'Success') {
  return { success: true, message, data };
}

function createErrorResponse(message, code = 'ERROR') {
  return { success: false, error: { code, message } };
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'maica-secret-key');
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json(createErrorResponse('Invalid token', 'INVALID_TOKEN'));
  }
}

router.get('/plans', (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    key,
    ...plan,
    formattedAmount: formatCurrency(plan.amount)
  }));
  res.json(createSuccessResponse(plans, 'Plans retrieved successfully'));
});

router.post('/create', verifyToken, async (req, res) => {
  try {
    const { planKey, provider, email, callbackUrl } = req.body;
    const userId = req.userId;

    if (!planKey || !provider || !email) {
      return res.status(400).json(createErrorResponse('Missing required fields: planKey, provider, email', 'MISSING_FIELDS'));
    }

    const plan = getPlanByKey(planKey);
    if (!plan) {
      return res.status(400).json(createErrorResponse('Invalid plan key', 'INVALID_PLAN'));
    }

    if (provider === 'paystack') {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: plan.amount * 100,
          plan: plan.paystack_plan_code,
          callback_url: callbackUrl || `${process.env.APP_URL}/subscription/callback`,
          metadata: {
            user_id: userId,
            plan_key: planKey,
            test_mode: TEST_MODE
          }
        })
      });
      
      const data = await response.json();
      if (data.status) {
        return res.json(createSuccessResponse({
          authorizationUrl: data.data.authorization_url,
          reference: data.data.reference,
          accessCode: data.data.access_code,
          provider: 'paystack'
        }, 'Payment initialized'));
      } else {
        return res.status(400).json(createErrorResponse(data.message || 'Paystack initialization failed', 'PAYSTACK_ERROR'));
      }
    } else if (provider === 'flutterwave') {
      const txRef = `MAICA-${Date.now()}-${userId}`;
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: plan.amount,
          currency: 'NGN',
          redirect_url: callbackUrl || `${process.env.APP_URL}/subscription/callback`,
          payment_plan: plan.flutterwave_plan_id,
          customer: { email },
          meta: {
            user_id: userId,
            plan_key: planKey,
            test_mode: TEST_MODE
          },
          customizations: {
            title: 'MaiCa Subscription',
            description: `${planKey.replace('_', ' ')} subscription`
          }
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        return res.json(createSuccessResponse({
          authorizationUrl: data.data.link,
          reference: txRef,
          provider: 'flutterwave'
        }, 'Payment initialized'));
      } else {
        return res.status(400).json(createErrorResponse(data.message || 'Flutterwave initialization failed', 'FLUTTERWAVE_ERROR'));
      }
    } else {
      return res.status(400).json(createErrorResponse('Invalid provider. Use paystack or flutterwave', 'INVALID_PROVIDER'));
    }
  } catch (error) {
    console.error('Subscription create error:', error);
    return res.status(500).json(createErrorResponse('Failed to create subscription', 'SERVER_ERROR'));
  }
});

router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { reference, provider } = req.query;
    const userId = req.userId;

    if (!reference || !provider) {
      return res.status(400).json(createErrorResponse('Missing reference or provider', 'MISSING_FIELDS'));
    }

    if (provider === 'paystack') {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });
      
      const data = await response.json();
      if (data.status && data.data.status === 'success') {
        const planKey = data.data.metadata?.plan_key;
        const plan = getPlanByKey(planKey);
        
        if (!validateAmount(data.data.amount / 100, planKey)) {
          return res.status(400).json(createErrorResponse('Amount mismatch', 'AMOUNT_MISMATCH'));
        }

        await assignPlanToUser(userId, planKey, plan, 'paystack', reference);
        
        return res.json(createSuccessResponse({
          status: 'active',
          planKey,
          amount: formatCurrency(plan.amount),
          interval: plan.interval,
          provider: 'paystack'
        }, 'Subscription verified and activated'));
      } else {
        return res.status(400).json(createErrorResponse('Payment verification failed', 'VERIFICATION_FAILED'));
      }
    } else if (provider === 'flutterwave') {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
        }
      });
      
      const data = await response.json();
      if (data.status === 'success' && data.data.status === 'successful') {
        const planKey = data.data.meta?.plan_key;
        const plan = getPlanByKey(planKey);
        
        if (!validateAmount(data.data.amount, planKey)) {
          return res.status(400).json(createErrorResponse('Amount mismatch', 'AMOUNT_MISMATCH'));
        }

        await assignPlanToUser(userId, planKey, plan, 'flutterwave', reference);
        
        return res.json(createSuccessResponse({
          status: 'active',
          planKey,
          amount: formatCurrency(plan.amount),
          interval: plan.interval,
          provider: 'flutterwave'
        }, 'Subscription verified and activated'));
      } else {
        return res.status(400).json(createErrorResponse('Payment verification failed', 'VERIFICATION_FAILED'));
      }
    } else {
      return res.status(400).json(createErrorResponse('Invalid provider', 'INVALID_PROVIDER'));
    }
  } catch (error) {
    console.error('Subscription verify error:', error);
    return res.status(500).json(createErrorResponse('Failed to verify subscription', 'SERVER_ERROR'));
  }
});

async function assignPlanToUser(userId, planKey, plan, provider, reference) {
  const now = new Date();
  let expiresAt;
  
  if (plan.interval === 'monthly') {
    expiresAt = new Date(now.setMonth(now.getMonth() + 1));
  } else if (plan.interval === 'annually') {
    expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_plan: planKey,
      subscription_status: 'active',
      subscription_provider: provider,
      subscription_reference: reference,
      subscription_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user subscription:', error);
    throw new Error('Failed to assign plan to user');
  }

  await supabase
    .from('subscription_history')
    .insert({
      user_id: userId,
      plan_key: planKey,
      amount: plan.amount,
      provider,
      reference,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    });

  return true;
}

router.post('/webhook/paystack', async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json(createErrorResponse('Invalid signature', 'INVALID_SIGNATURE'));
    }

    const event = req.body;
    
    if (event.event === 'subscription.create' || event.event === 'charge.success') {
      const data = event.data;
      const userId = data.metadata?.user_id;
      const planKey = data.metadata?.plan_key;
      const plan = getPlanByKey(planKey);
      
      if (userId && plan) {
        await assignPlanToUser(userId, planKey, plan, 'paystack', data.reference);
      }
    } else if (event.event === 'subscription.disable') {
      const userId = event.data.metadata?.user_id;
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json(createErrorResponse('Webhook processing failed', 'WEBHOOK_ERROR'));
  }
});

router.post('/webhook/flutterwave', async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = req.headers['verif-hash'];
    
    if (!signature || signature !== secretHash) {
      return res.status(401).json(createErrorResponse('Invalid signature', 'INVALID_SIGNATURE'));
    }

    const event = req.body;
    
    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const data = event.data;
      const userId = data.meta?.user_id;
      const planKey = data.meta?.plan_key;
      const plan = getPlanByKey(planKey);
      
      if (userId && plan) {
        await assignPlanToUser(userId, planKey, plan, 'flutterwave', data.tx_ref);
      }
    } else if (event.event === 'subscription.cancelled') {
      const userId = event.data.meta?.user_id;
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    res.status(500).json(createErrorResponse('Webhook processing failed', 'WEBHOOK_ERROR'));
  }
});

router.get('/status', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_plan, subscription_status, subscription_expires_at, subscription_provider')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
    }

    const plan = getPlanByKey(data.subscription_plan);
    const isExpired = data.subscription_expires_at && new Date(data.subscription_expires_at) < new Date();
    
    res.json(createSuccessResponse({
      planKey: data.subscription_plan,
      status: isExpired ? 'expired' : (data.subscription_status || 'none'),
      expiresAt: data.subscription_expires_at,
      provider: data.subscription_provider,
      planDetails: plan ? {
        amount: formatCurrency(plan.amount),
        interval: plan.interval
      } : null
    }, 'Subscription status retrieved'));
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json(createErrorResponse('Failed to get subscription status', 'SERVER_ERROR'));
  }
});

router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json(createErrorResponse('Failed to cancel subscription', 'CANCEL_ERROR'));
    }

    res.json(createSuccessResponse({ status: 'cancelled' }, 'Subscription cancelled'));
  } catch (error) {
    console.error('Subscription cancel error:', error);
    res.status(500).json(createErrorResponse('Failed to cancel subscription', 'SERVER_ERROR'));
  }
});

module.exports = router;
