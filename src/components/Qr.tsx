import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { FESTIVAL } from '../config';
import { Icon } from './Art';

/** The link a band opens to join with a code. */
export function inviteLink(code: string) {
  const base = (FESTIVAL.siteUrl || window.location.origin + import.meta.env.BASE_URL).replace(/\/?$/, '/');
  const usable = base.startsWith('http') ? base : 'https://example.com/';
  return `${usable}join?code=${encodeURIComponent(code)}`;
}

/** Draws a QR code for some text onto a canvas. */
export function QrImage({ text, size = 220 }: { text: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) QRCode.toCanvas(ref.current, text, { width: size, margin: 2, color: { dark: '#00223f', light: '#ffffff' } });
  }, [text, size]);
  return <canvas ref={ref} className="qr" aria-label={`QR code for ${text}`} />;
}

export async function qrPng(text: string) {
  return QRCode.toDataURL(text, { width: 800, margin: 3, color: { dark: '#00223f', light: '#ffffff' } });
}

// Minimal typing for the browser's built-in barcode reader (Chrome, Android WebView).
interface DetectedBarcode { rawValue: string }
interface BarcodeDetectorLike { detect(src: CanvasImageSource): Promise<DetectedBarcode[]> }
declare global {
  interface Window { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
}

export const canScan = typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

/** Opens the camera and reads a QR code. Where the browser can't, phones' own camera apps open the invite link instead. */
export function QrScanner({ onCode, onClose }: { onCode: (text: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current || stopped) return;
        video.current.srcObject = stream;
        await video.current.play();
        const det = new window.BarcodeDetector!({ formats: ['qr_code'] });
        const tick = async () => {
          if (stopped || !video.current) return;
          try {
            const found = await det.detect(video.current);
            if (found[0]?.rawValue) { onCode(found[0].rawValue); return; }
          } catch { /* keep trying */ }
          timer = window.setTimeout(tick, 250);
        };
        tick();
      } catch {
        setErr('Could not open the camera. You can type the code instead.');
      }
    })();
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onCode]);

  return (
    <div className="scanner">
      {err ? <p className="note note-error">{err}</p> : <video ref={video} playsInline muted />}
      <div className="scanner-frame" aria-hidden="true" />
      <button className="btn btn-light" onClick={onClose}><Icon name="x-lg" /> Close camera</button>
    </div>
  );
}

/** Pulls a code out of a scanned link (…/join?code=XXXX-XXXX) or plain text. */
export function codeFromScan(text: string) {
  try { return new URL(text).searchParams.get('code') ?? text; } catch { return text; }
}
