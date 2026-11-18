# Pimbo Studio: Claude Code skills

Skills for Claude Code that make videos, animations and pictures, and the site that shows them
(by [Pimbo](https://pimbo.dev)).

| Skill | What it makes | Folder | Download |
|---|---|---|---|
| **toy-loops** | Seamless 3D loops in a paper-toy look, built in Python and rendered in Blender, animated with the classic principles (anticipation, squash and stretch, follow-through). Also web hero pictures and Claude eyes that follow the cursor. | [`skills/toy-loops`](skills/toy-loops) | [toy-loops.zip](public/downloads/toy-loops.zip) |
| **stage3d-shorts** | Vertical 3D shorts on a black stage: a script with word timings in, a checked MP4 out (three.js in Chrome). | [`skills/stage3d-shorts`](skills/stage3d-shorts) | [stage3d-shorts.zip](public/downloads/stage3d-shorts.zip) |
| hw-shorts | Hardware comparison shorts. | coming soon | |
| reference-video-analysis | Frame-by-frame study of reference videos. | coming soon | |

## Install a skill

- **Claude app:** upload the `.zip` in your skills settings.
- **Claude Code:** unzip it into `~/.claude/skills/`.
- **What each one needs:** read its `SKILL.md` (toy-loops needs Blender 5.2, ffmpeg and Python with numpy and Pillow; stage3d-shorts needs Node 22, Chrome and ffmpeg).

## The site

React + Vite, in the style of the ServerOS landing page: a cloud hero, Claude standing on the product panel with
eyes that follow the cursor, liquid-metal buttons ([metal-fx](https://github.com/Jakubantalik/metal-fx)) and
Nucleo icons.

```
npm install
npm run dev            # http://localhost:5173
npm run build          # static files in dist/
node server.mjs        # serves dist/ and stores sign-ups (PORT=3000, DATA_DIR=./data)
```

| What | Where |
|---|---|
| Site name and links | `src/site.js` |
| The skill list | `src/skills.js` (`status: live / soon / hidden`) |
| Publish a skill | put its source in Pimbo's `anymation/` folder, then `python tools/pack_skills.py` (copies the public parts into `skills/` and zips them into `public/downloads/`) |
| Colours and layout | `src/styles.css` |
| Claude and its eyes | `public/media/claude.webp` + `src/claude-rig.json`, made with toy-loops (`stills/claude_pose`, `tools/web_eyes.py`) |

**Sign-ups.** "Download skill" asks for an email first, and so does "Notify me" for tutorials. `server.mjs` appends each
one to `$DATA_DIR/subscribers.jsonl` (`{email, topic, at}`); no confirmation mail is sent. In Docker, `/data` is a
volume, so the list survives redeploys.

**Deploy (Dokploy).** Application → this repo → Build type: Dockerfile → port 3000 → mount a volume on `/data` →
domain. Live at `skills.pimbo.dev` (through the Cloudflare tunnel to Traefik); the old address `pimbo.dev/skills`
(*Strip path* on) answers with a 301 to it, from `server.mjs`. Every URL in the site is relative, so it also works under
a path. The container has a health check on `/api/health`.

## Notes

- Claude and its mascot belong to Anthropic. This is a fan project, not affiliated with Anthropic.
- The icons are from Nucleo (Pimbo's licence), used inside the site.
