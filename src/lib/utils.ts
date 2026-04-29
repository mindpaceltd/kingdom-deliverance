import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove non-alphanumeric (keep spaces/hyphens)
    .trim()
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-+|-+$/g, '')         // trim leading/trailing hyphens
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
