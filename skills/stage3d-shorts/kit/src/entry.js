// KIT / entry. What the page loads. It waits for the fonts, builds the video of the plan it was bundled with, and
// exposes four things to whoever drives the page:
//   window.READY        promise; resolves when the three below exist. A host must wait for it.
//   window.FRAMES       number of frames of the video
//   window.drawFrame(f) paints frame f on the visible canvas (#out)
//   window.renderFrame(f) the same, and returns the frame as a PNG data URL
//   window.PLAN_INFO    frames, fps, camera moves, whips and words (the QA script reads it)
import { canvas } from './core.js';
import { fontsReady } from './fonts.js';
import { createVideo } from './stage.js';
import { drawCaption } from './captions.js';
import { pendingAssets } from './materials.js';
import plan from '@plan';

window.READY = fontsReady.then(() => {
  const video = createVideo(plan);
  const out = document.getElementById('out'), octx = out.getContext('2d');
  window.FRAMES = video.frames; window.PLAN_INFO = video.info;
  window.drawFrame = (f, captions = true) => {
    video.render(Math.max(0, Math.min(video.frames - 1, Math.round(f))));
    octx.drawImage(canvas, 0, 0);
    if (captions) drawCaption(octx, Math.round(f));
  };
  window.renderFrame = (f, captions = true) => { window.drawFrame(f, captions); return out.toDataURL('image/png'); };
  return Promise.all(pendingAssets).then(() => true);      // pictures a plan uses must be loaded before the first frame
});
