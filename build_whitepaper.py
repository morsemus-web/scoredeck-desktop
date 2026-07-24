"""Generate the ScoreDeck whitepaper PDF."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, HRFlowable,
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

OUTPUT = r"C:\Users\fitte\Downloads\Scoredeck Dev\ScoreDeck-Whitepaper.pdf"


# ---------- Styles ----------

def build_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["CoverTitle"] = ParagraphStyle(
        "CoverTitle", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=30, leading=36,
        textColor=TEXT, alignment=TA_LEFT, spaceAfter=14,
    )
    styles["CoverSub"] = ParagraphStyle(
        "CoverSub", parent=base["Normal"],
        fontName="Helvetica", fontSize=13, leading=18,
        textColor=DIM, alignment=TA_LEFT, spaceAfter=8,
    )
    styles["CoverMeta"] = ParagraphStyle(
        "CoverMeta", parent=base["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=DIM, alignment=TA_LEFT,
    )
    styles["CoverEyebrow"] = ParagraphStyle(
        "CoverEyebrow", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=ACCENT, alignment=TA_LEFT, spaceAfter=10,
    )
    styles["H1"] = ParagraphStyle(
        "H1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=18, leading=22,
        textColor=ACCENT_DARK, spaceBefore=10, spaceAfter=10,
    )
    styles["H2"] = ParagraphStyle(
        "H2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=12.5, leading=16,
        textColor=TEXT, spaceBefore=10, spaceAfter=4,
    )
    styles["Eyebrow"] = ParagraphStyle(
        "Eyebrow", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=8.5, leading=11,
        textColor=ACCENT, spaceAfter=4,
    )
    styles["Body"] = ParagraphStyle(
        "Body", parent=base["BodyText"],
        fontName="Times-Roman", fontSize=10.5, leading=15.5,
        textColor=TEXT, alignment=TA_JUSTIFY, spaceAfter=8,
    )
    styles["Bullet"] = ParagraphStyle(
        "Bullet", parent=base["BodyText"],
        fontName="Times-Roman", fontSize=10.5, leading=15,
        textColor=TEXT, leftIndent=14, bulletIndent=2, spaceAfter=4,
    )
    styles["Abstract"] = ParagraphStyle(
        "Abstract", parent=base["BodyText"],
        fontName="Times-Italic", fontSize=11, leading=16.5,
        textColor=TEXT, alignment=TA_JUSTIFY, leftIndent=10, rightIndent=10,
        spaceAfter=8,
    )
    styles["Caption"] = ParagraphStyle(
        "Caption", parent=base["Normal"],
        fontName="Helvetica-Oblique", fontSize=9, leading=12,
        textColor=DIM, alignment=TA_LEFT,
    )
    styles["StatNum"] = ParagraphStyle(
        "StatNum", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=22, leading=24,
        textColor=ACCENT_DARK, alignment=TA_LEFT,
    )
    styles["StatLabel"] = ParagraphStyle(
        "StatLabel", parent=base["Normal"],
        fontName="Helvetica", fontSize=8.5, leading=11,
        textColor=DIM, alignment=TA_LEFT,
    )
    return styles


# ---------- Page chrome ----------

def cover_page(c: canvas.Canvas, doc):
    # Top accent block
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 0.55 * inch, PAGE_W, 0.55 * inch, stroke=0, fill=1)
    # Bottom rule
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.8)
    c.line(MARGIN_X, 0.8 * inch, PAGE_W - MARGIN_X, 0.8 * inch)
    # Footer text
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, 0.6 * inch, "ScoreDeck Whitepaper v1.0   |   June 2026")
    c.drawRightString(PAGE_W - MARGIN_X, 0.6 * inch, "scoredeck.pro")


def content_page(c: canvas.Canvas, doc):
    # Header
    c.setStrokeColor(RULE)
    c.setLineWidth(0.4)
    c.line(MARGIN_X, PAGE_H - 0.65 * inch, PAGE_W - MARGIN_X, PAGE_H - 0.65 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, PAGE_H - 0.5 * inch, "ScoreDeck Whitepaper v1.0")
    c.drawRightString(
        PAGE_W - MARGIN_X, PAGE_H - 0.5 * inch,
        "A Desktop-Native Approach to Ambient Live Sports Awareness",
    )
    # Footer
    c.line(MARGIN_X, 0.7 * inch, PAGE_W - MARGIN_X, 0.7 * inch)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DIM)
    c.drawString(MARGIN_X, 0.5 * inch, "(c) 2026 ScoreDeck")
    c.drawRightString(PAGE_W - MARGIN_X, 0.5 * inch, f"Page {doc.page}")


# ---------- Helpers ----------

def hr(color=RULE, thickness=0.6, space_before=2, space_after=8):
    return HRFlowable(
        width="100%", thickness=thickness, color=color,
        spaceBefore=space_before, spaceAfter=space_after,
    )


def bullets(items, styles):
    flows = []
    for item in items:
        flows.append(Paragraph(f"&bull;&nbsp;&nbsp;{item}", styles["Bullet"]))
    return flows


def stat_card(num, label, styles):
    t = Table(
        [[Paragraph(num, styles["StatNum"])],
         [Paragraph(label, styles["StatLabel"])]],
        colWidths=[1.55 * inch],
        rowHeights=[0.4 * inch, 0.35 * inch],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_TINT),
        ("BOX", (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def stats_row(stats, styles):
    cards = [stat_card(num, label, styles) for num, label in stats]
    row = Table([cards], colWidths=[1.7 * inch] * len(cards))
    row.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return row


def kv_table(rows, styles, col_widths=None):
    data = []
    for k, v in rows:
        data.append([
            Paragraph(f"<b>{k}</b>", styles["Body"]),
            Paragraph(v, styles["Body"]),
        ])
    t = Table(data, colWidths=col_widths or [1.6 * inch, 4.6 * inch])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


# ---------- Build the story ----------

def build_story(styles):
    s = []

    # =========================================================
    # COVER
    # =========================================================
    s.append(Spacer(1, 1.8 * inch))
    s.append(Paragraph("WHITEPAPER &middot; v1.0", styles["CoverEyebrow"]))
    s.append(Paragraph(
        "ScoreDeck: A Desktop-Native Approach to "
        "Ambient Live Sports Awareness",
        styles["CoverTitle"],
    ))
    s.append(HRFlowable(width=2.0 * inch, thickness=2, color=ACCENT,
                        spaceBefore=4, spaceAfter=18))
    s.append(Paragraph(
        "Technical &amp; Product Whitepaper",
        styles["CoverSub"],
    ))
    s.append(Paragraph("June 2026", styles["CoverSub"]))
    s.append(Spacer(1, 1.4 * inch))
    s.append(Paragraph("Published by", styles["CoverMeta"]))
    s.append(Paragraph(
        "<b>ScoreDeck Team</b>", styles["CoverMeta"],
    ))
    s.append(Spacer(1, 0.1 * inch))
    s.append(Paragraph("scoredeck.pro", styles["CoverMeta"]))
    s.append(PageBreak())

    # =========================================================
    # ABSTRACT + TOC
    # =========================================================
    s.append(Paragraph("Abstract", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Sports fans who also hold knowledge-work jobs lose roughly fifteen "
        "minutes of focus per context switch (Mark, Gudith, &amp; Klocke, 2008). "
        "A typical match-day involves twenty or more tab switches between "
        "ESPN, Cricbuzz, F1 Live, and the NBA app &mdash; and yet, by our "
        "telemetry, seventy-three percent of decisive moments still happen "
        "between glances. ScoreDeck is a cross-platform, always-on desktop "
        "overlay &mdash; available natively on Windows, macOS, and Linux "
        "&mdash; that replaces app-switching with a 360 &times; 48 pixel "
        "taskbar widget delivering live scores, key events, and "
        "multi-language commentary for Cricket, Football, Basketball, and "
        "Formula 1. The product is live as of June 2026, serving more than "
        "8,000 active users across five locales with a combined social "
        "reach in excess of 500,000. This whitepaper details the problem "
        "space, product design, data and latency model, privacy posture, "
        "current traction, and forward roadmap.",
        styles["Abstract"],
    ))
    s.append(Spacer(1, 0.2 * inch))

    s.append(Paragraph("Contents", styles["H1"]))
    s.append(hr())
    toc = [
        ("1.", "Introduction &amp; Problem Space", "3"),
        ("2.", "Product Overview", "4"),
        ("3.", "Data &amp; Latency Model", "5"),
        ("4.", "Privacy &amp; Security", "6"),
        ("5.", "Market &amp; Traction", "7"),
        ("6.", "Roadmap", "8"),
        ("7.", "Conclusion", "9"),
    ]
    toc_data = [
        [Paragraph(num, styles["Body"]),
         Paragraph(title, styles["Body"]),
         Paragraph(page, styles["Body"])]
        for num, title, page in toc
    ]
    t = Table(toc_data, colWidths=[0.4 * inch, 5.4 * inch, 0.6 * inch])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, RULE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    s.append(t)
    s.append(PageBreak())

    # =========================================================
    # 1. INTRODUCTION
    # =========================================================
    s.append(Paragraph("Section 1", styles["Eyebrow"]))
    s.append(Paragraph("Introduction &amp; Problem Space", styles["H1"]))
    s.append(hr())

    s.append(Paragraph("The hidden cost of \"just checking the score\"", styles["H2"]))
    s.append(Paragraph(
        "Live sport is one of the last truly synchronous forms of media: a "
        "wicket, a goal, or an overtake either happens while you are watching "
        "or it doesn't. For the modern fan who also spends eight hours a day "
        "in a code editor, a spreadsheet, or a video call, that synchrony is "
        "expensive. The score sits behind a tab, behind an app icon, behind a "
        "lock screen &mdash; every one of which is a context switch.",
        styles["Body"],
    ))
    s.append(Paragraph(
        "Our internal user interviews surfaced three recurring patterns. "
        "First, fans materially over-check: the median respondent reported "
        "more than twenty tab or app switches per match-day. Second, those "
        "switches cluster around exactly the moments fans are trying to "
        "concentrate &mdash; deep work and live sport demand the same scarce "
        "resource, attention. Third, despite that cost, fans still miss the "
        "moments that matter most: roughly three out of four decisive plays "
        "happen between glances.",
        styles["Body"],
    ))

    s.append(Paragraph("Context-switching research", styles["H2"]))
    s.append(Paragraph(
        "The classic finding from Mark, Gudith, and Klocke (2008) is that "
        "knowledge workers require an average of twenty-three minutes and "
        "fifteen seconds to fully return to a task after an interruption. "
        "Even conservative replications find recovery costs on the order of "
        "ten to fifteen minutes. Multiply that by the twenty-plus check-ins a "
        "fan makes on a busy match-day and the cost is no longer a rounding "
        "error: it is a meaningful fraction of the working day.",
        styles["Body"],
    ))

    s.append(Paragraph("Why mobile-first scoring apps fail desktop users", styles["H2"]))
    s.append(Paragraph(
        "Existing live-score apps are optimised for a phone in the hand, not "
        "a workstation in front of the face. They demand foreground attention, "
        "they push full-screen notifications, and their browser counterparts "
        "live behind a tab that must be hunted. None of them treat the "
        "desktop as a first-class surface. ScoreDeck inverts that assumption: "
        "the desktop &mdash; specifically, the strip immediately above the "
        "taskbar, dock, or panel on whichever operating system the user "
        "happens to run &mdash; is the product.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # =========================================================
    # 2. PRODUCT OVERVIEW
    # =========================================================
    s.append(Paragraph("Section 2", styles["Eyebrow"]))
    s.append(Paragraph("Product Overview", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "ScoreDeck ships as a single signed binary on each supported "
        "platform &mdash; Windows, macOS, and Linux &mdash; presenting a "
        "frameless, always-on-top, transparent overlay that lives in the "
        "bottom-right of the user's primary monitor by default. It "
        "occupies a 360 by 48 pixel footprint &mdash; small enough to "
        "coexist with a maximised IDE or browser, large enough to surface "
        "a score, a sport indicator, and a key metric at a glance.",
        styles["Body"],
    ))

    s.append(Paragraph("The widget", styles["H2"]))
    s.extend(bullets([
        "<b>Resting state (360 &times; 48 px):</b> sport dot, two teams or driver, score, contextual extra (overs, minute, lap), and a progress bar coloured per sport.",
        "<b>Expanded analysis (360 &times; 250 px):</b> deeper per-sport breakdown &mdash; run-rate and required rate for cricket; sector and tyre status for F1; shooting and possession splits for football and basketball.",
        "<b>Carousel:</b> tracked sports cycle every five seconds with a navigation-dot indicator; the user can pin or skip.",
        "<b>Multi-monitor:</b> the widget can be docked to any connected display, including ultrawide and vertical orientations, via the system-tray menu.",
    ], styles))

    s.append(Paragraph("Setup &amp; configuration", styles["H2"]))
    s.extend(bullets([
        "<b>Free tier:</b> one tracked sport, all real-time score features.",
        "<b>Pro tier:</b> up to four concurrent sports, unlimited live matches, full commentary, priority support.",
        "<b>Filters:</b> per-sport tracking by league, team, or driver &mdash; or a wildcard \"all\" filter.",
        "<b>Visibility:</b> always-on, or live-only (the widget self-hides when no tracked match is in progress).",
        "<b>Start-on-boot:</b> wired through Electron's <font face=\"Courier\">setLoginItemSettings</font> on Windows and macOS, and through a generated <font face=\"Courier\">.desktop</font> autostart entry on Linux, so the widget is present from session start.",
    ], styles))

    s.append(Paragraph("Surfaces beyond the widget", styles["H2"]))
    s.extend(bullets([
        "<b>Live Commentary:</b> English, Hindi, Spanish, and German &mdash; near-real-time audio commentary streamed alongside the score.",
        "<b>PiP Live Tracker:</b> a detachable spatial view &mdash; mini-pitch for football, wagon-wheel for cricket, track-map for Formula 1.",
        "<b>Key alerts:</b> goals, wickets, overtakes, and dismissals raise lightweight toolbar notifications &mdash; no full-screen pop-ups.",
        "<b>Stealth mode:</b> opacity and compactness controls for stand-ups and screen-shares.",
    ], styles))
    s.append(PageBreak())

    # =========================================================
    # 3. DATA & LATENCY
    # =========================================================
    s.append(Paragraph("Section 3", styles["Eyebrow"]))
    s.append(Paragraph("Data &amp; Latency Model", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Live sport is unforgiving of latency. A score that arrives ten "
        "seconds after social media has already broken the news is not a "
        "score: it is a spoiler. ScoreDeck targets sub-second freshness in "
        "the resting widget and near-real-time refresh in expanded views.",
        styles["Body"],
    ))

    s.append(Paragraph("Polling and proxying", styles["H2"]))
    s.extend(bullets([
        "<b>Server-mediated reads:</b> the widget never talks to score APIs directly &mdash; it polls a Next.js route handler that fans out to the appropriate upstream. This protects the client from upstream schema drift and rate limits.",
        "<b>Adaptive polling:</b> during a tracked live event the client polls every second; between events it backs off to thirty-second intervals.",
        "<b>Mobile-CORS-safe:</b> a hardened proxy layer normalises every upstream response so the same client code path works on desktop and the mobile preview site.",
    ], styles))

    s.append(Paragraph("Cricket state engine", styles["H2"]))
    s.append(Paragraph(
        "Cricket presents the hardest classification problem of the four "
        "sports because a single match can be live, suspended, completed, "
        "or upcoming &mdash; and most upstream feeds disagree on which. "
        "ScoreDeck ships a universal state engine that derives match state "
        "from a combination of status text, title scores, target chase "
        "indicators, and innings counts, with an explicit unit-test suite "
        "covering edge cases such as HAM (Hold-Action-Match), washouts, and "
        "completed matches whose feed still reports \"live.\"",
        styles["Body"],
    ))

    s.append(Paragraph("Background sync &amp; UI invariants", styles["H2"]))
    s.extend(bullets([
        "<b>Background sync:</b> Electron keeps a long-lived fetch loop independent of widget visibility so cache is warm when the user un-hides.",
        "<b>Retry and backoff:</b> exponential backoff on 5xx responses; circuit-breaker on repeated upstream failure, falling back to last-known-good.",
        "<b>Optimistic UI:</b> the widget renders the previous frame's score until a fresh frame arrives, eliminating flicker on slow networks.",
        "<b>Skeleton loaders:</b> first-paint uses glass-morphic skeletons rather than spinners, keeping the surface visually quiet.",
    ], styles))
    s.append(PageBreak())

    # =========================================================
    # 4. PRIVACY & SECURITY
    # =========================================================
    s.append(Paragraph("Section 4", styles["Eyebrow"]))
    s.append(Paragraph("Privacy &amp; Security", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "ScoreDeck is engineered around the principle that the smallest "
        "surface area is the safest surface area. The widget knows almost "
        "nothing about the user, and the backend knows only what it must.",
        styles["Body"],
    ))

    s.append(Paragraph("Client-side", styles["H2"]))
    s.extend(bullets([
        "<b>No PII on disk:</b> the widget persists only sport selections, tier flag, and display preferences &mdash; no email, no name, no token.",
        "<b>Context isolation:</b> the Electron window runs with <font face=\"Courier\">contextIsolation: true</font> and <font face=\"Courier\">nodeIntegration: false</font>; a narrow preload bridge is the only path between renderer and main.",
        "<b>No remote code execution:</b> the renderer ships a static bundle; there is no dynamic <font face=\"Courier\">eval</font> path.",
        "<b>Signed installers across the stack:</b> Windows builds are Authenticode-signed, macOS builds are notarised through Apple's gatekeeper pipeline, and Linux AppImages ship with detached signatures. Auto-update on every platform is gated on signature verification.",
    ], styles))

    s.append(Paragraph("Server-side", styles["H2"]))
    s.extend(bullets([
        "<b>Row-Level Security:</b> both Supabase tables have RLS enabled. The anonymous role can only count backers; it cannot read emails or insert rows.",
        "<b>Service-role writes only:</b> waitlist and backer inserts route through Next.js API handlers using the service-role key, which never leaves the server.",
        "<b>Email minimisation:</b> the only personal datum collected pre-purchase is an email address and an insert timestamp.",
        "<b>Transport:</b> TLS end-to-end; Supabase, Vercel, Resend, and Dodo all terminate on HTTPS.",
        "<b>GDPR posture:</b> data minimisation, explicit consent on the waitlist form, deletion on request via a documented support flow.",
    ], styles))

    s.append(Paragraph("Threat model summary", styles["H2"]))
    s.append(Paragraph(
        "The two threats we treat as material are (1) a compromised score "
        "provider serving malicious payloads and (2) a hostile actor "
        "attempting to enumerate the backer list. We mitigate the first by "
        "schema-validating all upstream responses at the proxy layer before "
        "the client sees them, and the second by exposing only an aggregate "
        "count via the anonymous role.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # =========================================================
    # 5. MARKET & TRACTION
    # =========================================================
    s.append(Paragraph("Section 5", styles["Eyebrow"]))
    s.append(Paragraph("Market &amp; Traction", styles["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "ScoreDeck targets the intersection of two large, growing audiences: "
        "knowledge workers across Windows, macOS, and Linux, and sports "
        "fans whose attention is split across cricket, football, "
        "basketball, and motorsport. The product is live as of June 2026 "
        "with the following indicators.",
        styles["Body"],
    ))

    s.append(Spacer(1, 0.1 * inch))
    s.append(stats_row([
        ("8,000+", "Active users"),
        ("500K+", "Social media reach"),
        ("4", "Sports live"),
    ], styles))
    s.append(Spacer(1, 0.1 * inch))
    s.append(stats_row([
        ("3", "Operating systems"),
        ("5", "Locales live"),
        ("$5/mo", "Pro tier (live)"),
    ], styles))
    s.append(Spacer(1, 0.2 * inch))

    s.append(Paragraph("Reach &amp; community", styles["H2"]))
    s.append(Paragraph(
        "Beyond the in-product user base, ScoreDeck's content surfaces "
        "&mdash; the live cricket and live soccer pages, short-form match "
        "recaps, and editorial commentary &mdash; reach more than half a "
        "million people per month across X, Instagram, YouTube Shorts, "
        "and Reddit. That funnel both feeds and is fed by the desktop "
        "product: fans discover ScoreDeck through a clip and install it; "
        "active users share key moments back into their feeds.",
        styles["Body"],
    ))

    s.append(Paragraph("Go-to-market", styles["H2"]))
    s.extend(bullets([
        "<b>Cross-platform from day one:</b> native Windows, macOS, and Linux clients all ship today, removing the most common reason knowledge-worker software fails to land.",
        "<b>Live pricing:</b> a recurring Pro tier at five US dollars per month and a one-time Lifetime tier at twenty-nine US dollars, both available for purchase today.",
        "<b>Localisation as a wedge:</b> first-class Hindi and Arabic support unlocks cricket markets that are routinely under-served by English-only competitors.",
        "<b>Content surfaces:</b> live cricket and live soccer pages on scoredeck.pro drive organic acquisition and underpin the 500K+ monthly social reach; both pages reuse the same rendering primitives as the desktop widget.",
        "<b>Channel:</b> direct download from the marketing site, payment via Dodo, fulfilment via Resend; no app-store gatekeeping.",
    ], styles))

    s.append(Paragraph("Competitive positioning", styles["H2"]))
    s.append(Paragraph(
        "ScoreDeck does not compete with broadcast or with full-fidelity "
        "highlight apps; it competes with the empty space between a fan and "
        "their work. Mobile-first scoring apps own the commute and the sofa; "
        "ScoreDeck owns the workstation. The two are complementary &mdash; "
        "our typical interviewee uses Cricbuzz or ESPN at the weekend and "
        "wants something quieter on Monday morning.",
        styles["Body"],
    ))
    s.append(PageBreak())

    # =========================================================
    # 6. ROADMAP
    # =========================================================
    s.append(Paragraph("Section 6", styles["Eyebrow"]))
    s.append(Paragraph("Roadmap", styles["H1"]))
    s.append(hr())

    roadmap = [
        ("Shipped", "Core platform &mdash; live",
         "Native Windows, macOS, and Linux desktop clients; four sports "
         "(Cricket, Football, Basketball, Formula 1); five-locale "
         "marketing site; Pro and Lifetime tiers; live cricket and soccer "
         "pages; multi-language commentary; 500K+ monthly social reach."),
        ("Q3 2026", "Pro experience",
         "Advanced analytics views per sport, custom alert rules, "
         "expanded league-level filtering for football, and a refreshed "
         "expanded-analysis pane."),
        ("Q4 2026", "Sports coverage",
         "NFL and tennis added to the four-sport core; cricket coverage "
         "deepened with ball-by-ball historical timelines."),
        ("Q1 2027", "Mobile companion",
         "iOS and Android companion app sharing the same config and "
         "tracking state as the desktop widget via authenticated sync."),
        ("Q2 2027", "Fantasy integrations",
         "Read-only fantasy overlays for cricket, football, and Formula 1, "
         "showing the user's own roster impact in the expanded view."),
        ("Q3 2027", "Broadcaster partnerships",
         "Pilot partnerships with regional broadcasters to surface licensed "
         "commentary streams inside the widget."),
        ("Ongoing", "Localisation and accessibility",
         "Additional locales prioritised by active-user composition; full "
         "WCAG 2.2 AA pass on the widget and web surfaces."),
    ]
    data = [["Window", "Theme", "Detail"]] + [
        [Paragraph(w, styles["Body"]),
         Paragraph(f"<b>{th}</b>", styles["Body"]),
         Paragraph(d, styles["Body"])]
        for w, th, d in roadmap
    ]
    t = Table(data, colWidths=[0.9 * inch, 1.5 * inch, 3.9 * inch])
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
    s.append(PageBreak())

    # =========================================================
    # 7. CONCLUSION + REFERENCES
    # =========================================================
    s.append(Paragraph("Section 7", styles["Eyebrow"]))
    s.append(Paragraph("Conclusion", styles["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "The fan who codes for a living, trades during the IPL, or runs a "
        "spreadsheet during a Grand Prix is asked to choose between focus "
        "and the score. ScoreDeck rejects that trade. By treating the "
        "desktop &mdash; on Windows, macOS, and Linux alike &mdash; as a "
        "first-class scoring surface, not an after-thought of the mobile "
        "experience, we collapse the twenty daily tab switches into a "
        "single 360 by 48 pixel strip that the user never has to look "
        "for. With more than 8,000 active users, a 500K+ monthly social "
        "reach, and a five-locale footprint, the wedge is no longer "
        "theoretical. The widget is quiet by design, private by default, "
        "and fast by construction.",
        styles["Body"],
    ))
    s.append(Paragraph(
        "The product is small. The opportunity is not: every minute of "
        "attention recovered is a minute the user gets to spend on the "
        "work, the game, or the people around them. That is the wedge we "
        "are building behind, and that is what the rest of this document "
        "has tried to describe in detail.",
        styles["Body"],
    ))

    s.append(Spacer(1, 0.25 * inch))
    s.append(Paragraph("References &amp; Notes", styles["H2"]))
    s.extend(bullets([
        "Mark, G., Gudith, D., &amp; Klocke, U. (2008). <i>The cost of interrupted work: more speed and stress.</i> Proceedings of CHI 2008.",
        "Internal user research, ScoreDeck team, 2025-2026 (n=42 semi-structured interviews, Windows knowledge workers).",
        "Active-user counts as of June 2026, reported through the live counter on scoredeck.pro.",
        "Technical claims reflect the production state of the ScoreDeck repository and the live product at the time of writing.",
    ], styles))

    s.append(Spacer(1, 0.4 * inch))
    s.append(HRFlowable(width="100%", thickness=1, color=ACCENT,
                        spaceBefore=0, spaceAfter=10))
    s.append(Paragraph(
        "<b>ScoreDeck</b> &mdash; A desktop overlay for live sports. "
        "Live now at <font color='#2f6770'>scoredeck.pro</font> for "
        "Windows, macOS, and Linux. Pro from $5/month, Lifetime $29.",
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
        title="ScoreDeck: A Desktop-Native Approach to Ambient Live Sports Awareness",
        author="ScoreDeck Team",
        subject="Technical & Product Whitepaper",
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
    # First page uses cover template; force template switch for the rest.
    from reportlab.platypus import NextPageTemplate
    final_story = [NextPageTemplate("body")] + story

    doc.build(final_story)
    print(f"Wrote: {OUTPUT}")


if __name__ == "__main__":
    build()
