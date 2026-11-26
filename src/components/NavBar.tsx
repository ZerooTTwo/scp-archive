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

const HOME_TAB: NavTab = { to: '/', label: '首页', icon: 'home', end: true };
const BROWSE_TAB: NavTab = { to: '/browse', label: '档案库', icon: 'grid' };
const LIBRARY_TAB: NavTab = {
  to: '/library',
  label: '收藏',
  icon: 'bookmark',
  activeIcon: 'bookmark-filled',
};
const SETTINGS_TAB: NavTab = { to: '/settings', label: '设置', icon: 'settings' };

const TASKFORCE_TAB: NavTab = {
  to: '/taskforces',
  label: '特遣队',
  icon: 'shield',
};

export function NavBar() {
  const { settings } = useSettings();
  const tabs = canAccessTaskforces(settings.clearance)
    ? [HOME_TAB, BROWSE_TAB, TASKFORCE_TAB, LIBRARY_TAB, SETTINGS_TAB]
    : [HOME_TAB, BROWSE_TAB, LIBRARY_TAB, SETTINGS_TAB];

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
