/* eslint-disable */
/* global WebImporter */

/**
 * SAFRA NSman article transformer (template: nsman-article).
 * Normalises article-specific markup into clean default content:
 * byline, lead, plain photo captions, caption-only h5s, standalone images,
 * empty spacer paragraphs, and the masthead heading level.
 * Selectors taken from migration-work/cleaned.html
 * (https://www.safra.sg/nsman-magazine/Spotlight/editor-picks/2026/10/26/every-lap-counts-safra-swim-for-hope-2026).
 */

const QUOTE_START = /^[“"]/;

function cleanText(text) {
  return (text || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isEmptyParagraph(p) {
  if (p.querySelector('img, picture, a, video, iframe')) return false;
  return cleanText(p.textContent) === '';
}

function makeP(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

// Photo captions become bold paragraphs, as on the source (bold h5 under the photo)
function makeCaption(document, text) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = text;
  p.append(strong);
  return p;
}

function processByline(element, document) {
  element.querySelectorAll('.container-xs .mb-4 > span.text-muted').forEach((muted) => {
    const wrapper = muted.parentElement;
    const dateEl = muted.querySelector('.px-4');
    const date = dateEl ? cleanText(dateEl.textContent) : '';
    const clone = muted.cloneNode(true);
    const cloneDate = clone.querySelector('.px-4');
    if (cloneDate) cloneDate.remove();
    const author = cleanText(clone.textContent);

    const frag = document.createDocumentFragment();
    if (author) frag.append(makeP(document, author));
    if (date) frag.append(makeP(document, date));
    wrapper.replaceWith(frag);
  });
}

function processLead(element, document) {
  element.querySelectorAll('.container-xs div.lead').forEach((lead) => {
    const p = document.createElement('p');
    p.innerHTML = lead.innerHTML;
    lead.replaceWith(p);
  });
}

function processContentBlock(block, document) {
  Array.from(block.children).forEach((child) => {
    const tag = child.tagName;

    if (tag === 'H5') {
      const img = child.querySelector('img');
      if (img) {
        const clone = child.cloneNode(true);
        clone.querySelectorAll('img').forEach((i) => i.remove());
        const caption = cleanText(clone.textContent);
        // Quote captions are handled by the quote-photo-caption parser
        if (QUOTE_START.test(caption)) return;
        const imgP = document.createElement('p');
        imgP.append(img);
        const frag = document.createDocumentFragment();
        frag.append(imgP);
        if (caption) frag.append(makeCaption(document, caption));
        child.replaceWith(frag);
      } else {
        const caption = cleanText(child.textContent);
        if (caption) {
          // keep inline formatting (e.g. <em>Written by ...</em>) inside the bold caption
          const p = makeCaption(document, '');
          p.firstChild.append(...child.childNodes);
          child.replaceWith(p);
        } else child.remove();
      }
      return;
    }

    if (tag === 'IMG') {
      const p = document.createElement('p');
      child.replaceWith(p);
      p.append(child);
      return;
    }

    if (tag === 'P') {
      if (isEmptyParagraph(child)) {
        child.remove();
        return;
      }
      // Leading / trailing <br> in paragraphs (e.g. "<p><br>These different ...")
      while (child.firstChild && (child.firstChild.nodeName === 'BR'
        || (child.firstChild.nodeType === 3 && !child.firstChild.textContent.trim()))) {
        child.firstChild.remove();
      }
      while (child.lastChild && (child.lastChild.nodeName === 'BR'
        || (child.lastChild.nodeType === 3 && !child.lastChild.textContent.trim()))) {
        child.lastChild.remove();
      }
    }
  });
}

export default function transform(hookName, element, payload) {
  if (!payload || !payload.template || payload.template.name !== 'nsman-article') return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    // Masthead spacer paragraphs (&nbsp;) in the rte that holds the masthead heading
    element.querySelectorAll('div.rte').forEach((rte) => {
      if (!rte.querySelector('h1')) return;
      rte.querySelectorAll('p').forEach((p) => {
        if (isEmptyParagraph(p)) p.remove();
      });
    });

    processByline(element, document);
    processLead(element, document);
    element.querySelectorAll('.nsman-content-block').forEach((block) => processContentBlock(block, document));
  }

  if (hookName === 'afterTransform') {
    // Masthead H1 -> H2. Done after parsing so the section-1 selector
    // "div.rte:has(h1)" (used by safra-sections in beforeTransform) still matches
    // regardless of transformer order. The article headline remains the only H1.
    element.querySelectorAll('div.rte h1').forEach((h1) => {
      if (h1.classList.contains('nsman-story-headline')) return;
      h1.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
      const h2 = document.createElement('h2');
      h2.textContent = cleanText(h1.textContent);
      h1.replaceWith(h2);
    });
  }
}
