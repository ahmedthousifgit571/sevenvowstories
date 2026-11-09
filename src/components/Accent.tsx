/** A heading with its last word set in italic, for `.headline`: "The <em>Ceremony</em>". */
export default function Accent({ text }: { text: string }) {
  const i = text.lastIndexOf(' ');
  if (i < 0) return <em>{text}</em>;
  return (
    <>
      {text.slice(0, i)} <em>{text.slice(i + 1)}</em>
    </>
  );
}
