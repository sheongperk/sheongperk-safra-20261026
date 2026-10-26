/**
 * Fetches the footer fragment. /content first (local preview), then the site root (DA/EDS).
 * Relative image paths are resolved against the fragment URL so they work on any page depth.
 * @returns {Promise<Element|null>} container holding the footer sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'lazy';
  });
  return container;
}

/**
 * Links that leave the main site (or point at documents) open in a new tab, as on the source.
 * The main site host is the most common host among the footer links.
 */
function setLinkTargets(root) {
  const links = [...root.querySelectorAll('a[href]')];
  const counts = {};
  links.forEach((a) => { counts[a.host] = (counts[a.host] || 0) + 1; });
  const siteHost = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  links.forEach((a) => {
    if (a.host !== siteHost || /\.pdf$/i.test(a.pathname)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

const isTextOnly = (el) => !el.querySelector('a, img') && el.textContent.trim() !== '';

/**
 * Classifies the content of one footer section so CSS can lay it out.
 */
function decorateSection(section) {
  section.querySelectorAll(':scope > ul').forEach((ul) => ul.classList.add('footer-link-list'));
  section.querySelectorAll(':scope > p').forEach((p) => {
    const links = p.querySelectorAll(':scope > a');
    const imgs = p.querySelectorAll('img');
    if (links.length > 1 && imgs.length === links.length) p.classList.add('footer-icon-row');
    else if (imgs.length === 1 && !p.textContent.trim()) p.classList.add('footer-image');
    else if (p.querySelector(':scope > strong') && p.textContent.trim() === p.querySelector(':scope > strong').textContent.trim()) p.classList.add('footer-heading');
  });
}

/**
 * Turns the text-only paragraph of the first section into a "back to top" control.
 */
function buildBackToTop(section) {
  const label = [...section.querySelectorAll(':scope > p')].find(isTextOnly);
  if (!label) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'footer-back-to-top';
  label.className = 'footer-back-to-top-label';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', label.textContent.trim());
  button.innerHTML = '<span class="footer-icon-arrow" aria-hidden="true"></span>';
  button.addEventListener('click', () => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  });
  wrapper.append(label, button);
  section.append(wrapper);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children];
  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  const columns = document.createElement('div');
  columns.className = 'footer-columns';

  sections.forEach((section, i) => {
    decorateSection(section);
    const onlyList = section.children.length === 1 && section.firstElementChild.tagName === 'UL';
    if (i === 0) {
      section.className = 'footer-top';
      buildBackToTop(section);
      inner.append(section);
    } else if (i === sections.length - 1) {
      section.className = 'footer-bottom';
      if (columns.children.length) inner.append(columns);
      inner.append(section);
    } else if (onlyList) {
      section.className = 'footer-links';
      inner.append(section);
    } else {
      section.className = 'footer-column';
      columns.append(section);
    }
  });

  setLinkTargets(inner);
  block.append(inner);
}
