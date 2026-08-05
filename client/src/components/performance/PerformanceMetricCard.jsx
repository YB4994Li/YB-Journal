export default function PerformanceMetricCard({ label, value, detail }) {
  return <article className="card p-4"><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>{detail && <p className="mt-1 text-xs text-muted">{detail}</p>}</article>;
}
