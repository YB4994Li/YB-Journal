import { useEffect, useRef } from 'react';
import Modal from './Modal.jsx';

const styles = {
  DEFAULT: 'btn-primary',
  SUCCESS: 'btn bg-lime text-black hover:bg-lime/90',
  WARNING: 'btn bg-amber-500 text-black hover:bg-amber-400',
  DANGER: 'btn bg-rose-500 text-white hover:bg-rose-400'
};

export default function ConfirmModal({
  isOpen,
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'DEFAULT',
  isLoading,
  busy,
  onConfirm,
  onCancel,
  onClose
}) {
  const confirmRef = useRef(null);
  const visible = isOpen ?? open;
  const loading = isLoading ?? busy ?? false;
  const cancel = onCancel ?? onClose;
  const safeCancel = () => { if (!loading) cancel?.(); };

  useEffect(() => {
    if (visible) requestAnimationFrame(() => confirmRef.current?.focus());
  }, [visible]);

  return <Modal open={visible} onClose={safeCancel} closeDisabled={loading} title={title}>
    <p className="text-sm leading-6 text-slate-300">{message}</p>
    <div className="mt-6 flex justify-end gap-3">
      <button className="btn-secondary" disabled={loading} onClick={safeCancel}>{cancelLabel}</button>
      <button ref={confirmRef} className={styles[variant] || styles.DEFAULT} disabled={loading} onClick={onConfirm}>
        {loading ? 'Working…' : confirmLabel}
      </button>
    </div>
  </Modal>;
}
