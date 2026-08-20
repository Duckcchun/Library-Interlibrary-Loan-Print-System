import config from '@/data/library-config.json'

const { nameMap, smartNameMap, libraryColors, smartLibraryColors, fallbackColors } = config

/** 도서관명을 간결한 표시명으로 변환 */
export function normalizeLibraryName(name: string): string {
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

/** 도서관 원본명 기준으로 배지 색상 결정 */
export function getLibraryColor(originalName: string): string {
  // 원본 이름으로 직접 매칭
  if (libraryColors[originalName as keyof typeof libraryColors]) {
    return libraryColors[originalName as keyof typeof libraryColors]
  }
  if (smartLibraryColors[originalName as keyof typeof smartLibraryColors]) {
    return smartLibraryColors[originalName as keyof typeof smartLibraryColors]
  }

  // 공백 제거 후 매칭 (엑셀에 띄어쓰기가 다를 수 있음)
  const stripped = originalName.replace(/\s/g, '')
  for (const [key, color] of Object.entries(libraryColors)) {
    if (key.replace(/\s/g, '') === stripped) return color
  }
  for (const [key, color] of Object.entries(smartLibraryColors)) {
    if (key.replace(/\s/g, '') === stripped) return color
  }

  // 변환된 이름으로 매칭
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
