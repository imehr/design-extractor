#!/usr/bin/env python3
import json, re, os, sys, urllib.request, urllib.parse, subprocess

SLUG = 'stateofaidesign-com'
CACHE_DIR = f'/Users/mehran/Documents/github/design-extractor/cache/{SLUG}'
UI_DIR = '/Users/mehran/Documents/github/design-extractor/ui'
DOM_DIR = f'{CACHE_DIR}/dom-extraction'
ASSETS_DIR = f'{CACHE_DIR}/assets'
BRAND_DIR = f'{UI_DIR}/public/brands/{SLUG}'
FONTS_DIR = f'{BRAND_DIR}/fonts'
SOCIAL_DIR = f'{BRAND_DIR}/social'

os.makedirs(FONTS_DIR, exist_ok=True)
os.makedirs(SOCIAL_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Load double-encoded JSON
def load_json_file(path):
    with open(path) as f:
        text = f.read().strip()
    if text.startswith('"') and text.endswith('"'):
        try:
            text = json.loads(text)
        except:
            pass
    try:
        return json.loads(text)
    except:
        return text

# Download a URL to a path, return success
def download(url, dest):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; AssetExtractor/1.0)'}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(dest, 'wb') as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"FAIL: {url} -> {dest}: {e}")
        return False

# Verify with file command
def verify_file(path):
    try:
        result = subprocess.run(['file', path], capture_output=True, text=True)
        return result.stdout.strip()
    except:
        return None

# ========== EXTRACT FONTS ==========
print("Extracting fonts...")
fonts_data = load_json_file(f'{DOM_DIR}/stateofaidesign-com-fonts.json')
font_urls = set()
if isinstance(fonts_data, list):
    for item in fonts_data:
        if isinstance(item, dict):
            src = item.get('src', '')
        else:
            src = str(item)
        for m in re.finditer(r'url\(["\']?([^"\')]+)["\']?\)', src):
            url = m.group(1)
            if url.startswith('http'):
                font_urls.add(url)

print(f"Found {len(font_urls)} unique fonts")

# ========== EXTRACT IMAGES ==========
print("Extracting images...")
image_urls = set()
for fname in os.listdir(DOM_DIR):
    if not fname.endswith('.json'):
        continue
    data = load_json_file(f'{DOM_DIR}/{fname}')
    if isinstance(data, str):
        continue
    
    def walk(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, str):
                    if k in ('src', 'href', 'url') and v.startswith('http'):
                        if any(ext in v.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']):
                            image_urls.add(v)
                    elif k == 'bg' and 'url(' in v:
                        for m in re.finditer(r'url\(["\']?([^"\')]+)["\']?\)', v):
                            url = m.group(1)
                            if url.startswith('http'):
                                image_urls.add(url)
                else:
                    walk(v)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)
    
    walk(data)

print(f"Found {len(image_urls)} unique images")

# ========== EXTRACT SVGS ==========
print("Extracting SVGs...")
svgs = []
for fname in ['stateofaidesign-com-all-images.json', 'stateofaidesign-com-images-top.json']:
    path = f'{DOM_DIR}/{fname}'
    if not os.path.exists(path):
        continue
    data = load_json_file(path)
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                src = item.get('src', '')
                if src.startswith('data:image/svg+xml'):
                    svg = src[len('data:image/svg+xml,'):]
                    if svg not in svgs:
                        svgs.append(svg)

print(f"Found {len(svgs)} unique SVGs")

# ========== EXTRACT FAVICONS ==========
print("Extracting favicons...")
favicon_urls = set()
favicon_urls.add('https://framerusercontent.com/images/YeBg4KhukpeFDQRc7qUySaNCzM4.png')  # from curl
favicon_urls.add('https://framerusercontent.com/images/LYZGuKjYSwOjtebGnDa0R1K1zg.png')  # apple-touch-icon

# ========== DOWNLOAD FONTS ==========
print("\nDownloading fonts...")
font_files = []
font_failures = []
for url in sorted(font_urls):
    basename = os.path.basename(urllib.parse.urlparse(url).path) or 'font.woff2'
    dest = f'{FONTS_DIR}/{basename}'
    if download(url, dest):
        info = verify_file(dest)
        if info and ('font' in info.lower() or 'woff' in info.lower() or 'opentype' in info.lower()):
            print(f"  OK: {basename} ({info})")
            font_files.append(basename)
        else:
            print(f"  WARN: {basename} may not be a font ({info})")
            font_files.append(basename)
    else:
        font_failures.append(url)

# ========== DOWNLOAD IMAGES ==========
print("\nDownloading images...")
image_files = []
image_failures = []
for url in sorted(image_urls):
    parsed = urllib.parse.urlparse(url)
    basename = os.path.basename(parsed.path)
    if not basename:
        basename = 'image'
    # Add extension if missing
    if '.' not in basename:
        if 'png' in url:
            basename += '.png'
        elif 'jpg' in url or 'jpeg' in url:
            basename += '.jpg'
        elif 'webp' in url:
            basename += '.webp'
        elif 'svg' in url:
            basename += '.svg'
    # Handle query params that might have width/height
    if '?' in basename:
        basename = basename.split('?')[0]
    dest = f'{BRAND_DIR}/{basename}'
    if download(url, dest):
        info = verify_file(dest)
        if info and ('image' in info.lower() or 'PNG' in info or 'JPEG' in info or 'SVG' in info or 'WebP' in info):
            print(f"  OK: {basename} ({info})")
            image_files.append(basename)
        else:
            print(f"  WARN: {basename} may not be an image ({info})")
            image_files.append(basename)
    else:
        image_failures.append(url)

# ========== SAVE SVGs ==========
print("\nSaving SVGs...")
svg_files = []
# Find the logo - prefer 142x36 viewBox (the actual site logo), otherwise use heuristic
logo_svg = None
for svg in svgs:
    vb_match = re.search(r'viewBox="([^"]+)"', svg)
    if vb_match and vb_match.group(1) == '0 0 142 36':
        logo_svg = svg
        break

if not logo_svg:
    logo_score = 0
    for svg in svgs:
        vb_match = re.search(r'viewBox="([^"]+)"', svg)
        if vb_match:
            parts = vb_match.group(1).split()
            if len(parts) == 4:
                w, h = float(parts[2]), float(parts[3])
                score = w / max(h, 1)  # prefer wide aspect ratio
                if score > logo_score:
                    logo_score = score
                    logo_svg = svg

if logo_svg:
    logo_path = f'{BRAND_DIR}/logo.svg'
    with open(logo_path, 'w') as f:
        f.write(logo_svg)
    info = verify_file(logo_path)
    print(f"  OK: logo.svg ({info})")
    svg_files.append('logo.svg')
else:
    print("  FAIL: no logo SVG found")

# Save other unique SVGs
social_names = ['x', 'twitter', 'linkedin', 'github', 'instagram', 'youtube']
social_idx = 0
saved_svg_viewboxes = set()
if logo_svg:
    vb_match = re.search(r'viewBox="([^"]+)"', logo_svg)
    if vb_match:
        saved_svg_viewboxes.add(vb_match.group(1))

for svg in svgs:
    vb_match = re.search(r'viewBox="([^"]+)"', svg)
    if vb_match:
        vb = vb_match.group(1)
        if vb in saved_svg_viewboxes:
            continue
        saved_svg_viewboxes.add(vb)
    
    if social_idx < len(social_names):
        name = social_names[social_idx]
        social_idx += 1
    else:
        name = f'icon{social_idx}'
        social_idx += 1
    
    svg_path = f'{SOCIAL_DIR}/{name}.svg'
    with open(svg_path, 'w') as f:
        f.write(svg)
    svg_files.append(f'social/{name}.svg')
    print(f"  OK: social/{name}.svg")

# ========== DOWNLOAD FAVICONS ==========
print("\nDownloading favicons...")
favicon_files = []
favicon_failures = []
for url in sorted(favicon_urls):
    parsed = urllib.parse.urlparse(url)
    basename = os.path.basename(parsed.path) or 'favicon.png'
    if 'apple' in url.lower():
        basename = 'apple-touch-icon.png'
    dest = f'{ASSETS_DIR}/{basename}'
    if download(url, dest):
        info = verify_file(dest)
        if info and ('image' in info.lower() or 'PNG' in info):
            print(f"  OK: {basename} ({info})")
            favicon_files.append(basename)
        else:
            print(f"  WARN: {basename} may not be an image ({info})")
            favicon_files.append(basename)
    else:
        favicon_failures.append(url)

# ========== WRITE INVENTORY ==========
print("\nWriting assets-inventory.json...")
inventory = {
    "fonts": sorted(font_files),
    "images": sorted(image_files),
    "svgs": sorted(svg_files),
    "favicons": sorted(favicon_files)
}
with open(f'{CACHE_DIR}/assets-inventory.json', 'w') as f:
    json.dump(inventory, f, indent=2)

# ========== VERIFY OUTPUTS ==========
print("\n=== VERIFICATION ===")
print(f"assets-inventory.json: {'OK' if os.path.exists(f'{CACHE_DIR}/assets-inventory.json') else 'FAIL'}")
font_count = len([f for f in os.listdir(FONTS_DIR) if os.path.isfile(f'{FONTS_DIR}/{f}')])
print(f"fonts: {font_count} files ({'OK' if font_count > 0 else 'none downloaded'})")
print(f"logo.svg: {'OK' if os.path.exists(f'{BRAND_DIR}/logo.svg') else 'FAIL'}")
img_count = len([f for f in os.listdir(BRAND_DIR) if os.path.isfile(f'{BRAND_DIR}/{f}') and f != 'logo.svg'])
print(f"images: {img_count} files in brand dir")

# ========== SUMMARY ==========
print("\n=== SUMMARY ===")
print(f"Fonts downloaded: {len(font_files)} ({len(font_failures)} failures)")
print(f"Images downloaded: {len(image_files)} ({len(image_failures)} failures)")
print(f"SVGs extracted: {len(svg_files)}")
print(f"Favicons downloaded: {len(favicon_files)} ({len(favicon_failures)} failures)")
if font_failures:
    print("Font failures:", font_failures)
if image_failures:
    print("Image failures:", image_failures)
if favicon_failures:
    print("Favicon failures:", favicon_failures)
