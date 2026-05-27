import React from 'react'
import Link from 'next/link'

const FAQ_SECTIONS = [
  {
    title: 'Services & Worship',
    items: [
      {
        q: 'What are your regular service times?',
        a: 'Our regular services are Sunday at 10:00 AM (EAT), Wednesday at 6:00 PM (EAT), and Friday at 6:00 PM (EAT). For any special service updates, please check the Contact page or announcements on our social channels.',
      },
      {
        q: 'Where is Kingdom Deliverance Centre Uganda located?',
        a: 'We are based in Kampala, Uganda. You can find full directions and map details on our Contact page.',
      },
      {
        q: 'Do you have online/live services?',
        a: 'Yes. You can watch online sermons and live sessions through our website\'s Live and Sermons sections whenever streams are available.',
      },
    ],
  },
  {
    title: 'Giving & Donations',
    items: [
      {
        q: 'How can I give or donate?',
        a: 'You can donate securely through our Give/Donations pages. We support trusted payment options configured on the website.',
      },
      {
        q: 'Are donations refundable?',
        a: 'Donations are generally non-refundable unless there is a clear payment processing error. If you need help with a donation issue, contact support with your transaction details.',
      },
      {
        q: 'Will I receive confirmation after donating?',
        a: 'Yes. Donation confirmations are provided through the checkout flow and may also be sent by email when contact details are available.',
      },
    ],
  },
  {
    title: 'Support & Contact',
    items: [
      {
        q: 'How do I contact your team quickly?',
        a: 'You can use the support chat button on the bottom-left of the website for quick help, or reach us through the Contact page.',
      },
      {
        q: 'Can I request prayer support?',
        a: 'Yes. You can submit prayer requests through the Prayer page, and our team will stand with you in faith.',
      },
      {
        q: 'How can I speak to a human support agent?',
        a: 'Open the website chat and choose “Chat with a person,” then share your question. A staff member will reply as soon as possible.',
      },
    ],
  },
  {
    title: 'Website & Account',
    items: [
      {
        q: 'Do I need an account to browse sermons, events, and ministries?',
        a: 'No. Most content is publicly accessible. You only need an account for features like orders, downloads, and account-specific history.',
      },
      {
        q: 'I forgot my account password. What should I do?',
        a: 'Go to the login page and use “Forgot password” to reset your password securely.',
      },
      {
        q: 'Where can I read your legal policies?',
        a: 'You can view our Privacy Policy and Terms of Service from the footer on every page.',
      },
    ],
  },
]

export default function FaqPage() {
  const lastUpdated = 'May 27, 2026'

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="relative pt-48 pb-20 lg:pt-56 lg:pb-28 text-white overflow-hidden bg-[#0d1b3e]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />

        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            Frequently Asked Questions
          </h1>
          <p className="text-white/85 text-lg md:text-xl">
            Quick answers about services, giving, support, and using the KDC Uganda website.
          </p>
          <p className="text-white/70 text-sm mt-4">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container px-4 max-w-4xl mx-auto space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-primary">{section.title}</h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-border/80 bg-card px-5 py-4 open:shadow-sm"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-primary flex items-start justify-between gap-4">
                      <span>{item.q}</span>
                      <span className="text-accent transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="text-primary/80 leading-relaxed mt-3 pr-6">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 text-primary/80">
            <p className="font-semibold text-primary mb-2">Still need help?</p>
            <p>
              Reach out on our{' '}
              <Link href="/contact" className="text-accent hover:underline">
                Contact page
              </Link>{' '}
              or use the support chat at the bottom-left corner of this website.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
