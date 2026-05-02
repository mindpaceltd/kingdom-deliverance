'use client'

import { useState } from 'react'

interface FormatSelectorProps {
  formats?: string[]
}

export function FormatSelector({ formats = ['eBook (PDF)', 'Audiobook (MP3)', 'Paperback'] }: FormatSelectorProps) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="mb-5">
      <p className="text-sm font-bold text-gray-700 mb-2">Format</p>
      <div className="flex gap-2 flex-wrap">
        {formats.map((fmt, i) => (
          <button
            key={fmt}
            onClick={() => setSelected(i)}
            className={`px-4 py-1.5 rounded border text-sm font-medium transition-colors ${
              i === selected
                ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#1e3a5f]'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>
    </div>
  )
}
