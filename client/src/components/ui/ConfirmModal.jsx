import Modal from './Modal.jsx';
export default function ConfirmModal({ open, title, message, onConfirm, onClose, busy }) {
  return <Modal open={open} onClose={onClose} title={title}>
    <p className="text-sm leading-6 text-slate-300">{message}</p>
    <div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn bg-rose-500 text-white hover:bg-rose-400" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete'}</button></div>
  </Modal>;
}
