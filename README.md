# Cincy Rocks

A guide to live music in Cincinnati, Ohio: lineup, show schedule, venue map,
a personal "My Fest" plan and news. It runs as a website, an Android
app and an iPhone app from one code base, all with the same look.

On top of the guide it has a small admin area:

- **Admin sign-in** with email and password.
- **Band approval**: bands that sign up wait as *pending* until an admin approves
  or rejects them. Only approved bands appear in the public lineup.
- **Invites by code or QR code**: an admin creates an invite (single or multi-use,
  optional expiry date and note). Each invite has a code like `K7QD-3MXP`, a link
  and a QR code that can be copied, downloaded, printed or sent. A band scans the
  QR code (or types the code) on the *Band Sign-Up* page to apply.
- **Content editing**: venues, performances (the schedule) and news posts.

## What's inside

| Folder | What it is |
| --- | --- |
| `src/` | The app itself (React + TypeScript, built with Vite): every screen, shared by web, Android and iPhone |
| `src/config.ts` | App name, dates, city, map position, contact email. Edit this first |
| `src/data/seed.ts` | Sample bands, venues, shows and news used in demo mode |
| `public/` | App icon and web manifest |
| `android/` | Android Studio project: a thin native shell that shows the built app |
| `ios/` | Xcode project: the same thin shell for iPhone |
| `supabase/schema.sql` | The shared database (tables, security rules, invite checks) |
| `scripts/` | Build helpers |
| `.github/workflows/` | Publishes the website and builds both phone apps on GitHub |

### Why one folder for web, Android and iPhone

This is the standard layout for a Capacitor app: the screens are written once in `src/`,
and `android/` and `ios/` are small native projects that load the built website
(`npx cap sync` copies it in). Splitting web, Android and iPhone into separate repositories
or top-level folders would mean three copies of the same screens to keep in step.

When the project grows past one app, the usual next step is a **monorepo**: one repository
with an `apps/` folder per product and a `packages/` folder for shared code, tied together
with npm workspaces. For example:

```
apps/
  mobile-and-web/   this app (src, android, ios)
  admin/            a separate admin website, if it ever outgrows the in-app admin area
  watch/            a native watch or TV app (Swift/Kotlin), which can't reuse the web screens
packages/
  data/             shared types and the Supabase data layer
supabase/           database schema and migrations
```

Move to that layout only when a second app actually needs its own code. Until then, the
current layout is simpler and is what Capacitor's tools expect.

## Run and build

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install
npm run build        # static website in dist/
```

`dist/` is plain static files: upload it to any static host (Netlify, Cloudflare
Pages, GitHub Pages, an ordinary web server). Every page has its own folder, and
`404.html` handles detail pages such as `/bands/<id>`.

To try it locally, serve `dist/` with any static file server, for example
`npx serve dist`.

## Demo mode and going live

With no settings the app runs in **demo mode**: it starts with sample data and
saves changes in that browser only. The first visit to **Admin** asks you to create
the admin account. This is good for trying things out on one computer.

To share bands, schedule and invites across every phone and computer, connect a
free [Supabase](https://supabase.com) project:

1. Create a Supabase project.
2. In its **SQL Editor**, paste all of `supabase/schema.sql` and press **Run**.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API) for builds on your own computer.
   For builds on GitHub, add them as repository variables instead (see "Putting the
   website on your domain" below).
4. In Supabase **Authentication → Providers**, keep Email enabled.
5. Rebuild (`npm run build`) and redeploy.
6. Open **Admin** on the site: the first account created there becomes the admin.
   To add another admin later, create their user in Supabase **Authentication →
   Users**, then add a row with their user id and email to the `admins` table.

Security is enforced by the database: only admins can see pending bands, edit
content or create invites, and a band application is only accepted through the
`apply_with_invite` function when its invite code is valid, unexpired and not used up.

## Where everything lives

| Part | Where | Cost |
| --- | --- | --- |
| Code | GitHub repository | Free |
| Website | GitHub Pages, on your own domain | Free (the repository must be public, or you need a paid GitHub plan) |
| Database, admin sign-in | Supabase (hosted Postgres) | Free plan to start; paid if you outgrow it |
| Android app | Built by GitHub Actions, shared as an .apk or through Google Play | Free; Google Play costs a one-time $25 |
| iPhone app | Built by GitHub Actions, shared through TestFlight or the App Store | Apple Developer account, $99 a year |

GitHub only stores files and runs builds; it can't run a database. The website and both
phone apps talk straight to the same Supabase database, so a band approved in the admin
area shows up everywhere at once.

### Putting the website on your domain with GitHub Pages

1. Push this repository to GitHub (see the last section).
2. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Open **Settings > Secrets and variables > Actions > Variables** and add:
   - `CUSTOM_DOMAIN`: your domain, for example `cincyrocks.com` (or `www.cincyrocks.com`).
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`: from your Supabase project (see "Demo mode and
     going live" above). The anon key is meant to be public; the database rules protect
     the data. Leave both out to publish in demo mode.
4. At your domain registrar, point the domain at GitHub:
   - For the bare domain (`cincyrocks.com`), add four **A** records: `185.199.108.153`,
     `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Optionally also add the
     **AAAA** records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
     `2606:50c0:8003::153`.
   - For `www.cincyrocks.com`, add a **CNAME** record pointing to `<your-account>.github.io`.
5. Push to `main` (or run **Actions > Publish website > Run workflow**). The site is
   published to your domain. Back in **Settings > Pages**, enter the same domain under
   **Custom domain** and tick **Enforce HTTPS** once GitHub has issued the certificate
   (it can take up to a day after the DNS change).
6. In Supabase, open **Authentication > URL Configuration** and set **Site URL** to
   `https://<your domain>`, so sign-in emails link back to your site.

Without `CUSTOM_DOMAIN` the site is published at `https://<your-account>.github.io/<repository>/`.

Every later push to `main` republishes the site, and the *Build phone apps* workflow builds
the phone apps with the same database settings and website address. Invite QR codes made
in the apps then open your website.

## Phone apps

The phone apps show the same built website inside a native shell
([Capacitor](https://capacitorjs.com)).

```sh
npm run android      # build, copy into android/, open Android Studio
npm run ios          # build, copy into ios/, open Xcode (needs a Mac)
```

From Android Studio or Xcode you can run on a device and produce the store build.
Set `siteUrl` in `src/config.ts` to your public website address so invite QR codes
made inside the phone apps point at the website.

### Building the installable apps

- **Android:** `npm run android:apk` builds `android/app/build/outputs/apk/debug/app-debug.apk`.
  It needs Java 21 and the Android SDK (Android Studio installs both). Copy the file to
  an Android phone and open it to install (allow "install unknown apps" when asked).
- **iPhone:** iPhone apps can only be built on a Mac with Xcode. On a Mac, `npm run ios:build`
  builds it for the iPhone simulator. To put it on a real iPhone or in the App Store, open
  `ios/App/App.xcodeproj` in Xcode, choose your Apple developer team under *Signing*, then
  *Product > Archive*.
- **Without your own Mac:** once this repository is on GitHub, the *Build phone apps*
  workflow builds both on every push. Download `android-apk` and `ios-simulator-app` from
  the run's *Artifacts*. See "iPhone app on GitHub" below for an installable iPhone build.

### iPhone app on GitHub

GitHub can build the iPhone app on its Mac machines, so you don't need a Mac. There are
two levels:

1. **Simulator build (works now, no Apple account).** Every push runs the *Build phone apps*
   workflow, and its `ios-simulator-app` download runs in Xcode's iPhone simulator on a Mac.
   It can't be installed on a real iPhone.
2. **Installable build (needs an Apple Developer account, $99 a year).** Apple only lets
   apps signed by a developer account run on iPhones. Once you have one:
   1. In the Apple Developer site, register the app id `com.cincyrocks.app`, create an
      **Apple Distribution** certificate and export it from Keychain as a `.p12` file with
      a password, and create a **provisioning profile** for the app id (type *App Store*
      for TestFlight, or *Ad Hoc* for a list of specific iPhones).
   2. In the GitHub repository go to *Settings > Secrets and variables > Actions* and add:
      - Secrets: `IOS_CERTIFICATE_P12` (the .p12 file, base64-encoded),
        `IOS_CERTIFICATE_PASSWORD`, `IOS_PROVISIONING_PROFILE` (the profile, base64-encoded)
        and `IOS_TEAM_ID` (your 10-character team id).
      - Variables: `IOS_SIGNING` = `true`, and `IOS_EXPORT_METHOD` = `app-store-connect`
        (TestFlight, the default) or `release-testing` (Ad Hoc).
      - Optional, to upload to TestFlight automatically: an App Store Connect API key as
        `APPSTORE_API_KEY_ID`, `APPSTORE_API_ISSUER_ID` and `APPSTORE_API_PRIVATE_KEY`
        (the contents of the .p8 file).

      On Windows, `[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.p12"))` in
      PowerShell prints a file base64-encoded.
   3. Push. The `ios-signed` job builds a signed `ios-ipa` download, and uploads it to
      TestFlight when the API key is set.

### Can people sideload the iPhone app?

Not the way Android allows. An iPhone only runs apps Apple has signed for it. The
practical ways to get Cincy Rocks onto other people's iPhones:

- **TestFlight (recommended).** Upload the build (above), add testers by email or share a
  public link, and they install it with Apple's free TestFlight app. Up to 10,000 testers,
  each build lasts 90 days, and Apple does a light review before outside testers get it.
- **Ad Hoc.** Register each iPhone's id (up to 100 per device type a year) in your developer
  account, build with `IOS_EXPORT_METHOD` = `release-testing`, and install the `.ipa` with
  Apple Configurator, Xcode or a link to the file.
- **App Store.** Full review, then anyone can install it. This is the only option that
  needs nothing from the person installing it.
- **Your own iPhone without a paid account.** Xcode on a Mac can install it with a free
  Apple ID, but the app stops opening after 7 days until you install it again. Fine for
  trying it, not for sharing.
- In the EU, apps can also be offered through alternative app marketplaces. They still
  need a developer account and Apple's notarization.

Android is simpler: the `.apk` from `npm run android:apk` (or the `android-apk` download)
can be copied to any Android phone and installed directly.

### Trying the app in an emulator

You can run the Android app on a virtual phone, with no real phone needed:

1. Install [Android Studio](https://developer.android.com/studio). On first start,
   let it install the Android SDK.
2. In Android Studio open **Device Manager** and create a virtual device
   (for example a Pixel phone with the latest Android image).
3. Run:

   ```sh
   npm run android:emulator
   ```

   This builds the app, copies it into the Android project, asks which device to use
   (pick the virtual one) and installs and starts the app on it.

On a Mac with Xcode, `npm run ios:simulator` does the same in the iPhone simulator.

Change the app id (`appId` in `capacitor.config.json`, currently
`com.cincyrocks.app`) to one you own before publishing to the stores.

## Making it yours

- Name, dates, town and map: `src/config.ts`
- Map look: `mapStyle` in `src/config.ts`. The map uses free [OpenFreeMap](https://openfreemap.org)
  vector tiles (no key or account); swap `liberty` for `bright` or `positron` for another style.
- Colours: the variables at the top of `src/styles/app.css`
- Logo: the `Logo` drawing in `src/components/Art.tsx` and `public/icon.svg`
- Sample content: `src/data/seed.ts` (demo mode only)

## Publishing this repository to GitHub

```sh
git remote add origin https://github.com/<your-account>/cincy-rocks.git
git push -u origin main
```

The included GitHub Actions workflow builds the website on every push.
