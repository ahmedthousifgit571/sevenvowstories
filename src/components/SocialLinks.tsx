import { socials } from '@/content/site';

type IconProps = { className?: string };

// Line icons drawn to sit with the site's 1.2–1.5px strokes (lucide no longer ships brand marks).
export function InstagramIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden>
      <rect x="2.4" y="5.4" width="19.2" height="13.2" rx="3.6" />
      <path d="M10.3 9.2v5.6l4.8-2.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3.4a8.6 8.6 0 0 0-7.4 13l-1.2 4.2 4.3-1.1A8.6 8.6 0 1 0 12 3.4Z" />
      <path
        d="M9.2 8.1c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.5.8 1.1 1.4 1.9 1.9.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.7.8c.2.1.3.3.3.5 0 .5-.2 1.2-.8 1.5-.6.4-1.5.5-2.5.1a8.7 8.7 0 0 1-4.6-4.3c-.5-1-.4-2.1 0-2.7Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

const ICONS = { instagram: InstagramIcon, youtube: YouTubeIcon, whatsapp: WhatsAppIcon };

type Props = {
  className?: string;
  /** colours for dark (paper ink) or light (ink on paper) surfaces */
  tone?: 'dark' | 'light';
  /** show the handle or number under each label */
  detailed?: boolean;
};

/** The studio's Instagram, YouTube and WhatsApp as quiet pill links. */
export default function SocialLinks({ className = '', tone = 'dark', detailed = false }: Props) {
  const pill =
    tone === 'dark'
      ? 'border-paper/20 text-paper/80 hover:border-paper/70 hover:text-paper'
      : 'border-[#24212a]/20 text-[#24212a]/80 hover:border-[#24212a]/60 hover:text-[#24212a]';
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Seven Vow Stories elsewhere">
      {socials.map((s) => {
        const Icon = ICONS[s.kind];
        return (
          <li key={s.kind}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2.5 rounded-full border transition-colors duration-300 ${pill} ${detailed ? 'py-2 pr-4 pl-3' : 'px-3.5 py-2'}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex flex-col leading-tight">
                <span className="font-sans text-[0.7rem] font-medium tracking-[0.14em] uppercase">{s.label}</span>
                {detailed && <span className="font-sans text-[0.72rem] opacity-60">{s.detail}</span>}
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
