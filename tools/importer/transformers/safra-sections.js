/* eslint-disable */
/* global WebImporter */

/**
 * SAFRA sections transformer.
 * Inserts section breaks (<hr>) and Section Metadata blocks based on
 * payload.template.sections from tools/importer/page-templates.json.
 */

const MARKER_ATTR = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // unsupported selector (e.g. :has) - try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el) continue;
      if (i > 0 || section.style) {
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
        if (i === 0) hr.setAttribute('data-excat-first', 'true');
        el.parentNode.insertBefore(hr, el);
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      if (!section.style) continue;

      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (marker) {
        // Place metadata at the end of the section: before the next <hr> sibling,
        // or after the last sibling if this is the final section.
        let anchor = marker.nextElementSibling;
        let last = marker;
        while (anchor && anchor.tagName !== 'HR') {
          last = anchor;
          anchor = anchor.nextElementSibling;
        }
        last.after(metadata);
        marker.removeAttribute(MARKER_ATTR);
        if (marker.getAttribute('data-excat-first') === 'true') marker.remove();
      } else {
        const el = findSectionElement(element, section);
        if (el) el.after(metadata);
      }
    }
    element.querySelectorAll('hr[data-excat-first]').forEach((hr) => hr.remove());
  }
}
