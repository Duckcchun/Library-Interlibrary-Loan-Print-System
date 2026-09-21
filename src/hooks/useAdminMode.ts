import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const SHIFT_COUNT_REQUIRED = 5
const SHIFT_TIMEOUT_MS = 3000

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  // 검증에 성공한 PIN을 메모리에 보관 → 쓰기 RPC 호출 시 DB에 전달
  const [adminPin, setAdminPin] = useState<string | null>(null)
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

  // PIN 검증은 DB(verify_admin_pin RPC)에서 수행한다.
  // 성공 시 PIN을 메모리에 보관해 이후 쓰기 RPC에 사용한다.
  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_admin_pin', { p_pin: pin })
      if (error || data !== true) return false
      setAdminPin(pin)
      setIsAdmin(true)
      setShowPinDialog(false)
      return true
    } catch {
      return false
    }
  }

  const exitAdmin = () => {
    setIsAdmin(false)
    setAdminPin(null)
  }

  const closePinDialog = () => {
    setShowPinDialog(false)
  }

  return { isAdmin, adminPin, showPinDialog, verifyPin, exitAdmin, closePinDialog }
}
