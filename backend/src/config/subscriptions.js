const SUBSCRIPTION_PLANS = {
  basic_monthly: {
    flutterwave_plan_code: "PLN_axn2kuzgf8ua6xy",
    flutterwave_plan_id: "227641",
    paystack_plan_code: "PLN_r9u4svqjmc2zht4",
    amount: 2500,
    interval: "monthly"
  },
  basic_yearly: {
    flutterwave_plan_code: "PLN_15tkgz8cgoa5ihs",
    flutterwave_plan_id: "227642",
    paystack_plan_code: "PLN_15tkgz8cgoa5ihs",
    amount: 30000,
    interval: "annually"
  },
  premium_monthly: {
    flutterwave_plan_code: "PLN_r9u4svqjmc2zht4",
    flutterwave_plan_id: "227643",
    paystack_plan_code: "PLN_r9u4svqjmc2zht4",
    amount: 5000,
    interval: "monthly"
  },
  premium_yearly: {
    flutterwave_plan_code: "PLN_xkoun1twxeic019",
    flutterwave_plan_id: "227644",
    paystack_plan_code: "PLN_xkoun1twxeic019",
    amount: 50000,
    interval: "annually"
  }
};

function getPlanByKey(planKey) {
  return SUBSCRIPTION_PLANS[planKey] || null;
}

function getPlanByFlutterwaveId(planId) {
  return Object.entries(SUBSCRIPTION_PLANS).find(
    ([_, plan]) => plan.flutterwave_plan_id === planId
  );
}

function getPlanByPaystackCode(planCode) {
  return Object.entries(SUBSCRIPTION_PLANS).find(
    ([_, plan]) => plan.paystack_plan_code === planCode
  );
}

function formatCurrency(amount) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function validateAmount(amount, planKey) {
  const plan = SUBSCRIPTION_PLANS[planKey];
  if (!plan) return false;
  return plan.amount === amount;
}

module.exports = {
  SUBSCRIPTION_PLANS,
  getPlanByKey,
  getPlanByFlutterwaveId,
  getPlanByPaystackCode,
  formatCurrency,
  validateAmount
};
