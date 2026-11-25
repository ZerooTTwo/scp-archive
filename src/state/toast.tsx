import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Snackbar } from '../components/ui';

interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
  message: string;
}

type ShowToast = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const show = useCallback<ShowToast>(
    (message, options) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      idRef.current += 1;
      setToast({ id: idRef.current, message, ...options });
      const duration = options?.duration ?? (options?.actionLabel ? 5000 : 3200);
      timerRef.current = window.setTimeout(() => setToast(null), duration);
    },
    [],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.id ?? 0}
        message={toast?.message ?? ''}
        actionLabel={toast?.actionLabel}
        onAction={() => {
          toast?.onAction?.();
          dismiss();
        }}
        onClose={dismiss}
        open={Boolean(toast)}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
