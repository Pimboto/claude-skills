// Build-time rendering (tools/prerender.mjs): the page's HTML in each language, and the intro layer.
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import App from './App.jsx';
import Intro from './components/Intro.jsx';
import { setRenderLang, HEAD } from './i18n.js';

export function render(lang) {
  setRenderLang(lang);
  return { app: renderToString(<App />), head: HEAD[lang] };
}
export const renderIntro = () => renderToStaticMarkup(<Intro />);
