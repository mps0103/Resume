import {
  INTENDED_PRICING,
  SKU_MONTHLY,
  SKUS,
  defaultPlan,
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

describe('product catalogue', () => {
  it('sells exactly one product', () => {
    expect(SKUS).toEqual([SKU_MONTHLY]);
    expect(planKind(SKU_MONTHLY)).toBe('subscription');
  });

  /**
   * A lifetime one-time purchase used to sit beside the subscription and
   * was removed on purpose. This pins the removal: leaving the sku
   * recognised would mean a user who bought it previously still resolves to
   * a plan the paywall can no longer price or describe.
   */
  it('no longer recognises the withdrawn lifetime product', () => {
    expect(planKind('pro_lifetime')).toBeNull();
    expect(SKUS).not.toContain('pro_lifetime');
  });

  it('ignores a sku the app does not sell', () => {
    expect(planKind('pro_yearly')).toBeNull();
  });
});

describe('intended pricing', () => {
  it('is 199 rupees a month', () => {
    expect(INTENDED_PRICING[SKU_MONTHLY].amount).toBe(199);
    expect(INTENDED_PRICING[SKU_MONTHLY].currency).toBe('INR');
  });

  /**
   * P1M is what makes it monthly. A wrong period code here means the Play
   * Console product is set up to charge 199 on some other cycle, and the
   * mistake is invisible until someone is billed.
   */
  it('declares a monthly subscription, not a one-off', () => {
    expect(INTENDED_PRICING[SKU_MONTHLY].billingPeriod).toBe('P1M');
    expect(INTENDED_PRICING[SKU_MONTHLY].type).toBe('subscription');
  });
});

describe('normalisePlans', () => {
  it('reads the localised price and offer token off a subscription', () => {
    const [plan] = normalisePlans([
      playSubscription([{ formattedPrice: '₹199.00', billingPeriod: 'P1M' }]),
    ]);
    expect(plan).toMatchObject({
      sku: SKU_MONTHLY,
      kind: 'subscription',
      name: 'Monthly',
      price: '₹199.00',
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
        { formattedPrice: '₹199.00', billingPeriod: 'P1M' },
        { formattedPrice: '₹249.00', billingPeriod: 'P1M' },
      ]),
    ]);
    expect(plan.price).toBe('₹199.00');
  });

  it('always describes it as renewing', () => {
    const [plan] = normalisePlans([
      playSubscription([{ formattedPrice: '₹199.00', billingPeriod: 'P1M' }]),
    ]);
    expect(plan.period).toBe('per month');
  });

  it('drops a product with no usable price rather than showing a blank row', () => {
    // A blank but tappable plan row still starts a purchase, which is worse
    // than the row being absent.
    expect(normalisePlans([playSubscription([])])).toEqual([]);
  });

  it('ignores the withdrawn lifetime product if Play still returns it', () => {
    // Play keeps returning a non-consumed one-time product forever, so an
    // old purchase can still come back in the catalogue after the product
    // is pulled. It must not render as a plan.
    expect(
      normalisePlans([{ id: 'pro_lifetime', displayPrice: '₹999.00' }]),
    ).toEqual([]);
  });

  it('ignores anything that is not our product', () => {
    expect(
      normalisePlans([{ id: 'some_other_app_sku', displayPrice: '₹10' }]),
    ).toEqual([]);
  });

  it('survives whatever Play hands back', () => {
    expect(normalisePlans([])).toEqual([]);
    expect(normalisePlans([null, undefined, {}, { id: SKU_MONTHLY }])).toEqual([]);
  });
});

describe('defaultPlan', () => {
  it('selects the only plan there is', () => {
    const plans = normalisePlans([
      playSubscription([{ formattedPrice: '₹199.00', billingPeriod: 'P1M' }]),
    ]);
    expect(defaultPlan(plans)?.sku).toBe(SKU_MONTHLY);
  });

  it('returns null rather than throwing when nothing loaded', () => {
    expect(defaultPlan([])).toBeNull();
  });
});
