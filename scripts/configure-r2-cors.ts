// scripts/configure-r2-cors.ts
// Run with: npx ts-node scripts/configure-r2-cors.ts

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

async function run() {
  const buckets = ['media', process.env.R2_BUCKET_NAME || 'kdc-media-storage']
  console.log('Starting R2 CORS configuration for buckets:', buckets)

  for (const bucket of buckets) {
    try {
      await r2Client.send(new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedOrigins: ["*"], // Allow uploads from both local dev and custom production domains
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3000
            }
          ]
        }
      }))
      console.log(`[Success] Configured CORS policy on Cloudflare R2 bucket: "${bucket}"`)
    } catch (err: any) {
      console.error(`[Error] Failed to configure CORS for bucket "${bucket}":`, err.message)
      console.log('Make sure your R2 Access Key has Admin/Write permissions, and the bucket exists in Cloudflare.')
    }
  }
}

run()
