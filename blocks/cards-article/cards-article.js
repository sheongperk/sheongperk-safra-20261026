import { createOptimizedPicture } from '../../scripts/aem.js';

const PAGE_SIZE = 4;
const DATE_PATTERN = /^\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})\s*$/;

/**
 * Tags the parts of the card body: headline, excerpt and publication date.
 * @param {Element} body The card body cell
 * @returns {string|null} The article URL, if any
 */
function decorateBody(body) {
  const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('cards-article-title');

  const paragraphs = [...body.querySelectorAll(':scope > p')];
  const dateParagraph = [...paragraphs].reverse()
    .find((p) => DATE_PATTERN.test(p.textContent) || p.querySelector('time'));
  if (dateParagraph) {
    dateParagraph.classList.add('cards-article-date');
    if (!dateParagraph.querySelector('time')) {
      const time = document.createElement('time');
      time.textContent = dateParagraph.textContent.trim();
      dateParagraph.textContent = '';
      dateParagraph.append(time);
    }
  }
  paragraphs
    .filter((p) => p !== dateParagraph && !p.querySelector('picture'))
    .forEach((p) => p.classList.add('cards-article-excerpt'));

  const link = heading?.querySelector('a[href]') || body.querySelector('a[href]');
  if (link) link.classList.add('cards-article-link');
  return link?.href || null;
}

function setupLoadMore(block, list) {
  const items = [...list.children];
  if (items.length <= PAGE_SIZE) return;

  items.slice(PAGE_SIZE).forEach((item) => { item.hidden = true; });

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-article-load-more';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Load more';
  button.addEventListener('click', () => {
    const hidden = [...list.children].filter((item) => item.hidden);
    const next = hidden.slice(0, PAGE_SIZE);
    next.forEach((item) => { item.hidden = false; });
    next[0]?.querySelector('a')?.focus({ preventScroll: true });
    if (hidden.length <= PAGE_SIZE) wrapper.remove();
  });
  wrapper.append(button);
  block.append(wrapper);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((cell) => {
      if (cell.children.length === 1 && cell.querySelector('picture')) {
        cell.className = 'cards-article-image';
      } else if (cell.textContent.trim()) {
        cell.className = 'cards-article-body';
      } else if (!cell.querySelector('picture')) {
        cell.remove();
      } else {
        cell.className = 'cards-article-image';
      }
    });

    const body = li.querySelector('.cards-article-body');
    const href = body ? decorateBody(body) : null;
    if (href) li.classList.add('cards-article-linked');

    if (li.children.length) list.append(li);
  });

  list.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.textContent = '';
  block.append(list);
  setupLoadMore(block, list);
}
