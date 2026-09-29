import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.preprocess((val) => (typeof val === 'string' && val.trim() === '' ? undefined : val), z.coerce.date().optional()),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    category: z.string().default('life'),
    author: z.string().default('Timothy Johnson'),
    mathjax: z.boolean().default(false),
    draft: z.boolean().default(false),
    attachments: z
      .array(
        z.object({
          label: z.string().optional(),
          file: z.string(),
          description: z.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
});

const trips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/trips' }),
  schema: z.object({
    title: z.string(),
    place: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    heroImage: z.string(),
    gallery: z.array(z.string()).default([]),
    circlePhotos: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    hidden: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z
    .object({
      // Home page fields
      greeting: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      typingRoles: z.array(z.string()).default([]),
      bio: z.string().optional(),
      description: z.string().optional(),
      avatar: z.string().optional(),
      buttons: z
        .array(
          z.object({
            label: z.string(),
            url: z.string(),
            icon: z.string().optional().default('auto'),
            show: z.boolean().default(true),
          })
        )
        .optional(),

      // Work page fields
      title: z.string().optional(),
      name: z.string().optional(),
      currentRole: z.string().optional(),
      currentCompany: z.string().optional(),
      location: z.string().optional(),
      showLocation: z.boolean().default(true),
      email: z.string().optional(),
      phone: z.string().optional(),
      showPhone: z.boolean().default(true),
      portfolioUrl: z.string().optional(),
      contactLinks: z
        .array(
          z.object({
            label: z.string(),
            url: z.string(),
            show: z.boolean().default(true),
          })
        )
        .optional(),
      experience: z
        .array(
          z.object({
            role: z.string(),
            company: z.string(),
            companyUrl: z.string().optional(),
            location: z.string().default('Remote'),
            start: z.string(),
            end: z.string(),
            current: z.boolean().optional(),
            summary: z.string().default(''),
            bullets: z.array(z.string()).default([]),
            badges: z.array(z.string()).default([]),
          })
        )
        .optional(),
      earlierRoles: z
        .array(
          z.object({
            role: z.string(),
            company: z.string(),
            start: z.string(),
            end: z.string(),
          })
        )
        .optional(),
      education: z
        .array(
          z.object({
            degree: z.string(),
            field: z.string(),
            school: z.string(),
            start: z.string().optional(),
            end: z.string().optional(),
          })
        )
        .optional(),
      skillGroups: z
        .array(
          z.object({
            title: z.string(),
            skills: z.array(z.string()).default([]),
          })
        )
        .optional(),

      // Site Identity & Browser Tab fields
      siteTitle: z.string().optional(),
      tabTitleSuffix: z.string().optional(),
      favicon: z.string().optional(),
      siteDescription: z.string().optional(),
      googleAnalyticsId: z.string().optional(),

      // Projects page fields
      eyebrow: z.string().optional(),
      intro: z.string().optional(),
      projects: z
        .array(
          z.object({
            title: z.string(),
            url: z.string().optional(),
            linkText: z.string().optional(),
            focus: z.string().optional(),
            overview: z.string().optional(),
            techStack: z.array(z.string()).default([]),
            challenge: z.string().optional(),
            featuresTitle: z.string().optional(),
            features: z
              .array(
                z.object({
                  title: z.string(),
                  description: z.string(),
                })
              )
              .default([]),
          })
        )
        .optional(),

      // Global Header & Footer fields
      brandName: z.string().optional(),
      brandPrefix: z.string().optional(),
      brandSuffix: z.string().optional(),
      showThemeToggle: z.boolean().default(true),
      navLinks: z
        .array(
          z.object({
            type: z.string().optional(),
            label: z.string(),
            url: z.string().optional(),
            show: z.boolean().default(true),
            children: z
              .array(
                z.object({
                  label: z.string(),
                  url: z.string(),
                  show: z.boolean().default(true),
                })
              )
              .optional(),
          })
        )
        .optional(),
      showFooterNav: z.boolean().default(true),
      footerNavLinks: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().optional(),
            show: z.boolean().default(true),
            children: z
              .array(
                z.object({
                  label: z.string(),
                  url: z.string(),
                  show: z.boolean().default(true),
                })
              )
              .optional(),
          })
        )
        .optional(),
      showFooterSocials: z.boolean().default(true),
      footerSocialLinks: z
        .array(
          z.object({
            label: z.string(),
            url: z.string(),
            show: z.boolean().default(true),
          })
        )
        .optional(),
      copyrightText: z.string().optional(),
    }),
});

const customPages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/custom-pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    eyebrow: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    navPlacement: z.enum(['none', 'personal', 'professional', 'top']).default('none'),
    navLabel: z.string().optional(),
    navOrder: z.number().default(100),
    showInFooter: z.boolean().default(false),
    attachments: z
      .array(
        z.object({
          label: z.string().optional(),
          file: z.string(),
          description: z.string().optional(),
        })
      )
      .optional()
      .default([]),
  }),
});

export const collections = { blog, trips, pages, customPages };


