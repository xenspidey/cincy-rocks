import { useState } from 'react';
import { FESTIVAL } from '../config';
import type { Band, Performance, Venue } from '../data/types';
import { bandHues, dateRangeLabel, dayLabel, initials, timeLabel } from '../data/format';
import { Icon } from './Art';

// Draws a square "see them play" card for a band and hands it to the phone's share
// sheet, or downloads it where sharing files isn't supported.

const SIZE = 1080;

function drawCard(band: Band, perfs: Performance[], venues: Venue[]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  const g = c.getContext('2d')!;
  const font = (w: number, px: number) => `${w} ${px}px "Open Sans", system-ui, sans-serif`;

  // Night-sky stage background: purple top to festival blue.
  const bg = g.createLinearGradient(0, 0, 0, SIZE);
  bg.addColorStop(0, '#2a0f6b'); bg.addColorStop(0.55, '#5b2bd6'); bg.addColorStop(1, '#0090d8');
  g.fillStyle = bg; g.fillRect(0, 0, SIZE, SIZE);

  // Two soft stage beams.
  for (const [x, tilt] of [[260, -1], [820, 1]] as const) {
    const beam = g.createLinearGradient(x, 0, x + tilt * 120, 760);
    beam.addColorStop(0, 'rgba(190,230,255,0.38)'); beam.addColorStop(1, 'rgba(190,230,255,0)');
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 40, 0); g.lineTo(x + tilt * 120 + 220, 760); g.lineTo(x + tilt * 120 - 220, 760); g.closePath(); g.fill();
  }

  // Band art tile.
  const [h1, h2] = bandHues(band.id);
  const art = g.createLinearGradient(390, 120, 690, 420);
  art.addColorStop(0, `hsl(${h1} 85% 55%)`); art.addColorStop(1, `hsl(${h2} 80% 32%)`);
  g.fillStyle = art;
  g.beginPath(); g.roundRect(390, 110, 300, 300, 40); g.fill();
  g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = font(800, 120); g.fillText(initials(band.name), SIZE / 2, 262);

  // Name, style and hometown.
  g.textBaseline = 'alphabetic';
  let size = 84;
  g.font = font(800, size);
  while (g.measureText(band.name).width > SIZE - 120 && size > 44) { size -= 4; g.font = font(800, size); }
  g.fillText(band.name, SIZE / 2, 520);
  g.font = font(600, 38); g.fillStyle = '#d6ecfb';
  g.fillText([band.genre, band.hometown].filter(Boolean).join('  ·  '), SIZE / 2, 580);

  // Up to four show times.
  g.font = font(700, 40); g.fillStyle = '#ffffff';
  const rows = perfs.slice(0, 4).map((p) => {
    const v = venues.find((x) => x.id === p.venueId);
    return `${dayLabel(p.start.slice(0, 10))} ${timeLabel(p.start)}  ·  ${v?.name ?? ''}`;
  });
  if (rows.length === 0) rows.push('Show times coming soon');
  rows.forEach((r, i) => g.fillText(r, SIZE / 2, 680 + i * 58, SIZE - 120));

  // Navy footer band with the festival name and dates.
  g.fillStyle = '#00223f'; g.fillRect(0, SIZE - 150, SIZE, 150);
  g.fillStyle = '#ffffff'; g.font = font(800, 46);
  g.fillText(FESTIVAL.name.toUpperCase(), SIZE / 2, SIZE - 82);
  g.fillStyle = '#36c3ff'; g.font = font(700, 32);
  g.fillText(`${dateRangeLabel()}, ${FESTIVAL.edition}`, SIZE / 2, SIZE - 36);
  return c;
}

export function ShareBandButton({ band, perfs, venues }: { band: Band; perfs: Performance[]; venues: Venue[] }) {
  const [msg, setMsg] = useState('');
  const share = async () => {
    setMsg('');
    await document.fonts?.ready;
    const canvas = drawCard(band, perfs, venues);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) { setMsg('Could not make the picture.'); return; }
    const fileName = `${band.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const text = `See ${band.name} at ${FESTIVAL.name}!`;
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: band.name, text }); return; }
    } catch { return; /* cancelled */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg('Picture saved to your downloads.');
  };
  return (
    <>
      <button className="btn btn-outline btn-on-dark" onClick={share}><Icon name="share" /> Share</button>
      {msg && <span className="muted small share-msg">{msg}</span>}
    </>
  );
}
