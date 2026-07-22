import { Scan, ShieldCheck } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white">
        <Scan className="w-5 h-5" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-bold text-neutral-900 text-sm">AI Adoption</span>
        <span className="text-xs text-neutral-500">& Opportunity Audit</span>
      </div>
    </div>
  );
}

export function LogoFull() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-neutral-900 text-base">AI Adoption & Opportunity Audit</span>
        <span className="text-xs text-neutral-500">Discover your AI opportunities</span>
      </div>
    </div>
  );
}
