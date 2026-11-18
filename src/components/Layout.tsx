import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Logo, Skyline } from './Art';
import { store } from '../data/store';

const tabs = [
  { to: '/', label: 'Home', icon: 'house-door' },
  { to: '/bands', label: 'Bands', icon: 'music-note-beamed' },
  { to: '/schedule', label: 'Schedule', icon: 'calendar3' },
  { to: '/venues', label: 'Map', icon: 'geo-alt' },
  { to: '/favorites', label: 'My Fest', icon: 'heart' },
];

const more = [
  { to: '/info', label: 'News & Info', icon: 'megaphone' },
  { to: '/join', label: 'Band Sign-Up', icon: 'person-plus' },
  { to: '/admin', label: 'Admin', icon: 'shield-lock' },
];

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  const isTop = tabs.some((t) => t.to === loc.pathname) || loc.pathname === '/info' || loc.pathname === '/join' || loc.pathname === '/admin';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          {isTop ? (
            <Link to="/" className="brand" aria-label="Home"><Logo size={38} withText /></Link>
          ) : (
            <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Back">
              <Icon name="chevron-left" />
            </button>
          )}
          <nav className="desk-nav" aria-label="Main">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.to === '/'} className="desk-link">{t.label}</NavLink>
            ))}
            {more.map((t) => (
              <NavLink key={t.to} to={t.to} className="desk-link">{t.label}</NavLink>
            ))}
          </nav>
          {!isTop && <Link to="/" className="brand brand-center" aria-label="Home"><Logo size={34} /></Link>}
          <button className="icon-btn menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="More" aria-expanded={menuOpen}>
            <Icon name={menuOpen ? 'x-lg' : 'list'} />
          </button>
        </div>
        {menuOpen && (
          <div className="menu-sheet" role="menu">
            {more.map((t) => (
              <Link key={t.to} to={t.to} className="menu-item" role="menuitem"><Icon name={t.icon} /> {t.label}</Link>
            ))}
            {store.mode === 'demo' && <p className="menu-note"><Icon name="info-circle" /> Demo mode: changes are saved on this device only.</p>}
          </div>
        )}
      </header>

      <main className="content">{children}</main>

      <footer className="site-foot">
        <Skyline />
        <div className="foot-band">
          <Logo size={28} withText />
        </div>
      </footer>

      <nav className="tabbar" aria-label="Tabs">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className="tab">
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
