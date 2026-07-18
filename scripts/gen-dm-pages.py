from pathlib import Path

ROOT = Path("/Users/mindpace/kingdom-deliverance/src/app/admin/digital-ministry")

# Fix accounts page Details link
accounts = ROOT / "accounts" / "page.tsx"
text = accounts.read_text()
old = """                <Button size=\"sm\" variant=\"ghost\" asChild>
                  <Link href={`/admin/digital-ministry/accounts/${p.id === 'google_business' ? 'facebook' : p.id}`}>
                    Details
                  </Link>
                </Button>"""
new = """                {['facebook','youtube','tiktok','x','linkedin','instagram'].includes(p.id) ? (
                  <Button size=\"sm\" variant=\"ghost\" asChild>
                    <Link href={`/admin/digital-ministry/accounts/${p.id}`}>Details</Link>
                  </Button>
                ) : null}"""
if old in text:
    accounts.write_text(text.replace(old, new))
    print("fixed accounts link")
else:
    print("accounts link pattern not found; leaving as-is")

modules = {
    "studio": (
        "Content Studio",
        "Create once. Publish everywhere — Facebook, Instagram, YouTube, Shorts, TikTok, X, LinkedIn, blog, newsletter, and more.",
        [
            "Rich text + markdown editor with media library, Bible verse search, hashtags, CTAs",
            "AI rewrite tones: Professional, Youth, Evangelism, Prayer, Leadership, and more",
            "Per-platform adaptations with manual publish fallback where APIs are restricted",
        ],
        [
            ("/admin/media", "Media Library"),
            ("/admin/posts/new", "New Blog Post"),
        ],
    ),
    "calendar": (
        "Content Calendar",
        "Monthly drag-and-drop calendar with campaigns, approvals, and AI gap suggestions.",
        [
            "Color-coded entries tied to dm_calendar_entries",
            "Recurring posts and approval workflow",
            "AI suggests missing content slots for the week",
        ],
        [],
    ),
    "campaigns": (
        "Campaigns",
        "Plan multi-platform campaigns around events, conferences, and outreach themes.",
        [
            "Goals, date ranges, and linked studio posts",
            "Performance rollups when analytics connectors are live",
        ],
        [],
    ),
    "ai-writer": (
        "AI Writer",
        "Specialist agents for copy, SEO, engagement, storytelling, youth, evangelism, scripture, and translation.",
        [
            "Outputs: posts, tweets, LinkedIn, blog, newsletter, devotion, titles, hashtags",
            "Languages: English, Luganda, Swahili, French",
            "Uses Gemini (existing) with KDC analytics context — never generic advice",
        ],
        [],
    ),
    "sermon-studio": (
        "Sermon Studio",
        "Upload video, audio, PDF, DOCX, or YouTube URL — extract points, verses, clips, and weeks of content.",
        [
            "Reuses existing sermon AI processors (Gemini sync + Whisper/Ollama queue)",
            "Generate tweets, posts, Shorts ideas, newsletter, small-group guides",
            "Clip detection for powerful, prayer, and emotional moments",
        ],
        [
            ("/admin/sermons", "Sermons CMS"),
            ("/admin/sermons/jobs", "AI Processing Jobs"),
        ],
    ),
    "analytics": (
        "Analytics",
        "Unified followers, reach, engagement, watch time, CTR, and website conversions.",
        [
            "Pulls from connected social APIs + Google Analytics Data API",
            "Charts: line, bar, pie, heatmaps, funnels",
            "Links to existing Admin Analytics for GA/Search Console setup",
        ],
        [("/admin/analytics", "Google Analytics setup")],
    ),
    "competitors": (
        "Competitor Intelligence",
        "Track peer ministries using public signals only — no scraping of private data.",
        [
            "Add competitors (Watoto, Phaneroo, Elevation, etc.)",
            "Followers, posting frequency, themes, title patterns",
            "AI comparison: what they do better / what KDC does better",
        ],
        [],
    ),
    "community": (
        "Community",
        "Unified comment inbox with prayer / question / spam categories and AI draft replies.",
        [
            "Sentiment: positive, neutral, negative, urgent",
            "Admin approve before send",
            "Sources: social + website when connectors are enabled",
        ],
        [],
    ),
    "seo": (
        "SEO Center",
        "Audit pages, meta, schema, internal links, Core Web Vitals, and keyword opportunities.",
        [
            "Builds on existing post/sermon SEO panels and /admin/seo-tools",
            "Stores audits in dm_seo_audits",
        ],
        [
            ("/admin/seo-tools", "SEO Tools"),
            ("/admin/posts", "Posts SEO"),
        ],
    ),
    "website": (
        "Website Analytics",
        "Visitors, conversions, top pages, prayer, donations, and funnels.",
        [
            "Uses existing Google Analytics + Search Console integration",
            "Own event tracking for prayer, give, newsletter CTAs",
        ],
        [("/admin/analytics", "Google Analytics setup")],
    ),
    "growth-coach": (
        "Growth Coach",
        "Daily growth score with reasons, recommendations, and expected impact.",
        [
            "Stored in dm_growth_reports",
            "Grounded in KDC analytics — not generic tips",
        ],
        [],
    ),
    "reports": (
        "Reports",
        "Daily, weekly, monthly, quarterly, and yearly exports.",
        [
            "PDF / CSV / email delivery",
            "Payload stored in dm_reports",
        ],
        [],
    ),
    "settings": (
        "Settings",
        "Module preferences, notification channels, and API connection health.",
        [
            "Role-aware access (admin / media / editor)",
            "Token refresh and audit logging",
        ],
        [],
    ),
}


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


for slug, (title, desc, bullets, links) in modules.items():
    bullets_js = ",\n".join([f"          '{esc(b)}'" for b in bullets])
    links_js = ""
    if links:
        items = ",\n".join(
            [f"          {{ href: '{h}', label: '{esc(l)}' }}" for h, l in links]
        )
        links_js = f"\n      links={{\n[\n{items}\n      ]}}"
    content = f"""import {{ DmModulePlaceholder }} from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {{
  return (
    <DmModulePlaceholder
      title="{esc(title)}"
      description="{esc(desc)}"
      bullets={{[
{bullets_js}
      ]}}{links_js}
    />
  )
}}
"""
    (ROOT / slug / "page.tsx").write_text(content)
    print("wrote", slug)

for plat, label in [
    ("facebook", "Facebook"),
    ("youtube", "YouTube"),
    ("tiktok", "TikTok"),
    ("x", "X"),
    ("linkedin", "LinkedIn"),
    ("instagram", "Instagram"),
]:
    content = f"""import {{ DmModulePlaceholder }} from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {{
  return (
    <DmModulePlaceholder
      title="{label}"
      description="Account health, permissions, token expiry, and publish capability for {label}."
      bullets={{[
        'Connection status and OAuth scopes',
        'Token refresh and health checks',
        'Analytics sync + publish / manual fallback',
      ]}}
      links={{[
        {{ href: '/admin/digital-ministry/accounts', label: 'All accounts' }},
        {{ href: '/admin/analytics', label: 'Google / YouTube analytics' }},
      ]}}
    />
  )
}}
"""
    (ROOT / "accounts" / plat / "page.tsx").write_text(content)
    print("wrote account", plat)

print("done")
