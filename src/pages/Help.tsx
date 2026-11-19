import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FESTIVAL } from '../config';
import { Icon } from '../components/Art';

// Pictures live in public/help/ and are made by `npm run help:screenshots`.
const pic = (name: string) => `${import.meta.env.BASE_URL}help/${name}.jpg`;

function Step({ id, title, img, alt, children }: { id?: string; title: string; img?: string; alt?: string; children: ReactNode }) {
  return (
    <section className="card help-step" id={id}>
      <div className="help-text">
        <h3>{title}</h3>
        {children}
      </div>
      {img && (
        <figure className="help-shot">
          <img src={pic(img)} alt={alt ?? ''} loading="lazy" width={390} height={844} />
        </figure>
      )}
    </section>
  );
}

const sections = [
  ['fans', 'Using the app', 'phone'],
  ['bands', 'For bands', 'music-note-beamed'],
  ['team', 'For the festival team', 'shield-lock'],
  ['questions', 'Questions', 'question-circle'],
] as const;

export default function Help() {
  return (
    <div className="page help">
      <h1 className="page-title">Help</h1>
      <section className="card">
        <p>How to find shows, plan your festival, sign your band up and run things behind the scenes.
          Pick a part to jump to it.</p>
        <nav className="help-toc" aria-label="Help sections">
          {sections.map(([id, label, icon]) => (
            <a key={id} href={`#${id}`} className="chip chip-dark"><Icon name={icon} /> {label}</a>
          ))}
        </nav>
      </section>

      <h2 className="section-label on-blue" id="fans">Using the app</h2>

      <Step title="Home: what's on next" img="home" alt="Home screen with the festival dates and the next shows">
        <p>The home screen shows the festival dates, a countdown (or <strong>Happening now</strong> during the festival) and the next
          shows coming up. The tiles below take you to My Fest, the venue map, news and band sign-up.</p>
        <p>Use the tabs along the bottom (on a computer, the links along the top) to move between <strong>Home</strong>,{' '}
          <strong>Bands</strong>, <strong>Schedule</strong>, <strong>Map</strong> and <strong>My Fest</strong>.</p>
      </Step>

      <Step title="The menu" img="menu" alt="Open menu with News & Info, Band Sign-Up, Help and Admin">
        <p>Tap <Icon name="list" /> at the top right for <strong>News &amp; Info</strong>, <strong>Band Sign-Up</strong>, this{' '}
          <strong>Help</strong> page and <strong>Admin</strong> (for the festival team).</p>
      </Step>

      <Step title="Find bands" img="bands" alt="Band list with search box and genre filters">
        <p>Search by band name, hometown or style, or tap genres to narrow the list (pick several to see bands that play any of them).</p>
        <p>Tap <strong><Icon name="star-fill" /> Following</strong> to show only the bands you follow.</p>
      </Step>

      <Step title="A band's page" img="band" alt="Band page with photo, Follow and Share buttons, and show times">
        <p>See when and where a band plays, their bio and links to their music and social media.</p>
        <ul>
          <li><strong>Follow</strong> adds a star so you can find them quickly in the band list.</li>
          <li><strong>Share</strong> sends their show times to a friend.</li>
        </ul>
      </Step>

      <Step title="The schedule" img="schedule" alt="Schedule for Friday with Happening now and Starting soon">
        <p>Pick a day at the top, then view shows <strong>By time</strong> or <strong>By venue</strong>. During the festival, today's tab
          starts with what's <strong>Happening now</strong> and <strong>Starting soon</strong>.</p>
        <p>Shows after midnight are listed with the night before, so a 1 AM set on Saturday morning is under Friday.</p>
        <p>Tap <Icon name="heart" /> next to a show to add it to My Fest. Tap a show to open the band's page.</p>
      </Step>

      <Step title="My Fest: your plan" img="myfest" alt="My Fest with three picked shows, two marked as overlapping">
        <p>Every show you heart lands here, in time order, day by day. Shows that overlap are marked{' '}
          <strong><Icon name="exclamation-triangle" /> Overlaps another show you picked</strong> so you can choose.</p>
        <p><strong>Share</strong> sends your list as text. Your picks are saved on this phone or computer only; no account needed.</p>
      </Step>

      <Step title="Venue map" img="map" alt="Map of venues in Cincinnati with numbered pins and age filters">
        <p>Every venue is a numbered pin. Drag and pinch to move around, tap a pin or a venue in the list for its page with all
          its shows and a <strong>Directions</strong> button.</p>
        <ul>
          <li><Icon name="crosshair" /> shows where you are (allow location when asked).</li>
          <li><strong>All ages</strong> and <strong>21+ only</strong> filter the venues.</li>
        </ul>
      </Step>

      <Step title="News & Info" img="info" alt="News & Info page with news posts and frequently asked questions">
        <p>Festival news, getting around, frequently asked questions and how to contact us.</p>
      </Step>

      <Step title="Get the app">
        <ul>
          <li><strong>iPhone and Android:</strong> install {FESTIVAL.name} from the App Store or Google Play when available, or from the
            link the festival team shares.</li>
          <li><strong>Without installing:</strong> open this website in your phone's browser and choose <em>Add to Home Screen</em>{' '}
            (Safari: <Icon name="box-arrow-up" /> Share button; Chrome: <Icon name="three-dots-vertical" /> menu).</li>
        </ul>
        <p>The app keeps itself up to date: new schedules and news appear as soon as they're posted, and app improvements arrive
          on their own the next time you open it.</p>
      </Step>

      <h2 className="section-label on-blue" id="bands">For bands</h2>

      <Step title="1. Open your invite" img="join-code" alt="Band Sign-Up asking for an invite code">
        <p>Bands join the lineup by invitation. The festival team sends you a code like <code>K7QD-3MXP</code>, a link or a QR code.</p>
        <ul>
          <li>Point your phone's camera at the QR code, or open the link: the code is filled in for you.</li>
          <li>Or open <Link to="/join">Band Sign-Up</Link> from the menu, type the code and tap <strong>Continue</strong>.</li>
        </ul>
      </Step>

      <Step title="2. Tell us about your band" img="join-form" alt="Band Sign-Up form with band details">
        <p>Fill in your band name, genres (separate several with commas), hometown and a short bio. Add a link to a band photo and
          your website and social media; a handle like <code>@yourband</code> is fine.</p>
        <p>Your contact name and email are only seen by the festival team. Tap <strong>Send for approval</strong>.</p>
      </Step>

      <Step title="3. Wait for approval">
        <p>Your band appears in the lineup once the festival team approves it. They'll be in touch about set times; your shows then
          appear on your band's page.</p>
      </Step>

      <h2 className="section-label on-blue" id="team">For the festival team</h2>

      <Step title="Sign in" >
        <p>Open <Link to="/admin">Admin</Link> from the menu and sign in with your email and password. The first account ever made
          here becomes the admin. To add another admin, create their user in Supabase (<em>Authentication → Users</em>) and add a row with
          their user id and email to the <code>admins</code> table.</p>
        <p>Change your password under <strong>Account</strong>.</p>
      </Step>

      <Step title="Approve bands" img="admin-approvals" alt="Approvals tab with bands waiting for review">
        <p><strong>Approvals</strong> lists bands waiting for review, with the number waiting on the tab. Check their details and links,
          add an optional note, then tap <strong>Approve</strong> (they appear in the lineup) or <strong>Decline</strong>.</p>
      </Step>

      <Step title="Invite bands" img="admin-invite" alt="A new invite with its QR code, code and sharing buttons">
        <p>On <strong>Invites</strong>, fill in who it's for (optional), how many bands can use it and when it expires, then tap{' '}
          <strong>Create invite</strong>.</p>
        <p>Each invite has a code, a link and a QR code: <strong>Copy code</strong>, <strong>Copy link</strong>, download the{' '}
          <strong>QR picture</strong>, <strong>Print</strong> it or <strong>Send</strong> it straight from your phone. Turn an invite off
          with <Icon name="slash-circle" /> in the list.</p>
      </Step>

      <Step title="Edit bands">
        <p><strong>Bands</strong> lists every band with its status. Tap <Icon name="pencil" /> to edit details or change the status, or{' '}
          <strong>Add band</strong> to add one yourself without an invite. Deleting a band also removes its shows.</p>
      </Step>

      <Step title="Build the schedule" img="admin-schedule" alt="Schedule tab with a form to add a show">
        <p>On <strong>Schedule</strong>, pick the day, choose an approved band and a venue, set start and end times and tap{' '}
          <strong>Add show</strong>. Use <Icon name="pencil" /> to change a show and <Icon name="trash" /> to remove it.</p>
        <p>For late sets, stay on the evening's day: a show from 11:30 PM to 12:30 AM, or one starting at 1 AM, belongs to that night.</p>
      </Step>

      <Step title="Venues" img="admin-venues" alt="Venues tab with the venue form">
        <p>Add or edit venues with their address, map position, indoor or outdoor, and whether they're 21+. To find the map position,
          long-press the spot in any map app and copy the latitude and longitude.</p>
      </Step>

      <Step title="News" img="admin-news" alt="News tab with the form to post news">
        <p>Post news with a title, message and date. The newest post also shows on the home screen.</p>
      </Step>

      <Step title="Changes go out straight away">
        <p>Everything you change in Admin shows on the website and both phone apps as soon as people open or refresh a screen;
          nobody needs to install anything.</p>
      </Step>

      <h2 className="section-label on-blue" id="questions">Questions</h2>
      <section className="card">
        <p>Still stuck? Email <a href={`mailto:${FESTIVAL.contactEmail}`}>{FESTIVAL.contactEmail}</a>.</p>
      </section>
    </div>
  );
}
