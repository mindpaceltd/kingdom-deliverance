'use client'

import * as React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { DownloadIcon, ClipboardCopyIcon, CheckIcon } from 'lucide-react'

interface QrEntry {
  id: string
  title: string
  subtitle: string
  value: string
  color: string
}

interface Props {
  qrCodes: QrEntry[]
}

function QrCard({ entry }: { entry: QrEntry }) {
  const [copied, setCopied] = React.useState(false)

  const accentColor = entry.color || '#1a1a2e'

  async function handleCopy() {
    if (!entry.value) return
    await navigator.clipboard.writeText(entry.value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const svg = document.getElementById(`qr-svg-${entry.id}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const img = new Image()
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      const pngUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `${entry.title || 'qr-code'}.png`
      a.click()
    }
    img.src = url
  }

  return (
    <div
      className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-amber-500/10"
      style={{ background: `linear-gradient(145deg, ${accentColor}ee, ${accentColor}88)` }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accentColor}66 0%, transparent 70%)` }}
      />

      <div className="relative p-8 flex flex-col items-center gap-6">
        {/* Label */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">{entry.title || 'Untitled'}</h2>
          {entry.subtitle && (
            <p className="mt-1 text-sm text-white/60">{entry.subtitle}</p>
          )}
        </div>

        {/* QR Code */}
        <a
          href="https://kdcuganda.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-2xl p-4 shadow-xl ring-4 ring-white/20 hover:scale-105 transition-transform duration-200 cursor-pointer block"
          title="Click to visit KDC Uganda"
        >
          {entry.value ? (
            <QRCodeSVG
              id={`qr-svg-${entry.id}`}
              value={entry.value}
              size={200}
              bgColor="#ffffff"
              fgColor="#111111"
              level="M"
              includeMargin={false}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400 text-xs text-center px-4">
              No value set yet
            </div>
          )}
        </a>

        {/* Value display */}
        {entry.value && (
          <p className="text-[11px] font-mono text-white/40 break-all text-center max-w-[220px] line-clamp-2">
            {entry.value}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors backdrop-blur-sm"
            disabled={!entry.value}
          >
            {copied ? (
              <><CheckIcon className="size-3.5 text-green-400" /> Copied!</>
            ) : (
              <><ClipboardCopyIcon className="size-3.5" /> Copy Value</>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-medium transition-colors backdrop-blur-sm"
            disabled={!entry.value}
          >
            <DownloadIcon className="size-3.5" /> Save PNG
          </button>
        </div>
      </div>
    </div>
  )
}

export function QrCodesDisplay({ qrCodes }: Props) {
  if (!qrCodes || qrCodes.length === 0) {
    return (
      <div className="text-center py-20 text-white/30">
        <div className="text-6xl mb-4">📲</div>
        <p className="text-lg font-medium">Payment methods coming soon.</p>
        <p className="text-sm mt-2">QR codes will appear here once configured.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {qrCodes.map((entry) => (
        <QrCard key={entry.id || entry.title} entry={entry} />
      ))}
    </div>
  )
}
