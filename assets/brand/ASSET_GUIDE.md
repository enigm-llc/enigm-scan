# Enigm Brand Asset Guide

This guide defines the canonical Enigm brand assets imported into Enigm Forge.

SVG files are the authoritative source. PNG files are fallback assets only for platforms or channels that cannot use SVG.

## Official Logo

The official Enigm logo is the complete mark composed of the Enigm symbol and the Enigm wordmark.

Canonical files:

- `assets/brand/logo/enigm-logo-black.svg`
- `assets/brand/logo/enigm-logo-white.svg`
- `assets/brand/logo/enigm-logo-black.png`
- `assets/brand/logo/enigm-logo-white.png`

Use the complete logo when brand recognition matters and there is enough horizontal space for the wordmark to remain legible.

## Official Symbol

The official Enigm symbol is the standalone isotype.

Canonical files:

- `assets/brand/symbol/enigm-symbol-black.svg`
- `assets/brand/symbol/enigm-symbol-white.svg`
- `assets/brand/symbol/enigm-symbol-black.png`
- `assets/brand/symbol/enigm-symbol-white.png`

Use the symbol for compact, square, app icon, favicon, launch, avatar, loading, product-switcher, and system-level contexts where the complete logo would be too small or too wide.

## Official Favicon

The official favicon uses the Enigm symbol artwork.

Canonical files:

- `assets/brand/favicon/favicon.svg`
- `assets/brand/favicon/favicon.png`

The SVG favicon is copied from the official black symbol SVG artwork and is the authoritative favicon vector source. The PNG favicon is the provided raster fallback.

## Allowed Formats

Preferred:

- SVG for product UI, website, documentation, scalable web surfaces, presentations, and design tools.

Fallback:

- PNG only when SVG is not supported by the destination platform, store, tool, or channel.

Do not generate new PNGs from existing PNGs. When new raster exports are required, export from the SVG master.

## Preferred Backgrounds

Use:

- Black assets on light neutral backgrounds.
- White assets on dark neutral backgrounds.
- Transparent-background assets wherever possible.
- Flat black, white, or neutral-gray backgrounds only.

Avoid:

- Gradients.
- Decorative imagery.
- Busy photography.
- Colored backgrounds.
- Neon, blue, green, purple, or product-accent backgrounds.
- Red backgrounds except explicitly approved critical/security contexts where the logo is not being used as a UI state color.

## Minimum Size Guidance

Complete logo:

- Preferred digital minimum width: 160px.
- Absolute digital minimum width: 120px.
- Print minimum width: 32mm.
- If the wordmark becomes hard to read, use the symbol.

Symbol:

- Preferred digital minimum: 32px high.
- Absolute digital minimum: 24px high when legibility is verified.
- Use larger sizes for app icons, launch screens, and high-density displays.

Favicon:

- Use SVG where supported.
- Use the PNG fallback only for favicon targets that require raster assets.
- Future favicon export sets should include platform-required sizes generated from the SVG master.

## Dark Mode

Use white logo or white symbol assets on dark neutral backgrounds.

Do not brighten, glow, outline, shadow, or recolor the mark for Dark Mode. If contrast is insufficient, adjust the background within the approved neutral system rather than modifying the asset.

## Light Mode

Use black logo or black symbol assets on light neutral backgrounds.

Do not soften, tint, outline, or add effects. The mark should remain precise and monochrome.

## Forbidden Modifications

Never:

- Redraw the logo.
- Trace the logo.
- Optimize or simplify SVG paths without approval.
- Change proportions.
- Stretch or compress.
- Rotate.
- Crop.
- Recolor.
- Add gradients.
- Add shadows.
- Add glows.
- Add outlines.
- Add texture.
- Add animation.
- Change symbol-to-wordmark spacing.
- Replace the wordmark with typed text.
- Use the symbol as decoration, pattern, wallpaper texture, or bullet.
- Use red as a brand mark color.
- Use unofficial filenames in product code.

## Export Recommendations

- Export new raster sizes only from SVG masters.
- Preserve transparent backgrounds unless a platform requires a solid background.
- Use black assets for light contexts and white assets for dark contexts.
- Keep exports pixel-aligned when producing small raster sizes.
- Verify favicon legibility at target sizes.
- Keep original SVG files unchanged in Enigm Forge.

## SVG vs PNG Guidance

Use SVG when:

- The asset appears in web UI.
- The asset appears in documentation.
- The asset must scale.
- The asset is used in design tools.
- The asset is used in product shells.

Use PNG only when:

- The target platform rejects SVG.
- A store, social platform, email client, or legacy environment requires raster.
- A specific favicon or app icon export size is required.

PNG fallbacks must never become the source for new assets.

## Brand appearance in Command

Command uses the official Enigm marks without creating a separate product logo. Choose the black asset on light surfaces and the white asset on dark surfaces, including dark panels within a light page. Select the asset for its immediate background rather than the global theme.

Keep the full wordmark legible and preserve its proportions. Use the standalone symbol when space cannot accommodate the full logo. Responsive layouts must not crop, stretch, or compress either mark. Loading, disabled, and hover states must not redraw or decorate the artwork.

The neutral brand direction and Roboto web typography remain the baseline. Interface status colors do not authorize recoloring the logo. Screenshots used as brand references must exclude private information.
