import localConfig from '@/data/library-config.json'
import { supabase, type LibraryRow } from '@/lib/supabase'

const { fallbackColors } = localConfig

// 런타임 캐시
let cachedLibraries: LibraryRow[] | null = null

/** Supabase에서 도서관 데이터 로드 (캐시 사용) */
export async function loadLibraries(): Promise<LibraryRow[]> {
  if (cachedLibraries) return cachedLibraries

  try {
    const { data, error } = await supabase
      .from('libraries')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data && data.length > 0) {
      cachedLibraries = data
      return data
    }
  } catch {
    // Supabase 연결 실패 시 로컬 폴백
  }

  return []
}

/** 캐시 무효화 (관리자 패널에서 데이터 변경 후 호출) */
export function invalidateCache() {
  cachedLibraries = null
}

/** 도서관명을 간결한 표시명으로 변환 (Supabase 데이터 우선) */
export function normalizeLibraryName(name: string): string {
  if (!name) return ''

  // Supabase 캐시에서 찾기
  if (cachedLibraries) {
    const found = cachedLibraries.find(
      (lib) => lib.name === name || lib.name.replace(/\s/g, '') === name.replace(/\s/g, '')
    )
    if (found) return found.display_name
  }

  // 로컬 폴백
  const { nameMap, smartNameMap } = localConfig
  if (nameMap[name as keyof typeof nameMap]) {
    return nameMap[name as keyof typeof nameMap]
  }
  if (smartNameMap[name as keyof typeof smartNameMap]) {
    return smartNameMap[name as keyof typeof smartNameMap]
  }
  if (name.includes('스마트도서관')) {
    return name.replace('스마트도서관', ' 스마트')
  }
  return name
}

/** 도서관 원본명 기준으로 배지 색상 결정 (Supabase 데이터 우선) */
export function getLibraryColor(originalName: string): string {
  if (!originalName) return fallbackColors[0]

  // Supabase 캐시에서 찾기
  if (cachedLibraries) {
    const stripped = originalName.replace(/\s/g, '')
    const found = cachedLibraries.find(
      (lib) => lib.name === originalName || lib.name.replace(/\s/g, '') === stripped
    )
    if (found) return found.color
  }

  // 로컬 폴백
  const { libraryColors, smartLibraryColors } = localConfig
  if (libraryColors[originalName as keyof typeof libraryColors]) {
    return libraryColors[originalName as keyof typeof libraryColors]
  }
  if (smartLibraryColors[originalName as keyof typeof smartLibraryColors]) {
    return smartLibraryColors[originalName as keyof typeof smartLibraryColors]
  }

  const stripped = originalName.replace(/\s/g, '')
  for (const [key, color] of Object.entries(libraryColors)) {
    if (key.replace(/\s/g, '') === stripped) return color
  }
  for (const [key, color] of Object.entries(smartLibraryColors)) {
    if (key.replace(/\s/g, '') === stripped) return color
  }

  const normalized = normalizeLibraryName(originalName)
  if (libraryColors[normalized as keyof typeof libraryColors]) {
    return libraryColors[normalized as keyof typeof libraryColors]
  }

  // 스마트도서관 키워드 매칭
  if (originalName.includes('스마트') || stripped.includes('스마트')) {
    if (stripped.includes('구의역')) return '#8bbeeb'
    if (stripped.includes('군자역')) return '#8bbeeb'
    if (stripped.includes('체육센터') || stripped.includes('구민체육')) return '#8bbeeb'
    if (stripped.includes('문화예술') || stripped.includes('예술회관')) return '#f4ac80'
    if (stripped.includes('어린이대공원')) return '#f4ac80'
    if (stripped.includes('중곡')) return '#abe46e'
    if (stripped.includes('아차산')) return '#abe46e'
  }

  // 폴백: 해시 기반 색상
  let hash = 0
  for (let i = 0; i < originalName.length; i++) {
    hash = originalName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length]
}
