import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  const bg = type === 'success' ? '#10B981' : '#EF4444'

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg animate-fade-in"
      style={{ backgroundColor: bg }}
    >
      {message}
    </div>
  )
}
