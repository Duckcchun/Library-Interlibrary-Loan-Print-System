import { useState, useEffect } from 'react'

interface FloatingPrintButtonProps {
  onPrint: () => void
  show: boolean
}

export function FloatingPrintButton({ onPrint, show }: FloatingPrintButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) { setVisible(false); return }

    // 스크롤이 상단 컨트롤을 지나쳤을 때만 표시
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [show])

  if (!visible) return null

  return (
    <button
      onClick={onPrint}
      className="no-print fixed bottom-6 right-6 z-30 font-bold text-white rounded-full shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
      style={{
        backgroundColor: '#3182F6',
        padding: '0.85rem 1.5rem',
        boxShadow: '0 6px 20px rgba(49,130,246,0.4)',
      }}
      aria-label="인쇄하기"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      인쇄하기
    </button>
  )
}
