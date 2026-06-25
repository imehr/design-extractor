"use client";

import { useEffect, Suspense } from "react";
import { TweaksPanel } from "@/components/brands/tweaks-panel";
import "@/app/brands/[slug]/replica/tweaks.css";

export default function CochlearReplicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const header = document.querySelector("body > header");
    const main = document.querySelector("body > main");
    if (header) (header as HTMLElement).style.display = "none";
    if (main) (main as HTMLElement).style.flex = "none";
    return () => {
      if (header) (header as HTMLElement).style.display = "";
      if (main) (main as HTMLElement).style.flex = "";
    };
  }, []);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <TweaksPanel />
      </Suspense>
    </>
  );
}
