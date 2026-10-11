import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.includes("--split-only")) {
  const legacy = path.join(root, "data", "app.json");
  writeDataModules(root, JSON.parse(fs.readFileSync(legacy, "utf8")));
  fs.unlinkSync(legacy);
  console.log("split data/app.json into data modules");
  process.exit(0);
}
const html = fs.readFileSync(path.join(root, "meritedge-plg-prototype.html"), "utf8");

const styleStart = html.indexOf("<style>") + "<style>".length;
const styleEnd = html.indexOf("</style>");
const css = html.slice(styleStart, styleEnd).trim().replaceAll('url("assets/', 'url("/assets/') + "\n";

const bodyStart = html.indexOf("<body>") + "<body>".length;
const scriptStart = html.indexOf("<script>", bodyStart);
const scriptEnd = html.lastIndexOf("</script>");
let shell = html.slice(bodyStart, scriptStart).trim() + "\n";
let engine = html.slice(scriptStart + "<script>".length, scriptEnd).trim() + "\n";

function mustReplace(label, source, from, to) {
  if (!source.includes(from)) throw new Error("Missing snippet: " + label);
  return source.replace(from, to);
}

shell = mustReplace(
  "workspace view",
  shell,
  '<div id="view-workspace" class="view">',
  '<div id="view-workspace" class="view on">'
);
shell = mustReplace(
  "proof chips",
  shell,
  '<div class="proof-chips">',
  '<div class="proof-chips" id="landChips">'
);
shell = mustReplace(
  "job title",
  shell,
  "<strong>Senior Product Designer</strong><small>Design systems · 5 candidates invited</small>",
  '<strong id="landJobTitle">Senior Product Designer</strong><small id="landJobMeta">Design systems · 5 candidates invited</small>'
);
shell = mustReplace(
  "interview title",
  shell,
  "<strong>Senior Product Designer · AI Interview</strong><small>Linked to the same assessment · 2 sessions complete</small>",
  '<strong id="landIvTitle">Senior Product Designer · AI Interview</strong><small id="landIvMeta">Linked to the same assessment · 2 sessions complete</small>'
);
shell = mustReplace(
  "stats",
  shell,
  '<div class="stat"><label>MeritEdge</label><strong>02</strong><span>Published assessments</span></div><div class="stat"><label>AI Interviewer</label><strong>02</strong><span>Published interviews</span></div><div class="stat"><label>Shortlisted</label><strong>02</strong><span>Ready to hire</span></div>',
  '<div class="stat"><label>MeritEdge</label><strong id="landStatA">02</strong><span>Published assessments</span></div><div class="stat"><label>AI Interviewer</label><strong id="landStatB">02</strong><span>Published interviews</span></div><div class="stat"><label>Shortlisted</label><strong id="landStatC">02</strong><span>Ready to hire</span></div>'
);
shell = mustReplace(
  "candidates open",
  shell,
  '<div class="sectionlabel">Top candidates <a href="#why">View all →</a></div><div class="candidate">',
  '<div class="sectionlabel">Top candidates <a href="#why">View all →</a></div><div id="landCandidates"><div class="candidate">'
);
shell = mustReplace(
  "candidates close",
  shell,
  '</div><div class="interview">',
  '</div></div><div class="interview">'
);
shell = mustReplace(
  "hero name",
  shell,
  "<h3>Maya Chen · Senior Product Designer</h3>",
  '<h3 id="landHeroName">Maya Chen · Senior Product Designer</h3>'
);
shell = mustReplace(
  "hero match",
  shell,
  '<span class="match">Strong match</span>',
  '<span class="match" id="landHeroMatch">Strong match</span>'
);
shell = mustReplace(
  "hero note",
  shell,
  "<p>Strong MeritEdge assessment and thoughtful tradeoffs in the AI Interviewer session. Explore collaboration style and product strategy in the next round.</p>",
  '<p id="landHeroNote">Strong MeritEdge assessment and thoughtful tradeoffs in the AI Interviewer session. Explore collaboration style and product strategy in the next round.</p>'
);
shell = mustReplace(
  "hero score",
  shell,
  "<b>92</b><span>MeritEdge score</span>",
  '<b id="landHeroScore">92</b><span>MeritEdge score</span>'
);
shell = mustReplace(
  "hero interview score",
  shell,
  "<b>4.8/5</b><span>AI Interviewer</span>",
  '<b id="landHeroIv">4.8/5</b><span>AI Interviewer</span>'
);

function matchDelim(src, i) {
  const open = src[i];
  const pairs = { "{": "}", "[": "]", "(": ")" };
  if (open === '"' || open === "'" || open === "`") {
    for (let j = i + 1; j < src.length; j++) {
      if (src[j] === "\\") {
        j++;
        continue;
      }
      if (open === "`" && src[j] === "$" && src[j + 1] === "{") {
        j = matchDelim(src, j + 1);
        continue;
      }
      if (src[j] === open) return j;
    }
    throw new Error("Unclosed string at " + i);
  }
  const close = pairs[open];
  if (!close) throw new Error("Not a delimiter at " + i);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (ch === '"' || ch === "'" || ch === "`") {
      j = matchDelim(src, j);
      continue;
    }
    if (ch === "/" && src[j + 1] === "/") {
      const nl = src.indexOf("\n", j);
      j = nl === -1 ? src.length - 1 : nl;
      continue;
    }
    if (ch === "/" && src[j + 1] === "*") {
      const end = src.indexOf("*/", j + 2);
      j = end === -1 ? src.length - 1 : end + 1;
      continue;
    }
    if (ch === "{" || ch === "[" || ch === "(") depth++;
    else if (ch === "}" || ch === "]" || ch === ")") {
      depth--;
      if (depth === 0) {
        if (ch !== close) throw new Error("Mismatched closer at " + j);
        return j;
      }
    }
  }
  throw new Error("Unclosed delimiter at " + i);
}

function exprEnd(src, i) {
  while (/\s/.test(src[i])) i++;
  if (src.startsWith("new Set(", i)) {
    const open = src.indexOf("(", i);
    return matchDelim(src, open) + 1;
  }
  const ch = src[i];
  if ("{[(\"'`".includes(ch)) return matchDelim(src, i) + 1;
  let j = i;
  while (j < src.length && src[j] !== ";" && src[j] !== "\n") j++;
  return j;
}

const bindings = [
  ["PERSONAL", "personalDomains", "set"],
  ["DISPOSABLE", "disposableDomains", "set"],
  ["MILESTONES", "milestones", "json"],
  ["messages", "stepMessages", "json"],
  ["INTENT_ROLES", "intentRoles", "json"],
  ["INTENT_VOLUMES", "intentVolumes", "json"],
  ["INTENT_PRODUCTS", "intentProducts", "json"],
  ["BILL_MAILS", "billMails", "json"],
  ["SSO_ACCOUNTS", "ssoAccounts", "json"],
  ["SSO_PERMS", "ssoPerms", "json"],
  ["APP_NAV", "appNav", "json"],
  ["PAGE_TITLES", "pageTitles", "json"],
  ["assessments", "assessments", "json"],
  ["interviews", "interviews", "json"],
  ["ASSESS_STEPS", "assessSteps", "json"],
  ["INTERVIEW_STEPS", "interviewSteps", "json"],
  ["PAY_METHODS", "payMethods", "json"],
  ["PAY_BANKS", "payBanks", "json"],
  ["PAY_WALLETS", "payWallets", "json"],
  ["PAY_LATER", "payLater", "json"],
  ["CK_STEPS", "checkoutSteps", "json"],
  ["FEATURES", "features", "json"],
  ["PLANS", "plans", "json"],
  ["PLAN_ROWS", "planRows", "json"],
  ["GST_SELLER", "gstSeller", "json"],
  ["DEMO_DURATION", "demoDuration", "json"],
  ["DEMO_SCENES", "demoScenes", "json"],
  ["SAMPLE_JDS", "sampleJds", "json"],
  ["WOW_TICKER", "wowTicker", "json"],
  ["CX_QS", "examQuestions", "json"],
  ["IV_TURNS", "interviewTurns", "json"],
  ["IV_VOICES", "interviewVoices", "json"],
  ["IV_PHOTOS", "interviewPhotos", "json"],
];

const data = {};
const spans = [];

for (const [name, key, kind] of bindings) {
  const re = new RegExp("const\\s+" + name + "\\s*=");
  const m = re.exec(engine);
  if (!m) throw new Error("Missing const " + name);
  let valueStart = m.index + m[0].length;
  while (/\s/.test(engine[valueStart])) valueStart++;
  let end = exprEnd(engine, valueStart);
  const expr = engine.slice(valueStart, end);
  let value;
  try {
    value = vm.runInNewContext("(" + expr + ")", { Set });
  } catch (err) {
    throw new Error("Eval failed for " + name + ": " + err.message);
  }
  if (kind === "set") {
    if (!(value instanceof Set)) throw new Error(name + " was not a Set");
    data[key] = [...value];
  } else {
    data[key] = JSON.parse(JSON.stringify(value));
  }
  if (engine[end] === ";") end++;
  const replacement =
    kind === "set"
      ? "const " + name + " = new Set(__D." + key + ");"
      : "const " + name + " = __D." + key + ";";
  spans.push({ start: m.index, end, replacement, name });
}

const seedRe = /function seedUsers\(\)\{\s*return \[([\s\S]*?)\];\s*\}/;
const seedMatch = seedRe.exec(engine);
if (!seedMatch) throw new Error("Missing seedUsers");
data.users = JSON.parse(
  JSON.stringify(vm.runInNewContext("[" + seedMatch[1] + "]"))
);
spans.push({
  start: seedMatch.index,
  end: seedMatch.index + seedMatch[0].length,
  replacement: "function seedUsers(){ return JSON.parse(JSON.stringify(__D.users)); }",
  name: "seedUsers",
});

const proofStart = engine.indexOf("function proofChipsHtml()");
const proofEnd = engine.indexOf("const INTENT_ROLES");
if (proofStart < 0 || proofEnd < 0) throw new Error("Missing proofChipsHtml");
spans.push({
  start: proofStart,
  end: proofEnd,
  replacement:
    'function proofChipsHtml(){\n  return `<div class="proof-chips">${__D.proofChips.map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</div>`;\n}\n',
  name: "proofChipsHtml",
});

data.proofChips = [
  "Teams use TalentEdge for designer and engineer hiring",
  "First MeritEdge assessment in minutes",
  "No card to try",
];

spans.sort((a, b) => b.start - a.start);
for (const span of spans) {
  engine = engine.slice(0, span.start) + span.replacement + engine.slice(span.end);
}

engine = mustReplace(
  "mail error",
  engine,
  'checkout.mailError = "Open the dummy via http://127.0.0.1:8765 (python3 prototype/plg/plg_server.py).";',
  'checkout.mailError = "Invoice email could not be sent. Check Gmail credentials in gst_smtp.env.";'
);

const hydrate = `
function hydrateFromData(){
  const a = assessments[0];
  const iv = (a && interviews.find(i=>i.assessmentId===a.id)) || interviews[0];
  const text = (id, v) => { const el = document.getElementById(id); if(el && v!=null) el.textContent = v; };
  const pad = n => String(n).padStart(2,"0");
  if(a){
    text("landJobTitle", a.title);
    text("landJobMeta", (a.role||a.title)+" · "+a.invited+" candidates invited");
  }
  if(iv){
    text("landIvTitle", iv.title);
    text("landIvMeta", "Linked to the same assessment · "+iv.completed+" sessions complete");
  }
  text("landStatA", pad(assessments.filter(x=>x.status==="Active").length));
  text("landStatB", pad(interviews.filter(x=>x.status==="Active").length));
  text("landStatC", pad(assessments.reduce((n,x)=>n+(x.shortlisted||0),0)));
  const top = (a?.candidates||[]).slice(0,2);
  const box = document.getElementById("landCandidates");
  if(box && top.length){
    box.innerHTML = top.map(c => {
      const ivc = iv?.candidates?.find(x=>x.id===c.id);
      const ivScore = ivc ? String(ivc.score).replace("/5","") : "—";
      return \`<div class="candidate"><span class="avatar">\${escapeHtml(initials(c.name))}</span><span><strong>\${escapeHtml(c.name)}</strong><small>MeritEdge \${c.score} · AI Interviewer \${ivc?ivc.score:"—"}</small></span><span class="twoscore"><span class="as">\${c.score}</span><span class="iv">\${escapeHtml(ivScore)}</span></span></div>\`;
    }).join("");
  }
  const hero = top[0];
  const heroIv = hero && iv?.candidates?.find(x=>x.id===hero.id);
  if(hero){
    text("landHeroName", hero.name+" · "+a.title);
    text("landHeroMatch", heroIv?.rec || hero.status || "Strong match");
    text("landHeroNote", heroIv?.note || "");
    text("landHeroScore", String(hero.score));
    text("landHeroIv", heroIv?.score || "—");
  }
  const chips = document.getElementById("landChips");
  if(chips) chips.innerHTML = __D.proofChips.map(t=>\`<span>\${escapeHtml(t)}</span>\`).join("");
}

`;

engine = mustReplace(
  "boot",
  engine,
  "applyTheme(currentTheme());\n  enterSalesPreview();",
  "applyTheme(currentTheme());\n  hydrateFromData();\n  enterSalesPreview();"
);

engine =
  "const __D = window.__APP_DATA__;\nif(!__D) throw new Error('MeritEdge data was not loaded');\n" +
  hydrate +
  engine;

function writeJson(rootDir, rel, value) {
  const file = path.join(rootDir, "data", rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function writeDataModules(rootDir, data) {
  writeJson(rootDir, "auth/domains.json", {
    personal: data.personalDomains,
    disposable: data.disposableDomains,
  });
  writeJson(rootDir, "auth/users.json", data.users);
  writeJson(rootDir, "auth/sso.json", {
    accounts: data.ssoAccounts,
    permissions: data.ssoPerms,
  });
  writeJson(rootDir, "hiring/assessments.json", data.assessments);
  writeJson(rootDir, "hiring/interviews.json", data.interviews);
  writeJson(rootDir, "hiring/jobs.json", data.sampleJds);
  writeJson(rootDir, "hiring/exam.json", {
    questions: data.examQuestions,
    turns: data.interviewTurns,
    voices: data.interviewVoices,
    photos: data.interviewPhotos,
  });
  writeJson(rootDir, "hiring/wizards.json", {
    assessment: data.assessSteps,
    interview: data.interviewSteps,
  });
  writeJson(rootDir, "product/navigation.json", {
    items: data.appNav,
    titles: data.pageTitles,
  });
  writeJson(rootDir, "product/landing.json", {
    steps: data.stepMessages,
    proofChips: data.proofChips,
  });
  writeJson(rootDir, "product/intent.json", {
    roles: data.intentRoles,
    volumes: data.intentVolumes,
    products: data.intentProducts,
  });
  writeJson(rootDir, "product/milestones.json", data.milestones);
  writeJson(rootDir, "product/tour.json", {
    duration: data.demoDuration,
    scenes: data.demoScenes,
    ticker: data.wowTicker,
  });
  writeJson(rootDir, "billing/plans.json", {
    plans: data.plans,
    comparison: data.planRows,
    features: data.features,
  });
  writeJson(rootDir, "billing/payments.json", {
    methods: data.payMethods,
    banks: data.payBanks,
    wallets: data.payWallets,
    payLater: data.payLater,
    checkoutSteps: data.checkoutSteps,
    emails: data.billMails,
  });
  writeJson(rootDir, "billing/seller.json", data.gstSeller);
}

fs.mkdirSync(path.join(root, "app", "api", "health"), { recursive: true });
fs.mkdirSync(path.join(root, "app", "api", "send-gst"), { recursive: true });
fs.mkdirSync(path.join(root, "content"), { recursive: true });
fs.mkdirSync(path.join(root, "data"), { recursive: true });
fs.mkdirSync(path.join(root, "public", "assets"), { recursive: true });

fs.writeFileSync(path.join(root, "app", "globals.css"), css);
fs.writeFileSync(path.join(root, "content", "shell.html"), shell);
fs.writeFileSync(path.join(root, "public", "engine.js"), engine);
writeDataModules(root, data);
const legacy = path.join(root, "data", "app.json");
if (fs.existsSync(legacy)) fs.unlinkSync(legacy);

for (const file of ["otomeyt-ai-logo.svg", "otomeyt-ai-logo-light.svg"]) {
  fs.copyFileSync(path.join(root, "assets", file), path.join(root, "public", "assets", file));
}

console.log(
  "extracted",
  Object.keys(data).length,
  "json keys,",
  data.assessments.length,
  "assessments,",
  data.interviews.length,
  "interviews,",
  data.sampleJds.length,
  "jds"
);
