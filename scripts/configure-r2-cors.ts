// scripts/configure-r2-cors.ts
// Run with: npx tsx scripts/configure-r2-cors.ts

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

const ALLOWED_ORIGINS = [
  'https://kdcuganda.org',
  'https://www.kdcuganda.org',
  'http://localhost:3000',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
]

async function run() {
  const buckets = [
    process.env.R2_PUBLIC_BUCKET_NAME || 'kdc-media-public',
    process.env.R2_BUCKET_NAME || 'kdc-media-storage',
    'media',
    'kdc-media',
  ]

  const uniqueBuckets = [...new Set(buckets)]
  console.log('Configuring R2 CORS for buckets:', uniqueBuckets)
  console.log('Allowed origins:', ALLOWED_ORIGINS)

  for (const bucket of uniqueBuckets) {
    try {
      await r2Client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: ALLOWED_ORIGINS,
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        })
      )
      console.log(`[Success] CORS configured on bucket: "${bucket}"`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[Error] Failed for bucket "${bucket}":`, message)
    }
  }
}

run()
