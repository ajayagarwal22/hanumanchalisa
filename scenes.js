// ===========================================================================
// scenes.js — Animated figures that act out each verse of the Hanuman Chalisa.
//
// Stylized "storybook" SVG characters (Hanuman, Ram, Sita, Lakshman, demons,
// the Sun, the ocean, the Sanjeevani mountain, Lanka in flames, sages, devas…)
// are composed into a scene per verse and animated with CSS. The scene for the
// current verse is rendered by Scenes.render(stage, descEl, index); changing
// verse re-creates the markup so the animations replay in sync with playback.
//
// window.Scenes = { buildHTML(index) -> string, render(stage, desc, index) }
// ===========================================================================
(function () {
  "use strict";

  // ---------- palette ----------
  const C = {
    hanu: "#e8703a", hanuDark: "#b8501f", hanuMuzzle: "#f3b27e",
    saffron: "#ff8a1f", saffronDeep: "#d2410a", dhoti: "#c62828", dhoti2: "#9c1f1f",
    ram: "#5b7fd6", ramDark: "#3f5db0",
    lakshman: "#e6b25a", lakDark: "#c08a2c",
    sitaSkin: "#f3c79a", saree: "#1f9d6b", sareeEdge: "#0f6e49", sitaShawl: "#e23b6d",
    skin: "#f3c79a", monkey: "#a9682f", monkeyDark: "#7c4a1d",
    demon: "#5a7d4a", demonDark: "#3a5230", demonSkin2: "#6b6b6b",
    gold: "#ffd34d", goldDark: "#e0a800",
    sage: "#f0e6d2", robe: "#f08a2c",
    white: "#fff7ea", dark: "#2a1a10",
  };

  // ---------- low-level helpers ----------
  function svg(inner, vb) {
    return '<svg class="char-svg" viewBox="' + (vb || "0 0 120 178") + '">' + inner + "</svg>";
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
    // Positioning lives on .char (translateX(-50%) centering); the looping
    // animation lives on .char-inner so the two transforms never collide.
    return (
      '<div class="char ' + flip + '" style="' + outer + '">' +
      '<div class="char-inner ' + anim + '" style="' + inS + '">' + inner + "</div>" +
      "</div>"
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
    return label
      ? '<text class="char-name" x="60" y="174" text-anchor="middle">' + label + "</text>"
      : "";
  }

  // ---------- shared sub-parts ----------
  function face(o) {
    o = o || {};
    const skin = o.skin || C.skin;
    const cy = 52;
    let s = '<circle cx="36" cy="' + cy + '" r="6" fill="' + skin + '"/>'; // ears
    s += '<circle cx="84" cy="' + cy + '" r="6" fill="' + skin + '"/>';
    s += '<circle cx="60" cy="' + cy + '" r="30" fill="' + skin + '"/>';
    if (o.muzzle) s += '<ellipse cx="60" cy="62" rx="16" ry="13" fill="' + o.muzzle + '"/>';
    // eyes
    s += '<circle cx="50" cy="50" r="3.4" fill="' + C.dark + '"/><circle cx="70" cy="50" r="3.4" fill="' + C.dark + '"/>';
    // smile
    s += '<path d="M52 ' + (o.muzzle ? 64 : 60) + " Q60 " + (o.muzzle ? 70 : 67) + " 68 " + (o.muzzle ? 64 : 60) + '" stroke="#8a2f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    // tilak
    if (o.tilak) s += '<path d="M60 30 L56 44 L64 44 Z" fill="' + (o.tilakColor || "#c62828") + '"/>';
    return s;
  }
  function crown(color) {
    color = color || C.gold;
    return (
      '<path d="M38 30 L46 10 L60 26 L74 10 L82 30 Z" fill="' + color + '" stroke="' + C.goldDark + '" stroke-width="2"/>' +
      '<circle cx="60" cy="14" r="4" fill="#ff5a5a"/>'
    );
  }
  function hair(color) {
    return '<path d="M30 44 Q34 16 60 16 Q86 16 90 44 Q78 30 60 30 Q42 30 30 44Z" fill="' + (color || C.dark) + '"/>';
  }
  function bow(side) {
    // a bow held to one side
    const x = side === "r" ? 92 : 18;
    return (
      '<path d="M' + x + " 30 Q" + (side === "r" ? x + 16 : x - 16) + " 78 " + x + ' 126" fill="none" stroke="#6b3f12" stroke-width="4"/>' +
      '<line x1="' + x + '" y1="30" x2="' + x + '" y2="126" stroke="#caa24a" stroke-width="1.6"/>'
    );
  }

  // ---------- characters ----------
  // arms: 'down' | 'namaste' | 'mace' | 'up' | 'shield' | 'jab'
  function torso(garment, garment2, arms, accent) {
    let s = "";
    // legs / dhoti
    s += '<rect x="40" y="118" width="40" height="46" rx="10" fill="' + (garment2 || garment) + '"/>';
    s += '<rect x="40" y="112" width="40" height="14" rx="7" fill="' + (accent || C.gold) + '"/>';
    // body
    s += '<rect x="36" y="78" width="48" height="44" rx="20" fill="' + garment + '"/>';
    // arms
    const sk = C.skin;
    if (arms === "namaste") {
      s += '<rect x="44" y="86" width="14" height="34" rx="7" fill="' + garment + '" transform="rotate(18 51 100)"/>';
      s += '<rect x="62" y="86" width="14" height="34" rx="7" fill="' + garment + '" transform="rotate(-18 69 100)"/>';
      s += '<circle cx="60" cy="92" r="8" fill="' + sk + '"/>';
    } else if (arms === "up") {
      s += '<rect x="26" y="46" width="13" height="44" rx="6" fill="' + garment + '" transform="rotate(24 32 68)"/>';
      s += '<rect x="81" y="46" width="13" height="44" rx="6" fill="' + garment + '" transform="rotate(-24 88 68)"/>';
      s += '<circle cx="30" cy="48" r="7" fill="' + sk + '"/><circle cx="90" cy="48" r="7" fill="' + sk + '"/>';
    } else if (arms === "shield") {
      s += '<rect x="80" y="74" width="34" height="13" rx="6" fill="' + garment + '"/>';
      s += '<circle cx="116" cy="80" r="8" fill="' + sk + '"/>';
      s += '<rect x="22" y="86" width="13" height="40" rx="6" fill="' + garment + '"/>';
    } else if (arms === "mace") {
      s += '<rect x="78" y="56" width="13" height="42" rx="6" fill="' + garment + '" transform="rotate(-18 84 78)"/>';
      s += '<rect x="26" y="86" width="13" height="40" rx="6" fill="' + garment + '"/><circle cx="32" cy="124" r="7" fill="' + sk + '"/>';
    } else if (arms === "jab") {
      s += '<rect x="80" y="80" width="36" height="13" rx="6" fill="' + garment + '"/><circle cx="116" cy="86" r="8" fill="' + sk + '"/>';
      s += '<rect x="26" y="86" width="13" height="40" rx="6" fill="' + garment + '"/>';
    } else {
      // down
      s += '<rect x="24" y="86" width="13" height="42" rx="6" fill="' + garment + '"/><circle cx="30" cy="126" r="7" fill="' + sk + '"/>';
      s += '<rect x="83" y="86" width="13" height="42" rx="6" fill="' + garment + '"/><circle cx="90" cy="126" r="7" fill="' + sk + '"/>';
    }
    return s;
  }

  function maceProp() {
    return (
      '<g transform="rotate(-18 84 70)">' +
      '<rect x="81" y="40" width="7" height="64" rx="3.5" fill="#caa24a" stroke="#9c7a2e" stroke-width="1.5"/>' +
      '<circle cx="84.5" cy="34" r="15" fill="#e6c15a" stroke="#b08a2e" stroke-width="2.5"/>' +
      '<circle cx="84.5" cy="34" r="6" fill="#b08a2e"/>' +
      "</g>"
    );
  }
  function flagProp() {
    return (
      '<line x1="20" y1="20" x2="20" y2="120" stroke="#7a4a17" stroke-width="4"/>' +
      '<path d="M20 24 L52 32 L20 44 Z" fill="' + C.saffron + '" stroke="' + C.saffronDeep + '" stroke-width="1.5"/>'
    );
  }
  function tail() {
    return '<path d="M40 130 C6 128 4 56 36 70" fill="none" stroke="' + C.hanu + '" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M40 130 C6 128 4 56 36 70" fill="none" stroke="' + C.hanuDark + '" stroke-width="13" stroke-linecap="round" opacity="0.25"/>';
  }

  function hanuman(o) {
    o = o || {};
    const arms = o.arms || "mace";
    let inner = "";
    if (o.tail !== false) inner += tail();
    inner += torso(C.saffron, C.dhoti, arms, C.gold);
    inner += face({ skin: C.hanu, muzzle: C.hanuMuzzle, tilak: true, tilakColor: "#fff" });
    inner += '<path d="M44 36 Q60 6 76 36 Q68 26 60 26 Q52 26 44 36Z" fill="#7a3a18"/>'; // brow hair
    inner += crown(C.gold);
    if (arms === "mace") inner += maceProp();
    if (o.flag) inner += flagProp();
    inner += name(o.label || "हनुमान · Hanuman");
    return svg(inner);
  }

  function ram(o) {
    o = o || {};
    let inner = torso(C.ram, "#3553a0", o.arms || "down", C.gold);
    inner += face({ skin: C.ram, tilak: true, tilakColor: "#ffd34d" });
    inner += hair(C.dark);
    inner += crown(C.gold);
    if (o.bow !== false) inner += bow("r");
    inner += name(o.label || "श्रीराम · Ram");
    return svg(inner);
  }
  function lakshman(o) {
    o = o || {};
    let inner = torso(C.lakshman, C.lakDark, o.arms || "down", "#fff");
    inner += face({ skin: "#f0c98a", tilak: true, tilakColor: "#c62828" });
    inner += hair(C.dark);
    inner += crown("#e8c45a");
    if (o.bow !== false) inner += bow("l");
    inner += name(o.label || "लक्ष्मण · Lakshman");
    return svg(inner);
  }
  function sita(o) {
    o = o || {};
    let inner = "";
    inner += '<path d="M26 70 Q22 30 60 28 Q98 30 94 70 L94 150 L26 150 Z" fill="' + C.dark + '" opacity="0.0"/>';
    inner += torso(C.saree, C.sareeEdge, "namaste", "#ffd34d");
    // shawl over shoulder
    inner += '<path d="M36 80 Q60 96 84 80 L80 110 Q60 100 40 110 Z" fill="' + C.sitaShawl + '" opacity="0.9"/>';
    inner += face({ skin: C.sitaSkin });
    inner += '<circle cx="60" cy="40" r="3" fill="#c62828"/>'; // bindi
    inner += '<path d="M28 44 Q34 14 60 16 Q86 14 92 44 L92 86 Q86 60 60 58 Q34 60 28 86 Z" fill="' + C.dark + '"/>'; // long hair
    inner += '<circle cx="60" cy="50" r="30" fill="' + C.sitaSkin + '"/>';
    inner += '<circle cx="50" cy="50" r="3.2" fill="' + C.dark + '"/><circle cx="70" cy="50" r="3.2" fill="' + C.dark + '"/>';
    inner += '<path d="M52 60 Q60 66 68 60" stroke="#8a2f12" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    inner += '<circle cx="60" cy="40" r="3" fill="#c62828"/>';
    inner += name(o.label || "सीता · Sita");
    return svg(inner);
  }

  function sugriva(o) {
    o = o || {};
    let inner = tail();
    inner += torso(C.monkey, C.monkeyDark, o.arms || "namaste", "#caa24a");
    inner += face({ skin: C.monkey, muzzle: "#caa24a" });
    inner += crown("#caa24a");
    inner += name(o.label || "सुग्रीव · Sugriva");
    return svg(inner);
  }
  function vibhishan(o) {
    o = o || {};
    let inner = torso(C.demon, C.demonDark, o.arms || "namaste", "#caa24a");
    inner += face({ skin: "#8aa07a" });
    if (o.king) inner += crown(C.gold);
    else inner += hair("#22331c");
    inner += name(o.label || "विभीषण · Vibhishan");
    return svg(inner);
  }
  function demon(o) {
    o = o || {};
    let inner = torso(C.demonDark, "#222", o.arms || "jab", "#444");
    inner += face({ skin: C.demon });
    // fangs + angry brow
    inner += '<path d="M40 34 L52 44 M80 34 L68 44" stroke="#222" stroke-width="3" stroke-linecap="round"/>';
    inner += '<path d="M53 64 L56 72 M67 64 L64 72" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
    inner += '<path d="M34 28 Q60 18 86 28" fill="none" stroke="#1a2a14" stroke-width="6"/>';
    inner += name(o.label || "असुर · Demon");
    return svg(inner);
  }
  function ravana(o) {
    o = o || {};
    let inner = torso("#3a2030", "#241320", o.arms || "down", "#7a2b4a");
    // side heads
    for (let i = 0; i < 4; i++) {
      const lx = 18 + i * 6, rx = 102 - i * 6, ty = 30 - i * 2;
      inner += '<circle cx="' + lx + '" cy="' + ty + '" r="8" fill="' + C.demon + '"/>';
      inner += '<circle cx="' + rx + '" cy="' + ty + '" r="8" fill="' + C.demon + '"/>';
    }
    inner += face({ skin: C.demon });
    inner += '<path d="M40 30 L46 12 L60 26 L74 12 L80 30 Z" fill="#7a2b4a" stroke="#4a1a2e" stroke-width="2"/>';
    inner += '<path d="M44 66 Q60 60 76 66" fill="none" stroke="#1a0f14" stroke-width="3"/>'; // moustache
    inner += name(o.label || "रावण · Ravana");
    return svg(inner);
  }
  function sage(o) {
    o = o || {};
    let inner = torso(C.robe, "#c96a18", "namaste", "#fff");
    inner += face({ skin: "#f0d4a8", tilak: true });
    inner += '<path d="M44 60 Q60 96 76 60 Q60 78 44 60Z" fill="' + C.sage + '"/>'; // beard
    inner += '<ellipse cx="60" cy="22" rx="16" ry="10" fill="' + C.sage + '"/>'; // top knot/white hair
    inner += name(o.label || "");
    return svg(inner);
  }
  function devotee(o) {
    o = o || {};
    let inner = torso(o.color || "#caa24a", "#9c7a2e", "namaste", "#fff");
    inner += face({ skin: "#f0c98a", tilak: true });
    inner += hair(C.dark);
    inner += name(o.label || "");
    return svg(inner);
  }

  // ---------- props (CSS-friendly) ----------
  function sun(o) {
    o = o || {};
    let rays = "";
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 * Math.PI) / 180;
      const x1 = 60 + Math.cos(a) * 40, y1 = 60 + Math.sin(a) * 40;
      const x2 = 60 + Math.cos(a) * 56, y2 = 60 + Math.sin(a) * 56;
      rays += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#ffcf4d" stroke-width="5" stroke-linecap="round"/>';
    }
    const inner =
      '<g class="sun-rays" style="transform-origin:60px 60px">' + rays + "</g>" +
      '<circle cx="60" cy="60" r="36" fill="#ffd24a" stroke="#ffae3b" stroke-width="3"/>' +
      '<circle cx="48" cy="56" r="3.6" fill="#9a5b10"/><circle cx="72" cy="56" r="3.6" fill="#9a5b10"/>' +
      '<path d="M48 70 Q60 80 72 70" stroke="#9a5b10" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return svg(inner, "0 0 120 120");
  }
  function mountain(o) {
    o = o || {};
    let herbs = "";
    const pts = [[44, 70], [60, 52], [76, 72], [54, 84], [70, 90]];
    pts.forEach(function (p, i) {
      herbs += '<circle class="herb" cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="#9cff8a" style="animation-delay:' + (i * 0.25) + 's"/>';
    });
    const inner =
      '<path d="M10 150 L46 40 L66 78 L84 30 L116 150 Z" fill="#3f7d4f" stroke="#2c5c39" stroke-width="3"/>' +
      '<path d="M46 40 L40 60 L56 56 Z" fill="#cfe9d2"/>' +
      '<path d="M84 30 L78 52 L92 50 Z" fill="#cfe9d2"/>' +
      herbs +
      name(o.label || "संजीवनी · Sanjeevani");
    return svg(inner, "0 0 126 156");
  }
  function lankaCity(o) {
    o = o || {};
    const inner =
      '<rect x="14" y="80" width="22" height="70" fill="#caa24a"/>' +
      '<rect x="40" y="56" width="26" height="94" fill="#e0c06a"/>' +
      '<rect x="70" y="74" width="22" height="76" fill="#caa24a"/>' +
      '<rect x="96" y="92" width="18" height="58" fill="#b8924a"/>' +
      '<path d="M14 80 L25 64 L36 80 Z" fill="#9c7a2e"/>' +
      '<path d="M40 56 L53 36 L66 56 Z" fill="#9c7a2e"/>' +
      '<path d="M70 74 L81 58 L92 74 Z" fill="#9c7a2e"/>' +
      name(o.label || "लंका · Lanka");
    return svg(inner, "0 0 128 156");
  }
  function heart(withTrio) {
    let trio = "";
    if (withTrio) {
      trio =
        '<circle cx="48" cy="74" r="9" fill="' + C.lakshman + '"/>' +
        '<circle cx="64" cy="70" r="11" fill="' + C.ram + '"/>' +
        '<circle cx="80" cy="76" r="9" fill="' + C.saree + '"/>';
    }
    const inner =
      '<path d="M64 128 C8 86 18 36 50 40 C60 41 64 52 64 52 C64 52 68 41 78 40 C110 36 120 86 64 128 Z" fill="#ff5d7a" stroke="#d83a5a" stroke-width="3"/>' +
      trio;
    return svg(inner, "0 0 128 150");
  }
  function flames(left, count) {
    let s = "";
    for (let i = 0; i < (count || 5); i++) {
      const l = left + i * 7;
      s += '<div class="flame" style="left:' + l + "%;animation-delay:" + (i * 0.18) + 's"></div>';
    }
    return s;
  }
  function chains() {
    const inner =
      '<g class="chain-l"><rect x="6" y="60" width="40" height="14" rx="7" fill="none" stroke="#9aa0a6" stroke-width="5"/>' +
      '<rect x="30" y="60" width="40" height="14" rx="7" fill="none" stroke="#cfd4d8" stroke-width="5"/></g>' +
      '<g class="chain-r"><rect x="74" y="86" width="40" height="14" rx="7" fill="none" stroke="#cfd4d8" stroke-width="5"/></g>';
    return svg(inner, "0 0 120 150");
  }

  // ---------- scene builders ----------
  // Each builder returns an array of HTML fragments (chars / auras / props).
  const B = {
    section: function () {
      return [aura({ left: 50, bottom: 18, size: 260, cls: "aura aura-gold" }),
        place(hanuman({ arms: "namaste", label: "हनुमान · Hanuman" }), { left: 50, bottom: 8, w: 150, anim: "anim-float" })];
    },
    worship: function () {
      return [
        aura({ left: 62, bottom: 8, size: 240 }),
        place(hanuman({ arms: "mace", label: "हनुमान · Hanuman" }), { left: 64, bottom: 8, w: 150, anim: "anim-bob" }),
        place(devotee({ label: "भक्त · Devotee" }), { left: 26, bottom: 8, w: 96, anim: "anim-pray" }),
      ];
    },
    jai: function () {
      return [
        aura({ left: 50, bottom: 6, size: 300, cls: "aura aura-gold" }),
        place(hanuman({ arms: "up", flag: true, label: "जय हनुमान" }), { left: 50, bottom: 8, w: 168, anim: "anim-cheer" }),
        '<div class="sparkles"></div>',
      ];
    },
    messenger: function () {
      return [
        '<div class="wind"></div>',
        aura({ left: 50, bottom: 30, size: 240 }),
        place(hanuman({ arms: "jab", tail: true, label: "पवनसुत · Pavan-sut" }), { left: 48, bottom: 30, w: 150, anim: "anim-fly" }),
      ];
    },
    mace: function () {
      return [
        aura({ left: 50, bottom: 8, size: 250 }),
        place(hanuman({ arms: "mace", label: "बजरंगबली" }), { left: 50, bottom: 8, w: 168, anim: "anim-flex" }),
      ];
    },
    adorned: function () {
      return [
        aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }),
        place(hanuman({ arms: "down", label: "कंचन वरन" }), { left: 50, bottom: 8, w: 160, anim: "anim-shimmer" }),
        '<div class="sparkles"></div>',
      ];
    },
    "mace-flag": function () {
      return [
        aura({ left: 50, bottom: 8, size: 250 }),
        place(hanuman({ arms: "mace", flag: true, label: "बज्र · ध्वजा" }), { left: 50, bottom: 8, w: 170, anim: "anim-bob" }),
      ];
    },
    divine: function () {
      return [
        aura({ left: 50, bottom: 6, size: 300, cls: "aura aura-blue" }),
        place(hanuman({ arms: "namaste", label: "केसरी नंदन" }), { left: 50, bottom: 8, w: 160, anim: "anim-float" }),
        '<div class="sparkles"></div>',
      ];
    },
    "darshan-bow": function () {
      return [
        aura({ left: 38, bottom: 8, size: 220, cls: "aura aura-blue" }),
        place(ram({ label: "श्रीराम" }), { left: 38, bottom: 8, w: 132, anim: "anim-bob", dur: 5 }),
        place(hanuman({ arms: "namaste", label: "सेवक हनुमान" }), { left: 70, bottom: 8, w: 120, anim: "anim-bow", flip: true }),
      ];
    },
    darshan: function () {
      return [
        aura({ left: 50, bottom: 8, size: 320, cls: "aura aura-blue" }),
        place(lakshman({ label: "लक्ष्मण" }), { left: 24, bottom: 8, w: 112, anim: "anim-bob", dur: 5.5 }),
        place(ram({ label: "श्रीराम" }), { left: 50, bottom: 8, w: 138, anim: "anim-bob", dur: 5, z: 3 }),
        place(sita({ label: "सीता" }), { left: 76, bottom: 8, w: 112, anim: "anim-bob", dur: 6 }),
        place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 50, bottom: 4, w: 86, anim: "anim-pray", z: 4 }),
      ];
    },
    "burn-lanka": function () {
      return [
        '<div class="scene-fire"></div>',
        flames(8, 9),
        place(lankaCity(), { left: 30, bottom: 8, w: 150, anim: "anim-shake-soft" }),
        place(hanuman({ arms: "mace", label: "विकट रूप" }), { left: 74, bottom: 8, w: 168, anim: "anim-grow-stay" }),
      ];
    },
    slay: function () {
      return [
        aura({ left: 40, bottom: 8, size: 220 }),
        place(hanuman({ arms: "mace", label: "भीम रूप" }), { left: 40, bottom: 8, w: 168, anim: "anim-strike" }),
        place(demon({ label: "असुर" }), { left: 76, bottom: 8, w: 110, anim: "anim-fall", flip: true, delay: 0.5 }),
        place(demon({ label: "असुर" }), { left: 90, bottom: 8, w: 96, anim: "anim-fall", flip: true, delay: 1.1 }),
      ];
    },
    sanjivani: function () {
      return [
        aura({ left: 50, bottom: 40, size: 240 }),
        place(mountain(), { left: 50, bottom: 52, w: 150, anim: "anim-hover" }),
        place(hanuman({ arms: "up", label: "लाय सजीवन" }), { left: 50, bottom: 8, w: 150, anim: "anim-bob" }),
        place(lakshman({ bow: false, label: "लक्ष्मण" }), { left: 82, bottom: 8, w: 100, anim: "anim-revive" }),
      ];
    },
    embrace: function () {
      return [
        aura({ left: 50, bottom: 8, size: 300, cls: "aura aura-blue" }),
        place(ram({ arms: "shield", label: "श्रीराम" }), { left: 42, bottom: 8, w: 140, anim: "anim-lean-r", z: 2 }),
        place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 62, bottom: 8, w: 128, anim: "anim-lean-l", flip: true, z: 3 }),
        '<div class="sparkles"></div>',
      ];
    },
    sages: function () {
      return [
        aura({ left: 50, bottom: 8, size: 260, cls: "aura aura-gold" }),
        place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 50, bottom: 8, w: 140, anim: "anim-float", z: 3 }),
        place(sage({ label: "नारद" }), { left: 20, bottom: 8, w: 96, anim: "anim-pray" }),
        place(sage({ label: "ब्रह्मादि" }), { left: 80, bottom: 8, w: 96, anim: "anim-pray", flip: true, delay: 0.4 }),
      ];
    },
    devas: function () {
      return [
        aura({ left: 50, bottom: 8, size: 260, cls: "aura aura-gold" }),
        place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 50, bottom: 8, w: 140, anim: "anim-float", z: 3 }),
        place(devotee({ color: C.ram, label: "देव" }), { left: 22, bottom: 8, w: 92, anim: "anim-pray" }),
        place(devotee({ color: C.lakshman, label: "दिगपाल" }), { left: 80, bottom: 8, w: 92, anim: "anim-pray", flip: true, delay: 0.4 }),
      ];
    },
    sugriva: function () {
      return [
        aura({ left: 30, bottom: 8, size: 200, cls: "aura aura-blue" }),
        place(ram({ label: "श्रीराम" }), { left: 26, bottom: 8, w: 124, anim: "anim-bob", dur: 5 }),
        place(hanuman({ arms: "shield", label: "हनुमान" }), { left: 52, bottom: 8, w: 120, anim: "anim-bob" }),
        place(sugriva({ label: "सुग्रीव" }), { left: 78, bottom: 8, w: 112, anim: "anim-pray", flip: true }),
      ];
    },
    vibhishan: function () {
      return [
        aura({ left: 60, bottom: 8, size: 240, cls: "aura aura-gold" }),
        place(vibhishan({ king: true, label: "लंकेश्वर विभीषण" }), { left: 60, bottom: 8, w: 150, anim: "anim-bob" }),
        place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 28, bottom: 8, w: 110, anim: "anim-float" }),
      ];
    },
    "swallow-sun": function () {
      return [
        '<div class="scene-sky-day"></div>',
        place(sun({}), { left: 72, bottom: 58, w: 130, anim: "anim-shrink", z: 1 }),
        place(hanuman({ arms: "up", label: "बाल हनुमान" }), { left: 42, bottom: 10, w: 150, anim: "anim-leap", z: 3 }),
      ];
    },
    "cross-ocean": function () {
      return [
        '<div class="scene-ocean"></div>',
        '<div class="wave wave-1"></div><div class="wave wave-2"></div>',
        place(hanuman({ arms: "jab", flag: false, label: "जलधि लांघि" }), { left: 50, bottom: 44, w: 150, anim: "anim-fly-arc", z: 3 }),
      ];
    },
    giant: function () {
      return [
        aura({ left: 50, bottom: 8, size: 340, cls: "aura aura-gold" }),
        place(hanuman({ arms: "up", label: "विराट रूप" }), { left: 50, bottom: 8, w: 130, anim: "anim-giant", z: 3 }),
        place(devotee({ color: "#8a8f96", label: "लोक" }), { left: 16, bottom: 8, w: 70, anim: "anim-tremble" }),
        place(devotee({ color: "#8a8f96", label: "लोक" }), { left: 84, bottom: 8, w: 70, anim: "anim-tremble", delay: 0.2 }),
      ];
    },
    guard: function () {
      return [
        '<div class="gate"></div>',
        aura({ left: 50, bottom: 8, size: 230 }),
        place(hanuman({ arms: "mace", label: "द्वारपाल हनुमान" }), { left: 50, bottom: 8, w: 160, anim: "anim-guard" }),
      ];
    },
    shelter: function () {
      return [
        '<div class="umbrella"></div>',
        aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }),
        place(hanuman({ arms: "shield", label: "शरण हनुमान" }), { left: 38, bottom: 8, w: 150, anim: "anim-bob" }),
        place(devotee({ label: "भक्त" }), { left: 70, bottom: 8, w: 92, anim: "anim-pray", flip: true }),
      ];
    },
    ghosts: function () {
      return [
        '<div class="scene-night"></div>',
        place(hanuman({ arms: "mace", label: "महाबीर" }), { left: 40, bottom: 8, w: 160, anim: "anim-flex", z: 3 }),
        place(demon({ label: "भूत" }), { left: 78, bottom: 12, w: 96, anim: "anim-flee", flip: true }),
        place(demon({ label: "पिसाच" }), { left: 92, bottom: 24, w: 80, anim: "anim-flee", flip: true, delay: 0.4 }),
      ];
    },
    heal: function () {
      return [
        aura({ left: 60, bottom: 8, size: 260, cls: "aura aura-green" }),
        place(hanuman({ arms: "shield", label: "रोग हरे" }), { left: 60, bottom: 8, w: 150, anim: "anim-bob" }),
        place(devotee({ label: "रोगी → स्वस्थ" }), { left: 28, bottom: 8, w: 100, anim: "anim-revive" }),
      ];
    },
    rescue: function () {
      return [
        '<div class="scene-storm"></div>',
        aura({ left: 38, bottom: 8, size: 240 }),
        place(hanuman({ arms: "shield", label: "संकटमोचन" }), { left: 38, bottom: 8, w: 156, anim: "anim-bob" }),
        place(devotee({ label: "भक्त" }), { left: 72, bottom: 8, w: 96, anim: "anim-revive", flip: true }),
      ];
    },
    "ram-king": function () {
      return [
        '<div class="throne"></div>',
        aura({ left: 44, bottom: 8, size: 240, cls: "aura aura-gold" }),
        place(ram({ arms: "down", label: "राजा राम" }), { left: 44, bottom: 12, w: 150, anim: "anim-bob", dur: 6, z: 3 }),
        place(hanuman({ arms: "namaste", label: "सेवक" }), { left: 74, bottom: 8, w: 110, anim: "anim-pray", flip: true }),
      ];
    },
    blessing: function () {
      return [
        aura({ left: 40, bottom: 8, size: 260, cls: "aura aura-gold" }),
        place(hanuman({ arms: "shield", label: "वरदाता" }), { left: 40, bottom: 8, w: 156, anim: "anim-bless" }),
        place(devotee({ label: "मनोरथ पूर्ण" }), { left: 74, bottom: 8, w: 96, anim: "anim-pray", flip: true }),
        '<div class="sparkles"></div>',
      ];
    },
    glory: function () {
      return [
        '<div class="scene-sky-day"></div>',
        aura({ left: 50, bottom: 6, size: 340, cls: "aura aura-gold" }),
        place(hanuman({ arms: "up", flag: true, label: "चारों जुग परताप" }), { left: 50, bottom: 8, w: 168, anim: "anim-cheer" }),
        '<div class="sparkles"></div>',
      ];
    },
    protect: function () {
      return [
        aura({ left: 40, bottom: 8, size: 240, cls: "aura aura-green" }),
        place(sage({ label: "संत" }), { left: 18, bottom: 8, w: 92, anim: "anim-pray" }),
        place(hanuman({ arms: "mace", label: "रखवारे" }), { left: 48, bottom: 8, w: 156, anim: "anim-strike", z: 3 }),
        place(demon({ label: "असुर" }), { left: 84, bottom: 8, w: 100, anim: "anim-fall", flip: true, delay: 0.6 }),
      ];
    },
    boon: function () {
      return [
        aura({ left: 36, bottom: 8, size: 240, cls: "aura aura-gold" }),
        place(sita({ label: "जानकी माता" }), { left: 34, bottom: 8, w: 138, anim: "anim-bless" }),
        place(hanuman({ arms: "namaste", label: "हनुमान" }), { left: 68, bottom: 8, w: 120, anim: "anim-pray", flip: true }),
        '<div class="sparkles"></div>',
      ];
    },
    seva: function () {
      return [
        aura({ left: 46, bottom: 8, size: 260, cls: "aura aura-blue" }),
        place(ram({ label: "रघुपति" }), { left: 44, bottom: 8, w: 146, anim: "anim-bob", dur: 6, z: 2 }),
        place(hanuman({ arms: "namaste", label: "दास हनुमान" }), { left: 72, bottom: 6, w: 100, anim: "anim-bow", flip: true, z: 3 }),
      ];
    },
    devotion: function () {
      return [
        aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }),
        place(hanuman({ arms: "namaste", label: "राम भजन" }), { left: 50, bottom: 8, w: 150, anim: "anim-meditate" }),
        '<div class="japmala"></div>',
      ];
    },
    abode: function () {
      return [
        '<div class="scene-sky-stars"></div>',
        aura({ left: 50, bottom: 40, size: 280, cls: "aura aura-gold" }),
        place(hanuman({ arms: "namaste", label: "रघुबर पुर" }), { left: 50, bottom: 12, w: 140, anim: "anim-ascend" }),
      ];
    },
    sole: function () {
      return [
        aura({ left: 50, bottom: 8, size: 300, cls: "aura aura-gold" }),
        place(hanuman({ arms: "shield", label: "सर्व सुख" }), { left: 50, bottom: 8, w: 168, anim: "anim-float" }),
      ];
    },
    "free-chains": function () {
      return [
        aura({ left: 60, bottom: 8, size: 240 }),
        place(hanuman({ arms: "mace", label: "हनुमान" }), { left: 64, bottom: 8, w: 150, anim: "anim-strike" }),
        place(chains(), { left: 30, bottom: 18, w: 130, anim: "anim-break" }),
        place(devotee({ label: "बन्दी मुक्त" }), { left: 30, bottom: 8, w: 96, anim: "anim-revive", delay: 0.6 }),
      ];
    },
    shiva: function () {
      return [
        '<div class="scene-night"></div>',
        aura({ left: 50, bottom: 8, size: 300, cls: "aura aura-blue" }),
        place(devotee({ color: "#cfd8e8", label: "गौरीश शिव" }), { left: 50, bottom: 8, w: 150, anim: "anim-float" }),
        '<div class="sparkles"></div>',
      ];
    },
    "in-heart": function () {
      return [
        aura({ left: 50, bottom: 8, size: 280, cls: "aura aura-gold" }),
        place(heart(false), { left: 50, bottom: 30, w: 130, anim: "anim-heartbeat", z: 1 }),
        place(hanuman({ arms: "namaste", label: "हृदय में हनुमान" }), { left: 50, bottom: 6, w: 120, anim: "anim-float", z: 3 }),
      ];
    },
    "final-darshan": function () {
      return [
        aura({ left: 50, bottom: 18, size: 320, cls: "aura aura-gold" }),
        place(heart(true), { left: 50, bottom: 18, w: 170, anim: "anim-heartbeat", z: 2 }),
        '<div class="sparkles"></div>',
      ];
    },
  };

  // type -> short bilingual description shown under the scene
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

  // verse index (0..45) -> scene type
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

  function typeFor(index) {
    return MAP[index] || "darshan";
  }

  function buildHTML(index) {
    const type = typeFor(index);
    const builder = B[type] || B.darshan;
    let parts;
    try {
      parts = builder();
    } catch (e) {
      parts = B.darshan();
    }
    return '<div class="scene scene-' + type + '">' + parts.join("") + '<div class="ground"></div></div>';
  }

  function descFor(index) {
    return INFO[typeFor(index)] || "";
  }

  function render(stage, descEl, index) {
    if (!stage) return;
    stage.innerHTML = buildHTML(index);
    if (descEl) descEl.textContent = descFor(index);
  }

  window.Scenes = { buildHTML: buildHTML, descFor: descFor, render: render, typeFor: typeFor, MAP: MAP };
})();
