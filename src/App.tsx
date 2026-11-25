import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { NavBar } from './components/NavBar';
import { useNativeBack, useSplash } from './lib/hooks';
import { Browse } from './pages/Browse';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { NotFound } from './pages/NotFound';
import { Reader } from './pages/Reader';
import { Search } from './pages/Search';
import { SettingsPage } from './pages/Settings';

const TAB_PATHS = new Set(['/', '/browse', '/search', '/library']);

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();

  useSplash();
  useNativeBack(() => {
    void CapacitorApp.exitApp();
  });

  const isReader = location.pathname.startsWith('/read/');
  const showNav = TAB_PATHS.has(location.pathname);

  useEffect(() => {
    if (!isReader) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, isReader]);

  return (
    <div className={isReader ? 'app app--reader' : 'app'}>
      <main className={showNav ? 'app-main app-main--tab' : 'app-main'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/read/:branch/:slug" element={<Reader />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={<NotFound onHome={() => navigate('/', { replace: true })} />}
          />
        </Routes>
      </main>
      {showNav ? <NavBar /> : null}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
