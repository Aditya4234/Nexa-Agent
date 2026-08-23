"use client";

import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Placeholder({ title, description }: { title?: string; description?: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Construction className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">{title ?? "Coming soon"}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description ?? "This module is part of the platform roadmap and will be available in an upcoming release."}
      </p>
      <Button className="mt-6" variant="outline" onClick={() => router.push("/dashboard")}>
        Back to Dashboard
      </Button>
    </div>
  );
}