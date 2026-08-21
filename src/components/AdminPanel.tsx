import { useState, useEffect, useCallback } from 'react'
import { supabase, type LibraryRow } from '@/lib/supabase'
import { ColorPicker } from '@/components/ColorPicker'
import { Toast } from '@/components/Toast'

interface AdminPanelProps {
  onExit: () => void
  onUpdate: () => void
}

export function AdminPanel({ onExit, onUpdate }: AdminPanelProps) {
  const [libraries, setLibraries] = useState<LibraryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }, [])

  // 새 도서관 추가 폼
  const [newName, setNewName] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newColor, setNewColor] = useState('#044984')
  const [newType, setNewType] = useState<'general' | 'smart'>('general')

  // 편집 중인 항목
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editColor, setEditColor] = useState('')

  useEffect(() => {
    fetchLibraries()
  }, [])

  const fetchLibraries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('libraries')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!error && data) {
      setLibraries(data)
    }
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setSaving(true)
    const { error } = await supabase.from('libraries').insert({
      name: newName.trim(),
      display_name: newDisplayName.trim() || newName.trim(),
      color: newColor,
      type: newType,
      sort_order: libraries.length,
    })

    if (error) {
      showToast(error.code === '23505' ? '이미 등록된 도서관명입니다' : '추가 실패: ' + error.message, 'error')
    } else {
      setNewName('')
      setNewDisplayName('')
      setNewColor('#044984')
      setNewType('general')
      await fetchLibraries()
      onUpdate()
      showToast('도서관이 추가되었습니다', 'success')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 도서관을 삭제하시겠습니까?`)) return

    const { error } = await supabase.from('libraries').delete().eq('id', id)
    if (error) {
      showToast('삭제 실패: ' + error.message, 'error')
    } else {
      await fetchLibraries()
      onUpdate()
      showToast('삭제되었습니다', 'success')
    }
  }

  const startEdit = (lib: LibraryRow) => {
    setEditingId(lib.id)
    setEditDisplayName(lib.display_name)
    setEditColor(lib.color)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    setSaving(true)
    const { error } = await supabase
      .from('libraries')
      .update({ display_name: editDisplayName, color: editColor })
      .eq('id', editingId)

    if (error) {
      showToast('저장 실패: ' + error.message, 'error')
    } else {
      setEditingId(null)
      await fetchLibraries()
      onUpdate()
      showToast('변경사항이 저장되었습니다', 'success')
    }
    setSaving(false)
  }

  return (
    <div className="no-print fixed inset-0 z-40 overflow-auto" style={{ backgroundColor: '#F2F4F6' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900" style={{ fontSize: '1.1rem' }}>관리자 모드</h1>
            <p className="text-gray-500 text-sm">도서관 관리 · 색상 설정</p>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            나가기
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 도서관 추가 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">도서관 추가</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="도서관 원본명 (엑셀에 표시되는 이름)"
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              />
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="카드 표시명 (짧은 이름, 비우면 원본명)"
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'general' | 'smart')}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="general">일반 도서관</option>
                <option value="smart">스마트도서관</option>
              </select>

              <div className="flex-1">
                <span className="text-sm text-gray-500 mb-1 block">색상:</span>
                <ColorPicker value={newColor} onChange={setNewColor} />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !newName.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#3182F6' }}
            >
              {saving ? '저장 중...' : '추가'}
            </button>
          </form>
        </div>

        {/* 도서관 목록 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">
            도서관 목록 ({libraries.length}개)
          </h2>

          {loading ? (
            <p className="text-gray-400 text-center py-8">불러오는 중...</p>
          ) : libraries.length === 0 ? (
            <p className="text-gray-400 text-center py-8">등록된 도서관이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {libraries.map((lib) => (
                <div
                  key={lib.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {editingId === lib.id ? (
                    // 편집 모드
                    <>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: editColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400">{lib.name}</p>
                            <input
                              type="text"
                              value={editDisplayName}
                              onChange={(e) => setEditDisplayName(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                              style={{ backgroundColor: '#3182F6' }}
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                        <ColorPicker value={editColor} onChange={setEditColor} />
                      </div>
                    </>
                  ) : (
                    // 보기 모드
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: lib.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{lib.display_name}</p>
                        <p className="text-xs text-gray-400 truncate">{lib.name} · {lib.type === 'smart' ? '스마트' : '일반'}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(lib)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDelete(lib.id, lib.name)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>참고:</strong> 여기서 변경한 내용은 즉시 모든 도서관에 반영됩니다.
            도서관 "원본명"은 엑셀 파일의 요청도서관 컬럼에 적힌 이름과 동일해야 합니다.
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
