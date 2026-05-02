'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, Trash2, Loader2, Save, Settings } from 'lucide-react'
import { saveAttribute } from '@/lib/actions/attributes'

interface AttributeFormProps {
  initialData?: any
}

export function AttributeForm({ initialData }: AttributeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    values: initialData?.product_attribute_values?.map((v: any) => v.value) || ['']
  })

  const addValue = () => {
    setFormData({ ...formData, values: [...formData.values, ''] })
  }

  const removeValue = (index: number) => {
    const newValues = formData.values.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, values: newValues })
  }

  const updateValue = (index: number, val: string) => {
    const newValues = [...formData.values]
    newValues[index] = val
    setFormData({ ...formData, values: newValues })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await saveAttribute(formData)
    setLoading(false)

    if (result.error) {
      alert(result.error)
    } else {
      router.push('/admin/products/attributes')
      router.refresh()
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-4xl space-y-8">
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> Attribute Info
        </h3>
        <div className="space-y-2">
          <Label htmlFor="name">Attribute Name (e.g. Size, Color)</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Size"
            required
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Attribute Values</h3>
          <Button type="button" variant="outline" size="sm" onClick={addValue}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add Value
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.values.map((val: string, index: number) => (
            <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <Input
                value={val}
                onChange={(e) => updateValue(index, e.target.value)}
                placeholder={`Value ${index + 1} (e.g. XL)`}
                required
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => removeValue(index)}
                disabled={formData.values.length === 1}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="gap-2 px-8">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initialData ? 'Update Attribute' : 'Create Attribute'}
        </Button>
      </div>
    </form>
  )
}
