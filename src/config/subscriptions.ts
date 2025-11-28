export const SUBSCRIPTION_PLANS = {
  basic_monthly: {
    flutterwave_plan_code: "PLN_axn2kuzgf8ua6xy",
    flutterwave_plan_id: "227641",
    paystack_plan_code: "PLN_r9u4svqjmc2zht4",
    amount: 2500,
    interval: "monthly",
    tier: "basic"
  },
  basic_yearly: {
    flutterwave_plan_code: "PLN_15tkgz8cgoa5ihs",
    flutterwave_plan_id: "227642",
    paystack_plan_code: "PLN_15tkgz8cgoa5ihs",
    amount: 30000,
    interval: "annually",
    tier: "basic"
  },
  premium_monthly: {
    flutterwave_plan_code: "PLN_r9u4svqjmc2zht4",
    flutterwave_plan_id: "227643",
    paystack_plan_code: "PLN_r9u4svqjmc2zht4",
    amount: 5000,
    interval: "monthly",
    tier: "premium"
  },
  premium_yearly: {
    flutterwave_plan_code: "PLN_xkoun1twxeic019",
    flutterwave_plan_id: "227644",
    paystack_plan_code: "PLN_xkoun1twxeic019",
    amount: 50000,
    interval: "annually",
    tier: "premium"
  }
};

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;
export type PlanInterval = "monthly" | "annually";
export type PlanTier = "basic" | "premium";

export function getPlanByKey(key: PlanKey) {
  return SUBSCRIPTION_PLANS[key];
}

export function formatPlanAmount(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export default SUBSCRIPTION_PLANS;
