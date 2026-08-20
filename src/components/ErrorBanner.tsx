export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-4 flex items-start gap-2.5 rounded-2xl px-4 py-3 max-w-[42rem] mx-auto no-print"
      style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="font-medium text-red-600" style={{ fontSize: '0.85rem' }}>{message}</p>
    </div>
  )
}
