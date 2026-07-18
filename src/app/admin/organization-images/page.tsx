import { OrganizationImageManager } from '@/components/admin/organization/organization-image-manager'

export default function OrganizationImagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Organization Images</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage church logos, building photos, and other organization images used throughout the site.
        </p>
      </div>
      
      <OrganizationImageManager />
    </div>
  )
}
