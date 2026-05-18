"use client";

import { useState } from "react";
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, MessageCircle, UploadCloud, Video } from "lucide-react";
import { FadeInSection } from "@/components/ui/page-transition";
import { TestimoniesSection } from "@/components/home/testimonies-section";

export default function TestimoniesPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", message: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let mediaUrl = null;

      // 1. Upload File if present
      if (file) {
        // Get presigned URL
        const presignRes = await fetch('/api/admin/storage/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            bucket: 'media',
            isTestimony: true,
          }),
        });
        
        const presignData = await presignRes.json();
        if (!presignRes.ok) throw new Error(presignData.error || 'Failed to initialize upload.');

        // Upload directly to R2
        const uploadRes = await fetch(presignData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload media to server.');
          
        mediaUrl = presignData.publicUrl;
      }

      // 2. Insert into DB
      const { error: dbError } = await supabase
        .from("testimonies")
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.address,
          testimony: form.message,
          media_url: mediaUrl,
          media_type: file?.type || null,
          status: "pending"
        });

      if (dbError) throw new Error("Failed to submit testimony. Note: 'testimonies' table may need to be created by the admin.");

      // Success
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", address: "", message: "" });
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative pt-48 pb-32 lg:pt-56 lg:pb-40 text-white overflow-hidden bg-[#0d1b3e]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary" />
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto">
          <FadeInSection>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
              <MessageCircle className="w-4 h-4" />
              Share Your Story
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Testimonies
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto italic">
              "And they overcame him by the blood of the Lamb, and by the word of their testimony." — Revelation 12:11
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">What has God done for you?</h2>
            <p className="text-primary/70">
              Your testimony is a powerful tool to encourage others and glorify God. 
              Fill out the form below to share your breakthrough, healing, or answered prayer.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border p-8 md:p-12 shadow-2xl shadow-primary/5">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-serif text-3xl font-bold text-primary mb-4">Testimony Submitted!</h3>
                <p className="text-primary/70 max-w-md mx-auto mb-8">
                  Thank you for sharing your story. It has been received and will be reviewed by our team before being published.
                </p>
                <Button 
                  onClick={() => setSuccess(false)}
                  className="bg-accent text-primary hover:bg-accent/90"
                >
                  Submit Another Testimony
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="t-name">Full Name *</Label>
                    <Input 
                      id="t-name" 
                      placeholder="e.g. Jane Doe" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-email">Email Address</Label>
                    <Input 
                      id="t-email" 
                      type="email" 
                      placeholder="email@example.com" 
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="t-phone">Phone Number *</Label>
                    <Input 
                      id="t-phone" 
                      placeholder="+256..." 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-address">Address / Location</Label>
                    <Input 
                      id="t-address" 
                      placeholder="e.g. Kampala, Uganda" 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="t-message">Your Testimony *</Label>
                  <Textarea 
                    id="t-message" 
                    placeholder="Share the details of what God has done..." 
                    rows={8}
                    className="resize-y"
                    value={form.message} 
                    onChange={e => setForm({...form, message: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2 p-6 rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors">
                  <Label className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-accent" />
                    Upload Image or Video (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Attach a short video or picture relating to your testimony. Max size 10MB.
                  </p>
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" className="relative cursor-pointer">
                      <UploadCloud className="w-4 h-4 mr-2" />
                      {file ? "Change File" : "Choose File"}
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                    </Button>
                    {file && <span className="text-sm font-medium text-primary truncate max-w-[200px]">{file.name}</span>}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-14 text-lg font-bold bg-accent text-primary hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Testimony"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Testimonies Carousel */}
      <TestimoniesSection />
    </div>
  );
}
