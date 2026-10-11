import {
  INTENDED_PRICING,
  SKU_LIFETIME,
  SKU_MONTHLY,
  SKUS,
  defaultPlan,
  lifetimeBreakEvenMonths,
  normalisePlans,
  planKind,
} from '../services/plans';

/** The shape Play returns for a subscription, trimmed to what we read. */
function playSubscription(
  phases: { formattedPrice: string; billingPeriod: string }[],
  offerToken = 'token-abc',
) {
  return {
    id: SKU_MONTHLY,
    subscriptionOfferDetailsAndroid: [
      { offerToken, pricingPhases: { pricingPhaseList: phases } },
    ],
  };
}

function playOneTime(displayPrice: string | undefined) {
  return { id: SKU_LIFETIME, displayPrice };
}

const LIFETIME = () => playOneTime('₹999.00');

describe('product catalogue', () => {
  it('offers a subscription and a one-time purchase, not two subscriptions', () => {
    expect(planKind(SKU_MONTHLY)).toBe('subscription');
    expect(planKind(SKU_LIFETIME)).toBe('lifetime');
    expect(SKUS).toEqual([SKU_MONTHLY, SKU_LIFETIME]);
  });

  it('ignores a sku the app does not sell', () => {
    expect(planKind('pro_yearly')).toBeNull();
  });
});

describe('intended pricing', () => {
  it('is 99 a month and 999 once, in rupees', () => {
    expect(INTENDED_PRICING[SKU_MONTHLY].amount).toBe(99);
    expect(INTENDED_PRICING[SKU_MONTHLY].currency).toBe('INR');
    expect(INTENDED_PRICING[SKU_MONTHLY].billingPeriod).toBe('P1M');
    expect(INTENDED_PRICING[SKU_LIFETIME].amount).toBe(999);
    expect(INTENDED_PRICING[SKU_LIFETIME].currency).toBe('INR');
  });

  it('prices lifetime as a real discount, not a rounding of the monthly', () => {
    // Under about six months it is not worth calling lifetime; much past a
    // year and nobody takes it. Ten-ish months is the sweet spot.
    const months = lifetimeBreakEvenMonths();
    expect(months).toBeGreaterThan(6);
    expect(months).toBeLessThan(18);
  });

  it('declares lifetime as one-time, which is what stops it renewing', () => {
    // If this were configured as a subscription in the Play Console, the
    // user would be charged 999 again a month later.
    expect(INTENDED_PRICING[SKU_LIFETIME].type).toBe('one-time');
    expect(INTENDED_PRICING[SKU_MONTHLY].type).toBe('subscription');
  });
});

describe('normalisePlans', () => {
  it('reads the localised price and offer token off a subscription', () => {
    const [plan] = normalisePlans([
      playSubscription([{ formattedPrice: '₹99.00', billingPeriod: 'P1M' }]),
    ]);
    expect(plan).toMatchObject({
      sku: SKU_MONTHLY,
      kind: 'subscription',
      name: 'Monthly',
      price: '₹99.00',
      period: 'per month',
      offerToken: 'token-abc',
    });
  });

  it('quotes the headline price, never the introductory one', () => {
    // Play puts the trial or intro phase first only when it applies to this
    // user; the list is ordered, and phase 0 is what they pay now. Showing a
    // later phase as the headline price is a store-review failure.
    const [plan] = normalisePlans([
      playSubscription([
        { formattedPrice: '₹99.00', billingPeriod: 'P1M' },
        { formattedPrice: '₹149.00', billingPeriod: 'P1M' },
      ]),
    ]);
    expect(plan.price).toBe('₹99.00');
  });

  it('reads displayPrice for the one-time product, which has no phases', () => {
    const [plan] = normalisePlans([LIFETIME()]);
    expect(plan).toMatchObject({
      sku: SKU_LIFETIME,
      kind: 'lifetime',
      name: 'Lifetime',
      price: '₹999.00',
    });
    expect(plan.period).toContain('one time');
    expect(plan.offerToken).toBeUndefined();
  });

  it('never describes the lifetime purchase as renewing', () => {
    const [plan] = normalisePlans([LIFETIME()]);
    expect(plan.period).not.toMatch(/per (month|year|week)/);
  });

  it('drops a product with no usable price rather than showing a blank row', () => {
    // A blank but tappable plan row still starts a purchase, which is worse
    // than the row being absent.
    expect(normalisePlans([playOneTime(undefined)])).toEqual([]);
    expect(normalisePlans([playSubscription([])])).toEqual([]);
  });

  it('ignores anything that is not one of our two products', () => {
    expect(normalisePlans([{ id: 'some_other_app_sku', displayPrice: '₹10' }])).toEqual([]);
  });

  it('survives whatever Play hands back', () => {
    expect(normalisePlans([])).toEqual([]);
    expect(normalisePlans([null, undefined, {}, { id: SKU_MONTHLY }])).toEqual([]);
  });

  it('puts monthly first and lifetime second whatever the input order', () => {
    const plans = normalisePlans([
      LIFETIME(),
      playSubscription([{ formattedPrice: '₹99.00', billingPeriod: 'P1M' }]),
    ]);
    expect(plans.map(p => p.kind)).toEqual(['subscription', 'lifetime']);
  });
});

describe('defaultPlan', () => {
  it('preselects lifetime when it is available', () => {
    const plans = normalisePlans([
      playSubscription([{ formattedPrice: '₹99.00', billingPeriod: 'P1M' }]),
      LIFETIME(),
    ]);
    expect(defaultPlan(plans)?.kind).toBe('lifetime');
  });

  it('falls back to whatever loaded when lifetime is missing', () => {
    const plans = normalisePlans([
      playSubscription([{ formattedPrice: '₹99.00', billingPeriod: 'P1M' }]),
    ]);
    expect(defaultPlan(plans)?.sku).toBe(SKU_MONTHLY);
  });

  it('returns null rather than throwing when nothing loaded', () => {
    expect(defaultPlan([])).toBeNull();
  });
});
