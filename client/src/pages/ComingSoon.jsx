import PageContainer from '../components/layout/PageContainer.jsx';
import ActiveAccountIndicator from '../components/account/ActiveAccountIndicator.jsx';
import MissingActiveAccount from '../components/account/MissingActiveAccount.jsx';
import { useActiveAccount } from '../context/ActiveAccountContext.jsx';

export default function ComingSoon({ name, accountRequired = false }) {
  const { activeAccountId } = useActiveAccount();
  return <PageContainer className="space-y-5">{accountRequired && <ActiveAccountIndicator/>}{accountRequired && !activeAccountId ? <MissingActiveAccount/> : <section className="card flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center p-8 text-center"><h1 className="text-3xl font-semibold tracking-tight">{name}</h1><p className="mt-3 text-sm text-muted">Coming soon.</p></section>}</PageContainer>;
}
