import { Menu } from 'lucide-react';

export default function MobileHeader({ onOpen }) {
  return <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur md:hidden">
    <div className="flex items-center gap-2.5"><img src="/yb-journal-logo.png" alt="" className="h-10 w-10 object-contain"/><span className="font-semibold"><span className="text-lime">YB</span>-Journal</span></div>
    <button type="button" className="rounded-lg border border-line bg-[#171d27] p-2.5 text-slate-200 transition hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime" onClick={onOpen} aria-label="Open navigation menu"><Menu size={20}/></button>
  </header>;
}
