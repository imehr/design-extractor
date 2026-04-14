export function CircleKLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Circle K"
    >
      {/* Red circle */}
      <circle cx="30" cy="30" r="28" fill="#DA291C" />
      {/* White K */}
      <path
        d="M20 14h6v12l10-12h8l-11 13 12 19h-8l-8.5-14L26 36v10h-6V14z"
        fill="white"
      />
      {/* CIRCLE text */}
      <text
        x="68"
        y="28"
        fill="#DA291C"
        fontFamily="'ACT Easy', sans-serif"
        fontWeight="800"
        fontSize="16"
        letterSpacing="1"
      >
        CIRCLE
      </text>
      {/* K text */}
      <text
        x="68"
        y="50"
        fill="#DA291C"
        fontFamily="'ACT Easy', sans-serif"
        fontWeight="800"
        fontSize="28"
      >
        K
      </text>
    </svg>
  );
}
