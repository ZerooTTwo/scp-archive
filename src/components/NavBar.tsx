import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: Array<{ to: string; label: string; icon: IconName; activeIcon?: IconName; end?: boolean }> = [
  { to: '/', label: '首页', icon: 'home', end: true },
  { to: '/browse', label: '档案库', icon: 'grid' },
  { to: '/search', label: '搜索', icon: 'search' },
  { to: '/library', label: '收藏', icon: 'bookmark', activeIcon: 'bookmark-filled' },
];

export function NavBar() {
  return (
    <nav className="navbar" aria-label="主导航">
      <div className="navbar__inner">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `navbar__item${isActive ? ' is-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className="navbar__icon">
                  <Icon name={isActive && tab.activeIcon ? tab.activeIcon : tab.icon} size={23} />
                </span>
                <span className="navbar__label">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
