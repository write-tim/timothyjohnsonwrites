---
title: "Living Docs-as-Code: Architecting a 'Meta' Documentation Blueprint"
subtitle: How to pair Astro, Starlight, and Sveltia CMS into a zero-backend, Git-backed design system that bridges engineers and technical writers.
description: 'An architectural case study of docs.timothyjohnsonwrites.com: building a living documentation site about writing documentation using Astro, Starlight, Sveltia CMS, and automated CI/CD quality gates.'
date: 2026-09-12T00:00:00-05:00
updated: ''
category: tech
author: Timothy Johnson
tags:
  - docs-as-code
  - sveltia-cms
  - astro
  - starlight
  - technical-writing
  - architecture
coverImage: /assets/blog/docs_as_code.jpg
draft: false
---

A long-standing philosophical divide exists in technical communication.

On one side stand **Docs-as-Code purists**: engineers and technical writers who believe all documentation belongs directly in Git. Content lives in Markdown and MDX files, taxonomy is governed by YAML frontmatter, peer review happens in Pull Requests, and deployments run through automated CI/CD pipelines. This model is rock-solid, eliminates vendor lock-in, and costs next to nothing to host on static infrastructure.

On the other side stand **subject matter experts (SMEs), product managers, and non-engineering contributors**: writers who want to fix a typo, draft an article, or upload an asset without cloning a git repository, fighting with merge conflicts, installing Node dependencies, or managing a local development server.

Traditional attempts to bridge this gap usually compromise on either developer autonomy (forcing teams into walled-garden SaaS tools like Confluence or proprietary headless CMS platforms) or writer experience (asking non-technical contributors to write raw Markdown in terminal editors).

To demonstrate how modern web tooling can eliminate this compromise entirely, I designed, architected, and deployed the [**Docs-as-Code Blueprint**](https://docs.timothyjohnsonwrites.com/) ([docs.timothyjohnsonwrites.com](https://docs.timothyjohnsonwrites.com/)).

This article details the architecture, design principles, and platform engineering decisions behind building this living "meta" documentation system.

***

## 1. What is a "Meta" Documentation Site?

The Docs-as-Code Blueprint is a **documentation site about writing documentation**. It serves a dual purpose:

1. **A Technical Writing Style Guide & Operational Manual**: It establishes editorial voice and tone, grammar contracts, terminology word lists, and component standards for contributors.
2. **A Living Component Specimen & Architecture Showcase**: It renders interactive UI components side by side with their raw MDX source code and the exact CMS configuration required to produce them.

Instead of writing static prose describing how a component should look, the site serves as its own sandbox. A technical writer or engineer can see a live `<Aside>`, `<Tabs>`, `<FileTree>`, or `<Steps>` element rendered on the page, inspect the underlying markup, and understand how the visual CMS serializes it into Git.

```plain
┌────────────────────────────────────────────────────────┐
│               Living Docs-as-Code System               │
├──────────────────────────┬─────────────────────────────┤
│   Engineering Core       │   Editorial Surface         │
│   • Git Repository       │   • Sveltia Visual CMS      │
│   • Astro + Starlight    │   • Style Guide & Standards │
│   • Zod Schemas          │   • Custom Editor Dialogs   │
│   • Vale & Lychee CI/CD  │   • Zero Local Dev Needed   │
└──────────────────────────┴─────────────────────────────┘
```

***

## 2. The Modern Jamstack Toolchain

To ensure absolute independence, instant page loads, and zero operational overhead, the Blueprint runs on a completely serverless static stack:

- [**Astro**](https://astro.build/) **&** [**Starlight**](https://starlight.astro.build/): The static compilation engine. Astro transforms raw Markdown and MDX files into zero-JS static HTML, while Starlight delivers accessible navigation sidebars, native dark mode, and client-side search via [Pagefind](https://pagefind.app/).
- [**Sveltia CMS**](https://github.com/sveltia/sveltia-cms): A modern, lightweight, Svelte-powered visual CMS that operates entirely in the browser as a static Single Page Application (`/admin/`). It commits directly to GitHub without requiring a database backend.
- **GitHub & GitHub Actions**: The version control vault and automated CI/CD pipeline responsible for testing, building, and deploying the site.
- **Mermaid.js**: A text-to-diagram compiler that turns ASCII diagram definitions into responsive SVGs at build time.

Because every output is static, there are no databases to patch, no application runtimes to monitor, and zero recurring server costs.

***

## 3. The End-to-End System Flow

A robust Docs-as-Code pipeline relies on a predictable, automated lifecycle. Whether an engineer writes locally in an IDE or an author saves in Sveltia CMS, every change follows an identical, gated path:

```plain
[Author / Sveltia CMS]
         │ (Direct Git Commit or PR Branch)
         ▼
[GitHub Repository]
         │ (Webhook Trigger)
         ▼
[Automated Quality Gates]
  ├── Vale (Prose Linting)
  ├── Lychee (Link Integrity)
  └── Astro + Zod (Build & Frontmatter Check)
         │
         ▼ (Review & Merge to main)
[Global CDN Deployment]
  └── Pre-rendered static HTML/CSS/Assets
```

### The 5 Lifecycle Milestones

1. **Authoring & Commit**: Authors write in Markdown/MDX, either locally in VS Code or through the browser-based Sveltia CMS interface.
2. **Version Control & Branching**: Changes are committed to a feature branch on GitHub, opening or updating a Pull Request against `main`.
3. **Automated Quality Gates**: GitHub Actions spins up an isolated runner to execute automated linting, link checking, and type validation.
4. **Human Review & Merge**: Once automated gates pass, technical writers and peer reviewers inspect the diff and merge into `main`.
5. **Global Edge Deployment**: Compilation finishes in seconds, pushing fresh static pages globally across edge CDN nodes.

***

## 4. Bridging the Divide: Sveltia CMS Integration

The linchpin of this architecture is **Sveltia CMS**. Unlike legacy CMS tools (such as Netlify/Decap CMS), Sveltia is written in Svelte, loads instantaneously, and has zero dependency on legacy React bundles.

### Zero-Backend Architecture

Sveltia CMS runs entirely inside the client's browser from a static HTML entry point (`/admin/index.html`). 

1. **OAuth Handshake**: When an author visits `/admin/`, they log in with their GitHub credentials via a lightweight OAuth gatekeeper.
2. **API Communication**: The browser receives an OAuth token and talks directly to GitHub's REST and GraphQL APIs.
3. **Direct-to-Git Commits**: Every edit, media upload, or article draft is saved as an authentic Git commit attributed to the author.

### Custom Editor Components (Shortcodes)

Standard Markdown handles basic headings and paragraphs, but rich technical documentation requires specialized components like callout boxes (`<Aside>`), status tags (`<Badge>`), tab switchers, and file trees.

To allow non-technical writers to insert these components without memorizing MDX syntax, Sveltia CMS supports custom editor components via its JavaScript API (`CMS.registerEditorComponent`).

For example, our `<Aside>` shortcode is registered directly in the CMS initialization:

```javascript
CMS.registerEditorComponent({
  id: 'aside',
  label: 'Aside Callout',
  fields: [
    {
      name: 'type',
      label: 'Aside Type',
      widget: 'select',
      options: ['note', 'tip', 'caution', 'danger'],
      default: 'note',
    },
    {
      name: 'title',
      label: 'Custom Title (Optional)',
      widget: 'string',
      required: false,
    },
    {
      name: 'content',
      label: 'Content',
      widget: 'markdown',
    },
  ],
  pattern: /^<Aside(?:\s+type="(\w+)")?(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Aside>$/,
  fromBlock: (match) => ({
    type: match[1] || 'note',
    title: match[2] || '',
    content: match[3]?.trim() || '',
  }),
  toBlock: (obj) => {
    const titleAttr = obj.title ? ` title="${obj.title}"` : '';
    return `<Aside type="${obj.type}"${titleAttr}>\n${obj.content}\n</Aside>`;
  },
  toPreview: (obj) => `
    <div class="aside aside-${obj.type}">
      <strong>${obj.title || obj.type.toUpperCase()}</strong>
      <p>${obj.content}</p>
    </div>
  `,
});
```

When a writer clicks **Insert Aside** in the CMS toolbar, they get a friendly modal form. When saved, Sveltia serializes the form values into clean, compliant MDX that compiles natively inside Starlight.

***

## 5. Automated Quality Gates

In traditional documentation setups, quality control is manual and error-prone. Dead links go unnoticed, spelling errors reach production, and frontmatter mistakes break builds.

In the Docs-as-Code Blueprint, automated quality gates act as impartial gatekeepers in CI/CD:

### 1. Prose Linting with Vale

[Vale](https://vale.sh/) acts as a syntax and style compiler for natural language. In our `.vale.ini` configuration, prose is linted against the **Google Developer Style Guide**:

- Enforces active voice and second-person perspective ("you" rather than "we").
- Catches buzzwords, jargon, and vague language.
- Flags non-standard contractions or ambiguous phrasing.

```ini
StylesPath = .vale/styles
MinAlertLevel = warning

[*.{md,mdx}]
BasedOnStyles = Google
Google.We = suggestion
Google.Passive = warning
```

### 2. Link Integrity with Lychee

[Lychee](https://lychee.cli.rs/) is a blazingly fast link crawler written in Rust. As part of the GitHub Actions build job, Lychee scans every compiled HTML document:

- Validates internal anchors and relative paths.
- Pings external URLs to detect expired domains or 404 dead links.
- Fails the build before broken links ever reach readers.

### 3. Frontmatter & Schema Validation with Zod

Astro's Content Layer enforces strict TypeScript contracts via Zod. If an author forgets a mandatory `title`, enters an invalid date format, or provides an unrecognized category, Astro refuses to build the site:

```typescript
export const collections = {
  docs: defineCollection({
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      sidebar: z.object({
        order: z.number().optional(),
        label: z.string().optional(),
        badge: z.union([z.string(), z.record(z.any())]).optional(),
      }).optional(),
    }),
  }),
};
```

***

## 6. The "Behind the Curtain" Design System

Documentation isn't just text; it is an interface. The Blueprint includes 11 live rendered MDX components designed specifically for technical storytelling:

1. **Procedural Steps (`<Steps>`)**: Numbered milestone guides that highlight sequence without tedious manual formatting.
2. **Callouts & Asides (`<Aside>`)**: Categorized alerts (`note`, `tip`, `caution`, `danger`) that guide user attention safely.
3. **Tabs & Switchers (`<Tabs>`)**: Multi-language code snippets and platform-specific installation workflows (e.g., npm, pnpm, yarn).
4. **File Trees (`<FileTree>`)**: Visual directory hierarchies showing readers where files belong in their projects.
5. **Cards & LinkCards (`<CardGrid>`)**: Scannable navigation blocks with integrated icons.
6. **Expressive Code**: Syntax-highlighted code blocks with diff indicators (`+` / `-`), line numbers, and terminal frames.
7. **Badges & Status Tags (`<Badge>`)**: Visual metadata indicators (`New`, `Deprecated`, `Experimental`).
8. **FAQ Accordions**: Interactive disclosures that conserve vertical screen space.
9. **Dynamic Architecture Diagrams**: Build-time Mermaid graphs illustrating authentication flows and system topologies.
10. **Icon Catalog**: SVG icons integrated into headings, tables, and cards.
11. **Typography & Prose**: Scannable baseline formatting adhering to Section 508 and WCAG AAA contrast standards.

Each component page on [docs.timothyjohnsonwrites.com](https://docs.timothyjohnsonwrites.com/components/asides/) provides:

- A **live rendered specimen** demonstrating interactive behavior.
- The **raw MDX syntax** for developers working in code editors.
- The **Sveltia CMS configuration** explaining how non-technical writers interact with it visually.

***

## 7. Platform Engineering Lessons: Real-World Gotchas

Engineering a seamless decoupled architecture revealed three critical technical lessons:

### 1. Strict YAML Parsing Rules

Sveltia CMS uses a strict YAML parser. While human editors often tolerate loose formatting, strict parsers enforce a rigid distinction between _flow mapping_ (`{ key: value }`) and _block mapping_.

```yaml
# ❌ INVALID: Causes "Unexpected scalar at node end" and crashes CMS startup
hint: "Where to automatically nest this page in the site menu.",

# ✅ VALID: Block scalars must never end with trailing commas
hint: "Where to automatically nest this page in the site menu."
```

A single stray comma on a block scalar will prevent Sveltia from parsing `config.yml`. Automated YAML validation in pre-commit hooks eliminates this risk.

### 2. The 4 MB GitHub GraphQL Payload Limit

When saving content with media in Sveltia CMS, changes are committed using GitHub's GraphQL `createCommitOnBranch` mutation.

- Newly uploaded images are converted to base64 strings, increasing file size by roughly **33%**.
- GitHub's GraphQL API enforces a strict request payload ceiling of **\~4 MB**.
- If a contributor uploads an uncompressed 6 MB camera photo directly to the CMS, the request exceeds the payload limit. GitHub terminates the connection immediately without CORS headers, causing the browser to throw an opaque error:

```plain
TypeError: Failed to fetch
Access to fetch at 'https://api.github.com/graphql' has been blocked by CORS policy
```

**Solution**: Enforce client-side image compression or advise writers to keep web assets under 1920px and below 1 MB before uploading.

### 3. Client-Side Cache Invalidation (IndexedDB)

Sveltia CMS caches repository metadata, user tokens, and schema definitions in the browser's `IndexedDB` and `localStorage`. When renaming repositories or updating branch configurations, an existing browser tab can retain stale state, attempting to query outdated GitHub references. 

Performing a hard reload (**`Cmd` + `Shift` + `R`** or **`Ctrl` + `Shift` + `R`**) flushes the client cache and ensures the latest schema is parsed cleanly.

***

## 8. Summary: Why the Blueprint Matters

Treating documentation as code is often misunderstood as forcing writers to behave like software engineers. 

The [**Docs-as-Code Blueprint**](https://docs.timothyjohnsonwrites.com/) proves that you don't have to choose between developer rigor and contributor ergonomics:

- **Developers** retain complete control over Git branches, Zod schemas, pull request peer reviews, and automated CI/CD linting.
- **Writers and Subject Matter Experts** enjoy a clean, fast, visual CMS interface with pre-built component shortcodes that eliminates all Git friction.
- **Organizations** gain a resilient, lightning-fast, zero-maintenance documentation hub that costs nothing to host and never falls out of sync with software releases.

To explore the architecture, read the editorial style guide, and inspect the live component specs, visit [**docs.timothyjohnsonwrites.com**](https://docs.timothyjohnsonwrites.com/).
