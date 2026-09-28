---
title: 'Beyond the Grey: How to Edit a Stunning High-Resolution Mineral Moon'
subtitle: The 2026 Harvest Moon
description: ''
date: 2026-09-26T12:00:00-05:00
updated: ''
category: life
author: Timothy Johnson
tags:
  - harvest moon
  - photography
coverImage: /assets/blog/2026 Harvest Moon.jpg
draft: false
---

When we look up at the night sky, the moon appears as a bright, glowing silvery-grey disc. But beneath that monochrome facade lies a vibrant geological map just waiting to be revealed. The blues indicate areas rich in titanium, while the oranges and rusty reds highlight iron-poor highlands. 

This is called "mineral moon" photography. You can't just take a single photo and crank up the saturation—it will only create a pixelated, noisy mess of atmospheric distortion. The secret is to shoot a burst of images and **stack** them. 

In this tutorial, I'll walk you through my exact process for turning a sequence of raw moon photos into a vibrant, noise-free mineral moon using Lightroom and Photoshop.

## What You Need

- **The Shots:** 50 to 100 raw images of the moon, shot in rapid succession on a tripod. Keep your shutter speed fast enough to freeze motion.
- **Software:** Adobe Lightroom Classic and Adobe Photoshop.

***

## Phase 1: Pre-Processing in Lightroom

Before we can pull out the colors, we need a clean, neutral baseline.

<Steps>
1. **Import and Select:** Bring your raw files into Lightroom. Pick the absolute sharpest image of the bunch to act as your baseline.
2. **Neutralize White Balance:** Set your White Balance to "Daylight" (around 5200K). This is crucial. We want to extract true geological colors, not the tint of Earth's atmosphere. 
3. **Lens Corrections:** Check the "Remove Chromatic Aberration" box. Any purple or green color fringing on the edges of the moon will multiply during stacking, ruining the crisp edge.
4. **Crop Tight:** Crop the image very tightly around the moon. Cutting out the empty black sky is essential for helping Photoshop align the images later.
5. **Base Adjustments:** Pull down the Highlights slightly to recover detail in the brightest craters, and add a touch of Texture. **Do not touch the Saturation or Vibrance sliders yet!** Leave them at zero.
6. **Sync and Export:** Select all your images, click **Sync**, ensure your crop and lens corrections are checked, and apply the edits to the entire batch. Finally, export all the images into a new folder as 16-bit TIFFs.
</Steps>

***

## Phase 2: Alignment and Stacking (The Magic Step)

Here is where we eliminate the digital noise and atmospheric distortion. By stacking the images, the software averages out random noise, leaving behind an incredibly clean file that can handle aggressive color editing.

<Steps>
1. Open Photoshop and navigate to **File > Scripts > Load Files into Stack**.
2. Browse and select all your exported TIFFs. 
3. **Important:** Do _not_ check "Attempt to Automatically Align Source Images" here. Photoshop often struggles to align a bright circle in a black void and will create a blurry, ghosted mess. Just load the files.
4. Once loaded, select all the layers in the Layers panel. Go to **Edit > Auto-Align Layers**. Select **Reposition** (not Auto). This forces Photoshop to only shift the frames up, down, left, and right, preventing it from trying to warp the moon.
5. With all layers still selected, right-click and choose **Convert to Smart Object**. (Grab a coffee; this might take a minute.)
6. Go to **Layer > Smart Objects > Stack Mode > Mean** (or Median). 
</Steps>

Watch as the noise completely melts away! Right-click your Smart Object and select **Rasterize Layer**. You now have a flawless, noise-free lunar canvas.

_(Pro-Tip: If Photoshop's alignment keeps failing and your moon looks blurry, download specialized, free astrophotography software like **PIPP** to center the images, and **AutoStakkert!** to stack them. It's bulletproof!)_

***

## Phase 3: Extracting the Mineral Colors

Now for the fun part. Because we removed the noise in Phase 2, we can now push the saturation without destroying the image.

<Steps>
1. **Neutralize the Cast:** Go to **Image > Auto Color** or **Auto Tone**. This usually does a fantastic job of removing any lingering yellow atmospheric haze.
2. **Iterative Saturation:** Add a **Hue/Saturation adjustment layer**. Boost the saturation by **+15 to +20**. 
3. **Repeat, Don't Rush:** Do _not_ push the slider to +100 in one go. That causes ugly color artifacting. Instead, duplicate that Hue/Saturation layer 4-6 times. With each new layer, the blues (titanium-rich basalts) and oranges (iron-poor highlands) will separate and pop.
4. **Contrast:** Add a **Curves adjustment layer** and create a gentle S-curve. This darkens the lunar _maria_ (the dark seas) and brightens the highlands, giving the moon a 3D pop.
5. **Final Sharpening:** Merge all your visible layers into a new layer (\`Ctrl+Alt+Shift+E\` on PC or \`Cmd+Opt+Shift+E\` on Mac). Go to **Filter > Other > High Pass**, set a low radius (around 2.5px), and change the layer's blend mode to **Overlay** or **Linear Light**. This will snap the craters into tack-sharp focus.
</Steps>

And there you have it! You've successfully turned a standard grey moon into a vibrant geological map.
