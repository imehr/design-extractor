"use client";

import { useEffect } from "react";

export default function ScreenAustraliaReplicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const header = document.querySelector("body > header");
    const main = document.querySelector("body > main");
    if (header) (header as HTMLElement).style.display = "none";
    if (main) (main as HTMLElement).style.flex = "none";

    // Load Open Sans + Open Sans Condensed from Google Fonts
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Open+Sans+Condensed:wght@300;700&family=Open+Sans:wght@300;400;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      if (header) (header as HTMLElement).style.display = "";
      if (main) (main as HTMLElement).style.flex = "";
      link.remove();
    };
  }, []);

  return <>{children}</>;
}
