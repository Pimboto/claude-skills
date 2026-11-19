import { lazy, Suspense, useEffect, useState } from 'react';

// metal-fx's shine (WebGL) on a button. The button itself is in the page's HTML from the start; the shine
// (a large library) loads after the page is up and wraps it then. Only with a mouse: the shine follows the cursor,
// and on phones, which have none, its shader build would only hold up the page.
const MetalFx = lazy(() => import('metal-fx').then((m) => ({ default: m.MetalFx })));

export default function Metal({ children, ...props }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    const id = idle(() => setOn(true));
    return () => (window.cancelIdleCallback || clearTimeout)(id);
  }, []);
  if (!on) return children;
  return <Suspense fallback={children}><MetalFx {...props}>{children}</MetalFx></Suspense>;
}
