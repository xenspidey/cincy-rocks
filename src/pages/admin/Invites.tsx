import { useState, type FormEvent } from 'react';
import { FESTIVAL } from '../../config';
import { store, notifyChange } from '../../data/store';
import { useLoad } from '../../data/hooks';
import type { Invite } from '../../data/types';
import { inviteProblem } from '../../data/util';
import { Icon } from '../../components/Art';
import { ErrorNote, Loading } from '../../components/ShowRow';
import { QrImage, inviteLink, qrPng } from '../../components/Qr';

function InviteCard({ inv, onClose }: { inv: Invite; onClose?: () => void }) {
  const link = inviteLink(inv.code);
  const [copied, setCopied] = useState('');
  const copy = async (text: string, what: string) => { await navigator.clipboard.writeText(text); setCopied(`${what} copied`); setTimeout(() => setCopied(''), 2000); };
  const download = async () => {
    const a = document.createElement('a');
    a.href = await qrPng(link);
    a.download = `invite-${inv.code}.png`;
    a.click();
  };
  const share = async () => {
    const text = `You're invited to join the ${FESTIVAL.name} lineup! Sign up here: ${link} (invite code ${inv.code})`;
    if (navigator.share) { try { await navigator.share({ title: `${FESTIVAL.name} invite`, text, url: link }); } catch { /* cancelled */ } }
    else copy(text, 'Message');
  };
  return (
    <section className="card invite-card">
      <div className="invite-qr"><QrImage text={link} /></div>
      <div className="invite-info">
        <p className="muted small">Invite code</p>
        <p className="invite-code">{inv.code}</p>
        {inv.note && <p>{inv.note}</p>}
        <p className="muted small">Used {inv.uses} of {inv.maxUses}{inv.expiresAt ? ` · expires ${new Date(inv.expiresAt).toLocaleDateString()}` : ''}</p>
        <p className="muted small break">{link}</p>
        <div className="link-row">
          <button className="btn btn-outline btn-sm" onClick={() => copy(inv.code, 'Code')}><Icon name="clipboard" /> Copy code</button>
          <button className="btn btn-outline btn-sm" onClick={() => copy(link, 'Link')}><Icon name="link-45deg" /> Copy link</button>
          <button className="btn btn-outline btn-sm" onClick={download}><Icon name="download" /> QR picture</button>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Icon name="printer" /> Print</button>
          <button className="btn btn-accent btn-sm" onClick={share}><Icon name="send" /> Send</button>
        </div>
        {copied && <p className="note note-ok">{copied}</p>}
        {onClose && <button className="btn btn-light btn-sm" onClick={onClose}>Done</button>}
      </div>
    </section>
  );
}

export function Invites() {
  const { data, error } = useLoad(() => store.listInvites());
  const [note, setNote] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [days, setDays] = useState(30);
  const [fresh, setFresh] = useState<Invite | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const expiresAt = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : undefined;
      const inv = await store.createInvite({ note, maxUses, expiresAt });
      setFresh(inv); setNote(''); notifyChange();
    } catch (ex) { setErr((ex as Error).message); }
  };

  return (
    <>
      {fresh && <InviteCard inv={fresh} onClose={() => setFresh(null)} />}
      <form className="card" onSubmit={create}>
        <h2><Icon name="qr-code" /> Make an invite</h2>
        <p className="muted">Each invite has a code and a QR code. A band scans it (or types the code) to sign up, then their profile waits here for your approval.</p>
        <label className="field"><span>Who is it for? (optional)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Saturday open-call bands" /></label>
        <div className="two">
          <label className="field"><span>How many bands can use it</span><input type="number" min={1} max={500} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} /></label>
          <label className="field"><span>Expires after</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={1}>1 day</option><option value={7}>1 week</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={0}>Never</option>
            </select>
          </label>
        </div>
        {err && <ErrorNote error={err} />}
        <button className="btn btn-accent"><Icon name="plus-lg" /> Create invite</button>
      </form>

      <section className="card">
        <h2>Invites</h2>
        {error && <ErrorNote error={error} />}
        {!data ? <Loading /> : data.length === 0 ? <p className="muted">No invites yet.</p> : (
          <div className="list">
            {data.map((inv) => {
              const problem = inviteProblem(inv);
              return (
                <div key={inv.code}>
                  <div className="band-row">
                    <span className={`venue-num ${problem ? 'off' : ''}`}><Icon name="ticket-perforated" /></span>
                    <div className="show-main">
                      <div className="show-title mono">{inv.code}</div>
                      <div className="show-sub">{inv.note || 'No note'} · used {inv.uses}/{inv.maxUses}</div>
                    </div>
                    <span className={`tag ${problem ? 'tag-rejected' : 'tag-approved'}`}>{inv.revoked ? 'Off' : problem ? 'Used up / expired' : 'Active'}</span>
                    <button className="icon-btn dark" onClick={() => setShown(shown === inv.code ? null : inv.code)} aria-label={`Show QR for ${inv.code}`}><Icon name="qr-code" /></button>
                    {!inv.revoked && (
                      <button className="icon-btn dark" aria-label={`Turn off ${inv.code}`}
                        onClick={async () => { if (confirm(`Turn off invite ${inv.code}? Bands can no longer use it.`)) { try { await store.revokeInvite(inv.code); notifyChange(); } catch (ex) { setErr((ex as Error).message); } } }}>
                        <Icon name="slash-circle" />
                      </button>
                    )}
                  </div>
                  {shown === inv.code && <InviteCard inv={inv} />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
