"use strict";
// Builds the datathon deck. Every number on a slide is read from facts.json (computed by the Python scripts).
// usage: NODE_PATH=<node_modules> PPTX_SKILL=<skill dir> node build_deck.js <facts.json> <log_dir> <out.pptx>
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(path.join(process.env.PPTX_SKILL, "scripts/apply_theme.js"));

const [factsPath, logDir, outPath] = process.argv.slice(2);
const F = JSON.parse(fs.readFileSync(factsPath, "utf8"));
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
  pres.title = "Real websites are built. Phishing websites are copied.";
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
      ph("title", "title", { x: 0.7, y: 1.25, w: 6.4, h: 2.75, fontSize: 38, bold: true, color: C.background1, align: "left" }),
      ph("subtitle", "body", { x: 0.7, y: 4.1, w: 6.2, h: 1.15, fontSize: 17, color: C.background2, bullet: false }),
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

  // ================================================================ 1. TITLE
  pres.addSection({ title: "Presentation" });
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Presentation" });
    s.addText("DATATHON AT THE BEACH  ·  THE PHISHING CHALLENGE", { placeholder: "kicker", bullet: false });
    s.addText([{ text: "Real websites are built", options: { breakLine: true } }, { text: "Phishing websites are copied" }], { placeholder: "title" });
    s.addText(`What ${num(F.n)} websites reveal about spotting phishing, and why a 99.99%-accurate model is not the answer`, { placeholder: "subtitle", bullet: false });
    s.addText(
      [
        { text: "[TEAM NAME]", options: { bold: true, color: C.accent2, breakLine: true } },
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
      "[0:00-0:10] SAY: We are [team name]. Our finding in one line: real websites are built, phishing websites are copied. And a model that is 99.99% accurate today is not the answer.\n\n" +
        "BEFORE SUBMITTING: replace the team name and member names on this slide."
    );
  }

  // ================================================================ 2. PROBLEM
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "THE PROBLEM");
    title(s, "Every link forces a decision, and both mistakes are costly");
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
    T(s, "For every link, an organization has to choose: block it, inspect it, or allow it", { x: rx, y: 1.95, w: rw, h: 0.6, fontSize: 16, bold: true });
    const cw2 = (rw - 0.23) / 2;
    [
      ["Miss a phishing site", "false negative", "Stolen passwords, money and data"],
      ["Block a real site", "false alarm (false positive)", "Lost work, ignored warnings, help-desk load"],
    ].forEach(([a, b, c], i) => {
      const x = rx + i * (cw2 + 0.23);
      card(s, x, 2.7, cw2, 1.45, { name: "Error card " + (i + 1) });
      T(s, a, { x: x + 0.2, y: 2.83, w: cw2 - 0.4, h: 0.32, fontSize: 15, bold: true, color: C.text2 });
      T(s, b, { x: x + 0.2, y: 3.15, w: cw2 - 0.4, h: 0.26, fontSize: 11, color: C.accent5 });
      T(s, c, { x: x + 0.2, y: 3.45, w: cw2 - 0.4, h: 0.6, fontSize: 13 });
    });
    T(s, "Our three questions", { x: rx, y: 4.45, w: rw, h: 0.32, fontSize: 16, bold: true });
    [
      ["Identify", "Can phishing be spotted before the click, or only after the page loads?"],
      ["Understand", "What actually gives a phishing site away?"],
      ["Decide", "What should an organization do with a score, today and once attackers use AI?"],
    ].forEach(([k, t], i) => {
      const y = 4.9 + i * 0.56;
      circle(s, rx, y + 0.04, 0.36, i + 1);
      T(s, k, { x: rx + 0.5, y, w: 1.25, h: 0.45, fontSize: 14, bold: true, valign: "middle" });
      T(s, t, { x: rx + 1.75, y, w: rw - 1.75, h: 0.45, fontSize: 13, valign: "middle" });
    });
    s.addNotes(
      "[0:10-0:40] SAY: Phishing has been the FBI's most-reported cybercrime for seven straight years, with over 191,000 complaints last year, and complaints involving AI added more than 893 million dollars in losses. For a company, every link is a decision: block it, inspect it, or allow it. Miss a phishing site and you lose credentials or money. Block a real site and you lose work, and people stop trusting the warnings. So we asked three things: can we identify phishing early, what actually gives it away, and what should an organization do.\n\n" +
        "IF ASKED: the three FBI figures come from the challenge brief (FBI IC3)."
    );
  }

  // ================================================================ 3. APPROACH
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "OUR APPROACH");
    title(s, "We sorted every signal by when a defender can see it, then tried to break our own models");
    const steps = [
      ["The data", `${num(F.n)} websites: ${num(F.n_phish)} phishing (label 1) and ${num(F.n_legit)} legitimate (label 0). 49 usable signals, no missing values.`],
      ["Split by timing", "21 URL signals can be read before anyone clicks. 28 page signals exist only after the page loads."],
      ["Model and validate", "From one-line rules to gradient boosting. 5-fold cross-validation in which no web host appears in both training and test."],
      ["Explain and attack", "SHAP to see why a model decides. Hard-case subsets. Simulated attacker upgrades to see what breaks."],
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
      "Phishing (label 1) is the positive class. \"Caught\" means recall on phishing; a \"false alarm\" is a real site flagged. One column, URLSimilarityIndex, is left out of every model: the next slide shows why.",
      { label: "Reading our numbers" }
    );
    s.addNotes(
      "[0:40-1:05] SAY: We had 215,795 websites, 43% of them phishing. We split the 49 signals by when a defender can see them: 21 come from the URL alone, before anyone clicks; 28 need the page to load. We built models from one-line rules up to gradient boosting, always tested on web hosts the model had never seen, with phishing as the positive class. Then we tried to break them.\n\n" +
        "IF ASKED: Gradient boosting = many small decision trees, each correcting the previous ones (LightGBM). Grouped cross-validation = the data is split into 5 parts by host name, so the same host is never in both training and test; the model is trained on 4 parts and scored on the 5th, five times. Recall = share of phishing sites the model flags. Precision = share of flagged sites that really are phishing."
    );
  }

  // ================================================================ 4. FINDING 1 - the accuracy trap
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "FINDING 1  ·  IDENTIFY");
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
      "[1:05-1:45] SAY: First finding. One yes/no question, is the link just a plain https www home page, gets 99.72% accuracy with zero false alarms. No machine learning. Our best model gets 99.99. That is not a triumph, it is a warning: every legitimate example in this data is a bare home page. None has a path after the domain, all use HTTPS. A model trained here has never seen a real password-reset link, so it could flag your own emails. So we stopped chasing accuracy and asked which signals would hold up.\n\n" +
        "IF ASKED: URLSimilarityIndex measures how similar a URL is to a list of known legitimate sites. All 123,495 legitimate sites score exactly 100 and only 713 phishing sites do, so it works like an answer key; we excluded it from every model. Accuracy = share of all sites classified correctly, at a 0.5 threshold, under 5-fold cross-validation grouped by host."
    );
  }

  // ================================================================ 5. FINDING 2 - what is missing
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "FINDING 2  ·  UNDERSTAND");
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
      "[1:45-2:25] SAY: Second finding: phishing is given away by what is missing. Eighty percent of real sites link to social media; half a percent of phishing sites do. The same goes for a copyright notice, a description, a favicon. Count five of these markers and you get a checklist anyone can apply: with zero markers a site is phishing 99.5% of the time; with four or more, almost never. And the things we are taught to look for fail: half of phishing sites have the padlock, and a password box is more common on real sites.\n\n" +
        "IF ASKED: AUC (area under the ROC curve) = the chance that a randomly chosen phishing site gets a more suspicious score than a randomly chosen legitimate site; 0.5 is a coin flip, 1.0 is perfect. 'Title matches the domain' = DomainTitleMatchScore of 50 or more. Why are phishing pages so bare? 62% have 20 lines of code or fewer. They may be throwaway pages, or pages already taken down or hidden from crawlers when the data was collected; the data cannot tell which."
    );
  }

  // ================================================================ 6. FINDING 3 - copied
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "FINDING 3  ·  UNDERSTAND");
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
      [pct(tp.blocklist.recall, 0), `of phishing is caught by one rule, "seen this exact page on 3 or more other phishing hosts", with ${tp.blocklist.fp} false alarms in ${num(F.n_legit)} real sites`],
    ].forEach(([v, l], i) => {
      const y = 1.9 + i * 1.3;
      T(s, v, { x: rx, y, w: 1.75, h: 1.1, fontSize: 36, bold: true, color: C.text2, valign: "middle", objectName: "Stat " + (i + 1) });
      T(s, l, { x: rx + 1.85, y, w: rw - 1.85, h: 1.1, fontSize: 13, valign: "middle" });
    });
    soWhat(s, "Attackers rotate addresses but reuse the page. Block the template, not the URL: a fingerprint list needs no model, is easy to explain, and almost never hits a real site.");
    s.addNotes(
      "[2:25-3:05] SAY: Why is so much missing? Third finding: phishing pages are copies. 87% of phishing pages are structurally identical to a page on another host. For real sites it is 0.16%. One single page appears on 5,554 different hosts. So a simple rule, I have seen this exact page on three other phishing hosts, catches 78% of phishing with 2 false alarms out of 123,000 real sites. Attackers change addresses constantly; they do not change the page.\n\n" +
        "IF ASKED: A fingerprint is the exact combination of 26 page features; two pages match only if all 26 are identical. The 78% is cross-validated: the list of known phishing fingerprints is built from 4/5 of the hosts and tested on the remaining 1/5, so no host is on both sides. We cannot tell whether a shared page is a phishing kit or a hosting provider's placeholder, because names are anonymized; either way real sites almost never share one."
    );
  }

  // ================================================================ 7. FINDING 4 - stress test
  {
    const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Presentation" });
    kick(s, "FINDING 4  ·  DECIDE");
    title(s, "The most accurate model is the most fragile: clone a real page and it misses half");
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
    soWhat(s, "Generative AI makes a polished page free, so detection that leans on page content will erode. Choose and monitor models by how they hold up when attackers adapt, not by today's accuracy.");
    s.addNotes(
      "[3:05-3:45] SAY: Fourth: we attacked our own models. SHAP shows 69% of our best model's evidence comes from page content, which the attacker controls. So we simulated attackers upgrading: add HTTPS, add trust badges, then clone a real page outright, which generative AI now makes free. The most accurate model fell from 99.99% to 47%. The URL-only model, less accurate today, held at 84%. And it has already started: polished phishing pages slip past the page model about 40 times more often.\n\n" +
        "IF ASKED: SHAP assigns each feature a share of every individual prediction; we average the absolute values over 20,000 held-out sites. 'Trust badges' = title, favicon, description, copyright and social links switched on. 'Full clone' = all 28 page features replaced with those of a random real site from the held-out fold. 'Polished' = phishing pages that already show 3 or more of the 5 trust markers (982 pages, 1.1%). This is a what-if simulation, not an observed attack."
    );
  }

  // ================================================================ 8. RECOMMENDATION
  {
    const s = pres.addSlide({ masterName: "CONTENT_DARK", sectionTitle: "Presentation" });
    kick(s, "RECOMMENDATION  ·  DECIDE");
    title(s, "Layer the defense, starting with the signals that are cheapest to check and hardest to fake");
    const dark = { color: C.background1, transparency: 90 };
    const lw = 7.2;
    T(s, `${num(F.n_phish)} phishing sites in the data`, { x: MX, y: 1.92, w: lw, h: 0.26, fontSize: 12, color: C.accent6 });
    const rows = [
      ["Before the click: score the link", `A URL-only model stops ${pct(ly.l1_recall, 1)}`, num(ly.after_l1) + " left", ly.l1.false_alarms + " false alarms"],
      ["As the page loads: is it a known copy?", `A page-fingerprint list stops ${num(ly.l2.caught)} more`, num(ly.after_l2) + " left", ly.l2.false_alarms + " false alarms"],
      ["Still unsure: use the page model", `A URL + page model stops ${num(ly.l3.caught)} more`, num(ly.missed) + " left", ly.l3.false_alarms + " false alarms"],
      ["After the click: assume some get through", "Passkeys, one-click reporting, and training that says the padlock is not a safety signal", "", ""],
    ];
    rows.forEach(([h, b, big, small], i) => {
      const y = 2.25 + i * 0.9;
      card(s, MX, y, lw, 0.8, { fill: dark, name: "Layer " + (i + 1) });
      circle(s, MX + 0.2, y + 0.2, 0.4, i + 1);
      const tw = big ? 4.6 : lw - 1.0;
      T(s, h, { x: MX + 0.78, y: y + 0.08, w: tw, h: 0.3, fontSize: 15, bold: true, color: C.background1, valign: "middle" });
      T(s, b, { x: MX + 0.78, y: y + 0.39, w: tw, h: 0.38, fontSize: 12, color: C.background2 });
      if (big) {
        T(s, big, { x: MX + lw - 1.75, y: y + 0.08, w: 1.55, h: 0.36, fontSize: 19, bold: true, color: C.background1, align: "right", valign: "middle" });
        T(s, small, { x: MX + lw - 1.75, y: y + 0.45, w: 1.55, h: 0.26, fontSize: 11, color: C.background2, align: "right" });
      }
    });
    const rx = 8.25, rw = W - MX - rx;
    T(s, "Run it like this", { x: rx, y: 1.92, w: rw, h: 0.26, fontSize: 12, color: C.accent6 });
    [
      ["Buy robustness, not accuracy", `Require a clone stress test before purchase. Here the best single model fell to ${pct(st.combined[LV[4]], 0)}; this layered design held ${pct(ls[LV[4]].layers13, 0)}.`],
      ["Watch a Polish Index", `The share of caught phishing with 3 or more trust markers is ${pct(F.polished.share_of_phish, 1)} today. If it rises, attackers are upgrading: retrain.`],
      ["Pilot before you block", `Run 30 days in shadow mode on your own links. At 1 phish per 1,000 links, a 0.1% false-alarm rate makes half of all blocks wrong.`],
    ].forEach(([h, b], i) => {
      const y = 2.25 + i * 1.2;
      T(s, h, { x: rx, y, w: rw, h: 0.3, fontSize: 15, bold: true, color: C.background1 });
      T(s, b, { x: rx, y: y + 0.33, w: rw, h: 0.8, fontSize: 12.5, color: C.background2 });
    });
    soWhat(
      s,
      `On this data, layers 1 to 3 together miss ${ly.missed} of ${num(F.n_phish)} phishing sites and flag ${ly.total_false_alarms} of ${num(F.n_legit)} real ones. Layer 4 exists because a cloned page still gets past detection about 3 times in 10.`,
      { y: 5.95, fill: dark, color: C.background1, label: "The result" }
    );
    s.addNotes(
      "[3:45-4:45] SAY: So what should an organization do? Layer the defense, cheapest and hardest to fake first. One: score the link before the click. That alone stopped 99.4% with 13 false alarms. Two: fingerprint pages and block the copies, 436 more. Three: use the page model only on what is left. Together: 4 misses out of 92,300. And run it properly. Judge vendors by a stress test, not by accuracy. Track a Polish Index as an early warning. Pilot in shadow mode on your own traffic, because at one phish per thousand links a 0.1% false-alarm rate means half your blocks are wrong. And because a cloned page still gets through about three times in ten, make a stolen password useless with phishing-resistant sign-in.\n\n" +
        "IF ASKED: Layer 1 threshold is set so about 1 in 10,000 real sites is flagged (13 of 123,495). Base-rate arithmetic: precision = caught phishing / everything flagged. With 1 phish per 1,000 links, a detector that catches 99.5% and flags 0.1% of real links produces about 995 true blocks and 970 false ones per million links, so about half are wrong. The layered 70% under cloning is the URL layer at its strict threshold; at the looser 0.1% setting the URL model holds 84%. Passkeys are a recommendation beyond this dataset: they are bound to the real domain, so they do not work on a look-alike site."
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
        `Every legitimate URL is a bare home page, and ${pct(F.phish_share, 0)} of the sample is phishing. Real traffic has deep links, brand-new sites, and far less phishing.`,
        `Many phishing pages were almost empty when collected (${pct(F.richness.phish_2_lines, 0)} had 2 lines of code). The data cannot say whether they were built that way, already taken down, or hidden from crawlers.`,
        "The attacker-upgrade results are simulations under stated assumptions, not observed attacks.",
        "URLs, titles and top-level domains are anonymized, so we could not study brand impersonation or look-alike names.",
        "False-alarm rates must be re-measured on an organization's own traffic before anything is blocked.",
      ]),
      { x: MX + 0.25, y: cy + 0.68, w: cwid - 0.5, h: chh - 0.85, fontSize: 13 }
    );
    const x2 = MX + cwid + 0.3;
    card(s, x2, cy, cwid, chh, { name: "AI disclosure card" });
    T(s, "AI disclosure", { x: x2 + 0.25, y: cy + 0.2, w: cwid - 0.5, h: 0.35, fontSize: 17, bold: true, color: C.text2 });
    T(
      s,
      bullets([
        "AI tool used: Claude (Anthropic), through the Claude Code coding assistant.",
        "How it was used: to write and run the Python analysis (data profiling, models, cross-validation, SHAP, the stress-test simulation), to build the charts, and to draft the slide text and layout.",
        "Every analytical number in this deck is computed by code from the provided dataset; the console outputs are reproduced in the appendix. The FBI figures come from the challenge brief.",
        "The team is responsible for the analysis, conclusions and recommendations presented.",
      ]),
      { x: x2 + 0.25, y: cy + 0.68, w: cwid - 0.5, h: 2.75, fontSize: 13 }
    );
    T(s, [{ text: "Tools  ", options: { bold: true } }, { text: "Python 3.12, pandas, scikit-learn, LightGBM (models and SHAP values), PowerPoint.", options: { breakLine: true } }, { text: "Sources  ", options: { bold: true } }, { text: "Dataset and FBI IC3 figures from the Datathon at The Beach challenge materials." }], { x: x2 + 0.25, y: cy + 3.6, w: cwid - 0.5, h: 1.05, fontSize: 12, color: C.accent5, paraSpaceAfter: 6 });
    s.addNotes(
      "[4:45-5:00] SAY: Our limits and our AI use are on this slide; full results and tool outputs are in the appendix. If you remember one thing: do not buy accuracy. Buy defenses that still work when the attacker has AI. Thank you.\n\n" +
        "BEFORE SUBMITTING: check that the AI disclosure matches how your team actually worked, and edit it if not."
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

  await pres.writeFile({ fileName: outPath });
  await applyTheme(outPath, THEME);
  console.log("wrote", outPath);
})().catch((e) => {
  console.error("BUILD FAILED:", e);
  process.exit(1);
});
