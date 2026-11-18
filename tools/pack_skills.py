"""Copy the public parts of each skill into skills/<id>/ and zip them into public/downloads/<id>.zip.

    python tools/pack_skills.py

Sources are Pimbo's working folders in anymation/. Only what is safe to publish is copied: no renders, no
node_modules, no private reference material, no plans of client or game videos (see EXCLUDE).
"""
import os, shutil, zipfile, fnmatch

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANYMATION = os.path.dirname(HERE)
SKILLS = {
    'toy-loops': os.path.join(ANYMATION, 'toy3d', 'skill'),
    'stage3d-shorts': os.path.join(ANYMATION, 'stage3d', 'skill'),
}
EXCLUDE = [
    '*/node_modules/*', '*/out/*', '*/dist/*', '*/__pycache__/*', '*.pyc', '*.zip',
    # stage3d: keep the demo plans only (the token video plans carry their own audio and are not examples)
    'kit/plans/left_one/*', 'kit/plans/no_trick/*', 'kit/plans/starts_clean/*', 'kit/plans/treasure_hours/*',
    'kit/plans/avatar/*',
]


def wanted(rel):
    rel = rel.replace('\\', '/')
    return not any(fnmatch.fnmatch('/' + rel, '*/' + p.lstrip('*/')) or fnmatch.fnmatch(rel, p) for p in EXCLUDE)


for sid, src in SKILLS.items():
    dst = os.path.join(HERE, 'skills', sid)
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    files = []
    for d, dirs, names in os.walk(src):
        dirs[:] = [x for x in dirs if x not in ('node_modules', 'out', 'dist', '__pycache__')]
        for n in names:
            full = os.path.join(d, n)
            rel = os.path.relpath(full, src)
            if wanted(rel):
                files.append(rel)
    for rel in files:
        os.makedirs(os.path.dirname(os.path.join(dst, rel)), exist_ok=True)
        shutil.copy2(os.path.join(src, rel), os.path.join(dst, rel))
    os.makedirs(os.path.join(HERE, 'public', 'downloads'), exist_ok=True)
    zpath = os.path.join(HERE, 'public', 'downloads', f'{sid}.zip')
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for rel in files:
            z.write(os.path.join(dst, rel), os.path.join(sid, rel))
    print(f'{sid}: {len(files)} files, {os.path.getsize(zpath) // 1024} KB')
