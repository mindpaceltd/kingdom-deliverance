import { Metadata } from 'next'
import { FireServiceContent } from './fire-service-content'

export const metadata: Metadata = {
  title: 'Fire Service - Kingdom Deliverance Centre Uganda',
  description: 'Submit your Fire List and connect with a prophetic Fire Seed. Tonight, your case will be carried into the Fire Altar.',
}

export default function FireServicePage() {
  return <FireServiceContent />
}
