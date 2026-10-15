import { isValidLinkUrl } from '@/stores/linksStore'

/**
 * Pull the first web URL out of a value shared by another app.
 *
 * Social apps sometimes share a caption followed by a URL instead of passing
 * the URL as the complete payload. Keep the extractor deliberately strict so
 * file URIs, app deep links, and arbitrary text are not saved as links.
 */
export function extractHttpUrl(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s<>"']+/i)
  if (!match) return null

  const url = match[0].replace(/[),.!?:;}\]]+$/, '')
  return isValidLinkUrl(url) ? url : null
}

export type ShareValue = {
  value: string
  shareType?: string
}

/** Return unique web URLs from raw or resolved native share payloads. */
export function extractSharedUrls(payloads: ShareValue[]): string[] {
  const urls = payloads
    .map((payload) => extractHttpUrl(payload.value))
    .filter((url): url is string => Boolean(url))

  return [...new Set(urls)]
}
