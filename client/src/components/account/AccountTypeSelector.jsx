export default function AccountTypeSelector({ value, onChange, disabled }) {
  return <div><label className="label">Account type</label><div className="grid grid-cols-2 gap-2">
    {['REAL','FUNDED'].map((type)=><button key={type} disabled={disabled} type="button" onClick={()=>onChange(type)} className={`rounded-xl border p-3 text-sm font-semibold ${value===type?'border-lime bg-lime/10 text-lime':'border-line bg-ink/40 text-muted'}`}>{type === 'REAL' ? 'Real account' : 'Funded account'}</button>)}
  </div></div>;
}
