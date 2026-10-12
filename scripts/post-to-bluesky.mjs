#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const handle = (process.env.BLUESKY_HANDLE || 'timothyjohnson.bsky.social').replace(/^@/, '').trim();
const appPassword = process.env.BLUESKY_APP_PASSWORD?.trim();

if (!appPassword) {
  console.log('ℹ️  BLUESKY_APP_PASSWORD is not set. Skipping Bluesky auto-posting.');
  process.exit(0);
}

const siteUrl = 'https://timothyjohnsonwrites.com';

/**
 * Extracts key-value pairs from simple YAML frontmatter
 */
function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, rawFm: '', body: fileContent };

  const rawFm = match[1];
  const body = fileContent.slice(match[0].length);
  const data = {};

  const lines = rawFm.split('\n');
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      let val = kv[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[key] = val;
    }
  }

  return { data, rawFm, body };
}

/**
 * Updates blueskyUrl in the file's frontmatter
 */
function updateFrontmatterWithBlueskyUrl(fileContent, blueskyUrl) {
  const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return fileContent;

  let fm = fmMatch[1];
  if (/^blueskyUrl:/m.test(fm)) {
    fm = fm.replace(/^blueskyUrl:.*$/m, `blueskyUrl: "${blueskyUrl}"`);
  } else {
    fm = fm.trimEnd() + `\nblueskyUrl: "${blueskyUrl}"`;
  }

  return fileContent.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${fm}\n---`);
}

/**
 * Scans directories for candidate posts
 */
function findPendingPosts() {
  const candidates = [];
  const dirs = [
    { dir: path.join(rootDir, 'src/content/blog'), type: 'blog' },
    { dir: path.join(rootDir, 'src/content/trips'), type: 'travel' },
  ];

  for (const { dir, type } of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = parseFrontmatter(content);

      const isDraft = data.draft === 'true' || data.draft === true;
      const isHidden = data.hidden === 'true' || data.hidden === true;
      const share = data.shareToBluesky === 'true' || data.shareToBluesky === true;
      const alreadyPosted = Boolean(data.blueskyUrl && data.blueskyUrl.trim().length > 0);

      if (share && !isDraft && !isHidden && !alreadyPosted) {
        const slug = file.replace(/\.md$/, '');
        candidates.push({
          filePath,
          type,
          slug,
          data,
          content,
        });
      }
    }
  }

  return candidates;
}

/**
 * Creates link facets for Bluesky rich text
 */
function createFacetsForUrl(text, url) {
  const utf8Text = Buffer.from(text, 'utf8');
  const utf8Url = Buffer.from(url, 'utf8');
  const byteStart = utf8Text.indexOf(utf8Url);

  if (byteStart === -1) return [];

  const byteEnd = byteStart + utf8Url.length;
  return [
    {
      index: {
        byteStart,
        byteEnd,
      },
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: url,
        },
      ],
    },
  ];
}

async function main() {
  const pending = findPendingPosts();

  if (pending.length === 0) {
    console.log('ℹ️  No articles queued for Bluesky auto-post.');
    return;
  }

  console.log(`🚀 Found ${pending.length} article(s) queued to post to Bluesky (@${handle})...`);

  // 1. Authenticate with Bluesky
  let session;
  try {
    const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: handle,
        password: appPassword,
      }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error(`❌ Bluesky authentication failed (${sessionRes.status}):`, errText);
      process.exit(0); // Don't fail the build
    }

    session = await sessionRes.json();
    console.log(`✅ Authenticated with Bluesky as @${handle}`);
  } catch (err) {
    console.error('❌ Network error connecting to Bluesky:', err.message);
    process.exit(0);
  }

  // 2. Publish each post
  for (const post of pending) {
    try {
      const isBlog = post.type === 'blog';
      const canonicalUrl = isBlog
        ? `${siteUrl}/blog/${post.slug}/`
        : `${siteUrl}/travel/${post.slug}/`;

      const title = post.data.title || 'New post';
      const desc = post.data.summary || post.data.description || post.data.subtitle || '';
      const customNote = post.data.blueskyCustomText?.trim();

      let postText = '';
      if (customNote) {
        postText = `${customNote}\n\n${canonicalUrl}`;
      } else if (isBlog) {
        postText = `New blog post: "${title}"\n\n${desc ? `${desc}\n\n` : ''}${canonicalUrl}`;
      } else {
        const place = post.data.place ? ` (${post.data.place})` : '';
        postText = `New travel story: "${title}"${place}\n\n${desc ? `${desc}\n\n` : ''}${canonicalUrl}`;
      }

      // Truncate to safe Bluesky length (300 graphemes max) if needed
      if (postText.length > 290) {
        postText = `${postText.slice(0, 280)}…\n\n${canonicalUrl}`;
      }

      const facets = createFacetsForUrl(postText, canonicalUrl);

      const record = {
        $type: 'app.bsky.feed.post',
        text: postText,
        facets,
        createdAt: new Date().toISOString(),
        embed: {
          $type: 'app.bsky.embed.external',
          external: {
            uri: canonicalUrl,
            title,
            description: desc,
          },
        },
      };

      const recordRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessJwt}`,
        },
        body: JSON.stringify({
          repo: session.did,
          collection: 'app.bsky.feed.post',
          record,
        }),
      });

      if (!recordRes.ok) {
        const errText = await recordRes.text();
        console.error(`❌ Failed to post "${title}" to Bluesky:`, errText);
        continue;
      }

      const recordData = await recordRes.json();
      const rkey = recordData.uri.split('/').pop();
      const blueskyPostUrl = `https://bsky.app/profile/${handle}/post/${rkey}`;

      console.log(`🎉 Successfully posted "${title}" to Bluesky: ${blueskyPostUrl}`);

      // Save blueskyUrl back into the markdown file
      const updatedContent = updateFrontmatterWithBlueskyUrl(post.content, blueskyPostUrl);
      fs.writeFileSync(post.filePath, updatedContent, 'utf8');
      console.log(`💾 Saved Bluesky thread link into ${path.basename(post.filePath)}`);
    } catch (postErr) {
      console.error(`❌ Error posting ${post.filePath}:`, postErr.message);
    }
  }
}

main();
