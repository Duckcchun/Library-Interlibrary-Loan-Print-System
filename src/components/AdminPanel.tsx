import { useState, useEffect } from 'react'
import { supabase, type LibraryRow } from '@/lib/supabase'

interface AdminPanelProps {
  onExit: () => void
  onUpdate: () => void
}

const PRESET_COLORS = [
  '#044984', '#e8630f', '#406d0f', '#d9c000', '#6969be',
  '#e591ab', '#487497', '#e84b4b', '#8bbeeb', '#abe46e',
  '#f4ac80', '#6366F1', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#F97316', '#14B8A6', '#EC4899', '#06B6D4',
]

export function AdminPanel({ onExit, onUpdate }: AdminPanelProps) {
  const [libraries, setLibraries] = useState<LibraryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 새 도서관 추가 폼
  const [newName, setNewName] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
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

    if (!error) {
      setNewName('')
      setNewDisplayName('')
      setNewColor(PRESET_COLORS[0])
      setNewType('general')
      await fetchLibraries()
      onUpdate()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 도서관을 삭제하시겠습니까?`)) return

    const { error } = await supabase.from('libraries').delete().eq('id', id)
    if (!error) {
      await fetchLibraries()
      onUpdate()
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

    if (!error) {
      setEditingId(null)
      await fetchLibraries()
      onUpdate()
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

              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-500 flex-shrink-0">색상:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: newColor === color ? '#1F2937' : 'transparent',
                        transform: newColor === color ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
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
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer relative group"
                        style={{ backgroundColor: editColor }}
                      >
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
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
    </div>
  )
}
