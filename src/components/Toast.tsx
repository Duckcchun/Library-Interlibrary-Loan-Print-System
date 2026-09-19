import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  actionLabel?: string
  onAction?: () => void
}

export function Toast({ message, type, onClose, actionLabel, onAction }: ToastProps) {
  useEffect(() => {
    // 실행 취소 버튼이 있으면 조금 더 오래 표시
    const timer = setTimeout(onClose, actionLabel ? 4000 : 2500)
    return () => clearTimeout(timer)
  }, [onClose, actionLabel])

  const bg = type === 'success' ? '#10B981' : '#EF4444'

  return (
    <div
      className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg animate-fade-in"
      style={{ backgroundColor: bg }}
    >
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={() => {
            onAction()
          }}
          className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
          style={{ marginLeft: '0.25rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
