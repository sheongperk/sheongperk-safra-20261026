// breakpoint-exception: the source site switches to the desktop header at 1024px
const isDesktop = window.matchMedia('(width >= 1024px)');

/**
 * Fetches the nav fragment. /content first (local preview), then the site root (DA/EDS).
 * Relative image paths are resolved against the fragment URL so they work on any page depth.
 * @returns {Promise<Element|null>} container holding the nav sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // EDS delivery wraps images in <picture> and the label of a list item with a sub-list in <p>;
  // flatten both so the fragment has the same shape locally and on EDS
  container.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    if (img) picture.replaceWith(img);
  });
  container.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
    img.loading = 'eager';
  });
  return container;
}

/**
 * Splits an <li> into its own label node(s) and its nested list.
 * @param {Element} li list item
 * @returns {{ label: Element|null, text: string, list: Element|null }}
 */
function readItem(li) {
  const list = li.querySelector(':scope > ul');
  const label = li.querySelector(':scope > a');
  const text = [...li.childNodes]
    .filter((n) => n !== list && n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join('')
    .trim();
  return { label, text: label ? label.textContent.trim() : text, list };
}

function closeAll(scope, except) {
  scope.querySelectorAll('.nav-drop[aria-expanded="true"], .nav-dropdown-toggle[aria-expanded="true"]').forEach((el) => {
    if (el !== except) el.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Builds a dropdown (button + list) from an <li> whose label is plain text.
 * Opens on hover (desktop) and on click.
 */
function buildDropdown(li, idx) {
  const { text, list } = readItem(li);
  li.className = 'nav-dropdown';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-dropdown-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `nav-dropdown-${idx}`);
  button.innerHTML = `<span>${text}</span><span class="nav-icon nav-icon-chevron" aria-hidden="true"></span>`;
  list.id = `nav-dropdown-${idx}`;
  list.className = 'nav-dropdown-list';
  li.replaceChildren(button, list);

  const setOpen = (open) => button.setAttribute('aria-expanded', open ? 'true' : 'false');
  // a click right after a hover-open keeps the list open (as on the source)
  // instead of toggling it shut
  let openedByHover = false;
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    if (openedByHover) {
      openedByHover = false;
      setOpen(true);
      return;
    }
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  li.addEventListener('mouseenter', () => {
    if (!isDesktop.matches) return;
    openedByHover = true;
    setOpen(true);
  });
  li.addEventListener('mouseleave', () => {
    if (!isDesktop.matches) return;
    openedByHover = false;
    setOpen(false);
  });
}

/**
 * Decorates a utility list: icon links and text-labelled dropdowns.
 */
function decorateUtilityList(ul, offset, modifier) {
  ul.className = `nav-utility-list ${modifier}`;
  [...ul.children].forEach((li, i) => {
    const { label, list } = readItem(li);
    if (list && !label) {
      buildDropdown(li, offset + i);
    } else {
      li.className = 'nav-utility-item';
      const img = li.querySelector(':scope > img');
      if (img) {
        // decorative: the link text already names the destination
        img.alt = '';
        img.className = 'nav-utility-icon';
      }
    }
  });
}

/**
 * Merges mobile-only additions into a nav list. Additions that repeat an existing label act
 * as anchors (merged recursively); new items are inserted after the last anchor and flagged
 * mobile-only.
 * @param {Element} target list to merge into
 * @param {Element} additions list of additions from the mobile-only nav section
 */
function mergeAdditions(target, additions) {
  let anchor = null;
  [...additions.children].forEach((add) => {
    const { text, list } = readItem(add);
    const match = [...target.children].find((li) => readItem(li).text === text);
    if (match) {
      anchor = match;
      if (list) {
        let sub = readItem(match).list;
        if (!sub) {
          sub = document.createElement('ul');
          match.append(sub);
        }
        mergeAdditions(sub, list);
      }
      return;
    }
    add.classList.add('nav-mobile-only');
    if (anchor) anchor.after(add);
    else target.append(add);
    anchor = add;
  });
}

/**
 * Builds a megamenu panel from a top-level item's nested list.
 * Items with their own nested list become titled groups, plain links are collected into one group.
 */
function buildPanel(list) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  let looseGroup = null;
  [...list.children].forEach((li) => {
    const { label, list: sub } = readItem(li);
    if (sub && label) {
      const group = document.createElement('div');
      group.className = 'nav-panel-group';
      label.className = 'nav-panel-title';
      label.insertAdjacentHTML('beforeend', '<span class="nav-icon nav-icon-arrow" aria-hidden="true"></span>');
      sub.className = 'nav-panel-links';
      group.append(label, sub);
      panel.append(group);
    } else {
      if (!looseGroup) {
        looseGroup = document.createElement('div');
        looseGroup.className = 'nav-panel-group';
        const ul = document.createElement('ul');
        ul.className = 'nav-panel-links';
        looseGroup.append(ul);
        panel.append(looseGroup);
      }
      looseGroup.querySelector('ul').append(li);
    }
  });
  panel.dataset.groups = panel.children.length;
  return panel;
}

function moveIndicator(indicator, target) {
  if (!target || !isDesktop.matches) {
    indicator.style.width = '0';
    return;
  }
  const row = indicator.parentElement.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  indicator.style.left = `${box.left - row.left}px`;
  indicator.style.width = `${box.width}px`;
}

function decorateSections(section, indicator) {
  const ul = section.querySelector('ul');
  ul.className = 'nav-sections-list';
  [...ul.children].forEach((li) => {
    const { label, list } = readItem(li);
    if (!list) return;
    li.className = 'nav-drop';
    li.setAttribute('aria-expanded', 'false');
    const panel = buildPanel(list);
    list.replaceWith(panel);

    const expander = document.createElement('button');
    expander.type = 'button';
    expander.className = 'nav-drop-expander';
    expander.setAttribute('aria-label', `Show ${label.textContent.trim()} menu`);
    expander.setAttribute('aria-expanded', 'false');
    expander.innerHTML = '<span class="nav-icon nav-icon-chevron" aria-hidden="true"></span>';
    label.after(expander);
    expander.addEventListener('click', () => {
      const open = li.getAttribute('aria-expanded') !== 'true';
      // mobile accordion allows several open sections, desktop shows one panel at a time
      if (isDesktop.matches) closeAll(ul);
      li.setAttribute('aria-expanded', open ? 'true' : 'false');
      expander.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    li.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      closeAll(ul, li);
      li.setAttribute('aria-expanded', 'true');
      moveIndicator(indicator, label);
    });
    li.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      li.setAttribute('aria-expanded', 'false');
      moveIndicator(indicator, null);
    });
    li.addEventListener('focusin', () => {
      if (!isDesktop.matches) return;
      closeAll(ul, li);
      li.setAttribute('aria-expanded', 'true');
      moveIndicator(indicator, label);
    });
    li.addEventListener('focusout', (e) => {
      if (isDesktop.matches && !li.contains(e.relatedTarget)) {
        li.setAttribute('aria-expanded', 'false');
        moveIndicator(indicator, null);
      }
    });
  });
}

/**
 * Builds the search panel. The fragment provides the results URL (link href),
 * the input placeholder (link text) and the empty-keyword message (following paragraph).
 */
function buildSearch(section, nav) {
  const config = section.querySelector('a');
  const message = [...section.querySelectorAll('p')].find((p) => !p.querySelector('a'));
  const panel = document.createElement('div');
  panel.className = 'nav-search';
  panel.id = 'nav-search';
  panel.hidden = true;
  const form = document.createElement('form');
  form.action = config ? config.href : '/search-results';
  form.method = 'get';
  form.setAttribute('role', 'search');
  form.innerHTML = `<label class="nav-search-label" for="nav-search-input">${config ? config.textContent.trim() : 'Search'}</label>
    <input id="nav-search-input" class="nav-search-input" type="text" name="keyword" required>
    <button type="submit" class="nav-search-submit" aria-label="Search"><span class="nav-icon nav-icon-search" aria-hidden="true"></span></button>`;
  const input = form.querySelector('input');
  input.placeholder = config ? config.textContent.trim() : '';
  const error = document.createElement('p');
  error.className = 'nav-search-error';
  error.hidden = true;
  error.textContent = message ? message.textContent.trim() : '';
  form.append(error);
  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) {
      e.preventDefault();
      error.hidden = !error.textContent;
    }
  });
  panel.append(form);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-controls', 'nav-search');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Search');
  toggle.innerHTML = '<span class="nav-icon nav-icon-search" aria-hidden="true"></span><span class="nav-icon nav-icon-close" aria-hidden="true"></span>';
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('search-open', open);
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      input.focus();
    } else {
      panel.classList.remove('is-open');
      panel.addEventListener('transitionend', () => { if (!panel.classList.contains('is-open')) panel.hidden = true; }, { once: true });
    }
  });
  return { panel, toggle };
}

function toggleMenu(nav, force) {
  const open = force !== undefined ? force : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const button = nav.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
}

/**
 * The header is transparent over a hero banner until the page scrolls; otherwise it is solid.
 */
function watchScroll(nav) {
  const first = document.querySelector('main > .section:first-child');
  const overHero = !!first && /carousel|hero/.test(first.className);
  nav.classList.toggle('over-hero', overHero);
  const update = () => nav.classList.toggle('scrolled', !overHero || window.scrollY > 0);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const [utility, brand, sections, tools, mobile] = [...fragment.children];
  const [mobileUtility, mobileAdditions] = mobile ? [...mobile.querySelectorAll(':scope > ul')] : [];
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  // row 1: utility bar
  const utilityRow = document.createElement('div');
  utilityRow.className = 'nav-utility';
  const utilityInner = document.createElement('div');
  utilityInner.className = 'nav-utility-inner';
  const utilityLists = [
    [mobileUtility, 'nav-utility-mobile nav-mobile-only'],
    ...[...(utility ? utility.querySelectorAll(':scope > ul') : [])].map((ul, i) => [ul, i ? 'nav-utility-actions' : 'nav-utility-links']),
  ];
  let offset = 0;
  utilityLists.forEach(([ul, modifier]) => {
    if (!ul) return;
    decorateUtilityList(ul, offset, modifier);
    offset += ul.children.length;
    utilityInner.append(ul);
  });
  utilityRow.append(utilityInner);

  // row 2: brand, sections, tools
  const mainRow = document.createElement('div');
  mainRow.className = 'nav-main';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';
  const indicator = document.createElement('span');
  indicator.className = 'nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  if (brand) {
    brand.className = 'nav-brand';
    const logos = brand.querySelectorAll('img');
    if (logos[0]) logos[0].className = 'nav-logo nav-logo-light';
    if (logos[1]) logos[1].className = 'nav-logo nav-logo-dark';
    mainInner.append(brand);
  }
  if (sections) {
    sections.className = 'nav-sections';
    if (mobileAdditions) mergeAdditions(sections.querySelector('ul'), mobileAdditions);
    decorateSections(sections, indicator);
    mainInner.append(sections);
  }
  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';
  let searchPanel = null;
  if (tools) {
    const { panel, toggle } = buildSearch(tools, nav);
    searchPanel = panel;
    navTools.append(toggle);
  }
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));
  navTools.append(hamburger);
  mainInner.append(navTools, indicator);
  mainRow.append(mainInner);

  nav.append(utilityRow, mainRow);
  if (searchPanel) nav.append(searchPanel);

  // close dropdowns on outside click / escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    closeAll(nav);
    if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    closeAll(nav);
    toggleMenu(nav, false);
    moveIndicator(indicator, null);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  watchScroll(nav);
}
