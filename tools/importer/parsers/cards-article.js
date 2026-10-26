/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-article.
 * Base block: cards (2 columns, one row per article).
 * Source: https://www.safra.sg/nsman-magazine (.rte.tohide #blogpost-container)
 *
 * Cell 1: article image.
 * Cell 2: headline (heading linked to the article URL), excerpt paragraph,
 *         publication date paragraph.
 * The #load_more_div pagination control is ignored.
 */
export default function parse(element, { document }) {
  const cells = [];

  const items = Array.from(element.querySelectorAll('.listing-item'))
    .filter((item) => !item.closest('#load_more_div'));

  items.forEach((item) => {
    const card = item.querySelector('a.blog-card, a.card, a[href]');
    const href = card ? card.getAttribute('href') : '';

    // Cell 1: image
    const img = item.querySelector('.card__image img, img');

    // Cell 2: text content
    const textCell = [];

    const titleEl = item.querySelector('.nsman-story-headline, .card__title-icon-wrapper');
    const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (titleText) {
      const heading = document.createElement('h3');
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = titleText;
        heading.append(link);
      } else {
        heading.textContent = titleText;
      }
      textCell.push(heading);
    }

    const descText = (item.querySelector('.card__description')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      textCell.push(p);
    }

    const dateText = (item.querySelector('.card__date')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (dateText) {
      const p = document.createElement('p');
      p.textContent = dateText;
      textCell.push(p);
    }

    if (!img && !textCell.length) return;
    cells.push([img || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
