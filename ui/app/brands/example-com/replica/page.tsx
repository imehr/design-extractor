"use client";

/* ---------- Data from DOM extraction ---------- */

const EXTRACTED = {
  h1: "Example Domain",
  body: "This domain is for use in documentation examples without needing permission. Avoid use in operations.",
  link: {
    text: "Learn more",
    href: "https://iana.org/domains/example",
  },
};

/* ---------- Token values from computed styles ---------- */

const TOKENS = {
  bg: "#EEEEEE",
  text: "#000000",
  link: "#334488",
  fontFamily: "system-ui, sans-serif",
  bodyFontSize: "16px",
  h1FontSize: "24px",
  h1FontWeight: 700,
  bodyMarginY: "108px",
  bodyMarginX: "256px",
  paragraphMarginY: "16px",
};

/* ---------- Page component ---------- */

export default function ExampleComHomePage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: TOKENS.bg,
        fontFamily: TOKENS.fontFamily,
        fontSize: TOKENS.bodyFontSize,
        color: TOKENS.text,
        lineHeight: "normal",
      }}
      data-component="hero"
    >
      <div
        style={{
          padding: `${TOKENS.bodyMarginY} ${TOKENS.bodyMarginX}`,
        }}
      >
        <h1
          style={{
            fontSize: TOKENS.h1FontSize,
            fontWeight: TOKENS.h1FontWeight,
            lineHeight: "normal",
            margin: `16px 0`,
          }}
        >
          {EXTRACTED.h1}
        </h1>

        <p
          style={{
            margin: `${TOKENS.paragraphMarginY} 0`,
          }}
        >
          {EXTRACTED.body}
        </p>

        <p
          style={{
            margin: `${TOKENS.paragraphMarginY} 0`,
          }}
          data-component="button-set"
        >
          <a
            href={EXTRACTED.link.href}
            style={{
              color: TOKENS.link,
              textDecoration: "underline",
            }}
          >
            {EXTRACTED.link.text}
          </a>
        </p>
      </div>
    </div>
  );
}
