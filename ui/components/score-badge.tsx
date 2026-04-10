"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null;
  confidence?: string;
}

export function ScoreBadge({ score, confidence }: ScoreBadgeProps) {
  const bg =
    score === null
      ? "bg-muted text-muted-foreground"
      : score >= 0.85
        ? "bg-green-100 text-green-800"
        : score >= 0.7
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        bg
      )}
    >
      {score !== null ? `${Math.round(score * 100)}%` : "N/A"}
      {confidence && (
        <span className="text-[10px] opacity-70">{confidence}</span>
      )}
    </span>
  );
}
