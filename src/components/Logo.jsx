import mark from '../media/claude-mark.webp';

// The site mark: a little render of Claude (from toy-loops), not a drawing.
export default function Logo({ size = 22 }) {
  return <img className="logo" src={mark} alt="" width={size} height={size} />;
}
