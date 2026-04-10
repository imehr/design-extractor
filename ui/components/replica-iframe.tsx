"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReplicaIframeProps {
  slug: string;
}

const breakpoints = [
  { label: "Desktop", width: 1440 },
  { label: "Tablet", width: 768 },
  { label: "Mobile", width: 390 },
] as const;

export function ReplicaIframe({ slug }: ReplicaIframeProps) {
  const [active, setActive] = useState<number>(1440);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {breakpoints.map((bp) => (
          <Button
            key={bp.width}
            variant={active === bp.width ? "default" : "outline"}
            size="sm"
            onClick={() => setActive(bp.width)}
          >
            {bp.label} ({bp.width}px)
          </Button>
        ))}
      </div>
      <div className="flex justify-center overflow-auto rounded-lg border bg-muted/30 p-4 shadow-inner">
        <div
          className={cn(
            "overflow-hidden rounded-md border bg-white shadow-md transition-all"
          )}
          style={{ width: `${active}px`, maxWidth: "100%" }}
        >
          <iframe
            src={`/api/brands/${slug}/file/replica/index.html`}
            title="Brand replica preview"
            className="h-[600px] w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
