from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance


ROOT = Path(r"C:\Users\2NV\Desktop\Prueba de IPM")
DOWNLOADS = Path(r"C:\Users\2NV\Downloads")
OUT = ROOT / "propuesta_marketing_apartamento"
OUT.mkdir(exist_ok=True)

FONT = Path(r"C:\Windows\Fonts\segoeui.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\segoeuib.ttf")

IMG_SALA = DOWNLOADS / "WhatsApp Image 2026-06-08 at 10.53.04 AM (1).jpeg"
IMG_BANO = DOWNLOADS / "WhatsApp Image 2026-06-08 at 10.53.04 AM.jpeg"
IMG_COCINA = DOWNLOADS / "WhatsApp Image 2026-06-08 at 10.53.05 AM (5).jpeg"
IMG_CLOSET = DOWNLOADS / "WhatsApp Image 2026-06-08 at 10.53.05 AM.jpeg"
IMG_ESTUDIO = DOWNLOADS / "WhatsApp Image 2026-06-08 at 10.53.05 AM (1).jpeg"
IMG_ROPAS = DOWNLOADS / "WhatsApp Image 2026-06-08 at 10.53.05 AM (4).jpeg"

INK = (26, 28, 30)
CREAM = (248, 245, 239)
GOLD = (186, 145, 82)
WOOD = (98, 78, 64)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)


def font(size, bold=False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT), size)


def cover(path, size, focus=(0.5, 0.5)):
    im = Image.open(path).convert("RGB")
    sw, sh = size
    scale = max(sw / im.width, sh / im.height)
    nw, nh = round(im.width * scale), round(im.height * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = int((nw - sw) * focus[0])
    top = int((nh - sh) * focus[1])
    return im.crop((left, top, left + sw, top + sh))


def fit(path, box):
    im = Image.open(path).convert("RGB")
    im.thumbnail(box, Image.Resampling.LANCZOS)
    return im


def enhance(im, brightness=1.05, contrast=1.08):
    im = ImageEnhance.Brightness(im).enhance(brightness)
    return ImageEnhance.Contrast(im).enhance(contrast)


def draw_overlay(im, top_alpha=15, bottom_alpha=190):
    w, h = im.size
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    px = overlay.load()
    for y in range(h):
        a = int(top_alpha + (bottom_alpha - top_alpha) * (y / h) ** 1.5)
        for x in range(w):
            px[x, y] = (0, 0, 0, a)
    return Image.alpha_composite(im.convert("RGBA"), overlay)


def text(draw, pos, value, size, fill=WHITE, bold=False, anchor=None, spacing=4):
    draw.multiline_text(pos, value, font=font(size, bold), fill=fill, anchor=anchor, spacing=spacing)


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def pill(draw, xy, label, size=28, fill=CREAM, txt=INK):
    rounded(draw, xy, 18, fill)
    cx = (xy[0] + xy[2]) // 2
    cy = (xy[1] + xy[3]) // 2
    draw.text((cx, cy), label, font=font(size, True), fill=txt, anchor="mm")


def add_logo_bar(draw, w, y):
    draw.rectangle((0, y, w, y + 110), fill=CREAM)
    draw.text((54, y + 38), "RESERVA DE SOPO 2", font=font(31, True), fill=INK)
    draw.text((54, y + 72), "Sopo, Cundinamarca", font=font(21), fill=WOOD)
    draw.text((w - 54, y + 55), "302 433 9513", font=font(30, True), fill=INK, anchor="rm")


def square_post():
    W = H = 1080
    im = enhance(cover(IMG_SALA, (W, H), focus=(0.42, 0.54)))
    im = draw_overlay(im, 0, 205)
    d = ImageDraw.Draw(im)

    rounded(d, (54, 54, 386, 112), 20, (248, 245, 239, 235))
    d.text((220, 83), "ADMIN. INCLUIDA", font=font(25, True), fill=INK, anchor="mm")

    d.text((54, 610), "ARRIENDO", font=font(48, True), fill=GOLD)
    d.text((54, 665), "APARTAMENTO\nPARA ESTRENAR", font=font(82, True), fill=WHITE, spacing=2)
    d.text((58, 842), "Reserva de Sopó 2 - Manzana A", font=font(31), fill=CREAM)

    pill(d, (54, 904, 306, 966), "3 habitaciones")
    pill(d, (326, 904, 502, 966), "2 baños")
    pill(d, (522, 904, 688, 966), "balcón")

    rounded(d, (54, 994, 548, 1056), 18, (26, 28, 30, 230), outline=GOLD, width=2)
    d.text((76, 1025), "$1.500.000", font=font(38, True), fill=WHITE, anchor="lm")
    d.text((1050, 1025), "302 433 9513", font=font(34, True), fill=WHITE, anchor="rm")
    im.convert("RGB").save(OUT / "01_publicacion_cuadrada.png", quality=95)


def story():
    W, H = 1080, 1920
    im = enhance(cover(IMG_SALA, (W, H), focus=(0.38, 0.48)))
    im = draw_overlay(im, 20, 225)
    d = ImageDraw.Draw(im)

    d.text((72, 104), "Reserva de Sopó 2", font=font(42, True), fill=CREAM)
    rounded(d, (72, 166, 450, 230), 18, (248, 245, 239, 235))
    d.text((261, 198), "ADMINISTRACIÓN INCLUIDA", font=font(24, True), fill=INK, anchor="mm")

    d.text((72, 1180), "Estrena apartamento\nen Sopó", font=font(86, True), fill=WHITE, spacing=4)
    d.text((76, 1394), "3 habitaciones | 2 baños | balcón | cocina integral", font=font(31), fill=CREAM)

    rounded(d, (72, 1488, 1008, 1608), 22, (248, 245, 239, 238))
    d.text((112, 1548), "$1.500.000", font=font(56, True), fill=INK, anchor="lm")
    d.text((112, 1590), "Canon con administración incluida", font=font(26), fill=WOOD, anchor="lm")

    rounded(d, (72, 1660, 1008, 1774), 22, (26, 28, 30, 238), outline=GOLD, width=3)
    d.text((112, 1717), "Agenda tu visita", font=font(30), fill=CREAM, anchor="lm")
    d.text((968, 1717), "302 433 9513", font=font(47, True), fill=WHITE, anchor="rm")

    im.convert("RGB").save(OUT / "02_historia_vertical.png", quality=95)


def carousel_slide(path, title, subtitle, number):
    W = H = 1080
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    photo = enhance(cover(path, (W, 770), focus=(0.5, 0.52)))
    im.paste(photo, (0, 0))
    d.rectangle((0, 690, W, 770), fill=(0, 0, 0, 95))
    d.text((54, 725), f"0{number}", font=font(33, True), fill=GOLD, anchor="lm")
    d.text((102, 725), "Reserva de Sopó 2", font=font(28, True), fill=WHITE, anchor="lm")

    d.text((54, 842), title, font=font(60, True), fill=INK)
    d.text((58, 922), subtitle, font=font(31), fill=WOOD)
    d.line((54, 1014, 1026, 1014), fill=GOLD, width=3)
    d.text((54, 1050), "302 433 9513", font=font(35, True), fill=INK)
    return im


def carousel_preview():
    slides = [
        (IMG_SALA, "Apartamento para estrenar", "Iluminado, moderno y con balcon", 1),
        (IMG_COCINA, "Cocina integral moderna", "Acabados nuevos y espacios funcionales", 2),
        (IMG_BANO, "Baños con división en vidrio", "Detalle limpio, actual y listo para usar", 3),
        (IMG_CLOSET, "3 habitaciones comodas", "Closets y buena distribucion interior", 4),
        (IMG_ESTUDIO, "Espacio auxiliar", "Ideal para estudio o trabajo en casa", 5),
    ]
    rendered = []
    for path, title, subtitle, number in slides:
        slide = carousel_slide(path, title, subtitle, number)
        slide.save(OUT / f"03_carrusel_slide_{number}.png", quality=95)
        rendered.append(slide.resize((270, 270), Image.Resampling.LANCZOS))

    sheet = Image.new("RGB", (1440, 760), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    d.text((60, 54), "Propuesta de carrusel", font=font(46, True), fill=INK)
    d.text((60, 112), "Publica estas piezas en este orden para mostrar el apartamento completo.", font=font(26), fill=WOOD)
    x, y = 60, 205
    for idx, slide in enumerate(rendered, 1):
        sheet.paste(slide, (x, y))
        d.text((x + 135, y + 308), f"Slide {idx}", font=font(24, True), fill=INK, anchor="mm")
        x += 275
    d.text(
        (60, 610),
        "Texto sugerido: Apartamento para estrenar en arriendo en Sopó. 3 habitaciones, 2 baños,\n"
        "balcón, cocina integral y administración incluida por $1.500.000. Contacto: 302 433 9513.",
        font=font(25),
        fill=INK,
        spacing=8,
    )
    sheet.save(OUT / "03_guia_carrusel.png", quality=95)


def mini_collage():
    W, H = 1600, 1000
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    left = enhance(cover(IMG_SALA, (900, 1000), focus=(0.4, 0.52)))
    im.paste(left, (0, 0))
    panel = Image.new("RGBA", (760, 1000), (248, 245, 239, 238))
    im = Image.alpha_composite(im.convert("RGBA"), Image.new("RGBA", (W, H), (0, 0, 0, 0)))
    im.alpha_composite(panel, (840, 0))
    d = ImageDraw.Draw(im)
    d.text((910, 86), "PROPUESTA VISUAL", font=font(31, True), fill=GOLD)
    d.text((910, 140), "Arriendo apartamento\npara estrenar", font=font(62, True), fill=INK, spacing=4)
    d.text((914, 298), "Reserva de Sopó 2 - Manzana A", font=font(30), fill=WOOD)

    thumbs = [(IMG_COCINA, "Cocina integral"), (IMG_BANO, "Baños modernos"), (IMG_CLOSET, "3 habitaciones"), (IMG_ROPAS, "Zona de ropas")]
    x, y = 910, 370
    for idx, (path, label) in enumerate(thumbs):
        t = enhance(cover(path, (290, 205), focus=(0.5, 0.5)))
        im.paste(t, (x, y))
        d.text((x, y + 220), label, font=font(24, True), fill=INK)
        x += 330
        if idx == 1:
            x = 910
            y += 285

    rounded(d, (910, 875, 1518, 950), 18, INK)
    d.text((940, 912), "$1.500.000", font=font(38, True), fill=WHITE, anchor="lm")
    d.text((1490, 912), "302 433 9513", font=font(31, True), fill=WHITE, anchor="rm")
    im.convert("RGB").save(OUT / "00_propuesta_visual_resumen.png", quality=95)


if __name__ == "__main__":
    square_post()
    story()
    carousel_preview()
    mini_collage()
    print(OUT)
