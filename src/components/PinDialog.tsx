import { useState, useRef, useEffect } from 'react'

interface PinDialogProps {
  onVerify: (pin: string) => boolean
  onClose: () => void
}

export function PinDialog({ onVerify, onClose }: PinDialogProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!onVerify(pin)) {
      setError(true)
      setPin('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-80 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-gray-900 text-center mb-4" style={{ fontSize: '1.1rem' }}>
          관리자 인증
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            placeholder="PIN 입력"
            className="w-full text-center text-2xl tracking-[0.5em] font-bold border-2 border-gray-200 rounded-xl py-3 focus:outline-none focus:border-blue-500 transition-colors"
            aria-label="관리자 PIN 입력"
          />
          {error && (
            <p className="text-red-500 text-center mt-2 text-sm font-medium">
              PIN이 올바르지 않습니다
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl font-bold text-white transition-colors"
              style={{ backgroundColor: '#3182F6' }}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
