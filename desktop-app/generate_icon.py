from PIL import Image, ImageDraw
import os

def create_icon():
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    images = []
    
    for size in sizes:
        w, h = size
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Rounded background rectangle (Dark Indigo/Blue theme)
        margin = max(1, w // 16)
        radius = max(2, w // 6)
        
        draw.rounded_rectangle(
            [margin, margin, w - margin, h - margin],
            radius=radius,
            fill=(15, 23, 42, 255),
            outline=(99, 102, 241, 255),
            width=max(1, w // 32)
        )
        
        # Inner receipt / POS shape (Orange/Amber accent)
        rw = w // 2
        rh = h // 2
        rx = (w - rw) // 2
        ry = (h - rh) // 2
        
        # Receipt icon paper
        draw.rounded_rectangle(
            [rx, ry, rx + rw, ry + rh],
            radius=max(1, w // 20),
            fill=(248, 250, 252, 255)
        )
        
        # Lines on receipt
        line_pad = rw // 5
        line_h = max(1, h // 28)
        for i in range(3):
            ly = ry + (i + 1) * (rh // 4)
            draw.rectangle(
                [rx + line_pad, ly, rx + rw - line_pad, ly + line_h],
                fill=(249, 115, 22, 255) if i == 0 else (148, 163, 184, 255)
            )
            
        images.append(img)
        
    out_dir = os.path.dirname(os.path.abspath(__file__))
    icon_path = os.path.join(out_dir, "app_icon.ico")
    images[0].save(icon_path, format="ICO", sizes=[(s[0], s[1]) for s in sizes])
    print(f"Icon generated: {icon_path}")

if __name__ == "__main__":
    create_icon()
