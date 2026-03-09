# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important: Always update this file whenever code changes affect the architecture, line ranges, conventions, or any other details documented here.**

## Project Overview

Marketing/landing site for **Anchor Point Intelligence (API)** — a data infrastructure consulting company. The entire site is a single `index.html` file with no build system, no dependencies, and no package manager.

## Development

No build, lint, or test commands. To preview, open `index.html` in a browser.

## Architecture

Everything lives in one self-contained `index.html` (~815 lines):

- **CSS** (lines 9–393): All styles in a `<style>` block. CSS custom properties in `:root` for brand palette (navy/sapphire/aegean/cerulean/sky/mist/villa/white). Responsive breakpoints at 1024px (logo name hides), 768px (nav links hide, mobile layout), and 400px (single-column steps).
- **HTML** (lines 395–622): Typewriter intro overlay, four service detail pages (`svc-audit`, `svc-integration`, `svc-dashboard`, `svc-retainer`), contact modal form, home curtain (hero, metrics, service cards, process steps, CTA, footer), and flying anchor element.
- **JavaScript** (lines 624–815): Four systems:
  - **Typewriter intro**: Types "anchor point intelligence" (lowercase), erases to "api", morphs with gradient into logo pill position.
  - **Curtain navigation**: `pullCurtain(id, card)` — anchor wiggles then flies down, curtain slides to reveal service page. `raiseCurtain()` — restores scroll position.
  - **Contact modal**: `openModal()`/`closeModal()` — form submits to Formsubmit.co (temporary, will be replaced by Google Apps Script booking system).
  - **Nav scroll**: Services/Process/Case Studies links smooth-scroll to their sections.

## Conventions

- Font: Montserrat (Google Fonts), base weight 400, also uses 100/200/300/600
- No external JS libraries or CSS frameworks
- ⚓ emoji used as anchor icon throughout (replaced inline SVGs)
- Anchor bounce animation class: `.anchor-loading`
- Navigation between pages uses DOM show/hide with CSS transitions, not routing
- Logo pill uses gradient text matching intro animation

## Contact Form (temporary)
- Formsubmit.co endpoint: pmcginty@officeliquidation.com
- Regular form POST (not AJAX)
- Needs initial email verification (first submit triggers it)
- Will be replaced by Google Apps Script booking system (see memory/booking-system-plan.md)

## Deployment
- Hosted via Cloudflare Pages, auto-deploys on git push to main branch
- Always git pull at start of session
- Always git push when work is complete

## Purpose
Marketing site for Anchor Point Intelligence — the consulting business
that builds dashboards like the nol-dashboard project for clients.
