// Change these to make the app your own. Everything that shows the app's name,
// dates or city reads from here.
export const FESTIVAL = {
  name: 'Cincy Rocks',
  shortName: 'Cincy Rocks',
  tagline: 'Live music all over Cincinnati, in one app.',
  edition: '2027',
  /** First and last festival day (YYYY-MM-DD). */
  startDate: '2027-07-29',
  endDate: '2027-08-01',
  town: 'Cincinnati, OH',
  /** Shown under the name in the logo. */
  subtitle: 'Cincinnati, Ohio',
  /** Where the map opens. */
  mapCenter: { lat: 39.1075, lng: -84.5140 }, // Over-the-Rhine and downtown Cincinnati
  mapZoom: 15,
  contactEmail: 'hello@example.com',
  /** Public web address of your site, e.g. https://cincyrocks.com (used in invite QR codes
   *  made inside the phone apps). Set by VITE_SITE_URL when building; when empty, the
   *  address the admin is on is used. */
  siteUrl: (import.meta.env.VITE_SITE_URL as string | undefined) ?? '',
};
