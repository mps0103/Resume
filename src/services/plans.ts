/**
 * What Pro costs and how Play describes it.
 *
 * Deliberately free of react-native and react-native-iap imports so the
 * shape-wrangling below can be tested directly. Play returns products in a
 * nested, platform-specific structure, and picking the wrong node out of it
 * is how an app ends up advertising an introductory price as the headline
 * price — which is a review failure, not a cosmetic bug.
 *
 * There is exactly ONE product: a monthly subscription. A lifetime one-time
 * purchase used to sit beside it and has been removed deliberately — not
 * just hidden. The SKU is gone, the in-app purchase flow is gone, and
 * restore no longer looks for a non-consumable. If a lifetime tier is ever
 * wanted again it should come back as a considered change, not as a
 * commented-out branch that quietly half-works.
 */

/** The only product. A renewing subscription. */
export const SKU_MONTHLY = 'pro_monthly';

export const SUBSCRIPTION_SKUS = [SKU_MONTHLY];
export const SKUS = [...SUBSCRIPTION_SKUS];

export type PlanKind = 'subscription';

export interface Plan {
  sku: string;
  kind: PlanKind;
  name: string;
  /** Localised price string straight from Play, never computed here. */
  price: string;
  /** "per month". */
  period: string;
  offerToken?: string;
}

/**
 * How the product must be configured in the Play Console.
 *
 * Nothing reads this to render a price — the UI only ever shows what Play
 * returns, so the price is right in every country and currency, and stays
 * right when it changes. It exists so the intended pricing is written down
 * next to the code that depends on the product existing.
 */
export const INTENDED_PRICING = {
  [SKU_MONTHLY]: {
    type: 'subscription' as const,
    /** Play billing period code for one month. */
    billingPeriod: 'P1M',
    amount: 199,
    currency: 'INR',
  },
};

export function planKind(sku: string): PlanKind | null {
  return SUBSCRIPTION_SKUS.includes(sku) ? 'subscription' : null;
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
 * Turns whatever Play returned into the row the paywall shows.
 *
 * A product with no usable price is dropped rather than rendered blank: a
 * plan row with an empty price is worse than no row, because it is still
 * tappable and still starts a purchase.
 */
export function normalisePlans(products: unknown[]): Plan[] {
  const out: Plan[] = [];

  for (const raw of products ?? []) {
    const product = raw as any;
    const sku: string = product?.id ?? '';
    if (!planKind(sku)) continue;

    const offer = product?.subscriptionOfferDetailsAndroid?.[0];
    // The FIRST pricing phase is the headline price. Later phases are the
    // trial or introductory rate, and quoting one of those as the price is
    // exactly what gets a subscription app rejected.
    const phase = offer?.pricingPhases?.pricingPhaseList?.[0];
    const price = phase?.formattedPrice;
    if (!price) continue;

    out.push({
      sku,
      kind: 'subscription',
      name: 'Monthly',
      price,
      period: periodLabel(phase?.billingPeriod),
      offerToken: offer?.offerToken,
    });
  }

  return out;
}

/** With a single product this is just the first usable one, or nothing. */
export function defaultPlan(plans: Plan[]): Plan | null {
  return plans[0] ?? null;
}
