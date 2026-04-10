---
name: browse
description: Launch the design library browser UI at http://localhost:5173. Shows all extracted brands in a card grid with category tabs, search, and 9-tab detail pages per brand including live replica preview, token inspector, and SKILL.md viewer.
---

# /design-extractor:browse

Launch the Next.js library browser to explore extracted design systems.

## Instructions

1. Launch the UI using the launch script:
   ```bash
   bash $PLUGIN_DIR/scripts/launch_ui.sh
   ```

2. If the script is not found or fails, fall back to manual launch:
   ```bash
   cd $PLUGIN_DIR/ui
   pnpm install --silent 2>/dev/null
   pnpm dev --port 5173 &
   sleep 3
   open http://localhost:5173
   ```

3. Tell the user the UI is running at http://localhost:5173

4. If the library is empty (no brands extracted yet), suggest:
   - `/design-extractor:seed-library` to install the Nimbus sample brand
   - `/design-extractor:extract <url>` to extract a real brand

## What the UI shows

- **Library page** (`/`): card grid of all brands with category tabs, search, score badges
- **Detail page** (`/brands/<slug>`): 9 tabs — Overview, DESIGN.md, Tokens, Components, Replica (live iframe with breakpoint toggle), Assets, Skill (with copy button), Validation, Raw Files

The UI reads from `~/.claude/design-library/` server-side via API routes. Data is always fresh (no caching).

## Stopping the UI

The dev server runs in the background. To stop it:
```bash
pkill -f "next dev.*5173"
```
