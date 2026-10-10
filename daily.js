/* ============================================================
   Outils partagés des défis du jour (à charger avant le script du jeu).
   Tout le monde reçoit la même série le même jour : le hasard est « graine » par la date (heure de Paris),
   le nom du jeu et le numéro de la manche. Pour un nouveau jeu :
     const R = SDQ.rng("monjeu", SDQ.dayKey(), numeroManche);   // R() donne un nombre entre 0 et 1, identique pour tous
     const ordre = SDQ.shuffle(liste, SDQ.rng("monjeu", SDQ.dayKey()));   // mélange identique pour tous
   (la liste doit être dans le même ordre pour tout le monde : on la trie par nom si elle vient d'un dossier).
   ============================================================ */
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
  return { TZ, dayKey, rng, shuffle, secondsToMidnight, intro };
})();
