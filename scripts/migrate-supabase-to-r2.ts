// migrate-supabase-to-r2.ts
// Run with: npx ts-node scripts/migrate-supabase-to-r2.ts

import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'kdc-media-storage'
const PUBLIC_R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || ''

if (!PUBLIC_R2_URL) {
  console.error('NEXT_PUBLIC_R2_PUBLIC_URL is not set in .env.local')
  process.exit(1)
}

// -----------------------------------------------------------------------------
// Core migration logic
// -----------------------------------------------------------------------------

async function listAllFiles(bucket: string, prefix: string = ''): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix)
  if (error) {
    console.error(`[listAllFiles] Error listing ${bucket}/${prefix}:`, error.message)
    return []
  }

  let files: string[] = []
  for (const item of data || []) {
    // If it has no size, it's usually a "folder" placeholder in Supabase storage
    if (!item.id || item.metadata === null) {
      const subFiles = await listAllFiles(bucket, `${prefix}${item.name}/`)
      files = files.push(...subFiles) as any
    } else {
      files.push(`${prefix}${item.name}`)
    }
  }
  return files
}

async function migrateFile(bucket: string, path: string) {
  console.log(`Migrating: ${bucket}/${path}...`)
  
  // 1. Download from Supabase
  const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(path)
  if (downloadError || !blob) {
    console.error(`[migrateFile] Failed to download ${bucket}/${path}:`, downloadError?.message)
    return null
  }

  // 2. Upload to Cloudflare R2
  const buffer = Buffer.from(await blob.arrayBuffer())
  
  // We need to decide the R2 Key. To avoid collisions and preserve structure, 
  // we'll prefix with the bucket if it's not the default media bucket
  let r2Key = path
  if (bucket === 'avatars') {
    r2Key = `avatars/${path}`
  } else if (bucket === 'organization-images') {
    r2Key = `organization/${path}`
  }

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: blob.type || 'application/octet-stream',
      })
    )
    console.log(`✅ Uploaded to R2: ${r2Key}`)
    return `${PUBLIC_R2_URL}/${r2Key}`
  } catch (e: any) {
    console.error(`[migrateFile] Failed to upload ${r2Key} to R2:`, e.message)
    return null
  }
}

async function migrateTables() {
  console.log('\n--- 🚀 Starting R2 Migration ---\n')

  // --- 1. MEDIA TABLE ---
  console.log('\n[1] Migrating Media Table...')
  const { data: mediaItems } = await supabase.from('media').select('*')
  
  for (const item of mediaItems || []) {
    if (item.url && item.url.includes('supabase.co')) {
      // Extract path
      const bucket = item.bucket || 'media'
      const marker = `/storage/v1/object/public/${bucket}/`
      const markerIndex = item.url.indexOf(marker)
      
      if (markerIndex !== -1) {
        const storagePath = item.url.slice(markerIndex + marker.length)
        const newUrl = await migrateFile(bucket, storagePath)
        
        if (newUrl) {
          await supabase.from('media').update({ url: newUrl }).eq('id', item.id)
          console.log(`   [DB] Updated media record ${item.id}`)
        }
      }
    }
  }

  // --- 2. ORGANIZATION IMAGES ---
  console.log('\n[2] Migrating Organization Images Table...')
  const { data: orgItems } = await supabase.from('organization_images').select('*')
  
  for (const item of orgItems || []) {
    if (item.url && item.url.includes('supabase.co')) {
      const newUrl = await migrateFile('organization-images', item.path)
      if (newUrl) {
        await supabase.from('organization_images').update({ url: newUrl }).eq('id', item.id)
        console.log(`   [DB] Updated org_image record ${item.id}`)
      }
    }
  }

  // --- 3. PROFILES (AVATARS) ---
  console.log('\n[3] Migrating Profile Avatars...')
  const { data: profiles } = await supabase.from('profiles').select('*')
  
  for (const profile of profiles || []) {
    if (profile.avatar_url && profile.avatar_url.includes('supabase.co')) {
      const bucket = 'avatars'
      const marker = `/storage/v1/object/public/${bucket}/`
      const markerIndex = profile.avatar_url.indexOf(marker)
      
      if (markerIndex !== -1) {
        const storagePath = profile.avatar_url.slice(markerIndex + marker.length)
        const newUrl = await migrateFile(bucket, storagePath)
        
        if (newUrl) {
          await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', profile.id)
          console.log(`   [DB] Updated profile ${profile.id}`)
        }
      }
    }
  }
  
  console.log('\n--- 🎉 Migration Complete! ---')
}

migrateTables()
