import { FESTIVAL } from '../config';
import { bandHues, initials } from '../data/format';

/** The app's own badge logo: a guitar pick with a sound wave and a small skyline. */
export function Logo({ size = 40, withText = false }: { size?: number; withText?: boolean }) {
  return (
    <span className="logo" style={{ gap: size * 0.25 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="pick" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#36c3ff" />
            <stop offset="1" stopColor="#0079c6" />
          </linearGradient>
        </defs>
        <path d="M32 61C20 50 6 33 6 19 6 9 17 3 32 3s26 6 26 16c0 14-14 31-26 42z" fill="#00223f" stroke="#fff" strokeWidth="3" />
        <path d="M32 55C22 45 11 31 11 20c0-7 9-12 21-12s21 5 21 12c0 11-11 25-21 35z" fill="url(#pick)" />
        <path d="M15 27h4l3-8 4 16 4-22 4 22 4-14 3 6h8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 44v-5h4v-3h4v4h3v-6l2-2 2 2v6h3v-3h4v7z" fill="#00223f" />
      </svg>
      {withText && (
        <span className="logo-text">
          <span className="logo-name">{FESTIVAL.name}</span>
          <span className="logo-edition">{FESTIVAL.subtitle}</span>
        </span>
      )}
    </span>
  );
}

/** A made-up row of rooftops, drawn in code. Sits at the bottom of every screen. */
export function Skyline({ className = '' }: { className?: string }) {
  return (
    <svg className={`skyline ${className}`} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M0 120V78l40-10 46 10v-6h30v-8l22-12 22 12v20h26V58h52v26h16V70l14-14 14 14v14h30V64h18V52h8v12h22v20h20V66l50-14 50 14v18h18V74c20-20 60-20 80 0v10h26V60l40-12 40 12v24h20V54h10l6-18 6 18h10v30h30V70h44v14h22V62l24-10 24 10v22h18V48h12V34l6-10 6 10v14h12v36h30V72h40v12h30V66l30-8 30 8h16V60h44v6h30V72H1200V120z"
      />
    </svg>
  );
}

/** Placeholder band picture: stage-light gradient with the band's initials. */
export function BandArt({ id, name, imageUrl, size = 'md' }: { id: string; name: string; imageUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  if (imageUrl) return <img className={`band-art band-art-${size}`} src={imageUrl} alt="" />;
  const [a, b] = bandHues(id);
  return (
    <div
      className={`band-art band-art-${size}`}
      style={{ background: `radial-gradient(circle at 30% 20%, hsl(${b} 95% 70%) 0, transparent 55%), linear-gradient(135deg, hsl(${a} 85% 45%), hsl(${b} 80% 35%) 60%, #00223f)` }}
      aria-hidden="true"
    >
      <span>{initials(name)}</span>
    </div>
  );
}

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <i className={`bi bi-${name} ${className}`} aria-hidden="true" />;
}
