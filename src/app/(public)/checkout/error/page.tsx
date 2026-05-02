import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutErrorPage() {
  return (
    <div className="pt-48 pb-32 min-h-screen bg-white">
      <div className="container max-w-lg px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h1 className="font-serif text-4xl font-bold text-primary mb-6">
          Payment Failed
        </h1>
        <p className="text-primary/70 text-lg mb-10">
          We couldn't process your payment. This could be due to a network error or insufficient funds. Don't worry, no money was taken.
        </p>

        <div className="flex flex-col gap-4">
          <Button asChild className="h-14 px-8 rounded-2xl gap-2 shadow-xl shadow-primary/20">
            <Link href="/checkout">
              <RefreshCcw className="w-5 h-5" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="ghost" className="h-14 px-8 rounded-2xl gap-2">
            <Link href="/shop">
              <ArrowLeft className="w-5 h-5" />
              Back to Shop
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
