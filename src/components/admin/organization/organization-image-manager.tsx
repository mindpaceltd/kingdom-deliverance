'use client'

import { useState, useRef } from 'react'
import { Upload, X, Edit2, Trash2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { uploadOrganizationImage, getOrganizationImages, updateOrganizationImage, deleteOrganizationImage } from '@/lib/actions/organization-images'
import { createOptimizedAltText, validateAltText } from '@/lib/seo/alt-text-optimizer'

interface OrganizationImage {
  id: string
  name: string
  type: 'logo' | 'og_image' | 'church_building' | 'leadership' | 'hero'
  url: string
  alt_text?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

const imageTypes = [
  { value: 'logo', label: 'Church Logo', description: 'Main logo for the organization' },
  { value: 'og_image', label: 'OG Image', description: 'Default social sharing image' },
  { value: 'church_building', label: 'Church Building', description: 'Photo of the church building' },
  { value: 'leadership', label: 'Leadership Photo', description: 'Photo of church leadership' },
  { value: 'hero', label: 'Hero Image', description: 'Large banner image' }
] as const

export function OrganizationImageManager() {
  const [images, setImages] = useState<OrganizationImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'logo' | 'og_image' | 'church_building' | 'leadership' | 'hero'>('logo')
  const [altText, setAltText] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      // Generate initial alt text
      const optimized = createOptimizedAltText(null, {
        contentType: 'church',
        title: imageTypes.find(t => t.value === selectedType)?.label
      })
      setAltText(optimized)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadOrganizationImage(file, selectedType, altText)
      if (result.success) {
        // Reset form
        setPreviewUrl(null)
        setAltText('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Refresh images
        refreshImages()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleUpdate = async (imageId: string) => {
    try {
      await updateOrganizationImage(imageId, { alt_text: altText })
      setEditing(null)
      refreshImages()
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    try {
      await deleteOrganizationImage(imageId)
      refreshImages()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const refreshImages = async () => {
    try {
      const imageList = await getOrganizationImages()
      setImages(imageList)
    } catch (error) {
      console.error('Failed to refresh images:', error)
    }
  }

  const validateAlt = (text: string) => {
    const validation = validateAltText(text)
    return validation.isValid
  }

  const getImagesByType = (type: string) => {
    return images.filter(img => img.type === type).sort((a, b) => a.sort_order - b.sort_order)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Organization Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image-type">Image Type</Label>
              <select
                id="image-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                {imageTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="file-input">Choose File</Label>
              <Input
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>
          </div>

          {previewUrl && (
            <div className="space-y-3">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <Label htmlFor="alt-text">Alt Text (Accessibility)</Label>
                <Textarea
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image for screen readers..."
                  className="mt-1"
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-1">
                  {validateAlt(altText) ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {validateAlt(altText) ? 'Good alt text' : 'Could be improved'}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || !validateAlt(altText)}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Images */}
      {imageTypes.map(type => {
        const typeImages = getImagesByType(type.value)
        if (typeImages.length === 0) return null

        return (
          <Card key={type.value}>
            <CardHeader>
              <CardTitle>{type.label}</CardTitle>
              <p className="text-sm text-gray-600">{type.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeImages.map(image => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt_text || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(image.id)
                            setAltText(image.alt_text || '')
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {editing === image.id && (
                      <div className="absolute inset-0 bg-white p-3 rounded-lg shadow-lg">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Edit Alt Text</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditing(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <Textarea
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            className="text-xs"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(image.id)}
                              disabled={!validateAlt(altText)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {images.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organization images yet</h3>
            <p className="text-gray-600">Upload your first organization image to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
