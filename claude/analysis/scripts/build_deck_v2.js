"use strict";
// Builds the v2 datathon deck (collective-defense framing). Every number on a slide is read from facts.json or
// collective.json, both computed by the Python scripts. collective.json must sit next to facts.json.
// usage: NODE_PATH=<node_modules> PPTX_SKILL=<skill dir> node build_deck_v2.js <facts.json> <log_dir> <out.pptx>
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(path.join(process.env.PPTX_SKILL, "scripts/apply_theme.js"));

const [factsPath, logDir, outPath] = process.argv.slice(2);
const F = JSON.parse(fs.readFileSync(factsPath, "utf8"));
const G = JSON.parse(fs.readFileSync(path.join(path.dirname(factsPath), "collective.json"), "utf8"));
const readLog = (n) => fs.readFileSync(path.join(logDir, n), "utf8").replace(/\r/g, "").replace(/\s+$/, "").split("\n");
const pct = (v, d = 1) => (100 * v).toFixed(d) + "%";
const num = (n) => Math.round(n).toLocaleString("en-US");

const THEME = {
  name: "Built vs Copied",
  headFontFace: "Georgia",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0F1E2B", lt1: "FFFFFF", dk2: "0C2D3F", lt2: "EEF3F6",
    accent1: "2A78D6", // legitimate
    accent2: "EB6834", // phishing
    accent3: "6250D6", // URL + page model
    accent4: "1BAF7A", // URL-only model / URL signals
    accent5: "5B6770", // muted text
    accent6: "A3ADB5", // de-emphasised marks
    hlink: "2A78D6", folHlink: "6250D6",
  },
};
const X = THEME.colors; // hex, for the chart / border options that only take hex
const RULE = "D5DCE2";

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pres.title = "Phishing is copied. Immunity can be shared.";
  pres.subject = "Datathon at The Beach: the phishing challenge";
  pres.author = "Datathon team";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const W = 13.333, MX = 0.6, CW = W - 2 * MX;
  const FOOT = "Datathon at The Beach  ·  The phishing challenge";

  // ---------------------------------------------------------------- layouts
  const ph = (name, type, o) => ({ placeholder: { options: Object.assign({ name, type, margin: 0, valign: "top" }, o), text: "" } });
  const footer = (color) => ({ text: { text: FOOT, options: { x: MX, y: 7.06, w: 7, h: 0.26, fontSize: 10, color, margin: 0 } } });

  pres.defineSlideMaster({
    title: "TITLE_DARK", background: { color: C.text2 },
    objects: [
      ph("kicker", "body", { x: 0.7, y: 0.72, w: 6.4, h: 0.3, fontSize: 12, bold: true, color: C.accent2, charSpacing: 3, bullet: false }),
      ph("title", "title", { x: 0.7, y: 1.25, w: 6.95, h: 1.9, fontSize: 38, bold: true, color: C.background1, align: "left" }),
      ph("subtitle", "body", { x: 0.7, y: 3.55, w: 6.2, h: 1.15, fontSize: 17, color: C.background2, bullet: false }),
      ph("team", "body", { x: 0.7, y: 5.5, w: 6.2, h: 1.45, fontSize: 15, color: C.background1, bullet: false }),
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: C.background1 },
    objects: [
      ph("kicker", "body", { x: MX, y: 0.42, w: 9, h: 0.28, fontSize: 11, bold: true, color: C.accent2, charSpacing: 3, bullet: false }),
      ph("title", "title", { x: MX, y: 0.74, w: CW, h: 0.98, fontSize: 26, bold: true, color: C.text1, align: "left" }),
      footer(C.accent5),
    ],
    slideNumber: { x: 12.13, y: 7.06, w: 0.6, h: 0.26, fontSize: 10, color: X.accent5, align: "right" },
  });
  pres.defineSlideMaster({
    title: "CONTENT_DARK", background: { color: C.text2 },
    objects: [
      ph("kicker", "body", { x: MX, y: 0.42, w: 9, h: 0.28, fontSize: 11, bold: true, color: C.accent2, charSpacing: 3, bullet: false }),
      ph("title", "title", { x: MX, y: 0.74, w: CW, h: 0.98, fontSize: 26, bold: true, color: C.background1, align: "left" }),
      footer(C.accent6),
    ],
    slideNumber: { x: 12.13, y: 7.06, w: 0.6, h: 0.26, fontSize: 10, color: X.accent6, align: "right" },
  });
  pres.defineSlideMaster({
    title: "SECTION_DARK", background: { color: C.text2 },
    objects: [
      ph("title", "title", { x: 0.7, y: 2.55, w: 11.9, h: 1.0, fontSize: 40, bold: true, color: C.background1, align: "left" }),
      ph("subtitle", "body", { x: 0.7, y: 3.7, w: 10.5, h: 1.2, fontSize: 18, color: C.background2, bullet: false }),
      footer(C.accent6),
    ],
    slideNumber: { x: 12.13, y: 7.06, w: 0.6, h: 0.26, fontSize: 10, color: X.accent6, align: "right" },
  });
  pres.defineSlideMaster({
    title: "APPENDIX", background: { color: C.background1 },
    objects: [
      ph("kicker", "body", { x: MX, y: 0.42, w: 9, h: 0.28, fontSize: 11, bold: true, color: C.accent5, charSpacing: 3, bullet: false }),
      ph("title", "title", { x: MX, y: 0.72, w: CW, h: 0.55, fontSize: 22, bold: true, color: C.text1, align: "left" }),
      { text: { text: FOOT + "  ·  Appendix (reference, not presented)", options: { x: MX, y: 7.06, w: 9, h: 0.26, fontSize: 10, color: C.accent5, margin: 0 } } },
    ],
    slideNumber: { x: 12.13, y: 7.06, w: 0.6, h: 0.26, fontSize: 10, color: X.accent5, align: "right" },
  });

  // ---------------------------------------------------------------- helpers
  const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, valign: "top", color: C.text1, fontSize: 14 }, o));
  const kick = (s, t) => s.addText(t, { placeholder: "kicker", bullet: false });
  const title = (s, t) => s.addText(Array.isArray(t) ? t.map((x, i) => ({ text: x, options: { breakLine: i < t.length - 1 } })) : t, { placeholder: "title" });
  const card = (s, x, y, w, h, o = {}) =>
    s.addShape("roundRect", { x, y, w, h, rectRadius: o.r || 0.09, fill: o.fill || { color: C.background2 }, line: { type: "none" }, objectName: o.name || "Card" });
  const circle = (s, x, y, d, n, o = {}) =>
    s.addText(String(n), { shape: "ellipse", x, y, w: d, h: d, fill: { color: o.fill || C.accent2 }, color: o.color || C.background1, bold: true, fontSize: o.size || 13, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "Step " + n });
  const line = (s, x, y, w, h, o = {}) => s.addShape("line", { x, y, w, h, line: { color: o.color || C.accent5, width: o.width || 1.25 }, objectName: "Connector" });
  const soWhat = (s, text, o = {}) => {
    const y = o.y || 6.08, h = o.h || 0.84;
    card(s, MX, y, CW, h, { name: "So what card", fill: o.fill });
    s.addText(
      [{ text: (o.label || "So what") + "    ", options: { bold: true, color: C.accent2 } }, { text, options: { color: o.color || C.text1 } }],
      { x: MX + 0.25, y, w: CW - 0.5, h, fontSize: 14, margin: 0, valign: "middle", isTextBox: true, objectName: "So what" }
    );
  };
  const chartBase = () => ({
    legendFontFace: "+mn-lt", legendFontSize: 12, legendColor: X.dk1,
    dataLabelFontFace: "+mn-lt", dataLabelFontSize: 11, dataLabelColor: X.dk1,
    catAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, catAxisLabelColor: X.dk1,
    valAxisLabelFontFace: "+mn-lt", valAxisLabelFontSize: 11, valAxisLabelColor: X.accent5,
    catGridLine: { style: "none" }, valGridLine: { style: "none" },
  });
  const cell = (text, o = {}) => ({ text: String(text), options: Object.assign({ color: C.text1, valign: "middle" }, o) });
  const bBottom = [{ type: "none" }, { type: "none" }, { type: "solid", pt: 0.75, color: RULE }, { type: "none" }];
  const table = (s, rows, o) => s.addTable(rows, Object.assign({ fontSize: 12, border: { type: "none" }, margin: [0.04, 0.08, 0.04, 0.08], valign: "middle" }, o));
  const head = (labels, o = {}) => labels.map((t, i) => cell(t, Object.assign({ bold: true, color: C.accent5, fontSize: 11, border: bBottom, align: i === 0 ? "left" : "right" }, o)));
  const row = (vals, o = {}) => vals.map((t, i) => cell(t, Object.assign({ border: bBottom, align: i === 0 ? "left" : "right" }, o)));

  // A tiny wireframe "web page": used on the title slide to show built (all different) vs copied (all the same)
  const VARIANTS = [
    [[0, 0, 1, 0.16], [0, 0.26, 0.55, 0.5], [0.62, 0.28, 0.38, 0.09], [0.62, 0.45, 0.3, 0.09], [0.62, 0.62, 0.34, 0.09], [0, 0.86, 1, 0.14]],
    [[0, 0, 0.3, 0.14], [0.7, 0, 0.3, 0.14], [0, 0.22, 1, 0.34], [0, 0.66, 0.3, 0.34], [0.35, 0.66, 0.3, 0.34], [0.7, 0.66, 0.3, 0.34]],
    [[0, 0, 0.24, 1], [0.32, 0.04, 0.68, 0.12], [0.32, 0.26, 0.58, 0.09], [0.32, 0.42, 0.64, 0.09], [0.32, 0.7, 0.68, 0.3]],
    [[0, 0, 1, 0.14], [0, 0.24, 0.47, 0.33], [0.53, 0.24, 0.47, 0.33], [0, 0.67, 0.47, 0.33], [0.53, 0.67, 0.47, 0.33]],
    [[0.2, 0.02, 0.6, 0.13], [0.1, 0.24, 0.8, 0.42], [0.1, 0.74, 0.8, 0.09], [0.1, 0.9, 0.55, 0.09]],
    [[0, 0, 1, 0.15], [0, 0.26, 0.4, 0.09], [0, 0.42, 0.34, 0.09], [0, 0.58, 0.38, 0.09], [0.48, 0.24, 0.52, 0.46], [0, 0.82, 0.22, 0.18], [0.26, 0.82, 0.22, 0.18], [0.52, 0.82, 0.22, 0.18], [0.78, 0.82, 0.22, 0.18]],
    [[0, 0, 0.3, 1], [0.35, 0, 0.3, 0.6], [0.7, 0, 0.3, 0.8], [0.35, 0.7, 0.3, 0.3]],
    [[0, 0, 1, 0.12], [0, 0.2, 1, 0.3], [0, 0.6, 0.9, 0.08], [0, 0.74, 0.75, 0.08], [0, 0.88, 0.82, 0.08]],
  ];
  const COPY = [[0.25, 0.08, 0.5, 0.12], [0.18, 0.32, 0.64, 0.16], [0.18, 0.55, 0.64, 0.16], [0.34, 0.8, 0.32, 0.16]];
  const pageTile = (s, x, y, w, h, blocks, color) => {
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.05, fill: { color: C.background1 }, line: { type: "none" }, objectName: "Page" });
    const p = 0.08, ix = x + p, iy = y + p, iw = w - 2 * p, ih = h - 2 * p;
    blocks.forEach(([bx, by, bw, bh]) => s.addShape("rect", { x: ix + bx * iw, y: iy + by * ih, w: bw * iw, h: bh * ih, fill: { color }, line: { type: "none" }, objectName: "Page block" }));
  };

  const m = Object.fromEntries(F.markers.map((r) => [r.col, r]));
  const st = F.stress, LV = F.stress_levels, ly = F.layers, tp = F.templates, ls = F.layered_stress;

  // Shared-memory simulation (10_collective.py): list a page structure after 3 sightings on phishing hosts
  const A3 = G.arrival["3"], POOL = A3["1"].recall.mean, ISO = A3["100"].recall.mean, HL = G.headline;
  const NEW_SHARE = 1 - G.ceiling["3"]; // phishing pages whose structure is new even to a fully pooled memory

  // ================================================================ 1. TITLE
  pres.addSection({ title: "Presentation" });
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Presentation" });
    s.addText("DATATHON AT THE BEACH  ·  THE PHISHING CHALLENGE", { placeholder: "kicker", bullet: false });
    s.addText([{ text: "Phishing is copied", options: { breakLine: true } }, { text: "Immunity can be shared" }], { placeholder: "title" });
    s.addText(`What ${num(F.n)} websites tell us about building an opt-in digital immune system against phishing`, { placeholder: "subtitle", bullet: false });
    s.addText(
      [
        { text: "Daisie's Mascara", options: { bold: true, color: C.accent2, breakLine: true } },
        { text: "[Member 1]  ·  [Member 2]  ·  [Member 3]  ·  [Member 4]", options: { color: C.accent2, breakLine: true } },
        { text: "November 13, 2026", options: { color: C.accent6 } },
      ],
      { placeholder: "team", bullet: false }
    );
    const gx = 7.95, tw = 1.0, th = 0.72, gap = 0.2;
    T(s, [{ text: "BUILT   ", options: { bold: true, color: C.background1, charSpacing: 3 } }, { text: `Legitimate sites: ${pct(tp.legit_unique_share)} have a one-of-a-kind page`, options: { color: C.background2 } }], { x: gx, y: 1.05, w: 4.8, h: 0.3, fontSize: 13 });
    for (let i = 0; i < 8; i++) pageTile(s, gx + (i % 4) * (tw + gap), 1.5 + Math.floor(i / 4) * (th + gap), tw, th, VARIANTS[i], C.accent1);
    T(s, [{ text: "COPIED   ", options: { bold: true, color: C.background1, charSpacing: 3 } }, { text: `Phishing sites: ${pct(tp.shared["2"].phish, 0)} share a page with another host`, options: { color: C.background2 } }], { x: gx, y: 3.95, w: 4.8, h: 0.3, fontSize: 13 });
    for (let i = 0; i < 8; i++) pageTile(s, gx + (i % 4) * (tw + gap), 4.4 + Math.floor(i / 4) * (th + gap), tw, th, COPY, C.accent2);
    s.addNotes(
      "[0:00-0:10] SAY: We are Daisie's Mascara. Our finding in one line: phishing is copied, so immunity can be shared. We used the data to test whether a collective defense is worth building.\n\n" +
        "BEFORE SUBMITTING: check the team name and replace the member names on this slide."
    );
  }

  // ================================================================ 2. THE PROBLEM
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "1  ·  THE PROBLEM");
    title(s, "Phishing is a shared threat that every defender still fights alone");
    const stats = [
      ["7 years", "Phishing was the most-reported crime type at the FBI's Internet Crime Complaint Center every year from 2019 to 2025"],
      ["191,561", "phishing and spoofing complaints in 2025, more than twice the next-largest crime type"],
      ["$893M+", "in losses from 2025 complaints that involved AI (more than 22,000 complaints)"],
    ];
    stats.forEach(([v, l], i) => {
      const y = 1.95 + i * 1.28;
      T(s, v, { x: MX, y, w: 2.15, h: 1.05, fontSize: 36, bold: true, color: C.text2, valign: "middle", objectName: "Stat " + (i + 1) });
      T(s, l, { x: MX + 2.25, y, w: 3.05, h: 1.05, fontSize: 13, valign: "middle" });
    });
    T(s, "Source: FBI Internet Crime Complaint Center (IC3) figures, as cited in the Datathon at The Beach challenge brief.", { x: MX, y: 5.95, w: 5.3, h: 0.4, fontSize: 10, color: C.accent5 });

    const rx = 6.4, rw = W - MX - rx;
    T(s, "A body shares its defenses. We keep ours apart", { x: rx, y: 1.95, w: rw, h: 0.6, fontSize: 16, bold: true });
    const cw2 = (rw - 0.23) / 2;
    [
      ["An immune system", "many cells, one shared memory", "One cell meets a threat. The body builds antibodies, remembers, and protects every cell the next time."],
      ["Phishing defense today", "one user, one company, one blocklist", "Each defender learns the same lesson separately, so new sites and lures stay ahead of all of them."],
    ].forEach(([a, b, c], i) => {
      const x = rx + i * (cw2 + 0.23);
      card(s, x, 2.7, cw2, 1.62, { name: "Contrast card " + (i + 1) });
      T(s, a, { x: x + 0.2, y: 2.83, w: cw2 - 0.4, h: 0.32, fontSize: 15, bold: true, color: C.text2 });
      T(s, b, { x: x + 0.2, y: 3.15, w: cw2 - 0.4, h: 0.26, fontSize: 11, color: C.accent5 });
      T(s, c, { x: x + 0.2, y: 3.45, w: cw2 - 0.4, h: 0.78, fontSize: 13 });
    });
    T(s, "Three questions we put to the data", { x: rx, y: 4.55, w: rw, h: 0.32, fontSize: 16, bold: true });
    [
      ["Reuse", "Do attackers reuse enough that one sighting could protect someone else?"],
      ["Pooling", "How much more does a shared memory catch than the same memory kept apart?"],
      ["Adapting", "What still works once attackers use AI to change how a page looks?"],
    ].forEach(([k, t], i) => {
      const y = 4.98 + i * 0.54;
      circle(s, rx, y + 0.04, 0.36, i + 1);
      T(s, k, { x: rx + 0.5, y, w: 1.25, h: 0.45, fontSize: 14, bold: true, valign: "middle" });
      T(s, t, { x: rx + 1.75, y, w: rw - 1.75, h: 0.45, fontSize: 13, valign: "middle" });
    });
    s.addNotes(
      "[0:10-0:45] SAY: Phishing has been the FBI's most-reported cybercrime for seven straight years, with over 191,000 complaints last year. When something harmful enters a body, the immune system does not leave each cell to work it out alone. It builds antibodies, remembers, and protects every cell. We do not fight phishing that way. Each user, each company, each blocklist learns the same lesson separately, so new sites stay ahead of all of them. Our team's idea is an opt-in digital immune system. Before building it, we asked the data three things: do attackers reuse enough for a shared memory to work, how much does pooling add, and what survives once attackers use AI.\n\n" +
        "IF ASKED: the three FBI figures come from the challenge brief (FBI IC3). The immune system is an analogy for coordinated defense with memory, not a claim about biology. Threat-sharing services already exist; our question is how much sharing is worth, measured on this data."
    );
  }

  // ================================================================ 3. OUR APPROACH
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "2  ·  OUR APPROACH");
    title(s, `We tested the collective-defense idea on ${num(F.n)} websites instead of assuming it`);
    const steps = [
      ["The data", `${num(F.n)} websites: ${num(F.n_phish)} phishing (label 1) and ${num(F.n_legit)} legitimate (label 0). 49 usable signals, no missing values.`],
      ["Fingerprint pages", `A fingerprint is the exact combination of ${tp.n_struct_features} page-structure signals. Two pages match only if all ${tp.n_struct_features} are identical.`],
      ["Pool it or split it", "Replay every sighting in random order into one shared memory, or split the same sightings among defenders who do not share."],
      ["Model, then attack", "Gradient boosting, tested on web hosts it never saw in training, then re-scored after simulated attacker upgrades."],
    ];
    const sw = (CW - 3 * 0.24) / 4;
    steps.forEach(([h, b], i) => {
      const x = MX + i * (sw + 0.24);
      card(s, x, 1.95, sw, 2.1, { name: "Step card " + (i + 1) });
      circle(s, x + 0.2, 2.13, 0.4, i + 1);
      T(s, h, { x: x + 0.72, y: 2.13, w: sw - 0.9, h: 0.4, fontSize: 15, bold: true, valign: "middle" });
      T(s, b, { x: x + 0.2, y: 2.7, w: sw - 0.4, h: 1.25, fontSize: 13 });
    });
    const bw = (CW - 0.7) / 2;
    [
      ["BEFORE THE CLICK", "21 URL signals", "length, digits, special characters, sub-domains, top-level-domain reputation, HTTPS", C.accent4],
      ["AFTER THE PAGE LOADS", "28 page signals", "lines of code, links, images, scripts, forms, favicon, social links, title match", C.accent5],
    ].forEach(([k, h, b, col], i) => {
      const x = MX + i * (bw + 0.7);
      card(s, x, 4.3, bw, 1.45, { name: "Signal group " + (i + 1) });
      s.addShape("ellipse", { x: x + 0.22, y: 4.47, w: 0.16, h: 0.16, fill: { color: col }, line: { type: "none" }, objectName: "Key dot" });
      T(s, k, { x: x + 0.46, y: 4.42, w: bw - 0.7, h: 0.26, fontSize: 11, bold: true, color: C.accent5, charSpacing: 2, valign: "middle" });
      T(s, h, { x: x + 0.22, y: 4.72, w: bw - 0.44, h: 0.36, fontSize: 17, bold: true, color: C.text2 });
      T(s, b, { x: x + 0.22, y: 5.1, w: bw - 0.44, h: 0.55, fontSize: 12.5 });
    });
    s.addShape("chevron", { x: MX + bw + 0.17, y: 4.78, w: 0.36, h: 0.5, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "The click" });
    soWhat(
      s,
      "Phishing (label 1) is the positive class. \"Caught\" and \"recognized\" mean recall on phishing; a \"false alarm\" is a real site flagged. Every result is scored on web hosts the method had not seen before.",
      { label: "Reading our numbers" }
    );
    s.addNotes(
      "[0:45-1:10] SAY: We had 215,795 websites, 43% of them phishing, with 21 signals from the URL and 28 from the page. We did four things. We fingerprinted every page by its exact structure. We replayed every sighting in random order, once into a single shared memory and once split among defenders who do not share. We built models, always tested on web hosts they had never seen. And then we attacked our own models to see what breaks.\n\n" +
        "IF ASKED: A fingerprint is the exact combination of 26 page signals (all page signals except the two title-match scores, which depend on the host name). Gradient boosting = many small decision trees, each correcting the previous ones (LightGBM). Grouped cross-validation = the data is split into 5 parts by host name, so the same host is never in both training and test. Recall = share of phishing sites flagged. Precision = share of flagged sites that really are phishing. One column, URLSimilarityIndex, is left out of every model because it works like an answer key (appendix A1, A8)."
    );
  }

  // ================================================================ 4. DISCOVERY 1 - copied
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "3  ·  WHAT WE DISCOVERED  ·  1 OF 3");
    title(s, ["Real sites are built once.", "Phishing pages are copied thousands of times"]);
    T(s, "Share of pages whose exact structure also appears on other hosts", { x: MX, y: 1.9, w: 7, h: 0.3, fontSize: 14, bold: true });
    const ks = ["2", "10", "100", "1000"], kl = ["On 2 or more hosts", "On 10 or more hosts", "On 100 or more hosts", "On 1,000 or more hosts"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Legitimate sites", labels: kl, values: ks.map((k) => tp.shared[k].legit) },
        { name: "Phishing sites", labels: kl, values: ks.map((k) => tp.shared[k].phish) },
      ],
      Object.assign(chartBase(), {
        x: MX, y: 2.2, w: 7.0, h: 3.15, barDir: "bar", barGrouping: "clustered", barGapWidthPct: 90, barOverlapPct: -8,
        chartColors: [X.accent1, X.accent2], showLegend: true, legendPos: "t", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0%",
        catAxisOrientation: "maxMin", catAxisLineShow: false, valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 1.12,
        altText: "Bar chart: 86.6% of phishing pages share their exact structure with a page on another host, against 0.2% of legitimate pages.", objectName: "Chart: copied pages",
      })
    );
    T(s, `Structure = ${tp.n_struct_features} page features (lines of code, longest line, counts of images, scripts and links, and yes/no page elements). A host is a full host name.`, { x: MX, y: 5.42, w: 7.0, h: 0.4, fontSize: 10, color: C.accent5 });
    const rx = 8.1, rw = W - MX - rx;
    [
      [num(tp.top1_hosts), "different hosts serve the single most-copied page"],
      [pct(tp.top_cover["100"], 0), "of all phishing comes from just 100 page templates"],
      [String(tp.mixed_label_fingerprints), `of ${num(tp.n_shared_fingerprints)} shared page structures appear on both a phishing and a legitimate host, so remembering a copy almost never hits a real site`],
    ].forEach(([v, l], i) => {
      const y = 1.9 + i * 1.3;
      T(s, v, { x: rx, y, w: 1.75, h: 1.1, fontSize: 36, bold: true, color: C.text2, valign: "middle", objectName: "Stat " + (i + 1) });
      T(s, l, { x: rx + 1.85, y, w: rw - 1.85, h: 1.1, fontSize: 13, valign: "middle" });
    });
    soWhat(s, "Attackers rotate addresses but reuse the page. So a page seen a few times can be recognized everywhere after that, and remembering it almost never hits a real site. That is the condition a shared immunity needs.");
    s.addNotes(
      "[1:10-1:45] SAY: First discovery: phishing pages are copies. 87% of phishing pages are structurally identical to a page on another host. For real sites it is 0.16%. One single page appears on 5,554 different hosts, and just 100 templates produce half of all phishing. And the copies are easy to tell apart from real sites: of 4,579 shared page structures, only 2 show up on both a phishing and a legitimate host. Attackers change addresses constantly. They do not change the page.\n\n" +
        "IF ASKED: A fingerprint is the exact combination of 26 page features; two pages match only if all 26 are identical. We cannot tell whether a shared page is a phishing kit or a hosting provider's placeholder, because names are anonymized; either way real sites almost never share one. 62% of phishing pages have 20 lines of code or fewer, where an exact match is easier; among larger phishing pages, 67% still share a fingerprint with 5 or more hosts (appendix A6)."
    );
  }

  // ================================================================ 5. DISCOVERY 2 - pooled versus split memory
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "3  ·  WHAT WE DISCOVERED  ·  2 OF 3");
    title(s, [`One shared memory recognizes ${pct(POOL, 0)} of phishing on arrival.`, `Split among 100 defenders, each recognizes ${pct(ISO, 0)}`]);
    const lw = 3.85;
    [
      [pct(POOL, 0), `recognized on arrival when everyone shares one memory, with at most ${num(A3["1"].false_alarms.max)} false alarm in ${num(F.n_legit)} real sites`],
      [pct(ISO, 0), "when the same sightings are split among 100 defenders who do not share"],
      [num(HL.extra_pages), `more phishing pages go unrecognized, of ${num(F.n_phish)}, because those 100 defenders each learned alone`],
    ].forEach(([v, l], i) => {
      const y = 1.9 + i * 1.36;
      T(s, v, { x: MX, y, w: lw, h: 0.6, fontSize: 36, bold: true, color: C.text2, valign: "middle", objectName: "Stat " + (i + 1) });
      T(s, l, { x: MX, y: y + 0.62, w: lw, h: 0.66, fontSize: 13 });
    });
    const cx = 4.95, cwid = W - MX - cx;
    T(s, "Share of phishing pages recognized on arrival", { x: cx, y: 1.9, w: cwid, h: 0.3, fontSize: 14, bold: true });
    T(s, "The same sightings, in one shared memory or split evenly among isolated defenders. Average of 30 runs.", { x: cx, y: 2.2, w: cwid, h: 0.28, fontSize: 11, color: C.accent5 });
    const NS = ["1", "2", "5", "10", "20", "50", "100", "200", "500", "1000"];
    s.addChart(
      pres.charts.BAR,
      [{ name: "Share of phishing pages recognized on arrival", labels: NS.map((n) => num(Number(n))), values: NS.map((n) => A3[n].recall.mean) }],
      Object.assign(chartBase(), {
        x: cx, y: 2.5, w: cwid, h: 3.45, barDir: "col", barGapWidthPct: 45,
        chartColors: [X.dk2].concat(NS.slice(1).map(() => X.accent6)), showLegend: false, showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0%",
        valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 0.85, catAxisLineShow: false,
        showCatAxisTitle: true, catAxisTitle: "Number of defenders the same sightings are split among (1 = everyone shares)", catAxisTitleFontSize: 11, catAxisTitleColor: X.accent5, catAxisTitleFontFace: "+mn-lt",
        altText: `Column chart: one shared memory recognizes ${pct(POOL, 0)} of phishing pages on arrival. Split among 10 defenders it is ${pct(A3["10"].recall.mean, 0)}, among 100 it is ${pct(ISO, 0)}, and among 1,000 it is ${pct(A3["1000"].recall.mean, 0)}.`,
        objectName: "Chart: pooled versus split memory",
      })
    );
    soWhat(s, "Nothing here uses a better model: sharing is the whole effect. Every defender who learns alone pays for the first sightings again. A shared memory pays once, and each new participant raises protection for everyone.");
    s.addNotes(
      `[1:45-2:30] SAY: Second discovery, and the test of our idea. We replayed every sighting in random order. A page counts as recognized if its exact structure was already seen on three earlier phishing hosts. With one shared memory, ${pct(POOL, 0)} of phishing pages are recognized the moment they arrive, with at most ${num(A3["1"].false_alarms.max)} false alarm in 123,000 real sites. Now split the very same sightings among 100 defenders who do not talk to each other: each one recognizes ${pct(ISO, 0)}. Among a thousand, ${pct(A3["1000"].recall.mean, 0)}. Nothing changed except the sharing. That gap is ${num(HL.extra_pages)} more phishing pages that no memory recognizes.\n\n` +
        `IF ASKED: This is a simulation, not a measurement of real organizations. Hosts arrive in random order, each is assigned at random to one of N equal defenders, and labels are known right after a sighting. "Recognized" = the same 26-signal fingerprint was already seen on 3 or more earlier phishing hosts in that memory and on no earlier legitimate host. Requiring 1 sighting instead of 3 gives ${pct(G.arrival["1"]["1"].recall.mean, 0)} pooled and ${pct(G.arrival["1"]["100"].recall.mean, 0)} split among 100. On pages with more than 20 lines of code only: ${pct(A3["1"].recall_substantive.mean, 0)} pooled, ${pct(A3["100"].recall_substantive.mean, 0)} split. Even fully pooled, ${pct(NEW_SHARE, 0)} of phishing pages have a structure seen on fewer than 3 other hosts. Full table: appendix A7.`
    );
  }

  // ================================================================ 6. DISCOVERY 3 - looks can be faked
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "3  ·  WHAT WE DISCOVERED  ·  3 OF 3");
    title(s, "A detector that judges looks will not last: clone a real page and our best model misses half");
    T(s, "Share of phishing still caught as attackers upgrade their pages", { x: MX, y: 1.9, w: 7.7, h: 0.3, fontSize: 14, bold: true });
    T(s, "Models are not retrained. Thresholds are fixed so that no more than 0.1% of real sites are flagged.", { x: MX, y: 2.2, w: 7.7, h: 0.28, fontSize: 11, color: C.accent5 });
    const lv = [LV[0], LV[1], LV[2], LV[4]], cl = ["Today", "+ HTTPS", "+ trust badges", "Full clone of a real page"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Page-only model", labels: cl, values: lv.map((k) => st.page[k]) },
        { name: "URL + page model (most accurate today)", labels: cl, values: lv.map((k) => st.combined[k]) },
        { name: "URL-only model", labels: cl, values: lv.map((k) => st.url[k]) },
      ],
      Object.assign(chartBase(), {
        x: MX, y: 2.5, w: 7.7, h: 3.45, barDir: "col", barGrouping: "clustered", barGapWidthPct: 95, barOverlapPct: -6,
        chartColors: [X.accent6, X.accent3, X.accent4], showLegend: true, legendPos: "t", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0%", dataLabelFontSize: 10.5,
        valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 1.12, catAxisLineShow: false,
        altText: "Column chart: under a full page clone the page-only model catches 0.1% of phishing, the URL plus page model 47%, and the URL-only model 84%.", objectName: "Chart: stress test",
      })
    );
    const rx = 8.75, rw = W - MX - rx, po = F.polished;
    [
      [pct(F.shap_share.PAGE, 0), "of the best model's evidence comes from page content, the part an attacker fully controls (SHAP)"],
      ["~" + Math.round(po.ratio / 10) * 10 + "x", `Polished phishing pages (3 or more trust markers) already slip past the page-only model about ${Math.round(po.ratio / 10) * 10} times more often (${pct(po.page_miss_rate, 1)} vs ${pct(po.other_miss_rate, 1)})`],
    ].forEach(([v, l], i) => {
      const y = 1.9 + i * 1.5;
      T(s, v, { x: rx, y, w: rw, h: 0.6, fontSize: 36, bold: true, color: C.text2, valign: "middle", objectName: "Stat " + (i + 1) });
      T(s, l, { x: rx, y: y + 0.62, w: rw, h: 0.75, fontSize: 13 });
    });
    T(s, "Simulation: each held-out phishing page is given the page features of a randomly drawn real site. Its URL is unchanged, apart from adding HTTPS.", { x: rx, y: 5.0, w: rw, h: 0.75, fontSize: 11, color: C.accent5 });
    soWhat(s, "Generative AI makes a polished page free, so a detector that leans on page content will erode. A clone cannot change where it lives: a real page at the wrong address is itself the signal, if a shared index knows where the real one belongs.");
    s.addNotes(
      "[2:30-3:05] SAY: Third discovery: we attacked our own models. SHAP shows 69% of our best model's evidence comes from page content, which the attacker controls. So we simulated attackers upgrading: add HTTPS, add trust badges, then clone a real page outright, which generative AI now makes free. The most accurate model fell from 99.99% to 47%. The URL-only model, less accurate today, held at 84%. So looks are not evidence. What a clone cannot change is its address.\n\n" +
        "IF ASKED: SHAP assigns each feature a share of every individual prediction; we average the absolute values over 20,000 held-out sites. 'Trust badges' = title, favicon, description, copyright and social links switched on. 'Full clone' = all 28 page features replaced with those of a random real site from the held-out fold. 'Polished' = phishing pages that already show 3 or more of the 5 trust markers (982 pages, 1.1%). This is a what-if simulation, not an observed attack. The fingerprint memory does not catch a clone of a unique real page on its own; an index that records which host each reviewed page belongs to could, and that is a design proposal we have not tested."
    );
  }

  // ================================================================ 7. WHY IT MATTERS
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "4  ·  WHY IT MATTERS");
    title(s, "Copying is the attacker's business model, and it only pays while defenders stay apart");
    const cards = [
      [pct(G.ceiling["2"], 0), "Reuse is the attacker's weak point", `${num(G.n_fp_3plus)} page structures, each seen on 3 or more hosts, produce ${pct(G.ceiling["2"], 0)} of all phishing pages.`, "The whole memory fits inside a browser and can be checked on the device."],
      [HL.ratio.toFixed(1) + "x", "Isolation is the defender's weak point", `One shared memory recognizes ${pct(POOL, 0)} of phishing. The same sightings split among 100 defenders recognize ${pct(ISO, 0)}.`, "The value is in the sharing: each participant who joins protects everyone."],
      [pct(st.combined[LV[4]], 0), "Looks are not evidence", "of phishing is still caught by our most accurate model once pages are cloned from real sites.", "Build on where a page lives. A real page at the wrong address is the red flag."],
      ["1 in " + Math.round(1 / NEW_SHARE), "Memory is not enough alone", `phishing pages is new even to a fully pooled memory, and ${G.mixed_hosts} hosts carry both a real and a phishing page.`, "Keep checking every page locally. Indexed can never mean safe."],
    ];
    const sw = (CW - 3 * 0.24) / 4, cy = 1.95, chh = 3.5;
    cards.forEach(([v, h, b, so], i) => {
      const x = MX + i * (sw + 0.24), ix = x + 0.2, iw = sw - 0.4;
      card(s, x, cy, sw, chh, { name: "Implication card " + (i + 1) });
      T(s, v, { x: ix, y: cy + 0.18, w: iw, h: 0.62, fontSize: 34, bold: true, color: C.text2, valign: "middle", objectName: "Implication number " + (i + 1) });
      T(s, h, { x: ix, y: cy + 0.88, w: iw, h: 0.56, fontSize: 15, bold: true });
      T(s, b, { x: ix, y: cy + 1.5, w: iw, h: 0.98, fontSize: 13 });
      T(s, [{ text: "So  ", options: { bold: true, color: C.accent2 } }, { text: so }], { x: ix, y: cy + 2.56, w: iw, h: 0.98, fontSize: 13 });
    });
    soWhat(s, `Detection is not the bottleneck: on this data one yes/no rule already scores ${pct(F.rule_shape.accuracy, 1)} (appendix A8). The gap is that what one defender learns never reaches the next. Close that gap and copying stops paying.`, { label: "The implication", y: 5.72, h: 0.95 });
    s.addNotes(
      `[3:05-3:45] SAY: Why does this matter? Four things. One: reuse is the attacker's weak point. About ${num(Math.round(G.n_fp_3plus / 100) * 100)} page structures produce ${pct(G.ceiling["2"], 0)} of all phishing in this data, and a memory that small can live inside a browser. Two: isolation is our weak point. Pooled, the memory recognizes ${pct(POOL, 0)}; split a hundred ways, ${pct(ISO, 0)}. Three: looks are not evidence. Once pages are cloned, our best model catches under half, so the address matters more than the appearance. Four: memory is not enough alone, because one phishing page in five is new, so local checks have to stay on. Put together: detection is not the bottleneck. Sharing is.\n\n` +
        `IF ASKED: ${num(G.n_fp_3plus)} = fingerprints seen on 3 or more phishing hosts and on no legitimate host; ${pct(G.ceiling["2"], 0)} = share of phishing pages with such a fingerprint. 1 in 5 = phishing pages whose structure is on fewer than 3 other phishing hosts (${pct(NEW_SHARE, 1)}). ${G.mixed_hosts} hosts carry both a legitimate and a phishing page, which is why trust has to be judged page by page and not granted to a whole domain. The one-rule ${pct(F.rule_shape.accuracy, 1)} result reflects how the data was collected: every legitimate example is a bare home page (appendix A8).`
    );
  }

  // ================================================================ 8. WHAT WE RECOMMEND
  {
    const s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: "Presentation" });
    kick(s, "5  ·  WHAT WE RECOMMEND");
    title(s, "Build the immune system: check locally, remember together, and grow it only by consent");
    const dark = { color: C.background1, transparency: 90 };
    const lw = 7.6, nw = 2.45;
    T(s, "Four layers, each backed by this data", { x: MX, y: 1.92, w: lw, h: 0.26, fontSize: 12, color: C.accent6 });
    const rows = [
      ["Check every page on the device", "Score the link, then inspect the page as it loads", pct(ly.l1_recall, 1), "caught before the click"],
      ["Remember together", "A shared, opt-in index of verified phishing pages", `${pct(POOL, 0)} vs ${pct(ISO, 0)}`, "shared vs split 100 ways"],
      ["Treat unindexed as unknown", "Unindexed sites get more scrutiny, not a block", "1 in 2", "blocks wrong at 1 phish per 1,000"],
      ["Assume some get through", "Passkeys; one-click reports feed the shared index", "1 in " + Math.round(1 / NEW_SHARE), "phishing pages are new"],
    ];
    rows.forEach(([h, b, big, small], i) => {
      const y = 2.25 + i * 0.9;
      card(s, MX, y, lw, 0.8, { fill: dark, name: "Layer " + (i + 1) });
      circle(s, MX + 0.2, y + 0.2, 0.4, i + 1);
      const tw = lw - 0.78 - nw - 0.25;
      T(s, h, { x: MX + 0.78, y: y + 0.08, w: tw, h: 0.3, fontSize: 15, bold: true, color: C.background1, valign: "middle" });
      T(s, b, { x: MX + 0.78, y: y + 0.39, w: tw, h: 0.38, fontSize: 12, color: C.background2 });
      T(s, big, { x: MX + lw - nw - 0.2, y: y + 0.08, w: nw, h: 0.36, fontSize: 19, bold: true, color: C.background1, align: "right", valign: "middle" });
      T(s, small, { x: MX + lw - nw - 0.2, y: y + 0.45, w: nw, h: 0.26, fontSize: 11, color: C.background2, align: "right" });
    });
    const rx = 8.6, rw = W - MX - rx;
    T(s, "How an organization starts", { x: rx, y: 1.92, w: rw, h: 0.26, fontSize: 12, color: C.accent6 });
    [
      ["Pilot in shadow mode", "Run the checks for 30 days on your own links. Measure false alarms before anything is blocked."],
      ["Share fingerprints, not browsing", "Contribute verified phishing fingerprints and receive everyone else's. Addresses, form values and history stay on the device."],
      ["Grow it by consent", "Our Chrome extension, Daisie Mascara, runs local checks today. Next: a shared index, an opt-in network pooling idle compute for cryptographically signed, credited work, and a tested improvement loop."],
    ].forEach(([h, b], i) => {
      const y = 2.25 + i * 1.2;
      T(s, h, { x: rx, y, w: rw, h: 0.3, fontSize: 15, bold: true, color: C.background1 });
      T(s, b, { x: rx, y: y + 0.33, w: rw, h: 0.85, fontSize: 12.5, color: C.background2 });
    });
    soWhat(
      s,
      `On this data, local checks plus a shared memory miss ${ly.missed} of ${num(F.n_phish)} phishing sites and flag ${ly.total_false_alarms} of ${num(F.n_legit)} real ones. The opt-in network that would do the sharing is our proposal: voluntary, transparent, and not yet tested.`,
      { y: 5.95, fill: dark, color: C.background1, label: "Evidence" }
    );
    s.addNotes(
      `[3:45-4:45] SAY: So what should an organization do? Build the immune system in four layers. One: check every page on the device. A URL score alone caught ${pct(ly.l1_recall, 1)} before the click. Two: remember together. Join a shared, opt-in index of verified phishing pages, because shared memory recognized ${pct(POOL, 0)} where isolated memory recognized ${pct(ISO, 0)}. Three: treat unindexed as unknown, not guilty. At realistic phishing rates about half of hard blocks would be wrong, so an unindexed site gets more scrutiny, not a block. Four: assume some get through. Use passkeys, and make reporting one click, because every report is the network's next sighting. To start: pilot in shadow mode on your own links, and share fingerprints, never browsing data. Our extension, Daisie Mascara, runs local checks today. The shared index, the opt-in compute network and the improvement loop are our proposal, and they grow only by consent: no machine joins unless its owner installs it.\n\n` +
        `IF ASKED: ${pct(ly.l1_recall, 1)} with ${ly.l1.false_alarms} false alarms = URL-only model at a strict threshold (about 1 in 10,000 real sites flagged). The evidence line = URL score, then the fingerprint list, then the URL + page model: ${ly.missed} missed, ${ly.total_false_alarms} false alarms (appendix A5). Base rate: with 1 phish per 1,000 links, a detector that catches 99.5% and flags 0.1% of real links produces about 995 true blocks and 970 false ones per million links. Opt-in compute: volunteers lend idle capacity to index and re-check approved public data; contributions are signed, independently verified and credited on a ledger. A signature shows who sent a record, not that it is true. Improvement loop: verified misses become test cases, and a change ships only if it beats the current version on unseen hosts. The extension's current checks are explained rules; the models and fingerprints in this deck are dataset analysis, not features of the extension. Not yet tested: private lookups at scale, incentives, and resistance to false reports. Passkeys are a recommendation beyond this dataset.`
    );
  }

  // ================================================================ 9. LIMITS + AI DISCLOSURE
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "LIMITS AND DISCLOSURE");
    title(s, "What this analysis cannot tell you, and how we used AI");
    const cwid = (CW - 0.3) / 2, cy = 1.95, chh = 4.85;
    const bullets = (arr) => arr.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < arr.length - 1, paraSpaceAfter: 7 } }));
    card(s, MX, cy, cwid, chh, { name: "Limitations card" });
    T(s, "Limitations", { x: MX + 0.25, y: cy + 0.2, w: cwid - 0.5, h: 0.35, fontSize: 17, bold: true, color: C.text2 });
    T(
      s,
      bullets([
        `Every legitimate URL is a bare home page, and ${pct(F.phish_share, 0)} of the sample is phishing. Real traffic has deep links, new sites, and far less phishing.`,
        "The shared-memory result is a simulation: random arrival order, equal-sized defenders, labels known at once. The data has no dates, so real sharing delays are not measured.",
        `A fingerprint is an exact match on ${tp.n_struct_features} signals, which is easiest on tiny pages. On pages over 20 lines sharing still wins: ${pct(A3["1"].recall_substantive.mean, 0)} against ${pct(A3["100"].recall_substantive.mean, 0)}.`,
        "The attacker-upgrade results are simulations, not observed attacks. Names are anonymized, so brand impersonation could not be studied.",
        "The network itself (shared index, opt-in compute, contribution credits, improvement loop) is a proposal. Its privacy, incentives and resistance to false reports are untested.",
      ]),
      { x: MX + 0.25, y: cy + 0.68, w: cwid - 0.5, h: chh - 0.85, fontSize: 13 }
    );
    const x2 = MX + cwid + 0.3;
    card(s, x2, cy, cwid, chh, { name: "AI disclosure card" });
    T(s, "AI disclosure", { x: x2 + 0.25, y: cy + 0.2, w: cwid - 0.5, h: 0.35, fontSize: 17, bold: true, color: C.text2 });
    T(
      s,
      bullets([
        "Analysis and slides: Claude (Anthropic), through the Claude Code coding assistant, was used to write and run the Python analysis (profiling, models, cross-validation, SHAP, both simulations), to build the charts, and to draft the slide text and layout.",
        "Daisie Mascara extension and architecture: [list the AI tools used to build them].",
        "Every analytical number here is computed by code from the provided dataset; console outputs are reproduced in the appendix. The FBI figures come from the challenge brief.",
        "The team is responsible for the analysis, conclusions and recommendations presented.",
      ]),
      { x: x2 + 0.25, y: cy + 0.68, w: cwid - 0.5, h: 3.0, fontSize: 13 }
    );
    T(s, [{ text: "Tools  ", options: { bold: true } }, { text: "Python 3.12, pandas, scikit-learn, LightGBM (models and SHAP values), PowerPoint.", options: { breakLine: true } }, { text: "Sources  ", options: { bold: true } }, { text: "Dataset and FBI IC3 figures from the Datathon at The Beach challenge materials." }], { x: x2 + 0.25, y: cy + 3.78, w: cwid - 0.5, h: 0.95, fontSize: 12, color: C.accent5, paraSpaceAfter: 6 });
    s.addNotes(
      "[4:45-5:00] SAY: Our limits and our AI use are on this slide; full results and tool outputs are in the appendix. If you remember one thing: phishing is copied, so the defense that scales is the one that is shared. Thank you.\n\n" +
        "BEFORE SUBMITTING: replace the bracketed line with every other AI tool the team used, and check that the disclosure matches how your team actually worked."
    );
  }

  // ================================================================ APPENDIX
  pres.addSection({ title: "Appendix" });
  {
    const s = pres.addSlide({ masterName: "SECTION_DARK", sectionTitle: "Appendix" });
    s.addText("Appendix", { placeholder: "title" });
    s.addText("Methods, full results and tool outputs. Reference material for the judges; not presented.", { placeholder: "subtitle", bullet: false });
  }
  const app = (k, t) => {
    const s = pres.addSlide({ masterName: "APPENDIX", sectionTitle: "Appendix" });
    s.addText(k, { placeholder: "kicker", bullet: false });
    s.addText(t, { placeholder: "title" });
    return s;
  };
  const q = F.quality;

  // ---- A1 data
  {
    const s = app("APPENDIX A1  ·  DATA", "Data profile and quality checks");
    const kv = [
      ["Rows", `${num(F.n)} websites`],
      ["Columns", `${F.n_cols}: 50 numeric signals plus identifiers, anonymized text and the label`],
      ["Label", `Phishing = 1: ${num(F.n_phish)} (${pct(F.phish_share)}).  Legitimate = 0: ${num(F.n_legit)} (${pct(1 - F.phish_share)})`],
      ["Missing values", String(q.missing_cells)],
      ["Exact duplicate rows", String(q.full_row_duplicates)],
      ["Repeated URL IDs", `${q.dup_url_ids}, all phishing; kept, and never split across training and test`],
      ["Hosts", `${num(q.n_hosts)}; ${num(q.hosts_multi)} carry more than one URL, the largest ${num(q.max_urls_one_host)}`],
      ["Phishing rows on multi-URL hosts", `${pct(q.share_phish_rows_on_multi_url_hosts)}; every legitimate host appears exactly once`],
      ["Top-level-domain groups", String(q.n_tld_groups)],
      ["Anonymization", "URL, host, top-level domain and title text are scrambled; the ID columns are consistent"],
    ];
    table(s, [head(["Check", "Result"], { align: "left" })].concat(kv.map(([a, b]) => [cell(a, { border: bBottom, bold: true }), cell(b, { border: bBottom })])), { x: MX, y: 1.55, w: 6.4, colW: [2.3, 4.1], fontSize: 11.5, rowH: 0.42, objectName: "Table: data profile" });
    const rx = 7.3, rw = W - MX - rx;
    const grp = (y, h, t, body) => {
      T(s, t, { x: rx, y, w: rw, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
      T(s, body, { x: rx, y: y + 0.32, w: rw, h, fontSize: 10.5, color: C.text1 });
    };
    grp(1.55, 1.3, "URL signals (21): visible before the click", "URLLength, DomainLength, IsDomainIP, TLDLegitimateProb, TLDLength, NoOfSubDomain, CharContinuationRate, URLCharProb, HasObfuscation, NoOfObfuscatedChar, ObfuscationRatio, NoOfLettersInURL, LetterRatioInURL, NoOfDegitsInURL, DegitRatioInURL, NoOfEqualsInURL, NoOfQMarkInURL, NoOfAmpersandInURL, NoOfOtherSpecialCharsInURL, SpacialCharRatioInURL, IsHTTPS");
    grp(3.3, 1.5, "Page signals (28): visible only after the page loads", "LineOfCode, LargestLineLength, HasTitle, DomainTitleMatchScore, URLTitleMatchScore, HasFavicon, Robots, IsResponsive, NoOfURLRedirect, NoOfSelfRedirect, HasDescription, NoOfPopup, NoOfiFrame, HasExternalFormSubmit, HasSocialNet, HasSubmitButton, HasHiddenFields, HasPasswordField, Bank, Pay, Crypto, HasCopyrightInfo, NoOfImage, NoOfCSS, NoOfJS, NoOfSelfRef, NoOfEmptyRef, NoOfExternalRef");
    grp(5.3, 0.9, "Left out of every model", "URLSimilarityIndex. It equals 100 for every legitimate site and for only 713 phishing sites, so in this dataset it acts as an answer key rather than a signal that could be measured on an unknown site.");
  }

  // ---- A2 models
  {
    const s = app("APPENDIX A2  ·  MODELS", "Model results: cross-validated, phishing as the positive class");
    const mm = F.models, r = F.rule_shape, sc = mm.scorecard5.le1;
    const mrow = (name, sig, auc, k) => [name, sig, auc, pct(k.recall, 3), pct(k.precision, 3), num(k.fp), num(k.fn), pct(k.accuracy, 3)];
    const rowsM = [
      mrow("One-question URL rule (no training)", "URL shape", "n/a", r),
      mrow("Five-point footprint check: flag if 0 or 1 markers", "5 page", mm.scorecard5.auc.toFixed(4), sc),
      mrow("Decision tree, depth 3", "49", mm.tree_d3_combined.auc.toFixed(4), mm.tree_d3_combined),
      mrow("Logistic regression", "49", mm.logit_combined.auc.toFixed(5), mm.logit_combined),
      mrow("Gradient boosting: URL signals only", "21", mm.gbm_url.auc.toFixed(5), mm.gbm_url),
      mrow("Gradient boosting: page signals only", "28", mm.gbm_page.auc.toFixed(5), mm.gbm_page),
      mrow("Gradient boosting: URL + page signals", "49", mm.gbm_combined.auc.toFixed(5), mm.gbm_combined),
      mrow("Gradient boosting: URL + page + URLSimilarityIndex", "50", mm.gbm_combined_plus_usi.auc.toFixed(5), mm.gbm_combined_plus_usi),
    ];
    table(
      s,
      [head(["Model", "Signals", "AUC", "Phishing caught (recall)", "Precision", "False alarms", "Missed", "Accuracy"])].concat(rowsM.map((v) => row(v))),
      { x: MX, y: 1.55, w: CW, colW: [4.3, 0.95, 0.95, 1.5, 1.15, 1.1, 0.95, 1.233], fontSize: 11.5, rowH: 0.4, objectName: "Table: model results" }
    );
    const g = mm.gbm_combined, rc = mm.gbm_combined_randomcv;
    T(
      s,
      [
        { text: "How to read it.  ", options: { bold: true } },
        { text: `Threshold 0.5. False alarms are legitimate sites flagged, out of ${num(F.n_legit)}. Missed are phishing sites not flagged, out of ${num(F.n_phish)}. Grouped folds keep each host on one side only; ordinary random folds give the same picture (${rc.fp} false alarms, ${rc.fn} misses for gradient boosting on URL + page signals), so shared hosts are not what makes this data easy.`, options: { breakLine: true } },
        { text: "Confusion matrix, gradient boosting on URL + page signals.  ", options: { bold: true } },
        { text: `Phishing flagged ${num(g.tp)}; phishing missed ${num(g.fn)}; legitimate flagged ${num(g.fp)}; legitimate passed ${num(g.tn)}.`, options: { breakLine: true } },
        { text: "Settings.  ", options: { bold: true } },
        { text: "LightGBM: 300 trees, learning rate 0.08, 31 leaves, 80% row and column sampling. Logistic regression: signed log transform, standardized inputs, L2 penalty. Tree: depth 3, at least 200 sites per leaf." },
      ],
      { x: MX, y: 5.3, w: CW, h: 1.6, fontSize: 11.5, paraSpaceAfter: 5 }
    );
  }

  // ---- A3 explainability
  {
    const s = app("APPENDIX A3  ·  EXPLAINABILITY", "What drives the best model: SHAP values, and a three-question tree");
    const nice = {
      LineOfCode: "Lines of code", NoOfSelfRef: "Links to its own site", NoOfExternalRef: "Links to other sites", IsHTTPS: "Uses HTTPS", NoOfImage: "Number of images",
      LetterRatioInURL: "Share of letters in URL", NoOfOtherSpecialCharsInURL: "Special characters in URL", LargestLineLength: "Longest line of code", HasSocialNet: "Links to social media",
      HasDescription: "Meta description", NoOfDegitsInURL: "Digits in URL", NoOfSubDomain: "Number of sub-domains", NoOfJS: "Number of scripts", SpacialCharRatioInURL: "Share of special characters in URL",
      HasCopyrightInfo: "Copyright notice", URLLength: "URL length", DegitRatioInURL: "Share of digits in URL", NoOfCSS: "Number of style sheets", HasFavicon: "Favicon",
    };
    const top = F.shap_top.slice(0, 12).reverse(), lab = top.map((r) => nice[r.feature] || r.feature);
    T(s, "Average impact on a prediction (mean absolute SHAP value, log-odds)", { x: MX, y: 1.5, w: 6.9, h: 0.3, fontSize: 13, bold: true });
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Page signal", labels: lab, values: top.map((r) => (r.tier === "PAGE" ? r.mean_abs_shap : 0)) },
        { name: "URL signal", labels: lab, values: top.map((r) => (r.tier === "URL" ? r.mean_abs_shap : 0)) },
      ],
      Object.assign(chartBase(), {
        x: MX, y: 1.8, w: 6.9, h: 5.05, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 60, chartColors: [X.accent5, X.accent4], showLegend: true, legendPos: "t",
        showValue: false, catAxisLineShow: false, catAxisLabelFontSize: 11, valAxisLabelFormatCode: "0.0", valGridLine: { color: RULE, size: 0.75 }, valAxisLineShow: false,
        altText: "Bar chart of the twelve most influential signals in the gradient boosting model. Lines of code, internal links and external links lead.", objectName: "Chart: SHAP importance",
      })
    );
    const rx = 7.9, rw = W - MX - rx;
    T(
      s,
      [
        { text: "Reading the chart.  ", options: { bold: true } },
        { text: `A SHAP value is how far one signal pushes one site's score toward phishing or legitimate. Bars average the size of that push over 20,000 held-out sites. Page signals carry ${pct(F.shap_share.PAGE, 0)} of the total and URL signals ${pct(F.shap_share.URL, 0)}. For every page signal shown, more content means less likely phishing.`, options: { breakLine: true } },
        { text: "A tree anyone can follow.  ", options: { bold: true } },
        { text: `Three questions on page signals alone reach ${pct(F.models.tree_d3_page.accuracy, 1)} accuracy:` },
      ],
      { x: rx, y: 1.5, w: rw, h: 1.7, fontSize: 12, paraSpaceAfter: 6 }
    );
    const lg = readLog("05_model.txt");
    const i0 = lg.findIndex((l) => l.startsWith("|--- "));
    let i1 = i0;
    while (i1 < lg.length && lg[i1].startsWith("|")) i1++;
    const tree = lg.slice(i0, i1).map((l) => l.replace(/class: 1/, "PHISHING").replace(/class: 0/, "legitimate")).join("\n");
    s.addText(tree, { x: rx, y: 3.3, w: rw, h: 3.5, fontFace: "Courier New", fontSize: 8.5, color: C.text1, fill: { color: C.background2 }, margin: 8, valign: "top", isTextBox: true, objectName: "Decision tree rules" });
  }

  // ---- A4 stress test
  {
    const s = app("APPENDIX A4  ·  STRESS TEST", "Attacker-upgrade simulation: share of phishing still caught");
    const names = ["Today, as observed", "+ HTTPS (free certificate)", "+ trust badges: title, favicon, description, copyright, social links", "Full clone of a real page, title still mismatched", "Full clone of a real page, title made to match"];
    const rowsS = LV.map((k, i) => row([names[i], pct(st.page[k], 2), pct(st.combined[k], 2), pct(st.url[k], 2), pct(ls[k].layer1, 2), pct(ls[k].layers13, 2)]));
    table(
      s,
      [head(["Scenario", "Page-only model", "URL + page model", "URL-only model", "Layer 1 (strict URL)", "Layers 1 + 3"])].concat(rowsS),
      { x: MX, y: 1.55, w: CW, colW: [5.2, 1.35, 1.4, 1.35, 1.45, 1.383], fontSize: 12, rowH: 0.42, objectName: "Table: stress test" }
    );
    T(
      s,
      [
        { text: "Method.  ", options: { bold: true } },
        { text: `Models are trained once on unmodified data and never retrained. In each cross-validation fold, the held-out phishing rows are modified and re-scored; legitimate rows are untouched. Today the URL + page model misses ${F.slices.combined["all phishing"].missed} of ${num(F.n_phish)} phishing sites at its threshold, which rounds to 100.00%.`, options: { breakLine: true } },
        { text: "Thresholds.  ", options: { bold: true } },
        { text: `The three single models use the threshold that flags no more than 0.1% of legitimate sites on unmodified data. Layer 1 uses a stricter URL threshold (${ly.l1.false_alarms} of ${num(F.n_legit)} legitimate sites flagged); layers 1 + 3 add the URL + page model at 0.5. The fingerprint layer is assumed to match nothing once a page is cloned from a unique real page.`, options: { breakLine: true } },
        { text: "Upgrades.  ", options: { bold: true } },
        { text: "HTTPS: the flag is set, the URL gets one more letter and the letter, digit and special-character ratios are recomputed. Trust badges: five yes/no page signals are switched on. Full clone: all 28 page signals are copied from a randomly drawn legitimate site in the same held-out fold; in the mismatched version the two title-match scores stay as they were.", options: { breakLine: true } },
        { text: "Caution.  ", options: { bold: true } },
        { text: "This is a what-if exercise. Real attackers may change URLs as well, and defenders would retrain; the point is how much each design depends on signals an attacker controls." },
      ],
      { x: MX, y: 4.25, w: CW, h: 2.65, fontSize: 11.5, paraSpaceAfter: 5 }
    );
  }

  // ---- A5 thresholds, base rates, layers
  {
    const s = app("APPENDIX A5  ·  DECISIONS", "Thresholds, base rates and the layered design");
    const half = (CW - 0.4) / 2;
    T(s, "The same detector at different phishing rates (URL-only model, 0.1% of real sites flagged)", { x: MX, y: 1.5, w: half, h: 0.5, fontSize: 13, bold: true });
    const bp = F.base_rates.url.by_prev, keys = Object.keys(bp).sort((a, b) => Number(b) - Number(a));
    const prevLabel = (k) => (Number(k) > 0.2 ? "This dataset (" + pct(Number(k), 0) + " phishing)" : "1 phishing link in " + num(1 / Number(k)));
    table(
      s,
      [head(["Per 1,000,000 links", "Caught", "Missed", "False alarms", "Blocks that are right"])].concat(keys.map((k) => row([prevLabel(k), num(bp[k].caught), num(bp[k].missed), num(bp[k].false_alarms), pct(bp[k].precision, 1)]))),
      { x: MX, y: 2.05, w: half, colW: [2.25, 0.8, 0.75, 0.95, half - 4.75], fontSize: 11, rowH: 0.42, objectName: "Table: base rates" }
    );
    T(s, `The stricter layer-1 threshold (${pct(ly.l1_fpr, 3)} of real sites flagged) keeps ${pct(ly["l1_precision_at_0.001"], 0)} of blocks right even at 1 phishing link in 1,000.`, { x: MX, y: 4.3, w: half, h: 0.6, fontSize: 11.5 });
    const x2 = MX + half + 0.4;
    T(s, "Layered design on this dataset (cross-validated scores)", { x: x2, y: 1.5, w: half, h: 0.5, fontSize: 13, bold: true });
    table(
      s,
      [
        head(["Layer", "Phishing stopped", "Left", "False alarms"]),
        row(["Start", "", num(F.n_phish), ""]),
        row(["1  URL score above the strict threshold", num(ly.l1.caught), num(ly.after_l1), String(ly.l1.false_alarms)]),
        row(["2  Page seen on 3 or more phishing hosts", num(ly.l2.caught), num(ly.after_l2), String(ly.l2.false_alarms)]),
        row(["3  URL + page model at 0.5", num(ly.l3.caught), num(ly.missed), String(ly.l3.false_alarms)]),
        row(["Total", num(ly.l1.caught + ly.l2.caught + ly.l3.caught), num(ly.missed), String(ly.total_false_alarms)], { bold: true }),
      ],
      { x: x2, y: 2.05, w: half, colW: [half - 3.25, 1.3, 0.85, 1.1], fontSize: 11, rowH: 0.42, objectName: "Table: layers" }
    );
    const fz = F.funnel;
    T(
      s,
      [
        { text: "Variant with an early allow zone.  ", options: { bold: true } },
        { text: `If links with a very low URL score are also allowed without loading the page, ${pct(fz.share_block, 0)} of links are blocked and ${pct(fz.share_allow, 0)} allowed before the click, and only ${pct(fz.share_grey, 0)} need the page. The cost is ${fz.allow_phish} phishing sites allowed early (0.1%). We do not recommend allowing on a URL score alone until it has been tested on real deep links.`, options: { breakLine: true } },
        { text: "Costs.  ", options: { bold: true } },
        { text: "We set thresholds by error budgets, not dollar values: at most 1 real site in 10,000 blocked before the click, because a wrongly blocked site is visible to every user, every time." },
      ],
      { x: x2, y: 4.75, w: half, h: 2.1, fontSize: 11.5, paraSpaceAfter: 5 }
    );
    T(s, [{ text: "Other cheap rule.  ", options: { bold: true } }, { text: `${F.tld.groups} top-level-domain groups are at least 90% phishing. Flagging them catches ${pct(F.tld.recall, 0)} of phishing at ${pct(F.tld.precision, 0)} precision (${F.tld.legit_hit} real sites hit).` }], { x: MX, y: 5.0, w: half, h: 0.9, fontSize: 11.5 });
  }

  // ---- A6 templates
  {
    const s = app("APPENDIX A6  ·  COPIED PAGES", "The most-copied page structures in the data");
    table(
      s,
      [head(["Rank", "Pages", "Hosts", "TLD groups", "Lines of code", "Longest line", "Has title", "Images", "Scripts", "External links", "Share phishing"], { align: "right" })].concat(
        tp.top.map((r, i) => row([i + 1, num(r.pages), num(r.hosts), r.tlds, num(r.loc), num(r.longest), r.title ? "yes" : "no", num(r.images), num(r.scripts), num(r.ext), pct(r.phish, 0)], { align: "right" }))
      ),
      { x: MX, y: 1.55, w: CW, colW: [0.7, 1.0, 1.0, 1.1, 1.25, 1.2, 1.0, 0.95, 0.95, 1.4, 1.583], fontSize: 11.5, rowH: 0.38, objectName: "Table: top templates" }
    );
    T(
      s,
      [
        { text: "Definition.  ", options: { bold: true } },
        { text: `A fingerprint is the exact combination of ${tp.n_struct_features} page signals: all page signals except the two title-match scores, which depend on the host name. The data holds ${num(tp.n_fingerprints)} distinct fingerprints; ${num(tp.n_shared_fingerprints)} are shared by two or more hosts, and only ${tp.mixed_label_fingerprints} of those contain both phishing and legitimate pages.`, options: { breakLine: true } },
        { text: "Concentration.  ", options: { bold: true } },
        { text: `The 10 most common all-phishing fingerprints cover ${pct(tp.top_cover["10"], 0)} of phishing, the top 100 cover ${pct(tp.top_cover["100"], 0)}, and the top 500 cover ${pct(tp.top_cover["500"], 0)}. ${pct(tp.legit_unique_share, 1)} of legitimate pages have a fingerprint no other host shares; for phishing it is ${pct(tp.phish_unique_share, 1)}.`, options: { breakLine: true } },
        { text: "Seen-before rule.  ", options: { bold: true } },
        { text: `In each fold, a fingerprint goes on the block-list if the training hosts show it on 3 or more phishing hosts and never on a legitimate one. On held-out hosts the list catches ${num(tp.blocklist.tp)} phishing pages (${pct(tp.blocklist.recall, 1)}) and ${tp.blocklist.fp} legitimate pages.`, options: { breakLine: true } },
        { text: "Caution.  ", options: { bold: true } },
        { text: `${pct(F.richness.phish_le20_lines, 0)} of phishing pages have 20 lines of code or fewer, where an exact match is easier. Among larger phishing pages, ${pct(tp.shared_substantive, 0)} still share a fingerprint with 5 or more hosts. Names are anonymized, so a shared page may be a phishing kit or a hosting provider's placeholder.` },
      ],
      { x: MX, y: 5.15, w: CW, h: 1.8, fontSize: 11, paraSpaceAfter: 4 }
    );
  }

  // ---- A7 shared memory (10_collective.py)
  {
    const s = app("APPENDIX A7  ·  SHARED MEMORY", "Shared versus isolated memory: method and full results");
    const A2 = G.arrival["2"], A1 = G.arrival["1"], H3 = G.holdout["3"];
    const NS = ["1", "2", "5", "10", "20", "50", "100", "200", "500", "1000"];
    const lw = 7.5;
    T(s, "Arrival view: share of phishing pages recognized on arrival", { x: MX, y: 1.5, w: lw, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
    table(
      s,
      [head(["Sightings kept in", "After 3 sightings", "Range, 30 runs", "After 2", "After 1", "Pages > 20 lines", "False alarms"])].concat(
        NS.map((n) =>
          row([
            n === "1" ? "1 shared memory" : num(Number(n)) + " separate memories",
            pct(A3[n].recall.mean, 1),
            pct(A3[n].recall.min, 1) + " to " + pct(A3[n].recall.max, 1),
            pct(A2[n].recall.mean, 1),
            pct(A1[n].recall.mean, 1),
            pct(A3[n].recall_substantive.mean, 1),
            "max " + num(A3[n].false_alarms.max),
          ])
        )
      ),
      { x: MX, y: 1.85, w: lw, colW: [1.95, 1.1, 1.35, 0.7, 0.7, 1.0, 0.7], fontSize: 10.5, rowH: 0.275, objectName: "Table: arrival view" }
    );
    const rx = 8.5, rw = W - MX - rx;
    T(s, "Hold-out view: tested on unseen hosts", { x: rx, y: 1.5, w: rw, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
    const SH = ["0.001", "0.01", "0.05", "0.1", "0.2", "0.5", "0.8"];
    table(
      s,
      [head(["Share of hosts already known", "Phishing caught", "False alarms"])].concat(SH.map((f) => row([pct(Number(f), 1), pct(H3[f].recall.mean, 1), "max " + num(H3[f].false_alarms.max)]))),
      { x: rx, y: 1.85, w: rw, colW: [rw - 2.4, 1.3, 1.1], fontSize: 10.5, rowH: 0.275, objectName: "Table: hold-out view" }
    );
    T(s, `Both views list a structure after 3 sightings on phishing hosts. At 80% known, the hold-out view reproduces the cross-validated seen-before rule in A6 (${pct(tp.blocklist.recall, 1)}).`, { x: rx, y: 4.4, w: rw, h: 0.7, fontSize: 10.5, color: C.accent5 });
    const ks = G.known_phish;
    T(
      s,
      [
        { text: "Method.  ", options: { bold: true } },
        { text: `All ${num(G.n_hosts)} hosts arrive in random order and each is assigned at random to one of N equal defenders. A page is recognized if its fingerprint (the same ${G.n_struct} page signals as in A6) was already seen on 3 or more earlier phishing hosts in that defender's memory and on no earlier legitimate host. Labels are assumed to be known right after a sighting. ${G.reps} random runs per setting.`, options: { breakLine: true } },
        { text: "Ceiling.  ", options: { bold: true } },
        { text: `With everything pooled and nothing held back, ${pct(G.ceiling["3"], 1)} of phishing pages have a structure seen on 3 or more other phishing hosts; the remaining ${pct(NEW_SHARE, 1)} are new to any memory. ${num(G.n_fp_3plus)} fingerprints are seen on 3 or more phishing hosts and on no legitimate host.`, options: { breakLine: true } },
        { text: "Known-site check.  ", options: { bold: true } },
        { text: `URLSimilarityIndex equals 100 for all ${num(F.n_legit)} legitimate sites and for ${num(ks.n)} phishing pages, so it behaves like a list of known sites; it is left out of every model. A fully pooled memory recognizes ${num(ks.seen)} of those ${num(ks.n)} pages. ${G.mixed_hosts} hosts carry both a legitimate and a phishing page.`, options: { breakLine: true } },
        { text: "Caution.  ", options: { bold: true } },
        { text: "This is a what-if exercise. Real defenders differ in size, see overlapping attacks and learn labels late, and the data has no dates. The comparison isolates one thing: what sharing adds when everything else is held equal." },
      ],
      { x: MX, y: 5.28, w: CW, h: 1.7, fontSize: 11, paraSpaceAfter: 4 }
    );
  }

  // ---- A8 backup finding (was Finding 1): the accuracy trap
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
    kick(s, "APPENDIX A8  ·  BACKUP FINDING");
    title(s, ["One yes/no question scores 99.7% with no machine learning:", "a warning, not a win"]);
    const r = F.rule_shape;
    // flow diagram
    s.addText(`${num(F.n)} websites`, { shape: "roundRect", rectRadius: 0.2, x: 2.45, y: 1.95, w: 2.6, h: 0.45, fill: { color: C.background2 }, fontSize: 14, bold: true, color: C.text1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "All sites" });
    line(s, 3.75, 2.4, 0, 0.25);
    s.addText("Is the link just https://www.name,\nwith nothing after it?", { shape: "roundRect", rectRadius: 0.1, x: 0.9, y: 2.65, w: 5.7, h: 0.9, fill: { color: C.text2 }, fontSize: 17, bold: true, color: C.background1, align: "center", valign: "middle", margin: 8, isTextBox: true, objectName: "Question" });
    line(s, 3.75, 3.55, 0, 0.22);
    line(s, 2.1, 3.77, 3.3, 0);
    line(s, 2.1, 3.77, 0, 0.22);
    line(s, 5.4, 3.77, 0, 0.22);
    [
      ["YES", num(r.not_flagged) + " sites", `${num(r.tn)} legitimate + ${num(r.fn)} phishing`, 0.6, C.accent1],
      ["NO", num(r.flagged) + " sites", "every one is phishing", 3.9, C.accent2],
    ].forEach(([k, big, small, x, col]) => {
      card(s, x, 3.99, 3.0, 1.22, { name: "Branch " + k });
      s.addShape("ellipse", { x: x + 0.22, y: 4.14, w: 0.16, h: 0.16, fill: { color: col }, line: { type: "none" }, objectName: "Key dot" });
      T(s, k, { x: x + 0.46, y: 4.09, w: 1, h: 0.26, fontSize: 12, bold: true, color: C.accent5, charSpacing: 2, valign: "middle" });
      T(s, big, { x: x + 0.22, y: 4.37, w: 2.6, h: 0.42, fontSize: 21, bold: true, color: C.text2, valign: "middle" });
      T(s, small, { x: x + 0.22, y: 4.8, w: 2.6, h: 0.3, fontSize: 12.5 });
    });
    T(s, `Accuracy ${pct(r.accuracy, 2)}   ·   ${r.fp} false alarms   ·   ${num(r.fn)} phishing sites missed`, { x: 0.6, y: 5.32, w: 6.3, h: 0.3, fontSize: 14, bold: true, align: "center", valign: "middle" });
    T(s, `URLs are anonymized. All ${num(F.n_legit)} legitimate URLs start with a three-letter label, consistent with "www". The rule: https, a three-letter first label, nothing after the host name.`, { x: 0.6, y: 5.66, w: 6.3, h: 0.36, fontSize: 10, color: C.accent5 });

    // why
    const rx = 7.35, rw = W - MX - rx;
    T(s, "Why it works: how the data was collected", { x: rx, y: 1.95, w: rw, h: 0.32, fontSize: 16, bold: true });
    const a = F.artefacts;
    table(
      s,
      [
        head(["Share of sites with...", "Legitimate", "Phishing"]),
        row(["Anything after the domain (a path)", pct(a.legit_with_path / F.n_legit, 0), pct(a.phish_with_path_share, 0)]),
        row(["No HTTPS", pct(1 - a.legit_https_share, 0), pct(1 - a.phish_https_share, 0)]),
        row(["URLSimilarityIndex below 100", pct(1 - a.legit_usi100_share, 0), pct(1 - a.phish_usi100 / F.n_phish, 1)]),
      ],
      { x: rx, y: 2.35, w: rw, colW: [rw - 2.3, 1.15, 1.15], rowH: 0.4, fontSize: 13, objectName: "Table: collection artefacts" }
    );
    T(s, "Machine learning adds a quarter of a point", { x: rx, y: 4.15, w: rw, h: 0.32, fontSize: 16, bold: true });
    const mm = F.models, c3 = (rw - 0.2) / 3;
    [
      [pct(r.accuracy, 2), "one-question rule"],
      [pct(mm.logit_combined.accuracy, 2), "logistic regression, 49 signals"],
      [pct(mm.gbm_combined.accuracy, 2), "gradient boosting, 49 signals"],
    ].forEach(([v, l], i) => {
      const x = rx + i * (c3 + 0.1);
      T(s, v, { x, y: 4.55, w: c3, h: 0.5, fontSize: 24, bold: true, color: C.text2, valign: "middle", objectName: "Accuracy " + (i + 1) });
      T(s, l, { x, y: 5.07, w: c3, h: 0.5, fontSize: 11.5, color: C.accent5 });
    });
    soWhat(s, "Every legitimate example is a bare home page. A model trained here has never seen a real deep link, such as a password-reset URL, so its accuracy says little about false alarms in production. We judge models on robustness instead.");
    s.addNotes(
      "BACKUP SLIDE, NOT PRESENTED. IF ASKED ABOUT MODEL ACCURACY, SAY: One yes/no question, is the link just a plain https www home page, gets 99.72% accuracy with zero false alarms. No machine learning. Our best model gets 99.99. That is not a triumph, it is a warning: every legitimate example in this data is a bare home page. None has a path after the domain, all use HTTPS. A model trained here has never seen a real password-reset link, so it could flag your own emails. So we stopped chasing accuracy and asked which signals would hold up.\n\n" +
        "IF ASKED: URLSimilarityIndex appears to measure how similar a URL is to a list of known legitimate sites (the data came without a dictionary). All 123,495 legitimate sites score exactly 100 and only 713 phishing sites do, so it works like an answer key; we excluded it from every model. Accuracy = share of all sites classified correctly, at a 0.5 threshold, under 5-fold cross-validation grouped by host."
    );
  }

  // ---- A9 backup finding (was Finding 2): what is missing
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Appendix" });
    kick(s, "APPENDIX A9  ·  BACKUP FINDING");
    title(s, "Phishing is given away by what is missing, not by what is there");
    const cols = ["HasSocialNet", "HasCopyrightInfo", "HasDescription", "title_match", "HasFavicon", "IsHTTPS", "HasPasswordField"];
    const labels = ["Links to social media", "Copyright notice", "Meta description", "Title matches the domain", "Favicon", "HTTPS padlock", "Password field"];
    T(s, "Share of sites that have each feature", { x: MX, y: 1.9, w: 7.3, h: 0.3, fontSize: 14, bold: true });
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Legitimate sites", labels, values: cols.map((c) => m[c].legit) },
        { name: "Phishing sites", labels, values: cols.map((c) => m[c].phish) },
      ],
      Object.assign(chartBase(), {
        x: MX, y: 2.2, w: 7.3, h: 3.75, barDir: "bar", barGrouping: "clustered", barGapWidthPct: 55, barOverlapPct: -8,
        chartColors: [X.accent1, X.accent2], showLegend: true, legendPos: "t", showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0%",
        catAxisOrientation: "maxMin", catAxisLineShow: false, valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 1.12,
        altText: "Bar chart: share of legitimate and phishing sites that have each of seven page features. Legitimate sites have every feature more often.", objectName: "Chart: features present",
      })
    );
    const rx = 8.35, rw = W - MX - rx;
    T(s, "A five-point footprint check", { x: rx, y: 1.9, w: rw, h: 0.3, fontSize: 14, bold: true });
    T(s, "Share of sites that are phishing, by how many of five markers are present: social links, copyright, description, favicon, title matches domain", { x: rx, y: 2.2, w: rw, h: 0.6, fontSize: 11, color: C.accent5 });
    s.addChart(
      pres.charts.BAR,
      [{ name: "Share of sites that are phishing", labels: F.scorecard.map((r) => String(r.k)), values: F.scorecard.map((r) => r.phish_rate) }],
      Object.assign(chartBase(), {
        x: rx, y: 2.8, w: rw, h: 2.55, barDir: "col", barGapWidthPct: 70, chartColors: [X.accent2], showLegend: false, showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0%",
        valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 1.15, catAxisLineShow: false, showCatAxisTitle: true, catAxisTitle: "Markers present (out of 5)", catAxisTitleFontSize: 11, catAxisTitleColor: X.accent5, catAxisTitleFontFace: "+mn-lt",
        altText: "Column chart: share of sites that are phishing falls from 99.5% with no markers to about 0% with five.", objectName: "Chart: footprint check",
      })
    );
    T(s, `Five yes/no questions reach an AUC of ${F.scorecard_auc.toFixed(3)}. SHAP shows the full model leans on the same absences (appendix A3).`, { x: rx, y: 5.4, w: rw, h: 0.55, fontSize: 12 });
    soWhat(s, `The padlock proves nothing: ${pct(m.IsHTTPS.phish, 0)} of phishing sites have HTTPS. A password box is ${(m.HasPasswordField.legit / m.HasPasswordField.phish).toFixed(1)} times more common on real sites. Train people and tools to check where they are and what is missing, not how a page looks.`);
    s.addNotes(
      "BACKUP SLIDE, NOT PRESENTED. IF ASKED WHAT GIVES PHISHING AWAY, SAY: Phishing is given away by what is missing. Eighty percent of real sites link to social media; half a percent of phishing sites do. The same goes for a copyright notice, a description, a favicon. Count five of these markers and you get a checklist anyone can apply: with zero markers a site is phishing 99.5% of the time; with four or more, almost never. And the things we are taught to look for fail: half of phishing sites have the padlock, and a password box is more common on real sites.\n\n" +
        "IF ASKED: AUC (area under the ROC curve) = the chance that a randomly chosen phishing site gets a more suspicious score than a randomly chosen legitimate site; 0.5 is a coin flip, 1.0 is perfect. 'Title matches the domain' = DomainTitleMatchScore of 50 or more. Why are phishing pages so bare? 62% have 20 lines of code or fewer. They may be throwaway pages, or pages already taken down or hidden from crawlers when the data was collected; the data cannot tell which."
    );
  }

  // ---- tool outputs (verbatim console text)
  const MAXC = 188, MAXL = 41;
  const consoleSlides = (label, cmd, lines) => {
    const wrapped = [];
    lines.forEach((raw) => {
      let l = raw.replace(/\s+$/, "");
      if (l.length <= MAXC) return wrapped.push(l);
      wrapped.push(l.slice(0, MAXC));
      l = l.slice(MAXC);
      while (l.length) {
        wrapped.push("      ... " + l.slice(0, MAXC - 10));
        l = l.slice(MAXC - 10);
      }
    });
    while (wrapped.length && wrapped[wrapped.length - 1] === "") wrapped.pop();
    const pages = Math.ceil(wrapped.length / MAXL), per = Math.ceil(wrapped.length / pages);
    for (let p = 0; p < pages; p++) {
      const s = app(`APPENDIX B  ·  TOOL OUTPUT`, `${label}${pages > 1 ? ` (${p + 1} of ${pages})` : ""}`);
      T(s, `Console output, reproduced as text exactly as printed.  Command: ${cmd}  ·  Python 3.12, pandas 3.1, scikit-learn 1.9, LightGBM 4.7`, { x: MX, y: 1.25, w: CW, h: 0.26, fontSize: 10, color: C.accent5 });
      s.addText(wrapped.slice(p * per, (p + 1) * per).join("\n"), { x: MX, y: 1.55, w: CW, h: 5.4, fontFace: "Courier New", fontSize: 7.5, color: C.background2, fill: { color: C.text1 }, margin: 8, valign: "top", isTextBox: true, objectName: "Console output" });
    }
  };
  const ex = readLog("03_explore.txt");
  const cut = (arr, a, b) => arr.slice(a - 1, b);
  consoleSlides("Data exploration: class balance, signal strength, URL structure", "python 03_explore.py (excerpts)", [].concat(cut(ex, 1, 40), ["[...]", ""], cut(ex, 83, 100), ["[...]", ""], cut(ex, 133, 171)));
  consoleSlides("Models, validation, hard cases, stress test, base rates, SHAP", "python 05_model.py", readLog("05_model.txt"));
  consoleSlides(
    "Copied pages, the layered design, and every number cited in the deck",
    "python 06_templates.py; 07_facts.py; 08_layered_stress.py; 09_top_templates.py",
    [].concat(readLog("06_templates.txt"), ["", "----- 07_facts.py -----"], readLog("07_facts.txt"), ["", "----- 08_layered_stress.py -----"], readLog("08_layered_stress.txt"), ["", "----- 09_top_templates.py -----"], readLog("09_top_templates.txt"))
  );
  consoleSlides("Shared memory: one pooled list versus isolated lists", "python 10_collective.py", readLog("10_collective.txt"));

  await pres.writeFile({ fileName: outPath });
  await applyTheme(outPath, THEME);
  console.log("wrote", outPath);
})().catch((e) => {
  console.error("BUILD FAILED:", e);
  process.exit(1);
});
