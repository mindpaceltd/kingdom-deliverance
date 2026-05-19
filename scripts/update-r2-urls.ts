import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load env from .env.local
const envFile = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) {
  const envConfig = dotenv.parse(fs.readFileSync(envFile))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const OLD_R2_URL = 'https://pub-2f08fcf0958c4e15a15b48f6805de2be.r2.dev'
const NEW_R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://pub-6299bd19a8614368b611590ccf05ac14.r2.dev'

async function run() {
  console.log(`Replacing old R2 domain in database:`)
  console.log(`From: ${OLD_R2_URL}`)
  console.log(`To:   ${NEW_R2_URL}`)
  console.log(`Connected to: ${SUPABASE_URL}`)

  // 1. Update media table
  console.log('\n--- Updating [media] table ---')
  const { data: mediaItems, error: mediaErr } = await supabase
    .from('media')
    .select('id, url')
  
  if (mediaErr) {
    console.error('Error fetching media:', mediaErr)
  } else if (mediaItems) {
    let count = 0
    for (const item of mediaItems) {
      if (item.url && item.url.includes(OLD_R2_URL)) {
        const newUrl = item.url.replace(OLD_R2_URL, NEW_R2_URL)
        const { error: updateErr } = await supabase
          .from('media')
          .update({ url: newUrl })
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update media row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [media] table.`)
  }

  // 2. Update site_settings table
  console.log('\n--- Updating [site_settings] table ---')
  const { data: settingItems, error: settingsErr } = await supabase
    .from('site_settings')
    .select('key, value')
  
  if (settingsErr) {
    console.error('Error fetching site_settings:', settingsErr)
  } else if (settingItems) {
    let count = 0
    for (const item of settingItems) {
      if (typeof item.value === 'string' && item.value.includes(OLD_R2_URL)) {
        const newValue = item.value.replace(new RegExp(OLD_R2_URL, 'g'), NEW_R2_URL)
        const { error: updateErr } = await supabase
          .from('site_settings')
          .update({ value: newValue })
          .eq('key', item.key)
        if (updateErr) {
          console.error(`Failed to update setting row ${item.key}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [site_settings] table.`)
  }

  // 3. Update sermons table
  console.log('\n--- Updating [sermons] table ---')
  const { data: sermonItems, error: sermonsErr } = await supabase
    .from('sermons')
    .select('id, audio_url, video_url, thumbnail_url')
  
  if (sermonsErr) {
    console.error('Error fetching sermons:', sermonsErr)
  } else if (sermonItems) {
    let count = 0
    for (const item of sermonItems) {
      let updated = false
      const updateData: any = {}
      
      if (item.audio_url && item.audio_url.includes(OLD_R2_URL)) {
        updateData.audio_url = item.audio_url.replace(OLD_R2_URL, NEW_R2_URL)
        updated = true
      }
      if (item.video_url && item.video_url.includes(OLD_R2_URL)) {
        updateData.video_url = item.video_url.replace(OLD_R2_URL, NEW_R2_URL)
        updated = true
      }
      if (item.thumbnail_url && item.thumbnail_url.includes(OLD_R2_URL)) {
        updateData.thumbnail_url = item.thumbnail_url.replace(OLD_R2_URL, NEW_R2_URL)
        updated = true
      }
      
      if (updated) {
        const { error: updateErr } = await supabase
          .from('sermons')
          .update(updateData)
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update sermon row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [sermons] table.`)
  }

  // 4. Update posts table
  console.log('\n--- Updating [posts] table ---')
  const { data: postItems, error: postsErr } = await supabase
    .from('posts')
    .select('id, featured_image')
  
  if (postsErr) {
    console.error('Error fetching posts:', postsErr)
  } else if (postItems) {
    let count = 0
    for (const item of postItems) {
      if (item.featured_image && item.featured_image.includes(OLD_R2_URL)) {
        const newUrl = item.featured_image.replace(OLD_R2_URL, NEW_R2_URL)
        const { error: updateErr } = await supabase
          .from('posts')
          .update({ featured_image: newUrl })
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update post row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [posts] table.`)
  }

  // 5. Update events table
  console.log('\n--- Updating [events] table ---')
  const { data: eventItems, error: eventsErr } = await supabase
    .from('events')
    .select('id, image_url')
  
  if (eventsErr) {
    console.error('Error fetching events:', eventsErr)
  } else if (eventItems) {
    let count = 0
    for (const item of eventItems) {
      if (item.image_url && item.image_url.includes(OLD_R2_URL)) {
        const newUrl = item.image_url.replace(OLD_R2_URL, NEW_R2_URL)
        const { error: updateErr } = await supabase
          .from('events')
          .update({ image_url: newUrl })
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update event row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [events] table.`)
  }

  // 6. Update ministries table
  console.log('\n--- Updating [ministries] table ---')
  const { data: ministryItems, error: ministriesErr } = await supabase
    .from('ministries')
    .select('id, image_url')
  
  if (ministriesErr) {
    console.error('Error fetching ministries:', ministriesErr)
  } else if (ministryItems) {
    let count = 0
    for (const item of ministryItems) {
      if (item.image_url && item.image_url.includes(OLD_R2_URL)) {
        const newUrl = item.image_url.replace(OLD_R2_URL, NEW_R2_URL)
        const { error: updateErr } = await supabase
          .from('ministries')
          .update({ image_url: newUrl })
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update ministry row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [ministries] table.`)
  }

  // 7. Update profiles table
  console.log('\n--- Updating [profiles] table ---')
  const { data: profileItems, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, avatar_url')
  
  if (profilesErr) {
    console.error('Error fetching profiles:', profilesErr)
  } else if (profileItems) {
    let count = 0
    for (const item of profileItems) {
      if (item.avatar_url && item.avatar_url.includes(OLD_R2_URL)) {
        const newUrl = item.avatar_url.replace(OLD_R2_URL, NEW_R2_URL)
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ avatar_url: newUrl })
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update profile row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [profiles] table.`)
  }

  // 8. Update products table
  console.log('\n--- Updating [products] table ---')
  const { data: productItems, error: productsErr } = await supabase
    .from('products')
    .select('id, image_url, file_url, og_image')
  
  if (productsErr) {
    console.error('Error fetching products:', productsErr)
  } else if (productItems) {
    let count = 0
    for (const item of productItems) {
      let updated = false
      const updateData: any = {}
      
      if (item.image_url && item.image_url.includes(OLD_R2_URL)) {
        updateData.image_url = item.image_url.replace(OLD_R2_URL, NEW_R2_URL)
        updated = true
      }
      if (item.file_url && item.file_url.includes(OLD_R2_URL)) {
        updateData.file_url = item.file_url.replace(OLD_R2_URL, NEW_R2_URL)
        updated = true
      }
      if (item.og_image && item.og_image.includes(OLD_R2_URL)) {
        updateData.og_image = item.og_image.replace(OLD_R2_URL, NEW_R2_URL)
        updated = true
      }
      
      if (updated) {
        const { error: updateErr } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', item.id)
        if (updateErr) {
          console.error(`Failed to update product row ${item.id}:`, updateErr)
        } else {
          count++
        }
      }
    }
    console.log(`Updated ${count} rows in [products] table.`)
  }

  console.log('\n🎉 URL updates complete!')
}

run()
