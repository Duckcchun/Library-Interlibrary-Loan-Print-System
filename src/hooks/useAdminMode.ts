import { useState, useEffect, useCallback, useRef } from 'react'

const ADMIN_PIN = '1234'
const SHIFT_COUNT_REQUIRED = 5
const SHIFT_TIMEOUT_MS = 3000

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const shiftCountRef = useRef(0)
  const shiftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 이미 관리자 모드이거나 PIN 다이얼로그가 열려있으면 무시
    if (isAdmin || showPinDialog) return

    if (e.key === 'Shift') {
      shiftCountRef.current += 1

      // 타이머 리셋
      if (shiftTimerRef.current) clearTimeout(shiftTimerRef.current)
      shiftTimerRef.current = setTimeout(() => {
        shiftCountRef.current = 0
      }, SHIFT_TIMEOUT_MS)

      if (shiftCountRef.current >= SHIFT_COUNT_REQUIRED) {
        shiftCountRef.current = 0
        if (shiftTimerRef.current) clearTimeout(shiftTimerRef.current)
        setShowPinDialog(true)
      }
    }
  }, [isAdmin, showPinDialog])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const verifyPin = (pin: string): boolean => {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true)
      setShowPinDialog(false)
      return true
    }
    return false
  }

  const exitAdmin = () => {
    setIsAdmin(false)
  }

  const closePinDialog = () => {
    setShowPinDialog(false)
  }

  return { isAdmin, showPinDialog, verifyPin, exitAdmin, closePinDialog }
}
