export default function Tip({ text }: { text: string }) {
  return (
    <span className="tip">
      <span className="q" tabIndex={0} role="button" aria-label={text}>
        ?
      </span>
      <span className="pop">{text}</span>
    </span>
  );
}
