"use client";

interface TMobileLogoProps {
  variant?: "default" | "white";
  className?: string;
}

export function TMobileComLogo({ variant = "default", className }: TMobileLogoProps) {
  const src =
    variant === "white"
      ? "/brands/t-mobile-com/tmo-logo-white-v4.svg"
      : "/brands/t-mobile-com/tmo-logo-v4.svg";

  return (
    <img
      src={src}
      alt="T-Mobile"
      className={className}
      width="52"
      height="52"
      style={{ height: "2rem", width: "auto" }}
    />
  );
}
