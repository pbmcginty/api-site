# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important: Always update this file whenever code changes affect the architecture, line ranges, conventions, or any other details documented here.**

## Project Overview

Marketing/landing site for **Anchor Point Intelligence (API)** — a data infrastructure consulting company. The entire site is a single `index.html` file with no build system, no dependencies, and no package manager.

## Development

No build, lint, or test commands. To preview, open `index.html` in a browser.

## Architecture

Everything lives in one self-contained `index.html` (~1516 lines):

- **JSON-LD** (lines 32–95): Organization + Service structured data for Google rich results.
- **CSS** (lines 97–594): All styles in a `<style>` block. CSS custom properties in `:root` for brand palette (navy/sapphire/aegean/cerulean/sky/mist/villa/white). Responsive breakpoints at 1024px (logo name hides), 768px (nav links hide, mobile layout), and 400px (single-column steps). Includes case study card styles.
- **HTML** (lines 596–1107): Typewriter intro overlay, four service detail pages (`svc-audit`, `svc-integration`, `svc-dashboard`, `svc-retainer`), home curtain (hero, metrics, service cards, process steps, case study section with animated SVG integration visual, CTA, footer), contact modal form, and flying anchor element.
- **JavaScript** (lines 1109–1516): Four systems:
  - **Typewriter intro**: Types "anchor point intelligence" (lowercase), erases to "api", morphs with gradient into logo pill position.
  - **Curtain navigation**: `pullCurtain(id, card)` — anchor wiggles then flies down, curtain slides to reveal service page. `raiseCurtain()` — restores scroll position.
  - **Booking modal**: `openModal()`/`closeModal()` — two-phase booking form (contact info → availability picker) via Google Apps Script backend.
  - **Nav scroll**: Services/Process/Case Studies links smooth-scroll to their sections.

## Conventions

- Font: Montserrat (Google Fonts), base weight 400, also uses 100/200/300/600
- No external JS libraries or CSS frameworks
- ⚓ emoji used as anchor icon throughout (replaced inline SVGs)
- Anchor bounce animation class: `.anchor-loading`
- Navigation between pages uses DOM show/hide with CSS transitions, not routing
- Logo pill uses gradient text matching intro animation

## Booking System (LIVE)
- Two-phase modal: contact info + software stack → real-time availability picker
- Google Apps Script backend: doGet (slots), doPost (booking)
- Calendar: patrick@anchorpointintelligence.com
- Business hours: Mon-Fri 9AM-4PM America/Phoenix, 30min slots

## Case Study Section
- Anonymized NOL dashboard project displayed as "Multi-Location Retail"
- Animated SVG showing data flow: ACCTG/CRM/SHEETS/BANK → central ⚓ dashboard hub
- Stats: 9 data sources, 6 executive views, 5 locations
- Tags show capabilities without revealing implementation

## Analytics
- Cloudflare Web Analytics beacon prepared (commented out in index.html)
- CSP headers pre-configured for `static.cloudflareinsights.com` and `cloudflareinsights.com`
- To activate: enable in Cloudflare dashboard, get beacon token, uncomment script tag

## Security Headers
- `_headers` file for Cloudflare Pages with CSP, HSTS, X-Frame-Options, etc.
- CSP allows: Google Fonts, Google Apps Script (+ googleusercontent.com redirect), Cloudflare challenges, Cloudflare analytics

## Deployment
- Hosted via Cloudflare Pages, auto-deploys on git push to main branch
- Always git pull at start of session
- Always git push when work is complete

## Purpose
Marketing site for Anchor Point Intelligence — the consulting business
that builds dashboards like the nol-dashboard project for clients.
