import { useState } from 'react'

const PRESET_COLORS = [
  '#044984', '#e8630f', '#406d0f', '#d9c000', '#6969be',
  '#e591ab', '#487497', '#e84b4b', '#8bbeeb', '#abe46e',
  '#f4ac80', '#6366F1', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#F97316', '#14B8A6', '#EC4899', '#06B6D4',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const rgb = hexToRgb(value)

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: string) => {
    const num = parseInt(val) || 0
    const clamped = Math.max(0, Math.min(255, num))
    const newRgb = { ...rgb, [channel]: clamped }
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b))
  }

  return (
    <div className="space-y-2">
      {/* 프리셋 색상 */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => { onChange(color); setShowCustom(false) }}
            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: value === color ? '#1F2937' : 'transparent',
              transform: value === color ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
        {/* 직접 선택 버튼 */}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          style={{ fontSize: '0.7rem' }}
          title="직접 색상 선택"
        >
          +
        </button>
      </div>

      {/* 직접 색상 입력 */}
      {showCustom && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          {/* 네이티브 색상 피커 */}
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
              style={{ backgroundColor: value }}
            />
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* RGB 슬라이더 */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-red-500 w-3">R</span>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChange('r', e.target.value)}
                className="flex-1 h-1.5 accent-red-500"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChange('r', e.target.value)}
                className="w-12 text-xs text-center border border-gray-200 rounded px-1 py-0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-500 w-3">G</span>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChange('g', e.target.value)}
                className="flex-1 h-1.5 accent-green-500"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChange('g', e.target.value)}
                className="w-12 text-xs text-center border border-gray-200 rounded px-1 py-0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-500 w-3">B</span>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChange('b', e.target.value)}
                className="flex-1 h-1.5 accent-blue-500"
              />
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChange('b', e.target.value)}
                className="w-12 text-xs text-center border border-gray-200 rounded px-1 py-0.5"
              />
            </div>
          </div>

          {/* HEX 직접 입력 */}
          <div className="flex-shrink-0">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  if (v.length === 7) onChange(v)
                  // 입력 중에는 그냥 허용
                }
              }}
              onBlur={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
              }}
              placeholder="#000000"
              className="w-20 text-xs text-center border border-gray-200 rounded-lg px-2 py-1.5 font-mono"
            />
          </div>
        </div>
      )}
    </div>
  )
}
