import { lazy, Suspense, useEffect, useState } from 'react';
import { introDone } from '../intro.js';

// metal-fx's shine (WebGL) on a button. The button itself is in the page's HTML from the start; the shine
// (a large library) loads after the page is up and wraps it then. Only with a mouse: the shine follows the cursor,
// and on phones, which have none, its shader build would only hold up the page. Never during the intro either.
const MetalFx = lazy(() => import('metal-fx').then((m) => ({ default: m.MetalFx })));

export default function Metal({ children, ...props }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    let gone = false;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    introDone.then(() => idle(() => { if (!gone) setOn(true); }));
    return () => { gone = true; };
  }, []);
  if (!on) return children;
  return <Suspense fallback={children}><MetalFx {...props}>{children}</MetalFx></Suspense>;
}
