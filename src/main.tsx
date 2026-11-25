import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CatalogProvider } from './state/catalog';
import { LibraryProvider } from './state/library';
import { SettingsProvider } from './state/settings';
import { ToastProvider } from './state/toast';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/reader.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <SettingsProvider>
      <ToastProvider>
        <CatalogProvider>
          <LibraryProvider>
            <App />
          </LibraryProvider>
        </CatalogProvider>
      </ToastProvider>
    </SettingsProvider>
  </StrictMode>,
);
