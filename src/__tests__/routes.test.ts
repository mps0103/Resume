import { previousRoute, type Route } from '../navigation/routes';

describe('hardware back navigation', () => {
  it('lets the app close from home', () => {
    // Returning null is what tells the handler to fall through to Android.
    // Anything else here would trap the user inside the app.
    expect(previousRoute({ name: 'home' })).toBeNull();
  });

  it('leaves settings for home', () => {
    expect(previousRoute({ name: 'settings' })).toEqual({ name: 'home' });
  });

  it('leaves the editor for home', () => {
    expect(previousRoute({ name: 'editor', resumeId: 'r1' })).toEqual({ name: 'home' });
  });

  it.each(['section', 'preview', 'templates'] as const)(
    'returns to the editor from %s, keeping the resume',
    name => {
      const route = { name, resumeId: 'r1', sectionId: 's1' } as Route;
      expect(previousRoute(route)).toEqual({ name: 'editor', resumeId: 'r1' });
    },
  );

  it('returns to the gallery from style, not to the editor', () => {
    // Style is opened from the gallery, so skipping back past it would drop
    // the user two screens instead of one.
    expect(previousRoute({ name: 'style', resumeId: 'r1' })).toEqual({
      name: 'templates',
      resumeId: 'r1',
    });
  });

  it('returns the paywall to wherever it was opened from', () => {
    const from: Route = { name: 'templates', resumeId: 'r1' };
    expect(previousRoute({ name: 'paywall', from })).toEqual(from);
  });

  it('unwinds a paywall opened from a nested screen one step at a time', () => {
    const editor: Route = { name: 'editor', resumeId: 'r1' };
    const paywall: Route = { name: 'paywall', from: editor };
    expect(previousRoute(paywall)).toEqual(editor);
    expect(previousRoute(editor)).toEqual({ name: 'home' });
    expect(previousRoute({ name: 'home' })).toBeNull();
  });

  it('always terminates at home rather than looping', () => {
    const starts: Route[] = [
      { name: 'settings' },
      { name: 'editor', resumeId: 'r1' },
      { name: 'section', resumeId: 'r1', sectionId: 's1' },
      { name: 'preview', resumeId: 'r1' },
      { name: 'templates', resumeId: 'r1' },
      { name: 'style', resumeId: 'r1' },
      { name: 'paywall', from: { name: 'style', resumeId: 'r1' } },
    ];

    for (const start of starts) {
      let route: Route | null = start;
      let hops = 0;
      while (route && hops < 10) {
        route = previousRoute(route);
        hops++;
      }
      expect(route).toBeNull();
      expect(hops).toBeLessThan(10);
    }
  });
});
