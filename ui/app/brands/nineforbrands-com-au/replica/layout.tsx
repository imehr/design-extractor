"use client";

import { useEffect } from "react";

export default function NineReplicaLayout({
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

  return <>{children}</>;
}
