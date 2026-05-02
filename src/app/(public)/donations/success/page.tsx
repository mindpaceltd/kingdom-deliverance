import { CheckCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DonationSuccessPage() {
  return (
    <div className="pt-48 pb-32 text-center min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your generous donation has been received successfully. May God bless you abundantly for your faithfulness and support of Kingdom Deliverance Centre.
        </p>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" fill="currentColor" />
          <p className="text-sm text-gray-500">
            "Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously."
            <br />
            <span className="font-semibold text-gray-700">— 2 Corinthians 9:6</span>
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full bg-[#d4a017] hover:bg-[#b88a12] text-white">
            <Link href="/donations">Give Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}