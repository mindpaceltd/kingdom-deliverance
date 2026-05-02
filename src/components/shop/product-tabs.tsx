'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Info, Star } from 'lucide-react'

interface ProductTabsProps {
  description: string
  additionalInfo?: { label: string; value: string }[]
  reviews?: any[]
  faqs?: { question: string; answer: string }[]
}

export function ProductTabs({ description, additionalInfo, reviews, faqs }: ProductTabsProps) {
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-14 p-0 gap-8">
        <TabsTrigger 
          value="description" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-0 h-14 font-bold uppercase tracking-widest text-[10px]"
        >
          <FileText className="w-4 h-4 mr-2" /> Description
        </TabsTrigger>
        {additionalInfo && additionalInfo.length > 0 && (
          <TabsTrigger 
            value="info" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-0 h-14 font-bold uppercase tracking-widest text-[10px]"
          >
            <Info className="w-4 h-4 mr-2" /> Additional Info
          </TabsTrigger>
        )}
        <TabsTrigger 
          value="reviews" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-0 h-14 font-bold uppercase tracking-widest text-[10px]"
        >
          <Star className="w-4 h-4 mr-2" /> Reviews (0)
        </TabsTrigger>
      </TabsList>

      <div className="py-10">
        <TabsContent value="description" className="mt-0">
          <div 
            className="prose prose-lg prose-slate max-w-none prose-p:leading-loose prose-p:text-primary/70"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </TabsContent>

        <TabsContent value="info" className="mt-0">
          <div className="max-w-2xl border rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {additionalInfo?.map((info, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary bg-muted/20 w-1/3">{info.label}</td>
                    <td className="px-6 py-4 text-primary/70">{info.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-0">
          <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border border-dashed border-primary/20">
            <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary/20" />
            </div>
            <h3 className="font-bold text-xl mb-2">No reviews yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">Be the first to review this product and help others make a choice!</p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
