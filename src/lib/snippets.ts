export type Snippet = { html: string; title: string; fileName: string };

const shell = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
${body
  .split("/*SPLIT*/")[0]}
</style>
</head>
<body>
${body.split("/*SPLIT*/")[1]}
<script>
${body.split("/*SPLIT*/")[2]}
</script>
</body>
</html>`;

/** A genuinely finished, transparent 3D glass login page — green and golden. */
export function makeLoginPage(opts: { name?: string; accent?: "green" | "gold" } = {}): Snippet {
  const shop = (opts.name ?? "SwiftSite").replace(/[<>]/g, "");
  const accent = opts.accent ?? "green";
  const body = `
:root{
  --leaf:#6bbd3f; --leaf-deep:#2e7d32; --gold:#e0b04a; --gold-deep:#b8860b;
  --ink:#0f2412; --muted:rgba(15,36,18,.62);
  --glass:rgba(255,255,255,.36); --edge:rgba(255,255,255,.62);
  --shadow:0 30px 80px -30px rgba(24,66,26,.55);
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; display:grid; place-items:center; padding:28px 18px;
  font-family:"Segoe UI",Inter,system-ui,-apple-system,sans-serif;
  color:var(--ink); overflow-x:hidden;
  background:
    radial-gradient(90rem 60rem at 12% -10%, #eafbe0 0%, transparent 55%),
    radial-gradient(70rem 50rem at 100% 0%, #fdf3d8 0%, transparent 52%),
    radial-gradient(60rem 60rem at 50% 120%, #dff2cb 0%, transparent 60%),
    linear-gradient(140deg,#f2fae9 0%,#e8f5db 42%,#faf3e0 100%);
}
.orb{position:fixed; border-radius:50%; filter:blur(40px); opacity:.55; pointer-events:none; z-index:0; animation:float 14s ease-in-out infinite}
.orb.a{width:340px;height:340px;left:-70px;top:8%;background:radial-gradient(circle at 30% 30%,#a8e07c,#5aa53a)}
.orb.b{width:280px;height:280px;right:-60px;top:16%;background:radial-gradient(circle at 40% 40%,#ffe6a8,#e0b04a);animation-delay:-5s}
.orb.c{width:420px;height:420px;left:32%;bottom:-170px;background:radial-gradient(circle at 50% 50%,#d6f3bd,#7cc35a);animation-delay:-9s}
@keyframes float{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(0,-26px,0) scale(1.06)}}

.stage{position:relative;z-index:2;perspective:1400px;width:min(940px,100%)}
.card{
  position:relative; display:grid; grid-template-columns:1.02fr .98fr;
  background:var(--glass); border:1px solid var(--edge); border-radius:28px;
  backdrop-filter:blur(26px) saturate(165%); -webkit-backdrop-filter:blur(26px) saturate(165%);
  box-shadow:var(--shadow), inset 0 1px 0 rgba(255,255,255,.75);
  transform-style:preserve-3d; transition:transform .25s ease, box-shadow .25s ease;
  overflow:hidden;
}
.card::after{content:"";position:absolute;inset:0;border-radius:28px;pointer-events:none;
  background:linear-gradient(115deg,rgba(255,255,255,.55),transparent 42%,transparent 62%,rgba(255,255,255,.28));}
.pane{padding:38px 34px; transform:translateZ(34px)}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.02em;font-size:1.05rem}
.brand .dot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-style:italic;
  background:linear-gradient(145deg,#6bbd3f,#2e7d32);box-shadow:0 8px 18px -8px rgba(46,125,50,.9), inset 0 0 0 2px rgba(224,176,74,.85)}
.pane h1{margin:18px 0 6px;font-size:clamp(1.6rem,3.4vw,2.05rem);line-height:1.15;letter-spacing:-.03em}
.pane h1 span{background:linear-gradient(100deg,#4b9c2f,#b8860b);-webkit-background-clip:text;background-clip:text;color:transparent}
.pane p.lead{margin:0 0 22px;color:var(--muted);font-size:.92rem;line-height:1.6}
.field{position:relative;margin-bottom:14px}
.field input{width:100%;padding:16px 14px 8px;border-radius:14px;border:1px solid rgba(255,255,255,.75);
  background:rgba(255,255,255,.55);color:var(--ink);font-size:.95rem;outline:none;transition:.18s}
.field input:focus{border-color:var(--leaf);background:rgba(255,255,255,.82);box-shadow:0 0 0 4px rgba(107,189,63,.18)}
.field label{position:absolute;left:14px;top:14px;font-size:.9rem;color:rgba(15,36,18,.55);pointer-events:none;transition:.16s}
.field input:focus ~ label,.field input:not(:placeholder-shown) ~ label{top:6px;font-size:.66rem;letter-spacing:.04em;text-transform:uppercase;color:var(--leaf-deep)}
.field.password input{padding-right:52px}.pass-eye{position:absolute;z-index:2;right:7px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.85);border-radius:10px;background:rgba(255,255,255,.62);color:var(--leaf-deep);font-size:16px;cursor:pointer}.pass-eye:hover{background:#fff}.pass-eye:focus-visible{outline:3px solid rgba(107,189,63,.22)}
.row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 18px;font-size:.78rem;color:var(--muted)}
.row a{color:var(--leaf-deep);font-weight:600;text-decoration:none}
.row a:hover{text-decoration:underline}
.btn{width:100%;padding:14px 18px;border:0;border-radius:14px;cursor:pointer;font-weight:700;font-size:.95rem;color:#fff;
  background:linear-gradient(180deg,#6cc23f,#2f8532);box-shadow:0 14px 28px -14px rgba(46,125,50,.95), inset 0 1px 0 rgba(255,255,255,.4);
  transition:transform .15s ease, filter .2s ease}
.btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
.btn:active{transform:translateY(1px)}
.btn.ghost{background:rgba(255,255,255,.62);color:var(--ink);border:1px solid rgba(255,255,255,.9);box-shadow:none;margin-top:10px}
.divider{display:flex;align-items:center;gap:12px;margin:20px 0 4px;color:var(--muted);font-size:.72rem}
.divider::before,.divider::after{content:"";height:1px;flex:1;background:rgba(15,36,18,.14)}
.hint{margin-top:14px;font-size:.75rem;color:var(--muted);line-height:1.55}
.aside{position:relative;padding:38px 34px;display:flex;flex-direction:column;justify-content:center;gap:18px;
  background:linear-gradient(150deg,rgba(255,255,255,.30),rgba(255,246,225,.28));border-left:1px solid rgba(255,255,255,.5);
  transform:translateZ(18px)}
.tiltBox{width:100%;aspect-ratio:1.25/1;border-radius:20px;position:relative;transform-style:preserve-3d;
  background:linear-gradient(150deg,rgba(255,255,255,.6),rgba(255,255,255,.2));border:1px solid rgba(255,255,255,.85);
  box-shadow:0 26px 50px -28px rgba(24,66,26,.6); display:grid;place-items:center;overflow:hidden}
.tiltBox .ring{position:absolute;border-radius:50%;border:1px solid rgba(46,125,50,.28);animation:spin 18s linear infinite}
.tiltBox .ring:nth-child(1){width:64%;height:64%}
.tiltBox .ring:nth-child(2){width:44%;height:44%;border-color:rgba(184,134,11,.36);animation-direction:reverse;animation-duration:13s}
.tiltBox .ring:nth-child(3){width:24%;height:24%;border-color:rgba(107,189,63,.5)}
@keyframes spin{to{transform:rotate(360deg)}}
.tiltBox .core{position:relative;width:74px;height:74px;border-radius:50%;transform:translateZ(46px);
  background:conic-gradient(from 210deg,#6bbd3f,#e0b04a,#6bbd3f);box-shadow:0 18px 36px -14px rgba(24,66,26,.75), inset 0 0 0 6px rgba(255,255,255,.55)}
.aside h2{margin:0;font-size:1.15rem;letter-spacing:-.02em}
.aside ul{margin:0;padding-left:18px;color:var(--muted);font-size:.84rem;line-height:1.7}
.form-msg{min-height:20px;font-size:.8rem;margin:10px 0 0;font-weight:600}
.form-msg.err{color:#a13030}
.form-msg.ok{color:var(--leaf-deep)}
@media (max-width:820px){.card{grid-template-columns:1fr}.aside{display:none}.pane{padding:30px 22px}}
@media (prefers-reduced-motion:reduce){.orb,.tiltBox .ring{animation:none}.card{transition:none}}
/*SPLIT*/
  <div class="orb a"></div><div class="orb b"></div><div class="orb c"></div>
  <main class="stage">
    <section class="card" id="card" aria-label="${shop} sign in">
      <div class="pane">
        <div class="brand"><span class="dot">S</span> ${shop}</div>
        <h1>Welcome back to <span>${shop}</span></h1>
        <p class="lead">Sign in to your glass dashboard. Transparent by design, quick by default.</p>
        <form id="loginForm" novalidate>
          <div class="field">
            <input id="email" type="email" placeholder=" " autocomplete="email" required />
            <label for="email">Email address</label>
          </div>
          <div class="field password">
            <input id="password" type="password" placeholder=" " autocomplete="current-password" required />
            <button class="pass-eye" id="togglePassword" type="button" aria-label="Show password" title="Show password">◉</button>
            <label for="password">Password</label>
          </div>
          <div class="row">
            <label style="display:flex;align-items:center;gap:7px;cursor:pointer">
              <input type="checkbox" id="remember" style="accent-color:#3e8f26" /> Remember me
            </label>
            <a href="#" id="forgot">Forgot password?</a>
          </div>
          <button class="btn" type="submit" id="submitBtn">Sign in</button>
          <button class="btn ghost" type="button" id="demoBtn">Fill demo details</button>
          <p class="form-msg" id="msg" role="status" aria-live="polite"></p>
        </form>
        <p class="hint">Protected by a glass wall and a very serious mehndi pattern. Built with plain HTML, CSS and JavaScript.</p>
      </div>
      <div class="aside">
        <div class="tiltBox" aria-hidden="true">
          <span class="ring"></span><span class="ring"></span><span class="ring"></span>
          <span class="core"></span>
        </div>
        <h2>${accent === "gold" ? "Golden hour, every login" : "A calmer way to sign in"}</h2>
        <ul>
          <li>Real transparent glass, no fake screenshots</li>
          <li>3D tilt follows your pointer</li>
          <li>Works down to 360&nbsp;px wide</li>
        </ul>
      </div>
    </section>
  </main>
/*SPLIT*/
  const card = document.getElementById("card");
  const stage = document.querySelector(".stage");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (card && stage && !reduce) {
    stage.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = "rotateX(" + (-py * 9).toFixed(2) + "deg) rotateY(" + (px * 11).toFixed(2) + "deg) translateZ(0)";
      card.style.boxShadow = (0.5 - py) * 24 + "px " + (0.5 + px) * 24 + "px 70px -30px rgba(24,66,26,.6)";
    });
    stage.addEventListener("pointerleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
      card.style.boxShadow = "";
    });
  }

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("submitBtn");

  document.getElementById("demoBtn").addEventListener("click", () => {
    document.getElementById("email").value = "hello@swiftsite.dev";
    document.getElementById("password").value = "swiftsite123";
    document.getElementById("msg").textContent = "";
  });

  document.getElementById("forgot").addEventListener("click", (event) => {
    event.preventDefault();
    msg.className = "form-msg";
    msg.textContent = "Password reset link sent to your inbox (demo).";
  });

  const passwordInput = document.getElementById("password");
  const passwordToggle = document.getElementById("togglePassword");
  passwordToggle.addEventListener("click", () => {
    const hidden = passwordInput.type === "password";
    passwordInput.type = hidden ? "text" : "password";
    passwordToggle.textContent = hidden ? "◎" : "◉";
    passwordToggle.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
    passwordToggle.title = hidden ? "Hide password" : "Show password";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;
    const valid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email) && pass.length >= 6;
    if (!valid) {
      msg.className = "form-msg err";
      msg.textContent = "Please enter a valid email and a password of 6+ characters.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Signing in…";
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Sign in";
      msg.className = "form-msg ok";
      msg.textContent = "Signed in as " + email + ". This demo keeps everything on your device.";
    }, 900);
  });`;
  return { html: shell(`${shop} · 3D glass sign in`, body), title: "3D transparent login page", fileName: "login-3d-glass.html" };
}

/** A matching 3D glass landing page, used when someone asks for a site. */
export function makeLandingPage(name = "Your Brand"): Snippet {
  const brand = name.replace(/[<>]/g, "");
  const body = `
:root{--leaf:#6bbd3f;--deep:#2e7d32;--gold:#e0b04a;--ink:#0f2412;--muted:rgba(15,36,18,.62)}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,"Segoe UI",system-ui,sans-serif;color:var(--ink);
  background:radial-gradient(80rem 50rem at 10% -10%,#eefbe4,transparent 60%),radial-gradient(60rem 40rem at 100% 0%,#fdf1d6,transparent 55%),linear-gradient(150deg,#f4fbea,#e9f5dd 55%,#faf4e4)}
.wrap{width:min(1120px,92%);margin:auto;padding:28px 0 70px}
nav{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-radius:999px;
  background:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.8);backdrop-filter:blur(18px) saturate(160%);
  box-shadow:0 18px 40px -26px rgba(24,66,26,.5)}
.brand{font-weight:800;letter-spacing:-.02em;display:flex;gap:9px;align-items:center}
.brand i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-style:italic;font-weight:800;
  background:linear-gradient(145deg,#6bbd3f,#2e7d32);box-shadow:inset 0 0 0 2px rgba(224,176,74,.85)}
.links{display:flex;gap:22px;font-size:.86rem;color:var(--muted)}.links a{color:inherit;text-decoration:none}
.links a:hover{color:var(--deep)}
.cta{padding:10px 18px;border-radius:999px;border:0;cursor:pointer;color:#fff;font-weight:700;font-size:.84rem;
  background:linear-gradient(180deg,#6cc23f,#2f8532);box-shadow:0 12px 24px -14px rgba(46,125,50,.9)}
.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center;padding:64px 0 40px}
.hero h1{font-size:clamp(2.2rem,4.6vw,3.4rem);line-height:1.04;letter-spacing:-.04em;margin:0 0 18px}
.hero h1 span{background:linear-gradient(100deg,#4b9c2f,#b8860b);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p{color:var(--muted);font-size:1.02rem;line-height:1.7;max-width:46ch}
.actions{display:flex;gap:12px;margin-top:26px;flex-wrap:wrap}
.actions .ghost{background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.9);color:var(--ink)}
.glass{position:relative;padding:26px;border-radius:26px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.8);
  backdrop-filter:blur(22px) saturate(165%);box-shadow:0 34px 70px -34px rgba(24,66,26,.6);transform-style:preserve-3d;transition:transform .25s}
.glass .mini{border-radius:18px;padding:18px;background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.9)}
.bars{display:grid;gap:9px;margin-top:14px}.bars i{height:9px;border-radius:9px;display:block;background:linear-gradient(90deg,#8ad25e,#e0b04a)}
.bars i:nth-child(2){width:72%}.bars i:nth-child(3){width:46%}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:34px}
.grid article{padding:20px;border-radius:20px;background:rgba(255,255,255,.44);border:1px solid rgba(255,255,255,.8);backdrop-filter:blur(14px)}
.grid h3{margin:10px 0 6px;font-size:1rem}.grid p{margin:0;color:var(--muted);font-size:.84rem;line-height:1.6}
.badge{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#e6f6d9;color:#2e7d21;font-weight:800}
footer{margin-top:54px;text-align:center;color:var(--muted);font-size:.78rem}
@media(max-width:860px){.hero{grid-template-columns:1fr;padding-top:40px}.grid{grid-template-columns:1fr}.links{display:none}}
/*SPLIT*/
<div class="wrap">
  <nav>
    <div class="brand"><i>S</i> ${brand}</div>
    <div class="links"><a href="#">Product</a><a href="#">Pricing</a><a href="#">Docs</a><a href="#">Contact</a></div>
    <button class="cta" id="join">Get started</button>
  </nav>
  <header class="hero">
    <div>
      <h1>Everything you need, <span>in one transparent place</span></h1>
      <p>A clean, fast landing page with real glass panels, a golden accent and no build step. Edit one file and ship it.</p>
      <div class="actions"><button class="cta" id="join2">Start free</button><button class="cta ghost" id="more">See the details</button></div>
    </div>
    <div class="glass" id="tilt">
      <div class="mini"><strong>${brand} workspace</strong><div class="bars"><i></i><i></i><i></i></div></div>
    </div>
  </header>
  <section class="grid" id="details">
    <article><span class="badge">1</span><h3>Fast by default</h3><p>No frameworks, no dependencies, one HTML file that loads instantly.</p></article>
    <article><span class="badge">2</span><h3>Real glass</h3><p>Layered transparency, soft shadows and depth that reacts to the pointer.</p></article>
    <article><span class="badge">3</span><h3>Yours to edit</h3><p>Colours live in CSS variables, copy is plain HTML. Make it your own in minutes.</p></article>
  </section>
  <footer>Built with HTML, CSS and JavaScript · ${brand}</footer>
</div>
/*SPLIT*/
const tilt = document.getElementById("tilt");
const wrap = document.querySelector(".wrap");
if (tilt && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  wrap.addEventListener("pointermove", (e) => {
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform = "rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg)";
  });
  wrap.addEventListener("pointerleave", () => { tilt.style.transform = "none"; });
}
document.getElementById("more").addEventListener("click", () => {
  document.getElementById("details").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("join").addEventListener("click", () => alert("Hook this button up to your signup flow."));
document.getElementById("join2").addEventListener("click", () => alert("Hook this button up to your signup flow."));`;
  return { html: shell(`${brand} · landing`, body), title: "3D glass landing page", fileName: "landing-3d-glass.html" };
}

/** Detects a build-a-page request and returns the matching snippet. */
export function pickSnippet(message: string): Snippet | null {
  const text = message.toLowerCase();
  const wantsCode = /(html|css|js|javascript|code|page|website|site|template|snippet|design|ui|form)/.test(text);
  if (!wantsCode) return null;
  const isLogin = /(login|log in|signin|sign in|signup|sign up|auth|register)/.test(text);
  const is3d = /(3d|transparent|glass|glassmorphism|tilt)/.test(text);
  if (isLogin && is3d) return makeLoginPage({ accent: "gold" });
  if (isLogin) return makeLoginPage();
  if (is3d || /(landing|hero|portfolio|business)/.test(text)) return makeLandingPage("Your Brand");
  return null;
}
