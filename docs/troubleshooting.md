# Troubleshooting

Known failure modes, graceful degradation rules, and workarounds. Data sourced from the Phase 0 10-URL baseline stress test (`tests/fixtures/baseline-report.md`).

## Failure mode reference

| Failure mode | Detection | What happens | Confidence impact |
|---|---|---|---|
| `networkidle` never reached | Playwright timeout exception | Retry with `domcontentloaded` + 4s wait. If still failing, retry with `load` + 8s wait. Proceed with whatever was captured. | LOW on all downstream |
| Unhandled script error | Non-zero exit with no JSON output | Forked `extract_tokens.py` wraps all stages in try/except and writes structured error JSON. Downstream stages see the error and decide. | N/A (error reported) |
| Cloudflare / bot challenge | HTTP 403 or page title "Just a moment" | Retry with Firefox engine + stealth. If still blocked, hard fail on Gate R. | Extraction aborted |
| Cookie / GDPR overlay | Recon screenshot > 40% single-colour band | agent-browser `snapshot -i` -> LLM identifies dismiss button -> `click @eN`. Cap 2 attempts. | No impact if dismissed |
| SPA skeleton only | `computed_colours < 15` AND `custom_properties > 100` | Log `extraction_warning: under_hydrated_spa`. Retry with longer settle. | MEDIUM on tokens |
| Geo-blocked | HTTP 451 | Hard fail. No brand entry written. | Extraction aborted |
| Zero custom-property colours | All colours from computed styles only | Not a failure. Switch dominant source to `computed`. | MEDIUM (token source is aggregate, not declared) |
| Zero breakpoints | `breakpoints: []` | Log `responsive_strategy: container-or-runtime`. Do not report "non-responsive". | No impact |
| Variable font axis values | Weights outside 100-step set (e.g., 510, 590) | Not a failure. Report axis precision as a feature. | No impact |
| Single-page site | `internal_links < 5` | Skip multi-page sweep. Treat landing as comprehensive. | No impact |

## Known hard sites

### Airbnb (airbnb.com)

**Status:** Fails at recon (networkidle timeout).

**Root cause:** Airbnb's analytics/tracking pixels maintain perpetual network activity. The page renders fine interactively but the `networkidle` wait condition never resolves within 30s.

**Workaround:** The forked `extract_tokens.py` defaults to `domcontentloaded` instead of `networkidle`. If extraction still fails:
1. Check that Playwright is using the forked script (not upstream brand-extractor).
2. Try increasing the settle timeout: edit `extract_tokens.py` line ~97 to increase `page.wait_for_timeout(4000)` to `8000`.

**Expected quality:** If recon succeeds with the fallback, token extraction should work. Expect MEDIUM confidence on tokens due to the truncated wait.

### Apple (apple.com)

**Status:** Passes, but minimal extraction (99 CSS custom properties, 28 computed colours).

**Root cause:** Apple intentionally exposes very little CSS infrastructure. Their design system is largely image-based and uses heavily-scoped class names.

**Expected quality:** Token extraction is thin but real. Rely on the visual-critic and replica loop for brand fidelity rather than token completeness. Expect MEDIUM confidence on tokens, HIGH on patterns (screenshots are clean).

### NYTimes (nytimes.com)

**Status:** Passes with outlier metrics (11 font families, 44 breakpoints).

**Root cause:** Editorial design with multiple display fonts, ad-tech responsive grids, and complex typography hierarchy.

**Expected quality:** Full extraction works. The typography section will be larger than typical (5 font role classifications instead of the usual 2-3). Breakpoint count is inflated by ad containers — the pattern-analyst filters these when computing the alignment grid.

### LinkedIn (linkedin.com)

**Status:** Passes, but computed colours are suspiciously low (10) versus custom properties (822).

**Root cause:** The unauthenticated public homepage renders a skeleton. The 822 custom properties are declared in CSS but the DOM only hydrates the chrome, not the full app.

**Expected quality:** Custom-property tokens are rich. Computed style tokens are thin. The `extraction_warning: under_hydrated_spa` flag fires automatically. Expect MEDIUM confidence on tokens.

## Playwright issues

### Browser not found

```
playwright._impl._errors.Error: Browser was not found.
```

Run:
```bash
python3 -m playwright install chromium
```

If that fails on macOS:
```bash
python3 -m playwright install --with-deps chromium
```

### Headless crashes on M-series Mac

If Chromium crashes immediately in headless mode:
```bash
PLAYWRIGHT_CHROMIUM_SANDBOX=0 python3 scripts/extract_tokens.py --stage recon --url <url>
```

### pip install fails (PEP 668)

Homebrew Python is externally-managed. Use:
```bash
python3 -m pip install --user --break-system-packages <package>
```

## Library issues

### Index is empty after extraction

Check that the `librarian` agent completed successfully. Look at:
```bash
cat ~/.claude/design-library/index.json
```

If the file is missing or empty, re-run the librarian manually:
```bash
python3 scripts/update_library_index.py --add <slug> \
  --metadata ~/.claude/design-library/brands/<slug>/metadata.json
```

### UI shows no brands

1. Check that the library has brands: `cat ~/.claude/design-library/index.json`
2. Check that the UI is reading the right directory: the default is `~/.claude/design-library/`
3. Try restarting the dev server: `pkill -f "next dev.*5173"` then `/design-extractor:browse`

### Replica iframe is blank

The replica HTML uses Tailwind CDN (`cdn.tailwindcss.com`). If the iframe is blank:
1. Check your network connection (the iframe needs internet for the CDN).
2. Check browser console for CORS errors — the file proxy route serves with the correct content type but some browsers block `file://` in iframes.
3. Open the replica directly: `open ~/.claude/design-library/brands/<slug>/replica/index.html`

## See also

- `tests/fixtures/baseline-report.md` — full Phase 0 baseline report with stats per URL
- [concepts.md](./concepts.md) — the 5-gate validation model and confidence scoring
- [getting-started.md](./getting-started.md) — Playwright installation
