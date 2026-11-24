import { makeLandingPage, makeLoginPage, type Snippet } from "@/lib/snippets";

type Category =
  | "cafe" | "restaurant" | "gym" | "portfolio" | "shop" | "agency" | "blog" | "event"
  | "travel" | "education" | "health" | "realestate" | "beauty" | "saas" | "construction" | "music"
  | "simple";

type Palette = {
  name: string; primary: string; deep: string; accent: string; ink: string; muted: string;
  pale: string; surface: string; background: string; background2: string;
};

const palettes: Record<string, Palette> = {
  green: { name: "green", primary: "#5aa33a", deep: "#276b2d", accent: "#7fc85b", ink: "#102512", muted: "#4e6450", pale: "#e8f4de", surface: "#ffffff", background: "#f6faef", background2: "#e7f3dc" },
  blue: { name: "blue", primary: "#3b82f6", deep: "#1d4ed8", accent: "#60a5fa", ink: "#0f172a", muted: "#475569", pale: "#dbeafe", surface: "#ffffff", background: "#f8fbff", background2: "#eaf2ff" },
  purple: { name: "purple", primary: "#8b5cf6", deep: "#6d28d9", accent: "#a78bfa", ink: "#211338", muted: "#625472", pale: "#ede9fe", surface: "#ffffff", background: "#fbfaff", background2: "#f0ebff" },
  red: { name: "red", primary: "#ef4444", deep: "#b91c1c", accent: "#f87171", ink: "#2a1111", muted: "#745252", pale: "#fee2e2", surface: "#ffffff", background: "#fffafa", background2: "#ffeded" },
  pink: { name: "pink", primary: "#ec4899", deep: "#be185d", accent: "#f472b6", ink: "#2b1020", muted: "#765467", pale: "#fce7f3", surface: "#ffffff", background: "#fffafd", background2: "#fdebf5" },
  orange: { name: "orange", primary: "#f97316", deep: "#c2410c", accent: "#fb923c", ink: "#2b170d", muted: "#745947", pale: "#ffedd5", surface: "#ffffff", background: "#fffaf5", background2: "#fff0df" },
  gold: { name: "gold", primary: "#d6a52d", deep: "#9a6b08", accent: "#edc967", ink: "#2b220e", muted: "#6c6246", pale: "#fbefc5", surface: "#ffffff", background: "#fffdf5", background2: "#f9f0d7" },
  black: { name: "black", primary: "#242424", deep: "#050505", accent: "#555555", ink: "#111111", muted: "#626262", pale: "#ececec", surface: "#ffffff", background: "#f7f7f7", background2: "#e8e8e8" },
  teal: { name: "teal", primary: "#0d9488", deep: "#0f766e", accent: "#2dd4bf", ink: "#102a28", muted: "#4c6967", pale: "#ccfbf1", surface: "#ffffff", background: "#f5fffd", background2: "#ddf8f2" },
  brown: { name: "brown", primary: "#9a6841", deep: "#654321", accent: "#c69b75", ink: "#2b1a10", muted: "#705a49", pale: "#efe2d5", surface: "#ffffff", background: "#fdfaf7", background2: "#f3e8dd" },
  beige: { name: "beige", primary: "#a78355", deep: "#71532f", accent: "#d0b58b", ink: "#292117", muted: "#6d6252", pale: "#f0e7d7", surface: "#ffffff", background: "#fcfaf5", background2: "#f2eadc" },
  grey: { name: "grey", primary: "#64748b", deep: "#334155", accent: "#94a3b8", ink: "#111827", muted: "#64748b", pale: "#e2e8f0", surface: "#ffffff", background: "#f8fafc", background2: "#edf1f5" },
};

function mixHex(first: string, second: string, amount: number) {
  const parse = (hex: string) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  const a = parse(first); const b = parse(second);
  return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function customHexPalette(hex: string): Palette {
  const primary = hex.toLowerCase();
  return {
    name: primary, primary, deep: mixHex(primary, "#000000", .28), accent: mixHex(primary, "#ffffff", .26),
    ink: mixHex(primary, "#000000", .76), muted: mixHex(primary, "#777777", .62),
    pale: mixHex(primary, "#ffffff", .82), surface: "#ffffff",
    background: mixHex(primary, "#ffffff", .94), background2: mixHex(primary, "#ffffff", .86),
  };
}

function paletteFor(text: string): Palette {
  const custom = text.match(/#[0-9a-f]{6}\b/i)?.[0];
  if (custom) return customHexPalette(custom);
  if (/\b(blue|navy|azure|sky blue|royal blue)\b/i.test(text)) return palettes.blue;
  if (/\b(purple|violet|lavender)\b/i.test(text)) return palettes.purple;
  if (/\b(red|crimson|maroon)\b/i.test(text)) return palettes.red;
  if (/\b(pink|rose|magenta)\b/i.test(text)) return palettes.pink;
  if (/\b(orange|coral)\b/i.test(text)) return palettes.orange;
  if (/\b(gold|golden|yellow)\b/i.test(text)) return palettes.gold;
  if (/\b(black|dark|charcoal|monochrome)\b/i.test(text)) return palettes.black;
  if (/\b(teal|cyan|turquoise)\b/i.test(text)) return palettes.teal;
  if (/\b(brown|chocolate|coffee brown)\b/i.test(text)) return palettes.brown;
  if (/\b(beige|cream|tan|sand)\b/i.test(text)) return palettes.beige;
  if (/\b(grey|gray|slate|silver)\b/i.test(text)) return palettes.grey;
  if (/\b(white|clean white)\b/i.test(text)) return palettes.black;
  return palettes.green;
}

function recolorSnippet(snippet: Snippet, palette: Palette): Snippet {
  const replacements: Array<[RegExp, string]> = [
    [/#6bbd3f/gi, palette.primary], [/#5aa33a/gi, palette.primary], [/#6cc23f/gi, palette.primary],
    [/#2e7d32/gi, palette.deep], [/#2f8532/gi, palette.deep], [/#3e8f26/gi, palette.deep], [/#4b9c2f/gi, palette.deep],
    [/#e0b04a/gi, palette.accent], [/#b8860b/gi, palette.deep], [/#c99a2e/gi, palette.accent],
    [/#0f2412/gi, palette.ink], [/#14260f/gi, palette.ink], [/#4e6450/gi, palette.muted],
    [/#e6f6d9/gi, palette.pale], [/#e8f4de/gi, palette.pale], [/#eafbe0/gi, palette.pale],
    [/#a8e07c/gi, palette.accent], [/#7cc35a/gi, palette.primary], [/#d9f5c2/gi, palette.pale], [/#e4f4d3/gi, palette.pale],
    [/#3f7132/gi, palette.deep], [/#5fb838/gi, palette.primary], [/#316b26/gi, palette.deep],
    [/#f2fae9/gi, palette.background], [/#f4fbea/gi, palette.background], [/#e8f5db/gi, palette.background2],
    [/#faf3e0/gi, palette.background2], [/#fdf3d8/gi, palette.background2], [/#ffe6a8/gi, palette.pale],
  ];
  let html = snippet.html;
  for (const [pattern, value] of replacements) html = html.replace(pattern, value);
  return { ...snippet, html, title: `${snippet.title} · ${palette.name}` };
}

type Content = {
  brand: string;
  eyebrow: string;
  title: string;
  highlight: string;
  lead: string;
  primary: string;
  secondary: string;
  cards: Array<[string, string]>;
  stats: Array<[string, string]>;
  listTitle: string;
  list: Array<[string, string, string]>;
  cta: string;
};

const defaults: Record<Category, Content> = {
  cafe: {
    brand: "Kettle & Leaf", eyebrow: "Coffee, slowly", title: "A small café with", highlight: "better mornings",
    lead: "Single-origin coffee, warm bread and a quiet corner with good light. Walk in, or order ahead for pickup.",
    primary: "Order ahead", secondary: "See the menu",
    cards: [["Espresso bar", "Two beans on rotation, dialled in twice a day."], ["Fresh bakes", "Made every morning, gone by the afternoon."], ["Quiet corner", "Sockets, soft light and no rush to leave."]],
    stats: [["Opens", "7:00"], ["Closes", "19:00"], ["Seats", "38"]],
    listTitle: "On the counter", list: [["Flat white", "Double ristretto, silky milk", "£3.40"], ["Cardamom bun", "Laminated, baked at 6am", "£3.80"], ["Cold brew", "18-hour steep, over ice", "£4.20"]],
    cta: "Find us on Mill Street, open every day.",
  },
  restaurant: {
    brand: "Saffron Table", eyebrow: "Seasonal kitchen", title: "Food that tastes like", highlight: "someone's home",
    lead: "A short menu that changes with the market, cooked in an open kitchen and served without ceremony.",
    primary: "Book a table", secondary: "View menu",
    cards: [["Market-led", "We buy what looks good that morning."], ["Shared plates", "Everything is designed to pass around."], ["Small list", "Six wines, two beers, excellent water."]],
    stats: [["Dinner", "18:00"], ["Tables", "14"], ["Covers", "46"]],
    listTitle: "This week", list: [["Roast pumpkin", "Yoghurt, chilli, burnt onion", "£8"], ["Slow lamb", "Cumin, greens, flatbread", "£17"], ["Burnt honey", "Cardamom cream, pistachio", "£7"]],
    cta: "Walk-ins welcome at the bar from six.",
  },
  gym: {
    brand: "Northfield Strength", eyebrow: "Train properly", title: "Small group training,", highlight: "real progress",
    lead: "Six people per session, a coach who knows your name and a plan that changes as you do.",
    primary: "Book a free session", secondary: "See the timetable",
    cards: [["Strength", "Barbell basics, coached slowly and safely."], ["Conditioning", "Short, honest work that leaves you able."], ["Recovery", "Mobility, sleep advice and a real deload week."]],
    stats: [["Coaches", "5"], ["Max group", "6"], ["Sessions", "42/wk"]],
    listTitle: "Session types", list: [["Foundations", "Squat, hinge, push, pull", "45 min"], ["Engine", "Intervals on rower and bike", "40 min"], ["Open floor", "Coached, unstructured work", "60 min"]],
    cta: "First session is free — bring shoes and water.",
  },
  portfolio: {
    brand: "Ayesha Studio", eyebrow: "Portfolio", title: "Design that respects", highlight: "the reader",
    lead: "Identity, editorial and interface work for small teams doing careful things. Available for two projects this quarter.",
    primary: "Start a project", secondary: "See selected work",
    cards: [["Identity", "Wordmarks, systems and the rules that keep them working."], ["Editorial", "Long-form layout that stays calm under pressure."], ["Interface", "Product screens that explain themselves."]],
    stats: [["Years", "7"], ["Projects", "64"], ["Repeat clients", "82%"]],
    listTitle: "Selected work", list: [["Northfield", "Brand + signage", "2026"], ["Ledger Weekly", "Editorial system", "2025"], ["Kettle & Leaf", "Packaging", "2025"]],
    cta: "Currently taking two projects for the next quarter.",
  },
  shop: {
    brand: "Field Supply", eyebrow: "Small-batch goods", title: "Things built to", highlight: "be used daily",
    lead: "Six products, made in small runs by people we have met. Free shipping over £60, returns for thirty days.",
    primary: "Shop the range", secondary: "Read the making notes",
    cards: [["Honest materials", "Cotton, linen, brass and steel — nothing pretending."], ["Small runs", "Made 200 at a time, never warehoused for years."], ["Repairable", "Every piece can be fixed, not replaced."]],
    stats: [["Products", "6"], ["Shipping", "2 days"], ["Returns", "30 days"]],
    listTitle: "The range", list: [["Canvas tote", "Waxed, heavy cotton", "£38"], ["Brass hook", "Solid, unlacquered", "£16"], ["Linen apron", "Stonewashed, one size", "£52"]],
    cta: "Free shipping over £60 — packed by hand.",
  },
  agency: {
    brand: "Ledger & Co", eyebrow: "Independent studio", title: "Clear thinking for", highlight: "complicated projects",
    lead: "We plan, write and build websites for organisations that need to explain something difficult clearly.",
    primary: "Book an intro call", secondary: "How we work",
    cards: [["Discovery", "Two weeks of listening before anyone designs anything."], ["Build", "Typed, tested and handed over with documentation."], ["Aftercare", "A real support window, not a support form."]],
    stats: [["Team", "8"], ["Founded", "2019"], ["Projects", "74"]],
    listTitle: "Recent projects", list: [["Northfield", "Strategy + site", "2026"], ["Kettle & Leaf", "Brand", "2026"], ["Field Supply", "Shop build", "2025"]],
    cta: "Typical project starts at six weeks and £18k.",
  },
  blog: {
    brand: "Slow Notes", eyebrow: "A quiet blog", title: "Notes on doing", highlight: "fewer things well",
    lead: "Essays about focus, tools and the small decisions that make work feel lighter. Roughly twice a month.",
    primary: "Read the latest", secondary: "Subscribe",
    cards: [["Essays", "Longer thinking, edited twice before it goes out."], ["Notebook", "Short pieces, unfinished ideas, honest lists."], ["Letters", "A monthly email you can reply to."]],
    stats: [["Posts", "48"], ["Readers", "3.1k"], ["Cadence", "2/month"]],
    listTitle: "Latest posts", list: [["The cost of a fixed layout", "8 min read", "Oct"], ["Notes on saying no", "5 min read", "Sep"], ["Tools I stopped using", "6 min read", "Sep"]],
    cta: "One email a month. No tracking pixels.",
  },
  event: {
    brand: "Field Day 2027", eyebrow: "One-day conference", title: "A small conference for", highlight: "people who build",
    lead: "Two stages, 180 seats and no sponsor keynotes. One day in April, in a room with good windows.",
    primary: "Get a ticket", secondary: "See the schedule",
    cards: [["Two stages", "Craft and systems, running side by side."], ["No booths", "Sponsors get a table, a bell and a short speech."], ["Real breaks", "Forty minutes between sessions, every time."]],
    stats: [["Date", "18 Apr"], ["Seats", "180"], ["Talks", "14"]],
    listTitle: "Confirmed", list: [["Designing in the open", "Mharryjs", "10:00"], ["Systems that survive", "Hiba Kashif", "11:30"], ["Ship the small thing", "Ayesha S.", "14:00"]],
    cta: "Early tickets £95, including lunch and a notebook.",
  },
  travel: {
    brand: "Atlas & Air", eyebrow: "Travel, planned well", title: "Trips that leave room to", highlight: "actually be there",
    lead: "Small-group journeys with clear prices, thoughtful stays and enough unscheduled time to discover a place yourself.",
    primary: "Find a trip", secondary: "Compare routes",
    cards: [["Small groups", "No coach tours—twelve travellers at most."], ["Local stays", "Independent hotels and hosts we know."], ["Clear price", "Stays, transport and guides shown up front."]],
    stats: [["Routes", "18"], ["Max group", "12"], ["Countries", "9"]],
    listTitle: "Upcoming routes", list: [["North Pakistan", "Hunza, Passu and Khunjerab", "$780"], ["Coastal Türkiye", "Izmir to Kaş", "$940"], ["Kyoto slowly", "Temples, craft and food", "$1,180"]],
    cta: "Choose a route and talk to a real trip planner.",
  },
  education: {
    brand: "Northstar School", eyebrow: "Learn by making", title: "A school for curious", highlight: "and capable minds",
    lead: "Small classes, careful teaching and projects that turn knowledge into something students can show.",
    primary: "Apply now", secondary: "Explore courses",
    cards: [["Small classes", "A teacher knows every student and their next step."], ["Real projects", "Learning ends in something made, tested or presented."], ["Open feedback", "Families see progress, not only grades."]],
    stats: [["Students", "420"], ["Class size", "18"], ["Courses", "26"]],
    listTitle: "Popular courses", list: [["Creative computing", "Build a working web product", "12 weeks"], ["Design foundations", "Type, layout and systems", "10 weeks"], ["Applied science", "Experiments and field work", "14 weeks"]],
    cta: "Applications for the next term are open.",
  },
  health: {
    brand: "Harbour Clinic", eyebrow: "Care that listens", title: "A calmer way to get", highlight: "the right care",
    lead: "Book a clinician who has time to listen, see your notes and explain the next step in plain language.",
    primary: "Book an appointment", secondary: "Meet the team",
    cards: [["Same-week visits", "In person or video, with clear availability."], ["Longer appointments", "Enough time for the whole story."], ["Joined-up notes", "Your clinician sees what happened before."]],
    stats: [["Clinicians", "14"], ["Locations", "3"], ["Avg wait", "2 days"]],
    listTitle: "Services", list: [["General care", "Everyday health and referrals", "30 min"], ["Physiotherapy", "Assessment and recovery plan", "45 min"], ["Nutrition", "Practical, evidence-led support", "45 min"]],
    cta: "If this is an emergency, call your local emergency service.",
  },
  realestate: {
    brand: "Stone & Field", eyebrow: "Homes, not listings", title: "Find a place that fits", highlight: "the way you live",
    lead: "Straightforward local advice, properly photographed homes and no pressure to decide before you are ready.",
    primary: "View homes", secondary: "Talk to an agent",
    cards: [["Local knowledge", "Street-by-street advice from people based here."], ["Honest details", "Real room sizes, running costs and drawbacks."], ["One point of contact", "The same person from viewing to keys."]],
    stats: [["Homes", "34"], ["Areas", "7"], ["Avg sale", "31 days"]],
    listTitle: "New this week", list: [["Garden House", "3 bed · north quarter", "$420k"], ["Mill Apartment", "2 bed · riverside", "$285k"], ["Orchard Cottage", "2 bed · village", "$360k"]],
    cta: "Tell us what matters and we will shortlist the right homes.",
  },
  beauty: {
    brand: "Mira Studio", eyebrow: "Skin & beauty", title: "Care that looks like", highlight: "you on a good day",
    lead: "Thoughtful treatments, quiet appointments and products chosen for your skin—not the shelf.",
    primary: "Book a visit", secondary: "See treatments",
    cards: [["Personal plan", "Every visit starts with your skin and your routine."], ["Gentle products", "Clear ingredients and no unnecessary steps."], ["Quiet studio", "One client at a time, never a waiting room full."]],
    stats: [["Treatments", "12"], ["Clients", "1.4k"], ["Rating", "4.9"]],
    listTitle: "Treatments", list: [["Signature facial", "Cleanse, massage and hydration", "$68"], ["Skin consultation", "Routine and product plan", "$35"], ["Brow shape", "Shape, tint and finish", "$28"]],
    cta: "Book online or ask a question before you choose.",
  },
  saas: {
    brand: "Threadline", eyebrow: "Work, clearly", title: "One place to keep projects", highlight: "moving together",
    lead: "Plans, decisions and files stay attached to the work, so a team spends less time asking where things are.",
    primary: "Start a workspace", secondary: "See how it works",
    cards: [["One project view", "Tasks, files and decisions in the same place."], ["Useful updates", "A short digest instead of another meeting."], ["Simple permissions", "Clients see only what they need."]],
    stats: [["Teams", "2.8k"], ["Uptime", "99.98%"], ["Setup", "8 min"]],
    listTitle: "Plans", list: [["Starter", "Up to five people", "$0"], ["Team", "Unlimited projects", "$12/mo"], ["Studio", "Clients and approvals", "$24/mo"]],
    cta: "Start with one project. Move the rest when it earns it.",
  },
  construction: {
    brand: "Ridge Build", eyebrow: "Built properly", title: "Clear estimates and", highlight: "solid work",
    lead: "Residential construction with one accountable team, weekly site updates and no surprise line items.",
    primary: "Request an estimate", secondary: "See completed work",
    cards: [["Fixed scope", "A written scope before work begins."], ["Weekly updates", "Photos, progress and decisions every Friday."], ["Known team", "The people you meet are the people on site."]],
    stats: [["Years", "16"], ["Projects", "128"], ["Warranty", "5 yrs"]],
    listTitle: "What we build", list: [["Extensions", "Design coordination and build", "8–20 wks"], ["Renovations", "Whole-home programme", "12–28 wks"], ["New homes", "Ground-up delivery", "30+ wks"]],
    cta: "Send plans or an address for a first estimate.",
  },
  music: {
    brand: "Lowlight Records", eyebrow: "New music", title: "Independent records,", highlight: "heard properly",
    lead: "Releases, live sessions and a small shop from artists we believe deserve a longer listen.",
    primary: "Listen now", secondary: "Browse releases",
    cards: [["New releases", "Albums and EPs selected, not uploaded by volume."], ["Live room", "One-take sessions recorded in our studio."], ["Artist owned", "Transparent splits and rights that stay with artists."]],
    stats: [["Artists", "22"], ["Releases", "61"], ["Live dates", "18"]],
    listTitle: "Latest releases", list: [["Paper Moons", "Aisha Noor", "LP"], ["Northbound", "Rafi & Co", "EP"], ["After Rain", "Mina Vale", "Single"]],
    cta: "Join the list for releases and small-room shows.",
  },
  simple: {
    brand: "Clear Page", eyebrow: "Simple by design", title: "A plain page for", highlight: "a clear idea",
    lead: "No sliders, no pop-ups, no cookie banner. Just the information someone needs, in the order they need it.",
    primary: "Get in touch", secondary: "Read more",
    cards: [["Readable", "Comfortable line length and one column."], ["Fast", "One file, no libraries, no layout shift."], ["Accessible", "Real contrast and keyboard focus everywhere."]],
    stats: [["Page weight", "12 kB"], ["Libraries", "0"], ["Colour", "2"]],
    listTitle: "What you get", list: [["A clear headline", "Says what this is", "first"], ["Three short points", "No filler copy", "next"], ["One obvious action", "Email or call", "always"]],
    cta: "That is the whole page — nothing hidden below the fold.",
  },
};

function makeSimpleLogin(brand: string, palette: Palette): Snippet {
  const safe = brand.replace(/[<>]/g, "");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safe} · Sign in</title>
<style>
:root{--primary:${palette.primary};--deep:${palette.deep};--ink:${palette.ink};--muted:${palette.muted};--pale:${palette.pale};--bg:${palette.background};--edge:${palette.background2}}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;display:grid;place-items:center;padding:22px;background:var(--bg);color:var(--ink);font-family:Inter,"Segoe UI",system-ui,sans-serif}
.login{width:min(410px,100%);padding:30px;border:1px solid var(--edge);border-radius:14px;background:#fff;box-shadow:0 16px 45px -36px rgba(0,0,0,.35)}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:1rem}.mark{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:var(--primary);color:#fff}
h1{margin:24px 0 6px;font-size:1.65rem;letter-spacing:-.035em}p{margin:0 0 22px;color:var(--muted);font-size:.9rem;line-height:1.55}
label{display:grid;gap:6px;margin-top:13px;font-size:.75rem;font-weight:700;color:var(--muted)}
input{width:100%;padding:12px 13px;border:1px solid var(--edge);border-radius:9px;background:#fff;color:var(--ink);font:inherit;outline:none}
input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 18%,transparent)}
.pass{position:relative}.pass input{padding-right:48px}.eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:36px;height:36px;padding:0;border:1px solid var(--edge);border-radius:8px;background:var(--pale);color:var(--deep);font-size:16px;line-height:1;box-shadow:none}.eye:hover{background:#fff}.eye:focus-visible{outline:3px solid color-mix(in srgb,var(--primary) 20%,transparent)}
.meta{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:14px 0 18px;font-size:.75rem;color:var(--muted)}
.meta label{display:flex;align-items:center;gap:7px;margin:0;font-weight:500}.meta input{width:auto;accent-color:var(--primary)}
a{color:var(--deep);font-weight:700;text-decoration:none}a:hover{text-decoration:underline}
button{width:100%;padding:12px;border:0;border-radius:9px;background:var(--primary);color:#fff;font-weight:800;cursor:pointer}button:hover{background:var(--deep)}
.msg{min-height:18px;margin:10px 0 0;font-size:.75rem;font-weight:650}.ok{color:var(--deep)}.err{color:#b42318}
.foot{margin:18px 0 0;text-align:center;font-size:.74rem}
</style>
</head>
<body>
<main class="login">
  <div class="brand"><span class="mark">S</span>${safe}</div>
  <h1>Welcome back</h1><p>Sign in to continue to your account.</p>
  <form id="form" novalidate>
    <label>Email address<input id="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
    <label>Password<div class="pass"><input id="password" type="password" autocomplete="current-password" placeholder="At least 6 characters" required /><button class="eye" id="togglePassword" type="button" aria-label="Show password" title="Show password">◉</button></div></label>
    <div class="meta"><label><input type="checkbox" />Remember me</label><a href="#" id="forgot">Forgot password?</a></div>
    <button type="submit">Sign in</button><div class="msg" id="msg" aria-live="polite"></div>
  </form>
  <p class="foot">New here? <a href="#">Create an account</a></p>
</main>
<script>
const form=document.getElementById('form'),msg=document.getElementById('msg');
form.addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('email').value.trim(),pass=document.getElementById('password').value;const valid=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)&&pass.length>=6;msg.className='msg '+(valid?'ok':'err');msg.textContent=valid?'Signed in successfully.':'Enter a valid email and a password of 6+ characters.';});
document.getElementById('forgot').addEventListener('click',e=>{e.preventDefault();msg.className='msg ok';msg.textContent='Password reset instructions sent.';});
const pass=document.getElementById('password'),toggle=document.getElementById('togglePassword');
toggle.addEventListener('click',()=>{const hidden=pass.type==='password';pass.type=hidden?'text':'password';toggle.textContent=hidden?'◎':'◉';toggle.setAttribute('aria-label',hidden?'Hide password':'Show password');toggle.title=hidden?'Hide password':'Show password';});
</script>
</body>
</html>`;
  return { html, title: `${safe} · simple login · ${palette.name}`, fileName: "simple-login.html" };
}

function detect(request: string): { category: Category; glass: boolean; brand: string; palette: Palette; minimal: boolean } {
  const text = request.toLowerCase();
  // 3D is opt-in: "transparent" or "glass" alone never turns a simple prompt into 3D.
  const glass = /\b3d\b|three[- ]?dimensional|three d/i.test(text);
  const minimal = /\b(simple|minimal|basic|plain|clean)\b/i.test(text) && !glass;
  const palette = paletteFor(text);
  let category: Category = "simple";
  if (/(cafe|coffee|bakery|tea house|espresso)/.test(text)) category = "cafe";
  else if (/(restaurant|food|bistro|kitchen|dining)/.test(text)) category = "restaurant";
  else if (/(gym|fitness|training|crossfit|yoga)/.test(text)) category = "gym";
  else if (/(portfolio|photograph|designer|freelance|personal site)/.test(text)) category = "portfolio";
  else if (/(shop|store|ecommerce|e-commerce|product|brand)/.test(text)) category = "shop";
  else if (/(agency|creative studio|consultancy|consulting firm)/.test(text)) category = "agency";
  else if (/(blog|writing|article|newsletter|journal)/.test(text)) category = "blog";
  else if (/(event|conference|meetup|festival|wedding)/.test(text)) category = "event";
  else if (/(travel|tour|trip|hotel|vacation|holiday|destination)/.test(text)) category = "travel";
  else if (/(school|education|academy|course|university|college|learning)/.test(text)) category = "education";
  else if (/(clinic|hospital|doctor|medical|health|dentist|therapy)/.test(text)) category = "health";
  else if (/(real estate|property|homes|realtor|apartment|house listing)/.test(text)) category = "realestate";
  else if (/(beauty|salon|spa|skincare|makeup|cosmetic)/.test(text)) category = "beauty";
  else if (/(saas|software|app|dashboard|startup|platform)/.test(text)) category = "saas";
  else if (/(construction|builder|architect|renovation|contractor)/.test(text)) category = "construction";
  else if (/(music|artist|band|record label|album|podcast)/.test(text)) category = "music";
  const candidates = [
    request.match(/(?:called|named)\s+["“']?([A-Za-z0-9 &'.-]{2,40})/i)?.[1],
    request.match(/(?:website|web site|webpage|web page|site)\s+for\s+(?:a|an|the)?\s*([^,.]+?)(?:\s+with\b|\s+using\b|\s+in\s+html\b|$)/i)?.[1],
    request.match(/\b(?:make|build|create|design)\s+(?:me\s+)?(?:a|an|the)?\s*([^,.]+?)\s+(?:website|web site|webpage|web page|site)\b/i)?.[1],
  ];
  const styleWords = /#[0-9a-f]{6}\b|\b(simple|minimal|basic|plain|clean|modern|3d|three[- ]?dimensional|transparent|glass|glassmorphism|blue|navy|red|purple|violet|pink|orange|gold|golden|yellow|green|teal|cyan|black|white|brown|beige|cream|grey|gray|dark|light|html|css|javascript|js|responsive)\b/gi;
  const generic = /^(website|web site|page|site|shop|store|portfolio|photographer|gym|restaurant|cafe|coffee shop|login|my|me|us|the|a|an)$/i;
  const named = candidates
    .map((value) => value?.replace(styleWords, " ").replace(/\s+/g, " ").trim().replace(/[.,]$/, ""))
    .find((value): value is string => Boolean(value && value.length >= 2 && value.length <= 48 && !generic.test(value)));
  return { category, glass, brand: named ?? defaults[category].brand, palette, minimal };
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function customContentFor(request: string, base: Content): Content {
  const subject = request.match(/\b(?:website|web site|webpage|web page|site)\s+for\s+(?:a|an|the)?\s*([^,.]+?)(?:\s+with\b|\s+using\b|\s+in\s+html\b|$)/i)?.[1]
    ?? request.match(/\b(?:make|build|create|design)\s+(?:me\s+)?(?:a|an|the)?\s*([^,.]+?)\s+(?:website|web site|webpage|web page|site)\b/i)?.[1];
  const clean = subject
    ?.replace(/#[0-9a-f]{6}\b/gi, "")
    .replace(/\b(color|colou?r|html|css|javascript|js|simple|minimal|clean|modern|3d|transparent|glass|blue|red|green|purple|pink|orange|gold|golden|teal|black|white|brown|beige|grey|gray|responsive)\b/gi, "")
    .replace(/\s+/g, " ").trim();
  if (!clean || clean.length < 3 || clean.length > 48) return base;
  const label = titleCase(clean);
  return {
    ...base,
    brand: label,
    eyebrow: label,
    title: "A clear website for",
    highlight: clean.toLowerCase(),
    lead: `A focused, responsive home for ${clean.toLowerCase()}, with the important information kept easy to find and act on.`,
    primary: "Get started",
    secondary: "Explore",
    cards: [["Clear introduction", `Explain the value of ${clean.toLowerCase()} without filler.`], ["Useful details", "Keep the information visitors came for close at hand."], ["One next step", "Make the main action obvious on every screen size."]],
    stats: [["Layout", "Responsive"], ["Files", "One"], ["Libraries", "0"]],
    listTitle: "Details",
    list: [["Overview", `What the ${clean.toLowerCase()} offers`, "01"], ["Options", "Services, plans or key choices", "02"], ["Contact", "A direct next step", "03"]],
    cta: `Ready to learn more about ${clean.toLowerCase()}?`,
  };
}

/** Builds a complete, single-file site that follows the user's prompt. */
export function buildSiteForPrompt(request: string): Snippet {
  const text = request.toLowerCase();
  const isLogin = /(login|log in|sign in|signin|signup|sign up|auth|register)/.test(text);
  const { category, glass, brand, palette, minimal } = detect(request);
  if (isLogin) {
    return glass
      ? recolorSnippet(makeLoginPage({ name: brand, accent: "green" }), palette)
      : makeSimpleLogin(brand, palette);
  }
  if (glass && /(landing|home|portfolio|agency|business)/.test(text)) {
    return recolorSnippet(makeLandingPage(brand), palette);
  }

  const categoryContent = category === "simple"
    ? customContentFor(request, defaults.simple)
    : defaults[category];
  const content = { ...categoryContent, brand: brand === defaults.simple.brand ? categoryContent.brand : brand };
  const asksForFeatures = /(feature|service|benefit|about|why)/.test(text);
  const asksForList = /(menu|pricing|price|product|inventory|listing|gallery|schedule|timetable|project|work|post|article|speaker|course)/.test(text);
  const asksForContact = /(contact|booking|book|email|call|form|cta|get in touch)/.test(text);
  const showCards = !minimal || asksForFeatures;
  const showList = !minimal || asksForList;
  const showContact = !minimal || asksForContact;
  const theme = glass
    ? `--panel:rgba(255,255,255,.34);--edge:rgba(255,255,255,.72);--blur:blur(22px) saturate(165%);--card-shadow:0 24px 60px -30px rgba(15,23,42,.45);`
    : `--panel:${palette.surface};--edge:${palette.background2};--blur:none;--card-shadow:0 2px 0 ${palette.background2};`;
  const heroExtras = glass
    ? `<div class="tilt" id="tilt" aria-hidden="true"><span></span><span></span><span></span></div>`
    : `<div class="plainblock" aria-hidden="true">${content.stats.map(([k, v]) => `<div><strong>${v}</strong><small>${k}</small></div>`).join("")}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${content.brand} — ${content.eyebrow}</title>
<style>
:root{--leaf:${palette.primary};--deep:${palette.deep};--gold:${palette.accent};--ink:${palette.ink};--muted:${palette.muted};--pale:${palette.pale};--surface:${palette.surface};${theme}
  --radius:${glass ? "22px" : "12px"};}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;color:var(--ink);font-family:"Plus Jakarta Sans",Inter,"Segoe UI",system-ui,sans-serif;line-height:1.6;
  background:${glass
    ? `radial-gradient(70rem 46rem at 8% -10%,${palette.pale},transparent 58%),radial-gradient(50rem 34rem at 100% 0%,${palette.background2},transparent 55%),linear-gradient(150deg,${palette.background},${palette.background2} 55%,${palette.background})`
    : palette.background};}
.wrap{width:min(1080px,92%);margin:auto}
header.nav{position:sticky;top:14px;z-index:9;margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:10px 16px;border-radius:999px;background:${glass ? "rgba(255,255,255,.5)" : "var(--surface)"};border:1px solid var(--edge);
  ${glass ? "backdrop-filter:blur(18px) saturate(160%);box-shadow:0 18px 40px -28px rgba(24,66,26,.5);" : "box-shadow:0 1px 0 #edf2e8;"}}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:-.02em;font-family:"Bricolage Grotesque","Plus Jakarta Sans",serif}
.brand i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-style:italic;font-weight:800;
  background:linear-gradient(145deg,#6bbd3f,#2e7d32);box-shadow:inset 0 0 0 2px rgba(201,154,46,.8)}
nav.links{display:flex;gap:22px;font-size:.86rem;color:var(--muted)}
nav.links a{color:inherit;text-decoration:none}
nav.links a:hover{color:var(--deep)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:${glass ? "999px" : "8px"};border:0;cursor:pointer;
  color:#fff;font-weight:700;font-size:.88rem;text-decoration:none;
  background:linear-gradient(180deg,#5fb838,#2f8532);box-shadow:0 12px 24px -14px rgba(46,125,50,.9)}
.btn:hover{filter:brightness(1.05)}
.btn.ghost{background:${glass ? "rgba(255,255,255,.6)" : "var(--surface)"};color:var(--ink);border:1px solid var(--edge);box-shadow:none}
.hero{display:grid;grid-template-columns:1.02fr .98fr;gap:46px;align-items:center;padding:64px 0 34px;position:relative}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border-radius:999px;font-size:.72rem;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:var(--deep);background:${glass ? "rgba(255,255,255,.55)" : "var(--pale)"};border:1px solid var(--edge)}
.hero h1{margin:16px 0 16px;font-family:"Bricolage Grotesque","Plus Jakarta Sans",serif;font-size:clamp(2.1rem,4.6vw,3.35rem);line-height:1.05;letter-spacing:-.035em}
.hero h1 span{color:transparent;background:linear-gradient(100deg,var(--leaf),var(--gold));-webkit-background-clip:text;background-clip:text}
.hero .lead{margin:0 0 24px;color:var(--muted);font-size:1rem;max-width:46ch}
.actions{display:flex;gap:12px;flex-wrap:wrap}
${glass ? `.tilt{position:relative;aspect-ratio:1.15/1;border-radius:26px;display:grid;place-items:center;transition:transform .25s ease;
  background:linear-gradient(150deg,rgba(255,255,255,.6),rgba(255,255,255,.2));border:1px solid rgba(255,255,255,.85);
  box-shadow:var(--card-shadow);transform-style:preserve-3d;overflow:hidden}
.tilt span{position:absolute;border-radius:50%;border:1px solid color-mix(in srgb,var(--deep) 32%,transparent)}
.tilt span:nth-child(1){width:70%;height:70%}
.tilt span:nth-child(2){width:46%;height:46%;border-color:color-mix(in srgb,var(--gold) 45%,transparent)}
.tilt span:nth-child(3){width:22%;height:22%;background:conic-gradient(from 200deg,var(--leaf),var(--gold),var(--leaf));border:0;box-shadow:0 16px 32px -14px rgba(15,23,42,.55)}` : ""}
.plainblock{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.plainblock div{background:var(--pale);border:1px solid var(--edge);border-radius:12px;padding:16px;text-align:center}
.plainblock strong{display:block;font-size:1.25rem;font-family:"Bricolage Grotesque",serif}
.plainblock small{color:var(--muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em}
section{padding:34px 0}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
.card{padding:22px;border-radius:var(--radius);background:${glass ? "rgba(255,255,255,.42)" : "var(--surface)"};border:1px solid var(--edge);
  ${glass ? "backdrop-filter:blur(18px) saturate(150%);" : ""}box-shadow:var(--card-shadow)}
.card h3{margin:10px 0 6px;font-size:1rem;font-family:"Bricolage Grotesque",serif}
.card p{margin:0;color:var(--muted);font-size:.86rem}
.num{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:10px;background:var(--pale);color:var(--deep);font-weight:800;font-size:.8rem}
h2.sec{margin:0;font-family:"Bricolage Grotesque",serif;font-size:clamp(1.5rem,3vw,2rem);letter-spacing:-.03em}
.list{margin-top:18px;display:grid;gap:8px}
.row{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;padding:14px 18px;border-radius:var(--radius);
  background:${glass ? "rgba(255,255,255,.42)" : "var(--surface)"};border:1px solid var(--edge);font-size:.9rem}
.row b{font-weight:700}
.row .sub{color:var(--muted);font-size:.78rem}
.row .price{font-weight:700;color:var(--deep);font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.82rem}
.cta{margin:44px 0 10px;padding:34px;border-radius:${glass ? "26px" : "14px"};text-align:center;
  background:${glass ? "rgba(255,255,255,.5)" : "var(--pale)"};border:1px solid var(--edge);${glass ? "backdrop-filter:blur(20px);" : ""}}
.cta h2{margin:0 0 8px;font-family:"Bricolage Grotesque",serif;font-size:1.4rem;letter-spacing:-.02em}
.cta p{margin:0 0 18px;color:var(--muted);font-size:.9rem}
footer{padding:26px 0 46px;color:var(--muted);font-size:.78rem;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
@media(max-width:860px){.hero{grid-template-columns:1fr;gap:30px;padding-top:42px}nav.links{display:none}.cards,.plainblock{grid-template-columns:1fr}.row{grid-template-columns:1fr auto}}
${glass ? "@media(prefers-reduced-motion:reduce){.tilt{transition:none}}" : ""}
</style>
</head>
<body>
<div class="wrap">
  <header class="nav">
    <div class="brand"><i>S</i>${content.brand}</div>
    <nav class="links">${showCards ? '<a href="#about">About</a>' : ""}${showList ? `<a href="#work">${content.listTitle}</a>` : ""}${showContact ? '<a href="#contact">Contact</a>' : ""}</nav>
    <a class="btn" href="${showContact ? "#contact" : showList ? "#work" : "mailto:hello@example.com"}">${content.primary}</a>
  </header>

  <section class="hero">
    <div>
      <span class="eyebrow">${content.eyebrow}</span>
      <h1>${content.title} <span>${content.highlight}</span></h1>
      <p class="lead">${content.lead}</p>
      <div class="actions"><a class="btn" href="${showContact ? "#contact" : showList ? "#work" : "mailto:hello@example.com"}">${content.primary}</a>${showList ? `<a class="btn ghost" href="#work">${content.secondary}</a>` : ""}</div>
    </div>
    ${heroExtras}
  </section>

  ${showCards ? `<section id="about">
    <h2 class="sec">What makes it work</h2>
    <div class="cards">${content.cards.map(([title, body], index) => `<article class="card"><span class="num">0${index + 1}</span><h3>${title}</h3><p>${body}</p></article>`).join("")}</div>
  </section>` : ""}

  ${showList ? `<section id="work">
    <h2 class="sec">${content.listTitle}</h2>
    <div class="list">${content.list.map(([name, sub, price]) => `<div class="row"><span><b>${name}</b><span class="sub"> — ${sub}</span></span><span class="sub"></span><span class="price">${price}</span></div>`).join("")}</div>
  </section>` : ""}

  ${showContact ? `<section class="cta" id="contact">
    <h2>${content.cta}</h2>
    <p>Send a note and we will reply within one working day.</p>
    <a class="btn" href="mailto:hello@${content.brand.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com">Get in touch</a>
  </section>` : ""}

  <footer><span>© ${new Date().getFullYear()} ${content.brand}</span><span>One file · HTML, CSS and a little JavaScript</span></footer>
</div>
<script>
(function () {
  ${glass ? `var tilt = document.getElementById("tilt");
  if (tilt && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var wrap = document.querySelector(".wrap");
    wrap.addEventListener("pointermove", function (event) {
      var r = tilt.getBoundingClientRect();
      var x = (event.clientX - r.left) / r.width - 0.5;
      var y = (event.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = "rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg)";
    });
    wrap.addEventListener("pointerleave", function () { tilt.style.transform = "none"; });
  }` : ""}
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
</script>
</body>
</html>`;

  return {
    html,
    title: `${glass ? "3D " : minimal ? "Simple " : ""}${palette.name} ${content.brand} — ${content.eyebrow}`,
    fileName: `${glass ? "3d-" : minimal ? "simple-" : ""}${palette.name}-${category}-site.html`,
  };
}

/** True when the prompt is asking for a page or code rather than a chat answer. */
export function isSiteRequest(message: string): boolean {
  const text = message.toLowerCase();
  const artifact = /\b(website|web site|webpage|web page|landing page|login page|signup page|portfolio site|html page|html css|html,? css|template|frontend ui|front-end ui)\b/.test(text)
    || (/\b(html|css|javascript)\b/.test(text) && /\b(page|site|form|layout|template)\b/.test(text));
  const action = /\b(make|build|create|design|generate|code|write|banao|bana do|banaye|banaiye|taiyar karo)\b/.test(text);
  const discussion = /\b(explain|teach|review|fix my|debug|how should|how do|how can|plan,? build|strategy for|kaise|kaisay|kis tarah|samjhao|samjha do|batao|seekhna|sikhna)\b/.test(text);
  if (discussion && !/\b(make me|build me|create me|make a|build a|create a|design a|banao|bana do|bana kar do|banaye|banaiye)\b/.test(text)) return false;
  return artifact && action;
}
