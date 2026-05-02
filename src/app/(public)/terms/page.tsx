import React from 'react'

export default function TermsOfServicePage() {
  const lastUpdated = "May 2, 2026";
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Header */}
      <section className="relative pt-48 pb-20 lg:pt-56 lg:pb-32 text-white overflow-hidden bg-[#0d1b3e]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1454165833767-027ff8179373?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        
        <div className="container relative z-10 px-4 max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Terms of Service
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
              Welcome to the website of Kingdom Deliverance Centre (KDC) Uganda. By accessing or using our website, you agree to be bound by these Terms of Service.
            </p>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">1. Acceptance of Terms</h2>
              <p>
                By using this website, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree, please do not use our site.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">2. Use of Content</h2>
              <p>
                All content on this website, including text, images, videos, and sermons, is the property of Kingdom Deliverance Centre Uganda or its content creators. You may view and download content for personal, non-commercial, and spiritual growth purposes only. Any unauthorized reproduction or distribution is strictly prohibited.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">3. Donations</h2>
              <p>
                All donations made through our website are voluntary. By making a donation, you represent that you are authorized to use the payment method provided. Donations are generally non-refundable unless there is a clear processing error.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">4. User Conduct</h2>
              <p>
                You agree not to use the website to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit false or misleading information.</li>
                <li>Transmit any harmful or malicious code.</li>
                <li>Harass, abuse, or harm other users.</li>
                <li>Interfere with the security or operation of the website.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">5. Disclaimer of Warranties</h2>
              <p>
                This website is provided on an "as is" and "as available" basis. While we strive for accuracy, we do not guarantee that the website will be error-free or uninterrupted.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">6. Limitation of Liability</h2>
              <p>
                Kingdom Deliverance Centre Uganda shall not be liable for any damages arising out of your use or inability to use this website.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">7. Governing Law</h2>
              <p>
                These terms are governed by the laws of the Republic of Uganda. Any disputes shall be resolved in the courts of Kampala, Uganda.
              </p>
            </div>

            <div className="space-y-4 pt-10 border-t border-border">
              <h2 className="text-2xl font-bold text-primary">Contact Us</h2>
              <p>
                If you have any questions regarding these Terms of Service, please contact us at:
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
