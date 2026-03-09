# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important: Always update this file whenever code changes affect the architecture, line ranges, conventions, or any other details documented here.**

## Project Overview

Marketing/landing site for **Anchor Point Intelligence (API)** — a data infrastructure consulting company. The entire site is a single `index.html` file with no build system, no dependencies, and no package manager.

## Development

No build, lint, or test commands. To preview, open `index.html` in a browser. The site is hosted via GitHub Pages.

## Architecture

Everything lives in one self-contained `index.html`:

- **CSS** (lines 9–315): All styles are inline in a `<style>` block. Uses CSS custom properties defined in `:root` for the brand color palette (navy/sapphire/aegean/cerulean/sky/mist/villa/white). Responsive breakpoints at 768px and 400px.
- **HTML** (lines 317–520): Static markup with a typewriter intro overlay, four service detail pages (`svc-audit`, `svc-integration`, `svc-dashboard`, `svc-retainer`), and a home curtain containing the hero, metrics, service cards, process steps, CTA, and footer.
- **JavaScript** (lines 522–621): Two main systems:
  - **Typewriter intro**: Types out "Anchor Point Intelligence", erases to "api", then animates the text into the logo position.
  - **Curtain navigation**: `pullCurtain(id, card)` slides the home content down to reveal a service detail page; `raiseCurtain()` slides it back up. Uses a flying anchor SVG animation during the transition.

## Conventions

- Font: Josefin Sans (Google Fonts), predominantly weight 100–300
- No external JS libraries or CSS frameworks
- Inline SVG icons (anchor motif) used throughout
- Navigation between pages uses DOM show/hide with CSS transitions, not routing

## Deployment
- Hosted via Cloudflare Pages, auto-deploys on git push to main branch
- Always git pull at start of session
- Always git push when work is complete

## Purpose
Marketing site for Anchor Point Intelligence — the consulting business 
that builds dashboards like the nol-dashboard project for clients.