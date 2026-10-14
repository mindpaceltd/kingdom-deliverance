import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getFireServiceSchedule } from '@/lib/fire-service-schedule'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The photographs and artwork stay fixed; the printed event date follows the schedule.
export async function GET() {
  const schedule = getFireServiceSchedule()
  const artwork = await readFile(path.join(process.cwd(), 'public/events/fire-service-bishop-church.png'))
  const headers = { 'Cache-Control': 'public, max-age=60, must-revalidate', 'X-Fire-Service-Date': schedule.startIso }
  if (schedule.formattedDate === 'Friday, October 30, 2026') {
    return new Response(new Uint8Array(artwork), { headers: { ...headers, 'Content-Type': 'image/png' } })
  }
  return new ImageResponse(
    <div style={{ display: 'flex', width: 1200, height: 1500, position: 'relative', background: '#100c16' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${artwork.toString('base64')}`} alt="" width={1200} height={1500} style={{ position: 'absolute', inset: 0, objectFit: 'fill' }} />
      <div style={{ display: 'flex', position: 'absolute', left: 93, top: 1048, width: 1014, height: 145, background: '#040b19', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#f9e6ae' }}>
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700 }}>{schedule.formattedDate.toUpperCase()}</div>
        <div style={{ display: 'flex', marginTop: 15, fontSize: 34, color: '#fff7e2' }}>6:00 PM – 9:30 PM EAT</div>
      </div>
    </div>,
    { width: 1200, height: 1500, headers },
  )
}
