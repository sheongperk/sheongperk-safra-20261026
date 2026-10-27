/* eslint-disable */
/* global WebImporter */

import quotePhotoCaptionParser from './parsers/quote-photo-caption.js';
import safraCleanupTransformer from './transformers/safra-cleanup.js';
import safraArticleTransformer from './transformers/safra-article.js';
import safraSectionsTransformer from './transformers/safra-sections.js';

const PAGE_TEMPLATE = {
  name: 'nsman-article',
  urls: ['https://www.safra.sg/nsman-magazine/Spotlight/editor-picks/2026/10/26/every-lap-counts-safra-swim-for-hope-2026'],
  description: 'NSman Magazine article page',
  urlPattern: '/nsman-magazine/*/*/*/*/*/*',
  blocks: [
    { name: 'quote-photo-caption', instances: ['.nsman-content-block > h5:has(img)'] },
  ],
  sections: [
    { id: 'section-1', name: 'Magazine masthead', selector: ['div.rte:has(h1)', 'header.site-header ~ div.rte:has(strong)'], style: 'centered', blocks: [], defaultContent: ['div.rte h1'] },
    { id: 'section-2', name: 'Article', selector: ['.container.container-xs'], style: null, blocks: ['quote-photo-caption'], defaultContent: ['.nsman-story-headline', '.container-xs .lead', '.container-xs .mb-4', '.nsman-content-block'] },
    { id: 'section-3', name: 'eNSMAN logo', selector: ['.container-xs + .rte', "div.rte:has(img[alt='eNSMAN Logo'])"], style: 'centered', blocks: [], defaultContent: ["img[alt='eNSMAN Logo']"] },
  ],
};

const parsers = {
  'quote-photo-caption': quotePhotoCaptionParser,
};

const transformers = [safraCleanupTransformer, safraSectionsTransformer, safraArticleTransformer];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'];

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
        if (seen.has(element) || [...seen].some((el) => el.contains(element))) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

/**
 * Reads article metadata from the source page before transformers rewrite it.
 * "26 October 2026" becomes "2026-10-26".
 */
function readArticleMeta(document) {
  const meta = (name) => document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content;
  const byline = document.querySelector('.container-xs .mb-4 .text-muted');
  const author = clean(byline?.querySelector('span:not(.px-4)')?.textContent);
  const rawDate = clean(byline?.querySelector('.px-4')?.textContent);
  let date = '';
  const m = rawDate.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    if (month) date = `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return {
    title: clean(meta('og:title')) || clean(document.querySelector('h1.nsman-story-headline')?.textContent),
    description: clean(meta('description')) || clean(document.querySelector('.container-xs .lead')?.textContent),
    image: meta('og:image'),
    author,
    date,
    tags: clean(meta('blog-tag')),
    type: clean(meta('og:type')),
  };
}

function createArticleMetadata(main, document, info) {
  const fields = {};
  if (info.title) fields.Title = info.title;
  if (info.description) fields.Description = info.description;
  if (info.image) {
    const img = document.createElement('img');
    img.src = info.image;
    fields.Image = img;
  }
  if (info.author) fields.Author = info.author;
  if (info.date) fields['Publication Date'] = info.date;
  if (info.tags) fields.Tags = info.tags;
  if (info.type) fields['og:type'] = info.type;
  // body class "nsman-article" scopes the article layout styles
  fields.template = PAGE_TEMPLATE.name;
  const block = WebImporter.Blocks.getMetadataBlock(document, fields);
  main.append(block);
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    const articleMeta = readArticleMeta(document);

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
    createArticleMetadata(main, document, articleMeta);
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
