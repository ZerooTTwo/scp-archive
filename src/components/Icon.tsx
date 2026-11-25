import type { ReactNode, SVGProps } from 'react';

const PATHS = {
  home: (
    <>
      <path d="M3 10.7 12 3l9 7.7" />
      <path d="M5.5 9.2V21h13V9.2" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bookmark: <path d="M6.5 3.5h11V21L12 17l-5.5 4z" />,
  'bookmark-filled': (
    <path d="M6.5 3.5h11V21L12 17l-5.5 4z" fill="currentColor" stroke="none" />
  ),
  settings: (
    <>
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2.2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2.2" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M20 12H4.5" />
      <path d="m10.5 18-6-6 6-6" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h15.5" />
      <path d="m13.5 6 6 6-6 6" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 20V4.5" />
      <path d="m6 10.5 6-6 6 6" />
    </>
  ),
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11.5" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 20.5h15" />
    </>
  ),
  'download-done': (
    <>
      <path d="M12 3v10.5" />
      <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 20.5h15" />
      <path d="m9.5 17.5 1.8 1.8 3.7-3.8" />
    </>
  ),
  'cloud-off': (
    <>
      <path d="M7 18h9.5a3.5 3.5 0 0 0 .7-6.93A5.5 5.5 0 0 0 8.2 8.2" />
      <path d="M5.7 9.9A4 4 0 0 0 7 18" />
      <path d="m3.5 3.5 17 17" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.9-6.4" />
      <path d="M20.5 4v5h-5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  close: (
    <>
      <path d="m5.5 5.5 13 13" />
      <path d="m18.5 5.5-13 13" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4" />
      <path d="m8.2 13.2 7.6 4" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4v5h5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="m6 7 .9 13h10.2L18 7" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </>
  ),
  external: (
    <>
      <path d="M13 4h7v7" />
      <path d="m20 4-8.5 8.5" />
      <path d="M18 14.5V20H4V6h5.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />,
  auto: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17" fill="currentColor" stroke="none" />
    </>
  ),
  text: (
    <>
      <path d="M4 19 10.2 5 16.4 19" />
      <path d="M6.6 14.2h7.2" />
      <path d="M19 11v8" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </>
  ),
  filter: <path d="M3.5 5h17l-6.7 8v6.2l-3.6 1.8v-8z" />,
  hash: (
    <>
      <path d="M9.5 3 7.5 21M16.5 3l-2 18" />
      <path d="M4 8.5h16M3 15.5h16" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v5.5c0 5-3.4 8.2-8 9.5-4.6-1.3-8-4.5-8-9.5V6z" />
      <path d="m8.5 12 2.5 2.5 4.5-4.8" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 6.5A2 2 0 0 1 5.5 4.5h4l2 2.5h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21 20H3z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="12" rx="2" />
      <path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1" />
    </>
  ),
  expand: (
    <>
      <path d="M4 9V4h5" />
      <path d="M20 15v5h-5" />
      <path d="M4 4l6 6" />
      <path d="m20 20-6-6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.5 2.4 3.8 5.3 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.3-3.8-8.5s1.3-6.1 3.8-8.5Z" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.5h8l4 4V21H6z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 10a8 8 0 0 1 14-3l2 2" />
      <path d="M20 4v5h-5" />
      <path d="M20 14a8 8 0 0 1-14 3l-2-2" />
      <path d="M4 20v-5h5" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, strokeWidth = 1.8, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      className="brand-logo"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1.25" y="1.25" width="37.5" height="37.5" rx="11" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <path d="M10 13.5h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 20h8" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 20h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.4" />
      <path d="M10 26.5h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
      <circle cx="30" cy="10" r="2.2" fill="var(--primary)" />
    </svg>
  );
}
