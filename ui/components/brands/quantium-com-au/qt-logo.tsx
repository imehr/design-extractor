import Link from "next/link";

interface QtLogoProps {
  variant?: "dark" | "light";
  height?: number;
  href?: string;
}

/**
 * Quantium logo — renders the downloaded SVG.
 * Falls back to styled text if the image fails to load.
 */
export function QtLogo({
  variant = "dark",
  height = 26,
  href = "/brands/quantium-com-au/replica",
}: QtLogoProps) {
  const src =
    variant === "light"
      ? "/brands/quantium-com-au/logo-white.svg"
      : "/brands/quantium-com-au/logo.svg";

  const inner = (
    <img
      src={src}
      alt="Quantium"
      style={{ height, width: "auto" }}
      onError={(e) => {
        // If SVG fails, swap to styled text fallback
        const span = document.createElement("span");
        span.textContent = "quantium";
        span.style.fontFamily = "'QuantiumPro', 'Inter', sans-serif";
        span.style.fontWeight = "500";
        span.style.fontSize = `${height}px`;
        span.style.color = variant === "light" ? "#ffffff" : "#1A1A1A";
        span.style.letterSpacing = "0.02em";
        (e.target as HTMLElement).replaceWith(span);
      }}
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex shrink-0 items-center">
        {inner}
      </Link>
    );
  }

  return <div className="flex shrink-0 items-center">{inner}</div>;
}
