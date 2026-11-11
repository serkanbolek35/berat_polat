import { useSettings } from '../hooks/useSettings'

export default function Logo({ light = true }: { light?: boolean }) {
  const { logoUrl } = useSettings()
  if (logoUrl) return <img src={logoUrl} alt="BEP CAR" className="h-9 w-auto" />
  return (
    <span className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="#FF6A13" />
        <path d="M7 22h20M9 22l2.5-6.5c.3-.8 1-1.3 1.9-1.3h7.2c.8 0 1.5.5 1.9 1.3L25 22" fill="none" stroke="#0B0B0C" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="25.5" r="1.6" fill="#0B0B0C" /><circle cx="22" cy="25.5" r="1.6" fill="#0B0B0C" />
      </svg>
      <span className={`font-display text-[22px] font-bold tracking-wide ${light ? 'text-white' : 'text-ink'}`}>
        BEP <span className="text-accent">CAR</span>
      </span>
    </span>
  )
}
