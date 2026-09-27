"""
Threadline newsletter graphics - generator.

Every graphic is drawn as code at 1200 x 1500 (4:5). The 1200 px PNG is the
web/email export (shown at 600 px wide in email, i.e. 2x), and the 1080 x 1350
export is the same layout at 0.9 scale for LinkedIn and mobile feeds.

Edit the text in the functions below, then run:  python build.py  and  sh render.sh
build.py writes src/*.svg (editable, self-contained; fonts via a Google Fonts
@import) and render/*.html (wrappers render.sh screenshots with headless Chrome).
Tokens come from src/styles/marketing-v9/index.css and marketing-v5/tokens.css.
"""
import io
import json
import math
import os
from html import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1200, 1500
M = 72  # outer margin

# Brand tokens (marketing-v9 / v5)
C = dict(
    canvas="#e8f1f8", panel="#ffffff", ink="#17233a", soft="#3b475e", faint="#6b768a",
    action="#1f63d6", night="#101a33",
    sky="#dbeaf7", peach="#ffe4d6", mint="#d9f0e3", lilac="#e6ddfa", butter="#fff0c2",
    skyd="#a9cdea", line="#17233a",
)
SERIF = "'Instrument Serif', 'Iowan Old Style', Georgia, serif"
SANS = "Inter, 'Segoe UI', system-ui, sans-serif"
STROKE = 3  # the one line weight used everywhere


def t(x, y, lines, size=30, weight=400, fill=None, family=SANS, anchor="start", lh=1.3, ls=None, italic=False):
    """Explicitly broken lines of text (no automatic wrapping, so layout is deterministic)."""
    if isinstance(lines, str):
        lines = [lines]
    fill = fill or C["ink"]
    extra = f' letter-spacing="{ls}"' if ls else ""
    style = ' font-style="italic"' if italic else ""
    fam = escape(family, quote=True)
    out = [f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{extra}{style}>']
    for i, ln in enumerate(lines):
        dy = 0 if i == 0 else round(size * lh, 1)
        out.append(f'<tspan x="{x}" dy="{dy}">{escape(ln)}</tspan>')
    out.append("</text>")
    return "".join(out)


def rect(x, y, w, h, fill, r=24, stroke=None, dash=None, sw=STROKE):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{s}{d}/>'


def line(x1, y1, x2, y2, arrow=True, color=None, dash=None):
    color = color or C["line"]
    m = ' marker-end="url(#arr)"' if arrow else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{STROKE}" stroke-linecap="round"{d}{m}/>'


def path(d, arrow=False, color=None, fill="none", dash=None):
    color = color or C["line"]
    m = ' marker-end="url(#arr)"' if arrow else ""
    ds = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" fill="{fill}" stroke="{color}" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round"{ds}{m}/>'


def circle(cx, cy, r, fill, stroke=None):
    s = f' stroke="{stroke}" stroke-width="{STROKE}"' if stroke else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}/>'


def frame(num, title_lines, tag=None):
    """Shared header (eyebrow + serif headline) and footer (mark + wordmark)."""
    head = [
        rect(0, 0, W, H, C["canvas"], r=0),
        t(M, 116, f"THREADLINE FIELD NOTES · {num:02d}", size=24, weight=600, fill=C["faint"], ls="3"),
        t(M, 206, title_lines, size=72, family=SERIF, fill=C["ink"], lh=1.08),
    ]
    # Footer: the Threadline mark (path from src/components/brand/logo.tsx, x2.4) + tracked wordmark.
    foot = [
        f'<g transform="translate({M},1404) scale(2.4)" fill="none">'
        f'<path d="M3 17.5C5.5 17.5 6.2 6.5 9 6.5C11.8 6.5 12.2 17.5 15 17.5C17.8 17.5 18.5 6.5 21 6.5" stroke="{C["action"]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>'
        f'<circle cx="9" cy="6.5" r="1.9" fill="{C["action"]}"/><circle cx="15" cy="17.5" r="1.9" fill="{C["action"]}" opacity="0.55"/></g>',
        t(M + 74, 1448, "THREADLINE", size=26, weight=500, fill=C["ink"], ls="5.5"),
    ]
    if tag:
        foot.append(t(W - M, 1448, tag, size=24, weight=500, fill=C["faint"], anchor="end"))
    defs = (
        "<defs><style>@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Inter:wght@400;500;600&amp;display=swap');</style>"
        f'<marker id="arr" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto-start-reverse">'
        f'<path d="M1 1 L10 6 L1 11" fill="none" stroke="{C["line"]}" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>'
    )
    return head, defs, foot


def svg(num, title_lines, body, alt, tag=None):
    head, defs, foot = frame(num, title_lines, tag)
    inner = "\n".join(head + body + foot)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t{num} d{num}">\n'
        f'<title id="t{num}">{escape(" ".join(title_lines))}</title><desc id="d{num}">{escape(alt)}</desc>\n{defs}\n{inner}\n</svg>\n'
    )


# ---------------------------------------------------------------- 01 journey
def g01():
    steps = [
        ("Expertise captured", "calls, notes, decisions, recorded"),
        ("Positioned", "one buyer, one expensive problem"),
        ("Expressed", "in your voice, in native formats"),
        ("Distributed", "where those buyers already read"),
        ("The right buyers notice", "not reach for its own sake"),
        ("Trust builds", "repeated, useful, specific"),
        ("They respond", "a reply, a visit, a referral"),
        ("Qualified conversation", "the outcome that counts"),
    ]
    b = [
        rect(M, 356, W - 2 * M, 500, C["panel"], r=32),
        rect(M, 876, W - 2 * M, 500, C["sky"], r=32),
        t(W - M - 32, 404, "INSIDE THE FIRM", size=24, weight=600, fill=C["faint"], anchor="end", ls="2.5"),
        t(W - M - 32, 924, "IN THE MARKET", size=24, weight=600, fill=C["faint"], anchor="end", ls="2.5"),
    ]
    pts = [(160, 454 + i * 116 + (40 if i >= 4 else 0)) for i in range(8)]
    d = f"M{pts[0][0]} {pts[0][1]}"
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])):
        o = 56 if k % 2 == 0 else -56  # a gentle wave, like the mark
        d += f" C{x0 + o} {y0 + 40} {x1 + o} {y1 - 40} {x1} {y1}"
    b.append(path(d, color=C["action"]))
    for i, ((x, y), (a, s)) in enumerate(zip(pts, steps)):
        last = i == 7
        b.append(circle(x, y, 26 if last else 20, C["action"] if last else C["panel"], stroke=C["action"]))
        b.append(t(x, y + 9, str(i + 1), size=24, weight=600, fill=C["panel"] if last else C["action"], anchor="middle"))
        b.append(t(236, y - 6, a, size=36, weight=600))
        b.append(t(236, y + 36, s, size=28, fill=C["soft"]))
    alt = ("A thread runs through eight numbered steps. Inside the firm: 1 expertise captured from calls, notes and decisions; "
           "2 positioned for one buyer and one expensive problem; 3 expressed in the founder's voice in native formats; "
           "4 distributed where those buyers already read. In the market: 5 the right buyers notice; 6 trust builds through "
           "repeated, useful, specific pieces; 7 they respond with a reply, a visit or a referral; 8 a qualified conversation, the outcome that counts.")
    return svg(1, ["How expertise becomes", "qualified demand"], b, alt), alt


# ---------------------------------------------------------------- 02 loop
def g02():
    cx, cy, R = 600, 832, 362
    st = [
        ("SCORE", ["rate it against a", "stated rubric"]),
        ("EXPLAIN", ["which parts", "carried it"]),
        ("DIAGNOSE", ["idea, packaging", "or distribution?"]),
        ("PRESCRIBE", ["change one", "variable"]),
        ("RETEST", ["read it again,", "same root idea"]),
    ]
    angs = [-90, -18, 54, 126, 198]
    b = [circle(cx, cy, R, "none", stroke=C["skyd"])]
    for a in angs:  # arrowed arc segments between stations
        a1, a2 = math.radians(a + 30), math.radians(a + 72 - 30)
        x1, y1 = cx + R * math.cos(a1), cy + R * math.sin(a1)
        x2, y2 = cx + R * math.cos(a2), cy + R * math.sin(a2)
        b.append(path(f"M{x1:.1f} {y1:.1f} A{R} {R} 0 0 1 {x2:.1f} {y2:.1f}", arrow=True))
    fills = [C["sky"], C["mint"], C["peach"], C["lilac"], C["butter"]]
    for (name, sub), a, f in zip(st, angs, fills):
        x, y = cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))
        b.append(rect(round(x - 165, 1), round(y - 72, 1), 330, 144, f, r=28, stroke=C["ink"]))
        b.append(t(round(x, 1), round(y - 20, 1), name, size=30, weight=600, anchor="middle", ls="2"))
        b.append(t(round(x, 1), round(y + 20, 1), sub, size=26, fill=C["soft"], anchor="middle", lh=1.2))
    b += [
        t(cx, cy - 60, "Expected", size=56, family=SERIF, anchor="middle"),
        t(cx, cy - 6, "vs", size=32, fill=C["faint"], anchor="middle", italic=True, family=SERIF),
        t(cx, cy + 50, "Actual", size=56, family=SERIF, anchor="middle"),
        t(cx, cy + 100, ["frozen before", "publishing"], size=24, fill=C["soft"], anchor="middle", lh=1.2),
        rect(M, 1266, W - 2 * M, 106, C["panel"], r=24),
        t(W / 2, 1312, "Each cycle logs: what we believed · what happened ·", size=26, fill=C["soft"], anchor="middle"),
        t(W / 2, 1350, "which assumption failed · what changes next", size=26, fill=C["soft"], anchor="middle"),
    ]
    alt = ("A loop of five stations: Score (rate the piece against a stated rubric), Explain (which parts carried it), "
           "Diagnose (idea, packaging or distribution), Prescribe (change one variable), Retest (read it again on the same root idea). "
           "At the centre: expected versus actual, with the expectation frozen before publishing. Each cycle logs what we believed, "
           "what happened, which assumption failed and what changes next.")
    return svg(2, ["Every piece is a test,", "read honestly"], b, alt), alt


# ---------------------------------------------------------------- 03 swimlane
def g03():
    cols = [(M, "FOUNDER", C["panel"]), (440, "AI DRAFTING", C["lilac"]), (808, "THREADLINE TEAM", C["panel"])]
    b = []
    for x, name, f in cols:
        b.append(rect(x, 356, 320, 930, f, r=28))
        b.append(t(x + 160, 408, name, size=24, weight=600, fill=C["faint"], anchor="middle", ls="2.5"))
    boxes = [
        (0, 450, "Talk and record", ["the raw expertise"]),
        (1, 612, "First draft", ["from the source and", "the Brand Brain"]),
        (2, 774, "Check", ["facts, voice, claims,", "evidence"]),
        (0, 936, "Approve", ["this exact version"]),
        (2, 1098, "Publish", ["only what was", "approved"]),
    ]
    cx = [M + 160, 600, 968]
    prev = None
    for ci, y, a, s in boxes:
        x = cx[ci]
        stroke = C["action"] if a == "Approve" else C["ink"]
        b.append(rect(x - 140, y, 280, 136, C["canvas"] if ci != 1 else C["panel"], r=22, stroke=stroke))
        b.append(t(x, y + 50, a, size=30, weight=600, anchor="middle"))
        b.append(t(x, y + 88, s, size=24, fill=C["soft"], anchor="middle", lh=1.2))
        if prev:
            px, py = prev
            if x < px:  # back to the founder's lane: leave the left edge, arrive at the right edge
                b.append(path(f"M{px - 140} {py + 68} C{px - 420} {py + 68} {x} {y - 110} {x} {y - 6}", arrow=True))
            else:
                b.append(path(f"M{px + 140} {py + 68} C{px + 200} {py + 68} {x} {y - 60} {x} {y - 6}", arrow=True))
        prev = (x, y)
    b += [
        rect(cx[0] - 56, 1092, 112, 40, C["action"], r=20),
        t(cx[0], 1121, "GATE", size=22, weight=600, fill=C["panel"], anchor="middle", ls="2"),
        t(cx[1], 1170, ["The AI drafts.", "It never publishes."], size=26, weight=600, anchor="middle", fill=C["ink"], lh=1.25),
        t(W / 2, 1340, "Change a draft after approval and it comes back for approval.", size=26, fill=C["soft"], anchor="middle"),
    ]
    alt = ("Three lanes: founder, AI drafting, Threadline team. The founder talks and records the raw expertise; "
           "the AI writes a first draft from that source and the Brand Brain; the Threadline team checks facts, voice, claims and evidence; "
           "the founder approves that exact version, which is the gate; the team publishes only what was approved. "
           "The AI drafts and never publishes. A draft changed after approval comes back for approval.")
    return svg(3, ["People decide.", "AI drafts in between."], b, alt), alt


# ---------------------------------------------------------------- 04 PESTO
def g04():
    # PESTO as Marcos Ruiz (Birdhouse) defines it in the transcript the owner supplied: Personal, Expertise, Social proof, Trending, Opinions.
    letters = [("P", "Personal", "a story from your own experience", C["peach"]),
               ("E", "Expertise", "how the work is actually done", C["sky"]),
               ("S", "Social proof", "only with permission, never invented", C["mint"]),
               ("T", "Trending", "a current event, read through your lens", C["butter"]),
               ("O", "Opinions", "positions you would defend to peers", C["lilac"])]
    bw = W - 2 * M
    b = [t(M, 392, "Not the goal: five equal slices", size=26, weight=500, fill=C["faint"])]
    x = M
    for L, *_ in letters:
        w = bw / 5
        b.append(rect(round(x + 2, 1), 414, round(w - 4, 1), 84, C["panel"], r=14, stroke=C["skyd"], dash="8 8"))
        b.append(t(round(x + w / 2, 1), 470, L, size=36, weight=600, fill=C["faint"], anchor="middle"))
        x += w
    b.append(t(M, 572, "One client’s weighting (illustrative)", size=26, weight=600, fill=C["ink"]))
    weights = [0.14, 0.36, 0.10, 0.12, 0.28]  # illustrative only, not a recommendation
    order = [1, 4, 0, 3, 2]
    x = M
    for i in order:
        L, name, _, f = letters[i]
        w = bw * weights[i]
        b.append(rect(round(x + 2, 1), 594, round(w - 4, 1), 104, f, r=14, stroke=C["ink"]))
        b.append(t(round(x + w / 2, 1), 660, L, size=40, weight=600, anchor="middle"))
        x += w
    b.append(t(M, 740, "Weights follow what the evidence shows for this client, and change.", size=26, fill=C["soft"]))
    y = 812
    for L, name, sub, f in letters:
        b.append(rect(M, y, 76, 76, f, r=18, stroke=C["ink"]))
        b.append(t(M + 38, y + 52, L, size=38, weight=600, anchor="middle"))
        b.append(t(M + 104, y + 32, name, size=32, weight=600))
        b.append(t(M + 104, y + 68, sub, size=26, fill=C["soft"]))
        y += 96
    b.append(t(M, 1338, "PESTO content mix, after Marcos Ruiz (Birdhouse).", size=24, fill=C["faint"]))
    alt = ("PESTO content mix, after Marcos Ruiz (Birdhouse): Personal (a story from your own experience), Expertise (how the work is actually done), "
           "Social proof (only with permission, never invented), Trending (a current event read through your lens) and Opinions "
           "(positions you would defend to peers). A dashed bar of five equal slices is marked 'not the goal'; a second bar shows one "
           "client's illustrative weighting, led by expertise and opinions. Weights follow the evidence for each client and change.")
    return svg(4, ["A content mix you tune,", "not a formula you split"], b, alt, tag="Weighting shown is illustrative"), alt


# ---------------------------------------------------------------- 05 stack
def g05():
    b = [
        rect(M, 352, W - 2 * M, 112, C["night"], r=26),
        t(M + 36, 396, "WHERE IT LEADS: MARKET MEMORY", size=22, weight=600, fill=C["skyd"], ls="2.5"),
        t(M + 36, 438, "When a buyer has the problem, your name comes to mind.", size=28, fill=C["panel"]),
    ]
    layers = [
        ("ORGANIC CONTENT", "creates familiarity and authority", C["sky"], None),
        ("OUTBOUND", "reaches specific buyers directly", C["peach"], None),
        ("PROFILE AND LIBRARY", "proves competence when they check you", C["mint"], None),
        ("PAID, LATER", "only once message and proof are strong", C["canvas"], "10 10"),
        ("ATTRIBUTION", "shows which combinations move buyers", C["butter"], None),
        ("THE LEARNING LOOP", "improves every layer above, each cycle", C["lilac"], None),
    ]
    y = 520
    b.append(line(600, y - 6, 600, 470))
    for name, desc, f, dash in layers:
        b.append(rect(M, y, W - 2 * M, 124, f, r=22, stroke=C["ink"] if not dash else C["faint"], dash=dash))
        b.append(t(M + 36, y + 50, name, size=24, weight=600, fill=C["ink"] if not dash else C["faint"], ls="2.5"))
        b.append(t(M + 36, y + 94, desc, size=30, fill=C["soft"] if not dash else C["faint"]))
        y += 138
    alt = ("A stack of layers under one destination, market memory: when a buyer has the problem, your name comes to mind. "
           "From the top: organic content creates familiarity and authority; outbound reaches specific buyers directly; "
           "the profile and content library prove competence when prospects check you; paid, dashed as later, only once message and proof are strong; "
           "attribution shows which combinations move buyers; the learning loop improves every layer each cycle.")
    return svg(5, ["Content and outbound", "work as one system"], b, alt), alt


# ---------------------------------------------------------------- 06 funnel contrast
def g06():
    b = []
    tiers = [
        ("VIEWS", "Someone’s feed showed it.", "Easy to count. Says little.", 1056, C["panel"]),
        ("ATTENTION", "The right person stopped and stayed.", "Harder to see. Worth more.", 860, C["sky"]),
        ("QUALIFIED DEMAND", "A buyer who fits asked to talk.", "Rare. The point.", 664, C["mint"]),
    ]
    y = 364
    for name, what, note, w, f in tiers:
        x0 = (W - w) / 2
        pts = f"{x0},{y} {x0 + w},{y} {x0 + w - 98},{y + 232} {x0 + 98},{y + 232}"
        b.append(f'<polygon points="{pts}" fill="{f}" stroke="{C["ink"]}" stroke-width="{STROKE}" stroke-linejoin="round"/>')
        b.append(t(W / 2, y + 60, name, size=26, weight=600, anchor="middle", ls="3", fill=C["faint"]))
        b.append(t(W / 2, y + 112, what, size=30, weight=600, anchor="middle"))
        b.append(t(W / 2, y + 158, note, size=28, fill=C["soft"], anchor="middle"))
        y += 252
    b += [
        t(W / 2, 1204, "“Views are an observation,", size=54, family=SERIF, anchor="middle"),
        t(W / 2, 1266, "not an outcome.”", size=54, family=SERIF, anchor="middle"),
        t(W / 2, 1340, "Shapes show the order, not quantities.", size=24, fill=C["faint"], anchor="middle"),
    ]
    alt = ("Three stacked tiers narrowing downwards. Views: someone's feed showed it; easy to count, says little. "
           "Attention: the right person stopped and stayed; harder to see, worth more. Qualified demand: a buyer who fits asked to talk; rare, the point. "
           "Beneath: 'Views are an observation, not an outcome.' The shapes show order, not quantities.")
    return svg(6, ["Views, attention and", "qualified demand"], b, alt), alt


# ---------------------------------------------------------------- 07 fan-out
def g07():
    b = [
        line(600, 528, 600, 1245, arrow=False, color=C["action"]),
        rect(M, 352, W - 2 * M, 176, C["night"], r=30),
        t(W / 2, 400, "ONE ROOT IDEA", size=22, weight=600, fill=C["skyd"], anchor="middle", ls="3"),
        t(W / 2, 462, "“More content can’t fix", size=44, family=SERIF, fill=C["panel"], anchor="middle"),
        t(W / 2, 508, "unclear positioning.”", size=44, family=SERIF, fill=C["panel"], anchor="middle"),
    ]
    cards = [
        ("Short video", "show it in under a minute", C["peach"]),
        ("X", "the argument, tight", C["sky"]),
        ("LinkedIn", "a decision memo", C["mint"]),
        ("Threads", "a conversation opener", C["butter"]),
        ("Diagram", "the mechanism, drawn", C["lilac"]),
        ("YouTube", "the full depth (pilot)", C["panel"]),
    ]
    cw, ch = 490, 176
    for i, (name, sub, f) in enumerate(cards):
        col, row = i % 2, i // 2
        x = M if col == 0 else W - M - cw
        y = 592 + row * 226
        b.append(rect(x, y, cw, ch, f, r=24, stroke=C["ink"]))
        b.append(t(x + 34, y + 72, name, size=34, weight=600))
        b.append(t(x + 34, y + 120, sub, size=28, fill=C["soft"]))
        ex = x + cw if col == 0 else x
        b.append(line(600, y + ch / 2, ex + (6 if col == 0 else -6), y + ch / 2, arrow=True, color=C["action"]))
        b.append(circle(600, y + ch / 2, 9, C["action"]))
    b.append(t(W / 2, 1300, "Every piece keeps its root idea’s ID, so the learning adds up.", size=26, fill=C["soft"], anchor="middle"))
    b.append(t(W / 2, 1352, "Illustrative. The mix is prescribed per client; long-form YouTube is a pilot.", size=24, weight=500, fill=C["faint"], anchor="middle"))
    alt = ("One root idea at the top, 'More content can't fix unclear positioning', branches along a single thread into six native formats: "
           "a short video that shows it in under a minute, an X post with the argument kept tight, a LinkedIn decision memo, "
           "a Threads conversation opener, a diagram of the mechanism, and a YouTube piece with the full depth (a pilot). "
           "Every piece keeps its root idea's ID, so the learning adds up. Illustrative: the mix is prescribed per client, and long-form YouTube is a pilot.")
    return svg(7, ["One idea, expressed", "natively, six ways"], b, alt), alt


# ---------------------------------------------------------------- 08 mapping table
def g08():
    b = []
    pills = [(M, 232, ["Heard on a call"]), (352, 160, ["Logged"]), (560, 236, ["Becomes a piece"]), (844, 284, ["Seen before the", "next call"])]
    for x, w, lab in pills:
        b.append(rect(x, 352, w, 96, C["panel"], r=48, stroke=C["ink"]))
        ty = 410 if len(lab) == 1 else 394
        b.append(t(x + w / 2, ty, lab, size=24, weight=600, anchor="middle", lh=1.15))
    for (x, w, _), (nx, _, _) in zip(pills, pills[1:]):
        b.append(line(x + w + 8, 400, nx - 8, 400))
    cols = [(M, "WHAT THEY SAID"), (452, "LOGGED AS"), (672, "THE PIECE IT BECOMES")]
    b.append(rect(M, 500, W - 2 * M, 780, C["panel"], r=28))
    for x, h in cols:
        b.append(t(x + 28, 552, h, size=22, weight=600, fill=C["faint"], ls="2"))
    rows = [
        (["“We tried content.", "It got likes,", "not clients.”"], "Proof", ["Why views mislead, and", "what to read instead"], C["peach"]),
        (["“AI content all", "sounds the same.”"], "AI", ["How a human check keeps", "your voice yours"], C["lilac"]),
        (["“I don’t have time", "for this.”"], "Time", ["What you actually do:", "talk, record, approve, sell"], C["mint"]),
        (["“Can’t we just", "post more?”"], "Alternatives", ["Why more volume can", "amplify the wrong thing"], C["sky"]),
    ]
    y = 584
    for said, tag, piece, f in rows:
        b.append(f'<line x1="{M + 24}" y1="{y}" x2="{W - M - 24}" y2="{y}" stroke="{C["skyd"]}" stroke-width="2"/>')
        b.append(t(M + 28, y + 50, said, size=28, weight=500, lh=1.2))
        pw = 176 if len(tag) > 6 else 110
        b.append(rect(452 + 28, y + 22, pw, 44, f, r=22, stroke=C["ink"], sw=2))
        b.append(t(452 + 28 + pw / 2, y + 52, tag, size=22, weight=600, anchor="middle"))
        b.append(t(672 + 28, y + 50, piece, size=28, fill=C["soft"], lh=1.2))
        y += 200 if len(said) > 2 else 164
    alt = ("Flow across the top: heard on a call, logged, becomes a piece, seen before the next call. A table of illustrative examples follows. "
           "'We tried content. It got likes, not clients.' is logged as proof and becomes 'Why views mislead, and what to read instead'. "
           "'AI content all sounds the same.' is logged as AI and becomes 'How a human check keeps your voice yours'. "
           "'I don't have time for this.' is logged as time and becomes 'What you actually do: talk, record, approve, sell'. "
           "'Can't we just post more?' is logged as alternatives and becomes 'Why more volume can amplify the wrong thing'.")
    return svg(8, ["Every objection is", "a brief for content"], b, alt, tag="Examples are illustrative"), alt


# ---------------------------------------------------------------- 09 checklist blocks
def g09():
    items = [
        ("Positioning", ["who it is for, and the", "expensive problem"], C["sky"]),
        ("Brand Brain", ["beliefs, stories, proof and", "limits, confirmed by you"], C["peach"]),
        ("Voice guide", ["how you sound, and what", "you would never say"], C["mint"]),
        ("Workflow", ["who records, reviews", "and approves, and when"], C["butter"]),
        ("Measurement", ["the baseline, and what we", "read each period"], C["lilac"]),
        ("First content", ["the first pieces", "in production"], C["panel"]),
    ]
    cw, ch = 510, 250
    b = []
    for i, (name, sub, f) in enumerate(items):
        col, row = i % 2, i // 2
        x = M if col == 0 else W - M - cw
        y = 356 + row * 280
        b.append(rect(x, y, cw, ch, f, r=28, stroke=C["ink"]))
        b.append(circle(x + 62, y + 66, 28, C["panel"], stroke=C["ink"]))
        b.append(path(f"M{x + 49} {y + 67} L{x + 59} {y + 77} L{x + 77} {y + 55}", color=C["action"]))
        b.append(t(x + 112, y + 78, name, size=34, weight=600))
        b.append(t(x + 40, y + 152, sub, size=28, fill=C["soft"], lh=1.25))
    b += [
        t(W / 2, 1250, "Set up once, at the start.", size=46, family=SERIF, anchor="middle"),
        t(W / 2, 1310, "Everything after runs on it.", size=46, family=SERIF, anchor="middle", fill=C["soft"]),
    ]
    alt = ("Six ticked blocks: what implementation establishes. Positioning: who it is for and the expensive problem. "
           "Brand Brain: beliefs, stories, proof and limits, confirmed by you. Voice guide: how you sound and what you would never say. "
           "Workflow: who records, reviews and approves, and when. Measurement: the baseline and what we read each period. "
           "First content: the first pieces in production. Set up once, at the start; everything after runs on it.")
    return svg(9, ["What implementation", "puts in place"], b, alt), alt


# ---------------------------------------------------------------- 10 calendar
def g10():
    bands = [
        ("PERIOD 1", ["Establish /", "calibrate"], ["W1", "W2", "W3", "W4"], C["sky"]),
        ("PERIOD 2", ["Refine /", "correct"], ["W5", "W6", "W7", "W8"], C["mint"]),
        ("PERIOD 3", ["Compound /", "concentrate"], ["W9", "W10", "W11", "W12"], C["peach"]),
        ("PERIOD 4+", ["Compound", "harder"], ["W13", "W14", "W15", "W16"], C["lilac"]),
    ]
    b = []
    b.append(t(M, 348, "THE FIRST ENGAGEMENT IS PERIODS 1–3: TWELVE WEEKS", size=22, weight=600, fill=C["faint"], ls="2"))
    y = 376
    for i, (p, stage, weeks, f) in enumerate(bands):
        later = i == 3
        b.append(rect(M, y, W - 2 * M, 158, C["panel"], r=24, stroke=C["faint"] if later else None, dash="10 10" if later else None))
        b.append(t(M + 30, y + 44, p, size=22, weight=600, fill=C["faint"], ls="2.5"))
        b.append(t(M + 30, y + 88, stage, size=30, weight=600, lh=1.15))
        for k, wk in enumerate(weeks):
            x = 392 + k * 128
            b.append(rect(x, y + 24, 112, 110, f, r=16, stroke=C["ink"] if not later else C["faint"], dash="8 8" if later else None, sw=2))
            b.append(t(x + 56, y + 90, wk, size=26, weight=500, anchor="middle", fill=C["ink"] if not later else C["faint"]))
        b.append(rect(914, y + 24, 186, 110, C["night"] if not later else C["canvas"], r=16, stroke=None if not later else C["faint"], dash="8 8" if later else None, sw=2))
        b.append(t(1007, y + 72, ["4-week", "review"], size=26, weight=600, anchor="middle", fill=C["panel"] if not later else C["faint"], lh=1.15))
        y += 176
    b.append(t(M, 1124, "EVERY REVIEW, THE SAME FOUR HEADINGS", size=22, weight=600, fill=C["faint"], ls="2"))
    chips = [("ACTION", "what we did"), ("RESULTS", "what happened"), ("PROBLEMS", "what went wrong"), ("FUTURE", "what changes next")]
    x = M
    for k, (c, s) in enumerate(chips):
        b.append(rect(x, 1160, 228, 92, C["night"] if k == 0 else C["panel"], r=46, stroke=C["ink"]))
        b.append(t(x + 114, 1216, c, size=26, weight=600, anchor="middle", fill=C["panel"] if k == 0 else C["ink"], ls="2"))
        b.append(t(x + 114, 1298, s, size=24, fill=C["soft"], anchor="middle"))
        if k < 3:
            b.append(line(x + 232, 1206, x + 272, 1206))
        x += 276
    alt = ("A calendar of four-week periods. Period 1, weeks 1 to 4: establish / calibrate. Period 2, weeks 5 to 8: refine / correct. "
           "Period 3, weeks 9 to 12: compound / concentrate. Period 4 onwards, dashed: compound harder. Each period ends in a four-week review. "
           "The first engagement is periods 1 to 3, twelve weeks. Every review follows the same four headings: action (what we did), "
           "results (what happened), problems (what went wrong) and future (what changes next).")
    return svg(10, ["The four-week", "review cycle"], b, alt), alt


# ---------------------------------------------------------------- 11 masthead / cover
MARK = ('<path d="M3 17.5C5.5 17.5 6.2 6.5 9 6.5C11.8 6.5 12.2 17.5 15 17.5C17.8 17.5 18.5 6.5 21 6.5" stroke="{c}" stroke-width="1.6" '
        'stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/><circle cx="9" cy="6.5" r="1.9" fill="{c}"/>'
        '<circle cx="15" cy="17.5" r="1.9" fill="{c}" opacity="0.55"/>')


def g11():
    b = [
        rect(M, 340, W - 2 * M, 560, C["night"], r=36),
        f'<g transform="translate({W / 2 - 12 * 9},{400}) scale(9)" fill="none">' + MARK.format(c=C["skyd"]) + "</g>",
        t(W / 2, 700, "Field Notes", size=120, family=SERIF, fill=C["panel"], anchor="middle"),
        t(W / 2, 790, "ISSUE {{issue}}  ·  {{date}}", size=28, weight=600, fill=C["skyd"], anchor="middle", ls="4"),
        t(W / 2, 850, "Notes from the workshop: what we tested, what happened, what changes next.", size=24, fill=C["sky"], anchor="middle"),
        t(M, 986, "IN THIS ISSUE", size=22, weight=600, fill=C["faint"], ls="3"),
    ]
    y = 1030
    for k in range(1, 4):
        b.append(rect(M, y, W - 2 * M, 84, C["panel"], r=20, stroke=C["skyd"]))
        b.append(t(M + 30, y + 54, f"{k:02d}", size=26, weight=600, fill=C["action"]))
        b.append(t(M + 100, y + 54, "{{headline_%d}}" % k, size=28, fill=C["ink"]))
        y += 102
    alt = ("Newsletter masthead template: a dark panel with the Threadline thread mark, the title 'Field Notes', placeholders for issue "
           "number and date, and the line 'Notes from the workshop: what we tested, what happened, what changes next.' Below, an "
           "'In this issue' list with three headline placeholders.")
    return svg(11, ["Threadline", "Field Notes"], b, alt, tag="TEMPLATE · placeholders in braces"), alt


# ---------------------------------------------------------------- 12 bottleneck diagnostic grid
def g12():
    rows = [
        ("Ideas", ["Blank page", "every week"], ["Nothing captured", "from calls"], ["Mine last month’s", "call notes"], C["sky"]),
        ("Scripts", ["Drafts sound", "generic"], ["Voice and claims", "not written down"], ["Check the", "Brand Brain"], C["mint"]),
        ("Recording", ["Sessions", "keep slipping"], ["Setup friction,", "no fixed slot"], ["Book one", "recurring slot"], C["peach"]),
        ("Editing", ["Cuts come", "back wrong"], ["No agreed", "editing standard"], ["Agree examples", "before cutting"], C["butter"]),
        ("Approvals", ["Pieces wait", "for sign-off"], ["One approver,", "no backup"], ["Name a", "backup approver"], C["lilac"]),
        ("Publishing", ["Approved but", "not live"], ["Manual posting", "falls through"], ["Schedule when", "approved"], C["sky"]),
        ("Learning", ["Same result", "every week"], ["No expected", "vs actual"], ["Freeze a forecast", "before posting"], C["mint"]),
    ]
    xs = [M, M + 232, M + 506, M + 780]
    heads = ["WHERE IT STALLS", "WHAT YOU SEE", "LIKELY CAUSE", "FIRST CHECK"]
    b = [t(xs[i] + 8, 356, h, size=20, weight=600, fill=C["faint"], ls="2") for i, h in enumerate(heads)]
    y = 380
    for name, see, cause, check, f in rows:
        b.append(rect(M, y, W - 2 * M, 112, C["panel"], r=18, stroke=C["skyd"]))
        b.append(rect(M + 10, y + 12, 206, 88, f, r=14, stroke=C["ink"], sw=2))
        b.append(t(M + 113, y + 66, name, size=28, weight=600, anchor="middle"))
        for i, cell in enumerate([see, cause, check]):
            b.append(t(xs[i + 1] + 8, y + 48, cell, size=24, fill=C["ink"] if i < 2 else C["action"], weight=400 if i < 2 else 600, lh=1.2))
        y += 124
    b.append(t(M, 1286, "Find the first stage that stalls. Fix that one before adding volume.", size=26, fill=C["soft"]))
    alt = ("A diagnostic grid for where content stalls, with four columns: where it stalls, what you see, the likely cause and the first check. "
           "Ideas: blank page every week, nothing captured from calls, mine last month's call notes. Scripts: drafts sound generic, voice and claims "
           "not written down, check the Brand Brain. Recording: sessions keep slipping, setup friction and no fixed slot, book one recurring slot. "
           "Editing: cuts come back wrong, no agreed editing standard, agree examples before cutting. Approvals: pieces wait for sign-off, one "
           "approver and no backup, name a backup approver. Publishing: approved but not live, manual posting falls through, schedule when approved. "
           "Learning: same result every week, no expected versus actual, freeze a forecast before posting. Find the first stage that stalls and fix "
           "that one before adding volume.")
    return svg(12, ["Where content", "actually stalls"], b, alt, tag="A checklist, not data"), alt


# ---------------------------------------------------------------- 13 attribution evidence ladder
def g13():
    rungs = [
        ("DIRECTLY_TRACKED", "Directly tracked", "A tracked link or code ties the enquiry to the piece.", C["mint"]),
        ("BUYER_NAMED_CLIENT_ATTRIBUTED", "Buyer named it", "The buyer told the client which piece brought them.", C["sky"]),
        ("MULTI_TOUCH_INFLUENCED", "Multi-touch influenced", "Several pieces touched the path; none alone.", C["butter"]),
        ("ASSOCIATED_CORRELATED", "Associated / correlated", "Moved together in time; cause not shown.", C["peach"]),
        ("QUALITATIVE_ONLY", "Qualitative only", "A comment or impression, not counted.", C["lilac"]),
    ]
    b = [
        line(M + 18, 1200, M + 18, 372, arrow=True, color=C["action"]),
        t(M + 44, 364, "STRONGER EVIDENCE", size=20, weight=600, fill=C["action"], ls="2"),
    ]
    y = 404
    for k, (code, name, meaning, f) in enumerate(rungs):
        x = M + 60 + k * 36
        w = W - M - x
        b.append(rect(x, y, w, 146, f, r=22, stroke=C["ink"]))
        b.append(t(x + 30, y + 44, code, size=20, weight=600, fill=C["soft"], ls="1.5"))
        b.append(t(x + 30, y + 88, name, size=32, weight=600))
        b.append(t(x + 30, y + 126, meaning, size=24, fill=C["soft"]))
        y += 164
    b.append(t(M, 1266, "Every result carries its class. Do not overclaim causality.", size=28, weight=600))
    b.append(t(M, 1312, "Organic content is not paid media: most results sit on the lower rungs.", size=24, fill=C["soft"]))
    alt = ("An evidence ladder from strongest to weakest. Directly tracked: a tracked link or code ties the enquiry to the piece. Buyer named it "
           "(buyer-named, client-attributed): the buyer told the client which piece brought them. Multi-touch influenced: several pieces touched the "
           "path, none alone. Associated or correlated: moved together in time, cause not shown. Qualitative only: a comment or impression, not counted. "
           "Every result carries its class; do not overclaim causality. Organic content is not paid media, so most results sit on the lower rungs.")
    return svg(13, ["How strong is", "the evidence?"], b, alt), alt


# ---------------------------------------------------------------- 14 proof / case-study template
def g14():
    b = [
        rect(M, 336, W - 2 * M, 944, C["panel"], r=32, stroke=C["ink"]),
        rect(W - M - 250, 360, 220, 56, C["night"], r=28),
        t(W - M - 140, 397, "TEMPLATE", size=22, weight=600, fill=C["panel"], anchor="middle", ls="3"),
        t(M + 40, 398, "{{client}}  ·  {{sector}}", size=34, weight=600),
        t(M + 40, 440, "Permission: {{permission status and date}}", size=24, fill=C["soft"]),
    ]
    blocks = [
        ("BASELINE", "{{baseline, dated}}", "Where it started, before the engagement", C["sky"], None),
        ("WHAT CHANGED", "{{what changed}}", "The intervention, in one or two lines", C["mint"], None),
        ("MEASURED RESULT", "{{measured result}}", "Measured by the platform or tracking", C["butter"], "{{evidence class}}"),
        ("CLIENT-REPORTED", "{{client-reported}}", "What the client says happened commercially", C["peach"], None),
        ("INFERENCE", "{{inference}}", "Our reading, labelled as a reading, not a measurement", C["lilac"], None),
    ]
    y = 478
    for lab, ph, sub, f, chip in blocks:
        b.append(rect(M + 30, y, W - 2 * M - 60, 142, f, r=20, stroke=C["ink"], sw=2))
        b.append(t(M + 60, y + 42, lab, size=20, weight=600, fill=C["soft"], ls="2"))
        b.append(t(M + 60, y + 88, ph, size=30, weight=600))
        b.append(t(M + 60, y + 124, sub, size=24, fill=C["soft"]))
        if chip:
            b.append(rect(W - M - 330, y + 22, 270, 48, C["panel"], r=24, stroke=C["ink"], sw=2))
            b.append(t(W - M - 195, y + 54, chip, size=22, weight=600, anchor="middle"))
        y += 156
    b.append(t(M, 1340, "Publish only with written permission. Keep measured, reported and inferred apart.", size=24, fill=C["soft"]))
    alt = ("A case-study layout template containing placeholders only, marked TEMPLATE: client and sector, permission status and date, then five "
           "blocks: baseline (dated, before the engagement), what changed, measured result with its evidence class, client-reported commercial "
           "outcome, and inference, labelled as a reading rather than a measurement. Publish only with written permission and keep measured, "
           "reported and inferred results apart. It contains no real results.")
    return svg(14, ["Case study layout", "(template)"], b, alt, tag="No real results: placeholders only"), alt


GRAPHICS = [
    ("01-expertise-to-qualified-demand-journey", g01),
    ("02-diagnosis-improvement-loop", g02),
    ("03-human-ai-draft-human-review", g03),
    ("04-pesto-content-mix", g04),
    ("05-content-plus-outbound-system", g05),
    ("06-views-attention-qualified-demand", g06),
    ("07-one-idea-native-formats", g07),
    ("08-sales-objections-to-content", g08),
    ("09-what-implementation-establishes", g09),
    ("10-four-week-review-cycle", g10),
    ("11-newsletter-masthead-template", g11),
    ("12-content-bottleneck-diagnostic", g12),
    ("13-attribution-evidence-ladder", g13),
    ("14-case-study-layout-template", g14),
]

FONTS = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"

if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "src"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "render"), exist_ok=True)
    alts = {}
    for name, fn in GRAPHICS:
        s, alt = fn()
        io.open(os.path.join(HERE, "src", name + ".svg"), "w", encoding="utf-8", newline="\n").write(s)
        html = ("<!doctype html><html><head><meta charset='utf-8'>"
                f"<link rel='stylesheet' href='{FONTS}'>"
                "<style>html,body{margin:0;padding:0;background:#e8f1f8;overflow:hidden}svg{display:block;width:100vw;height:auto}</style>"
                "</head><body>" + s + "</body></html>")
        io.open(os.path.join(HERE, "render", name + ".html"), "w", encoding="utf-8", newline="\n").write(html)
        alts[name] = alt
    io.open(os.path.join(HERE, "render", "alt.json"), "w", encoding="utf-8").write(json.dumps(alts, indent=1, ensure_ascii=False))

    # Contact sheet: every graphic, two rows of seven.
    figs = "".join(
        f"<figure><img src='export/{n}-1200.png' alt='{escape(alts[n], quote=True)}'><figcaption>{n}</figcaption></figure>"
        for n, _ in GRAPHICS)
    cs = ("<!doctype html><html><head><meta charset='utf-8'><title>Threadline newsletter graphics: contact sheet</title><style>"
          "body{margin:0;padding:20px;background:#fff;font:14px/1.3 Inter,system-ui,sans-serif;color:#17233a}"
          "main{display:grid;grid-template-columns:repeat(7,300px);gap:20px}figure{margin:0}"
          "img{width:300px;height:375px;display:block;border:1px solid rgba(23,35,58,.12)}"
          "figcaption{margin-top:6px;font-size:13px;color:#3b475e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
          "</style></head><body><main>" + figs + "</main></body></html>")
    io.open(os.path.join(HERE, "contact-sheet.html"), "w", encoding="utf-8", newline="\n").write(cs)
    print("wrote", len(GRAPHICS))
