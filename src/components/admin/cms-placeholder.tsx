import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CmsPlaceholderProps {
  title: string;
  description: string;
  primaryActionLabel: string;
}

export function CmsPlaceholder({
  title,
  description,
  primaryActionLabel,
}: CmsPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-serif">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground max-w-2xl">{description}</p>
        <div className="flex items-center gap-3">
          <Button className="bg-accent text-primary hover:bg-accent/90">
            {primaryActionLabel}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
