# -*- coding: utf-8 -*-
"""
RESTIVADISYON - RESMİ KULLANIM KILAVUZU (PDF ÜRETİCİ)
ReportLab ile kurumsal tipografi, tablolar ve renk paleti kullanılarak PDF üretir.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Turkish-compatible TrueType Fonts from Windows
font_regular = "Helvetica"
font_bold = "Helvetica-Bold"

windows_font_dir = "C:\\Windows\\Fonts"
arial_path = os.path.join(windows_font_dir, "arial.ttf")
arial_bold_path = os.path.join(windows_font_dir, "arialbd.ttf")

if os.path.exists(arial_path) and os.path.exists(arial_bold_path):
    try:
        pdfmetrics.registerFont(TTFont("CustomArial", arial_path))
        pdfmetrics.registerFont(TTFont("CustomArial-Bold", arial_bold_path))
        font_regular = "CustomArial"
        font_bold = "CustomArial-Bold"
    except Exception:
        pass

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont(font_regular, 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header
        self.drawString(54, 800, "RestivAdisyon POS & Adisyon Sistemi - Resmi Kullanım Kılavuzu")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 792, 541, 792)

        # Footer
        self.line(54, 45, 541, 45)
        self.drawString(54, 32, "https://restivadisyon.org")
        page_text = f"Sayfa {self._pageNumber} / {page_count}"
        self.drawRightString(541, 32, page_text)
        self.restoreState()

def build_pdf_manual(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=60,
        bottomMargin=60
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")
    ACCENT = colors.HexColor("#EA580C")
    INDIGO = colors.HexColor("#4F46E5")
    TEXT_DARK = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#475569")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=12,
        leading=16,
        textColor=ACCENT,
        alignment=1
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceAfter=8,
        spaceBefore=14
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=11,
        leading=14,
        textColor=INDIGO,
        spaceAfter=4,
        spaceBefore=8
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        leftIndent=15,
        spaceAfter=3
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 40))
    story.append(Paragraph("RESTİVADİSYON", title_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Bağımsız Masaüstü POS, Adisyon ve QR Menü Yönetim Sistemi", subtitle_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=20, spaceBefore=10))

    cover_box_data = [
        [Paragraph("<b>Doküman:</b> Resmi İşletme & Donanım Kılavuzu", body_style)],
        [Paragraph("<b>Sürüm:</b> v2.0 Dağıtım Paketi (Desktop Standalone)", body_style)],
        [Paragraph("<b>Mimari:</b> Gömülü Çevrimdışı Arayüz + CP857 ESC/POS Motoru", body_style)],
        [Paragraph("<b>Tarih:</b> 2026", body_style)]
    ]
    cover_box = Table(cover_box_data, colWidths=[487])
    cover_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(cover_box)
    story.append(Spacer(1, 30))

    intro_p = (
        "RestivAdisyon, restoran, kafe ve işletmeler için sıfır ek donanım maliyetiyle çalışan "
        "yeni nesil hibrit adisyon platformudur. Bu kılavuz, masaüstü POS yazılımının kurulumunu, "
        "termal yazıcı entegrasyonunu, garson cihazı eşleme adımlarını ve finansal ciro yönetimini "
        "adım adım açıklamaktadır."
    )
    story.append(Paragraph(intro_p, body_style))
    story.append(PageBreak())

    # ================= SECTION 1: SİSTEM MİMARİSİ VE KURULUM =================
    story.append(Paragraph("1. Sistem Mimarisi ve Kurulum", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    story.append(Paragraph(
        "RestivAdisyon.exe, React arayüzünü doğrudan kendi binary belleğinde barındırır. "
        "Harici bir internet sitesine bağımlı olmadan yerel olarak başlar ve yalnızca veri senkronizasyonu "
        "için güvenli Supabase bulut kanallarıyla haberleşir.",
        body_style
    ))
    story.append(Paragraph("<b>Temel Başlangıç Adımları:</b>", h2_style))
    story.append(Paragraph("• <b>RestivAdisyon.exe</b> dosyasını çift tıklayarak çalıştırın.", bullet_style))
    story.append(Paragraph("• Size iletilen işletme kullanıcı adı ve şifresiyle oturum açın.", bullet_style))
    story.append(Paragraph("• Program açıldığında arka planda <b>127.0.0.1:9100</b> yerel yazdırma köprüsü ve WebSocket dinleyicisi otomatik olarak devreye girer.", bullet_style))
    story.append(Paragraph("• Pencere kapatıldığında sistem arka planda çalışmaya devam ederek masalardan ve garsonlardan gelen siparişleri kesintisiz olarak termal yazıcıya döker.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= SECTION 2: TERMAL FİŞ YAZICISI & ESC/POS MOTORU =================
    story.append(Paragraph("2. Termal Fiş Yazıcısı & ESC/POS Ayarları", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    story.append(Paragraph(
        "Yazılım, Windows Spooler (winspool.drv) üzerinden doğrudan <b>RAW ESC/POS</b> komutları gönderir. "
        "Bu sayede herhangi bir yazdırma penceresi (Print Dialog) açılmadan sipariş anında doğrudan kağıda dökülür.",
        body_style
    ))

    printer_table_data = [
        [Paragraph("<b>Özellik</b>", body_style), Paragraph("<b>Teknik Detay & Standart</b>", body_style)],
        [Paragraph("Yazıcı Genişliği", body_style), Paragraph("80mm (Standart Geniş Fiş) veya 58mm (Dar Fiş)", body_style)],
        [Paragraph("Karakter Kod Sayfası", body_style), Paragraph("CP857 (Türkçe: ğ, ş, ı, ö, ü, ç, İ, Ğ, Ş tam destek)", body_style)],
        [Paragraph("Otomatik Kağıt Kesme", body_style), Paragraph("GS V 0 (\\x1d\\x56\\x00) donanımsal giyotin kesici komutu", body_style)],
        [Paragraph("Kayıp Sipariş Senkronizasyonu", body_style), Paragraph("sync_missed_orders ile son 15 dk içindeki basılmamış siparişler sırayla basılır", body_style)],
        [Paragraph("Sesli Bildirim", body_style), Paragraph("Yeni sipariş düştüğünde donanımsal çift tonlu Windows sesli uyarısı", body_style)]
    ]
    printer_table = Table(printer_table_data, colWidths=[160, 327])
    printer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(printer_table)
    story.append(Spacer(1, 10))

    # ================= SECTION 3: MASA & QR KOD YÖNETİMİ =================
    story.append(Paragraph("3. Masa & QR Kod Yönetimi ve Toplu PDF Baskı", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    story.append(Paragraph(
        "İşletmenizdeki tüm masaları kolayca tanımlayabilir ve müşterilerinizin masadan sipariş verebilmesi için "
        "toplu QR kod baskı dökümü alabilirsiniz:",
        body_style
    ))
    story.append(Paragraph("• <b>Masa Ekleme:</b> 'Masa & QR Kodlar' sekmesinden Masa 1, Masa 2, Teras 1 gibi masa adlarını tanımlayın.", bullet_style))
    story.append(Paragraph("• <b>Toplu PDF İndirme:</b> 'Tüm QR Kodları Yazdır / PDF İndir' butonuna basarak pleksi masa stantlarına veya akrilik aparatlara tam oturan baskı şablonunu indirin.", bullet_style))
    story.append(Paragraph("• <b>Oturum Sıfırlama:</b> Kasa hesabı kapattığında masadaki müşterinin telefonunda menü anında sıfırlanır ve teşekkür ekranı çıkar.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= SECTION 4: GARSON EL TERMİNALİ =================
    story.append(Paragraph("4. Garson El Terminali & Şifresiz Eşleme", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    story.append(Paragraph(
        "Pahalı el terminalleri satın almanıza gerek yoktur. Garsonlar kendi akıllı telefonlarını sisteme 30 saniyede bağlar:",
        body_style
    ))
    story.append(Paragraph("1. Garson kendi telefon kamerasından kasadaki <b>Garson Eşleme QR Kodu</b>nu okutur.", bullet_style))
    story.append(Paragraph("2. Adını soyadını yazıp <b>Yetki Talebi Gönder</b> butonuna basar.", bullet_style))
    story.append(Paragraph("3. Kasa panelinde 'Garsonlar & Terminaller' sekmesinde talep canlı belirir; <b>Yetkiyi Onayla</b> butonuna basılır.", bullet_style))
    story.append(Paragraph("4. Personelin telefonu anında sipariş terminaline dönüşür. Her girişte PIN sormaz; mutfak fişinde '[Garson: Personel Adı]' basılır.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= SECTION 5: SİPARİŞ & HESAP KAPATMA =================
    story.append(Paragraph("5. Canlı Sipariş Karşılama ve Hesap Kapatma (POS / Nakit)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    story.append(Paragraph(
        "Masalardan veya garsonlardan gelen siparişler 'Canlı Siparişler' paneline anında düşer:",
        body_style
    ))
    story.append(Paragraph("• <b>Sipariş Hazırlama:</b> 'Hazırla' butonuna basılarak sipariş mutfakta hazırlanma aşamasına alınır.", bullet_style))
    story.append(Paragraph("• <b>Hesabı Kapat:</b> Masa kalkarken 'Hesabı Kapat' butonuna basılır. Açılan pencerede sipariş detayları incelenir.", bullet_style))
    story.append(Paragraph("• <b>Ödeme Türü:</b> <b>POS / Kredi Kartı</b> veya <b>Nakit Ödeme</b> seçilir. Tutar ilgili ciro kalemine anında işlenir.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= SECTION 6: GÜN SONU & MUHASEBE =================
    story.append(Paragraph("6. Gün Sonu, Z Raporu ve Aylık Muhasebe Dökümü", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.75, color=PRIMARY, spaceAfter=8, spaceBefore=2))
    story.append(Paragraph(
        "Finansal durumunuzu anlık olarak izleyebilir ve resmi raporlar üretebilirsiniz:",
        body_style
    ))
    story.append(Paragraph("• <b>Ciro Takibi:</b> Günlük, haftalık ve aylık toplam satışlarınızı, Nakit ve POS dağılımını canlı grafiklerle izleyin.", bullet_style))
    story.append(Paragraph("• <b>Z Raporu:</b> Gün sonunda 'Z Raporu Yazdır' butonuna basarak kasa kapanış fişini termal yazıcıdan alın.", bullet_style))
    story.append(Paragraph("• <b>Aylık Muhasebe PDF Raporu:</b> Her ayın 1'i ile 5'i arasında geçen ayın tüm satış ve adisyon detaylarını içeren muhasebe PDF dökümünü 'Yardım & Bildirimler' sekmesinden tek tıkla indirin.", bullet_style))
    story.append(Spacer(1, 15))

    # Support Box
    support_box_data = [
        [Paragraph("<b>Teknik Destek & Canlı Yardım:</b>", body_style)],
        [Paragraph("• Panel içindeki 'Yardım & Bildirimler' sekmesinden soru veya sorun bildirebilirsiniz.", bullet_style)],
        [Paragraph("• Süper Admin ve RestivAdisyon Müşteri Hizmetleri taleplerinizi anında yanıtlar.", bullet_style)],
        [Paragraph("• Web/Tablet Yedek Giriş Adresi: <b>https://restivadisyon.org/admin</b>", bullet_style)]
    ]
    support_box = Table(support_box_data, colWidths=[487])
    support_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FFF7ED")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#FDBA74")),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(support_box)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Manual generated: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    target_pdf = os.path.join(out_dir, "RestivaAdisyon_Kilavuzu.pdf")
    build_pdf_manual(target_pdf)
