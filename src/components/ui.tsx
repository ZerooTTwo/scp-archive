import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */

type ButtonVariant = 'filled' | 'tonal' | 'outline' | 'text' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: IconName;
  full?: boolean;
}

export function Button({
  variant = 'filled',
  icon,
  full,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, full && 'btn--full', className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: IconName;
  variant?: 'standard' | 'filled' | 'tonal' | 'plain';
  size?: number;
  selected?: boolean;
}

export function IconButton({
  label,
  icon,
  variant = 'standard',
  size = 22,
  selected,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cx('icon-btn', `icon-btn--${variant}`, selected && 'is-selected', className)}
      aria-label={label}
      title={label}
      aria-pressed={selected === undefined ? undefined : selected}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Fab({
  icon = 'dice',
  label,
  onClick,
  extended = true,
}: {
  icon?: IconName;
  label: string;
  onClick: () => void;
  extended?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx('fab', extended && 'fab--extended')}
      onClick={onClick}
      aria-label={label}
    >
      <Icon name={icon} size={24} />
      {extended ? <span>{label}</span> : null}
    </button>
  );
}

/* ── Selection ───────────────────────────────────────────────────────────── */

export function Chip({
  children,
  selected,
  onClick,
  icon,
  title,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: IconName;
  title?: string;
}) {
  if (!onClick) {
    return (
      <span className={cx('chip', selected && 'chip--selected', 'chip--static')} title={title}>
        {icon ? <Icon name={icon} size={15} /> : null}
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={cx('chip', selected && 'chip--selected')}
      onClick={onClick}
      aria-pressed={selected}
      title={title}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  full = true,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  full?: boolean;
}) {
  return (
    <div className={cx('segmented', full && 'segmented--full')} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={cx('segmented__item', value === option.value && 'is-selected')}
          onClick={() => onChange(option.value)}
        >
          {option.icon ? <Icon name={option.icon} size={17} /> : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx('switch', checked && 'is-on')}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__thumb" />
    </button>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  display: string;
}) {
  const id = useId();
  return (
    <div className="slider-row">
      <div className="slider-row__head">
        <label htmlFor={id}>{label}</label>
        <span className="slider-row__value">{display}</span>
      </div>
      <input
        id={id}
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/* ── Inputs ──────────────────────────────────────────────────────────────── */

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  icon?: IconName;
  onClear?: () => void;
  trailing?: ReactNode;
}

export function TextField({
  value,
  onChange,
  icon,
  onClear,
  trailing,
  className,
  placeholder,
  ...rest
}: TextFieldProps) {
  return (
    <div className={cx('field', className)}>
      {icon ? <Icon name={icon} size={19} className="field__icon" /> : null}
      <input
        className="field__input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
      {value && onClear ? (
        <button type="button" className="field__clear" onClick={onClear} aria-label="清空">
          <Icon name="close" size={16} />
        </button>
      ) : null}
      {trailing}
    </div>
  );
}

/* ── Structure ───────────────────────────────────────────────────────────── */

export function TopBar({
  title,
  subtitle,
  onBack,
  actions,
  border = true,
}: {
  title?: ReactNode;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  border?: boolean;
}) {
  return (
    <header className={cx('topbar', border && 'topbar--border')}>
      {onBack ? <IconButton icon="arrow-left" label="返回" onClick={onBack} /> : null}
      <div className="topbar__text">
        {title ? <div className="topbar__title">{title}</div> : null}
        {subtitle ? <div className="topbar__subtitle">{subtitle}</div> : null}
      </div>
      <div className="topbar__actions">{actions}</div>
    </header>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  hint,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  hint?: string;
}) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-header__title">{title}</h2>
        {hint ? <p className="section-header__hint">{hint}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="section-header__action" onClick={onAction}>
          {actionLabel}
          <Icon name="chevron-right" size={15} />
        </button>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button type="button" className={cx('card', 'card--button', className)} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={cx('card', className)}>{children}</div>;
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning';
}) {
  return <span className={cx('badge', `badge--${tone}`)}>{children}</span>;
}

export function LinearProgress({
  value,
  className,
}: {
  value?: number;
  className?: string;
}) {
  const indeterminate = typeof value !== 'number';
  return (
    <div
      className={cx('linear', indeterminate && 'linear--indeterminate', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
    >
      <span style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Spinner({ label = '加载中' }: { label?: string }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span />
    </span>
  );
}

export function EmptyState({
  icon = 'folder',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx('skeleton', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className="skeleton__line" style={{ width: `${88 - index * 12}%` }} />
      ))}
    </div>
  );
}

/* ── Overlays ────────────────────────────────────────────────────────────── */

function useLockBody(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useLockBody(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__handle" />
        <header className="sheet__head">
          <h2>{title}</h2>
          <IconButton icon="close" label="关闭" onClick={onClose} />
        </header>
        <div className="sheet__body">{children}</div>
        {footer ? <footer className="sheet__footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = '确定',
  cancelLabel = '取消',
  danger,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  useLockBody(open);
  if (!open) return null;
  return createPortal(
    <div
      className="scrim scrim--center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2 className="dialog__title">{title}</h2>
        {description ? <p className="dialog__text">{description}</p> : null}
        {children}
        <div className="dialog__actions">
          <Button variant="text" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'filled'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function Snackbar({
  open,
  message,
  actionLabel,
  onAction,
  onClose,
}: {
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return createPortal(
    <div className="snackbar" role="status" aria-live="polite">
      <span className="snackbar__text">{message}</span>
      {actionLabel && onAction ? (
        <button type="button" className="snackbar__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      <button type="button" className="snackbar__close" onClick={onClose} aria-label="关闭提示">
        <Icon name="close" size={16} />
      </button>
    </div>,
    document.body,
  );
}
