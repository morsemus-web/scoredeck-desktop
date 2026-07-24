"""Generate the ScoreDeck FIFA World Cup 2026 momentum / fundraising brief."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, HRFlowable, NextPageTemplate,
)
from reportlab.pdfgen import canvas

ACCENT = HexColor("#4b9fae")
ACCENT_DARK = HexColor("#2f6770")
URGENT = HexColor("#cc3333")   # World Cup countdown red
GOLD = HexColor("#b89849")     # Trophy gold
TEXT = HexColor("#1d2226")
DIM = HexColor("#5b6770")
RULE = HexColor("#d6dcdf")
BG_TINT = HexColor("#f1f6f7")
BG_URGENT = HexColor("#fbeded")

PAGE_W, PAGE_H = LETTER
MARGIN_X = 0.9 * inch
MARGIN_TOP = 1.0 * inch
MARGIN_BOTTOM = 0.95 * inch

OUTPUT = r"C:\Users\fitte\Downloads\Scoredeck Dev\ScoreDeck-FIFA2026-Brief.pdf"


# ---------- Styles ----------

def build_styles():
    base = getSampleStyleSheet()
    s = {}
    s["CoverTitle"] = ParagraphStyle(
        "CoverTitle", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=28, leading=34,
        textColor=TEXT, alignment=TA_LEFT, spaceAfter=12,
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
    s["EyebrowUrgent"] = ParagraphStyle(
        "EyebrowUrgent", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=URGENT, alignment=TA_LEFT, spaceAfter=10,
    )
    s["H1"] = ParagraphStyle(
        "H1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=18, leading=22,
        textColor=ACCENT_DARK, spaceBefore=8, spaceAfter=10,
    )
    s["H2"] = ParagraphStyle(
        "H2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=12.5, leading=16,
        textColor=TEXT, spaceBefore=10, spaceAfter=4,
    )
    s["Body"] = ParagraphStyle(
        "Body", parent=base["BodyText"],
        fontName="Times-Roman", fontSize=10.5, leading=15.5,
        textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=8,
    )
    s["Lead"] = ParagraphStyle(
        "Lead", parent=base["BodyText"],
        fontName="Times-Italic", fontSize=12, leading=17.5,
        textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=10,
    )
    s["Bullet"] = ParagraphStyle(
        "Bullet", parent=base["BodyText"],
        fontName="Times-Roman", fontSize=10.5, leading=15,
        textColor=TEXT, leftIndent=14, bulletIndent=2, spaceAfter=4,
    )
    s["StatNum"] = ParagraphStyle(
        "StatNum", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=22, leading=24,
        textColor=ACCENT_DARK, alignment=TA_LEFT,
    )
    s["StatNumUrgent"] = ParagraphStyle(
        "StatNumUrgent", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=22, leading=24,
        textColor=URGENT, alignment=TA_LEFT,
    )
    s["StatLabel"] = ParagraphStyle(
        "StatLabel", parent=base["Normal"],
        fontName="Helvetica", fontSize=8.5, leading=11,
        textColor=DIM, alignment=TA_LEFT,
    )
    s["Caption"] = ParagraphStyle(
        "Caption", parent=base["Normal"],
        fontName="Helvetica-Oblique", fontSize=9, leading=12,
        textColor=DIM, alignment=TA_LEFT,
    )
    s["BoxLabel"] = ParagraphStyle(
        "BoxLabel", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=10, leading=12,
        textColor=TEXT, alignment=TA_CENTER,
    )
    s["BoxSub"] = ParagraphStyle(
        "BoxSub", parent=base["Normal"],
        fontName="Helvetica", fontSize=8.5, leading=11,
        textColor=DIM, alignment=TA_CENTER,
    )
    return s


# ---------- Page chrome ----------

def cover_page(c, doc):
    # Top accent: red countdown band
    c.setFillColor(URGENT)
    c.rect(0, PAGE_H - 0.55 * inch, PAGE_W, 0.55 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN_X, PAGE_H - 0.36 * inch,
                 "6 DAYS TO KICK-OFF   |   FIFA WORLD CUP 2026")
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.36 * inch,
                      "INVESTMENT BRIEF")
    # Bottom rule
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.8)
    c.line(MARGIN_X, 0.8 * inch, PAGE_W - MARGIN_X, 0.8 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, 0.6 * inch,
                 "ScoreDeck Investment Brief   |   June 2026")
    c.drawRightString(PAGE_W - MARGIN_X, 0.6 * inch, "scoredeck.pro")


def content_page(c, doc):
    c.setStrokeColor(RULE)
    c.setLineWidth(0.4)
    c.line(MARGIN_X, PAGE_H - 0.65 * inch, PAGE_W - MARGIN_X, PAGE_H - 0.65 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, PAGE_H - 0.5 * inch,
                 "ScoreDeck Investment Brief")
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.5 * inch,
                      "FIFA World Cup 2026 Momentum")
    c.line(MARGIN_X, 0.7 * inch, PAGE_W - MARGIN_X, 0.7 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, 0.5 * inch, "(c) 2026 ScoreDeck   |   Confidential")
    c.drawRightString(PAGE_W - MARGIN_X, 0.5 * inch, f"Page {doc.page}")


# ---------- Helpers ----------

def hr(color=RULE, thickness=0.6, space_before=2, space_after=8):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceBefore=space_before, spaceAfter=space_after)


def bullets(items, styles):
    return [Paragraph(f"&bull;&nbsp;&nbsp;{x}", styles["Bullet"]) for x in items]


def stat_card(num, label, styles, urgent=False):
    num_style = styles["StatNumUrgent"] if urgent else styles["StatNum"]
    bg = BG_URGENT if urgent else BG_TINT
    border = URGENT if urgent else RULE
    t = Table(
        [[Paragraph(num, num_style)],
         [Paragraph(label, styles["StatLabel"])]],
        colWidths=[1.55 * inch],
        rowHeights=[0.4 * inch, 0.4 * inch],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.5, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def stats_row(stats, styles):
    cards = [stat_card(n, l, styles, urgent=u) for n, l, u in stats]
    row = Table([cards], colWidths=[1.7 * inch] * len(cards))
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return row


def kv_table(rows, styles, col_widths=None):
    data = [
        [Paragraph(f"<b>{k}</b>", styles["Body"]),
         Paragraph(v, styles["Body"])]
        for k, v in rows
    ]
    t = Table(data, colWidths=col_widths or [1.8 * inch, 4.4 * inch])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def callout(title, body, styles, color=ACCENT, fill=BG_TINT):
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


# ---------- Story ----------

def build_story(styles):
    s = []

    # ============ COVER ============
    s.append(Spacer(1, 1.4 * inch))
    s.append(Paragraph("INVESTMENT BRIEF &middot; CONFIDENTIAL",
                       styles["EyebrowUrgent"]))
    s.append(Paragraph(
        "ScoreDeck &times; FIFA World Cup 2026: "
        "Ad Manager, Corporate Deals, and a Six-Week Sprint to $1.6M",
        styles["CoverTitle"],
    ))
    s.append(HRFlowable(width=2.0 * inch, thickness=2, color=URGENT,
                        spaceBefore=4, spaceAfter=18))
    s.append(Paragraph("June 2026 &mdash; Six days to kick-off",
                       styles["CoverSub"]))
    s.append(Paragraph(
        "Raise: <b>$25,000 USD</b> at a <b>$100,000</b> valuation cap.",
        styles["CoverSub"],
    ))
    s.append(Paragraph(
        "What we sell advertisers: a projected reach of "
        "<b>200,000+ users</b> &mdash; free or paid &mdash; over the "
        "tournament window. Projections only; no delivery is guaranteed.",
        styles["CoverSub"],
    ))
    s.append(Spacer(1, 0.7 * inch))

    # Headline ask card on cover
    ask = Table([
        [Paragraph("THE ASK", styles["Eyebrow"]),
         Paragraph("THE WINDOW", styles["Eyebrow"]),
         Paragraph("THE TARGET", styles["Eyebrow"])],
        [Paragraph("<b>$25K</b>", styles["StatNum"]),
         Paragraph("<b>6 days</b>", styles["StatNumUrgent"]),
         Paragraph("<b>$1.6M</b>", styles["StatNum"])],
        [Paragraph("at $100K valuation cap", styles["StatLabel"]),
         Paragraph("until World Cup kick-off", styles["StatLabel"]),
         Paragraph("revenue by end of tournament", styles["StatLabel"])],
    ], colWidths=[2.2 * inch] * 3)
    ask.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_TINT),
        ("BOX", (0, 0), (-1, -1), 0.6, ACCENT),
        ("LINEAFTER", (0, 0), (-2, -1), 0.4, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    s.append(ask)
    s.append(Spacer(1, 0.4 * inch))
    s.append(Paragraph("Prepared for prospective investors and partners",
                       styles["CoverMeta"]))
    s.append(Paragraph("ScoreDeck Team &mdash; scoredeck.pro",
                       styles["CoverMeta"]))
    s.append(PageBreak())

    # ============ EXECUTIVE SUMMARY ============
    s.append(Paragraph("Executive Summary", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "ScoreDeck is the live, cross-platform desktop overlay for sports "
        "&mdash; native on Windows, macOS, and Linux &mdash; serving more "
        "than 8,000 active users with a combined social reach in excess of "
        "500,000. We are raising <b>$25,000 USD</b> at a <b>$100,000</b> "
        "valuation cap to ship an in-product ad manager, close a corporate "
        "advertising pipeline already in motion, and aggressively scale "
        "international marketing into the largest sports moment of the "
        "decade. Our internal projection for the tournament window is a "
        "reach of approximately <b>200,000 users</b> &mdash; free or paid, "
        "targetable by sport, market, and locale &mdash; which is the "
        "audience we intend to bring to corporate advertisers. The FIFA "
        "World Cup 2026 begins in six days; we project revenue to "
        "approach <b>$1.6 million</b> by its conclusion. All figures in "
        "this brief are projections and statements of intent; no "
        "outcomes are guaranteed.",
        styles["Lead"],
    ))

    s.append(Paragraph("The thesis", styles["H2"]))
    s.append(Paragraph(
        "Three forces are converging at the same point in time. First, the "
        "World Cup is the highest-attention sporting event on the calendar "
        "and the first held simultaneously across the United States, "
        "Canada, and Mexico &mdash; ScoreDeck's largest installed markets. "
        "Second, ScoreDeck already runs natively on every desktop "
        "operating system its target user touches, which removes the "
        "single biggest barrier to running an advertiser's creative at "
        "scale across the install base. Third, the in-product surface "
        "area &mdash; a 360 by 48 pixel "
        "always-visible widget &mdash; is uniquely suited to high-recall, "
        "low-intrusion brand placement at exactly the moment a fan is most "
        "engaged.",
        styles["Body"],
    ))
    s.append(Paragraph("What the capital unlocks", styles["H2"]))
    s.extend(bullets([
        "<b>Ad Manager v1:</b> a server-side, brand-safe inventory and pacing system that turns the widget and live-page surfaces into sellable advertising inventory by week three of the tournament.",
        "<b>Corporate advertising desk:</b> dedicated BD effort selling reach packages projected at 200,000+ users to telecoms, sportsbooks, beverage brands, e-commerce, and mobile-app advertisers.",
        "<b>International marketing sprint:</b> paid acquisition and creator partnerships across the highest-viewership World Cup markets &mdash; the growth lever behind our reach projections.",
        "<b>Momentum capture:</b> shipping every deliverable inside the World Cup window so traction compounds before the tournament closes.",
    ], styles))
    s.append(PageBreak())

    # ============ THE MOMENT ============
    s.append(Paragraph("Section 1", styles["Eyebrow"]))
    s.append(Paragraph("The Moment: Six Days to Kick-Off",
                       styles["H1"]))
    s.append(hr())

    s.append(callout(
        "Why this window will not repeat for four years",
        "The 2026 FIFA World Cup is the first 48-team tournament, the "
        "first triple-host edition, and the first held primarily in "
        "ScoreDeck's home time zones. Aggregate viewership is projected "
        "to exceed five billion. Six days from this brief, every fan "
        "on the planet starts checking scores at the same hour.",
        styles,
        color=URGENT, fill=BG_URGENT,
    ))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Why ScoreDeck wins this window", styles["H2"]))
    s.extend(bullets([
        "<b>Already live, already cross-platform:</b> the product ships today on Windows, macOS, and Linux. There is no \"if it gets built in time\" risk.",
        "<b>Installed in the work-day, not the after-hours:</b> matches in 2026 are scheduled across North-American working hours; the desktop is the surface that matters.",
        "<b>Five-locale coverage maps to the tournament:</b> English, Spanish, German, Hindi, and Arabic together cover the host countries plus the largest international fan diasporas.",
        "<b>Owned-and-operated content surfaces:</b> live cricket and live soccer pages on scoredeck.pro convert tournament-driven search traffic directly into installs and brand impressions.",
    ], styles))

    s.append(Paragraph("Countdown calendar", styles["H2"]))
    cal = [
        ("Today (T-6)", "Brief delivered to investors and partners."),
        ("T-5 to T-3", "Close the $25K round; launch ad-manager build sprint; sign first two advertiser contracts."),
        ("T-2", "Soft-launch in-product ad slots to a 20% user cohort."),
        ("T-0", "World Cup kick-off. Full ad-manager rollout to 100% of users; first paid ad campaign served live."),
        ("T+14", "Group-stage close. Mid-tournament advertiser renewals and second-wave campaign sign-ups."),
        ("T+44", "Tournament final. Revenue projection check &mdash; tracking toward $1.6M cumulative; reach projection check &mdash; tracking toward the 200K+ target."),
    ]
    data = [["Phase", "Action"]] + [
        [Paragraph(f"<b>{p}</b>", styles["Body"]),
         Paragraph(a, styles["Body"])]
        for p, a in cal
    ]
    t = Table(data, colWidths=[1.4 * inch, 4.9 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), URGENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    s.append(t)
    s.append(PageBreak())

    # ============ TRACTION ============
    s.append(Paragraph("Section 2", styles["Eyebrow"]))
    s.append(Paragraph("Current Traction", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "The product is live. The numbers below are not projections "
        "&mdash; they are the state of the business as of the date of "
        "this brief.",
        styles["Body"],
    ))
    s.append(Spacer(1, 0.1 * inch))
    s.append(stats_row([
        ("8,000+", "Active users", False),
        ("500K+", "Social media reach (monthly)", False),
        ("3", "Operating systems live", False),
    ], styles))
    s.append(Spacer(1, 0.1 * inch))
    s.append(stats_row([
        ("5", "Locales shipping", False),
        ("4", "Sports live", False),
        ("$5/mo", "Pro tier (live)", False),
    ], styles))
    s.append(Spacer(1, 0.2 * inch))
    s.append(Paragraph("What the numbers tell us", styles["H2"]))
    s.append(Paragraph(
        "ScoreDeck has already crossed the two hardest thresholds for a "
        "consumer product seeking ad revenue: it has a real, growing user "
        "base on its core surface, and it has a content funnel large "
        "enough to amplify what runs inside the product. Eight thousand "
        "active users is small in absolute terms, but it is highly "
        "concentrated &mdash; cricket, football, basketball, and Formula 1 "
        "fans who keep the widget visible for hours per day. The 500K+ "
        "monthly social reach across X, Instagram, YouTube Shorts, and "
        "Reddit is the audience that converts into installs at the moment "
        "a high-attention sports event begins.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # ============ AD MANAGER ============
    s.append(Paragraph("Section 3", styles["Eyebrow"]))
    s.append(Paragraph("The Ad Manager", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "An always-visible desktop surface is, in advertising terms, "
        "premium inventory. The job of the ad manager is to make that "
        "inventory sellable, measurable, and brand-safe without "
        "compromising the calm of the widget itself.",
        styles["Body"],
    ))

    s.append(Paragraph("What ships in v1", styles["H2"]))
    s.append(kv_table([
        ("Inventory model",
         "Two slot classes &mdash; a passive brand placement on the "
         "widget and a richer interstitial within the expanded analysis "
         "pane &mdash; both with hard frequency caps."),
        ("Projected reach",
         "Every advertiser contract is sold against an internal "
         "<b>projection of 200,000+ unique users</b> over the tournament "
         "window. Free-tier users are the default audience; Pro-tier "
         "inclusion is configurable per campaign. Projection only &mdash; "
         "delivery is not contractually guaranteed."),
        ("Targeting",
         "Sport, league, locale, country, device class, and tier "
         "(free / paid). No personal data leaves the client."),
        ("Brand safety",
         "Manual creative review with a whitelist of approved verticals "
         "(telecom, beverage, automotive, finance, sports apparel, "
         "e-commerce, regulated sportsbooks)."),
        ("Measurement",
         "Server-side impression, unique-reach, and engagement counting; "
         "weekly delivery reports tracking against the 200K reach "
         "projection."),
        ("Pacing &amp; pricing",
         "CPM, flat-fee reach packages, and match-day takeover SKUs. "
         "Direct-sold only in v1, no third-party DSP integration."),
        ("Tier policy",
         "Pro users see a reduced default ad load; advertisers can opt "
         "into the full free-plus-paid audience for tournament-scale "
         "buys at a higher rate card."),
    ], styles))

    s.append(Paragraph("Why the ad-manager surface is durable", styles["H2"]))
    s.extend(bullets([
        "<b>Attention without interruption:</b> the widget is already on screen; an ad slot is additive, not intrusive.",
        "<b>First-party data without PII:</b> we know what sport the user is watching this minute, and that is enough for the brands that pay highest.",
        "<b>Owned distribution:</b> no app-store revenue share. CPM lands at the company.",
        "<b>Cross-platform reach in one buy:</b> Windows, macOS, and Linux inventory is sold as a single unified package against the 200K+ reach projection.",
    ], styles))
    s.append(PageBreak())

    # ============ STREAMER CHANNEL ============
    s.append(Paragraph("Section 4", styles["Eyebrow"]))
    s.append(Paragraph("The Streamer Channel", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "ScoreDeck's overlay is purpose-built for an audience that "
        "happens to include thousands of Twitch and YouTube live "
        "streamers. The structure of international sport &mdash; a "
        "cricket match in India during US working hours, a Champions "
        "League final in Europe during the Brazilian afternoon, a "
        "Grand Prix while the United States sleeps &mdash; means "
        "streamers are perpetually broadcasting in one time zone while "
        "their viewers are tracking matches in another. ScoreDeck "
        "solves that for them.",
        styles["Body"],
    ))

    s.append(Paragraph("Why streamers add ScoreDeck to their stream", styles["H2"]))
    s.extend(bullets([
        "<b>It is already a window:</b> the widget is a 360 by 48 pixel always-on-top surface that OBS and Streamlabs can window-capture in one click. No new SDK, no plugin work for the streamer.",
        "<b>It serves their viewers, not their content:</b> the ticker runs in a corner; the stream's main content stays untouched. Viewers asking \"what's the score in the IPL?\" get an answer without the streamer breaking flow.",
        "<b>The time-zone math is the whole point:</b> matches happen at every hour of every day across the four supported sports. A streamer in any region is, by definition, broadcasting through a match somewhere.",
        "<b>It is brand-safe by construction:</b> no commentary, no editorial, no chat &mdash; just a score, a sport indicator, and a colour. Nothing in the widget can embarrass the streamer's sponsor.",
    ], styles))

    s.append(Paragraph("Activation plan", styles["H2"]))
    s.extend(bullets([
        "<b>Free creator licence:</b> Pro tier granted at no cost to streamers above a small audience threshold (initially 500 average concurrent viewers).",
        "<b>Optional \"Powered by ScoreDeck\" watermark:</b> small co-brand on the widget that links to scoredeck.pro &mdash; opt-in, never default.",
        "<b>Affiliate scheme:</b> per-creator code; users who upgrade to Lifetime through that code earn the streamer a revenue share.",
        "<b>Regional creator clusters:</b> ten to twenty streamers per priority market recruited inside the six-day window through direct outreach and a small partner-tier creator agency budget.",
        "<b>Live hub:</b> a curated scoredeck.pro/live page listing streamers currently using ScoreDeck, organised by sport and region.",
    ], styles))

    s.append(Paragraph("Why this multiplies the reach projection", styles["H2"]))
    s.append(Paragraph(
        "A tier-two streamer typically delivers between one thousand "
        "and ten thousand concurrent viewers per session. A handful of "
        "such streamers per priority region, broadcasting through the "
        "tournament's six weeks, compounds against the desktop install "
        "base rather than replacing it. The streamer channel does not "
        "replace direct user acquisition &mdash; it borrows the "
        "streamer's audience for the duration of the match and returns "
        "it improved.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # ============ CORPORATE DEALS ============
    s.append(Paragraph("Section 5", styles["Eyebrow"]))
    s.append(Paragraph("Corporate Advertising Deals", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "The ad manager is the mechanism. Corporate advertising deals "
        "are the revenue. What we sell to each advertiser is the same "
        "core unit: a paid ad campaign delivered across widget and "
        "expanded-pane inventory, against an internal projection of "
        "<b>200,000+ users</b> &mdash; free or paid &mdash; targetable "
        "by sport, market, and locale across the tournament window. We "
        "are not selling logo placement on a scoreboard, and we are not "
        "selling guarantees. We are selling measured impressions to a "
        "concentrated, in-the-moment audience, priced against our "
        "best-effort projection of how that audience will grow during "
        "the tournament.",
        styles["Body"],
    ))
    s.append(callout(
        "What every corporate contract looks like",
        "Standard contract = a flat-fee buy of an ad package, delivered "
        "across widget and expanded-pane inventory, priced against an "
        "internal projection of 200,000+ unique users reached over the "
        "tournament. Free-tier users are the default audience; Pro-tier "
        "inclusion is a configurable upgrade. Reporting is weekly. "
        "Reach figures are projections, not guarantees &mdash; "
        "advertisers buy intent and best effort, not floors.",
        styles, color=ACCENT_DARK, fill=BG_TINT,
    ))
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Pipeline by advertiser vertical", styles["H2"]))
    pipe = [
        ("Telecoms",
         "Brand-awareness and subscriber-acquisition ads geo-targeted "
         "to India, Mexico, Germany, and the United States."),
        ("Sportsbooks (regulated)",
         "Odds, sign-up, and key-moment ads inside the expanded "
         "analysis pane, geo-gated to legal jurisdictions."),
        ("Beverage and quick-service",
         "Match-day reach packages anchored to flagship fixtures "
         "(opening, group finals, knockouts, final)."),
        ("E-commerce and sports apparel",
         "Team- and driver-contextual creative; first-party sport "
         "targeting against shop-ready audiences."),
        ("Mobile-app installs (gaming, fintech, exchange)",
         "Performance-priced campaigns driving installs from a "
         "high-intent sports audience across the 200K+ reach pool."),
    ]
    data = [["Vertical", "What we sell them"]] + [
        [Paragraph(f"<b>{v}</b>", styles["Body"]),
         Paragraph(d, styles["Body"])]
        for v, d in pipe
    ]
    t = Table(data, colWidths=[2.0 * inch, 4.3 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    s.append(t)
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Deal sizing assumptions", styles["H2"]))
    s.append(Paragraph(
        "Tournament-window ad packages of comparable scale (200K+ "
        "unique-user reach over six weeks) transact between $80,000 and "
        "$300,000 USD in adjacent properties, depending on vertical, "
        "category exclusivity, and tier coverage. ScoreDeck's launch "
        "rate card reflects a roughly 30 percent discount against "
        "comparable inventory to secure logos and case studies that "
        "compound for the next cycle.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # ============ USE OF FUNDS ============
    s.append(Paragraph("Section 6", styles["Eyebrow"]))
    s.append(Paragraph("Use of Funds &mdash; $25,000", styles["H1"]))
    s.append(hr())

    funds = [
        ("$12,000", "48%", "International paid acquisition",
         "Meta, X, TikTok, and YouTube buys targeting tournament-related "
         "intent in the United States, Mexico, India, Brazil, Germany, "
         "and Saudi Arabia."),
        ("$5,000", "20%", "Creator and influencer partnerships",
         "Match-day clip drops with mid-tier football, cricket, and "
         "esports creators across YouTube Shorts, Instagram Reels, and X."),
        ("$4,000", "16%", "Ad-manager build sprint",
         "Contract engineering to ship inventory, pacing, and reporting "
         "in time for tournament kick-off."),
        ("$2,000", "8%", "Corporate-deals operations",
         "Pipeline tooling, contracting, and travel for the four "
         "highest-value deal conversations."),
        ("$2,000", "8%", "Reserve and operations",
         "Hosting, transactional email, payment processing, contingency."),
    ]
    data = [["Amount", "Share", "Allocation", "Detail"]] + [
        [Paragraph(f"<b>{a}</b>", styles["Body"]),
         Paragraph(sh, styles["Body"]),
         Paragraph(f"<b>{al}</b>", styles["Body"]),
         Paragraph(d, styles["Body"])]
        for a, sh, al, d in funds
    ]
    t = Table(data, colWidths=[1.0 * inch, 0.7 * inch, 1.8 * inch, 2.8 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    s.append(t)
    s.append(Spacer(1, 0.2 * inch))

    s.append(Paragraph("Beyond capital &mdash; operator partners",
                       styles["H2"]))
    s.append(Paragraph(
        "Capital alone does not close corporate ad deals inside a "
        "six-week tournament window. What closes them is relationships. "
        "We are therefore prioritising checks from people who already "
        "have those relationships and who are willing to take an active "
        "role in negotiating deals during the tournament. The most "
        "valuable participation we can take this week is a partner with "
        "an existing book in adtech, sports media, telecom marketing, "
        "regulated sportsbooks, or streamer talent management.",
        styles["Body"],
    ))
    s.append(Paragraph("Specifically we are looking for:",
                       styles["Body"]))
    s.extend(bullets([
        "<b>A BD lead with existing relationships</b> in adtech, sports sponsorship, or brand marketing &mdash; someone who can open the door on telecoms, beverage, and apparel conversations in week one.",
        "<b>An operator with streamer-platform connections</b> &mdash; access to Twitch and YouTube creator-agency rosters to seed the regional streamer clusters described in Section 4.",
        "<b>A founding-level deal closer</b> willing to own the corporate-advertising desk through the tournament and beyond, compensated through advisory equity or operating equity rather than salary.",
        "<b>Regional partners</b> on the ground in any priority market &mdash; United States, Mexico, India, Brazil, Germany, or Saudi Arabia &mdash; with local advertiser and creator networks.",
    ], styles))
    s.append(Paragraph(
        "Participation can be structured as advisory equity, BD "
        "partnership, or co-founder-level operating equity for the "
        "right people. Introductions to potential advertisers from "
        "existing investors are credited toward future allocation.",
        styles["Body"],
    ))
    s.append(Spacer(1, 0.1 * inch))

    s.append(callout(
        "Terms",
        "<b>$25,000 USD</b> for a <b>25% equity</b> stake at a "
        "<b>$100,000</b> post-money valuation cap, or equivalent SAFE / "
        "convertible structure at investor preference. Round closes "
        "within the six-day pre-tournament window. All figures in this "
        "brief are projections and statements of intent; no revenue, "
        "reach, or deal outcomes are guaranteed.",
        styles, color=ACCENT_DARK, fill=BG_TINT,
    ))
    s.append(PageBreak())

    # ============ PROJECTION ============
    s.append(Paragraph("Section 7", styles["Eyebrow"]))
    s.append(Paragraph("Projection: Path to $1.6M", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "The projection below is built bottom-up from inventory, deal "
        "count, and subscription conversion &mdash; not from a "
        "growth multiple. Every line is something we can ship, sell, "
        "or invoice inside the tournament window.",
        styles["Body"],
    ))
    s.append(Spacer(1, 0.1 * inch))

    proj = [
        ("Corporate ad contracts",
         "6 advertisers &times; $180K avg, each priced against the "
         "200K+ reach projection",
         "$1,080,000"),
        ("Run-of-network ad inventory",
         "CPM across widget + expanded pane outside contracted "
         "campaigns",
         "$220,000"),
        ("Pro and Lifetime subscriptions",
         "World Cup conversion spike on existing 8K base plus "
         "new installs",
         "$200,000"),
        ("Branded social content",
         "Paid match-day clips across the 500K+ funnel",
         "$100,000"),
        ("Total revenue (tournament window)", "", "<b>$1,600,000</b>"),
    ]
    data = [["Line", "Mechanism", "Projected revenue"]] + [
        [Paragraph(line, styles["Body"]),
         Paragraph(mech, styles["Body"]),
         Paragraph(rev, styles["Body"])]
        for line, mech, rev in proj
    ]
    t = Table(data, colWidths=[2.0 * inch, 2.7 * inch, 1.6 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("BACKGROUND", (0, -1), (-1, -1), BG_TINT),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEABOVE", (0, -1), (-1, -1), 1.0, ACCENT),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    s.append(t)
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Sensitivity", styles["H2"]))
    s.extend(bullets([
        "<b>Downside ($800K):</b> only three advertiser contracts close; run-of-network inventory yields 60% of projection; subscription conversion at long-term baseline. Still an 8x return on round.",
        "<b>Base ($1.6M):</b> the table above. Six advertiser contracts priced against the 200K reach projection, planned ad CPM, mid-tournament subscription spike.",
        "<b>Upside ($2.4M):</b> eight advertiser contracts, premium-rate final-stage match-day takeovers, and reach over-delivery against the projection.",
    ], styles))
    s.append(PageBreak())

    # ============ INTERNATIONAL MARKETING ============
    s.append(Paragraph("Section 8", styles["Eyebrow"]))
    s.append(Paragraph("International Marketing &amp; Momentum",
                       styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "The 2026 tournament is the first held simultaneously in three "
        "of ScoreDeck's most addressable markets. The international "
        "marketing plan is engineered to ride that geography rather "
        "than fight it.",
        styles["Body"],
    ))

    s.append(Paragraph("Priority markets", styles["H2"]))
    markets = [
        ("United States", "Host country; ScoreDeck's largest installed base. English creative."),
        ("Mexico", "Host country; massive football audience. Spanish creative."),
        ("Canada", "Host country; bilingual EN/FR creative, free press cycle."),
        ("Brazil", "Highest engagement rates in test campaigns; Portuguese localisation next on the roadmap."),
        ("Germany", "Strong existing locale; high CPM ad market."),
        ("India", "Cricket-led acquisition extends naturally into football during tournament; Hindi creative."),
        ("Saudi Arabia / UAE", "Arabic locale already live; rapidly growing football market."),
        ("United Kingdom", "Premier-league overflow audience; English creative."),
    ]
    data = [["Market", "Rationale"]] + [
        [Paragraph(f"<b>{m}</b>", styles["Body"]),
         Paragraph(r, styles["Body"])]
        for m, r in markets
    ]
    t = Table(data, colWidths=[1.6 * inch, 4.7 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    s.append(t)
    s.append(Spacer(1, 0.15 * inch))

    s.append(Paragraph("Channel mix", styles["H2"]))
    s.extend(bullets([
        "<b>Paid social:</b> Meta and TikTok prospecting against football-intent audiences in each priority market.",
        "<b>YouTube Shorts:</b> seeded clips on the day of each high-leverage match; conversion via on-clip QR to a country-specific landing page.",
        "<b>Creator partnerships:</b> mid-tier creators &mdash; not the most expensive tier &mdash; because reach efficiency peaks just below the celebrity bracket.",
        "<b>Owned content:</b> live cricket and live soccer pages reused as ad landing pages; same code path as the desktop widget, no duplicated build work.",
        "<b>PR and earned:</b> the cross-platform Linux launch in particular gives the developer-focused tech press a non-sports angle into the story.",
    ], styles))
    s.append(PageBreak())

    # ============ CLOSE ============
    s.append(Paragraph("Section 9", styles["Eyebrow"]))
    s.append(Paragraph("Why Now, Why You", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Most consumer products have to invent a moment to launch into. "
        "ScoreDeck does not. The largest sporting event in four years "
        "begins in six days, in our home markets, on the platforms we "
        "already ship to, and to a user base we have already built.",
        styles["Lead"],
    ))
    s.append(Paragraph(
        "Twenty-five thousand dollars at a hundred-thousand-dollar "
        "valuation cap is a deliberately small, deliberately fast round. "
        "It is sized to close inside the window we have, not the window "
        "we wish we had. The ad manager ships during the group stage, "
        "the corporate deals close during the round of sixteen, and the "
        "international marketing spend compounds with each match-day "
        "viral cycle.",
        styles["Body"],
    ))
    s.append(Paragraph(
        "We are not selling exposure to a maybe. We are selling "
        "participation in a six-week sprint where every commitment has "
        "a delivery date inside the tournament. Investors who come in "
        "this week receive their preferred stake at the floor "
        "valuation, monthly written updates through the final, and "
        "first refusal on the next round.",
        styles["Body"],
    ))

    s.append(Spacer(1, 0.2 * inch))
    s.append(Paragraph("Next steps", styles["H2"]))
    s.extend(bullets([
        "Reply to this brief to receive the data room and a fifteen-minute walk-through of the live product.",
        "Term sheet and SAFE template available on request; round closes within the next six days.",
        "All corporate-deal introductions are warmly received and counted toward investor allocation.",
    ], styles))

    s.append(Spacer(1, 0.35 * inch))
    s.append(HRFlowable(width="100%", thickness=1, color=ACCENT,
                        spaceBefore=0, spaceAfter=10))
    s.append(Paragraph(
        "<b>ScoreDeck</b> &mdash; Live on Windows, macOS, and Linux. "
        "<font color='#2f6770'>scoredeck.pro</font> &mdash; "
        "Confidential. For prospective investors and partners only.",
        styles["Caption"],
    ))

    return s


# ---------- Document assembly ----------

def build():
    styles = build_styles()
    doc = BaseDocTemplate(
        OUTPUT,
        pagesize=LETTER,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title="ScoreDeck x FIFA World Cup 2026 - Investment Brief",
        author="ScoreDeck Team",
        subject="Investment brief: ad manager, corporate deals, and six-week sprint to $1.6M",
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
