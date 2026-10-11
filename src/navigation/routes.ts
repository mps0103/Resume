/**
 * The router's shape, and the one rule the hardware back button needs.
 *
 * Kept out of App.tsx and free of react-native imports so `previousRoute` can
 * be tested directly. Back navigation is the kind of thing that is only
 * noticed when it is wrong — and when it is wrong on Android, the app closes
 * and the user loses their place.
 */

export type Route =
  | { name: 'home' }
  | { name: 'editor'; resumeId: string }
  | { name: 'section'; resumeId: string; sectionId: string }
  | { name: 'preview'; resumeId: string }
  | { name: 'templates'; resumeId: string }
  | { name: 'style'; resumeId: string }
  | { name: 'settings' }
  | { name: 'paywall'; from: Route };

/**
 * Where back goes from each screen, or null when there is nowhere left to go
 * and Android should be allowed to close the app.
 *
 * This deliberately mirrors the on-screen Back control on every screen. Two
 * different answers for "back" — one for the header, one for the system
 * button — is the kind of inconsistency users feel without being able to name.
 */
export function previousRoute(route: Route): Route | null {
  switch (route.name) {
    case 'home':
      // Nothing above home; returning null lets the app exit as Android
      // users expect, rather than trapping them in it.
      return null;
    case 'settings':
      return { name: 'home' };
    case 'paywall':
      // Back out to wherever the paywall was opened from, so a user who
      // declines Pro lands back on the screen they were working on.
      return route.from;
    case 'editor':
      return { name: 'home' };
    case 'section':
    case 'preview':
    case 'templates':
      return { name: 'editor', resumeId: route.resumeId };
    case 'style':
      return { name: 'templates', resumeId: route.resumeId };
  }
}
