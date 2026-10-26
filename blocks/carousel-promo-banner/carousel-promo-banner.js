import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const AUTOPLAY_INTERVAL = 3500;

/**
 * Wraps the slide picture in the slide link when the author placed the
 * link in the text cell (or as a bare link next to the image).
 * @param {Element} slide The slide list item
 */
function linkSlideImage(slide) {
  const picture = slide.querySelector('picture');
  if (!picture || picture.closest('a')) return;
  const link = slide.querySelector('a[href]');
  if (!link) return;
  const textCell = link.closest('.carousel-promo-banner-slide-content');
  const linkOnly = textCell
    && textCell.textContent.trim() === link.textContent.trim();
  const anchor = document.createElement('a');
  anchor.href = link.href;
  if (link.title) anchor.title = link.title;
  const img = picture.querySelector('img');
  anchor.setAttribute('aria-label', link.textContent.trim() || img?.alt || 'Promotion');
  picture.replaceWith(anchor);
  anchor.append(picture);
  if (linkOnly) textCell.remove();
}

function updateActiveSlide(block, realIndex) {
  const slides = [...block.querySelectorAll('.carousel-promo-banner-slide')];
  block.dataset.activeSlide = realIndex;
  slides.forEach((slide, i) => {
    const active = i === realIndex;
    slide.setAttribute('aria-hidden', String(!active));
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-promo-banner-indicators button').forEach((btn, i) => {
    if (i === realIndex) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
}

export function showSlide(block, index, behavior = 'smooth') {
  const slides = [...block.querySelectorAll('.carousel-promo-banner-slide')];
  if (!slides.length) return;
  const realIndex = (index + slides.length) % slides.length;
  const track = block.querySelector('.carousel-promo-banner-slides');
  track.scrollTo({ left: slides[realIndex].offsetLeft - track.offsetLeft, top: 0, behavior });
  updateActiveSlide(block, realIndex);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const track = document.createElement('ul');
  track.className = 'carousel-promo-banner-slides';

  rows.forEach((row, index) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-promo-banner-slide';
    slide.dataset.slideIndex = index;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${index + 1} of ${rows.length}`);
    // keep Universal Editor instrumentation on the rebuilt slide
    moveInstrumentation(row, slide);

    [...row.children].forEach((cell) => {
      const hasImage = cell.querySelector('picture, img');
      const hasText = cell.textContent.trim() !== '';
      if (hasImage) {
        cell.className = 'carousel-promo-banner-slide-image';
      } else if (hasText || cell.hasAttribute('data-aue-prop')) {
        // empty text cells stay in Universal Editor so authors can fill the optional text field
        cell.className = 'carousel-promo-banner-slide-content';
      } else {
        return; // drop empty cells
      }
      slide.append(cell);
    });

    if (slide.children.length) track.append(slide);
  });

  track.querySelectorAll('picture > img').forEach((img, i) => {
    const optimized = createOptimizedPicture(
      img.src,
      img.alt,
      i === 0,
      [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }],
    );
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  track.querySelectorAll('.carousel-promo-banner-slide').forEach(linkSlideImage);

  block.textContent = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  if (!block.getAttribute('aria-label')) block.setAttribute('aria-label', 'Promotions');
  block.append(track);

  const slideCount = track.children.length;
  if (slideCount < 2) {
    block.classList.add('single-slide');
    return;
  }

  const nav = document.createElement('div');
  nav.className = 'carousel-promo-banner-navigation';
  nav.innerHTML = `
    <button type="button" class="slide-prev" aria-label="Previous slide"></button>
    <button type="button" class="slide-next" aria-label="Next slide"></button>
  `;
  block.append(nav);

  const indicators = document.createElement('ol');
  indicators.className = 'carousel-promo-banner-indicators';
  for (let i = 0; i < slideCount; i += 1) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Show slide ${i + 1} of ${slideCount}`);
    btn.addEventListener('click', () => showSlide(block, i));
    li.append(btn);
    indicators.append(li);
  }
  block.append(indicators);

  const current = () => parseInt(block.dataset.activeSlide || '0', 10);

  // autoplay, as on the source slider: 3.5s per slide, infinite, paused while focused
  let timer;
  const stopAutoplay = () => {
    clearInterval(timer);
    timer = undefined;
  };
  const startAutoplay = () => {
    stopAutoplay();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // no autoplay while authoring in Universal Editor
    if (block.hasAttribute('data-aue-resource')) return;
    timer = setInterval(() => {
      if (!document.hidden) showSlide(block, current() + 1);
    }, AUTOPLAY_INTERVAL);
  };
  block.addEventListener('focusin', stopAutoplay);
  block.addEventListener('focusout', (e) => {
    if (!block.contains(e.relatedTarget)) startAutoplay();
  });

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    showSlide(block, current() + (btn.classList.contains('slide-prev') ? -1 : 1));
    if (!block.contains(document.activeElement)) startAutoplay();
  });

  // keep state in sync when the user swipes / scrolls the track
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        const idx = parseInt(entry.target.dataset.slideIndex, 10);
        if (idx !== current()) updateActiveSlide(block, idx);
      }
    });
  }, { root: track, threshold: [0.6] });
  [...track.children].forEach((slide, i) => {
    slide.dataset.slideIndex = i;
    observer.observe(slide);
  });

  showSlide(block, 0, 'instant');
  startAutoplay();
}
