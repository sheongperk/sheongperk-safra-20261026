/* eslint-disable */
/* global WebImporter */

import carouselPromoBannerParser from './parsers/carousel-promo-banner.js';
import cardsArticleParser from './parsers/cards-article.js';
import safraCleanupTransformer from './transformers/safra-cleanup.js';
import safraSectionsTransformer from './transformers/safra-sections.js';

const PAGE_TEMPLATE = {
  name: 'nsman-magazine',
  urls: ['https://www.safra.sg/nsman-magazine'],
  representativeUrl: 'https://www.safra.sg/nsman-magazine',
  description: 'NSman Magazine landing page: promo banner carousel, centered title, article teaser card grid and eNSMAN logo',
  urlPattern: '/*',
  blocks: [
    { name: 'carousel-promo-banner', instances: ['.carousel-banner.carousel-banner--hero', '.carousel-banner--hero .banner-slider'] },
    { name: 'cards-article', instances: ['.container-sm .rte.tohide', '.rte.tohide'] },
  ],
  sections: [
    { id: 'section-1', name: 'Promotional banner carousel', selector: ['.carousel-banner.carousel-banner--hero'], style: null, blocks: ['carousel-promo-banner'], defaultContent: [] },
    { id: 'section-2', name: 'Magazine title', selector: ['.carousel-banner--hero + .rte', 'div.rte:has(> div > h1)'], style: 'centered', blocks: [], defaultContent: ['.carousel-banner--hero + .rte h1'] },
    { id: 'section-3', name: 'Top reads article listing', selector: ['.container.container-sm'], style: null, blocks: ['cards-article'], defaultContent: [] },
    { id: 'section-4', name: 'eNSMAN logo', selector: ['.container-sm + .rte', "div.rte:has(img[alt='eNSMAN Logo'])"], style: 'centered', blocks: [], defaultContent: ["img[alt='eNSMAN Logo']"] },
  ],
};

const parsers = {
  'carousel-promo-banner': carouselPromoBannerParser,
  'cards-article': cardsArticleParser,
};

const transformers = [safraCleanupTransformer, safraSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        // skip elements already matched, or nested inside an already-matched element
        if (seen.has(element) || [...seen].some((el) => el.contains(element))) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
