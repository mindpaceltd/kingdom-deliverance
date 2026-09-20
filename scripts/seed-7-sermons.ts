import { computeSeoScore } from '../src/lib/seo-scorer'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

interface SermonDefinition {
  title: string
  slug: string
  focusKeyword: string
  seoTitle: string
  metaDescription: string
  description: string
  content: string
  preacher: string
  series: string
  series_id: string
  date: string
  duration_minutes: number
  thumbnail_url: string
  featured_image_alt: string
  video_url: string
  audio_url: string
  status: 'published'
}

const SERIES_DELIVERANCE_ID = 'c701fd55-b7ff-4e70-bb8e-408a6c2fa050'
const SERIES_AUTHORITY_ID = '4a67d0f4-85c0-4db5-b51b-be2f48a23902'

const sermons: SermonDefinition[] = [
  // 1. Sunday 2026-09-20
  {
    title: 'Breaking Spiritual Strongholds',
    slug: 'breaking-spiritual-strongholds',
    focusKeyword: 'spiritual strongholds',
    seoTitle: 'Breaking Spiritual Strongholds | KDC Uganda Sermon', // 51 chars
    metaDescription: 'Overcome spiritual strongholds through biblical deliverance and prayer. Join Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda for total victory.', // 157 chars
    description: 'A transformative message on pulling down entrenched spiritual strongholds through the divine weapons of prayer, fasting, and the blood of Jesus Christ.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>Breaking Spiritual Strongholds</strong> · Preached by Bishop Climate Wiseman. In this message, we learn to dismantle spiritual strongholds by the power of Christ and walk in victory.</em></p>
<h2>Demolishing Every Hidden Stronghold</h2>
<p>Beloved in Christ, the apostle Paul reveals in 2 Corinthians 10:4 that the weapons of our warfare are not carnal, but mighty through God to the pulling down of strongholds. A spiritual stronghold is a mindset, pattern of thought, or demonic foothold established over time that opposes the knowledge of God. When believers fail to discern these hidden walls, they experience repeated cycles of frustration, limitation, and spiritual fatigue.</p>
<h3>1. The Origin of Entrenched Mindsets</h3>
<p>Strongholds do not appear overnight. They are fortified by past traumas, negative words, ungodly covenants, and unchallenged fear. The enemy works diligently to convince believers that their condition is permanent. However, Scripture guarantees that what is impossible with man is sovereignly possible with God. When light invades darkness, darkness cannot comprehend or withstand it.</p>
<h3>2. Divine Weapons of Warfare</h3>
<p>To tear down spiritual strongholds, we must employ the spiritual arsenal provided by Heaven. First, the Word of God acts as a sharp two-edged sword piercing through soul and spirit. Second, the Blood of the Lamb breaks every legal claim and cleanses the conscience. Third, fervent, spirit-led intercession pulls down altars of limitation and releases generational blessings.</p>
<h3>3. Walking in Enduring Liberty</h3>
<p>Deliverance is not merely an event; it is an ongoing lifestyle of abiding in truth. As Jesus declared in John 8:36, if the Son sets you free, you shall be free indeed. Guard your gates—what you hear, see, and meditate upon. Align your speech with God's prophetic declarations and stand unwavering in your royal victory.</p>
<h2>Prophetic Prayer and Declaration</h2>
<p>Heavenly Father, in the mighty name of Jesus Christ, I decree that every spiritual stronghold of fear, sickness, stagnation, and ancestral oppression operating against my destiny is shattered today. I plead the precious blood of Jesus over my life, my family, and my future. I arise in divine authority, clothed with righteousness, and stepping into supernatural enlargement. Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Deliverance & Spiritual Warfare',
    series_id: SERIES_DELIVERANCE_ID,
    date: '2026-09-20',
    duration_minutes: 58,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/breaking-spiritual-strongholds.jpg',
    featured_image_alt: 'Breaking Spiritual Strongholds — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-breaking-spiritual-strongholds.mp3',
    status: 'published'
  },

  // 2. Friday 2026-09-18
  {
    title: 'Overcoming Generational Curses',
    slug: 'overcoming-generational-curses',
    focusKeyword: 'generational curses',
    seoTitle: 'Overcoming Generational Curses | KDC Uganda Sermon', // 50 chars
    metaDescription: 'Learn how to break generational curses through the blood of Jesus Christ. Join Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda for true freedom.', // 156 chars
    description: 'Learn how the cross of Calvary permanently cancels ancestral bloodline covenants, breaking repeated patterns of infirmity, poverty, and marital strife.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>Overcoming Generational Curses</strong> · Preached by Bishop Climate Wiseman. Today we break free from generational curses through the finished work of Jesus on Calvary\'s cross.</em></p>
<h2>Redeemed from the Curse of the Law</h2>
<p>Galatians 3:13 declares with unmistakable clarity: Christ has redeemed us from the curse of the law, having become a curse for us. For many families, recurring cycles of premature death, persistent poverty, addiction, and broken marriages are not mere coincidences; they are the manifest symptoms of ancestral iniquities and unbroken covenants.</p>
<h3>1. Identifying Generational Patterns</h3>
<p>When you look closely at family histories, patterns often repeat across generations. What affected the grandfather often reappears in the father and seeks to attach itself to the children. The Bible calls this the iniquity of the fathers visiting the third and fourth generations of those who hate God. However, through the new covenant established in Christ, a superior legal mandate has been instituted.</p>
<h3>2. Renouncing Evil Covenants and Altars</h3>
<p>Deliverance requires honest identification and aggressive spiritual renunciation. Believers must verbally renounce ancestral agreements, idolatrous dedications, and ungodly oaths. Colossians 2:14 reveals that Jesus wiped out the handwriting of requirements that was contrary to us, taking it entirely out of the way and nailing it to His cross.</p>
<h3>3. Establishing a New Generational Blessing</h3>
<p>Breaking a curse creates an empty space that must immediately be filled with the blessing of Abraham. Speak life over your lineage. Consecrate your children, businesses, and health to the living God. You are the chosen generation, the royal priesthood, anointed to turn the tide for your entire bloodline.</p>
<h2>Deliverance Decree for Your Family</h2>
<p>Lord Jesus, by the power of Your shed blood, I revoke every generational curse, ancestral hex, and satanic ordinance assigned against my bloodline. I declare that the bloodline of Jesus Christ now flows through my heritage. In place of sorrow, I receive joy; in place of lack, divine abundance; and in place of defeat, permanent triumph. In Jesus' name, Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Deliverance & Spiritual Warfare',
    series_id: SERIES_DELIVERANCE_ID,
    date: '2026-09-18',
    duration_minutes: 64,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/overcoming-generational-curses.jpg',
    featured_image_alt: 'Overcoming Generational Curses — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-overcoming-generational-curses.mp3',
    status: 'published'
  },

  // 3. Wednesday 2026-09-16
  {
    title: 'Walking in Kingdom Authority',
    slug: 'walking-in-kingdom-authority',
    focusKeyword: 'kingdom authority',
    seoTitle: 'Walking in Kingdom Authority | KDC Uganda Sermon Online', // 55 chars
    metaDescription: 'Discover how to exercise kingdom authority in daily life. Learn from Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda and enforce spiritual victory.', // 160 chars
    description: 'An empowering midweek teaching on recognizing your legal standing as a believer and enforcing Christ’s victory in your home, career, and spiritual battles.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>Walking in Kingdom Authority</strong> · Preached by Bishop Climate Wiseman. Believers are called to walk in kingdom authority, reigning in life through Christ Jesus our Savior.</em></p>
<h2>The Believer's Seat of Power</h2>
<p>In Luke 10:19, the Lord Jesus Christ gave an extraordinary commission to His disciples: Behold, I give you the authority to trample on serpents and scorpions, and over all the power of the enemy, and nothing shall by any means hurt you. Many Christians plead for things that God has already commanded them to decree. The Church must awaken from passivity and operate as the governing body of Christ upon the earth.</p>
<h3>1. Understanding Authority Versus Power</h3>
<p>There is a profound biblical distinction between power (dunamis) and authority (exousia). While power represents raw kinetic strength, authority is delegated legal right. When a police officer raises a hand, heavy vehicles halt not because of physical muscle, but because the full authority of the government stands behind that uniform. When you speak in the name of Jesus, all the power of Heaven backs your decree.</p>
<h3>2. Operating From the Heavenly Realm</h3>
<p>Ephesians 2:6 reveals that God has raised us up together and made us sit together in the heavenly places in Christ Jesus. You do not fight towards victory; you fight from an established victory. When sickness, fear, or oppression comes against you, you command it to bow from a superior spiritual altitude.</p>
<h3>3. The Law of the Spoken Word</h3>
<p>Kingdom authority is released primarily through the tongue. Jesus did not merely think about calming the storm—He rebuked the wind and commanded the waves: Peace, be still! Speak to the mountain confronting your destiny. Command dry bones to live and call forth those things which be not as though they were.</p>
<h2>Declaration of Kingdom Dominion</h2>
<p>Father, thank You for seating me with Christ far above all principality, power, might, and dominion. Today, I enforce kingdom authority over my atmosphere, my health, and my household. Every rebellious circumstance must submit to the lordship of Jesus Christ. I reign in life as a king and priest of the Most High God. Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Kingdom Identity & Authority',
    series_id: SERIES_AUTHORITY_ID,
    date: '2026-09-16',
    duration_minutes: 52,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/walking-in-kingdom-authority.jpg',
    featured_image_alt: 'Walking in Kingdom Authority — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-walking-in-kingdom-authority.mp3',
    status: 'published'
  },

  // 4. Monday 2026-09-14
  {
    title: 'The Power of Deliverance Prayer',
    slug: 'the-power-of-deliverance-prayer',
    focusKeyword: 'deliverance prayer',
    seoTitle: 'The Power of Deliverance Prayer | KDC Uganda Sermon', // 51 chars
    metaDescription: 'Unleash divine breakthrough through deliverance prayer. Experience true healing and freedom with Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda.', // 157 chars
    description: 'Explore the biblical dynamics of targeted deliverance intercession, learning how to dismantle spiritual cages and release miraculous breakthroughs.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>The Power of Deliverance Prayer</strong> · Preached by Bishop Climate Wiseman. Discover how fervent deliverance prayer demolishes every assignment of the adversary and heals souls.</em></p>
<h2>Praying with Spiritual Precision</h2>
<p>James 5:16 reminds us that the effective, fervent prayer of a righteous man avails much. Deliverance prayer is not passive wishful thinking; it is targeted spiritual warfare aimed directly at the works of darkness. When the early church was faced with Herod's persecution in Acts 12, constant prayer was offered to God for Peter, and an angel was dispatched to break iron gates wide open.</p>
<h3>1. The Altar of Violent Intercession</h3>
<p>From the days of John the Baptist until now, the kingdom of heaven suffers violence, and the violent take it by force (Matthew 11:12). There are spiritual situations that require unrelenting intensity. When you travail in the Spirit, you overturn verdicts written in demonic covens and summon angelic reinforcement to your defense.</p>
<h3>2. Fasting as a Catalyst for Deliverance</h3>
<p>Jesus stated concerning stubborn spiritual resistance: This kind does not go out except by prayer and fasting. Fasting crucifies carnal desires, sharpens spiritual discernment, and aligns the human soul with Heaven’s frequencies. It breaks heavy burdens and lets the oppressed go free according to Isaiah 58:6.</p>
<h3>3. Sealing Your Breakthrough</h3>
<p>After a season of intense deliverance prayer, believers must build a hedge of holiness and Thanksgiving. Luke 11 warns that an unclean spirit that is cast out wanders through dry places seeking rest, and if it finds the house empty, swept, and garnished, it returns with seven worse spirits. Fill your spiritual house with the Holy Spirit and the unadulterated Word of God.</p>
<h2>Warfare Prayer Points</h2>
<p>O Lord my God, ignite my prayer life with holy fire! Every cage of stagnation, delay, sickness, and spiritual blindness engineered against my life is consumed by fire today. I decree that the counsel of the wicked shall not stand, neither shall it come to pass. I walk forth as a champion of Christ, wholly liberated and victorious. In Jesus' name, Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Deliverance & Spiritual Warfare',
    series_id: SERIES_DELIVERANCE_ID,
    date: '2026-09-14',
    duration_minutes: 45,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/the-power-of-deliverance-prayer.jpg',
    featured_image_alt: 'The Power of Deliverance Prayer — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-the-power-of-deliverance-prayer.mp3',
    status: 'published'
  },

  // 5. Saturday 2026-09-12
  {
    title: 'Unlocking Divine Favor and Grace',
    slug: 'unlocking-divine-favor-and-grace',
    focusKeyword: 'divine favor',
    seoTitle: 'Unlocking Divine Favor and Grace | KDC Uganda Sermon', // 52 chars
    metaDescription: 'Learn the biblical keys of unlocking divine favor and grace. Join Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda for supernatural open doors today.', // 159 chars
    description: 'Step into unprecedented supernatural open doors as Bishop Climate reveals biblical principles to attract God’s unmerited favor in every sphere of life.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>Unlocking Divine Favor and Grace</strong> · Preached by Bishop Climate Wiseman. God is releasing divine favor upon your life to open doors that no human hand can shut in this season.</em></p>
<h2>The Atmosphere of Supernatural Favor</h2>
<p>Psalm 5:12 declares: For You, O Lord, will bless the righteous; with favor You will surround him as with a shield. One day of divine favor can accomplish what fifty years of human striving and labor can never produce. When the favor of God rests upon a person, protocols are suspended, unlikely doors swing open, and adversaries are turned into footstools.</p>
<h3>1. Favor That Defies Background and Limitations</h3>
<p>Look at the life of Joseph in Egypt. He was a foreigner, a slave, and an inmate in Pharaoh's prison; yet because the Lord was with Joseph, favor pursued him into the palace. Divine favor is not dependent upon your geographical location, academic qualifications, or family surname. It is the signature of God’s presence upon a consecrated vessel.</p>
<h3>2. Stewarding the Grace of God</h3>
<p>Grace and favor are accessed through humility, faith, and obedience. James 4:6 reminds us that God resists the proud, but gives grace to the humble. When God elevates you, honor Him with your substance, remain teachable, and use your platform to uplift the broken and advance the Kingdom of God.</p>
<h3>3. Expecting Miraculous Turnarounds</h3>
<p>Begin each morning expecting favor. Speak favor over your career, your business deals, your visa applications, and your family health. Refuse to accept rejection as your final outcome, for the favor of God turns every mourning into dancing and every valley into a fruitful plain.</p>
<h2>Prayer for Supernatural Open Doors</h2>
<p>Gracious Father, I thank You that Your favor surrounds me like an impenetrable shield. In this season, I decree that closed gates of opportunity, promotion, and divine connection swing open by fire. Where others meet rejection, I meet acceptance and royal favor. I give You all the glory for my miraculous turnaround, in Jesus' mighty name, Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Kingdom Identity & Authority',
    series_id: SERIES_AUTHORITY_ID,
    date: '2026-09-12',
    duration_minutes: 60,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/unlocking-divine-favor-and-grace.jpg',
    featured_image_alt: 'Unlocking Divine Favor and Grace — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-unlocking-divine-favor-and-grace.mp3',
    status: 'published'
  },

  // 6. Thursday 2026-09-10
  {
    title: 'Standing Firm in Spiritual Warfare',
    slug: 'standing-firm-in-spiritual-warfare',
    focusKeyword: 'spiritual warfare',
    seoTitle: 'Standing Firm in Spiritual Warfare | KDC Uganda Sermon', // 54 chars
    metaDescription: 'Equip yourself for victory in spiritual warfare with the armor of God. Hear Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda and prevail in faith.', // 157 chars
    description: 'A tactical masterclass on wearing the whole armor of God, resisting the strategies of the enemy, and remaining immovable in trials and spiritual battles.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>Standing Firm in Spiritual Warfare</strong> · Preached by Bishop Climate Wiseman. Put on the whole armor of God and prevail in spiritual warfare against every scheme of darkness.</em></p>
<h2>Clothed for Unshakable Victory</h2>
<p>Ephesians 6:10-11 urges every disciple: Finally, my brethren, be strong in the Lord and in the power of His might. Put on the whole armor of God, that you may be able to stand against the wiles of the devil. The Christian journey is not a playground; it is a spiritual battleground. However, God has not left His children defenseless against the onslaughts of the enemy.</p>
<h3>1. The Whole Armor of God</h3>
<p>Each piece of the armor addresses a vital spiritual vulnerability. The belt of truth protects against deception; the breastplate of righteousness shields the heart and affections; the gospel of peace anchors your footing; the shield of faith quenches every flaming dart of doubt; and the helmet of salvation guards the mind against fear and depression.</p>
<h3>2. The Offensive Weapon: Sword of the Spirit</h3>
<p>Notice that all pieces of the armor are defensive except one: the Sword of the Spirit, which is the spoken Word of God (Rhema). When Jesus was tempted in the wilderness by Satan, He did not argue or panic; He consistently counter-attacked with: It is written! You must hide the Word in your heart so you can wield it with precision during times of adversity.</p>
<h3>3. Standing When All Hell Breaks Loose</h3>
<p>Having done all, stand! Do not retreat, do not compromise, and do not surrender ground. The battle belongs to the Lord. When the enemy comes in like a flood, the Spirit of the Lord raises a standard against him. Stand firm on God's covenant promises, for the gates of hell shall never prevail against the Church.</p>
<h2>Spiritual Warfare Victory Decree</h2>
<p>Almighty God, I put on the whole armor of God today. I take up the shield of faith and quench every fiery dart of witchcraft, fear, and infirmity targeted against me. I declare that no weapon formed against me shall prosper, and every tongue rising in judgment is condemned. I stand victorious in the name of Jesus Christ! Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Deliverance & Spiritual Warfare',
    series_id: SERIES_DELIVERANCE_ID,
    date: '2026-09-10',
    duration_minutes: 55,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/standing-firm-in-spiritual-warfare.jpg',
    featured_image_alt: 'Standing Firm in Spiritual Warfare — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-standing-firm-in-spiritual-warfare.mp3',
    status: 'published'
  },

  // 7. Tuesday 2026-09-08
  {
    title: 'Knowing Your True Identity in Christ',
    slug: 'knowing-your-true-identity-in-christ',
    focusKeyword: 'identity in christ',
    seoTitle: 'Knowing Your True Identity in Christ | KDC Sermon Online', // 56 chars
    metaDescription: 'Discover your royal identity in Christ and overcome fear. Hear powerful biblical teaching from Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda now.', // 159 chars
    description: 'Overcome self-doubt, rejection, and insecurity by uncovering who you truly are in Christ—a royal priesthood, a chosen generation, and a child of the King.',
    content: `<p class="sermon-reference"><em>Sermon: <strong>Knowing Your True Identity in Christ</strong> · Preached by Bishop Climate Wiseman. When you understand your identity in Christ, fear and intimidation lose all power over your destiny.</em></p>
<h2>You Are Who God Says You Are</h2>
<p>1 Peter 2:9 proclaims: But you are a chosen generation, a royal priesthood, a holy nation, His own special people, that you may proclaim the praises of Him who called you out of darkness into His marvelous light. The greatest battle of the human mind is the battle of identity. If the enemy can distort who you believe you are, he can hinder what God has ordained you to achieve.</p>
<h3>1. Breaking Free from Labels and Condemnation</h3>
<p>The world assigns labels based on past mistakes, social status, and human opinions. But 2 Corinthians 5:17 promises that anyone in Christ is a brand-new creation: old things have passed away, and behold, all things have become new. You are not a product of your past; you are a product of Christ's redemption.</p>
<h3>2. Royal Sons and Daughters of God</h3>
<p>Romans 8:15-17 reveals that we have not received the spirit of bondage again to fear, but the Spirit of adoption by whom we cry out, Abba, Father! As joint-heirs with Christ, you have legitimate access to the inheritance of Heaven—peace, divine health, supernatural wisdom, and eternal security. Never allow insecurity to make you beg for what has already been gifted to you.</p>
<h3>3. Walking in Royal Dignity</h3>
<p>Live each day with head held high in holy confidence. When negative thoughts whisper that you are unworthy, declare that you are accepted in the Beloved. You are crowned with lovingkindness and tender mercies. Walk boldly into your divine calling and let your light shine before men to the glory of God.</p>
<h2>Covenant Identity Prayer</h2>
<p>Father, I thank You that my identity is firmly anchored in Christ Jesus. I reject all spirit of rejection, unworthiness, and fear. I declare that I am loved, redeemed, justified, and empowered to do exploits for Your Kingdom. I walk as royalty today and forever. In the name of Jesus Christ, Amen!</p>`,
    preacher: 'Bishop Climate Wiseman',
    series: 'Kingdom Identity & Authority',
    series_id: SERIES_AUTHORITY_ID,
    date: '2026-09-08',
    duration_minutes: 50,
    thumbnail_url: 'https://wuqhrjczlolhiaihosei.supabase.co/storage/v1/object/public/media/sermons/knowing-your-true-identity-in-christ.jpg',
    featured_image_alt: 'Knowing Your True Identity in Christ — sermon by Bishop Climate Wiseman at Kingdom Deliverance Centre Uganda',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    audio_url: 'https://kdcuganda.org/audio/sermon-knowing-your-true-identity-in-christ.mp3',
    status: 'published'
  }
]

async function main() {
  console.log('Validating SEO scores for all 7 sermons...')
  let allPass = true

  for (let i = 0; i < sermons.length; i++) {
    const s = sermons[i]
    const { score, checks } = computeSeoScore({
      focusKeyword: s.focusKeyword,
      seoTitle: s.seoTitle,
      metaDescription: s.metaDescription,
      content: s.content,
      slug: s.slug,
      featuredImage: s.thumbnail_url
    })

    console.log(`[${i + 1}/7] ${s.title}`)
    console.log(`     Score: ${score}/100`)
    console.log(`     Checks:`, JSON.stringify(checks))

    if (score !== 100) {
      console.error(`FAILED: ${s.title} got score ${score}, expected 100`)
      allPass = false
    }
  }

  if (!allPass) {
    console.error('Validation failed. Aborting database insertion.')
    process.exit(1)
  }

  console.log('\nAll 7 sermons scored 100/100! Inserting into Supabase...')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  for (const s of sermons) {
    const { data: existing } = await supabase
      .from('sermons')
      .select('id')
      .eq('slug', s.slug)
      .maybeSingle()

    const payload = {
      title: s.title,
      slug: s.slug,
      description: s.description,
      content: s.content,
      preacher: s.preacher,
      series: s.series,
      series_id: s.series_id,
      date: s.date,
      duration_minutes: s.duration_minutes,
      thumbnail_url: s.thumbnail_url,
      featured_image_alt: s.featured_image_alt,
      video_url: s.video_url,
      audio_url: s.audio_url,
      status: s.status,
      published_at: new Date(s.date + 'T10:00:00Z').toISOString(),
      meta_title: s.seoTitle,
      meta_description: s.metaDescription,
      focus_keyword: s.focusKeyword,
      seo_score: 100
    }

    if (existing) {
      const { error } = await supabase
        .from('sermons')
        .update(payload)
        .eq('id', existing.id)
      if (error) console.error(`Error updating ${s.slug}:`, error.message)
      else console.log(`Updated sermon: ${s.title}`)
    } else {
      const { error } = await supabase.from('sermons').insert(payload)
      if (error) console.error(`Error inserting ${s.slug}:`, error.message)
      else console.log(`Inserted sermon: ${s.title}`)
    }
  }

  console.log('Seeding complete!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
