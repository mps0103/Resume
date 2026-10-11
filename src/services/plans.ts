/**
 * What Pro costs and how Play describes it.
 *
 * Deliberately free of react-native and react-native-iap imports so the
 * shape-wrangling below can be tested directly. Play returns products in a
 * nested, platform-specific structure, and picking the wrong node out of it
 * is how an app ends up advertising an introductory price as the headline
 * price — which is a review failure, not a cosmetic bug.
 */

/** A renewing subscription. */
export const SKU_MONTHLY = 'pro_monthly';
/** A one-time, non-consumable purchase. Not a subscription. */
export const SKU_LIFETIME = 'pro_lifetime';

export const SUBSCRIPTION_SKUS = [SKU_MONTHLY];
export const ONE_TIME_SKUS = [SKU_LIFETIME];
export const SKUS = [...SUBSCRIPTION_SKUS, ...ONE_TIME_SKUS];

export type PlanKind = 'subscription' | 'lifetime';

export interface Plan {
  sku: string;
  kind: PlanKind;
  name: string;
  /** Localised price string straight from Play, never computed here. */
  price: string;
  /** "per month", or "one time" for the lifetime purchase. */
  period: string;
  offerToken?: string;
}

/**
 * How these two products must be configured in the Play Console.
 *
 * Nothing reads these to render a price — the UI only ever shows what Play
 * returns, so the price is right in every country and currency, and stays
 * right when it changes. This exists so the intended pricing is written down
 * in one place next to the code that depends on the products existing, and
 * so a test can assert the lifetime price is worth offering at all.
 */
export const INTENDED_PRICING = {
  [SKU_MONTHLY]: {
    type: 'subscription' as const,
    /** Play billing period code for one month. */
    billingPeriod: 'P1M',
    amount: 99,
    currency: 'INR',
  },
  [SKU_LIFETIME]: {
    type: 'one-time' as const,
    amount: 999,
    currency: 'INR',
  },
};

/** How many months of the subscription the lifetime price is worth. */
export function lifetimeBreakEvenMonths(): number {
  return INTENDED_PRICING[SKU_LIFETIME].amount / INTENDED_PRICING[SKU_MONTHLY].amount;
}

export function planKind(sku: string): PlanKind | null {
  if (SUBSCRIPTION_SKUS.includes(sku)) return 'subscription';
  if (ONE_TIME_SKUS.includes(sku)) return 'lifetime';
  return null;
}

function periodLabel(billingPeriod: unknown): string {
  switch (billingPeriod) {
    case 'P1Y':
      return 'per year';
    case 'P1W':
      return 'per week';
    default:
      return 'per month';
  }
}

/**
 * Turns whatever Play returned into the two rows the paywall shows.
 *
 * A product with no usable price is dropped rather than rendered blank: a
 * plan row with an empty price is worse than one missing row, because it is
 * still tappable and still starts a purchase.
 */
export function normalisePlans(products: unknown[]): Plan[] {
  const out: Plan[] = [];

  for (const raw of products ?? []) {
    const product = raw as any;
    const sku: string = product?.id ?? '';
    const kind = planKind(sku);
    if (!kind) continue;

    if (kind === 'subscription') {
      const offer = product?.subscriptionOfferDetailsAndroid?.[0];
      // The FIRST pricing phase is the headline price. Later phases are the
      // trial or introductory rate, and quoting one of those as the price is
      // exactly what gets a subscription app rejected.
      const phase = offer?.pricingPhases?.pricingPhaseList?.[0];
      const price = phase?.formattedPrice;
      if (!price) continue;
      out.push({
        sku,
        kind,
        name: 'Monthly',
        price,
        period: periodLabel(phase?.billingPeriod),
        offerToken: offer?.offerToken,
      });
    } else {
      // A one-time product has no offer or phase list at all; its localised
      // price is the top-level displayPrice.
      const price = product?.displayPrice;
      if (!price) continue;
      out.push({ sku, kind, name: 'Lifetime', price, period: 'one time, no renewal' });
    }
  }

  // Monthly first as the lower commitment, lifetime second as the upsell.
  return out.sort((a, b) => Number(a.kind === 'lifetime') - Number(b.kind === 'lifetime'));
}

/**
 * Which plan to preselect. The lifetime one, when it is there: it is the
 * better deal for anyone who keeps the app past ten months, and it is the
 * one a user is least likely to find on their own.
 */
export function defaultPlan(plans: Plan[]): Plan | null {
  return plans.find(p => p.kind === 'lifetime') ?? plans[0] ?? null;
}
