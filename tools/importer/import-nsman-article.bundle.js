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

  // tools/importer/import-nsman-article.js
  var import_nsman_article_exports = {};
  __export(import_nsman_article_exports, {
    default: () => import_nsman_article_default
  });

  // tools/importer/parsers/quote-photo-caption.js
  function parse(element, { document }) {
    const img = element.querySelector("img");
    const clone = element.cloneNode(true);
    clone.querySelectorAll("img, picture").forEach((n) => n.remove());
    clone.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    const caption = (clone.textContent || "").replace(/\s+/g, " ").trim();
    const makeImgPara = () => {
      if (!img) return null;
      const p = document.createElement("p");
      const pic = img.closest("picture");
      p.append(pic && element.contains(pic) ? pic : img);
      return p;
    };
    const makePara = (text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    };
    const isQuote = /^[“"]/.test(caption);
    if (!isQuote) {
      const nodes = [];
      const imgPara2 = makeImgPara();
      if (imgPara2) nodes.push(imgPara2);
      if (caption) nodes.push(makePara(caption));
      element.replaceWith(...nodes);
      return;
    }
    let quotation = caption;
    let attribution = "";
    const match = caption.match(new RegExp("^(.*\\S)\\s+[\u2013\\-\u2014]\\s+([^\u2013\\-\u2014]*\\S)\\s*$", "s"));
    if (match) {
      quotation = match[1].trim();
      attribution = match[2].trim();
    } else {
      const idx = Math.max(
        caption.lastIndexOf(" \u2013 "),
        caption.lastIndexOf(" - "),
        caption.lastIndexOf(" \u2014 ")
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
    cells.push([attribution ? [makePara(attribution)] : ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "quote-photo-caption", cells });
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

  // tools/importer/transformers/safra-article.js
  var QUOTE_START = /^[“"]/;
  function cleanText(text) {
    return (text || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function isEmptyParagraph(p) {
    if (p.querySelector("img, picture, a, video, iframe")) return false;
    return cleanText(p.textContent) === "";
  }
  function makeP(document, text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }
  function makeCaption(document, text) {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = text;
    p.append(strong);
    return p;
  }
  function processByline(element, document) {
    element.querySelectorAll(".container-xs .mb-4 > span.text-muted").forEach((muted) => {
      const wrapper = muted.parentElement;
      const dateEl = muted.querySelector(".px-4");
      const date = dateEl ? cleanText(dateEl.textContent) : "";
      const clone = muted.cloneNode(true);
      const cloneDate = clone.querySelector(".px-4");
      if (cloneDate) cloneDate.remove();
      const author = cleanText(clone.textContent);
      const frag = document.createDocumentFragment();
      if (author) frag.append(makeP(document, author));
      if (date) frag.append(makeP(document, date));
      wrapper.replaceWith(frag);
    });
  }
  function processLead(element, document) {
    element.querySelectorAll(".container-xs div.lead").forEach((lead) => {
      const p = document.createElement("p");
      p.innerHTML = lead.innerHTML;
      lead.replaceWith(p);
    });
  }
  function processContentBlock(block, document) {
    Array.from(block.children).forEach((child) => {
      const tag = child.tagName;
      if (tag === "H5") {
        const img = child.querySelector("img");
        if (img) {
          const clone = child.cloneNode(true);
          clone.querySelectorAll("img").forEach((i) => i.remove());
          const caption = cleanText(clone.textContent);
          if (QUOTE_START.test(caption)) return;
          const imgP = document.createElement("p");
          imgP.append(img);
          const frag = document.createDocumentFragment();
          frag.append(imgP);
          if (caption) frag.append(makeCaption(document, caption));
          child.replaceWith(frag);
        } else {
          const caption = cleanText(child.textContent);
          if (caption) {
            const p = makeCaption(document, "");
            p.firstChild.append(...child.childNodes);
            child.replaceWith(p);
          } else child.remove();
        }
        return;
      }
      if (tag === "IMG") {
        const p = document.createElement("p");
        child.replaceWith(p);
        p.append(child);
        return;
      }
      if (tag === "P") {
        if (isEmptyParagraph(child)) {
          child.remove();
          return;
        }
        while (child.firstChild && (child.firstChild.nodeName === "BR" || child.firstChild.nodeType === 3 && !child.firstChild.textContent.trim())) {
          child.firstChild.remove();
        }
        while (child.lastChild && (child.lastChild.nodeName === "BR" || child.lastChild.nodeType === 3 && !child.lastChild.textContent.trim())) {
          child.lastChild.remove();
        }
      }
    });
  }
  function transform2(hookName, element, payload) {
    if (!payload || !payload.template || payload.template.name !== "nsman-article") return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      element.querySelectorAll("div.rte").forEach((rte) => {
        if (!rte.querySelector("h1")) return;
        rte.querySelectorAll("p").forEach((p) => {
          if (isEmptyParagraph(p)) p.remove();
        });
      });
      processByline(element, document);
      processLead(element, document);
      element.querySelectorAll(".nsman-content-block").forEach((block) => processContentBlock(block, document));
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll("div.rte h1").forEach((h1) => {
        if (h1.classList.contains("nsman-story-headline")) return;
        h1.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
        const h2 = document.createElement("h2");
        h2.textContent = cleanText(h1.textContent);
        h1.replaceWith(h2);
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/import-nsman-article.js
  var PAGE_TEMPLATE = {
    name: "nsman-article",
    urls: ["https://www.safra.sg/nsman-magazine/Spotlight/editor-picks/2026/10/26/every-lap-counts-safra-swim-for-hope-2026"],
    description: "NSman Magazine article page",
    urlPattern: "/nsman-magazine/*/*/*/*/*/*",
    blocks: [
      { name: "quote-photo-caption", instances: [".nsman-content-block > h5:has(img)"] }
    ],
    sections: [
      { id: "section-1", name: "Magazine masthead", selector: ["div.rte:has(h1)", "header.site-header ~ div.rte:has(strong)"], style: "centered", blocks: [], defaultContent: ["div.rte h1"] },
      { id: "section-2", name: "Article", selector: [".container.container-xs"], style: null, blocks: ["quote-photo-caption"], defaultContent: [".nsman-story-headline", ".container-xs .lead", ".container-xs .mb-4", ".nsman-content-block"] },
      { id: "section-3", name: "eNSMAN logo", selector: [".container-xs + .rte", "div.rte:has(img[alt='eNSMAN Logo'])"], style: "centered", blocks: [], defaultContent: ["img[alt='eNSMAN Logo']"] }
    ]
  };
  var parsers = {
    "quote-photo-caption": parse
  };
  var transformers = [transform, transform3, transform2];
  var MONTHS = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ];
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
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function readArticleMeta(document) {
    var _a, _b, _c, _d;
    const meta = (name) => {
      var _a2;
      return (_a2 = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)) == null ? void 0 : _a2.content;
    };
    const byline = document.querySelector(".container-xs .mb-4 .text-muted");
    const author = clean((_a = byline == null ? void 0 : byline.querySelector("span:not(.px-4)")) == null ? void 0 : _a.textContent);
    const rawDate = clean((_b = byline == null ? void 0 : byline.querySelector(".px-4")) == null ? void 0 : _b.textContent);
    let date = "";
    const m = rawDate.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
      if (month) date = `${m[3]}-${String(month).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
    return {
      title: clean(meta("og:title")) || clean((_c = document.querySelector("h1.nsman-story-headline")) == null ? void 0 : _c.textContent),
      description: clean(meta("description")) || clean((_d = document.querySelector(".container-xs .lead")) == null ? void 0 : _d.textContent),
      image: meta("og:image"),
      author,
      date,
      tags: clean(meta("blog-tag")),
      type: clean(meta("og:type"))
    };
  }
  function createArticleMetadata(main, document, info) {
    const fields = {};
    if (info.title) fields.Title = info.title;
    if (info.description) fields.Description = info.description;
    if (info.image) {
      const img = document.createElement("img");
      img.src = info.image;
      fields.Image = img;
    }
    if (info.author) fields.Author = info.author;
    if (info.date) fields["Publication Date"] = info.date;
    if (info.tags) fields.Tags = info.tags;
    if (info.type) fields["og:type"] = info.type;
    fields.template = PAGE_TEMPLATE.name;
    const block = WebImporter.Blocks.getMetadataBlock(document, fields);
    main.append(block);
  }
  var import_nsman_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const articleMeta = readArticleMeta(document);
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
      createArticleMetadata(main, document, articleMeta);
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
  return __toCommonJS(import_nsman_article_exports);
})();
