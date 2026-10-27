import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Drops a leading dash (hyphen, en or em dash) the author may have typed
 * before the attribution; the dash is rendered by CSS.
 * @param {Element} el attribution element
 */
function stripLeadingDash(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  if (node) node.textContent = node.textContent.replace(/^\s*[-–—]\s*/, '');
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [quotationRow, attributionRow] = [...block.children];
  const figure = document.createElement('figure');

  // row 1: photo followed by quotation paragraph(s)
  if (quotationRow) {
    const quotation = document.createElement('blockquote');
    quotation.className = 'quote-photo-caption-quotation';
    moveInstrumentation(quotationRow, quotation);
    quotation.append(...quotationRow.children);
    quotation.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('picture') && !p.textContent.trim()) {
        p.classList.add('quote-photo-caption-photo');
      } else {
        p.classList.add('quote-photo-caption-text');
      }
    });
    figure.append(quotation);
  }

  // row 2: attribution
  if (attributionRow && attributionRow.textContent.trim()) {
    const attribution = document.createElement('figcaption');
    attribution.className = 'quote-photo-caption-attribution';
    moveInstrumentation(attributionRow, attribution);
    attribution.append(...attributionRow.children);
    stripLeadingDash(attribution);
    attribution.querySelectorAll('em').forEach((em) => {
      const cite = document.createElement('cite');
      moveInstrumentation(em, cite);
      cite.append(...em.childNodes);
      em.replaceWith(cite);
    });
    figure.append(attribution);
  }

  figure.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
    );
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(figure);
}
