import { KindIcon } from './Icons.jsx';

// The small picture of a skill (a render from what it makes), or its Nucleo icon on a coloured tile.
export default function SkillTile({ skill, size = 56 }) {
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.25) };
  if (skill.tile) {
    return (
      <div className={`tile has-img bg-${skill.tileBg || 'dark'}`} style={style}>
        <img src={skill.tile} alt="" width={size} height={size} />
      </div>
    );
  }
  return (
    <div className={`tile k-${(skill.icon || skill.kind).toLowerCase()}`} style={style}>
      <KindIcon kind={skill.icon || skill.kind} size={Math.round(size * 0.46)} />
    </div>
  );
}
