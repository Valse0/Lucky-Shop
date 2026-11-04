# Lucky Shop Asset Rules

## Sources
- Claude ZIP (~12 MB): inspect symbol/icon candidates.
- Dola ZIP (~24 MB): inspect extracted reference UI, panels, decorative and background candidates.
Both are candidate sources; neither is automatically approved.

## Review checklist
- Is the asset visually close to the reference?
- Is it sharp at intended display size?
- Is alpha transparency real and clean?
- Are edges clean, with no matte halo?
- Is the object fully inside the canvas?
- Does its lighting/perspective/material match the rest?
- Does it contain unwanted text/watermarks?
- Is it a separate usable component rather than a flattened screenshot crop?

## Art direction
Glossy, colorful premium casual fantasy game. Warm gold trim, polished wood, enamel, jewel facets, soft warm highlights, rich but controlled saturation. Maintain consistent upper-left key light and consistent perspective.

## Technical conventions
- Prefer transparent PNG/WebP.
- Symbols should be square, centered, and occupy roughly 80–88% of canvas.
- Keep source files untouched.
- Use lowercase kebab-case filenames.
- Keep text out of image assets.
- Avoid CSS filters that recolor the full symbol.
- Record all approved files in `assets-manifest.json`.

## Suggested normalized layout
public/assets/
  symbols/
  ui/
  panels/
  backgrounds/
  effects/
  icons/
assets-manifest.json

Adapt paths to the existing project instead of forcing this exact structure.
