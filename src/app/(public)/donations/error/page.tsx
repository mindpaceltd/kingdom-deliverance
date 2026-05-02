import { XCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DonationErrorPage() {
  return (
    <div className="pt-48 pb-32 text-center min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          We were unable to process your donation at this time. Please try again or contact us if the problem persists.
        </p>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <Heart className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Your generosity is deeply appreciated. Please don't hesitate to try again.
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full bg-[#d4a017] hover:bg-[#b88a12] text-white">
            <Link href="/donations">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}