# NSman Magazine Page Migration Plan

**Source page:** https://www.safra.sg/nsman-magazine
**Goal:** Move the NSman Magazine page into AEM Edge Delivery Services so its content, structure and look match the original, and it can be edited in Document Authoring.

> Plan mode is on. Switch to Execute mode to start the migration.

## Current State
- The project is set up as an Edge Delivery Services site, and its Document Authoring content source is configured.
- Blocks already in the project: accordion, cards, carousel, columns, embed, hero, quote, tabs, teaser, table, video, fragment, modal, promotion, structured-teaser, search, form, header and footer.
- No pages have been migrated yet, and the project type (Document Authoring, document-based or Universal Editor) hasn't been recorded yet.

## Approach
I'll run the standard single-page migration workflow:
1. **Project setup:** confirm the project type and its block library.
2. **Page analysis:** scrape the page and capture screenshots, cleaned HTML and metadata. Then split the page into sections (for example a hero or banner, magazine issue listings or cards, article teasers and calls to action).
3. **Block mapping:** match each section to an existing block, or to a variant of one. I'll only create a new block where nothing existing fits (at least 80% similar). Then record the page template and DOM selectors.
4. **Import infrastructure:** generate parsers for each block variant, plus transformers that clean up the page and split it into sections.
5. **Import script and content import:** bundle the template's import script and run it, so the page content is created locally.
6. **Block styling:** style the blocks used on this page to match the original design.
7. **Validation:** compare the migrated page with the original in the preview, and fix any parser or styling differences.

## Scope Notes
- **Included:** the main content of `/nsman-magazine`, with its images, links and metadata.
- **Not included unless you ask:** header/navigation and footer migration. Each has its own workflow and can be done next.
- **Local only:** all changes stay in the local workspace. Nothing is uploaded to Document Authoring or previewed/published remotely unless you ask for it.

## Checklist
- [ ] Confirm the project type and block library, and record them in the project settings
- [ ] Scrape and analyse https://www.safra.sg/nsman-magazine (screenshots, cleaned HTML, metadata, images)
- [ ] Identify the page's sections and the authoring decisions for each one
- [ ] Map each section to an existing block or variant, and flag any new custom blocks needed
- [ ] Record the page template, block selectors and section mappings
- [ ] Generate import parsers for each block variant
- [ ] Generate cleanup and section transformers
- [ ] Generate and bundle the import script for the page template
- [ ] Run the import to create the page content locally
- [ ] Check the imported content in the preview (structure, images, links, metadata)
- [ ] Generate or adapt the code for any new or changed blocks
- [ ] Style the blocks to match the original page's design
- [ ] Compare the migrated page with the original in the preview and fix differences
- [ ] Summarise the result and suggest next steps (header/nav, footer, more magazine pages)

## Risks / Open Points
- **Dynamic content:** the magazine listings may be loaded by scripts, filtered or paginated. If so, the migrated page will hold the content as it was when imported, not a live feed.
- **Bot protection:** if the site blocks automated access, scraping will switch to a fallback method automatically.
- **Embedded viewers:** PDF or flipbook viewers for magazine issues may become links or embeds, depending on what the original uses.
