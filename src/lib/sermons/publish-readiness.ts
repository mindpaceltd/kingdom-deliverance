/**
 * Sermons need a featured/cover image before they can publish or schedule.
 * Manuscript imports without a thumbnail stay drafts until one is set.
 */
export function sermonHasPublishMedia(input: {
  thumbnail_url?: string | null
}): boolean {
  return Boolean(input.thumbnail_url?.trim())
}

export const SERMON_PUBLISH_MEDIA_REQUIRED =
  'Add a featured image before publishing or scheduling. Sermons without a cover image stay as drafts.'
