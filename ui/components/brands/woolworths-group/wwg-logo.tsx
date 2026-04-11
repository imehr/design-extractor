import Image from "next/image";

interface WWGLogoProps {
  variant?: "color" | "white";
  className?: string;
}

export function WWGLogo({ variant = "color", className }: WWGLogoProps) {
  const src =
    variant === "white"
      ? "/brands/woolworths-group/logo-white.svg"
      : "/brands/woolworths-group/logo-100years.svg";

  return (
    <Image
      src={src}
      alt="Woolworths Group"
      width={120}
      height={48}
      className={className}
      priority
    />
  );
}
