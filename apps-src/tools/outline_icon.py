#!/usr/bin/env python3
"""Write an app icon: teal tile, a Fraunces capital as an outline, amber dot at the top right.

The letter is converted to a path, so the SVG renders the same everywhere (favicons cannot load
web fonts). Run from apps-src once per app, then commit the SVG; the build renders the PNGs from it.

    python3 -I tools/outline_icon.py R apps/research-app/icon.svg
"""
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONT = Path(__file__).resolve().parent.parent / 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2'
SIZE = 512
CAP = 262          # letter height in px on the 512 tile
SHIFT = -12        # nudge left to balance the dot
TEAL, PAPER, AMBER = '#0C5E4E', '#F4F5F1', '#BE651F'


def num(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


def main(letter, out):
    font = instantiateVariableFont(TTFont(str(FONT)), {'wght': 600, 'opsz': 72})
    glyphs = font.getGlyphSet()
    name = font.getBestCmap()[ord(letter)]
    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    xmin, ymin, xmax, ymax = bounds.bounds
    s = CAP / (ymax - ymin)
    width = (xmax - xmin) * s
    tx = (SIZE - width) / 2 - xmin * s + SHIFT
    ty = (SIZE + CAP) / 2 + ymin * s
    pen = SVGPathPen(glyphs, ntos=num)
    glyphs[name].draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
    right, top = tx + xmax * s, (SIZE - CAP) / 2
    cx, cy, r = min(right + 36, 404), top + 4, 32
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">\n'
        f'  <rect width="{SIZE}" height="{SIZE}" rx="112" fill="{TEAL}"/>\n'
        f'  <path fill="{PAPER}" d="{pen.getCommands()}"/>\n'
        f'  <circle cx="{num(cx)}" cy="{num(cy)}" r="{r}" fill="{AMBER}"/>\n'
        f'</svg>\n'
    )
    Path(out).write_text(svg)
    print(f'{out}: letter {letter}, {width:.0f} x {CAP} px, dot at ({cx:.0f}, {cy:.0f})')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
