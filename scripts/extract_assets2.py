#!/usr/bin/env python3
import json, re, urllib.parse, os, sys

cache_dir = sys.argv[1] if len(sys.argv) > 1 else "/Users/mehran/Documents/github/design-extractor/cache/stateofaidesign-com/dom-extraction"

fonts = set()
images = set()
svgs = []
favicons = set()

def load_json_file(path):
    """Load JSON, handling double-encoded strings."""
    with open(path) as f:
        text = f.read().strip()
    # Handle double-encoded JSON (string containing JSON)
    if text.startswith('"') and text.endswith('"'):
        try:
            text = json.loads(text)
        except:
            pass
    try:
        return json.loads(text)
    except:
        return text

def extract_fonts():
    data = load_json_file(os.path.join(cache_dir, 'stateofaidesign-com-fonts.json'))
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                src = item.get('src', '')
            else:
                src = str(item)
            for m in re.finditer(r'url\(["\']?([^"\')]+)["\']?\)', src):
                url = m.group(1)
                if url.startswith('http'):
                    fonts.add(url)

def extract_images_and_svgs():
    for fname in os.listdir(cache_dir):
        if not fname.endswith('.json'):
            continue
        with open(os.path.join(cache_dir, fname)) as f:
            raw_text = f.read()
        
        # Find data:image/svg+xml,... patterns - handle escaped quotes
        # The raw JSON has data:image/svg+xml,<svg display=\"block\"... 
        # We need to extract the SVG markup from inside the JSON string
        pattern = r'data:image/svg+xml,((?:[^"]|\\.)*?(?:<\\/svg>|\\/>))'
        for m in re.finditer(pattern, raw_text, re.IGNORECASE):
            svg_text = m.group(1)
            # Unescape JSON string escapes
            svg_text = svg_text.replace('\\"', '"').replace('\\\\', '\\').replace('\\n', '\n').replace('\\t', '\t')
            svgs.append(svg_text)
        
        # Also look for plain SVG markup in the text
        for m in re.finditer(r'(<svg\b[^>]*>.*?</svg>)', raw_text, re.IGNORECASE | re.DOTALL):
            svg_text = m.group(1)
            # Unescape if needed
            if '\\"' in svg_text:
                svg_text = svg_text.replace('\\"', '"').replace('\\\\', '\\')
            if svg_text not in svgs:
                svgs.append(svg_text)
        
        # Load structured data for image URLs
        data = load_json_file(os.path.join(cache_dir, fname))
        if isinstance(data, str):
            # Search for image URLs in raw text
            for m in re.finditer(r'https?://[^\s"\'<>]+\.(?:png|jpg|jpeg|webp|gif|avif|svg)(?:\?[^\s"\'<>]+)?', raw_text):
                url = m.group(0)
                if not url.endswith('.css') and not url.endswith('.js'):
                    images.add(url)
            continue
        
        def walk(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str):
                        if k in ('src', 'href', 'url') and v.startswith('http'):
                            if any(ext in v.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']):
                                images.add(v)
                        elif k == 'bg' and 'url(' in v:
                            for m in re.finditer(r'url\(["\']?([^"\')]+)["\']?\)', v):
                                url = m.group(1)
                                if url.startswith('http'):
                                    images.add(url)
                    else:
                        walk(v)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item)
        
        walk(data)

def extract_favicons():
    for fname in os.listdir(cache_dir):
        if not fname.endswith('.json'):
            continue
        with open(os.path.join(cache_dir, fname)) as f:
            text = f.read()
        for m in re.finditer(r'favicon[^"\']*["\']([^"\']+)["\']', text, re.IGNORECASE):
            favicons.add(m.group(1))
        for m in re.finditer(r'rel=["\']icon["\'][^>]*href=["\']([^"\']+)["\']', text, re.IGNORECASE):
            favicons.add(m.group(1))
        for m in re.finditer(r'href=["\']([^"\']*favicon[^"\']*)["\']', text, re.IGNORECASE):
            favicons.add(m.group(1))

extract_fonts()
extract_images_and_svgs()
extract_favicons()

# Filter out non-image URLs
images = {u for u in images if any(ext in u.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg'])}

print("=== FONTS ===")
for url in sorted(fonts):
    print(url)

print(f"\n=== IMAGES ({len(images)}) ===")
for url in sorted(images):
    print(url)

print(f"\n=== SVGS ({len(svgs)} found) ===")
for i, svg in enumerate(svgs[:5]):
    print(f"--- SVG {i+1} (len={len(svg)}) ---")
    print(svg[:300])

print("\n=== FAVICONS ===")
for url in sorted(favicons):
    print(url)
