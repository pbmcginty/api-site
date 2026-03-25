# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important: Always update this file whenever code changes affect the architecture, line ranges, conventions, or any other details documented here.**

## Project Overview

Marketing/landing site for **Anchor Point Intelligence (API)** — a data infrastructure consulting company. The entire site is a single `index.html` file with no build system, no dependencies, and no package manager. Apple-style design aesthetic: clean, premium, generous white space.

## Development

No build, lint, or test commands. To preview, open `index.html` in a browser.

## Architecture

Everything lives in one self-contained `index.html`:

- **JSON-LD** (lines 34–97): Organization + Service structured data for Google rich results.
- **CSS** (lines 99–440): All styles in a `<style>` block. CSS custom properties in `:root` for monochromatic palette (black/gray-dark/gray/gray-light/gray-border/off-white/white + accent navy tones). Responsive breakpoints at 768px (nav links hide, single-column layout) and 480px (single-column process grid).
- **HTML** (lines 442–880): Frosted glass nav bar, full-viewport hero (instant render, no animation), metrics bar, three service feature rows (Apple-style alternating layout with inline SVG illustrations), 4-step process grid, case study card with animated buoy SVG, testimonial placeholder section (TODO), CTA section, minimal footer, contact modal form.
- **JavaScript** (lines 882+): Three systems:
  - **Scroll reveal**: IntersectionObserver adds `.visible` class for fade-up animations on `.reveal` elements.
  - **Booking modal**: `openModal()`/`closeModal()` — two-phase booking form (contact info → availability picker) via Google Apps Script backend.
  - **Buoy rope tracker**: requestAnimationFrame loop drawing SVG lines from anchor hub to animated buoy positions.

## Conventions

- Font: Inter (Google Fonts), weights 300/400/500/600/700
- No external JS libraries or CSS frameworks
- Apple-style aesthetic: white backgrounds, deep black text, single navy accent color, pill-shaped buttons (border-radius: 980px)
- Frosted glass nav bar (backdrop-filter blur)
- Scroll-triggered section reveals via IntersectionObserver (`.reveal` → `.visible`)
- Services displayed as alternating feature rows (image-left/text-right, text-left/image-right) with `.feature-row.reversed`
- ⚓ emoji used as anchor icon throughout
- Anchor bounce animation class: `.anchor-loading`
- Navigation uses anchor links with smooth scroll (html { scroll-behavior: smooth })

## Booking System (LIVE)
- Two-phase modal: contact info + software stack → real-time availability picker
- Google Apps Script backend: doGet (slots), doPost (booking)
- Calendar: patrick@anchorpointintelligence.com
- Business hours: Mon-Fri 9AM-4PM America/Phoenix, 30min slots

## Case Study Section
- Anonymized NOL dashboard project displayed as "Multi-Location Retail"
- Animated SVG showing data flow: ERP/CRM/AP-AR/PAYROLL/WMS/POS → central ⚓ dashboard hub
- Life preserver buoy animations with rope tracking
- Stats: 9 data sources, 6 executive views, 5 locations
- Tags show capabilities without revealing implementation

## Testimonials Section
- TODO: Placeholder section exists with two cards
- Replace placeholder quotes with real client testimonials when available
- `.todo-badge` marks the section as needing real content

## Analytics
- Cloudflare Web Analytics beacon prepared (currently not in HTML — re-add when ready)
- CSP headers pre-configured for `static.cloudflareinsights.com` and `cloudflareinsights.com`
- To activate: enable in Cloudflare dashboard, get beacon token, add script tag

## Security Headers
- `_headers` file for Cloudflare Pages with CSP, HSTS, X-Frame-Options, etc.
- CSP allows: Google Fonts, Google Apps Script (+ googleusercontent.com redirect), Cloudflare challenges, Cloudflare analytics

## SEO
- Canonical URL, meta description, robots tag in `<head>`
- `robots.txt` and `sitemap.xml` at root
- JSON-LD structured data (Organization + 4 Services)
- OG + Twitter Card meta tags for social sharing

## Deployment
- Hosted via Cloudflare Pages, auto-deploys on git push to main branch
- Always git pull at start of session
- Always git push when work is complete

## Purpose
Marketing site for Anchor Point Intelligence — the consulting business
that builds dashboards like the nol-dashboard project for clients.
