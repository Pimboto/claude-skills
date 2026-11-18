// PNG frames + the plan's audio -> MP4.
//   node scripts/encode.cjs <plan>     -> out/<plan>/<plan>.mp4
//   node scripts/encode.cjs <plan> --audio=audio_no_music.wav --name=<plan>_no_music
//        another audio file of the plan folder and another name for the MP4 (a version without music, for example)
// The scale filter converts the colours with the BT.709 matrix, which is the one the file is tagged with. Without it
// ffmpeg converts with BT.601 and gold comes out a little orange (it happened in the first five clips).
// The video keeps its own length: a short audio is padded with silence, a long one is cut.
const { spawnSync } = require('child_process'); const fs = require('fs'), path = require('path');
const KIT = path.join(__dirname, '..'), plan = process.argv[2];
const opt = (key, fallback) => { const a = process.argv.find((v) => v.startsWith(`--${key}=`)); return a ? a.split('=')[1] : fallback; };
if (!plan) { console.error('usage: node scripts/encode.cjs <plan>'); process.exit(2); }
const OUT = path.join(KIT, 'out', plan), frames = path.join(OUT, 'frames'), audio = path.join(KIT, 'plans', plan, opt('audio', 'audio.wav')), mp4 = path.join(OUT, `${opt('name', plan)}.mp4`);
const count = fs.existsSync(frames) ? fs.readdirSync(frames).filter((n) => /^f_\d+\.png$/.test(n)).length : 0;
if (!count) { console.error(`no frames in out/${plan}/frames: render first`); process.exit(2); }
const seconds = (count / 30).toFixed(4), hasAudio = fs.existsSync(audio);
const video = ['-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuv420p',
  '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const cmd = ['-v', 'error', '-y', '-framerate', '30', '-i', path.join(frames, 'f_%04d.png'), ...(hasAudio ? ['-i', audio] : []), ...video,
  ...(hasAudio ? ['-af', 'apad', '-c:a', 'aac', '-b:a', '192k'] : []), '-t', seconds, '-movflags', '+faststart', mp4];
const r = spawnSync('ffmpeg', cmd, { stdio: 'inherit' });
if (r.error || r.status !== 0) { console.error('ENCODE FAILED' + (r.error ? '  ' + r.error.message + ' (is ffmpeg installed and on the PATH?)' : '')); process.exit(1); }
console.log(`${count} frames${hasAudio ? ' + ' + path.basename(audio) : ', NO AUDIO (' + path.basename(audio) + ' not found in plans/' + plan + ')'} -> out/${plan}/${path.basename(mp4)} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB)`);
