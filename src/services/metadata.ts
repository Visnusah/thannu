import { getLinkDomain, isValidLinkUrl } from '@/stores/linksStore'

export type LinkMetadata = {
  title?: string
  description?: string
  imageUrl?: string | null
  domain?: string
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function readMetaTag(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1])
  }

  return undefined
}

function readTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match?.[1] ? decodeHtml(match[1]) : undefined
}

/**
 * Fetch best-effort Open Graph metadata for a saved URL.
 *
 * This is intentionally best effort: social platforms may require cookies,
 * block automated requests, or render metadata only in JavaScript. The link
 * remains saved even when metadata cannot be fetched.
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  if (!isValidLinkUrl(url)) throw new Error('Metadata URL must be an http or https URL')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
  if (!response.ok) throw new Error(`Metadata request failed with ${response.status}`)

  const html = await response.text()
  const image = readMetaTag(html, 'og:image') || readMetaTag(html, 'twitter:image')
  let imageUrl: string | null | undefined = image

  if (image) {
    try {
      imageUrl = new URL(image, url).toString()
    } catch {
      imageUrl = null
    }
  }

  return {
    title: readMetaTag(html, 'og:title') || readMetaTag(html, 'twitter:title') || readTitle(html),
    description:
      readMetaTag(html, 'og:description') ||
      readMetaTag(html, 'twitter:description') ||
      readMetaTag(html, 'description'),
    imageUrl,
    domain: getLinkDomain(url),
  }
}
