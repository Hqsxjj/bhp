# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project overview

"BHP 智能快捷拨号助手" — a Cloudflare Worker app with two sub-apps:
- **拨号助手** (`src/dialer_html.js`) — customer dialer/call management
- **减肥打卡** (`src/diet_html.js`) — diet tracking check-in
- Worker logic in `src/index.js`

## 🍎 iOS 27 Design System — Permanent Standard

All UI changes MUST follow iOS design standards. See `[[ios-design-standards]]` for full details.

Quick reference:
- **Radius**: cards 16px, buttons/inputs 10px, capsule 999px
- **Borders**: 0.5px hairline globally, no thick borders
- **Colors**: text `#1c1c1e`/`#3a3a3c`/`#5c5c60`, no pure black/white
- **Font**: SF Pro first, weights 400/500/600/700 only, `letter-spacing: -0.01em`
- **Font smoothing**: `antialiased` on html
- **Touch**: standalone ≥44px, inline ≥32px

## ⛔ Global rules

- No decorative emoji/icons in UI (same as megz)
- Template literal `\n` must be `\\n` in client-side JS

## Commands

- **Preview**: `npx wrangler dev`
- **Deploy**: `npx wrangler deploy`
