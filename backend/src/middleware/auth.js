const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'maica_secret_key';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    } catch (error) {
    }
  }
  next();
}

async function verifyPremium(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, allowing access');
      return next();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, trial_ends_at')
      .eq('id', req.userId)
      .single();

    if (!profile) {
      return res.status(403).json({ error: 'Premium subscription required', code: 'PREMIUM_REQUIRED' });
    }

    const isPremium = profile.subscription_plan === 'premium';
    const isInTrial = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();

    if (isPremium || isInTrial) {
      req.subscriptionPlan = profile.subscription_plan;
      req.isTrialActive = isInTrial;
      return next();
    }

    return res.status(403).json({ error: 'Premium subscription required', code: 'PREMIUM_REQUIRED' });
  } catch (error) {
    console.error('Subscription check error:', error);
    return next();
  }
}

async function verifyStandardOrAbove(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      return next();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan, trial_ends_at')
      .eq('id', req.userId)
      .single();

    if (!profile) {
      return res.status(403).json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' });
    }

    const hasPaidPlan = ['standard', 'premium'].includes(profile.subscription_plan);
    const isInTrial = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();

    if (hasPaidPlan || isInTrial) {
      req.subscriptionPlan = profile.subscription_plan;
      req.isTrialActive = isInTrial;
      return next();
    }

    return res.status(403).json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' });
  } catch (error) {
    console.error('Subscription check error:', error);
    return next();
  }
}

module.exports = { verifyToken, optionalAuth, verifyPremium, verifyStandardOrAbove };
