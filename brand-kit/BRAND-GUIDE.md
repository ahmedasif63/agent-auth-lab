# Agent Auth Lab — Brand Guide

## The mark

The mark is a shield with a keyhole cut through its center. Both halves of that
sentence are doing real work.

The shield is the oldest, most universally understood symbol for protection.
The keyhole is the oldest, most universally understood symbol for controlled
access. Put together, they say exactly what this project is about at a glance,
even to someone who has never heard the term "agent authorization" in their
life: something is being protected, and getting in requires a specific key.

That second part matters more than it looks. The keyhole isn't decoration,
it's the actual thesis of the project rendered as geometry: access isn't
open, and it isn't free, it goes through a specific, narrow checkpoint. As
the project grows through its later stages (real identity, delegation,
per-action policy, trust scoring), the mark doesn't need to change. It
already says "controlled access," which is true at every stage.

## Why it's built this way

Good marks hold one idea and hold it cleanly, rather than illustrating every
feature of the project in the icon itself. An early version of this mark
tried to work in a second idea (multiple discrete authorization checks,
rather than one login) directly into the geometry, and it made the shape
read as clutter instead of a symbol. That idea still matters, it's real and
it's central to the project, it just belongs in this document and in how you
talk about the project, not crammed into the icon. A logo's job is to be
recognized in a fifth of a second, not to explain the whole thesis.

The shape is built from plain geometry (arcs and straight lines, no
illustration, no gradients baked into the mark itself) specifically so it
scales cleanly from a 1024px app icon down to a 16px browser favicon without
losing legibility. That was tested directly, not assumed.

## Color

| Name | Hex | Use |
|---|---|---|
| Accent Blue | `#0071E3` | Primary mark color, interactive elements, links |
| Ink | `#1D1D1F` | Primary text, dark monochrome mark variant |
| Background | `#F5F5F7` | App background (light mode) |
| White | `#FFFFFF` | Light monochrome mark variant, dark-mode text |
| Warning | `#FF9500` / `#FF3B30` | Reserved strictly for real security warnings in the UI. Never used decoratively, never used in the logo. |

One accent color, used sparingly. This is deliberate, not a limitation. Apple's
own systems use color as a signal, not as decoration, restraint is what makes
the accent color mean something when it does appear.

## Typography

**Inter** is used throughout this kit as an open, freely-licensed stand-in for
San Francisco. The live product itself should keep using the system font
stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display"`)
so it renders in real SF on every Apple device automatically. Inter is a
close relative of SF by design intent (both are neutral, grotesque-style
systems fonts built for UI at small sizes) and is what was used to typeset
the wordmark files in this kit, since SF itself can't be freely redistributed.

Wordmark weight: **Semibold (600)**, not Bold. Bold reads as loud and
generic; Semibold reads as considered, which matches the rest of the mark.

## Files in this kit

- `icon/` — the shield mark alone, as SVG (infinitely scalable, edit-safe) and
  PNG at 1024/512/256/128px, in three colorways: accent blue, ink (for light
  backgrounds), white (for dark backgrounds or the app-icon treatment).
- `app-icon/` — the shield mark on a rounded-square gradient background, sized
  and shaped like a real macOS/iOS app icon (1024 down to 128px, plus 180px
  for iOS home-screen use).
- `wordmark/` — the icon and "Agent Auth Lab" text combined into one lockup,
  as SVG and PNG, in light-background, dark-background, and transparent
  versions.
- `favicon/` — a ready-to-use `favicon.ico` (16/32/64px bundled together) plus
  standalone 16px and 32px PNGs, for dropping straight into the site's `<head>`.

## Usage rules

Keep clear space around the mark equal to roughly a quarter of its own width
on every side, don't crowd it against edges or other elements. Never
recolor the mark outside the three provided colorways. Never stretch or
skew it, if it needs to be a different size, scale both dimensions equally.
On any background that isn't clean white, near-white, dark ink, or near-black,
check contrast before use, the three colorways were built for exactly those
conditions. Don't add a drop shadow, outline, or additional effects to the
mark itself, the app-icon version's gradient background already carries the
depth this brand needs.
