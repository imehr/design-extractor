"use client";

import { Suspense } from "react";

/**
 * TweaksPanel — collapsible floating panel for live-remixing the
 * extracted brand replica. Writes CSS custom properties on
 * document.documentElement so replica components that reference
 * them (or rules in tweaks.css) re-skin without a refresh.
 *
 * Behind a "Remix" toggle so the panel never disturbs the
 * pixel-perfect appearance by default. Activates when:
 *   - URL query has ?remix=1
 *   - OR the floating "Remix" button is clicked
 *
 * localStorage key: "brand-tweaks-<slug>" — scoped per brand to
 * avoid cross-brand contamination.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Density = "compact" | "comfortable" | "spacious";

interface Tweaks {
  primaryHue: number; // -180..180 hue rotation
  fontScale: number; // 0.85..1.15
  density: Density;
  radiusScale: number; // 0..2
}

const DEFAULTS: Tweaks = {
  primaryHue: 0,
  fontScale: 1,
  density: "comfortable",
  radiusScale: 1,
};

const DENSITY_PAD: Record<Density, string> = {
  compact: "0.75",
  comfortable: "1",
  spacious: "1.35",
};

function storageKey(slug: string) {
  return `brand-tweaks-${slug}`;
}

function readStored(slug: string): Tweaks {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Tweaks>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function applyToDom(t: Tweaks) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--tweak-primary-hue", `${t.primaryHue}deg`);
  root.style.setProperty("--tweak-font-scale", String(t.fontScale));
  root.style.setProperty("--tweak-density", DENSITY_PAD[t.density]);
  root.style.setProperty("--tweak-radius-scale", String(t.radiusScale));
  root.setAttribute("data-tweaks-active", "1");
}

function clearFromDom() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--tweak-primary-hue");
  root.style.removeProperty("--tweak-font-scale");
  root.style.removeProperty("--tweak-density");
  root.style.removeProperty("--tweak-radius-scale");
  root.removeAttribute("data-tweaks-active");
}

function buildCssExport(t: Tweaks): string {
  return [
    ":root {",
    `  --tweak-primary-hue: ${t.primaryHue}deg;`,
    `  --tweak-font-scale: ${t.fontScale};`,
    `  --tweak-density: ${DENSITY_PAD[t.density]};`,
    `  --tweak-radius-scale: ${t.radiusScale};`,
    "}",
  ].join("\n");
}

function TweaksPanelInner() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  // Replicas always live at /brands/<slug>/replica/... — derive the
  // slug from the URL rather than useParams because each brand has
  // its own static (non-dynamic) route, so useParams() is empty.
  const slugMatch = pathname.match(/\/brands\/([^/]+)\/replica/);
  const slug = slugMatch?.[1] ?? "default";

  // Gating: only render when user opts in.
  const remixQuery = searchParams?.get("remix");
  const queryOptIn = remixQuery === "1" || remixQuery === "true";

  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(queryOptIn);
  const [open, setOpen] = useState(queryOptIn);
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from storage on mount.
  useEffect(() => {
    setMounted(true);
    const initial = readStored(slug);
    setTweaks(initial);
    // Only apply if user has opted in (avoid disturbing the replica).
    if (queryOptIn) applyToDom(initial);
  }, [slug, queryOptIn]);

  // Listen to cross-tab / cross-context updates.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey(slug)) return;
      const next = readStored(slug);
      setTweaks(next);
      if (enabled) applyToDom(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [slug, enabled]);

  const update = useCallback(
    (patch: Partial<Tweaks>) => {
      setTweaks((prev) => {
        const next = { ...prev, ...patch };
        try {
          window.localStorage.setItem(storageKey(slug), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        applyToDom(next);
        return next;
      });
    },
    [slug],
  );

  const reset = useCallback(() => {
    setTweaks(DEFAULTS);
    try {
      window.localStorage.removeItem(storageKey(slug));
    } catch {
      /* ignore */
    }
    clearFromDom();
    if (enabled) applyToDom(DEFAULTS);
  }, [slug, enabled]);

  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCssExport(tweaks));
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, [tweaks]);

  const enable = useCallback(() => {
    setEnabled(true);
    setOpen(true);
    applyToDom(tweaks);
  }, [tweaks]);

  const disable = useCallback(() => {
    setEnabled(false);
    setOpen(false);
    clearFromDom();
  }, []);

  const cssPreview = useMemo(() => buildCssExport(tweaks), [tweaks]);

  if (!mounted) return null;

  // Off state: small floating "Remix" pill.
  if (!enabled) {
    return (
      <div
        data-tweaks-mount=""
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9999,
        }}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={enable}
          aria-label="Open remix panel"
        >
          Remix
        </Button>
      </div>
    );
  }

  // Collapsed but enabled.
  if (!open) {
    return (
      <div
        data-tweaks-mount=""
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 9999,
          display: "flex",
          gap: 8,
        }}
      >
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          Remix
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={disable}>
          Off
        </Button>
      </div>
    );
  }

  return (
    <div
      data-tweaks-mount=""
      role="dialog"
      aria-label="Brand remix tweaks"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        width: 300,
        maxWidth: "calc(100vw - 32px)",
        background: "white",
        color: "#111",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        boxShadow: "0 18px 48px rgba(0,0,0,0.18)",
        padding: 16,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 13 }}>Remix · {slug}</strong>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Collapse remix panel"
          onClick={() => setOpen(false)}
        >
          –
        </Button>
      </div>

      {/* Primary hue */}
      <label style={{ display: "block", marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#555",
            marginBottom: 4,
          }}
        >
          <span>Primary hue shift</span>
          <span>{tweaks.primaryHue}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={tweaks.primaryHue}
          onChange={(e) => update({ primaryHue: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </label>

      {/* Font scale */}
      <label style={{ display: "block", marginBottom: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#555",
            marginBottom: 4,
          }}
        >
          <span>Font scale</span>
          <span>{tweaks.fontScale.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0.85}
          max={1.15}
          step={0.01}
          value={tweaks.fontScale}
          onChange={(e) => update({ fontScale: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </label>

      {/* Density */}
      <label style={{ display: "block", marginBottom: 10 }}>
        <div style={{ color: "#555", marginBottom: 4 }}>Density</div>
        <select
          value={tweaks.density}
          onChange={(e) => update({ density: e.target.value as Density })}
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 8,
            background: "white",
          }}
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </label>

      {/* Radius scale */}
      <label style={{ display: "block", marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#555",
            marginBottom: 4,
          }}
        >
          <span>Radius scale</span>
          <span>{tweaks.radiusScale.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={tweaks.radiusScale}
          onChange={(e) => update({ radiusScale: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </label>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={reset}
        >
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copyCss}
          aria-live="polite"
        >
          {copied ? "Copied" : "Copy CSS"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={disable}
          aria-label="Disable remix"
          style={{ marginLeft: "auto" }}
        >
          Off
        </Button>
      </div>

      <pre
        aria-hidden="true"
        style={{
          marginTop: 10,
          background: "#f7f7f7",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 8,
          padding: 8,
          fontSize: 11,
          lineHeight: 1.35,
          overflow: "auto",
          maxHeight: 110,
        }}
      >
        {cssPreview}
      </pre>
    </div>
  );
}

export function TweaksPanel() {
  return (
    <Suspense fallback={null}>
      <TweaksPanelInner />
    </Suspense>
  );
}

export default TweaksPanel;
