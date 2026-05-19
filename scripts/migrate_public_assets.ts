import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

const PRIVATE_BUCKET = process.env.R2_BUCKET_NAME || 'kdc-media';
const PUBLIC_BUCKET = 'kdc-media-public';

console.log('Loading configuration...');
console.log('Private Bucket:', PRIVATE_BUCKET);
console.log('Public Bucket:', PUBLIC_BUCKET);
console.log('Endpoint Account:', process.env.CLOUDFLARE_ACCOUNT_ID);

if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error('❌ Error: Missing R2 environment variables in .env.local!');
  process.exit(1);
}

// Initialise an S3 client for listing
const r2Client = new S3Client({
  region: 'us-east-1',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

async function listAllKeys(bucket: string): Promise<string[]> {
  const allKeys: string[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    });
    const resp = await r2Client.send(cmd);
    const contents = resp.Contents ?? [];

    for (const obj of contents) {
      if (obj.Key) allKeys.push(obj.Key);
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  return allKeys;
}

(async () => {
  try {
    const { copyObjectToPublicBucket } = await import('../src/lib/services/r2-storage');
    console.log('🔎 Listing objects in private bucket:', PRIVATE_BUCKET);
    const allKeys = await listAllKeys(PRIVATE_BUCKET);
    console.log(`📦 Found ${allKeys.length} total objects.`);

    // Filter to copy ONLY public files. Skip digital books!
    const publicKeys = allKeys.filter((key) => {
      const lower = key.toLowerCase();

      // Skip folders or files that are digital products
      if (lower.startsWith('books/') || lower.includes('ebook') || lower.endsWith('.pdf') || lower.endsWith('.epub') || lower.endsWith('.mobi')) {
        console.log(`🔒 Keeping private (skipped): ${key}`);
        return false;
      }

      return true;
    });

    console.log(`🚚 ${publicKeys.length} objects will be copied to ${PUBLIC_BUCKET}...`);

    let successCount = 0;
    let failCount = 0;

    for (const key of publicKeys) {
      console.log(`Copying: ${key} ...`);
      const result = await copyObjectToPublicBucket(key, PUBLIC_BUCKET);
      if ('ok' in result) {
        console.log(`✅ Copied: ${key}`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${key} – ${result.error}`);
        failCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`🟢 Successfully copied: ${successCount}`);
    console.log(`🔴 Failed to copy     : ${failCount}`);

    if (failCount > 0) {
      console.warn('⚠️ Some objects failed to copy. Review the logs above.');
    } else {
      console.log('🎉 Migration completed successfully! 🎉');
    }
  } catch (error) {
    console.error('❌ Migration crashed:', error);
  }
})();
