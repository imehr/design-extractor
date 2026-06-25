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

def extract_images():
    for fname in os.listdir(cache_dir):
        if not fname.endswith('.json'):
            continue
        data = load_json_file(os.path.join(cache_dir, fname))
        if isinstance(data, str):
            # Search for URLs in raw text
            for m in re.finditer(r'https?://[^\s"\'<>]+\.(?:png|jpg|jpeg|webp|gif|avif|svg)', data):
                images.add(m.group(0))
            continue
        
        def walk(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, str):
                        if k in ('src', 'href', 'url') and v.startswith('http'):
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

def extract_svgs():
    for fname in os.listdir(cache_dir):
        if not fname.endswith('.json'):
            continue
        with open(os.path.join(cache_dir, fname)) as f:
            text = f.read()
        
        # Find data:image/svg+xml,... patterns
        for m in re.finditer(r'data:image/svg+xml,([^"\']+)', text):
            svg_data = m.group(1)
            svg_decoded = urllib.parse.unquote(svg_data)
            svgs.append(svg_decoded)

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
extract_images()
extract_svgs()
extract_favicons()

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
