"""Generates Ember's Lottie animations (brand colors, original artwork).

The files are plain Lottie JSON: they play in Flutter (package `lottie`), on the web (lottie-web)
and can be opened / edited in the LottieFiles editor. To use an animation from LottieFiles instead,
download its Lottie JSON and save it under the same file name.

Run from the repository root:  python tools/lottie/make_lottie.py
Writes to: public/lottie/*.json and mobile/assets/lottie/*.json
"""
import json
import math
import os

ORANGE = [252 / 255, 138 / 255, 6 / 255, 1]
NAVY = [3 / 255, 8 / 255, 31 / 255, 1]
GREEN = [2 / 255, 134 / 255, 67 / 255, 1]
GRAY = [217 / 255, 217 / 255, 217 / 255, 1]
LIGHT = [246 / 255, 246 / 255, 246 / 255, 1]
WHITE = [1, 1, 1, 1]
RED = [208 / 255, 49 / 255, 49 / 255, 1]

W = H = 240
FR = 30


# ---------- tiny Lottie builder ----------
def static(v):
    return {"a": 0, "k": v}


def anim(keys, ease=True):
    """keys: [(frame, value), ...]; value is a number or list. Smooth ease-in-out between keys."""
    out = []
    for i, (t, v) in enumerate(keys):
        vv = v if isinstance(v, list) else [v]
        k = {"t": t, "s": vv}
        if i < len(keys) - 1:
            n = len(vv)
            k["o"] = {"x": [0.42] * n, "y": [0] * n} if ease else {"x": [0] * n, "y": [0] * n}
            k["i"] = {"x": [0.58] * n, "y": [1] * n} if ease else {"x": [1] * n, "y": [1] * n}
        out.append(k)
    return {"a": 1, "k": out}


def tr(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    def wrap(v):
        return v if isinstance(v, dict) else static(list(v) if isinstance(v, tuple) else v)
    return {"ty": "tr", "p": wrap(p), "a": wrap(a), "s": wrap(s), "r": wrap(r), "o": wrap(o), "sk": static(0), "sa": static(0)}


def group(name, items, transform=None):
    return {"ty": "gr", "nm": name, "it": items + [transform or tr()]}


def ellipse(cx, cy, w, h):
    return {"ty": "el", "p": static([cx, cy]), "s": static([w, h]), "d": 1}


def rect(cx, cy, w, h, r=0):
    return {"ty": "rc", "p": static([cx, cy]), "s": static([w, h]), "r": static(r), "d": 1}


def path(points, closed=False, tangents=None):
    """points: [(x, y), ...]; tangents: optional [(in(dx,dy), out(dx,dy)), ...] for curves."""
    ins = [list(t[0]) for t in tangents] if tangents else [[0, 0] for _ in points]
    outs = [list(t[1]) for t in tangents] if tangents else [[0, 0] for _ in points]
    return {"ty": "sh", "ks": static({"i": ins, "o": outs, "v": [list(p) for p in points], "c": closed}), "d": 1}


def arc(cx, cy, r, a0, a1, steps=8):
    """Circular arc as a smooth bezier path (angles in degrees, 0 = right, clockwise in screen coords)."""
    pts, tans = [], []
    seg = math.radians(a1 - a0) / steps
    k = 4 / 3 * math.tan(seg / 4) * r
    for i in range(steps + 1):
        a = math.radians(a0) + seg * i
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        tx, ty = -math.sin(a) * k, math.cos(a) * k
        pts.append((x, y))
        tans.append(((-tx, -ty), (tx, ty)))
    return path(pts, False, tans)


def fill(c, o=100):
    return {"ty": "fl", "c": static(c), "o": o if isinstance(o, dict) else static(o), "r": 1}


def stroke(c, w, o=100):
    return {"ty": "st", "c": static(c), "o": o if isinstance(o, dict) else static(o), "w": static(w), "lc": 2, "lj": 2}


def trim(end, start=None):
    return {"ty": "tm", "s": start or static(0), "e": end, "o": static(0), "m": 1}


def layer(ind, name, shapes, op, p=(W / 2, H / 2), a=(0, 0), s=(100, 100), r=0, o=100):
    def wrap(v, dims):
        if isinstance(v, dict):
            return v
        return static(list(v) + [0] * (dims - len(v)) if isinstance(v, tuple) else v)
    return {
        "ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1,
        "ks": {"o": wrap(o, 1), "r": wrap(r, 1), "p": wrap(p, 3), "a": wrap(a, 3), "s": wrap(s, 3)},
        "ao": 0, "shapes": shapes, "ip": 0, "op": op, "st": 0, "bm": 0,
    }


def comp(name, op, layers):
    # Lottie draws the first layer on top — callers pass layers top-first
    for i, l in enumerate(layers):
        l["ind"] = i + 1
    return {"v": "5.7.4", "fr": FR, "ip": 0, "op": op, "w": W, "h": H, "nm": name, "ddd": 0, "assets": [], "layers": layers}


FLAME = [(50, 4), (86, 84), (50, 136), (14, 86), (34, 44), (48, 74)]
FLAME_T = [((0, 0), (8, 26)), ((0, -38), (0, 28)), ((20, 0), (-20, 0)), ((0, 26), (0, -20)), ((-10, 10), (0, 16)), ((-8, -4), (-6, -22))]
INNER = [(50, 72), (68, 110), (50, 130), (32, 110)]
INNER_T = [((0, 0), (6, 14)), ((0, -16), (0, 12)), ((10, 0), (-10, 0)), ((0, 12), (0, -12))]


def flame_shapes(color_outer, color_inner):
    """Ember flame (designed in a 100x140 box, anchor at bottom center 50,136)."""
    return [
        group("inner", [path(INNER, True, INNER_T), fill(color_inner)]),
        group("outer", [path(FLAME, True, FLAME_T), fill(color_outer)]),
    ]


# ---------- animations ----------
def loader():
    op = 45
    tile = layer(0, "tile", [group("tile", [rect(0, 0, 150, 150, 34), fill(ORANGE)])], op,
                 s=anim([(0, [100, 100]), (22, [104, 104]), (44, [100, 100])]))
    flame = layer(0, "flame", flame_shapes(NAVY, ORANGE), op, p=(120, 168), a=(50, 136),
                  s=anim([(0, [100, 100]), (8, [94, 110]), (16, [104, 96]), (26, [96, 108]), (36, [102, 98]), (44, [100, 100])]),
                  r=anim([(0, 0), (11, -4), (22, 3), (33, -2), (44, 0)]))
    return comp("Ember loader", op, [flame, tile])


def empty_basket():
    op = 90
    # first item is drawn on top: rim, slats, body, handle (behind)
    basket = [
        group("rim", [rect(0, 0, 160, 16, 8), fill(ORANGE)]),
        group("slats", [path([(-24, 18), (-20, 62)]), path([(0, 18), (0, 62)]), path([(24, 18), (20, 62)]), stroke(NAVY, 7)]),
        group("body", [path([(-70, 0), (70, 0), (52, 78), (-52, 78)], True), fill(WHITE), stroke(NAVY, 9)]),
        group("handle", [arc(0, 0, 46, 200, 340, 10), stroke(NAVY, 9)]),
    ]
    swing = layer(0, "basket", basket, op, p=(120, 112), a=(0, -40),
                  r=anim([(0, -7), (45, 7), (90, -7)]))
    shadow = layer(0, "shadow", [group("shadow", [ellipse(0, 0, 120, 14), fill(GRAY)])], op, p=(120, 206),
                   s=anim([(0, [100, 100]), (22, [86, 100]), (45, [100, 100]), (67, [86, 100]), (90, [100, 100])]))
    crumbs = []
    for i, (x, delay) in enumerate([(-30, 0), (0, 15), (30, 30)]):
        crumbs.append(layer(0, f"dot{i}", [group("d", [ellipse(0, 0, 12, 12), fill(ORANGE)])], op,
                            p=anim([(delay, [120 + x, 70]), (delay + 20, [120 + x, 40]), (delay + 40, [120 + x, 70])]),
                            o=anim([(delay, 0), (delay + 10, 100), (delay + 35, 100), (delay + 40, 0)])))
    return comp("Empty basket", op, crumbs + [swing, shadow])


def not_found():
    op = 120
    plate = layer(0, "plate", [
        group("inner", [ellipse(0, 0, 110, 110), fill(WHITE), stroke(GRAY, 4)]),
        group("outer", [ellipse(0, 0, 160, 160), fill(LIGHT), stroke(GRAY, 6)]),
    ], op, p=(120, 132))
    fork = layer(0, "fork", [group("fork", [path([(0, -60), (0, 60)]), path([(-10, -60), (-10, -30), (10, -30), (10, -60)]), stroke(GRAY, 6)])], op, p=(30, 132))
    knife = layer(0, "knife", [group("knife", [path([(0, -60), (0, 60)]), path([(0, -60), (10, -40), (0, -20)]), stroke(GRAY, 6)])], op, p=(210, 132))
    glass = [
        group("lens", [ellipse(0, 0, 70, 70), fill([1, 1, 1, 1], 60), stroke(NAVY, 10)]),
        group("shine", [arc(0, 0, 22, 200, 260, 4), stroke(WHITE, 6)]),
        group("handle", [path([(26, 26), (58, 58)]), stroke(ORANGE, 16)]),
    ]
    mag = layer(0, "magnifier", glass, op,
                p=anim([(0, [95, 115]), (30, [150, 105]), (60, [150, 160]), (90, [95, 160]), (120, [95, 115])]),
                r=anim([(0, -8), (30, 8), (60, -6), (90, 6), (120, -8)]))
    q = layer(0, "question", [
        group("dot", [ellipse(0, 22, 12, 12), fill(ORANGE)]),
        group("hook", [path([(-14, -16), (0, -28), (14, -16), (0, 0), (0, 8)], False,
                            [((0, 0), (0, -8)), ((-8, 0), (8, 0)), ((0, -8), (0, 8)), ((6, -4), (0, 4)), ((0, -2), (0, 0))]),
                       stroke(ORANGE, 8)]),
    ], op, p=(196, 52), s=anim([(0, [100, 100]), (15, [118, 118]), (30, [100, 100]), (120, [100, 100])]),
        o=anim([(0, 60), (15, 100), (60, 100), (90, 60), (120, 60)]))
    return comp("Not found", op, [q, mag, fork, knife, plate])


def no_internet():
    op = 90
    layers = []
    radii = [(26, 0), (52, 10), (78, 20)]
    for i, (r, d) in enumerate(radii):
        layers.append(layer(0, f"arc{i}", [group("a", [arc(0, 0, r, 225, 315, 6), stroke(NAVY, 12)])], op, p=(120, 160),
                            o=anim([(d, 20), (d + 12, 100), (d + 40, 100), (d + 52, 20), (90, 20)])))
    dot = layer(0, "dot", [group("d", [ellipse(0, 0, 22, 22), fill(ORANGE)])], op, p=(120, 160),
                s=anim([(0, [100, 100]), (10, [130, 130]), (20, [100, 100]), (90, [100, 100])]))
    slash = layer(0, "slash", [group("s", [path([(-70, -70), (70, 70)]), trim(anim([(30, 0), (50, 100), (90, 100)])), stroke(RED, 12)])], op, p=(120, 120))
    bg = layer(0, "bg", [group("c", [ellipse(0, 0, 200, 200), fill(LIGHT)])], op, p=(120, 120))
    return comp("No internet", op, [slash, dot] + layers + [bg])


def success():
    op = 60
    circle = layer(0, "circle", [group("c", [ellipse(0, 0, 150, 150), fill(GREEN)])], op, p=(120, 120),
                   s=anim([(0, [0, 0]), (14, [112, 112]), (22, [100, 100]), (60, [100, 100])]))
    check = layer(0, "check", [group("k", [path([(-34, 0), (-10, 24), (36, -24)]), trim(anim([(14, 0), (34, 100), (60, 100)])), stroke(WHITE, 14)])], op, p=(120, 122))
    ring = layer(0, "ring", [group("r", [ellipse(0, 0, 150, 150), stroke(GREEN, 6)])], op, p=(120, 120),
                 s=anim([(12, [100, 100]), (40, [150, 150]), (60, [150, 150])]), o=anim([(0, 0), (12, 0), (14, 80), (40, 0), (60, 0)]))
    dots = []
    for i in range(8):
        a = math.radians(i * 45)
        dots.append(layer(0, f"spark{i}", [group("d", [ellipse(0, 0, 10, 10), fill(ORANGE if i % 2 else GREEN)])], op,
                          p=anim([(16, [120 + 70 * math.cos(a), 120 + 70 * math.sin(a)]), (36, [120 + 104 * math.cos(a), 120 + 104 * math.sin(a)]), (60, [120 + 104 * math.cos(a), 120 + 104 * math.sin(a)])]),
                          o=anim([(16, 0), (22, 100), (36, 0), (60, 0)])))
    return comp("Success", op, [check, circle, ring] + dots)


def delivery():
    op = 30
    def wheel(name, x):
        spokes = [path([(0, -14), (0, 14)]), path([(-14, 0), (14, 0)])]
        return layer(0, name, [
            group("spokes", spokes + [stroke(GRAY, 4)]),
            group("tyre", [ellipse(0, 0, 40, 40), stroke(NAVY, 9)]),
        ], op, p=(x, 172), r=anim([(0, 0), (30, 360)], ease=False))
    body = layer(0, "scooter", [
        group("box", [rect(-30, -46, 54, 46, 6), fill(ORANGE)]),
        group("flame", [path([(-30, -60), (-22, -44), (-30, -34), (-38, -44)], True), fill(NAVY)]),
        group("seat", [rect(-14, -14, 60, 12, 6), fill(NAVY)]),
        group("frame", [path([(-50, 10), (40, 10), (58, -40), (70, -40)]), stroke(NAVY, 10)]),
        group("deck", [path([(-60, 10), (-30, 10)]), stroke(NAVY, 12)]),
    ], op, p=anim([(0, [120, 162]), (15, [120, 158]), (30, [120, 162])]))
    lines = []
    for i, (y, d) in enumerate([(120, 0), (140, 10), (160, 20)]):
        lines.append(layer(0, f"speed{i}", [group("l", [path([(0, 0), (30, 0)]), stroke(GRAY, 6)])], op,
                           p=anim([(d % 30, [60, y]), ((d % 30) + 15, [20, y])], ease=False),
                           o=anim([(d % 30, 100), ((d % 30) + 15, 0)], ease=False)))
    road = layer(0, "road", [group("r", [path([(-100, 0), (100, 0)]), stroke(GRAY, 4)])], op, p=(120, 196))
    return comp("Delivery", op, [body, wheel("wheel_back", 72), wheel("wheel_front", 182)] + lines + [road])


ANIMATIONS = {
    "loader": loader, "empty_basket": empty_basket, "not_found": not_found,
    "no_internet": no_internet, "success": success, "delivery": delivery,
}

if __name__ == "__main__":
    outs = ["public/lottie", "mobile/assets/lottie"]
    for d in outs:
        os.makedirs(d, exist_ok=True)
    for name, fn in ANIMATIONS.items():
        data = json.dumps(fn(), separators=(",", ":"))
        for d in outs:
            with open(os.path.join(d, f"{name}.json"), "w", encoding="utf-8") as f:
                f.write(data)
        print(f"{name}.json  {len(data) / 1024:.1f} KB")
