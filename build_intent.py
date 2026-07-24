"""Generate the ScoreDeck Statement of Intent PDF."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, HRFlowable, NextPageTemplate,
)
from reportlab.pdfgen import canvas

ACCENT = HexColor("#4b9fae")
ACCENT_DARK = HexColor("#2f6770")
TEXT = HexColor("#1d2226")
DIM = HexColor("#5b6770")
RULE = HexColor("#d6dcdf")
BG_TINT = HexColor("#f1f6f7")

PAGE_W, PAGE_H = LETTER
MARGIN_X = 0.9 * inch
MARGIN_TOP = 1.0 * inch
MARGIN_BOTTOM = 0.95 * inch

OUTPUT = r"C:\Users\fitte\Downloads\Scoredeck Dev\ScoreDeck-Intent.pdf"


def build_styles():
    base = getSampleStyleSheet()
    s = {}
    s["CoverEyebrow"] = ParagraphStyle(
        "CoverEyebrow", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=ACCENT, alignment=TA_LEFT, spaceAfter=12,
    )
    s["CoverTitle"] = ParagraphStyle(
        "CoverTitle", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=34, leading=40,
        textColor=TEXT, alignment=TA_LEFT, spaceAfter=14,
    )
    s["CoverSub"] = ParagraphStyle(
        "CoverSub", parent=base["Normal"],
        fontName="Helvetica", fontSize=13, leading=18,
        textColor=DIM, alignment=TA_LEFT, spaceAfter=8,
    )
    s["CoverMeta"] = ParagraphStyle(
        "CoverMeta", parent=base["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=DIM, alignment=TA_LEFT,
    )
    s["Eyebrow"] = ParagraphStyle(
        "Eyebrow", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=8.5, leading=11,
        textColor=ACCENT, spaceAfter=4,
    )
    s["H1"] = ParagraphStyle(
        "H1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=20, leading=24,
        textColor=ACCENT_DARK, spaceBefore=8, spaceAfter=10,
    )
    s["H2"] = ParagraphStyle(
        "H2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=12.5, leading=16,
        textColor=TEXT, spaceBefore=10, spaceAfter=4,
    )
    s["Body"] = ParagraphStyle(
        "Body", parent=base["BodyText"],
        fontName="Times-Roman", fontSize=11, leading=16,
        textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=9,
    )
    s["Lead"] = ParagraphStyle(
        "Lead", parent=base["BodyText"],
        fontName="Times-Italic", fontSize=12.5, leading=18,
        textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=12,
    )
    s["Bullet"] = ParagraphStyle(
        "Bullet", parent=base["BodyText"],
        fontName="Times-Roman", fontSize=11, leading=15.5,
        textColor=TEXT, leftIndent=14, bulletIndent=2, spaceAfter=5,
    )
    s["Caption"] = ParagraphStyle(
        "Caption", parent=base["Normal"],
        fontName="Helvetica-Oblique", fontSize=9, leading=12,
        textColor=DIM, alignment=TA_LEFT,
    )
    s["Disclaimer"] = ParagraphStyle(
        "Disclaimer", parent=base["Normal"],
        fontName="Helvetica", fontSize=9, leading=13,
        textColor=DIM, alignment=TA_JUSTIFY, spaceAfter=6,
    )
    s["Sign"] = ParagraphStyle(
        "Sign", parent=base["Normal"],
        fontName="Helvetica", fontSize=10.5, leading=14,
        textColor=TEXT, alignment=TA_LEFT, spaceAfter=4,
    )
    return s


def cover_page(c, doc):
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 0.55 * inch, PAGE_W, 0.55 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN_X, PAGE_H - 0.36 * inch, "SCOREDECK")
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.36 * inch,
                      "STATEMENT OF INTENT")
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.8)
    c.line(MARGIN_X, 0.8 * inch, PAGE_W - MARGIN_X, 0.8 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, 0.6 * inch,
                 "ScoreDeck Statement of Intent   |   June 2026")
    c.drawRightString(PAGE_W - MARGIN_X, 0.6 * inch, "scoredeck.pro")


def content_page(c, doc):
    c.setStrokeColor(RULE)
    c.setLineWidth(0.4)
    c.line(MARGIN_X, PAGE_H - 0.65 * inch, PAGE_W - MARGIN_X, PAGE_H - 0.65 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, PAGE_H - 0.5 * inch,
                 "ScoreDeck Statement of Intent")
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.5 * inch, "June 2026")
    c.line(MARGIN_X, 0.7 * inch, PAGE_W - MARGIN_X, 0.7 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, 0.5 * inch,
                 "(c) 2026 ScoreDeck   |   Non-binding")
    c.drawRightString(PAGE_W - MARGIN_X, 0.5 * inch, f"Page {doc.page}")


def hr(color=RULE, thickness=0.6, space_before=2, space_after=10):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceBefore=space_before, spaceAfter=space_after)


def bullets(items, styles):
    return [Paragraph(f"&bull;&nbsp;&nbsp;{x}", styles["Bullet"]) for x in items]


def callout(title, body, styles, color=ACCENT_DARK, fill=BG_TINT):
    title_style = ParagraphStyle(
        "callTitle", fontName="Helvetica-Bold", fontSize=11, leading=14,
        textColor=color, spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "callBody", fontName="Times-Roman", fontSize=10.5, leading=15,
        textColor=TEXT, alignment=TA_LEFT,
    )
    inner = Table(
        [[Paragraph(title, title_style)],
         [Paragraph(body, body_style)]],
        colWidths=[6.2 * inch],
    )
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return inner


def build_story(styles):
    s = []

    # ============ COVER ============
    s.append(Spacer(1, 1.6 * inch))
    s.append(Paragraph(
        "NON-BINDING &middot; FOR DISCUSSION ONLY",
        styles["CoverEyebrow"],
    ))
    s.append(Paragraph("ScoreDeck", styles["CoverTitle"]))
    s.append(Paragraph("Statement of Intent", ParagraphStyle(
        "subT", fontName="Helvetica", fontSize=22, leading=28,
        textColor=DIM, alignment=TA_LEFT, spaceAfter=10,
    )))
    s.append(HRFlowable(width=2.0 * inch, thickness=2, color=ACCENT,
                        spaceBefore=4, spaceAfter=22))
    s.append(Paragraph(
        "A short declaration of what ScoreDeck intends to do over "
        "the FIFA World Cup 2026 window, what we are inviting "
        "partners and investors to participate in, and what this "
        "document does and does not represent.",
        styles["CoverSub"],
    ))
    s.append(Spacer(1, 1.4 * inch))
    s.append(Paragraph("Issued by", styles["CoverMeta"]))
    s.append(Paragraph("<b>ScoreDeck Team</b>", styles["CoverMeta"]))
    s.append(Spacer(1, 0.08 * inch))
    s.append(Paragraph("scoredeck.pro &middot; June 2026",
                       styles["CoverMeta"]))
    s.append(PageBreak())

    # ============ PAGE 2: OUR INTENT ============
    s.append(Paragraph("Part 1", styles["Eyebrow"]))
    s.append(Paragraph("Our Intent", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "ScoreDeck intends to use the FIFA World Cup 2026 window to "
        "convert a live, cross-platform desktop product into a "
        "self-sustaining advertising business.",
        styles["Lead"],
    ))

    s.append(Paragraph("What we are", styles["H2"]))
    s.append(Paragraph(
        "An always-on desktop overlay for live sports, native on "
        "Windows, macOS, and Linux, currently serving more than 8,000 "
        "active users across five locales with a combined social reach "
        "in excess of 500,000. Four sports are live today: cricket, "
        "football, basketball, and Formula 1.",
        styles["Body"],
    ))

    s.append(Paragraph("What we intend to do over the next six weeks",
                       styles["H2"]))
    s.extend(bullets([
        "<b>Ship an in-product ad manager</b> capable of serving paid advertising across the widget and expanded-pane surfaces, with tier-aware targeting and weekly reporting.",
        "<b>Open a corporate advertising desk</b> selling reach packages projected at 200,000+ users &mdash; free or paid, targetable by sport, market, and locale &mdash; to telecoms, regulated sportsbooks, beverage and quick-service brands, e-commerce, and mobile-app advertisers.",
        "<b>Activate a streamer channel</b> on Twitch and YouTube so streamers in one time zone can display live match data from another, multiplying reach across regional creator clusters.",
        "<b>Run an international marketing sprint</b> across the host countries (United States, Canada, Mexico) and the highest-viewership international markets (Brazil, Germany, India, Saudi Arabia, United Kingdom).",
        "<b>Raise $25,000 USD</b> at a $100,000 valuation cap to fund the above, prioritising partners with industry relationships over passive capital.",
    ], styles))

    s.append(Paragraph("What we project as a result", styles["H2"]))
    s.append(Paragraph(
        "Our internal projection &mdash; built bottom-up from advertiser "
        "contracts, run-of-network inventory, subscription conversion, "
        "and paid social content &mdash; targets revenue approaching "
        "<b>$1.6 million USD</b> by the conclusion of the tournament. "
        "These are projections and statements of intent; no outcomes "
        "are guaranteed.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # ============ PAGE 3: THE INVITATION ============
    s.append(Paragraph("Part 2", styles["Eyebrow"]))
    s.append(Paragraph("The Invitation", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "ScoreDeck is open to four distinct forms of participation "
        "over the next six days. Any combination of them is welcome.",
        styles["Body"],
    ))

    s.append(Paragraph("1. Investment", styles["H2"]))
    s.append(Paragraph(
        "$25,000 USD at a $100,000 post-money valuation cap (or "
        "equivalent SAFE / convertible at investor preference). Round "
        "is intended to close within the six-day pre-tournament "
        "window. Investors at this stage receive monthly written "
        "updates through the final and first refusal on the next "
        "round.",
        styles["Body"],
    ))

    s.append(Paragraph("2. Operator and BD partnership", styles["H2"]))
    s.append(Paragraph(
        "We are actively seeking participants who can negotiate deals, "
        "not just write cheques. Adtech relationships, sports-sponsorship "
        "rolodexes, telecom or beverage marketing contacts, streamer "
        "talent-agency access, or regional advertiser networks in any "
        "priority market. Participation can be structured as advisory "
        "equity, BD partnership, or co-founder-level operating equity.",
        styles["Body"],
    ))

    s.append(Paragraph("3. Streamer and creator partnership", styles["H2"]))
    s.append(Paragraph(
        "Twitch and YouTube streamers covering football, cricket, "
        "basketball, or Formula 1 are invited to add the ScoreDeck "
        "overlay to their stream. Free creator licences, an opt-in "
        "co-brand watermark, and per-creator affiliate revenue share "
        "on Lifetime conversions are available immediately.",
        styles["Body"],
    ))

    s.append(Paragraph("4. Advertiser conversation", styles["H2"]))
    s.append(Paragraph(
        "Telecoms, regulated sportsbooks, beverage and quick-service "
        "brands, e-commerce and apparel retailers, and mobile-app "
        "advertisers with World Cup activation budgets are invited to "
        "open a conversation with the corporate advertising desk. Rate "
        "card and projection sheet available on request.",
        styles["Body"],
    ))

    s.append(Spacer(1, 0.15 * inch))
    s.append(callout(
        "How to act on this document",
        "Reply to the address on the back cover, or visit "
        "<font color='#2f6770'>scoredeck.pro</font>. Brief data room, "
        "live product walk-through, term sheet, rate card, and "
        "creator pack all available on request. Round and tournament "
        "window both close inside the next six weeks.",
        styles,
    ))
    s.append(PageBreak())

    # ============ PAGE 4: WHAT THIS IS NOT ============
    s.append(Paragraph("Part 3", styles["Eyebrow"]))
    s.append(Paragraph("What this Document Is Not", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "It is important that the reader, the prospective investor, "
        "the prospective partner, and the prospective advertiser all "
        "understand precisely what this document represents and what "
        "it does not.",
        styles["Body"],
    ))

    s.append(Paragraph("This document is a statement of intent",
                       styles["H2"]))
    s.append(Paragraph(
        "It declares what ScoreDeck intends to do over a defined "
        "window, the projections we are operating against, and the "
        "forms of participation we are inviting from external "
        "partners. It is intended to align expectations before "
        "deeper conversations.",
        styles["Body"],
    ))

    s.append(Paragraph("This document is not a guarantee",
                       styles["H2"]))
    s.append(Paragraph(
        "Every reach figure, every revenue projection, every roadmap "
        "milestone, and every deal-pipeline reference in this "
        "document is forward-looking. Outcomes depend on market "
        "conditions, third-party decisions, execution velocity, and "
        "factors outside ScoreDeck's control. No specific reach, "
        "revenue, or deal outcome is promised, warranted, or "
        "guaranteed, expressly or by implication.",
        styles["Body"],
    ))

    s.append(Paragraph("This document is not an offer of securities",
                       styles["H2"]))
    s.append(Paragraph(
        "Nothing in this document constitutes an offer, solicitation, "
        "or recommendation to buy or sell any security or other "
        "financial instrument. Any actual investment in ScoreDeck "
        "will be made under a separate, executed instrument (SAFE, "
        "convertible note, or equity subscription agreement) with "
        "full disclosure and counsel review.",
        styles["Body"],
    ))

    s.append(Paragraph("This document is non-binding",
                       styles["H2"]))
    s.append(Paragraph(
        "Nothing herein creates a legal obligation on ScoreDeck, on "
        "the reader, or on any third party. Discussions arising from "
        "this document are conducted on a best-effort, good-faith "
        "basis and may be terminated by any party at any time.",
        styles["Body"],
    ))

    s.append(Spacer(1, 0.2 * inch))
    s.append(Paragraph("Issued by", styles["H2"]))
    s.append(Paragraph("<b>ScoreDeck Team</b>", styles["Sign"]))
    s.append(Paragraph("scoredeck.pro", styles["Sign"]))
    s.append(Paragraph("June 2026 &mdash; six days to FIFA World Cup 2026 kick-off",
                       styles["Sign"]))

    s.append(Spacer(1, 0.3 * inch))
    s.append(HRFlowable(width="100%", thickness=1, color=ACCENT,
                        spaceBefore=0, spaceAfter=10))
    s.append(Paragraph(
        "Confidential. For the named recipient only. "
        "Reproduction or redistribution requires prior written consent "
        "from ScoreDeck.",
        styles["Disclaimer"],
    ))

    return s


def build():
    styles = build_styles()
    doc = BaseDocTemplate(
        OUTPUT,
        pagesize=LETTER,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title="ScoreDeck - Statement of Intent",
        author="ScoreDeck Team",
        subject="Non-binding statement of intent for FIFA World Cup 2026 window",
    )
    cover_frame = Frame(
        MARGIN_X, MARGIN_BOTTOM,
        PAGE_W - 2 * MARGIN_X, PAGE_H - MARGIN_TOP - MARGIN_BOTTOM,
        id="cover", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    body_frame = Frame(
        MARGIN_X, MARGIN_BOTTOM,
        PAGE_W - 2 * MARGIN_X, PAGE_H - MARGIN_TOP - MARGIN_BOTTOM,
        id="body", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_page),
        PageTemplate(id="body", frames=[body_frame], onPage=content_page),
    ])
    story = build_story(styles)
    final_story = [NextPageTemplate("body")] + story
    doc.build(final_story)
    print(f"Wrote: {OUTPUT}")


if __name__ == "__main__":
    build()
