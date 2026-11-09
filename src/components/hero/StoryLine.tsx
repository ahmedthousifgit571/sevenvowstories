import { parseLine } from '@/content/stories';

/** Ultra-condensed story set in the DOM: big words with small connector words. */
export default function StoryLine({ line, className = '' }: { line: string; className?: string }) {
  const words = parseLine(line);
  return (
    <p className={`story-set ${className}`}>
      {words.map((w, i) => (
        <span key={i} className={w.small ? 'sm' : undefined}>
          {w.w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
