import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, subtitle, children, wide = false, closeDisabled = false }) {
  useEffect(() => {
    if (!open) return;
    const close = (event) => event.key === 'Escape' && !closeDisabled && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open, onClose, closeDisabled]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={title} className={`card max-h-[92vh] w-full overflow-hidden ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="flex items-start justify-between border-b border-line px-6 py-5">
        <div><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
        <button aria-label="Close" disabled={closeDisabled} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={onClose}><X size={18}/></button>
      </div>
      <div className="scrollbar max-h-[calc(92vh-82px)] overflow-y-auto p-6">{children}</div>
    </div>
  </div>;
}
