# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw
import os

def render_official_logo(size=512):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    scale = size / 512.0
    
    # 1. Background rounded rect (#4F46E5 Indigo)
    draw.rounded_rectangle(
        [0, 0, size, size], 
        radius=int(128 * scale), 
        fill='#4F46E5'
    )
    
    # 2. Terminal screen (#080B10 Dark Slate)
    draw.rounded_rectangle(
        [int(120 * scale), int(140 * scale), int(392 * scale), int(372 * scale)], 
        radius=int(40 * scale), 
        fill='#080B10'
    )
    
    # 3. 4 Dots (#6366F1 Light Indigo)
    r = int(24 * scale)
    dots = [
        (int(210 * scale), int(220 * scale)),
        (int(302 * scale), int(220 * scale)),
        (int(210 * scale), int(300 * scale)),
        (int(302 * scale), int(300 * scale))
    ]
    for cx, cy in dots:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill='#6366F1')
        
    # 4. Stand line
    sw = max(2, int(24 * scale))
    draw.line([int(256 * scale), int(372 * scale), int(256 * scale), int(416 * scale)], fill='#6366F1', width=sw)
    draw.line([int(216 * scale), int(416 * scale), int(296 * scale), int(416 * scale)], fill='#6366F1', width=sw)
    
    out_dir = os.path.dirname(os.path.abspath(__file__))
    icon_path = os.path.join(out_dir, "app_icon.ico")
    
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icons = [img.resize(s, Image.Resampling.LANCZOS) for s in sizes]
    icons[0].save(icon_path, format="ICO", sizes=[(s[0], s[1]) for s in sizes])
    
    # Also save PNG version
    img.save(os.path.join(out_dir, "app_logo.png"), format="PNG")
    print(f"Official logo icon generated: {icon_path}")

if __name__ == "__main__":
    render_official_logo()
