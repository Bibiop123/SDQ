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
  return { TZ, dayKey, rng, shuffle, secondsToMidnight };
})();
