/* ============================================================
   Outils partagés des défis du jour (à charger avant le script du jeu).
   Tout le monde reçoit la même série le même jour : le hasard est « graine » par la date (heure de Paris),
   le nom du jeu et le numéro de la manche. Pour un nouveau jeu :
     const R = SDQ.rng("monjeu", SDQ.dayKey(), numeroManche);   // R() donne un nombre entre 0 et 1, identique pour tous
     const ordre = SDQ.shuffle(liste, SDQ.rng("monjeu", SDQ.dayKey()));   // mélange identique pour tous
   (la liste doit être dans le même ordre pour tout le monde : on la trie par nom si elle vient d'un dossier).
   ============================================================ */
/* ---- Classement du jour ----
   Pour un vrai classement commun à tous, renseigne l'adresse d'une base Firebase Realtime Database (voir le README du projet / la conversation) :
   window.SDQ_CONFIG = { firebaseUrl: "https://mon-projet-default-rtdb.europe-west1.firebasedatabase.app" };
   Tant qu'elle est vide, les scores restent dans ce navigateur (test seulement). */
window.SDQ_CONFIG = window.SDQ_CONFIG || { firebaseUrl: "", firebaseDb: "base-bonfire-default-rtdb" };   /* firebaseDb : nom de la base, l'adresse (région) est détectée automatiquement */
window.SDQ = (function () {
  const TZ = "Europe/Paris";
  const dayKey = () => new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  function hash(str) {                       /* cyrb128 simplifié -> entier 32 bits */
    let h1 = 1779033703, h2 = 3144134277;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = h2 ^ Math.imul(h1 ^ c, 597399067); h2 = h1 ^ Math.imul(h2 ^ c, 2869860233); }
    h1 = Math.imul(h1 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h2 ^ (h2 >>> 22), 2869860233);
    return (h1 ^ h2) >>> 0;
  }
  function rng(...parts) {                   /* mulberry32 */
    let a = hash(parts.join("|"));
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((r || Math.random)() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function secondsToMidnight() {             /* secondes avant minuit à Paris */
    const [h, m, s] = new Date().toLocaleTimeString("fr-FR", { timeZone: TZ, hour12: false }).split(":").map(Number);
    return 86400 - ((h % 24) * 3600 + m * 60 + s);
  }
  /* Fenêtre d'explication avant le début d'un défi du jour. Renvoie une promesse résolue au clic sur le bouton.
     SDQ.intro({ title: "Splash Art", sub: "Défi du jour", rules: ["…", "…"], button: "Lancer la partie" }).then(() => demarrer()); */
  function intro(o) {
    return new Promise(function (resolve) {
      if (!document.getElementById("sdq-intro-css")) {
        const st = document.createElement("style"); st.id = "sdq-intro-css";
        st.textContent = ".sdq-ov{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(4,7,14,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}"
          + ".sdq-box{width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:26px 26px 22px;border:1px solid rgba(230,195,106,.45);border-radius:18px;background:linear-gradient(180deg,#121b31,#0b1222);box-shadow:0 24px 70px rgba(0,0,0,.7);color:#e9eef7;font:16px/1.5 Barlow,system-ui,sans-serif}"
          + ".sdq-box .k{margin:0 0 2px;color:#e6c36a;font-size:.78rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase}"
          + ".sdq-box h2{margin:0 0 14px;font-family:Cinzel,serif;font-size:1.6rem;color:#e6c36a;letter-spacing:.06em}"
          + ".sdq-box ul{margin:0 0 18px;padding:0;list-style:none;display:grid;gap:9px}"
          + ".sdq-box li{display:flex;gap:11px;align-items:baseline;color:#c7d1e4;font-size:.96rem}"
          + ".sdq-box li i{flex:none;width:1.4em;text-align:center;font-style:normal}"
          + ".sdq-box li b{color:#fff}"
          + ".sdq-box button{display:block;width:100%;padding:12px 18px;border:0;border-radius:12px;background:#3fc1e0;color:#06101c;font:700 1.05rem Barlow,system-ui,sans-serif;letter-spacing:.04em;cursor:pointer}"
          + ".sdq-box button:hover{filter:brightness(1.1)}";
        document.head.appendChild(st);
      }
      const ov = document.createElement("div"); ov.className = "sdq-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
      ov.innerHTML = '<div class="sdq-box"><p class="k"></p><h2></h2><ul></ul><button type="button"></button></div>';
      ov.querySelector(".k").textContent = o.sub || "Défi du jour";
      ov.querySelector("h2").textContent = o.title || "";
      ov.querySelector("ul").innerHTML = (o.rules || []).map(function (r) { return "<li><i>" + r[0] + "</i><span>" + r[1] + "</span></li>"; }).join("");
      const btn = ov.querySelector("button"); btn.textContent = o.button || "Lancer la partie";
      btn.onclick = function () { ov.remove(); resolve(); };
      document.body.appendChild(ov); btn.focus();
    });
  }
  /* ---- Highscores du jour ---- */
  const LOCAL = "sdq_daily_scores_local";
  let fbBase = (window.SDQ_CONFIG.firebaseUrl || "").replace(/\/+$/, ""), fbProbe = null;
  const fb = () => fbBase;
  /* Détecte l'adresse de la base d'après son nom (US, Europe, Asie) : la mauvaise région répond 404 */
  function detect() {
    const db = window.SDQ_CONFIG.firebaseDb;
    if (fbBase || !db) return Promise.resolve();
    try { const c = localStorage.getItem("sdq_fb_base"); if (c && c.indexOf(db) >= 0) { fbBase = c; return Promise.resolve(); } } catch (e) {}
    return fbProbe || (fbProbe = (async () => {
      for (const h of [db + ".firebaseio.com", db + ".europe-west1.firebasedatabase.app", db + ".asia-southeast1.firebasedatabase.app"]) {
        try { const r = await fetch("https://" + h + "/.json?shallow=true"); if (r.status !== 404) { fbBase = "https://" + h; try { localStorage.setItem("sdq_fb_base", fbBase); } catch (e) {} return; } } catch (e) {}
      }
    })());
  }
  const path = (game) => "scores/" + dayKey() + "/" + encodeURIComponent(game) + ".json";
  async function entries(game) {
    await detect();
    if (fb()) { const r = await fetch(fb() + "/" + path(game)); if (!r.ok) throw new Error("HTTP " + r.status); const o = await r.json(); return o ? Object.values(o) : []; }
    try { const all = JSON.parse(localStorage.getItem(LOCAL)) || {}; return all[dayKey() + "|" + game] || []; } catch (e) { return []; }
  }
  async function top(game) {                 /* meilleur score du jour : { name, score } ou null */
    try { const l = (await entries(game)).filter(e => e && Number.isFinite(e.score)).sort((a, b) => b.score - a.score || (a.t || 0) - (b.t || 0)); return l[0] || null; } catch (e) { return null; }
  }
  async function submit(game, name, score) {
    await detect();
    const e = { name: String(name).trim().slice(0, 16), score: Math.max(0, Math.round(score)), t: Date.now() };
    if (fb()) { const r = await fetch(fb() + "/" + path(game), { method: "POST", body: JSON.stringify(e) }); if (!r.ok) throw new Error("HTTP " + r.status); return e; }
    const all = JSON.parse(localStorage.getItem(LOCAL) || "{}"), k = dayKey() + "|" + game; (all[k] = all[k] || []).push(e); localStorage.setItem(LOCAL, JSON.stringify(all)); return e;
  }
  const fmt = n => Number(n || 0).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ");
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const topHtml = t => "<span>" + (t ? `Highscore #1 : <b>${fmt(t.score)}</b> — ${esc(t.name)}` : `Highscore #1 : <b>—</b> <span class="hs-mut">· sois le premier !</span>`) + "</span>";
  /* Remplit un élément avec le highscore #1 du jour */
  async function showTop(el, game) { el.innerHTML = topHtml(null); el.innerHTML = topHtml(await top(game)); }
  /* Bloc de fin de partie : highscore + saisie du pseudo (une seule fois par jour et par jeu) */
  function scoreBox(el, game, score) {
    if (!document.getElementById("sdq-hs-css")) {
      const st = document.createElement("style"); st.id = "sdq-hs-css";
      st.textContent = ".sdq-hs{margin:0 0 16px;display:grid;gap:10px;justify-items:center}.sdq-hs .t{color:#c7d1e4;font-size:.95rem}.sdq-hs .t b{color:#e6c36a}.hs-mut{color:#8d9ab2}"
        + ".sdq-hs form{display:flex;gap:8px;width:100%;max-width:380px}.sdq-hs input{flex:1;min-width:0;padding:10px 12px;border:1.5px solid #56709c;border-radius:10px;background:#0b1222;color:#e9eef7;font:inherit}"
        + ".sdq-hs button{padding:10px 14px;border:0;border-radius:10px;background:#3fc1e0;color:#06101c;font:700 .95rem inherit;font-family:inherit;cursor:pointer;white-space:nowrap}.sdq-hs .f{width:100%;display:grid;justify-items:center;gap:8px;padding:14px 12px;border:1px solid rgba(230,195,106,.45);border-radius:14px;background:rgba(230,195,106,.07)}.sdq-hs .f:has(.ok){border-color:rgba(74,222,128,.4);background:rgba(74,222,128,.07)}.hs-call{color:#e6c36a;font-weight:700;font-size:.92rem;letter-spacing:.03em}.hs-arrow{display:inline-block;margin-right:8px;animation:hsbob 1s ease-in-out infinite}@keyframes hsbob{50%{transform:translateY(5px)}}.sdq-hs input{border-color:#e6c36a;box-shadow:0 0 0 3px rgba(230,195,106,.22),0 0 18px rgba(230,195,106,.3);animation:hsglow 1.8s ease-in-out infinite}@keyframes hsglow{50%{box-shadow:0 0 0 4px rgba(230,195,106,.38),0 0 26px rgba(230,195,106,.5)}}.sdq-hs input:focus{outline:none;animation:none;border-color:#fff3c4;box-shadow:0 0 0 3px rgba(230,195,106,.5)}@media (prefers-reduced-motion:reduce){.hs-arrow,.sdq-hs input{animation:none}}.sdq-hs .ok{color:#4ade80;font-weight:600}.sdq-hs .ko{color:#ff6b6b;font-size:.85rem}";
      document.head.appendChild(st);
    }
    const KEY = "sdq_daily_sub_" + game; let sub = null;
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.day === dayKey()) sub = d; } catch (e) {}
    el.className = "sdq-hs"; el.innerHTML = '<div class="t"></div><div class="f"></div>';
    const t = el.querySelector(".t"), f = el.querySelector(".f"), refresh = () => showTop(t, game);
    refresh();
    if (sub) { f.innerHTML = `<span class="ok">✓ Score enregistré sous « ${esc(sub.name)} »</span>`; return; }
    let last = ""; try { last = localStorage.getItem("sdq_name") || ""; } catch (e) {}
    f.innerHTML = `<div class="hs-call"><span class="hs-arrow" aria-hidden="true">▼</span>Entre ton pseudo pour apparaître au classement</div><form><input maxlength="16" placeholder="Ton pseudo" aria-label="Ton pseudo" value="${esc(last)}" required><button type="submit">Enregistrer mon score</button></form><div class="ko" hidden></div>`;
    const form = f.querySelector("form"), err = f.querySelector(".ko"), btn = form.querySelector("button");
    form.onsubmit = async ev => {
      ev.preventDefault(); const name = form.querySelector("input").value.trim(); if (!name) return;
      btn.disabled = true; err.hidden = true;
      try {
        await submit(game, name, score);
        try { localStorage.setItem(KEY, JSON.stringify({ day: dayKey(), name })); localStorage.setItem("sdq_name", name); } catch (e) {}
        f.innerHTML = `<span class="ok">✓ Score enregistré sous « ${esc(name)} »</span>`; refresh();
      } catch (e) { btn.disabled = false; err.textContent = "Impossible d'enregistrer pour l'instant, réessaie."; err.hidden = false; }
    };
  }
  return { TZ, dayKey, rng, shuffle, secondsToMidnight, intro, top, submit, showTop, scoreBox };
})();
