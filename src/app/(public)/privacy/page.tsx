import React from 'react'

export default function PrivacyPolicyPage() {
  const lastUpdated = "May 2, 2026";
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <section className="relative pt-48 pb-20 lg:pt-56 lg:pb-32 text-white overflow-hidden bg-[#0d1b3e]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        
        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-white/80 text-lg md:text-xl">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="container px-4 max-w-3xl mx-auto">
          <div className="prose prose-blue max-w-none text-primary/80 leading-relaxed space-y-8">
            <p>
              At Kingdom Deliverance Centre (KDC) Uganda, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our website or interact with our ministry.
            </p>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">1. Information We Collect</h2>
              <p>
                We may collect personal information that you voluntarily provide to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contact Information:</strong> Name, email address, phone number, and mailing address.</li>
                <li><strong>Interaction Data:</strong> Prayer requests, testimonies, and messages sent through our contact forms.</li>
                <li><strong>Donation Information:</strong> We do not store credit card details; all financial transactions are processed securely through third-party gateways (Stripe, PayPal, Pesapal).</li>
                <li><strong>Usage Data:</strong> Information about how you use our website, including IP address, browser type, and pages visited.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">2. How We Use Your Information</h2>
              <p>
                The information we collect is used to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and respond to your prayer requests and inquiries.</li>
                <li>Manage and acknowledge your donations.</li>
                <li>Send you ministry updates, newsletters, and information about upcoming events (you can opt-out at any time).</li>
                <li>Improve our website functionality and user experience.</li>
                <li>Comply with legal and regulatory requirements.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">3. Sharing of Information</h2>
              <p>
                We do not sell or rent your personal information to third parties. We may share your information only with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Service providers who assist us in operating our website or conducting our ministry (e.g., email service providers).</li>
                <li>Law enforcement or government authorities when required by law.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">5. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Request access to the personal information we hold about you.</li>
                <li>Request that we correct or delete your personal information.</li>
                <li>Object to the processing of your data for marketing purposes.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">6. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date.
              </p>
            </div>

            <div className="space-y-4 pt-10 border-t border-border">
              <h2 className="text-2xl font-bold text-primary">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="font-semibold text-primary">
                Kingdom Deliverance Centre Uganda<br />
                Email: info@kdcuganda.org<br />
                Kampala, Uganda
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
