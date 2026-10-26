/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-promo-banner.
 * Base block: carousel (2 columns, one row per slide).
 * Source: https://www.safra.sg/nsman-magazine (.carousel-banner.carousel-banner--hero)
 *
 * Cell 1: slide image wrapped in a link to the slide target (article.banner > a[href]).
 * Cell 2: optional text - left empty (banner text is baked into the artwork;
 *         the empty .banner__content subtitle/h1 is not authored).
 * Slick clones (.slick-slide.slick-cloned) are skipped and slides are de-duplicated.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Prefer real slick slides; fall back to bare banners if slick markup is absent.
  let banners = Array.from(element.querySelectorAll('.slick-slide:not(.slick-cloned) article.banner'));
  if (!banners.length) {
    banners = Array.from(element.querySelectorAll('article.banner'))
      .filter((b) => !b.closest('.slick-cloned'));
  }

  const seen = new Set();
  banners.forEach((banner) => {
    const img = banner.querySelector('.banner__image img, img');
    if (!img) return;
    const sourceLink = banner.querySelector('a[href]');
    const href = sourceLink ? sourceLink.getAttribute('href') : '';
    const key = `${href}|${img.getAttribute('src')}`;
    if (seen.has(key)) return;
    seen.add(key);

    let imageCell = img;
    if (href) {
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.append(img);
      imageCell = link;
    }

    // Optional text cell: only author real (non-empty) banner text if present.
    const textCell = [];
    const subtitle = banner.querySelector('.banner__content .subtitle');
    const heading = banner.querySelector('.banner__content h1, .banner__content h2, .banner__content h3');
    if (heading && heading.textContent.trim()) textCell.push(heading);
    if (subtitle && subtitle.textContent.trim()) textCell.push(subtitle);

    cells.push([imageCell, textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-promo-banner', cells });
  element.replaceWith(block);
}
