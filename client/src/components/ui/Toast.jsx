import { CheckCircle2, AlertCircle, X } from 'lucide-react';
export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;
  return <div className={`fixed bottom-5 right-5 z-[80] flex max-w-md items-start gap-3 rounded-xl border bg-panel p-4 shadow-2xl ${toast.type === 'error' ? 'border-rose-500/40' : 'border-lime/40'}`}>
    <Icon className={toast.type === 'error' ? 'text-rose-400' : 'text-lime'} size={20}/>
    <p className="flex-1 text-sm">{toast.message}</p><button onClick={onClose}><X size={16}/></button>
  </div>;
}
