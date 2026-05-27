import type { SubmitGoogleIndexingResult } from '@/lib/seo/submit-google-indexing-client'
import { toast } from 'sonner'

export function reportIndexingToast(result: SubmitGoogleIndexingResult): boolean {
  if (!result.ok) {
    if (result.needsReauth) {
      toast.error(result.message, {
        description: result.hint,
        action: {
          label: 'Reconnect Google',
          onClick: () => {
            window.location.href = '/api/google/auth?reconnect=1'
          },
        },
        duration: 12000,
      })
    } else {
      toast.error(result.message, { description: result.hint })
    }
    return false
  }
  toast.success(result.message)
  return true
}
