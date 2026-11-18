// KIT / fonts. The font travels inside the bundle. A machine without Inter installed would otherwise draw every word
// in a fallback serif font (it happened on Pimbo's PC, 2026-11-11). The two weights the kit uses are embedded as data
// and registered under their own family name, so an installed Inter can never take their place.
import INTER_600 from './fonts/Inter-SemiBold.otf';
import INTER_700 from './fonts/Inter-Bold.otf';

export const FONT = 'Stage3D Inter';
// Text sizes are measured when a scene is built, so nothing that draws text may run before this promise resolves.
export const fontsReady = Promise.all([[INTER_600, '600'], [INTER_700, '700']].map(([url, weight]) =>
  new FontFace(FONT, `url(${url})`, { weight }).load().then((face) => document.fonts.add(face))));
