/**
 * SVGO settings for the logos in public/brand (pnpm brand:svg).
 * Optimises without changing the artwork: the viewBox is always kept (and added from width/height
 * when a traced file has none), so the logos scale. Untouched originals live in design/brand-source/.
 */

/** @type {import("svgo").CustomPlugin} */
const ensureViewBox = {
  name: "ensureViewBox",
  fn: () => ({
    element: {
      enter(node) {
        if (node.name !== "svg" || node.attributes.viewBox) return;
        const w = parseFloat(node.attributes.width);
        const h = parseFloat(node.attributes.height);
        if (w > 0 && h > 0) node.attributes.viewBox = `0 0 ${w} ${h}`;
      },
    },
  }),
};

/** @type {import("svgo").Config} */
const config = {
  multipass: true,
  plugins: [
    ensureViewBox,
    // removeViewBox is not part of preset-default in SVGO 4 (don't add it: the logos must keep their viewBox)
    "preset-default",
    "removeScripts",
    "removeXlink",
  ],
};

export default config;
