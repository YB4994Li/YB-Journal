import { Link } from 'react-router-dom';
import { WalletCards } from 'lucide-react';

export default function MissingActiveAccount() {
  return <section className="card flex min-h-72 flex-col items-center justify-center p-8 text-center"><WalletCards size={40} className="text-lime"/><p className="mt-4 text-sm text-muted">Select an account from Accounts Center to continue.</p><Link className="btn-primary mt-4" to="/accounts">Go to Accounts Center</Link></section>;
}
