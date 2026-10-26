/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-nsman-magazine.js
  var import_nsman_magazine_exports = {};
  __export(import_nsman_magazine_exports, {
    default: () => import_nsman_magazine_default
  });

  // tools/importer/parsers/carousel-promo-banner.js
  function parse(element, { document }) {
    const cells = [];
    let banners = Array.from(element.querySelectorAll(".slick-slide:not(.slick-cloned) article.banner"));
    if (!banners.length) {
      banners = Array.from(element.querySelectorAll("article.banner")).filter((b) => !b.closest(".slick-cloned"));
    }
    const seen = /* @__PURE__ */ new Set();
    banners.forEach((banner) => {
      const img = banner.querySelector(".banner__image img, img");
      if (!img) return;
      const sourceLink = banner.querySelector("a[href]");
      const href = sourceLink ? sourceLink.getAttribute("href") : "";
      const key = `${href}|${img.getAttribute("src")}`;
      if (seen.has(key)) return;
      seen.add(key);
      let imageCell = img;
      if (href) {
        const link = document.createElement("a");
        link.setAttribute("href", href);
        link.append(img);
        imageCell = link;
      }
      const textCell = [];
      const subtitle = banner.querySelector(".banner__content .subtitle");
      const heading = banner.querySelector(".banner__content h1, .banner__content h2, .banner__content h3");
      if (heading && heading.textContent.trim()) textCell.push(heading);
      if (subtitle && subtitle.textContent.trim()) textCell.push(subtitle);
      cells.push([imageCell, textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-promo-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse2(element, { document }) {
    const cells = [];
    const items = Array.from(element.querySelectorAll(".listing-item")).filter((item) => !item.closest("#load_more_div"));
    items.forEach((item) => {
      var _a, _b;
      const card = item.querySelector("a.blog-card, a.card, a[href]");
      const href = card ? card.getAttribute("href") : "";
      const img = item.querySelector(".card__image img, img");
      const textCell = [];
      const titleEl = item.querySelector(".nsman-story-headline, .card__title-icon-wrapper");
      const titleText = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
      if (titleText) {
        const heading = document.createElement("h3");
        if (href) {
          const link = document.createElement("a");
          link.setAttribute("href", href);
          link.textContent = titleText;
          heading.append(link);
        } else {
          heading.textContent = titleText;
        }
        textCell.push(heading);
      }
      const descText = (((_a = item.querySelector(".card__description")) == null ? void 0 : _a.textContent) || "").replace(/\s+/g, " ").trim();
      if (descText) {
        const p = document.createElement("p");
        p.textContent = descText;
        textCell.push(p);
      }
      const dateText = (((_b = item.querySelector(".card__date")) == null ? void 0 : _b.textContent) || "").replace(/\s+/g, " ").trim();
      if (dateText) {
        const p = document.createElement("p");
        p.textContent = dateText;
        textCell.push(p);
      }
      if (!img && !textCell.length) return;
      cells.push([img || "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/safra-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function isEmptyRte(rte) {
    if (rte.querySelector("img, picture, video, iframe, table, a[href]")) return false;
    return rte.textContent.replace(/ /g, " ").trim() === "";
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeAll(element, [
        // CookieYes consent banner, modal, overlay, revisit button
        ".cky-overlay",
        ".cky-btn-revisit-wrapper",
        ".cky-consent-container",
        ".cky-modal",
        '[class^="cky-"]',
        // Slick carousel artefacts: cloned slides, arrows, dots
        ".slick-slide.slick-cloned",
        ".slick-arrow",
        ".slick-dots",
        // Load more pagination control in article listing
        "#load_more_div",
        // ShareThis widget
        ".st-inline-share-buttons",
        '[id^="st-el-"]'
      ]);
      element.querySelectorAll("h1 br, h2 br, h3 br").forEach((br) => br.replaceWith(" "));
      element.querySelectorAll("div.rte").forEach((rte) => {
        if (rte.querySelector(".Blank-div") || isEmptyRte(rte)) {
          rte.remove();
        }
      });
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "header.site-header",
        "nav.site-nav",
        "nav.mobile-nav",
        "footer.site-footer",
        ".page-scroll-progress",
        ".back-to-top",
        ".st-inline-share-buttons",
        '[id^="st-el-"]',
        '[class^="cky-"]',
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll("[onclick], [data-gtm], [data-track], [data-slick-index], [aria-hidden], [tabindex]").forEach((el) => {
        ["onclick", "data-gtm", "data-track", "data-slick-index", "aria-hidden", "tabindex"].forEach((attr) => el.removeAttribute(attr));
      });
    }
  }

  // tools/importer/transformers/safra-sections.js
  var MARKER_ATTR = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(element, section);
        if (!el) continue;
        if (i > 0 || section.style) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
          if (i === 0) hr.setAttribute("data-excat-first", "true");
          el.parentNode.insertBefore(hr, el);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
        if (!section.style) continue;
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let anchor = marker.nextElementSibling;
          let last = marker;
          while (anchor && anchor.tagName !== "HR") {
            last = anchor;
            anchor = anchor.nextElementSibling;
          }
          last.after(metadata);
          marker.removeAttribute(MARKER_ATTR);
          if (marker.getAttribute("data-excat-first") === "true") marker.remove();
        } else {
          const el = findSectionElement(element, section);
          if (el) el.after(metadata);
        }
      }
      element.querySelectorAll("hr[data-excat-first]").forEach((hr) => hr.remove());
    }
  }

  // tools/importer/import-nsman-magazine.js
  var PAGE_TEMPLATE = {
    name: "nsman-magazine",
    urls: ["https://www.safra.sg/nsman-magazine"],
    representativeUrl: "https://www.safra.sg/nsman-magazine",
    description: "NSman Magazine landing page: promo banner carousel, centered title, article teaser card grid and eNSMAN logo",
    urlPattern: "/*",
    blocks: [
      { name: "carousel-promo-banner", instances: [".carousel-banner.carousel-banner--hero", ".carousel-banner--hero .banner-slider"] },
      { name: "cards-article", instances: [".container-sm .rte.tohide", ".rte.tohide"] }
    ],
    sections: [
      { id: "section-1", name: "Promotional banner carousel", selector: [".carousel-banner.carousel-banner--hero"], style: null, blocks: ["carousel-promo-banner"], defaultContent: [] },
      { id: "section-2", name: "Magazine title", selector: [".carousel-banner--hero + .rte", "div.rte:has(> div > h1)"], style: "centered", blocks: [], defaultContent: [".carousel-banner--hero + .rte h1"] },
      { id: "section-3", name: "Top reads article listing", selector: [".container.container-sm"], style: null, blocks: ["cards-article"], defaultContent: [] },
      { id: "section-4", name: "eNSMAN logo", selector: [".container-sm + .rte", "div.rte:has(img[alt='eNSMAN Logo'])"], style: "centered", blocks: [], defaultContent: ["img[alt='eNSMAN Logo']"] }
    ]
  };
  var parsers = {
    "carousel-promo-banner": parse,
    "cards-article": parse2
  };
  var transformers = [transform, transform2];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
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
  var import_nsman_magazine_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_nsman_magazine_exports);
})();
