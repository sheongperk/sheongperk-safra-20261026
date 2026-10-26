/* eslint-disable */
/* global WebImporter */

/**
 * SAFRA cleanup transformer.
 * Removes non-authorable chrome (header, nav, footer, cookie consent, ShareThis,
 * slick carousel artefacts, blank spacer RTEs, Load more control).
 * Selectors taken from migration-work/cleaned.html (https://www.safra.sg/nsman-magazine).
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

function isEmptyRte(rte) {
  if (rte.querySelector('img, picture, video, iframe, table, a[href]')) return false;
  return rte.textContent.replace(/ /g, ' ').trim() === '';
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Elements that would otherwise interfere with block/section matching
    removeAll(element, [
      // CookieYes consent banner, modal, overlay, revisit button
      '.cky-overlay',
      '.cky-btn-revisit-wrapper',
      '.cky-consent-container',
      '.cky-modal',
      '[class^="cky-"]',
      // Slick carousel artefacts: cloned slides, arrows, dots
      '.slick-slide.slick-cloned',
      '.slick-arrow',
      '.slick-dots',
      // Load more pagination control in article listing
      '#load_more_div',
      // ShareThis widget
      '.st-inline-share-buttons',
      '[id^="st-el-"]',
    ]);

    // A <br> inside a heading forces a setext heading in markdown, which demotes h1 to h2
    element.querySelectorAll('h1 br, h2 br, h3 br').forEach((br) => br.replaceWith(' '));

    // Blank spacer / empty RTE divs (e.g. before the hero carousel)
    element.querySelectorAll('div.rte').forEach((rte) => {
      if (rte.querySelector('.Blank-div') || isEmptyRte(rte)) {
        rte.remove();
      }
    });
  }

  if (hookName === 'afterTransform') {
    // Global site chrome
    removeAll(element, [
      'header.site-header',
      'nav.site-nav',
      'nav.mobile-nav',
      'footer.site-footer',
      '.page-scroll-progress',
      '.back-to-top',
      '.st-inline-share-buttons',
      '[id^="st-el-"]',
      '[class^="cky-"]',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Strip tracking / framework attributes
    element.querySelectorAll('[onclick], [data-gtm], [data-track], [data-slick-index], [aria-hidden], [tabindex]').forEach((el) => {
      ['onclick', 'data-gtm', 'data-track', 'data-slick-index', 'aria-hidden', 'tabindex'].forEach((attr) => el.removeAttribute(attr));
    });
  }
}
