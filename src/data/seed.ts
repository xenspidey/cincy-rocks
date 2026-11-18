import type { Band, Invite, NewsItem, Performance, Venue } from './types';
import { FESTIVAL } from '../config';

// Sample content so the app has something to show in demo mode. All names are made up.


export const seedVenues: Venue[] = [
  { id: 'v1', name: 'Riverbank Stage', address: 'Riverfront, Downtown', lat: 39.0985, lng: -84.5005, description: 'The big outdoor stage by the Ohio River. Bring a blanket.', kind: 'outdoor' },
  { id: 'v2', name: 'The Lantern Room', address: '1214 Main St, Over-the-Rhine', lat: 39.1093, lng: -84.5128, description: 'Cozy listening room with a small bar and great sound.', kind: 'indoor' , over21: true },
  { id: 'v3', name: 'Copper Kettle Café', address: '1305 Vine St, Over-the-Rhine', lat: 39.1107, lng: -84.515, description: 'Coffee by day, acoustic sets all afternoon.', kind: 'indoor' },
  { id: 'v4', name: 'Park Bandshell', address: 'Elm St, Over-the-Rhine', lat: 39.1092, lng: -84.5175, description: 'Classic bandshell on the park lawn.', kind: 'outdoor' },
  { id: 'v5', name: 'Old Mill Brewhouse', address: '1420 Race St, Over-the-Rhine', lat: 39.1124, lng: -84.5168, description: 'Brewery patio stage with late-night sets.', kind: 'outdoor' , over21: true },
  { id: 'v6', name: 'Library Garden', address: '510 Walnut St, Downtown', lat: 39.1018, lng: -84.5108, description: 'Family-friendly garden stage with shade trees.', kind: 'outdoor' },
  { id: 'v7', name: 'The Vault', address: '612 Main St, Downtown', lat: 39.1031, lng: -84.5094, description: 'An old bank turned rock club. Loud and proud.', kind: 'indoor' , over21: true },
];

const bandRows: [string, string, string, string][] = [
  ['The Paper Lanterns', 'Indie Folk, Americana', 'Northside, Cincinnati', 'Four friends with banjo, cello and close harmonies, writing songs about lake towns and long winters.'],
  ['Saltwater Radio', 'Indie Rock', 'Clifton, Cincinnati', 'Jangly guitars and big choruses from a trio that met working on a fishing boat.'],
  ['June & the Junipers', 'Americana', 'Walnut Hills, Cincinnati', 'Front-porch Americana led by a fiddle player who sings like she means every word.'],
  ['Northbound Static', 'Alt-Country, Roots Rock', 'Westwood, Cincinnati', 'Pedal steel, road stories and a rhythm section that never lets up.'],
  ['Velvet Atlas', 'Soul, Funk', 'Avondale, Cincinnati', 'A seven-piece soul band with horns, grooves and a singer who can fill a room.'],
  ['Cedar & Smoke', 'Bluegrass', 'Price Hill, Cincinnati', 'Fast picking, tight harmonies and the occasional murder ballad.'],
  ['Moth Parade', 'Dream Pop', 'Pendleton, Cincinnati', 'Shimmering synths and soft vocals for sunset sets.'],
  ['The Gravel Saints', 'Roots Rock', 'Camp Washington, Cincinnati', 'Gritty, joyful rock and roll built for dancing in the street.'],
  ['Lila Moreno', 'Singer-Songwriter', 'Over-the-Rhine, Cincinnati', 'Bilingual songs about home, family and the desert sky.'],
  ['Brass Tacks Collective', 'Funk', 'Corryville, Cincinnati', 'A street-band powerhouse with tuba, trumpets and endless energy.'],
  ['Hollow Pines', 'Folk Rock', 'Columbia-Tusculum, Cincinnati', 'Layered guitars and soaring harmonies from the north woods.'],
  ['Kites Over Kansas', 'Indie Pop', 'Oakley, Cincinnati', 'Bright, hooky pop songs with a little heartbreak underneath.'],
  ['Dusty Wren', 'Country', 'Madisonville, Cincinnati', 'Honky-tonk heart with a modern edge and a killer telecaster.'],
  ['The Night Ferry', 'Blues', 'Bond Hill, Cincinnati', 'Slow-burning blues guitar and a voice like gravel and honey.'],
  ['Orchard Kids', 'Indie Folk', 'College Hill, Cincinnati', 'Sibling harmonies and songs written between cherry harvests.'],
  ['Glass Canyon', 'Psych Rock, Indie Rock', 'Mount Adams, Cincinnati', 'Swirling guitars and long jams that take you somewhere else.'],
];

export const seedBands: Band[] = bandRows.map(([name, genre, hometown, bio], i) => ({
  id: `b${i + 1}`,
  name,
  genre,
  hometown,
  bio,
  website: 'https://example.com',
  // Handles, not full links: the app adds each site's address (see socialUrl in format.ts).
  ...(i % 3 === 0 ? { instagram: 'example', tiktok: '@example' } : i % 3 === 1 ? { facebook: 'example' } : { x: 'example' }),
  status: 'approved',
  createdAt: '2027-03-01T12:00:00Z',
}));

seedBands.push(
  {
    id: 'b17', name: 'Static Bloom', genre: 'Garage Rock', hometown: 'Northside, Cincinnati',
    bio: 'Three-piece garage band, loud guitars and short songs. We would love to play the late shows.',
    website: 'https://example.com', contactName: 'Sam Rivera', contactEmail: 'sam@example.com',
    status: 'pending', inviteCode: 'DEMO-2027', createdAt: '2027-04-02T15:20:00Z',
  },
  {
    id: 'b18', name: 'The Willow Sisters', genre: 'Folk', hometown: 'Hyde Park, Cincinnati',
    bio: 'Two sisters, one guitar, one accordion and a lot of old-time songs.',
    contactName: 'Anna Willow', contactEmail: 'anna@example.com',
    status: 'pending', inviteCode: 'DEMO-2027', createdAt: '2027-04-05T09:10:00Z',
  },
);

function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function pad(n: number) { return String(n).padStart(2, '0'); }

/** Spread approved bands over the festival days and venues. */
function buildPerformances(): Performance[] {
  const out: Performance[] = [];
  const approved = seedBands.filter((b) => b.status === 'approved');
  const days = 4;
  const slots = [14, 15.5, 17, 18.5, 20, 21.5];
  let id = 1;
  for (let d = 0; d < days; d++) {
    const day = addDays(FESTIVAL.startDate, d);
    seedVenues.forEach((v, vi) => {
      // Thursday is lighter: only evening shows.
      const daySlots = d === 0 ? slots.slice(3) : slots;
      daySlots.forEach((s, si) => {
        if ((vi + si + d) % 3 === 2) return; // leave some gaps
        const band = approved[(d * 7 + vi * 3 + si * 5) % approved.length];
        const h = Math.floor(s);
        const m = s % 1 ? 30 : 0;
        const endH = m ? h + 1 : h;
        const endM = m ? 15 : 45;
        out.push({
          id: `p${id++}`,
          bandId: band.id,
          venueId: v.id,
          start: `${day}T${pad(h)}:${pad(m)}`,
          end: `${day}T${pad(endH)}:${pad(endM)}`,
        });
      });
    });
  }
  // Late-night sets after midnight. They belong to the night before (the festival day runs to 6 AM).
  const late: [number, number][] = [[1, 6], [2, 4], [3, 6]];
  late.forEach(([d, vi]) => {
    const after = addDays(FESTIVAL.startDate, d);
    const band = approved[(d * 5 + vi) % approved.length];
    out.push({ id: `p${id++}`, bandId: band.id, venueId: seedVenues[vi].id, start: `${after}T00:15`, end: `${after}T01:15` });
  });
  return out;
}

export const seedPerformances: Performance[] = buildPerformances();

export const seedNews: NewsItem[] = [
  { id: 'n1', title: 'The full schedule is here', body: 'Every set on every stage is now in the app. Tap the heart on any show to add it to My Fest.', date: '2027-06-15' },
  { id: 'n2', title: 'Ride the streetcar between stages', body: 'The streetcar loops downtown and Over-the-Rhine, linking most venues. Look for the blue signs.', date: '2027-06-20' },
  { id: 'n3', title: 'Volunteers wanted', body: 'Help run a stage, pour water or greet visitors. Every volunteer gets a festival shirt.', date: '2027-05-30' },
];

export const seedInvites: Invite[] = [
  { code: 'DEMO-2027', note: 'Sample invite for trying the band sign-up', createdAt: '2027-03-01T12:00:00Z', maxUses: 25, uses: 2, revoked: false },
];
