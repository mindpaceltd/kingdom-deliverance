import { AiWriterClient } from '@/components/admin/digital-ministry/ai-writer-client'
import { getDmAiWriterStats } from '@/lib/digital-ministry/posts'

export default async function AiWriterPage() {
  const stats = await getDmAiWriterStats()

  return <AiWriterClient stats={stats} />
}
