import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="classic-surface w-full max-w-2xl rounded-2xl border border-primary/10 p-10 text-center shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Error 404</p>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-xl text-primary/70">
          The page you are looking for may have moved or does not exist. Use the button below to return to the homepage.
        </p>
        <div className="mt-8">
          <Button asChild className="bg-accent text-accent-foreground hover:scale-105 hover:bg-accent/90">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
