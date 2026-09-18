const STARS = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37 + 9) % 100}%`,
  top: `${(index * 53 + 7) % 100}%`,
  animationDelay: `${-(index % 7)}s`,
}));

export function NeonBackground() {
  return <div className="neon-background" aria-hidden="true">
    <div className="nebula nebula-one" /><div className="nebula nebula-two" /><div className="nebula nebula-three" />
    <div className="space-grain" />
    {STARS.map((style, index) => <i className="star" style={style} key={index} />)}
  </div>;
}
