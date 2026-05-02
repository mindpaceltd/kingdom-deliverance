import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '')   // remove non-alphanumeric, non-hyphen
    .replace(/-+/g, '-')           // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
}

export function validateVideoUrl(url: string): 'valid' | 'invalid' {
  if (/youtube\.com\/watch/i.test(url)) return 'valid'
  if (/youtu\.be\//i.test(url)) return 'valid'
  if (/vimeo\.com\//i.test(url)) return 'valid'
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return 'valid'
  return 'invalid'
}

export function validateFileSize(bytes: number): boolean {
  return bytes <= 52_428_800
}

export function formatPrice(price: number | string, currency: string = 'USD') {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numericPrice || 0)
}
