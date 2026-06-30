// ===========================================================================
// scenes.js — Cinematic animated figures that act out each verse.
//
// Stylized but volumetrically-shaded SVG characters (gradients, highlights,
// soft shadows) are composed over layered, parallax environments (sky, clouds,
// moon, stars, sea, fire, cosmos…) with a slow camera push-in, glow/bloom,
// motion trails and particles — so each verse reads like a little animated shot.
//
// window.Scenes = { buildHTML(index) -> string, render(stage, desc, index) }
// ===========================================================================
(function () {
  "use strict";

  // ---------- shared gradient / filter defs (referenced by url(#id)) ----------
  const DEFS =
    '<svg class="scene-defs" width="0" height="0" aria-hidden="true"><defs>' +
    '<linearGradient id="gSaffron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc15e"/><stop offset="1" stop-color="#e2580f"/></linearGradient>' +
    '<linearGradient id="gDhoti" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8443a"/><stop offset="1" stop-color="#9c1f1f"/></linearGradient>' +
    '<radialGradient id="gSkinHanu" cx="0.42" cy="0.34" r="0.85"><stop offset="0" stop-color="#f8ad6e"/><stop offset="1" stop-color="#cf5f29"/></radialGradient>' +
    '<radialGradient id="gSkin" cx="0.42" cy="0.34" r="0.85"><stop offset="0" stop-color="#ffe0bb"/><stop offset="1" stop-color="#e3a273"/></radialGradient>' +
    '<radialGradient id="gBlue" cx="0.42" cy="0.34" r="0.9"><stop offset="0" stop-color="#86a6ec"/><stop offset="1" stop-color="#3f5db0"/></radialGradient>' +
    '<linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa0"/><stop offset="1" stop-color="#dca200"/></linearGradient>' +
    '<linearGradient id="gSaree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34d699"/><stop offset="1" stop-color="#0f6e49"/></linearGradient>' +
    '<linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#79b85f"/><stop offset="1" stop-color="#34592a"/></linearGradient>' +
    '<linearGradient id="gMonkey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c5884a"/><stop offset="1" stop-color="#7c4a1d"/></linearGradient>' +
    '<linearGradient id="gRobe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb05a"/><stop offset="1" stop-color="#c96a18"/></linearGradient>' +
    '<radialGradient id="gSun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6c2"/><stop offset="0.55" stop-color="#ffce4a"/><stop offset="1" stop-color="#ff9026"/></radialGradient>' +
    '<linearGradient id="gMtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9a63"/><stop offset="1" stop-color="#234a2f"/></linearGradient>' +
    '<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6ebf0"/><stop offset="1" stop-color="#8a9098"/></linearGradient>' +
    '<radialGradient id="gHeart" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#ff8aa3"/><stop offset="1" stop-color="#d4264a"/></radialGradient>' +
    "</defs></svg>";

  const C = { dark: "#2a1208", line: "#7a3a18" };

  // ---------- helpers ----------
  function svg(inner, vb) {
    return '<svg class="char-svg" viewBox="' + (vb || "0 0 120 182") + '">' + inner + "</svg>";
  }
  function place(inner, o) {
    o = o || {};
    const w = o.w || 120;
    const left = o.left != null ? o.left : 50;
    const bottom = o.bottom != null ? o.bottom : 8;
    const z = o.z || 1;
    const anim = o.anim || "";
    const flip = o.flip ? "flip" : "";
    const outer = "left:" + left + "%;bottom:" + bottom + "%;width:" + w + "px;z-index:" + z + ";";
    let inS = "";
    if (o.delay) inS += "animation-delay:" + o.delay + "s;";
    if (o.dur) inS += "animation-duration:" + o.dur + "s;";
    return (
      '<div class="char ' + flip + '" style="' + outer + '">' +
      '<div class="char-inner ' + anim + '" style="' + inS + '">' + inner + "</div></div>"
    );
  }
  function aura(o) {
    o = o || {};
    const left = o.left != null ? o.left : 50;
    const bottom = o.bottom != null ? o.bottom : 8;
    const size = o.size || 220;
    const cls = o.cls || "aura";
    return '<div class="' + cls + '" style="left:' + left + "%;bottom:" + bottom + "%;width:" + size + "px;height:" + size + 'px"></div>';
  }
  function name(label) {
    return label ? '<text class="char-name" x="60" y="178" text-anchor="middle">' + label + "</text>" : "";
  }
  function sheen() {
    // volumetric highlight + side shadow reused on the head
    return '<ellipse cx="50" cy="42" rx="14" ry="11" fill="#ffffff" opacity="0.22"/>' +
      '<path d="M84 40 a30 30 0 0 1 -6 36 a30 30 0 0 0 6 -36Z" fill="#000" opacity="0.12"/>';
  }

  // ---------- shared sub-parts ----------
  function face(o) {
    o = o || {};
    const skin = o.skin || "url(#gSkin)";
    let s = '<circle cx="36" cy="52" r="6" fill="' + skin + '"/><circle cx="84" cy="52" r="6" fill="' + skin + '"/>';
    s += '<circle cx="60" cy="50" r="30" fill="' + skin + '"/>';
    s += sheen();
    if (o.muzzle) s += '<ellipse cx="60" cy="62" rx="16" ry="13" fill="' + o.muzzle + '"/><ellipse cx="60" cy="59" rx="4" ry="3" fill="#5a2a10"/>';
    s += '<circle cx="50" cy="50" r="3.6" fill="' + C.dark + '"/><circle cx="70" cy="50" r="3.6" fill="' + C.dark + '"/>';
    s += '<circle cx="51.2" cy="48.8" r="1.1" fill="#fff"/><circle cx="71.2" cy="48.8" r="1.1" fill="#fff"/>';
    s += '<path d="M52 ' + (o.muzzle ? 64 : 60) + " Q60 " + (o.muzzle ? 70 : 67) + " 68 " + (o.muzzle ? 64 : 60) + '" stroke="#8a2f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    if (o.tilak) s += '<path d="M60 30 L56 44 L64 44 Z" fill="' + (o.tilakColor || "#c62828") + '"/>';
    return s;
  }
  function crown(grad) {
    return '<path d="M38 30 L46 9 L60 26 L74 9 L82 30 Z" fill="' + (grad || "url(#gGold)") + '" stroke="#b8860b" stroke-width="2"/>' +
      '<circle cx="60" cy="13" r="4" fill="#ff5a5a"/><circle cx="46" cy="11" r="2.4" fill="#7fe3ff"/><circle cx="74" cy="11" r="2.4" fill="#7fe3ff"/>';
  }
  function hairTop(color) {
    return '<path d="M30 44 Q34 14 60 14 Q86 14 90 44 Q78 30 60 30 Q42 30 30 44Z" fill="' + (color || C.dark) + '"/>';
  }
  function bow(side) {
    const x = side === "r" ? 92 : 18;
    const c = side === "r" ? x + 16 : x - 16;
    return '<path d="M' + x + " 30 Q" + c + " 78 " + x + ' 126" fill="none" stroke="#6b3f12" stroke-width="4"/>' +
      '<line x1="' + x + '" y1="30" x2="' + x + '" y2="126" stroke="#caa24a" stroke-width="1.6"/>';
  }

  function torso(grad, grad2, arms, accent) {
    let s = "";
    s += '<rect x="40" y="118" width="40" height="48" rx="11" fill="' + (grad2 || grad) + '"/>';
    s += '<rect x="40" y="112" width="40" height="14" rx="7" fill="' + (accent || "url(#gGold)") + '"/>';
    s += '<rect x="36" y="78" width="48" height="44" rx="20" fill="' + grad + '"/>';
    s += '<ellipse cx="50" cy="90" rx="10" ry="14" fill="#fff" opacity="0.14"/>';
    const sk = "url(#gSkin)";
    if (arms === "namaste") {
      s += '<rect x="44" y="86" width="14" height="34" rx="7" fill="' + grad + '" transform="rotate(18 51 100)"/>';
      s += '<rect x="62" y="86" width="14" height="34" rx="7" fill="' + grad + '" transform="rotate(-18 69 100)"/>';
      s += '<circle cx="60" cy="92" r="8" fill="' + sk + '"/>';
    } else if (arms === "up") {
      s += '<rect x="26" y="46" width="13" height="44" rx="6" fill="' + grad + '" transform="rotate(24 32 68)"/>';
      s += '<rect x="81" y="46" width="13" height="44" rx="6" fill="' + grad + '" transform="rotate(-24 88 68)"/>';
      s += '<circle cx="30" cy="48" r="7" fill="' + sk + '"/><circle cx="90" cy="48" r="7" fill="' + sk + '"/>';
    } else if (arms === "shield") {
      s += '<rect x="80" y="74" width="34" height="13" rx="6" fill="' + grad + '"/><circle cx="116" cy="80" r="8" fill="' + sk + '"/>';
      s += '<rect x="22" y="86" width="13" height="40" rx="6" fill="' + grad + '"/>';
    } else if (arms === "mace") {
      s += '<rect x="78" y="56" width="13" height="42" rx="6" fill="' + grad + '" transform="rotate(-18 84 78)"/>';
      s += '<rect x="26" y="86" width="13" height="40" rx="6" fill="' + grad + '"/><circle cx="32" cy="124" r="7" fill="' + sk + '"/>';
    } else if (arms === "jab") {
      s += '<rect x="80" y="80" width="36" height="13" rx="6" fill="' + grad + '"/><circle cx="116" cy="86" r="8" fill="' + sk + '"/>';
      s += '<rect x="26" y="86" width="13" height="40" rx="6" fill="' + grad + '"/>';
    } else {
      s += '<rect x="24" y="86" width="13" height="42" rx="6" fill="' + grad + '"/><circle cx="30" cy="126" r="7" fill="' + sk + '"/>';
      s += '<rect x="83" y="86" width="13" height="42" rx="6" fill="' + grad + '"/><circle cx="90" cy="126" r="7" fill="' + sk + '"/>';
    }
    return s;
  }
  function maceProp() {
    return '<g transform="rotate(-18 84 70)"><rect x="81" y="40" width="7" height="64" rx="3.5" fill="url(#gGold)" stroke="#9c7a2e" stroke-width="1.2"/>' +
      '<circle cx="84.5" cy="34" r="15" fill="url(#gGold)" stroke="#b08a2e" stroke-width="2.5"/><circle cx="80" cy="30" r="4" fill="#fff" opacity="0.5"/></g>';
  }
  function flagProp() {
    return '<line x1="20" y1="18" x2="20" y2="120" stroke="#7a4a17" stroke-width="4"/>' +
      '<path d="M20 22 L54 31 L20 44 Z" fill="url(#gSaffron)" stroke="#c0410a" stroke-width="1.5" class="flutter"/>';
  }
  function tail() {
    return '<path d="M40 130 C6 128 4 56 36 70" fill="none" stroke="url(#gSkinHanu)" stroke-width="13" stroke-linecap="round"/>';
  }

  // ---------- characters ----------
  function hanuman(o) {
    o = o || {};
    const arms = o.arms || "mace";
    let inner = "";
    if (o.cape) inner += '<path class="cape" d="M40 84 Q-6 96 8 150 Q26 120 52 120 Z" fill="url(#gDhoti)" opacity="0.85"/>';
    if (o.tail !== false) inner += tail();
    inner += torso("url(#gSaffron)", "url(#gDhoti)", arms, "url(#gGold)");
    inner += face({ skin: "url(#gSkinHanu)", muzzle: "#f3b27e", tilak: true, tilakColor: "#fff7e6" });
    inner += '<path d="M44 36 Q60 6 76 36 Q68 26 60 26 Q52 26 44 36Z" fill="#7a3a18"/>';
    inner += crown();
    if (arms === "mace") inner += maceProp();
    if (o.flag) inner += flagProp();
    inner += name(o.label || "हनुमान · Hanuman");
    return svg(inner);
  }
  function ram(o) {
    o = o || {};
    let inner = torso("url(#gBlue)", "#3553a0", o.arms || "down", "url(#gGold)");
    inner += face({ skin: "url(#gBlue)", tilak: true, tilakColor: "#ffd34d" });
    inner += hairTop(C.dark) + crown();
    if (o.bow !== false) inner += bow("r");
    inner += name(o.label || "श्रीराम · Ram");
    return svg(inner);
  }
  function lakshman(o) {
    o = o || {};
    let inner = torso("url(#gGold)", "#c08a2c", o.arms || "down", "#fff");
    inner += face({ skin: "url(#gSkin)", tilak: true, tilakColor: "#c62828" });
    inner += hairTop(C.dark) + crown();
    if (o.bow !== false) inner += bow("l");
    inner += name(o.label || "लक्ष्मण · Lakshman");
    return svg(inner);
  }
  function sita(o) {
    o = o || {};
    let inner = torso("url(#gSaree)", "#0f6e49", "namaste", "url(#gGold)");
    inner += '<path d="M36 80 Q60 96 84 80 L80 110 Q60 100 40 110 Z" fill="#e23b6d" opacity="0.92"/>';
    inner += '<path d="M28 44 Q34 12 60 14 Q86 12 92 44 L92 90 Q86 60 60 58 Q34 60 28 90 Z" fill="' + C.dark + '"/>';
    inner += '<circle cx="60" cy="50" r="30" fill="url(#gSkin)"/>' + sheen();
    inner += '<circle cx="50" cy="50" r="3.2" fill="' + C.dark + '"/><circle cx="70" cy="50" r="3.2" fill="' + C.dark + '"/>';
    inner += '<path d="M52 60 Q60 66 68 60" stroke="#8a2f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    inner += '<circle cx="60" cy="40" r="3" fill="#c62828"/>';
    inner += name(o.label || "सीता · Sita");
    return svg(inner);
  }
  function sugriva(o) {
    o = o || {};
    let inner = tail() + torso("url(#gMonkey)", "#7c4a1d", o.arms || "namaste", "url(#gGold)");
    inner += face({ skin: "url(#gMonkey)", muzzle: "#caa24a" }) + crown();
    inner += name(o.label || "सुग्रीव · Sugriva");
    return svg(inner);
  }
  function vibhishan(o) {
    o = o || {};
    let inner = torso("url(#gGreen)", "#34592a", o.arms || "namaste", "url(#gGold)");
    inner += face({ skin: "#8aa07a" });
    inner += o.king ? crown() : hairTop("#22331c");
    inner += name(o.label || "विभीषण · Vibhishan");
    return svg(inner);
  }
  function demon(o) {
    o = o || {};
    let inner = torso("url(#gGreen)", "#222", o.arms || "jab", "#444");
    inner += face({ skin: "url(#gGreen)" });
    inner += '<path d="M40 34 L52 44 M80 34 L68 44" stroke="#1a2a14" stroke-width="3" stroke-linecap="round"/>';
    inner += '<path d="M53 64 L56 72 M67 64 L64 72" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
    inner += '<path d="M34 28 Q60 18 86 28" fill="none" stroke="#1a2a14" stroke-width="6"/>';
    inner += name(o.label || "असुर · Demon");
    return svg(inner);
  }
  function sage(o) {
    o = o || {};
    let inner = torso("url(#gRobe)", "#c96a18", "namaste", "#fff");
    inner += face({ skin: "#f0d4a8", tilak: true });
    inner += '<path d="M44 60 Q60 96 76 60 Q60 78 44 60Z" fill="#f0e6d2"/>';
    inner += '<ellipse cx="60" cy="22" rx="16" ry="10" fill="#f0e6d2"/>';
    inner += name(o.label || "");
    return svg(inner);
  }
  function devotee(o) {
    o = o || {};
    let inner = torso(o.grad || "url(#gGold)", "#9c7a2e", "namaste", "#fff");
    inner += face({ skin: "url(#gSkin)", tilak: true }) + hairTop(C.dark);
    inner += name(o.label || "");
    return svg(inner);
  }
  function shiva(o) {
    o = o || {};
    let inner = torso("#cfd8e8", "#9fb0c8", "namaste", "#7fe3ff");
    inner += '<path d="M36 80 Q60 96 84 80 L80 104 Q60 96 40 104 Z" fill="#e8a23a" opacity="0.85"/>';
    inner += face({ skin: "#cfe2f0", tilak: true, tilakColor: "#5aa0d0" });
    inner += '<ellipse cx="60" cy="22" rx="18" ry="12" fill="#cfd8e8"/>';
    inner += '<path d="M52 30 L60 14 L68 30" fill="none" stroke="#7fb8e0" stroke-width="2"/>';
    inner += '<circle cx="60" cy="40" r="2.4" fill="#5aa0d0"/>';
    inner += name(o.label || "शिव · गौरीश");
    return svg(inner);
  }

  // ---------- props ----------
  function sun() {
    let rays = "";
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 * Math.PI) / 180;
      rays += '<line x1="' + (60 + Math.cos(a) * 40).toFixed(1) + '" y1="' + (60 + Math.sin(a) * 40).toFixed(1) +
        '" x2="' + (60 + Math.cos(a) * 58).toFixed(1) + '" y2="' + (60 + Math.sin(a) * 58).toFixed(1) +
        '" stroke="#ffce4d" stroke-width="5" stroke-linecap="round"/>';
    }
    return svg('<g class="sun-rays" style="transform-origin:60px 60px">' + rays + "</g>" +
      '<circle cx="60" cy="60" r="36" fill="url(#gSun)" stroke="#ffae3b" stroke-width="2"/>' +
      '<circle cx="48" cy="56" r="3.6" fill="#9a5b10"/><circle cx="72" cy="56" r="3.6" fill="#9a5b10"/>' +
      '<path d="M48 70 Q60 80 72 70" stroke="#9a5b10" stroke-width="3" fill="none" stroke-linecap="round"/>', "0 0 120 120");
  }
  function mountain() {
    let herbs = "";
    [[44, 70], [60, 52], [76, 72], [54, 84], [70, 90]].forEach(function (p, i) {
      herbs += '<circle class="herb" cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="#aaff9c" style="animation-delay:' + (i * 0.25) + 's"/>';
    });
    return svg('<path d="M10 150 L46 40 L66 78 L84 30 L116 150 Z" fill="url(#gMtn)" stroke="#1f3d28" stroke-width="3"/>' +
      '<path d="M46 40 L40 60 L56 56 Z" fill="#dff0e2"/><path d="M84 30 L78 52 L92 50 Z" fill="#dff0e2"/>' +
      herbs + name("संजीवनी · Sanjeevani"), "0 0 126 156");
  }
  function lankaCity() {
    return svg('<rect x="14" y="80" width="22" height="70" fill="#caa24a"/><rect x="40" y="56" width="26" height="94" fill="#e0c06a"/>' +
      '<rect x="70" y="74" width="22" height="76" fill="#caa24a"/><rect x="96" y="92" width="18" height="58" fill="#b8924a"/>' +
      '<path d="M14 80 L25 64 L36 80 Z" fill="#9c7a2e"/><path d="M40 56 L53 36 L66 56 Z" fill="#9c7a2e"/><path d="M70 74 L81 58 L92 74 Z" fill="#9c7a2e"/>' +
      '<rect x="48" y="96" width="10" height="54" fill="#5a3a14"/>' + name("लंका · Lanka"), "0 0 128 156");
  }
  function heart(withTrio) {
    let trio = "";
    if (withTrio) trio = '<circle cx="48" cy="74" r="9" fill="url(#gGold)"/><circle cx="64" cy="70" r="11" fill="url(#gBlue)"/><circle cx="80" cy="76" r="9" fill="url(#gSaree)"/>';
    return svg('<path d="M64 128 C8 86 18 36 50 40 C60 41 64 52 64 52 C64 52 68 41 78 40 C110 36 120 86 64 128 Z" fill="url(#gHeart)" stroke="#d4264a" stroke-width="3"/>' +
      '<ellipse cx="44" cy="64" rx="10" ry="14" fill="#fff" opacity="0.18"/>' + trio, "0 0 128 150");
  }
  function chains() {
    return svg('<g class="chain-l"><rect x="6" y="60" width="40" height="14" rx="7" fill="none" stroke="url(#gMetal)" stroke-width="5"/>' +
      '<rect x="30" y="60" width="40" height="14" rx="7" fill="none" stroke="url(#gMetal)" stroke-width="5"/></g>' +
      '<g class="chain-r"><rect x="74" y="86" width="40" height="14" rx="7" fill="none" stroke="url(#gMetal)" stroke-width="5"/></g>', "0 0 120 150");
  }

  // ---------- environments (parallax background layers) ----------
  function E(parts) { return parts.join(""); }
  const moon = '<div class="moon"></div>';
  const stars = '<div class="stars"></div>';
  const cloudset = '<div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>';
  const hills = '<div class="hills"></div>';
  const treeline = '<div class="trees"></div>';

  function env(type) {
    switch (type) {
      case "day": return E(['<div class="sky sky-day"></div>', cloudset, hills]);
      case "dawn": return E(['<div class="sky sky-dawn"></div>', cloudset, hills]);
      case "night": return E(['<div class="sky sky-night"></div>', stars, moon, cloudset, hills]);
      case "cosmic": return E(['<div class="sky sky-cosmic"></div>', stars, '<div class="nebula"></div>']);
      case "sea": return E(['<div class="sky sky-dawn"></div>', cloudset, '<div class="sea"></div>', '<div class="wave wave-1"></div><div class="wave wave-2"></div><div class="wave wave-3"></div>']);
      case "fire": return E(['<div class="sky sky-night"></div>', '<div class="fireglow"></div>', '<div class="emberfield"></div>']);
      case "forest": return E(['<div class="sky sky-day"></div>', cloudset, treeline, hills]);
      case "storm": return E(['<div class="sky sky-storm"></div>', '<div class="rain"></div>', hills]);
      case "dungeon": return E(['<div class="sky sky-dungeon"></div>', '<div class="bars"></div>']);
      default: return E(['<div class="sky sky-temple"></div>', '<div class="rays-soft"></div>']);
    }
  }

  // light rays + dust shared atmosphere
  const ATMOS = '<div class="godrays"></div><div class="dust"></div>';

  // ---------- scene builders ----------
  const B = {
    section: function () { return [aura({ left: 50, bottom: 16, size: 280, cls: "aura aura-gold" }), place(hanuman({ arms: "namaste" }), { left: 50, bottom: 10, w: 150, anim: "anim-float" })]; },
    worship: function () { return [aura({ left: 64, bottom: 8, size: 240 }), place(hanuman({ arms: "mace" }), { left: 64, bottom: 10, w: 150, anim: "anim-bob" }), place(devotee({ label: "भक्त" }), { left: 26, bottom: 10, w: 92, anim: "anim-pray" })]; },
    jai: function () { return [aura({ left: 50, bottom: 6, size: 300, cls: "aura aura-gold" }), place(hanuman({ arms: "up", flag: true, label: "जय हनुमान" }), { left: 50, bottom: 10, w: 168, anim: "anim-cheer" }), '<div class="sparkles"></div>']; },
    messenger: function () { return [place(hanuman({ arms: "jab", cape: true, tail: true, label: "पवनसुत" }), { left: 50, bottom: 34, w: 150, anim: "anim-soar", z: 3 }), '<div class="trail"></div>']; },
    mace: function () { return [aura({ left: 50, bottom: 8, size: 250 }), place(hanuman({ arms: "mace", label: "बजरंगबली" }), { left: 50, bottom: 10, w: 168, anim: "anim-flex" })]; },
    adorned: function () { return [aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }), place(hanuman({ arms: "down", label: "कंचन वरन" }), { left: 50, bottom: 10, w: 160, anim: "anim-shimmer" }), '<div class="sparkles"></div>']; },
    "mace-flag": function () { return [aura({ left: 50, bottom: 8, size: 250 }), place(hanuman({ arms: "mace", flag: true, label: "बज्र · ध्वजा" }), { left: 50, bottom: 10, w: 170, anim: "anim-bob" })]; },
    divine: function () { return [aura({ left: 50, bottom: 6, size: 300, cls: "aura aura-blue" }), place(hanuman({ arms: "namaste", label: "केसरी नंदन" }), { left: 50, bottom: 10, w: 160, anim: "anim-float" }), '<div class="sparkles"></div>']; },
    "darshan-bow": function () { return [aura({ left: 38, bottom: 8, size: 220, cls: "aura aura-blue" }), place(ram(), { left: 38, bottom: 10, w: 132, anim: "anim-bob", dur: 5 }), place(hanuman({ arms: "namaste", label: "सेवक हनुमान" }), { left: 70, bottom: 10, w: 120, anim: "anim-bow", flip: true })]; },
    darshan: function () { return [aura({ left: 50, bottom: 8, size: 320, cls: "aura aura-blue" }), place(lakshman(), { left: 22, bottom: 10, w: 112, anim: "anim-bob", dur: 5.5 }), place(ram(), { left: 50, bottom: 10, w: 140, anim: "anim-bob", dur: 5, z: 3 }), place(sita(), { left: 78, bottom: 10, w: 112, anim: "anim-bob", dur: 6 }), place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 50, bottom: 4, w: 86, anim: "anim-pray", z: 4 })]; },
    "burn-lanka": function () { return [flamesRow(6, 9), place(lankaCity(), { left: 28, bottom: 10, w: 150, anim: "anim-shake-soft" }), place(hanuman({ arms: "mace", label: "विकट रूप" }), { left: 74, bottom: 10, w: 170, anim: "anim-grow-stay" })]; },
    slay: function () { return [aura({ left: 40, bottom: 8, size: 220 }), place(hanuman({ arms: "mace", label: "भीम रूप" }), { left: 40, bottom: 10, w: 168, anim: "anim-strike" }), place(demon(), { left: 76, bottom: 10, w: 110, anim: "anim-fall", flip: true, delay: 0.5 }), place(demon(), { left: 90, bottom: 10, w: 96, anim: "anim-fall", flip: true, delay: 1.1 })]; },
    sanjivani: function () {
      return [
        '<div class="trail trail-big"></div>',
        place(mountain(), { left: 54, bottom: 50, w: 150, anim: "anim-carry", z: 3 }),
        place(hanuman({ arms: "up", cape: true, label: "लाय सजीवन" }), { left: 50, bottom: 16, w: 156, anim: "anim-soar", z: 4 }),
        place(lakshman({ bow: false, label: "लक्ष्मण" }), { left: 84, bottom: 10, w: 96, anim: "anim-revive" }),
      ];
    },
    embrace: function () { return [aura({ left: 50, bottom: 8, size: 300, cls: "aura aura-blue" }), place(ram({ arms: "shield" }), { left: 42, bottom: 10, w: 140, anim: "anim-lean-r", z: 2 }), place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 62, bottom: 10, w: 128, anim: "anim-lean-l", flip: true, z: 3 }), '<div class="sparkles"></div>']; },
    sages: function () { return [aura({ left: 50, bottom: 8, size: 260, cls: "aura aura-gold" }), place(hanuman({ arms: "namaste" }), { left: 50, bottom: 10, w: 140, anim: "anim-float", z: 3 }), place(sage({ label: "नारद" }), { left: 20, bottom: 10, w: 92, anim: "anim-pray" }), place(sage({ label: "ब्रह्मादि" }), { left: 80, bottom: 10, w: 92, anim: "anim-pray", flip: true, delay: 0.4 })]; },
    devas: function () { return [aura({ left: 50, bottom: 8, size: 260, cls: "aura aura-gold" }), place(hanuman({ arms: "namaste" }), { left: 50, bottom: 10, w: 140, anim: "anim-float", z: 3 }), place(devotee({ grad: "url(#gBlue)", label: "देव" }), { left: 22, bottom: 10, w: 90, anim: "anim-pray" }), place(devotee({ grad: "url(#gGold)", label: "दिगपाल" }), { left: 80, bottom: 10, w: 90, anim: "anim-pray", flip: true, delay: 0.4 })]; },
    sugriva: function () { return [aura({ left: 30, bottom: 8, size: 200, cls: "aura aura-blue" }), place(ram(), { left: 26, bottom: 10, w: 124, anim: "anim-bob", dur: 5 }), place(hanuman({ arms: "shield" }), { left: 52, bottom: 10, w: 118, anim: "anim-bob" }), place(sugriva({ label: "सुग्रीव" }), { left: 78, bottom: 10, w: 110, anim: "anim-pray", flip: true })]; },
    vibhishan: function () { return [aura({ left: 60, bottom: 8, size: 240, cls: "aura aura-gold" }), place(vibhishan({ king: true, label: "लंकेश्वर विभीषण" }), { left: 60, bottom: 10, w: 150, anim: "anim-bob" }), place(hanuman({ arms: "namaste" }), { left: 28, bottom: 10, w: 108, anim: "anim-float" })]; },
    "swallow-sun": function () { return [place(sun(), { left: 74, bottom: 56, w: 130, anim: "anim-shrink", z: 1 }), place(hanuman({ arms: "up", cape: true, label: "बाल हनुमान" }), { left: 40, bottom: 12, w: 150, anim: "anim-leap", z: 3 })]; },
    "cross-ocean": function () { return ['<div class="trail"></div>', place(hanuman({ arms: "jab", cape: true, label: "जलधि लांघि" }), { left: 50, bottom: 46, w: 150, anim: "anim-soar", z: 3 })]; },
    giant: function () { return [aura({ left: 50, bottom: 8, size: 340, cls: "aura aura-gold" }), place(hanuman({ arms: "up", label: "विराट रूप" }), { left: 50, bottom: 10, w: 130, anim: "anim-giant", z: 3 }), place(devotee({ grad: "#8a8f96", label: "लोक" }), { left: 14, bottom: 10, w: 66, anim: "anim-tremble" }), place(devotee({ grad: "#8a8f96", label: "लोक" }), { left: 86, bottom: 10, w: 66, anim: "anim-tremble", delay: 0.2 })]; },
    guard: function () { return ['<div class="gate"></div>', aura({ left: 50, bottom: 8, size: 230 }), place(hanuman({ arms: "mace", label: "द्वारपाल हनुमान" }), { left: 50, bottom: 10, w: 160, anim: "anim-guard" })]; },
    shelter: function () { return ['<div class="umbrella"></div>', aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }), place(hanuman({ arms: "shield", label: "शरण हनुमान" }), { left: 38, bottom: 10, w: 150, anim: "anim-bob" }), place(devotee({ label: "भक्त" }), { left: 70, bottom: 10, w: 90, anim: "anim-pray", flip: true })]; },
    ghosts: function () { return [place(hanuman({ arms: "mace", label: "महाबीर" }), { left: 40, bottom: 10, w: 160, anim: "anim-flex", z: 3 }), place(demon({ label: "भूत" }), { left: 78, bottom: 14, w: 96, anim: "anim-flee", flip: true }), place(demon({ label: "पिसाच" }), { left: 92, bottom: 26, w: 80, anim: "anim-flee", flip: true, delay: 0.4 })]; },
    heal: function () { return [aura({ left: 60, bottom: 8, size: 260, cls: "aura aura-green" }), place(hanuman({ arms: "shield", label: "रोग हरे" }), { left: 60, bottom: 10, w: 150, anim: "anim-bob" }), place(devotee({ label: "रोगी → स्वस्थ" }), { left: 28, bottom: 10, w: 98, anim: "anim-revive" })]; },
    rescue: function () { return [aura({ left: 38, bottom: 8, size: 240 }), place(hanuman({ arms: "shield", label: "संकटमोचन" }), { left: 38, bottom: 10, w: 156, anim: "anim-bob" }), place(devotee({ label: "भक्त" }), { left: 72, bottom: 10, w: 94, anim: "anim-revive", flip: true })]; },
    "ram-king": function () { return ['<div class="throne"></div>', aura({ left: 44, bottom: 8, size: 240, cls: "aura aura-gold" }), place(ram({ label: "राजा राम" }), { left: 44, bottom: 14, w: 150, anim: "anim-bob", dur: 6, z: 3 }), place(hanuman({ arms: "namaste", label: "सेवक" }), { left: 74, bottom: 10, w: 108, anim: "anim-pray", flip: true })]; },
    blessing: function () { return [aura({ left: 40, bottom: 8, size: 260, cls: "aura aura-gold" }), place(hanuman({ arms: "shield", label: "वरदाता" }), { left: 40, bottom: 10, w: 156, anim: "anim-bless" }), place(devotee({ label: "मनोरथ पूर्ण" }), { left: 74, bottom: 10, w: 94, anim: "anim-pray", flip: true }), '<div class="sparkles"></div>']; },
    glory: function () { return [aura({ left: 50, bottom: 6, size: 340, cls: "aura aura-gold" }), place(hanuman({ arms: "up", flag: true, label: "चारों जुग परताप" }), { left: 50, bottom: 10, w: 168, anim: "anim-cheer" }), '<div class="sparkles"></div>']; },
    protect: function () { return [aura({ left: 40, bottom: 8, size: 240, cls: "aura aura-green" }), place(sage({ label: "संत" }), { left: 18, bottom: 10, w: 90, anim: "anim-pray" }), place(hanuman({ arms: "mace", label: "रखवारे" }), { left: 48, bottom: 10, w: 156, anim: "anim-strike", z: 3 }), place(demon(), { left: 84, bottom: 10, w: 100, anim: "anim-fall", flip: true, delay: 0.6 })]; },
    boon: function () { return [aura({ left: 36, bottom: 8, size: 240, cls: "aura aura-gold" }), place(sita({ label: "जानकी माता" }), { left: 34, bottom: 10, w: 138, anim: "anim-bless" }), place(hanuman({ arms: "namaste" }), { left: 68, bottom: 10, w: 118, anim: "anim-pray", flip: true }), '<div class="sparkles"></div>']; },
    seva: function () { return [aura({ left: 46, bottom: 8, size: 260, cls: "aura aura-blue" }), place(ram({ label: "रघुपति" }), { left: 44, bottom: 10, w: 146, anim: "anim-bob", dur: 6, z: 2 }), place(hanuman({ arms: "namaste", label: "दास हनुमान" }), { left: 72, bottom: 6, w: 100, anim: "anim-bow", flip: true, z: 3 })]; },
    devotion: function () { return [aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }), place(hanuman({ arms: "namaste", label: "राम भजन" }), { left: 50, bottom: 10, w: 150, anim: "anim-meditate" }), '<div class="japmala"></div>']; },
    abode: function () { return [aura({ left: 50, bottom: 40, size: 280, cls: "aura aura-gold" }), place(hanuman({ arms: "namaste", cape: true, label: "रघुबर पुर" }), { left: 50, bottom: 16, w: 138, anim: "anim-ascend" })]; },
    sole: function () { return [aura({ left: 50, bottom: 8, size: 300, cls: "aura aura-gold" }), place(hanuman({ arms: "shield", label: "सर्व सुख" }), { left: 50, bottom: 10, w: 168, anim: "anim-float" })]; },
    "free-chains": function () { return [aura({ left: 60, bottom: 8, size: 240 }), place(hanuman({ arms: "mace", label: "हनुमान" }), { left: 64, bottom: 10, w: 150, anim: "anim-strike" }), place(chains(), { left: 30, bottom: 20, w: 130, anim: "anim-break" }), place(devotee({ label: "बन्दी मुक्त" }), { left: 30, bottom: 10, w: 94, anim: "anim-revive", delay: 0.6 })]; },
    shiva: function () { return [aura({ left: 50, bottom: 8, size: 300, cls: "aura aura-blue" }), place(shiva({ label: "गौरीश शिव" }), { left: 50, bottom: 10, w: 150, anim: "anim-float" }), '<div class="sparkles"></div>']; },
    "in-heart": function () { return [aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }), place(heart(false), { left: 50, bottom: 30, w: 130, anim: "anim-heartbeat", z: 1 }), place(hanuman({ arms: "namaste", label: "हृदय में हनुमान" }), { left: 50, bottom: 6, w: 118, anim: "anim-float", z: 3 })]; },
    "final-darshan": function () { return [aura({ left: 50, bottom: 18, size: 320, cls: "aura aura-gold" }), place(heart(true), { left: 50, bottom: 18, w: 170, anim: "anim-heartbeat", z: 2 }), '<div class="sparkles"></div>']; },
  };

  function flamesRow(left, count) {
    let s = "";
    for (let i = 0; i < count; i++) s += '<div class="flame" style="left:' + (left + i * 8) + "%;animation-delay:" + (i * 0.16) + 's"></div>';
    return s;
  }

  // type -> environment
  const ENV = {
    section: "temple", worship: "temple", jai: "temple", messenger: "day", mace: "temple",
    adorned: "temple", "mace-flag": "dawn", divine: "cosmic", "darshan-bow": "forest", darshan: "forest",
    "burn-lanka": "fire", slay: "dawn", sanjivani: "night", embrace: "forest", sages: "temple",
    devas: "cosmic", sugriva: "forest", vibhishan: "temple", "swallow-sun": "day", "cross-ocean": "sea",
    giant: "cosmic", guard: "temple", shelter: "temple", ghosts: "night", heal: "temple",
    rescue: "storm", "ram-king": "temple", blessing: "temple", glory: "day", protect: "forest",
    boon: "temple", seva: "temple", devotion: "temple", abode: "cosmic", sole: "temple",
    "free-chains": "dungeon", shiva: "night", "in-heart": "temple", "final-darshan": "temple",
  };

  const INFO = {
    section: "॥ ध्यान · Invocation ॥",
    worship: "भक्त पवनपुत्र हनुमान का स्मरण करता है · A devotee invokes Hanuman",
    jai: "जय हनुमान — ज्ञान-गुण के सागर · Glory to Hanuman, ocean of wisdom",
    messenger: "राम दूत, पवनपुत्र वायुवेग से उड़ते हैं · Ram's messenger, son of the wind, in flight",
    mace: "महावीर बजरंगबली अपनी गदा के साथ · The mighty one with his mace",
    adorned: "कंचन वर्ण, सुन्दर वेष में सुशोभित · Golden-hued, radiantly adorned",
    "mace-flag": "हाथ में वज्र-गदा और ध्वजा · Mace in hand, banner aloft",
    divine: "शंकर के अंश, केसरी नंदन · Born of Shiva's grace, son of Kesari",
    "darshan-bow": "राम-कार्य हेतु आतुर, प्रभु को प्रणाम · Ever eager to serve, bowing to Ram",
    darshan: "राम, लखन, सीता हनुमान के मन में बसे · Ram, Lakshman & Sita dwell in his heart",
    "burn-lanka": "सूक्ष्म रूप से सीता को, विकट रूप से लंका दहन · Tiny before Sita, fierce — Lanka ablaze",
    slay: "भीम रूप धरकर असुरों का संहार · In dread form, slaying the demons",
    sanjivani: "संजीवनी पर्वत लाकर लक्ष्मण को जिलाया · Bearing the Sanjeevani, reviving Lakshman",
    embrace: "रघुपति ने हृदय से लगाया — प्रिय भाई समान · Ram embraces him as a dear brother",
    sages: "सनक, ब्रह्मा, नारद आदि मुनि गुण गाते हैं · Sages sing his praises",
    devas: "यम, कुबेर, दिगपाल सब यश गाते हैं · Gods and guardians extol him",
    sugriva: "सुग्रीव का उपकार — राम से मिलाया · Befriends Sugriva, unites him with Ram",
    vibhishan: "विभीषण को मंत्र — लंकेश्वर बने · His counsel makes Vibhishan king of Lanka",
    "swallow-sun": "युग सहस्र योजन पर सूर्य को फल समझ निगला · Leaps to swallow the distant sun as a fruit",
    "cross-ocean": "प्रभु की मुद्रिका लेकर सागर लांघा · Crosses the ocean bearing Ram's ring",
    giant: "विराट रूप — तीनों लोक कांप उठे · Grows immense; the three worlds tremble",
    guard: "राम के द्वार के रखवाले हनुमान · Guardian at Ram's gate",
    shelter: "तुम्हारी शरण में सब सुख — निर्भय · In his shelter, all comfort and no fear",
    ghosts: "नाम सुनते ही भूत-पिसाच भाग जाते हैं · Ghosts flee at his very name",
    heal: "रोग नाशे, सब पीड़ा हरे · Banishes disease and every pain",
    rescue: "संकट से हनुमान छुड़ावै · Hanuman frees the devotee from distress",
    "ram-king": "सब पर राम तपस्वी राजा — हनुमान सेवक · Ram the king; Hanuman his servant",
    blessing: "जो मनोरथ लावै, अमित फल पावै · Every wish is granted boundless fruit",
    glory: "चारों युग में परताप, जगत उजियारा · His glory shines through all the ages",
    protect: "साधु-संत के रक्षक, असुरों का नाश · Protector of saints, destroyer of demons",
    boon: "जानकी माता का वरदान — अष्ट सिद्धि नौ निधि · Mother Sita's boon of eight powers, nine treasures",
    seva: "सदा रघुपति के दास · Forever the servant at Ram's feet",
    devotion: "तुम्हारे भजन से राम की प्राप्ति · Through his worship one attains Ram",
    abode: "अंत काल रघुबर पुर को जाई · At life's end, one reaches Ram's abode",
    sole: "हनुमत सेइ सर्व सुख करई · Serving Hanuman alone brings all joy",
    "free-chains": "सौ बार पाठ से बन्दी मुक्त · A hundred recitations free the captive",
    shiva: "होय सिद्धि, साखी गौरीसा (शिव) · Success attained, with Shiva as witness",
    "in-heart": "तुलसीदास के हृदय में हनुमान का वास · Hanuman dwells in the devotee's heart",
    "final-darshan": "राम-लखन-सीता सहित हृदय में विराजें · Ram, Lakshman & Sita enthroned in the heart",
  };

  const MAP = [
    "section", "worship", "worship", "section",
    "jai", "messenger", "mace", "adorned", "mace-flag", "divine",
    "darshan-bow", "darshan", "burn-lanka", "slay", "sanjivani", "embrace",
    "embrace", "sages", "devas", "sugriva", "vibhishan", "swallow-sun",
    "cross-ocean", "giant", "guard", "shelter", "giant", "ghosts",
    "heal", "rescue", "ram-king", "blessing", "glory", "protect",
    "boon", "seva", "devotion", "abode", "sole", "rescue",
    "jai", "free-chains", "shiva", "in-heart",
    "section", "final-darshan",
  ];

  function typeFor(index) { return MAP[index] || "darshan"; }

  // ---------- Photoreal cinematic "film" for the opening Dohas ----------
  // verse index -> ordered list of shot images (one per recited line).
  // each shot: { src, pos } where pos is the object-position focal point so the
  // subject (feet / face) stays framed despite cover-crop + Ken Burns.
  const S1 = { src: "assets/film/shot1.png", pos: "center 70%", fx: "altar" };
  const S2 = { src: "assets/film/shot2.png", pos: "center 24%", fx: "rama" };
  const S3 = { src: "assets/film/shot3.png", pos: "center 52%", fx: "devotee" };
  const S4 = { src: "assets/film/shot4.png", pos: "center 20%", fx: "hanuman" };
  const FILM = {
    0: [S1],
    1: [S1, S2],
    2: [S3, S4],
  };

  // Fallback host for binary assets: raw.githack.com (the share-link CDN)
  // refuses large media, so if the same-origin path fails we load from raw GitHub.
  const RAW_BASE = "https://raw.githubusercontent.com/ajayagarwal22/hanumanchalisa/cursor/hanuman-chalisa-animation-4603/";

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function petals(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<span class="petal" style="left:' + rnd(4, 92).toFixed(1) + "%;animation-delay:" + (-rnd(0, 9)).toFixed(1) + "s;animation-duration:" + rnd(6, 12).toFixed(1) + 's"></span>';
    return s;
  }
  function embers(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<span class="ember2" style="left:' + rnd(34, 82).toFixed(1) + "%;bottom:" + rnd(8, 42).toFixed(1) + "%;animation-delay:" + (-rnd(0, 4)).toFixed(1) + "s;animation-duration:" + rnd(2.4, 5).toFixed(1) + 's"></span>';
    return s;
  }
  function beams(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<span class="beam" style="--a:' + rnd(-42, -8).toFixed(0) + "deg;top:" + rnd(33, 47).toFixed(0) + "%;left:" + rnd(46, 58).toFixed(0) + "%;animation-delay:" + (-rnd(0, 2)).toFixed(1) + 's"></span>';
    return s;
  }
  // animated overlay so the photoreal frame visibly moves (cinemagraph)
  function fx(kind) {
    const shaft = '<div class="shaft"></div>';
    const smoke = '<div class="plume p1"></div><div class="plume p2"></div><div class="plume p3"></div>';
    if (kind === "altar") return '<div class="fx">' + shaft + smoke + '<div class="flamehot f1"></div><div class="flamehot f2"></div><div class="flamehot f3"></div></div>';
    if (kind === "rama") return '<div class="fx">' + shaft + petals(12) + '<div class="bloom"></div></div>';
    if (kind === "devotee") return '<div class="fx">' + shaft + smoke + '<div class="flamehot f2"></div></div>';
    if (kind === "hanuman") return '<div class="fx">' + shaft + '<div class="aurapulse"></div>' + embers(12) + beams(6) + "</div>";
    return '<div class="fx">' + shaft + "</div>";
  }

  function buildFilm(index) {
    const shots = FILM[index];
    let layers = "";
    shots.forEach(function (s, i) {
      const fallback = RAW_BASE + s.src;
      layers +=
        '<div class="film-layer kb' + (i % 2) + (i === 0 ? " active" : "") + '" data-shot="' + i + '">' +
        '<img class="film-shot" alt="" style="object-position:' + s.pos + '"' +
        ' onerror="this.onerror=null;this.src=\'' + fallback + '\'" src="' + s.src + '">' +
        fx(s.fx) +
        "</div>";
    });
    return (
      '<div class="scene scene-film">' +
      '<div class="film-frame">' + layers + "</div>" +
      '<div class="godrays"></div><div class="dust"></div>' +
      '<div class="film-vignette"></div>' +
      '<div class="letterbox lb-top"></div><div class="letterbox lb-bottom"></div>' +
      "</div>"
    );
  }

  function buildHTML(index) {
    if (FILM[index]) return buildFilm(index);
    const type = typeFor(index);
    const builder = B[type] || B.darshan;
    let parts;
    try { parts = builder(); } catch (e) { parts = B.darshan(); }
    return DEFS +
      '<div class="scene scene-' + type + '">' +
      '<div class="env">' + env(ENV[type] || "temple") + "</div>" +
      ATMOS +
      parts.join("") +
      '<div class="ground"></div></div>';
  }

  function descFor(index) { return INFO[typeFor(index)] || ""; }

  function render(stage, descEl, index) {
    if (!stage) return;
    stage.innerHTML = buildHTML(index);
    if (descEl) descEl.textContent = descFor(index);
  }

  window.Scenes = { buildHTML: buildHTML, descFor: descFor, render: render, typeFor: typeFor, MAP: MAP, FILM: FILM };
})();
