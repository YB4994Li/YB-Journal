import PageContainer from '../components/layout/PageContainer.jsx';

export default function ComingSoon({ name }) {
  return <PageContainer><section className="card flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center p-8 text-center"><h1 className="text-3xl font-semibold tracking-tight">{name}</h1><p className="mt-3 text-sm text-muted">Coming soon.</p></section></PageContainer>;
}
