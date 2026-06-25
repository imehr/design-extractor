export function LuminaryLogo({ className = "", invert = false }: { className?: string; invert?: boolean }) {
  return (
    <img
      src="/brands/luminary-ai/logo.svg"
      alt="Luminary"
      className={className}
      style={{
        filter: invert ? "brightness(0) invert(1)" : "none",
        display: "block",
      }}
    />
  );
}
