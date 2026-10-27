/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quote-photo-caption.
 * Base block: quote (1 column, 2 rows).
 * Source: NSMAN magazine articles (.nsman-content-block > h5:has(img))
 * Source shape: <h5><img src alt><br>“Quotation text.” – Attribution</h5>
 *
 * Row 1: photo paragraph followed by the quotation paragraph (curly quotes kept).
 * Row 2: attribution paragraph (leading dash removed).
 *
 * Captions that do not start with a quotation mark are not quotes: they are
 * replaced with default content (<p><img></p><p>caption</p>) and no block is
 * created.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img');

  // Caption text = everything in the h5 except the image itself (br -> space)
  const clone = element.cloneNode(true);
  clone.querySelectorAll('img, picture').forEach((n) => n.remove());
  clone.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  const caption = (clone.textContent || '').replace(/\s+/g, ' ').trim();

  const makeImgPara = () => {
    if (!img) return null;
    const p = document.createElement('p');
    const pic = img.closest('picture');
    p.append(pic && element.contains(pic) ? pic : img);
    return p;
  };

  const makePara = (text) => {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  };

  const isQuote = /^[“"]/.test(caption);

  if (!isQuote) {
    // Defensive: plain photo caption -> default content, no block
    const nodes = [];
    const imgPara = makeImgPara();
    if (imgPara) nodes.push(imgPara);
    if (caption) nodes.push(makePara(caption));
    element.replaceWith(...nodes);
    return;
  }

  // Split on the last spaced dash (en, hyphen or em) before the attribution
  let quotation = caption;
  let attribution = '';
  const match = caption.match(/^(.*\S)\s+[–\-—]\s+([^–\-—]*\S)\s*$/s);
  if (match) {
    quotation = match[1].trim();
    attribution = match[2].trim();
  } else {
    const idx = Math.max(
      caption.lastIndexOf(' – '),
      caption.lastIndexOf(' - '),
      caption.lastIndexOf(' — '),
    );
    if (idx > 0) {
      quotation = caption.slice(0, idx).trim();
      attribution = caption.slice(idx + 3).trim();
    }
  }

  const cells = [];

  const contentCell = [];
  const imgPara = makeImgPara();
  if (imgPara) contentCell.push(imgPara);
  if (quotation) contentCell.push(makePara(quotation));
  cells.push([contentCell]);

  cells.push([attribution ? [makePara(attribution)] : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote-photo-caption', cells });
  element.replaceWith(block);
}
