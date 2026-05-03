# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important: Always update this file whenever code changes affect the architecture, line ranges, conventions, or any other details documented here.**

## Project Overview

Marketing/landing site for **Anchor Point Intelligence (API)** — a data infrastructure consulting company. The entire site is a single `index.html` file with no build system, no dependencies, and no package manager. Dark premium aesthetic with navy background, gradient text, and animated intro sequence.

## Development

No build, lint, or test commands. To preview, open `index.html` in a browser.

## Architecture

Everything lives in one self-contained `index.html`:

- **JSON-LD** (lines 34–96): Organization + Service structured data for Google rich results.
- **CSS** (lines 98–500): All styles in a `<style>` block. CSS custom properties in `:root` for dark nautical palette (navy/sapphire/aegean/cerulean/sky/mist/villa/white). Intro overlay, logo, dark nav, hero with ambient orbs, metrics, feature rows, process, case study, dark testimonials, CTA, dark modal. Responsive breakpoints at 1024px (logo name hides), 768px (nav links hide, single-column layout), 480px (single-column process grid).
- **HTML** (lines 502–780): Intro overlay (typewriter), fixed logo pill, dark gradient nav, hero with grid/orbs + problem-first headline, metrics bar, three Phase 1/2/3 service feature rows with inline SVGs, 4-step process grid, case study card with animated buoy SVG, testimonial placeholder (TODO), CTA section, dark footer, two-phase contact modal.
- **JavaScript** (lines 782+): Four systems:
  - **Typewriter + curtain**: Types "anchor point intelligence", collapses to "api", flies to logo pill, intro slides up as curtain to reveal main content.
  - **Scroll reveal**: IntersectionObserver adds `.visible` class for fade-up animations on `.reveal` elements.
  - **Booking modal**: `openModal()`/`closeModal()` — two-phase booking form (contact info → availability picker) via Google Apps Script backend.
  - **Buoy rope tracker**: requestAnimationFrame loop drawing SVG lines from anchor hub to animated buoy positions.

## Conventions

- Font: Inter (Google Fonts), weights 300/400/500/600/700
- No external JS libraries or CSS frameworks
- Dark premium aesthetic: navy backgrounds, gradient text (white→mist→sky), pill-shaped buttons (border-radius: 980px)
- Typewriter intro animation → logo morph → curtain reveal on load
- Dark gradient nav bar (transparent fade, not frosted glass)
- Scroll-triggered section reveals via IntersectionObserver (`.reveal` → `.visible`)
- Services displayed as alternating feature rows (image-left/text-right, text-left/image-right) with `.feature-row.reversed`
- Hero headline: "Your data is everywhere. Your decisions shouldn't be."
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

## Lead Gen Scraper (`lead-gen/`)
Google Apps Script system for automated lead generation. Script ID: `1FUPTqiB-I8SM7Exi6lz3xp0SeowuBREDhYkAGXu1mpWjNlXl-J8SaYA6`
Spreadsheet ID: `1zPJxSctTUZe6wOoTDd51B--4Viy-zNrAoW3p9KGKR9k`

### Architecture
- **Code.js** — Entry point, menu, config helpers, unsubscribe web endpoint
- **Scraper.js** — Google Places API + ProPublica + deep website enrichment (contacts, emails, tech stack, buying signals)
- **Email.js** — 4-step email sequence engine with open/click/reply/bounce tracking + contact promotion
- **Reports.js** — Daily digest generator
- **Setup.js** — Sheet initialization, email templates, trigger management, contact role backfill

### Leads Sheet Columns (31 total)
A=CompanyID, B=Company, C=ContactName, D=ContactTitle, E=Email, F=Phone, G=Website,
H=Address, I=City, J=State, K=Industry, L=SizeEstimate, M=Revenue, N=Source,
O=Status, P=DateFound, Q=Notes, R=Unsubscribed, S=ContactLinkedIn, T=CompanyLinkedIn,
U=Facebook, V=Instagram, W=TechStack, X=LeadScore, Y=BuyingSignals, Z=Confidence,
AA=DataVerification, AB=SeqStep, AC=LastEmailDate, AD=NextEmailDate, **AE=ContactRole**

### Contact Role System
Multiple contacts can exist per company (grouped by CompanyID). Only one is emailed at a time.
- **Primary** — The best contact, actively in email sequence
- **Queued** — Waiting in the wings, same company
- **Promoted** — Was Queued, got bumped up after Primary fell out
- Auto-promotion triggers: bounce, unsubscribe, sequence complete without reply
- Scoring: personal email > generic, named contact > anonymous, title priority (Owner > CEO > Director), LinkedIn presence

### Triggers (live)
- Scraper: 4x/day (2, 8, 14, 20 AZ time), 50 searches/run
- Reply check: 2x/day (10, 16)
- Bounce check: 1x/day (10)
- Digest: 1x/day (17)
- Email batch: DISABLED (TEST_MODE = true, trigger commented out)

### Budget
$200/month Google Places free credit, $0.04/call, 5,000 calls max. Auto-throttles via `hasBudget_()`.

## Purpose
Marketing site for Anchor Point Intelligence — the consulting business
that builds dashboards like the nol-dashboard project for clients.
