export function Header() {
  return (
    <header
      className="no-print bg-white border-b border-gray-200 sticky top-0 z-20"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
        <img src="/logo.png" alt="광진구립도서관 로고" className="flex-shrink-0 w-10 h-10 object-contain" />
        <div>
          <h1 className="font-bold text-gray-900 leading-tight" style={{ fontSize: '1.05rem' }}>
            광진구립도서관
          </h1>
          <p className="text-gray-500 font-medium leading-tight" style={{ fontSize: '0.78rem' }}>
            상호대차 인쇄 시스템
          </p>
        </div>
      </div>
    </header>
  )
}
