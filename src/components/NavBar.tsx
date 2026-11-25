import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { canAccessTaskforces } from '../lib/clearance';
import { useSettings } from '../state/settings';

interface NavTab {
  to: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  end?: boolean;
}

const TABS: NavTab[] = [
  { to: '/', label: '首页', icon: 'home', end: true },
  { to: '/browse', label: '档案库', icon: 'grid' },
  { to: '/search', label: '搜索', icon: 'search' },
  { to: '/library', label: '收藏', icon: 'bookmark', activeIcon: 'bookmark-filled' },
];

const TASKFORCE_TAB: NavTab = {
  to: '/taskforces',
  label: '特遣队',
  icon: 'shield',
};

export function NavBar() {
  const { settings } = useSettings();
  const tabs = canAccessTaskforces(settings.clearance)
    ? [...TABS, TASKFORCE_TAB]
    : TABS;

  return (
    <nav className="navbar" aria-label="主导航">
      <div className={`navbar__inner${tabs.length === 5 ? ' navbar__inner--five' : ''}`}>
        {tabs.map((tab) => (
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
