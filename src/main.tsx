import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import '@fontsource/open-sans/latin-400.css';
import '@fontsource/open-sans/latin-600.css';
import '@fontsource/open-sans/latin-700.css';
import '@fontsource/open-sans/latin-800.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/app.css';
import { Layout } from './components/Layout';
import { Loading } from './components/ShowRow';
import Home from './pages/Home';
import { BandDetail, BandList } from './pages/Bands';
import { Favorites, Schedule } from './pages/Schedule';
import Info from './pages/Info';
import Join from './pages/Join';
import Help from './pages/Help';
import { startLiveUpdates } from './native/liveUpdates';

// The map and the admin area load only when opened, to keep the first screen fast.
const Venues = lazy(() => import('./pages/Venues').then((m) => ({ default: m.Venues })));
const VenueDetail = lazy(() => import('./pages/Venues').then((m) => ({ default: m.VenueDetail })));
const Admin = lazy(() => import('./pages/admin/Admin'));

function NotFound() {
  return <div className="page"><div className="card"><h1>Page not found</h1><Link to="/" className="btn btn-accent">Go home</Link></div></div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <Layout>
        <Suspense fallback={<div className="page"><Loading /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bands" element={<BandList />} />
            <Route path="/bands/:id" element={<BandDetail />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/info" element={<Info />} />
            <Route path="/join" element={<Join />} />
            <Route path="/help" element={<Help />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  </StrictMode>,
);

// Phone apps: pick up new versions published with the website (see src/native/liveUpdates.ts).
startLiveUpdates();

// Fade out the launch splash from index.html once the app has drawn.
const splash = document.getElementById('splash');
if (splash) {
  setTimeout(() => {
    splash.classList.add('gone');
    setTimeout(() => splash.remove(), 500);
  }, 700);
}
