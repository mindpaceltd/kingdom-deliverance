import { OrganizationImageManager } from '@/components/admin/organization/organization-image-manager'

export default function OrganizationImagesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organization Images</h1>
        <p className="text-gray-600 mt-2">
          Manage church logos, building photos, and other organization images used throughout the site.
        </p>
      </div>
      
      <OrganizationImageManager />
    </div>
  )
}
