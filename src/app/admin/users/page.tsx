import { CmsPlaceholder } from "@/components/admin/cms-placeholder";

export default function AdminUsersPage() {
  return (
    <CmsPlaceholder
      title="User Management"
      description="Manage CMS users, assign roles (admin, editor, author), and control platform-level access permissions."
      primaryActionLabel="Invite User"
    />
  );
}
