var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x5) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x5, {
  get: (a4, b7) => (typeof require !== "undefined" ? require : a4)[b7]
}) : x5)(function(x5) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x5 + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// esm:https://esm.sh/*tailwindcss@3.4.19/plugin?target=esnext&lp=node_modules%252Ftailwindcss
var plugin_target_esnext_lp_node_modules_252Ftailwindcss_exports = {};
__export(plugin_target_esnext_lp_node_modules_252Ftailwindcss_exports, {
  default: () => A
});

// esm:https://esm.sh/*tailwindcss@3.4.19/esnext/plugin.mjs?lp=node_modules%252Ftailwindcss
var g = Object.create;
var _ = Object.defineProperty;
var m = Object.getOwnPropertyDescriptor;
var O = Object.getOwnPropertyNames;
var y = Object.getPrototypeOf;
var M = Object.prototype.hasOwnProperty;
var i = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var b = (e, t, u5, r3) => {
  if (t && typeof t == "object" || typeof t == "function") for (let n3 of O(t)) !M.call(e, n3) && n3 !== u5 && _(e, n3, { get: () => t[n3], enumerable: !(r3 = m(t, n3)) || r3.enumerable });
  return e;
};
var h = (e, t, u5) => (u5 = e != null ? g(y(e)) : {}, b(t || !e || !e.__esModule ? _(u5, "default", { value: e, enumerable: true }) : u5, e));
var d = i((l3) => {
  "use strict";
  Object.defineProperty(l3, "__esModule", { value: true });
  Object.defineProperty(l3, "default", { enumerable: true, get: function() {
    return j5;
  } });
  function a4(e, t) {
    return { handler: e, config: t };
  }
  a4.withOptions = function(e, t = () => ({})) {
    let u5 = function(r3) {
      return { __options: r3, handler: e(r3), config: t(r3) };
    };
    return u5.__isOptionsFunction = true, u5.__pluginFunction = e, u5.__configFunction = t, u5;
  };
  var j5 = a4;
});
var s = i((o7) => {
  "use strict";
  Object.defineProperty(o7, "__esModule", { value: true });
  Object.defineProperty(o7, "default", { enumerable: true, get: function() {
    return x5;
  } });
  var q5 = v6(d());
  function v6(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var x5 = q5.default;
});
var P = i((z5, p4) => {
  var c5 = s();
  p4.exports = (c5.__esModule ? c5 : { default: c5 }).default;
});
var f = h(P());
var A = f.default ?? f;

// esm:https://esm.sh/*tailwindcss-animate@1.0.7/esnext/tailwindcss-animate.mjs?lp=node_modules%252Ftailwindcss-animate
var require2 = (n3) => {
  const e = (m6) => typeof m6.default < "u" ? m6.default : m6, c5 = (m6) => Object.assign({ __esModule: true }, m6);
  switch (n3) {
    case "tailwindcss/plugin":
      return e(plugin_target_esnext_lp_node_modules_252Ftailwindcss_exports);
    default:
      console.error('module "' + n3 + '" not found');
      return null;
  }
};
var u = Object.create;
var o = Object.defineProperty;
var w = Object.getOwnPropertyDescriptor;
var x = Object.getOwnPropertyNames;
var c = Object.getPrototypeOf;
var y2 = Object.prototype.hasOwnProperty;
var d2 = ((a4) => typeof require2 < "u" ? require2 : typeof Proxy < "u" ? new Proxy(a4, { get: (n3, e) => (typeof require2 < "u" ? require2 : n3)[e] }) : a4)(function(a4) {
  if (typeof require2 < "u") return require2.apply(this, arguments);
  throw Error('Dynamic require of "' + a4 + '" is not supported');
});
var f2 = (a4, n3) => () => (n3 || a4((n3 = { exports: {} }).exports, n3), n3.exports);
var v = (a4, n3, e, t) => {
  if (n3 && typeof n3 == "object" || typeof n3 == "function") for (let i4 of x(n3)) !y2.call(a4, i4) && i4 !== e && o(a4, i4, { get: () => n3[i4], enumerable: !(t = w(n3, i4)) || t.enumerable });
  return a4;
};
var p = (a4, n3, e) => (e = a4 != null ? u(c(a4)) : {}, v(n3 || !a4 || !a4.__esModule ? o(e, "default", { value: a4, enumerable: true }) : e, a4));
var m2 = f2((T7, s7) => {
  var D7 = d2("tailwindcss/plugin");
  function l3(a4) {
    return Object.fromEntries(Object.entries(a4).filter(([n3]) => n3 !== "DEFAULT"));
  }
  s7.exports = D7(({ addUtilities: a4, matchUtilities: n3, theme: e }) => {
    a4({ "@keyframes enter": e("keyframes.enter"), "@keyframes exit": e("keyframes.exit"), ".animate-in": { animationName: "enter", animationDuration: e("animationDuration.DEFAULT"), "--tw-enter-opacity": "initial", "--tw-enter-scale": "initial", "--tw-enter-rotate": "initial", "--tw-enter-translate-x": "initial", "--tw-enter-translate-y": "initial" }, ".animate-out": { animationName: "exit", animationDuration: e("animationDuration.DEFAULT"), "--tw-exit-opacity": "initial", "--tw-exit-scale": "initial", "--tw-exit-rotate": "initial", "--tw-exit-translate-x": "initial", "--tw-exit-translate-y": "initial" } }), n3({ "fade-in": (t) => ({ "--tw-enter-opacity": t }), "fade-out": (t) => ({ "--tw-exit-opacity": t }) }, { values: e("animationOpacity") }), n3({ "zoom-in": (t) => ({ "--tw-enter-scale": t }), "zoom-out": (t) => ({ "--tw-exit-scale": t }) }, { values: e("animationScale") }), n3({ "spin-in": (t) => ({ "--tw-enter-rotate": t }), "spin-out": (t) => ({ "--tw-exit-rotate": t }) }, { values: e("animationRotate") }), n3({ "slide-in-from-top": (t) => ({ "--tw-enter-translate-y": `-${t}` }), "slide-in-from-bottom": (t) => ({ "--tw-enter-translate-y": t }), "slide-in-from-left": (t) => ({ "--tw-enter-translate-x": `-${t}` }), "slide-in-from-right": (t) => ({ "--tw-enter-translate-x": t }), "slide-out-to-top": (t) => ({ "--tw-exit-translate-y": `-${t}` }), "slide-out-to-bottom": (t) => ({ "--tw-exit-translate-y": t }), "slide-out-to-left": (t) => ({ "--tw-exit-translate-x": `-${t}` }), "slide-out-to-right": (t) => ({ "--tw-exit-translate-x": t }) }, { values: e("animationTranslate") }), n3({ duration: (t) => ({ animationDuration: t }) }, { values: l3(e("animationDuration")) }), n3({ delay: (t) => ({ animationDelay: t }) }, { values: e("animationDelay") }), n3({ ease: (t) => ({ animationTimingFunction: t }) }, { values: l3(e("animationTimingFunction")) }), a4({ ".running": { animationPlayState: "running" }, ".paused": { animationPlayState: "paused" } }), n3({ "fill-mode": (t) => ({ animationFillMode: t }) }, { values: e("animationFillMode") }), n3({ direction: (t) => ({ animationDirection: t }) }, { values: e("animationDirection") }), n3({ repeat: (t) => ({ animationIterationCount: t }) }, { values: e("animationRepeat") });
  }, { theme: { extend: { animationDelay: ({ theme: a4 }) => ({ ...a4("transitionDelay") }), animationDuration: ({ theme: a4 }) => ({ 0: "0ms", ...a4("transitionDuration") }), animationTimingFunction: ({ theme: a4 }) => ({ ...a4("transitionTimingFunction") }), animationFillMode: { none: "none", forwards: "forwards", backwards: "backwards", both: "both" }, animationDirection: { normal: "normal", reverse: "reverse", alternate: "alternate", "alternate-reverse": "alternate-reverse" }, animationOpacity: ({ theme: a4 }) => ({ DEFAULT: 0, ...a4("opacity") }), animationTranslate: ({ theme: a4 }) => ({ DEFAULT: "100%", ...a4("translate") }), animationScale: ({ theme: a4 }) => ({ DEFAULT: 0, ...a4("scale") }), animationRotate: ({ theme: a4 }) => ({ DEFAULT: "30deg", ...a4("rotate") }), animationRepeat: { 0: "0", 1: "1", infinite: "infinite" }, keyframes: { enter: { from: { opacity: "var(--tw-enter-opacity, 1)", transform: "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))" } }, exit: { to: { opacity: "var(--tw-exit-opacity, 1)", transform: "translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))" } } } } } });
});
var r = p(m2());
var g2 = r.default ?? r;

// esm:https://esm.sh/*postcss-selector-parser@6.0.10?target=esnext&lp=node_modules%252Fpostcss-selector-parser
var postcss_selector_parser_6_0_exports = {};
__export(postcss_selector_parser_6_0_exports, {
  ATTRIBUTE: () => $a,
  CLASS: () => Ka,
  COMBINATOR: () => Ha,
  COMMENT: () => Va,
  ID: () => Ga,
  NESTING: () => Ya,
  PSEUDO: () => Ba,
  ROOT: () => Qa,
  SELECTOR: () => Wa,
  STRING: () => Ua,
  TAG: () => Ca,
  UNIVERSAL: () => za,
  attribute: () => Ja,
  className: () => Xa,
  combinator: () => Za,
  comment: () => ja,
  default: () => Pu,
  id: () => eu,
  isAttribute: () => pu,
  isClassName: () => du,
  isCombinator: () => vu,
  isComment: () => _u,
  isContainer: () => lu,
  isIdentifier: () => Su,
  isNamespace: () => hu,
  isNesting: () => gu,
  isNode: () => ou,
  isPseudo: () => Tu,
  isPseudoClass: () => fu,
  isPseudoElement: () => cu,
  isRoot: () => Ou,
  isSelector: () => yu,
  isString: () => Eu,
  isTag: () => mu,
  isUniversal: () => wu,
  nesting: () => tu,
  pseudo: () => ru,
  root: () => nu,
  selector: () => iu,
  string: () => su,
  tag: () => au,
  universal: () => uu
});

// esm:https://esm.sh/*cssesc@3.0.0?target=esnext&lp=node_modules%252Fcssesc
var cssesc_3_0_exports = {};
__export(cssesc_3_0_exports, {
  default: () => M2,
  options: () => K,
  version: () => L
});

// esm:https://esm.sh/*cssesc@3.0.0/esnext/cssesc.mjs?lp=node_modules%252Fcssesc
var S = Object.create;
var C = Object.defineProperty;
var o2 = Object.getOwnPropertyDescriptor;
var b2 = Object.getOwnPropertyNames;
var j = Object.getPrototypeOf;
var y3 = Object.prototype.hasOwnProperty;
var D = (s7, e) => () => (e || s7((e = { exports: {} }).exports, e), e.exports);
var I = (s7, e, r3, f6) => {
  if (e && typeof e == "object" || typeof e == "function") for (let t of b2(e)) !y3.call(s7, t) && t !== r3 && C(s7, t, { get: () => e[t], enumerable: !(f6 = o2(e, t)) || f6.enumerable });
  return s7;
};
var U = (s7, e, r3) => (r3 = s7 != null ? S(j(s7)) : {}, I(e || !s7 || !s7.__esModule ? C(r3, "default", { value: s7, enumerable: true }) : r3, s7));
var m3 = D((J5, E6) => {
  "use strict";
  var d6 = {}, h7 = d6.hasOwnProperty, B3 = function(e, r3) {
    if (!e) return r3;
    var f6 = {};
    for (var t in r3) f6[t] = h7.call(e, t) ? e[t] : r3[t];
    return f6;
  }, O7 = /[ -,\.\/:-@\[-\^`\{-~]/, z5 = /[ -,\.\/:-@\[\]\^`\{-~]/, G5 = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, u5 = function s7(e, r3) {
    r3 = B3(r3, s7.options), r3.quotes != "single" && r3.quotes != "double" && (r3.quotes = "single");
    for (var f6 = r3.quotes == "double" ? '"' : "'", t = r3.isIdentifier, p4 = e.charAt(0), l3 = "", x5 = 0, F4 = e.length; x5 < F4; ) {
      var i4 = e.charAt(x5++), v6 = i4.charCodeAt(), n3 = void 0;
      if (v6 < 32 || v6 > 126) {
        if (v6 >= 55296 && v6 <= 56319 && x5 < F4) {
          var A7 = e.charCodeAt(x5++);
          (A7 & 64512) == 56320 ? v6 = ((v6 & 1023) << 10) + (A7 & 1023) + 65536 : x5--;
        }
        n3 = "\\" + v6.toString(16).toUpperCase() + " ";
      } else r3.escapeEverything ? O7.test(i4) ? n3 = "\\" + i4 : n3 = "\\" + v6.toString(16).toUpperCase() + " " : /[\t\n\f\r\x0B]/.test(i4) ? n3 = "\\" + v6.toString(16).toUpperCase() + " " : i4 == "\\" || !t && (i4 == '"' && f6 == i4 || i4 == "'" && f6 == i4) || t && z5.test(i4) ? n3 = "\\" + i4 : n3 = i4;
      l3 += n3;
    }
    return t && (/^-[-\d]/.test(l3) ? l3 = "\\-" + l3.slice(1) : /\d/.test(p4) && (l3 = "\\3" + p4 + " " + l3.slice(1))), l3 = l3.replace(G5, function(q5, g6, w7) {
      return g6 && g6.length % 2 ? q5 : (g6 || "") + w7;
    }), !t && r3.wrap ? f6 + l3 + f6 : l3;
  };
  u5.options = { escapeEverything: false, isIdentifier: false, quotes: "single", wrap: false };
  u5.version = "3.0.0";
  E6.exports = u5;
});
var a = U(m3());
var { options: K, version: L } = a;
var M2 = a.default ?? a;

// esm:https://esm.sh/*util-deprecate@1.0.2?target=esnext&lp=node_modules%252Futil-deprecate
var util_deprecate_1_0_exports = {};
__export(util_deprecate_1_0_exports, {
  default: () => b3
});

// esm:https://esm.sh/*util-deprecate@1.0.2/esnext/util-deprecate.mjs?lp=node_modules%252Futil-deprecate
var u2 = Object.create;
var c2 = Object.defineProperty;
var s2 = Object.getOwnPropertyDescriptor;
var p2 = Object.getOwnPropertyNames;
var d3 = Object.getPrototypeOf;
var w2 = Object.prototype.hasOwnProperty;
var g3 = (r3, e) => () => (e || r3((e = { exports: {} }).exports, e), e.exports);
var h2 = (r3, e, t, o7) => {
  if (e && typeof e == "object" || typeof e == "function") for (let a4 of p2(e)) !w2.call(r3, a4) && a4 !== t && c2(r3, a4, { get: () => e[a4], enumerable: !(o7 = s2(e, a4)) || o7.enumerable });
  return r3;
};
var m4 = (r3, e, t) => (t = r3 != null ? u2(d3(r3)) : {}, h2(e || !r3 || !r3.__esModule ? c2(t, "default", { value: r3, enumerable: true }) : t, r3));
var i2 = g3((S6, f6) => {
  f6.exports = v6;
  function v6(r3, e) {
    if (n3("noDeprecation")) return r3;
    var t = false;
    function o7() {
      if (!t) {
        if (n3("throwDeprecation")) throw new Error(e);
        n3("traceDeprecation") ? console.trace(e) : console.warn(e), t = true;
      }
      return r3.apply(this, arguments);
    }
    return o7;
  }
  function n3(r3) {
    try {
      if (!globalThis.localStorage) return false;
    } catch {
      return false;
    }
    var e = globalThis.localStorage[r3];
    return e == null ? false : String(e).toLowerCase() === "true";
  }
});
var l = m4(i2());
var b3 = l.default ?? l;

// esm:https://esm.sh/*postcss-selector-parser@6.0.10/esnext/postcss-selector-parser.mjs?lp=node_modules%252Fpostcss-selector-parser
var require3 = (n3) => {
  const e = (m6) => typeof m6.default < "u" ? m6.default : m6, c5 = (m6) => Object.assign({ __esModule: true }, m6);
  switch (n3) {
    case "cssesc":
      return e(cssesc_3_0_exports);
    case "util-deprecate":
      return e(util_deprecate_1_0_exports);
    default:
      console.error('module "' + n3 + '" not found');
      return null;
  }
};
var Mr = Object.create;
var mt = Object.defineProperty;
var Nr = Object.getOwnPropertyDescriptor;
var Rr = Object.getOwnPropertyNames;
var Fr = Object.getPrototypeOf;
var Cr = Object.prototype.hasOwnProperty;
var ge = ((e) => typeof require3 < "u" ? require3 : typeof Proxy < "u" ? new Proxy(e, { get: (n3, i4) => (typeof require3 < "u" ? require3 : n3)[i4] }) : e)(function(e) {
  if (typeof require3 < "u") return require3.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var T = (e, n3) => () => (n3 || e((n3 = { exports: {} }).exports, n3), n3.exports);
var Ur = (e, n3, i4, t) => {
  if (n3 && typeof n3 == "object" || typeof n3 == "function") for (let r3 of Rr(n3)) !Cr.call(e, r3) && r3 !== i4 && mt(e, r3, { get: () => n3[r3], enumerable: !(t = Nr(n3, r3)) || t.enumerable });
  return e;
};
var Wr = (e, n3, i4) => (i4 = e != null ? Mr(Fr(e)) : {}, Ur(n3 || !e || !e.__esModule ? mt(i4, "default", { value: e, enumerable: true }) : i4, e));
var be = T((Te2, wt2) => {
  "use strict";
  Te2.__esModule = true;
  Te2.default = Yr;
  function Qr(e) {
    for (var n3 = e.toLowerCase(), i4 = "", t = false, r3 = 0; r3 < 6 && n3[r3] !== void 0; r3++) {
      var s7 = n3.charCodeAt(r3), a4 = s7 >= 97 && s7 <= 102 || s7 >= 48 && s7 <= 57;
      if (t = s7 === 32, !a4) break;
      i4 += n3[r3];
    }
    if (i4.length !== 0) {
      var u5 = parseInt(i4, 16), h7 = u5 >= 55296 && u5 <= 57343;
      return h7 || u5 === 0 || u5 > 1114111 ? ["\uFFFD", i4.length + (t ? 1 : 0)] : [String.fromCodePoint(u5), i4.length + (t ? 1 : 0)];
    }
  }
  var Br = /\\/;
  function Yr(e) {
    var n3 = Br.test(e);
    if (!n3) return e;
    for (var i4 = "", t = 0; t < e.length; t++) {
      if (e[t] === "\\") {
        var r3 = Qr(e.slice(t + 1, t + 7));
        if (r3 !== void 0) {
          i4 += r3[0], t += r3[1];
          continue;
        }
        if (e[t + 1] === "\\") {
          i4 += "\\", t++;
          continue;
        }
        e.length === t + 1 && (i4 += e[t]);
        continue;
      }
      i4 += e[t];
    }
    return i4;
  }
  wt2.exports = Te2.default;
});
var kt = T((Oe3, Pt2) => {
  "use strict";
  Oe3.__esModule = true;
  Oe3.default = Gr;
  function Gr(e) {
    for (var n3 = arguments.length, i4 = new Array(n3 > 1 ? n3 - 1 : 0), t = 1; t < n3; t++) i4[t - 1] = arguments[t];
    for (; i4.length > 0; ) {
      var r3 = i4.shift();
      if (!e[r3]) return;
      e = e[r3];
    }
    return e;
  }
  Pt2.exports = Oe3.default;
});
var qt = T((ye3, It) => {
  "use strict";
  ye3.__esModule = true;
  ye3.default = Vr;
  function Vr(e) {
    for (var n3 = arguments.length, i4 = new Array(n3 > 1 ? n3 - 1 : 0), t = 1; t < n3; t++) i4[t - 1] = arguments[t];
    for (; i4.length > 0; ) {
      var r3 = i4.shift();
      e[r3] || (e[r3] = {}), e = e[r3];
    }
  }
  It.exports = ye3.default;
});
var Dt = T((Ee3, Lt2) => {
  "use strict";
  Ee3.__esModule = true;
  Ee3.default = Hr;
  function Hr(e) {
    for (var n3 = "", i4 = e.indexOf("/*"), t = 0; i4 >= 0; ) {
      n3 = n3 + e.slice(t, i4);
      var r3 = e.indexOf("*/", i4 + 2);
      if (r3 < 0) return n3;
      t = r3 + 2, i4 = e.indexOf("/*", t);
    }
    return n3 = n3 + e.slice(t), n3;
  }
  Lt2.exports = Ee3.default;
});
var J = T((U4) => {
  "use strict";
  U4.__esModule = true;
  U4.stripComments = U4.ensureObject = U4.getProp = U4.unesc = void 0;
  var Kr = me3(be());
  U4.unesc = Kr.default;
  var $r = me3(kt());
  U4.getProp = $r.default;
  var zr = me3(qt());
  U4.ensureObject = zr.default;
  var Jr = me3(Dt());
  U4.stripComments = Jr.default;
  function me3(e) {
    return e && e.__esModule ? e : { default: e };
  }
});
var W = T((X4, xt2) => {
  "use strict";
  X4.__esModule = true;
  X4.default = void 0;
  var bt2 = J();
  function At(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function Xr(e, n3, i4) {
    return n3 && At(e.prototype, n3), i4 && At(e, i4), e;
  }
  var Zr = function e(n3, i4) {
    if (typeof n3 != "object" || n3 === null) return n3;
    var t = new n3.constructor();
    for (var r3 in n3) if (n3.hasOwnProperty(r3)) {
      var s7 = n3[r3], a4 = typeof s7;
      r3 === "parent" && a4 === "object" ? i4 && (t[r3] = i4) : s7 instanceof Array ? t[r3] = s7.map(function(u5) {
        return e(u5, t);
      }) : t[r3] = e(s7, t);
    }
    return t;
  }, jr = function() {
    function e(i4) {
      i4 === void 0 && (i4 = {}), Object.assign(this, i4), this.spaces = this.spaces || {}, this.spaces.before = this.spaces.before || "", this.spaces.after = this.spaces.after || "";
    }
    var n3 = e.prototype;
    return n3.remove = function() {
      return this.parent && this.parent.removeChild(this), this.parent = void 0, this;
    }, n3.replaceWith = function() {
      if (this.parent) {
        for (var t in arguments) this.parent.insertBefore(this, arguments[t]);
        this.remove();
      }
      return this;
    }, n3.next = function() {
      return this.parent.at(this.parent.index(this) + 1);
    }, n3.prev = function() {
      return this.parent.at(this.parent.index(this) - 1);
    }, n3.clone = function(t) {
      t === void 0 && (t = {});
      var r3 = Zr(this);
      for (var s7 in t) r3[s7] = t[s7];
      return r3;
    }, n3.appendToPropertyAndEscape = function(t, r3, s7) {
      this.raws || (this.raws = {});
      var a4 = this[t], u5 = this.raws[t];
      this[t] = a4 + r3, u5 || s7 !== r3 ? this.raws[t] = (u5 || a4) + s7 : delete this.raws[t];
    }, n3.setPropertyAndEscape = function(t, r3, s7) {
      this.raws || (this.raws = {}), this[t] = r3, this.raws[t] = s7;
    }, n3.setPropertyWithoutEscape = function(t, r3) {
      this[t] = r3, this.raws && delete this.raws[t];
    }, n3.isAtPosition = function(t, r3) {
      if (this.source && this.source.start && this.source.end) return !(this.source.start.line > t || this.source.end.line < t || this.source.start.line === t && this.source.start.column > r3 || this.source.end.line === t && this.source.end.column < r3);
    }, n3.stringifyProperty = function(t) {
      return this.raws && this.raws[t] || this[t];
    }, n3.valueToString = function() {
      return String(this.stringifyProperty("value"));
    }, n3.toString = function() {
      return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
    }, Xr(e, [{ key: "rawSpaceBefore", get: function() {
      var t = this.raws && this.raws.spaces && this.raws.spaces.before;
      return t === void 0 && (t = this.spaces && this.spaces.before), t || "";
    }, set: function(t) {
      (0, bt2.ensureObject)(this, "raws", "spaces"), this.raws.spaces.before = t;
    } }, { key: "rawSpaceAfter", get: function() {
      var t = this.raws && this.raws.spaces && this.raws.spaces.after;
      return t === void 0 && (t = this.spaces.after), t || "";
    }, set: function(t) {
      (0, bt2.ensureObject)(this, "raws", "spaces"), this.raws.spaces.after = t;
    } }]), e;
  }();
  X4.default = jr;
  xt2.exports = X4.default;
});
var D2 = T((m6) => {
  "use strict";
  m6.__esModule = true;
  m6.UNIVERSAL = m6.ATTRIBUTE = m6.CLASS = m6.COMBINATOR = m6.COMMENT = m6.ID = m6.NESTING = m6.PSEUDO = m6.ROOT = m6.SELECTOR = m6.STRING = m6.TAG = void 0;
  var en = "tag";
  m6.TAG = en;
  var tn = "string";
  m6.STRING = tn;
  var rn = "selector";
  m6.SELECTOR = rn;
  var nn = "root";
  m6.ROOT = nn;
  var sn = "pseudo";
  m6.PSEUDO = sn;
  var an = "nesting";
  m6.NESTING = an;
  var un = "id";
  m6.ID = un;
  var on = "comment";
  m6.COMMENT = on;
  var cn = "combinator";
  m6.COMBINATOR = cn;
  var fn = "class";
  m6.CLASS = fn;
  var ln = "attribute";
  m6.ATTRIBUTE = ln;
  var hn = "universal";
  m6.UNIVERSAL = hn;
});
var we = T((Z3, Ft) => {
  "use strict";
  Z3.__esModule = true;
  Z3.default = void 0;
  var pn = vn(W()), Q3 = dn(D2());
  function Rt() {
    if (typeof WeakMap != "function") return null;
    var e = /* @__PURE__ */ new WeakMap();
    return Rt = function() {
      return e;
    }, e;
  }
  function dn(e) {
    if (e && e.__esModule) return e;
    if (e === null || typeof e != "object" && typeof e != "function") return { default: e };
    var n3 = Rt();
    if (n3 && n3.has(e)) return n3.get(e);
    var i4 = {}, t = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var r3 in e) if (Object.prototype.hasOwnProperty.call(e, r3)) {
      var s7 = t ? Object.getOwnPropertyDescriptor(e, r3) : null;
      s7 && (s7.get || s7.set) ? Object.defineProperty(i4, r3, s7) : i4[r3] = e[r3];
    }
    return i4.default = e, n3 && n3.set(e, i4), i4;
  }
  function vn(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function _n(e, n3) {
    var i4;
    if (typeof Symbol > "u" || e[Symbol.iterator] == null) {
      if (Array.isArray(e) || (i4 = Sn(e)) || n3 && e && typeof e.length == "number") {
        i4 && (e = i4);
        var t = 0;
        return function() {
          return t >= e.length ? { done: true } : { done: false, value: e[t++] };
        };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    return i4 = e[Symbol.iterator](), i4.next.bind(i4);
  }
  function Sn(e, n3) {
    if (e) {
      if (typeof e == "string") return Mt2(e, n3);
      var i4 = Object.prototype.toString.call(e).slice(8, -1);
      if (i4 === "Object" && e.constructor && (i4 = e.constructor.name), i4 === "Map" || i4 === "Set") return Array.from(e);
      if (i4 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i4)) return Mt2(e, n3);
    }
  }
  function Mt2(e, n3) {
    (n3 == null || n3 > e.length) && (n3 = e.length);
    for (var i4 = 0, t = new Array(n3); i4 < n3; i4++) t[i4] = e[i4];
    return t;
  }
  function Nt(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function gn(e, n3, i4) {
    return n3 && Nt(e.prototype, n3), i4 && Nt(e, i4), e;
  }
  function Tn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Ae2(e, n3);
  }
  function Ae2(e, n3) {
    return Ae2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Ae2(e, n3);
  }
  var On = function(e) {
    Tn(n3, e);
    function n3(t) {
      var r3;
      return r3 = e.call(this, t) || this, r3.nodes || (r3.nodes = []), r3;
    }
    var i4 = n3.prototype;
    return i4.append = function(r3) {
      return r3.parent = this, this.nodes.push(r3), this;
    }, i4.prepend = function(r3) {
      return r3.parent = this, this.nodes.unshift(r3), this;
    }, i4.at = function(r3) {
      return this.nodes[r3];
    }, i4.index = function(r3) {
      return typeof r3 == "number" ? r3 : this.nodes.indexOf(r3);
    }, i4.removeChild = function(r3) {
      r3 = this.index(r3), this.at(r3).parent = void 0, this.nodes.splice(r3, 1);
      var s7;
      for (var a4 in this.indexes) s7 = this.indexes[a4], s7 >= r3 && (this.indexes[a4] = s7 - 1);
      return this;
    }, i4.removeAll = function() {
      for (var r3 = _n(this.nodes), s7; !(s7 = r3()).done; ) {
        var a4 = s7.value;
        a4.parent = void 0;
      }
      return this.nodes = [], this;
    }, i4.empty = function() {
      return this.removeAll();
    }, i4.insertAfter = function(r3, s7) {
      s7.parent = this;
      var a4 = this.index(r3);
      this.nodes.splice(a4 + 1, 0, s7), s7.parent = this;
      var u5;
      for (var h7 in this.indexes) u5 = this.indexes[h7], a4 <= u5 && (this.indexes[h7] = u5 + 1);
      return this;
    }, i4.insertBefore = function(r3, s7) {
      s7.parent = this;
      var a4 = this.index(r3);
      this.nodes.splice(a4, 0, s7), s7.parent = this;
      var u5;
      for (var h7 in this.indexes) u5 = this.indexes[h7], u5 <= a4 && (this.indexes[h7] = u5 + 1);
      return this;
    }, i4._findChildAtPosition = function(r3, s7) {
      var a4 = void 0;
      return this.each(function(u5) {
        if (u5.atPosition) {
          var h7 = u5.atPosition(r3, s7);
          if (h7) return a4 = h7, false;
        } else if (u5.isAtPosition(r3, s7)) return a4 = u5, false;
      }), a4;
    }, i4.atPosition = function(r3, s7) {
      if (this.isAtPosition(r3, s7)) return this._findChildAtPosition(r3, s7) || this;
    }, i4._inferEndPosition = function() {
      this.last && this.last.source && this.last.source.end && (this.source = this.source || {}, this.source.end = this.source.end || {}, Object.assign(this.source.end, this.last.source.end));
    }, i4.each = function(r3) {
      this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach++;
      var s7 = this.lastEach;
      if (this.indexes[s7] = 0, !!this.length) {
        for (var a4, u5; this.indexes[s7] < this.length && (a4 = this.indexes[s7], u5 = r3(this.at(a4), a4), u5 !== false); ) this.indexes[s7] += 1;
        if (delete this.indexes[s7], u5 === false) return false;
      }
    }, i4.walk = function(r3) {
      return this.each(function(s7, a4) {
        var u5 = r3(s7, a4);
        if (u5 !== false && s7.length && (u5 = s7.walk(r3)), u5 === false) return false;
      });
    }, i4.walkAttributes = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.ATTRIBUTE) return r3.call(s7, a4);
      });
    }, i4.walkClasses = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.CLASS) return r3.call(s7, a4);
      });
    }, i4.walkCombinators = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.COMBINATOR) return r3.call(s7, a4);
      });
    }, i4.walkComments = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.COMMENT) return r3.call(s7, a4);
      });
    }, i4.walkIds = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.ID) return r3.call(s7, a4);
      });
    }, i4.walkNesting = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.NESTING) return r3.call(s7, a4);
      });
    }, i4.walkPseudos = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.PSEUDO) return r3.call(s7, a4);
      });
    }, i4.walkTags = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.TAG) return r3.call(s7, a4);
      });
    }, i4.walkUniversals = function(r3) {
      var s7 = this;
      return this.walk(function(a4) {
        if (a4.type === Q3.UNIVERSAL) return r3.call(s7, a4);
      });
    }, i4.split = function(r3) {
      var s7 = this, a4 = [];
      return this.reduce(function(u5, h7, l3) {
        var d6 = r3.call(s7, h7);
        return a4.push(h7), d6 ? (u5.push(a4), a4 = []) : l3 === s7.length - 1 && u5.push(a4), u5;
      }, []);
    }, i4.map = function(r3) {
      return this.nodes.map(r3);
    }, i4.reduce = function(r3, s7) {
      return this.nodes.reduce(r3, s7);
    }, i4.every = function(r3) {
      return this.nodes.every(r3);
    }, i4.some = function(r3) {
      return this.nodes.some(r3);
    }, i4.filter = function(r3) {
      return this.nodes.filter(r3);
    }, i4.sort = function(r3) {
      return this.nodes.sort(r3);
    }, i4.toString = function() {
      return this.map(String).join("");
    }, gn(n3, [{ key: "first", get: function() {
      return this.at(0);
    } }, { key: "last", get: function() {
      return this.at(this.length - 1);
    } }, { key: "length", get: function() {
      return this.nodes.length;
    } }]), n3;
  }(pn.default);
  Z3.default = On;
  Ft.exports = Z3.default;
});
var Me = T((j5, Ut2) => {
  "use strict";
  j5.__esModule = true;
  j5.default = void 0;
  var yn = mn(we()), En = D2();
  function mn(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Ct2(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function wn(e, n3, i4) {
    return n3 && Ct2(e.prototype, n3), i4 && Ct2(e, i4), e;
  }
  function Pn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, xe2(e, n3);
  }
  function xe2(e, n3) {
    return xe2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, xe2(e, n3);
  }
  var kn = function(e) {
    Pn(n3, e);
    function n3(t) {
      var r3;
      return r3 = e.call(this, t) || this, r3.type = En.ROOT, r3;
    }
    var i4 = n3.prototype;
    return i4.toString = function() {
      var r3 = this.reduce(function(s7, a4) {
        return s7.push(String(a4)), s7;
      }, []).join(",");
      return this.trailingComma ? r3 + "," : r3;
    }, i4.error = function(r3, s7) {
      return this._error ? this._error(r3, s7) : new Error(r3);
    }, wn(n3, [{ key: "errorGenerator", set: function(r3) {
      this._error = r3;
    } }]), n3;
  }(yn.default);
  j5.default = kn;
  Ut2.exports = j5.default;
});
var Re = T((ee3, Wt) => {
  "use strict";
  ee3.__esModule = true;
  ee3.default = void 0;
  var In = Ln(we()), qn = D2();
  function Ln(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Dn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Ne2(e, n3);
  }
  function Ne2(e, n3) {
    return Ne2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Ne2(e, n3);
  }
  var bn = function(e) {
    Dn(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = qn.SELECTOR, t;
    }
    return n3;
  }(In.default);
  ee3.default = bn;
  Wt.exports = ee3.default;
});
var Ce = T((te4, Yt) => {
  "use strict";
  te4.__esModule = true;
  te4.default = void 0;
  var An = Bt(ge("cssesc")), xn = J(), Mn = Bt(W()), Nn = D2();
  function Bt(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Qt(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function Rn(e, n3, i4) {
    return n3 && Qt(e.prototype, n3), i4 && Qt(e, i4), e;
  }
  function Fn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Fe2(e, n3);
  }
  function Fe2(e, n3) {
    return Fe2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Fe2(e, n3);
  }
  var Cn = function(e) {
    Fn(n3, e);
    function n3(t) {
      var r3;
      return r3 = e.call(this, t) || this, r3.type = Nn.CLASS, r3._constructed = true, r3;
    }
    var i4 = n3.prototype;
    return i4.valueToString = function() {
      return "." + e.prototype.valueToString.call(this);
    }, Rn(n3, [{ key: "value", get: function() {
      return this._value;
    }, set: function(r3) {
      if (this._constructed) {
        var s7 = (0, An.default)(r3, { isIdentifier: true });
        s7 !== r3 ? ((0, xn.ensureObject)(this, "raws"), this.raws.value = s7) : this.raws && delete this.raws.value;
      }
      this._value = r3;
    } }]), n3;
  }(Mn.default);
  te4.default = Cn;
  Yt.exports = te4.default;
});
var We = T((re3, Gt) => {
  "use strict";
  re3.__esModule = true;
  re3.default = void 0;
  var Un = Qn(W()), Wn = D2();
  function Qn(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Bn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Ue2(e, n3);
  }
  function Ue2(e, n3) {
    return Ue2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Ue2(e, n3);
  }
  var Yn = function(e) {
    Bn(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = Wn.COMMENT, t;
    }
    return n3;
  }(Un.default);
  re3.default = Yn;
  Gt.exports = re3.default;
});
var Be = T((ne4, Vt) => {
  "use strict";
  ne4.__esModule = true;
  ne4.default = void 0;
  var Gn = Hn(W()), Vn = D2();
  function Hn(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Kn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Qe2(e, n3);
  }
  function Qe2(e, n3) {
    return Qe2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Qe2(e, n3);
  }
  var $n = function(e) {
    Kn(n3, e);
    function n3(t) {
      var r3;
      return r3 = e.call(this, t) || this, r3.type = Vn.ID, r3;
    }
    var i4 = n3.prototype;
    return i4.valueToString = function() {
      return "#" + e.prototype.valueToString.call(this);
    }, n3;
  }(Gn.default);
  ne4.default = $n;
  Vt.exports = ne4.default;
});
var Pe = T((ie4, $t) => {
  "use strict";
  ie4.__esModule = true;
  ie4.default = void 0;
  var zn = Kt(ge("cssesc")), Jn = J(), Xn = Kt(W());
  function Kt(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Ht(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function Zn(e, n3, i4) {
    return n3 && Ht(e.prototype, n3), i4 && Ht(e, i4), e;
  }
  function jn(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Ye2(e, n3);
  }
  function Ye2(e, n3) {
    return Ye2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Ye2(e, n3);
  }
  var ei = function(e) {
    jn(n3, e);
    function n3() {
      return e.apply(this, arguments) || this;
    }
    var i4 = n3.prototype;
    return i4.qualifiedName = function(r3) {
      return this.namespace ? this.namespaceString + "|" + r3 : r3;
    }, i4.valueToString = function() {
      return this.qualifiedName(e.prototype.valueToString.call(this));
    }, Zn(n3, [{ key: "namespace", get: function() {
      return this._namespace;
    }, set: function(r3) {
      if (r3 === true || r3 === "*" || r3 === "&") {
        this._namespace = r3, this.raws && delete this.raws.namespace;
        return;
      }
      var s7 = (0, zn.default)(r3, { isIdentifier: true });
      this._namespace = r3, s7 !== r3 ? ((0, Jn.ensureObject)(this, "raws"), this.raws.namespace = s7) : this.raws && delete this.raws.namespace;
    } }, { key: "ns", get: function() {
      return this._namespace;
    }, set: function(r3) {
      this.namespace = r3;
    } }, { key: "namespaceString", get: function() {
      if (this.namespace) {
        var r3 = this.stringifyProperty("namespace");
        return r3 === true ? "" : r3;
      } else return "";
    } }]), n3;
  }(Xn.default);
  ie4.default = ei;
  $t.exports = ie4.default;
});
var Ve = T((se3, zt) => {
  "use strict";
  se3.__esModule = true;
  se3.default = void 0;
  var ti = ni(Pe()), ri = D2();
  function ni(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function ii(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Ge2(e, n3);
  }
  function Ge2(e, n3) {
    return Ge2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Ge2(e, n3);
  }
  var si = function(e) {
    ii(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = ri.TAG, t;
    }
    return n3;
  }(ti.default);
  se3.default = si;
  zt.exports = se3.default;
});
var Ke = T((ae4, Jt) => {
  "use strict";
  ae4.__esModule = true;
  ae4.default = void 0;
  var ai = oi(W()), ui = D2();
  function oi(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function ci(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, He2(e, n3);
  }
  function He2(e, n3) {
    return He2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, He2(e, n3);
  }
  var fi = function(e) {
    ci(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = ui.STRING, t;
    }
    return n3;
  }(ai.default);
  ae4.default = fi;
  Jt.exports = ae4.default;
});
var ze = T((ue3, Xt) => {
  "use strict";
  ue3.__esModule = true;
  ue3.default = void 0;
  var li = pi(we()), hi = D2();
  function pi(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function di(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, $e2(e, n3);
  }
  function $e2(e, n3) {
    return $e2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, $e2(e, n3);
  }
  var vi = function(e) {
    di(n3, e);
    function n3(t) {
      var r3;
      return r3 = e.call(this, t) || this, r3.type = hi.PSEUDO, r3;
    }
    var i4 = n3.prototype;
    return i4.toString = function() {
      var r3 = this.length ? "(" + this.map(String).join(",") + ")" : "";
      return [this.rawSpaceBefore, this.stringifyProperty("value"), r3, this.rawSpaceAfter].join("");
    }, n3;
  }(li.default);
  ue3.default = vi;
  Xt.exports = ue3.default;
});
var tt = T((fe3) => {
  "use strict";
  fe3.__esModule = true;
  fe3.unescapeValue = et2;
  fe3.default = void 0;
  var oe3 = je3(ge("cssesc")), _i = je3(be()), Si = je3(Pe()), gi = D2(), Je2;
  function je3(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Zt(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function Ti(e, n3, i4) {
    return n3 && Zt(e.prototype, n3), i4 && Zt(e, i4), e;
  }
  function Oi(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, Ze2(e, n3);
  }
  function Ze2(e, n3) {
    return Ze2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, Ze2(e, n3);
  }
  var ce3 = ge("util-deprecate"), yi = /^('|")([^]*)\1$/, Ei = ce3(function() {
  }, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead."), mi = ce3(function() {
  }, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead."), wi = ce3(function() {
  }, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
  function et2(e) {
    var n3 = false, i4 = null, t = e, r3 = t.match(yi);
    return r3 && (i4 = r3[1], t = r3[2]), t = (0, _i.default)(t), t !== e && (n3 = true), { deprecatedUsage: n3, unescaped: t, quoteMark: i4 };
  }
  function Pi(e) {
    if (e.quoteMark !== void 0 || e.value === void 0) return e;
    wi();
    var n3 = et2(e.value), i4 = n3.quoteMark, t = n3.unescaped;
    return e.raws || (e.raws = {}), e.raws.value === void 0 && (e.raws.value = e.value), e.value = t, e.quoteMark = i4, e;
  }
  var ke2 = function(e) {
    Oi(n3, e);
    function n3(t) {
      var r3;
      return t === void 0 && (t = {}), r3 = e.call(this, Pi(t)) || this, r3.type = gi.ATTRIBUTE, r3.raws = r3.raws || {}, Object.defineProperty(r3.raws, "unquoted", { get: ce3(function() {
        return r3.value;
      }, "attr.raws.unquoted is deprecated. Call attr.value instead."), set: ce3(function() {
        return r3.value;
      }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.") }), r3._constructed = true, r3;
    }
    var i4 = n3.prototype;
    return i4.getQuotedValue = function(r3) {
      r3 === void 0 && (r3 = {});
      var s7 = this._determineQuoteMark(r3), a4 = Xe2[s7], u5 = (0, oe3.default)(this._value, a4);
      return u5;
    }, i4._determineQuoteMark = function(r3) {
      return r3.smart ? this.smartQuoteMark(r3) : this.preferredQuoteMark(r3);
    }, i4.setValue = function(r3, s7) {
      s7 === void 0 && (s7 = {}), this._value = r3, this._quoteMark = this._determineQuoteMark(s7), this._syncRawValue();
    }, i4.smartQuoteMark = function(r3) {
      var s7 = this.value, a4 = s7.replace(/[^']/g, "").length, u5 = s7.replace(/[^"]/g, "").length;
      if (a4 + u5 === 0) {
        var h7 = (0, oe3.default)(s7, { isIdentifier: true });
        if (h7 === s7) return n3.NO_QUOTE;
        var l3 = this.preferredQuoteMark(r3);
        if (l3 === n3.NO_QUOTE) {
          var d6 = this.quoteMark || r3.quoteMark || n3.DOUBLE_QUOTE, S6 = Xe2[d6], O7 = (0, oe3.default)(s7, S6);
          if (O7.length < h7.length) return d6;
        }
        return l3;
      } else return u5 === a4 ? this.preferredQuoteMark(r3) : u5 < a4 ? n3.DOUBLE_QUOTE : n3.SINGLE_QUOTE;
    }, i4.preferredQuoteMark = function(r3) {
      var s7 = r3.preferCurrentQuoteMark ? this.quoteMark : r3.quoteMark;
      return s7 === void 0 && (s7 = r3.preferCurrentQuoteMark ? r3.quoteMark : this.quoteMark), s7 === void 0 && (s7 = n3.DOUBLE_QUOTE), s7;
    }, i4._syncRawValue = function() {
      var r3 = (0, oe3.default)(this._value, Xe2[this.quoteMark]);
      r3 === this._value ? this.raws && delete this.raws.value : this.raws.value = r3;
    }, i4._handleEscapes = function(r3, s7) {
      if (this._constructed) {
        var a4 = (0, oe3.default)(s7, { isIdentifier: true });
        a4 !== s7 ? this.raws[r3] = a4 : delete this.raws[r3];
      }
    }, i4._spacesFor = function(r3) {
      var s7 = { before: "", after: "" }, a4 = this.spaces[r3] || {}, u5 = this.raws.spaces && this.raws.spaces[r3] || {};
      return Object.assign(s7, a4, u5);
    }, i4._stringFor = function(r3, s7, a4) {
      s7 === void 0 && (s7 = r3), a4 === void 0 && (a4 = jt);
      var u5 = this._spacesFor(s7);
      return a4(this.stringifyProperty(r3), u5);
    }, i4.offsetOf = function(r3) {
      var s7 = 1, a4 = this._spacesFor("attribute");
      if (s7 += a4.before.length, r3 === "namespace" || r3 === "ns") return this.namespace ? s7 : -1;
      if (r3 === "attributeNS" || (s7 += this.namespaceString.length, this.namespace && (s7 += 1), r3 === "attribute")) return s7;
      s7 += this.stringifyProperty("attribute").length, s7 += a4.after.length;
      var u5 = this._spacesFor("operator");
      s7 += u5.before.length;
      var h7 = this.stringifyProperty("operator");
      if (r3 === "operator") return h7 ? s7 : -1;
      s7 += h7.length, s7 += u5.after.length;
      var l3 = this._spacesFor("value");
      s7 += l3.before.length;
      var d6 = this.stringifyProperty("value");
      if (r3 === "value") return d6 ? s7 : -1;
      s7 += d6.length, s7 += l3.after.length;
      var S6 = this._spacesFor("insensitive");
      return s7 += S6.before.length, r3 === "insensitive" && this.insensitive ? s7 : -1;
    }, i4.toString = function() {
      var r3 = this, s7 = [this.rawSpaceBefore, "["];
      return s7.push(this._stringFor("qualifiedAttribute", "attribute")), this.operator && (this.value || this.value === "") && (s7.push(this._stringFor("operator")), s7.push(this._stringFor("value")), s7.push(this._stringFor("insensitiveFlag", "insensitive", function(a4, u5) {
        return a4.length > 0 && !r3.quoted && u5.before.length === 0 && !(r3.spaces.value && r3.spaces.value.after) && (u5.before = " "), jt(a4, u5);
      }))), s7.push("]"), s7.push(this.rawSpaceAfter), s7.join("");
    }, Ti(n3, [{ key: "quoted", get: function() {
      var r3 = this.quoteMark;
      return r3 === "'" || r3 === '"';
    }, set: function(r3) {
      mi();
    } }, { key: "quoteMark", get: function() {
      return this._quoteMark;
    }, set: function(r3) {
      if (!this._constructed) {
        this._quoteMark = r3;
        return;
      }
      this._quoteMark !== r3 && (this._quoteMark = r3, this._syncRawValue());
    } }, { key: "qualifiedAttribute", get: function() {
      return this.qualifiedName(this.raws.attribute || this.attribute);
    } }, { key: "insensitiveFlag", get: function() {
      return this.insensitive ? "i" : "";
    } }, { key: "value", get: function() {
      return this._value;
    }, set: function(r3) {
      if (this._constructed) {
        var s7 = et2(r3), a4 = s7.deprecatedUsage, u5 = s7.unescaped, h7 = s7.quoteMark;
        if (a4 && Ei(), u5 === this._value && h7 === this._quoteMark) return;
        this._value = u5, this._quoteMark = h7, this._syncRawValue();
      } else this._value = r3;
    } }, { key: "attribute", get: function() {
      return this._attribute;
    }, set: function(r3) {
      this._handleEscapes("attribute", r3), this._attribute = r3;
    } }]), n3;
  }(Si.default);
  fe3.default = ke2;
  ke2.NO_QUOTE = null;
  ke2.SINGLE_QUOTE = "'";
  ke2.DOUBLE_QUOTE = '"';
  var Xe2 = (Je2 = { "'": { quotes: "single", wrap: true }, '"': { quotes: "double", wrap: true } }, Je2[null] = { isIdentifier: true }, Je2);
  function jt(e, n3) {
    return "" + n3.before + e + n3.after;
  }
});
var nt = T((le4, er) => {
  "use strict";
  le4.__esModule = true;
  le4.default = void 0;
  var ki = qi(Pe()), Ii = D2();
  function qi(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Li(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, rt2(e, n3);
  }
  function rt2(e, n3) {
    return rt2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, rt2(e, n3);
  }
  var Di = function(e) {
    Li(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = Ii.UNIVERSAL, t.value = "*", t;
    }
    return n3;
  }(ki.default);
  le4.default = Di;
  er.exports = le4.default;
});
var st = T((he4, tr) => {
  "use strict";
  he4.__esModule = true;
  he4.default = void 0;
  var bi = xi(W()), Ai = D2();
  function xi(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Mi(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, it2(e, n3);
  }
  function it2(e, n3) {
    return it2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, it2(e, n3);
  }
  var Ni = function(e) {
    Mi(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = Ai.COMBINATOR, t;
    }
    return n3;
  }(bi.default);
  he4.default = Ni;
  tr.exports = he4.default;
});
var ut = T((pe3, rr) => {
  "use strict";
  pe3.__esModule = true;
  pe3.default = void 0;
  var Ri = Ci(W()), Fi = D2();
  function Ci(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function Ui(e, n3) {
    e.prototype = Object.create(n3.prototype), e.prototype.constructor = e, at2(e, n3);
  }
  function at2(e, n3) {
    return at2 = Object.setPrototypeOf || function(t, r3) {
      return t.__proto__ = r3, t;
    }, at2(e, n3);
  }
  var Wi = function(e) {
    Ui(n3, e);
    function n3(i4) {
      var t;
      return t = e.call(this, i4) || this, t.type = Fi.NESTING, t.value = "&", t;
    }
    return n3;
  }(Ri.default);
  pe3.default = Wi;
  rr.exports = pe3.default;
});
var ir = T((Ie2, nr) => {
  "use strict";
  Ie2.__esModule = true;
  Ie2.default = Qi;
  function Qi(e) {
    return e.sort(function(n3, i4) {
      return n3 - i4;
    });
  }
  nr.exports = Ie2.default;
});
var ot = T((p4) => {
  "use strict";
  p4.__esModule = true;
  p4.combinator = p4.word = p4.comment = p4.str = p4.tab = p4.newline = p4.feed = p4.cr = p4.backslash = p4.bang = p4.slash = p4.doubleQuote = p4.singleQuote = p4.space = p4.greaterThan = p4.pipe = p4.equals = p4.plus = p4.caret = p4.tilde = p4.dollar = p4.closeSquare = p4.openSquare = p4.closeParenthesis = p4.openParenthesis = p4.semicolon = p4.colon = p4.comma = p4.at = p4.asterisk = p4.ampersand = void 0;
  var Bi2 = 38;
  p4.ampersand = Bi2;
  var Yi = 42;
  p4.asterisk = Yi;
  var Gi = 64;
  p4.at = Gi;
  var Vi = 44;
  p4.comma = Vi;
  var Hi = 58;
  p4.colon = Hi;
  var Ki = 59;
  p4.semicolon = Ki;
  var $i = 40;
  p4.openParenthesis = $i;
  var zi = 41;
  p4.closeParenthesis = zi;
  var Ji = 91;
  p4.openSquare = Ji;
  var Xi = 93;
  p4.closeSquare = Xi;
  var Zi = 36;
  p4.dollar = Zi;
  var ji2 = 126;
  p4.tilde = ji2;
  var es = 94;
  p4.caret = es;
  var ts = 43;
  p4.plus = ts;
  var rs = 61;
  p4.equals = rs;
  var ns = 124;
  p4.pipe = ns;
  var is = 62;
  p4.greaterThan = is;
  var ss = 32;
  p4.space = ss;
  var sr = 39;
  p4.singleQuote = sr;
  var as = 34;
  p4.doubleQuote = as;
  var us = 47;
  p4.slash = us;
  var os = 33;
  p4.bang = os;
  var cs = 92;
  p4.backslash = cs;
  var fs = 13;
  p4.cr = fs;
  var ls = 12;
  p4.feed = ls;
  var hs = 10;
  p4.newline = hs;
  var ps = 9;
  p4.tab = ps;
  var ds = sr;
  p4.str = ds;
  var vs = -1;
  p4.comment = vs;
  var _s = -2;
  p4.word = _s;
  var Ss = -3;
  p4.combinator = Ss;
});
var or = T((de3) => {
  "use strict";
  de3.__esModule = true;
  de3.default = ws;
  de3.FIELDS = void 0;
  var c5 = gs(ot()), K5, y9;
  function ur() {
    if (typeof WeakMap != "function") return null;
    var e = /* @__PURE__ */ new WeakMap();
    return ur = function() {
      return e;
    }, e;
  }
  function gs(e) {
    if (e && e.__esModule) return e;
    if (e === null || typeof e != "object" && typeof e != "function") return { default: e };
    var n3 = ur();
    if (n3 && n3.has(e)) return n3.get(e);
    var i4 = {}, t = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var r3 in e) if (Object.prototype.hasOwnProperty.call(e, r3)) {
      var s7 = t ? Object.getOwnPropertyDescriptor(e, r3) : null;
      s7 && (s7.get || s7.set) ? Object.defineProperty(i4, r3, s7) : i4[r3] = e[r3];
    }
    return i4.default = e, n3 && n3.set(e, i4), i4;
  }
  var Ts = (K5 = {}, K5[c5.tab] = true, K5[c5.newline] = true, K5[c5.cr] = true, K5[c5.feed] = true, K5), Os = (y9 = {}, y9[c5.space] = true, y9[c5.tab] = true, y9[c5.newline] = true, y9[c5.cr] = true, y9[c5.feed] = true, y9[c5.ampersand] = true, y9[c5.asterisk] = true, y9[c5.bang] = true, y9[c5.comma] = true, y9[c5.colon] = true, y9[c5.semicolon] = true, y9[c5.openParenthesis] = true, y9[c5.closeParenthesis] = true, y9[c5.openSquare] = true, y9[c5.closeSquare] = true, y9[c5.singleQuote] = true, y9[c5.doubleQuote] = true, y9[c5.plus] = true, y9[c5.pipe] = true, y9[c5.tilde] = true, y9[c5.greaterThan] = true, y9[c5.equals] = true, y9[c5.dollar] = true, y9[c5.caret] = true, y9[c5.slash] = true, y9), ct2 = {}, ar = "0123456789abcdefABCDEF";
  for (qe2 = 0; qe2 < ar.length; qe2++) ct2[ar.charCodeAt(qe2)] = true;
  var qe2;
  function ys(e, n3) {
    var i4 = n3, t;
    do {
      if (t = e.charCodeAt(i4), Os[t]) return i4 - 1;
      t === c5.backslash ? i4 = Es(e, i4) + 1 : i4++;
    } while (i4 < e.length);
    return i4 - 1;
  }
  function Es(e, n3) {
    var i4 = n3, t = e.charCodeAt(i4 + 1);
    if (!Ts[t]) if (ct2[t]) {
      var r3 = 0;
      do
        i4++, r3++, t = e.charCodeAt(i4 + 1);
      while (ct2[t] && r3 < 6);
      r3 < 6 && t === c5.space && i4++;
    } else i4++;
    return i4;
  }
  var ms = { TYPE: 0, START_LINE: 1, START_COL: 2, END_LINE: 3, END_COL: 4, START_POS: 5, END_POS: 6 };
  de3.FIELDS = ms;
  function ws(e) {
    var n3 = [], i4 = e.css.valueOf(), t = i4, r3 = t.length, s7 = -1, a4 = 1, u5 = 0, h7 = 0, l3, d6, S6, O7, v6, E6, A7, x5, _6, I7, q5, b7, L4;
    function B3(H4, Y3) {
      if (e.safe) i4 += Y3, _6 = i4.length - 1;
      else throw e.error("Unclosed " + H4, a4, u5 - s7, u5);
    }
    for (; u5 < r3; ) {
      switch (l3 = i4.charCodeAt(u5), l3 === c5.newline && (s7 = u5, a4 += 1), l3) {
        case c5.space:
        case c5.tab:
        case c5.newline:
        case c5.cr:
        case c5.feed:
          _6 = u5;
          do
            _6 += 1, l3 = i4.charCodeAt(_6), l3 === c5.newline && (s7 = _6, a4 += 1);
          while (l3 === c5.space || l3 === c5.newline || l3 === c5.tab || l3 === c5.cr || l3 === c5.feed);
          L4 = c5.space, O7 = a4, S6 = _6 - s7 - 1, h7 = _6;
          break;
        case c5.plus:
        case c5.greaterThan:
        case c5.tilde:
        case c5.pipe:
          _6 = u5;
          do
            _6 += 1, l3 = i4.charCodeAt(_6);
          while (l3 === c5.plus || l3 === c5.greaterThan || l3 === c5.tilde || l3 === c5.pipe);
          L4 = c5.combinator, O7 = a4, S6 = u5 - s7, h7 = _6;
          break;
        case c5.asterisk:
        case c5.ampersand:
        case c5.bang:
        case c5.comma:
        case c5.equals:
        case c5.dollar:
        case c5.caret:
        case c5.openSquare:
        case c5.closeSquare:
        case c5.colon:
        case c5.semicolon:
        case c5.openParenthesis:
        case c5.closeParenthesis:
          _6 = u5, L4 = l3, O7 = a4, S6 = u5 - s7, h7 = _6 + 1;
          break;
        case c5.singleQuote:
        case c5.doubleQuote:
          b7 = l3 === c5.singleQuote ? "'" : '"', _6 = u5;
          do
            for (v6 = false, _6 = i4.indexOf(b7, _6 + 1), _6 === -1 && B3("quote", b7), E6 = _6; i4.charCodeAt(E6 - 1) === c5.backslash; ) E6 -= 1, v6 = !v6;
          while (v6);
          L4 = c5.str, O7 = a4, S6 = u5 - s7, h7 = _6 + 1;
          break;
        default:
          l3 === c5.slash && i4.charCodeAt(u5 + 1) === c5.asterisk ? (_6 = i4.indexOf("*/", u5 + 2) + 1, _6 === 0 && B3("comment", "*/"), d6 = i4.slice(u5, _6 + 1), x5 = d6.split(`
`), A7 = x5.length - 1, A7 > 0 ? (I7 = a4 + A7, q5 = _6 - x5[A7].length) : (I7 = a4, q5 = s7), L4 = c5.comment, a4 = I7, O7 = I7, S6 = _6 - q5) : l3 === c5.slash ? (_6 = u5, L4 = l3, O7 = a4, S6 = u5 - s7, h7 = _6 + 1) : (_6 = ys(i4, u5), L4 = c5.word, O7 = a4, S6 = _6 - s7), h7 = _6 + 1;
          break;
      }
      n3.push([L4, a4, u5 - s7, O7, S6, u5, h7]), q5 && (s7 = q5, q5 = null), u5 = h7;
    }
    return n3;
  }
});
var _r = T((ve3, vr) => {
  "use strict";
  ve3.__esModule = true;
  ve3.default = void 0;
  var Ps = N4(Me()), ft2 = N4(Re()), ks = N4(Ce()), cr = N4(We()), Is = N4(Be()), qs = N4(Ve()), lt2 = N4(Ke()), Ls = N4(ze()), fr = Le2(tt()), Ds = N4(nt()), ht2 = N4(st()), bs = N4(ut()), As = N4(ir()), o7 = Le2(or()), f6 = Le2(ot()), xs = Le2(D2()), P5 = J(), G5, pt2;
  function dr() {
    if (typeof WeakMap != "function") return null;
    var e = /* @__PURE__ */ new WeakMap();
    return dr = function() {
      return e;
    }, e;
  }
  function Le2(e) {
    if (e && e.__esModule) return e;
    if (e === null || typeof e != "object" && typeof e != "function") return { default: e };
    var n3 = dr();
    if (n3 && n3.has(e)) return n3.get(e);
    var i4 = {}, t = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var r3 in e) if (Object.prototype.hasOwnProperty.call(e, r3)) {
      var s7 = t ? Object.getOwnPropertyDescriptor(e, r3) : null;
      s7 && (s7.get || s7.set) ? Object.defineProperty(i4, r3, s7) : i4[r3] = e[r3];
    }
    return i4.default = e, n3 && n3.set(e, i4), i4;
  }
  function N4(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function lr(e, n3) {
    for (var i4 = 0; i4 < n3.length; i4++) {
      var t = n3[i4];
      t.enumerable = t.enumerable || false, t.configurable = true, "value" in t && (t.writable = true), Object.defineProperty(e, t.key, t);
    }
  }
  function Ms(e, n3, i4) {
    return n3 && lr(e.prototype, n3), i4 && lr(e, i4), e;
  }
  var _t2 = (G5 = {}, G5[f6.space] = true, G5[f6.cr] = true, G5[f6.feed] = true, G5[f6.newline] = true, G5[f6.tab] = true, G5), Ns = Object.assign({}, _t2, (pt2 = {}, pt2[f6.comment] = true, pt2));
  function hr(e) {
    return { line: e[o7.FIELDS.START_LINE], column: e[o7.FIELDS.START_COL] };
  }
  function pr(e) {
    return { line: e[o7.FIELDS.END_LINE], column: e[o7.FIELDS.END_COL] };
  }
  function V3(e, n3, i4, t) {
    return { start: { line: e, column: n3 }, end: { line: i4, column: t } };
  }
  function $3(e) {
    return V3(e[o7.FIELDS.START_LINE], e[o7.FIELDS.START_COL], e[o7.FIELDS.END_LINE], e[o7.FIELDS.END_COL]);
  }
  function dt2(e, n3) {
    if (e) return V3(e[o7.FIELDS.START_LINE], e[o7.FIELDS.START_COL], n3[o7.FIELDS.END_LINE], n3[o7.FIELDS.END_COL]);
  }
  function z5(e, n3) {
    var i4 = e[n3];
    if (typeof i4 == "string") return i4.indexOf("\\") !== -1 && ((0, P5.ensureObject)(e, "raws"), e[n3] = (0, P5.unesc)(i4), e.raws[n3] === void 0 && (e.raws[n3] = i4)), e;
  }
  function vt2(e, n3) {
    for (var i4 = -1, t = []; (i4 = e.indexOf(n3, i4 + 1)) !== -1; ) t.push(i4);
    return t;
  }
  function Rs() {
    var e = Array.prototype.concat.apply([], arguments);
    return e.filter(function(n3, i4) {
      return i4 === e.indexOf(n3);
    });
  }
  var Fs = function() {
    function e(i4, t) {
      t === void 0 && (t = {}), this.rule = i4, this.options = Object.assign({ lossy: false, safe: false }, t), this.position = 0, this.css = typeof this.rule == "string" ? this.rule : this.rule.selector, this.tokens = (0, o7.default)({ css: this.css, error: this._errorGenerator(), safe: this.options.safe });
      var r3 = dt2(this.tokens[0], this.tokens[this.tokens.length - 1]);
      this.root = new Ps.default({ source: r3 }), this.root.errorGenerator = this._errorGenerator();
      var s7 = new ft2.default({ source: { start: { line: 1, column: 1 } } });
      this.root.append(s7), this.current = s7, this.loop();
    }
    var n3 = e.prototype;
    return n3._errorGenerator = function() {
      var t = this;
      return function(r3, s7) {
        return typeof t.rule == "string" ? new Error(r3) : t.rule.error(r3, s7);
      };
    }, n3.attribute = function() {
      var t = [], r3 = this.currToken;
      for (this.position++; this.position < this.tokens.length && this.currToken[o7.FIELDS.TYPE] !== f6.closeSquare; ) t.push(this.currToken), this.position++;
      if (this.currToken[o7.FIELDS.TYPE] !== f6.closeSquare) return this.expected("closing square bracket", this.currToken[o7.FIELDS.START_POS]);
      var s7 = t.length, a4 = { source: V3(r3[1], r3[2], this.currToken[3], this.currToken[4]), sourceIndex: r3[o7.FIELDS.START_POS] };
      if (s7 === 1 && !~[f6.word].indexOf(t[0][o7.FIELDS.TYPE])) return this.expected("attribute", t[0][o7.FIELDS.START_POS]);
      for (var u5 = 0, h7 = "", l3 = "", d6 = null, S6 = false; u5 < s7; ) {
        var O7 = t[u5], v6 = this.content(O7), E6 = t[u5 + 1];
        switch (O7[o7.FIELDS.TYPE]) {
          case f6.space:
            if (S6 = true, this.options.lossy) break;
            if (d6) {
              (0, P5.ensureObject)(a4, "spaces", d6);
              var A7 = a4.spaces[d6].after || "";
              a4.spaces[d6].after = A7 + v6;
              var x5 = (0, P5.getProp)(a4, "raws", "spaces", d6, "after") || null;
              x5 && (a4.raws.spaces[d6].after = x5 + v6);
            } else h7 = h7 + v6, l3 = l3 + v6;
            break;
          case f6.asterisk:
            if (E6[o7.FIELDS.TYPE] === f6.equals) a4.operator = v6, d6 = "operator";
            else if ((!a4.namespace || d6 === "namespace" && !S6) && E6) {
              h7 && ((0, P5.ensureObject)(a4, "spaces", "attribute"), a4.spaces.attribute.before = h7, h7 = ""), l3 && ((0, P5.ensureObject)(a4, "raws", "spaces", "attribute"), a4.raws.spaces.attribute.before = h7, l3 = ""), a4.namespace = (a4.namespace || "") + v6;
              var _6 = (0, P5.getProp)(a4, "raws", "namespace") || null;
              _6 && (a4.raws.namespace += v6), d6 = "namespace";
            }
            S6 = false;
            break;
          case f6.dollar:
            if (d6 === "value") {
              var I7 = (0, P5.getProp)(a4, "raws", "value");
              a4.value += "$", I7 && (a4.raws.value = I7 + "$");
              break;
            }
          case f6.caret:
            E6[o7.FIELDS.TYPE] === f6.equals && (a4.operator = v6, d6 = "operator"), S6 = false;
            break;
          case f6.combinator:
            if (v6 === "~" && E6[o7.FIELDS.TYPE] === f6.equals && (a4.operator = v6, d6 = "operator"), v6 !== "|") {
              S6 = false;
              break;
            }
            E6[o7.FIELDS.TYPE] === f6.equals ? (a4.operator = v6, d6 = "operator") : !a4.namespace && !a4.attribute && (a4.namespace = true), S6 = false;
            break;
          case f6.word:
            if (E6 && this.content(E6) === "|" && t[u5 + 2] && t[u5 + 2][o7.FIELDS.TYPE] !== f6.equals && !a4.operator && !a4.namespace) a4.namespace = v6, d6 = "namespace";
            else if (!a4.attribute || d6 === "attribute" && !S6) {
              h7 && ((0, P5.ensureObject)(a4, "spaces", "attribute"), a4.spaces.attribute.before = h7, h7 = ""), l3 && ((0, P5.ensureObject)(a4, "raws", "spaces", "attribute"), a4.raws.spaces.attribute.before = l3, l3 = ""), a4.attribute = (a4.attribute || "") + v6;
              var q5 = (0, P5.getProp)(a4, "raws", "attribute") || null;
              q5 && (a4.raws.attribute += v6), d6 = "attribute";
            } else if (!a4.value && a4.value !== "" || d6 === "value" && !S6) {
              var b7 = (0, P5.unesc)(v6), L4 = (0, P5.getProp)(a4, "raws", "value") || "", B3 = a4.value || "";
              a4.value = B3 + b7, a4.quoteMark = null, (b7 !== v6 || L4) && ((0, P5.ensureObject)(a4, "raws"), a4.raws.value = (L4 || B3) + v6), d6 = "value";
            } else {
              var H4 = v6 === "i" || v6 === "I";
              (a4.value || a4.value === "") && (a4.quoteMark || S6) ? (a4.insensitive = H4, (!H4 || v6 === "I") && ((0, P5.ensureObject)(a4, "raws"), a4.raws.insensitiveFlag = v6), d6 = "insensitive", h7 && ((0, P5.ensureObject)(a4, "spaces", "insensitive"), a4.spaces.insensitive.before = h7, h7 = ""), l3 && ((0, P5.ensureObject)(a4, "raws", "spaces", "insensitive"), a4.raws.spaces.insensitive.before = l3, l3 = "")) : (a4.value || a4.value === "") && (d6 = "value", a4.value += v6, a4.raws.value && (a4.raws.value += v6));
            }
            S6 = false;
            break;
          case f6.str:
            if (!a4.attribute || !a4.operator) return this.error("Expected an attribute followed by an operator preceding the string.", { index: O7[o7.FIELDS.START_POS] });
            var Y3 = (0, fr.unescapeValue)(v6), qr = Y3.unescaped, Lr = Y3.quoteMark;
            a4.value = qr, a4.quoteMark = Lr, d6 = "value", (0, P5.ensureObject)(a4, "raws"), a4.raws.value = v6, S6 = false;
            break;
          case f6.equals:
            if (!a4.attribute) return this.expected("attribute", O7[o7.FIELDS.START_POS], v6);
            if (a4.value) return this.error('Unexpected "=" found; an operator was already defined.', { index: O7[o7.FIELDS.START_POS] });
            a4.operator = a4.operator ? a4.operator + v6 : v6, d6 = "operator", S6 = false;
            break;
          case f6.comment:
            if (d6) if (S6 || E6 && E6[o7.FIELDS.TYPE] === f6.space || d6 === "insensitive") {
              var Dr = (0, P5.getProp)(a4, "spaces", d6, "after") || "", br = (0, P5.getProp)(a4, "raws", "spaces", d6, "after") || Dr;
              (0, P5.ensureObject)(a4, "raws", "spaces", d6), a4.raws.spaces[d6].after = br + v6;
            } else {
              var Ar = a4[d6] || "", xr = (0, P5.getProp)(a4, "raws", d6) || Ar;
              (0, P5.ensureObject)(a4, "raws"), a4.raws[d6] = xr + v6;
            }
            else l3 = l3 + v6;
            break;
          default:
            return this.error('Unexpected "' + v6 + '" found.', { index: O7[o7.FIELDS.START_POS] });
        }
        u5++;
      }
      z5(a4, "attribute"), z5(a4, "namespace"), this.newNode(new fr.default(a4)), this.position++;
    }, n3.parseWhitespaceEquivalentTokens = function(t) {
      t < 0 && (t = this.tokens.length);
      var r3 = this.position, s7 = [], a4 = "", u5 = void 0;
      do
        if (_t2[this.currToken[o7.FIELDS.TYPE]]) this.options.lossy || (a4 += this.content());
        else if (this.currToken[o7.FIELDS.TYPE] === f6.comment) {
          var h7 = {};
          a4 && (h7.before = a4, a4 = ""), u5 = new cr.default({ value: this.content(), source: $3(this.currToken), sourceIndex: this.currToken[o7.FIELDS.START_POS], spaces: h7 }), s7.push(u5);
        }
      while (++this.position < t);
      if (a4) {
        if (u5) u5.spaces.after = a4;
        else if (!this.options.lossy) {
          var l3 = this.tokens[r3], d6 = this.tokens[this.position - 1];
          s7.push(new lt2.default({ value: "", source: V3(l3[o7.FIELDS.START_LINE], l3[o7.FIELDS.START_COL], d6[o7.FIELDS.END_LINE], d6[o7.FIELDS.END_COL]), sourceIndex: l3[o7.FIELDS.START_POS], spaces: { before: a4, after: "" } }));
        }
      }
      return s7;
    }, n3.convertWhitespaceNodesToSpace = function(t, r3) {
      var s7 = this;
      r3 === void 0 && (r3 = false);
      var a4 = "", u5 = "";
      t.forEach(function(l3) {
        var d6 = s7.lossySpace(l3.spaces.before, r3), S6 = s7.lossySpace(l3.rawSpaceBefore, r3);
        a4 += d6 + s7.lossySpace(l3.spaces.after, r3 && d6.length === 0), u5 += d6 + l3.value + s7.lossySpace(l3.rawSpaceAfter, r3 && S6.length === 0);
      }), u5 === a4 && (u5 = void 0);
      var h7 = { space: a4, rawSpace: u5 };
      return h7;
    }, n3.isNamedCombinator = function(t) {
      return t === void 0 && (t = this.position), this.tokens[t + 0] && this.tokens[t + 0][o7.FIELDS.TYPE] === f6.slash && this.tokens[t + 1] && this.tokens[t + 1][o7.FIELDS.TYPE] === f6.word && this.tokens[t + 2] && this.tokens[t + 2][o7.FIELDS.TYPE] === f6.slash;
    }, n3.namedCombinator = function() {
      if (this.isNamedCombinator()) {
        var t = this.content(this.tokens[this.position + 1]), r3 = (0, P5.unesc)(t).toLowerCase(), s7 = {};
        r3 !== t && (s7.value = "/" + t + "/");
        var a4 = new ht2.default({ value: "/" + r3 + "/", source: V3(this.currToken[o7.FIELDS.START_LINE], this.currToken[o7.FIELDS.START_COL], this.tokens[this.position + 2][o7.FIELDS.END_LINE], this.tokens[this.position + 2][o7.FIELDS.END_COL]), sourceIndex: this.currToken[o7.FIELDS.START_POS], raws: s7 });
        return this.position = this.position + 3, a4;
      } else this.unexpected();
    }, n3.combinator = function() {
      var t = this;
      if (this.content() === "|") return this.namespace();
      var r3 = this.locateNextMeaningfulToken(this.position);
      if (r3 < 0 || this.tokens[r3][o7.FIELDS.TYPE] === f6.comma) {
        var s7 = this.parseWhitespaceEquivalentTokens(r3);
        if (s7.length > 0) {
          var a4 = this.current.last;
          if (a4) {
            var u5 = this.convertWhitespaceNodesToSpace(s7), h7 = u5.space, l3 = u5.rawSpace;
            l3 !== void 0 && (a4.rawSpaceAfter += l3), a4.spaces.after += h7;
          } else s7.forEach(function(L4) {
            return t.newNode(L4);
          });
        }
        return;
      }
      var d6 = this.currToken, S6 = void 0;
      r3 > this.position && (S6 = this.parseWhitespaceEquivalentTokens(r3));
      var O7;
      if (this.isNamedCombinator() ? O7 = this.namedCombinator() : this.currToken[o7.FIELDS.TYPE] === f6.combinator ? (O7 = new ht2.default({ value: this.content(), source: $3(this.currToken), sourceIndex: this.currToken[o7.FIELDS.START_POS] }), this.position++) : _t2[this.currToken[o7.FIELDS.TYPE]] || S6 || this.unexpected(), O7) {
        if (S6) {
          var v6 = this.convertWhitespaceNodesToSpace(S6), E6 = v6.space, A7 = v6.rawSpace;
          O7.spaces.before = E6, O7.rawSpaceBefore = A7;
        }
      } else {
        var x5 = this.convertWhitespaceNodesToSpace(S6, true), _6 = x5.space, I7 = x5.rawSpace;
        I7 || (I7 = _6);
        var q5 = {}, b7 = { spaces: {} };
        _6.endsWith(" ") && I7.endsWith(" ") ? (q5.before = _6.slice(0, _6.length - 1), b7.spaces.before = I7.slice(0, I7.length - 1)) : _6.startsWith(" ") && I7.startsWith(" ") ? (q5.after = _6.slice(1), b7.spaces.after = I7.slice(1)) : b7.value = I7, O7 = new ht2.default({ value: " ", source: dt2(d6, this.tokens[this.position - 1]), sourceIndex: d6[o7.FIELDS.START_POS], spaces: q5, raws: b7 });
      }
      return this.currToken && this.currToken[o7.FIELDS.TYPE] === f6.space && (O7.spaces.after = this.optionalSpace(this.content()), this.position++), this.newNode(O7);
    }, n3.comma = function() {
      if (this.position === this.tokens.length - 1) {
        this.root.trailingComma = true, this.position++;
        return;
      }
      this.current._inferEndPosition();
      var t = new ft2.default({ source: { start: hr(this.tokens[this.position + 1]) } });
      this.current.parent.append(t), this.current = t, this.position++;
    }, n3.comment = function() {
      var t = this.currToken;
      this.newNode(new cr.default({ value: this.content(), source: $3(t), sourceIndex: t[o7.FIELDS.START_POS] })), this.position++;
    }, n3.error = function(t, r3) {
      throw this.root.error(t, r3);
    }, n3.missingBackslash = function() {
      return this.error("Expected a backslash preceding the semicolon.", { index: this.currToken[o7.FIELDS.START_POS] });
    }, n3.missingParenthesis = function() {
      return this.expected("opening parenthesis", this.currToken[o7.FIELDS.START_POS]);
    }, n3.missingSquareBracket = function() {
      return this.expected("opening square bracket", this.currToken[o7.FIELDS.START_POS]);
    }, n3.unexpected = function() {
      return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[o7.FIELDS.START_POS]);
    }, n3.namespace = function() {
      var t = this.prevToken && this.content(this.prevToken) || true;
      if (this.nextToken[o7.FIELDS.TYPE] === f6.word) return this.position++, this.word(t);
      if (this.nextToken[o7.FIELDS.TYPE] === f6.asterisk) return this.position++, this.universal(t);
    }, n3.nesting = function() {
      if (this.nextToken) {
        var t = this.content(this.nextToken);
        if (t === "|") {
          this.position++;
          return;
        }
      }
      var r3 = this.currToken;
      this.newNode(new bs.default({ value: this.content(), source: $3(r3), sourceIndex: r3[o7.FIELDS.START_POS] })), this.position++;
    }, n3.parentheses = function() {
      var t = this.current.last, r3 = 1;
      if (this.position++, t && t.type === xs.PSEUDO) {
        var s7 = new ft2.default({ source: { start: hr(this.tokens[this.position - 1]) } }), a4 = this.current;
        for (t.append(s7), this.current = s7; this.position < this.tokens.length && r3; ) this.currToken[o7.FIELDS.TYPE] === f6.openParenthesis && r3++, this.currToken[o7.FIELDS.TYPE] === f6.closeParenthesis && r3--, r3 ? this.parse() : (this.current.source.end = pr(this.currToken), this.current.parent.source.end = pr(this.currToken), this.position++);
        this.current = a4;
      } else {
        for (var u5 = this.currToken, h7 = "(", l3; this.position < this.tokens.length && r3; ) this.currToken[o7.FIELDS.TYPE] === f6.openParenthesis && r3++, this.currToken[o7.FIELDS.TYPE] === f6.closeParenthesis && r3--, l3 = this.currToken, h7 += this.parseParenthesisToken(this.currToken), this.position++;
        t ? t.appendToPropertyAndEscape("value", h7, h7) : this.newNode(new lt2.default({ value: h7, source: V3(u5[o7.FIELDS.START_LINE], u5[o7.FIELDS.START_COL], l3[o7.FIELDS.END_LINE], l3[o7.FIELDS.END_COL]), sourceIndex: u5[o7.FIELDS.START_POS] }));
      }
      if (r3) return this.expected("closing parenthesis", this.currToken[o7.FIELDS.START_POS]);
    }, n3.pseudo = function() {
      for (var t = this, r3 = "", s7 = this.currToken; this.currToken && this.currToken[o7.FIELDS.TYPE] === f6.colon; ) r3 += this.content(), this.position++;
      if (!this.currToken) return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
      if (this.currToken[o7.FIELDS.TYPE] === f6.word) this.splitWord(false, function(a4, u5) {
        r3 += a4, t.newNode(new Ls.default({ value: r3, source: dt2(s7, t.currToken), sourceIndex: s7[o7.FIELDS.START_POS] })), u5 > 1 && t.nextToken && t.nextToken[o7.FIELDS.TYPE] === f6.openParenthesis && t.error("Misplaced parenthesis.", { index: t.nextToken[o7.FIELDS.START_POS] });
      });
      else return this.expected(["pseudo-class", "pseudo-element"], this.currToken[o7.FIELDS.START_POS]);
    }, n3.space = function() {
      var t = this.content();
      this.position === 0 || this.prevToken[o7.FIELDS.TYPE] === f6.comma || this.prevToken[o7.FIELDS.TYPE] === f6.openParenthesis || this.current.nodes.every(function(r3) {
        return r3.type === "comment";
      }) ? (this.spaces = this.optionalSpace(t), this.position++) : this.position === this.tokens.length - 1 || this.nextToken[o7.FIELDS.TYPE] === f6.comma || this.nextToken[o7.FIELDS.TYPE] === f6.closeParenthesis ? (this.current.last.spaces.after = this.optionalSpace(t), this.position++) : this.combinator();
    }, n3.string = function() {
      var t = this.currToken;
      this.newNode(new lt2.default({ value: this.content(), source: $3(t), sourceIndex: t[o7.FIELDS.START_POS] })), this.position++;
    }, n3.universal = function(t) {
      var r3 = this.nextToken;
      if (r3 && this.content(r3) === "|") return this.position++, this.namespace();
      var s7 = this.currToken;
      this.newNode(new Ds.default({ value: this.content(), source: $3(s7), sourceIndex: s7[o7.FIELDS.START_POS] }), t), this.position++;
    }, n3.splitWord = function(t, r3) {
      for (var s7 = this, a4 = this.nextToken, u5 = this.content(); a4 && ~[f6.dollar, f6.caret, f6.equals, f6.word].indexOf(a4[o7.FIELDS.TYPE]); ) {
        this.position++;
        var h7 = this.content();
        if (u5 += h7, h7.lastIndexOf("\\") === h7.length - 1) {
          var l3 = this.nextToken;
          l3 && l3[o7.FIELDS.TYPE] === f6.space && (u5 += this.requiredSpace(this.content(l3)), this.position++);
        }
        a4 = this.nextToken;
      }
      var d6 = vt2(u5, ".").filter(function(E6) {
        var A7 = u5[E6 - 1] === "\\", x5 = /^\d+\.\d+%$/.test(u5);
        return !A7 && !x5;
      }), S6 = vt2(u5, "#").filter(function(E6) {
        return u5[E6 - 1] !== "\\";
      }), O7 = vt2(u5, "#{");
      O7.length && (S6 = S6.filter(function(E6) {
        return !~O7.indexOf(E6);
      }));
      var v6 = (0, As.default)(Rs([0].concat(d6, S6)));
      v6.forEach(function(E6, A7) {
        var x5 = v6[A7 + 1] || u5.length, _6 = u5.slice(E6, x5);
        if (A7 === 0 && r3) return r3.call(s7, _6, v6.length);
        var I7, q5 = s7.currToken, b7 = q5[o7.FIELDS.START_POS] + v6[A7], L4 = V3(q5[1], q5[2] + E6, q5[3], q5[2] + (x5 - 1));
        if (~d6.indexOf(E6)) {
          var B3 = { value: _6.slice(1), source: L4, sourceIndex: b7 };
          I7 = new ks.default(z5(B3, "value"));
        } else if (~S6.indexOf(E6)) {
          var H4 = { value: _6.slice(1), source: L4, sourceIndex: b7 };
          I7 = new Is.default(z5(H4, "value"));
        } else {
          var Y3 = { value: _6, source: L4, sourceIndex: b7 };
          z5(Y3, "value"), I7 = new qs.default(Y3);
        }
        s7.newNode(I7, t), t = null;
      }), this.position++;
    }, n3.word = function(t) {
      var r3 = this.nextToken;
      return r3 && this.content(r3) === "|" ? (this.position++, this.namespace()) : this.splitWord(t);
    }, n3.loop = function() {
      for (; this.position < this.tokens.length; ) this.parse(true);
      return this.current._inferEndPosition(), this.root;
    }, n3.parse = function(t) {
      switch (this.currToken[o7.FIELDS.TYPE]) {
        case f6.space:
          this.space();
          break;
        case f6.comment:
          this.comment();
          break;
        case f6.openParenthesis:
          this.parentheses();
          break;
        case f6.closeParenthesis:
          t && this.missingParenthesis();
          break;
        case f6.openSquare:
          this.attribute();
          break;
        case f6.dollar:
        case f6.caret:
        case f6.equals:
        case f6.word:
          this.word();
          break;
        case f6.colon:
          this.pseudo();
          break;
        case f6.comma:
          this.comma();
          break;
        case f6.asterisk:
          this.universal();
          break;
        case f6.ampersand:
          this.nesting();
          break;
        case f6.slash:
        case f6.combinator:
          this.combinator();
          break;
        case f6.str:
          this.string();
          break;
        case f6.closeSquare:
          this.missingSquareBracket();
        case f6.semicolon:
          this.missingBackslash();
        default:
          this.unexpected();
      }
    }, n3.expected = function(t, r3, s7) {
      if (Array.isArray(t)) {
        var a4 = t.pop();
        t = t.join(", ") + " or " + a4;
      }
      var u5 = /^[aeiou]/.test(t[0]) ? "an" : "a";
      return s7 ? this.error("Expected " + u5 + " " + t + ', found "' + s7 + '" instead.', { index: r3 }) : this.error("Expected " + u5 + " " + t + ".", { index: r3 });
    }, n3.requiredSpace = function(t) {
      return this.options.lossy ? " " : t;
    }, n3.optionalSpace = function(t) {
      return this.options.lossy ? "" : t;
    }, n3.lossySpace = function(t, r3) {
      return this.options.lossy ? r3 ? " " : "" : t;
    }, n3.parseParenthesisToken = function(t) {
      var r3 = this.content(t);
      return t[o7.FIELDS.TYPE] === f6.space ? this.requiredSpace(r3) : r3;
    }, n3.newNode = function(t, r3) {
      return r3 && (/^ +$/.test(r3) && (this.options.lossy || (this.spaces = (this.spaces || "") + r3), r3 = true), t.namespace = r3, z5(t, "namespace")), this.spaces && (t.spaces.before = this.spaces, this.spaces = ""), this.current.append(t);
    }, n3.content = function(t) {
      return t === void 0 && (t = this.currToken), this.css.slice(t[o7.FIELDS.START_POS], t[o7.FIELDS.END_POS]);
    }, n3.locateNextMeaningfulToken = function(t) {
      t === void 0 && (t = this.position + 1);
      for (var r3 = t; r3 < this.tokens.length; ) if (Ns[this.tokens[r3][o7.FIELDS.TYPE]]) {
        r3++;
        continue;
      } else return r3;
      return -1;
    }, Ms(e, [{ key: "currToken", get: function() {
      return this.tokens[this.position];
    } }, { key: "nextToken", get: function() {
      return this.tokens[this.position + 1];
    } }, { key: "prevToken", get: function() {
      return this.tokens[this.position - 1];
    } }]), e;
  }();
  ve3.default = Fs;
  vr.exports = ve3.default;
});
var gr = T((_e3, Sr) => {
  "use strict";
  _e3.__esModule = true;
  _e3.default = void 0;
  var Cs = Us(_r());
  function Us(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var Ws = function() {
    function e(i4, t) {
      this.func = i4 || function() {
      }, this.funcRes = null, this.options = t;
    }
    var n3 = e.prototype;
    return n3._shouldUpdateSelector = function(t, r3) {
      r3 === void 0 && (r3 = {});
      var s7 = Object.assign({}, this.options, r3);
      return s7.updateSelector === false ? false : typeof t != "string";
    }, n3._isLossy = function(t) {
      t === void 0 && (t = {});
      var r3 = Object.assign({}, this.options, t);
      return r3.lossless === false;
    }, n3._root = function(t, r3) {
      r3 === void 0 && (r3 = {});
      var s7 = new Cs.default(t, this._parseOptions(r3));
      return s7.root;
    }, n3._parseOptions = function(t) {
      return { lossy: this._isLossy(t) };
    }, n3._run = function(t, r3) {
      var s7 = this;
      return r3 === void 0 && (r3 = {}), new Promise(function(a4, u5) {
        try {
          var h7 = s7._root(t, r3);
          Promise.resolve(s7.func(h7)).then(function(l3) {
            var d6 = void 0;
            return s7._shouldUpdateSelector(t, r3) && (d6 = h7.toString(), t.selector = d6), { transform: l3, root: h7, string: d6 };
          }).then(a4, u5);
        } catch (l3) {
          u5(l3);
          return;
        }
      });
    }, n3._runSync = function(t, r3) {
      r3 === void 0 && (r3 = {});
      var s7 = this._root(t, r3), a4 = this.func(s7);
      if (a4 && typeof a4.then == "function") throw new Error("Selector processor returned a promise to a synchronous call.");
      var u5 = void 0;
      return r3.updateSelector && typeof t != "string" && (u5 = s7.toString(), t.selector = u5), { transform: a4, root: s7, string: u5 };
    }, n3.ast = function(t, r3) {
      return this._run(t, r3).then(function(s7) {
        return s7.root;
      });
    }, n3.astSync = function(t, r3) {
      return this._runSync(t, r3).root;
    }, n3.transform = function(t, r3) {
      return this._run(t, r3).then(function(s7) {
        return s7.transform;
      });
    }, n3.transformSync = function(t, r3) {
      return this._runSync(t, r3).transform;
    }, n3.process = function(t, r3) {
      return this._run(t, r3).then(function(s7) {
        return s7.string || s7.root.toString();
      });
    }, n3.processSync = function(t, r3) {
      var s7 = this._runSync(t, r3);
      return s7.string || s7.root.toString();
    }, e;
  }();
  _e3.default = Ws;
  Sr.exports = _e3.default;
});
var Tr = T((w7) => {
  "use strict";
  w7.__esModule = true;
  w7.universal = w7.tag = w7.string = w7.selector = w7.root = w7.pseudo = w7.nesting = w7.id = w7.comment = w7.combinator = w7.className = w7.attribute = void 0;
  var Qs = R5(tt()), Bs = R5(Ce()), Ys = R5(st()), Gs = R5(We()), Vs = R5(Be()), Hs = R5(ut()), Ks = R5(ze()), $s = R5(Me()), zs = R5(Re()), Js = R5(Ke()), Xs = R5(Ve()), Zs = R5(nt());
  function R5(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var js = function(n3) {
    return new Qs.default(n3);
  };
  w7.attribute = js;
  var ea = function(n3) {
    return new Bs.default(n3);
  };
  w7.className = ea;
  var ta = function(n3) {
    return new Ys.default(n3);
  };
  w7.combinator = ta;
  var ra = function(n3) {
    return new Gs.default(n3);
  };
  w7.comment = ra;
  var na = function(n3) {
    return new Vs.default(n3);
  };
  w7.id = na;
  var ia = function(n3) {
    return new Hs.default(n3);
  };
  w7.nesting = ia;
  var sa = function(n3) {
    return new Ks.default(n3);
  };
  w7.pseudo = sa;
  var aa = function(n3) {
    return new $s.default(n3);
  };
  w7.root = aa;
  var ua = function(n3) {
    return new zs.default(n3);
  };
  w7.selector = ua;
  var oa = function(n3) {
    return new Js.default(n3);
  };
  w7.string = oa;
  var ca = function(n3) {
    return new Xs.default(n3);
  };
  w7.tag = ca;
  var fa = function(n3) {
    return new Zs.default(n3);
  };
  w7.universal = fa;
});
var mr = T((g6) => {
  "use strict";
  g6.__esModule = true;
  g6.isNode = St;
  g6.isPseudoElement = Er;
  g6.isPseudoClass = ya;
  g6.isContainer = Ea;
  g6.isNamespace = ma;
  g6.isUniversal = g6.isTag = g6.isString = g6.isSelector = g6.isRoot = g6.isPseudo = g6.isNesting = g6.isIdentifier = g6.isComment = g6.isCombinator = g6.isClassName = g6.isAttribute = void 0;
  var k5 = D2(), M6, la = (M6 = {}, M6[k5.ATTRIBUTE] = true, M6[k5.CLASS] = true, M6[k5.COMBINATOR] = true, M6[k5.COMMENT] = true, M6[k5.ID] = true, M6[k5.NESTING] = true, M6[k5.PSEUDO] = true, M6[k5.ROOT] = true, M6[k5.SELECTOR] = true, M6[k5.STRING] = true, M6[k5.TAG] = true, M6[k5.UNIVERSAL] = true, M6);
  function St(e) {
    return typeof e == "object" && la[e.type];
  }
  function F4(e, n3) {
    return St(n3) && n3.type === e;
  }
  var Or = F4.bind(null, k5.ATTRIBUTE);
  g6.isAttribute = Or;
  var ha = F4.bind(null, k5.CLASS);
  g6.isClassName = ha;
  var pa = F4.bind(null, k5.COMBINATOR);
  g6.isCombinator = pa;
  var da = F4.bind(null, k5.COMMENT);
  g6.isComment = da;
  var va = F4.bind(null, k5.ID);
  g6.isIdentifier = va;
  var _a = F4.bind(null, k5.NESTING);
  g6.isNesting = _a;
  var gt2 = F4.bind(null, k5.PSEUDO);
  g6.isPseudo = gt2;
  var Sa = F4.bind(null, k5.ROOT);
  g6.isRoot = Sa;
  var ga = F4.bind(null, k5.SELECTOR);
  g6.isSelector = ga;
  var Ta = F4.bind(null, k5.STRING);
  g6.isString = Ta;
  var yr = F4.bind(null, k5.TAG);
  g6.isTag = yr;
  var Oa = F4.bind(null, k5.UNIVERSAL);
  g6.isUniversal = Oa;
  function Er(e) {
    return gt2(e) && e.value && (e.value.startsWith("::") || e.value.toLowerCase() === ":before" || e.value.toLowerCase() === ":after" || e.value.toLowerCase() === ":first-letter" || e.value.toLowerCase() === ":first-line");
  }
  function ya(e) {
    return gt2(e) && !Er(e);
  }
  function Ea(e) {
    return !!(St(e) && e.walk);
  }
  function ma(e) {
    return Or(e) || yr(e);
  }
});
var wr = T((C5) => {
  "use strict";
  C5.__esModule = true;
  var Tt = D2();
  Object.keys(Tt).forEach(function(e) {
    e === "default" || e === "__esModule" || e in C5 && C5[e] === Tt[e] || (C5[e] = Tt[e]);
  });
  var Ot = Tr();
  Object.keys(Ot).forEach(function(e) {
    e === "default" || e === "__esModule" || e in C5 && C5[e] === Ot[e] || (C5[e] = Ot[e]);
  });
  var yt2 = mr();
  Object.keys(yt2).forEach(function(e) {
    e === "default" || e === "__esModule" || e in C5 && C5[e] === yt2[e] || (C5[e] = yt2[e]);
  });
});
var Ir = T((Se2, kr) => {
  "use strict";
  Se2.__esModule = true;
  Se2.default = void 0;
  var wa = Ia(gr()), Pa = ka(wr());
  function Pr() {
    if (typeof WeakMap != "function") return null;
    var e = /* @__PURE__ */ new WeakMap();
    return Pr = function() {
      return e;
    }, e;
  }
  function ka(e) {
    if (e && e.__esModule) return e;
    if (e === null || typeof e != "object" && typeof e != "function") return { default: e };
    var n3 = Pr();
    if (n3 && n3.has(e)) return n3.get(e);
    var i4 = {}, t = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var r3 in e) if (Object.prototype.hasOwnProperty.call(e, r3)) {
      var s7 = t ? Object.getOwnPropertyDescriptor(e, r3) : null;
      s7 && (s7.get || s7.set) ? Object.defineProperty(i4, r3, s7) : i4[r3] = e[r3];
    }
    return i4.default = e, n3 && n3.set(e, i4), i4;
  }
  function Ia(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var Et2 = function(n3) {
    return new wa.default(n3);
  };
  Object.assign(Et2, Pa);
  delete Et2.__esModule;
  var qa = Et2;
  Se2.default = qa;
  kr.exports = Se2.default;
});
var De = Wr(Ir());
var { TAG: Ca, STRING: Ua, SELECTOR: Wa, ROOT: Qa, PSEUDO: Ba, NESTING: Ya, ID: Ga, COMMENT: Va, COMBINATOR: Ha, CLASS: Ka, ATTRIBUTE: $a, UNIVERSAL: za, attribute: Ja, className: Xa, combinator: Za, comment: ja, id: eu, nesting: tu, pseudo: ru, root: nu, selector: iu, string: su, tag: au, universal: uu, isNode: ou, isPseudoElement: cu, isPseudoClass: fu, isContainer: lu, isNamespace: hu, isAttribute: pu, isClassName: du, isCombinator: vu, isComment: _u, isIdentifier: Su, isNesting: gu, isPseudo: Tu, isRoot: Ou, isSelector: yu, isString: Eu, isTag: mu, isUniversal: wu } = De;
var Pu = De.default ?? De;

// esm:https://esm.sh/*tailwindcss@3.4.19/colors?target=esnext&lp=node_modules%252Ftailwindcss
var colors_target_esnext_lp_node_modules_252Ftailwindcss_exports = {};
__export(colors_target_esnext_lp_node_modules_252Ftailwindcss_exports, {
  default: () => I6
});

// esm:https://esm.sh/node/async_hooks.mjs?lp=node_modules%252Ftailwindcss
var c3 = class {
  __unenv__ = true;
  _currentStore;
  _enterStore;
  _enabled = true;
  getStore() {
    return this._currentStore ?? this._enterStore;
  }
  disable() {
    this._enabled = false;
  }
  enable() {
    this._enabled = true;
  }
  enterWith(e) {
    this._enterStore = e;
  }
  run(e, r3, ...t) {
    this._currentStore = e;
    let n3 = r3(...t);
    return this._currentStore = void 0, n3;
  }
  exit(e, ...r3) {
    let t = this._currentStore;
    this._currentStore = void 0;
    let n3 = e(...r3);
    return this._currentStore = t, n3;
  }
  static snapshot() {
    throw new Error("[unenv] `AsyncLocalStorage.snapshot` is not implemented!");
  }
};
var S2 = globalThis.AsyncLocalStorage || c3;
var R = Symbol("init");
var a2 = Symbol("before");
var o3 = Symbol("after");
var i3 = Symbol("destroy");
var A2 = Symbol("promiseResolve");
var T2 = class {
  __unenv__ = true;
  _enabled = false;
  _callbacks = {};
  constructor(e = {}) {
    this._callbacks = e;
  }
  enable() {
    return this._enabled = true, this;
  }
  disable() {
    return this._enabled = false, this;
  }
  get [R]() {
    return this._callbacks.init;
  }
  get [a2]() {
    return this._callbacks.before;
  }
  get [o3]() {
    return this._callbacks.after;
  }
  get [i3]() {
    return this._callbacks.destroy;
  }
  get [A2]() {
    return this._callbacks.promiseResolve;
  }
};
var s3 = function() {
  return 0;
};
var I2 = Object.assign(/* @__PURE__ */ Object.create(null), { NONE: 0, DIRHANDLE: 1, DNSCHANNEL: 2, ELDHISTOGRAM: 3, FILEHANDLE: 4, FILEHANDLECLOSEREQ: 5, BLOBREADER: 6, FSEVENTWRAP: 7, FSREQCALLBACK: 8, FSREQPROMISE: 9, GETADDRINFOREQWRAP: 10, GETNAMEINFOREQWRAP: 11, HEAPSNAPSHOT: 12, HTTP2SESSION: 13, HTTP2STREAM: 14, HTTP2PING: 15, HTTP2SETTINGS: 16, HTTPINCOMINGMESSAGE: 17, HTTPCLIENTREQUEST: 18, JSSTREAM: 19, JSUDPWRAP: 20, MESSAGEPORT: 21, PIPECONNECTWRAP: 22, PIPESERVERWRAP: 23, PIPEWRAP: 24, PROCESSWRAP: 25, PROMISE: 26, QUERYWRAP: 27, QUIC_ENDPOINT: 28, QUIC_LOGSTREAM: 29, QUIC_PACKET: 30, QUIC_SESSION: 31, QUIC_STREAM: 32, QUIC_UDP: 33, SHUTDOWNWRAP: 34, SIGNALWRAP: 35, STATWATCHER: 36, STREAMPIPE: 37, TCPCONNECTWRAP: 38, TCPSERVERWRAP: 39, TCPWRAP: 40, TTYWRAP: 41, UDPSENDWRAP: 42, UDPWRAP: 43, SIGINTWATCHDOG: 44, WORKER: 45, WORKERHEAPSNAPSHOT: 46, WRITEWRAP: 47, ZLIB: 48, CHECKPRIMEREQUEST: 49, PBKDF2REQUEST: 50, KEYPAIRGENREQUEST: 51, KEYGENREQUEST: 52, KEYEXPORTREQUEST: 53, CIPHERREQUEST: 54, DERIVEBITSREQUEST: 55, HASHREQUEST: 56, RANDOMBYTESREQUEST: 57, RANDOMPRIMEREQUEST: 58, SCRYPTREQUEST: 59, SIGNREQUEST: 60, TLSWRAP: 61, VERIFYREQUEST: 62 });
var _2 = 100;
var y4 = class {
  __unenv__ = true;
  type;
  _asyncId;
  _triggerAsyncId;
  constructor(e, r3 = s3()) {
    this.type = e, this._asyncId = -1 * _2++, this._triggerAsyncId = typeof r3 == "number" ? r3 : r3?.triggerAsyncId;
  }
  static bind(e, r3, t) {
    return new E(r3 ?? "anonymous").bind(e);
  }
  bind(e, r3) {
    let t = (...n3) => this.runInAsyncScope(e, r3, ...n3);
    return t.asyncResource = this, t;
  }
  runInAsyncScope(e, r3, ...t) {
    return e.apply(r3, t);
  }
  emitDestroy() {
    return this;
  }
  asyncId() {
    return this._asyncId;
  }
  triggerAsyncId() {
    return this._triggerAsyncId;
  }
};
var E = globalThis.AsyncResource || y4;

// esm:https://esm.sh/node/events.mjs?lp=node_modules%252Ftailwindcss
function te(e) {
  return new Error(`[unenv] ${e} is not implemented yet!`);
}
function w3(e) {
  return Object.assign(() => {
    throw te(e);
  }, { __unenv__: true });
}
var y5 = 10;
var ne = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
}).prototype);
var G = (e, t) => e;
var _3 = Error;
var ie = Error;
var v2 = Error;
var b4 = Error;
var se = Error;
var C2 = Symbol.for("nodejs.rejection");
var f3 = Symbol.for("kCapture");
var M3 = Symbol.for("events.errorMonitor");
var d4 = Symbol.for("shapeMode");
var x2 = Symbol.for("events.maxEventTargetListeners");
var oe = Symbol.for("kEnhanceStackBeforeInspector");
var ue = Symbol.for("nodejs.watermarkData");
var S3 = Symbol.for("kEventEmitter");
var h3 = Symbol.for("kAsyncResource");
var le = Symbol.for("kFirstEventParam");
var P2 = Symbol.for("kResistStopPropagation");
var W2 = Symbol.for("events.maxEventTargetListenersWarned");
var U2 = class E2 {
  _events = void 0;
  _eventsCount = 0;
  _maxListeners = y5;
  [f3] = false;
  [d4] = false;
  static captureRejectionSymbol = C2;
  static errorMonitor = M3;
  static kMaxEventTargetListeners = x2;
  static kMaxEventTargetListenersWarned = W2;
  static usingDomains = false;
  static get on() {
    return fe;
  }
  static get once() {
    return he;
  }
  static get getEventListeners() {
    return ve;
  }
  static get getMaxListeners() {
    return me;
  }
  static get addAbortListener() {
    return X;
  }
  static get EventEmitterAsyncResource() {
    return ae;
  }
  static get EventEmitter() {
    return E2;
  }
  static setMaxListeners(t = y5, ...r3) {
    if (r3.length === 0) y5 = t;
    else for (let n3 of r3) if (J2(n3)) n3[x2] = t, n3[W2] = false;
    else if (typeof n3.setMaxListeners == "function") n3.setMaxListeners(t);
    else throw new v2("eventTargets", ["EventEmitter", "EventTarget"], n3);
  }
  static listenerCount(t, r3) {
    if (typeof t.listenerCount == "function") return t.listenerCount(r3);
    E2.prototype.listenerCount.call(t, r3);
  }
  static init() {
    throw new Error("EventEmitter.init() is not implemented.");
  }
  static get captureRejections() {
    return this[f3];
  }
  static set captureRejections(t) {
    this[f3] = t;
  }
  static get defaultMaxListeners() {
    return y5;
  }
  static set defaultMaxListeners(t) {
    y5 = t;
  }
  constructor(t) {
    this._events === void 0 || this._events === Object.getPrototypeOf(this)._events ? (this._events = { __proto__: null }, this._eventsCount = 0, this[d4] = false) : this[d4] = true, this._maxListeners = this._maxListeners || void 0, t?.captureRejections ? this[f3] = !!t.captureRejections : this[f3] = E2.prototype[f3];
  }
  setMaxListeners(t) {
    return this._maxListeners = t, this;
  }
  getMaxListeners() {
    return T3(this);
  }
  emit(t, ...r3) {
    let n3 = t === "error", i4 = this._events;
    if (i4 !== void 0) n3 && i4[M3] !== void 0 && this.emit(M3, ...r3), n3 = n3 && i4.error === void 0;
    else if (!n3) return false;
    if (n3) {
      let s7;
      if (r3.length > 0 && (s7 = r3[0]), s7 instanceof Error) {
        try {
          let c5 = {};
          Error.captureStackTrace?.(c5, E2.prototype.emit), Object.defineProperty(s7, oe, { __proto__: null, value: Function.prototype.bind(de, this, s7, c5), configurable: true });
        } catch {
        }
        throw s7;
      }
      let l3;
      try {
        l3 = G(s7);
      } catch {
        l3 = s7;
      }
      let a4 = new ie(l3);
      throw a4.context = s7, a4;
    }
    let o7 = i4[t];
    if (o7 === void 0) return false;
    if (typeof o7 == "function") {
      let s7 = o7.apply(this, r3);
      s7 != null && K2(this, s7, t, r3);
    } else {
      let s7 = o7.length, l3 = I3(o7);
      for (let a4 = 0; a4 < s7; ++a4) {
        let c5 = l3[a4].apply(this, r3);
        c5 != null && K2(this, c5, t, r3);
      }
    }
    return true;
  }
  addListener(t, r3) {
    return q(this, t, r3, false), this;
  }
  on(t, r3) {
    return this.addListener(t, r3);
  }
  prependListener(t, r3) {
    return q(this, t, r3, true), this;
  }
  once(t, r3) {
    return this.on(t, z(this, t, r3)), this;
  }
  prependOnceListener(t, r3) {
    return this.prependListener(t, z(this, t, r3)), this;
  }
  removeListener(t, r3) {
    let n3 = this._events;
    if (n3 === void 0) return this;
    let i4 = n3[t];
    if (i4 === void 0) return this;
    if (i4 === r3 || i4.listener === r3) this._eventsCount -= 1, this[d4] ? n3[t] = void 0 : this._eventsCount === 0 ? this._events = { __proto__: null } : (delete n3[t], n3.removeListener && this.emit("removeListener", t, i4.listener || r3));
    else if (typeof i4 != "function") {
      let o7 = -1;
      for (let s7 = i4.length - 1; s7 >= 0; s7--) if (i4[s7] === r3 || i4[s7].listener === r3) {
        o7 = s7;
        break;
      }
      if (o7 < 0) return this;
      o7 === 0 ? i4.shift() : ge2(i4, o7), i4.length === 1 && (n3[t] = i4[0]), n3.removeListener !== void 0 && this.emit("removeListener", t, r3);
    }
    return this;
  }
  off(t, r3) {
    return this.removeListener(t, r3);
  }
  removeAllListeners(t) {
    let r3 = this._events;
    if (r3 === void 0) return this;
    if (r3.removeListener === void 0) return arguments.length === 0 ? (this._events = { __proto__: null }, this._eventsCount = 0) : r3[t] !== void 0 && (--this._eventsCount === 0 ? this._events = { __proto__: null } : delete r3[t]), this[d4] = false, this;
    if (arguments.length === 0) {
      for (let i4 of Reflect.ownKeys(r3)) i4 !== "removeListener" && this.removeAllListeners(i4);
      return this.removeAllListeners("removeListener"), this._events = { __proto__: null }, this._eventsCount = 0, this[d4] = false, this;
    }
    let n3 = r3[t];
    if (typeof n3 == "function") this.removeListener(t, n3);
    else if (n3 !== void 0) for (let i4 = n3.length - 1; i4 >= 0; i4--) this.removeListener(t, n3[i4]);
    return this;
  }
  listeners(t) {
    return B(this, t, true);
  }
  rawListeners(t) {
    return B(this, t, false);
  }
  eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  }
  listenerCount(t, r3) {
    let n3 = this._events;
    if (n3 !== void 0) {
      let i4 = n3[t];
      if (typeof i4 == "function") return r3 != null ? r3 === i4 || r3 === i4.listener ? 1 : 0 : 1;
      if (i4 !== void 0) {
        if (r3 != null) {
          let o7 = 0;
          for (let s7 = 0, l3 = i4.length; s7 < l3; s7++) (i4[s7] === r3 || i4[s7].listener === r3) && o7++;
          return o7;
        }
        return i4.length;
      }
    }
    return 0;
  }
};
var ae = class extends U2 {
  constructor(e) {
    let t;
    typeof e == "string" ? (t = e, e = void 0) : t = e?.name || new.target.name, super(e), this[h3] = new ce(this, t, e);
  }
  emit(e, ...t) {
    if (this[h3] === void 0) throw new _3("EventEmitterAsyncResource");
    let { asyncResource: r3 } = this;
    return Array.prototype.unshift(t, super.emit, this, e), Reflect.apply(r3.runInAsyncScope, r3, t);
  }
  emitDestroy() {
    if (this[h3] === void 0) throw new _3("EventEmitterAsyncResource");
    this.asyncResource.emitDestroy();
  }
  get asyncId() {
    if (this[h3] === void 0) throw new _3("EventEmitterAsyncResource");
    return this.asyncResource.asyncId();
  }
  get triggerAsyncId() {
    if (this[h3] === void 0) throw new _3("EventEmitterAsyncResource");
    return this.asyncResource.triggerAsyncId();
  }
  get asyncResource() {
    if (this[h3] === void 0) throw new _3("EventEmitterAsyncResource");
    return this[h3];
  }
};
var ce = class extends E {
  constructor(e, t, r3) {
    super(t, r3), this[S3] = e;
  }
  get eventEmitter() {
    if (this[S3] === void 0) throw new _3("EventEmitterReferencingAsyncResource");
    return this[S3];
  }
};
var fe = function(e, t, r3 = {}) {
  let n3 = r3.signal;
  if (n3?.aborted) throw new b4(void 0, { cause: n3?.reason });
  let i4 = r3.highWaterMark ?? r3.highWatermark ?? Number.MAX_SAFE_INTEGER, o7 = r3.lowWaterMark ?? r3.lowWatermark ?? 1, s7 = new N(), l3 = new N(), a4 = false, c5 = null, m6 = false, p4 = 0, Q3 = Object.setPrototypeOf({ next() {
    if (p4) {
      let u5 = s7.shift();
      return p4--, a4 && p4 < o7 && (e.resume?.(), a4 = false), Promise.resolve(k(u5, false));
    }
    if (c5) {
      let u5 = Promise.reject(c5);
      return c5 = null, u5;
    }
    return m6 ? L4() : new Promise(function(u5, ee3) {
      l3.push({ resolve: u5, reject: ee3 });
    });
  }, return() {
    return L4();
  }, throw(u5) {
    if (!u5 || !(u5 instanceof Error)) throw new v2("EventEmitter.AsyncIterator", "Error", u5);
    R5(u5);
  }, [Symbol.asyncIterator]() {
    return this;
  }, [ue]: { get size() {
    return p4;
  }, get low() {
    return o7;
  }, get high() {
    return i4;
  }, get isPaused() {
    return a4;
  } } }, ne), { addEventListener: A7, removeAll: V3 } = Ee();
  A7(e, t, r3[le] ? $3 : function(...u5) {
    return $3(u5);
  }), t !== "error" && typeof e.on == "function" && A7(e, "error", R5);
  let F4 = r3?.close;
  if (F4?.length) for (let u5 of F4) A7(e, u5, L4);
  let Y3 = n3 ? X(n3, Z3) : null;
  return Q3;
  function Z3() {
    R5(new b4(void 0, { cause: n3?.reason }));
  }
  function $3(u5) {
    l3.isEmpty() ? (p4++, !a4 && p4 > i4 && (a4 = true, e.pause?.()), s7.push(u5)) : l3.shift().resolve(k(u5, false));
  }
  function R5(u5) {
    l3.isEmpty() ? c5 = u5 : l3.shift().reject(u5), L4();
  }
  function L4() {
    Y3?.[Symbol.dispose](), V3(), m6 = true;
    let u5 = k(void 0, true);
    for (; !l3.isEmpty(); ) l3.shift().resolve(u5);
    return Promise.resolve(u5);
  }
};
var he = async function(e, t, r3 = {}) {
  let n3 = r3?.signal;
  if (n3?.aborted) throw new b4(void 0, { cause: n3?.reason });
  return new Promise((i4, o7) => {
    let s7 = (m6) => {
      typeof e.removeListener == "function" && e.removeListener(t, l3), n3 != null && g4(n3, "abort", c5), o7(m6);
    }, l3 = (...m6) => {
      typeof e.removeListener == "function" && e.removeListener("error", s7), n3 != null && g4(n3, "abort", c5), i4(m6);
    }, a4 = { __proto__: null, once: true, [P2]: true };
    O2(e, t, l3, a4), t !== "error" && typeof e.once == "function" && e.once("error", s7);
    function c5() {
      g4(e, t, l3), g4(e, "error", s7), o7(new b4(void 0, { cause: n3?.reason }));
    }
    n3 != null && O2(n3, "abort", c5, { __proto__: null, once: true, [P2]: true });
  });
};
var X = function(e, t) {
  if (e === void 0) throw new v2("signal", "AbortSignal", e);
  let r3;
  return e.aborted ? queueMicrotask(() => t()) : (e.addEventListener("abort", t, { __proto__: null, once: true, [P2]: true }), r3 = () => {
    e.removeEventListener("abort", t);
  }), { __proto__: null, [Symbol.dispose]() {
    r3?.();
  } };
};
var ve = function(e, t) {
  if (typeof e.listeners == "function") return e.listeners(t);
  if (J2(e)) {
    let r3 = e[kEvents].get(t), n3 = [], i4 = r3?.next;
    for (; i4?.listener !== void 0; ) {
      let o7 = i4.listener?.deref ? i4.listener.deref() : i4.listener;
      n3.push(o7), i4 = i4.next;
    }
    return n3;
  }
  throw new v2("emitter", ["EventEmitter", "EventTarget"], e);
};
var me = function(e) {
  if (typeof e?.getMaxListeners == "function") return T3(e);
  if (e?.[x2]) return e[x2];
  throw new v2("emitter", ["EventEmitter", "EventTarget"], e);
};
var H = 2048;
var j2 = H - 1;
var D3 = class {
  bottom;
  top;
  list;
  next;
  constructor() {
    this.bottom = 0, this.top = 0, this.list = new Array(H), this.next = null;
  }
  isEmpty() {
    return this.top === this.bottom;
  }
  isFull() {
    return (this.top + 1 & j2) === this.bottom;
  }
  push(e) {
    this.list[this.top] = e, this.top = this.top + 1 & j2;
  }
  shift() {
    let e = this.list[this.bottom];
    return e === void 0 ? null : (this.list[this.bottom] = void 0, this.bottom = this.bottom + 1 & j2, e);
  }
};
var N = class {
  head;
  tail;
  constructor() {
    this.head = this.tail = new D3();
  }
  isEmpty() {
    return this.head.isEmpty();
  }
  push(e) {
    this.head.isFull() && (this.head = this.head.next = new D3()), this.head.push(e);
  }
  shift() {
    let e = this.tail, t = e.shift();
    return e.isEmpty() && e.next !== null && (this.tail = e.next, e.next = null), t;
  }
};
function J2(e) {
  return typeof e?.addEventListener == "function";
}
function K2(e, t, r3, n3) {
  if (e[f3]) try {
    let i4 = t.then;
    typeof i4 == "function" && i4.call(t, void 0, function(o7) {
      setTimeout(pe, 0, e, o7, r3, n3);
    });
  } catch (i4) {
    e.emit("error", i4);
  }
}
function pe(e, t, r3, n3) {
  if (typeof e[C2] == "function") e[C2](t, r3, ...n3);
  else {
    let i4 = e[f3];
    try {
      e[f3] = false, e.emit("error", t);
    } finally {
      e[f3] = i4;
    }
  }
}
function T3(e) {
  return e._maxListeners === void 0 ? y5 : e._maxListeners;
}
function de(e, t) {
  let r3 = "";
  try {
    let { name: o7 } = this.constructor;
    o7 !== "EventEmitter" && (r3 = ` on ${o7} instance`);
  } catch {
  }
  let n3 = `
Emitted 'error' event${r3} at:
`, i4 = (t.stack || "").split(`
`).slice(1);
  return e.stack + n3 + i4.join(`
`);
}
function q(e, t, r3, n3) {
  let i4, o7, s7;
  if (o7 = e._events, o7 === void 0 ? (o7 = e._events = { __proto__: null }, e._eventsCount = 0) : (o7.newListener !== void 0 && (e.emit("newListener", t, r3.listener ?? r3), o7 = e._events), s7 = o7[t]), s7 === void 0) o7[t] = r3, ++e._eventsCount;
  else if (typeof s7 == "function" ? s7 = o7[t] = n3 ? [r3, s7] : [s7, r3] : n3 ? s7.unshift(r3) : s7.push(r3), i4 = T3(e), i4 > 0 && s7.length > i4 && !s7.warned) {
    s7.warned = true;
    let l3 = new se(`Possible EventEmitter memory leak detected. ${s7.length} ${String(t)} listeners added to ${G(e, { depth: -1 })}. MaxListeners is ${i4}. Use emitter.setMaxListeners() to increase limit`, { name: "MaxListenersExceededWarning", emitter: e, type: t, count: s7.length });
    console.warn(l3);
  }
  return e;
}
function ye() {
  if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function z(e, t, r3) {
  let n3 = { fired: false, wrapFn: void 0, target: e, type: t, listener: r3 }, i4 = ye.bind(n3);
  return i4.listener = r3, n3.wrapFn = i4, i4;
}
function B(e, t, r3) {
  let n3 = e._events;
  if (n3 === void 0) return [];
  let i4 = n3[t];
  return i4 === void 0 ? [] : typeof i4 == "function" ? r3 ? [i4.listener || i4] : [i4] : r3 ? _e(i4) : I3(i4);
}
function I3(e) {
  switch (e.length) {
    case 2:
      return [e[0], e[1]];
    case 3:
      return [e[0], e[1], e[2]];
    case 4:
      return [e[0], e[1], e[2], e[3]];
    case 5:
      return [e[0], e[1], e[2], e[3], e[4]];
    case 6:
      return [e[0], e[1], e[2], e[3], e[4], e[5]];
  }
  return Array.prototype.slice.call(e);
}
function _e(e) {
  let t = I3(e);
  for (let r3 = 0; r3 < t.length; ++r3) {
    let n3 = t[r3].listener;
    typeof n3 == "function" && (t[r3] = n3);
  }
  return t;
}
function k(e, t) {
  return { value: e, done: t };
}
function g4(e, t, r3, n3) {
  if (typeof e.removeListener == "function") e.removeListener(t, r3);
  else if (typeof e.removeEventListener == "function") e.removeEventListener(t, r3, n3);
  else throw new v2("emitter", "EventEmitter", e);
}
function O2(e, t, r3, n3) {
  if (typeof e.on == "function") n3?.once ? e.once(t, r3) : e.on(t, r3);
  else if (typeof e.addEventListener == "function") e.addEventListener(t, r3, n3);
  else throw new v2("emitter", "EventEmitter", e);
}
function Ee() {
  let e = [];
  return { addEventListener(t, r3, n3, i4) {
    O2(t, r3, n3, i4), Array.prototype.push(e, [t, r3, n3, i4]);
  }, removeAll() {
    for (; e.length > 0; ) Reflect.apply(g4, void 0, e.pop());
  } };
}
function ge2(e, t) {
  for (; t + 1 < e.length; t++) e[t] = e[t + 1];
  e.pop();
}
var Me2 = Symbol.for("nodejs.rejection");
var je = Symbol.for("events.errorMonitor");
var Ce2 = w3("node:events.setMaxListeners");
var Pe2 = w3("node:events.listenerCount");
var Oe = w3("node:events.init");

// esm:https://esm.sh/node/tty.mjs?lp=node_modules%252Ftailwindcss
var o4 = class {
  fd;
  isRaw = false;
  isTTY = false;
  constructor(t) {
    this.fd = t;
  }
  setRawMode(t) {
    return this.isRaw = t, this;
  }
};
var s4 = class {
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(t) {
    this.fd = t;
  }
  clearLine(t, r3) {
    return r3 && r3(), false;
  }
  clearScreenDown(t) {
    return t && t(), false;
  }
  cursorTo(t, r3, e) {
    return e && typeof e == "function" && e(), false;
  }
  moveCursor(t, r3, e) {
    return e && e(), false;
  }
  getColorDepth(t) {
    return 1;
  }
  hasColors(t, r3) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(t, r3, e) {
    t instanceof Uint8Array && (t = new TextDecoder().decode(t));
    try {
      console.log(t);
    } catch {
    }
    return e && typeof e == "function" && e(), false;
  }
};

// esm:https://esm.sh/node/process.mjs?lp=node_modules%252Ftailwindcss
function r2(t) {
  return new Error(`[unenv] ${t} is not implemented yet!`);
}
function a3(t) {
  return Object.assign(() => {
    throw r2(t);
  }, { __unenv__: true });
}
var v3 = "22.14.0";
var _4 = class m5 extends U2 {
  env;
  hrtime;
  nextTick;
  constructor(e) {
    super(), this.env = e.env, this.hrtime = e.hrtime, this.nextTick = e.nextTick;
    for (let s7 of [...Object.getOwnPropertyNames(m5.prototype), ...Object.getOwnPropertyNames(U2.prototype)]) {
      let i4 = this[s7];
      typeof i4 == "function" && (this[s7] = i4.bind(this));
    }
  }
  emitWarning(e, s7, i4) {
    console.warn(`${i4 ? `[${i4}] ` : ""}${s7 ? `${s7}: ` : ""}${e}`);
  }
  emit(...e) {
    return super.emit(...e);
  }
  listeners(e) {
    return super.listeners(e);
  }
  #t;
  #s;
  #r;
  get stdin() {
    return this.#t ??= new o4(0);
  }
  get stdout() {
    return this.#s ??= new s4(1);
  }
  get stderr() {
    return this.#r ??= new s4(2);
  }
  #e = "/";
  chdir(e) {
    this.#e = e;
  }
  cwd() {
    return this.#e;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${v3}`;
  }
  get versions() {
    return { node: v3 };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw r2("process.umask");
  }
  getBuiltinModule() {
  }
  getActiveResourcesInfo() {
    throw r2("process.getActiveResourcesInfo");
  }
  exit() {
    throw r2("process.exit");
  }
  reallyExit() {
    throw r2("process.reallyExit");
  }
  kill() {
    throw r2("process.kill");
  }
  abort() {
    throw r2("process.abort");
  }
  dlopen() {
    throw r2("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw r2("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw r2("process.loadEnvFile");
  }
  disconnect() {
    throw r2("process.disconnect");
  }
  cpuUsage() {
    throw r2("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw r2("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw r2("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw r2("process.initgroups");
  }
  openStdin() {
    throw r2("process.openStdin");
  }
  assert() {
    throw r2("process.assert");
  }
  binding() {
    throw r2("process.binding");
  }
  permission = { has: a3("process.permission.has") };
  report = { directory: "", filename: "", signal: "SIGUSR2", compact: false, reportOnFatalError: false, reportOnSignal: false, reportOnUncaughtException: false, getReport: a3("process.report.getReport"), writeReport: a3("process.report.writeReport") };
  finalization = { register: a3("process.finalization.register"), unregister: a3("process.finalization.unregister"), registerBeforeExit: a3("process.finalization.registerBeforeExit") };
  memoryUsage = Object.assign(() => ({ arrayBuffers: 0, rss: 0, external: 0, heapTotal: 0, heapUsed: 0 }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
var u3 = /* @__PURE__ */ Object.create(null);
var b5 = globalThis.process;
var o5 = (t) => globalThis.__env__ || b5?.env || (t ? u3 : globalThis);
var x3 = new Proxy(u3, { get(t, e) {
  return o5()[e] ?? u3[e];
}, has(t, e) {
  let s7 = o5();
  return e in s7 || e in u3;
}, set(t, e, s7) {
  let i4 = o5(true);
  return i4[e] = s7, true;
}, deleteProperty(t, e) {
  let s7 = o5(true);
  return delete s7[e], true;
}, ownKeys() {
  let t = o5();
  return Object.keys(t);
}, getOwnPropertyDescriptor(t, e) {
  let s7 = o5();
  if (e in s7) return { value: s7[e], writable: true, enumerable: true, configurable: true };
} });
var w4 = Object.assign(function(t) {
  let e = Date.now(), s7 = Math.trunc(e / 1e3), i4 = e % 1e3 * 1e6;
  if (t) {
    let d6 = s7 - t[0], n3 = i4 - t[0];
    return n3 < 0 && (d6 = d6 - 1, n3 = 1e9 + n3), [d6, n3];
  }
  return [s7, i4];
}, { bigint: function() {
  return BigInt(Date.now() * 1e6);
} });
var E3 = globalThis.queueMicrotask ? (t, ...e) => {
  globalThis.queueMicrotask(t.bind(void 0, ...e));
} : k2();
function k2() {
  let t = [], e = false, s7, i4 = -1;
  function d6() {
    !e || !s7 || (e = false, s7.length > 0 ? t = [...s7, ...t] : i4 = -1, t.length > 0 && n3());
  }
  function n3() {
    if (e) return;
    let c5 = setTimeout(d6);
    e = true;
    let l3 = t.length;
    for (; l3; ) {
      for (s7 = t, t = []; ++i4 < l3; ) s7 && s7[i4]();
      i4 = -1, l3 = t.length;
    }
    s7 = void 0, e = false, clearTimeout(c5);
  }
  return (c5, ...l3) => {
    t.push(c5.bind(void 0, ...l3)), t.length === 1 && !e && setTimeout(n3);
  };
}
var h4 = new _4({ env: x3, hrtime: w4, nextTick: E3 });
var A3 = h4;
var { abort: O3, addListener: T4, allowedNodeEnvironmentFlags: S4, hasUncaughtExceptionCaptureCallback: N2, setUncaughtExceptionCaptureCallback: R2, loadEnvFile: I4, sourceMapsEnabled: B2, arch: j3, argv: D4, argv0: F, chdir: $, config: z2, connected: q2, constrainedMemory: W3, availableMemory: H2, cpuUsage: Q, cwd: G2, debugPort: K3, dlopen: J3, disconnect: V, emit: X2, emitWarning: Y, env: Z, eventNames: ee, execArgv: te2, execPath: se2, exit: re, finalization: ie2, features: ne2, getBuiltinModule: ae2, getActiveResourcesInfo: oe2, getMaxListeners: de2, hrtime: le2, kill: ue2, listeners: ce2, listenerCount: ge3, memoryUsage: pe2, nextTick: ve2, on: me2, off: he2, once: fe2, pid: _e2, platform: be2, ppid: xe, prependListener: we2, prependOnceListener: Ee2, rawListeners: ke, release: ye2, removeAllListeners: Me3, removeListener: Ce3, report: Le, resourceUsage: Pe3, setMaxListeners: Ue, setSourceMapsEnabled: Ae, stderr: Oe2, stdin: Te, stdout: Se, title: Ne, umask: Re2, uptime: Ie, version: Be2, versions: je2, domain: De2, initgroups: Fe, moduleLoadList: $e, reallyExit: ze2, openStdin: qe, assert: We2, binding: He, send: Qe, exitCode: Ge, channel: Ke2, getegid: Je, geteuid: Ve2, getgid: Xe, getgroups: Ye, getuid: Ze, setegid: et, seteuid: tt2, setgid: st2, setgroups: rt, setuid: it, permission: nt2, mainModule: at, ref: ot2, unref: dt, _events: lt, _eventsCount: ut2, _exiting: ct, _maxListeners: gt, _debugEnd: pt, _debugProcess: vt, _fatalException: mt2, _getActiveHandles: ht, _getActiveRequests: ft, _kill: _t, _preload_modules: bt, _rawDebug: xt, _startProfilerIdleNotifier: wt, _stopProfilerIdleNotifier: Et, _tickCallback: kt2, _disconnect: yt, _handleQueue: Mt, _pendingMessage: Ct, _channel: Lt, _send: Pt, _linkedBinding: Ut } = h4;

// esm:https://esm.sh/*picocolors@1.1.1?target=esnext&lp=node_modules%252Fpicocolors
var picocolors_1_1_exports = {};
__export(picocolors_1_1_exports, {
  bgBlack: () => I5,
  bgBlackBright: () => ge4,
  bgBlue: () => N3,
  bgBlueBright: () => he3,
  bgCyan: () => P3,
  bgCyanBright: () => le3,
  bgGreen: () => K4,
  bgGreenBright: () => te3,
  bgMagenta: () => O4,
  bgMagentaBright: () => ae3,
  bgRed: () => J4,
  bgRedBright: () => re2,
  bgWhite: () => Q2,
  bgWhiteBright: () => be3,
  bgYellow: () => L2,
  bgYellowBright: () => ie3,
  black: () => S5,
  blackBright: () => T5,
  blue: () => A4,
  blueBright: () => Z2,
  bold: () => x4,
  createColors: () => Be3,
  cyan: () => E4,
  cyanBright: () => $2,
  default: () => ne3,
  dim: () => v4,
  gray: () => H3,
  green: () => q3,
  greenBright: () => V2,
  hidden: () => W4,
  inverse: () => R3,
  isColorSupported: () => C3,
  italic: () => G3,
  magenta: () => D5,
  magentaBright: () => _5,
  red: () => j4,
  redBright: () => U3,
  reset: () => f4,
  strikethrough: () => Y2,
  underline: () => M4,
  white: () => F2,
  whiteBright: () => ee2,
  yellow: () => z3,
  yellowBright: () => X3
});

// esm:https://esm.sh/*picocolors@1.1.1/esnext/picocolors.mjs?lp=node_modules%252Fpicocolors
var o6 = Object.create;
var b6 = Object.defineProperty;
var d5 = Object.getOwnPropertyDescriptor;
var c4 = Object.getOwnPropertyNames;
var u4 = Object.getPrototypeOf;
var s5 = Object.prototype.hasOwnProperty;
var y6 = (r3, g6) => () => (g6 || r3((g6 = { exports: {} }).exports, g6), g6.exports);
var w5 = (r3, g6, t, l3) => {
  if (g6 && typeof g6 == "object" || typeof g6 == "function") for (let i4 of c4(g6)) !s5.call(r3, i4) && i4 !== t && b6(r3, i4, { get: () => g6[i4], enumerable: !(l3 = d5(g6, i4)) || l3.enumerable });
  return r3;
};
var k3 = (r3, g6, t) => (t = r3 != null ? o6(u4(r3)) : {}, w5(g6 || !r3 || !r3.__esModule ? b6(t, "default", { value: r3, enumerable: true }) : t, r3));
var n = y6((p4, a4) => {
  var e = String, B3 = function() {
    return { isColorSupported: false, reset: e, bold: e, dim: e, italic: e, underline: e, inverse: e, hidden: e, strikethrough: e, black: e, red: e, green: e, yellow: e, blue: e, magenta: e, cyan: e, white: e, gray: e, bgBlack: e, bgRed: e, bgGreen: e, bgYellow: e, bgBlue: e, bgMagenta: e, bgCyan: e, bgWhite: e, blackBright: e, redBright: e, greenBright: e, yellowBright: e, blueBright: e, magentaBright: e, cyanBright: e, whiteBright: e, bgBlackBright: e, bgRedBright: e, bgGreenBright: e, bgYellowBright: e, bgBlueBright: e, bgMagentaBright: e, bgCyanBright: e, bgWhiteBright: e };
  };
  a4.exports = B3();
  a4.exports.createColors = B3;
});
var h5 = k3(n());
var { isColorSupported: C3, reset: f4, bold: x4, dim: v4, italic: G3, underline: M4, inverse: R3, hidden: W4, strikethrough: Y2, black: S5, red: j4, green: q3, yellow: z3, blue: A4, magenta: D5, cyan: E4, white: F2, gray: H3, bgBlack: I5, bgRed: J4, bgGreen: K4, bgYellow: L2, bgBlue: N3, bgMagenta: O4, bgCyan: P3, bgWhite: Q2, blackBright: T5, redBright: U3, greenBright: V2, yellowBright: X3, blueBright: Z2, magentaBright: _5, cyanBright: $2, whiteBright: ee2, bgBlackBright: ge4, bgRedBright: re2, bgGreenBright: te3, bgYellowBright: ie3, bgBlueBright: he3, bgMagentaBright: ae3, bgCyanBright: le3, bgWhiteBright: be3, createColors: Be3 } = h5;
var ne3 = h5.default ?? h5;

// esm:https://esm.sh/*tailwindcss@3.4.19/esnext/colors.mjs?lp=node_modules%252Ftailwindcss
var require4 = (n3) => {
  const e = (m6) => typeof m6.default < "u" ? m6.default : m6, c5 = (m6) => Object.assign({ __esModule: true }, m6);
  switch (n3) {
    case "picocolors":
      return e(picocolors_1_1_exports);
    default:
      console.error('module "' + n3 + '" not found');
      return null;
  }
};
var h6 = Object.create;
var s6 = Object.defineProperty;
var v5 = Object.getOwnPropertyDescriptor;
var w6 = Object.getOwnPropertyNames;
var G4 = Object.getPrototypeOf;
var A5 = Object.prototype.hasOwnProperty;
var q4 = ((e) => typeof require4 < "u" ? require4 : typeof Proxy < "u" ? new Proxy(e, { get: (f6, a4) => (typeof require4 < "u" ? require4 : f6)[a4] }) : e)(function(e) {
  if (typeof require4 < "u") return require4.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var n2 = (e, f6) => () => (f6 || e((f6 = { exports: {} }).exports, f6), f6.exports);
var M5 = (e, f6, a4, c5) => {
  if (f6 && typeof f6 == "object" || typeof f6 == "function") for (let d6 of w6(f6)) !A5.call(e, d6) && d6 !== a4 && s6(e, d6, { get: () => f6[d6], enumerable: !(c5 = v5(f6, d6)) || c5.enumerable });
  return e;
};
var O5 = (e, f6, a4) => (a4 = e != null ? h6(G4(e)) : {}, M5(f6 || !e || !e.__esModule ? s6(a4, "default", { value: e, enumerable: true }) : a4, e));
var y7 = n2((u5) => {
  "use strict";
  Object.defineProperty(u5, "__esModule", { value: true });
  function S6(e, f6) {
    for (var a4 in f6) Object.defineProperty(e, a4, { enumerable: true, get: f6[a4] });
  }
  S6(u5, { dim: function() {
    return $3;
  }, default: function() {
    return x5;
  } });
  var r3 = P5(q4("picocolors"));
  function P5(e) {
    return e && e.__esModule ? e : { default: e };
  }
  var _6 = /* @__PURE__ */ new Set();
  function o7(e, f6, a4) {
    typeof A3 < "u" && A3.env.JEST_WORKER_ID || a4 && _6.has(a4) || (a4 && _6.add(a4), console.warn(""), f6.forEach((c5) => console.warn(e, "-", c5)));
  }
  function $3(e) {
    return r3.default.dim(e);
  }
  var x5 = { info(e, f6) {
    o7(r3.default.bold(r3.default.cyan("info")), ...Array.isArray(e) ? [e] : [f6, e]);
  }, warn(e, f6) {
    o7(r3.default.bold(r3.default.yellow("warn")), ...Array.isArray(e) ? [e] : [f6, e]);
  }, risk(e, f6) {
    o7(r3.default.bold(r3.default.magenta("risk")), ...Array.isArray(e) ? [e] : [f6, e]);
  } };
});
var g5 = n2((i4) => {
  "use strict";
  Object.defineProperty(i4, "__esModule", { value: true });
  Object.defineProperty(i4, "default", { enumerable: true, get: function() {
    return C5;
  } });
  var E6 = B3(y7());
  function B3(e) {
    return e && e.__esModule ? e : { default: e };
  }
  function t({ version: e, from: f6, to: a4 }) {
    E6.default.warn(`${f6}-color-renamed`, [`As of Tailwind CSS ${e}, \`${f6}\` has been renamed to \`${a4}\`.`, "Update your configuration file to silence this warning."]);
  }
  var C5 = { inherit: "inherit", current: "currentColor", transparent: "transparent", black: "#000", white: "#fff", slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" }, get lightBlue() {
    return t({ version: "v2.2", from: "lightBlue", to: "sky" }), this.sky;
  }, get warmGray() {
    return t({ version: "v3.0", from: "warmGray", to: "stone" }), this.stone;
  }, get trueGray() {
    return t({ version: "v3.0", from: "trueGray", to: "neutral" }), this.neutral;
  }, get coolGray() {
    return t({ version: "v3.0", from: "coolGray", to: "gray" }), this.gray;
  }, get blueGray() {
    return t({ version: "v3.0", from: "blueGray", to: "slate" }), this.slate;
  } };
});
var p3 = n2((D7, m6) => {
  var b7 = g5();
  m6.exports = (b7.__esModule ? b7 : { default: b7 }).default;
});
var l2 = O5(p3());
var I6 = l2.default ?? l2;

// esm:https://esm.sh/*@tailwindcss/typography@0.5.20/esnext/typography.mjs?lp=node_modules%252F%2540tailwindcss%252Ftypography
var require5 = (n3) => {
  const e = (m6) => typeof m6.default < "u" ? m6.default : m6, c5 = (m6) => Object.assign({ __esModule: true }, m6);
  switch (n3) {
    case "tailwindcss/plugin":
      return e(plugin_target_esnext_lp_node_modules_252Ftailwindcss_exports);
    case "postcss-selector-parser":
      return e(postcss_selector_parser_6_0_exports);
    case "tailwindcss/colors":
      return e(colors_target_esnext_lp_node_modules_252Ftailwindcss_exports);
    default:
      console.error('module "' + n3 + '" not found');
      return null;
  }
};
var A6 = Object.create;
var k4 = Object.defineProperty;
var P4 = Object.getOwnPropertyDescriptor;
var R4 = Object.getOwnPropertyNames;
var C4 = Object.getPrototypeOf;
var F3 = Object.prototype.hasOwnProperty;
var f5 = ((e) => typeof require5 < "u" ? require5 : typeof Proxy < "u" ? new Proxy(e, { get: (i4, n3) => (typeof require5 < "u" ? require5 : i4)[n3] }) : e)(function(e) {
  if (typeof require5 < "u") return require5.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var T6 = (e, i4) => () => (i4 || e((i4 = { exports: {} }).exports, i4), i4.exports);
var D6 = (e, i4, n3, a4) => {
  if (i4 && typeof i4 == "object" || typeof i4 == "function") for (let s7 of R4(i4)) !F3.call(e, s7) && s7 !== n3 && k4(e, s7, { get: () => i4[s7], enumerable: !(a4 = P4(i4, s7)) || a4.enumerable });
  return e;
};
var L3 = (e, i4, n3) => (n3 = e != null ? A6(C4(e)) : {}, D6(i4 || !e || !e.__esModule ? k4(n3, "default", { value: e, enumerable: true }) : n3, e));
var z4 = T6((Y3, I7) => {
  var o7 = f5("tailwindcss/colors"), r3 = (e) => e.toFixed(7).replace(/(\.[0-9]+?)0+$/, "$1").replace(/\.0$/, ""), g6 = (e) => `${r3(e / 16)}rem`, t = (e, i4) => `${r3(e / i4)}em`, m6 = (e, i4) => {
    let n3 = e.replace("#", "");
    n3 = n3.length === 3 ? n3.replace(/./g, "$&$&") : n3;
    let a4 = parseInt(n3.substring(0, 2), 16), s7 = parseInt(n3.substring(2, 4), 16), l3 = parseInt(n3.substring(4, 6), 16);
    return Number.isNaN(a4) || Number.isNaN(s7) || Number.isNaN(l3) ? `color-mix(in oklab, ${e} ${i4}, transparent)` : `rgb(${a4} ${s7} ${l3} / ${i4})`;
  }, v6 = { sm: { css: [{ fontSize: g6(14), lineHeight: r3(24 / 14), p: { marginTop: t(16, 14), marginBottom: t(16, 14) }, '[class~="lead"]': { fontSize: t(18, 14), lineHeight: r3(28 / 18), marginTop: t(16, 18), marginBottom: t(16, 18) }, blockquote: { marginTop: t(24, 18), marginBottom: t(24, 18), paddingInlineStart: t(20, 18) }, h1: { fontSize: t(30, 14), marginTop: "0", marginBottom: t(24, 30), lineHeight: r3(36 / 30) }, h2: { fontSize: t(20, 14), marginTop: t(32, 20), marginBottom: t(16, 20), lineHeight: r3(28 / 20) }, h3: { fontSize: t(18, 14), marginTop: t(28, 18), marginBottom: t(8, 18), lineHeight: r3(28 / 18) }, h4: { marginTop: t(20, 14), marginBottom: t(8, 14), lineHeight: r3(20 / 14) }, img: { marginTop: t(24, 14), marginBottom: t(24, 14) }, picture: { marginTop: t(24, 14), marginBottom: t(24, 14) }, "picture > img": { marginTop: "0", marginBottom: "0" }, video: { marginTop: t(24, 14), marginBottom: t(24, 14) }, kbd: { fontSize: t(12, 14), borderRadius: g6(5), paddingTop: t(2, 14), paddingInlineEnd: t(5, 14), paddingBottom: t(2, 14), paddingInlineStart: t(5, 14) }, code: { fontSize: t(12, 14) }, "h2 code": { fontSize: t(18, 20) }, "h3 code": { fontSize: t(16, 18) }, pre: { fontSize: t(12, 14), lineHeight: r3(20 / 12), marginTop: t(20, 12), marginBottom: t(20, 12), borderRadius: g6(4), paddingTop: t(8, 12), paddingInlineEnd: t(12, 12), paddingBottom: t(8, 12), paddingInlineStart: t(12, 12) }, ol: { marginTop: t(16, 14), marginBottom: t(16, 14), paddingInlineStart: t(22, 14) }, ul: { marginTop: t(16, 14), marginBottom: t(16, 14), paddingInlineStart: t(22, 14) }, li: { marginTop: t(4, 14), marginBottom: t(4, 14) }, "ol > li": { paddingInlineStart: t(6, 14) }, "ul > li": { paddingInlineStart: t(6, 14) }, "> ul > li p": { marginTop: t(8, 14), marginBottom: t(8, 14) }, "> ul > li > p:first-child": { marginTop: t(16, 14) }, "> ul > li > p:last-child": { marginBottom: t(16, 14) }, "> ol > li > p:first-child": { marginTop: t(16, 14) }, "> ol > li > p:last-child": { marginBottom: t(16, 14) }, "ul ul, ul ol, ol ul, ol ol": { marginTop: t(8, 14), marginBottom: t(8, 14) }, dl: { marginTop: t(16, 14), marginBottom: t(16, 14) }, dt: { marginTop: t(16, 14) }, dd: { marginTop: t(4, 14), paddingInlineStart: t(22, 14) }, hr: { marginTop: t(40, 14), marginBottom: t(40, 14) }, "hr + *": { marginTop: "0" }, "h2 + *": { marginTop: "0" }, "h3 + *": { marginTop: "0" }, "h4 + *": { marginTop: "0" }, table: { fontSize: t(12, 14), lineHeight: r3(18 / 12) }, "thead th": { paddingInlineEnd: t(12, 12), paddingBottom: t(8, 12), paddingInlineStart: t(12, 12) }, "thead th:first-child": { paddingInlineStart: "0" }, "thead th:last-child": { paddingInlineEnd: "0" }, "tbody td, tfoot td": { paddingTop: t(8, 12), paddingInlineEnd: t(12, 12), paddingBottom: t(8, 12), paddingInlineStart: t(12, 12) }, "tbody td:first-child, tfoot td:first-child": { paddingInlineStart: "0" }, "tbody td:last-child, tfoot td:last-child": { paddingInlineEnd: "0" }, figure: { marginTop: t(24, 14), marginBottom: t(24, 14) }, "figure > *": { marginTop: "0", marginBottom: "0" }, figcaption: { fontSize: t(12, 14), lineHeight: r3(16 / 12), marginTop: t(8, 12) } }, { "> :first-child": { marginTop: "0" }, "> :last-child": { marginBottom: "0" } }] }, base: { css: [{ fontSize: g6(16), lineHeight: r3(28 / 16), p: { marginTop: t(20, 16), marginBottom: t(20, 16) }, '[class~="lead"]': { fontSize: t(20, 16), lineHeight: r3(32 / 20), marginTop: t(24, 20), marginBottom: t(24, 20) }, blockquote: { marginTop: t(32, 20), marginBottom: t(32, 20), paddingInlineStart: t(20, 20) }, h1: { fontSize: t(36, 16), marginTop: "0", marginBottom: t(32, 36), lineHeight: r3(40 / 36) }, h2: { fontSize: t(24, 16), marginTop: t(48, 24), marginBottom: t(24, 24), lineHeight: r3(32 / 24) }, h3: { fontSize: t(20, 16), marginTop: t(32, 20), marginBottom: t(12, 20), lineHeight: r3(32 / 20) }, h4: { marginTop: t(24, 16), marginBottom: t(8, 16), lineHeight: r3(24 / 16) }, img: { marginTop: t(32, 16), marginBottom: t(32, 16) }, picture: { marginTop: t(32, 16), marginBottom: t(32, 16) }, "picture > img": { marginTop: "0", marginBottom: "0" }, video: { marginTop: t(32, 16), marginBottom: t(32, 16) }, kbd: { fontSize: t(14, 16), borderRadius: g6(5), paddingTop: t(3, 16), paddingInlineEnd: t(6, 16), paddingBottom: t(3, 16), paddingInlineStart: t(6, 16) }, code: { fontSize: t(14, 16) }, "h2 code": { fontSize: t(21, 24) }, "h3 code": { fontSize: t(18, 20) }, pre: { fontSize: t(14, 16), lineHeight: r3(24 / 14), marginTop: t(24, 14), marginBottom: t(24, 14), borderRadius: g6(6), paddingTop: t(12, 14), paddingInlineEnd: t(16, 14), paddingBottom: t(12, 14), paddingInlineStart: t(16, 14) }, ol: { marginTop: t(20, 16), marginBottom: t(20, 16), paddingInlineStart: t(26, 16) }, ul: { marginTop: t(20, 16), marginBottom: t(20, 16), paddingInlineStart: t(26, 16) }, li: { marginTop: t(8, 16), marginBottom: t(8, 16) }, "ol > li": { paddingInlineStart: t(6, 16) }, "ul > li": { paddingInlineStart: t(6, 16) }, "> ul > li p": { marginTop: t(12, 16), marginBottom: t(12, 16) }, "> ul > li > p:first-child": { marginTop: t(20, 16) }, "> ul > li > p:last-child": { marginBottom: t(20, 16) }, "> ol > li > p:first-child": { marginTop: t(20, 16) }, "> ol > li > p:last-child": { marginBottom: t(20, 16) }, "ul ul, ul ol, ol ul, ol ol": { marginTop: t(12, 16), marginBottom: t(12, 16) }, dl: { marginTop: t(20, 16), marginBottom: t(20, 16) }, dt: { marginTop: t(20, 16) }, dd: { marginTop: t(8, 16), paddingInlineStart: t(26, 16) }, hr: { marginTop: t(48, 16), marginBottom: t(48, 16) }, "hr + *": { marginTop: "0" }, "h2 + *": { marginTop: "0" }, "h3 + *": { marginTop: "0" }, "h4 + *": { marginTop: "0" }, table: { fontSize: t(14, 16), lineHeight: r3(24 / 14) }, "thead th": { paddingInlineEnd: t(8, 14), paddingBottom: t(8, 14), paddingInlineStart: t(8, 14) }, "thead th:first-child": { paddingInlineStart: "0" }, "thead th:last-child": { paddingInlineEnd: "0" }, "tbody td, tfoot td": { paddingTop: t(8, 14), paddingInlineEnd: t(8, 14), paddingBottom: t(8, 14), paddingInlineStart: t(8, 14) }, "tbody td:first-child, tfoot td:first-child": { paddingInlineStart: "0" }, "tbody td:last-child, tfoot td:last-child": { paddingInlineEnd: "0" }, figure: { marginTop: t(32, 16), marginBottom: t(32, 16) }, "figure > *": { marginTop: "0", marginBottom: "0" }, figcaption: { fontSize: t(14, 16), lineHeight: r3(20 / 14), marginTop: t(12, 14) } }, { "> :first-child": { marginTop: "0" }, "> :last-child": { marginBottom: "0" } }] }, lg: { css: [{ fontSize: g6(18), lineHeight: r3(32 / 18), p: { marginTop: t(24, 18), marginBottom: t(24, 18) }, '[class~="lead"]': { fontSize: t(22, 18), lineHeight: r3(32 / 22), marginTop: t(24, 22), marginBottom: t(24, 22) }, blockquote: { marginTop: t(40, 24), marginBottom: t(40, 24), paddingInlineStart: t(24, 24) }, h1: { fontSize: t(48, 18), marginTop: "0", marginBottom: t(40, 48), lineHeight: r3(48 / 48) }, h2: { fontSize: t(30, 18), marginTop: t(56, 30), marginBottom: t(32, 30), lineHeight: r3(40 / 30) }, h3: { fontSize: t(24, 18), marginTop: t(40, 24), marginBottom: t(16, 24), lineHeight: r3(36 / 24) }, h4: { marginTop: t(32, 18), marginBottom: t(8, 18), lineHeight: r3(28 / 18) }, img: { marginTop: t(32, 18), marginBottom: t(32, 18) }, picture: { marginTop: t(32, 18), marginBottom: t(32, 18) }, "picture > img": { marginTop: "0", marginBottom: "0" }, video: { marginTop: t(32, 18), marginBottom: t(32, 18) }, kbd: { fontSize: t(16, 18), borderRadius: g6(5), paddingTop: t(4, 18), paddingInlineEnd: t(8, 18), paddingBottom: t(4, 18), paddingInlineStart: t(8, 18) }, code: { fontSize: t(16, 18) }, "h2 code": { fontSize: t(26, 30) }, "h3 code": { fontSize: t(21, 24) }, pre: { fontSize: t(16, 18), lineHeight: r3(28 / 16), marginTop: t(32, 16), marginBottom: t(32, 16), borderRadius: g6(6), paddingTop: t(16, 16), paddingInlineEnd: t(24, 16), paddingBottom: t(16, 16), paddingInlineStart: t(24, 16) }, ol: { marginTop: t(24, 18), marginBottom: t(24, 18), paddingInlineStart: t(28, 18) }, ul: { marginTop: t(24, 18), marginBottom: t(24, 18), paddingInlineStart: t(28, 18) }, li: { marginTop: t(12, 18), marginBottom: t(12, 18) }, "ol > li": { paddingInlineStart: t(8, 18) }, "ul > li": { paddingInlineStart: t(8, 18) }, "> ul > li p": { marginTop: t(16, 18), marginBottom: t(16, 18) }, "> ul > li > p:first-child": { marginTop: t(24, 18) }, "> ul > li > p:last-child": { marginBottom: t(24, 18) }, "> ol > li > p:first-child": { marginTop: t(24, 18) }, "> ol > li > p:last-child": { marginBottom: t(24, 18) }, "ul ul, ul ol, ol ul, ol ol": { marginTop: t(16, 18), marginBottom: t(16, 18) }, dl: { marginTop: t(24, 18), marginBottom: t(24, 18) }, dt: { marginTop: t(24, 18) }, dd: { marginTop: t(12, 18), paddingInlineStart: t(28, 18) }, hr: { marginTop: t(56, 18), marginBottom: t(56, 18) }, "hr + *": { marginTop: "0" }, "h2 + *": { marginTop: "0" }, "h3 + *": { marginTop: "0" }, "h4 + *": { marginTop: "0" }, table: { fontSize: t(16, 18), lineHeight: r3(24 / 16) }, "thead th": { paddingInlineEnd: t(12, 16), paddingBottom: t(12, 16), paddingInlineStart: t(12, 16) }, "thead th:first-child": { paddingInlineStart: "0" }, "thead th:last-child": { paddingInlineEnd: "0" }, "tbody td, tfoot td": { paddingTop: t(12, 16), paddingInlineEnd: t(12, 16), paddingBottom: t(12, 16), paddingInlineStart: t(12, 16) }, "tbody td:first-child, tfoot td:first-child": { paddingInlineStart: "0" }, "tbody td:last-child, tfoot td:last-child": { paddingInlineEnd: "0" }, figure: { marginTop: t(32, 18), marginBottom: t(32, 18) }, "figure > *": { marginTop: "0", marginBottom: "0" }, figcaption: { fontSize: t(16, 18), lineHeight: r3(24 / 16), marginTop: t(16, 16) } }, { "> :first-child": { marginTop: "0" }, "> :last-child": { marginBottom: "0" } }] }, xl: { css: [{ fontSize: g6(20), lineHeight: r3(36 / 20), p: { marginTop: t(24, 20), marginBottom: t(24, 20) }, '[class~="lead"]': { fontSize: t(24, 20), lineHeight: r3(36 / 24), marginTop: t(24, 24), marginBottom: t(24, 24) }, blockquote: { marginTop: t(48, 30), marginBottom: t(48, 30), paddingInlineStart: t(32, 30) }, h1: { fontSize: t(56, 20), marginTop: "0", marginBottom: t(48, 56), lineHeight: r3(56 / 56) }, h2: { fontSize: t(36, 20), marginTop: t(56, 36), marginBottom: t(32, 36), lineHeight: r3(40 / 36) }, h3: { fontSize: t(30, 20), marginTop: t(48, 30), marginBottom: t(20, 30), lineHeight: r3(40 / 30) }, h4: { marginTop: t(36, 20), marginBottom: t(12, 20), lineHeight: r3(32 / 20) }, img: { marginTop: t(40, 20), marginBottom: t(40, 20) }, picture: { marginTop: t(40, 20), marginBottom: t(40, 20) }, "picture > img": { marginTop: "0", marginBottom: "0" }, video: { marginTop: t(40, 20), marginBottom: t(40, 20) }, kbd: { fontSize: t(18, 20), borderRadius: g6(5), paddingTop: t(5, 20), paddingInlineEnd: t(8, 20), paddingBottom: t(5, 20), paddingInlineStart: t(8, 20) }, code: { fontSize: t(18, 20) }, "h2 code": { fontSize: t(31, 36) }, "h3 code": { fontSize: t(27, 30) }, pre: { fontSize: t(18, 20), lineHeight: r3(32 / 18), marginTop: t(36, 18), marginBottom: t(36, 18), borderRadius: g6(8), paddingTop: t(20, 18), paddingInlineEnd: t(24, 18), paddingBottom: t(20, 18), paddingInlineStart: t(24, 18) }, ol: { marginTop: t(24, 20), marginBottom: t(24, 20), paddingInlineStart: t(32, 20) }, ul: { marginTop: t(24, 20), marginBottom: t(24, 20), paddingInlineStart: t(32, 20) }, li: { marginTop: t(12, 20), marginBottom: t(12, 20) }, "ol > li": { paddingInlineStart: t(8, 20) }, "ul > li": { paddingInlineStart: t(8, 20) }, "> ul > li p": { marginTop: t(16, 20), marginBottom: t(16, 20) }, "> ul > li > p:first-child": { marginTop: t(24, 20) }, "> ul > li > p:last-child": { marginBottom: t(24, 20) }, "> ol > li > p:first-child": { marginTop: t(24, 20) }, "> ol > li > p:last-child": { marginBottom: t(24, 20) }, "ul ul, ul ol, ol ul, ol ol": { marginTop: t(16, 20), marginBottom: t(16, 20) }, dl: { marginTop: t(24, 20), marginBottom: t(24, 20) }, dt: { marginTop: t(24, 20) }, dd: { marginTop: t(12, 20), paddingInlineStart: t(32, 20) }, hr: { marginTop: t(56, 20), marginBottom: t(56, 20) }, "hr + *": { marginTop: "0" }, "h2 + *": { marginTop: "0" }, "h3 + *": { marginTop: "0" }, "h4 + *": { marginTop: "0" }, table: { fontSize: t(18, 20), lineHeight: r3(28 / 18) }, "thead th": { paddingInlineEnd: t(12, 18), paddingBottom: t(16, 18), paddingInlineStart: t(12, 18) }, "thead th:first-child": { paddingInlineStart: "0" }, "thead th:last-child": { paddingInlineEnd: "0" }, "tbody td, tfoot td": { paddingTop: t(16, 18), paddingInlineEnd: t(12, 18), paddingBottom: t(16, 18), paddingInlineStart: t(12, 18) }, "tbody td:first-child, tfoot td:first-child": { paddingInlineStart: "0" }, "tbody td:last-child, tfoot td:last-child": { paddingInlineEnd: "0" }, figure: { marginTop: t(40, 20), marginBottom: t(40, 20) }, "figure > *": { marginTop: "0", marginBottom: "0" }, figcaption: { fontSize: t(18, 20), lineHeight: r3(28 / 18), marginTop: t(18, 18) } }, { "> :first-child": { marginTop: "0" }, "> :last-child": { marginBottom: "0" } }] }, "2xl": { css: [{ fontSize: g6(24), lineHeight: r3(40 / 24), p: { marginTop: t(32, 24), marginBottom: t(32, 24) }, '[class~="lead"]': { fontSize: t(30, 24), lineHeight: r3(44 / 30), marginTop: t(32, 30), marginBottom: t(32, 30) }, blockquote: { marginTop: t(64, 36), marginBottom: t(64, 36), paddingInlineStart: t(40, 36) }, h1: { fontSize: t(64, 24), marginTop: "0", marginBottom: t(56, 64), lineHeight: r3(64 / 64) }, h2: { fontSize: t(48, 24), marginTop: t(72, 48), marginBottom: t(40, 48), lineHeight: r3(52 / 48) }, h3: { fontSize: t(36, 24), marginTop: t(56, 36), marginBottom: t(24, 36), lineHeight: r3(44 / 36) }, h4: { marginTop: t(40, 24), marginBottom: t(16, 24), lineHeight: r3(36 / 24) }, img: { marginTop: t(48, 24), marginBottom: t(48, 24) }, picture: { marginTop: t(48, 24), marginBottom: t(48, 24) }, "picture > img": { marginTop: "0", marginBottom: "0" }, video: { marginTop: t(48, 24), marginBottom: t(48, 24) }, kbd: { fontSize: t(20, 24), borderRadius: g6(6), paddingTop: t(6, 24), paddingInlineEnd: t(8, 24), paddingBottom: t(6, 24), paddingInlineStart: t(8, 24) }, code: { fontSize: t(20, 24) }, "h2 code": { fontSize: t(42, 48) }, "h3 code": { fontSize: t(32, 36) }, pre: { fontSize: t(20, 24), lineHeight: r3(36 / 20), marginTop: t(40, 20), marginBottom: t(40, 20), borderRadius: g6(8), paddingTop: t(24, 20), paddingInlineEnd: t(32, 20), paddingBottom: t(24, 20), paddingInlineStart: t(32, 20) }, ol: { marginTop: t(32, 24), marginBottom: t(32, 24), paddingInlineStart: t(38, 24) }, ul: { marginTop: t(32, 24), marginBottom: t(32, 24), paddingInlineStart: t(38, 24) }, li: { marginTop: t(12, 24), marginBottom: t(12, 24) }, "ol > li": { paddingInlineStart: t(10, 24) }, "ul > li": { paddingInlineStart: t(10, 24) }, "> ul > li p": { marginTop: t(20, 24), marginBottom: t(20, 24) }, "> ul > li > p:first-child": { marginTop: t(32, 24) }, "> ul > li > p:last-child": { marginBottom: t(32, 24) }, "> ol > li > p:first-child": { marginTop: t(32, 24) }, "> ol > li > p:last-child": { marginBottom: t(32, 24) }, "ul ul, ul ol, ol ul, ol ol": { marginTop: t(16, 24), marginBottom: t(16, 24) }, dl: { marginTop: t(32, 24), marginBottom: t(32, 24) }, dt: { marginTop: t(32, 24) }, dd: { marginTop: t(12, 24), paddingInlineStart: t(38, 24) }, hr: { marginTop: t(72, 24), marginBottom: t(72, 24) }, "hr + *": { marginTop: "0" }, "h2 + *": { marginTop: "0" }, "h3 + *": { marginTop: "0" }, "h4 + *": { marginTop: "0" }, table: { fontSize: t(20, 24), lineHeight: r3(28 / 20) }, "thead th": { paddingInlineEnd: t(12, 20), paddingBottom: t(16, 20), paddingInlineStart: t(12, 20) }, "thead th:first-child": { paddingInlineStart: "0" }, "thead th:last-child": { paddingInlineEnd: "0" }, "tbody td, tfoot td": { paddingTop: t(16, 20), paddingInlineEnd: t(12, 20), paddingBottom: t(16, 20), paddingInlineStart: t(12, 20) }, "tbody td:first-child, tfoot td:first-child": { paddingInlineStart: "0" }, "tbody td:last-child, tfoot td:last-child": { paddingInlineEnd: "0" }, figure: { marginTop: t(48, 24), marginBottom: t(48, 24) }, "figure > *": { marginTop: "0", marginBottom: "0" }, figcaption: { fontSize: t(20, 24), lineHeight: r3(32 / 20), marginTop: t(20, 20) } }, { "> :first-child": { marginTop: "0" }, "> :last-child": { marginBottom: "0" } }] }, slate: { css: { "--tw-prose-body": o7.slate[700], "--tw-prose-headings": o7.slate[900], "--tw-prose-lead": o7.slate[600], "--tw-prose-links": o7.slate[900], "--tw-prose-bold": o7.slate[900], "--tw-prose-counters": o7.slate[500], "--tw-prose-bullets": o7.slate[300], "--tw-prose-hr": o7.slate[200], "--tw-prose-quotes": o7.slate[900], "--tw-prose-quote-borders": o7.slate[200], "--tw-prose-captions": o7.slate[500], "--tw-prose-kbd": o7.slate[900], "--tw-prose-kbd-shadows": m6(o7.slate[900], "10%"), "--tw-prose-code": o7.slate[900], "--tw-prose-pre-code": o7.slate[200], "--tw-prose-pre-bg": o7.slate[800], "--tw-prose-th-borders": o7.slate[300], "--tw-prose-td-borders": o7.slate[200], "--tw-prose-invert-body": o7.slate[300], "--tw-prose-invert-headings": o7.white, "--tw-prose-invert-lead": o7.slate[400], "--tw-prose-invert-links": o7.white, "--tw-prose-invert-bold": o7.white, "--tw-prose-invert-counters": o7.slate[400], "--tw-prose-invert-bullets": o7.slate[600], "--tw-prose-invert-hr": o7.slate[700], "--tw-prose-invert-quotes": o7.slate[100], "--tw-prose-invert-quote-borders": o7.slate[700], "--tw-prose-invert-captions": o7.slate[400], "--tw-prose-invert-kbd": o7.white, "--tw-prose-invert-kbd-shadows": m6(o7.white, "10%"), "--tw-prose-invert-code": o7.white, "--tw-prose-invert-pre-code": o7.slate[300], "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)", "--tw-prose-invert-th-borders": o7.slate[600], "--tw-prose-invert-td-borders": o7.slate[700] } }, gray: { css: { "--tw-prose-body": o7.gray[700], "--tw-prose-headings": o7.gray[900], "--tw-prose-lead": o7.gray[600], "--tw-prose-links": o7.gray[900], "--tw-prose-bold": o7.gray[900], "--tw-prose-counters": o7.gray[500], "--tw-prose-bullets": o7.gray[300], "--tw-prose-hr": o7.gray[200], "--tw-prose-quotes": o7.gray[900], "--tw-prose-quote-borders": o7.gray[200], "--tw-prose-captions": o7.gray[500], "--tw-prose-kbd": o7.gray[900], "--tw-prose-kbd-shadows": m6(o7.gray[900], "10%"), "--tw-prose-code": o7.gray[900], "--tw-prose-pre-code": o7.gray[200], "--tw-prose-pre-bg": o7.gray[800], "--tw-prose-th-borders": o7.gray[300], "--tw-prose-td-borders": o7.gray[200], "--tw-prose-invert-body": o7.gray[300], "--tw-prose-invert-headings": o7.white, "--tw-prose-invert-lead": o7.gray[400], "--tw-prose-invert-links": o7.white, "--tw-prose-invert-bold": o7.white, "--tw-prose-invert-counters": o7.gray[400], "--tw-prose-invert-bullets": o7.gray[600], "--tw-prose-invert-hr": o7.gray[700], "--tw-prose-invert-quotes": o7.gray[100], "--tw-prose-invert-quote-borders": o7.gray[700], "--tw-prose-invert-captions": o7.gray[400], "--tw-prose-invert-kbd": o7.white, "--tw-prose-invert-kbd-shadows": m6(o7.white, "10%"), "--tw-prose-invert-code": o7.white, "--tw-prose-invert-pre-code": o7.gray[300], "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)", "--tw-prose-invert-th-borders": o7.gray[600], "--tw-prose-invert-td-borders": o7.gray[700] } }, zinc: { css: { "--tw-prose-body": o7.zinc[700], "--tw-prose-headings": o7.zinc[900], "--tw-prose-lead": o7.zinc[600], "--tw-prose-links": o7.zinc[900], "--tw-prose-bold": o7.zinc[900], "--tw-prose-counters": o7.zinc[500], "--tw-prose-bullets": o7.zinc[300], "--tw-prose-hr": o7.zinc[200], "--tw-prose-quotes": o7.zinc[900], "--tw-prose-quote-borders": o7.zinc[200], "--tw-prose-captions": o7.zinc[500], "--tw-prose-kbd": o7.zinc[900], "--tw-prose-kbd-shadows": m6(o7.zinc[900], "10%"), "--tw-prose-code": o7.zinc[900], "--tw-prose-pre-code": o7.zinc[200], "--tw-prose-pre-bg": o7.zinc[800], "--tw-prose-th-borders": o7.zinc[300], "--tw-prose-td-borders": o7.zinc[200], "--tw-prose-invert-body": o7.zinc[300], "--tw-prose-invert-headings": o7.white, "--tw-prose-invert-lead": o7.zinc[400], "--tw-prose-invert-links": o7.white, "--tw-prose-invert-bold": o7.white, "--tw-prose-invert-counters": o7.zinc[400], "--tw-prose-invert-bullets": o7.zinc[600], "--tw-prose-invert-hr": o7.zinc[700], "--tw-prose-invert-quotes": o7.zinc[100], "--tw-prose-invert-quote-borders": o7.zinc[700], "--tw-prose-invert-captions": o7.zinc[400], "--tw-prose-invert-kbd": o7.white, "--tw-prose-invert-kbd-shadows": m6(o7.white, "10%"), "--tw-prose-invert-code": o7.white, "--tw-prose-invert-pre-code": o7.zinc[300], "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)", "--tw-prose-invert-th-borders": o7.zinc[600], "--tw-prose-invert-td-borders": o7.zinc[700] } }, neutral: { css: { "--tw-prose-body": o7.neutral[700], "--tw-prose-headings": o7.neutral[900], "--tw-prose-lead": o7.neutral[600], "--tw-prose-links": o7.neutral[900], "--tw-prose-bold": o7.neutral[900], "--tw-prose-counters": o7.neutral[500], "--tw-prose-bullets": o7.neutral[300], "--tw-prose-hr": o7.neutral[200], "--tw-prose-quotes": o7.neutral[900], "--tw-prose-quote-borders": o7.neutral[200], "--tw-prose-captions": o7.neutral[500], "--tw-prose-kbd": o7.neutral[900], "--tw-prose-kbd-shadows": m6(o7.neutral[900], "10%"), "--tw-prose-code": o7.neutral[900], "--tw-prose-pre-code": o7.neutral[200], "--tw-prose-pre-bg": o7.neutral[800], "--tw-prose-th-borders": o7.neutral[300], "--tw-prose-td-borders": o7.neutral[200], "--tw-prose-invert-body": o7.neutral[300], "--tw-prose-invert-headings": o7.white, "--tw-prose-invert-lead": o7.neutral[400], "--tw-prose-invert-links": o7.white, "--tw-prose-invert-bold": o7.white, "--tw-prose-invert-counters": o7.neutral[400], "--tw-prose-invert-bullets": o7.neutral[600], "--tw-prose-invert-hr": o7.neutral[700], "--tw-prose-invert-quotes": o7.neutral[100], "--tw-prose-invert-quote-borders": o7.neutral[700], "--tw-prose-invert-captions": o7.neutral[400], "--tw-prose-invert-kbd": o7.white, "--tw-prose-invert-kbd-shadows": m6(o7.white, "10%"), "--tw-prose-invert-code": o7.white, "--tw-prose-invert-pre-code": o7.neutral[300], "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)", "--tw-prose-invert-th-borders": o7.neutral[600], "--tw-prose-invert-td-borders": o7.neutral[700] } }, stone: { css: { "--tw-prose-body": o7.stone[700], "--tw-prose-headings": o7.stone[900], "--tw-prose-lead": o7.stone[600], "--tw-prose-links": o7.stone[900], "--tw-prose-bold": o7.stone[900], "--tw-prose-counters": o7.stone[500], "--tw-prose-bullets": o7.stone[300], "--tw-prose-hr": o7.stone[200], "--tw-prose-quotes": o7.stone[900], "--tw-prose-quote-borders": o7.stone[200], "--tw-prose-captions": o7.stone[500], "--tw-prose-kbd": o7.stone[900], "--tw-prose-kbd-shadows": m6(o7.stone[900], "10%"), "--tw-prose-code": o7.stone[900], "--tw-prose-pre-code": o7.stone[200], "--tw-prose-pre-bg": o7.stone[800], "--tw-prose-th-borders": o7.stone[300], "--tw-prose-td-borders": o7.stone[200], "--tw-prose-invert-body": o7.stone[300], "--tw-prose-invert-headings": o7.white, "--tw-prose-invert-lead": o7.stone[400], "--tw-prose-invert-links": o7.white, "--tw-prose-invert-bold": o7.white, "--tw-prose-invert-counters": o7.stone[400], "--tw-prose-invert-bullets": o7.stone[600], "--tw-prose-invert-hr": o7.stone[700], "--tw-prose-invert-quotes": o7.stone[100], "--tw-prose-invert-quote-borders": o7.stone[700], "--tw-prose-invert-captions": o7.stone[400], "--tw-prose-invert-kbd": o7.white, "--tw-prose-invert-kbd-shadows": m6(o7.white, "10%"), "--tw-prose-invert-code": o7.white, "--tw-prose-invert-pre-code": o7.stone[300], "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)", "--tw-prose-invert-th-borders": o7.stone[600], "--tw-prose-invert-td-borders": o7.stone[700] } }, red: { css: { "--tw-prose-links": o7.red[600], "--tw-prose-invert-links": o7.red[500] } }, orange: { css: { "--tw-prose-links": o7.orange[600], "--tw-prose-invert-links": o7.orange[500] } }, amber: { css: { "--tw-prose-links": o7.amber[600], "--tw-prose-invert-links": o7.amber[500] } }, yellow: { css: { "--tw-prose-links": o7.yellow[600], "--tw-prose-invert-links": o7.yellow[500] } }, lime: { css: { "--tw-prose-links": o7.lime[600], "--tw-prose-invert-links": o7.lime[500] } }, green: { css: { "--tw-prose-links": o7.green[600], "--tw-prose-invert-links": o7.green[500] } }, emerald: { css: { "--tw-prose-links": o7.emerald[600], "--tw-prose-invert-links": o7.emerald[500] } }, teal: { css: { "--tw-prose-links": o7.teal[600], "--tw-prose-invert-links": o7.teal[500] } }, cyan: { css: { "--tw-prose-links": o7.cyan[600], "--tw-prose-invert-links": o7.cyan[500] } }, sky: { css: { "--tw-prose-links": o7.sky[600], "--tw-prose-invert-links": o7.sky[500] } }, blue: { css: { "--tw-prose-links": o7.blue[600], "--tw-prose-invert-links": o7.blue[500] } }, indigo: { css: { "--tw-prose-links": o7.indigo[600], "--tw-prose-invert-links": o7.indigo[500] } }, violet: { css: { "--tw-prose-links": o7.violet[600], "--tw-prose-invert-links": o7.violet[500] } }, purple: { css: { "--tw-prose-links": o7.purple[600], "--tw-prose-invert-links": o7.purple[500] } }, fuchsia: { css: { "--tw-prose-links": o7.fuchsia[600], "--tw-prose-invert-links": o7.fuchsia[500] } }, pink: { css: { "--tw-prose-links": o7.pink[600], "--tw-prose-invert-links": o7.pink[500] } }, rose: { css: { "--tw-prose-links": o7.rose[600], "--tw-prose-invert-links": o7.rose[500] } }, invert: { css: { "--tw-prose-body": "var(--tw-prose-invert-body)", "--tw-prose-headings": "var(--tw-prose-invert-headings)", "--tw-prose-lead": "var(--tw-prose-invert-lead)", "--tw-prose-links": "var(--tw-prose-invert-links)", "--tw-prose-bold": "var(--tw-prose-invert-bold)", "--tw-prose-counters": "var(--tw-prose-invert-counters)", "--tw-prose-bullets": "var(--tw-prose-invert-bullets)", "--tw-prose-hr": "var(--tw-prose-invert-hr)", "--tw-prose-quotes": "var(--tw-prose-invert-quotes)", "--tw-prose-quote-borders": "var(--tw-prose-invert-quote-borders)", "--tw-prose-captions": "var(--tw-prose-invert-captions)", "--tw-prose-kbd": "var(--tw-prose-invert-kbd)", "--tw-prose-kbd-shadows": "var(--tw-prose-invert-kbd-shadows)", "--tw-prose-code": "var(--tw-prose-invert-code)", "--tw-prose-pre-code": "var(--tw-prose-invert-pre-code)", "--tw-prose-pre-bg": "var(--tw-prose-invert-pre-bg)", "--tw-prose-th-borders": "var(--tw-prose-invert-th-borders)", "--tw-prose-td-borders": "var(--tw-prose-invert-td-borders)" } } };
  I7.exports = { DEFAULT: { css: [{ color: "var(--tw-prose-body)", maxWidth: "65ch", p: {}, '[class~="lead"]': { color: "var(--tw-prose-lead)" }, a: { color: "var(--tw-prose-links)", textDecoration: "underline", fontWeight: "500" }, strong: { color: "var(--tw-prose-bold)", fontWeight: "600" }, "a strong": { color: "inherit" }, "blockquote strong": { color: "inherit" }, "thead th strong": { color: "inherit" }, ol: { listStyleType: "decimal" }, 'ol[type="A"]': { listStyleType: "upper-alpha" }, 'ol[type="a"]': { listStyleType: "lower-alpha" }, 'ol[type="A" s]': { listStyleType: "upper-alpha" }, 'ol[type="a" s]': { listStyleType: "lower-alpha" }, 'ol[type="I"]': { listStyleType: "upper-roman" }, 'ol[type="i"]': { listStyleType: "lower-roman" }, 'ol[type="I" s]': { listStyleType: "upper-roman" }, 'ol[type="i" s]': { listStyleType: "lower-roman" }, 'ol[type="1"]': { listStyleType: "decimal" }, ul: { listStyleType: "disc" }, "ol > li::marker": { fontWeight: "400", color: "var(--tw-prose-counters)" }, "ul > li::marker": { color: "var(--tw-prose-bullets)" }, dt: { color: "var(--tw-prose-headings)", fontWeight: "600" }, hr: { borderColor: "var(--tw-prose-hr)", borderTopWidth: "1px" }, blockquote: { fontWeight: "500", fontStyle: "italic", color: "var(--tw-prose-quotes)", borderInlineStartWidth: "0.25rem", borderInlineStartColor: "var(--tw-prose-quote-borders)", quotes: '"\\201C""\\201D""\\2018""\\2019"' }, "blockquote p:first-of-type::before": { content: "open-quote" }, "blockquote p:last-of-type::after": { content: "close-quote" }, h1: { color: "var(--tw-prose-headings)", fontWeight: "800" }, "h1 strong": { fontWeight: "900", color: "inherit" }, h2: { color: "var(--tw-prose-headings)", fontWeight: "700" }, "h2 strong": { fontWeight: "800", color: "inherit" }, h3: { color: "var(--tw-prose-headings)", fontWeight: "600" }, "h3 strong": { fontWeight: "700", color: "inherit" }, h4: { color: "var(--tw-prose-headings)", fontWeight: "600" }, "h4 strong": { fontWeight: "700", color: "inherit" }, img: {}, picture: { display: "block" }, video: {}, kbd: { fontWeight: "500", fontFamily: "inherit", color: "var(--tw-prose-kbd)", boxShadow: "0 0 0 1px var(--tw-prose-kbd-shadows), 0 3px 0 var(--tw-prose-kbd-shadows)" }, code: { color: "var(--tw-prose-code)", fontWeight: "600" }, "code::before": { content: '"`"' }, "code::after": { content: '"`"' }, "a code": { color: "inherit" }, "h1 code": { color: "inherit" }, "h2 code": { color: "inherit" }, "h3 code": { color: "inherit" }, "h4 code": { color: "inherit" }, "blockquote code": { color: "inherit" }, "thead th code": { color: "inherit" }, pre: { color: "var(--tw-prose-pre-code)", backgroundColor: "var(--tw-prose-pre-bg)", overflowX: "auto", fontWeight: "400" }, "pre code": { backgroundColor: "transparent", borderWidth: "0", borderRadius: "0", padding: "0", fontWeight: "inherit", color: "inherit", fontSize: "inherit", fontFamily: "inherit", lineHeight: "inherit" }, "pre code::before": { content: "none" }, "pre code::after": { content: "none" }, table: { width: "100%", tableLayout: "auto", marginTop: t(32, 16), marginBottom: t(32, 16) }, thead: { borderBottomWidth: "1px", borderBottomColor: "var(--tw-prose-th-borders)" }, "thead th": { color: "var(--tw-prose-headings)", fontWeight: "600", verticalAlign: "bottom" }, "tbody tr": { borderBottomWidth: "1px", borderBottomColor: "var(--tw-prose-td-borders)" }, "tbody tr:last-child": { borderBottomWidth: "0" }, "tbody td": { verticalAlign: "baseline" }, tfoot: { borderTopWidth: "1px", borderTopColor: "var(--tw-prose-th-borders)" }, "tfoot td": { verticalAlign: "top" }, "th, td": { textAlign: "start" }, "figure > *": {}, figcaption: { color: "var(--tw-prose-captions)" } }, v6.gray.css, ...v6.base.css] }, ...v6 };
});
var E5 = T6((Z3, q5) => {
  var H4 = f5("postcss-selector-parser"), U4 = H4();
  function B3(e) {
    return typeof e == "object" && e !== null;
  }
  function w7(e) {
    if (typeof e != "object" || e === null || Object.prototype.toString.call(e) !== "[object Object]") return false;
    if (Object.getPrototypeOf(e) === null) return true;
    let i4 = e;
    for (; Object.getPrototypeOf(i4) !== null; ) i4 = Object.getPrototypeOf(i4);
    return Object.getPrototypeOf(e) === i4;
  }
  function b7(e, ...i4) {
    if (!i4.length) return e;
    let n3 = i4.shift();
    if (B3(e) && B3(n3)) for (let a4 in n3) Array.isArray(n3[a4]) ? (e[a4] || (e[a4] = []), n3[a4].forEach((s7, l3) => {
      w7(s7) && w7(e[a4][l3]) ? e[a4][l3] = b7(e[a4][l3], s7) : e[a4][l3] = s7;
    })) : w7(n3[a4]) ? (e[a4] || (e[a4] = {}), b7(e[a4], n3[a4])) : e[a4] = n3[a4];
    return b7(e, ...i4);
  }
  function N4(e) {
    return Array.isArray(e) ? e : [e];
  }
  q5.exports = { isObject: B3, isPlainObject: w7, merge: b7, castArray: N4, isUsableColor(e, i4) {
    return w7(i4) && e !== "gray" && i4[600];
  }, commonTrailingPseudos(e) {
    let i4 = U4.astSync(e), n3 = [];
    for (let [s7, l3] of i4.nodes.entries()) for (let [p4, d6] of [...l3.nodes].reverse().entries()) {
      if (d6.type !== "pseudo" || !d6.value.startsWith("::")) break;
      n3[p4] = n3[p4] || [], n3[p4][s7] = d6;
    }
    let a4 = H4.selector();
    for (let s7 of n3) {
      if (!s7) continue;
      if (new Set(s7.map((p4) => p4.value)).size > 1) break;
      s7.forEach((p4) => p4.remove()), a4.prepend(s7[0]);
    }
    return a4.nodes.length ? [a4.toString(), i4.toString()] : [null, e];
  } };
});
var O6 = T6((tt3, j5) => {
  var M6 = f5("tailwindcss/plugin"), X4 = z4(), { commonTrailingPseudos: G5, isObject: $3, isPlainObject: _6, merge: J5, castArray: K5 } = E5(), W5 = {};
  function S6(e, { className: i4, modifier: n3, prefix: a4 }) {
    let s7 = a4(`.not-${i4}`).slice(1), l3 = e.startsWith(">") ? `${n3 === "DEFAULT" ? `.${i4}` : `.${i4}-${n3}`} ` : "", [p4, d6] = G5(e);
    return p4 ? `:where(${l3}${d6}):not(:where([class~="${s7}"],[class~="${s7}"] *))${p4}` : `:where(${l3}${e}):not(:where([class~="${s7}"],[class~="${s7}"] *))`;
  }
  function Q3(e = {}, { target: i4, className: n3, modifier: a4, prefix: s7 }) {
    function l3(p4, d6) {
      return i4 === "legacy" ? [p4, d6] : Array.isArray(d6) ? [p4, d6] : $3(d6) ? Object.values(d6).some($3) ? [S6(p4, { className: n3, modifier: a4, prefix: s7 }), d6, Object.fromEntries(Object.entries(d6).map(([c5, u5]) => l3(c5, u5)))] : [S6(p4, { className: n3, modifier: a4, prefix: s7 }), d6] : [p4, d6];
    }
    return Object.fromEntries(Object.entries(J5({}, ...Object.keys(e).filter((p4) => W5[p4]).map((p4) => W5[p4](e[p4])), ...K5(e.css || {}))).map(([p4, d6]) => l3(p4, d6)));
  }
  j5.exports = M6.withOptions(({ className: e = "prose", target: i4 = "modern" } = {}) => function({ addVariant: n3, addComponents: a4, theme: s7, prefix: l3 }) {
    let p4 = s7("typography"), d6 = { className: e, prefix: l3 };
    for (let [h7, ...c5] of [["headings", "h1", "h2", "h3", "h4", "h5", "h6", "th"], ["h1"], ["h2"], ["h3"], ["h4"], ["h5"], ["h6"], ["p"], ["a"], ["blockquote"], ["figure"], ["figcaption"], ["strong"], ["em"], ["kbd"], ["code"], ["pre"], ["ol"], ["ul"], ["li"], ["dl"], ["dt"], ["dd"], ["table"], ["thead"], ["tr"], ["th"], ["td"], ["img"], ["picture"], ["video"], ["hr"], ["lead", '[class~="lead"]']]) {
      c5 = c5.length === 0 ? [h7] : c5;
      let u5 = i4 === "legacy" ? c5.map((x5) => `& ${x5}`) : c5.join(", ");
      n3(`${e}-${h7}`, i4 === "legacy" ? u5 : `& :is(${S6(u5, d6)})`);
    }
    a4(Object.keys(p4).map((h7) => ({ [h7 === "DEFAULT" ? `.${e}` : `.${e}-${h7}`]: Q3(p4[h7], { target: i4, className: e, modifier: h7, prefix: l3 }) })));
  }, () => ({ theme: { typography: X4 } }));
});
var y8 = L3(O6());
var ot3 = y8.default ?? y8;

// fs:/projects/nostrpop-1/tailwind.config.ts
var tailwind_config_default = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0"
          },
          to: {
            height: "var(--radix-accordion-content-height)"
          }
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)"
          },
          to: {
            height: "0"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [g2, ot3]
};

// esm:https://esm.sh/tailwindcss-cdn@3.4.10/es2022/tailwindcss-cdn.mjs
var Of = Object.create;
var ji = Object.defineProperty;
var _f = Object.getOwnPropertyDescriptor;
var Ef = Object.getOwnPropertyNames;
var Tf = Object.getPrototypeOf;
var If = Object.prototype.hasOwnProperty;
var fo = ((ve3) => typeof __require < "u" ? __require : typeof Proxy < "u" ? new Proxy(ve3, { get: (ge5, Je2) => (typeof __require < "u" ? __require : ge5)[Je2] }) : ve3)(function(ve3) {
  if (typeof __require < "u") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + ve3 + '" is not supported');
});
var Pf = (ve3, ge5) => () => (ge5 || ve3((ge5 = { exports: {} }).exports, ge5), ge5.exports);
var jf = (ve3, ge5, Je2, Gt) => {
  if (ge5 && typeof ge5 == "object" || typeof ge5 == "function") for (let lt2 of Ef(ge5)) !If.call(ve3, lt2) && lt2 !== Je2 && ji(ve3, lt2, { get: () => ge5[lt2], enumerable: !(Gt = _f(ge5, lt2)) || Gt.enumerable });
  return ve3;
};
var Bf = (ve3, ge5, Je2) => (Je2 = ve3 != null ? Of(Tf(ve3)) : {}, jf(ge5 || !ve3 || !ve3.__esModule ? ji(Je2, "default", { value: ve3, enumerable: true }) : Je2, ve3));
var Bi = Pf(() => {
  (() => {
    var ve3 = Object.create, ge5 = Object.defineProperty, Je2 = Object.getOwnPropertyDescriptor, Gt = Object.getOwnPropertyNames, lt2 = Object.getPrototypeOf, Di = Object.prototype.hasOwnProperty, mo = (e) => ge5(e, "__esModule", { value: true }), $i = (e) => {
      if (typeof fo < "u") return fo(e);
      throw new Error('Dynamic require of "' + e + '" is not supported');
    }, $3 = (e, t) => () => (e && (t = e(e = 0)), t), T7 = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), Fe2 = (e, t) => {
      mo(e);
      for (var r3 in t) ge5(e, r3, { get: t[r3], enumerable: true });
    }, Ri = (e, t, r3) => {
      if (t && typeof t == "object" || typeof t == "function") for (let n3 of Gt(t)) !Di.call(e, n3) && n3 !== "default" && ge5(e, n3, { get: () => t[n3], enumerable: !(r3 = Je2(t, n3)) || r3.enumerable });
      return e;
    }, he4 = (e) => Ri(mo(ge5(e != null ? ve3(lt2(e)) : {}, "default", e && e.__esModule && "default" in e ? { get: () => e.default, enumerable: true } : { value: e, enumerable: true })), e), je3, O7 = $3(() => {
      je3 = { platform: "", env: {}, versions: { node: "14.17.6" } };
    }), go, Be4, rt2 = $3(() => {
      O7(), go = 0, Be4 = { readFileSync: (e) => self[e] || "", statSync: () => ({ mtimeMs: go++ }), promises: { readFile: (e) => Promise.resolve(self[e] || "") } };
    }), vo = T7((e, t) => {
      O7();
      var r3 = class {
        constructor(n3 = {}) {
          if (!(n3.maxSize && n3.maxSize > 0)) throw new TypeError("`maxSize` must be a number greater than 0");
          if (typeof n3.maxAge == "number" && n3.maxAge === 0) throw new TypeError("`maxAge` must be a number greater than 0");
          this.maxSize = n3.maxSize, this.maxAge = n3.maxAge || 1 / 0, this.onEviction = n3.onEviction, this.cache = /* @__PURE__ */ new Map(), this.oldCache = /* @__PURE__ */ new Map(), this._size = 0;
        }
        _emitEvictions(n3) {
          if (typeof this.onEviction == "function") for (let [o7, s7] of n3) this.onEviction(o7, s7.value);
        }
        _deleteIfExpired(n3, o7) {
          return typeof o7.expiry == "number" && o7.expiry <= Date.now() ? (typeof this.onEviction == "function" && this.onEviction(n3, o7.value), this.delete(n3)) : false;
        }
        _getOrDeleteIfExpired(n3, o7) {
          if (this._deleteIfExpired(n3, o7) === false) return o7.value;
        }
        _getItemValue(n3, o7) {
          return o7.expiry ? this._getOrDeleteIfExpired(n3, o7) : o7.value;
        }
        _peek(n3, o7) {
          let s7 = o7.get(n3);
          return this._getItemValue(n3, s7);
        }
        _set(n3, o7) {
          this.cache.set(n3, o7), this._size++, this._size >= this.maxSize && (this._size = 0, this._emitEvictions(this.oldCache), this.oldCache = this.cache, this.cache = /* @__PURE__ */ new Map());
        }
        _moveToRecent(n3, o7) {
          this.oldCache.delete(n3), this._set(n3, o7);
        }
        *_entriesAscending() {
          for (let n3 of this.oldCache) {
            let [o7, s7] = n3;
            this.cache.has(o7) || this._deleteIfExpired(o7, s7) === false && (yield n3);
          }
          for (let n3 of this.cache) {
            let [o7, s7] = n3;
            this._deleteIfExpired(o7, s7) === false && (yield n3);
          }
        }
        get(n3) {
          if (this.cache.has(n3)) {
            let o7 = this.cache.get(n3);
            return this._getItemValue(n3, o7);
          }
          if (this.oldCache.has(n3)) {
            let o7 = this.oldCache.get(n3);
            if (this._deleteIfExpired(n3, o7) === false) return this._moveToRecent(n3, o7), o7.value;
          }
        }
        set(n3, o7, { maxAge: s7 = this.maxAge === 1 / 0 ? void 0 : Date.now() + this.maxAge } = {}) {
          this.cache.has(n3) ? this.cache.set(n3, { value: o7, maxAge: s7 }) : this._set(n3, { value: o7, expiry: s7 });
        }
        has(n3) {
          return this.cache.has(n3) ? !this._deleteIfExpired(n3, this.cache.get(n3)) : this.oldCache.has(n3) ? !this._deleteIfExpired(n3, this.oldCache.get(n3)) : false;
        }
        peek(n3) {
          if (this.cache.has(n3)) return this._peek(n3, this.cache);
          if (this.oldCache.has(n3)) return this._peek(n3, this.oldCache);
        }
        delete(n3) {
          let o7 = this.cache.delete(n3);
          return o7 && this._size--, this.oldCache.delete(n3) || o7;
        }
        clear() {
          this.cache.clear(), this.oldCache.clear(), this._size = 0;
        }
        resize(n3) {
          if (!(n3 && n3 > 0)) throw new TypeError("`maxSize` must be a number greater than 0");
          let o7 = [...this._entriesAscending()], s7 = o7.length - n3;
          s7 < 0 ? (this.cache = new Map(o7), this.oldCache = /* @__PURE__ */ new Map(), this._size = o7.length) : (s7 > 0 && this._emitEvictions(o7.slice(0, s7)), this.oldCache = new Map(o7.slice(s7)), this.cache = /* @__PURE__ */ new Map(), this._size = 0), this.maxSize = n3;
        }
        *keys() {
          for (let [n3] of this) yield n3;
        }
        *values() {
          for (let [, n3] of this) yield n3;
        }
        *[Symbol.iterator]() {
          for (let n3 of this.cache) {
            let [o7, s7] = n3;
            this._deleteIfExpired(o7, s7) === false && (yield [o7, s7.value]);
          }
          for (let n3 of this.oldCache) {
            let [o7, s7] = n3;
            this.cache.has(o7) || this._deleteIfExpired(o7, s7) === false && (yield [o7, s7.value]);
          }
        }
        *entriesDescending() {
          let n3 = [...this.cache];
          for (let o7 = n3.length - 1; o7 >= 0; --o7) {
            let s7 = n3[o7], [a4, l3] = s7;
            this._deleteIfExpired(a4, l3) === false && (yield [a4, l3.value]);
          }
          n3 = [...this.oldCache];
          for (let o7 = n3.length - 1; o7 >= 0; --o7) {
            let s7 = n3[o7], [a4, l3] = s7;
            this.cache.has(a4) || this._deleteIfExpired(a4, l3) === false && (yield [a4, l3.value]);
          }
        }
        *entriesAscending() {
          for (let [n3, o7] of this._entriesAscending()) yield [n3, o7.value];
        }
        get size() {
          if (!this._size) return this.oldCache.size;
          let n3 = 0;
          for (let o7 of this.oldCache.keys()) this.cache.has(o7) || n3++;
          return Math.min(this._size + n3, this.maxSize);
        }
      };
      t.exports = r3;
    }), yo, Mi = $3(() => {
      O7(), yo = (e) => e && e._hash;
    });
    function bo(e) {
      return yo(e, { ignoreUnknown: true });
    }
    var Ui = $3(() => {
      O7(), Mi();
    });
    function Yt(e) {
      if (e = `${e}`, e === "0") return "0";
      if (/^[+-]?(\d+|\d*\.\d+)(e[+-]?\d+)?(%|\w+)?$/.test(e)) return e.replace(/^[+-]?/, (r3) => r3 === "-" ? "" : "-");
      let t = ["var", "calc", "min", "max", "clamp"];
      for (let r3 of t) if (e.includes(`${r3}(`)) return `calc(${e} * -1)`;
    }
    var jr = $3(() => {
      O7();
    }), wo, zi = $3(() => {
      O7(), wo = ["preflight", "container", "accessibility", "pointerEvents", "visibility", "position", "inset", "isolation", "zIndex", "order", "gridColumn", "gridColumnStart", "gridColumnEnd", "gridRow", "gridRowStart", "gridRowEnd", "float", "clear", "margin", "boxSizing", "lineClamp", "display", "aspectRatio", "size", "height", "maxHeight", "minHeight", "width", "minWidth", "maxWidth", "flex", "flexShrink", "flexGrow", "flexBasis", "tableLayout", "captionSide", "borderCollapse", "borderSpacing", "transformOrigin", "translate", "rotate", "skew", "scale", "transform", "animation", "cursor", "touchAction", "userSelect", "resize", "scrollSnapType", "scrollSnapAlign", "scrollSnapStop", "scrollMargin", "scrollPadding", "listStylePosition", "listStyleType", "listStyleImage", "appearance", "columns", "breakBefore", "breakInside", "breakAfter", "gridAutoColumns", "gridAutoFlow", "gridAutoRows", "gridTemplateColumns", "gridTemplateRows", "flexDirection", "flexWrap", "placeContent", "placeItems", "alignContent", "alignItems", "justifyContent", "justifyItems", "gap", "space", "divideWidth", "divideStyle", "divideColor", "divideOpacity", "placeSelf", "alignSelf", "justifySelf", "overflow", "overscrollBehavior", "scrollBehavior", "textOverflow", "hyphens", "whitespace", "textWrap", "wordBreak", "borderRadius", "borderWidth", "borderStyle", "borderColor", "borderOpacity", "backgroundColor", "backgroundOpacity", "backgroundImage", "gradientColorStops", "boxDecorationBreak", "backgroundSize", "backgroundAttachment", "backgroundClip", "backgroundPosition", "backgroundRepeat", "backgroundOrigin", "fill", "stroke", "strokeWidth", "objectFit", "objectPosition", "padding", "textAlign", "textIndent", "verticalAlign", "fontFamily", "fontSize", "fontWeight", "textTransform", "fontStyle", "fontVariantNumeric", "lineHeight", "letterSpacing", "textColor", "textOpacity", "textDecoration", "textDecorationColor", "textDecorationStyle", "textDecorationThickness", "textUnderlineOffset", "fontSmoothing", "placeholderColor", "placeholderOpacity", "caretColor", "accentColor", "opacity", "backgroundBlendMode", "mixBlendMode", "boxShadow", "boxShadowColor", "outlineStyle", "outlineWidth", "outlineOffset", "outlineColor", "ringWidth", "ringColor", "ringOpacity", "ringOffsetWidth", "ringOffsetColor", "blur", "brightness", "contrast", "dropShadow", "grayscale", "hueRotate", "invert", "saturate", "sepia", "filter", "backdropBlur", "backdropBrightness", "backdropContrast", "backdropGrayscale", "backdropHueRotate", "backdropInvert", "backdropOpacity", "backdropSaturate", "backdropSepia", "backdropFilter", "transitionProperty", "transitionDelay", "transitionDuration", "transitionTimingFunction", "willChange", "contain", "content", "forcedColorAdjust"];
    });
    function Fi(e, t) {
      return e === void 0 ? t : Array.isArray(e) ? e : [...new Set(t.filter((r3) => e !== false && e[r3] !== false).concat(Object.keys(e).filter((r3) => e[r3] !== false)))];
    }
    var Li = $3(() => {
      O7();
    }), xo = {};
    Fe2(xo, { default: () => qe2 });
    var qe2, Br = $3(() => {
      O7(), qe2 = new Proxy({}, { get: () => String });
    });
    function Dr(e, t, r3) {
      typeof je3 < "u" && je3.env.JEST_WORKER_ID || r3 && $r.has(r3) || (r3 && $r.add(r3), console.warn(""), t.forEach((n3) => console.warn(e, "-", n3)));
    }
    function ko(e) {
      return qe2.dim(e);
    }
    var $r, de3, Ge2 = $3(() => {
      O7(), Br(), $r = /* @__PURE__ */ new Set(), de3 = { info(e, t) {
        Dr(qe2.bold(qe2.cyan("info")), ...Array.isArray(e) ? [e] : [t, e]);
      }, warn(e, t) {
        ["content-problems"].includes(e) || Dr(qe2.bold(qe2.yellow("warn")), ...Array.isArray(e) ? [e] : [t, e]);
      }, risk(e, t) {
        Dr(qe2.bold(qe2.magenta("risk")), ...Array.isArray(e) ? [e] : [t, e]);
      } };
    }), So = {};
    Fe2(So, { default: () => Rr2 });
    function It({ version: e, from: t, to: r3 }) {
      de3.warn(`${t}-color-renamed`, [`As of Tailwind CSS ${e}, \`${t}\` has been renamed to \`${r3}\`.`, "Update your configuration file to silence this warning."]);
    }
    var Rr2, Co = $3(() => {
      O7(), Ge2(), Rr2 = { inherit: "inherit", current: "currentColor", transparent: "transparent", black: "#000", white: "#fff", slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a", 950: "#020617" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#1a2e05" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#022c22" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#082f49" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2e1065" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#3b0764" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#4a044e" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#500724" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519" }, get lightBlue() {
        return It({ version: "v2.2", from: "lightBlue", to: "sky" }), this.sky;
      }, get warmGray() {
        return It({ version: "v3.0", from: "warmGray", to: "stone" }), this.stone;
      }, get trueGray() {
        return It({ version: "v3.0", from: "trueGray", to: "neutral" }), this.neutral;
      }, get coolGray() {
        return It({ version: "v3.0", from: "coolGray", to: "gray" }), this.gray;
      }, get blueGray() {
        return It({ version: "v3.0", from: "blueGray", to: "slate" }), this.slate;
      } };
    });
    function Ao(e, ...t) {
      for (let r3 of t) {
        for (let n3 in r3) e?.hasOwnProperty?.(n3) || (e[n3] = r3[n3]);
        for (let n3 of Object.getOwnPropertySymbols(r3)) e?.hasOwnProperty?.(n3) || (e[n3] = r3[n3]);
      }
      return e;
    }
    var Ni = $3(() => {
      O7();
    });
    function Pt2(e) {
      if (Array.isArray(e)) return e;
      let t = e.split("[").length - 1, r3 = e.split("]").length - 1;
      if (t !== r3) throw new Error(`Path is invalid. Has unbalanced brackets: ${e}`);
      return e.split(/\.(?![^\[]*\])|[\[\]]/g).filter(Boolean);
    }
    var Mr2 = $3(() => {
      O7();
    });
    function De3(e, t) {
      return jt.future.includes(t) ? e.future === "all" || (e?.future?.[t] ?? Ur2[t] ?? false) : jt.experimental.includes(t) ? e.experimental === "all" || (e?.experimental?.[t] ?? Ur2[t] ?? false) : false;
    }
    function Oo(e) {
      return e.experimental === "all" ? jt.experimental : Object.keys(e?.experimental ?? {}).filter((t) => jt.experimental.includes(t) && e.experimental[t]);
    }
    function Vi(e) {
      if (je3.env.JEST_WORKER_ID === void 0 && Oo(e).length > 0) {
        let t = Oo(e).map((r3) => qe2.yellow(r3)).join(", ");
        de3.warn("experimental-flags-enabled", [`You have enabled experimental features: ${t}`, "Experimental features in Tailwind CSS are not covered by semver, may introduce breaking changes, and can change at any time."]);
      }
    }
    var Ur2, jt, nt3 = $3(() => {
      O7(), Br(), Ge2(), Ur2 = { optimizeUniversalDefaults: false, generalizedModifiers: true, disableColorOpacityUtilitiesByDefault: false, relativeContentPathsByDefault: false }, jt = { future: ["hoverOnlyWhenSupported", "respectDefaultRingColorOpacity", "disableColorOpacityUtilitiesByDefault", "relativeContentPathsByDefault"], experimental: ["optimizeUniversalDefaults", "generalizedModifiers"] };
    });
    function Wi(e) {
      (() => {
        if (e.purge || !e.content || !Array.isArray(e.content) && !(typeof e.content == "object" && e.content !== null)) return false;
        if (Array.isArray(e.content)) return e.content.every((t) => typeof t == "string" ? true : !(typeof t?.raw != "string" || t?.extension && typeof t?.extension != "string"));
        if (typeof e.content == "object" && e.content !== null) {
          if (Object.keys(e.content).some((t) => !["files", "relative", "extract", "transform"].includes(t))) return false;
          if (Array.isArray(e.content.files)) {
            if (!e.content.files.every((t) => typeof t == "string" ? true : !(typeof t?.raw != "string" || t?.extension && typeof t?.extension != "string"))) return false;
            if (typeof e.content.extract == "object") {
              for (let t of Object.values(e.content.extract)) if (typeof t != "function") return false;
            } else if (!(e.content.extract === void 0 || typeof e.content.extract == "function")) return false;
            if (typeof e.content.transform == "object") {
              for (let t of Object.values(e.content.transform)) if (typeof t != "function") return false;
            } else if (!(e.content.transform === void 0 || typeof e.content.transform == "function")) return false;
            if (typeof e.content.relative != "boolean" && typeof e.content.relative < "u") return false;
          }
          return true;
        }
        return false;
      })() || de3.warn("purge-deprecation", ["The `purge`/`content` options have changed in Tailwind CSS v3.0.", "Update your configuration file to eliminate this warning.", "https://tailwindcss.com/docs/upgrade-guide#configure-content-sources"]), e.safelist = (() => {
        let { content: t, purge: r3, safelist: n3 } = e;
        return Array.isArray(n3) ? n3 : Array.isArray(t?.safelist) ? t.safelist : Array.isArray(r3?.safelist) ? r3.safelist : Array.isArray(r3?.options?.safelist) ? r3.options.safelist : [];
      })(), e.blocklist = (() => {
        let { blocklist: t } = e;
        if (Array.isArray(t)) {
          if (t.every((r3) => typeof r3 == "string")) return t;
          de3.warn("blocklist-invalid", ["The `blocklist` option must be an array of strings.", "https://tailwindcss.com/docs/content-configuration#discarding-classes"]);
        }
        return [];
      })(), typeof e.prefix == "function" ? (de3.warn("prefix-function", ["As of Tailwind CSS v3.0, `prefix` cannot be a function.", "Update `prefix` in your configuration to be a string to eliminate this warning.", "https://tailwindcss.com/docs/upgrade-guide#prefix-cannot-be-a-function"]), e.prefix = "") : e.prefix = e.prefix ?? "", e.content = { relative: (() => {
        let { content: t } = e;
        return t?.relative ? t.relative : De3(e, "relativeContentPathsByDefault");
      })(), files: (() => {
        let { content: t, purge: r3 } = e;
        return Array.isArray(r3) ? r3 : Array.isArray(r3?.content) ? r3.content : Array.isArray(t) ? t : Array.isArray(t?.content) ? t.content : Array.isArray(t?.files) ? t.files : [];
      })(), extract: (() => {
        let t = e.purge?.extract ? e.purge.extract : e.content?.extract ? e.content.extract : e.purge?.extract?.DEFAULT ? e.purge.extract.DEFAULT : e.content?.extract?.DEFAULT ? e.content.extract.DEFAULT : e.purge?.options?.extractors ? e.purge.options.extractors : e.content?.options?.extractors ? e.content.options.extractors : {}, r3 = {}, n3 = (() => {
          if (e.purge?.options?.defaultExtractor) return e.purge.options.defaultExtractor;
          if (e.content?.options?.defaultExtractor) return e.content.options.defaultExtractor;
        })();
        if (n3 !== void 0 && (r3.DEFAULT = n3), typeof t == "function") r3.DEFAULT = t;
        else if (Array.isArray(t)) for (let { extensions: o7, extractor: s7 } of t ?? []) for (let a4 of o7) r3[a4] = s7;
        else typeof t == "object" && t !== null && Object.assign(r3, t);
        return r3;
      })(), transform: (() => {
        let t = e.purge?.transform ? e.purge.transform : e.content?.transform ? e.content.transform : e.purge?.transform?.DEFAULT ? e.purge.transform.DEFAULT : e.content?.transform?.DEFAULT ? e.content.transform.DEFAULT : {}, r3 = {};
        return typeof t == "function" ? r3.DEFAULT = t : typeof t == "object" && t !== null && Object.assign(r3, t), r3;
      })() };
      for (let t of e.content.files) if (typeof t == "string" && /{([^,]*?)}/g.test(t)) {
        de3.warn("invalid-glob-braces", [`The glob pattern ${ko(t)} in your Tailwind CSS configuration is invalid.`, `Update it to ${ko(t.replace(/{([^,]*?)}/g, "$1"))} to silence this warning.`]);
        break;
      }
      return e;
    }
    var qi = $3(() => {
      O7(), nt3(), Ge2();
    });
    function Le2(e) {
      if (Object.prototype.toString.call(e) !== "[object Object]") return false;
      let t = Object.getPrototypeOf(e);
      return t === null || Object.getPrototypeOf(t) === null;
    }
    var Bt = $3(() => {
      O7();
    });
    function Dt2(e) {
      return Array.isArray(e) ? e.map((t) => Dt2(t)) : typeof e == "object" && e !== null ? Object.fromEntries(Object.entries(e).map(([t, r3]) => [t, Dt2(r3)])) : e;
    }
    var zr = $3(() => {
      O7();
    });
    function Fr2(e) {
      return e.replace(/\\,/g, "\\2c ");
    }
    var Lr = $3(() => {
      O7();
    }), Nr2, Gi = $3(() => {
      O7(), Nr2 = { aliceblue: [240, 248, 255], antiquewhite: [250, 235, 215], aqua: [0, 255, 255], aquamarine: [127, 255, 212], azure: [240, 255, 255], beige: [245, 245, 220], bisque: [255, 228, 196], black: [0, 0, 0], blanchedalmond: [255, 235, 205], blue: [0, 0, 255], blueviolet: [138, 43, 226], brown: [165, 42, 42], burlywood: [222, 184, 135], cadetblue: [95, 158, 160], chartreuse: [127, 255, 0], chocolate: [210, 105, 30], coral: [255, 127, 80], cornflowerblue: [100, 149, 237], cornsilk: [255, 248, 220], crimson: [220, 20, 60], cyan: [0, 255, 255], darkblue: [0, 0, 139], darkcyan: [0, 139, 139], darkgoldenrod: [184, 134, 11], darkgray: [169, 169, 169], darkgreen: [0, 100, 0], darkgrey: [169, 169, 169], darkkhaki: [189, 183, 107], darkmagenta: [139, 0, 139], darkolivegreen: [85, 107, 47], darkorange: [255, 140, 0], darkorchid: [153, 50, 204], darkred: [139, 0, 0], darksalmon: [233, 150, 122], darkseagreen: [143, 188, 143], darkslateblue: [72, 61, 139], darkslategray: [47, 79, 79], darkslategrey: [47, 79, 79], darkturquoise: [0, 206, 209], darkviolet: [148, 0, 211], deeppink: [255, 20, 147], deepskyblue: [0, 191, 255], dimgray: [105, 105, 105], dimgrey: [105, 105, 105], dodgerblue: [30, 144, 255], firebrick: [178, 34, 34], floralwhite: [255, 250, 240], forestgreen: [34, 139, 34], fuchsia: [255, 0, 255], gainsboro: [220, 220, 220], ghostwhite: [248, 248, 255], gold: [255, 215, 0], goldenrod: [218, 165, 32], gray: [128, 128, 128], green: [0, 128, 0], greenyellow: [173, 255, 47], grey: [128, 128, 128], honeydew: [240, 255, 240], hotpink: [255, 105, 180], indianred: [205, 92, 92], indigo: [75, 0, 130], ivory: [255, 255, 240], khaki: [240, 230, 140], lavender: [230, 230, 250], lavenderblush: [255, 240, 245], lawngreen: [124, 252, 0], lemonchiffon: [255, 250, 205], lightblue: [173, 216, 230], lightcoral: [240, 128, 128], lightcyan: [224, 255, 255], lightgoldenrodyellow: [250, 250, 210], lightgray: [211, 211, 211], lightgreen: [144, 238, 144], lightgrey: [211, 211, 211], lightpink: [255, 182, 193], lightsalmon: [255, 160, 122], lightseagreen: [32, 178, 170], lightskyblue: [135, 206, 250], lightslategray: [119, 136, 153], lightslategrey: [119, 136, 153], lightsteelblue: [176, 196, 222], lightyellow: [255, 255, 224], lime: [0, 255, 0], limegreen: [50, 205, 50], linen: [250, 240, 230], magenta: [255, 0, 255], maroon: [128, 0, 0], mediumaquamarine: [102, 205, 170], mediumblue: [0, 0, 205], mediumorchid: [186, 85, 211], mediumpurple: [147, 112, 219], mediumseagreen: [60, 179, 113], mediumslateblue: [123, 104, 238], mediumspringgreen: [0, 250, 154], mediumturquoise: [72, 209, 204], mediumvioletred: [199, 21, 133], midnightblue: [25, 25, 112], mintcream: [245, 255, 250], mistyrose: [255, 228, 225], moccasin: [255, 228, 181], navajowhite: [255, 222, 173], navy: [0, 0, 128], oldlace: [253, 245, 230], olive: [128, 128, 0], olivedrab: [107, 142, 35], orange: [255, 165, 0], orangered: [255, 69, 0], orchid: [218, 112, 214], palegoldenrod: [238, 232, 170], palegreen: [152, 251, 152], paleturquoise: [175, 238, 238], palevioletred: [219, 112, 147], papayawhip: [255, 239, 213], peachpuff: [255, 218, 185], peru: [205, 133, 63], pink: [255, 192, 203], plum: [221, 160, 221], powderblue: [176, 224, 230], purple: [128, 0, 128], rebeccapurple: [102, 51, 153], red: [255, 0, 0], rosybrown: [188, 143, 143], royalblue: [65, 105, 225], saddlebrown: [139, 69, 19], salmon: [250, 128, 114], sandybrown: [244, 164, 96], seagreen: [46, 139, 87], seashell: [255, 245, 238], sienna: [160, 82, 45], silver: [192, 192, 192], skyblue: [135, 206, 235], slateblue: [106, 90, 205], slategray: [112, 128, 144], slategrey: [112, 128, 144], snow: [255, 250, 250], springgreen: [0, 255, 127], steelblue: [70, 130, 180], tan: [210, 180, 140], teal: [0, 128, 128], thistle: [216, 191, 216], tomato: [255, 99, 71], turquoise: [64, 224, 208], violet: [238, 130, 238], wheat: [245, 222, 179], white: [255, 255, 255], whitesmoke: [245, 245, 245], yellow: [255, 255, 0], yellowgreen: [154, 205, 50] };
    });
    function Vr(e, { loose: t = false } = {}) {
      if (typeof e != "string") return null;
      if (e = e.trim(), e === "transparent") return { mode: "rgb", color: ["0", "0", "0"], alpha: "0" };
      if (e in Nr2) return { mode: "rgb", color: Nr2[e].map((s7) => s7.toString()) };
      let r3 = e.replace(To, (s7, a4, l3, c5, i4) => ["#", a4, a4, l3, l3, c5, c5, i4 ? i4 + i4 : ""].join("")).match(Eo);
      if (r3 !== null) return { mode: "rgb", color: [parseInt(r3[1], 16), parseInt(r3[2], 16), parseInt(r3[3], 16)].map((s7) => s7.toString()), alpha: r3[4] ? (parseInt(r3[4], 16) / 255).toString() : void 0 };
      let n3 = e.match(Io) ?? e.match(Po);
      if (n3 === null) return null;
      let o7 = [n3[2], n3[3], n3[4]].filter(Boolean).map((s7) => s7.toString());
      return o7.length === 2 && o7[0].startsWith("var(") ? { mode: n3[1], color: [o7[0]], alpha: o7[1] } : !t && o7.length !== 3 || o7.length < 3 && !o7.some((s7) => /^var\(.*?\)$/.test(s7)) ? null : { mode: n3[1], color: o7, alpha: n3[5]?.toString?.() };
    }
    function _o({ mode: e, color: t, alpha: r3 }) {
      let n3 = r3 !== void 0;
      return e === "rgba" || e === "hsla" ? `${e}(${t.join(", ")}${n3 ? `, ${r3}` : ""})` : `${e}(${t.join(" ")}${n3 ? ` / ${r3}` : ""})`;
    }
    var Eo, To, Ze2, $t, Wr2, Xe2, Io, Po, jo = $3(() => {
      O7(), Gi(), Eo = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i, To = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i, Ze2 = /(?:\d+|\d*\.\d+)%?/, $t = /(?:\s*,\s*|\s+)/, Wr2 = /\s*[,/]\s*/, Xe2 = /var\(--(?:[^ )]*?)(?:,(?:[^ )]*?|var\(--[^ )]*?\)))?\)/, Io = new RegExp(`^(rgba?)\\(\\s*(${Ze2.source}|${Xe2.source})(?:${$t.source}(${Ze2.source}|${Xe2.source}))?(?:${$t.source}(${Ze2.source}|${Xe2.source}))?(?:${Wr2.source}(${Ze2.source}|${Xe2.source}))?\\s*\\)$`), Po = new RegExp(`^(hsla?)\\(\\s*((?:${Ze2.source})(?:deg|rad|grad|turn)?|${Xe2.source})(?:${$t.source}(${Ze2.source}|${Xe2.source}))?(?:${$t.source}(${Ze2.source}|${Xe2.source}))?(?:${Wr2.source}(${Ze2.source}|${Xe2.source}))?\\s*\\)$`);
    });
    function wt2(e, t, r3) {
      if (typeof e == "function") return e({ opacityValue: t });
      let n3 = Vr(e, { loose: true });
      return n3 === null ? r3 : _o({ ...n3, alpha: t });
    }
    function Oe3({ color: e, property: t, variable: r3 }) {
      let n3 = [].concat(t);
      if (typeof e == "function") return { [r3]: "1", ...Object.fromEntries(n3.map((s7) => [s7, e({ opacityVariable: r3, opacityValue: `var(${r3})` })])) };
      let o7 = Vr(e);
      return o7 === null ? Object.fromEntries(n3.map((s7) => [s7, e])) : o7.alpha !== void 0 ? Object.fromEntries(n3.map((s7) => [s7, e])) : { [r3]: "1", ...Object.fromEntries(n3.map((s7) => [s7, _o({ ...o7, alpha: `var(${r3})` })])) };
    }
    var Ht = $3(() => {
      O7(), jo();
    });
    function $e2(e, t) {
      let r3 = [], n3 = [], o7 = 0, s7 = false;
      for (let a4 = 0; a4 < e.length; a4++) {
        let l3 = e[a4];
        r3.length === 0 && l3 === t[0] && !s7 && (t.length === 1 || e.slice(a4, a4 + t.length) === t) && (n3.push(e.slice(o7, a4)), o7 = a4 + t.length), s7 = s7 ? false : l3 === "\\", l3 === "(" || l3 === "[" || l3 === "{" ? r3.push(l3) : (l3 === ")" && r3[r3.length - 1] === "(" || l3 === "]" && r3[r3.length - 1] === "[" || l3 === "}" && r3[r3.length - 1] === "{") && r3.pop();
      }
      return n3.push(e.slice(o7)), n3;
    }
    var xt2 = $3(() => {
      O7();
    });
    function Bo(e) {
      return $e2(e, ",").map((t) => {
        let r3 = t.trim(), n3 = { raw: r3 }, o7 = r3.split($o), s7 = /* @__PURE__ */ new Set();
        for (let a4 of o7) qr.lastIndex = 0, !s7.has("KEYWORD") && Do.has(a4) ? (n3.keyword = a4, s7.add("KEYWORD")) : qr.test(a4) ? s7.has("X") ? s7.has("Y") ? s7.has("BLUR") ? s7.has("SPREAD") || (n3.spread = a4, s7.add("SPREAD")) : (n3.blur = a4, s7.add("BLUR")) : (n3.y = a4, s7.add("Y")) : (n3.x = a4, s7.add("X")) : n3.color ? (n3.unknown || (n3.unknown = []), n3.unknown.push(a4)) : n3.color = a4;
        return n3.valid = n3.x !== void 0 && n3.y !== void 0, n3;
      });
    }
    function Yi(e) {
      return e.map((t) => t.valid ? [t.keyword, t.x, t.y, t.blur, t.spread, t.color].filter(Boolean).join(" ") : t.raw).join(", ");
    }
    var Do, $o, qr, Ro = $3(() => {
      O7(), xt2(), Do = /* @__PURE__ */ new Set(["inset", "inherit", "initial", "revert", "unset"]), $o = /\ +(?![^(]*\))/g, qr = /^-?(\d+|\.\d+)(.*?)$/g;
    });
    function Gr(e) {
      return zo.some((t) => new RegExp(`^${t}\\(.*\\)`).test(e));
    }
    function oe3(e, t = null, r3 = true) {
      let n3 = t && Fo.has(t.property);
      return e.startsWith("--") && !n3 ? `var(${e})` : e.includes("url(") ? e.split(/(url\(.*?\))/g).filter(Boolean).map((o7) => /^url\(.*?\)$/.test(o7) ? o7 : oe3(o7, t, false)).join("") : (e = e.replace(/([^\\])_+/g, (o7, s7) => s7 + " ".repeat(o7.length - 1)).replace(/^_/g, " ").replace(/\\_/g, "_"), r3 && (e = e.trim()), e = Hi(e), e);
    }
    function Hi(e) {
      let t = ["theme"], r3 = ["min-content", "max-content", "fit-content", "safe-area-inset-top", "safe-area-inset-right", "safe-area-inset-bottom", "safe-area-inset-left", "titlebar-area-x", "titlebar-area-y", "titlebar-area-width", "titlebar-area-height", "keyboard-inset-top", "keyboard-inset-right", "keyboard-inset-bottom", "keyboard-inset-left", "keyboard-inset-width", "keyboard-inset-height", "radial-gradient", "linear-gradient", "conic-gradient", "repeating-radial-gradient", "repeating-linear-gradient", "repeating-conic-gradient"];
      return e.replace(/(calc|min|max|clamp)\(.+\)/g, (n3) => {
        let o7 = "";
        function s7() {
          let a4 = o7.trimEnd();
          return a4[a4.length - 1];
        }
        for (let a4 = 0; a4 < n3.length; a4++) {
          let l3 = function(d6) {
            return d6.split("").every((u5, p4) => n3[a4 + p4] === u5);
          }, c5 = function(d6) {
            let u5 = 1 / 0;
            for (let f6 of d6) {
              let g6 = n3.indexOf(f6, a4);
              g6 !== -1 && g6 < u5 && (u5 = g6);
            }
            let p4 = n3.slice(a4, u5);
            return a4 += p4.length - 1, p4;
          }, i4 = n3[a4];
          if (l3("var")) o7 += c5([")", ","]);
          else if (r3.some((d6) => l3(d6))) {
            let d6 = r3.find((u5) => l3(u5));
            o7 += d6, a4 += d6.length - 1;
          } else t.some((d6) => l3(d6)) ? o7 += c5([")"]) : l3("[") ? o7 += c5(["]"]) : ["+", "-", "*", "/"].includes(i4) && !["(", "+", "-", "*", "/", ","].includes(s7()) ? o7 += ` ${i4} ` : o7 += i4;
        }
        return o7.replace(/\s+/g, " ");
      });
    }
    function Mo(e) {
      return e.startsWith("url(");
    }
    function Uo(e) {
      return !isNaN(Number(e)) || Gr(e);
    }
    function Yr(e) {
      return e.endsWith("%") && Uo(e.slice(0, -1)) || Gr(e);
    }
    function Hr(e) {
      return e === "0" || new RegExp(`^[+-]?[0-9]*.?[0-9]+(?:[eE][+-]?[0-9]+)?${No}$`).test(e) || Gr(e);
    }
    function Qi(e) {
      return Vo.has(e);
    }
    function Ji(e) {
      let t = Bo(oe3(e));
      for (let r3 of t) if (!r3.valid) return false;
      return true;
    }
    function Zi(e) {
      let t = 0;
      return $e2(e, "_").every((r3) => (r3 = oe3(r3), r3.startsWith("var(") ? true : Vr(r3, { loose: true }) !== null ? (t++, true) : false)) ? t > 0 : false;
    }
    function Xi(e) {
      let t = 0;
      return $e2(e, ",").every((r3) => (r3 = oe3(r3), r3.startsWith("var(") ? true : Mo(r3) || Ki(r3) || ["element(", "image(", "cross-fade(", "image-set("].some((n3) => r3.startsWith(n3)) ? (t++, true) : false)) ? t > 0 : false;
    }
    function Ki(e) {
      e = oe3(e);
      for (let t of Wo) if (e.startsWith(`${t}(`)) return true;
      return false;
    }
    function el(e) {
      let t = 0;
      return $e2(e, "_").every((r3) => (r3 = oe3(r3), r3.startsWith("var(") ? true : qo.has(r3) || Hr(r3) || Yr(r3) ? (t++, true) : false)) ? t > 0 : false;
    }
    function tl(e) {
      let t = 0;
      return $e2(e, ",").every((r3) => (r3 = oe3(r3), r3.startsWith("var(") ? true : r3.includes(" ") && !/(['"])([^"']+)\1/g.test(r3) || /^\d/g.test(r3) ? false : (t++, true))) ? t > 0 : false;
    }
    function rl(e) {
      return Go.has(e);
    }
    function nl(e) {
      return Yo.has(e);
    }
    function ol(e) {
      return Ho.has(e);
    }
    var zo, Fo, Lo, No, Vo, Wo, qo, Go, Yo, Ho, Qt = $3(() => {
      O7(), jo(), Ro(), xt2(), zo = ["min", "max", "clamp", "calc"], Fo = /* @__PURE__ */ new Set(["scroll-timeline-name", "timeline-scope", "view-timeline-name", "font-palette", "anchor-name", "anchor-scope", "position-anchor", "position-try-options", "scroll-timeline", "animation-timeline", "view-timeline", "position-try"]), Lo = ["cm", "mm", "Q", "in", "pc", "pt", "px", "em", "ex", "ch", "rem", "lh", "rlh", "vw", "vh", "vmin", "vmax", "vb", "vi", "svw", "svh", "lvw", "lvh", "dvw", "dvh", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax"], No = `(?:${Lo.join("|")})`, Vo = /* @__PURE__ */ new Set(["thin", "medium", "thick"]), Wo = /* @__PURE__ */ new Set(["conic-gradient", "linear-gradient", "radial-gradient", "repeating-conic-gradient", "repeating-linear-gradient", "repeating-radial-gradient"]), qo = /* @__PURE__ */ new Set(["center", "top", "right", "bottom", "left"]), Go = /* @__PURE__ */ new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong"]), Yo = /* @__PURE__ */ new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"]), Ho = /* @__PURE__ */ new Set(["larger", "smaller"]);
    });
    function sl(e) {
      let t = ["cover", "contain"];
      return $e2(e, ",").every((r3) => {
        let n3 = $e2(r3, "_").filter(Boolean);
        return n3.length === 1 && t.includes(n3[0]) ? true : n3.length !== 1 && n3.length !== 2 ? false : n3.every((o7) => Hr(o7) || Yr(o7) || o7 === "auto");
      });
    }
    var al = $3(() => {
      O7(), Qt(), xt2();
    });
    function il(e, t) {
      e.walkClasses((r3) => {
        r3.value = t(r3.value), r3.raws && r3.raws.value && (r3.raws.value = Fr2(r3.raws.value));
      });
    }
    function Qo(e, t) {
      if (!ot4(e)) return;
      let r3 = e.slice(1, -1);
      if (t(r3)) return oe3(r3);
    }
    function ll(e, t = {}, r3) {
      let n3 = t[e];
      if (n3 !== void 0) return Yt(n3);
      if (ot4(e)) {
        let o7 = Qo(e, r3);
        return o7 === void 0 ? void 0 : Yt(o7);
      }
    }
    function Jt(e, t = {}, { validate: r3 = () => true } = {}) {
      let n3 = t.values?.[e];
      return n3 !== void 0 ? n3 : t.supportsNegativeValues && e.startsWith("-") ? ll(e.slice(1), t.values, r3) : Qo(e, r3);
    }
    function ot4(e) {
      return e.startsWith("[") && e.endsWith("]");
    }
    function Jo(e) {
      let t = e.lastIndexOf("/"), r3 = e.lastIndexOf("[", t), n3 = e.indexOf("]", t);
      return e[t - 1] === "]" || e[t + 1] === "[" || r3 !== -1 && n3 !== -1 && r3 < t && t < n3 && (t = e.lastIndexOf("/", r3)), t === -1 || t === e.length - 1 ? [e, void 0] : ot4(e) && !e.includes("]/[") ? [e, void 0] : [e.slice(0, t), e.slice(t + 1)];
    }
    function Zt(e) {
      if (typeof e == "string" && e.includes("<alpha-value>")) {
        let t = e;
        return ({ opacityValue: r3 = 1 }) => t.replace(/<alpha-value>/g, r3);
      }
      return e;
    }
    function Zo(e) {
      return oe3(e.slice(1, -1));
    }
    function cl(e, t = {}, { tailwindConfig: r3 = {} } = {}) {
      if (t.values?.[e] !== void 0) return Zt(t.values?.[e]);
      let [n3, o7] = Jo(e);
      if (o7 !== void 0) {
        let s7 = t.values?.[n3] ?? (ot4(n3) ? n3.slice(1, -1) : void 0);
        return s7 === void 0 ? void 0 : (s7 = Zt(s7), ot4(o7) ? wt2(s7, Zo(o7)) : r3.theme?.opacity?.[o7] === void 0 ? void 0 : wt2(s7, r3.theme.opacity[o7]));
      }
      return Jt(e, t, { validate: Zi });
    }
    function ul(e, t = {}) {
      return t.values?.[e];
    }
    function Ee3(e) {
      return (t, r3) => Jt(t, r3, { validate: e });
    }
    function dl(e, t) {
      let r3 = e.indexOf(t);
      return r3 === -1 ? [void 0, e] : [e.slice(0, r3), e.slice(r3 + 1)];
    }
    function Xo(e, t, r3, n3) {
      if (r3.values && t in r3.values) for (let { type: s7 } of e ?? []) {
        let a4 = Xt[s7](t, r3, { tailwindConfig: n3 });
        if (a4 !== void 0) return [a4, s7, null];
      }
      if (ot4(t)) {
        let s7 = t.slice(1, -1), [a4, l3] = dl(s7, ":");
        if (!/^[\w-_]+$/g.test(a4)) l3 = s7;
        else if (a4 !== void 0 && !Qr.includes(a4)) return [];
        if (l3.length > 0 && Qr.includes(a4)) return [Jt(`[${l3}]`, r3), a4, null];
      }
      let o7 = Ko(e, t, r3, n3);
      for (let s7 of o7) return s7;
      return [];
    }
    function* Ko(e, t, r3, n3) {
      let o7 = De3(n3, "generalizedModifiers"), [s7, a4] = Jo(t);
      if (o7 && r3.modifiers != null && (r3.modifiers === "any" || typeof r3.modifiers == "object" && (a4 && ot4(a4) || a4 in r3.modifiers)) || (s7 = t, a4 = void 0), a4 !== void 0 && s7 === "" && (s7 = "DEFAULT"), a4 !== void 0 && typeof r3.modifiers == "object") {
        let l3 = r3.modifiers?.[a4] ?? null;
        l3 !== null ? a4 = l3 : ot4(a4) && (a4 = Zo(a4));
      }
      for (let { type: l3 } of e ?? []) {
        let c5 = Xt[l3](s7, r3, { tailwindConfig: n3 });
        c5 !== void 0 && (yield [c5, l3, a4 ?? null]);
      }
    }
    var Xt, Qr, Kt = $3(() => {
      O7(), Lr(), Ht(), Qt(), jr(), al(), nt3(), Xt = { any: Jt, color: cl, url: Ee3(Mo), image: Ee3(Xi), length: Ee3(Hr), percentage: Ee3(Yr), position: Ee3(el), lookup: ul, "generic-name": Ee3(rl), "family-name": Ee3(tl), number: Ee3(Uo), "line-width": Ee3(Qi), "absolute-size": Ee3(nl), "relative-size": Ee3(ol), shadow: Ee3(Ji), size: Ee3(sl) }, Qr = Object.keys(Xt);
    });
    function se3(e) {
      return typeof e == "function" ? e({}) : e;
    }
    var es = $3(() => {
      O7();
    });
    function kt3(e) {
      return typeof e == "function";
    }
    function Rt(e, ...t) {
      let r3 = t.pop();
      for (let n3 of t) for (let o7 in n3) {
        let s7 = r3(e[o7], n3[o7]);
        s7 === void 0 ? Le2(e[o7]) && Le2(n3[o7]) ? e[o7] = Rt({}, e[o7], n3[o7], r3) : e[o7] = n3[o7] : e[o7] = s7;
      }
      return e;
    }
    function pl(e, ...t) {
      return kt3(e) ? e(...t) : e;
    }
    function fl(e) {
      return e.reduce((t, { extend: r3 }) => Rt(t, r3, (n3, o7) => n3 === void 0 ? [o7] : Array.isArray(n3) ? [o7, ...n3] : [o7, n3]), {});
    }
    function hl(e) {
      return { ...e.reduce((t, r3) => Ao(t, r3), {}), extend: fl(e) };
    }
    function ts(e, t) {
      if (Array.isArray(e) && Le2(e[0])) return e.concat(t);
      if (Array.isArray(t) && Le2(t[0]) && Le2(e)) return [e, ...t];
      if (Array.isArray(t)) return t;
    }
    function ml({ extend: e, ...t }) {
      return Rt(t, e, (r3, n3) => !kt3(r3) && !n3.some(kt3) ? Rt({}, r3, ...n3, ts) : (o7, s7) => Rt({}, ...[r3, ...n3].map((a4) => pl(a4, o7, s7)), ts));
    }
    function* gl(e) {
      let t = Pt2(e);
      if (t.length === 0 || (yield t, Array.isArray(e))) return;
      let r3 = /^(.*?)\s*\/\s*([^/]+)$/, n3 = e.match(r3);
      if (n3 !== null) {
        let [, o7, s7] = n3, a4 = Pt2(o7);
        a4.alpha = s7, yield a4;
      }
    }
    function vl(e) {
      let t = (r3, n3) => {
        for (let o7 of gl(r3)) {
          let s7 = 0, a4 = e;
          for (; a4 != null && s7 < o7.length; ) a4 = a4[o7[s7++]], a4 = kt3(a4) && (o7.alpha === void 0 || s7 <= o7.length - 1) ? a4(t, er) : a4;
          if (a4 !== void 0) {
            if (o7.alpha !== void 0) {
              let l3 = Zt(a4);
              return wt2(l3, o7.alpha, se3(l3));
            }
            return Le2(a4) ? Dt2(a4) : a4;
          }
        }
        return n3;
      };
      return Object.assign(t, { theme: t, ...er }), Object.keys(e).reduce((r3, n3) => (r3[n3] = kt3(e[n3]) ? e[n3](t, er) : e[n3], r3), {});
    }
    function rs(e) {
      let t = [];
      return e.forEach((r3) => {
        t = [...t, r3];
        let n3 = r3?.plugins ?? [];
        n3.length !== 0 && n3.forEach((o7) => {
          o7.__isOptionsFunction && (o7 = o7()), t = [...t, ...rs([o7?.config ?? {}])];
        });
      }), t;
    }
    function yl(e) {
      return [...e].reduceRight((t, r3) => kt3(r3) ? r3({ corePlugins: t }) : Fi(r3, t), wo);
    }
    function bl(e) {
      return [...e].reduceRight((t, r3) => [...t, ...r3], []);
    }
    function wl(e) {
      let t = [...rs(e), { prefix: "", important: false, separator: ":" }];
      return Wi(Ao({ theme: vl(ml(hl(t.map((r3) => r3?.theme ?? {})))), corePlugins: yl(t.map((r3) => r3.corePlugins)), plugins: bl(e.map((r3) => r3?.plugins ?? [])) }, ...t));
    }
    var er, xl = $3(() => {
      O7(), jr(), zi(), Li(), Co(), Ni(), Mr2(), qi(), Bt(), zr(), Kt(), Ht(), es(), er = { colors: Rr2, negative(e) {
        return Object.keys(e).filter((t) => e[t] !== "0").reduce((t, r3) => {
          let n3 = Yt(e[r3]);
          return n3 !== void 0 && (t[`-${r3}`] = n3), t;
        }, {});
      }, breakpoints(e) {
        return Object.keys(e).filter((t) => typeof e[t] == "string").reduce((t, r3) => ({ ...t, [`screen-${r3}`]: e[r3] }), {});
      } };
    }), Jr = T7((e, t) => {
      O7(), t.exports = { content: [], presets: [], darkMode: "media", theme: { accentColor: ({ theme: r3 }) => ({ ...r3("colors"), auto: "auto" }), animation: { none: "none", spin: "spin 1s linear infinite", ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite", pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", bounce: "bounce 1s infinite" }, aria: { busy: 'busy="true"', checked: 'checked="true"', disabled: 'disabled="true"', expanded: 'expanded="true"', hidden: 'hidden="true"', pressed: 'pressed="true"', readonly: 'readonly="true"', required: 'required="true"', selected: 'selected="true"' }, aspectRatio: { auto: "auto", square: "1 / 1", video: "16 / 9" }, backdropBlur: ({ theme: r3 }) => r3("blur"), backdropBrightness: ({ theme: r3 }) => r3("brightness"), backdropContrast: ({ theme: r3 }) => r3("contrast"), backdropGrayscale: ({ theme: r3 }) => r3("grayscale"), backdropHueRotate: ({ theme: r3 }) => r3("hueRotate"), backdropInvert: ({ theme: r3 }) => r3("invert"), backdropOpacity: ({ theme: r3 }) => r3("opacity"), backdropSaturate: ({ theme: r3 }) => r3("saturate"), backdropSepia: ({ theme: r3 }) => r3("sepia"), backgroundColor: ({ theme: r3 }) => r3("colors"), backgroundImage: { none: "none", "gradient-to-t": "linear-gradient(to top, var(--tw-gradient-stops))", "gradient-to-tr": "linear-gradient(to top right, var(--tw-gradient-stops))", "gradient-to-r": "linear-gradient(to right, var(--tw-gradient-stops))", "gradient-to-br": "linear-gradient(to bottom right, var(--tw-gradient-stops))", "gradient-to-b": "linear-gradient(to bottom, var(--tw-gradient-stops))", "gradient-to-bl": "linear-gradient(to bottom left, var(--tw-gradient-stops))", "gradient-to-l": "linear-gradient(to left, var(--tw-gradient-stops))", "gradient-to-tl": "linear-gradient(to top left, var(--tw-gradient-stops))" }, backgroundOpacity: ({ theme: r3 }) => r3("opacity"), backgroundPosition: { bottom: "bottom", center: "center", left: "left", "left-bottom": "left bottom", "left-top": "left top", right: "right", "right-bottom": "right bottom", "right-top": "right top", top: "top" }, backgroundSize: { auto: "auto", cover: "cover", contain: "contain" }, blur: { 0: "0", none: "", sm: "4px", DEFAULT: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "40px", "3xl": "64px" }, borderColor: ({ theme: r3 }) => ({ ...r3("colors"), DEFAULT: r3("colors.gray.200", "currentColor") }), borderOpacity: ({ theme: r3 }) => r3("opacity"), borderRadius: { none: "0px", sm: "0.125rem", DEFAULT: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" }, borderSpacing: ({ theme: r3 }) => ({ ...r3("spacing") }), borderWidth: { DEFAULT: "1px", 0: "0px", 2: "2px", 4: "4px", 8: "8px" }, boxShadow: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)", inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)", none: "none" }, boxShadowColor: ({ theme: r3 }) => r3("colors"), brightness: { 0: "0", 50: ".5", 75: ".75", 90: ".9", 95: ".95", 100: "1", 105: "1.05", 110: "1.1", 125: "1.25", 150: "1.5", 200: "2" }, caretColor: ({ theme: r3 }) => r3("colors"), colors: ({ colors: r3 }) => ({ inherit: r3.inherit, current: r3.current, transparent: r3.transparent, black: r3.black, white: r3.white, slate: r3.slate, gray: r3.gray, zinc: r3.zinc, neutral: r3.neutral, stone: r3.stone, red: r3.red, orange: r3.orange, amber: r3.amber, yellow: r3.yellow, lime: r3.lime, green: r3.green, emerald: r3.emerald, teal: r3.teal, cyan: r3.cyan, sky: r3.sky, blue: r3.blue, indigo: r3.indigo, violet: r3.violet, purple: r3.purple, fuchsia: r3.fuchsia, pink: r3.pink, rose: r3.rose }), columns: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", "3xs": "16rem", "2xs": "18rem", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem" }, container: {}, content: { none: "none" }, contrast: { 0: "0", 50: ".5", 75: ".75", 100: "1", 125: "1.25", 150: "1.5", 200: "2" }, cursor: { auto: "auto", default: "default", pointer: "pointer", wait: "wait", text: "text", move: "move", help: "help", "not-allowed": "not-allowed", none: "none", "context-menu": "context-menu", progress: "progress", cell: "cell", crosshair: "crosshair", "vertical-text": "vertical-text", alias: "alias", copy: "copy", "no-drop": "no-drop", grab: "grab", grabbing: "grabbing", "all-scroll": "all-scroll", "col-resize": "col-resize", "row-resize": "row-resize", "n-resize": "n-resize", "e-resize": "e-resize", "s-resize": "s-resize", "w-resize": "w-resize", "ne-resize": "ne-resize", "nw-resize": "nw-resize", "se-resize": "se-resize", "sw-resize": "sw-resize", "ew-resize": "ew-resize", "ns-resize": "ns-resize", "nesw-resize": "nesw-resize", "nwse-resize": "nwse-resize", "zoom-in": "zoom-in", "zoom-out": "zoom-out" }, divideColor: ({ theme: r3 }) => r3("borderColor"), divideOpacity: ({ theme: r3 }) => r3("borderOpacity"), divideWidth: ({ theme: r3 }) => r3("borderWidth"), dropShadow: { sm: "0 1px 1px rgb(0 0 0 / 0.05)", DEFAULT: ["0 1px 2px rgb(0 0 0 / 0.1)", "0 1px 1px rgb(0 0 0 / 0.06)"], md: ["0 4px 3px rgb(0 0 0 / 0.07)", "0 2px 2px rgb(0 0 0 / 0.06)"], lg: ["0 10px 8px rgb(0 0 0 / 0.04)", "0 4px 3px rgb(0 0 0 / 0.1)"], xl: ["0 20px 13px rgb(0 0 0 / 0.03)", "0 8px 5px rgb(0 0 0 / 0.08)"], "2xl": "0 25px 25px rgb(0 0 0 / 0.15)", none: "0 0 #0000" }, fill: ({ theme: r3 }) => ({ none: "none", ...r3("colors") }), flex: { 1: "1 1 0%", auto: "1 1 auto", initial: "0 1 auto", none: "none" }, flexBasis: ({ theme: r3 }) => ({ auto: "auto", ...r3("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%" }), flexGrow: { 0: "0", DEFAULT: "1" }, flexShrink: { 0: "0", DEFAULT: "1" }, fontFamily: { sans: ["ui-sans-serif", "system-ui", "sans-serif", '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'], serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"], mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", '"Liberation Mono"', '"Courier New"', "monospace"] }, fontSize: { xs: ["0.75rem", { lineHeight: "1rem" }], sm: ["0.875rem", { lineHeight: "1.25rem" }], base: ["1rem", { lineHeight: "1.5rem" }], lg: ["1.125rem", { lineHeight: "1.75rem" }], xl: ["1.25rem", { lineHeight: "1.75rem" }], "2xl": ["1.5rem", { lineHeight: "2rem" }], "3xl": ["1.875rem", { lineHeight: "2.25rem" }], "4xl": ["2.25rem", { lineHeight: "2.5rem" }], "5xl": ["3rem", { lineHeight: "1" }], "6xl": ["3.75rem", { lineHeight: "1" }], "7xl": ["4.5rem", { lineHeight: "1" }], "8xl": ["6rem", { lineHeight: "1" }], "9xl": ["8rem", { lineHeight: "1" }] }, fontWeight: { thin: "100", extralight: "200", light: "300", normal: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800", black: "900" }, gap: ({ theme: r3 }) => r3("spacing"), gradientColorStops: ({ theme: r3 }) => r3("colors"), gradientColorStopPositions: { "0%": "0%", "5%": "5%", "10%": "10%", "15%": "15%", "20%": "20%", "25%": "25%", "30%": "30%", "35%": "35%", "40%": "40%", "45%": "45%", "50%": "50%", "55%": "55%", "60%": "60%", "65%": "65%", "70%": "70%", "75%": "75%", "80%": "80%", "85%": "85%", "90%": "90%", "95%": "95%", "100%": "100%" }, grayscale: { 0: "0", DEFAULT: "100%" }, gridAutoColumns: { auto: "auto", min: "min-content", max: "max-content", fr: "minmax(0, 1fr)" }, gridAutoRows: { auto: "auto", min: "min-content", max: "max-content", fr: "minmax(0, 1fr)" }, gridColumn: { auto: "auto", "span-1": "span 1 / span 1", "span-2": "span 2 / span 2", "span-3": "span 3 / span 3", "span-4": "span 4 / span 4", "span-5": "span 5 / span 5", "span-6": "span 6 / span 6", "span-7": "span 7 / span 7", "span-8": "span 8 / span 8", "span-9": "span 9 / span 9", "span-10": "span 10 / span 10", "span-11": "span 11 / span 11", "span-12": "span 12 / span 12", "span-full": "1 / -1" }, gridColumnEnd: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridColumnStart: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridRow: { auto: "auto", "span-1": "span 1 / span 1", "span-2": "span 2 / span 2", "span-3": "span 3 / span 3", "span-4": "span 4 / span 4", "span-5": "span 5 / span 5", "span-6": "span 6 / span 6", "span-7": "span 7 / span 7", "span-8": "span 8 / span 8", "span-9": "span 9 / span 9", "span-10": "span 10 / span 10", "span-11": "span 11 / span 11", "span-12": "span 12 / span 12", "span-full": "1 / -1" }, gridRowEnd: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridRowStart: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridTemplateColumns: { none: "none", subgrid: "subgrid", 1: "repeat(1, minmax(0, 1fr))", 2: "repeat(2, minmax(0, 1fr))", 3: "repeat(3, minmax(0, 1fr))", 4: "repeat(4, minmax(0, 1fr))", 5: "repeat(5, minmax(0, 1fr))", 6: "repeat(6, minmax(0, 1fr))", 7: "repeat(7, minmax(0, 1fr))", 8: "repeat(8, minmax(0, 1fr))", 9: "repeat(9, minmax(0, 1fr))", 10: "repeat(10, minmax(0, 1fr))", 11: "repeat(11, minmax(0, 1fr))", 12: "repeat(12, minmax(0, 1fr))" }, gridTemplateRows: { none: "none", subgrid: "subgrid", 1: "repeat(1, minmax(0, 1fr))", 2: "repeat(2, minmax(0, 1fr))", 3: "repeat(3, minmax(0, 1fr))", 4: "repeat(4, minmax(0, 1fr))", 5: "repeat(5, minmax(0, 1fr))", 6: "repeat(6, minmax(0, 1fr))", 7: "repeat(7, minmax(0, 1fr))", 8: "repeat(8, minmax(0, 1fr))", 9: "repeat(9, minmax(0, 1fr))", 10: "repeat(10, minmax(0, 1fr))", 11: "repeat(11, minmax(0, 1fr))", 12: "repeat(12, minmax(0, 1fr))" }, height: ({ theme: r3 }) => ({ auto: "auto", ...r3("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", full: "100%", screen: "100vh", svh: "100svh", lvh: "100lvh", dvh: "100dvh", min: "min-content", max: "max-content", fit: "fit-content" }), hueRotate: { 0: "0deg", 15: "15deg", 30: "30deg", 60: "60deg", 90: "90deg", 180: "180deg" }, inset: ({ theme: r3 }) => ({ auto: "auto", ...r3("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", full: "100%" }), invert: { 0: "0", DEFAULT: "100%" }, keyframes: { spin: { to: { transform: "rotate(360deg)" } }, ping: { "75%, 100%": { transform: "scale(2)", opacity: "0" } }, pulse: { "50%": { opacity: ".5" } }, bounce: { "0%, 100%": { transform: "translateY(-25%)", animationTimingFunction: "cubic-bezier(0.8,0,1,1)" }, "50%": { transform: "none", animationTimingFunction: "cubic-bezier(0,0,0.2,1)" } } }, letterSpacing: { tighter: "-0.05em", tight: "-0.025em", normal: "0em", wide: "0.025em", wider: "0.05em", widest: "0.1em" }, lineHeight: { none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2", 3: ".75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 7: "1.75rem", 8: "2rem", 9: "2.25rem", 10: "2.5rem" }, listStyleType: { none: "none", disc: "disc", decimal: "decimal" }, listStyleImage: { none: "none" }, margin: ({ theme: r3 }) => ({ auto: "auto", ...r3("spacing") }), lineClamp: { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6" }, maxHeight: ({ theme: r3 }) => ({ ...r3("spacing"), none: "none", full: "100%", screen: "100vh", svh: "100svh", lvh: "100lvh", dvh: "100dvh", min: "min-content", max: "max-content", fit: "fit-content" }), maxWidth: ({ theme: r3, breakpoints: n3 }) => ({ ...r3("spacing"), none: "none", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem", full: "100%", min: "min-content", max: "max-content", fit: "fit-content", prose: "65ch", ...n3(r3("screens")) }), minHeight: ({ theme: r3 }) => ({ ...r3("spacing"), full: "100%", screen: "100vh", svh: "100svh", lvh: "100lvh", dvh: "100dvh", min: "min-content", max: "max-content", fit: "fit-content" }), minWidth: ({ theme: r3 }) => ({ ...r3("spacing"), full: "100%", min: "min-content", max: "max-content", fit: "fit-content" }), objectPosition: { bottom: "bottom", center: "center", left: "left", "left-bottom": "left bottom", "left-top": "left top", right: "right", "right-bottom": "right bottom", "right-top": "right top", top: "top" }, opacity: { 0: "0", 5: "0.05", 10: "0.1", 15: "0.15", 20: "0.2", 25: "0.25", 30: "0.3", 35: "0.35", 40: "0.4", 45: "0.45", 50: "0.5", 55: "0.55", 60: "0.6", 65: "0.65", 70: "0.7", 75: "0.75", 80: "0.8", 85: "0.85", 90: "0.9", 95: "0.95", 100: "1" }, order: { first: "-9999", last: "9999", none: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12" }, outlineColor: ({ theme: r3 }) => r3("colors"), outlineOffset: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, outlineWidth: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, padding: ({ theme: r3 }) => r3("spacing"), placeholderColor: ({ theme: r3 }) => r3("colors"), placeholderOpacity: ({ theme: r3 }) => r3("opacity"), ringColor: ({ theme: r3 }) => ({ DEFAULT: r3("colors.blue.500", "#3b82f6"), ...r3("colors") }), ringOffsetColor: ({ theme: r3 }) => r3("colors"), ringOffsetWidth: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, ringOpacity: ({ theme: r3 }) => ({ DEFAULT: "0.5", ...r3("opacity") }), ringWidth: { DEFAULT: "3px", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, rotate: { 0: "0deg", 1: "1deg", 2: "2deg", 3: "3deg", 6: "6deg", 12: "12deg", 45: "45deg", 90: "90deg", 180: "180deg" }, saturate: { 0: "0", 50: ".5", 100: "1", 150: "1.5", 200: "2" }, scale: { 0: "0", 50: ".5", 75: ".75", 90: ".9", 95: ".95", 100: "1", 105: "1.05", 110: "1.1", 125: "1.25", 150: "1.5" }, screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" }, scrollMargin: ({ theme: r3 }) => ({ ...r3("spacing") }), scrollPadding: ({ theme: r3 }) => r3("spacing"), sepia: { 0: "0", DEFAULT: "100%" }, skew: { 0: "0deg", 1: "1deg", 2: "2deg", 3: "3deg", 6: "6deg", 12: "12deg" }, space: ({ theme: r3 }) => ({ ...r3("spacing") }), spacing: { px: "1px", 0: "0px", 0.5: "0.125rem", 1: "0.25rem", 1.5: "0.375rem", 2: "0.5rem", 2.5: "0.625rem", 3: "0.75rem", 3.5: "0.875rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 7: "1.75rem", 8: "2rem", 9: "2.25rem", 10: "2.5rem", 11: "2.75rem", 12: "3rem", 14: "3.5rem", 16: "4rem", 20: "5rem", 24: "6rem", 28: "7rem", 32: "8rem", 36: "9rem", 40: "10rem", 44: "11rem", 48: "12rem", 52: "13rem", 56: "14rem", 60: "15rem", 64: "16rem", 72: "18rem", 80: "20rem", 96: "24rem" }, stroke: ({ theme: r3 }) => ({ none: "none", ...r3("colors") }), strokeWidth: { 0: "0", 1: "1", 2: "2" }, supports: {}, data: {}, textColor: ({ theme: r3 }) => r3("colors"), textDecorationColor: ({ theme: r3 }) => r3("colors"), textDecorationThickness: { auto: "auto", "from-font": "from-font", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, textIndent: ({ theme: r3 }) => ({ ...r3("spacing") }), textOpacity: ({ theme: r3 }) => r3("opacity"), textUnderlineOffset: { auto: "auto", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, transformOrigin: { center: "center", top: "top", "top-right": "top right", right: "right", "bottom-right": "bottom right", bottom: "bottom", "bottom-left": "bottom left", left: "left", "top-left": "top left" }, transitionDelay: { 0: "0s", 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1e3: "1000ms" }, transitionDuration: { DEFAULT: "150ms", 0: "0s", 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1e3: "1000ms" }, transitionProperty: { none: "none", all: "all", DEFAULT: "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter", colors: "color, background-color, border-color, text-decoration-color, fill, stroke", opacity: "opacity", shadow: "box-shadow", transform: "transform" }, transitionTimingFunction: { DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)", linear: "linear", in: "cubic-bezier(0.4, 0, 1, 1)", out: "cubic-bezier(0, 0, 0.2, 1)", "in-out": "cubic-bezier(0.4, 0, 0.2, 1)" }, translate: ({ theme: r3 }) => ({ ...r3("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", full: "100%" }), size: ({ theme: r3 }) => ({ auto: "auto", ...r3("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%", min: "min-content", max: "max-content", fit: "fit-content" }), width: ({ theme: r3 }) => ({ auto: "auto", ...r3("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%", screen: "100vw", svw: "100svw", lvw: "100lvw", dvw: "100dvw", min: "min-content", max: "max-content", fit: "fit-content" }), willChange: { auto: "auto", scroll: "scroll-position", contents: "contents", transform: "transform" }, zIndex: { auto: "auto", 0: "0", 10: "10", 20: "20", 30: "30", 40: "40", 50: "50" } }, plugins: [] };
    });
    function ns(e) {
      let t = (e?.presets ?? [os.default]).slice().reverse().flatMap((o7) => ns(o7 instanceof Function ? o7() : o7)), r3 = { respectDefaultRingColorOpacity: { theme: { ringColor: ({ theme: o7 }) => ({ DEFAULT: "#3b82f67f", ...o7("colors") }) } }, disableColorOpacityUtilitiesByDefault: { corePlugins: { backgroundOpacity: false, borderOpacity: false, divideOpacity: false, placeholderOpacity: false, ringOpacity: false, textOpacity: false } } }, n3 = Object.keys(r3).filter((o7) => De3(e, o7)).map((o7) => r3[o7]);
      return [e, ...n3, ...t];
    }
    var os, kl = $3(() => {
      O7(), os = he4(Jr()), nt3();
    }), ss = {};
    Fe2(ss, { default: () => Zr });
    function Zr(...e) {
      let [, ...t] = ns(e[0]);
      return wl([...e, ...t]);
    }
    var as = $3(() => {
      O7(), xl(), kl();
    }), is = {};
    Fe2(is, { default: () => xe2 });
    var xe2, St = $3(() => {
      O7(), xe2 = { resolve: (e) => e, extname: (e) => "." + e.split(".").pop() };
    });
    function tr(e) {
      return typeof e == "object" && e !== null;
    }
    function Sl(e) {
      return Object.keys(e).length === 0;
    }
    function ls(e) {
      return typeof e == "string" || e instanceof String;
    }
    function Cl(e) {
      return tr(e) && e.config === void 0 && !Sl(e) ? null : tr(e) && e.config !== void 0 && ls(e.config) ? xe2.resolve(e.config) : tr(e) && e.config !== void 0 && tr(e.config) ? null : ls(e) ? xe2.resolve(e) : Al();
    }
    function Al() {
      for (let e of cs) try {
        let t = xe2.resolve(e);
        return Be4.accessSync(t), t;
      } catch {
      }
      return null;
    }
    var cs, Ol = $3(() => {
      O7(), rt2(), St(), cs = ["./tailwind.config.js", "./tailwind.config.cjs", "./tailwind.config.mjs", "./tailwind.config.ts", "./tailwind.config.cts", "./tailwind.config.mts"];
    }), us = {};
    Fe2(us, { default: () => Xr });
    var Xr, ds = $3(() => {
      O7(), Xr = { parse: (e) => ({ href: e }) };
    }), ps = T7(() => {
      O7();
    }), Kr = T7((e, t) => {
      O7();
      var r3 = (Br(), xo), n3 = ps(), o7 = class extends Error {
        constructor(s7, a4, l3, c5, i4, d6) {
          super(s7), this.name = "CssSyntaxError", this.reason = s7, i4 && (this.file = i4), c5 && (this.source = c5), d6 && (this.plugin = d6), typeof a4 < "u" && typeof l3 < "u" && (typeof a4 == "number" ? (this.line = a4, this.column = l3) : (this.line = a4.line, this.column = a4.column, this.endLine = l3.line, this.endColumn = l3.column)), this.setMessage(), Error.captureStackTrace && Error.captureStackTrace(this, o7);
        }
        setMessage() {
          this.message = this.plugin ? this.plugin + ": " : "", this.message += this.file ? this.file : "<css input>", typeof this.line < "u" && (this.message += ":" + this.line + ":" + this.column), this.message += ": " + this.reason;
        }
        showSourceCode(s7) {
          if (!this.source) return "";
          let a4 = this.source;
          s7 == null && (s7 = r3.isColorSupported), n3 && s7 && (a4 = n3(a4));
          let l3 = a4.split(/\r?\n/), c5 = Math.max(this.line - 3, 0), i4 = Math.min(this.line + 2, l3.length), d6 = String(i4).length, u5, p4;
          if (s7) {
            let { bold: f6, red: g6, gray: h7 } = r3.createColors(true);
            u5 = (m6) => f6(g6(m6)), p4 = (m6) => h7(m6);
          } else u5 = p4 = (f6) => f6;
          return l3.slice(c5, i4).map((f6, g6) => {
            let h7 = c5 + 1 + g6, m6 = " " + (" " + h7).slice(-d6) + " | ";
            if (h7 === this.line) {
              let y9 = p4(m6.replace(/\d/g, " ")) + f6.slice(0, this.column - 1).replace(/[^\t]/g, " ");
              return u5(">") + p4(m6) + f6 + `
 ` + y9 + u5("^");
            }
            return " " + p4(m6) + f6;
          }).join(`
`);
        }
        toString() {
          let s7 = this.showSourceCode();
          return s7 && (s7 = `

` + s7 + `
`), this.name + ": " + this.message + s7;
        }
      };
      t.exports = o7, o7.default = o7;
    }), en = T7((e, t) => {
      O7(), t.exports.isClean = Symbol("isClean"), t.exports.my = Symbol("my");
    }), fs = T7((e, t) => {
      O7();
      var r3 = { colon: ": ", indent: "    ", beforeDecl: `
`, beforeRule: `
`, beforeOpen: " ", beforeClose: `
`, beforeComment: `
`, after: `
`, emptyBody: "", commentLeft: " ", commentRight: " ", semicolon: false };
      function n3(s7) {
        return s7[0].toUpperCase() + s7.slice(1);
      }
      var o7 = class {
        constructor(s7) {
          this.builder = s7;
        }
        stringify(s7, a4) {
          if (!this[s7.type]) throw new Error("Unknown AST node type " + s7.type + ". Maybe you need to change PostCSS stringifier.");
          this[s7.type](s7, a4);
        }
        document(s7) {
          this.body(s7);
        }
        root(s7) {
          this.body(s7), s7.raws.after && this.builder(s7.raws.after);
        }
        comment(s7) {
          let a4 = this.raw(s7, "left", "commentLeft"), l3 = this.raw(s7, "right", "commentRight");
          this.builder("/*" + a4 + s7.text + l3 + "*/", s7);
        }
        decl(s7, a4) {
          let l3 = this.raw(s7, "between", "colon"), c5 = s7.prop + l3 + this.rawValue(s7, "value");
          s7.important && (c5 += s7.raws.important || " !important"), a4 && (c5 += ";"), this.builder(c5, s7);
        }
        rule(s7) {
          this.block(s7, this.rawValue(s7, "selector")), s7.raws.ownSemicolon && this.builder(s7.raws.ownSemicolon, s7, "end");
        }
        atrule(s7, a4) {
          let l3 = "@" + s7.name, c5 = s7.params ? this.rawValue(s7, "params") : "";
          if (typeof s7.raws.afterName < "u" ? l3 += s7.raws.afterName : c5 && (l3 += " "), s7.nodes) this.block(s7, l3 + c5);
          else {
            let i4 = (s7.raws.between || "") + (a4 ? ";" : "");
            this.builder(l3 + c5 + i4, s7);
          }
        }
        body(s7) {
          let a4 = s7.nodes.length - 1;
          for (; a4 > 0 && s7.nodes[a4].type === "comment"; ) a4 -= 1;
          let l3 = this.raw(s7, "semicolon");
          for (let c5 = 0; c5 < s7.nodes.length; c5++) {
            let i4 = s7.nodes[c5], d6 = this.raw(i4, "before");
            d6 && this.builder(d6), this.stringify(i4, a4 !== c5 || l3);
          }
        }
        block(s7, a4) {
          let l3 = this.raw(s7, "between", "beforeOpen");
          this.builder(a4 + l3 + "{", s7, "start");
          let c5;
          s7.nodes && s7.nodes.length ? (this.body(s7), c5 = this.raw(s7, "after")) : c5 = this.raw(s7, "after", "emptyBody"), c5 && this.builder(c5), this.builder("}", s7, "end");
        }
        raw(s7, a4, l3) {
          let c5;
          if (l3 || (l3 = a4), a4 && (c5 = s7.raws[a4], typeof c5 < "u")) return c5;
          let i4 = s7.parent;
          if (l3 === "before" && (!i4 || i4.type === "root" && i4.first === s7 || i4 && i4.type === "document")) return "";
          if (!i4) return r3[l3];
          let d6 = s7.root();
          if (d6.rawCache || (d6.rawCache = {}), typeof d6.rawCache[l3] < "u") return d6.rawCache[l3];
          if (l3 === "before" || l3 === "after") return this.beforeAfter(s7, l3);
          {
            let u5 = "raw" + n3(l3);
            this[u5] ? c5 = this[u5](d6, s7) : d6.walk((p4) => {
              if (c5 = p4.raws[a4], typeof c5 < "u") return false;
            });
          }
          return typeof c5 > "u" && (c5 = r3[l3]), d6.rawCache[l3] = c5, c5;
        }
        rawSemicolon(s7) {
          let a4;
          return s7.walk((l3) => {
            if (l3.nodes && l3.nodes.length && l3.last.type === "decl" && (a4 = l3.raws.semicolon, typeof a4 < "u")) return false;
          }), a4;
        }
        rawEmptyBody(s7) {
          let a4;
          return s7.walk((l3) => {
            if (l3.nodes && l3.nodes.length === 0 && (a4 = l3.raws.after, typeof a4 < "u")) return false;
          }), a4;
        }
        rawIndent(s7) {
          if (s7.raws.indent) return s7.raws.indent;
          let a4;
          return s7.walk((l3) => {
            let c5 = l3.parent;
            if (c5 && c5 !== s7 && c5.parent && c5.parent === s7 && typeof l3.raws.before < "u") {
              let i4 = l3.raws.before.split(`
`);
              return a4 = i4[i4.length - 1], a4 = a4.replace(/\S/g, ""), false;
            }
          }), a4;
        }
        rawBeforeComment(s7, a4) {
          let l3;
          return s7.walkComments((c5) => {
            if (typeof c5.raws.before < "u") return l3 = c5.raws.before, l3.includes(`
`) && (l3 = l3.replace(/[^\n]+$/, "")), false;
          }), typeof l3 > "u" ? l3 = this.raw(a4, null, "beforeDecl") : l3 && (l3 = l3.replace(/\S/g, "")), l3;
        }
        rawBeforeDecl(s7, a4) {
          let l3;
          return s7.walkDecls((c5) => {
            if (typeof c5.raws.before < "u") return l3 = c5.raws.before, l3.includes(`
`) && (l3 = l3.replace(/[^\n]+$/, "")), false;
          }), typeof l3 > "u" ? l3 = this.raw(a4, null, "beforeRule") : l3 && (l3 = l3.replace(/\S/g, "")), l3;
        }
        rawBeforeRule(s7) {
          let a4;
          return s7.walk((l3) => {
            if (l3.nodes && (l3.parent !== s7 || s7.first !== l3) && typeof l3.raws.before < "u") return a4 = l3.raws.before, a4.includes(`
`) && (a4 = a4.replace(/[^\n]+$/, "")), false;
          }), a4 && (a4 = a4.replace(/\S/g, "")), a4;
        }
        rawBeforeClose(s7) {
          let a4;
          return s7.walk((l3) => {
            if (l3.nodes && l3.nodes.length > 0 && typeof l3.raws.after < "u") return a4 = l3.raws.after, a4.includes(`
`) && (a4 = a4.replace(/[^\n]+$/, "")), false;
          }), a4 && (a4 = a4.replace(/\S/g, "")), a4;
        }
        rawBeforeOpen(s7) {
          let a4;
          return s7.walk((l3) => {
            if (l3.type !== "decl" && (a4 = l3.raws.between, typeof a4 < "u")) return false;
          }), a4;
        }
        rawColon(s7) {
          let a4;
          return s7.walkDecls((l3) => {
            if (typeof l3.raws.between < "u") return a4 = l3.raws.between.replace(/[^\s:]/g, ""), false;
          }), a4;
        }
        beforeAfter(s7, a4) {
          let l3;
          s7.type === "decl" ? l3 = this.raw(s7, null, "beforeDecl") : s7.type === "comment" ? l3 = this.raw(s7, null, "beforeComment") : a4 === "before" ? l3 = this.raw(s7, null, "beforeRule") : l3 = this.raw(s7, null, "beforeClose");
          let c5 = s7.parent, i4 = 0;
          for (; c5 && c5.type !== "root"; ) i4 += 1, c5 = c5.parent;
          if (l3.includes(`
`)) {
            let d6 = this.raw(s7, null, "indent");
            if (d6.length) for (let u5 = 0; u5 < i4; u5++) l3 += d6;
          }
          return l3;
        }
        rawValue(s7, a4) {
          let l3 = s7[a4], c5 = s7.raws[a4];
          return c5 && c5.value === l3 ? c5.raw : l3;
        }
      };
      t.exports = o7, o7.default = o7;
    }), rr = T7((e, t) => {
      O7();
      var r3 = fs();
      function n3(o7, s7) {
        new r3(s7).stringify(o7);
      }
      t.exports = n3, n3.default = n3;
    }), nr = T7((e, t) => {
      O7();
      var { isClean: r3, my: n3 } = en(), o7 = Kr(), s7 = fs(), a4 = rr();
      function l3(i4, d6) {
        let u5 = new i4.constructor();
        for (let p4 in i4) {
          if (!Object.prototype.hasOwnProperty.call(i4, p4) || p4 === "proxyCache") continue;
          let f6 = i4[p4], g6 = typeof f6;
          p4 === "parent" && g6 === "object" ? d6 && (u5[p4] = d6) : p4 === "source" ? u5[p4] = f6 : Array.isArray(f6) ? u5[p4] = f6.map((h7) => l3(h7, u5)) : (g6 === "object" && f6 !== null && (f6 = l3(f6)), u5[p4] = f6);
        }
        return u5;
      }
      var c5 = class {
        constructor(i4 = {}) {
          this.raws = {}, this[r3] = false, this[n3] = true;
          for (let d6 in i4) if (d6 === "nodes") {
            this.nodes = [];
            for (let u5 of i4[d6]) typeof u5.clone == "function" ? this.append(u5.clone()) : this.append(u5);
          } else this[d6] = i4[d6];
        }
        error(i4, d6 = {}) {
          if (this.source) {
            let { start: u5, end: p4 } = this.rangeBy(d6);
            return this.source.input.error(i4, { line: u5.line, column: u5.column }, { line: p4.line, column: p4.column }, d6);
          }
          return new o7(i4);
        }
        warn(i4, d6, u5) {
          let p4 = { node: this };
          for (let f6 in u5) p4[f6] = u5[f6];
          return i4.warn(d6, p4);
        }
        remove() {
          return this.parent && this.parent.removeChild(this), this.parent = void 0, this;
        }
        toString(i4 = a4) {
          i4.stringify && (i4 = i4.stringify);
          let d6 = "";
          return i4(this, (u5) => {
            d6 += u5;
          }), d6;
        }
        assign(i4 = {}) {
          for (let d6 in i4) this[d6] = i4[d6];
          return this;
        }
        clone(i4 = {}) {
          let d6 = l3(this);
          for (let u5 in i4) d6[u5] = i4[u5];
          return d6;
        }
        cloneBefore(i4 = {}) {
          let d6 = this.clone(i4);
          return this.parent.insertBefore(this, d6), d6;
        }
        cloneAfter(i4 = {}) {
          let d6 = this.clone(i4);
          return this.parent.insertAfter(this, d6), d6;
        }
        replaceWith(...i4) {
          if (this.parent) {
            let d6 = this, u5 = false;
            for (let p4 of i4) p4 === this ? u5 = true : u5 ? (this.parent.insertAfter(d6, p4), d6 = p4) : this.parent.insertBefore(d6, p4);
            u5 || this.remove();
          }
          return this;
        }
        next() {
          if (!this.parent) return;
          let i4 = this.parent.index(this);
          return this.parent.nodes[i4 + 1];
        }
        prev() {
          if (!this.parent) return;
          let i4 = this.parent.index(this);
          return this.parent.nodes[i4 - 1];
        }
        before(i4) {
          return this.parent.insertBefore(this, i4), this;
        }
        after(i4) {
          return this.parent.insertAfter(this, i4), this;
        }
        root() {
          let i4 = this;
          for (; i4.parent && i4.parent.type !== "document"; ) i4 = i4.parent;
          return i4;
        }
        raw(i4, d6) {
          return new s7().raw(this, i4, d6);
        }
        cleanRaws(i4) {
          delete this.raws.before, delete this.raws.after, i4 || delete this.raws.between;
        }
        toJSON(i4, d6) {
          let u5 = {}, p4 = d6 == null;
          d6 = d6 || /* @__PURE__ */ new Map();
          let f6 = 0;
          for (let g6 in this) {
            if (!Object.prototype.hasOwnProperty.call(this, g6) || g6 === "parent" || g6 === "proxyCache") continue;
            let h7 = this[g6];
            if (Array.isArray(h7)) u5[g6] = h7.map((m6) => typeof m6 == "object" && m6.toJSON ? m6.toJSON(null, d6) : m6);
            else if (typeof h7 == "object" && h7.toJSON) u5[g6] = h7.toJSON(null, d6);
            else if (g6 === "source") {
              let m6 = d6.get(h7.input);
              m6 == null && (m6 = f6, d6.set(h7.input, f6), f6++), u5[g6] = { inputId: m6, start: h7.start, end: h7.end };
            } else u5[g6] = h7;
          }
          return p4 && (u5.inputs = [...d6.keys()].map((g6) => g6.toJSON())), u5;
        }
        positionInside(i4) {
          let d6 = this.toString(), u5 = this.source.start.column, p4 = this.source.start.line;
          for (let f6 = 0; f6 < i4; f6++) d6[f6] === `
` ? (u5 = 1, p4 += 1) : u5 += 1;
          return { line: p4, column: u5 };
        }
        positionBy(i4) {
          let d6 = this.source.start;
          if (i4.index) d6 = this.positionInside(i4.index);
          else if (i4.word) {
            let u5 = this.toString().indexOf(i4.word);
            u5 !== -1 && (d6 = this.positionInside(u5));
          }
          return d6;
        }
        rangeBy(i4) {
          let d6 = { line: this.source.start.line, column: this.source.start.column }, u5 = this.source.end ? { line: this.source.end.line, column: this.source.end.column + 1 } : { line: d6.line, column: d6.column + 1 };
          if (i4.word) {
            let p4 = this.toString().indexOf(i4.word);
            p4 !== -1 && (d6 = this.positionInside(p4), u5 = this.positionInside(p4 + i4.word.length));
          } else i4.start ? d6 = { line: i4.start.line, column: i4.start.column } : i4.index && (d6 = this.positionInside(i4.index)), i4.end ? u5 = { line: i4.end.line, column: i4.end.column } : i4.endIndex ? u5 = this.positionInside(i4.endIndex) : i4.index && (u5 = this.positionInside(i4.index + 1));
          return (u5.line < d6.line || u5.line === d6.line && u5.column <= d6.column) && (u5 = { line: d6.line, column: d6.column + 1 }), { start: d6, end: u5 };
        }
        getProxyProcessor() {
          return { set(i4, d6, u5) {
            return i4[d6] === u5 || (i4[d6] = u5, (d6 === "prop" || d6 === "value" || d6 === "name" || d6 === "params" || d6 === "important" || d6 === "text") && i4.markDirty()), true;
          }, get(i4, d6) {
            return d6 === "proxyOf" ? i4 : d6 === "root" ? () => i4.root().toProxy() : i4[d6];
          } };
        }
        toProxy() {
          return this.proxyCache || (this.proxyCache = new Proxy(this, this.getProxyProcessor())), this.proxyCache;
        }
        addToError(i4) {
          if (i4.postcssNode = this, i4.stack && this.source && /\n\s{4}at /.test(i4.stack)) {
            let d6 = this.source;
            i4.stack = i4.stack.replace(/\n\s{4}at /, `$&${d6.input.from}:${d6.start.line}:${d6.start.column}$&`);
          }
          return i4;
        }
        markDirty() {
          if (this[r3]) {
            this[r3] = false;
            let i4 = this;
            for (; i4 = i4.parent; ) i4[r3] = false;
          }
        }
        get proxyOf() {
          return this;
        }
      };
      t.exports = c5, c5.default = c5;
    }), or2 = T7((e, t) => {
      O7();
      var r3 = nr(), n3 = class extends r3 {
        constructor(o7) {
          o7 && typeof o7.value < "u" && typeof o7.value != "string" && (o7 = { ...o7, value: String(o7.value) }), super(o7), this.type = "decl";
        }
        get variable() {
          return this.prop.startsWith("--") || this.prop[0] === "$";
        }
      };
      t.exports = n3, n3.default = n3;
    }), hs = T7((e, t) => {
      O7(), t.exports = function(r3, n3) {
        return { generate: () => {
          let o7 = "";
          return r3(n3, (s7) => {
            o7 += s7;
          }), [o7];
        } };
      };
    }), sr = T7((e, t) => {
      O7();
      var r3 = nr(), n3 = class extends r3 {
        constructor(o7) {
          super(o7), this.type = "comment";
        }
      };
      t.exports = n3, n3.default = n3;
    }), ct2 = T7((e, t) => {
      O7();
      var { isClean: r3, my: n3 } = en(), o7 = or2(), s7 = sr(), a4 = nr(), l3, c5, i4, d6;
      function u5(g6) {
        return g6.map((h7) => (h7.nodes && (h7.nodes = u5(h7.nodes)), delete h7.source, h7));
      }
      function p4(g6) {
        if (g6[r3] = false, g6.proxyOf.nodes) for (let h7 of g6.proxyOf.nodes) p4(h7);
      }
      var f6 = class extends a4 {
        push(g6) {
          return g6.parent = this, this.proxyOf.nodes.push(g6), this;
        }
        each(g6) {
          if (!this.proxyOf.nodes) return;
          let h7 = this.getIterator(), m6, y9;
          for (; this.indexes[h7] < this.proxyOf.nodes.length && (m6 = this.indexes[h7], y9 = g6(this.proxyOf.nodes[m6], m6), y9 !== false); ) this.indexes[h7] += 1;
          return delete this.indexes[h7], y9;
        }
        walk(g6) {
          return this.each((h7, m6) => {
            let y9;
            try {
              y9 = g6(h7, m6);
            } catch (v6) {
              throw h7.addToError(v6);
            }
            return y9 !== false && h7.walk && (y9 = h7.walk(g6)), y9;
          });
        }
        walkDecls(g6, h7) {
          return h7 ? g6 instanceof RegExp ? this.walk((m6, y9) => {
            if (m6.type === "decl" && g6.test(m6.prop)) return h7(m6, y9);
          }) : this.walk((m6, y9) => {
            if (m6.type === "decl" && m6.prop === g6) return h7(m6, y9);
          }) : (h7 = g6, this.walk((m6, y9) => {
            if (m6.type === "decl") return h7(m6, y9);
          }));
        }
        walkRules(g6, h7) {
          return h7 ? g6 instanceof RegExp ? this.walk((m6, y9) => {
            if (m6.type === "rule" && g6.test(m6.selector)) return h7(m6, y9);
          }) : this.walk((m6, y9) => {
            if (m6.type === "rule" && m6.selector === g6) return h7(m6, y9);
          }) : (h7 = g6, this.walk((m6, y9) => {
            if (m6.type === "rule") return h7(m6, y9);
          }));
        }
        walkAtRules(g6, h7) {
          return h7 ? g6 instanceof RegExp ? this.walk((m6, y9) => {
            if (m6.type === "atrule" && g6.test(m6.name)) return h7(m6, y9);
          }) : this.walk((m6, y9) => {
            if (m6.type === "atrule" && m6.name === g6) return h7(m6, y9);
          }) : (h7 = g6, this.walk((m6, y9) => {
            if (m6.type === "atrule") return h7(m6, y9);
          }));
        }
        walkComments(g6) {
          return this.walk((h7, m6) => {
            if (h7.type === "comment") return g6(h7, m6);
          });
        }
        append(...g6) {
          for (let h7 of g6) {
            let m6 = this.normalize(h7, this.last);
            for (let y9 of m6) this.proxyOf.nodes.push(y9);
          }
          return this.markDirty(), this;
        }
        prepend(...g6) {
          g6 = g6.reverse();
          for (let h7 of g6) {
            let m6 = this.normalize(h7, this.first, "prepend").reverse();
            for (let y9 of m6) this.proxyOf.nodes.unshift(y9);
            for (let y9 in this.indexes) this.indexes[y9] = this.indexes[y9] + m6.length;
          }
          return this.markDirty(), this;
        }
        cleanRaws(g6) {
          if (super.cleanRaws(g6), this.nodes) for (let h7 of this.nodes) h7.cleanRaws(g6);
        }
        insertBefore(g6, h7) {
          let m6 = this.index(g6), y9 = m6 === 0 ? "prepend" : false, v6 = this.normalize(h7, this.proxyOf.nodes[m6], y9).reverse();
          m6 = this.index(g6);
          for (let k5 of v6) this.proxyOf.nodes.splice(m6, 0, k5);
          let x5;
          for (let k5 in this.indexes) x5 = this.indexes[k5], m6 <= x5 && (this.indexes[k5] = x5 + v6.length);
          return this.markDirty(), this;
        }
        insertAfter(g6, h7) {
          let m6 = this.index(g6), y9 = this.normalize(h7, this.proxyOf.nodes[m6]).reverse();
          m6 = this.index(g6);
          for (let x5 of y9) this.proxyOf.nodes.splice(m6 + 1, 0, x5);
          let v6;
          for (let x5 in this.indexes) v6 = this.indexes[x5], m6 < v6 && (this.indexes[x5] = v6 + y9.length);
          return this.markDirty(), this;
        }
        removeChild(g6) {
          g6 = this.index(g6), this.proxyOf.nodes[g6].parent = void 0, this.proxyOf.nodes.splice(g6, 1);
          let h7;
          for (let m6 in this.indexes) h7 = this.indexes[m6], h7 >= g6 && (this.indexes[m6] = h7 - 1);
          return this.markDirty(), this;
        }
        removeAll() {
          for (let g6 of this.proxyOf.nodes) g6.parent = void 0;
          return this.proxyOf.nodes = [], this.markDirty(), this;
        }
        replaceValues(g6, h7, m6) {
          return m6 || (m6 = h7, h7 = {}), this.walkDecls((y9) => {
            h7.props && !h7.props.includes(y9.prop) || h7.fast && !y9.value.includes(h7.fast) || (y9.value = y9.value.replace(g6, m6));
          }), this.markDirty(), this;
        }
        every(g6) {
          return this.nodes.every(g6);
        }
        some(g6) {
          return this.nodes.some(g6);
        }
        index(g6) {
          return typeof g6 == "number" ? g6 : (g6.proxyOf && (g6 = g6.proxyOf), this.proxyOf.nodes.indexOf(g6));
        }
        get first() {
          if (this.proxyOf.nodes) return this.proxyOf.nodes[0];
        }
        get last() {
          if (this.proxyOf.nodes) return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
        }
        normalize(g6, h7) {
          if (typeof g6 == "string") g6 = u5(l3(g6).nodes);
          else if (Array.isArray(g6)) {
            g6 = g6.slice(0);
            for (let m6 of g6) m6.parent && m6.parent.removeChild(m6, "ignore");
          } else if (g6.type === "root" && this.type !== "document") {
            g6 = g6.nodes.slice(0);
            for (let m6 of g6) m6.parent && m6.parent.removeChild(m6, "ignore");
          } else if (g6.type) g6 = [g6];
          else if (g6.prop) {
            if (typeof g6.value > "u") throw new Error("Value field is missed in node creation");
            typeof g6.value != "string" && (g6.value = String(g6.value)), g6 = [new o7(g6)];
          } else if (g6.selector) g6 = [new c5(g6)];
          else if (g6.name) g6 = [new i4(g6)];
          else if (g6.text) g6 = [new s7(g6)];
          else throw new Error("Unknown node type in node creation");
          return g6.map((m6) => (m6[n3] || f6.rebuild(m6), m6 = m6.proxyOf, m6.parent && m6.parent.removeChild(m6), m6[r3] && p4(m6), typeof m6.raws.before > "u" && h7 && typeof h7.raws.before < "u" && (m6.raws.before = h7.raws.before.replace(/\S/g, "")), m6.parent = this.proxyOf, m6));
        }
        getProxyProcessor() {
          return { set(g6, h7, m6) {
            return g6[h7] === m6 || (g6[h7] = m6, (h7 === "name" || h7 === "params" || h7 === "selector") && g6.markDirty()), true;
          }, get(g6, h7) {
            return h7 === "proxyOf" ? g6 : g6[h7] ? h7 === "each" || typeof h7 == "string" && h7.startsWith("walk") ? (...m6) => g6[h7](...m6.map((y9) => typeof y9 == "function" ? (v6, x5) => y9(v6.toProxy(), x5) : y9)) : h7 === "every" || h7 === "some" ? (m6) => g6[h7]((y9, ...v6) => m6(y9.toProxy(), ...v6)) : h7 === "root" ? () => g6.root().toProxy() : h7 === "nodes" ? g6.nodes.map((m6) => m6.toProxy()) : h7 === "first" || h7 === "last" ? g6[h7].toProxy() : g6[h7] : g6[h7];
          } };
        }
        getIterator() {
          this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach += 1;
          let g6 = this.lastEach;
          return this.indexes[g6] = 0, g6;
        }
      };
      f6.registerParse = (g6) => {
        l3 = g6;
      }, f6.registerRule = (g6) => {
        c5 = g6;
      }, f6.registerAtRule = (g6) => {
        i4 = g6;
      }, f6.registerRoot = (g6) => {
        d6 = g6;
      }, t.exports = f6, f6.default = f6, f6.rebuild = (g6) => {
        g6.type === "atrule" ? Object.setPrototypeOf(g6, i4.prototype) : g6.type === "rule" ? Object.setPrototypeOf(g6, c5.prototype) : g6.type === "decl" ? Object.setPrototypeOf(g6, o7.prototype) : g6.type === "comment" ? Object.setPrototypeOf(g6, s7.prototype) : g6.type === "root" && Object.setPrototypeOf(g6, d6.prototype), g6[n3] = true, g6.nodes && g6.nodes.forEach((h7) => {
          f6.rebuild(h7);
        });
      };
    }), tn = T7((e, t) => {
      O7();
      var r3 = ct2(), n3, o7, s7 = class extends r3 {
        constructor(a4) {
          super({ type: "document", ...a4 }), this.nodes || (this.nodes = []);
        }
        toResult(a4 = {}) {
          return new n3(new o7(), this, a4).stringify();
        }
      };
      s7.registerLazyResult = (a4) => {
        n3 = a4;
      }, s7.registerProcessor = (a4) => {
        o7 = a4;
      }, t.exports = s7, s7.default = s7;
    }), ms = T7((e, t) => {
      O7();
      var r3 = {};
      t.exports = function(n3) {
        r3[n3] || (r3[n3] = true, typeof console < "u" && console.warn && console.warn(n3));
      };
    }), gs = T7((e, t) => {
      O7();
      var r3 = class {
        constructor(n3, o7 = {}) {
          if (this.type = "warning", this.text = n3, o7.node && o7.node.source) {
            let s7 = o7.node.rangeBy(o7);
            this.line = s7.start.line, this.column = s7.start.column, this.endLine = s7.end.line, this.endColumn = s7.end.column;
          }
          for (let s7 in o7) this[s7] = o7[s7];
        }
        toString() {
          return this.node ? this.node.error(this.text, { plugin: this.plugin, index: this.index, word: this.word }).message : this.plugin ? this.plugin + ": " + this.text : this.text;
        }
      };
      t.exports = r3, r3.default = r3;
    }), rn = T7((e, t) => {
      O7();
      var r3 = gs(), n3 = class {
        constructor(o7, s7, a4) {
          this.processor = o7, this.messages = [], this.root = s7, this.opts = a4, this.css = void 0, this.map = void 0;
        }
        toString() {
          return this.css;
        }
        warn(o7, s7 = {}) {
          s7.plugin || this.lastPlugin && this.lastPlugin.postcssPlugin && (s7.plugin = this.lastPlugin.postcssPlugin);
          let a4 = new r3(o7, s7);
          return this.messages.push(a4), a4;
        }
        warnings() {
          return this.messages.filter((o7) => o7.type === "warning");
        }
        get content() {
          return this.css;
        }
      };
      t.exports = n3, n3.default = n3;
    }), _l = T7((e, t) => {
      O7();
      var r3 = 39, n3 = 34, o7 = 92, s7 = 47, a4 = 10, l3 = 32, c5 = 12, i4 = 9, d6 = 13, u5 = 91, p4 = 93, f6 = 40, g6 = 41, h7 = 123, m6 = 125, y9 = 59, v6 = 42, x5 = 58, k5 = 64, w7 = /[\t\n\f\r "#'()/;[\\\]{}]/g, b7 = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g, C5 = /.[\n"'(/\\]/, S6 = /[\da-f]/i;
      t.exports = function(E6, A7 = {}) {
        let _6 = E6.css.valueOf(), U4 = A7.ignoreErrors, D7, j5, L4, F4, H4, Q3, we3, Ce4, R5, M6, P5 = _6.length, I7 = 0, G5 = [], B3 = [];
        function N4() {
          return I7;
        }
        function K5(ie4) {
          throw E6.error("Unclosed " + ie4, I7);
        }
        function J5() {
          return B3.length === 0 && I7 >= P5;
        }
        function V3(ie4) {
          if (B3.length) return B3.pop();
          if (I7 >= P5) return;
          let q5 = ie4 ? ie4.ignoreUnclosed : false;
          switch (D7 = _6.charCodeAt(I7), D7) {
            case a4:
            case l3:
            case i4:
            case d6:
            case c5: {
              j5 = I7;
              do
                j5 += 1, D7 = _6.charCodeAt(j5);
              while (D7 === l3 || D7 === a4 || D7 === i4 || D7 === d6 || D7 === c5);
              M6 = ["space", _6.slice(I7, j5)], I7 = j5 - 1;
              break;
            }
            case u5:
            case p4:
            case h7:
            case m6:
            case x5:
            case y9:
            case g6: {
              let le4 = String.fromCharCode(D7);
              M6 = [le4, le4, I7];
              break;
            }
            case f6: {
              if (Ce4 = G5.length ? G5.pop()[1] : "", R5 = _6.charCodeAt(I7 + 1), Ce4 === "url" && R5 !== r3 && R5 !== n3 && R5 !== l3 && R5 !== a4 && R5 !== i4 && R5 !== c5 && R5 !== d6) {
                j5 = I7;
                do {
                  if (Q3 = false, j5 = _6.indexOf(")", j5 + 1), j5 === -1) if (U4 || q5) {
                    j5 = I7;
                    break;
                  } else K5("bracket");
                  for (we3 = j5; _6.charCodeAt(we3 - 1) === o7; ) we3 -= 1, Q3 = !Q3;
                } while (Q3);
                M6 = ["brackets", _6.slice(I7, j5 + 1), I7, j5], I7 = j5;
              } else j5 = _6.indexOf(")", I7 + 1), F4 = _6.slice(I7, j5 + 1), j5 === -1 || C5.test(F4) ? M6 = ["(", "(", I7] : (M6 = ["brackets", F4, I7, j5], I7 = j5);
              break;
            }
            case r3:
            case n3: {
              L4 = D7 === r3 ? "'" : '"', j5 = I7;
              do {
                if (Q3 = false, j5 = _6.indexOf(L4, j5 + 1), j5 === -1) if (U4 || q5) {
                  j5 = I7 + 1;
                  break;
                } else K5("string");
                for (we3 = j5; _6.charCodeAt(we3 - 1) === o7; ) we3 -= 1, Q3 = !Q3;
              } while (Q3);
              M6 = ["string", _6.slice(I7, j5 + 1), I7, j5], I7 = j5;
              break;
            }
            case k5: {
              w7.lastIndex = I7 + 1, w7.test(_6), w7.lastIndex === 0 ? j5 = _6.length - 1 : j5 = w7.lastIndex - 2, M6 = ["at-word", _6.slice(I7, j5 + 1), I7, j5], I7 = j5;
              break;
            }
            case o7: {
              for (j5 = I7, H4 = true; _6.charCodeAt(j5 + 1) === o7; ) j5 += 1, H4 = !H4;
              if (D7 = _6.charCodeAt(j5 + 1), H4 && D7 !== s7 && D7 !== l3 && D7 !== a4 && D7 !== i4 && D7 !== d6 && D7 !== c5 && (j5 += 1, S6.test(_6.charAt(j5)))) {
                for (; S6.test(_6.charAt(j5 + 1)); ) j5 += 1;
                _6.charCodeAt(j5 + 1) === l3 && (j5 += 1);
              }
              M6 = ["word", _6.slice(I7, j5 + 1), I7, j5], I7 = j5;
              break;
            }
            default: {
              D7 === s7 && _6.charCodeAt(I7 + 1) === v6 ? (j5 = _6.indexOf("*/", I7 + 2) + 1, j5 === 0 && (U4 || q5 ? j5 = _6.length : K5("comment")), M6 = ["comment", _6.slice(I7, j5 + 1), I7, j5], I7 = j5) : (b7.lastIndex = I7 + 1, b7.test(_6), b7.lastIndex === 0 ? j5 = _6.length - 1 : j5 = b7.lastIndex - 2, M6 = ["word", _6.slice(I7, j5 + 1), I7, j5], G5.push(M6), I7 = j5);
              break;
            }
          }
          return I7++, M6;
        }
        function ne4(ie4) {
          B3.push(ie4);
        }
        return { back: ne4, nextToken: V3, endOfFile: J5, position: N4 };
      };
    }), nn = T7((e, t) => {
      O7();
      var r3 = ct2(), n3 = class extends r3 {
        constructor(o7) {
          super(o7), this.type = "atrule";
        }
        append(...o7) {
          return this.proxyOf.nodes || (this.nodes = []), super.append(...o7);
        }
        prepend(...o7) {
          return this.proxyOf.nodes || (this.nodes = []), super.prepend(...o7);
        }
      };
      t.exports = n3, n3.default = n3, r3.registerAtRule(n3);
    }), Mt2 = T7((e, t) => {
      O7();
      var r3 = ct2(), n3, o7, s7 = class extends r3 {
        constructor(a4) {
          super(a4), this.type = "root", this.nodes || (this.nodes = []);
        }
        removeChild(a4, l3) {
          let c5 = this.index(a4);
          return !l3 && c5 === 0 && this.nodes.length > 1 && (this.nodes[1].raws.before = this.nodes[c5].raws.before), super.removeChild(a4);
        }
        normalize(a4, l3, c5) {
          let i4 = super.normalize(a4);
          if (l3) {
            if (c5 === "prepend") this.nodes.length > 1 ? l3.raws.before = this.nodes[1].raws.before : delete l3.raws.before;
            else if (this.first !== l3) for (let d6 of i4) d6.raws.before = l3.raws.before;
          }
          return i4;
        }
        toResult(a4 = {}) {
          return new n3(new o7(), this, a4).stringify();
        }
      };
      s7.registerLazyResult = (a4) => {
        n3 = a4;
      }, s7.registerProcessor = (a4) => {
        o7 = a4;
      }, t.exports = s7, s7.default = s7, r3.registerRoot(s7);
    }), vs = T7((e, t) => {
      O7();
      var r3 = { split(n3, o7, s7) {
        let a4 = [], l3 = "", c5 = false, i4 = 0, d6 = false, u5 = "", p4 = false;
        for (let f6 of n3) p4 ? p4 = false : f6 === "\\" ? p4 = true : d6 ? f6 === u5 && (d6 = false) : f6 === '"' || f6 === "'" ? (d6 = true, u5 = f6) : f6 === "(" ? i4 += 1 : f6 === ")" ? i4 > 0 && (i4 -= 1) : i4 === 0 && o7.includes(f6) && (c5 = true), c5 ? (l3 !== "" && a4.push(l3.trim()), l3 = "", c5 = false) : l3 += f6;
        return (s7 || l3 !== "") && a4.push(l3.trim()), a4;
      }, space(n3) {
        let o7 = [" ", `
`, "	"];
        return r3.split(n3, o7);
      }, comma(n3) {
        return r3.split(n3, [","], true);
      } };
      t.exports = r3, r3.default = r3;
    }), on = T7((e, t) => {
      O7();
      var r3 = ct2(), n3 = vs(), o7 = class extends r3 {
        constructor(s7) {
          super(s7), this.type = "rule", this.nodes || (this.nodes = []);
        }
        get selectors() {
          return n3.comma(this.selector);
        }
        set selectors(s7) {
          let a4 = this.selector ? this.selector.match(/,\s*/) : null, l3 = a4 ? a4[0] : "," + this.raw("between", "beforeOpen");
          this.selector = s7.join(l3);
        }
      };
      t.exports = o7, o7.default = o7, r3.registerRule(o7);
    }), El = T7((e, t) => {
      O7();
      var r3 = or2(), n3 = _l(), o7 = sr(), s7 = nn(), a4 = Mt2(), l3 = on(), c5 = { empty: true, space: true };
      function i4(u5) {
        for (let p4 = u5.length - 1; p4 >= 0; p4--) {
          let f6 = u5[p4], g6 = f6[3] || f6[2];
          if (g6) return g6;
        }
      }
      var d6 = class {
        constructor(u5) {
          this.input = u5, this.root = new a4(), this.current = this.root, this.spaces = "", this.semicolon = false, this.customProperty = false, this.createTokenizer(), this.root.source = { input: u5, start: { offset: 0, line: 1, column: 1 } };
        }
        createTokenizer() {
          this.tokenizer = n3(this.input);
        }
        parse() {
          let u5;
          for (; !this.tokenizer.endOfFile(); ) switch (u5 = this.tokenizer.nextToken(), u5[0]) {
            case "space":
              this.spaces += u5[1];
              break;
            case ";":
              this.freeSemicolon(u5);
              break;
            case "}":
              this.end(u5);
              break;
            case "comment":
              this.comment(u5);
              break;
            case "at-word":
              this.atrule(u5);
              break;
            case "{":
              this.emptyRule(u5);
              break;
            default:
              this.other(u5);
              break;
          }
          this.endFile();
        }
        comment(u5) {
          let p4 = new o7();
          this.init(p4, u5[2]), p4.source.end = this.getPosition(u5[3] || u5[2]);
          let f6 = u5[1].slice(2, -2);
          if (/^\s*$/.test(f6)) p4.text = "", p4.raws.left = f6, p4.raws.right = "";
          else {
            let g6 = f6.match(/^(\s*)([^]*\S)(\s*)$/);
            p4.text = g6[2], p4.raws.left = g6[1], p4.raws.right = g6[3];
          }
        }
        emptyRule(u5) {
          let p4 = new l3();
          this.init(p4, u5[2]), p4.selector = "", p4.raws.between = "", this.current = p4;
        }
        other(u5) {
          let p4 = false, f6 = null, g6 = false, h7 = null, m6 = [], y9 = u5[1].startsWith("--"), v6 = [], x5 = u5;
          for (; x5; ) {
            if (f6 = x5[0], v6.push(x5), f6 === "(" || f6 === "[") h7 || (h7 = x5), m6.push(f6 === "(" ? ")" : "]");
            else if (y9 && g6 && f6 === "{") h7 || (h7 = x5), m6.push("}");
            else if (m6.length === 0) if (f6 === ";") if (g6) {
              this.decl(v6, y9);
              return;
            } else break;
            else if (f6 === "{") {
              this.rule(v6);
              return;
            } else if (f6 === "}") {
              this.tokenizer.back(v6.pop()), p4 = true;
              break;
            } else f6 === ":" && (g6 = true);
            else f6 === m6[m6.length - 1] && (m6.pop(), m6.length === 0 && (h7 = null));
            x5 = this.tokenizer.nextToken();
          }
          if (this.tokenizer.endOfFile() && (p4 = true), m6.length > 0 && this.unclosedBracket(h7), p4 && g6) {
            if (!y9) for (; v6.length && (x5 = v6[v6.length - 1][0], !(x5 !== "space" && x5 !== "comment")); ) this.tokenizer.back(v6.pop());
            this.decl(v6, y9);
          } else this.unknownWord(v6);
        }
        rule(u5) {
          u5.pop();
          let p4 = new l3();
          this.init(p4, u5[0][2]), p4.raws.between = this.spacesAndCommentsFromEnd(u5), this.raw(p4, "selector", u5), this.current = p4;
        }
        decl(u5, p4) {
          let f6 = new r3();
          this.init(f6, u5[0][2]);
          let g6 = u5[u5.length - 1];
          for (g6[0] === ";" && (this.semicolon = true, u5.pop()), f6.source.end = this.getPosition(g6[3] || g6[2] || i4(u5)); u5[0][0] !== "word"; ) u5.length === 1 && this.unknownWord(u5), f6.raws.before += u5.shift()[1];
          for (f6.source.start = this.getPosition(u5[0][2]), f6.prop = ""; u5.length; ) {
            let v6 = u5[0][0];
            if (v6 === ":" || v6 === "space" || v6 === "comment") break;
            f6.prop += u5.shift()[1];
          }
          f6.raws.between = "";
          let h7;
          for (; u5.length; ) if (h7 = u5.shift(), h7[0] === ":") {
            f6.raws.between += h7[1];
            break;
          } else h7[0] === "word" && /\w/.test(h7[1]) && this.unknownWord([h7]), f6.raws.between += h7[1];
          (f6.prop[0] === "_" || f6.prop[0] === "*") && (f6.raws.before += f6.prop[0], f6.prop = f6.prop.slice(1));
          let m6 = [], y9;
          for (; u5.length && (y9 = u5[0][0], !(y9 !== "space" && y9 !== "comment")); ) m6.push(u5.shift());
          this.precheckMissedSemicolon(u5);
          for (let v6 = u5.length - 1; v6 >= 0; v6--) {
            if (h7 = u5[v6], h7[1].toLowerCase() === "!important") {
              f6.important = true;
              let x5 = this.stringFrom(u5, v6);
              x5 = this.spacesFromEnd(u5) + x5, x5 !== " !important" && (f6.raws.important = x5);
              break;
            } else if (h7[1].toLowerCase() === "important") {
              let x5 = u5.slice(0), k5 = "";
              for (let w7 = v6; w7 > 0; w7--) {
                let b7 = x5[w7][0];
                if (k5.trim().indexOf("!") === 0 && b7 !== "space") break;
                k5 = x5.pop()[1] + k5;
              }
              k5.trim().indexOf("!") === 0 && (f6.important = true, f6.raws.important = k5, u5 = x5);
            }
            if (h7[0] !== "space" && h7[0] !== "comment") break;
          }
          u5.some((v6) => v6[0] !== "space" && v6[0] !== "comment") && (f6.raws.between += m6.map((v6) => v6[1]).join(""), m6 = []), this.raw(f6, "value", m6.concat(u5), p4), f6.value.includes(":") && !p4 && this.checkMissedSemicolon(u5);
        }
        atrule(u5) {
          let p4 = new s7();
          p4.name = u5[1].slice(1), p4.name === "" && this.unnamedAtrule(p4, u5), this.init(p4, u5[2]);
          let f6, g6, h7, m6 = false, y9 = false, v6 = [], x5 = [];
          for (; !this.tokenizer.endOfFile(); ) {
            if (u5 = this.tokenizer.nextToken(), f6 = u5[0], f6 === "(" || f6 === "[" ? x5.push(f6 === "(" ? ")" : "]") : f6 === "{" && x5.length > 0 ? x5.push("}") : f6 === x5[x5.length - 1] && x5.pop(), x5.length === 0) if (f6 === ";") {
              p4.source.end = this.getPosition(u5[2]), this.semicolon = true;
              break;
            } else if (f6 === "{") {
              y9 = true;
              break;
            } else if (f6 === "}") {
              if (v6.length > 0) {
                for (h7 = v6.length - 1, g6 = v6[h7]; g6 && g6[0] === "space"; ) g6 = v6[--h7];
                g6 && (p4.source.end = this.getPosition(g6[3] || g6[2]));
              }
              this.end(u5);
              break;
            } else v6.push(u5);
            else v6.push(u5);
            if (this.tokenizer.endOfFile()) {
              m6 = true;
              break;
            }
          }
          p4.raws.between = this.spacesAndCommentsFromEnd(v6), v6.length ? (p4.raws.afterName = this.spacesAndCommentsFromStart(v6), this.raw(p4, "params", v6), m6 && (u5 = v6[v6.length - 1], p4.source.end = this.getPosition(u5[3] || u5[2]), this.spaces = p4.raws.between, p4.raws.between = "")) : (p4.raws.afterName = "", p4.params = ""), y9 && (p4.nodes = [], this.current = p4);
        }
        end(u5) {
          this.current.nodes && this.current.nodes.length && (this.current.raws.semicolon = this.semicolon), this.semicolon = false, this.current.raws.after = (this.current.raws.after || "") + this.spaces, this.spaces = "", this.current.parent ? (this.current.source.end = this.getPosition(u5[2]), this.current = this.current.parent) : this.unexpectedClose(u5);
        }
        endFile() {
          this.current.parent && this.unclosedBlock(), this.current.nodes && this.current.nodes.length && (this.current.raws.semicolon = this.semicolon), this.current.raws.after = (this.current.raws.after || "") + this.spaces;
        }
        freeSemicolon(u5) {
          if (this.spaces += u5[1], this.current.nodes) {
            let p4 = this.current.nodes[this.current.nodes.length - 1];
            p4 && p4.type === "rule" && !p4.raws.ownSemicolon && (p4.raws.ownSemicolon = this.spaces, this.spaces = "");
          }
        }
        getPosition(u5) {
          let p4 = this.input.fromOffset(u5);
          return { offset: u5, line: p4.line, column: p4.col };
        }
        init(u5, p4) {
          this.current.push(u5), u5.source = { start: this.getPosition(p4), input: this.input }, u5.raws.before = this.spaces, this.spaces = "", u5.type !== "comment" && (this.semicolon = false);
        }
        raw(u5, p4, f6, g6) {
          let h7, m6, y9 = f6.length, v6 = "", x5 = true, k5, w7;
          for (let b7 = 0; b7 < y9; b7 += 1) h7 = f6[b7], m6 = h7[0], m6 === "space" && b7 === y9 - 1 && !g6 ? x5 = false : m6 === "comment" ? (w7 = f6[b7 - 1] ? f6[b7 - 1][0] : "empty", k5 = f6[b7 + 1] ? f6[b7 + 1][0] : "empty", !c5[w7] && !c5[k5] ? v6.slice(-1) === "," ? x5 = false : v6 += h7[1] : x5 = false) : v6 += h7[1];
          if (!x5) {
            let b7 = f6.reduce((C5, S6) => C5 + S6[1], "");
            u5.raws[p4] = { value: v6, raw: b7 };
          }
          u5[p4] = v6;
        }
        spacesAndCommentsFromEnd(u5) {
          let p4, f6 = "";
          for (; u5.length && (p4 = u5[u5.length - 1][0], !(p4 !== "space" && p4 !== "comment")); ) f6 = u5.pop()[1] + f6;
          return f6;
        }
        spacesAndCommentsFromStart(u5) {
          let p4, f6 = "";
          for (; u5.length && (p4 = u5[0][0], !(p4 !== "space" && p4 !== "comment")); ) f6 += u5.shift()[1];
          return f6;
        }
        spacesFromEnd(u5) {
          let p4, f6 = "";
          for (; u5.length && (p4 = u5[u5.length - 1][0], p4 === "space"); ) f6 = u5.pop()[1] + f6;
          return f6;
        }
        stringFrom(u5, p4) {
          let f6 = "";
          for (let g6 = p4; g6 < u5.length; g6++) f6 += u5[g6][1];
          return u5.splice(p4, u5.length - p4), f6;
        }
        colon(u5) {
          let p4 = 0, f6, g6, h7;
          for (let [m6, y9] of u5.entries()) {
            if (f6 = y9, g6 = f6[0], g6 === "(" && (p4 += 1), g6 === ")" && (p4 -= 1), p4 === 0 && g6 === ":") if (!h7) this.doubleColon(f6);
            else {
              if (h7[0] === "word" && h7[1] === "progid") continue;
              return m6;
            }
            h7 = f6;
          }
          return false;
        }
        unclosedBracket(u5) {
          throw this.input.error("Unclosed bracket", { offset: u5[2] }, { offset: u5[2] + 1 });
        }
        unknownWord(u5) {
          throw this.input.error("Unknown word", { offset: u5[0][2] }, { offset: u5[0][2] + u5[0][1].length });
        }
        unexpectedClose(u5) {
          throw this.input.error("Unexpected }", { offset: u5[2] }, { offset: u5[2] + 1 });
        }
        unclosedBlock() {
          let u5 = this.current.source.start;
          throw this.input.error("Unclosed block", u5.line, u5.column);
        }
        doubleColon(u5) {
          throw this.input.error("Double colon", { offset: u5[2] }, { offset: u5[2] + u5[1].length });
        }
        unnamedAtrule(u5, p4) {
          throw this.input.error("At-rule without name", { offset: p4[2] }, { offset: p4[2] + p4[1].length });
        }
        precheckMissedSemicolon() {
        }
        checkMissedSemicolon(u5) {
          let p4 = this.colon(u5);
          if (p4 === false) return;
          let f6 = 0, g6;
          for (let h7 = p4 - 1; h7 >= 0 && (g6 = u5[h7], !(g6[0] !== "space" && (f6 += 1, f6 === 2))); h7--) ;
          throw this.input.error("Missed semicolon", g6[0] === "word" ? g6[3] + 1 : g6[2]);
        }
      };
      t.exports = d6;
    }), Tl = T7(() => {
      O7();
    }), Il = T7((e, t) => {
      O7();
      var r3 = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict", n3 = (s7, a4 = 21) => (l3 = a4) => {
        let c5 = "", i4 = l3;
        for (; i4--; ) c5 += s7[Math.random() * s7.length | 0];
        return c5;
      }, o7 = (s7 = 21) => {
        let a4 = "", l3 = s7;
        for (; l3--; ) a4 += r3[Math.random() * 64 | 0];
        return a4;
      };
      t.exports = { nanoid: o7, customAlphabet: n3 };
    }), ys = T7((e, t) => {
      O7(), t.exports = {};
    }), sn = T7((e, t) => {
      O7();
      var { SourceMapConsumer: r3, SourceMapGenerator: n3 } = Tl(), { fileURLToPath: o7, pathToFileURL: s7 } = (ds(), us), { resolve: a4, isAbsolute: l3 } = (St(), is), { nanoid: c5 } = Il(), i4 = ps(), d6 = Kr(), u5 = ys(), p4 = Symbol("fromOffsetCache"), f6 = !!(r3 && n3), g6 = !!(a4 && l3), h7 = class {
        constructor(m6, y9 = {}) {
          if (m6 === null || typeof m6 > "u" || typeof m6 == "object" && !m6.toString) throw new Error(`PostCSS received ${m6} instead of CSS string`);
          if (this.css = m6.toString(), this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE" ? (this.hasBOM = true, this.css = this.css.slice(1)) : this.hasBOM = false, y9.from && (!g6 || /^\w+:\/\//.test(y9.from) || l3(y9.from) ? this.file = y9.from : this.file = a4(y9.from)), g6 && f6) {
            let v6 = new u5(this.css, y9);
            if (v6.text) {
              this.map = v6;
              let x5 = v6.consumer().file;
              !this.file && x5 && (this.file = this.mapResolve(x5));
            }
          }
          this.file || (this.id = "<input css " + c5(6) + ">"), this.map && (this.map.file = this.from);
        }
        fromOffset(m6) {
          let y9, v6;
          if (this[p4]) v6 = this[p4];
          else {
            let k5 = this.css.split(`
`);
            v6 = new Array(k5.length);
            let w7 = 0;
            for (let b7 = 0, C5 = k5.length; b7 < C5; b7++) v6[b7] = w7, w7 += k5[b7].length + 1;
            this[p4] = v6;
          }
          y9 = v6[v6.length - 1];
          let x5 = 0;
          if (m6 >= y9) x5 = v6.length - 1;
          else {
            let k5 = v6.length - 2, w7;
            for (; x5 < k5; ) if (w7 = x5 + (k5 - x5 >> 1), m6 < v6[w7]) k5 = w7 - 1;
            else if (m6 >= v6[w7 + 1]) x5 = w7 + 1;
            else {
              x5 = w7;
              break;
            }
          }
          return { line: x5 + 1, col: m6 - v6[x5] + 1 };
        }
        error(m6, y9, v6, x5 = {}) {
          let k5, w7, b7;
          if (y9 && typeof y9 == "object") {
            let S6 = y9, E6 = v6;
            if (typeof S6.offset == "number") {
              let A7 = this.fromOffset(S6.offset);
              y9 = A7.line, v6 = A7.col;
            } else y9 = S6.line, v6 = S6.column;
            if (typeof E6.offset == "number") {
              let A7 = this.fromOffset(E6.offset);
              w7 = A7.line, b7 = A7.col;
            } else w7 = E6.line, b7 = E6.column;
          } else if (!v6) {
            let S6 = this.fromOffset(y9);
            y9 = S6.line, v6 = S6.col;
          }
          let C5 = this.origin(y9, v6, w7, b7);
          return C5 ? k5 = new d6(m6, C5.endLine === void 0 ? C5.line : { line: C5.line, column: C5.column }, C5.endLine === void 0 ? C5.column : { line: C5.endLine, column: C5.endColumn }, C5.source, C5.file, x5.plugin) : k5 = new d6(m6, w7 === void 0 ? y9 : { line: y9, column: v6 }, w7 === void 0 ? v6 : { line: w7, column: b7 }, this.css, this.file, x5.plugin), k5.input = { line: y9, column: v6, endLine: w7, endColumn: b7, source: this.css }, this.file && (s7 && (k5.input.url = s7(this.file).toString()), k5.input.file = this.file), k5;
        }
        origin(m6, y9, v6, x5) {
          if (!this.map) return false;
          let k5 = this.map.consumer(), w7 = k5.originalPositionFor({ line: m6, column: y9 });
          if (!w7.source) return false;
          let b7;
          typeof v6 == "number" && (b7 = k5.originalPositionFor({ line: v6, column: x5 }));
          let C5;
          l3(w7.source) ? C5 = s7(w7.source) : C5 = new URL(w7.source, this.map.consumer().sourceRoot || s7(this.map.mapFile));
          let S6 = { url: C5.toString(), line: w7.line, column: w7.column, endLine: b7 && b7.line, endColumn: b7 && b7.column };
          if (C5.protocol === "file:") if (o7) S6.file = o7(C5);
          else throw new Error("file: protocol is not available in this PostCSS build");
          let E6 = k5.sourceContentFor(w7.source);
          return E6 && (S6.source = E6), S6;
        }
        mapResolve(m6) {
          return /^\w+:\/\//.test(m6) ? m6 : a4(this.map.consumer().sourceRoot || this.map.root || ".", m6);
        }
        get from() {
          return this.file || this.id;
        }
        toJSON() {
          let m6 = {};
          for (let y9 of ["hasBOM", "css", "file", "id"]) this[y9] != null && (m6[y9] = this[y9]);
          return this.map && (m6.map = { ...this.map }, m6.map.consumerCache && (m6.map.consumerCache = void 0)), m6;
        }
      };
      t.exports = h7, h7.default = h7, i4 && i4.registerInput && i4.registerInput(h7);
    }), an = T7((e, t) => {
      O7();
      var r3 = ct2(), n3 = El(), o7 = sn();
      function s7(a4, l3) {
        let c5 = new o7(a4, l3), i4 = new n3(c5);
        try {
          i4.parse();
        } catch (d6) {
          throw d6;
        }
        return i4.root;
      }
      t.exports = s7, s7.default = s7, r3.registerParse(s7);
    }), bs = T7((e, t) => {
      O7();
      var { isClean: r3, my: n3 } = en(), o7 = hs(), s7 = rr(), a4 = ct2(), l3 = tn(), c5 = ms(), i4 = rn(), d6 = an(), u5 = Mt2(), p4 = { document: "Document", root: "Root", atrule: "AtRule", rule: "Rule", decl: "Declaration", comment: "Comment" }, f6 = { postcssPlugin: true, prepare: true, Once: true, Document: true, Root: true, Declaration: true, Rule: true, AtRule: true, Comment: true, DeclarationExit: true, RuleExit: true, AtRuleExit: true, CommentExit: true, RootExit: true, DocumentExit: true, OnceExit: true }, g6 = { postcssPlugin: true, prepare: true, Once: true }, h7 = 0;
      function m6(b7) {
        return typeof b7 == "object" && typeof b7.then == "function";
      }
      function y9(b7) {
        let C5 = false, S6 = p4[b7.type];
        return b7.type === "decl" ? C5 = b7.prop.toLowerCase() : b7.type === "atrule" && (C5 = b7.name.toLowerCase()), C5 && b7.append ? [S6, S6 + "-" + C5, h7, S6 + "Exit", S6 + "Exit-" + C5] : C5 ? [S6, S6 + "-" + C5, S6 + "Exit", S6 + "Exit-" + C5] : b7.append ? [S6, h7, S6 + "Exit"] : [S6, S6 + "Exit"];
      }
      function v6(b7) {
        let C5;
        return b7.type === "document" ? C5 = ["Document", h7, "DocumentExit"] : b7.type === "root" ? C5 = ["Root", h7, "RootExit"] : C5 = y9(b7), { node: b7, events: C5, eventIndex: 0, visitors: [], visitorIndex: 0, iterator: 0 };
      }
      function x5(b7) {
        return b7[r3] = false, b7.nodes && b7.nodes.forEach((C5) => x5(C5)), b7;
      }
      var k5 = {}, w7 = class {
        constructor(b7, C5, S6) {
          this.stringified = false, this.processed = false;
          let E6;
          if (typeof C5 == "object" && C5 !== null && (C5.type === "root" || C5.type === "document")) E6 = x5(C5);
          else if (C5 instanceof w7 || C5 instanceof i4) E6 = x5(C5.root), C5.map && (typeof S6.map > "u" && (S6.map = {}), S6.map.inline || (S6.map.inline = false), S6.map.prev = C5.map);
          else {
            let A7 = d6;
            S6.syntax && (A7 = S6.syntax.parse), S6.parser && (A7 = S6.parser), A7.parse && (A7 = A7.parse);
            try {
              E6 = A7(C5, S6);
            } catch (_6) {
              this.processed = true, this.error = _6;
            }
            E6 && !E6[n3] && a4.rebuild(E6);
          }
          this.result = new i4(b7, E6, S6), this.helpers = { ...k5, result: this.result, postcss: k5 }, this.plugins = this.processor.plugins.map((A7) => typeof A7 == "object" && A7.prepare ? { ...A7, ...A7.prepare(this.result) } : A7);
        }
        get [Symbol.toStringTag]() {
          return "LazyResult";
        }
        get processor() {
          return this.result.processor;
        }
        get opts() {
          return this.result.opts;
        }
        get css() {
          return this.stringify().css;
        }
        get content() {
          return this.stringify().content;
        }
        get map() {
          return this.stringify().map;
        }
        get root() {
          return this.sync().root;
        }
        get messages() {
          return this.sync().messages;
        }
        warnings() {
          return this.sync().warnings();
        }
        toString() {
          return this.css;
        }
        then(b7, C5) {
          return this.async().then(b7, C5);
        }
        catch(b7) {
          return this.async().catch(b7);
        }
        finally(b7) {
          return this.async().then(b7, b7);
        }
        async() {
          return this.error ? Promise.reject(this.error) : this.processed ? Promise.resolve(this.result) : (this.processing || (this.processing = this.runAsync()), this.processing);
        }
        sync() {
          if (this.error) throw this.error;
          if (this.processed) return this.result;
          if (this.processed = true, this.processing) throw this.getAsyncError();
          for (let b7 of this.plugins) {
            let C5 = this.runOnRoot(b7);
            if (m6(C5)) throw this.getAsyncError();
          }
          if (this.prepareVisitors(), this.hasListener) {
            let b7 = this.result.root;
            for (; !b7[r3]; ) b7[r3] = true, this.walkSync(b7);
            if (this.listeners.OnceExit) if (b7.type === "document") for (let C5 of b7.nodes) this.visitSync(this.listeners.OnceExit, C5);
            else this.visitSync(this.listeners.OnceExit, b7);
          }
          return this.result;
        }
        stringify() {
          if (this.error) throw this.error;
          if (this.stringified) return this.result;
          this.stringified = true, this.sync();
          let b7 = this.result.opts, C5 = s7;
          b7.syntax && (C5 = b7.syntax.stringify), b7.stringifier && (C5 = b7.stringifier), C5.stringify && (C5 = C5.stringify);
          let S6 = new o7(C5, this.result.root, this.result.opts).generate();
          return this.result.css = S6[0], this.result.map = S6[1], this.result;
        }
        walkSync(b7) {
          b7[r3] = true;
          let C5 = y9(b7);
          for (let S6 of C5) if (S6 === h7) b7.nodes && b7.each((E6) => {
            E6[r3] || this.walkSync(E6);
          });
          else {
            let E6 = this.listeners[S6];
            if (E6 && this.visitSync(E6, b7.toProxy())) return;
          }
        }
        visitSync(b7, C5) {
          for (let [S6, E6] of b7) {
            this.result.lastPlugin = S6;
            let A7;
            try {
              A7 = E6(C5, this.helpers);
            } catch (_6) {
              throw this.handleError(_6, C5.proxyOf);
            }
            if (C5.type !== "root" && C5.type !== "document" && !C5.parent) return true;
            if (m6(A7)) throw this.getAsyncError();
          }
        }
        runOnRoot(b7) {
          this.result.lastPlugin = b7;
          try {
            if (typeof b7 == "object" && b7.Once) {
              if (this.result.root.type === "document") {
                let C5 = this.result.root.nodes.map((S6) => b7.Once(S6, this.helpers));
                return m6(C5[0]) ? Promise.all(C5) : C5;
              }
              return b7.Once(this.result.root, this.helpers);
            } else if (typeof b7 == "function") return b7(this.result.root, this.result);
          } catch (C5) {
            throw this.handleError(C5);
          }
        }
        getAsyncError() {
          throw new Error("Use process(css).then(cb) to work with async plugins");
        }
        handleError(b7, C5) {
          let S6 = this.result.lastPlugin;
          try {
            C5 && C5.addToError(b7), this.error = b7, b7.name === "CssSyntaxError" && !b7.plugin ? (b7.plugin = S6.postcssPlugin, b7.setMessage()) : S6.postcssVersion;
          } catch (E6) {
            console && console.error && console.error(E6);
          }
          return b7;
        }
        async runAsync() {
          this.plugin = 0;
          for (let b7 = 0; b7 < this.plugins.length; b7++) {
            let C5 = this.plugins[b7], S6 = this.runOnRoot(C5);
            if (m6(S6)) try {
              await S6;
            } catch (E6) {
              throw this.handleError(E6);
            }
          }
          if (this.prepareVisitors(), this.hasListener) {
            let b7 = this.result.root;
            for (; !b7[r3]; ) {
              b7[r3] = true;
              let C5 = [v6(b7)];
              for (; C5.length > 0; ) {
                let S6 = this.visitTick(C5);
                if (m6(S6)) try {
                  await S6;
                } catch (E6) {
                  let A7 = C5[C5.length - 1].node;
                  throw this.handleError(E6, A7);
                }
              }
            }
            if (this.listeners.OnceExit) for (let [C5, S6] of this.listeners.OnceExit) {
              this.result.lastPlugin = C5;
              try {
                if (b7.type === "document") {
                  let E6 = b7.nodes.map((A7) => S6(A7, this.helpers));
                  await Promise.all(E6);
                } else await S6(b7, this.helpers);
              } catch (E6) {
                throw this.handleError(E6);
              }
            }
          }
          return this.processed = true, this.stringify();
        }
        prepareVisitors() {
          this.listeners = {};
          let b7 = (C5, S6, E6) => {
            this.listeners[S6] || (this.listeners[S6] = []), this.listeners[S6].push([C5, E6]);
          };
          for (let C5 of this.plugins) if (typeof C5 == "object") for (let S6 in C5) {
            if (!f6[S6] && /^[A-Z]/.test(S6)) throw new Error(`Unknown event ${S6} in ${C5.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`);
            if (!g6[S6]) if (typeof C5[S6] == "object") for (let E6 in C5[S6]) E6 === "*" ? b7(C5, S6, C5[S6][E6]) : b7(C5, S6 + "-" + E6.toLowerCase(), C5[S6][E6]);
            else typeof C5[S6] == "function" && b7(C5, S6, C5[S6]);
          }
          this.hasListener = Object.keys(this.listeners).length > 0;
        }
        visitTick(b7) {
          let C5 = b7[b7.length - 1], { node: S6, visitors: E6 } = C5;
          if (S6.type !== "root" && S6.type !== "document" && !S6.parent) {
            b7.pop();
            return;
          }
          if (E6.length > 0 && C5.visitorIndex < E6.length) {
            let [_6, U4] = E6[C5.visitorIndex];
            C5.visitorIndex += 1, C5.visitorIndex === E6.length && (C5.visitors = [], C5.visitorIndex = 0), this.result.lastPlugin = _6;
            try {
              return U4(S6.toProxy(), this.helpers);
            } catch (D7) {
              throw this.handleError(D7, S6);
            }
          }
          if (C5.iterator !== 0) {
            let _6 = C5.iterator, U4;
            for (; U4 = S6.nodes[S6.indexes[_6]]; ) if (S6.indexes[_6] += 1, !U4[r3]) {
              U4[r3] = true, b7.push(v6(U4));
              return;
            }
            C5.iterator = 0, delete S6.indexes[_6];
          }
          let A7 = C5.events;
          for (; C5.eventIndex < A7.length; ) {
            let _6 = A7[C5.eventIndex];
            if (C5.eventIndex += 1, _6 === h7) {
              S6.nodes && S6.nodes.length && (S6[r3] = true, C5.iterator = S6.getIterator());
              return;
            } else if (this.listeners[_6]) {
              C5.visitors = this.listeners[_6];
              return;
            }
          }
          b7.pop();
        }
      };
      w7.registerPostcss = (b7) => {
        k5 = b7;
      }, t.exports = w7, w7.default = w7, u5.registerLazyResult(w7), l3.registerLazyResult(w7);
    }), Pl = T7((e, t) => {
      O7();
      var r3 = hs(), n3 = rr(), o7 = ms(), s7 = an(), a4 = rn(), l3 = class {
        constructor(c5, i4, d6) {
          i4 = i4.toString(), this.stringified = false, this._processor = c5, this._css = i4, this._opts = d6, this._map = void 0;
          let u5, p4 = n3;
          this.result = new a4(this._processor, u5, this._opts), this.result.css = i4;
          let f6 = this;
          Object.defineProperty(this.result, "root", { get() {
            return f6.root;
          } });
          let g6 = new r3(p4, u5, this._opts, i4);
          if (g6.isMap()) {
            let [h7, m6] = g6.generate();
            h7 && (this.result.css = h7), m6 && (this.result.map = m6);
          }
        }
        get [Symbol.toStringTag]() {
          return "NoWorkResult";
        }
        get processor() {
          return this.result.processor;
        }
        get opts() {
          return this.result.opts;
        }
        get css() {
          return this.result.css;
        }
        get content() {
          return this.result.css;
        }
        get map() {
          return this.result.map;
        }
        get root() {
          if (this._root) return this._root;
          let c5, i4 = s7;
          try {
            c5 = i4(this._css, this._opts);
          } catch (d6) {
            this.error = d6;
          }
          if (this.error) throw this.error;
          return this._root = c5, c5;
        }
        get messages() {
          return [];
        }
        warnings() {
          return [];
        }
        toString() {
          return this._css;
        }
        then(c5, i4) {
          return this.async().then(c5, i4);
        }
        catch(c5) {
          return this.async().catch(c5);
        }
        finally(c5) {
          return this.async().then(c5, c5);
        }
        async() {
          return this.error ? Promise.reject(this.error) : Promise.resolve(this.result);
        }
        sync() {
          if (this.error) throw this.error;
          return this.result;
        }
      };
      t.exports = l3, l3.default = l3;
    }), jl = T7((e, t) => {
      O7();
      var r3 = Pl(), n3 = bs(), o7 = tn(), s7 = Mt2(), a4 = class {
        constructor(l3 = []) {
          this.version = "8.4.24", this.plugins = this.normalize(l3);
        }
        use(l3) {
          return this.plugins = this.plugins.concat(this.normalize([l3])), this;
        }
        process(l3, c5 = {}) {
          return this.plugins.length === 0 && typeof c5.parser > "u" && typeof c5.stringifier > "u" && typeof c5.syntax > "u" ? new r3(this, l3, c5) : new n3(this, l3, c5);
        }
        normalize(l3) {
          let c5 = [];
          for (let i4 of l3) if (i4.postcss === true ? i4 = i4() : i4.postcss && (i4 = i4.postcss), typeof i4 == "object" && Array.isArray(i4.plugins)) c5 = c5.concat(i4.plugins);
          else if (typeof i4 == "object" && i4.postcssPlugin) c5.push(i4);
          else if (typeof i4 == "function") c5.push(i4);
          else if (!(typeof i4 == "object" && (i4.parse || i4.stringify))) throw new Error(i4 + " is not a PostCSS plugin");
          return c5;
        }
      };
      t.exports = a4, a4.default = a4, s7.registerProcessor(a4), o7.registerProcessor(a4);
    }), Bl = T7((e, t) => {
      O7();
      var r3 = or2(), n3 = ys(), o7 = sr(), s7 = nn(), a4 = sn(), l3 = Mt2(), c5 = on();
      function i4(d6, u5) {
        if (Array.isArray(d6)) return d6.map((g6) => i4(g6));
        let { inputs: p4, ...f6 } = d6;
        if (p4) {
          u5 = [];
          for (let g6 of p4) {
            let h7 = { ...g6, __proto__: a4.prototype };
            h7.map && (h7.map = { ...h7.map, __proto__: n3.prototype }), u5.push(h7);
          }
        }
        if (f6.nodes && (f6.nodes = d6.nodes.map((g6) => i4(g6, u5))), f6.source) {
          let { inputId: g6, ...h7 } = f6.source;
          f6.source = h7, g6 != null && (f6.source.input = u5[g6]);
        }
        if (f6.type === "root") return new l3(f6);
        if (f6.type === "decl") return new r3(f6);
        if (f6.type === "rule") return new c5(f6);
        if (f6.type === "comment") return new o7(f6);
        if (f6.type === "atrule") return new s7(f6);
        throw new Error("Unknown node type: " + d6.type);
      }
      t.exports = i4, i4.default = i4;
    }), Re3 = T7((e, t) => {
      O7();
      var r3 = Kr(), n3 = or2(), o7 = bs(), s7 = ct2(), a4 = jl(), l3 = rr(), c5 = Bl(), i4 = tn(), d6 = gs(), u5 = sr(), p4 = nn(), f6 = rn(), g6 = sn(), h7 = an(), m6 = vs(), y9 = on(), v6 = Mt2(), x5 = nr();
      function k5(...w7) {
        return w7.length === 1 && Array.isArray(w7[0]) && (w7 = w7[0]), new a4(w7);
      }
      k5.plugin = function(w7, b7) {
        let C5 = false;
        function S6(...A7) {
          console && console.warn && !C5 && (C5 = true, console.warn(w7 + `: postcss.plugin was deprecated. Migration guide:
https://evilmartians.com/chronicles/postcss-8-plugin-migration`), je3.env.LANG && je3.env.LANG.startsWith("cn") && console.warn(w7 + `: \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:
https://www.w3ctech.com/topic/2226`));
          let _6 = b7(...A7);
          return _6.postcssPlugin = w7, _6.postcssVersion = new a4().version, _6;
        }
        let E6;
        return Object.defineProperty(S6, "postcss", { get() {
          return E6 || (E6 = S6()), E6;
        } }), S6.process = function(A7, _6, U4) {
          return k5([S6(U4)]).process(A7, _6);
        }, S6;
      }, k5.stringify = l3, k5.parse = h7, k5.fromJSON = c5, k5.list = m6, k5.comment = (w7) => new u5(w7), k5.atRule = (w7) => new p4(w7), k5.decl = (w7) => new n3(w7), k5.rule = (w7) => new y9(w7), k5.root = (w7) => new v6(w7), k5.document = (w7) => new i4(w7), k5.CssSyntaxError = r3, k5.Declaration = n3, k5.Container = s7, k5.Processor = a4, k5.Document = i4, k5.Comment = u5, k5.Warning = d6, k5.AtRule = p4, k5.Result = f6, k5.Input = g6, k5.Rule = y9, k5.Root = v6, k5.Node = x5, o7.registerPostcss(k5), t.exports = k5, k5.default = k5;
    }), ce3, fe3, Dl, $l, Rl, Ml, Ul, zl, Fl, Ll, Nl, Vl, Wl, ql, Gl, Yl, Hl, Ql, Jl, Zl, Xl, Kl, ec, tc, rc, nc, ut3 = $3(() => {
      O7(), ce3 = he4(Re3()), fe3 = ce3.default, Dl = ce3.default.stringify, $l = ce3.default.fromJSON, Rl = ce3.default.plugin, Ml = ce3.default.parse, Ul = ce3.default.list, zl = ce3.default.document, Fl = ce3.default.comment, Ll = ce3.default.atRule, Nl = ce3.default.rule, Vl = ce3.default.decl, Wl = ce3.default.root, ql = ce3.default.CssSyntaxError, Gl = ce3.default.Declaration, Yl = ce3.default.Container, Hl = ce3.default.Processor, Ql = ce3.default.Document, Jl = ce3.default.Comment, Zl = ce3.default.Warning, Xl = ce3.default.AtRule, Kl = ce3.default.Result, ec = ce3.default.Input, tc = ce3.default.Rule, rc = ce3.default.Root, nc = ce3.default.Node;
    }), ws = T7((e, t) => {
      O7(), t.exports = function(r3, n3, o7, s7, a4) {
        for (n3 = n3.split ? n3.split(".") : n3, s7 = 0; s7 < n3.length; s7++) r3 = r3 ? r3[n3[s7]] : a4;
        return r3 === a4 ? o7 : r3;
      };
    }), ln = T7((e, t) => {
      O7(), e.__esModule = true, e.default = o7;
      function r3(s7) {
        for (var a4 = s7.toLowerCase(), l3 = "", c5 = false, i4 = 0; i4 < 6 && a4[i4] !== void 0; i4++) {
          var d6 = a4.charCodeAt(i4), u5 = d6 >= 97 && d6 <= 102 || d6 >= 48 && d6 <= 57;
          if (c5 = d6 === 32, !u5) break;
          l3 += a4[i4];
        }
        if (l3.length !== 0) {
          var p4 = parseInt(l3, 16), f6 = p4 >= 55296 && p4 <= 57343;
          return f6 || p4 === 0 || p4 > 1114111 ? ["\uFFFD", l3.length + (c5 ? 1 : 0)] : [String.fromCodePoint(p4), l3.length + (c5 ? 1 : 0)];
        }
      }
      var n3 = /\\/;
      function o7(s7) {
        var a4 = n3.test(s7);
        if (!a4) return s7;
        for (var l3 = "", c5 = 0; c5 < s7.length; c5++) {
          if (s7[c5] === "\\") {
            var i4 = r3(s7.slice(c5 + 1, c5 + 7));
            if (i4 !== void 0) {
              l3 += i4[0], c5 += i4[1];
              continue;
            }
            if (s7[c5 + 1] === "\\") {
              l3 += "\\", c5++;
              continue;
            }
            s7.length === c5 + 1 && (l3 += s7[c5]);
            continue;
          }
          l3 += s7[c5];
        }
        return l3;
      }
      t.exports = e.default;
    }), oc = T7((e, t) => {
      O7(), e.__esModule = true, e.default = r3;
      function r3(n3) {
        for (var o7 = arguments.length, s7 = new Array(o7 > 1 ? o7 - 1 : 0), a4 = 1; a4 < o7; a4++) s7[a4 - 1] = arguments[a4];
        for (; s7.length > 0; ) {
          var l3 = s7.shift();
          if (!n3[l3]) return;
          n3 = n3[l3];
        }
        return n3;
      }
      t.exports = e.default;
    }), sc = T7((e, t) => {
      O7(), e.__esModule = true, e.default = r3;
      function r3(n3) {
        for (var o7 = arguments.length, s7 = new Array(o7 > 1 ? o7 - 1 : 0), a4 = 1; a4 < o7; a4++) s7[a4 - 1] = arguments[a4];
        for (; s7.length > 0; ) {
          var l3 = s7.shift();
          n3[l3] || (n3[l3] = {}), n3 = n3[l3];
        }
      }
      t.exports = e.default;
    }), ac = T7((e, t) => {
      O7(), e.__esModule = true, e.default = r3;
      function r3(n3) {
        for (var o7 = "", s7 = n3.indexOf("/*"), a4 = 0; s7 >= 0; ) {
          o7 = o7 + n3.slice(a4, s7);
          var l3 = n3.indexOf("*/", s7 + 2);
          if (l3 < 0) return o7;
          a4 = l3 + 2, s7 = n3.indexOf("/*", a4);
        }
        return o7 = o7 + n3.slice(a4), o7;
      }
      t.exports = e.default;
    }), ar = T7((e) => {
      O7(), e.__esModule = true, e.unesc = e.stripComments = e.getProp = e.ensureObject = void 0;
      var t = s7(ln());
      e.unesc = t.default;
      var r3 = s7(oc());
      e.getProp = r3.default;
      var n3 = s7(sc());
      e.ensureObject = n3.default;
      var o7 = s7(ac());
      e.stripComments = o7.default;
      function s7(a4) {
        return a4 && a4.__esModule ? a4 : { default: a4 };
      }
    }), st3 = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = ar();
      function n3(l3, c5) {
        for (var i4 = 0; i4 < c5.length; i4++) {
          var d6 = c5[i4];
          d6.enumerable = d6.enumerable || false, d6.configurable = true, "value" in d6 && (d6.writable = true), Object.defineProperty(l3, d6.key, d6);
        }
      }
      function o7(l3, c5, i4) {
        return c5 && n3(l3.prototype, c5), i4 && n3(l3, i4), Object.defineProperty(l3, "prototype", { writable: false }), l3;
      }
      var s7 = function l3(c5, i4) {
        if (typeof c5 != "object" || c5 === null) return c5;
        var d6 = new c5.constructor();
        for (var u5 in c5) if (c5.hasOwnProperty(u5)) {
          var p4 = c5[u5], f6 = typeof p4;
          u5 === "parent" && f6 === "object" ? i4 && (d6[u5] = i4) : p4 instanceof Array ? d6[u5] = p4.map(function(g6) {
            return l3(g6, d6);
          }) : d6[u5] = l3(p4, d6);
        }
        return d6;
      }, a4 = function() {
        function l3(i4) {
          i4 === void 0 && (i4 = {}), Object.assign(this, i4), this.spaces = this.spaces || {}, this.spaces.before = this.spaces.before || "", this.spaces.after = this.spaces.after || "";
        }
        var c5 = l3.prototype;
        return c5.remove = function() {
          return this.parent && this.parent.removeChild(this), this.parent = void 0, this;
        }, c5.replaceWith = function() {
          if (this.parent) {
            for (var i4 in arguments) this.parent.insertBefore(this, arguments[i4]);
            this.remove();
          }
          return this;
        }, c5.next = function() {
          return this.parent.at(this.parent.index(this) + 1);
        }, c5.prev = function() {
          return this.parent.at(this.parent.index(this) - 1);
        }, c5.clone = function(i4) {
          i4 === void 0 && (i4 = {});
          var d6 = s7(this);
          for (var u5 in i4) d6[u5] = i4[u5];
          return d6;
        }, c5.appendToPropertyAndEscape = function(i4, d6, u5) {
          this.raws || (this.raws = {});
          var p4 = this[i4], f6 = this.raws[i4];
          this[i4] = p4 + d6, f6 || u5 !== d6 ? this.raws[i4] = (f6 || p4) + u5 : delete this.raws[i4];
        }, c5.setPropertyAndEscape = function(i4, d6, u5) {
          this.raws || (this.raws = {}), this[i4] = d6, this.raws[i4] = u5;
        }, c5.setPropertyWithoutEscape = function(i4, d6) {
          this[i4] = d6, this.raws && delete this.raws[i4];
        }, c5.isAtPosition = function(i4, d6) {
          if (this.source && this.source.start && this.source.end) return !(this.source.start.line > i4 || this.source.end.line < i4 || this.source.start.line === i4 && this.source.start.column > d6 || this.source.end.line === i4 && this.source.end.column < d6);
        }, c5.stringifyProperty = function(i4) {
          return this.raws && this.raws[i4] || this[i4];
        }, c5.valueToString = function() {
          return String(this.stringifyProperty("value"));
        }, c5.toString = function() {
          return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
        }, o7(l3, [{ key: "rawSpaceBefore", get: function() {
          var i4 = this.raws && this.raws.spaces && this.raws.spaces.before;
          return i4 === void 0 && (i4 = this.spaces && this.spaces.before), i4 || "";
        }, set: function(i4) {
          (0, r3.ensureObject)(this, "raws", "spaces"), this.raws.spaces.before = i4;
        } }, { key: "rawSpaceAfter", get: function() {
          var i4 = this.raws && this.raws.spaces && this.raws.spaces.after;
          return i4 === void 0 && (i4 = this.spaces.after), i4 || "";
        }, set: function(i4) {
          (0, r3.ensureObject)(this, "raws", "spaces"), this.raws.spaces.after = i4;
        } }]), l3;
      }();
      e.default = a4, t.exports = e.default;
    }), ke2 = T7((e) => {
      O7(), e.__esModule = true, e.UNIVERSAL = e.TAG = e.STRING = e.SELECTOR = e.ROOT = e.PSEUDO = e.NESTING = e.ID = e.COMMENT = e.COMBINATOR = e.CLASS = e.ATTRIBUTE = void 0;
      var t = "tag";
      e.TAG = t;
      var r3 = "string";
      e.STRING = r3;
      var n3 = "selector";
      e.SELECTOR = n3;
      var o7 = "root";
      e.ROOT = o7;
      var s7 = "pseudo";
      e.PSEUDO = s7;
      var a4 = "nesting";
      e.NESTING = a4;
      var l3 = "id";
      e.ID = l3;
      var c5 = "comment";
      e.COMMENT = c5;
      var i4 = "combinator";
      e.COMBINATOR = i4;
      var d6 = "class";
      e.CLASS = d6;
      var u5 = "attribute";
      e.ATTRIBUTE = u5;
      var p4 = "universal";
      e.UNIVERSAL = p4;
    }), cn = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = a4(st3()), n3 = s7(ke2());
      function o7(h7) {
        if (typeof WeakMap != "function") return null;
        var m6 = /* @__PURE__ */ new WeakMap(), y9 = /* @__PURE__ */ new WeakMap();
        return (o7 = function(v6) {
          return v6 ? y9 : m6;
        })(h7);
      }
      function s7(h7, m6) {
        if (!m6 && h7 && h7.__esModule) return h7;
        if (h7 === null || typeof h7 != "object" && typeof h7 != "function") return { default: h7 };
        var y9 = o7(m6);
        if (y9 && y9.has(h7)) return y9.get(h7);
        var v6 = {}, x5 = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var k5 in h7) if (k5 !== "default" && Object.prototype.hasOwnProperty.call(h7, k5)) {
          var w7 = x5 ? Object.getOwnPropertyDescriptor(h7, k5) : null;
          w7 && (w7.get || w7.set) ? Object.defineProperty(v6, k5, w7) : v6[k5] = h7[k5];
        }
        return v6.default = h7, y9 && y9.set(h7, v6), v6;
      }
      function a4(h7) {
        return h7 && h7.__esModule ? h7 : { default: h7 };
      }
      function l3(h7, m6) {
        var y9 = typeof Symbol < "u" && h7[Symbol.iterator] || h7["@@iterator"];
        if (y9) return (y9 = y9.call(h7)).next.bind(y9);
        if (Array.isArray(h7) || (y9 = c5(h7)) || m6 && h7 && typeof h7.length == "number") {
          y9 && (h7 = y9);
          var v6 = 0;
          return function() {
            return v6 >= h7.length ? { done: true } : { done: false, value: h7[v6++] };
          };
        }
        throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
      }
      function c5(h7, m6) {
        if (h7) {
          if (typeof h7 == "string") return i4(h7, m6);
          var y9 = Object.prototype.toString.call(h7).slice(8, -1);
          if (y9 === "Object" && h7.constructor && (y9 = h7.constructor.name), y9 === "Map" || y9 === "Set") return Array.from(h7);
          if (y9 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(y9)) return i4(h7, m6);
        }
      }
      function i4(h7, m6) {
        (m6 == null || m6 > h7.length) && (m6 = h7.length);
        for (var y9 = 0, v6 = new Array(m6); y9 < m6; y9++) v6[y9] = h7[y9];
        return v6;
      }
      function d6(h7, m6) {
        for (var y9 = 0; y9 < m6.length; y9++) {
          var v6 = m6[y9];
          v6.enumerable = v6.enumerable || false, v6.configurable = true, "value" in v6 && (v6.writable = true), Object.defineProperty(h7, v6.key, v6);
        }
      }
      function u5(h7, m6, y9) {
        return m6 && d6(h7.prototype, m6), y9 && d6(h7, y9), Object.defineProperty(h7, "prototype", { writable: false }), h7;
      }
      function p4(h7, m6) {
        h7.prototype = Object.create(m6.prototype), h7.prototype.constructor = h7, f6(h7, m6);
      }
      function f6(h7, m6) {
        return f6 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(y9, v6) {
          return y9.__proto__ = v6, y9;
        }, f6(h7, m6);
      }
      var g6 = function(h7) {
        p4(m6, h7);
        function m6(v6) {
          var x5;
          return x5 = h7.call(this, v6) || this, x5.nodes || (x5.nodes = []), x5;
        }
        var y9 = m6.prototype;
        return y9.append = function(v6) {
          return v6.parent = this, this.nodes.push(v6), this;
        }, y9.prepend = function(v6) {
          return v6.parent = this, this.nodes.unshift(v6), this;
        }, y9.at = function(v6) {
          return this.nodes[v6];
        }, y9.index = function(v6) {
          return typeof v6 == "number" ? v6 : this.nodes.indexOf(v6);
        }, y9.removeChild = function(v6) {
          v6 = this.index(v6), this.at(v6).parent = void 0, this.nodes.splice(v6, 1);
          var x5;
          for (var k5 in this.indexes) x5 = this.indexes[k5], x5 >= v6 && (this.indexes[k5] = x5 - 1);
          return this;
        }, y9.removeAll = function() {
          for (var v6 = l3(this.nodes), x5; !(x5 = v6()).done; ) {
            var k5 = x5.value;
            k5.parent = void 0;
          }
          return this.nodes = [], this;
        }, y9.empty = function() {
          return this.removeAll();
        }, y9.insertAfter = function(v6, x5) {
          x5.parent = this;
          var k5 = this.index(v6);
          this.nodes.splice(k5 + 1, 0, x5), x5.parent = this;
          var w7;
          for (var b7 in this.indexes) w7 = this.indexes[b7], k5 <= w7 && (this.indexes[b7] = w7 + 1);
          return this;
        }, y9.insertBefore = function(v6, x5) {
          x5.parent = this;
          var k5 = this.index(v6);
          this.nodes.splice(k5, 0, x5), x5.parent = this;
          var w7;
          for (var b7 in this.indexes) w7 = this.indexes[b7], w7 <= k5 && (this.indexes[b7] = w7 + 1);
          return this;
        }, y9._findChildAtPosition = function(v6, x5) {
          var k5 = void 0;
          return this.each(function(w7) {
            if (w7.atPosition) {
              var b7 = w7.atPosition(v6, x5);
              if (b7) return k5 = b7, false;
            } else if (w7.isAtPosition(v6, x5)) return k5 = w7, false;
          }), k5;
        }, y9.atPosition = function(v6, x5) {
          if (this.isAtPosition(v6, x5)) return this._findChildAtPosition(v6, x5) || this;
        }, y9._inferEndPosition = function() {
          this.last && this.last.source && this.last.source.end && (this.source = this.source || {}, this.source.end = this.source.end || {}, Object.assign(this.source.end, this.last.source.end));
        }, y9.each = function(v6) {
          this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach++;
          var x5 = this.lastEach;
          if (this.indexes[x5] = 0, !!this.length) {
            for (var k5, w7; this.indexes[x5] < this.length && (k5 = this.indexes[x5], w7 = v6(this.at(k5), k5), w7 !== false); ) this.indexes[x5] += 1;
            if (delete this.indexes[x5], w7 === false) return false;
          }
        }, y9.walk = function(v6) {
          return this.each(function(x5, k5) {
            var w7 = v6(x5, k5);
            if (w7 !== false && x5.length && (w7 = x5.walk(v6)), w7 === false) return false;
          });
        }, y9.walkAttributes = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.ATTRIBUTE) return v6.call(x5, k5);
          });
        }, y9.walkClasses = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.CLASS) return v6.call(x5, k5);
          });
        }, y9.walkCombinators = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.COMBINATOR) return v6.call(x5, k5);
          });
        }, y9.walkComments = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.COMMENT) return v6.call(x5, k5);
          });
        }, y9.walkIds = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.ID) return v6.call(x5, k5);
          });
        }, y9.walkNesting = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.NESTING) return v6.call(x5, k5);
          });
        }, y9.walkPseudos = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.PSEUDO) return v6.call(x5, k5);
          });
        }, y9.walkTags = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.TAG) return v6.call(x5, k5);
          });
        }, y9.walkUniversals = function(v6) {
          var x5 = this;
          return this.walk(function(k5) {
            if (k5.type === n3.UNIVERSAL) return v6.call(x5, k5);
          });
        }, y9.split = function(v6) {
          var x5 = this, k5 = [];
          return this.reduce(function(w7, b7, C5) {
            var S6 = v6.call(x5, b7);
            return k5.push(b7), S6 ? (w7.push(k5), k5 = []) : C5 === x5.length - 1 && w7.push(k5), w7;
          }, []);
        }, y9.map = function(v6) {
          return this.nodes.map(v6);
        }, y9.reduce = function(v6, x5) {
          return this.nodes.reduce(v6, x5);
        }, y9.every = function(v6) {
          return this.nodes.every(v6);
        }, y9.some = function(v6) {
          return this.nodes.some(v6);
        }, y9.filter = function(v6) {
          return this.nodes.filter(v6);
        }, y9.sort = function(v6) {
          return this.nodes.sort(v6);
        }, y9.toString = function() {
          return this.map(String).join("");
        }, u5(m6, [{ key: "first", get: function() {
          return this.at(0);
        } }, { key: "last", get: function() {
          return this.at(this.length - 1);
        } }, { key: "length", get: function() {
          return this.nodes.length;
        } }]), m6;
      }(r3.default);
      e.default = g6, t.exports = e.default;
    }), xs = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(cn()), n3 = ke2();
      function o7(d6) {
        return d6 && d6.__esModule ? d6 : { default: d6 };
      }
      function s7(d6, u5) {
        for (var p4 = 0; p4 < u5.length; p4++) {
          var f6 = u5[p4];
          f6.enumerable = f6.enumerable || false, f6.configurable = true, "value" in f6 && (f6.writable = true), Object.defineProperty(d6, f6.key, f6);
        }
      }
      function a4(d6, u5, p4) {
        return u5 && s7(d6.prototype, u5), p4 && s7(d6, p4), Object.defineProperty(d6, "prototype", { writable: false }), d6;
      }
      function l3(d6, u5) {
        d6.prototype = Object.create(u5.prototype), d6.prototype.constructor = d6, c5(d6, u5);
      }
      function c5(d6, u5) {
        return c5 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(p4, f6) {
          return p4.__proto__ = f6, p4;
        }, c5(d6, u5);
      }
      var i4 = function(d6) {
        l3(u5, d6);
        function u5(f6) {
          var g6;
          return g6 = d6.call(this, f6) || this, g6.type = n3.ROOT, g6;
        }
        var p4 = u5.prototype;
        return p4.toString = function() {
          var f6 = this.reduce(function(g6, h7) {
            return g6.push(String(h7)), g6;
          }, []).join(",");
          return this.trailingComma ? f6 + "," : f6;
        }, p4.error = function(f6, g6) {
          return this._error ? this._error(f6, g6) : new Error(f6);
        }, a4(u5, [{ key: "errorGenerator", set: function(f6) {
          this._error = f6;
        } }]), u5;
      }(r3.default);
      e.default = i4, t.exports = e.default;
    }), ks = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(cn()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.SELECTOR, u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), un = T7((e, t) => {
      O7();
      var r3 = {}, n3 = r3.hasOwnProperty, o7 = function(i4, d6) {
        if (!i4) return d6;
        var u5 = {};
        for (var p4 in d6) u5[p4] = n3.call(i4, p4) ? i4[p4] : d6[p4];
        return u5;
      }, s7 = /[ -,\.\/:-@\[-\^`\{-~]/, a4 = /[ -,\.\/:-@\[\]\^`\{-~]/, l3 = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, c5 = function i4(d6, u5) {
        u5 = o7(u5, i4.options), u5.quotes != "single" && u5.quotes != "double" && (u5.quotes = "single");
        for (var p4 = u5.quotes == "double" ? '"' : "'", f6 = u5.isIdentifier, g6 = d6.charAt(0), h7 = "", m6 = 0, y9 = d6.length; m6 < y9; ) {
          var v6 = d6.charAt(m6++), x5 = v6.charCodeAt(), k5 = void 0;
          if (x5 < 32 || x5 > 126) {
            if (x5 >= 55296 && x5 <= 56319 && m6 < y9) {
              var w7 = d6.charCodeAt(m6++);
              (w7 & 64512) == 56320 ? x5 = ((x5 & 1023) << 10) + (w7 & 1023) + 65536 : m6--;
            }
            k5 = "\\" + x5.toString(16).toUpperCase() + " ";
          } else u5.escapeEverything ? s7.test(v6) ? k5 = "\\" + v6 : k5 = "\\" + x5.toString(16).toUpperCase() + " " : /[\t\n\f\r\x0B]/.test(v6) ? k5 = "\\" + x5.toString(16).toUpperCase() + " " : v6 == "\\" || !f6 && (v6 == '"' && p4 == v6 || v6 == "'" && p4 == v6) || f6 && a4.test(v6) ? k5 = "\\" + v6 : k5 = v6;
          h7 += k5;
        }
        return f6 && (/^-[-\d]/.test(h7) ? h7 = "\\-" + h7.slice(1) : /\d/.test(g6) && (h7 = "\\3" + g6 + " " + h7.slice(1))), h7 = h7.replace(l3, function(b7, C5, S6) {
          return C5 && C5.length % 2 ? b7 : (C5 || "") + S6;
        }), !f6 && u5.wrap ? p4 + h7 + p4 : h7;
      };
      c5.options = { escapeEverything: false, isIdentifier: false, quotes: "single", wrap: false }, c5.version = "3.0.0", t.exports = c5;
    }), Ss = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = a4(un()), n3 = ar(), o7 = a4(st3()), s7 = ke2();
      function a4(p4) {
        return p4 && p4.__esModule ? p4 : { default: p4 };
      }
      function l3(p4, f6) {
        for (var g6 = 0; g6 < f6.length; g6++) {
          var h7 = f6[g6];
          h7.enumerable = h7.enumerable || false, h7.configurable = true, "value" in h7 && (h7.writable = true), Object.defineProperty(p4, h7.key, h7);
        }
      }
      function c5(p4, f6, g6) {
        return f6 && l3(p4.prototype, f6), g6 && l3(p4, g6), Object.defineProperty(p4, "prototype", { writable: false }), p4;
      }
      function i4(p4, f6) {
        p4.prototype = Object.create(f6.prototype), p4.prototype.constructor = p4, d6(p4, f6);
      }
      function d6(p4, f6) {
        return d6 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(g6, h7) {
          return g6.__proto__ = h7, g6;
        }, d6(p4, f6);
      }
      var u5 = function(p4) {
        i4(f6, p4);
        function f6(h7) {
          var m6;
          return m6 = p4.call(this, h7) || this, m6.type = s7.CLASS, m6._constructed = true, m6;
        }
        var g6 = f6.prototype;
        return g6.valueToString = function() {
          return "." + p4.prototype.valueToString.call(this);
        }, c5(f6, [{ key: "value", get: function() {
          return this._value;
        }, set: function(h7) {
          if (this._constructed) {
            var m6 = (0, r3.default)(h7, { isIdentifier: true });
            m6 !== h7 ? ((0, n3.ensureObject)(this, "raws"), this.raws.value = m6) : this.raws && delete this.raws.value;
          }
          this._value = h7;
        } }]), f6;
      }(o7.default);
      e.default = u5, t.exports = e.default;
    }), Cs = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(st3()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.COMMENT, u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), As = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(st3()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(u5) {
          var p4;
          return p4 = c5.call(this, u5) || this, p4.type = n3.ID, p4;
        }
        var d6 = i4.prototype;
        return d6.valueToString = function() {
          return "#" + c5.prototype.valueToString.call(this);
        }, i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), dn = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = s7(un()), n3 = ar(), o7 = s7(st3());
      function s7(u5) {
        return u5 && u5.__esModule ? u5 : { default: u5 };
      }
      function a4(u5, p4) {
        for (var f6 = 0; f6 < p4.length; f6++) {
          var g6 = p4[f6];
          g6.enumerable = g6.enumerable || false, g6.configurable = true, "value" in g6 && (g6.writable = true), Object.defineProperty(u5, g6.key, g6);
        }
      }
      function l3(u5, p4, f6) {
        return p4 && a4(u5.prototype, p4), f6 && a4(u5, f6), Object.defineProperty(u5, "prototype", { writable: false }), u5;
      }
      function c5(u5, p4) {
        u5.prototype = Object.create(p4.prototype), u5.prototype.constructor = u5, i4(u5, p4);
      }
      function i4(u5, p4) {
        return i4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(f6, g6) {
          return f6.__proto__ = g6, f6;
        }, i4(u5, p4);
      }
      var d6 = function(u5) {
        c5(p4, u5);
        function p4() {
          return u5.apply(this, arguments) || this;
        }
        var f6 = p4.prototype;
        return f6.qualifiedName = function(g6) {
          return this.namespace ? this.namespaceString + "|" + g6 : g6;
        }, f6.valueToString = function() {
          return this.qualifiedName(u5.prototype.valueToString.call(this));
        }, l3(p4, [{ key: "namespace", get: function() {
          return this._namespace;
        }, set: function(g6) {
          if (g6 === true || g6 === "*" || g6 === "&") {
            this._namespace = g6, this.raws && delete this.raws.namespace;
            return;
          }
          var h7 = (0, r3.default)(g6, { isIdentifier: true });
          this._namespace = g6, h7 !== g6 ? ((0, n3.ensureObject)(this, "raws"), this.raws.namespace = h7) : this.raws && delete this.raws.namespace;
        } }, { key: "ns", get: function() {
          return this._namespace;
        }, set: function(g6) {
          this.namespace = g6;
        } }, { key: "namespaceString", get: function() {
          if (this.namespace) {
            var g6 = this.stringifyProperty("namespace");
            return g6 === true ? "" : g6;
          } else return "";
        } }]), p4;
      }(o7.default);
      e.default = d6, t.exports = e.default;
    }), Os = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(dn()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.TAG, u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), _s = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(st3()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.STRING, u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), Es = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(cn()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(u5) {
          var p4;
          return p4 = c5.call(this, u5) || this, p4.type = n3.PSEUDO, p4;
        }
        var d6 = i4.prototype;
        return d6.toString = function() {
          var u5 = this.length ? "(" + this.map(String).join(",") + ")" : "";
          return [this.rawSpaceBefore, this.stringifyProperty("value"), u5, this.rawSpaceAfter].join("");
        }, i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), Ts = {};
    Fe2(Ts, { deprecate: () => ic });
    function ic(e) {
      return e;
    }
    var lc = $3(() => {
      O7();
    }), cc = T7((e, t) => {
      O7(), t.exports = (lc(), Ts).deprecate;
    }), Is = T7((e) => {
      O7(), e.__esModule = true, e.default = void 0, e.unescapeValue = m6;
      var t = a4(un()), r3 = a4(ln()), n3 = a4(dn()), o7 = ke2(), s7;
      function a4(w7) {
        return w7 && w7.__esModule ? w7 : { default: w7 };
      }
      function l3(w7, b7) {
        for (var C5 = 0; C5 < b7.length; C5++) {
          var S6 = b7[C5];
          S6.enumerable = S6.enumerable || false, S6.configurable = true, "value" in S6 && (S6.writable = true), Object.defineProperty(w7, S6.key, S6);
        }
      }
      function c5(w7, b7, C5) {
        return b7 && l3(w7.prototype, b7), C5 && l3(w7, C5), Object.defineProperty(w7, "prototype", { writable: false }), w7;
      }
      function i4(w7, b7) {
        w7.prototype = Object.create(b7.prototype), w7.prototype.constructor = w7, d6(w7, b7);
      }
      function d6(w7, b7) {
        return d6 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(C5, S6) {
          return C5.__proto__ = S6, C5;
        }, d6(w7, b7);
      }
      var u5 = cc(), p4 = /^('|")([^]*)\1$/, f6 = u5(function() {
      }, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead."), g6 = u5(function() {
      }, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead."), h7 = u5(function() {
      }, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
      function m6(w7) {
        var b7 = false, C5 = null, S6 = w7, E6 = S6.match(p4);
        return E6 && (C5 = E6[1], S6 = E6[2]), S6 = (0, r3.default)(S6), S6 !== w7 && (b7 = true), { deprecatedUsage: b7, unescaped: S6, quoteMark: C5 };
      }
      function y9(w7) {
        if (w7.quoteMark !== void 0 || w7.value === void 0) return w7;
        h7();
        var b7 = m6(w7.value), C5 = b7.quoteMark, S6 = b7.unescaped;
        return w7.raws || (w7.raws = {}), w7.raws.value === void 0 && (w7.raws.value = w7.value), w7.value = S6, w7.quoteMark = C5, w7;
      }
      var v6 = function(w7) {
        i4(b7, w7);
        function b7(S6) {
          var E6;
          return S6 === void 0 && (S6 = {}), E6 = w7.call(this, y9(S6)) || this, E6.type = o7.ATTRIBUTE, E6.raws = E6.raws || {}, Object.defineProperty(E6.raws, "unquoted", { get: u5(function() {
            return E6.value;
          }, "attr.raws.unquoted is deprecated. Call attr.value instead."), set: u5(function() {
            return E6.value;
          }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.") }), E6._constructed = true, E6;
        }
        var C5 = b7.prototype;
        return C5.getQuotedValue = function(S6) {
          S6 === void 0 && (S6 = {});
          var E6 = this._determineQuoteMark(S6), A7 = x5[E6], _6 = (0, t.default)(this._value, A7);
          return _6;
        }, C5._determineQuoteMark = function(S6) {
          return S6.smart ? this.smartQuoteMark(S6) : this.preferredQuoteMark(S6);
        }, C5.setValue = function(S6, E6) {
          E6 === void 0 && (E6 = {}), this._value = S6, this._quoteMark = this._determineQuoteMark(E6), this._syncRawValue();
        }, C5.smartQuoteMark = function(S6) {
          var E6 = this.value, A7 = E6.replace(/[^']/g, "").length, _6 = E6.replace(/[^"]/g, "").length;
          if (A7 + _6 === 0) {
            var U4 = (0, t.default)(E6, { isIdentifier: true });
            if (U4 === E6) return b7.NO_QUOTE;
            var D7 = this.preferredQuoteMark(S6);
            if (D7 === b7.NO_QUOTE) {
              var j5 = this.quoteMark || S6.quoteMark || b7.DOUBLE_QUOTE, L4 = x5[j5], F4 = (0, t.default)(E6, L4);
              if (F4.length < U4.length) return j5;
            }
            return D7;
          } else return _6 === A7 ? this.preferredQuoteMark(S6) : _6 < A7 ? b7.DOUBLE_QUOTE : b7.SINGLE_QUOTE;
        }, C5.preferredQuoteMark = function(S6) {
          var E6 = S6.preferCurrentQuoteMark ? this.quoteMark : S6.quoteMark;
          return E6 === void 0 && (E6 = S6.preferCurrentQuoteMark ? S6.quoteMark : this.quoteMark), E6 === void 0 && (E6 = b7.DOUBLE_QUOTE), E6;
        }, C5._syncRawValue = function() {
          var S6 = (0, t.default)(this._value, x5[this.quoteMark]);
          S6 === this._value ? this.raws && delete this.raws.value : this.raws.value = S6;
        }, C5._handleEscapes = function(S6, E6) {
          if (this._constructed) {
            var A7 = (0, t.default)(E6, { isIdentifier: true });
            A7 !== E6 ? this.raws[S6] = A7 : delete this.raws[S6];
          }
        }, C5._spacesFor = function(S6) {
          var E6 = { before: "", after: "" }, A7 = this.spaces[S6] || {}, _6 = this.raws.spaces && this.raws.spaces[S6] || {};
          return Object.assign(E6, A7, _6);
        }, C5._stringFor = function(S6, E6, A7) {
          E6 === void 0 && (E6 = S6), A7 === void 0 && (A7 = k5);
          var _6 = this._spacesFor(E6);
          return A7(this.stringifyProperty(S6), _6);
        }, C5.offsetOf = function(S6) {
          var E6 = 1, A7 = this._spacesFor("attribute");
          if (E6 += A7.before.length, S6 === "namespace" || S6 === "ns") return this.namespace ? E6 : -1;
          if (S6 === "attributeNS" || (E6 += this.namespaceString.length, this.namespace && (E6 += 1), S6 === "attribute")) return E6;
          E6 += this.stringifyProperty("attribute").length, E6 += A7.after.length;
          var _6 = this._spacesFor("operator");
          E6 += _6.before.length;
          var U4 = this.stringifyProperty("operator");
          if (S6 === "operator") return U4 ? E6 : -1;
          E6 += U4.length, E6 += _6.after.length;
          var D7 = this._spacesFor("value");
          E6 += D7.before.length;
          var j5 = this.stringifyProperty("value");
          if (S6 === "value") return j5 ? E6 : -1;
          E6 += j5.length, E6 += D7.after.length;
          var L4 = this._spacesFor("insensitive");
          return E6 += L4.before.length, S6 === "insensitive" && this.insensitive ? E6 : -1;
        }, C5.toString = function() {
          var S6 = this, E6 = [this.rawSpaceBefore, "["];
          return E6.push(this._stringFor("qualifiedAttribute", "attribute")), this.operator && (this.value || this.value === "") && (E6.push(this._stringFor("operator")), E6.push(this._stringFor("value")), E6.push(this._stringFor("insensitiveFlag", "insensitive", function(A7, _6) {
            return A7.length > 0 && !S6.quoted && _6.before.length === 0 && !(S6.spaces.value && S6.spaces.value.after) && (_6.before = " "), k5(A7, _6);
          }))), E6.push("]"), E6.push(this.rawSpaceAfter), E6.join("");
        }, c5(b7, [{ key: "quoted", get: function() {
          var S6 = this.quoteMark;
          return S6 === "'" || S6 === '"';
        }, set: function(S6) {
          g6();
        } }, { key: "quoteMark", get: function() {
          return this._quoteMark;
        }, set: function(S6) {
          if (!this._constructed) {
            this._quoteMark = S6;
            return;
          }
          this._quoteMark !== S6 && (this._quoteMark = S6, this._syncRawValue());
        } }, { key: "qualifiedAttribute", get: function() {
          return this.qualifiedName(this.raws.attribute || this.attribute);
        } }, { key: "insensitiveFlag", get: function() {
          return this.insensitive ? "i" : "";
        } }, { key: "value", get: function() {
          return this._value;
        }, set: function(S6) {
          if (this._constructed) {
            var E6 = m6(S6), A7 = E6.deprecatedUsage, _6 = E6.unescaped, U4 = E6.quoteMark;
            if (A7 && f6(), _6 === this._value && U4 === this._quoteMark) return;
            this._value = _6, this._quoteMark = U4, this._syncRawValue();
          } else this._value = S6;
        } }, { key: "insensitive", get: function() {
          return this._insensitive;
        }, set: function(S6) {
          S6 || (this._insensitive = false, this.raws && (this.raws.insensitiveFlag === "I" || this.raws.insensitiveFlag === "i") && (this.raws.insensitiveFlag = void 0)), this._insensitive = S6;
        } }, { key: "attribute", get: function() {
          return this._attribute;
        }, set: function(S6) {
          this._handleEscapes("attribute", S6), this._attribute = S6;
        } }]), b7;
      }(n3.default);
      e.default = v6, v6.NO_QUOTE = null, v6.SINGLE_QUOTE = "'", v6.DOUBLE_QUOTE = '"';
      var x5 = (s7 = { "'": { quotes: "single", wrap: true }, '"': { quotes: "double", wrap: true } }, s7[null] = { isIdentifier: true }, s7);
      function k5(w7, b7) {
        return "" + b7.before + w7 + b7.after;
      }
    }), Ps = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(dn()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.UNIVERSAL, u5.value = "*", u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), js = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(st3()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.COMBINATOR, u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), Bs = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = o7(st3()), n3 = ke2();
      function o7(c5) {
        return c5 && c5.__esModule ? c5 : { default: c5 };
      }
      function s7(c5, i4) {
        c5.prototype = Object.create(i4.prototype), c5.prototype.constructor = c5, a4(c5, i4);
      }
      function a4(c5, i4) {
        return a4 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(d6, u5) {
          return d6.__proto__ = u5, d6;
        }, a4(c5, i4);
      }
      var l3 = function(c5) {
        s7(i4, c5);
        function i4(d6) {
          var u5;
          return u5 = c5.call(this, d6) || this, u5.type = n3.NESTING, u5.value = "&", u5;
        }
        return i4;
      }(r3.default);
      e.default = l3, t.exports = e.default;
    }), uc = T7((e, t) => {
      O7(), e.__esModule = true, e.default = r3;
      function r3(n3) {
        return n3.sort(function(o7, s7) {
          return o7 - s7;
        });
      }
      t.exports = e.default;
    }), Ds = T7((e) => {
      O7(), e.__esModule = true, e.word = e.tilde = e.tab = e.str = e.space = e.slash = e.singleQuote = e.semicolon = e.plus = e.pipe = e.openSquare = e.openParenthesis = e.newline = e.greaterThan = e.feed = e.equals = e.doubleQuote = e.dollar = e.cr = e.comment = e.comma = e.combinator = e.colon = e.closeSquare = e.closeParenthesis = e.caret = e.bang = e.backslash = e.at = e.asterisk = e.ampersand = void 0;
      var t = 38;
      e.ampersand = t;
      var r3 = 42;
      e.asterisk = r3;
      var n3 = 64;
      e.at = n3;
      var o7 = 44;
      e.comma = o7;
      var s7 = 58;
      e.colon = s7;
      var a4 = 59;
      e.semicolon = a4;
      var l3 = 40;
      e.openParenthesis = l3;
      var c5 = 41;
      e.closeParenthesis = c5;
      var i4 = 91;
      e.openSquare = i4;
      var d6 = 93;
      e.closeSquare = d6;
      var u5 = 36;
      e.dollar = u5;
      var p4 = 126;
      e.tilde = p4;
      var f6 = 94;
      e.caret = f6;
      var g6 = 43;
      e.plus = g6;
      var h7 = 61;
      e.equals = h7;
      var m6 = 124;
      e.pipe = m6;
      var y9 = 62;
      e.greaterThan = y9;
      var v6 = 32;
      e.space = v6;
      var x5 = 39;
      e.singleQuote = x5;
      var k5 = 34;
      e.doubleQuote = k5;
      var w7 = 47;
      e.slash = w7;
      var b7 = 33;
      e.bang = b7;
      var C5 = 92;
      e.backslash = C5;
      var S6 = 13;
      e.cr = S6;
      var E6 = 12;
      e.feed = E6;
      var A7 = 10;
      e.newline = A7;
      var _6 = 9;
      e.tab = _6;
      var U4 = x5;
      e.str = U4;
      var D7 = -1;
      e.comment = D7;
      var j5 = -2;
      e.word = j5;
      var L4 = -3;
      e.combinator = L4;
    }), dc = T7((e) => {
      O7(), e.__esModule = true, e.FIELDS = void 0, e.default = g6;
      var t = s7(Ds()), r3, n3;
      function o7(h7) {
        if (typeof WeakMap != "function") return null;
        var m6 = /* @__PURE__ */ new WeakMap(), y9 = /* @__PURE__ */ new WeakMap();
        return (o7 = function(v6) {
          return v6 ? y9 : m6;
        })(h7);
      }
      function s7(h7, m6) {
        if (!m6 && h7 && h7.__esModule) return h7;
        if (h7 === null || typeof h7 != "object" && typeof h7 != "function") return { default: h7 };
        var y9 = o7(m6);
        if (y9 && y9.has(h7)) return y9.get(h7);
        var v6 = {}, x5 = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var k5 in h7) if (k5 !== "default" && Object.prototype.hasOwnProperty.call(h7, k5)) {
          var w7 = x5 ? Object.getOwnPropertyDescriptor(h7, k5) : null;
          w7 && (w7.get || w7.set) ? Object.defineProperty(v6, k5, w7) : v6[k5] = h7[k5];
        }
        return v6.default = h7, y9 && y9.set(h7, v6), v6;
      }
      var a4 = (r3 = {}, r3[t.tab] = true, r3[t.newline] = true, r3[t.cr] = true, r3[t.feed] = true, r3), l3 = (n3 = {}, n3[t.space] = true, n3[t.tab] = true, n3[t.newline] = true, n3[t.cr] = true, n3[t.feed] = true, n3[t.ampersand] = true, n3[t.asterisk] = true, n3[t.bang] = true, n3[t.comma] = true, n3[t.colon] = true, n3[t.semicolon] = true, n3[t.openParenthesis] = true, n3[t.closeParenthesis] = true, n3[t.openSquare] = true, n3[t.closeSquare] = true, n3[t.singleQuote] = true, n3[t.doubleQuote] = true, n3[t.plus] = true, n3[t.pipe] = true, n3[t.tilde] = true, n3[t.greaterThan] = true, n3[t.equals] = true, n3[t.dollar] = true, n3[t.caret] = true, n3[t.slash] = true, n3), c5 = {}, i4 = "0123456789abcdefABCDEF";
      for (d6 = 0; d6 < i4.length; d6++) c5[i4.charCodeAt(d6)] = true;
      var d6;
      function u5(h7, m6) {
        var y9 = m6, v6;
        do {
          if (v6 = h7.charCodeAt(y9), l3[v6]) return y9 - 1;
          v6 === t.backslash ? y9 = p4(h7, y9) + 1 : y9++;
        } while (y9 < h7.length);
        return y9 - 1;
      }
      function p4(h7, m6) {
        var y9 = m6, v6 = h7.charCodeAt(y9 + 1);
        if (!a4[v6]) if (c5[v6]) {
          var x5 = 0;
          do
            y9++, x5++, v6 = h7.charCodeAt(y9 + 1);
          while (c5[v6] && x5 < 6);
          x5 < 6 && v6 === t.space && y9++;
        } else y9++;
        return y9;
      }
      var f6 = { TYPE: 0, START_LINE: 1, START_COL: 2, END_LINE: 3, END_COL: 4, START_POS: 5, END_POS: 6 };
      e.FIELDS = f6;
      function g6(h7) {
        var m6 = [], y9 = h7.css.valueOf(), v6 = y9, x5 = v6.length, k5 = -1, w7 = 1, b7 = 0, C5 = 0, S6, E6, A7, _6, U4, D7, j5, L4, F4, H4, Q3, we3, Ce4;
        function R5(M6, P5) {
          if (h7.safe) y9 += P5, F4 = y9.length - 1;
          else throw h7.error("Unclosed " + M6, w7, b7 - k5, b7);
        }
        for (; b7 < x5; ) {
          switch (S6 = y9.charCodeAt(b7), S6 === t.newline && (k5 = b7, w7 += 1), S6) {
            case t.space:
            case t.tab:
            case t.newline:
            case t.cr:
            case t.feed:
              F4 = b7;
              do
                F4 += 1, S6 = y9.charCodeAt(F4), S6 === t.newline && (k5 = F4, w7 += 1);
              while (S6 === t.space || S6 === t.newline || S6 === t.tab || S6 === t.cr || S6 === t.feed);
              Ce4 = t.space, _6 = w7, A7 = F4 - k5 - 1, C5 = F4;
              break;
            case t.plus:
            case t.greaterThan:
            case t.tilde:
            case t.pipe:
              F4 = b7;
              do
                F4 += 1, S6 = y9.charCodeAt(F4);
              while (S6 === t.plus || S6 === t.greaterThan || S6 === t.tilde || S6 === t.pipe);
              Ce4 = t.combinator, _6 = w7, A7 = b7 - k5, C5 = F4;
              break;
            case t.asterisk:
            case t.ampersand:
            case t.bang:
            case t.comma:
            case t.equals:
            case t.dollar:
            case t.caret:
            case t.openSquare:
            case t.closeSquare:
            case t.colon:
            case t.semicolon:
            case t.openParenthesis:
            case t.closeParenthesis:
              F4 = b7, Ce4 = S6, _6 = w7, A7 = b7 - k5, C5 = F4 + 1;
              break;
            case t.singleQuote:
            case t.doubleQuote:
              we3 = S6 === t.singleQuote ? "'" : '"', F4 = b7;
              do
                for (U4 = false, F4 = y9.indexOf(we3, F4 + 1), F4 === -1 && R5("quote", we3), D7 = F4; y9.charCodeAt(D7 - 1) === t.backslash; ) D7 -= 1, U4 = !U4;
              while (U4);
              Ce4 = t.str, _6 = w7, A7 = b7 - k5, C5 = F4 + 1;
              break;
            default:
              S6 === t.slash && y9.charCodeAt(b7 + 1) === t.asterisk ? (F4 = y9.indexOf("*/", b7 + 2) + 1, F4 === 0 && R5("comment", "*/"), E6 = y9.slice(b7, F4 + 1), L4 = E6.split(`
`), j5 = L4.length - 1, j5 > 0 ? (H4 = w7 + j5, Q3 = F4 - L4[j5].length) : (H4 = w7, Q3 = k5), Ce4 = t.comment, w7 = H4, _6 = H4, A7 = F4 - Q3) : S6 === t.slash ? (F4 = b7, Ce4 = S6, _6 = w7, A7 = b7 - k5, C5 = F4 + 1) : (F4 = u5(y9, b7), Ce4 = t.word, _6 = w7, A7 = F4 - k5), C5 = F4 + 1;
              break;
          }
          m6.push([Ce4, w7, b7 - k5, _6, A7, b7, C5]), Q3 && (k5 = Q3, Q3 = null), b7 = C5;
        }
        return m6;
      }
    }), pc = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = C5(xs()), n3 = C5(ks()), o7 = C5(Ss()), s7 = C5(Cs()), a4 = C5(As()), l3 = C5(Os()), c5 = C5(_s()), i4 = C5(Es()), d6 = b7(Is()), u5 = C5(Ps()), p4 = C5(js()), f6 = C5(Bs()), g6 = C5(uc()), h7 = b7(dc()), m6 = b7(Ds()), y9 = b7(ke2()), v6 = ar(), x5, k5;
      function w7(R5) {
        if (typeof WeakMap != "function") return null;
        var M6 = /* @__PURE__ */ new WeakMap(), P5 = /* @__PURE__ */ new WeakMap();
        return (w7 = function(I7) {
          return I7 ? P5 : M6;
        })(R5);
      }
      function b7(R5, M6) {
        if (!M6 && R5 && R5.__esModule) return R5;
        if (R5 === null || typeof R5 != "object" && typeof R5 != "function") return { default: R5 };
        var P5 = w7(M6);
        if (P5 && P5.has(R5)) return P5.get(R5);
        var I7 = {}, G5 = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var B3 in R5) if (B3 !== "default" && Object.prototype.hasOwnProperty.call(R5, B3)) {
          var N4 = G5 ? Object.getOwnPropertyDescriptor(R5, B3) : null;
          N4 && (N4.get || N4.set) ? Object.defineProperty(I7, B3, N4) : I7[B3] = R5[B3];
        }
        return I7.default = R5, P5 && P5.set(R5, I7), I7;
      }
      function C5(R5) {
        return R5 && R5.__esModule ? R5 : { default: R5 };
      }
      function S6(R5, M6) {
        for (var P5 = 0; P5 < M6.length; P5++) {
          var I7 = M6[P5];
          I7.enumerable = I7.enumerable || false, I7.configurable = true, "value" in I7 && (I7.writable = true), Object.defineProperty(R5, I7.key, I7);
        }
      }
      function E6(R5, M6, P5) {
        return M6 && S6(R5.prototype, M6), P5 && S6(R5, P5), Object.defineProperty(R5, "prototype", { writable: false }), R5;
      }
      var A7 = (x5 = {}, x5[m6.space] = true, x5[m6.cr] = true, x5[m6.feed] = true, x5[m6.newline] = true, x5[m6.tab] = true, x5), _6 = Object.assign({}, A7, (k5 = {}, k5[m6.comment] = true, k5));
      function U4(R5) {
        return { line: R5[h7.FIELDS.START_LINE], column: R5[h7.FIELDS.START_COL] };
      }
      function D7(R5) {
        return { line: R5[h7.FIELDS.END_LINE], column: R5[h7.FIELDS.END_COL] };
      }
      function j5(R5, M6, P5, I7) {
        return { start: { line: R5, column: M6 }, end: { line: P5, column: I7 } };
      }
      function L4(R5) {
        return j5(R5[h7.FIELDS.START_LINE], R5[h7.FIELDS.START_COL], R5[h7.FIELDS.END_LINE], R5[h7.FIELDS.END_COL]);
      }
      function F4(R5, M6) {
        if (R5) return j5(R5[h7.FIELDS.START_LINE], R5[h7.FIELDS.START_COL], M6[h7.FIELDS.END_LINE], M6[h7.FIELDS.END_COL]);
      }
      function H4(R5, M6) {
        var P5 = R5[M6];
        if (typeof P5 == "string") return P5.indexOf("\\") !== -1 && ((0, v6.ensureObject)(R5, "raws"), R5[M6] = (0, v6.unesc)(P5), R5.raws[M6] === void 0 && (R5.raws[M6] = P5)), R5;
      }
      function Q3(R5, M6) {
        for (var P5 = -1, I7 = []; (P5 = R5.indexOf(M6, P5 + 1)) !== -1; ) I7.push(P5);
        return I7;
      }
      function we3() {
        var R5 = Array.prototype.concat.apply([], arguments);
        return R5.filter(function(M6, P5) {
          return P5 === R5.indexOf(M6);
        });
      }
      var Ce4 = function() {
        function R5(P5, I7) {
          I7 === void 0 && (I7 = {}), this.rule = P5, this.options = Object.assign({ lossy: false, safe: false }, I7), this.position = 0, this.css = typeof this.rule == "string" ? this.rule : this.rule.selector, this.tokens = (0, h7.default)({ css: this.css, error: this._errorGenerator(), safe: this.options.safe });
          var G5 = F4(this.tokens[0], this.tokens[this.tokens.length - 1]);
          this.root = new r3.default({ source: G5 }), this.root.errorGenerator = this._errorGenerator();
          var B3 = new n3.default({ source: { start: { line: 1, column: 1 } } });
          this.root.append(B3), this.current = B3, this.loop();
        }
        var M6 = R5.prototype;
        return M6._errorGenerator = function() {
          var P5 = this;
          return function(I7, G5) {
            return typeof P5.rule == "string" ? new Error(I7) : P5.rule.error(I7, G5);
          };
        }, M6.attribute = function() {
          var P5 = [], I7 = this.currToken;
          for (this.position++; this.position < this.tokens.length && this.currToken[h7.FIELDS.TYPE] !== m6.closeSquare; ) P5.push(this.currToken), this.position++;
          if (this.currToken[h7.FIELDS.TYPE] !== m6.closeSquare) return this.expected("closing square bracket", this.currToken[h7.FIELDS.START_POS]);
          var G5 = P5.length, B3 = { source: j5(I7[1], I7[2], this.currToken[3], this.currToken[4]), sourceIndex: I7[h7.FIELDS.START_POS] };
          if (G5 === 1 && !~[m6.word].indexOf(P5[0][h7.FIELDS.TYPE])) return this.expected("attribute", P5[0][h7.FIELDS.START_POS]);
          for (var N4 = 0, K5 = "", J5 = "", V3 = null, ne4 = false; N4 < G5; ) {
            var ie4 = P5[N4], q5 = this.content(ie4), le4 = P5[N4 + 1];
            switch (ie4[h7.FIELDS.TYPE]) {
              case m6.space:
                if (ne4 = true, this.options.lossy) break;
                if (V3) {
                  (0, v6.ensureObject)(B3, "spaces", V3);
                  var We3 = B3.spaces[V3].after || "";
                  B3.spaces[V3].after = We3 + q5;
                  var ze3 = (0, v6.getProp)(B3, "raws", "spaces", V3, "after") || null;
                  ze3 && (B3.raws.spaces[V3].after = ze3 + q5);
                } else K5 = K5 + q5, J5 = J5 + q5;
                break;
              case m6.asterisk:
                if (le4[h7.FIELDS.TYPE] === m6.equals) B3.operator = q5, V3 = "operator";
                else if ((!B3.namespace || V3 === "namespace" && !ne4) && le4) {
                  K5 && ((0, v6.ensureObject)(B3, "spaces", "attribute"), B3.spaces.attribute.before = K5, K5 = ""), J5 && ((0, v6.ensureObject)(B3, "raws", "spaces", "attribute"), B3.raws.spaces.attribute.before = K5, J5 = ""), B3.namespace = (B3.namespace || "") + q5;
                  var Ae2 = (0, v6.getProp)(B3, "raws", "namespace") || null;
                  Ae2 && (B3.raws.namespace += q5), V3 = "namespace";
                }
                ne4 = false;
                break;
              case m6.dollar:
                if (V3 === "value") {
                  var be4 = (0, v6.getProp)(B3, "raws", "value");
                  B3.value += "$", be4 && (B3.raws.value = be4 + "$");
                  break;
                }
              case m6.caret:
                le4[h7.FIELDS.TYPE] === m6.equals && (B3.operator = q5, V3 = "operator"), ne4 = false;
                break;
              case m6.combinator:
                if (q5 === "~" && le4[h7.FIELDS.TYPE] === m6.equals && (B3.operator = q5, V3 = "operator"), q5 !== "|") {
                  ne4 = false;
                  break;
                }
                le4[h7.FIELDS.TYPE] === m6.equals ? (B3.operator = q5, V3 = "operator") : !B3.namespace && !B3.attribute && (B3.namespace = true), ne4 = false;
                break;
              case m6.word:
                if (le4 && this.content(le4) === "|" && P5[N4 + 2] && P5[N4 + 2][h7.FIELDS.TYPE] !== m6.equals && !B3.operator && !B3.namespace) B3.namespace = q5, V3 = "namespace";
                else if (!B3.attribute || V3 === "attribute" && !ne4) {
                  K5 && ((0, v6.ensureObject)(B3, "spaces", "attribute"), B3.spaces.attribute.before = K5, K5 = ""), J5 && ((0, v6.ensureObject)(B3, "raws", "spaces", "attribute"), B3.raws.spaces.attribute.before = J5, J5 = ""), B3.attribute = (B3.attribute || "") + q5;
                  var Ie2 = (0, v6.getProp)(B3, "raws", "attribute") || null;
                  Ie2 && (B3.raws.attribute += q5), V3 = "attribute";
                } else if (!B3.value && B3.value !== "" || V3 === "value" && !(ne4 || B3.quoteMark)) {
                  var Pe4 = (0, v6.unesc)(q5), Qe2 = (0, v6.getProp)(B3, "raws", "value") || "", Et2 = B3.value || "";
                  B3.value = Et2 + Pe4, B3.quoteMark = null, (Pe4 !== q5 || Qe2) && ((0, v6.ensureObject)(B3, "raws"), B3.raws.value = (Qe2 || Et2) + q5), V3 = "value";
                } else {
                  var Tt = q5 === "i" || q5 === "I";
                  (B3.value || B3.value === "") && (B3.quoteMark || ne4) ? (B3.insensitive = Tt, (!Tt || q5 === "I") && ((0, v6.ensureObject)(B3, "raws"), B3.raws.insensitiveFlag = q5), V3 = "insensitive", K5 && ((0, v6.ensureObject)(B3, "spaces", "insensitive"), B3.spaces.insensitive.before = K5, K5 = ""), J5 && ((0, v6.ensureObject)(B3, "raws", "spaces", "insensitive"), B3.raws.spaces.insensitive.before = J5, J5 = "")) : (B3.value || B3.value === "") && (V3 = "value", B3.value += q5, B3.raws.value && (B3.raws.value += q5));
                }
                ne4 = false;
                break;
              case m6.str:
                if (!B3.attribute || !B3.operator) return this.error("Expected an attribute followed by an operator preceding the string.", { index: ie4[h7.FIELDS.START_POS] });
                var bt2 = (0, d6.unescapeValue)(q5), oo = bt2.unescaped, so = bt2.quoteMark;
                B3.value = oo, B3.quoteMark = so, V3 = "value", (0, v6.ensureObject)(B3, "raws"), B3.raws.value = q5, ne4 = false;
                break;
              case m6.equals:
                if (!B3.attribute) return this.expected("attribute", ie4[h7.FIELDS.START_POS], q5);
                if (B3.value) return this.error('Unexpected "=" found; an operator was already defined.', { index: ie4[h7.FIELDS.START_POS] });
                B3.operator = B3.operator ? B3.operator + q5 : q5, V3 = "operator", ne4 = false;
                break;
              case m6.comment:
                if (V3) if (ne4 || le4 && le4[h7.FIELDS.TYPE] === m6.space || V3 === "insensitive") {
                  var ao = (0, v6.getProp)(B3, "spaces", V3, "after") || "", io = (0, v6.getProp)(B3, "raws", "spaces", V3, "after") || ao;
                  (0, v6.ensureObject)(B3, "raws", "spaces", V3), B3.raws.spaces[V3].after = io + q5;
                } else {
                  var lo = B3[V3] || "", co = (0, v6.getProp)(B3, "raws", V3) || lo;
                  (0, v6.ensureObject)(B3, "raws"), B3.raws[V3] = co + q5;
                }
                else J5 = J5 + q5;
                break;
              default:
                return this.error('Unexpected "' + q5 + '" found.', { index: ie4[h7.FIELDS.START_POS] });
            }
            N4++;
          }
          H4(B3, "attribute"), H4(B3, "namespace"), this.newNode(new d6.default(B3)), this.position++;
        }, M6.parseWhitespaceEquivalentTokens = function(P5) {
          P5 < 0 && (P5 = this.tokens.length);
          var I7 = this.position, G5 = [], B3 = "", N4 = void 0;
          do
            if (A7[this.currToken[h7.FIELDS.TYPE]]) this.options.lossy || (B3 += this.content());
            else if (this.currToken[h7.FIELDS.TYPE] === m6.comment) {
              var K5 = {};
              B3 && (K5.before = B3, B3 = ""), N4 = new s7.default({ value: this.content(), source: L4(this.currToken), sourceIndex: this.currToken[h7.FIELDS.START_POS], spaces: K5 }), G5.push(N4);
            }
          while (++this.position < P5);
          if (B3) {
            if (N4) N4.spaces.after = B3;
            else if (!this.options.lossy) {
              var J5 = this.tokens[I7], V3 = this.tokens[this.position - 1];
              G5.push(new c5.default({ value: "", source: j5(J5[h7.FIELDS.START_LINE], J5[h7.FIELDS.START_COL], V3[h7.FIELDS.END_LINE], V3[h7.FIELDS.END_COL]), sourceIndex: J5[h7.FIELDS.START_POS], spaces: { before: B3, after: "" } }));
            }
          }
          return G5;
        }, M6.convertWhitespaceNodesToSpace = function(P5, I7) {
          var G5 = this;
          I7 === void 0 && (I7 = false);
          var B3 = "", N4 = "";
          P5.forEach(function(J5) {
            var V3 = G5.lossySpace(J5.spaces.before, I7), ne4 = G5.lossySpace(J5.rawSpaceBefore, I7);
            B3 += V3 + G5.lossySpace(J5.spaces.after, I7 && V3.length === 0), N4 += V3 + J5.value + G5.lossySpace(J5.rawSpaceAfter, I7 && ne4.length === 0);
          }), N4 === B3 && (N4 = void 0);
          var K5 = { space: B3, rawSpace: N4 };
          return K5;
        }, M6.isNamedCombinator = function(P5) {
          return P5 === void 0 && (P5 = this.position), this.tokens[P5 + 0] && this.tokens[P5 + 0][h7.FIELDS.TYPE] === m6.slash && this.tokens[P5 + 1] && this.tokens[P5 + 1][h7.FIELDS.TYPE] === m6.word && this.tokens[P5 + 2] && this.tokens[P5 + 2][h7.FIELDS.TYPE] === m6.slash;
        }, M6.namedCombinator = function() {
          if (this.isNamedCombinator()) {
            var P5 = this.content(this.tokens[this.position + 1]), I7 = (0, v6.unesc)(P5).toLowerCase(), G5 = {};
            I7 !== P5 && (G5.value = "/" + P5 + "/");
            var B3 = new p4.default({ value: "/" + I7 + "/", source: j5(this.currToken[h7.FIELDS.START_LINE], this.currToken[h7.FIELDS.START_COL], this.tokens[this.position + 2][h7.FIELDS.END_LINE], this.tokens[this.position + 2][h7.FIELDS.END_COL]), sourceIndex: this.currToken[h7.FIELDS.START_POS], raws: G5 });
            return this.position = this.position + 3, B3;
          } else this.unexpected();
        }, M6.combinator = function() {
          var P5 = this;
          if (this.content() === "|") return this.namespace();
          var I7 = this.locateNextMeaningfulToken(this.position);
          if (I7 < 0 || this.tokens[I7][h7.FIELDS.TYPE] === m6.comma) {
            var G5 = this.parseWhitespaceEquivalentTokens(I7);
            if (G5.length > 0) {
              var B3 = this.current.last;
              if (B3) {
                var N4 = this.convertWhitespaceNodesToSpace(G5), K5 = N4.space, J5 = N4.rawSpace;
                J5 !== void 0 && (B3.rawSpaceAfter += J5), B3.spaces.after += K5;
              } else G5.forEach(function(Qe2) {
                return P5.newNode(Qe2);
              });
            }
            return;
          }
          var V3 = this.currToken, ne4 = void 0;
          I7 > this.position && (ne4 = this.parseWhitespaceEquivalentTokens(I7));
          var ie4;
          if (this.isNamedCombinator() ? ie4 = this.namedCombinator() : this.currToken[h7.FIELDS.TYPE] === m6.combinator ? (ie4 = new p4.default({ value: this.content(), source: L4(this.currToken), sourceIndex: this.currToken[h7.FIELDS.START_POS] }), this.position++) : A7[this.currToken[h7.FIELDS.TYPE]] || ne4 || this.unexpected(), ie4) {
            if (ne4) {
              var q5 = this.convertWhitespaceNodesToSpace(ne4), le4 = q5.space, We3 = q5.rawSpace;
              ie4.spaces.before = le4, ie4.rawSpaceBefore = We3;
            }
          } else {
            var ze3 = this.convertWhitespaceNodesToSpace(ne4, true), Ae2 = ze3.space, be4 = ze3.rawSpace;
            be4 || (be4 = Ae2);
            var Ie2 = {}, Pe4 = { spaces: {} };
            Ae2.endsWith(" ") && be4.endsWith(" ") ? (Ie2.before = Ae2.slice(0, Ae2.length - 1), Pe4.spaces.before = be4.slice(0, be4.length - 1)) : Ae2.startsWith(" ") && be4.startsWith(" ") ? (Ie2.after = Ae2.slice(1), Pe4.spaces.after = be4.slice(1)) : Pe4.value = be4, ie4 = new p4.default({ value: " ", source: F4(V3, this.tokens[this.position - 1]), sourceIndex: V3[h7.FIELDS.START_POS], spaces: Ie2, raws: Pe4 });
          }
          return this.currToken && this.currToken[h7.FIELDS.TYPE] === m6.space && (ie4.spaces.after = this.optionalSpace(this.content()), this.position++), this.newNode(ie4);
        }, M6.comma = function() {
          if (this.position === this.tokens.length - 1) {
            this.root.trailingComma = true, this.position++;
            return;
          }
          this.current._inferEndPosition();
          var P5 = new n3.default({ source: { start: U4(this.tokens[this.position + 1]) } });
          this.current.parent.append(P5), this.current = P5, this.position++;
        }, M6.comment = function() {
          var P5 = this.currToken;
          this.newNode(new s7.default({ value: this.content(), source: L4(P5), sourceIndex: P5[h7.FIELDS.START_POS] })), this.position++;
        }, M6.error = function(P5, I7) {
          throw this.root.error(P5, I7);
        }, M6.missingBackslash = function() {
          return this.error("Expected a backslash preceding the semicolon.", { index: this.currToken[h7.FIELDS.START_POS] });
        }, M6.missingParenthesis = function() {
          return this.expected("opening parenthesis", this.currToken[h7.FIELDS.START_POS]);
        }, M6.missingSquareBracket = function() {
          return this.expected("opening square bracket", this.currToken[h7.FIELDS.START_POS]);
        }, M6.unexpected = function() {
          return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[h7.FIELDS.START_POS]);
        }, M6.unexpectedPipe = function() {
          return this.error("Unexpected '|'.", this.currToken[h7.FIELDS.START_POS]);
        }, M6.namespace = function() {
          var P5 = this.prevToken && this.content(this.prevToken) || true;
          if (this.nextToken[h7.FIELDS.TYPE] === m6.word) return this.position++, this.word(P5);
          if (this.nextToken[h7.FIELDS.TYPE] === m6.asterisk) return this.position++, this.universal(P5);
          this.unexpectedPipe();
        }, M6.nesting = function() {
          if (this.nextToken) {
            var P5 = this.content(this.nextToken);
            if (P5 === "|") {
              this.position++;
              return;
            }
          }
          var I7 = this.currToken;
          this.newNode(new f6.default({ value: this.content(), source: L4(I7), sourceIndex: I7[h7.FIELDS.START_POS] })), this.position++;
        }, M6.parentheses = function() {
          var P5 = this.current.last, I7 = 1;
          if (this.position++, P5 && P5.type === y9.PSEUDO) {
            var G5 = new n3.default({ source: { start: U4(this.tokens[this.position - 1]) } }), B3 = this.current;
            for (P5.append(G5), this.current = G5; this.position < this.tokens.length && I7; ) this.currToken[h7.FIELDS.TYPE] === m6.openParenthesis && I7++, this.currToken[h7.FIELDS.TYPE] === m6.closeParenthesis && I7--, I7 ? this.parse() : (this.current.source.end = D7(this.currToken), this.current.parent.source.end = D7(this.currToken), this.position++);
            this.current = B3;
          } else {
            for (var N4 = this.currToken, K5 = "(", J5; this.position < this.tokens.length && I7; ) this.currToken[h7.FIELDS.TYPE] === m6.openParenthesis && I7++, this.currToken[h7.FIELDS.TYPE] === m6.closeParenthesis && I7--, J5 = this.currToken, K5 += this.parseParenthesisToken(this.currToken), this.position++;
            P5 ? P5.appendToPropertyAndEscape("value", K5, K5) : this.newNode(new c5.default({ value: K5, source: j5(N4[h7.FIELDS.START_LINE], N4[h7.FIELDS.START_COL], J5[h7.FIELDS.END_LINE], J5[h7.FIELDS.END_COL]), sourceIndex: N4[h7.FIELDS.START_POS] }));
          }
          if (I7) return this.expected("closing parenthesis", this.currToken[h7.FIELDS.START_POS]);
        }, M6.pseudo = function() {
          for (var P5 = this, I7 = "", G5 = this.currToken; this.currToken && this.currToken[h7.FIELDS.TYPE] === m6.colon; ) I7 += this.content(), this.position++;
          if (!this.currToken) return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
          if (this.currToken[h7.FIELDS.TYPE] === m6.word) this.splitWord(false, function(B3, N4) {
            I7 += B3, P5.newNode(new i4.default({ value: I7, source: F4(G5, P5.currToken), sourceIndex: G5[h7.FIELDS.START_POS] })), N4 > 1 && P5.nextToken && P5.nextToken[h7.FIELDS.TYPE] === m6.openParenthesis && P5.error("Misplaced parenthesis.", { index: P5.nextToken[h7.FIELDS.START_POS] });
          });
          else return this.expected(["pseudo-class", "pseudo-element"], this.currToken[h7.FIELDS.START_POS]);
        }, M6.space = function() {
          var P5 = this.content();
          this.position === 0 || this.prevToken[h7.FIELDS.TYPE] === m6.comma || this.prevToken[h7.FIELDS.TYPE] === m6.openParenthesis || this.current.nodes.every(function(I7) {
            return I7.type === "comment";
          }) ? (this.spaces = this.optionalSpace(P5), this.position++) : this.position === this.tokens.length - 1 || this.nextToken[h7.FIELDS.TYPE] === m6.comma || this.nextToken[h7.FIELDS.TYPE] === m6.closeParenthesis ? (this.current.last.spaces.after = this.optionalSpace(P5), this.position++) : this.combinator();
        }, M6.string = function() {
          var P5 = this.currToken;
          this.newNode(new c5.default({ value: this.content(), source: L4(P5), sourceIndex: P5[h7.FIELDS.START_POS] })), this.position++;
        }, M6.universal = function(P5) {
          var I7 = this.nextToken;
          if (I7 && this.content(I7) === "|") return this.position++, this.namespace();
          var G5 = this.currToken;
          this.newNode(new u5.default({ value: this.content(), source: L4(G5), sourceIndex: G5[h7.FIELDS.START_POS] }), P5), this.position++;
        }, M6.splitWord = function(P5, I7) {
          for (var G5 = this, B3 = this.nextToken, N4 = this.content(); B3 && ~[m6.dollar, m6.caret, m6.equals, m6.word].indexOf(B3[h7.FIELDS.TYPE]); ) {
            this.position++;
            var K5 = this.content();
            if (N4 += K5, K5.lastIndexOf("\\") === K5.length - 1) {
              var J5 = this.nextToken;
              J5 && J5[h7.FIELDS.TYPE] === m6.space && (N4 += this.requiredSpace(this.content(J5)), this.position++);
            }
            B3 = this.nextToken;
          }
          var V3 = Q3(N4, ".").filter(function(le4) {
            var We3 = N4[le4 - 1] === "\\", ze3 = /^\d+\.\d+%$/.test(N4);
            return !We3 && !ze3;
          }), ne4 = Q3(N4, "#").filter(function(le4) {
            return N4[le4 - 1] !== "\\";
          }), ie4 = Q3(N4, "#{");
          ie4.length && (ne4 = ne4.filter(function(le4) {
            return !~ie4.indexOf(le4);
          }));
          var q5 = (0, g6.default)(we3([0].concat(V3, ne4)));
          q5.forEach(function(le4, We3) {
            var ze3 = q5[We3 + 1] || N4.length, Ae2 = N4.slice(le4, ze3);
            if (We3 === 0 && I7) return I7.call(G5, Ae2, q5.length);
            var be4, Ie2 = G5.currToken, Pe4 = Ie2[h7.FIELDS.START_POS] + q5[We3], Qe2 = j5(Ie2[1], Ie2[2] + le4, Ie2[3], Ie2[2] + (ze3 - 1));
            if (~V3.indexOf(le4)) {
              var Et2 = { value: Ae2.slice(1), source: Qe2, sourceIndex: Pe4 };
              be4 = new o7.default(H4(Et2, "value"));
            } else if (~ne4.indexOf(le4)) {
              var Tt = { value: Ae2.slice(1), source: Qe2, sourceIndex: Pe4 };
              be4 = new a4.default(H4(Tt, "value"));
            } else {
              var bt2 = { value: Ae2, source: Qe2, sourceIndex: Pe4 };
              H4(bt2, "value"), be4 = new l3.default(bt2);
            }
            G5.newNode(be4, P5), P5 = null;
          }), this.position++;
        }, M6.word = function(P5) {
          var I7 = this.nextToken;
          return I7 && this.content(I7) === "|" ? (this.position++, this.namespace()) : this.splitWord(P5);
        }, M6.loop = function() {
          for (; this.position < this.tokens.length; ) this.parse(true);
          return this.current._inferEndPosition(), this.root;
        }, M6.parse = function(P5) {
          switch (this.currToken[h7.FIELDS.TYPE]) {
            case m6.space:
              this.space();
              break;
            case m6.comment:
              this.comment();
              break;
            case m6.openParenthesis:
              this.parentheses();
              break;
            case m6.closeParenthesis:
              P5 && this.missingParenthesis();
              break;
            case m6.openSquare:
              this.attribute();
              break;
            case m6.dollar:
            case m6.caret:
            case m6.equals:
            case m6.word:
              this.word();
              break;
            case m6.colon:
              this.pseudo();
              break;
            case m6.comma:
              this.comma();
              break;
            case m6.asterisk:
              this.universal();
              break;
            case m6.ampersand:
              this.nesting();
              break;
            case m6.slash:
            case m6.combinator:
              this.combinator();
              break;
            case m6.str:
              this.string();
              break;
            case m6.closeSquare:
              this.missingSquareBracket();
            case m6.semicolon:
              this.missingBackslash();
            default:
              this.unexpected();
          }
        }, M6.expected = function(P5, I7, G5) {
          if (Array.isArray(P5)) {
            var B3 = P5.pop();
            P5 = P5.join(", ") + " or " + B3;
          }
          var N4 = /^[aeiou]/.test(P5[0]) ? "an" : "a";
          return G5 ? this.error("Expected " + N4 + " " + P5 + ', found "' + G5 + '" instead.', { index: I7 }) : this.error("Expected " + N4 + " " + P5 + ".", { index: I7 });
        }, M6.requiredSpace = function(P5) {
          return this.options.lossy ? " " : P5;
        }, M6.optionalSpace = function(P5) {
          return this.options.lossy ? "" : P5;
        }, M6.lossySpace = function(P5, I7) {
          return this.options.lossy ? I7 ? " " : "" : P5;
        }, M6.parseParenthesisToken = function(P5) {
          var I7 = this.content(P5);
          return P5[h7.FIELDS.TYPE] === m6.space ? this.requiredSpace(I7) : I7;
        }, M6.newNode = function(P5, I7) {
          return I7 && (/^ +$/.test(I7) && (this.options.lossy || (this.spaces = (this.spaces || "") + I7), I7 = true), P5.namespace = I7, H4(P5, "namespace")), this.spaces && (P5.spaces.before = this.spaces, this.spaces = ""), this.current.append(P5);
        }, M6.content = function(P5) {
          return P5 === void 0 && (P5 = this.currToken), this.css.slice(P5[h7.FIELDS.START_POS], P5[h7.FIELDS.END_POS]);
        }, M6.locateNextMeaningfulToken = function(P5) {
          P5 === void 0 && (P5 = this.position + 1);
          for (var I7 = P5; I7 < this.tokens.length; ) if (_6[this.tokens[I7][h7.FIELDS.TYPE]]) {
            I7++;
            continue;
          } else return I7;
          return -1;
        }, E6(R5, [{ key: "currToken", get: function() {
          return this.tokens[this.position];
        } }, { key: "nextToken", get: function() {
          return this.tokens[this.position + 1];
        } }, { key: "prevToken", get: function() {
          return this.tokens[this.position - 1];
        } }]), R5;
      }();
      e.default = Ce4, t.exports = e.default;
    }), fc = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = n3(pc());
      function n3(s7) {
        return s7 && s7.__esModule ? s7 : { default: s7 };
      }
      var o7 = function() {
        function s7(l3, c5) {
          this.func = l3 || function() {
          }, this.funcRes = null, this.options = c5;
        }
        var a4 = s7.prototype;
        return a4._shouldUpdateSelector = function(l3, c5) {
          c5 === void 0 && (c5 = {});
          var i4 = Object.assign({}, this.options, c5);
          return i4.updateSelector === false ? false : typeof l3 != "string";
        }, a4._isLossy = function(l3) {
          l3 === void 0 && (l3 = {});
          var c5 = Object.assign({}, this.options, l3);
          return c5.lossless === false;
        }, a4._root = function(l3, c5) {
          c5 === void 0 && (c5 = {});
          var i4 = new r3.default(l3, this._parseOptions(c5));
          return i4.root;
        }, a4._parseOptions = function(l3) {
          return { lossy: this._isLossy(l3) };
        }, a4._run = function(l3, c5) {
          var i4 = this;
          return c5 === void 0 && (c5 = {}), new Promise(function(d6, u5) {
            try {
              var p4 = i4._root(l3, c5);
              Promise.resolve(i4.func(p4)).then(function(f6) {
                var g6 = void 0;
                return i4._shouldUpdateSelector(l3, c5) && (g6 = p4.toString(), l3.selector = g6), { transform: f6, root: p4, string: g6 };
              }).then(d6, u5);
            } catch (f6) {
              u5(f6);
              return;
            }
          });
        }, a4._runSync = function(l3, c5) {
          c5 === void 0 && (c5 = {});
          var i4 = this._root(l3, c5), d6 = this.func(i4);
          if (d6 && typeof d6.then == "function") throw new Error("Selector processor returned a promise to a synchronous call.");
          var u5 = void 0;
          return c5.updateSelector && typeof l3 != "string" && (u5 = i4.toString(), l3.selector = u5), { transform: d6, root: i4, string: u5 };
        }, a4.ast = function(l3, c5) {
          return this._run(l3, c5).then(function(i4) {
            return i4.root;
          });
        }, a4.astSync = function(l3, c5) {
          return this._runSync(l3, c5).root;
        }, a4.transform = function(l3, c5) {
          return this._run(l3, c5).then(function(i4) {
            return i4.transform;
          });
        }, a4.transformSync = function(l3, c5) {
          return this._runSync(l3, c5).transform;
        }, a4.process = function(l3, c5) {
          return this._run(l3, c5).then(function(i4) {
            return i4.string || i4.root.toString();
          });
        }, a4.processSync = function(l3, c5) {
          var i4 = this._runSync(l3, c5);
          return i4.string || i4.root.toString();
        }, s7;
      }();
      e.default = o7, t.exports = e.default;
    }), hc = T7((e) => {
      O7(), e.__esModule = true, e.universal = e.tag = e.string = e.selector = e.root = e.pseudo = e.nesting = e.id = e.comment = e.combinator = e.className = e.attribute = void 0;
      var t = f6(Is()), r3 = f6(Ss()), n3 = f6(js()), o7 = f6(Cs()), s7 = f6(As()), a4 = f6(Bs()), l3 = f6(Es()), c5 = f6(xs()), i4 = f6(ks()), d6 = f6(_s()), u5 = f6(Os()), p4 = f6(Ps());
      function f6(A7) {
        return A7 && A7.__esModule ? A7 : { default: A7 };
      }
      var g6 = function(A7) {
        return new t.default(A7);
      };
      e.attribute = g6;
      var h7 = function(A7) {
        return new r3.default(A7);
      };
      e.className = h7;
      var m6 = function(A7) {
        return new n3.default(A7);
      };
      e.combinator = m6;
      var y9 = function(A7) {
        return new o7.default(A7);
      };
      e.comment = y9;
      var v6 = function(A7) {
        return new s7.default(A7);
      };
      e.id = v6;
      var x5 = function(A7) {
        return new a4.default(A7);
      };
      e.nesting = x5;
      var k5 = function(A7) {
        return new l3.default(A7);
      };
      e.pseudo = k5;
      var w7 = function(A7) {
        return new c5.default(A7);
      };
      e.root = w7;
      var b7 = function(A7) {
        return new i4.default(A7);
      };
      e.selector = b7;
      var C5 = function(A7) {
        return new d6.default(A7);
      };
      e.string = C5;
      var S6 = function(A7) {
        return new u5.default(A7);
      };
      e.tag = S6;
      var E6 = function(A7) {
        return new p4.default(A7);
      };
      e.universal = E6;
    }), mc = T7((e) => {
      O7(), e.__esModule = true, e.isComment = e.isCombinator = e.isClassName = e.isAttribute = void 0, e.isContainer = k5, e.isIdentifier = void 0, e.isNamespace = w7, e.isNesting = void 0, e.isNode = o7, e.isPseudo = void 0, e.isPseudoClass = x5, e.isPseudoElement = v6, e.isUniversal = e.isTag = e.isString = e.isSelector = e.isRoot = void 0;
      var t = ke2(), r3, n3 = (r3 = {}, r3[t.ATTRIBUTE] = true, r3[t.CLASS] = true, r3[t.COMBINATOR] = true, r3[t.COMMENT] = true, r3[t.ID] = true, r3[t.NESTING] = true, r3[t.PSEUDO] = true, r3[t.ROOT] = true, r3[t.SELECTOR] = true, r3[t.STRING] = true, r3[t.TAG] = true, r3[t.UNIVERSAL] = true, r3);
      function o7(b7) {
        return typeof b7 == "object" && n3[b7.type];
      }
      function s7(b7, C5) {
        return o7(C5) && C5.type === b7;
      }
      var a4 = s7.bind(null, t.ATTRIBUTE);
      e.isAttribute = a4;
      var l3 = s7.bind(null, t.CLASS);
      e.isClassName = l3;
      var c5 = s7.bind(null, t.COMBINATOR);
      e.isCombinator = c5;
      var i4 = s7.bind(null, t.COMMENT);
      e.isComment = i4;
      var d6 = s7.bind(null, t.ID);
      e.isIdentifier = d6;
      var u5 = s7.bind(null, t.NESTING);
      e.isNesting = u5;
      var p4 = s7.bind(null, t.PSEUDO);
      e.isPseudo = p4;
      var f6 = s7.bind(null, t.ROOT);
      e.isRoot = f6;
      var g6 = s7.bind(null, t.SELECTOR);
      e.isSelector = g6;
      var h7 = s7.bind(null, t.STRING);
      e.isString = h7;
      var m6 = s7.bind(null, t.TAG);
      e.isTag = m6;
      var y9 = s7.bind(null, t.UNIVERSAL);
      e.isUniversal = y9;
      function v6(b7) {
        return p4(b7) && b7.value && (b7.value.startsWith("::") || b7.value.toLowerCase() === ":before" || b7.value.toLowerCase() === ":after" || b7.value.toLowerCase() === ":first-letter" || b7.value.toLowerCase() === ":first-line");
      }
      function x5(b7) {
        return p4(b7) && !v6(b7);
      }
      function k5(b7) {
        return !!(o7(b7) && b7.walk);
      }
      function w7(b7) {
        return a4(b7) || m6(b7);
      }
    }), gc = T7((e) => {
      O7(), e.__esModule = true;
      var t = ke2();
      Object.keys(t).forEach(function(o7) {
        o7 === "default" || o7 === "__esModule" || o7 in e && e[o7] === t[o7] || (e[o7] = t[o7]);
      });
      var r3 = hc();
      Object.keys(r3).forEach(function(o7) {
        o7 === "default" || o7 === "__esModule" || o7 in e && e[o7] === r3[o7] || (e[o7] = r3[o7]);
      });
      var n3 = mc();
      Object.keys(n3).forEach(function(o7) {
        o7 === "default" || o7 === "__esModule" || o7 in e && e[o7] === n3[o7] || (e[o7] = n3[o7]);
      });
    }), Ke3 = T7((e, t) => {
      O7(), e.__esModule = true, e.default = void 0;
      var r3 = a4(fc()), n3 = s7(gc());
      function o7(i4) {
        if (typeof WeakMap != "function") return null;
        var d6 = /* @__PURE__ */ new WeakMap(), u5 = /* @__PURE__ */ new WeakMap();
        return (o7 = function(p4) {
          return p4 ? u5 : d6;
        })(i4);
      }
      function s7(i4, d6) {
        if (!d6 && i4 && i4.__esModule) return i4;
        if (i4 === null || typeof i4 != "object" && typeof i4 != "function") return { default: i4 };
        var u5 = o7(d6);
        if (u5 && u5.has(i4)) return u5.get(i4);
        var p4 = {}, f6 = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var g6 in i4) if (g6 !== "default" && Object.prototype.hasOwnProperty.call(i4, g6)) {
          var h7 = f6 ? Object.getOwnPropertyDescriptor(i4, g6) : null;
          h7 && (h7.get || h7.set) ? Object.defineProperty(p4, g6, h7) : p4[g6] = i4[g6];
        }
        return p4.default = i4, u5 && u5.set(i4, p4), p4;
      }
      function a4(i4) {
        return i4 && i4.__esModule ? i4 : { default: i4 };
      }
      var l3 = function(i4) {
        return new r3.default(i4);
      };
      Object.assign(l3, n3), delete l3.__esModule;
      var c5 = l3;
      e.default = c5, t.exports = e.default;
    });
    function ir2(e) {
      return ["fontSize", "outline"].includes(e) ? (t) => (typeof t == "function" && (t = t({})), Array.isArray(t) && (t = t[0]), t) : e === "fontFamily" ? (t) => {
        typeof t == "function" && (t = t({}));
        let r3 = Array.isArray(t) && Le2(t[1]) ? t[0] : t;
        return Array.isArray(r3) ? r3.join(", ") : r3;
      } : ["boxShadow", "transitionProperty", "transitionDuration", "transitionDelay", "transitionTimingFunction", "backgroundImage", "backgroundSize", "backgroundColor", "cursor", "animation"].includes(e) ? (t) => (typeof t == "function" && (t = t({})), Array.isArray(t) && (t = t.join(", ")), t) : ["gridTemplateColumns", "gridTemplateRows", "objectPosition"].includes(e) ? (t) => (typeof t == "function" && (t = t({})), typeof t == "string" && (t = fe3.list.comma(t).join(" ")), t) : (t, r3 = {}) => (typeof t == "function" && (t = t(r3)), t);
    }
    var lr = $3(() => {
      O7(), ut3(), Bt();
    }), vc = T7((e, t) => {
      O7();
      var { Rule: r3, AtRule: n3 } = Re3(), o7 = Ke3();
      function s7(x5, k5) {
        let w7;
        try {
          o7((b7) => {
            w7 = b7;
          }).processSync(x5);
        } catch (b7) {
          throw x5.includes(":") ? k5 ? k5.error("Missed semicolon") : b7 : k5 ? k5.error(b7.message) : b7;
        }
        return w7.at(0);
      }
      function a4(x5, k5) {
        let w7 = false;
        return x5.each((b7) => {
          if (b7.type === "nesting") {
            let C5 = k5.clone({});
            b7.value !== "&" ? b7.replaceWith(s7(b7.value.replace("&", C5.toString()))) : b7.replaceWith(C5), w7 = true;
          } else "nodes" in b7 && b7.nodes && a4(b7, k5) && (w7 = true);
        }), w7;
      }
      function l3(x5, k5) {
        let w7 = [];
        return x5.selectors.forEach((b7) => {
          let C5 = s7(b7, x5);
          k5.selectors.forEach((S6) => {
            if (!S6) return;
            let E6 = s7(S6, k5);
            a4(E6, C5) || (E6.prepend(o7.combinator({ value: " " })), E6.prepend(C5.clone({}))), w7.push(E6.toString());
          });
        }), w7;
      }
      function c5(x5, k5) {
        let w7 = x5.prev();
        for (k5.after(x5); w7 && w7.type === "comment"; ) {
          let b7 = w7.prev();
          k5.after(w7), w7 = b7;
        }
        return x5;
      }
      function i4(x5) {
        return function k5(w7, b7, C5, S6 = C5) {
          let E6 = [];
          if (b7.each((A7) => {
            A7.type === "rule" && C5 ? S6 && (A7.selectors = l3(w7, A7)) : A7.type === "atrule" && A7.nodes ? x5[A7.name] ? k5(w7, A7, S6) : b7[h7] !== false && E6.push(A7) : E6.push(A7);
          }), C5 && E6.length) {
            let A7 = w7.clone({ nodes: [] });
            for (let _6 of E6) A7.append(_6);
            b7.prepend(A7);
          }
        };
      }
      function d6(x5, k5, w7) {
        let b7 = new r3({ selector: x5, nodes: [] });
        return b7.append(k5), w7.after(b7), b7;
      }
      function u5(x5, k5) {
        let w7 = {};
        for (let b7 of x5) w7[b7] = true;
        if (k5) for (let b7 of k5) w7[b7.replace(/^@/, "")] = true;
        return w7;
      }
      function p4(x5) {
        x5 = x5.trim();
        let k5 = x5.match(/^\((.*)\)$/);
        if (!k5) return { type: "basic", selector: x5 };
        let w7 = k5[1].match(/^(with(?:out)?):(.+)$/);
        if (w7) {
          let b7 = w7[1] === "with", C5 = Object.fromEntries(w7[2].trim().split(/\s+/).map((E6) => [E6, true]));
          if (b7 && C5.all) return { type: "noop" };
          let S6 = (E6) => !!C5[E6];
          return C5.all ? S6 = () => true : b7 && (S6 = (E6) => E6 === "all" ? false : !C5[E6]), { type: "withrules", escapes: S6 };
        }
        return { type: "unknown" };
      }
      function f6(x5) {
        let k5 = [], w7 = x5.parent;
        for (; w7 && w7 instanceof n3; ) k5.push(w7), w7 = w7.parent;
        return k5;
      }
      function g6(x5) {
        let k5 = x5[m6];
        if (!k5) x5.after(x5.nodes);
        else {
          let w7 = x5.nodes, b7, C5 = -1, S6, E6, A7, _6 = f6(x5);
          if (_6.forEach((U4, D7) => {
            if (k5(U4.name)) b7 = U4, C5 = D7, E6 = A7;
            else {
              let j5 = A7;
              A7 = U4.clone({ nodes: [] }), j5 && A7.append(j5), S6 = S6 || A7;
            }
          }), b7 ? E6 ? (S6.append(w7), b7.after(E6)) : b7.after(w7) : x5.after(w7), x5.next() && b7) {
            let U4;
            _6.slice(0, C5 + 1).forEach((D7, j5, L4) => {
              let F4 = U4;
              U4 = D7.clone({ nodes: [] }), F4 && U4.append(F4);
              let H4 = [], Q3 = (L4[j5 - 1] || x5).next();
              for (; Q3; ) H4.push(Q3), Q3 = Q3.next();
              U4.append(H4);
            }), U4 && (E6 || w7[w7.length - 1]).after(U4);
          }
        }
        x5.remove();
      }
      var h7 = Symbol("rootRuleMergeSel"), m6 = Symbol("rootRuleEscapes");
      function y9(x5) {
        let { params: k5 } = x5, { type: w7, selector: b7, escapes: C5 } = p4(k5);
        if (w7 === "unknown") throw x5.error(`Unknown @${x5.name} parameter ${JSON.stringify(k5)}`);
        if (w7 === "basic" && b7) {
          let S6 = new r3({ selector: b7, nodes: x5.nodes });
          x5.removeAll(), x5.append(S6);
        }
        x5[m6] = C5, x5[h7] = C5 ? !C5("all") : w7 === "noop";
      }
      var v6 = Symbol("hasRootRule");
      t.exports = (x5 = {}) => {
        let k5 = u5(["media", "supports", "layer", "container"], x5.bubble), w7 = i4(k5), b7 = u5(["document", "font-face", "keyframes", "-webkit-keyframes", "-moz-keyframes"], x5.unwrap), C5 = (x5.rootRuleName || "at-root").replace(/^@/, ""), S6 = x5.preserveEmpty;
        return { postcssPlugin: "postcss-nested", Once(E6) {
          E6.walkAtRules(C5, (A7) => {
            y9(A7), E6[v6] = true;
          });
        }, Rule(E6) {
          let A7 = false, _6 = E6, U4 = false, D7 = [];
          E6.each((j5) => {
            j5.type === "rule" ? (D7.length && (_6 = d6(E6.selector, D7, _6), D7 = []), U4 = true, A7 = true, j5.selectors = l3(E6, j5), _6 = c5(j5, _6)) : j5.type === "atrule" ? (D7.length && (_6 = d6(E6.selector, D7, _6), D7 = []), j5.name === C5 ? (A7 = true, w7(E6, j5, true, j5[h7]), _6 = c5(j5, _6)) : k5[j5.name] ? (U4 = true, A7 = true, w7(E6, j5, true), _6 = c5(j5, _6)) : b7[j5.name] ? (U4 = true, A7 = true, w7(E6, j5, false), _6 = c5(j5, _6)) : U4 && D7.push(j5)) : j5.type === "decl" && U4 && D7.push(j5);
          }), D7.length && (_6 = d6(E6.selector, D7, _6)), A7 && S6 !== true && (E6.raws.semicolon = true, E6.nodes.length === 0 && E6.remove());
        }, RootExit(E6) {
          E6[v6] && (E6.walkAtRules(C5, g6), E6[v6] = false);
        } };
      }, t.exports.postcss = true;
    }), yc = T7((e, t) => {
      O7();
      var r3 = /-(\w|$)/g, n3 = (s7, a4) => a4.toUpperCase(), o7 = (s7) => (s7 = s7.toLowerCase(), s7 === "float" ? "cssFloat" : s7.startsWith("-ms-") ? s7.substr(1).replace(r3, n3) : s7.replace(r3, n3));
      t.exports = o7;
    }), $s = T7((e, t) => {
      O7();
      var r3 = yc(), n3 = { boxFlex: true, boxFlexGroup: true, columnCount: true, flex: true, flexGrow: true, flexPositive: true, flexShrink: true, flexNegative: true, fontWeight: true, lineClamp: true, lineHeight: true, opacity: true, order: true, orphans: true, tabSize: true, widows: true, zIndex: true, zoom: true, fillOpacity: true, strokeDashoffset: true, strokeOpacity: true, strokeWidth: true };
      function o7(a4) {
        return typeof a4.nodes > "u" ? true : s7(a4);
      }
      function s7(a4) {
        let l3, c5 = {};
        return a4.each((i4) => {
          if (i4.type === "atrule") l3 = "@" + i4.name, i4.params && (l3 += " " + i4.params), typeof c5[l3] > "u" ? c5[l3] = o7(i4) : Array.isArray(c5[l3]) ? c5[l3].push(o7(i4)) : c5[l3] = [c5[l3], o7(i4)];
          else if (i4.type === "rule") {
            let d6 = s7(i4);
            if (c5[i4.selector]) for (let u5 in d6) c5[i4.selector][u5] = d6[u5];
            else c5[i4.selector] = d6;
          } else if (i4.type === "decl") {
            i4.prop[0] === "-" && i4.prop[1] === "-" || i4.parent && i4.parent.selector === ":export" ? l3 = i4.prop : l3 = r3(i4.prop);
            let d6 = i4.value;
            !isNaN(i4.value) && n3[l3] && (d6 = parseFloat(i4.value)), i4.important && (d6 += " !important"), typeof c5[l3] > "u" ? c5[l3] = d6 : Array.isArray(c5[l3]) ? c5[l3].push(d6) : c5[l3] = [c5[l3], d6];
          }
        }), c5;
      }
      t.exports = s7;
    }), pn = T7((e, t) => {
      O7();
      var r3 = Re3(), n3 = /\s*!important\s*$/i, o7 = { "box-flex": true, "box-flex-group": true, "column-count": true, flex: true, "flex-grow": true, "flex-positive": true, "flex-shrink": true, "flex-negative": true, "font-weight": true, "line-clamp": true, "line-height": true, opacity: true, order: true, orphans: true, "tab-size": true, widows: true, "z-index": true, zoom: true, "fill-opacity": true, "stroke-dashoffset": true, "stroke-opacity": true, "stroke-width": true };
      function s7(i4) {
        return i4.replace(/([A-Z])/g, "-$1").replace(/^ms-/, "-ms-").toLowerCase();
      }
      function a4(i4, d6, u5) {
        u5 === false || u5 === null || (d6.startsWith("--") || (d6 = s7(d6)), typeof u5 == "number" && (u5 === 0 || o7[d6] ? u5 = u5.toString() : u5 += "px"), d6 === "css-float" && (d6 = "float"), n3.test(u5) ? (u5 = u5.replace(n3, ""), i4.push(r3.decl({ prop: d6, value: u5, important: true }))) : i4.push(r3.decl({ prop: d6, value: u5 })));
      }
      function l3(i4, d6, u5) {
        let p4 = r3.atRule({ name: d6[1], params: d6[3] || "" });
        typeof u5 == "object" && (p4.nodes = [], c5(u5, p4)), i4.push(p4);
      }
      function c5(i4, d6) {
        let u5, p4, f6;
        for (u5 in i4) if (p4 = i4[u5], !(p4 === null || typeof p4 > "u")) if (u5[0] === "@") {
          let g6 = u5.match(/@(\S+)(\s+([\W\w]*)\s*)?/);
          if (Array.isArray(p4)) for (let h7 of p4) l3(d6, g6, h7);
          else l3(d6, g6, p4);
        } else if (Array.isArray(p4)) for (let g6 of p4) a4(d6, u5, g6);
        else typeof p4 == "object" ? (f6 = r3.rule({ selector: u5 }), c5(p4, f6), d6.push(f6)) : a4(d6, u5, p4);
      }
      t.exports = function(i4) {
        let d6 = r3.root();
        return c5(i4, d6), d6;
      };
    }), Rs = T7((e, t) => {
      O7();
      var r3 = $s();
      t.exports = function(n3) {
        return console && console.warn && n3.warnings().forEach((o7) => {
          let s7 = o7.plugin || "PostCSS";
          console.warn(s7 + ": " + o7.text);
        }), r3(n3.root);
      };
    }), bc = T7((e, t) => {
      O7();
      var r3 = Re3(), n3 = Rs(), o7 = pn();
      t.exports = function(s7) {
        let a4 = r3(s7);
        return async (l3) => {
          let c5 = await a4.process(l3, { parser: o7, from: void 0 });
          return n3(c5);
        };
      };
    }), wc = T7((e, t) => {
      O7();
      var r3 = Re3(), n3 = Rs(), o7 = pn();
      t.exports = function(s7) {
        let a4 = r3(s7);
        return (l3) => {
          let c5 = a4.process(l3, { parser: o7, from: void 0 });
          return n3(c5);
        };
      };
    }), xc = T7((e, t) => {
      O7();
      var r3 = $s(), n3 = pn(), o7 = bc(), s7 = wc();
      t.exports = { objectify: r3, parse: n3, async: o7, sync: s7 };
    }), Ct2, Ms, kc, Sc, Cc, Ac, Oc = $3(() => {
      O7(), Ct2 = he4(xc()), Ms = Ct2.default, kc = Ct2.default.objectify, Sc = Ct2.default.parse, Cc = Ct2.default.async, Ac = Ct2.default.sync;
    });
    function fn(e) {
      return Array.isArray(e) ? e.flatMap((t) => fe3([(0, Us.default)({ bubble: ["screen"] })]).process(t, { parser: Ms }).root.nodes) : fn([e]);
    }
    var Us, zs = $3(() => {
      O7(), ut3(), Us = he4(vc()), Oc();
    });
    function hn(e, t, r3 = false) {
      if (e === "") return t;
      let n3 = typeof t == "string" ? (0, Fs.default)().astSync(t) : t;
      return n3.walkClasses((o7) => {
        let s7 = o7.value, a4 = r3 && s7.startsWith("-");
        o7.value = a4 ? `-${e}${s7.slice(1)}` : `${e}${s7}`;
      }), typeof t == "string" ? n3.toString() : n3;
    }
    var Fs, mn = $3(() => {
      O7(), Fs = he4(Ke3());
    });
    function at2(e) {
      let t = Ls.default.className();
      return t.value = e, Fr2(t?.raws?.value ?? t.value);
    }
    var Ls, Ut2 = $3(() => {
      O7(), Ls = he4(Ke3()), Lr();
    });
    function Ns(e) {
      return Fr2(`.${at2(e)}`);
    }
    function Vs(e, t) {
      return Ns(cr(e, t));
    }
    function cr(e, t) {
      return t === "DEFAULT" ? e : t === "-" || t === "-DEFAULT" ? `-${e}` : t.startsWith("-") ? `-${e}${t}` : t.startsWith("/") ? `${e}${t}` : `${e}-${t}`;
    }
    var Ws = $3(() => {
      O7(), Ut2(), Lr();
    });
    function z5(e, t = [[e, [e]]], { filterDefault: r3 = false, ...n3 } = {}) {
      let o7 = ir2(e);
      return function({ matchUtilities: s7, theme: a4 }) {
        for (let l3 of t) {
          let c5 = Array.isArray(l3[0]) ? l3 : [l3];
          s7(c5.reduce((i4, [d6, u5]) => Object.assign(i4, { [d6]: (p4) => u5.reduce((f6, g6) => Array.isArray(g6) ? Object.assign(f6, { [g6[0]]: g6[1] }) : Object.assign(f6, { [g6]: o7(p4) }), {}) }), {}), { ...n3, values: r3 ? Object.fromEntries(Object.entries(a4(e) ?? {}).filter(([i4]) => i4 !== "DEFAULT")) : a4(e) });
        }
      };
    }
    var _c = $3(() => {
      O7(), lr();
    });
    function ur(e) {
      return e = Array.isArray(e) ? e : [e], e.map((t) => {
        let r3 = t.values.map((n3) => n3.raw !== void 0 ? n3.raw : [n3.min && `(min-width: ${n3.min})`, n3.max && `(max-width: ${n3.max})`].filter(Boolean).join(" and "));
        return t.not ? `not all and ${r3}` : r3;
      }).join(", ");
    }
    var gn = $3(() => {
      O7();
    });
    function Ec(e) {
      return e.split(Zs).map((t) => {
        let r3 = t.trim(), n3 = { value: r3 }, o7 = r3.split(Xs), s7 = /* @__PURE__ */ new Set();
        for (let a4 of o7) !s7.has("DIRECTIONS") && qs.has(a4) ? (n3.direction = a4, s7.add("DIRECTIONS")) : !s7.has("PLAY_STATES") && Gs.has(a4) ? (n3.playState = a4, s7.add("PLAY_STATES")) : !s7.has("FILL_MODES") && Ys.has(a4) ? (n3.fillMode = a4, s7.add("FILL_MODES")) : !s7.has("ITERATION_COUNTS") && (Hs.has(a4) || Ks.test(a4)) ? (n3.iterationCount = a4, s7.add("ITERATION_COUNTS")) : !s7.has("TIMING_FUNCTION") && Qs.has(a4) || !s7.has("TIMING_FUNCTION") && Js.some((l3) => a4.startsWith(`${l3}(`)) ? (n3.timingFunction = a4, s7.add("TIMING_FUNCTION")) : !s7.has("DURATION") && vn.test(a4) ? (n3.duration = a4, s7.add("DURATION")) : !s7.has("DELAY") && vn.test(a4) ? (n3.delay = a4, s7.add("DELAY")) : s7.has("NAME") ? (n3.unknown || (n3.unknown = []), n3.unknown.push(a4)) : (n3.name = a4, s7.add("NAME"));
        return n3;
      });
    }
    var qs, Gs, Ys, Hs, Qs, Js, Zs, Xs, vn, Ks, Tc = $3(() => {
      O7(), qs = /* @__PURE__ */ new Set(["normal", "reverse", "alternate", "alternate-reverse"]), Gs = /* @__PURE__ */ new Set(["running", "paused"]), Ys = /* @__PURE__ */ new Set(["none", "forwards", "backwards", "both"]), Hs = /* @__PURE__ */ new Set(["infinite"]), Qs = /* @__PURE__ */ new Set(["linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"]), Js = ["cubic-bezier", "steps"], Zs = /\,(?![^(]*\))/g, Xs = /\ +(?![^(]*\))/g, vn = /^(-?[\d.]+m?s)$/, Ks = /^(\d+)$/;
    }), yn, ye3, Ic = $3(() => {
      O7(), yn = (e) => Object.assign({}, ...Object.entries(e ?? {}).flatMap(([t, r3]) => typeof r3 == "object" ? Object.entries(yn(r3)).map(([n3, o7]) => ({ [t + (n3 === "DEFAULT" ? "" : `-${n3}`)]: o7 })) : [{ [`${t}`]: r3 }])), ye3 = yn;
    }), ea, Pc = $3(() => {
      ea = "3.4.5";
    });
    function zt(e, t = true) {
      return Array.isArray(e) ? e.map((r3) => {
        if (t && Array.isArray(r3)) throw new Error("The tuple syntax is not supported for `screens`.");
        if (typeof r3 == "string") return { name: r3.toString(), not: false, values: [{ min: r3, max: void 0 }] };
        let [n3, o7] = r3;
        return n3 = n3.toString(), typeof o7 == "string" ? { name: n3, not: false, values: [{ min: o7, max: void 0 }] } : Array.isArray(o7) ? { name: n3, not: false, values: o7.map((s7) => ta(s7)) } : { name: n3, not: false, values: [ta(o7)] };
      }) : zt(Object.entries(e ?? {}), false);
    }
    function bn(e) {
      return e.values.length !== 1 ? { result: false, reason: "multiple-values" } : e.values[0].raw !== void 0 ? { result: false, reason: "raw-values" } : e.values[0].min !== void 0 && e.values[0].max !== void 0 ? { result: false, reason: "min-and-max" } : { result: true, reason: null };
    }
    function jc(e, t, r3) {
      let n3 = wn(t, e), o7 = wn(r3, e), s7 = bn(n3), a4 = bn(o7);
      if (s7.reason === "multiple-values" || a4.reason === "multiple-values") throw new Error("Attempted to sort a screen with multiple values. This should never happen. Please open a bug report.");
      if (s7.reason === "raw-values" || a4.reason === "raw-values") throw new Error("Attempted to sort a screen with raw values. This should never happen. Please open a bug report.");
      if (s7.reason === "min-and-max" || a4.reason === "min-and-max") throw new Error("Attempted to sort a screen with both min and max values. This should never happen. Please open a bug report.");
      let { min: l3, max: c5 } = n3.values[0], { min: i4, max: d6 } = o7.values[0];
      t.not && ([l3, c5] = [c5, l3]), r3.not && ([i4, d6] = [d6, i4]), l3 = l3 === void 0 ? l3 : parseFloat(l3), c5 = c5 === void 0 ? c5 : parseFloat(c5), i4 = i4 === void 0 ? i4 : parseFloat(i4), d6 = d6 === void 0 ? d6 : parseFloat(d6);
      let [u5, p4] = e === "min" ? [l3, i4] : [d6, c5];
      return u5 - p4;
    }
    function wn(e, t) {
      return typeof e == "object" ? e : { name: "arbitrary-screen", values: [{ [t]: e }] };
    }
    function ta({ "min-width": e, min: t = e, max: r3, raw: n3 } = {}) {
      return { min: t, max: r3, raw: n3 };
    }
    var xn = $3(() => {
      O7();
    });
    function kn(e, t) {
      e.walkDecls((r3) => {
        if (t.includes(r3.prop)) {
          r3.remove();
          return;
        }
        for (let n3 of t) r3.value.includes(`/ var(${n3})`) && (r3.value = r3.value.replace(`/ var(${n3})`, ""));
      });
    }
    var Bc = $3(() => {
      O7();
    }), ue3, Me4, Ne2, me3, ra, Dc = $3(() => {
      O7(), rt2(), St(), ut3(), _c(), gn(), Ut2(), Tc(), Ic(), Ht(), es(), Bt(), lr(), Pc(), Ge2(), xn(), Ro(), Bc(), nt3(), Qt(), kr(), ue3 = { childVariant: ({ addVariant: e }) => {
        e("*", "& > *");
      }, pseudoElementVariants: ({ addVariant: e }) => {
        e("first-letter", "&::first-letter"), e("first-line", "&::first-line"), e("marker", [({ container: t }) => (kn(t, ["--tw-text-opacity"]), "& *::marker"), ({ container: t }) => (kn(t, ["--tw-text-opacity"]), "&::marker")]), e("selection", ["& *::selection", "&::selection"]), e("file", "&::file-selector-button"), e("placeholder", "&::placeholder"), e("backdrop", "&::backdrop"), e("before", ({ container: t }) => (t.walkRules((r3) => {
          let n3 = false;
          r3.walkDecls("content", () => {
            n3 = true;
          }), n3 || r3.prepend(fe3.decl({ prop: "content", value: "var(--tw-content)" }));
        }), "&::before")), e("after", ({ container: t }) => (t.walkRules((r3) => {
          let n3 = false;
          r3.walkDecls("content", () => {
            n3 = true;
          }), n3 || r3.prepend(fe3.decl({ prop: "content", value: "var(--tw-content)" }));
        }), "&::after"));
      }, pseudoClassVariants: ({ addVariant: e, matchVariant: t, config: r3, prefix: n3 }) => {
        let o7 = [["first", "&:first-child"], ["last", "&:last-child"], ["only", "&:only-child"], ["odd", "&:nth-child(odd)"], ["even", "&:nth-child(even)"], "first-of-type", "last-of-type", "only-of-type", ["visited", ({ container: a4 }) => (kn(a4, ["--tw-text-opacity", "--tw-border-opacity", "--tw-bg-opacity"]), "&:visited")], "target", ["open", "&[open]"], "default", "checked", "indeterminate", "placeholder-shown", "autofill", "optional", "required", "valid", "invalid", "in-range", "out-of-range", "read-only", "empty", "focus-within", ["hover", De3(r3(), "hoverOnlyWhenSupported") ? "@media (hover: hover) and (pointer: fine) { &:hover }" : "&:hover"], "focus", "focus-visible", "active", "enabled", "disabled"].map((a4) => Array.isArray(a4) ? a4 : [a4, `&:${a4}`]);
        for (let [a4, l3] of o7) e(a4, (c5) => typeof l3 == "function" ? l3(c5) : l3);
        let s7 = { group: (a4, { modifier: l3 }) => l3 ? [`:merge(${n3(".group")}\\/${at2(l3)})`, " &"] : [`:merge(${n3(".group")})`, " &"], peer: (a4, { modifier: l3 }) => l3 ? [`:merge(${n3(".peer")}\\/${at2(l3)})`, " ~ &"] : [`:merge(${n3(".peer")})`, " ~ &"] };
        for (let [a4, l3] of Object.entries(s7)) t(a4, (c5 = "", i4) => {
          let d6 = oe3(typeof c5 == "function" ? c5(i4) : c5);
          d6.includes("&") || (d6 = "&" + d6);
          let [u5, p4] = l3("", i4), f6 = null, g6 = null, h7 = 0;
          for (let m6 = 0; m6 < d6.length; ++m6) {
            let y9 = d6[m6];
            y9 === "&" ? f6 = m6 : y9 === "'" || y9 === '"' ? h7 += 1 : f6 !== null && y9 === " " && !h7 && (g6 = m6);
          }
          return f6 !== null && g6 === null && (g6 = d6.length), d6.slice(0, f6) + u5 + d6.slice(f6 + 1, g6) + p4 + d6.slice(g6);
        }, { values: Object.fromEntries(o7), [ft2]: { respectPrefix: false } });
      }, directionVariants: ({ addVariant: e }) => {
        e("ltr", '&:where([dir="ltr"], [dir="ltr"] *)'), e("rtl", '&:where([dir="rtl"], [dir="rtl"] *)');
      }, reducedMotionVariants: ({ addVariant: e }) => {
        e("motion-safe", "@media (prefers-reduced-motion: no-preference)"), e("motion-reduce", "@media (prefers-reduced-motion: reduce)");
      }, darkVariants: ({ config: e, addVariant: t }) => {
        let [r3, n3 = ".dark"] = [].concat(e("darkMode", "media"));
        if (r3 === false && (r3 = "media", de3.warn("darkmode-false", ["The `darkMode` option in your Tailwind CSS configuration is set to `false`, which now behaves the same as `media`.", "Change `darkMode` to `media` or remove it entirely.", "https://tailwindcss.com/docs/upgrade-guide#remove-dark-mode-configuration"])), r3 === "variant") {
          let o7;
          if (Array.isArray(n3) || typeof n3 == "function" ? o7 = n3 : typeof n3 == "string" && (o7 = [n3]), Array.isArray(o7)) for (let s7 of o7) s7 === ".dark" ? (r3 = false, de3.warn("darkmode-variant-without-selector", ["When using `variant` for `darkMode`, you must provide a selector.", 'Example: `darkMode: ["variant", ".your-selector &"]`'])) : s7.includes("&") || (r3 = false, de3.warn("darkmode-variant-without-ampersand", ["When using `variant` for `darkMode`, your selector must contain `&`.", 'Example `darkMode: ["variant", ".your-selector &"]`']));
          n3 = o7;
        }
        r3 === "selector" ? t("dark", `&:where(${n3}, ${n3} *)`) : r3 === "media" ? t("dark", "@media (prefers-color-scheme: dark)") : r3 === "variant" ? t("dark", n3) : r3 === "class" && t("dark", `&:is(${n3} *)`);
      }, printVariant: ({ addVariant: e }) => {
        e("print", "@media print");
      }, screenVariants: ({ theme: e, addVariant: t, matchVariant: r3 }) => {
        let n3 = e("screens") ?? {}, o7 = Object.values(n3).every((y9) => typeof y9 == "string"), s7 = zt(e("screens")), a4 = /* @__PURE__ */ new Set([]);
        function l3(y9) {
          return y9.match(/(\D+)$/)?.[1] ?? "(none)";
        }
        function c5(y9) {
          y9 !== void 0 && a4.add(l3(y9));
        }
        function i4(y9) {
          return c5(y9), a4.size === 1;
        }
        for (let y9 of s7) for (let v6 of y9.values) c5(v6.min), c5(v6.max);
        let d6 = a4.size <= 1;
        function u5(y9) {
          return Object.fromEntries(s7.filter((v6) => bn(v6).result).map((v6) => {
            let { min: x5, max: k5 } = v6.values[0];
            if (y9 === "min" && x5 !== void 0) return v6;
            if (y9 === "min" && k5 !== void 0) return { ...v6, not: !v6.not };
            if (y9 === "max" && k5 !== void 0) return v6;
            if (y9 === "max" && x5 !== void 0) return { ...v6, not: !v6.not };
          }).map((v6) => [v6.name, v6]));
        }
        function p4(y9) {
          return (v6, x5) => jc(y9, v6.value, x5.value);
        }
        let f6 = p4("max"), g6 = p4("min");
        function h7(y9) {
          return (v6) => {
            if (o7) if (d6) {
              if (typeof v6 == "string" && !i4(v6)) return de3.warn("minmax-have-mixed-units", ["The `min-*` and `max-*` variants are not supported with a `screens` configuration containing mixed units."]), [];
            } else return de3.warn("mixed-screen-units", ["The `min-*` and `max-*` variants are not supported with a `screens` configuration containing mixed units."]), [];
            else return de3.warn("complex-screen-config", ["The `min-*` and `max-*` variants are not supported with a `screens` configuration containing objects."]), [];
            return [`@media ${ur(wn(v6, y9))}`];
          };
        }
        r3("max", h7("max"), { sort: f6, values: o7 ? u5("max") : {} });
        let m6 = "min-screens";
        for (let y9 of s7) t(y9.name, `@media ${ur(y9)}`, { id: m6, sort: o7 && d6 ? g6 : void 0, value: y9 });
        r3("min", h7("min"), { id: m6, sort: g6 });
      }, supportsVariants: ({ matchVariant: e, theme: t }) => {
        e("supports", (r3 = "") => {
          let n3 = oe3(r3), o7 = /^\w*\s*\(/.test(n3);
          return n3 = o7 ? n3.replace(/\b(and|or|not)\b/g, " $1 ") : n3, o7 ? `@supports ${n3}` : (n3.includes(":") || (n3 = `${n3}: var(--tw)`), n3.startsWith("(") && n3.endsWith(")") || (n3 = `(${n3})`), `@supports ${n3}`);
        }, { values: t("supports") ?? {} });
      }, hasVariants: ({ matchVariant: e, prefix: t }) => {
        e("has", (r3) => `&:has(${oe3(r3)})`, { values: {}, [ft2]: { respectPrefix: false } }), e("group-has", (r3, { modifier: n3 }) => n3 ? `:merge(${t(".group")}\\/${n3}):has(${oe3(r3)}) &` : `:merge(${t(".group")}):has(${oe3(r3)}) &`, { values: {}, [ft2]: { respectPrefix: false } }), e("peer-has", (r3, { modifier: n3 }) => n3 ? `:merge(${t(".peer")}\\/${n3}):has(${oe3(r3)}) ~ &` : `:merge(${t(".peer")}):has(${oe3(r3)}) ~ &`, { values: {}, [ft2]: { respectPrefix: false } });
      }, ariaVariants: ({ matchVariant: e, theme: t }) => {
        e("aria", (r3) => `&[aria-${oe3(r3)}]`, { values: t("aria") ?? {} }), e("group-aria", (r3, { modifier: n3 }) => n3 ? `:merge(.group\\/${n3})[aria-${oe3(r3)}] &` : `:merge(.group)[aria-${oe3(r3)}] &`, { values: t("aria") ?? {} }), e("peer-aria", (r3, { modifier: n3 }) => n3 ? `:merge(.peer\\/${n3})[aria-${oe3(r3)}] ~ &` : `:merge(.peer)[aria-${oe3(r3)}] ~ &`, { values: t("aria") ?? {} });
      }, dataVariants: ({ matchVariant: e, theme: t }) => {
        e("data", (r3) => `&[data-${oe3(r3)}]`, { values: t("data") ?? {} }), e("group-data", (r3, { modifier: n3 }) => n3 ? `:merge(.group\\/${n3})[data-${oe3(r3)}] &` : `:merge(.group)[data-${oe3(r3)}] &`, { values: t("data") ?? {} }), e("peer-data", (r3, { modifier: n3 }) => n3 ? `:merge(.peer\\/${n3})[data-${oe3(r3)}] ~ &` : `:merge(.peer)[data-${oe3(r3)}] ~ &`, { values: t("data") ?? {} });
      }, orientationVariants: ({ addVariant: e }) => {
        e("portrait", "@media (orientation: portrait)"), e("landscape", "@media (orientation: landscape)");
      }, prefersContrastVariants: ({ addVariant: e }) => {
        e("contrast-more", "@media (prefers-contrast: more)"), e("contrast-less", "@media (prefers-contrast: less)");
      }, forcedColorsVariants: ({ addVariant: e }) => {
        e("forced-colors", "@media (forced-colors: active)");
      } }, Me4 = ["translate(var(--tw-translate-x), var(--tw-translate-y))", "rotate(var(--tw-rotate))", "skewX(var(--tw-skew-x))", "skewY(var(--tw-skew-y))", "scaleX(var(--tw-scale-x))", "scaleY(var(--tw-scale-y))"].join(" "), Ne2 = ["var(--tw-blur)", "var(--tw-brightness)", "var(--tw-contrast)", "var(--tw-grayscale)", "var(--tw-hue-rotate)", "var(--tw-invert)", "var(--tw-saturate)", "var(--tw-sepia)", "var(--tw-drop-shadow)"].join(" "), me3 = ["var(--tw-backdrop-blur)", "var(--tw-backdrop-brightness)", "var(--tw-backdrop-contrast)", "var(--tw-backdrop-grayscale)", "var(--tw-backdrop-hue-rotate)", "var(--tw-backdrop-invert)", "var(--tw-backdrop-opacity)", "var(--tw-backdrop-saturate)", "var(--tw-backdrop-sepia)"].join(" "), ra = { preflight: ({ addBase: e }) => {
        let t = fe3.parse(`*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:theme('borderColor.DEFAULT', currentColor)}::after,::before{--tw-content:''}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:theme('fontFamily.sans', ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");font-feature-settings:theme('fontFamily.sans[1].fontFeatureSettings', normal);font-variation-settings:theme('fontFamily.sans[1].fontVariationSettings', normal);-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:theme('fontFamily.mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);font-feature-settings:theme('fontFamily.mono[1].fontFeatureSettings', normal);font-variation-settings:theme('fontFamily.mono[1].fontVariationSettings', normal);font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:theme('colors.gray.4', #9ca3af)}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}`);
        e([fe3.comment({ text: `! tailwindcss v${ea} | MIT License | https://tailwindcss.com` }), ...t.nodes]);
      }, container: /* @__PURE__ */ (() => {
        function e(r3 = []) {
          return r3.flatMap((n3) => n3.values.map((o7) => o7.min)).filter((n3) => n3 !== void 0);
        }
        function t(r3, n3, o7) {
          if (typeof o7 > "u") return [];
          if (!(typeof o7 == "object" && o7 !== null)) return [{ screen: "DEFAULT", minWidth: 0, padding: o7 }];
          let s7 = [];
          o7.DEFAULT && s7.push({ screen: "DEFAULT", minWidth: 0, padding: o7.DEFAULT });
          for (let a4 of r3) for (let l3 of n3) for (let { min: c5 } of l3.values) c5 === a4 && s7.push({ minWidth: a4, padding: o7[l3.name] });
          return s7;
        }
        return function({ addComponents: r3, theme: n3 }) {
          let o7 = zt(n3("container.screens", n3("screens"))), s7 = e(o7), a4 = t(s7, o7, n3("container.padding")), l3 = (i4) => {
            let d6 = a4.find((u5) => u5.minWidth === i4);
            return d6 ? { paddingRight: d6.padding, paddingLeft: d6.padding } : {};
          }, c5 = Array.from(new Set(s7.slice().sort((i4, d6) => parseInt(i4) - parseInt(d6)))).map((i4) => ({ [`@media (min-width: ${i4})`]: { ".container": { "max-width": i4, ...l3(i4) } } }));
          r3([{ ".container": Object.assign({ width: "100%" }, n3("container.center", false) ? { marginRight: "auto", marginLeft: "auto" } : {}, l3(0)) }, ...c5]);
        };
      })(), accessibility: ({ addUtilities: e }) => {
        e({ ".sr-only": { position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0" }, ".not-sr-only": { position: "static", width: "auto", height: "auto", padding: "0", margin: "0", overflow: "visible", clip: "auto", whiteSpace: "normal" } });
      }, pointerEvents: ({ addUtilities: e }) => {
        e({ ".pointer-events-none": { "pointer-events": "none" }, ".pointer-events-auto": { "pointer-events": "auto" } });
      }, visibility: ({ addUtilities: e }) => {
        e({ ".visible": { visibility: "visible" }, ".invisible": { visibility: "hidden" }, ".collapse": { visibility: "collapse" } });
      }, position: ({ addUtilities: e }) => {
        e({ ".static": { position: "static" }, ".fixed": { position: "fixed" }, ".absolute": { position: "absolute" }, ".relative": { position: "relative" }, ".sticky": { position: "sticky" } });
      }, inset: z5("inset", [["inset", ["inset"]], [["inset-x", ["left", "right"]], ["inset-y", ["top", "bottom"]]], [["start", ["inset-inline-start"]], ["end", ["inset-inline-end"]], ["top", ["top"]], ["right", ["right"]], ["bottom", ["bottom"]], ["left", ["left"]]]], { supportsNegativeValues: true }), isolation: ({ addUtilities: e }) => {
        e({ ".isolate": { isolation: "isolate" }, ".isolation-auto": { isolation: "auto" } });
      }, zIndex: z5("zIndex", [["z", ["zIndex"]]], { supportsNegativeValues: true }), order: z5("order", void 0, { supportsNegativeValues: true }), gridColumn: z5("gridColumn", [["col", ["gridColumn"]]]), gridColumnStart: z5("gridColumnStart", [["col-start", ["gridColumnStart"]]], { supportsNegativeValues: true }), gridColumnEnd: z5("gridColumnEnd", [["col-end", ["gridColumnEnd"]]], { supportsNegativeValues: true }), gridRow: z5("gridRow", [["row", ["gridRow"]]]), gridRowStart: z5("gridRowStart", [["row-start", ["gridRowStart"]]], { supportsNegativeValues: true }), gridRowEnd: z5("gridRowEnd", [["row-end", ["gridRowEnd"]]], { supportsNegativeValues: true }), float: ({ addUtilities: e }) => {
        e({ ".float-start": { float: "inline-start" }, ".float-end": { float: "inline-end" }, ".float-right": { float: "right" }, ".float-left": { float: "left" }, ".float-none": { float: "none" } });
      }, clear: ({ addUtilities: e }) => {
        e({ ".clear-start": { clear: "inline-start" }, ".clear-end": { clear: "inline-end" }, ".clear-left": { clear: "left" }, ".clear-right": { clear: "right" }, ".clear-both": { clear: "both" }, ".clear-none": { clear: "none" } });
      }, margin: z5("margin", [["m", ["margin"]], [["mx", ["margin-left", "margin-right"]], ["my", ["margin-top", "margin-bottom"]]], [["ms", ["margin-inline-start"]], ["me", ["margin-inline-end"]], ["mt", ["margin-top"]], ["mr", ["margin-right"]], ["mb", ["margin-bottom"]], ["ml", ["margin-left"]]]], { supportsNegativeValues: true }), boxSizing: ({ addUtilities: e }) => {
        e({ ".box-border": { "box-sizing": "border-box" }, ".box-content": { "box-sizing": "content-box" } });
      }, lineClamp: ({ matchUtilities: e, addUtilities: t, theme: r3 }) => {
        e({ "line-clamp": (n3) => ({ overflow: "hidden", display: "-webkit-box", "-webkit-box-orient": "vertical", "-webkit-line-clamp": `${n3}` }) }, { values: r3("lineClamp") }), t({ ".line-clamp-none": { overflow: "visible", display: "block", "-webkit-box-orient": "horizontal", "-webkit-line-clamp": "none" } });
      }, display: ({ addUtilities: e }) => {
        e({ ".block": { display: "block" }, ".inline-block": { display: "inline-block" }, ".inline": { display: "inline" }, ".flex": { display: "flex" }, ".inline-flex": { display: "inline-flex" }, ".table": { display: "table" }, ".inline-table": { display: "inline-table" }, ".table-caption": { display: "table-caption" }, ".table-cell": { display: "table-cell" }, ".table-column": { display: "table-column" }, ".table-column-group": { display: "table-column-group" }, ".table-footer-group": { display: "table-footer-group" }, ".table-header-group": { display: "table-header-group" }, ".table-row-group": { display: "table-row-group" }, ".table-row": { display: "table-row" }, ".flow-root": { display: "flow-root" }, ".grid": { display: "grid" }, ".inline-grid": { display: "inline-grid" }, ".contents": { display: "contents" }, ".list-item": { display: "list-item" }, ".hidden": { display: "none" } });
      }, aspectRatio: z5("aspectRatio", [["aspect", ["aspect-ratio"]]]), size: z5("size", [["size", ["width", "height"]]]), height: z5("height", [["h", ["height"]]]), maxHeight: z5("maxHeight", [["max-h", ["maxHeight"]]]), minHeight: z5("minHeight", [["min-h", ["minHeight"]]]), width: z5("width", [["w", ["width"]]]), minWidth: z5("minWidth", [["min-w", ["minWidth"]]]), maxWidth: z5("maxWidth", [["max-w", ["maxWidth"]]]), flex: z5("flex"), flexShrink: z5("flexShrink", [["flex-shrink", ["flex-shrink"]], ["shrink", ["flex-shrink"]]]), flexGrow: z5("flexGrow", [["flex-grow", ["flex-grow"]], ["grow", ["flex-grow"]]]), flexBasis: z5("flexBasis", [["basis", ["flex-basis"]]]), tableLayout: ({ addUtilities: e }) => {
        e({ ".table-auto": { "table-layout": "auto" }, ".table-fixed": { "table-layout": "fixed" } });
      }, captionSide: ({ addUtilities: e }) => {
        e({ ".caption-top": { "caption-side": "top" }, ".caption-bottom": { "caption-side": "bottom" } });
      }, borderCollapse: ({ addUtilities: e }) => {
        e({ ".border-collapse": { "border-collapse": "collapse" }, ".border-separate": { "border-collapse": "separate" } });
      }, borderSpacing: ({ addDefaults: e, matchUtilities: t, theme: r3 }) => {
        e("border-spacing", { "--tw-border-spacing-x": 0, "--tw-border-spacing-y": 0 }), t({ "border-spacing": (n3) => ({ "--tw-border-spacing-x": n3, "--tw-border-spacing-y": n3, "@defaults border-spacing": {}, "border-spacing": "var(--tw-border-spacing-x) var(--tw-border-spacing-y)" }), "border-spacing-x": (n3) => ({ "--tw-border-spacing-x": n3, "@defaults border-spacing": {}, "border-spacing": "var(--tw-border-spacing-x) var(--tw-border-spacing-y)" }), "border-spacing-y": (n3) => ({ "--tw-border-spacing-y": n3, "@defaults border-spacing": {}, "border-spacing": "var(--tw-border-spacing-x) var(--tw-border-spacing-y)" }) }, { values: r3("borderSpacing") });
      }, transformOrigin: z5("transformOrigin", [["origin", ["transformOrigin"]]]), translate: z5("translate", [[["translate-x", [["@defaults transform", {}], "--tw-translate-x", ["transform", Me4]]], ["translate-y", [["@defaults transform", {}], "--tw-translate-y", ["transform", Me4]]]]], { supportsNegativeValues: true }), rotate: z5("rotate", [["rotate", [["@defaults transform", {}], "--tw-rotate", ["transform", Me4]]]], { supportsNegativeValues: true }), skew: z5("skew", [[["skew-x", [["@defaults transform", {}], "--tw-skew-x", ["transform", Me4]]], ["skew-y", [["@defaults transform", {}], "--tw-skew-y", ["transform", Me4]]]]], { supportsNegativeValues: true }), scale: z5("scale", [["scale", [["@defaults transform", {}], "--tw-scale-x", "--tw-scale-y", ["transform", Me4]]], [["scale-x", [["@defaults transform", {}], "--tw-scale-x", ["transform", Me4]]], ["scale-y", [["@defaults transform", {}], "--tw-scale-y", ["transform", Me4]]]]], { supportsNegativeValues: true }), transform: ({ addDefaults: e, addUtilities: t }) => {
        e("transform", { "--tw-translate-x": "0", "--tw-translate-y": "0", "--tw-rotate": "0", "--tw-skew-x": "0", "--tw-skew-y": "0", "--tw-scale-x": "1", "--tw-scale-y": "1" }), t({ ".transform": { "@defaults transform": {}, transform: Me4 }, ".transform-cpu": { transform: Me4 }, ".transform-gpu": { transform: Me4.replace("translate(var(--tw-translate-x), var(--tw-translate-y))", "translate3d(var(--tw-translate-x), var(--tw-translate-y), 0)") }, ".transform-none": { transform: "none" } });
      }, animation: ({ matchUtilities: e, theme: t, config: r3 }) => {
        let n3 = (s7) => at2(r3("prefix") + s7), o7 = Object.fromEntries(Object.entries(t("keyframes") ?? {}).map(([s7, a4]) => [s7, { [`@keyframes ${n3(s7)}`]: a4 }]));
        e({ animate: (s7) => {
          let a4 = Ec(s7);
          return [...a4.flatMap((l3) => o7[l3.name]), { animation: a4.map(({ name: l3, value: c5 }) => l3 === void 0 || o7[l3] === void 0 ? c5 : c5.replace(l3, n3(l3))).join(", ") }];
        } }, { values: t("animation") });
      }, cursor: z5("cursor"), touchAction: ({ addDefaults: e, addUtilities: t }) => {
        e("touch-action", { "--tw-pan-x": " ", "--tw-pan-y": " ", "--tw-pinch-zoom": " " });
        let r3 = "var(--tw-pan-x) var(--tw-pan-y) var(--tw-pinch-zoom)";
        t({ ".touch-auto": { "touch-action": "auto" }, ".touch-none": { "touch-action": "none" }, ".touch-pan-x": { "@defaults touch-action": {}, "--tw-pan-x": "pan-x", "touch-action": r3 }, ".touch-pan-left": { "@defaults touch-action": {}, "--tw-pan-x": "pan-left", "touch-action": r3 }, ".touch-pan-right": { "@defaults touch-action": {}, "--tw-pan-x": "pan-right", "touch-action": r3 }, ".touch-pan-y": { "@defaults touch-action": {}, "--tw-pan-y": "pan-y", "touch-action": r3 }, ".touch-pan-up": { "@defaults touch-action": {}, "--tw-pan-y": "pan-up", "touch-action": r3 }, ".touch-pan-down": { "@defaults touch-action": {}, "--tw-pan-y": "pan-down", "touch-action": r3 }, ".touch-pinch-zoom": { "@defaults touch-action": {}, "--tw-pinch-zoom": "pinch-zoom", "touch-action": r3 }, ".touch-manipulation": { "touch-action": "manipulation" } });
      }, userSelect: ({ addUtilities: e }) => {
        e({ ".select-none": { "user-select": "none" }, ".select-text": { "user-select": "text" }, ".select-all": { "user-select": "all" }, ".select-auto": { "user-select": "auto" } });
      }, resize: ({ addUtilities: e }) => {
        e({ ".resize-none": { resize: "none" }, ".resize-y": { resize: "vertical" }, ".resize-x": { resize: "horizontal" }, ".resize": { resize: "both" } });
      }, scrollSnapType: ({ addDefaults: e, addUtilities: t }) => {
        e("scroll-snap-type", { "--tw-scroll-snap-strictness": "proximity" }), t({ ".snap-none": { "scroll-snap-type": "none" }, ".snap-x": { "@defaults scroll-snap-type": {}, "scroll-snap-type": "x var(--tw-scroll-snap-strictness)" }, ".snap-y": { "@defaults scroll-snap-type": {}, "scroll-snap-type": "y var(--tw-scroll-snap-strictness)" }, ".snap-both": { "@defaults scroll-snap-type": {}, "scroll-snap-type": "both var(--tw-scroll-snap-strictness)" }, ".snap-mandatory": { "--tw-scroll-snap-strictness": "mandatory" }, ".snap-proximity": { "--tw-scroll-snap-strictness": "proximity" } });
      }, scrollSnapAlign: ({ addUtilities: e }) => {
        e({ ".snap-start": { "scroll-snap-align": "start" }, ".snap-end": { "scroll-snap-align": "end" }, ".snap-center": { "scroll-snap-align": "center" }, ".snap-align-none": { "scroll-snap-align": "none" } });
      }, scrollSnapStop: ({ addUtilities: e }) => {
        e({ ".snap-normal": { "scroll-snap-stop": "normal" }, ".snap-always": { "scroll-snap-stop": "always" } });
      }, scrollMargin: z5("scrollMargin", [["scroll-m", ["scroll-margin"]], [["scroll-mx", ["scroll-margin-left", "scroll-margin-right"]], ["scroll-my", ["scroll-margin-top", "scroll-margin-bottom"]]], [["scroll-ms", ["scroll-margin-inline-start"]], ["scroll-me", ["scroll-margin-inline-end"]], ["scroll-mt", ["scroll-margin-top"]], ["scroll-mr", ["scroll-margin-right"]], ["scroll-mb", ["scroll-margin-bottom"]], ["scroll-ml", ["scroll-margin-left"]]]], { supportsNegativeValues: true }), scrollPadding: z5("scrollPadding", [["scroll-p", ["scroll-padding"]], [["scroll-px", ["scroll-padding-left", "scroll-padding-right"]], ["scroll-py", ["scroll-padding-top", "scroll-padding-bottom"]]], [["scroll-ps", ["scroll-padding-inline-start"]], ["scroll-pe", ["scroll-padding-inline-end"]], ["scroll-pt", ["scroll-padding-top"]], ["scroll-pr", ["scroll-padding-right"]], ["scroll-pb", ["scroll-padding-bottom"]], ["scroll-pl", ["scroll-padding-left"]]]]), listStylePosition: ({ addUtilities: e }) => {
        e({ ".list-inside": { "list-style-position": "inside" }, ".list-outside": { "list-style-position": "outside" } });
      }, listStyleType: z5("listStyleType", [["list", ["listStyleType"]]]), listStyleImage: z5("listStyleImage", [["list-image", ["listStyleImage"]]]), appearance: ({ addUtilities: e }) => {
        e({ ".appearance-none": { appearance: "none" }, ".appearance-auto": { appearance: "auto" } });
      }, columns: z5("columns", [["columns", ["columns"]]]), breakBefore: ({ addUtilities: e }) => {
        e({ ".break-before-auto": { "break-before": "auto" }, ".break-before-avoid": { "break-before": "avoid" }, ".break-before-all": { "break-before": "all" }, ".break-before-avoid-page": { "break-before": "avoid-page" }, ".break-before-page": { "break-before": "page" }, ".break-before-left": { "break-before": "left" }, ".break-before-right": { "break-before": "right" }, ".break-before-column": { "break-before": "column" } });
      }, breakInside: ({ addUtilities: e }) => {
        e({ ".break-inside-auto": { "break-inside": "auto" }, ".break-inside-avoid": { "break-inside": "avoid" }, ".break-inside-avoid-page": { "break-inside": "avoid-page" }, ".break-inside-avoid-column": { "break-inside": "avoid-column" } });
      }, breakAfter: ({ addUtilities: e }) => {
        e({ ".break-after-auto": { "break-after": "auto" }, ".break-after-avoid": { "break-after": "avoid" }, ".break-after-all": { "break-after": "all" }, ".break-after-avoid-page": { "break-after": "avoid-page" }, ".break-after-page": { "break-after": "page" }, ".break-after-left": { "break-after": "left" }, ".break-after-right": { "break-after": "right" }, ".break-after-column": { "break-after": "column" } });
      }, gridAutoColumns: z5("gridAutoColumns", [["auto-cols", ["gridAutoColumns"]]]), gridAutoFlow: ({ addUtilities: e }) => {
        e({ ".grid-flow-row": { gridAutoFlow: "row" }, ".grid-flow-col": { gridAutoFlow: "column" }, ".grid-flow-dense": { gridAutoFlow: "dense" }, ".grid-flow-row-dense": { gridAutoFlow: "row dense" }, ".grid-flow-col-dense": { gridAutoFlow: "column dense" } });
      }, gridAutoRows: z5("gridAutoRows", [["auto-rows", ["gridAutoRows"]]]), gridTemplateColumns: z5("gridTemplateColumns", [["grid-cols", ["gridTemplateColumns"]]]), gridTemplateRows: z5("gridTemplateRows", [["grid-rows", ["gridTemplateRows"]]]), flexDirection: ({ addUtilities: e }) => {
        e({ ".flex-row": { "flex-direction": "row" }, ".flex-row-reverse": { "flex-direction": "row-reverse" }, ".flex-col": { "flex-direction": "column" }, ".flex-col-reverse": { "flex-direction": "column-reverse" } });
      }, flexWrap: ({ addUtilities: e }) => {
        e({ ".flex-wrap": { "flex-wrap": "wrap" }, ".flex-wrap-reverse": { "flex-wrap": "wrap-reverse" }, ".flex-nowrap": { "flex-wrap": "nowrap" } });
      }, placeContent: ({ addUtilities: e }) => {
        e({ ".place-content-center": { "place-content": "center" }, ".place-content-start": { "place-content": "start" }, ".place-content-end": { "place-content": "end" }, ".place-content-between": { "place-content": "space-between" }, ".place-content-around": { "place-content": "space-around" }, ".place-content-evenly": { "place-content": "space-evenly" }, ".place-content-baseline": { "place-content": "baseline" }, ".place-content-stretch": { "place-content": "stretch" } });
      }, placeItems: ({ addUtilities: e }) => {
        e({ ".place-items-start": { "place-items": "start" }, ".place-items-end": { "place-items": "end" }, ".place-items-center": { "place-items": "center" }, ".place-items-baseline": { "place-items": "baseline" }, ".place-items-stretch": { "place-items": "stretch" } });
      }, alignContent: ({ addUtilities: e }) => {
        e({ ".content-normal": { "align-content": "normal" }, ".content-center": { "align-content": "center" }, ".content-start": { "align-content": "flex-start" }, ".content-end": { "align-content": "flex-end" }, ".content-between": { "align-content": "space-between" }, ".content-around": { "align-content": "space-around" }, ".content-evenly": { "align-content": "space-evenly" }, ".content-baseline": { "align-content": "baseline" }, ".content-stretch": { "align-content": "stretch" } });
      }, alignItems: ({ addUtilities: e }) => {
        e({ ".items-start": { "align-items": "flex-start" }, ".items-end": { "align-items": "flex-end" }, ".items-center": { "align-items": "center" }, ".items-baseline": { "align-items": "baseline" }, ".items-stretch": { "align-items": "stretch" } });
      }, justifyContent: ({ addUtilities: e }) => {
        e({ ".justify-normal": { "justify-content": "normal" }, ".justify-start": { "justify-content": "flex-start" }, ".justify-end": { "justify-content": "flex-end" }, ".justify-center": { "justify-content": "center" }, ".justify-between": { "justify-content": "space-between" }, ".justify-around": { "justify-content": "space-around" }, ".justify-evenly": { "justify-content": "space-evenly" }, ".justify-stretch": { "justify-content": "stretch" } });
      }, justifyItems: ({ addUtilities: e }) => {
        e({ ".justify-items-start": { "justify-items": "start" }, ".justify-items-end": { "justify-items": "end" }, ".justify-items-center": { "justify-items": "center" }, ".justify-items-stretch": { "justify-items": "stretch" } });
      }, gap: z5("gap", [["gap", ["gap"]], [["gap-x", ["columnGap"]], ["gap-y", ["rowGap"]]]]), space: ({ matchUtilities: e, addUtilities: t, theme: r3 }) => {
        e({ "space-x": (n3) => (n3 = n3 === "0" ? "0px" : n3, { "& > :not([hidden]) ~ :not([hidden])": { "--tw-space-x-reverse": "0", "margin-right": `calc(${n3} * var(--tw-space-x-reverse))`, "margin-left": `calc(${n3} * calc(1 - var(--tw-space-x-reverse)))` } }), "space-y": (n3) => (n3 = n3 === "0" ? "0px" : n3, { "& > :not([hidden]) ~ :not([hidden])": { "--tw-space-y-reverse": "0", "margin-top": `calc(${n3} * calc(1 - var(--tw-space-y-reverse)))`, "margin-bottom": `calc(${n3} * var(--tw-space-y-reverse))` } }) }, { values: r3("space"), supportsNegativeValues: true }), t({ ".space-y-reverse > :not([hidden]) ~ :not([hidden])": { "--tw-space-y-reverse": "1" }, ".space-x-reverse > :not([hidden]) ~ :not([hidden])": { "--tw-space-x-reverse": "1" } });
      }, divideWidth: ({ matchUtilities: e, addUtilities: t, theme: r3 }) => {
        e({ "divide-x": (n3) => (n3 = n3 === "0" ? "0px" : n3, { "& > :not([hidden]) ~ :not([hidden])": { "@defaults border-width": {}, "--tw-divide-x-reverse": "0", "border-right-width": `calc(${n3} * var(--tw-divide-x-reverse))`, "border-left-width": `calc(${n3} * calc(1 - var(--tw-divide-x-reverse)))` } }), "divide-y": (n3) => (n3 = n3 === "0" ? "0px" : n3, { "& > :not([hidden]) ~ :not([hidden])": { "@defaults border-width": {}, "--tw-divide-y-reverse": "0", "border-top-width": `calc(${n3} * calc(1 - var(--tw-divide-y-reverse)))`, "border-bottom-width": `calc(${n3} * var(--tw-divide-y-reverse))` } }) }, { values: r3("divideWidth"), type: ["line-width", "length", "any"] }), t({ ".divide-y-reverse > :not([hidden]) ~ :not([hidden])": { "@defaults border-width": {}, "--tw-divide-y-reverse": "1" }, ".divide-x-reverse > :not([hidden]) ~ :not([hidden])": { "@defaults border-width": {}, "--tw-divide-x-reverse": "1" } });
      }, divideStyle: ({ addUtilities: e }) => {
        e({ ".divide-solid > :not([hidden]) ~ :not([hidden])": { "border-style": "solid" }, ".divide-dashed > :not([hidden]) ~ :not([hidden])": { "border-style": "dashed" }, ".divide-dotted > :not([hidden]) ~ :not([hidden])": { "border-style": "dotted" }, ".divide-double > :not([hidden]) ~ :not([hidden])": { "border-style": "double" }, ".divide-none > :not([hidden]) ~ :not([hidden])": { "border-style": "none" } });
      }, divideColor: ({ matchUtilities: e, theme: t, corePlugins: r3 }) => {
        e({ divide: (n3) => r3("divideOpacity") ? { "& > :not([hidden]) ~ :not([hidden])": Oe3({ color: n3, property: "border-color", variable: "--tw-divide-opacity" }) } : { "& > :not([hidden]) ~ :not([hidden])": { "border-color": se3(n3) } } }, { values: (({ DEFAULT: n3, ...o7 }) => o7)(ye3(t("divideColor"))), type: ["color", "any"] });
      }, divideOpacity: ({ matchUtilities: e, theme: t }) => {
        e({ "divide-opacity": (r3) => ({ "& > :not([hidden]) ~ :not([hidden])": { "--tw-divide-opacity": r3 } }) }, { values: t("divideOpacity") });
      }, placeSelf: ({ addUtilities: e }) => {
        e({ ".place-self-auto": { "place-self": "auto" }, ".place-self-start": { "place-self": "start" }, ".place-self-end": { "place-self": "end" }, ".place-self-center": { "place-self": "center" }, ".place-self-stretch": { "place-self": "stretch" } });
      }, alignSelf: ({ addUtilities: e }) => {
        e({ ".self-auto": { "align-self": "auto" }, ".self-start": { "align-self": "flex-start" }, ".self-end": { "align-self": "flex-end" }, ".self-center": { "align-self": "center" }, ".self-stretch": { "align-self": "stretch" }, ".self-baseline": { "align-self": "baseline" } });
      }, justifySelf: ({ addUtilities: e }) => {
        e({ ".justify-self-auto": { "justify-self": "auto" }, ".justify-self-start": { "justify-self": "start" }, ".justify-self-end": { "justify-self": "end" }, ".justify-self-center": { "justify-self": "center" }, ".justify-self-stretch": { "justify-self": "stretch" } });
      }, overflow: ({ addUtilities: e }) => {
        e({ ".overflow-auto": { overflow: "auto" }, ".overflow-hidden": { overflow: "hidden" }, ".overflow-clip": { overflow: "clip" }, ".overflow-visible": { overflow: "visible" }, ".overflow-scroll": { overflow: "scroll" }, ".overflow-x-auto": { "overflow-x": "auto" }, ".overflow-y-auto": { "overflow-y": "auto" }, ".overflow-x-hidden": { "overflow-x": "hidden" }, ".overflow-y-hidden": { "overflow-y": "hidden" }, ".overflow-x-clip": { "overflow-x": "clip" }, ".overflow-y-clip": { "overflow-y": "clip" }, ".overflow-x-visible": { "overflow-x": "visible" }, ".overflow-y-visible": { "overflow-y": "visible" }, ".overflow-x-scroll": { "overflow-x": "scroll" }, ".overflow-y-scroll": { "overflow-y": "scroll" } });
      }, overscrollBehavior: ({ addUtilities: e }) => {
        e({ ".overscroll-auto": { "overscroll-behavior": "auto" }, ".overscroll-contain": { "overscroll-behavior": "contain" }, ".overscroll-none": { "overscroll-behavior": "none" }, ".overscroll-y-auto": { "overscroll-behavior-y": "auto" }, ".overscroll-y-contain": { "overscroll-behavior-y": "contain" }, ".overscroll-y-none": { "overscroll-behavior-y": "none" }, ".overscroll-x-auto": { "overscroll-behavior-x": "auto" }, ".overscroll-x-contain": { "overscroll-behavior-x": "contain" }, ".overscroll-x-none": { "overscroll-behavior-x": "none" } });
      }, scrollBehavior: ({ addUtilities: e }) => {
        e({ ".scroll-auto": { "scroll-behavior": "auto" }, ".scroll-smooth": { "scroll-behavior": "smooth" } });
      }, textOverflow: ({ addUtilities: e }) => {
        e({ ".truncate": { overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }, ".overflow-ellipsis": { "text-overflow": "ellipsis" }, ".text-ellipsis": { "text-overflow": "ellipsis" }, ".text-clip": { "text-overflow": "clip" } });
      }, hyphens: ({ addUtilities: e }) => {
        e({ ".hyphens-none": { hyphens: "none" }, ".hyphens-manual": { hyphens: "manual" }, ".hyphens-auto": { hyphens: "auto" } });
      }, whitespace: ({ addUtilities: e }) => {
        e({ ".whitespace-normal": { "white-space": "normal" }, ".whitespace-nowrap": { "white-space": "nowrap" }, ".whitespace-pre": { "white-space": "pre" }, ".whitespace-pre-line": { "white-space": "pre-line" }, ".whitespace-pre-wrap": { "white-space": "pre-wrap" }, ".whitespace-break-spaces": { "white-space": "break-spaces" } });
      }, textWrap: ({ addUtilities: e }) => {
        e({ ".text-wrap": { "text-wrap": "wrap" }, ".text-nowrap": { "text-wrap": "nowrap" }, ".text-balance": { "text-wrap": "balance" }, ".text-pretty": { "text-wrap": "pretty" } });
      }, wordBreak: ({ addUtilities: e }) => {
        e({ ".break-normal": { "overflow-wrap": "normal", "word-break": "normal" }, ".break-words": { "overflow-wrap": "break-word" }, ".break-all": { "word-break": "break-all" }, ".break-keep": { "word-break": "keep-all" } });
      }, borderRadius: z5("borderRadius", [["rounded", ["border-radius"]], [["rounded-s", ["border-start-start-radius", "border-end-start-radius"]], ["rounded-e", ["border-start-end-radius", "border-end-end-radius"]], ["rounded-t", ["border-top-left-radius", "border-top-right-radius"]], ["rounded-r", ["border-top-right-radius", "border-bottom-right-radius"]], ["rounded-b", ["border-bottom-right-radius", "border-bottom-left-radius"]], ["rounded-l", ["border-top-left-radius", "border-bottom-left-radius"]]], [["rounded-ss", ["border-start-start-radius"]], ["rounded-se", ["border-start-end-radius"]], ["rounded-ee", ["border-end-end-radius"]], ["rounded-es", ["border-end-start-radius"]], ["rounded-tl", ["border-top-left-radius"]], ["rounded-tr", ["border-top-right-radius"]], ["rounded-br", ["border-bottom-right-radius"]], ["rounded-bl", ["border-bottom-left-radius"]]]]), borderWidth: z5("borderWidth", [["border", [["@defaults border-width", {}], "border-width"]], [["border-x", [["@defaults border-width", {}], "border-left-width", "border-right-width"]], ["border-y", [["@defaults border-width", {}], "border-top-width", "border-bottom-width"]]], [["border-s", [["@defaults border-width", {}], "border-inline-start-width"]], ["border-e", [["@defaults border-width", {}], "border-inline-end-width"]], ["border-t", [["@defaults border-width", {}], "border-top-width"]], ["border-r", [["@defaults border-width", {}], "border-right-width"]], ["border-b", [["@defaults border-width", {}], "border-bottom-width"]], ["border-l", [["@defaults border-width", {}], "border-left-width"]]]], { type: ["line-width", "length"] }), borderStyle: ({ addUtilities: e }) => {
        e({ ".border-solid": { "border-style": "solid" }, ".border-dashed": { "border-style": "dashed" }, ".border-dotted": { "border-style": "dotted" }, ".border-double": { "border-style": "double" }, ".border-hidden": { "border-style": "hidden" }, ".border-none": { "border-style": "none" } });
      }, borderColor: ({ matchUtilities: e, theme: t, corePlugins: r3 }) => {
        e({ border: (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-color", variable: "--tw-border-opacity" }) : { "border-color": se3(n3) } }, { values: (({ DEFAULT: n3, ...o7 }) => o7)(ye3(t("borderColor"))), type: ["color", "any"] }), e({ "border-x": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: ["border-left-color", "border-right-color"], variable: "--tw-border-opacity" }) : { "border-left-color": se3(n3), "border-right-color": se3(n3) }, "border-y": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: ["border-top-color", "border-bottom-color"], variable: "--tw-border-opacity" }) : { "border-top-color": se3(n3), "border-bottom-color": se3(n3) } }, { values: (({ DEFAULT: n3, ...o7 }) => o7)(ye3(t("borderColor"))), type: ["color", "any"] }), e({ "border-s": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-inline-start-color", variable: "--tw-border-opacity" }) : { "border-inline-start-color": se3(n3) }, "border-e": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-inline-end-color", variable: "--tw-border-opacity" }) : { "border-inline-end-color": se3(n3) }, "border-t": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-top-color", variable: "--tw-border-opacity" }) : { "border-top-color": se3(n3) }, "border-r": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-right-color", variable: "--tw-border-opacity" }) : { "border-right-color": se3(n3) }, "border-b": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-bottom-color", variable: "--tw-border-opacity" }) : { "border-bottom-color": se3(n3) }, "border-l": (n3) => r3("borderOpacity") ? Oe3({ color: n3, property: "border-left-color", variable: "--tw-border-opacity" }) : { "border-left-color": se3(n3) } }, { values: (({ DEFAULT: n3, ...o7 }) => o7)(ye3(t("borderColor"))), type: ["color", "any"] });
      }, borderOpacity: z5("borderOpacity", [["border-opacity", ["--tw-border-opacity"]]]), backgroundColor: ({ matchUtilities: e, theme: t, corePlugins: r3 }) => {
        e({ bg: (n3) => r3("backgroundOpacity") ? Oe3({ color: n3, property: "background-color", variable: "--tw-bg-opacity" }) : { "background-color": se3(n3) } }, { values: ye3(t("backgroundColor")), type: ["color", "any"] });
      }, backgroundOpacity: z5("backgroundOpacity", [["bg-opacity", ["--tw-bg-opacity"]]]), backgroundImage: z5("backgroundImage", [["bg", ["background-image"]]], { type: ["lookup", "image", "url"] }), gradientColorStops: /* @__PURE__ */ (() => {
        function e(t) {
          return wt2(t, 0, "rgb(255 255 255 / 0)");
        }
        return function({ matchUtilities: t, theme: r3, addDefaults: n3 }) {
          n3("gradient-color-stops", { "--tw-gradient-from-position": " ", "--tw-gradient-via-position": " ", "--tw-gradient-to-position": " " });
          let o7 = { values: ye3(r3("gradientColorStops")), type: ["color", "any"] }, s7 = { values: r3("gradientColorStopPositions"), type: ["length", "percentage"] };
          t({ from: (a4) => {
            let l3 = e(a4);
            return { "@defaults gradient-color-stops": {}, "--tw-gradient-from": `${se3(a4)} var(--tw-gradient-from-position)`, "--tw-gradient-to": `${l3} var(--tw-gradient-to-position)`, "--tw-gradient-stops": "var(--tw-gradient-from), var(--tw-gradient-to)" };
          } }, o7), t({ from: (a4) => ({ "--tw-gradient-from-position": a4 }) }, s7), t({ via: (a4) => {
            let l3 = e(a4);
            return { "@defaults gradient-color-stops": {}, "--tw-gradient-to": `${l3}  var(--tw-gradient-to-position)`, "--tw-gradient-stops": `var(--tw-gradient-from), ${se3(a4)} var(--tw-gradient-via-position), var(--tw-gradient-to)` };
          } }, o7), t({ via: (a4) => ({ "--tw-gradient-via-position": a4 }) }, s7), t({ to: (a4) => ({ "@defaults gradient-color-stops": {}, "--tw-gradient-to": `${se3(a4)} var(--tw-gradient-to-position)` }) }, o7), t({ to: (a4) => ({ "--tw-gradient-to-position": a4 }) }, s7);
        };
      })(), boxDecorationBreak: ({ addUtilities: e }) => {
        e({ ".decoration-slice": { "box-decoration-break": "slice" }, ".decoration-clone": { "box-decoration-break": "clone" }, ".box-decoration-slice": { "box-decoration-break": "slice" }, ".box-decoration-clone": { "box-decoration-break": "clone" } });
      }, backgroundSize: z5("backgroundSize", [["bg", ["background-size"]]], { type: ["lookup", "length", "percentage", "size"] }), backgroundAttachment: ({ addUtilities: e }) => {
        e({ ".bg-fixed": { "background-attachment": "fixed" }, ".bg-local": { "background-attachment": "local" }, ".bg-scroll": { "background-attachment": "scroll" } });
      }, backgroundClip: ({ addUtilities: e }) => {
        e({ ".bg-clip-border": { "background-clip": "border-box" }, ".bg-clip-padding": { "background-clip": "padding-box" }, ".bg-clip-content": { "background-clip": "content-box" }, ".bg-clip-text": { "background-clip": "text" } });
      }, backgroundPosition: z5("backgroundPosition", [["bg", ["background-position"]]], { type: ["lookup", ["position", { preferOnConflict: true }]] }), backgroundRepeat: ({ addUtilities: e }) => {
        e({ ".bg-repeat": { "background-repeat": "repeat" }, ".bg-no-repeat": { "background-repeat": "no-repeat" }, ".bg-repeat-x": { "background-repeat": "repeat-x" }, ".bg-repeat-y": { "background-repeat": "repeat-y" }, ".bg-repeat-round": { "background-repeat": "round" }, ".bg-repeat-space": { "background-repeat": "space" } });
      }, backgroundOrigin: ({ addUtilities: e }) => {
        e({ ".bg-origin-border": { "background-origin": "border-box" }, ".bg-origin-padding": { "background-origin": "padding-box" }, ".bg-origin-content": { "background-origin": "content-box" } });
      }, fill: ({ matchUtilities: e, theme: t }) => {
        e({ fill: (r3) => ({ fill: se3(r3) }) }, { values: ye3(t("fill")), type: ["color", "any"] });
      }, stroke: ({ matchUtilities: e, theme: t }) => {
        e({ stroke: (r3) => ({ stroke: se3(r3) }) }, { values: ye3(t("stroke")), type: ["color", "url", "any"] });
      }, strokeWidth: z5("strokeWidth", [["stroke", ["stroke-width"]]], { type: ["length", "number", "percentage"] }), objectFit: ({ addUtilities: e }) => {
        e({ ".object-contain": { "object-fit": "contain" }, ".object-cover": { "object-fit": "cover" }, ".object-fill": { "object-fit": "fill" }, ".object-none": { "object-fit": "none" }, ".object-scale-down": { "object-fit": "scale-down" } });
      }, objectPosition: z5("objectPosition", [["object", ["object-position"]]]), padding: z5("padding", [["p", ["padding"]], [["px", ["padding-left", "padding-right"]], ["py", ["padding-top", "padding-bottom"]]], [["ps", ["padding-inline-start"]], ["pe", ["padding-inline-end"]], ["pt", ["padding-top"]], ["pr", ["padding-right"]], ["pb", ["padding-bottom"]], ["pl", ["padding-left"]]]]), textAlign: ({ addUtilities: e }) => {
        e({ ".text-left": { "text-align": "left" }, ".text-center": { "text-align": "center" }, ".text-right": { "text-align": "right" }, ".text-justify": { "text-align": "justify" }, ".text-start": { "text-align": "start" }, ".text-end": { "text-align": "end" } });
      }, textIndent: z5("textIndent", [["indent", ["text-indent"]]], { supportsNegativeValues: true }), verticalAlign: ({ addUtilities: e, matchUtilities: t }) => {
        e({ ".align-baseline": { "vertical-align": "baseline" }, ".align-top": { "vertical-align": "top" }, ".align-middle": { "vertical-align": "middle" }, ".align-bottom": { "vertical-align": "bottom" }, ".align-text-top": { "vertical-align": "text-top" }, ".align-text-bottom": { "vertical-align": "text-bottom" }, ".align-sub": { "vertical-align": "sub" }, ".align-super": { "vertical-align": "super" } }), t({ align: (r3) => ({ "vertical-align": r3 }) });
      }, fontFamily: ({ matchUtilities: e, theme: t }) => {
        e({ font: (r3) => {
          let [n3, o7 = {}] = Array.isArray(r3) && Le2(r3[1]) ? r3 : [r3], { fontFeatureSettings: s7, fontVariationSettings: a4 } = o7;
          return { "font-family": Array.isArray(n3) ? n3.join(", ") : n3, ...s7 === void 0 ? {} : { "font-feature-settings": s7 }, ...a4 === void 0 ? {} : { "font-variation-settings": a4 } };
        } }, { values: t("fontFamily"), type: ["lookup", "generic-name", "family-name"] });
      }, fontSize: ({ matchUtilities: e, theme: t }) => {
        e({ text: (r3, { modifier: n3 }) => {
          let [o7, s7] = Array.isArray(r3) ? r3 : [r3];
          if (n3) return { "font-size": o7, "line-height": n3 };
          let { lineHeight: a4, letterSpacing: l3, fontWeight: c5 } = Le2(s7) ? s7 : { lineHeight: s7 };
          return { "font-size": o7, ...a4 === void 0 ? {} : { "line-height": a4 }, ...l3 === void 0 ? {} : { "letter-spacing": l3 }, ...c5 === void 0 ? {} : { "font-weight": c5 } };
        } }, { values: t("fontSize"), modifiers: t("lineHeight"), type: ["absolute-size", "relative-size", "length", "percentage"] });
      }, fontWeight: z5("fontWeight", [["font", ["fontWeight"]]], { type: ["lookup", "number", "any"] }), textTransform: ({ addUtilities: e }) => {
        e({ ".uppercase": { "text-transform": "uppercase" }, ".lowercase": { "text-transform": "lowercase" }, ".capitalize": { "text-transform": "capitalize" }, ".normal-case": { "text-transform": "none" } });
      }, fontStyle: ({ addUtilities: e }) => {
        e({ ".italic": { "font-style": "italic" }, ".not-italic": { "font-style": "normal" } });
      }, fontVariantNumeric: ({ addDefaults: e, addUtilities: t }) => {
        let r3 = "var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)";
        e("font-variant-numeric", { "--tw-ordinal": " ", "--tw-slashed-zero": " ", "--tw-numeric-figure": " ", "--tw-numeric-spacing": " ", "--tw-numeric-fraction": " " }), t({ ".normal-nums": { "font-variant-numeric": "normal" }, ".ordinal": { "@defaults font-variant-numeric": {}, "--tw-ordinal": "ordinal", "font-variant-numeric": r3 }, ".slashed-zero": { "@defaults font-variant-numeric": {}, "--tw-slashed-zero": "slashed-zero", "font-variant-numeric": r3 }, ".lining-nums": { "@defaults font-variant-numeric": {}, "--tw-numeric-figure": "lining-nums", "font-variant-numeric": r3 }, ".oldstyle-nums": { "@defaults font-variant-numeric": {}, "--tw-numeric-figure": "oldstyle-nums", "font-variant-numeric": r3 }, ".proportional-nums": { "@defaults font-variant-numeric": {}, "--tw-numeric-spacing": "proportional-nums", "font-variant-numeric": r3 }, ".tabular-nums": { "@defaults font-variant-numeric": {}, "--tw-numeric-spacing": "tabular-nums", "font-variant-numeric": r3 }, ".diagonal-fractions": { "@defaults font-variant-numeric": {}, "--tw-numeric-fraction": "diagonal-fractions", "font-variant-numeric": r3 }, ".stacked-fractions": { "@defaults font-variant-numeric": {}, "--tw-numeric-fraction": "stacked-fractions", "font-variant-numeric": r3 } });
      }, lineHeight: z5("lineHeight", [["leading", ["lineHeight"]]]), letterSpacing: z5("letterSpacing", [["tracking", ["letterSpacing"]]], { supportsNegativeValues: true }), textColor: ({ matchUtilities: e, theme: t, corePlugins: r3 }) => {
        e({ text: (n3) => r3("textOpacity") ? Oe3({ color: n3, property: "color", variable: "--tw-text-opacity" }) : { color: se3(n3) } }, { values: ye3(t("textColor")), type: ["color", "any"] });
      }, textOpacity: z5("textOpacity", [["text-opacity", ["--tw-text-opacity"]]]), textDecoration: ({ addUtilities: e }) => {
        e({ ".underline": { "text-decoration-line": "underline" }, ".overline": { "text-decoration-line": "overline" }, ".line-through": { "text-decoration-line": "line-through" }, ".no-underline": { "text-decoration-line": "none" } });
      }, textDecorationColor: ({ matchUtilities: e, theme: t }) => {
        e({ decoration: (r3) => ({ "text-decoration-color": se3(r3) }) }, { values: ye3(t("textDecorationColor")), type: ["color", "any"] });
      }, textDecorationStyle: ({ addUtilities: e }) => {
        e({ ".decoration-solid": { "text-decoration-style": "solid" }, ".decoration-double": { "text-decoration-style": "double" }, ".decoration-dotted": { "text-decoration-style": "dotted" }, ".decoration-dashed": { "text-decoration-style": "dashed" }, ".decoration-wavy": { "text-decoration-style": "wavy" } });
      }, textDecorationThickness: z5("textDecorationThickness", [["decoration", ["text-decoration-thickness"]]], { type: ["length", "percentage"] }), textUnderlineOffset: z5("textUnderlineOffset", [["underline-offset", ["text-underline-offset"]]], { type: ["length", "percentage", "any"] }), fontSmoothing: ({ addUtilities: e }) => {
        e({ ".antialiased": { "-webkit-font-smoothing": "antialiased", "-moz-osx-font-smoothing": "grayscale" }, ".subpixel-antialiased": { "-webkit-font-smoothing": "auto", "-moz-osx-font-smoothing": "auto" } });
      }, placeholderColor: ({ matchUtilities: e, theme: t, corePlugins: r3 }) => {
        e({ placeholder: (n3) => r3("placeholderOpacity") ? { "&::placeholder": Oe3({ color: n3, property: "color", variable: "--tw-placeholder-opacity" }) } : { "&::placeholder": { color: se3(n3) } } }, { values: ye3(t("placeholderColor")), type: ["color", "any"] });
      }, placeholderOpacity: ({ matchUtilities: e, theme: t }) => {
        e({ "placeholder-opacity": (r3) => ({ "&::placeholder": { "--tw-placeholder-opacity": r3 } }) }, { values: t("placeholderOpacity") });
      }, caretColor: ({ matchUtilities: e, theme: t }) => {
        e({ caret: (r3) => ({ "caret-color": se3(r3) }) }, { values: ye3(t("caretColor")), type: ["color", "any"] });
      }, accentColor: ({ matchUtilities: e, theme: t }) => {
        e({ accent: (r3) => ({ "accent-color": se3(r3) }) }, { values: ye3(t("accentColor")), type: ["color", "any"] });
      }, opacity: z5("opacity", [["opacity", ["opacity"]]]), backgroundBlendMode: ({ addUtilities: e }) => {
        e({ ".bg-blend-normal": { "background-blend-mode": "normal" }, ".bg-blend-multiply": { "background-blend-mode": "multiply" }, ".bg-blend-screen": { "background-blend-mode": "screen" }, ".bg-blend-overlay": { "background-blend-mode": "overlay" }, ".bg-blend-darken": { "background-blend-mode": "darken" }, ".bg-blend-lighten": { "background-blend-mode": "lighten" }, ".bg-blend-color-dodge": { "background-blend-mode": "color-dodge" }, ".bg-blend-color-burn": { "background-blend-mode": "color-burn" }, ".bg-blend-hard-light": { "background-blend-mode": "hard-light" }, ".bg-blend-soft-light": { "background-blend-mode": "soft-light" }, ".bg-blend-difference": { "background-blend-mode": "difference" }, ".bg-blend-exclusion": { "background-blend-mode": "exclusion" }, ".bg-blend-hue": { "background-blend-mode": "hue" }, ".bg-blend-saturation": { "background-blend-mode": "saturation" }, ".bg-blend-color": { "background-blend-mode": "color" }, ".bg-blend-luminosity": { "background-blend-mode": "luminosity" } });
      }, mixBlendMode: ({ addUtilities: e }) => {
        e({ ".mix-blend-normal": { "mix-blend-mode": "normal" }, ".mix-blend-multiply": { "mix-blend-mode": "multiply" }, ".mix-blend-screen": { "mix-blend-mode": "screen" }, ".mix-blend-overlay": { "mix-blend-mode": "overlay" }, ".mix-blend-darken": { "mix-blend-mode": "darken" }, ".mix-blend-lighten": { "mix-blend-mode": "lighten" }, ".mix-blend-color-dodge": { "mix-blend-mode": "color-dodge" }, ".mix-blend-color-burn": { "mix-blend-mode": "color-burn" }, ".mix-blend-hard-light": { "mix-blend-mode": "hard-light" }, ".mix-blend-soft-light": { "mix-blend-mode": "soft-light" }, ".mix-blend-difference": { "mix-blend-mode": "difference" }, ".mix-blend-exclusion": { "mix-blend-mode": "exclusion" }, ".mix-blend-hue": { "mix-blend-mode": "hue" }, ".mix-blend-saturation": { "mix-blend-mode": "saturation" }, ".mix-blend-color": { "mix-blend-mode": "color" }, ".mix-blend-luminosity": { "mix-blend-mode": "luminosity" }, ".mix-blend-plus-darker": { "mix-blend-mode": "plus-darker" }, ".mix-blend-plus-lighter": { "mix-blend-mode": "plus-lighter" } });
      }, boxShadow: (() => {
        let e = ir2("boxShadow"), t = ["var(--tw-ring-offset-shadow, 0 0 #0000)", "var(--tw-ring-shadow, 0 0 #0000)", "var(--tw-shadow)"].join(", ");
        return function({ matchUtilities: r3, addDefaults: n3, theme: o7 }) {
          n3("box-shadow", { "--tw-ring-offset-shadow": "0 0 #0000", "--tw-ring-shadow": "0 0 #0000", "--tw-shadow": "0 0 #0000", "--tw-shadow-colored": "0 0 #0000" }), r3({ shadow: (s7) => {
            s7 = e(s7);
            let a4 = Bo(s7);
            for (let l3 of a4) !l3.valid || (l3.color = "var(--tw-shadow-color)");
            return { "@defaults box-shadow": {}, "--tw-shadow": s7 === "none" ? "0 0 #0000" : s7, "--tw-shadow-colored": s7 === "none" ? "0 0 #0000" : Yi(a4), "box-shadow": t };
          } }, { values: o7("boxShadow"), type: ["shadow"] });
        };
      })(), boxShadowColor: ({ matchUtilities: e, theme: t }) => {
        e({ shadow: (r3) => ({ "--tw-shadow-color": se3(r3), "--tw-shadow": "var(--tw-shadow-colored)" }) }, { values: ye3(t("boxShadowColor")), type: ["color", "any"] });
      }, outlineStyle: ({ addUtilities: e }) => {
        e({ ".outline-none": { outline: "2px solid transparent", "outline-offset": "2px" }, ".outline": { "outline-style": "solid" }, ".outline-dashed": { "outline-style": "dashed" }, ".outline-dotted": { "outline-style": "dotted" }, ".outline-double": { "outline-style": "double" } });
      }, outlineWidth: z5("outlineWidth", [["outline", ["outline-width"]]], { type: ["length", "number", "percentage"] }), outlineOffset: z5("outlineOffset", [["outline-offset", ["outline-offset"]]], { type: ["length", "number", "percentage", "any"], supportsNegativeValues: true }), outlineColor: ({ matchUtilities: e, theme: t }) => {
        e({ outline: (r3) => ({ "outline-color": se3(r3) }) }, { values: ye3(t("outlineColor")), type: ["color", "any"] });
      }, ringWidth: ({ matchUtilities: e, addDefaults: t, addUtilities: r3, theme: n3, config: o7 }) => {
        let s7 = (() => {
          if (De3(o7(), "respectDefaultRingColorOpacity")) return n3("ringColor.DEFAULT");
          let a4 = n3("ringOpacity.DEFAULT", "0.5");
          return n3("ringColor")?.DEFAULT ? wt2(n3("ringColor")?.DEFAULT, a4, `rgb(147 197 253 / ${a4})`) : `rgb(147 197 253 / ${a4})`;
        })();
        t("ring-width", { "--tw-ring-inset": " ", "--tw-ring-offset-width": n3("ringOffsetWidth.DEFAULT", "0px"), "--tw-ring-offset-color": n3("ringOffsetColor.DEFAULT", "#fff"), "--tw-ring-color": s7, "--tw-ring-offset-shadow": "0 0 #0000", "--tw-ring-shadow": "0 0 #0000", "--tw-shadow": "0 0 #0000", "--tw-shadow-colored": "0 0 #0000" }), e({ ring: (a4) => ({ "@defaults ring-width": {}, "--tw-ring-offset-shadow": "var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)", "--tw-ring-shadow": `var(--tw-ring-inset) 0 0 0 calc(${a4} + var(--tw-ring-offset-width)) var(--tw-ring-color)`, "box-shadow": ["var(--tw-ring-offset-shadow)", "var(--tw-ring-shadow)", "var(--tw-shadow, 0 0 #0000)"].join(", ") }) }, { values: n3("ringWidth"), type: "length" }), r3({ ".ring-inset": { "@defaults ring-width": {}, "--tw-ring-inset": "inset" } });
      }, ringColor: ({ matchUtilities: e, theme: t, corePlugins: r3 }) => {
        e({ ring: (n3) => r3("ringOpacity") ? Oe3({ color: n3, property: "--tw-ring-color", variable: "--tw-ring-opacity" }) : { "--tw-ring-color": se3(n3) } }, { values: Object.fromEntries(Object.entries(ye3(t("ringColor"))).filter(([n3]) => n3 !== "DEFAULT")), type: ["color", "any"] });
      }, ringOpacity: (e) => {
        let { config: t } = e;
        return z5("ringOpacity", [["ring-opacity", ["--tw-ring-opacity"]]], { filterDefault: !De3(t(), "respectDefaultRingColorOpacity") })(e);
      }, ringOffsetWidth: z5("ringOffsetWidth", [["ring-offset", ["--tw-ring-offset-width"]]], { type: "length" }), ringOffsetColor: ({ matchUtilities: e, theme: t }) => {
        e({ "ring-offset": (r3) => ({ "--tw-ring-offset-color": se3(r3) }) }, { values: ye3(t("ringOffsetColor")), type: ["color", "any"] });
      }, blur: ({ matchUtilities: e, theme: t }) => {
        e({ blur: (r3) => ({ "--tw-blur": r3.trim() === "" ? " " : `blur(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("blur") });
      }, brightness: ({ matchUtilities: e, theme: t }) => {
        e({ brightness: (r3) => ({ "--tw-brightness": `brightness(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("brightness") });
      }, contrast: ({ matchUtilities: e, theme: t }) => {
        e({ contrast: (r3) => ({ "--tw-contrast": `contrast(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("contrast") });
      }, dropShadow: ({ matchUtilities: e, theme: t }) => {
        e({ "drop-shadow": (r3) => ({ "--tw-drop-shadow": Array.isArray(r3) ? r3.map((n3) => `drop-shadow(${n3})`).join(" ") : `drop-shadow(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("dropShadow") });
      }, grayscale: ({ matchUtilities: e, theme: t }) => {
        e({ grayscale: (r3) => ({ "--tw-grayscale": `grayscale(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("grayscale") });
      }, hueRotate: ({ matchUtilities: e, theme: t }) => {
        e({ "hue-rotate": (r3) => ({ "--tw-hue-rotate": `hue-rotate(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("hueRotate"), supportsNegativeValues: true });
      }, invert: ({ matchUtilities: e, theme: t }) => {
        e({ invert: (r3) => ({ "--tw-invert": `invert(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("invert") });
      }, saturate: ({ matchUtilities: e, theme: t }) => {
        e({ saturate: (r3) => ({ "--tw-saturate": `saturate(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("saturate") });
      }, sepia: ({ matchUtilities: e, theme: t }) => {
        e({ sepia: (r3) => ({ "--tw-sepia": `sepia(${r3})`, "@defaults filter": {}, filter: Ne2 }) }, { values: t("sepia") });
      }, filter: ({ addDefaults: e, addUtilities: t }) => {
        e("filter", { "--tw-blur": " ", "--tw-brightness": " ", "--tw-contrast": " ", "--tw-grayscale": " ", "--tw-hue-rotate": " ", "--tw-invert": " ", "--tw-saturate": " ", "--tw-sepia": " ", "--tw-drop-shadow": " " }), t({ ".filter": { "@defaults filter": {}, filter: Ne2 }, ".filter-none": { filter: "none" } });
      }, backdropBlur: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-blur": (r3) => ({ "--tw-backdrop-blur": r3.trim() === "" ? " " : `blur(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropBlur") });
      }, backdropBrightness: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-brightness": (r3) => ({ "--tw-backdrop-brightness": `brightness(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropBrightness") });
      }, backdropContrast: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-contrast": (r3) => ({ "--tw-backdrop-contrast": `contrast(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropContrast") });
      }, backdropGrayscale: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-grayscale": (r3) => ({ "--tw-backdrop-grayscale": `grayscale(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropGrayscale") });
      }, backdropHueRotate: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-hue-rotate": (r3) => ({ "--tw-backdrop-hue-rotate": `hue-rotate(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropHueRotate"), supportsNegativeValues: true });
      }, backdropInvert: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-invert": (r3) => ({ "--tw-backdrop-invert": `invert(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropInvert") });
      }, backdropOpacity: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-opacity": (r3) => ({ "--tw-backdrop-opacity": `opacity(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropOpacity") });
      }, backdropSaturate: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-saturate": (r3) => ({ "--tw-backdrop-saturate": `saturate(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropSaturate") });
      }, backdropSepia: ({ matchUtilities: e, theme: t }) => {
        e({ "backdrop-sepia": (r3) => ({ "--tw-backdrop-sepia": `sepia(${r3})`, "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }) }, { values: t("backdropSepia") });
      }, backdropFilter: ({ addDefaults: e, addUtilities: t }) => {
        e("backdrop-filter", { "--tw-backdrop-blur": " ", "--tw-backdrop-brightness": " ", "--tw-backdrop-contrast": " ", "--tw-backdrop-grayscale": " ", "--tw-backdrop-hue-rotate": " ", "--tw-backdrop-invert": " ", "--tw-backdrop-opacity": " ", "--tw-backdrop-saturate": " ", "--tw-backdrop-sepia": " " }), t({ ".backdrop-filter": { "@defaults backdrop-filter": {}, "-webkit-backdrop-filter": me3, "backdrop-filter": me3 }, ".backdrop-filter-none": { "-webkit-backdrop-filter": "none", "backdrop-filter": "none" } });
      }, transitionProperty: ({ matchUtilities: e, theme: t }) => {
        let r3 = t("transitionTimingFunction.DEFAULT"), n3 = t("transitionDuration.DEFAULT");
        e({ transition: (o7) => ({ "transition-property": o7, ...o7 === "none" ? {} : { "transition-timing-function": r3, "transition-duration": n3 } }) }, { values: t("transitionProperty") });
      }, transitionDelay: z5("transitionDelay", [["delay", ["transitionDelay"]]]), transitionDuration: z5("transitionDuration", [["duration", ["transitionDuration"]]], { filterDefault: true }), transitionTimingFunction: z5("transitionTimingFunction", [["ease", ["transitionTimingFunction"]]], { filterDefault: true }), willChange: z5("willChange", [["will-change", ["will-change"]]]), contain: ({ addDefaults: e, addUtilities: t }) => {
        let r3 = "var(--tw-contain-size) var(--tw-contain-layout) var(--tw-contain-paint) var(--tw-contain-style)";
        e("contain", { "--tw-contain-size": " ", "--tw-contain-layout": " ", "--tw-contain-paint": " ", "--tw-contain-style": " " }), t({ ".contain-none": { contain: "none" }, ".contain-content": { contain: "content" }, ".contain-strict": { contain: "strict" }, ".contain-size": { "@defaults contain": {}, "--tw-contain-size": "size", contain: r3 }, ".contain-inline-size": { "@defaults contain": {}, "--tw-contain-size": "inline-size", contain: r3 }, ".contain-layout": { "@defaults contain": {}, "--tw-contain-layout": "layout", contain: r3 }, ".contain-paint": { "@defaults contain": {}, "--tw-contain-paint": "paint", contain: r3 }, ".contain-style": { "@defaults contain": {}, "--tw-contain-style": "style", contain: r3 } });
      }, content: z5("content", [["content", ["--tw-content", ["content", "var(--tw-content)"]]]]), forcedColorAdjust: ({ addUtilities: e }) => {
        e({ ".forced-color-adjust-auto": { "forced-color-adjust": "auto" }, ".forced-color-adjust-none": { "forced-color-adjust": "none" } });
      } };
    });
    function $c(e) {
      if (e === void 0) return false;
      if (e === "true" || e === "1") return true;
      if (e === "false" || e === "0") return false;
      if (e === "*") return true;
      let t = e.split(",").map((r3) => r3.split(":")[0]);
      return t.includes("-tailwindcss") ? false : !!t.includes("tailwindcss");
    }
    var it2, na, oa, Sn, Cn, dt2, dr, pt2 = $3(() => {
      O7(), it2 = typeof je3 < "u" ? { NODE_ENV: "production", DEBUG: $c(je3.env.DEBUG) } : { NODE_ENV: "production", DEBUG: false }, na = /* @__PURE__ */ new Map(), oa = /* @__PURE__ */ new Map(), Sn = /* @__PURE__ */ new Map(), Cn = /* @__PURE__ */ new Map(), dt2 = new String("*"), dr = Symbol("__NONE__");
    });
    function An(e) {
      let t = [], r3 = false;
      for (let n3 = 0; n3 < e.length; n3++) {
        let o7 = e[n3];
        if (o7 === ":" && !r3 && t.length === 0) return false;
        if (sa.has(o7) && e[n3 - 1] !== "\\" && (r3 = !r3), !r3 && e[n3 - 1] !== "\\") {
          if (On.has(o7)) t.push(o7);
          else if (_n.has(o7)) {
            let s7 = _n.get(o7);
            if (t.length <= 0 || t.pop() !== s7) return false;
          }
        }
      }
      return !(t.length > 0);
    }
    var On, _n, sa, aa = $3(() => {
      O7(), On = /* @__PURE__ */ new Map([["{", "}"], ["[", "]"], ["(", ")"]]), _n = new Map(Array.from(On.entries()).map(([e, t]) => [t, e])), sa = /* @__PURE__ */ new Set(['"', "'", "`"]);
    });
    function En(e) {
      let [t] = ia(e);
      return t.forEach(([r3, n3]) => r3.removeChild(n3)), e.nodes.push(...t.map(([, r3]) => r3)), e;
    }
    function ia(e) {
      let t = [], r3 = null;
      for (let n3 of e.nodes) if (n3.type === "combinator") t = t.filter(([, o7]) => Tn(o7).includes("jumpable")), r3 = null;
      else if (n3.type === "pseudo") {
        Rc(n3) ? (r3 = n3, t.push([e, n3, null])) : r3 && Mc(n3, r3) ? t.push([e, n3, r3]) : r3 = null;
        for (let o7 of n3.nodes ?? []) {
          let [s7, a4] = ia(o7);
          r3 = a4 || r3, t.push(...s7);
        }
      }
      return [t, r3];
    }
    function la(e) {
      return e.value.startsWith("::") || pr[e.value] !== void 0;
    }
    function Rc(e) {
      return la(e) && Tn(e).includes("terminal");
    }
    function Mc(e, t) {
      return e.type !== "pseudo" || la(e) ? false : Tn(t).includes("actionable");
    }
    function Tn(e) {
      return pr[e.value] ?? pr.__default__;
    }
    var pr, In = $3(() => {
      O7(), pr = { "::after": ["terminal", "jumpable"], "::backdrop": ["terminal", "jumpable"], "::before": ["terminal", "jumpable"], "::cue": ["terminal"], "::cue-region": ["terminal"], "::first-letter": ["terminal", "jumpable"], "::first-line": ["terminal", "jumpable"], "::grammar-error": ["terminal"], "::marker": ["terminal", "jumpable"], "::part": ["terminal", "actionable"], "::placeholder": ["terminal", "jumpable"], "::selection": ["terminal", "jumpable"], "::slotted": ["terminal"], "::spelling-error": ["terminal"], "::target-text": ["terminal"], "::file-selector-button": ["terminal", "actionable"], "::deep": ["actionable"], "::v-deep": ["actionable"], "::ng-deep": ["actionable"], ":after": ["terminal", "jumpable"], ":before": ["terminal", "jumpable"], ":first-letter": ["terminal", "jumpable"], ":first-line": ["terminal", "jumpable"], ":where": [], ":is": [], ":has": [], __default__: ["terminal", "actionable"] };
    });
    function fr(e, { context: t, candidate: r3 }) {
      let n3 = t?.tailwindConfig.prefix ?? "", o7 = e.map((a4) => {
        let l3 = (0, Ye2.default)().astSync(a4.format);
        return { ...a4, ast: a4.respectPrefix ? hn(n3, l3) : l3 };
      }), s7 = Ye2.default.root({ nodes: [Ye2.default.selector({ nodes: [Ye2.default.className({ value: at2(r3) })] })] });
      for (let { ast: a4 } of o7) [s7, a4] = zc(s7, a4), a4.walkNesting((l3) => l3.replaceWith(...s7.nodes[0].nodes)), s7 = a4;
      return s7;
    }
    function ca(e) {
      let t = [];
      for (; e.prev() && e.prev().type !== "combinator"; ) e = e.prev();
      for (; e && e.type !== "combinator"; ) t.push(e), e = e.next();
      return t;
    }
    function Uc(e) {
      return e.sort((t, r3) => t.type === "tag" && r3.type === "class" ? -1 : t.type === "class" && r3.type === "tag" ? 1 : t.type === "class" && r3.type === "pseudo" && r3.value.startsWith("::") ? -1 : t.type === "pseudo" && t.value.startsWith("::") && r3.type === "class" ? 1 : e.index(t) - e.index(r3)), e;
    }
    function ua(e, t) {
      let r3 = false;
      e.walk((n3) => {
        if (n3.type === "class" && n3.value === t) return r3 = true, false;
      }), r3 || e.remove();
    }
    function da(e, t, { context: r3, candidate: n3, base: o7 }) {
      let s7 = r3?.tailwindConfig?.separator ?? ":";
      o7 = o7 ?? $e2(n3, s7).pop();
      let a4 = (0, Ye2.default)().astSync(e);
      if (a4.walkClasses((d6) => {
        d6.raws && d6.value.includes(o7) && (d6.raws.value = at2((0, pa.default)(d6.raws.value)));
      }), a4.each((d6) => ua(d6, o7)), a4.length === 0) return null;
      let l3 = Array.isArray(t) ? fr(t, { context: r3, candidate: n3 }) : t;
      if (l3 === null) return a4.toString();
      let c5 = Ye2.default.comment({ value: "/*__simple__*/" }), i4 = Ye2.default.comment({ value: "/*__simple__*/" });
      return a4.walkClasses((d6) => {
        if (d6.value !== o7) return;
        let u5 = d6.parent, p4 = l3.nodes[0].nodes;
        if (u5.nodes.length === 1) {
          d6.replaceWith(...p4);
          return;
        }
        let f6 = ca(d6);
        u5.insertBefore(f6[0], c5), u5.insertAfter(f6[f6.length - 1], i4);
        for (let h7 of p4) u5.insertBefore(f6[0], h7.clone());
        d6.remove(), f6 = ca(c5);
        let g6 = u5.index(c5);
        u5.nodes.splice(g6, f6.length, ...Uc(Ye2.default.selector({ nodes: f6 })).nodes), c5.remove(), i4.remove();
      }), a4.walkPseudos((d6) => {
        d6.value === hr && d6.replaceWith(d6.nodes);
      }), a4.each((d6) => En(d6)), a4.toString();
    }
    function zc(e, t) {
      let r3 = [];
      return e.walkPseudos((n3) => {
        n3.value === hr && r3.push({ pseudo: n3, value: n3.nodes[0].toString() });
      }), t.walkPseudos((n3) => {
        if (n3.value !== hr) return;
        let o7 = n3.nodes[0].toString(), s7 = r3.find((i4) => i4.value === o7);
        if (!s7) return;
        let a4 = [], l3 = n3.next();
        for (; l3 && l3.type !== "combinator"; ) a4.push(l3), l3 = l3.next();
        let c5 = l3;
        s7.pseudo.parent.insertAfter(s7.pseudo, Ye2.default.selector({ nodes: a4.map((i4) => i4.clone()) })), n3.remove(), a4.forEach((i4) => i4.remove()), c5 && c5.type === "combinator" && c5.remove();
      }), [e, t];
    }
    var Ye2, pa, hr, fa = $3(() => {
      O7(), Ye2 = he4(Ke3()), pa = he4(ln()), Ut2(), mn(), In(), xt2(), hr = ":merge";
    });
    function ha(e, t) {
      let r3 = (0, Pn.default)().astSync(e);
      return r3.each((n3) => {
        n3.nodes[0].type === "pseudo" && n3.nodes[0].value === ":is" && n3.nodes.every((o7) => o7.type !== "combinator") || (n3.nodes = [Pn.default.pseudo({ value: ":is", nodes: [n3.clone()] })]), En(n3);
      }), `${t} ${r3.toString()}`;
    }
    var Pn, ma = $3(() => {
      O7(), Pn = he4(Ke3()), In();
    });
    function ga(e) {
      return xa.transformSync(e);
    }
    function* Fc(e) {
      let t = 1 / 0;
      for (; t >= 0; ) {
        let r3, n3 = false;
        if (t === 1 / 0 && e.endsWith("]")) {
          let a4 = e.indexOf("[");
          e[a4 - 1] === "-" ? r3 = a4 - 1 : e[a4 - 1] === "/" ? (r3 = a4 - 1, n3 = true) : r3 = -1;
        } else t === 1 / 0 && e.includes("/") ? (r3 = e.lastIndexOf("/"), n3 = true) : r3 = e.lastIndexOf("-", t);
        if (r3 < 0) break;
        let o7 = e.slice(0, r3), s7 = e.slice(n3 ? r3 : r3 + 1);
        t = r3 - 1, !(o7 === "" || s7 === "/") && (yield [o7, s7]);
      }
    }
    function Lc(e, t) {
      if (e.length === 0 || t.tailwindConfig.prefix === "") return e;
      for (let r3 of e) {
        let [n3] = r3;
        if (n3.options.respectPrefix) {
          let o7 = fe3.root({ nodes: [r3[1].clone()] }), s7 = r3[1].raws.tailwind.classCandidate;
          o7.walkRules((a4) => {
            let l3 = s7.startsWith("-");
            a4.selector = hn(t.tailwindConfig.prefix, a4.selector, l3);
          }), r3[1] = o7.nodes[0];
        }
      }
      return e;
    }
    function Nc(e, t) {
      if (e.length === 0) return e;
      let r3 = [];
      function n3(o7) {
        return o7.parent && o7.parent.type === "atrule" && o7.parent.name === "keyframes";
      }
      for (let [o7, s7] of e) {
        let a4 = fe3.root({ nodes: [s7.clone()] });
        a4.walkRules((l3) => {
          if (n3(l3)) return;
          let c5 = (0, gr2.default)().astSync(l3.selector);
          c5.each((i4) => ua(i4, t)), il(c5, (i4) => i4 === t ? `!${i4}` : i4), l3.selector = c5.toString(), l3.walkDecls((i4) => i4.important = true);
        }), r3.push([{ ...o7, important: true }, a4.nodes[0]]);
      }
      return r3;
    }
    function Vc(e, t, r3) {
      if (t.length === 0) return t;
      let n3 = { modifier: null, value: dr };
      {
        let [o7, ...s7] = $e2(e, "/");
        if (s7.length > 1 && (o7 = o7 + "/" + s7.slice(0, -1).join("/"), s7 = s7.slice(-1)), s7.length && !r3.variantMap.has(e) && (e = o7, n3.modifier = s7[0], !De3(r3.tailwindConfig, "generalizedModifiers"))) return [];
      }
      if (e.endsWith("]") && !e.startsWith("[")) {
        let o7 = /(.)(-?)\[(.*)\]/g.exec(e);
        if (o7) {
          let [, s7, a4, l3] = o7;
          if (s7 === "@" && a4 === "-") return [];
          if (s7 !== "@" && a4 === "") return [];
          e = e.replace(`${a4}[${l3}]`, ""), n3.value = l3;
        }
      }
      if (Bn(e) && !r3.variantMap.has(e)) {
        let o7 = r3.offsets.recordVariant(e), s7 = oe3(e.slice(1, -1)), a4 = $e2(s7, ",");
        if (a4.length > 1) return [];
        if (!a4.every(Rn)) return [];
        let l3 = a4.map((c5, i4) => [r3.offsets.applyParallelOffset(o7, i4), yr(c5.trim())]);
        r3.variantMap.set(e, l3);
      }
      if (r3.variantMap.has(e)) {
        let o7 = Bn(e), s7 = r3.variantOptions.get(e)?.[ft2] ?? {}, a4 = r3.variantMap.get(e).slice(), l3 = [], c5 = !(o7 || s7.respectPrefix === false);
        for (let [i4, d6] of t) {
          if (i4.layer === "user") continue;
          let u5 = fe3.root({ nodes: [d6.clone()] });
          for (let [p4, f6, g6] of a4) {
            let h7 = function() {
              y9.raws.neededBackup || (y9.raws.neededBackup = true, y9.walkRules((w7) => w7.raws.originalSelector = w7.selector));
            }, m6 = function(w7) {
              return h7(), y9.each((b7) => {
                b7.type === "rule" && (b7.selectors = b7.selectors.map((C5) => w7({ get className() {
                  return ga(C5);
                }, selector: C5 })));
              }), y9;
            }, y9 = (g6 ?? u5).clone(), v6 = [], x5 = f6({ get container() {
              return h7(), y9;
            }, separator: r3.tailwindConfig.separator, modifySelectors: m6, wrap(w7) {
              let b7 = y9.nodes;
              y9.removeAll(), w7.append(b7), y9.append(w7);
            }, format(w7) {
              v6.push({ format: w7, respectPrefix: c5 });
            }, args: n3 });
            if (Array.isArray(x5)) {
              for (let [w7, b7] of x5.entries()) a4.push([r3.offsets.applyParallelOffset(p4, w7), b7, y9.clone()]);
              continue;
            }
            if (typeof x5 == "string" && v6.push({ format: x5, respectPrefix: c5 }), x5 === null) continue;
            y9.raws.neededBackup && (delete y9.raws.neededBackup, y9.walkRules((w7) => {
              let b7 = w7.raws.originalSelector;
              if (!b7 || (delete w7.raws.originalSelector, b7 === w7.selector)) return;
              let C5 = w7.selector, S6 = (0, gr2.default)((E6) => {
                E6.walkClasses((A7) => {
                  A7.value = `${e}${r3.tailwindConfig.separator}${A7.value}`;
                });
              }).processSync(b7);
              v6.push({ format: C5.replace(S6, "&"), respectPrefix: c5 }), w7.selector = b7;
            })), y9.nodes[0].raws.tailwind = { ...y9.nodes[0].raws.tailwind, parentLayer: i4.layer };
            let k5 = [{ ...i4, sort: r3.offsets.applyVariantOffset(i4.sort, p4, Object.assign(n3, r3.variantOptions.get(e))), collectedFormats: (i4.collectedFormats ?? []).concat(v6) }, y9.nodes[0]];
            l3.push(k5);
          }
        }
        return l3;
      }
      return [];
    }
    function jn(e, t, r3 = {}) {
      return !Le2(e) && !Array.isArray(e) ? [[e], r3] : Array.isArray(e) ? jn(e[0], t, e[1]) : (t.has(e) || t.set(e, fn(e)), [t.get(e), r3]);
    }
    function Wc(e) {
      return ka.test(e);
    }
    function qc(e) {
      if (!e.includes("://")) return false;
      try {
        let t = new URL(e);
        return t.scheme !== "" && t.host !== "";
      } catch {
        return false;
      }
    }
    function va(e) {
      let t = true;
      return e.walkDecls((r3) => {
        if (!ya(r3.prop, r3.value)) return t = false, false;
      }), t;
    }
    function ya(e, t) {
      if (qc(`${e}:${t}`)) return false;
      try {
        return fe3.parse(`a{${e}:${t}}`).toResult(), true;
      } catch {
        return false;
      }
    }
    function Gc(e, t) {
      let [, r3, n3] = e.match(/^\[([a-zA-Z0-9-_]+):(\S+)\]$/) ?? [];
      if (n3 === void 0 || !Wc(r3) || !An(n3)) return null;
      let o7 = oe3(n3, { property: r3 });
      return ya(r3, o7) ? [[{ sort: t.offsets.arbitraryProperty(e), layer: "utilities", options: { respectImportant: true } }, () => ({ [Ns(e)]: { [r3]: o7 } })]] : null;
    }
    function* Yc(e, t) {
      t.candidateRuleMap.has(e) && (yield [t.candidateRuleMap.get(e), "DEFAULT"]), yield* function* (l3) {
        l3 !== null && (yield [l3, "DEFAULT"]);
      }(Gc(e, t));
      let r3 = e, n3 = false, o7 = t.tailwindConfig.prefix, s7 = o7.length, a4 = r3.startsWith(o7) || r3.startsWith(`-${o7}`);
      r3[s7] === "-" && a4 && (n3 = true, r3 = o7 + r3.slice(s7 + 1)), n3 && t.candidateRuleMap.has(r3) && (yield [t.candidateRuleMap.get(r3), "-DEFAULT"]);
      for (let [l3, c5] of Fc(r3)) t.candidateRuleMap.has(l3) && (yield [t.candidateRuleMap.get(l3), n3 ? `-${c5}` : c5]);
    }
    function Hc(e, t) {
      return e === dt2 ? [dt2] : $e2(e, t);
    }
    function* Qc(e, t) {
      for (let r3 of e) r3[1].raws.tailwind = { ...r3[1].raws.tailwind, classCandidate: t, preserveSource: r3[0].options?.preserveSource ?? false }, yield r3;
    }
    function* ba(e, t) {
      let r3 = t.tailwindConfig.separator, [n3, ...o7] = Hc(e, r3).reverse(), s7 = false;
      n3.startsWith("!") && (s7 = true, n3 = n3.slice(1));
      for (let a4 of Yc(n3, t)) {
        let l3 = [], c5 = /* @__PURE__ */ new Map(), [i4, d6] = a4, u5 = i4.length === 1;
        for (let [p4, f6] of i4) {
          let g6 = [];
          if (typeof f6 == "function") for (let h7 of [].concat(f6(d6, { isOnlyPlugin: u5 }))) {
            let [m6, y9] = jn(h7, t.postCssNodeCache);
            for (let v6 of m6) g6.push([{ ...p4, options: { ...p4.options, ...y9 } }, v6]);
          }
          else if (d6 === "DEFAULT" || d6 === "-DEFAULT") {
            let h7 = f6, [m6, y9] = jn(h7, t.postCssNodeCache);
            for (let v6 of m6) g6.push([{ ...p4, options: { ...p4.options, ...y9 } }, v6]);
          }
          if (g6.length > 0) {
            let h7 = Array.from(Ko(p4.options?.types ?? [], d6, p4.options ?? {}, t.tailwindConfig)).map(([m6, y9]) => y9);
            h7.length > 0 && c5.set(g6, h7), l3.push(g6);
          }
        }
        if (Bn(d6)) {
          if (l3.length > 1) {
            let p4 = function(m6) {
              return m6.length === 1 ? m6[0] : m6.find((y9) => {
                let v6 = c5.get(y9);
                return y9.some(([{ options: x5 }, k5]) => va(k5) ? x5.types.some(({ type: w7, preferOnConflict: b7 }) => v6.includes(w7) && b7) : false);
              });
            }, [f6, g6] = l3.reduce((m6, y9) => (y9.some(([{ options: v6 }]) => v6.types.some(({ type: x5 }) => x5 === "any")) ? m6[0].push(y9) : m6[1].push(y9), m6), [[], []]), h7 = p4(g6) ?? p4(f6);
            if (h7) l3 = [h7];
            else {
              let m6 = l3.map((v6) => /* @__PURE__ */ new Set([...c5.get(v6) ?? []]));
              for (let v6 of m6) for (let x5 of v6) {
                let k5 = false;
                for (let w7 of m6) v6 !== w7 && w7.has(x5) && (w7.delete(x5), k5 = true);
                k5 && v6.delete(x5);
              }
              let y9 = [];
              for (let [v6, x5] of m6.entries()) for (let k5 of x5) {
                let w7 = l3[v6].map(([, b7]) => b7).flat().map((b7) => b7.toString().split(`
`).slice(1, -1).map((C5) => C5.trim()).map((C5) => `      ${C5}`).join(`
`)).join(`

`);
                y9.push(`  Use \`${e.replace("[", `[${k5}:`)}\` for \`${w7.trim()}\``);
                break;
              }
              de3.warn([`The class \`${e}\` is ambiguous and matches multiple utilities.`, ...y9, `If this is content and not a class, replace it with \`${e.replace("[", "&lsqb;").replace("]", "&rsqb;")}\` to silence this warning.`]);
              continue;
            }
          }
          l3 = l3.map((p4) => p4.filter((f6) => va(f6[1])));
        }
        l3 = l3.flat(), l3 = Array.from(Qc(l3, n3)), l3 = Lc(l3, t), s7 && (l3 = Nc(l3, n3));
        for (let p4 of o7) l3 = Vc(p4, l3, t);
        for (let p4 of l3) p4[1].raws.tailwind = { ...p4[1].raws.tailwind, candidate: e }, p4 = Jc(p4, { context: t, candidate: e }), p4 !== null && (yield p4);
      }
    }
    function Jc(e, { context: t, candidate: r3 }) {
      if (!e[0].collectedFormats) return e;
      let n3 = true, o7;
      try {
        o7 = fr(e[0].collectedFormats, { context: t, candidate: r3 });
      } catch {
        return null;
      }
      let s7 = fe3.root({ nodes: [e[1].clone()] });
      return s7.walkRules((a4) => {
        if (!mr2(a4)) try {
          let l3 = da(a4.selector, o7, { candidate: r3, context: t });
          if (l3 === null) {
            a4.remove();
            return;
          }
          a4.selector = l3;
        } catch {
          return n3 = false, false;
        }
      }), !n3 || s7.nodes.length === 0 ? null : (e[1] = s7.nodes[0], e);
    }
    function mr2(e) {
      return e.parent && e.parent.type === "atrule" && e.parent.name === "keyframes";
    }
    function Zc(e) {
      if (e === true) return (t) => {
        mr2(t) || t.walkDecls((r3) => {
          r3.parent.type === "rule" && !mr2(r3.parent) && (r3.important = true);
        });
      };
      if (typeof e == "string") return (t) => {
        mr2(t) || (t.selectors = t.selectors.map((r3) => ha(r3, e)));
      };
    }
    function wa(e, t, r3 = false) {
      let n3 = [], o7 = Zc(t.tailwindConfig.important);
      for (let s7 of e) {
        if (t.notClassCache.has(s7)) continue;
        if (t.candidateRuleCache.has(s7)) {
          n3 = n3.concat(Array.from(t.candidateRuleCache.get(s7)));
          continue;
        }
        let a4 = Array.from(ba(s7, t));
        if (a4.length === 0) {
          t.notClassCache.add(s7);
          continue;
        }
        t.classCache.set(s7, a4);
        let l3 = t.candidateRuleCache.get(s7) ?? /* @__PURE__ */ new Set();
        t.candidateRuleCache.set(s7, l3);
        for (let c5 of a4) {
          let [{ sort: i4, options: d6 }, u5] = c5;
          if (d6.respectImportant && o7) {
            let f6 = fe3.root({ nodes: [u5.clone()] });
            f6.walkRules(o7), u5 = f6.nodes[0];
          }
          let p4 = [i4, r3 ? u5.clone() : u5];
          l3.add(p4), t.ruleCache.add(p4), n3.push(p4);
        }
      }
      return n3;
    }
    function Bn(e) {
      return e.startsWith("[") && e.endsWith("]");
    }
    var gr2, xa, ka, Dn = $3(() => {
      O7(), ut3(), gr2 = he4(Ke3()), zs(), Bt(), mn(), Kt(), Ge2(), pt2(), fa(), Ws(), Qt(), kr(), aa(), xt2(), nt3(), ma(), xa = (0, gr2.default)((e) => e.first.filter(({ type: t }) => t === "class").pop().value), ka = /^[a-z_-]/;
    }), Sa, Xc = $3(() => {
      O7(), Sa = {};
    });
    function Kc(e) {
      try {
        return Sa.createHash("md5").update(e, "utf-8").digest("binary");
      } catch {
        return "";
      }
    }
    function eu2(e, t) {
      let r3 = t.toString();
      if (!r3.includes("@tailwind")) return false;
      let n3 = Cn.get(e), o7 = Kc(r3), s7 = n3 !== o7;
      return Cn.set(e, o7), s7;
    }
    var tu2 = $3(() => {
      O7(), Xc(), pt2();
    });
    function Ca2(e) {
      return (e > 0n) - (e < 0n);
    }
    var ru2 = $3(() => {
      O7();
    });
    function nu2(e, t) {
      let r3 = 0n, n3 = 0n;
      for (let [o7, s7] of t) e & o7 && (r3 = r3 | o7, n3 = n3 | s7);
      return e & ~r3 | n3;
    }
    var ou2 = $3(() => {
      O7();
    });
    function Aa(e) {
      let t = null;
      for (let r3 of e) t = t ?? r3, t = t > r3 ? t : r3;
      return t;
    }
    function su2(e, t) {
      let r3 = e.length, n3 = t.length, o7 = r3 < n3 ? r3 : n3;
      for (let s7 = 0; s7 < o7; s7++) {
        let a4 = e.charCodeAt(s7) - t.charCodeAt(s7);
        if (a4 !== 0) return a4;
      }
      return r3 - n3;
    }
    var Oa, au2 = $3(() => {
      O7(), ru2(), ou2(), Oa = class {
        constructor() {
          this.offsets = { defaults: 0n, base: 0n, components: 0n, utilities: 0n, variants: 0n, user: 0n }, this.layerPositions = { defaults: 0n, base: 1n, components: 2n, utilities: 3n, user: 4n, variants: 5n }, this.reservedVariantBits = 0n, this.variantOffsets = /* @__PURE__ */ new Map();
        }
        create(e) {
          return { layer: e, parentLayer: e, arbitrary: 0n, variants: 0n, parallelIndex: 0n, index: this.offsets[e]++, propertyOffset: 0n, property: "", options: [] };
        }
        arbitraryProperty(e) {
          return { ...this.create("utilities"), arbitrary: 1n, property: e };
        }
        forVariant(e, t = 0) {
          let r3 = this.variantOffsets.get(e);
          if (r3 === void 0) throw new Error(`Cannot find offset for unknown variant ${e}`);
          return { ...this.create("variants"), variants: r3 << BigInt(t) };
        }
        applyVariantOffset(e, t, r3) {
          return r3.variant = t.variants, { ...e, layer: "variants", parentLayer: e.layer === "variants" ? e.parentLayer : e.layer, variants: e.variants | t.variants, options: r3.sort ? [].concat(r3, e.options) : e.options, parallelIndex: Aa([e.parallelIndex, t.parallelIndex]) };
        }
        applyParallelOffset(e, t) {
          return { ...e, parallelIndex: BigInt(t) };
        }
        recordVariants(e, t) {
          for (let r3 of e) this.recordVariant(r3, t(r3));
        }
        recordVariant(e, t = 1) {
          return this.variantOffsets.set(e, 1n << this.reservedVariantBits), this.reservedVariantBits += BigInt(t), { ...this.create("variants"), variants: this.variantOffsets.get(e) };
        }
        compare(e, t) {
          if (e.layer !== t.layer) return this.layerPositions[e.layer] - this.layerPositions[t.layer];
          if (e.parentLayer !== t.parentLayer) return this.layerPositions[e.parentLayer] - this.layerPositions[t.parentLayer];
          for (let r3 of e.options) for (let n3 of t.options) {
            if (r3.id !== n3.id || !r3.sort || !n3.sort) continue;
            let o7 = Aa([r3.variant, n3.variant]) ?? 0n, s7 = ~(o7 | o7 - 1n), a4 = e.variants & s7, l3 = t.variants & s7;
            if (a4 !== l3) continue;
            let c5 = r3.sort({ value: r3.value, modifier: r3.modifier }, { value: n3.value, modifier: n3.modifier });
            if (c5 !== 0) return c5;
          }
          return e.variants !== t.variants ? e.variants - t.variants : e.parallelIndex !== t.parallelIndex ? e.parallelIndex - t.parallelIndex : e.arbitrary !== t.arbitrary ? e.arbitrary - t.arbitrary : e.propertyOffset !== t.propertyOffset ? e.propertyOffset - t.propertyOffset : e.index - t.index;
        }
        recalculateVariantOffsets() {
          let e = Array.from(this.variantOffsets.entries()).filter(([r3]) => r3.startsWith("[")).sort(([r3], [n3]) => su2(r3, n3)), t = e.map(([, r3]) => r3).sort((r3, n3) => Ca2(r3 - n3));
          return e.map(([, r3], n3) => [r3, t[n3]]).filter(([r3, n3]) => r3 !== n3);
        }
        remapArbitraryVariantOffsets(e) {
          let t = this.recalculateVariantOffsets();
          return t.length === 0 ? e : e.map((r3) => {
            let [n3, o7] = r3;
            return n3 = { ...n3, variants: nu2(n3.variants, t) }, [n3, o7];
          });
        }
        sortArbitraryProperties(e) {
          let t = /* @__PURE__ */ new Set();
          for (let [s7] of e) s7.arbitrary === 1n && t.add(s7.property);
          if (t.size === 0) return e;
          let r3 = Array.from(t).sort(), n3 = /* @__PURE__ */ new Map(), o7 = 1n;
          for (let s7 of r3) n3.set(s7, o7++);
          return e.map((s7) => {
            let [a4, l3] = s7;
            return a4 = { ...a4, propertyOffset: n3.get(a4.property) ?? 0n }, [a4, l3];
          });
        }
        sort(e) {
          return e = this.remapArbitraryVariantOffsets(e), e = this.sortArbitraryProperties(e), e.sort(([t], [r3]) => Ca2(this.compare(t, r3)));
        }
      };
    });
    function $n(e, t) {
      let r3 = e.tailwindConfig.prefix;
      return typeof r3 == "function" ? r3(t) : r3 + t;
    }
    function _a({ type: e = "any", ...t }) {
      let r3 = [].concat(e);
      return { ...t, types: r3.map((n3) => Array.isArray(n3) ? { type: n3[0], ...n3[1] } : { type: n3, preferOnConflict: false }) };
    }
    function iu2(e) {
      let t = [], r3 = "", n3 = 0;
      for (let o7 = 0; o7 < e.length; o7++) {
        let s7 = e[o7];
        if (s7 === "\\") r3 += "\\" + e[++o7];
        else if (s7 === "{") ++n3, t.push(r3.trim()), r3 = "";
        else if (s7 === "}") {
          if (--n3 < 0) throw new Error("Your { and } are unbalanced.");
          t.push(r3.trim()), r3 = "";
        } else r3 += s7;
      }
      return r3.length > 0 && t.push(r3.trim()), t = t.filter((o7) => o7 !== ""), t;
    }
    function lu2(e, t, { before: r3 = [] } = {}) {
      if (r3 = [].concat(r3), r3.length <= 0) {
        e.push(t);
        return;
      }
      let n3 = e.length - 1;
      for (let o7 of r3) {
        let s7 = e.indexOf(o7);
        s7 !== -1 && (n3 = Math.min(n3, s7));
      }
      e.splice(n3, 0, t);
    }
    function Ea(e) {
      return Array.isArray(e) ? e.flatMap((t) => !Array.isArray(t) && !Le2(t) ? t : fn(t)) : Ea([e]);
    }
    function cu2(e, t) {
      return (0, Un.default)((r3) => {
        let n3 = [];
        return t && t(r3), r3.walkClasses((o7) => {
          n3.push(o7.value);
        }), n3;
      }).transformSync(e);
    }
    function uu2(e) {
      e.walkPseudos((t) => {
        t.value === ":not" && t.remove();
      });
    }
    function du2(e, t = { containsNonOnDemandable: false }, r3 = 0) {
      let n3 = [], o7 = [];
      e.type === "rule" ? o7.push(...e.selectors) : e.type === "atrule" && e.walkRules((s7) => o7.push(...s7.selectors));
      for (let s7 of o7) {
        let a4 = cu2(s7, uu2);
        a4.length === 0 && (t.containsNonOnDemandable = true);
        for (let l3 of a4) n3.push(l3);
      }
      return r3 === 0 ? [t.containsNonOnDemandable || n3.length === 0, n3] : n3;
    }
    function vr(e) {
      return Ea(e).flatMap((t) => {
        let r3 = /* @__PURE__ */ new Map(), [n3, o7] = du2(t);
        return n3 && o7.unshift(dt2), o7.map((s7) => (r3.has(t) || r3.set(t, t), [s7, r3.get(t)]));
      });
    }
    function Rn(e) {
      return e.startsWith("@") || e.includes("&");
    }
    function yr(e) {
      e = e.replace(/\n+/g, "").replace(/\s{1,}/g, " ").trim();
      let t = iu2(e).map((r3) => {
        if (!r3.startsWith("@")) return ({ format: s7 }) => s7(r3);
        let [, n3, o7] = /@(\S*)( .+|[({].*)?/g.exec(r3);
        return ({ wrap: s7 }) => s7(fe3.atRule({ name: n3, params: o7?.trim() ?? "" }));
      }).reverse();
      return (r3) => {
        for (let n3 of t) n3(r3);
      };
    }
    function pu2(e, t, { variantList: r3, variantMap: n3, offsets: o7, classList: s7 }) {
      function a4(p4, f6) {
        return p4 ? (0, Ba2.default)(e, p4, f6) : e;
      }
      function l3(p4) {
        return hn(e.prefix, p4);
      }
      function c5(p4, f6) {
        return p4 === dt2 ? dt2 : f6.respectPrefix ? t.tailwindConfig.prefix + p4 : p4;
      }
      function i4(p4, f6, g6 = {}) {
        let h7 = Pt2(p4), m6 = a4(["theme", ...h7], f6);
        return ir2(h7[0])(m6, g6);
      }
      let d6 = 0, u5 = { postcss: fe3, prefix: l3, e: at2, config: a4, theme: i4, corePlugins: (p4) => Array.isArray(e.corePlugins) ? e.corePlugins.includes(p4) : a4(["corePlugins", p4], true), variants: () => [], addBase(p4) {
        for (let [f6, g6] of vr(p4)) {
          let h7 = c5(f6, {}), m6 = o7.create("base");
          t.candidateRuleMap.has(h7) || t.candidateRuleMap.set(h7, []), t.candidateRuleMap.get(h7).push([{ sort: m6, layer: "base" }, g6]);
        }
      }, addDefaults(p4, f6) {
        let g6 = { [`@defaults ${p4}`]: f6 };
        for (let [h7, m6] of vr(g6)) {
          let y9 = c5(h7, {});
          t.candidateRuleMap.has(y9) || t.candidateRuleMap.set(y9, []), t.candidateRuleMap.get(y9).push([{ sort: o7.create("defaults"), layer: "defaults" }, m6]);
        }
      }, addComponents(p4, f6) {
        f6 = Object.assign({}, { preserveSource: false, respectPrefix: true, respectImportant: false }, Array.isArray(f6) ? {} : f6);
        for (let [g6, h7] of vr(p4)) {
          let m6 = c5(g6, f6);
          s7.add(m6), t.candidateRuleMap.has(m6) || t.candidateRuleMap.set(m6, []), t.candidateRuleMap.get(m6).push([{ sort: o7.create("components"), layer: "components", options: f6 }, h7]);
        }
      }, addUtilities(p4, f6) {
        f6 = Object.assign({}, { preserveSource: false, respectPrefix: true, respectImportant: true }, Array.isArray(f6) ? {} : f6);
        for (let [g6, h7] of vr(p4)) {
          let m6 = c5(g6, f6);
          s7.add(m6), t.candidateRuleMap.has(m6) || t.candidateRuleMap.set(m6, []), t.candidateRuleMap.get(m6).push([{ sort: o7.create("utilities"), layer: "utilities", options: f6 }, h7]);
        }
      }, matchUtilities: function(p4, f6) {
        f6 = _a({ respectPrefix: true, respectImportant: true, modifiers: false, ...f6 });
        let g6 = o7.create("utilities");
        for (let h7 in p4) {
          let m6 = function(k5, { isOnlyPlugin: w7 }) {
            let [b7, C5, S6] = Xo(f6.types, k5, f6, e);
            if (b7 === void 0) return [];
            if (!f6.types.some(({ type: _6 }) => _6 === C5)) if (w7) de3.warn([`Unnecessary typehint \`${C5}\` in \`${h7}-${k5}\`.`, `You can safely update it to \`${h7}-${k5.replace(C5 + ":", "")}\`.`]);
            else return [];
            if (!An(b7)) return [];
            let E6 = { get modifier() {
              return f6.modifiers || de3.warn(`modifier-used-without-options-for-${h7}`, ["Your plugin must set `modifiers: true` in its options to support modifiers."]), S6;
            } }, A7 = De3(e, "generalizedModifiers");
            return [].concat(A7 ? v6(b7, E6) : v6(b7)).filter(Boolean).map((_6) => ({ [Vs(h7, k5)]: _6 }));
          }, y9 = c5(h7, f6), v6 = p4[h7];
          s7.add([y9, f6]);
          let x5 = [{ sort: g6, layer: "utilities", options: f6 }, m6];
          t.candidateRuleMap.has(y9) || t.candidateRuleMap.set(y9, []), t.candidateRuleMap.get(y9).push(x5);
        }
      }, matchComponents: function(p4, f6) {
        f6 = _a({ respectPrefix: true, respectImportant: false, modifiers: false, ...f6 });
        let g6 = o7.create("components");
        for (let h7 in p4) {
          let m6 = function(k5, { isOnlyPlugin: w7 }) {
            let [b7, C5, S6] = Xo(f6.types, k5, f6, e);
            if (b7 === void 0) return [];
            if (!f6.types.some(({ type: _6 }) => _6 === C5)) if (w7) de3.warn([`Unnecessary typehint \`${C5}\` in \`${h7}-${k5}\`.`, `You can safely update it to \`${h7}-${k5.replace(C5 + ":", "")}\`.`]);
            else return [];
            if (!An(b7)) return [];
            let E6 = { get modifier() {
              return f6.modifiers || de3.warn(`modifier-used-without-options-for-${h7}`, ["Your plugin must set `modifiers: true` in its options to support modifiers."]), S6;
            } }, A7 = De3(e, "generalizedModifiers");
            return [].concat(A7 ? v6(b7, E6) : v6(b7)).filter(Boolean).map((_6) => ({ [Vs(h7, k5)]: _6 }));
          }, y9 = c5(h7, f6), v6 = p4[h7];
          s7.add([y9, f6]);
          let x5 = [{ sort: g6, layer: "components", options: f6 }, m6];
          t.candidateRuleMap.has(y9) || t.candidateRuleMap.set(y9, []), t.candidateRuleMap.get(y9).push(x5);
        }
      }, addVariant(p4, f6, g6 = {}) {
        f6 = [].concat(f6).map((h7) => {
          if (typeof h7 != "string") return (m6 = {}) => {
            let { args: y9, modifySelectors: v6, container: x5, separator: k5, wrap: w7, format: b7 } = m6, C5 = h7(Object.assign({ modifySelectors: v6, container: x5, separator: k5 }, g6.type === br.MatchVariant && { args: y9, wrap: w7, format: b7 }));
            if (typeof C5 == "string" && !Rn(C5)) throw new Error(`Your custom variant \`${p4}\` has an invalid format string. Make sure it's an at-rule or contains a \`&\` placeholder.`);
            return Array.isArray(C5) ? C5.filter((S6) => typeof S6 == "string").map((S6) => yr(S6)) : C5 && typeof C5 == "string" && yr(C5)(m6);
          };
          if (!Rn(h7)) throw new Error(`Your custom variant \`${p4}\` has an invalid format string. Make sure it's an at-rule or contains a \`&\` placeholder.`);
          return yr(h7);
        }), lu2(r3, p4, g6), n3.set(p4, f6), t.variantOptions.set(p4, g6);
      }, matchVariant(p4, f6, g6) {
        let h7 = g6?.id ?? ++d6, m6 = p4 === "@", y9 = De3(e, "generalizedModifiers");
        for (let [x5, k5] of Object.entries(g6?.values ?? {})) x5 !== "DEFAULT" && u5.addVariant(m6 ? `${p4}${x5}` : `${p4}-${x5}`, ({ args: w7, container: b7 }) => f6(k5, y9 ? { modifier: w7?.modifier, container: b7 } : { container: b7 }), { ...g6, value: k5, id: h7, type: br.MatchVariant, variantInfo: wr2.Base });
        let v6 = "DEFAULT" in (g6?.values ?? {});
        u5.addVariant(p4, ({ args: x5, container: k5 }) => x5?.value === dr && !v6 ? null : f6(x5?.value === dr ? g6.values.DEFAULT : x5?.value ?? (typeof x5 == "string" ? x5 : ""), y9 ? { modifier: x5?.modifier, container: k5 } : { container: k5 }), { ...g6, id: h7, type: br.MatchVariant, variantInfo: wr2.Dynamic });
      } };
      return u5;
    }
    function Mn(e) {
      return xr.has(e) || xr.set(e, /* @__PURE__ */ new Map()), xr.get(e);
    }
    function Ta(e, t) {
      let r3 = false, n3 = /* @__PURE__ */ new Map();
      for (let o7 of e) {
        if (!o7) continue;
        let s7 = Xr.parse(o7), a4 = s7.hash ? s7.href.replace(s7.hash, "") : s7.href;
        a4 = s7.search ? a4.replace(s7.search, "") : a4;
        let l3 = Be4.statSync(decodeURIComponent(a4), { throwIfNoEntry: false })?.mtimeMs;
        !l3 || ((!t.has(o7) || l3 > t.get(o7)) && (r3 = true), n3.set(o7, l3));
      }
      return [r3, n3];
    }
    function Ia(e) {
      e.walkAtRules((t) => {
        ["responsive", "variants"].includes(t.name) && (Ia(t), t.before(t.nodes), t.remove());
      });
    }
    function fu2(e) {
      let t = [];
      return e.each((r3) => {
        r3.type === "atrule" && ["responsive", "variants"].includes(r3.name) && (r3.name = "layer", r3.params = "utilities");
      }), e.walkAtRules("layer", (r3) => {
        if (Ia(r3), r3.params === "base") {
          for (let n3 of r3.nodes) t.push(function({ addBase: o7 }) {
            o7(n3, { respectPrefix: false });
          });
          r3.remove();
        } else if (r3.params === "components") {
          for (let n3 of r3.nodes) t.push(function({ addComponents: o7 }) {
            o7(n3, { respectPrefix: false, preserveSource: true });
          });
          r3.remove();
        } else if (r3.params === "utilities") {
          for (let n3 of r3.nodes) t.push(function({ addUtilities: o7 }) {
            o7(n3, { respectPrefix: false, preserveSource: true });
          });
          r3.remove();
        }
      }), t;
    }
    function hu2(e, t) {
      let r3 = Object.entries({ ...ue3, ...ra }).map(([l3, c5]) => e.tailwindConfig.corePlugins.includes(l3) ? c5 : null).filter(Boolean), n3 = e.tailwindConfig.plugins.map((l3) => (l3.__isOptionsFunction && (l3 = l3()), typeof l3 == "function" ? l3 : l3.handler)), o7 = fu2(t), s7 = [ue3.childVariant, ue3.pseudoElementVariants, ue3.pseudoClassVariants, ue3.hasVariants, ue3.ariaVariants, ue3.dataVariants], a4 = [ue3.supportsVariants, ue3.reducedMotionVariants, ue3.prefersContrastVariants, ue3.screenVariants, ue3.orientationVariants, ue3.directionVariants, ue3.darkVariants, ue3.forcedColorsVariants, ue3.printVariant];
      return (e.tailwindConfig.darkMode === "class" || Array.isArray(e.tailwindConfig.darkMode) && e.tailwindConfig.darkMode[0] === "class") && (a4 = [ue3.supportsVariants, ue3.reducedMotionVariants, ue3.prefersContrastVariants, ue3.darkVariants, ue3.screenVariants, ue3.orientationVariants, ue3.directionVariants, ue3.forcedColorsVariants, ue3.printVariant]), [...r3, ...s7, ...n3, ...a4, ...o7];
    }
    function mu2(e, t) {
      let r3 = [], n3 = /* @__PURE__ */ new Map();
      t.variantMap = n3;
      let o7 = new Oa();
      t.offsets = o7;
      let s7 = /* @__PURE__ */ new Set(), a4 = pu2(t.tailwindConfig, t, { variantList: r3, variantMap: n3, offsets: o7, classList: s7 });
      for (let d6 of e) if (Array.isArray(d6)) for (let u5 of d6) u5(a4);
      else d6?.(a4);
      o7.recordVariants(r3, (d6) => n3.get(d6).length);
      for (let [d6, u5] of n3.entries()) t.variantMap.set(d6, u5.map((p4, f6) => [o7.forVariant(d6, f6), p4]));
      let l3 = (t.tailwindConfig.safelist ?? []).filter(Boolean);
      if (l3.length > 0) {
        let d6 = [];
        for (let u5 of l3) {
          if (typeof u5 == "string") {
            t.changedContent.push({ content: u5, extension: "html" });
            continue;
          }
          if (u5 instanceof RegExp) {
            de3.warn("root-regex", ["Regular expressions in `safelist` work differently in Tailwind CSS v3.0.", "Update your `safelist` configuration to eliminate this warning.", "https://tailwindcss.com/docs/content-configuration#safelisting-classes"]);
            continue;
          }
          d6.push(u5);
        }
        if (d6.length > 0) {
          let u5 = /* @__PURE__ */ new Map(), p4 = t.tailwindConfig.prefix.length, f6 = d6.some((g6) => g6.pattern.source.includes("!"));
          for (let g6 of s7) {
            let h7 = Array.isArray(g6) ? (() => {
              let [m6, y9] = g6, v6 = Object.keys(y9?.values ?? {}).map((x5) => cr(m6, x5));
              return y9?.supportsNegativeValues && (v6 = [...v6, ...v6.map((x5) => "-" + x5)], v6 = [...v6, ...v6.map((x5) => x5.slice(0, p4) + "-" + x5.slice(p4))]), y9.types.some(({ type: x5 }) => x5 === "color") && (v6 = [...v6, ...v6.flatMap((x5) => Object.keys(t.tailwindConfig.theme.opacity).map((k5) => `${x5}/${k5}`))]), f6 && y9?.respectImportant && (v6 = [...v6, ...v6.map((x5) => "!" + x5)]), v6;
            })() : [g6];
            for (let m6 of h7) for (let { pattern: y9, variants: v6 = [] } of d6) if (y9.lastIndex = 0, u5.has(y9) || u5.set(y9, 0), !!y9.test(m6)) {
              u5.set(y9, u5.get(y9) + 1), t.changedContent.push({ content: m6, extension: "html" });
              for (let x5 of v6) t.changedContent.push({ content: x5 + t.tailwindConfig.separator + m6, extension: "html" });
            }
          }
          for (let [g6, h7] of u5.entries()) h7 === 0 && de3.warn([`The safelist pattern \`${g6}\` doesn't match any Tailwind CSS classes.`, "Fix this pattern or remove it from your `safelist` configuration.", "https://tailwindcss.com/docs/content-configuration#safelisting-classes"]);
        }
      }
      let c5 = [].concat(t.tailwindConfig.darkMode ?? "media")[1] ?? "dark", i4 = [$n(t, c5), $n(t, "group"), $n(t, "peer")];
      t.getClassOrder = function(d6) {
        let u5 = [...d6].sort((h7, m6) => h7 === m6 ? 0 : h7 < m6 ? -1 : 1), p4 = new Map(u5.map((h7) => [h7, null])), f6 = wa(new Set(u5), t, true);
        f6 = t.offsets.sort(f6);
        let g6 = BigInt(i4.length);
        for (let [, h7] of f6) {
          let m6 = h7.raws.tailwind.candidate;
          p4.set(m6, p4.get(m6) ?? g6++);
        }
        return d6.map((h7) => {
          let m6 = p4.get(h7) ?? null, y9 = i4.indexOf(h7);
          return m6 === null && y9 !== -1 && (m6 = BigInt(y9)), [h7, m6];
        });
      }, t.getClassList = function(d6 = {}) {
        let u5 = [];
        for (let p4 of s7) if (Array.isArray(p4)) {
          let [f6, g6] = p4, h7 = [], m6 = Object.keys(g6?.modifiers ?? {});
          g6?.types?.some(({ type: x5 }) => x5 === "color") && m6.push(...Object.keys(t.tailwindConfig.theme.opacity ?? {}));
          let y9 = { modifiers: m6 }, v6 = d6.includeMetadata && m6.length > 0;
          for (let [x5, k5] of Object.entries(g6?.values ?? {})) {
            if (k5 == null) continue;
            let w7 = cr(f6, x5);
            if (u5.push(v6 ? [w7, y9] : w7), g6?.supportsNegativeValues && Yt(k5)) {
              let b7 = cr(f6, `-${x5}`);
              h7.push(v6 ? [b7, y9] : b7);
            }
          }
          u5.push(...h7);
        } else u5.push(p4);
        return u5;
      }, t.getVariants = function() {
        let d6 = Math.random().toString(36).substring(7).toUpperCase(), u5 = [];
        for (let [p4, f6] of t.variantOptions.entries()) f6.variantInfo !== wr2.Base && u5.push({ name: p4, isArbitrary: f6.type === Symbol.for("MATCH_VARIANT"), values: Object.keys(f6.values ?? {}), hasDash: p4 !== "@", selectors({ modifier: g6, value: h7 } = {}) {
          let m6 = `TAILWINDPLACEHOLDER${d6}`, y9 = fe3.rule({ selector: `.${m6}` }), v6 = fe3.root({ nodes: [y9.clone()] }), x5 = v6.toString(), k5 = (t.variantMap.get(p4) ?? []).flatMap(([D7, j5]) => j5), w7 = [];
          for (let D7 of k5) {
            let j5 = [], L4 = { args: { modifier: g6, value: f6.values?.[h7] ?? h7 }, separator: t.tailwindConfig.separator, modifySelectors(H4) {
              return v6.each((Q3) => {
                Q3.type === "rule" && (Q3.selectors = Q3.selectors.map((we3) => H4({ get className() {
                  return ga(we3);
                }, selector: we3 })));
              }), v6;
            }, format(H4) {
              j5.push(H4);
            }, wrap(H4) {
              j5.push(`@${H4.name} ${H4.params} { & }`);
            }, container: v6 }, F4 = D7(L4);
            if (j5.length > 0 && w7.push(j5), Array.isArray(F4)) for (let H4 of F4) j5 = [], H4(L4), w7.push(j5);
          }
          let b7 = [], C5 = v6.toString();
          x5 !== C5 && (v6.walkRules((D7) => {
            let j5 = D7.selector, L4 = (0, Un.default)((F4) => {
              F4.walkClasses((H4) => {
                H4.value = `${p4}${t.tailwindConfig.separator}${H4.value}`;
              });
            }).processSync(j5);
            b7.push(j5.replace(L4, "&").replace(m6, "&"));
          }), v6.walkAtRules((D7) => {
            b7.push(`@${D7.name} (${D7.params}) { & }`);
          }));
          let S6 = !(h7 in (f6.values ?? {})), E6 = f6[ft2] ?? {}, A7 = !(S6 || E6.respectPrefix === false);
          w7 = w7.map((D7) => D7.map((j5) => ({ format: j5, respectPrefix: A7 }))), b7 = b7.map((D7) => ({ format: D7, respectPrefix: A7 }));
          let _6 = { candidate: m6, context: t }, U4 = w7.map((D7) => da(`.${m6}`, fr(D7, _6), _6).replace(`.${m6}`, "&").replace("{ & }", "").trim());
          return b7.length > 0 && U4.push(fr(b7, _6).toString().replace(`.${m6}`, "&")), U4;
        } });
        return u5;
      };
    }
    function Pa(e, t) {
      !e.classCache.has(t) || (e.notClassCache.add(t), e.classCache.delete(t), e.applyClassCache.delete(t), e.candidateRuleMap.delete(t), e.candidateRuleCache.delete(t), e.stylesheetCache = null);
    }
    function gu2(e, t) {
      let r3 = t.raws.tailwind.candidate;
      if (r3) {
        for (let n3 of e.ruleCache) n3[1].raws.tailwind.candidate === r3 && e.ruleCache.delete(n3);
        Pa(e, r3);
      }
    }
    function ja2(e, t = [], r3 = fe3.root()) {
      let n3 = { disposables: [], ruleCache: /* @__PURE__ */ new Set(), candidateRuleCache: /* @__PURE__ */ new Map(), classCache: /* @__PURE__ */ new Map(), applyClassCache: /* @__PURE__ */ new Map(), notClassCache: new Set(e.blocklist ?? []), postCssNodeCache: /* @__PURE__ */ new Map(), candidateRuleMap: /* @__PURE__ */ new Map(), tailwindConfig: e, changedContent: t, variantMap: /* @__PURE__ */ new Map(), stylesheetCache: null, variantOptions: /* @__PURE__ */ new Map(), markInvalidUtilityCandidate: (s7) => Pa(n3, s7), markInvalidUtilityNode: (s7) => gu2(n3, s7) }, o7 = hu2(n3, r3);
      return mu2(o7, n3), n3;
    }
    function vu2(e, t, r3, n3, o7, s7) {
      let a4 = t.opts.from, l3 = n3 !== null;
      it2.DEBUG && console.log("Source path:", a4);
      let c5;
      if (l3 && ht2.has(a4)) c5 = ht2.get(a4);
      else if (At.has(o7)) {
        let p4 = At.get(o7);
        et2.get(p4).add(a4), ht2.set(a4, p4), c5 = p4;
      }
      let i4 = eu2(a4, e);
      if (c5) {
        let [p4, f6] = Ta([...s7], Mn(c5));
        if (!p4 && !i4) return [c5, false, f6];
      }
      if (ht2.has(a4)) {
        let p4 = ht2.get(a4);
        if (et2.has(p4) && (et2.get(p4).delete(a4), et2.get(p4).size === 0)) {
          et2.delete(p4);
          for (let [f6, g6] of At) g6 === p4 && At.delete(f6);
          for (let f6 of p4.disposables.splice(0)) f6(p4);
        }
      }
      it2.DEBUG && console.log("Setting up new context...");
      let d6 = ja2(r3, [], e);
      Object.assign(d6, { userConfigPath: n3 });
      let [, u5] = Ta([...s7], Mn(d6));
      return At.set(o7, d6), ht2.set(a4, d6), et2.has(d6) || et2.set(d6, /* @__PURE__ */ new Set()), et2.get(d6).add(a4), [d6, true, u5];
    }
    var Ba2, Un, ft2, br, wr2, xr, ht2, At, et2, kr = $3(() => {
      O7(), rt2(), ds(), ut3(), Ba2 = he4(ws()), Un = he4(Ke3()), lr(), zs(), mn(), Bt(), Ut2(), Ws(), Kt(), Dc(), pt2(), pt2(), Mr2(), Ge2(), jr(), aa(), Dn(), tu2(), au2(), nt3(), fa(), ft2 = Symbol(), br = { AddVariant: Symbol.for("ADD_VARIANT"), MatchVariant: Symbol.for("MATCH_VARIANT") }, wr2 = { Base: 1, Dynamic: 2 }, xr = /* @__PURE__ */ new WeakMap(), ht2 = na, At = oa, et2 = Sn;
    });
    function yu2(e) {
      return e.ignore ? [] : e.glob ? je3.env.ROLLUP_WATCH === "true" ? [{ type: "dependency", file: e.base }] : [{ type: "dir-dependency", dir: e.base, glob: e.glob }] : [{ type: "dependency", file: e.base }];
    }
    var bu = $3(() => {
      O7();
    });
    function Da(e, t) {
      return { handler: e, config: t };
    }
    var $a2, wu2 = $3(() => {
      O7(), Da.withOptions = function(e, t = () => ({})) {
        let r3 = function(n3) {
          return { __options: n3, handler: e(n3), config: t(n3) };
        };
        return r3.__isOptionsFunction = true, r3.__pluginFunction = e, r3.__configFunction = t, r3;
      }, $a2 = Da;
    }), zn = {};
    Fe2(zn, { default: () => Ra });
    var Ra, Ma = $3(() => {
      O7(), wu2(), Ra = $a2;
    }), xu = T7((e, t) => {
      O7();
      var r3 = (Ma(), zn).default, n3 = { overflow: "hidden", display: "-webkit-box", "-webkit-box-orient": "vertical" }, o7 = r3(function({ matchUtilities: s7, addUtilities: a4, theme: l3, variants: c5 }) {
        let i4 = l3("lineClamp");
        s7({ "line-clamp": (d6) => ({ ...n3, "-webkit-line-clamp": `${d6}` }) }, { values: i4 }), a4([{ ".line-clamp-none": { "-webkit-line-clamp": "unset" } }], c5("lineClamp"));
      }, { theme: { lineClamp: { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6" } }, variants: { lineClamp: ["responsive"] } });
      t.exports = o7;
    });
    function Ua2(e) {
      e.content.files.length === 0 && de3.warn("content-problems", ["The `content` option in your Tailwind CSS configuration is missing or empty.", "Configure your content sources or your generated CSS will be missing styles.", "https://tailwindcss.com/docs/content-configuration"]);
      try {
        let t = xu();
        e.plugins.includes(t) && (de3.warn("line-clamp-in-core", ["As of Tailwind CSS v3.3, the `@tailwindcss/line-clamp` plugin is now included by default.", "Remove it from the `plugins` array in your configuration to eliminate this warning."]), e.plugins = e.plugins.filter((r3) => r3 !== t));
      } catch {
      }
      return e;
    }
    var ku = $3(() => {
      O7(), Ge2();
    }), za2, Su2 = $3(() => {
      O7(), za2 = () => false;
    }), Sr, Cu = $3(() => {
      O7(), Sr = { sync: (e) => [].concat(e), generateTasks: (e) => [{ dynamic: false, base: ".", negative: [], positive: [].concat(e), patterns: [].concat(e) }], escapePath: (e) => e };
    }), Fn, Au = $3(() => {
      O7(), Fn = (e) => e;
    }), Fa, Ou2 = $3(() => {
      O7(), Fa = () => "";
    });
    function _u2(e) {
      let t = e, r3 = Fa(e);
      return r3 !== "." && (t = e.substr(r3.length), t.charAt(0) === "/" && (t = t.substr(1))), t.substr(0, 2) === "./" ? t = t.substr(2) : t.charAt(0) === "/" && (t = t.substr(1)), { base: r3, glob: t };
    }
    var Eu2 = $3(() => {
      O7(), Ou2();
    });
    function Tu2(e, t) {
      let r3 = t.content.files;
      r3 = r3.filter((l3) => typeof l3 == "string"), r3 = r3.map(Fn);
      let n3 = Sr.generateTasks(r3), o7 = [], s7 = [];
      for (let l3 of n3) o7.push(...l3.positive.map((c5) => La(c5, false))), s7.push(...l3.negative.map((c5) => La(c5, true)));
      let a4 = [...o7, ...s7];
      return a4 = Pu2(e, a4), a4 = a4.flatMap(ju), a4 = a4.map(Iu), a4;
    }
    function La(e, t) {
      let r3 = { original: e, base: e, ignore: t, pattern: e, glob: null };
      return za2(e) && Object.assign(r3, _u2(e)), r3;
    }
    function Iu(e) {
      let t = Fn(e.base);
      return t = Sr.escapePath(t), e.pattern = e.glob ? `${t}/${e.glob}` : t, e.pattern = e.ignore ? `!${e.pattern}` : e.pattern, e;
    }
    function Pu2(e, t) {
      let r3 = [];
      return e.userConfigPath && e.tailwindConfig.content.relative && (r3 = [xe2.dirname(e.userConfigPath)]), t.map((n3) => (n3.base = xe2.resolve(...r3, n3.base), n3));
    }
    function ju(e) {
      let t = [e];
      try {
        let r3 = Be4.realpathSync(e.base);
        r3 !== e.base && t.push({ ...e, base: r3 });
      } catch {
      }
      return t;
    }
    function Bu(e, t, r3) {
      let n3 = e.tailwindConfig.content.files.filter((a4) => typeof a4.raw == "string").map(({ raw: a4, extension: l3 = "html" }) => ({ content: a4, extension: l3 })), [o7, s7] = Du(t, r3);
      for (let a4 of o7) {
        let l3 = xe2.extname(a4).slice(1);
        n3.push({ file: a4, extension: l3 });
      }
      return [n3, s7];
    }
    function Du(e, t) {
      let r3 = e.map((a4) => a4.pattern), n3 = /* @__PURE__ */ new Map(), o7 = /* @__PURE__ */ new Set();
      it2.DEBUG && console.time("Finding changed files");
      let s7 = Sr.sync(r3, { absolute: true });
      for (let a4 of s7) {
        let l3 = t.get(a4) || -1 / 0, c5 = Be4.statSync(a4).mtimeMs;
        c5 > l3 && (o7.add(a4), n3.set(a4, c5));
      }
      return it2.DEBUG && console.timeEnd("Finding changed files"), [o7, n3];
    }
    var $u = $3(() => {
      O7(), rt2(), St(), Su2(), Cu(), Au(), Eu2(), pt2();
    });
    function Df() {
    }
    var Ru = $3(() => {
      O7();
    });
    function Mu(e, t) {
      for (let r3 of t) {
        let n3 = `${e}${r3}`;
        if (Be4.existsSync(n3) && Be4.statSync(n3).isFile()) return n3;
      }
      for (let r3 of t) {
        let n3 = `${e}/index${r3}`;
        if (Be4.existsSync(n3)) return n3;
      }
      return null;
    }
    function* Na(e, t, r3, n3 = xe2.extname(e)) {
      let o7 = Mu(xe2.resolve(t, e), Va2.includes(n3) ? Wa2 : qa);
      if (o7 === null || r3.has(o7)) return;
      r3.add(o7), yield o7, t = xe2.dirname(o7), n3 = xe2.extname(o7);
      let s7 = Be4.readFileSync(o7, "utf-8");
      for (let a4 of [...s7.matchAll(/import[\s\S]*?['"](.{3,}?)['"]/gi), ...s7.matchAll(/import[\s\S]*from[\s\S]*?['"](.{3,}?)['"]/gi), ...s7.matchAll(/require\(['"`](.+)['"`]\)/gi)]) !a4[1].startsWith(".") || (yield* Na(a4[1], t, r3, n3));
    }
    function Uu(e) {
      return e === null ? /* @__PURE__ */ new Set() : new Set(Na(e, xe2.dirname(e), /* @__PURE__ */ new Set()));
    }
    var Va2, Wa2, qa, zu = $3(() => {
      O7(), rt2(), St(), Va2 = [".js", ".cjs", ".mjs"], Wa2 = ["", ".js", ".cjs", ".mjs", ".ts", ".cts", ".mts", ".jsx", ".tsx"], qa = ["", ".ts", ".cts", ".mts", ".tsx", ".js", ".cjs", ".mjs", ".jsx"];
    });
    function Fu(e, t) {
      if (Cr2.has(e)) return Cr2.get(e);
      let r3 = Tu2(e, t);
      return Cr2.set(e, r3).get(e);
    }
    function Lu(e) {
      let t = Cl(e);
      if (t !== null) {
        let [n3, o7, s7, a4] = Ln.get(t) || [], l3 = Uu(t), c5 = false, i4 = /* @__PURE__ */ new Map();
        for (let p4 of l3) {
          let f6 = Be4.statSync(p4).mtimeMs;
          i4.set(p4, f6), (!a4 || !a4.has(p4) || f6 > a4.get(p4)) && (c5 = true);
        }
        if (!c5) return [n3, t, o7, s7];
        for (let p4 of l3) delete $i.cache[p4];
        let d6 = Ua2(Zr(void 0)), u5 = bo(d6);
        return Ln.set(t, [d6, u5, l3, i4]), [d6, t, u5, l3];
      }
      let r3 = Zr(e?.config ?? e ?? {});
      return r3 = Ua2(r3), [r3, null, bo(r3), []];
    }
    function Nu(e) {
      return ({ tailwindDirectives: t, registerDependency: r3 }) => (n3, o7) => {
        let [s7, a4, l3, c5] = Lu(e), i4 = new Set(c5);
        if (t.size > 0) {
          i4.add(o7.opts.from);
          for (let g6 of o7.messages) g6.type === "dependency" && i4.add(g6.file);
        }
        let [d6, , u5] = vu2(n3, o7, s7, a4, l3, i4), p4 = Mn(d6), f6 = Fu(d6, s7);
        if (t.size > 0) {
          for (let m6 of f6) for (let y9 of yu2(m6)) r3(y9);
          let [g6, h7] = Bu(d6, f6, p4);
          for (let m6 of g6) d6.changedContent.push(m6);
          for (let [m6, y9] of h7.entries()) u5.set(m6, y9);
        }
        for (let g6 of c5) r3({ type: "dependency", file: g6 });
        for (let [g6, h7] of u5.entries()) p4.set(g6, h7);
        return d6;
      };
    }
    var Ga2, Ln, Cr2, Vu = $3(() => {
      O7(), rt2(), Ga2 = he4(vo()), Ui(), as(), Ol(), kr(), bu(), ku(), $u(), Ru(), zu(), Ln = new Ga2.default({ maxSize: 100 }), Cr2 = /* @__PURE__ */ new WeakMap();
    });
    function Wu(e) {
      let t = /* @__PURE__ */ new Set(), r3 = /* @__PURE__ */ new Set(), n3 = /* @__PURE__ */ new Set();
      if (e.walkAtRules((o7) => {
        o7.name === "apply" && n3.add(o7), o7.name === "import" && (o7.params === '"tailwindcss/base"' || o7.params === "'tailwindcss/base'" ? (o7.name = "tailwind", o7.params = "base") : o7.params === '"tailwindcss/components"' || o7.params === "'tailwindcss/components'" ? (o7.name = "tailwind", o7.params = "components") : o7.params === '"tailwindcss/utilities"' || o7.params === "'tailwindcss/utilities'" ? (o7.name = "tailwind", o7.params = "utilities") : (o7.params === '"tailwindcss/screens"' || o7.params === "'tailwindcss/screens'" || o7.params === '"tailwindcss/variants"' || o7.params === "'tailwindcss/variants'") && (o7.name = "tailwind", o7.params = "variants")), o7.name === "tailwind" && (o7.params === "screens" && (o7.params = "variants"), t.add(o7.params)), ["layer", "responsive", "variants"].includes(o7.name) && (["responsive", "variants"].includes(o7.name) && de3.warn(`${o7.name}-at-rule-deprecated`, [`The \`@${o7.name}\` directive has been deprecated in Tailwind CSS v3.0.`, "Use `@layer utilities` or `@layer components` instead.", "https://tailwindcss.com/docs/upgrade-guide#replace-variants-with-layer"]), r3.add(o7));
      }), !t.has("base") || !t.has("components") || !t.has("utilities")) {
        for (let o7 of r3) if (o7.name === "layer" && ["base", "components", "utilities"].includes(o7.params)) {
          if (!t.has(o7.params)) throw o7.error(`\`@layer ${o7.params}\` is used but no matching \`@tailwind ${o7.params}\` directive is present.`);
        } else if (o7.name === "responsive") {
          if (!t.has("utilities")) throw o7.error("`@responsive` is used but `@tailwind utilities` is missing.");
        } else if (o7.name === "variants" && !t.has("utilities")) throw o7.error("`@variants` is used but `@tailwind utilities` is missing.");
      }
      return { tailwindDirectives: t, applyDirectives: n3 };
    }
    var qu = $3(() => {
      O7(), Ge2();
    });
    function Ft(e, t = void 0, r3 = void 0) {
      return e.map((n3) => {
        let o7 = n3.clone();
        return r3 !== void 0 && (o7.raws.tailwind = { ...o7.raws.tailwind, ...r3 }), t !== void 0 && Ya2(o7, (s7) => {
          if (s7.raws.tailwind?.preserveSource === true && s7.source) return false;
          s7.source = t;
        }), o7;
      });
    }
    function Ya2(e, t) {
      t(e) !== false && e.each?.((r3) => Ya2(r3, t));
    }
    var Gu = $3(() => {
      O7();
    });
    function Nn(e) {
      return e = Array.isArray(e) ? e : [e], e = e.map((t) => t instanceof RegExp ? t.source : t), e.join("");
    }
    function Ue2(e) {
      return new RegExp(Nn(e), "g");
    }
    function mt3(e) {
      return `(?:${e.map(Nn).join("|")})`;
    }
    function Ha2(e) {
      return `(?:${Nn(e)})?`;
    }
    function Yu(e) {
      return e && Qa2.test(e) ? e.replace(Vn, "\\$&") : e || "";
    }
    var Vn, Qa2, Hu = $3(() => {
      O7(), Vn = /[\\^$.*+?()[\]{}|]/g, Qa2 = RegExp(Vn.source);
    });
    function Qu(e) {
      let t = Array.from(Ju(e));
      return (r3) => {
        let n3 = [];
        for (let o7 of t) for (let s7 of r3.match(o7) ?? []) n3.push(Zu(s7));
        for (let o7 of n3.slice()) {
          let s7 = $e2(o7, ".");
          for (let a4 = 0; a4 < s7.length; a4++) {
            let l3 = s7[a4];
            if (a4 >= s7.length - 1) {
              n3.push(l3);
              continue;
            }
            let c5 = parseInt(s7[a4 + 1]);
            isNaN(c5) ? n3.push(l3) : a4++;
          }
        }
        return n3;
      };
    }
    function* Ju(e) {
      let t = e.tailwindConfig.separator, r3 = e.tailwindConfig.prefix !== "" ? Ha2(Ue2([/-?/, Yu(e.tailwindConfig.prefix)])) : "", n3 = mt3([/\[[^\s:'"`]+:[^\s\[\]]+\]/, /\[[^\s:'"`\]]+:[^\s]+?\[[^\s]+\][^\s]+?\]/, Ue2([mt3([/-?(?:\w+)/, /@(?:\w+)/]), Ha2(mt3([Ue2([mt3([/-(?:\w+-)*\['[^\s]+'\]/, /-(?:\w+-)*\["[^\s]+"\]/, /-(?:\w+-)*\[`[^\s]+`\]/, /-(?:\w+-)*\[(?:[^\s\[\]]+\[[^\s\[\]]+\])*[^\s:\[\]]+\]/]), /(?![{([]])/, /(?:\/[^\s'"`\\><$]*)?/]), Ue2([mt3([/-(?:\w+-)*\['[^\s]+'\]/, /-(?:\w+-)*\["[^\s]+"\]/, /-(?:\w+-)*\[`[^\s]+`\]/, /-(?:\w+-)*\[(?:[^\s\[\]]+\[[^\s\[\]]+\])*[^\s\[\]]+\]/]), /(?![{([]])/, /(?:\/[^\s'"`\\$]*)?/]), /[-\/][^\s'"`\\$={><]*/]))])]), o7 = [mt3([Ue2([/@\[[^\s"'`]+\](\/[^\s"'`]+)?/, t]), Ue2([/([^\s"'`\[\\]+-)?\[[^\s"'`]+\]\/[\w_-]+/, t]), Ue2([/([^\s"'`\[\\]+-)?\[[^\s"'`]+\]/, t]), Ue2([/[^\s"'`\[\\]+/, t])]), mt3([Ue2([/([^\s"'`\[\\]+-)?\[[^\s`]+\]\/[\w_-]+/, t]), Ue2([/([^\s"'`\[\\]+-)?\[[^\s`]+\]/, t]), Ue2([/[^\s`\[\\]+/, t])])];
      for (let s7 of o7) yield Ue2(["((?=((", s7, ")+))\\2)?", /!?/, r3, n3]);
    }
    function Zu(e) {
      if (!e.includes("-[")) return e;
      let t = 0, r3 = [], n3 = e.matchAll(Ja2);
      n3 = Array.from(n3).flatMap((o7) => {
        let [, ...s7] = o7;
        return s7.map((a4, l3) => Object.assign([], o7, { index: o7.index + l3, 0: a4 }));
      });
      for (let o7 of n3) {
        let s7 = o7[0], a4 = r3[r3.length - 1];
        if (s7 === a4 ? r3.pop() : (s7 === "'" || s7 === '"' || s7 === "`") && r3.push(s7), !a4) {
          if (s7 === "[") {
            t++;
            continue;
          } else if (s7 === "]") {
            t--;
            continue;
          }
          if (t < 0) return e.substring(0, o7.index - 1);
          if (t === 0 && !Za2.test(s7)) return e.substring(0, o7.index);
        }
      }
      return e;
    }
    var Ja2, Za2, Xu = $3(() => {
      O7(), Hu(), xt2(), Ja2 = /([\[\]'"`])([^\[\]'"`])?/g, Za2 = /[^"'`\s<>\]]+/;
    });
    function Ku(e, t) {
      let r3 = e.tailwindConfig.content.extract;
      return r3[t] || r3.DEFAULT || Wn[t] || Wn.DEFAULT(e);
    }
    function ed(e, t) {
      let r3 = e.content.transform;
      return r3[t] || r3.DEFAULT || qn[t] || qn.DEFAULT;
    }
    function td(e, t, r3, n3) {
      Ot.has(t) || Ot.set(t, new Xa2.default({ maxSize: 25e3 }));
      for (let o7 of e.split(`
`)) if (o7 = o7.trim(), !n3.has(o7)) if (n3.add(o7), Ot.get(t).has(o7)) for (let s7 of Ot.get(t).get(o7)) r3.add(s7);
      else {
        let s7 = t(o7).filter((l3) => l3 !== "!*"), a4 = new Set(s7);
        for (let l3 of a4) r3.add(l3);
        Ot.get(t).set(o7, a4);
      }
    }
    function rd(e, t) {
      let r3 = t.offsets.sort(e), n3 = { base: /* @__PURE__ */ new Set(), defaults: /* @__PURE__ */ new Set(), components: /* @__PURE__ */ new Set(), utilities: /* @__PURE__ */ new Set(), variants: /* @__PURE__ */ new Set() };
      for (let [o7, s7] of r3) n3[o7.layer].add(s7);
      return n3;
    }
    function nd(e) {
      return async (t) => {
        let r3 = { base: null, components: null, utilities: null, variants: null };
        if (t.walkAtRules((m6) => {
          m6.name === "tailwind" && Object.keys(r3).includes(m6.params) && (r3[m6.params] = m6);
        }), Object.values(r3).every((m6) => m6 === null)) return t;
        let n3 = /* @__PURE__ */ new Set([...e.candidates ?? [], dt2]), o7 = /* @__PURE__ */ new Set();
        He2.DEBUG && console.time("Reading changed files");
        let s7 = [];
        for (let m6 of e.changedContent) {
          let y9 = ed(e.tailwindConfig, m6.extension), v6 = Ku(e, m6.extension);
          s7.push([m6, { transformer: y9, extractor: v6 }]);
        }
        let a4 = 500;
        for (let m6 = 0; m6 < s7.length; m6 += a4) {
          let y9 = s7.slice(m6, m6 + a4);
          await Promise.all(y9.map(async ([{ file: v6, content: x5 }, { transformer: k5, extractor: w7 }]) => {
            x5 = v6 ? await Be4.promises.readFile(v6, "utf8") : x5, td(k5(x5), w7, n3, o7);
          }));
        }
        He2.DEBUG && console.timeEnd("Reading changed files");
        let l3 = e.classCache.size;
        He2.DEBUG && console.time("Generate rules"), He2.DEBUG && console.time("Sorting candidates");
        let c5 = new Set([...n3].sort((m6, y9) => m6 === y9 ? 0 : m6 < y9 ? -1 : 1));
        He2.DEBUG && console.timeEnd("Sorting candidates"), wa(c5, e), He2.DEBUG && console.timeEnd("Generate rules"), He2.DEBUG && console.time("Build stylesheet"), (e.stylesheetCache === null || e.classCache.size !== l3) && (e.stylesheetCache = rd([...e.ruleCache], e)), He2.DEBUG && console.timeEnd("Build stylesheet");
        let { defaults: i4, base: d6, components: u5, utilities: p4, variants: f6 } = e.stylesheetCache;
        r3.base && (r3.base.before(Ft([...d6, ...i4], r3.base.source, { layer: "base" })), r3.base.remove()), r3.components && (r3.components.before(Ft([...u5], r3.components.source, { layer: "components" })), r3.components.remove()), r3.utilities && (r3.utilities.before(Ft([...p4], r3.utilities.source, { layer: "utilities" })), r3.utilities.remove());
        let g6 = Array.from(f6).filter((m6) => {
          let y9 = m6.raws.tailwind?.parentLayer;
          return y9 === "components" ? r3.components !== null : y9 === "utilities" ? r3.utilities !== null : true;
        });
        r3.variants ? (r3.variants.before(Ft(g6, r3.variants.source, { layer: "variants" })), r3.variants.remove()) : g6.length > 0 && t.append(Ft(g6, t.source, { layer: "variants" })), t.source.end = t.source.end ?? t.source.start;
        let h7 = g6.some((m6) => m6.raws.tailwind?.parentLayer === "utilities");
        r3.utilities && p4.size === 0 && !h7 && de3.warn("content-problems", ["No utility classes were detected in your source files. If this is unexpected, double-check the `content` option in your Tailwind CSS configuration.", "https://tailwindcss.com/docs/content-configuration"]), He2.DEBUG && (console.log("Potential classes: ", n3.size), console.log("Active contexts: ", Sn.size)), e.changedContent = [], t.walkAtRules("layer", (m6) => {
          Object.keys(r3).includes(m6.params) && m6.remove();
        });
      };
    }
    var Xa2, He2, Wn, qn, Ot, od = $3(() => {
      O7(), rt2(), Xa2 = he4(vo()), pt2(), Dn(), Ge2(), Gu(), Xu(), He2 = it2, Wn = { DEFAULT: Qu }, qn = { DEFAULT: (e) => e, svelte: (e) => e.replace(/(?:^|\s)class:/g, " ") }, Ot = /* @__PURE__ */ new WeakMap();
    });
    function Ar(e) {
      let t = /* @__PURE__ */ new Map();
      fe3.root({ nodes: [e.clone()] }).walkRules((o7) => {
        (0, Or.default)((s7) => {
          s7.walkClasses((a4) => {
            let l3 = a4.parent.toString(), c5 = t.get(l3);
            c5 || t.set(l3, c5 = /* @__PURE__ */ new Set()), c5.add(a4.value);
          });
        }).processSync(o7.selector);
      });
      let r3 = Array.from(t.values(), (o7) => Array.from(o7)), n3 = r3.flat();
      return Object.assign(n3, { groups: r3 });
    }
    function Gn(e) {
      return oi.astSync(e);
    }
    function Ka2(e, t) {
      let r3 = /* @__PURE__ */ new Set();
      for (let n3 of e) r3.add(n3.split(t).pop());
      return Array.from(r3);
    }
    function ei(e, t) {
      let r3 = e.tailwindConfig.prefix;
      return typeof r3 == "function" ? r3(t) : r3 + t;
    }
    function* ti(e) {
      for (yield e; e.parent; ) yield e.parent, e = e.parent;
    }
    function sd(e, t = {}) {
      let r3 = e.nodes;
      e.nodes = [];
      let n3 = e.clone(t);
      return e.nodes = r3, n3;
    }
    function ad(e) {
      for (let t of ti(e)) if (e !== t) {
        if (t.type === "root") break;
        e = sd(t, { nodes: [e] });
      }
      return e;
    }
    function id(e, t) {
      let r3 = /* @__PURE__ */ new Map();
      return e.walkRules((n3) => {
        for (let a4 of ti(n3)) if (a4.raws.tailwind?.layer !== void 0) return;
        let o7 = ad(n3), s7 = t.offsets.create("user");
        for (let a4 of Ar(n3)) {
          let l3 = r3.get(a4) || [];
          r3.set(a4, l3), l3.push([{ layer: "user", sort: s7, important: false }, o7]);
        }
      }), r3;
    }
    function ld(e, t) {
      for (let r3 of e) {
        if (t.notClassCache.has(r3) || t.applyClassCache.has(r3)) continue;
        if (t.classCache.has(r3)) {
          t.applyClassCache.set(r3, t.classCache.get(r3).map(([o7, s7]) => [o7, s7.clone()]));
          continue;
        }
        let n3 = Array.from(ba(r3, t));
        if (n3.length === 0) {
          t.notClassCache.add(r3);
          continue;
        }
        t.applyClassCache.set(r3, n3);
      }
      return t.applyClassCache;
    }
    function cd(e) {
      let t = null;
      return { get: (r3) => (t = t || e(), t.get(r3)), has: (r3) => (t = t || e(), t.has(r3)) };
    }
    function ud(e) {
      return { get: (t) => e.flatMap((r3) => r3.get(t) || []), has: (t) => e.some((r3) => r3.has(t)) };
    }
    function ri(e) {
      let t = e.split(/[\s\t\n]+/g);
      return t[t.length - 1] === "!important" ? [t.slice(0, -1), true] : [t, false];
    }
    function ni(e, t, r3) {
      let n3 = /* @__PURE__ */ new Set(), o7 = [];
      if (e.walkAtRules("apply", (c5) => {
        let [i4] = ri(c5.params);
        for (let d6 of i4) n3.add(d6);
        o7.push(c5);
      }), o7.length === 0) return;
      let s7 = ud([r3, ld(n3, t)]);
      function a4(c5, i4, d6) {
        let u5 = Gn(c5), p4 = Gn(i4), f6 = Gn(`.${at2(d6)}`).nodes[0].nodes[0];
        return u5.each((g6) => {
          let h7 = /* @__PURE__ */ new Set();
          p4.each((m6) => {
            let y9 = false;
            m6 = m6.clone(), m6.walkClasses((v6) => {
              v6.value === f6.value && (y9 || (v6.replaceWith(...g6.nodes.map((x5) => x5.clone())), h7.add(m6), y9 = true));
            });
          });
          for (let m6 of h7) {
            let y9 = [[]];
            for (let v6 of m6.nodes) v6.type === "combinator" ? (y9.push(v6), y9.push([])) : y9[y9.length - 1].push(v6);
            m6.nodes = [];
            for (let v6 of y9) Array.isArray(v6) && v6.sort((x5, k5) => x5.type === "tag" && k5.type === "class" ? -1 : x5.type === "class" && k5.type === "tag" ? 1 : x5.type === "class" && k5.type === "pseudo" && k5.value.startsWith("::") ? -1 : x5.type === "pseudo" && x5.value.startsWith("::") && k5.type === "class" ? 1 : 0), m6.nodes = m6.nodes.concat(v6);
          }
          g6.replaceWith(...h7);
        }), u5.toString();
      }
      let l3 = /* @__PURE__ */ new Map();
      for (let c5 of o7) {
        let [i4] = l3.get(c5.parent) || [[], c5.source];
        l3.set(c5.parent, [i4, c5.source]);
        let [d6, u5] = ri(c5.params);
        if (c5.parent.type === "atrule") {
          if (c5.parent.name === "screen") {
            let p4 = c5.parent.params;
            throw c5.error(`@apply is not supported within nested at-rules like @screen. We suggest you write this as @apply ${d6.map((f6) => `${p4}:${f6}`).join(" ")} instead.`);
          }
          throw c5.error(`@apply is not supported within nested at-rules like @${c5.parent.name}. You can fix this by un-nesting @${c5.parent.name}.`);
        }
        for (let p4 of d6) {
          if ([ei(t, "group"), ei(t, "peer")].includes(p4)) throw c5.error(`@apply should not be used with the '${p4}' utility`);
          if (!s7.has(p4)) throw c5.error(`The \`${p4}\` class does not exist. If \`${p4}\` is a custom class, make sure it is defined within a \`@layer\` directive.`);
          let f6 = s7.get(p4);
          for (let [, g6] of f6) g6.type !== "atrule" && g6.walkRules(() => {
            throw c5.error([`The \`${p4}\` class cannot be used with \`@apply\` because \`@apply\` does not currently support nested CSS.`, "Rewrite the selector without nesting or configure the `tailwindcss/nesting` plugin:", "https://tailwindcss.com/docs/using-with-preprocessors#nesting"].join(`
`));
          });
          i4.push([p4, u5, f6]);
        }
      }
      for (let [c5, [i4, d6]] of l3) {
        let u5 = [];
        for (let [f6, g6, h7] of i4) {
          let m6 = [f6, ...Ka2([f6], t.tailwindConfig.separator)];
          for (let [y9, v6] of h7) {
            let x5 = Ar(c5), k5 = Ar(v6);
            if (k5 = k5.groups.filter((b7) => b7.some((C5) => m6.includes(C5))).flat(), k5 = k5.concat(Ka2(k5, t.tailwindConfig.separator)), x5.some((b7) => k5.includes(b7))) throw v6.error(`You cannot \`@apply\` the \`${f6}\` utility here because it creates a circular dependency.`);
            let w7 = fe3.root({ nodes: [v6.clone()] });
            w7.walk((b7) => {
              b7.source = d6;
            }), (v6.type !== "atrule" || v6.type === "atrule" && v6.name !== "keyframes") && w7.walkRules((b7) => {
              if (!Ar(b7).some((A7) => A7 === f6)) {
                b7.remove();
                return;
              }
              let C5 = typeof t.tailwindConfig.important == "string" ? t.tailwindConfig.important : null, S6 = c5.raws.tailwind !== void 0 && C5 && c5.selector.indexOf(C5) === 0 ? c5.selector.slice(C5.length) : c5.selector;
              S6 === "" && (S6 = c5.selector), b7.selector = a4(S6, b7.selector, f6), C5 && S6 !== c5.selector && (b7.selector = ha(b7.selector, C5)), b7.walkDecls((A7) => {
                A7.important = y9.important || g6;
              });
              let E6 = (0, Or.default)().astSync(b7.selector);
              E6.each((A7) => En(A7)), b7.selector = E6.toString();
            }), w7.nodes[0] && u5.push([y9.sort, w7.nodes[0]]);
          }
        }
        let p4 = t.offsets.sort(u5).map((f6) => f6[1]);
        c5.after(p4);
      }
      for (let c5 of o7) c5.parent.nodes.length > 1 ? c5.remove() : c5.parent.remove();
      ni(e, t, r3);
    }
    function dd(e) {
      return (t) => {
        let r3 = cd(() => id(t, e));
        ni(t, e, r3);
      };
    }
    var Or, oi, pd = $3(() => {
      O7(), ut3(), Or = he4(Ke3()), Dn(), Ut2(), ma(), In(), oi = (0, Or.default)();
    }), fd = T7((e, t) => {
      O7(), function() {
        "use strict";
        function r3(s7, a4, l3) {
          if (!s7) return null;
          r3.caseSensitive || (s7 = s7.toLowerCase());
          var c5 = r3.threshold === null ? null : r3.threshold * s7.length, i4 = r3.thresholdAbsolute, d6;
          c5 !== null && i4 !== null ? d6 = Math.min(c5, i4) : c5 !== null ? d6 = c5 : i4 !== null ? d6 = i4 : d6 = null;
          var u5, p4, f6, g6, h7, m6 = a4.length;
          for (h7 = 0; h7 < m6; h7++) if (p4 = a4[h7], l3 && (p4 = p4[l3]), !!p4 && (r3.caseSensitive ? f6 = p4 : f6 = p4.toLowerCase(), g6 = o7(s7, f6, d6), (d6 === null || g6 < d6) && (d6 = g6, l3 && r3.returnWinningObject ? u5 = a4[h7] : u5 = p4, r3.returnFirstMatch))) return u5;
          return u5 || r3.nullResultValue;
        }
        r3.threshold = 0.4, r3.thresholdAbsolute = 20, r3.caseSensitive = false, r3.nullResultValue = null, r3.returnWinningObject = null, r3.returnFirstMatch = false, typeof t < "u" && t.exports ? t.exports = r3 : window.didYouMean = r3;
        var n3 = Math.pow(2, 32) - 1;
        function o7(s7, a4, l3) {
          l3 = l3 || l3 === 0 ? l3 : n3;
          var c5 = s7.length, i4 = a4.length;
          if (c5 === 0) return Math.min(l3 + 1, i4);
          if (i4 === 0) return Math.min(l3 + 1, c5);
          if (Math.abs(c5 - i4) > l3) return l3 + 1;
          var d6 = [], u5, p4, f6, g6, h7;
          for (u5 = 0; u5 <= i4; u5++) d6[u5] = [u5];
          for (p4 = 0; p4 <= c5; p4++) d6[0][p4] = p4;
          for (u5 = 1; u5 <= i4; u5++) {
            for (f6 = n3, g6 = 1, u5 > l3 && (g6 = u5 - l3), h7 = i4 + 1, h7 > l3 + u5 && (h7 = l3 + u5), p4 = 1; p4 <= c5; p4++) p4 < g6 || p4 > h7 ? d6[u5][p4] = l3 + 1 : a4.charAt(u5 - 1) === s7.charAt(p4 - 1) ? d6[u5][p4] = d6[u5 - 1][p4 - 1] : d6[u5][p4] = Math.min(d6[u5 - 1][p4 - 1] + 1, Math.min(d6[u5][p4 - 1] + 1, d6[u5 - 1][p4] + 1)), d6[u5][p4] < f6 && (f6 = d6[u5][p4]);
            if (f6 > l3) return l3 + 1;
          }
          return d6[i4][c5];
        }
      }();
    }), hd = T7((e, t) => {
      O7();
      var r3 = 40, n3 = 41, o7 = 39, s7 = 34, a4 = 92, l3 = 47, c5 = 44, i4 = 58, d6 = 42, u5 = 117, p4 = 85, f6 = 43, g6 = /^[a-f0-9?-]+$/i;
      t.exports = function(h7) {
        for (var m6 = [], y9 = h7, v6, x5, k5, w7, b7, C5, S6, E6, A7 = 0, _6 = y9.charCodeAt(A7), U4 = y9.length, D7 = [{ nodes: m6 }], j5 = 0, L4, F4 = "", H4 = "", Q3 = ""; A7 < U4; ) if (_6 <= 32) {
          v6 = A7;
          do
            v6 += 1, _6 = y9.charCodeAt(v6);
          while (_6 <= 32);
          w7 = y9.slice(A7, v6), k5 = m6[m6.length - 1], _6 === n3 && j5 ? Q3 = w7 : k5 && k5.type === "div" ? (k5.after = w7, k5.sourceEndIndex += w7.length) : _6 === c5 || _6 === i4 || _6 === l3 && y9.charCodeAt(v6 + 1) !== d6 && (!L4 || L4 && L4.type === "function" && false) ? H4 = w7 : m6.push({ type: "space", sourceIndex: A7, sourceEndIndex: v6, value: w7 }), A7 = v6;
        } else if (_6 === o7 || _6 === s7) {
          v6 = A7, x5 = _6 === o7 ? "'" : '"', w7 = { type: "string", sourceIndex: A7, quote: x5 };
          do
            if (b7 = false, v6 = y9.indexOf(x5, v6 + 1), ~v6) for (C5 = v6; y9.charCodeAt(C5 - 1) === a4; ) C5 -= 1, b7 = !b7;
            else y9 += x5, v6 = y9.length - 1, w7.unclosed = true;
          while (b7);
          w7.value = y9.slice(A7 + 1, v6), w7.sourceEndIndex = w7.unclosed ? v6 : v6 + 1, m6.push(w7), A7 = v6 + 1, _6 = y9.charCodeAt(A7);
        } else if (_6 === l3 && y9.charCodeAt(A7 + 1) === d6) v6 = y9.indexOf("*/", A7), w7 = { type: "comment", sourceIndex: A7, sourceEndIndex: v6 + 2 }, v6 === -1 && (w7.unclosed = true, v6 = y9.length, w7.sourceEndIndex = v6), w7.value = y9.slice(A7 + 2, v6), m6.push(w7), A7 = v6 + 2, _6 = y9.charCodeAt(A7);
        else if ((_6 === l3 || _6 === d6) && L4 && L4.type === "function") w7 = y9[A7], m6.push({ type: "word", sourceIndex: A7 - H4.length, sourceEndIndex: A7 + w7.length, value: w7 }), A7 += 1, _6 = y9.charCodeAt(A7);
        else if (_6 === l3 || _6 === c5 || _6 === i4) w7 = y9[A7], m6.push({ type: "div", sourceIndex: A7 - H4.length, sourceEndIndex: A7 + w7.length, value: w7, before: H4, after: "" }), H4 = "", A7 += 1, _6 = y9.charCodeAt(A7);
        else if (r3 === _6) {
          v6 = A7;
          do
            v6 += 1, _6 = y9.charCodeAt(v6);
          while (_6 <= 32);
          if (E6 = A7, w7 = { type: "function", sourceIndex: A7 - F4.length, value: F4, before: y9.slice(E6 + 1, v6) }, A7 = v6, F4 === "url" && _6 !== o7 && _6 !== s7) {
            v6 -= 1;
            do
              if (b7 = false, v6 = y9.indexOf(")", v6 + 1), ~v6) for (C5 = v6; y9.charCodeAt(C5 - 1) === a4; ) C5 -= 1, b7 = !b7;
              else y9 += ")", v6 = y9.length - 1, w7.unclosed = true;
            while (b7);
            S6 = v6;
            do
              S6 -= 1, _6 = y9.charCodeAt(S6);
            while (_6 <= 32);
            E6 < S6 ? (A7 !== S6 + 1 ? w7.nodes = [{ type: "word", sourceIndex: A7, sourceEndIndex: S6 + 1, value: y9.slice(A7, S6 + 1) }] : w7.nodes = [], w7.unclosed && S6 + 1 !== v6 ? (w7.after = "", w7.nodes.push({ type: "space", sourceIndex: S6 + 1, sourceEndIndex: v6, value: y9.slice(S6 + 1, v6) })) : (w7.after = y9.slice(S6 + 1, v6), w7.sourceEndIndex = v6)) : (w7.after = "", w7.nodes = []), A7 = v6 + 1, w7.sourceEndIndex = w7.unclosed ? v6 : A7, _6 = y9.charCodeAt(A7), m6.push(w7);
          } else j5 += 1, w7.after = "", w7.sourceEndIndex = A7 + 1, m6.push(w7), D7.push(w7), m6 = w7.nodes = [], L4 = w7;
          F4 = "";
        } else if (n3 === _6 && j5) A7 += 1, _6 = y9.charCodeAt(A7), L4.after = Q3, L4.sourceEndIndex += Q3.length, Q3 = "", j5 -= 1, D7[D7.length - 1].sourceEndIndex = A7, D7.pop(), L4 = D7[j5], m6 = L4.nodes;
        else {
          v6 = A7;
          do
            _6 === a4 && (v6 += 1), v6 += 1, _6 = y9.charCodeAt(v6);
          while (v6 < U4 && !(_6 <= 32 || _6 === o7 || _6 === s7 || _6 === c5 || _6 === i4 || _6 === l3 || _6 === r3 || _6 === d6 && L4 && L4.type === "function" || _6 === l3 && L4.type === "function" || _6 === n3 && j5));
          w7 = y9.slice(A7, v6), r3 === _6 ? F4 = w7 : (u5 === w7.charCodeAt(0) || p4 === w7.charCodeAt(0)) && f6 === w7.charCodeAt(1) && g6.test(w7.slice(2)) ? m6.push({ type: "unicode-range", sourceIndex: A7, sourceEndIndex: v6, value: w7 }) : m6.push({ type: "word", sourceIndex: A7, sourceEndIndex: v6, value: w7 }), A7 = v6;
        }
        for (A7 = D7.length - 1; A7; A7 -= 1) D7[A7].unclosed = true, D7[A7].sourceEndIndex = y9.length;
        return D7[0].nodes;
      };
    }), md = T7((e, t) => {
      O7(), t.exports = function r3(n3, o7, s7) {
        var a4, l3, c5, i4;
        for (a4 = 0, l3 = n3.length; a4 < l3; a4 += 1) c5 = n3[a4], s7 || (i4 = o7(c5, a4, n3)), i4 !== false && c5.type === "function" && Array.isArray(c5.nodes) && r3(c5.nodes, o7, s7), s7 && o7(c5, a4, n3);
      };
    }), gd = T7((e, t) => {
      O7();
      function r3(o7, s7) {
        var a4 = o7.type, l3 = o7.value, c5, i4;
        return s7 && (i4 = s7(o7)) !== void 0 ? i4 : a4 === "word" || a4 === "space" ? l3 : a4 === "string" ? (c5 = o7.quote || "", c5 + l3 + (o7.unclosed ? "" : c5)) : a4 === "comment" ? "/*" + l3 + (o7.unclosed ? "" : "*/") : a4 === "div" ? (o7.before || "") + l3 + (o7.after || "") : Array.isArray(o7.nodes) ? (c5 = n3(o7.nodes, s7), a4 !== "function" ? c5 : l3 + "(" + (o7.before || "") + c5 + (o7.after || "") + (o7.unclosed ? "" : ")")) : l3;
      }
      function n3(o7, s7) {
        var a4, l3;
        if (Array.isArray(o7)) {
          for (a4 = "", l3 = o7.length - 1; ~l3; l3 -= 1) a4 = r3(o7[l3], s7) + a4;
          return a4;
        }
        return r3(o7, s7);
      }
      t.exports = n3;
    }), vd = T7((e, t) => {
      O7();
      var r3 = 45, n3 = 43, o7 = 46, s7 = 101, a4 = 69;
      function l3(c5) {
        var i4 = c5.charCodeAt(0), d6;
        if (i4 === n3 || i4 === r3) {
          if (d6 = c5.charCodeAt(1), d6 >= 48 && d6 <= 57) return true;
          var u5 = c5.charCodeAt(2);
          return d6 === o7 && u5 >= 48 && u5 <= 57;
        }
        return i4 === o7 ? (d6 = c5.charCodeAt(1), d6 >= 48 && d6 <= 57) : i4 >= 48 && i4 <= 57;
      }
      t.exports = function(c5) {
        var i4 = 0, d6 = c5.length, u5, p4, f6;
        if (d6 === 0 || !l3(c5)) return false;
        for (u5 = c5.charCodeAt(i4), (u5 === n3 || u5 === r3) && i4++; i4 < d6 && (u5 = c5.charCodeAt(i4), !(u5 < 48 || u5 > 57)); ) i4 += 1;
        if (u5 = c5.charCodeAt(i4), p4 = c5.charCodeAt(i4 + 1), u5 === o7 && p4 >= 48 && p4 <= 57) for (i4 += 2; i4 < d6 && (u5 = c5.charCodeAt(i4), !(u5 < 48 || u5 > 57)); ) i4 += 1;
        if (u5 = c5.charCodeAt(i4), p4 = c5.charCodeAt(i4 + 1), f6 = c5.charCodeAt(i4 + 2), (u5 === s7 || u5 === a4) && (p4 >= 48 && p4 <= 57 || (p4 === n3 || p4 === r3) && f6 >= 48 && f6 <= 57)) for (i4 += p4 === n3 || p4 === r3 ? 3 : 2; i4 < d6 && (u5 = c5.charCodeAt(i4), !(u5 < 48 || u5 > 57)); ) i4 += 1;
        return { number: c5.slice(0, i4), unit: c5.slice(i4) };
      };
    }), yd = T7((e, t) => {
      O7();
      var r3 = hd(), n3 = md(), o7 = gd();
      function s7(a4) {
        return this instanceof s7 ? (this.nodes = r3(a4), this) : new s7(a4);
      }
      s7.prototype.toString = function() {
        return Array.isArray(this.nodes) ? o7(this.nodes) : "";
      }, s7.prototype.walk = function(a4, l3) {
        return n3(this.nodes, a4, l3), this;
      }, s7.unit = vd(), s7.walk = n3, s7.stringify = o7, t.exports = s7;
    });
    function Yn(e) {
      return typeof e == "object" && e !== null;
    }
    function bd(e, t) {
      let r3 = Pt2(t);
      do
        if (r3.pop(), (0, Lt2.default)(e, r3) !== void 0) break;
      while (r3.length);
      return r3.length ? r3 : void 0;
    }
    function _t2(e) {
      return typeof e == "string" ? e : e.reduce((t, r3, n3) => r3.includes(".") ? `${t}[${r3}]` : n3 === 0 ? r3 : `${t}.${r3}`, "");
    }
    function si(e) {
      return e.map((t) => `'${t}'`).join(", ");
    }
    function ai(e) {
      return si(Object.keys(e));
    }
    function Hn(e, t, r3, n3 = {}) {
      let o7 = Array.isArray(t) ? _t2(t) : t.replace(/^['"]+|['"]+$/g, ""), s7 = Array.isArray(t) ? t : Pt2(o7), a4 = (0, Lt2.default)(e.theme, s7, r3);
      if (a4 === void 0) {
        let c5 = `'${o7}' does not exist in your theme config.`, i4 = s7.slice(0, -1), d6 = (0, Lt2.default)(e.theme, i4);
        if (Yn(d6)) {
          let u5 = Object.keys(d6).filter((f6) => Hn(e, [...i4, f6]).isValid), p4 = (0, li.default)(s7[s7.length - 1], u5);
          p4 ? c5 += ` Did you mean '${_t2([...i4, p4])}'?` : u5.length > 0 && (c5 += ` '${_t2(i4)}' has the following valid keys: ${si(u5)}`);
        } else {
          let u5 = bd(e.theme, o7);
          if (u5) {
            let p4 = (0, Lt2.default)(e.theme, u5);
            Yn(p4) ? c5 += ` '${_t2(u5)}' has the following keys: ${ai(p4)}` : c5 += ` '${_t2(u5)}' is not an object.`;
          } else c5 += ` Your theme has the following top-level keys: ${ai(e.theme)}`;
        }
        return { isValid: false, error: c5 };
      }
      if (!(typeof a4 == "string" || typeof a4 == "number" || typeof a4 == "function" || a4 instanceof String || a4 instanceof Number || Array.isArray(a4))) {
        let c5 = `'${o7}' was found but does not resolve to a string.`;
        if (Yn(a4)) {
          let i4 = Object.keys(a4).filter((d6) => Hn(e, [...s7, d6]).isValid);
          i4.length && (c5 += ` Did you mean something like '${_t2([...s7, i4[0]])}'?`);
        }
        return { isValid: false, error: c5 };
      }
      let [l3] = s7;
      return { isValid: true, value: ir2(l3)(a4, n3) };
    }
    function wd(e, t, r3) {
      t = t.map((o7) => ii(e, o7, r3));
      let n3 = [""];
      for (let o7 of t) o7.type === "div" && o7.value === "," ? n3.push("") : n3[n3.length - 1] += Qn.default.stringify(o7);
      return n3;
    }
    function ii(e, t, r3) {
      if (t.type === "function" && r3[t.value] !== void 0) {
        let n3 = wd(e, t.nodes, r3);
        t.type = "word", t.value = r3[t.value](e, ...n3);
      }
      return t;
    }
    function xd(e, t, r3) {
      return Object.keys(r3).some((n3) => t.includes(`${n3}(`)) ? (0, Qn.default)(t).walk((n3) => {
        ii(e, n3, r3);
      }).toString() : t;
    }
    function* kd(e) {
      e = e.replace(/^['"]+|['"]+$/g, "");
      let t = e.match(/^([^\s]+)(?![^\[]*\])(?:\s*\/\s*([^\/\s]+))$/), r3;
      yield [e, void 0], t && (e = t[1], r3 = t[2], yield [e, r3]);
    }
    function Sd(e, t, r3) {
      let n3 = Array.from(kd(t)).map(([o7, s7]) => Object.assign(Hn(e, o7, r3, { opacityValue: s7 }), { resolvedPath: o7, alpha: s7 }));
      return n3.find((o7) => o7.isValid) ?? n3[0];
    }
    function Cd(e) {
      let t = e.tailwindConfig, r3 = { theme: (n3, o7, ...s7) => {
        let { isValid: a4, value: l3, error: c5, alpha: i4 } = Sd(t, o7, s7.length ? s7 : void 0);
        if (!a4) {
          let p4 = n3.parent, f6 = p4?.raws.tailwind?.candidate;
          if (p4 && f6 !== void 0) {
            e.markInvalidUtilityNode(p4), p4.remove(), de3.warn("invalid-theme-key-in-class", [`The utility \`${f6}\` contains an invalid theme value and was not generated.`]);
            return;
          }
          throw n3.error(c5);
        }
        let d6 = Zt(l3);
        return (i4 !== void 0 || d6 !== void 0 && typeof d6 == "function") && (i4 === void 0 && (i4 = 1), l3 = wt2(d6, i4, d6)), l3;
      }, screen: (n3, o7) => {
        o7 = o7.replace(/^['"]+/g, "").replace(/['"]+$/g, "");
        let s7 = zt(t.theme.screens).find(({ name: a4 }) => a4 === o7);
        if (!s7) throw n3.error(`The '${o7}' screen does not exist in your theme.`);
        return ur(s7);
      } };
      return (n3) => {
        n3.walk((o7) => {
          let s7 = ci[o7.type];
          s7 !== void 0 && (o7[s7] = xd(o7, o7[s7], r3));
        });
      };
    }
    var Lt2, li, Qn, ci, Ad = $3(() => {
      O7(), Lt2 = he4(ws()), li = he4(fd()), lr(), Qn = he4(yd()), xn(), gn(), Mr2(), Ht(), Kt(), Ge2(), ci = { atrule: "params", decl: "value" };
    });
    function Od({ tailwindConfig: { theme: e } }) {
      return function(t) {
        t.walkAtRules("screen", (r3) => {
          let n3 = r3.params, o7 = zt(e.screens).find(({ name: s7 }) => s7 === n3);
          if (!o7) throw r3.error(`No \`${n3}\` screen found.`);
          r3.name = "media", r3.params = ur(o7);
        });
      };
    }
    var _d = $3(() => {
      O7(), xn(), gn();
    });
    function Ed(e) {
      let t = e.filter((l3) => l3.type !== "pseudo" || l3.nodes.length > 0 ? true : l3.value.startsWith("::") || [":before", ":after", ":first-line", ":first-letter"].includes(l3.value)).reverse(), r3 = /* @__PURE__ */ new Set(["tag", "class", "id", "attribute"]), n3 = t.findIndex((l3) => r3.has(l3.type));
      if (n3 === -1) return t.reverse().join("").trim();
      let o7 = t[n3], s7 = Jn[o7.type] ? Jn[o7.type](o7) : o7;
      t = t.slice(0, n3);
      let a4 = t.findIndex((l3) => l3.type === "combinator" && l3.value === ">");
      return a4 !== -1 && (t.splice(0, a4), t.unshift(_r2.default.universal())), [s7, ...t.reverse()].join("").trim();
    }
    function Td(e) {
      return Er.has(e) || Er.set(e, ui.transformSync(e)), Er.get(e);
    }
    function Id({ tailwindConfig: e }) {
      return (t) => {
        let r3 = /* @__PURE__ */ new Map(), n3 = /* @__PURE__ */ new Set();
        if (t.walkAtRules("defaults", (o7) => {
          if (o7.nodes && o7.nodes.length > 0) {
            n3.add(o7);
            return;
          }
          let s7 = o7.params;
          r3.has(s7) || r3.set(s7, /* @__PURE__ */ new Set()), r3.get(s7).add(o7.parent), o7.remove();
        }), De3(e, "optimizeUniversalDefaults")) for (let o7 of n3) {
          let s7 = /* @__PURE__ */ new Map(), a4 = r3.get(o7.params) ?? [];
          for (let l3 of a4) for (let c5 of Td(l3.selector)) {
            let i4 = c5.includes(":-") || c5.includes("::-") || c5.includes(":has") ? c5 : "__DEFAULT__", d6 = s7.get(i4) ?? /* @__PURE__ */ new Set();
            s7.set(i4, d6), d6.add(c5);
          }
          if (De3(e, "optimizeUniversalDefaults")) {
            if (s7.size === 0) {
              o7.remove();
              continue;
            }
            for (let [, l3] of s7) {
              let c5 = fe3.rule({ source: o7.source });
              c5.selectors = [...l3], c5.append(o7.nodes.map((i4) => i4.clone())), o7.before(c5);
            }
          }
          o7.remove();
        }
        else if (n3.size) {
          let o7 = fe3.rule({ selectors: ["*", "::before", "::after"] });
          for (let a4 of n3) o7.append(a4.nodes), o7.parent || a4.before(o7), o7.source || (o7.source = a4.source), a4.remove();
          let s7 = o7.clone({ selectors: ["::backdrop"] });
          o7.after(s7);
        }
      };
    }
    var _r2, Jn, ui, Er, Pd = $3(() => {
      O7(), ut3(), _r2 = he4(Ke3()), nt3(), Jn = { id(e) {
        return _r2.default.attribute({ attribute: "id", operator: "=", value: e.value, quoteMark: '"' });
      } }, ui = (0, _r2.default)((e) => e.map((t) => {
        let r3 = t.split((n3) => n3.type === "combinator" && n3.value === " ").pop();
        return Ed(r3);
      })), Er = /* @__PURE__ */ new Map();
    });
    function jd() {
      function e(t) {
        let r3 = null;
        t.each((n3) => {
          if (!di.has(n3.type)) {
            r3 = null;
            return;
          }
          if (r3 === null) {
            r3 = n3;
            return;
          }
          let o7 = Zn[n3.type];
          n3.type === "atrule" && n3.name === "font-face" ? r3 = n3 : o7.every((s7) => (n3[s7] ?? "").replace(/\s+/g, " ") === (r3[s7] ?? "").replace(/\s+/g, " ")) ? (n3.nodes && r3.append(n3.nodes), n3.remove()) : r3 = n3;
        }), t.each((n3) => {
          n3.type === "atrule" && e(n3);
        });
      }
      return (t) => {
        e(t);
      };
    }
    var Zn, di, Bd = $3(() => {
      O7(), Zn = { atrule: ["name", "params"], rule: ["selector"] }, di = new Set(Object.keys(Zn));
    });
    function Dd() {
      return (e) => {
        e.walkRules((t) => {
          let r3 = /* @__PURE__ */ new Map(), n3 = /* @__PURE__ */ new Set([]), o7 = /* @__PURE__ */ new Map();
          t.walkDecls((s7) => {
            if (s7.parent === t) {
              if (r3.has(s7.prop)) {
                if (r3.get(s7.prop).value === s7.value) {
                  n3.add(r3.get(s7.prop)), r3.set(s7.prop, s7);
                  return;
                }
                o7.has(s7.prop) || o7.set(s7.prop, /* @__PURE__ */ new Set()), o7.get(s7.prop).add(r3.get(s7.prop)), o7.get(s7.prop).add(s7);
              }
              r3.set(s7.prop, s7);
            }
          });
          for (let s7 of n3) s7.remove();
          for (let s7 of o7.values()) {
            let a4 = /* @__PURE__ */ new Map();
            for (let l3 of s7) {
              let c5 = $d(l3.value);
              c5 !== null && (a4.has(c5) || a4.set(c5, /* @__PURE__ */ new Set()), a4.get(c5).add(l3));
            }
            for (let l3 of a4.values()) {
              let c5 = Array.from(l3).slice(0, -1);
              for (let i4 of c5) i4.remove();
            }
          }
        });
      };
    }
    function $d(e) {
      let t = /^-?\d*.?\d+([\w%]+)?$/g.exec(e);
      return t ? t[1] ?? pi : null;
    }
    var pi, Rd = $3(() => {
      O7(), pi = Symbol("unitless-number");
    });
    function Md(e) {
      if (!e.walkAtRules) return;
      let t = /* @__PURE__ */ new Set();
      if (e.walkAtRules("apply", (r3) => {
        t.add(r3.parent);
      }), t.size !== 0) for (let r3 of t) {
        let n3 = [], o7 = [];
        for (let s7 of r3.nodes) s7.type === "atrule" && s7.name === "apply" ? (o7.length > 0 && (n3.push(o7), o7 = []), n3.push([s7])) : o7.push(s7);
        if (o7.length > 0 && n3.push(o7), n3.length !== 1) {
          for (let s7 of [...n3].reverse()) {
            let a4 = r3.clone({ nodes: [] });
            a4.append(s7), r3.after(a4);
          }
          r3.remove();
        }
      }
    }
    function fi() {
      return (e) => {
        Md(e);
      };
    }
    var Ud = $3(() => {
      O7();
    });
    function hi(e) {
      return async function(t, r3) {
        let { tailwindDirectives: n3, applyDirectives: o7 } = Wu(t);
        fi()(t, r3);
        let s7 = e({ tailwindDirectives: n3, applyDirectives: o7, registerDependency(a4) {
          r3.messages.push({ plugin: "tailwindcss", parent: r3.opts.from, ...a4 });
        }, createContext(a4, l3) {
          return ja2(a4, l3, t);
        } })(t, r3);
        if (s7.tailwindConfig.separator === "-") throw new Error("The '-' character cannot be used as a custom separator in JIT mode due to parsing ambiguity. Please use another character like '_' instead.");
        Vi(s7.tailwindConfig), await nd(s7)(t, r3), fi()(t, r3), dd(s7)(t, r3), Cd(s7)(t, r3), Od(s7)(t, r3), Id(s7)(t, r3), jd(s7)(t, r3), Dd(s7)(t, r3);
      };
    }
    var zd = $3(() => {
      O7(), qu(), od(), pd(), Ad(), _d(), Pd(), Bd(), Rd(), Ud(), kr(), nt3();
    });
    function Fd(e, t) {
      let r3 = null, n3 = null;
      return e.walkAtRules("config", (o7) => {
        if (n3 = o7.source?.input.file ?? t.opts.from ?? null, n3 === null) throw o7.error("The `@config` directive cannot be used without setting `from` in your PostCSS config.");
        if (r3) throw o7.error("Only one `@config` directive is allowed per file.");
        let s7 = o7.params.match(/(['"])(.*?)\1/);
        if (!s7) throw o7.error("A path is required when using the `@config` directive.");
        let a4 = s7[2];
        if (xe2.isAbsolute(a4)) throw o7.error("The `@config` directive cannot be used with an absolute path.");
        if (r3 = xe2.resolve(xe2.dirname(n3), a4), !Be4.existsSync(r3)) throw o7.error(`The config file at "${a4}" does not exist. Make sure the path is correct and the file exists.`);
        o7.remove();
      }), r3 || null;
    }
    var Ld = $3(() => {
      O7(), rt2(), St();
    }), Nd = T7((e, t) => {
      O7(), Vu(), zd(), pt2(), Ld(), t.exports = function(r3) {
        return { postcssPlugin: "tailwindcss", plugins: [it2.DEBUG && function(n3) {
          return console.log(`
`), console.time("JIT TOTAL"), n3;
        }, async function(n3, o7) {
          r3 = Fd(n3, o7) ?? r3;
          let s7 = Nu(r3);
          if (n3.type === "document") {
            let a4 = n3.nodes.filter((l3) => l3.type === "root");
            for (let l3 of a4) l3.type === "root" && await hi(s7)(l3, o7);
            return;
          }
          await hi(s7)(n3, o7);
        }, it2.DEBUG && function(n3) {
          return console.timeEnd("JIT TOTAL"), console.log(`
`), n3;
        }].filter(Boolean) };
      }, t.exports.postcss = true;
    }), Vd = T7((e, t) => {
      O7(), t.exports = Nd();
    }), mi = T7((e, t) => {
      O7(), t.exports = () => ["and_chr 114", "and_uc 15.5", "chrome 114", "chrome 113", "chrome 109", "edge 114", "firefox 114", "ios_saf 16.5", "ios_saf 16.4", "ios_saf 16.3", "ios_saf 16.1", "opera 99", "safari 16.5", "samsung 21"];
    }), Tr2 = {};
    Fe2(Tr2, { agents: () => gi, feature: () => Wd });
    function Wd() {
      return { status: "cr", title: "CSS Feature Queries", stats: { ie: { 6: "n", 7: "n", 8: "n", 9: "n", 10: "n", 11: "n", "5.5": "n" }, edge: { 12: "y", 13: "y", 14: "y", 15: "y", 16: "y", 17: "y", 18: "y", 79: "y", 80: "y", 81: "y", 83: "y", 84: "y", 85: "y", 86: "y", 87: "y", 88: "y", 89: "y", 90: "y", 91: "y", 92: "y", 93: "y", 94: "y", 95: "y", 96: "y", 97: "y", 98: "y", 99: "y", 100: "y", 101: "y", 102: "y", 103: "y", 104: "y", 105: "y", 106: "y", 107: "y", 108: "y", 109: "y", 110: "y", 111: "y", 112: "y", 113: "y", 114: "y" }, firefox: { 2: "n", 3: "n", 4: "n", 5: "n", 6: "n", 7: "n", 8: "n", 9: "n", 10: "n", 11: "n", 12: "n", 13: "n", 14: "n", 15: "n", 16: "n", 17: "n", 18: "n", 19: "n", 20: "n", 21: "n", 22: "y", 23: "y", 24: "y", 25: "y", 26: "y", 27: "y", 28: "y", 29: "y", 30: "y", 31: "y", 32: "y", 33: "y", 34: "y", 35: "y", 36: "y", 37: "y", 38: "y", 39: "y", 40: "y", 41: "y", 42: "y", 43: "y", 44: "y", 45: "y", 46: "y", 47: "y", 48: "y", 49: "y", 50: "y", 51: "y", 52: "y", 53: "y", 54: "y", 55: "y", 56: "y", 57: "y", 58: "y", 59: "y", 60: "y", 61: "y", 62: "y", 63: "y", 64: "y", 65: "y", 66: "y", 67: "y", 68: "y", 69: "y", 70: "y", 71: "y", 72: "y", 73: "y", 74: "y", 75: "y", 76: "y", 77: "y", 78: "y", 79: "y", 80: "y", 81: "y", 82: "y", 83: "y", 84: "y", 85: "y", 86: "y", 87: "y", 88: "y", 89: "y", 90: "y", 91: "y", 92: "y", 93: "y", 94: "y", 95: "y", 96: "y", 97: "y", 98: "y", 99: "y", 100: "y", 101: "y", 102: "y", 103: "y", 104: "y", 105: "y", 106: "y", 107: "y", 108: "y", 109: "y", 110: "y", 111: "y", 112: "y", 113: "y", 114: "y", 115: "y", 116: "y", 117: "y", "3.5": "n", "3.6": "n" }, chrome: { 4: "n", 5: "n", 6: "n", 7: "n", 8: "n", 9: "n", 10: "n", 11: "n", 12: "n", 13: "n", 14: "n", 15: "n", 16: "n", 17: "n", 18: "n", 19: "n", 20: "n", 21: "n", 22: "n", 23: "n", 24: "n", 25: "n", 26: "n", 27: "n", 28: "y", 29: "y", 30: "y", 31: "y", 32: "y", 33: "y", 34: "y", 35: "y", 36: "y", 37: "y", 38: "y", 39: "y", 40: "y", 41: "y", 42: "y", 43: "y", 44: "y", 45: "y", 46: "y", 47: "y", 48: "y", 49: "y", 50: "y", 51: "y", 52: "y", 53: "y", 54: "y", 55: "y", 56: "y", 57: "y", 58: "y", 59: "y", 60: "y", 61: "y", 62: "y", 63: "y", 64: "y", 65: "y", 66: "y", 67: "y", 68: "y", 69: "y", 70: "y", 71: "y", 72: "y", 73: "y", 74: "y", 75: "y", 76: "y", 77: "y", 78: "y", 79: "y", 80: "y", 81: "y", 83: "y", 84: "y", 85: "y", 86: "y", 87: "y", 88: "y", 89: "y", 90: "y", 91: "y", 92: "y", 93: "y", 94: "y", 95: "y", 96: "y", 97: "y", 98: "y", 99: "y", 100: "y", 101: "y", 102: "y", 103: "y", 104: "y", 105: "y", 106: "y", 107: "y", 108: "y", 109: "y", 110: "y", 111: "y", 112: "y", 113: "y", 114: "y", 115: "y", 116: "y", 117: "y" }, safari: { 4: "n", 5: "n", 6: "n", 7: "n", 8: "n", 9: "y", 10: "y", 11: "y", 12: "y", 13: "y", 14: "y", 15: "y", 17: "y", "9.1": "y", "10.1": "y", "11.1": "y", "12.1": "y", "13.1": "y", "14.1": "y", "15.1": "y", "15.2-15.3": "y", "15.4": "y", "15.5": "y", "15.6": "y", "16.0": "y", "16.1": "y", "16.2": "y", "16.3": "y", "16.4": "y", "16.5": "y", "16.6": "y", TP: "y", "3.1": "n", "3.2": "n", "5.1": "n", "6.1": "n", "7.1": "n" }, opera: { 9: "n", 11: "n", 12: "n", 15: "y", 16: "y", 17: "y", 18: "y", 19: "y", 20: "y", 21: "y", 22: "y", 23: "y", 24: "y", 25: "y", 26: "y", 27: "y", 28: "y", 29: "y", 30: "y", 31: "y", 32: "y", 33: "y", 34: "y", 35: "y", 36: "y", 37: "y", 38: "y", 39: "y", 40: "y", 41: "y", 42: "y", 43: "y", 44: "y", 45: "y", 46: "y", 47: "y", 48: "y", 49: "y", 50: "y", 51: "y", 52: "y", 53: "y", 54: "y", 55: "y", 56: "y", 57: "y", 58: "y", 60: "y", 62: "y", 63: "y", 64: "y", 65: "y", 66: "y", 67: "y", 68: "y", 69: "y", 70: "y", 71: "y", 72: "y", 73: "y", 74: "y", 75: "y", 76: "y", 77: "y", 78: "y", 79: "y", 80: "y", 81: "y", 82: "y", 83: "y", 84: "y", 85: "y", 86: "y", 87: "y", 88: "y", 89: "y", 90: "y", 91: "y", 92: "y", 93: "y", 94: "y", 95: "y", 96: "y", 97: "y", 98: "y", 99: "y", 100: "y", "12.1": "y", "9.5-9.6": "n", "10.0-10.1": "n", "10.5": "n", "10.6": "n", "11.1": "n", "11.5": "n", "11.6": "n" }, ios_saf: { 8: "n", 17: "y", "9.0-9.2": "y", "9.3": "y", "10.0-10.2": "y", "10.3": "y", "11.0-11.2": "y", "11.3-11.4": "y", "12.0-12.1": "y", "12.2-12.5": "y", "13.0-13.1": "y", "13.2": "y", "13.3": "y", "13.4-13.7": "y", "14.0-14.4": "y", "14.5-14.8": "y", "15.0-15.1": "y", "15.2-15.3": "y", "15.4": "y", "15.5": "y", "15.6": "y", "16.0": "y", "16.1": "y", "16.2": "y", "16.3": "y", "16.4": "y", "16.5": "y", "16.6": "y", "3.2": "n", "4.0-4.1": "n", "4.2-4.3": "n", "5.0-5.1": "n", "6.0-6.1": "n", "7.0-7.1": "n", "8.1-8.4": "n" }, op_mini: { all: "y" }, android: { 3: "n", 4: "n", 114: "y", "4.4": "y", "4.4.3-4.4.4": "y", "2.1": "n", "2.2": "n", "2.3": "n", "4.1": "n", "4.2-4.3": "n" }, bb: { 7: "n", 10: "n" }, op_mob: { 10: "n", 11: "n", 12: "n", 73: "y", "11.1": "n", "11.5": "n", "12.1": "n" }, and_chr: { 114: "y" }, and_ff: { 115: "y" }, ie_mob: { 10: "n", 11: "n" }, and_uc: { "15.5": "y" }, samsung: { 4: "y", 20: "y", 21: "y", "5.0-5.4": "y", "6.2-6.4": "y", "7.2-7.4": "y", "8.2": "y", "9.2": "y", "10.1": "y", "11.1-11.2": "y", "12.0": "y", "13.0": "y", "14.0": "y", "15.0": "y", "16.0": "y", "17.0": "y", "18.0": "y", "19.0": "y" }, and_qq: { "13.1": "y" }, baidu: { "13.18": "y" }, kaios: { "2.5": "y", "3.0-3.1": "y" } } };
    }
    var gi, Xn = $3(() => {
      O7(), gi = { ie: { prefix: "ms" }, edge: { prefix: "webkit", prefix_exceptions: { 12: "ms", 13: "ms", 14: "ms", 15: "ms", 16: "ms", 17: "ms", 18: "ms" } }, firefox: { prefix: "moz" }, chrome: { prefix: "webkit" }, safari: { prefix: "webkit" }, opera: { prefix: "webkit", prefix_exceptions: { 9: "o", 11: "o", 12: "o", "9.5-9.6": "o", "10.0-10.1": "o", "10.5": "o", "10.6": "o", "11.1": "o", "11.5": "o", "11.6": "o", "12.1": "o" } }, ios_saf: { prefix: "webkit" }, op_mini: { prefix: "o" }, android: { prefix: "webkit" }, bb: { prefix: "webkit" }, op_mob: { prefix: "o", prefix_exceptions: { 73: "webkit" } }, and_chr: { prefix: "webkit" }, and_ff: { prefix: "moz" }, ie_mob: { prefix: "ms" }, and_uc: { prefix: "webkit", prefix_exceptions: { "15.5": "webkit" } }, samsung: { prefix: "webkit" }, and_qq: { prefix: "webkit" }, baidu: { prefix: "webkit" }, kaios: { prefix: "moz" } };
    }), qd = T7(() => {
      O7();
    }), _e3 = T7((e, t) => {
      O7();
      var { list: r3 } = Re3();
      t.exports.error = function(n3) {
        let o7 = new Error(n3);
        throw o7.autoprefixer = true, o7;
      }, t.exports.uniq = function(n3) {
        return [...new Set(n3)];
      }, t.exports.removeNote = function(n3) {
        return n3.includes(" ") ? n3.split(" ")[0] : n3;
      }, t.exports.escapeRegexp = function(n3) {
        return n3.replace(/[$()*+-.?[\\\]^{|}]/g, "\\$&");
      }, t.exports.regexp = function(n3, o7 = true) {
        return o7 && (n3 = this.escapeRegexp(n3)), new RegExp(`(^|[\\s,(])(${n3}($|[\\s(,]))`, "gi");
      }, t.exports.editList = function(n3, o7) {
        let s7 = r3.comma(n3), a4 = o7(s7, []);
        if (s7 === a4) return n3;
        let l3 = n3.match(/,\s*/);
        return l3 = l3 ? l3[0] : ", ", a4.join(l3);
      }, t.exports.splitSelector = function(n3) {
        return r3.comma(n3).map((o7) => r3.space(o7).map((s7) => s7.split(/(?=\.|#)/g)));
      };
    }), gt2 = T7((e, t) => {
      O7();
      var r3 = mi(), n3 = (Xn(), Tr2).agents, o7 = _e3(), s7 = class {
        static prefixes() {
          if (this.prefixesCache) return this.prefixesCache;
          this.prefixesCache = [];
          for (let a4 in n3) this.prefixesCache.push(`-${n3[a4].prefix}-`);
          return this.prefixesCache = o7.uniq(this.prefixesCache).sort((a4, l3) => l3.length - a4.length), this.prefixesCache;
        }
        static withPrefix(a4) {
          return this.prefixesRegexp || (this.prefixesRegexp = new RegExp(this.prefixes().join("|"))), this.prefixesRegexp.test(a4);
        }
        constructor(a4, l3, c5, i4) {
          this.data = a4, this.options = c5 || {}, this.browserslistOpts = i4 || {}, this.selected = this.parse(l3);
        }
        parse(a4) {
          let l3 = {};
          for (let c5 in this.browserslistOpts) l3[c5] = this.browserslistOpts[c5];
          return l3.path = this.options.from, r3(a4, l3);
        }
        prefix(a4) {
          let [l3, c5] = a4.split(" "), i4 = this.data[l3], d6 = i4.prefix_exceptions && i4.prefix_exceptions[c5];
          return d6 || (d6 = i4.prefix), `-${d6}-`;
        }
        isSelected(a4) {
          return this.selected.includes(a4);
        }
      };
      t.exports = s7;
    }), Ir2 = T7((e, t) => {
      O7(), t.exports = { prefix(r3) {
        let n3 = r3.match(/^(-\w+-)/);
        return n3 ? n3[0] : "";
      }, unprefixed(r3) {
        return r3.replace(/^-\w+-/, "");
      } };
    }), Nt = T7((e, t) => {
      O7();
      var r3 = gt2(), n3 = Ir2(), o7 = _e3();
      function s7(l3, c5) {
        let i4 = new l3.constructor();
        for (let d6 of Object.keys(l3 || {})) {
          let u5 = l3[d6];
          d6 === "parent" && typeof u5 == "object" ? c5 && (i4[d6] = c5) : d6 === "source" || d6 === null ? i4[d6] = u5 : Array.isArray(u5) ? i4[d6] = u5.map((p4) => s7(p4, i4)) : d6 !== "_autoprefixerPrefix" && d6 !== "_autoprefixerValues" && d6 !== "proxyCache" && (typeof u5 == "object" && u5 !== null && (u5 = s7(u5, i4)), i4[d6] = u5);
        }
        return i4;
      }
      var a4 = class {
        static hack(l3) {
          return this.hacks || (this.hacks = {}), l3.names.map((c5) => (this.hacks[c5] = l3, this.hacks[c5]));
        }
        static load(l3, c5, i4) {
          let d6 = this.hacks && this.hacks[l3];
          return d6 ? new d6(l3, c5, i4) : new this(l3, c5, i4);
        }
        static clone(l3, c5) {
          let i4 = s7(l3);
          for (let d6 in c5) i4[d6] = c5[d6];
          return i4;
        }
        constructor(l3, c5, i4) {
          this.prefixes = c5, this.name = l3, this.all = i4;
        }
        parentPrefix(l3) {
          let c5;
          return typeof l3._autoprefixerPrefix < "u" ? c5 = l3._autoprefixerPrefix : l3.type === "decl" && l3.prop[0] === "-" ? c5 = n3.prefix(l3.prop) : l3.type === "root" ? c5 = false : l3.type === "rule" && l3.selector.includes(":-") && /:(-\w+-)/.test(l3.selector) ? c5 = l3.selector.match(/:(-\w+-)/)[1] : l3.type === "atrule" && l3.name[0] === "-" ? c5 = n3.prefix(l3.name) : c5 = this.parentPrefix(l3.parent), r3.prefixes().includes(c5) || (c5 = false), l3._autoprefixerPrefix = c5, l3._autoprefixerPrefix;
        }
        process(l3, c5) {
          if (!this.check(l3)) return;
          let i4 = this.parentPrefix(l3), d6 = this.prefixes.filter((p4) => !i4 || i4 === o7.removeNote(p4)), u5 = [];
          for (let p4 of d6) this.add(l3, p4, u5.concat([p4]), c5) && u5.push(p4);
          return u5;
        }
        clone(l3, c5) {
          return a4.clone(l3, c5);
        }
      };
      t.exports = a4;
    }), Y3 = T7((e, t) => {
      O7();
      var r3 = Nt(), n3 = gt2(), o7 = _e3(), s7 = class extends r3 {
        check() {
          return true;
        }
        prefixed(a4, l3) {
          return l3 + a4;
        }
        normalize(a4) {
          return a4;
        }
        otherPrefixes(a4, l3) {
          for (let c5 of n3.prefixes()) if (c5 !== l3 && a4.includes(c5)) return true;
          return false;
        }
        set(a4, l3) {
          return a4.prop = this.prefixed(a4.prop, l3), a4;
        }
        needCascade(a4) {
          return a4._autoprefixerCascade || (a4._autoprefixerCascade = this.all.options.cascade !== false && a4.raw("before").includes(`
`)), a4._autoprefixerCascade;
        }
        maxPrefixed(a4, l3) {
          if (l3._autoprefixerMax) return l3._autoprefixerMax;
          let c5 = 0;
          for (let i4 of a4) i4 = o7.removeNote(i4), i4.length > c5 && (c5 = i4.length);
          return l3._autoprefixerMax = c5, l3._autoprefixerMax;
        }
        calcBefore(a4, l3, c5 = "") {
          let i4 = this.maxPrefixed(a4, l3) - o7.removeNote(c5).length, d6 = l3.raw("before");
          return i4 > 0 && (d6 += Array(i4).fill(" ").join("")), d6;
        }
        restoreBefore(a4) {
          let l3 = a4.raw("before").split(`
`), c5 = l3[l3.length - 1];
          this.all.group(a4).up((i4) => {
            let d6 = i4.raw("before").split(`
`), u5 = d6[d6.length - 1];
            u5.length < c5.length && (c5 = u5);
          }), l3[l3.length - 1] = c5, a4.raws.before = l3.join(`
`);
        }
        insert(a4, l3, c5) {
          let i4 = this.set(this.clone(a4), l3);
          if (!(!i4 || a4.parent.some((d6) => d6.prop === i4.prop && d6.value === i4.value))) return this.needCascade(a4) && (i4.raws.before = this.calcBefore(c5, a4, l3)), a4.parent.insertBefore(a4, i4);
        }
        isAlready(a4, l3) {
          let c5 = this.all.group(a4).up((i4) => i4.prop === l3);
          return c5 || (c5 = this.all.group(a4).down((i4) => i4.prop === l3)), c5;
        }
        add(a4, l3, c5, i4) {
          let d6 = this.prefixed(a4.prop, l3);
          if (!(this.isAlready(a4, d6) || this.otherPrefixes(a4.value, l3))) return this.insert(a4, l3, c5, i4);
        }
        process(a4, l3) {
          if (!this.needCascade(a4)) {
            super.process(a4, l3);
            return;
          }
          let c5 = super.process(a4, l3);
          !c5 || !c5.length || (this.restoreBefore(a4), a4.raws.before = this.calcBefore(c5, a4));
        }
        old(a4, l3) {
          return [this.prefixed(a4, l3)];
        }
      };
      t.exports = s7;
    }), Gd = T7((e, t) => {
      O7(), t.exports = function r3(n3) {
        return { mul: (o7) => new r3(n3 * o7), div: (o7) => new r3(n3 / o7), simplify: () => new r3(n3), toString: () => n3.toString() };
      };
    }), Yd = T7((e, t) => {
      O7();
      var r3 = Gd(), n3 = Nt(), o7 = _e3(), s7 = /(min|max)-resolution\s*:\s*\d*\.?\d+(dppx|dpcm|dpi|x)/gi, a4 = /(min|max)-resolution(\s*:\s*)(\d*\.?\d+)(dppx|dpcm|dpi|x)/i, l3 = class extends n3 {
        prefixName(c5, i4) {
          return c5 === "-moz-" ? i4 + "--moz-device-pixel-ratio" : c5 + i4 + "-device-pixel-ratio";
        }
        prefixQuery(c5, i4, d6, u5, p4) {
          return u5 = new r3(u5), p4 === "dpi" ? u5 = u5.div(96) : p4 === "dpcm" && (u5 = u5.mul(2.54).div(96)), u5 = u5.simplify(), c5 === "-o-" && (u5 = u5.n + "/" + u5.d), this.prefixName(c5, i4) + d6 + u5;
        }
        clean(c5) {
          if (!this.bad) {
            this.bad = [];
            for (let i4 of this.prefixes) this.bad.push(this.prefixName(i4, "min")), this.bad.push(this.prefixName(i4, "max"));
          }
          c5.params = o7.editList(c5.params, (i4) => i4.filter((d6) => this.bad.every((u5) => !d6.includes(u5))));
        }
        process(c5) {
          let i4 = this.parentPrefix(c5), d6 = i4 ? [i4] : this.prefixes;
          c5.params = o7.editList(c5.params, (u5, p4) => {
            for (let f6 of u5) {
              if (!f6.includes("min-resolution") && !f6.includes("max-resolution")) {
                p4.push(f6);
                continue;
              }
              for (let g6 of d6) {
                let h7 = f6.replace(s7, (m6) => {
                  let y9 = m6.match(a4);
                  return this.prefixQuery(g6, y9[1], y9[2], y9[3], y9[4]);
                });
                p4.push(h7);
              }
              p4.push(f6);
            }
            return o7.uniq(p4);
          });
        }
      };
      t.exports = l3;
    }), Hd = T7((e, t) => {
      O7();
      var r3 = 40, n3 = 41, o7 = 39, s7 = 34, a4 = 92, l3 = 47, c5 = 44, i4 = 58, d6 = 42, u5 = 117, p4 = 85, f6 = 43, g6 = /^[a-f0-9?-]+$/i;
      t.exports = function(h7) {
        for (var m6 = [], y9 = h7, v6, x5, k5, w7, b7, C5, S6, E6, A7 = 0, _6 = y9.charCodeAt(A7), U4 = y9.length, D7 = [{ nodes: m6 }], j5 = 0, L4, F4 = "", H4 = "", Q3 = ""; A7 < U4; ) if (_6 <= 32) {
          v6 = A7;
          do
            v6 += 1, _6 = y9.charCodeAt(v6);
          while (_6 <= 32);
          w7 = y9.slice(A7, v6), k5 = m6[m6.length - 1], _6 === n3 && j5 ? Q3 = w7 : k5 && k5.type === "div" ? (k5.after = w7, k5.sourceEndIndex += w7.length) : _6 === c5 || _6 === i4 || _6 === l3 && y9.charCodeAt(v6 + 1) !== d6 && (!L4 || L4 && L4.type === "function" && L4.value !== "calc") ? H4 = w7 : m6.push({ type: "space", sourceIndex: A7, sourceEndIndex: v6, value: w7 }), A7 = v6;
        } else if (_6 === o7 || _6 === s7) {
          v6 = A7, x5 = _6 === o7 ? "'" : '"', w7 = { type: "string", sourceIndex: A7, quote: x5 };
          do
            if (b7 = false, v6 = y9.indexOf(x5, v6 + 1), ~v6) for (C5 = v6; y9.charCodeAt(C5 - 1) === a4; ) C5 -= 1, b7 = !b7;
            else y9 += x5, v6 = y9.length - 1, w7.unclosed = true;
          while (b7);
          w7.value = y9.slice(A7 + 1, v6), w7.sourceEndIndex = w7.unclosed ? v6 : v6 + 1, m6.push(w7), A7 = v6 + 1, _6 = y9.charCodeAt(A7);
        } else if (_6 === l3 && y9.charCodeAt(A7 + 1) === d6) v6 = y9.indexOf("*/", A7), w7 = { type: "comment", sourceIndex: A7, sourceEndIndex: v6 + 2 }, v6 === -1 && (w7.unclosed = true, v6 = y9.length, w7.sourceEndIndex = v6), w7.value = y9.slice(A7 + 2, v6), m6.push(w7), A7 = v6 + 2, _6 = y9.charCodeAt(A7);
        else if ((_6 === l3 || _6 === d6) && L4 && L4.type === "function" && L4.value === "calc") w7 = y9[A7], m6.push({ type: "word", sourceIndex: A7 - H4.length, sourceEndIndex: A7 + w7.length, value: w7 }), A7 += 1, _6 = y9.charCodeAt(A7);
        else if (_6 === l3 || _6 === c5 || _6 === i4) w7 = y9[A7], m6.push({ type: "div", sourceIndex: A7 - H4.length, sourceEndIndex: A7 + w7.length, value: w7, before: H4, after: "" }), H4 = "", A7 += 1, _6 = y9.charCodeAt(A7);
        else if (r3 === _6) {
          v6 = A7;
          do
            v6 += 1, _6 = y9.charCodeAt(v6);
          while (_6 <= 32);
          if (E6 = A7, w7 = { type: "function", sourceIndex: A7 - F4.length, value: F4, before: y9.slice(E6 + 1, v6) }, A7 = v6, F4 === "url" && _6 !== o7 && _6 !== s7) {
            v6 -= 1;
            do
              if (b7 = false, v6 = y9.indexOf(")", v6 + 1), ~v6) for (C5 = v6; y9.charCodeAt(C5 - 1) === a4; ) C5 -= 1, b7 = !b7;
              else y9 += ")", v6 = y9.length - 1, w7.unclosed = true;
            while (b7);
            S6 = v6;
            do
              S6 -= 1, _6 = y9.charCodeAt(S6);
            while (_6 <= 32);
            E6 < S6 ? (A7 !== S6 + 1 ? w7.nodes = [{ type: "word", sourceIndex: A7, sourceEndIndex: S6 + 1, value: y9.slice(A7, S6 + 1) }] : w7.nodes = [], w7.unclosed && S6 + 1 !== v6 ? (w7.after = "", w7.nodes.push({ type: "space", sourceIndex: S6 + 1, sourceEndIndex: v6, value: y9.slice(S6 + 1, v6) })) : (w7.after = y9.slice(S6 + 1, v6), w7.sourceEndIndex = v6)) : (w7.after = "", w7.nodes = []), A7 = v6 + 1, w7.sourceEndIndex = w7.unclosed ? v6 : A7, _6 = y9.charCodeAt(A7), m6.push(w7);
          } else j5 += 1, w7.after = "", w7.sourceEndIndex = A7 + 1, m6.push(w7), D7.push(w7), m6 = w7.nodes = [], L4 = w7;
          F4 = "";
        } else if (n3 === _6 && j5) A7 += 1, _6 = y9.charCodeAt(A7), L4.after = Q3, L4.sourceEndIndex += Q3.length, Q3 = "", j5 -= 1, D7[D7.length - 1].sourceEndIndex = A7, D7.pop(), L4 = D7[j5], m6 = L4.nodes;
        else {
          v6 = A7;
          do
            _6 === a4 && (v6 += 1), v6 += 1, _6 = y9.charCodeAt(v6);
          while (v6 < U4 && !(_6 <= 32 || _6 === o7 || _6 === s7 || _6 === c5 || _6 === i4 || _6 === l3 || _6 === r3 || _6 === d6 && L4 && L4.type === "function" && L4.value === "calc" || _6 === l3 && L4.type === "function" && L4.value === "calc" || _6 === n3 && j5));
          w7 = y9.slice(A7, v6), r3 === _6 ? F4 = w7 : (u5 === w7.charCodeAt(0) || p4 === w7.charCodeAt(0)) && f6 === w7.charCodeAt(1) && g6.test(w7.slice(2)) ? m6.push({ type: "unicode-range", sourceIndex: A7, sourceEndIndex: v6, value: w7 }) : m6.push({ type: "word", sourceIndex: A7, sourceEndIndex: v6, value: w7 }), A7 = v6;
        }
        for (A7 = D7.length - 1; A7; A7 -= 1) D7[A7].unclosed = true, D7[A7].sourceEndIndex = y9.length;
        return D7[0].nodes;
      };
    }), Qd = T7((e, t) => {
      O7(), t.exports = function r3(n3, o7, s7) {
        var a4, l3, c5, i4;
        for (a4 = 0, l3 = n3.length; a4 < l3; a4 += 1) c5 = n3[a4], s7 || (i4 = o7(c5, a4, n3)), i4 !== false && c5.type === "function" && Array.isArray(c5.nodes) && r3(c5.nodes, o7, s7), s7 && o7(c5, a4, n3);
      };
    }), Jd = T7((e, t) => {
      O7();
      function r3(o7, s7) {
        var a4 = o7.type, l3 = o7.value, c5, i4;
        return s7 && (i4 = s7(o7)) !== void 0 ? i4 : a4 === "word" || a4 === "space" ? l3 : a4 === "string" ? (c5 = o7.quote || "", c5 + l3 + (o7.unclosed ? "" : c5)) : a4 === "comment" ? "/*" + l3 + (o7.unclosed ? "" : "*/") : a4 === "div" ? (o7.before || "") + l3 + (o7.after || "") : Array.isArray(o7.nodes) ? (c5 = n3(o7.nodes, s7), a4 !== "function" ? c5 : l3 + "(" + (o7.before || "") + c5 + (o7.after || "") + (o7.unclosed ? "" : ")")) : l3;
      }
      function n3(o7, s7) {
        var a4, l3;
        if (Array.isArray(o7)) {
          for (a4 = "", l3 = o7.length - 1; ~l3; l3 -= 1) a4 = r3(o7[l3], s7) + a4;
          return a4;
        }
        return r3(o7, s7);
      }
      t.exports = n3;
    }), Zd = T7((e, t) => {
      O7();
      var r3 = 45, n3 = 43, o7 = 46, s7 = 101, a4 = 69;
      function l3(c5) {
        var i4 = c5.charCodeAt(0), d6;
        if (i4 === n3 || i4 === r3) {
          if (d6 = c5.charCodeAt(1), d6 >= 48 && d6 <= 57) return true;
          var u5 = c5.charCodeAt(2);
          return d6 === o7 && u5 >= 48 && u5 <= 57;
        }
        return i4 === o7 ? (d6 = c5.charCodeAt(1), d6 >= 48 && d6 <= 57) : i4 >= 48 && i4 <= 57;
      }
      t.exports = function(c5) {
        var i4 = 0, d6 = c5.length, u5, p4, f6;
        if (d6 === 0 || !l3(c5)) return false;
        for (u5 = c5.charCodeAt(i4), (u5 === n3 || u5 === r3) && i4++; i4 < d6 && (u5 = c5.charCodeAt(i4), !(u5 < 48 || u5 > 57)); ) i4 += 1;
        if (u5 = c5.charCodeAt(i4), p4 = c5.charCodeAt(i4 + 1), u5 === o7 && p4 >= 48 && p4 <= 57) for (i4 += 2; i4 < d6 && (u5 = c5.charCodeAt(i4), !(u5 < 48 || u5 > 57)); ) i4 += 1;
        if (u5 = c5.charCodeAt(i4), p4 = c5.charCodeAt(i4 + 1), f6 = c5.charCodeAt(i4 + 2), (u5 === s7 || u5 === a4) && (p4 >= 48 && p4 <= 57 || (p4 === n3 || p4 === r3) && f6 >= 48 && f6 <= 57)) for (i4 += p4 === n3 || p4 === r3 ? 3 : 2; i4 < d6 && (u5 = c5.charCodeAt(i4), !(u5 < 48 || u5 > 57)); ) i4 += 1;
        return { number: c5.slice(0, i4), unit: c5.slice(i4) };
      };
    }), Kn = T7((e, t) => {
      O7();
      var r3 = Hd(), n3 = Qd(), o7 = Jd();
      function s7(a4) {
        return this instanceof s7 ? (this.nodes = r3(a4), this) : new s7(a4);
      }
      s7.prototype.toString = function() {
        return Array.isArray(this.nodes) ? o7(this.nodes) : "";
      }, s7.prototype.walk = function(a4, l3) {
        return n3(this.nodes, a4, l3), this;
      }, s7.unit = Zd(), s7.walk = n3, s7.stringify = o7, t.exports = s7;
    }), Xd = T7((e, t) => {
      O7();
      var { list: r3 } = Re3(), n3 = Kn(), o7 = gt2(), s7 = Ir2(), a4 = class {
        constructor(l3) {
          this.props = ["transition", "transition-property"], this.prefixes = l3;
        }
        add(l3, c5) {
          let i4, d6, u5 = this.prefixes.add[l3.prop], p4 = this.ruleVendorPrefixes(l3), f6 = p4 || u5 && u5.prefixes || [], g6 = this.parse(l3.value), h7 = g6.map((x5) => this.findProp(x5)), m6 = [];
          if (h7.some((x5) => x5[0] === "-")) return;
          for (let x5 of g6) {
            if (d6 = this.findProp(x5), d6[0] === "-") continue;
            let k5 = this.prefixes.add[d6];
            if (!(!k5 || !k5.prefixes)) for (i4 of k5.prefixes) {
              if (p4 && !p4.some((b7) => i4.includes(b7))) continue;
              let w7 = this.prefixes.prefixed(d6, i4);
              w7 !== "-ms-transform" && !h7.includes(w7) && (this.disabled(d6, i4) || m6.push(this.clone(d6, w7, x5)));
            }
          }
          g6 = g6.concat(m6);
          let y9 = this.stringify(g6), v6 = this.stringify(this.cleanFromUnprefixed(g6, "-webkit-"));
          if (f6.includes("-webkit-") && this.cloneBefore(l3, `-webkit-${l3.prop}`, v6), this.cloneBefore(l3, l3.prop, v6), f6.includes("-o-")) {
            let x5 = this.stringify(this.cleanFromUnprefixed(g6, "-o-"));
            this.cloneBefore(l3, `-o-${l3.prop}`, x5);
          }
          for (i4 of f6) if (i4 !== "-webkit-" && i4 !== "-o-") {
            let x5 = this.stringify(this.cleanOtherPrefixes(g6, i4));
            this.cloneBefore(l3, i4 + l3.prop, x5);
          }
          y9 !== l3.value && !this.already(l3, l3.prop, y9) && (this.checkForWarning(c5, l3), l3.cloneBefore(), l3.value = y9);
        }
        findProp(l3) {
          let c5 = l3[0].value;
          if (/^\d/.test(c5)) {
            for (let [i4, d6] of l3.entries()) if (i4 !== 0 && d6.type === "word") return d6.value;
          }
          return c5;
        }
        already(l3, c5, i4) {
          return l3.parent.some((d6) => d6.prop === c5 && d6.value === i4);
        }
        cloneBefore(l3, c5, i4) {
          this.already(l3, c5, i4) || l3.cloneBefore({ prop: c5, value: i4 });
        }
        checkForWarning(l3, c5) {
          if (c5.prop !== "transition-property") return;
          let i4 = false, d6 = false;
          c5.parent.each((u5) => {
            if (u5.type !== "decl" || u5.prop.indexOf("transition-") !== 0) return;
            let p4 = r3.comma(u5.value);
            if (u5.prop === "transition-property") {
              p4.forEach((f6) => {
                let g6 = this.prefixes.add[f6];
                g6 && g6.prefixes && g6.prefixes.length > 0 && (i4 = true);
              });
              return;
            }
            return d6 = d6 || p4.length > 1, false;
          }), i4 && d6 && c5.warn(l3, "Replace transition-property to transition, because Autoprefixer could not support any cases of transition-property and other transition-*");
        }
        remove(l3) {
          let c5 = this.parse(l3.value);
          c5 = c5.filter((p4) => {
            let f6 = this.prefixes.remove[this.findProp(p4)];
            return !f6 || !f6.remove;
          });
          let i4 = this.stringify(c5);
          if (l3.value === i4) return;
          if (c5.length === 0) {
            l3.remove();
            return;
          }
          let d6 = l3.parent.some((p4) => p4.prop === l3.prop && p4.value === i4), u5 = l3.parent.some((p4) => p4 !== l3 && p4.prop === l3.prop && p4.value.length > i4.length);
          if (d6 || u5) {
            l3.remove();
            return;
          }
          l3.value = i4;
        }
        parse(l3) {
          let c5 = n3(l3), i4 = [], d6 = [];
          for (let u5 of c5.nodes) d6.push(u5), u5.type === "div" && u5.value === "," && (i4.push(d6), d6 = []);
          return i4.push(d6), i4.filter((u5) => u5.length > 0);
        }
        stringify(l3) {
          if (l3.length === 0) return "";
          let c5 = [];
          for (let i4 of l3) i4[i4.length - 1].type !== "div" && i4.push(this.div(l3)), c5 = c5.concat(i4);
          return c5[0].type === "div" && (c5 = c5.slice(1)), c5[c5.length - 1].type === "div" && (c5 = c5.slice(0, -1)), n3.stringify({ nodes: c5 });
        }
        clone(l3, c5, i4) {
          let d6 = [], u5 = false;
          for (let p4 of i4) !u5 && p4.type === "word" && p4.value === l3 ? (d6.push({ type: "word", value: c5 }), u5 = true) : d6.push(p4);
          return d6;
        }
        div(l3) {
          for (let c5 of l3) for (let i4 of c5) if (i4.type === "div" && i4.value === ",") return i4;
          return { type: "div", value: ",", after: " " };
        }
        cleanOtherPrefixes(l3, c5) {
          return l3.filter((i4) => {
            let d6 = s7.prefix(this.findProp(i4));
            return d6 === "" || d6 === c5;
          });
        }
        cleanFromUnprefixed(l3, c5) {
          let i4 = l3.map((u5) => this.findProp(u5)).filter((u5) => u5.slice(0, c5.length) === c5).map((u5) => this.prefixes.unprefixed(u5)), d6 = [];
          for (let u5 of l3) {
            let p4 = this.findProp(u5), f6 = s7.prefix(p4);
            !i4.includes(p4) && (f6 === c5 || f6 === "") && d6.push(u5);
          }
          return d6;
        }
        disabled(l3, c5) {
          let i4 = ["order", "justify-content", "align-self", "align-content"];
          if (l3.includes("flex") || i4.includes(l3)) {
            if (this.prefixes.options.flexbox === false) return true;
            if (this.prefixes.options.flexbox === "no-2009") return c5.includes("2009");
          }
        }
        ruleVendorPrefixes(l3) {
          let { parent: c5 } = l3;
          if (c5.type !== "rule" || !c5.selector.includes(":-")) return false;
          let i4 = o7.prefixes().filter((d6) => c5.selector.includes(":" + d6));
          return i4.length > 0 ? i4 : false;
        }
      };
      t.exports = a4;
    }), Vt = T7((e, t) => {
      O7();
      var r3 = _e3(), n3 = class {
        constructor(o7, s7, a4, l3) {
          this.unprefixed = o7, this.prefixed = s7, this.string = a4 || s7, this.regexp = l3 || r3.regexp(s7);
        }
        check(o7) {
          return o7.includes(this.string) ? !!o7.match(this.regexp) : false;
        }
      };
      t.exports = n3;
    }), Ve3 = T7((e, t) => {
      O7();
      var r3 = Nt(), n3 = Vt(), o7 = Ir2(), s7 = _e3(), a4 = class extends r3 {
        static save(l3, c5) {
          let i4 = c5.prop, d6 = [];
          for (let u5 in c5._autoprefixerValues) {
            let p4 = c5._autoprefixerValues[u5];
            if (p4 === c5.value) continue;
            let f6, g6 = o7.prefix(i4);
            if (g6 === "-pie-") continue;
            if (g6 === u5) {
              f6 = c5.value = p4, d6.push(f6);
              continue;
            }
            let h7 = l3.prefixed(i4, u5), m6 = c5.parent;
            if (!m6.every((x5) => x5.prop !== h7)) {
              d6.push(f6);
              continue;
            }
            let y9 = p4.replace(/\s+/, " ");
            if (m6.some((x5) => x5.prop === c5.prop && x5.value.replace(/\s+/, " ") === y9)) {
              d6.push(f6);
              continue;
            }
            let v6 = this.clone(c5, { value: p4 });
            f6 = c5.parent.insertBefore(c5, v6), d6.push(f6);
          }
          return d6;
        }
        check(l3) {
          let c5 = l3.value;
          return c5.includes(this.name) ? !!c5.match(this.regexp()) : false;
        }
        regexp() {
          return this.regexpCache || (this.regexpCache = s7.regexp(this.name));
        }
        replace(l3, c5) {
          return l3.replace(this.regexp(), `$1${c5}$2`);
        }
        value(l3) {
          return l3.raws.value && l3.raws.value.value === l3.value ? l3.raws.value.raw : l3.value;
        }
        add(l3, c5) {
          l3._autoprefixerValues || (l3._autoprefixerValues = {});
          let i4 = l3._autoprefixerValues[c5] || this.value(l3), d6;
          do
            if (d6 = i4, i4 = this.replace(i4, c5), i4 === false) return;
          while (i4 !== d6);
          l3._autoprefixerValues[c5] = i4;
        }
        old(l3) {
          return new n3(this.name, l3 + this.name);
        }
      };
      t.exports = a4;
    }), vt2 = T7((e, t) => {
      O7(), t.exports = {};
    }), vi = T7((e, t) => {
      O7();
      var r3 = Kn(), n3 = Ve3(), o7 = vt2().insertAreas, s7 = /(^|[^-])linear-gradient\(\s*(top|left|right|bottom)/i, a4 = /(^|[^-])radial-gradient\(\s*\d+(\w*|%)\s+\d+(\w*|%)\s*,/i, l3 = /(!\s*)?autoprefixer:\s*ignore\s+next/i, c5 = /(!\s*)?autoprefixer\s*grid:\s*(on|off|(no-)?autoplace)/i, i4 = ["width", "height", "min-width", "max-width", "min-height", "max-height", "inline-size", "min-inline-size", "max-inline-size", "block-size", "min-block-size", "max-block-size"];
      function d6(f6) {
        return f6.parent.some((g6) => g6.prop === "grid-template" || g6.prop === "grid-template-areas");
      }
      function u5(f6) {
        let g6 = f6.parent.some((m6) => m6.prop === "grid-template-rows"), h7 = f6.parent.some((m6) => m6.prop === "grid-template-columns");
        return g6 && h7;
      }
      var p4 = class {
        constructor(f6) {
          this.prefixes = f6;
        }
        add(f6, g6) {
          let h7 = this.prefixes.add["@resolution"], m6 = this.prefixes.add["@keyframes"], y9 = this.prefixes.add["@viewport"], v6 = this.prefixes.add["@supports"];
          f6.walkAtRules((b7) => {
            if (b7.name === "keyframes") {
              if (!this.disabled(b7, g6)) return m6 && m6.process(b7);
            } else if (b7.name === "viewport") {
              if (!this.disabled(b7, g6)) return y9 && y9.process(b7);
            } else if (b7.name === "supports") {
              if (this.prefixes.options.supports !== false && !this.disabled(b7, g6)) return v6.process(b7);
            } else if (b7.name === "media" && b7.params.includes("-resolution") && !this.disabled(b7, g6)) return h7 && h7.process(b7);
          }), f6.walkRules((b7) => {
            if (!this.disabled(b7, g6)) return this.prefixes.add.selectors.map((C5) => C5.process(b7, g6));
          });
          function x5(b7) {
            return b7.parent.nodes.some((C5) => {
              if (C5.type !== "decl") return false;
              let S6 = C5.prop === "display" && /(inline-)?grid/.test(C5.value), E6 = C5.prop.startsWith("grid-template"), A7 = /^grid-([A-z]+-)?gap/.test(C5.prop);
              return S6 || E6 || A7;
            });
          }
          function k5(b7) {
            return b7.parent.some((C5) => C5.prop === "display" && /(inline-)?flex/.test(C5.value));
          }
          let w7 = this.gridStatus(f6, g6) && this.prefixes.add["grid-area"] && this.prefixes.add["grid-area"].prefixes;
          return f6.walkDecls((b7) => {
            if (this.disabledDecl(b7, g6)) return;
            let C5 = b7.parent, S6 = b7.prop, E6 = b7.value;
            if (S6 === "grid-row-span") {
              g6.warn("grid-row-span is not part of final Grid Layout. Use grid-row.", { node: b7 });
              return;
            } else if (S6 === "grid-column-span") {
              g6.warn("grid-column-span is not part of final Grid Layout. Use grid-column.", { node: b7 });
              return;
            } else if (S6 === "display" && E6 === "box") {
              g6.warn("You should write display: flex by final spec instead of display: box", { node: b7 });
              return;
            } else if (S6 === "text-emphasis-position") (E6 === "under" || E6 === "over") && g6.warn("You should use 2 values for text-emphasis-position For example, `under left` instead of just `under`.", { node: b7 });
            else if (/^(align|justify|place)-(items|content)$/.test(S6) && k5(b7)) (E6 === "start" || E6 === "end") && g6.warn(`${E6} value has mixed support, consider using flex-${E6} instead`, { node: b7 });
            else if (S6 === "text-decoration-skip" && E6 === "ink") g6.warn("Replace text-decoration-skip: ink to text-decoration-skip-ink: auto, because spec had been changed", { node: b7 });
            else {
              if (w7 && this.gridStatus(b7, g6)) if (b7.value === "subgrid" && g6.warn("IE does not support subgrid", { node: b7 }), /^(align|justify|place)-items$/.test(S6) && x5(b7)) {
                let _6 = S6.replace("-items", "-self");
                g6.warn(`IE does not support ${S6} on grid containers. Try using ${_6} on child elements instead: ${b7.parent.selector} > * { ${_6}: ${b7.value} }`, { node: b7 });
              } else if (/^(align|justify|place)-content$/.test(S6) && x5(b7)) g6.warn(`IE does not support ${b7.prop} on grid containers`, { node: b7 });
              else if (S6 === "display" && b7.value === "contents") {
                g6.warn("Please do not use display: contents; if you have grid setting enabled", { node: b7 });
                return;
              } else if (b7.prop === "grid-gap") {
                let _6 = this.gridStatus(b7, g6);
                _6 === "autoplace" && !u5(b7) && !d6(b7) ? g6.warn("grid-gap only works if grid-template(-areas) is being used or both rows and columns have been declared and cells have not been manually placed inside the explicit grid", { node: b7 }) : (_6 === true || _6 === "no-autoplace") && !d6(b7) && g6.warn("grid-gap only works if grid-template(-areas) is being used", { node: b7 });
              } else if (S6 === "grid-auto-columns") {
                g6.warn("grid-auto-columns is not supported by IE", { node: b7 });
                return;
              } else if (S6 === "grid-auto-rows") {
                g6.warn("grid-auto-rows is not supported by IE", { node: b7 });
                return;
              } else if (S6 === "grid-auto-flow") {
                let _6 = C5.some((D7) => D7.prop === "grid-template-rows"), U4 = C5.some((D7) => D7.prop === "grid-template-columns");
                d6(b7) ? g6.warn("grid-auto-flow is not supported by IE", { node: b7 }) : E6.includes("dense") ? g6.warn("grid-auto-flow: dense is not supported by IE", { node: b7 }) : !_6 && !U4 && g6.warn("grid-auto-flow works only if grid-template-rows and grid-template-columns are present in the same rule", { node: b7 });
                return;
              } else if (E6.includes("auto-fit")) {
                g6.warn("auto-fit value is not supported by IE", { node: b7, word: "auto-fit" });
                return;
              } else if (E6.includes("auto-fill")) {
                g6.warn("auto-fill value is not supported by IE", { node: b7, word: "auto-fill" });
                return;
              } else S6.startsWith("grid-template") && E6.includes("[") && g6.warn("Autoprefixer currently does not support line names. Try using grid-template-areas instead.", { node: b7, word: "[" });
              if (E6.includes("radial-gradient")) if (a4.test(b7.value)) g6.warn("Gradient has outdated direction syntax. New syntax is like `closest-side at 0 0` instead of `0 0, closest-side`.", { node: b7 });
              else {
                let _6 = r3(E6);
                for (let U4 of _6.nodes) if (U4.type === "function" && U4.value === "radial-gradient") for (let D7 of U4.nodes) D7.type === "word" && (D7.value === "cover" ? g6.warn("Gradient has outdated direction syntax. Replace `cover` to `farthest-corner`.", { node: b7 }) : D7.value === "contain" && g6.warn("Gradient has outdated direction syntax. Replace `contain` to `closest-side`.", { node: b7 }));
              }
              E6.includes("linear-gradient") && s7.test(E6) && g6.warn("Gradient has outdated direction syntax. New syntax is like `to left` instead of `right`.", { node: b7 });
            }
            i4.includes(b7.prop) && (b7.value.includes("-fill-available") || (b7.value.includes("fill-available") ? g6.warn("Replace fill-available to stretch, because spec had been changed", { node: b7 }) : b7.value.includes("fill") && r3(E6).nodes.some((_6) => _6.type === "word" && _6.value === "fill") && g6.warn("Replace fill to stretch, because spec had been changed", { node: b7 })));
            let A7;
            if (b7.prop === "transition" || b7.prop === "transition-property") return this.prefixes.transition.add(b7, g6);
            if (b7.prop === "align-self") {
              if (this.displayType(b7) !== "grid" && this.prefixes.options.flexbox !== false && (A7 = this.prefixes.add["align-self"], A7 && A7.prefixes && A7.process(b7)), this.gridStatus(b7, g6) !== false && (A7 = this.prefixes.add["grid-row-align"], A7 && A7.prefixes)) return A7.process(b7, g6);
            } else if (b7.prop === "justify-self") {
              if (this.gridStatus(b7, g6) !== false && (A7 = this.prefixes.add["grid-column-align"], A7 && A7.prefixes)) return A7.process(b7, g6);
            } else if (b7.prop === "place-self") {
              if (A7 = this.prefixes.add["place-self"], A7 && A7.prefixes && this.gridStatus(b7, g6) !== false) return A7.process(b7, g6);
            } else if (A7 = this.prefixes.add[b7.prop], A7 && A7.prefixes) return A7.process(b7, g6);
          }), this.gridStatus(f6, g6) && o7(f6, this.disabled), f6.walkDecls((b7) => {
            if (this.disabledValue(b7, g6)) return;
            let C5 = this.prefixes.unprefixed(b7.prop), S6 = this.prefixes.values("add", C5);
            if (Array.isArray(S6)) for (let E6 of S6) E6.process && E6.process(b7, g6);
            n3.save(this.prefixes, b7);
          });
        }
        remove(f6, g6) {
          let h7 = this.prefixes.remove["@resolution"];
          f6.walkAtRules((m6, y9) => {
            this.prefixes.remove[`@${m6.name}`] ? this.disabled(m6, g6) || m6.parent.removeChild(y9) : m6.name === "media" && m6.params.includes("-resolution") && h7 && h7.clean(m6);
          });
          for (let m6 of this.prefixes.remove.selectors) f6.walkRules((y9, v6) => {
            m6.check(y9) && (this.disabled(y9, g6) || y9.parent.removeChild(v6));
          });
          return f6.walkDecls((m6, y9) => {
            if (this.disabled(m6, g6)) return;
            let v6 = m6.parent, x5 = this.prefixes.unprefixed(m6.prop);
            if ((m6.prop === "transition" || m6.prop === "transition-property") && this.prefixes.transition.remove(m6), this.prefixes.remove[m6.prop] && this.prefixes.remove[m6.prop].remove) {
              let k5 = this.prefixes.group(m6).down((w7) => this.prefixes.normalize(w7.prop) === x5);
              if (x5 === "flex-flow" && (k5 = true), m6.prop === "-webkit-box-orient") {
                let w7 = { "flex-direction": true, "flex-flow": true };
                if (!m6.parent.some((b7) => w7[b7.prop])) return;
              }
              if (k5 && !this.withHackValue(m6)) {
                m6.raw("before").includes(`
`) && this.reduceSpaces(m6), v6.removeChild(y9);
                return;
              }
            }
            for (let k5 of this.prefixes.values("remove", x5)) if (!(!k5.check || !k5.check(m6.value)) && (x5 = k5.unprefixed, this.prefixes.group(m6).down((w7) => w7.value.includes(x5)))) {
              v6.removeChild(y9);
              return;
            }
          });
        }
        withHackValue(f6) {
          return f6.prop === "-webkit-background-clip" && f6.value === "text";
        }
        disabledValue(f6, g6) {
          return this.gridStatus(f6, g6) === false && f6.type === "decl" && f6.prop === "display" && f6.value.includes("grid") || this.prefixes.options.flexbox === false && f6.type === "decl" && f6.prop === "display" && f6.value.includes("flex") || f6.type === "decl" && f6.prop === "content" ? true : this.disabled(f6, g6);
        }
        disabledDecl(f6, g6) {
          if (this.gridStatus(f6, g6) === false && f6.type === "decl" && (f6.prop.includes("grid") || f6.prop === "justify-items")) return true;
          if (this.prefixes.options.flexbox === false && f6.type === "decl") {
            let h7 = ["order", "justify-content", "align-items", "align-content"];
            if (f6.prop.includes("flex") || h7.includes(f6.prop)) return true;
          }
          return this.disabled(f6, g6);
        }
        disabled(f6, g6) {
          if (!f6) return false;
          if (f6._autoprefixerDisabled !== void 0) return f6._autoprefixerDisabled;
          if (f6.parent) {
            let m6 = f6.prev();
            if (m6 && m6.type === "comment" && l3.test(m6.text)) return f6._autoprefixerDisabled = true, f6._autoprefixerSelfDisabled = true, true;
          }
          let h7 = null;
          if (f6.nodes) {
            let m6;
            f6.each((y9) => {
              y9.type === "comment" && /(!\s*)?autoprefixer:\s*(off|on)/i.test(y9.text) && (typeof m6 < "u" ? g6.warn("Second Autoprefixer control comment was ignored. Autoprefixer applies control comment to whole block, not to next rules.", { node: y9 }) : m6 = /on/i.test(y9.text));
            }), m6 !== void 0 && (h7 = !m6);
          }
          if (!f6.nodes || h7 === null) if (f6.parent) {
            let m6 = this.disabled(f6.parent, g6);
            f6.parent._autoprefixerSelfDisabled === true ? h7 = false : h7 = m6;
          } else h7 = false;
          return f6._autoprefixerDisabled = h7, h7;
        }
        reduceSpaces(f6) {
          let g6 = false;
          if (this.prefixes.group(f6).up(() => (g6 = true, true)), g6) return;
          let h7 = f6.raw("before").split(`
`), m6 = h7[h7.length - 1].length, y9 = false;
          this.prefixes.group(f6).down((v6) => {
            h7 = v6.raw("before").split(`
`);
            let x5 = h7.length - 1;
            h7[x5].length > m6 && (y9 === false && (y9 = h7[x5].length - m6), h7[x5] = h7[x5].slice(0, -y9), v6.raws.before = h7.join(`
`));
          });
        }
        displayType(f6) {
          for (let g6 of f6.parent.nodes) if (g6.prop === "display") {
            if (g6.value.includes("flex")) return "flex";
            if (g6.value.includes("grid")) return "grid";
          }
          return false;
        }
        gridStatus(f6, g6) {
          if (!f6) return false;
          if (f6._autoprefixerGridStatus !== void 0) return f6._autoprefixerGridStatus;
          let h7 = null;
          if (f6.nodes) {
            let m6;
            f6.each((y9) => {
              if (y9.type === "comment" && c5.test(y9.text)) {
                let v6 = /:\s*autoplace/i.test(y9.text), x5 = /no-autoplace/i.test(y9.text);
                typeof m6 < "u" ? g6.warn("Second Autoprefixer grid control comment was ignored. Autoprefixer applies control comments to the whole block, not to the next rules.", { node: y9 }) : v6 ? m6 = "autoplace" : x5 ? m6 = true : m6 = /on/i.test(y9.text);
              }
            }), m6 !== void 0 && (h7 = m6);
          }
          if (f6.type === "atrule" && f6.name === "supports") {
            let m6 = f6.params;
            m6.includes("grid") && m6.includes("auto") && (h7 = false);
          }
          if (!f6.nodes || h7 === null) if (f6.parent) {
            let m6 = this.gridStatus(f6.parent, g6);
            f6.parent._autoprefixerSelfDisabled === true ? h7 = false : h7 = m6;
          } else typeof this.prefixes.options.grid < "u" ? h7 = this.prefixes.options.grid : typeof je3.env.AUTOPREFIXER_GRID < "u" ? je3.env.AUTOPREFIXER_GRID === "autoplace" ? h7 = "autoplace" : h7 = true : h7 = false;
          return f6._autoprefixerGridStatus = h7, h7;
        }
      };
      t.exports = p4;
    }), Kd = T7((e, t) => {
      O7(), t.exports = { A: { A: { 2: "K E F G A B JC" }, B: { 1: "C L M H N D O P Q R S T U V W X Y Z a b c d e f g h i j n o p q r s t u v w x y z I" }, C: { 1: "2 3 4 5 6 7 8 9 AB BB CB DB EB FB GB HB IB JB KB LB MB NB OB PB QB RB SB TB UB VB WB XB YB ZB aB bB cB 0B dB 1B eB fB gB hB iB jB kB lB mB nB oB m pB qB rB sB tB P Q R 2B S T U V W X Y Z a b c d e f g h i j n o p q r s t u v w x y z I uB 3B 4B", 2: "0 1 KC zB J K E F G A B C L M H N D O k l LC MC" }, D: { 1: "8 9 AB BB CB DB EB FB GB HB IB JB KB LB MB NB OB PB QB RB SB TB UB VB WB XB YB ZB aB bB cB 0B dB 1B eB fB gB hB iB jB kB lB mB nB oB m pB qB rB sB tB P Q R S T U V W X Y Z a b c d e f g h i j n o p q r s t u v w x y z I uB 3B 4B", 2: "0 1 2 3 4 5 6 7 J K E F G A B C L M H N D O k l" }, E: { 1: "G A B C L M H D RC 6B vB wB 7B SC TC 8B 9B xB AC yB BC CC DC EC FC GC UC", 2: "0 J K E F NC 5B OC PC QC" }, F: { 1: "1 2 3 4 5 6 7 8 9 H N D O k l AB BB CB DB EB FB GB HB IB JB KB LB MB NB OB PB QB RB SB TB UB VB WB XB YB ZB aB bB cB dB eB fB gB hB iB jB kB lB mB nB oB m pB qB rB sB tB P Q R 2B S T U V W X Y Z a b c d e f g h i j wB", 2: "G B C VC WC XC YC vB HC ZC" }, G: { 1: "D fC gC hC iC jC kC lC mC nC oC pC qC rC sC tC 8B 9B xB AC yB BC CC DC EC FC GC", 2: "F 5B aC IC bC cC dC eC" }, H: { 1: "uC" }, I: { 1: "I zC 0C", 2: "zB J vC wC xC yC IC" }, J: { 2: "E A" }, K: { 1: "m", 2: "A B C vB HC wB" }, L: { 1: "I" }, M: { 1: "uB" }, N: { 2: "A B" }, O: { 1: "xB" }, P: { 1: "J k l 1C 2C 3C 4C 5C 6B 6C 7C 8C 9C AD yB BD CD DD" }, Q: { 1: "7B" }, R: { 1: "ED" }, S: { 1: "FD GD" } }, B: 4, C: "CSS Feature Queries" };
    }), ep = T7((e, t) => {
      O7();
      function r3(o7) {
        return o7[o7.length - 1];
      }
      var n3 = { parse(o7) {
        let s7 = [""], a4 = [s7];
        for (let l3 of o7) {
          if (l3 === "(") {
            s7 = [""], r3(a4).push(s7), a4.push(s7);
            continue;
          }
          if (l3 === ")") {
            a4.pop(), s7 = r3(a4), s7.push("");
            continue;
          }
          s7[s7.length - 1] += l3;
        }
        return a4[0];
      }, stringify(o7) {
        let s7 = "";
        for (let a4 of o7) {
          if (typeof a4 == "object") {
            s7 += `(${n3.stringify(a4)})`;
            continue;
          }
          s7 += a4;
        }
        return s7;
      } };
      t.exports = n3;
    }), tp = T7((e, t) => {
      O7();
      var r3 = Kd(), { feature: n3 } = (Xn(), Tr2), { parse: o7 } = Re3(), s7 = gt2(), a4 = ep(), l3 = Ve3(), c5 = _e3(), i4 = n3(r3), d6 = [];
      for (let p4 in i4.stats) {
        let f6 = i4.stats[p4];
        for (let g6 in f6) {
          let h7 = f6[g6];
          /y/.test(h7) && d6.push(p4 + " " + g6);
        }
      }
      var u5 = class {
        constructor(p4, f6) {
          this.Prefixes = p4, this.all = f6;
        }
        prefixer() {
          if (this.prefixerCache) return this.prefixerCache;
          let p4 = this.all.browsers.selected.filter((g6) => d6.includes(g6)), f6 = new s7(this.all.browsers.data, p4, this.all.options);
          return this.prefixerCache = new this.Prefixes(this.all.data, f6, this.all.options), this.prefixerCache;
        }
        parse(p4) {
          let f6 = p4.split(":"), g6 = f6[0], h7 = f6[1];
          return h7 || (h7 = ""), [g6.trim(), h7.trim()];
        }
        virtual(p4) {
          let [f6, g6] = this.parse(p4), h7 = o7("a{}").first;
          return h7.append({ prop: f6, value: g6, raws: { before: "" } }), h7;
        }
        prefixed(p4) {
          let f6 = this.virtual(p4);
          if (this.disabled(f6.first)) return f6.nodes;
          let g6 = { warn: () => null }, h7 = this.prefixer().add[f6.first.prop];
          h7 && h7.process && h7.process(f6.first, g6);
          for (let m6 of f6.nodes) {
            for (let y9 of this.prefixer().values("add", f6.first.prop)) y9.process(m6);
            l3.save(this.all, m6);
          }
          return f6.nodes;
        }
        isNot(p4) {
          return typeof p4 == "string" && /not\s*/i.test(p4);
        }
        isOr(p4) {
          return typeof p4 == "string" && /\s*or\s*/i.test(p4);
        }
        isProp(p4) {
          return typeof p4 == "object" && p4.length === 1 && typeof p4[0] == "string";
        }
        isHack(p4, f6) {
          return !new RegExp(`(\\(|\\s)${c5.escapeRegexp(f6)}:`).test(p4);
        }
        toRemove(p4, f6) {
          let [g6, h7] = this.parse(p4), m6 = this.all.unprefixed(g6), y9 = this.all.cleaner();
          if (y9.remove[g6] && y9.remove[g6].remove && !this.isHack(f6, m6)) return true;
          for (let v6 of y9.values("remove", m6)) if (v6.check(h7)) return true;
          return false;
        }
        remove(p4, f6) {
          let g6 = 0;
          for (; g6 < p4.length; ) {
            if (!this.isNot(p4[g6 - 1]) && this.isProp(p4[g6]) && this.isOr(p4[g6 + 1])) {
              if (this.toRemove(p4[g6][0], f6)) {
                p4.splice(g6, 2);
                continue;
              }
              g6 += 2;
              continue;
            }
            typeof p4[g6] == "object" && (p4[g6] = this.remove(p4[g6], f6)), g6 += 1;
          }
          return p4;
        }
        cleanBrackets(p4) {
          return p4.map((f6) => typeof f6 != "object" ? f6 : f6.length === 1 && typeof f6[0] == "object" ? this.cleanBrackets(f6[0]) : this.cleanBrackets(f6));
        }
        convert(p4) {
          let f6 = [""];
          for (let g6 of p4) f6.push([`${g6.prop}: ${g6.value}`]), f6.push(" or ");
          return f6[f6.length - 1] = "", f6;
        }
        normalize(p4) {
          if (typeof p4 != "object") return p4;
          if (p4 = p4.filter((f6) => f6 !== ""), typeof p4[0] == "string") {
            let f6 = p4[0].trim();
            if (f6.includes(":") || f6 === "selector" || f6 === "not selector") return [a4.stringify(p4)];
          }
          return p4.map((f6) => this.normalize(f6));
        }
        add(p4, f6) {
          return p4.map((g6) => {
            if (this.isProp(g6)) {
              let h7 = this.prefixed(g6[0]);
              return h7.length > 1 ? this.convert(h7) : g6;
            }
            return typeof g6 == "object" ? this.add(g6, f6) : g6;
          });
        }
        process(p4) {
          let f6 = a4.parse(p4.params);
          f6 = this.normalize(f6), f6 = this.remove(f6, p4.params), f6 = this.add(f6, p4.params), f6 = this.cleanBrackets(f6), p4.params = a4.stringify(f6);
        }
        disabled(p4) {
          if (!this.all.options.grid && (p4.prop === "display" && p4.value.includes("grid") || p4.prop.includes("grid") || p4.prop === "justify-items")) return true;
          if (this.all.options.flexbox === false) {
            if (p4.prop === "display" && p4.value.includes("flex")) return true;
            let f6 = ["order", "justify-content", "align-items", "align-content"];
            if (p4.prop.includes("flex") || f6.includes(p4.prop)) return true;
          }
          return false;
        }
      };
      t.exports = u5;
    }), rp = T7((e, t) => {
      O7();
      var r3 = class {
        constructor(n3, o7) {
          this.prefix = o7, this.prefixed = n3.prefixed(this.prefix), this.regexp = n3.regexp(this.prefix), this.prefixeds = n3.possible().map((s7) => [n3.prefixed(s7), n3.regexp(s7)]), this.unprefixed = n3.name, this.nameRegexp = n3.regexp();
        }
        isHack(n3) {
          let o7 = n3.parent.index(n3) + 1, s7 = n3.parent.nodes;
          for (; o7 < s7.length; ) {
            let a4 = s7[o7].selector;
            if (!a4) return true;
            if (a4.includes(this.unprefixed) && a4.match(this.nameRegexp)) return false;
            let l3 = false;
            for (let [c5, i4] of this.prefixeds) if (a4.includes(c5) && a4.match(i4)) {
              l3 = true;
              break;
            }
            if (!l3) return true;
            o7 += 1;
          }
          return true;
        }
        check(n3) {
          return !(!n3.selector.includes(this.prefixed) || !n3.selector.match(this.regexp) || this.isHack(n3));
        }
      };
      t.exports = r3;
    }), Wt = T7((e, t) => {
      O7();
      var { list: r3 } = Re3(), n3 = rp(), o7 = Nt(), s7 = gt2(), a4 = _e3(), l3 = class extends o7 {
        constructor(c5, i4, d6) {
          super(c5, i4, d6), this.regexpCache = /* @__PURE__ */ new Map();
        }
        check(c5) {
          return c5.selector.includes(this.name) ? !!c5.selector.match(this.regexp()) : false;
        }
        prefixed(c5) {
          return this.name.replace(/^(\W*)/, `$1${c5}`);
        }
        regexp(c5) {
          if (!this.regexpCache.has(c5)) {
            let i4 = c5 ? this.prefixed(c5) : this.name;
            this.regexpCache.set(c5, new RegExp(`(^|[^:"'=])${a4.escapeRegexp(i4)}`, "gi"));
          }
          return this.regexpCache.get(c5);
        }
        possible() {
          return s7.prefixes();
        }
        prefixeds(c5) {
          if (c5._autoprefixerPrefixeds) {
            if (c5._autoprefixerPrefixeds[this.name]) return c5._autoprefixerPrefixeds;
          } else c5._autoprefixerPrefixeds = {};
          let i4 = {};
          if (c5.selector.includes(",")) {
            let d6 = r3.comma(c5.selector).filter((u5) => u5.includes(this.name));
            for (let u5 of this.possible()) i4[u5] = d6.map((p4) => this.replace(p4, u5)).join(", ");
          } else for (let d6 of this.possible()) i4[d6] = this.replace(c5.selector, d6);
          return c5._autoprefixerPrefixeds[this.name] = i4, c5._autoprefixerPrefixeds;
        }
        already(c5, i4, d6) {
          let u5 = c5.parent.index(c5) - 1;
          for (; u5 >= 0; ) {
            let p4 = c5.parent.nodes[u5];
            if (p4.type !== "rule") return false;
            let f6 = false;
            for (let g6 in i4[this.name]) {
              let h7 = i4[this.name][g6];
              if (p4.selector === h7) {
                if (d6 === g6) return true;
                f6 = true;
                break;
              }
            }
            if (!f6) return false;
            u5 -= 1;
          }
          return false;
        }
        replace(c5, i4) {
          return c5.replace(this.regexp(), `$1${this.prefixed(i4)}`);
        }
        add(c5, i4) {
          let d6 = this.prefixeds(c5);
          if (this.already(c5, d6, i4)) return;
          let u5 = this.clone(c5, { selector: d6[this.name][i4] });
          c5.parent.insertBefore(c5, u5);
        }
        old(c5) {
          return new n3(this, c5);
        }
      };
      t.exports = l3;
    }), np = T7((e, t) => {
      O7();
      var r3 = Nt(), n3 = class extends r3 {
        add(o7, s7) {
          let a4 = s7 + o7.name;
          if (o7.parent.some((c5) => c5.name === a4 && c5.params === o7.params)) return;
          let l3 = this.clone(o7, { name: a4 });
          return o7.parent.insertBefore(o7, l3);
        }
        process(o7) {
          let s7 = this.parentPrefix(o7);
          for (let a4 of this.prefixes) (!s7 || s7 === a4) && this.add(o7, a4);
        }
      };
      t.exports = n3;
    }), op = T7((e, t) => {
      O7();
      var r3 = Wt(), n3 = class extends r3 {
        prefixed(o7) {
          return o7 === "-webkit-" ? ":-webkit-full-screen" : o7 === "-moz-" ? ":-moz-full-screen" : `:${o7}fullscreen`;
        }
      };
      n3.names = [":fullscreen"], t.exports = n3;
    }), sp = T7((e, t) => {
      O7();
      var r3 = Wt(), n3 = class extends r3 {
        possible() {
          return super.possible().concat(["-moz- old", "-ms- old"]);
        }
        prefixed(o7) {
          return o7 === "-webkit-" ? "::-webkit-input-placeholder" : o7 === "-ms-" ? "::-ms-input-placeholder" : o7 === "-ms- old" ? ":-ms-input-placeholder" : o7 === "-moz- old" ? ":-moz-placeholder" : `::${o7}placeholder`;
        }
      };
      n3.names = ["::placeholder"], t.exports = n3;
    }), ap = T7((e, t) => {
      O7();
      var r3 = Wt(), n3 = class extends r3 {
        prefixed(o7) {
          return o7 === "-ms-" ? ":-ms-input-placeholder" : `:${o7}placeholder-shown`;
        }
      };
      n3.names = [":placeholder-shown"], t.exports = n3;
    }), ip = T7((e, t) => {
      O7();
      var r3 = Wt(), n3 = _e3(), o7 = class extends r3 {
        constructor(s7, a4, l3) {
          super(s7, a4, l3), this.prefixes && (this.prefixes = n3.uniq(this.prefixes.map((c5) => "-webkit-")));
        }
        prefixed(s7) {
          return s7 === "-webkit-" ? "::-webkit-file-upload-button" : `::${s7}file-selector-button`;
        }
      };
      o7.names = ["::file-selector-button"], t.exports = o7;
    }), Te2 = T7((e, t) => {
      O7(), t.exports = function(r3) {
        let n3;
        return r3 === "-webkit- 2009" || r3 === "-moz-" ? n3 = 2009 : r3 === "-ms-" ? n3 = 2012 : r3 === "-webkit-" && (n3 = "final"), r3 === "-webkit- 2009" && (r3 = "-webkit-"), [n3, r3];
      };
    }), lp = T7((e, t) => {
      O7();
      var r3 = Re3().list, n3 = Te2(), o7 = Y3(), s7 = class extends o7 {
        prefixed(a4, l3) {
          let c5;
          return [c5, l3] = n3(l3), c5 === 2009 ? l3 + "box-flex" : super.prefixed(a4, l3);
        }
        normalize() {
          return "flex";
        }
        set(a4, l3) {
          let c5 = n3(l3)[0];
          if (c5 === 2009) return a4.value = r3.space(a4.value)[0], a4.value = s7.oldValues[a4.value] || a4.value, super.set(a4, l3);
          if (c5 === 2012) {
            let i4 = r3.space(a4.value);
            i4.length === 3 && i4[2] === "0" && (a4.value = i4.slice(0, 2).concat("0px").join(" "));
          }
          return super.set(a4, l3);
        }
      };
      s7.names = ["flex", "box-flex"], s7.oldValues = { auto: "1", none: "0" }, t.exports = s7;
    }), cp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2009 ? a4 + "box-ordinal-group" : l3 === 2012 ? a4 + "flex-order" : super.prefixed(s7, a4);
        }
        normalize() {
          return "order";
        }
        set(s7, a4) {
          return r3(a4)[0] === 2009 && /\d/.test(s7.value) ? (s7.value = (parseInt(s7.value) + 1).toString(), super.set(s7, a4)) : super.set(s7, a4);
        }
      };
      o7.names = ["order", "flex-order", "box-ordinal-group"], t.exports = o7;
    }), up = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        check(o7) {
          let s7 = o7.value;
          return !s7.toLowerCase().includes("alpha(") && !s7.includes("DXImageTransform.Microsoft") && !s7.includes("data:image/svg+xml");
        }
      };
      n3.names = ["filter"], t.exports = n3;
    }), dp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        insert(o7, s7, a4, l3) {
          if (s7 !== "-ms-") return super.insert(o7, s7, a4);
          let c5 = this.clone(o7), i4 = o7.prop.replace(/end$/, "start"), d6 = s7 + o7.prop.replace(/end$/, "span");
          if (!o7.parent.some((u5) => u5.prop === d6)) {
            if (c5.prop = d6, o7.value.includes("span")) c5.value = o7.value.replace(/span\s/i, "");
            else {
              let u5;
              if (o7.parent.walkDecls(i4, (p4) => {
                u5 = p4;
              }), u5) {
                let p4 = Number(o7.value) - Number(u5.value) + "";
                c5.value = p4;
              } else o7.warn(l3, `Can not prefix ${o7.prop} (${i4} is not found)`);
            }
            o7.cloneBefore(c5);
          }
        }
      };
      n3.names = ["grid-row-end", "grid-column-end"], t.exports = n3;
    }), pp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        check(o7) {
          return !o7.value.split(/\s+/).some((s7) => {
            let a4 = s7.toLowerCase();
            return a4 === "reverse" || a4 === "alternate-reverse";
          });
        }
      };
      n3.names = ["animation", "animation-direction"], t.exports = n3;
    }), fp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        insert(s7, a4, l3) {
          let c5;
          if ([c5, a4] = r3(a4), c5 !== 2009) return super.insert(s7, a4, l3);
          let i4 = s7.value.split(/\s+/).filter((g6) => g6 !== "wrap" && g6 !== "nowrap" && "wrap-reverse");
          if (i4.length === 0 || s7.parent.some((g6) => g6.prop === a4 + "box-orient" || g6.prop === a4 + "box-direction")) return;
          let d6 = i4[0], u5 = d6.includes("row") ? "horizontal" : "vertical", p4 = d6.includes("reverse") ? "reverse" : "normal", f6 = this.clone(s7);
          return f6.prop = a4 + "box-orient", f6.value = u5, this.needCascade(s7) && (f6.raws.before = this.calcBefore(l3, s7, a4)), s7.parent.insertBefore(s7, f6), f6 = this.clone(s7), f6.prop = a4 + "box-direction", f6.value = p4, this.needCascade(s7) && (f6.raws.before = this.calcBefore(l3, s7, a4)), s7.parent.insertBefore(s7, f6);
        }
      };
      o7.names = ["flex-flow", "box-direction", "box-orient"], t.exports = o7;
    }), hp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        normalize() {
          return "flex";
        }
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2009 ? a4 + "box-flex" : l3 === 2012 ? a4 + "flex-positive" : super.prefixed(s7, a4);
        }
      };
      o7.names = ["flex-grow", "flex-positive"], t.exports = o7;
    }), mp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        set(s7, a4) {
          if (r3(a4)[0] !== 2009) return super.set(s7, a4);
        }
      };
      o7.names = ["flex-wrap"], t.exports = o7;
    }), gp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = vt2(), o7 = class extends r3 {
        insert(s7, a4, l3, c5) {
          if (a4 !== "-ms-") return super.insert(s7, a4, l3);
          let i4 = n3.parse(s7), [d6, u5] = n3.translate(i4, 0, 2), [p4, f6] = n3.translate(i4, 1, 3);
          [["grid-row", d6], ["grid-row-span", u5], ["grid-column", p4], ["grid-column-span", f6]].forEach(([g6, h7]) => {
            n3.insertDecl(s7, g6, h7);
          }), n3.warnTemplateSelectorNotFound(s7, c5), n3.warnIfGridRowColumnExists(s7, c5);
        }
      };
      o7.names = ["grid-area"], t.exports = o7;
    }), vp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = vt2(), o7 = class extends r3 {
        insert(s7, a4, l3) {
          if (a4 !== "-ms-") return super.insert(s7, a4, l3);
          if (s7.parent.some((d6) => d6.prop === "-ms-grid-row-align")) return;
          let [[c5, i4]] = n3.parse(s7);
          i4 ? (n3.insertDecl(s7, "grid-row-align", c5), n3.insertDecl(s7, "grid-column-align", i4)) : (n3.insertDecl(s7, "grid-row-align", c5), n3.insertDecl(s7, "grid-column-align", c5));
        }
      };
      o7.names = ["place-self"], t.exports = o7;
    }), yp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        check(o7) {
          let s7 = o7.value;
          return !s7.includes("/") || s7.includes("span");
        }
        normalize(o7) {
          return o7.replace("-start", "");
        }
        prefixed(o7, s7) {
          let a4 = super.prefixed(o7, s7);
          return s7 === "-ms-" && (a4 = a4.replace("-start", "")), a4;
        }
      };
      n3.names = ["grid-row-start", "grid-column-start"], t.exports = n3;
    }), bp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        check(s7) {
          return s7.parent && !s7.parent.some((a4) => a4.prop && a4.prop.startsWith("grid-"));
        }
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2012 ? a4 + "flex-item-align" : super.prefixed(s7, a4);
        }
        normalize() {
          return "align-self";
        }
        set(s7, a4) {
          let l3 = r3(a4)[0];
          if (l3 === 2012) return s7.value = o7.oldValues[s7.value] || s7.value, super.set(s7, a4);
          if (l3 === "final") return super.set(s7, a4);
        }
      };
      o7.names = ["align-self", "flex-item-align"], o7.oldValues = { "flex-end": "end", "flex-start": "start" }, t.exports = o7;
    }), wp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = _e3(), o7 = class extends r3 {
        constructor(s7, a4, l3) {
          super(s7, a4, l3), this.prefixes && (this.prefixes = n3.uniq(this.prefixes.map((c5) => c5 === "-ms-" ? "-webkit-" : c5)));
        }
      };
      o7.names = ["appearance"], t.exports = o7;
    }), xp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        normalize() {
          return "flex-basis";
        }
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2012 ? a4 + "flex-preferred-size" : super.prefixed(s7, a4);
        }
        set(s7, a4) {
          let l3;
          if ([l3, a4] = r3(a4), l3 === 2012 || l3 === "final") return super.set(s7, a4);
        }
      };
      o7.names = ["flex-basis", "flex-preferred-size"], t.exports = o7;
    }), kp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        normalize() {
          return this.name.replace("box-image", "border");
        }
        prefixed(o7, s7) {
          let a4 = super.prefixed(o7, s7);
          return s7 === "-webkit-" && (a4 = a4.replace("border", "box-image")), a4;
        }
      };
      n3.names = ["mask-border", "mask-border-source", "mask-border-slice", "mask-border-width", "mask-border-outset", "mask-border-repeat", "mask-box-image", "mask-box-image-source", "mask-box-image-slice", "mask-box-image-width", "mask-box-image-outset", "mask-box-image-repeat"], t.exports = n3;
    }), Sp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        insert(o7, s7, a4) {
          let l3 = o7.prop === "mask-composite", c5;
          l3 ? c5 = o7.value.split(",") : c5 = o7.value.match(n3.regexp) || [], c5 = c5.map((p4) => p4.trim()).filter((p4) => p4);
          let i4 = c5.length, d6;
          if (i4 && (d6 = this.clone(o7), d6.value = c5.map((p4) => n3.oldValues[p4] || p4).join(", "), c5.includes("intersect") && (d6.value += ", xor"), d6.prop = s7 + "mask-composite"), l3) return i4 ? (this.needCascade(o7) && (d6.raws.before = this.calcBefore(a4, o7, s7)), o7.parent.insertBefore(o7, d6)) : void 0;
          let u5 = this.clone(o7);
          return u5.prop = s7 + u5.prop, i4 && (u5.value = u5.value.replace(n3.regexp, "")), this.needCascade(o7) && (u5.raws.before = this.calcBefore(a4, o7, s7)), o7.parent.insertBefore(o7, u5), i4 ? (this.needCascade(o7) && (d6.raws.before = this.calcBefore(a4, o7, s7)), o7.parent.insertBefore(o7, d6)) : o7;
        }
      };
      n3.names = ["mask", "mask-composite"], n3.oldValues = { add: "source-over", subtract: "source-out", intersect: "source-in", exclude: "xor" }, n3.regexp = new RegExp(`\\s+(${Object.keys(n3.oldValues).join("|")})\\b(?!\\))\\s*(?=[,])`, "ig"), t.exports = n3;
    }), Cp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2009 ? a4 + "box-align" : l3 === 2012 ? a4 + "flex-align" : super.prefixed(s7, a4);
        }
        normalize() {
          return "align-items";
        }
        set(s7, a4) {
          let l3 = r3(a4)[0];
          return (l3 === 2009 || l3 === 2012) && (s7.value = o7.oldValues[s7.value] || s7.value), super.set(s7, a4);
        }
      };
      o7.names = ["align-items", "flex-align", "box-align"], o7.oldValues = { "flex-end": "end", "flex-start": "start" }, t.exports = o7;
    }), Ap = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        set(o7, s7) {
          return s7 === "-ms-" && o7.value === "contain" && (o7.value = "element"), super.set(o7, s7);
        }
        insert(o7, s7, a4) {
          if (!(o7.value === "all" && s7 === "-ms-")) return super.insert(o7, s7, a4);
        }
      };
      n3.names = ["user-select"], t.exports = n3;
    }), Op = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        normalize() {
          return "flex-shrink";
        }
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2012 ? a4 + "flex-negative" : super.prefixed(s7, a4);
        }
        set(s7, a4) {
          let l3;
          if ([l3, a4] = r3(a4), l3 === 2012 || l3 === "final") return super.set(s7, a4);
        }
      };
      o7.names = ["flex-shrink", "flex-negative"], t.exports = o7;
    }), _p = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        prefixed(o7, s7) {
          return `${s7}column-${o7}`;
        }
        normalize(o7) {
          return o7.includes("inside") ? "break-inside" : o7.includes("before") ? "break-before" : "break-after";
        }
        set(o7, s7) {
          return (o7.prop === "break-inside" && o7.value === "avoid-column" || o7.value === "avoid-page") && (o7.value = "avoid"), super.set(o7, s7);
        }
        insert(o7, s7, a4) {
          if (o7.prop !== "break-inside") return super.insert(o7, s7, a4);
          if (!(/region/i.test(o7.value) || /page/i.test(o7.value))) return super.insert(o7, s7, a4);
        }
      };
      n3.names = ["break-inside", "page-break-inside", "column-break-inside", "break-before", "page-break-before", "column-break-before", "break-after", "page-break-after", "column-break-after"], t.exports = n3;
    }), Ep = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        prefixed(o7, s7) {
          return s7 + "print-color-adjust";
        }
        normalize() {
          return "color-adjust";
        }
      };
      n3.names = ["color-adjust", "print-color-adjust"], t.exports = n3;
    }), Tp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        insert(o7, s7, a4) {
          if (s7 === "-ms-") {
            let l3 = this.set(this.clone(o7), s7);
            this.needCascade(o7) && (l3.raws.before = this.calcBefore(a4, o7, s7));
            let c5 = "ltr";
            return o7.parent.nodes.forEach((i4) => {
              i4.prop === "direction" && (i4.value === "rtl" || i4.value === "ltr") && (c5 = i4.value);
            }), l3.value = n3.msValues[c5][o7.value] || o7.value, o7.parent.insertBefore(o7, l3);
          }
          return super.insert(o7, s7, a4);
        }
      };
      n3.names = ["writing-mode"], n3.msValues = { ltr: { "horizontal-tb": "lr-tb", "vertical-rl": "tb-rl", "vertical-lr": "tb-lr" }, rtl: { "horizontal-tb": "rl-tb", "vertical-rl": "bt-rl", "vertical-lr": "bt-lr" } }, t.exports = n3;
    }), Ip = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        set(o7, s7) {
          return o7.value = o7.value.replace(/\s+fill(\s)/, "$1"), super.set(o7, s7);
        }
      };
      n3.names = ["border-image"], t.exports = n3;
    }), Pp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2012 ? a4 + "flex-line-pack" : super.prefixed(s7, a4);
        }
        normalize() {
          return "align-content";
        }
        set(s7, a4) {
          let l3 = r3(a4)[0];
          if (l3 === 2012) return s7.value = o7.oldValues[s7.value] || s7.value, super.set(s7, a4);
          if (l3 === "final") return super.set(s7, a4);
        }
      };
      o7.names = ["align-content", "flex-line-pack"], o7.oldValues = { "flex-end": "end", "flex-start": "start", "space-between": "justify", "space-around": "distribute" }, t.exports = o7;
    }), jp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        prefixed(o7, s7) {
          return s7 === "-moz-" ? s7 + (n3.toMozilla[o7] || o7) : super.prefixed(o7, s7);
        }
        normalize(o7) {
          return n3.toNormal[o7] || o7;
        }
      };
      n3.names = ["border-radius"], n3.toMozilla = {}, n3.toNormal = {};
      for (let o7 of ["top", "bottom"]) for (let s7 of ["left", "right"]) {
        let a4 = `border-${o7}-${s7}-radius`, l3 = `border-radius-${o7}${s7}`;
        n3.names.push(a4), n3.names.push(l3), n3.toMozilla[a4] = l3, n3.toNormal[l3] = a4;
      }
      t.exports = n3;
    }), Bp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        prefixed(o7, s7) {
          return o7.includes("-start") ? s7 + o7.replace("-block-start", "-before") : s7 + o7.replace("-block-end", "-after");
        }
        normalize(o7) {
          return o7.includes("-before") ? o7.replace("-before", "-block-start") : o7.replace("-after", "-block-end");
        }
      };
      n3.names = ["border-block-start", "border-block-end", "margin-block-start", "margin-block-end", "padding-block-start", "padding-block-end", "border-before", "border-after", "margin-before", "margin-after", "padding-before", "padding-after"], t.exports = n3;
    }), Dp = T7((e, t) => {
      O7();
      var r3 = Y3(), { parseTemplate: n3, warnMissedAreas: o7, getGridGap: s7, warnGridGap: a4, inheritGridGap: l3 } = vt2(), c5 = class extends r3 {
        insert(i4, d6, u5, p4) {
          if (d6 !== "-ms-") return super.insert(i4, d6, u5);
          if (i4.parent.some((w7) => w7.prop === "-ms-grid-rows")) return;
          let f6 = s7(i4), g6 = l3(i4, f6), { rows: h7, columns: m6, areas: y9 } = n3({ decl: i4, gap: g6 || f6 }), v6 = Object.keys(y9).length > 0, x5 = !!h7, k5 = !!m6;
          return a4({ gap: f6, hasColumns: k5, decl: i4, result: p4 }), o7(y9, i4, p4), (x5 && k5 || v6) && i4.cloneBefore({ prop: "-ms-grid-rows", value: h7, raws: {} }), k5 && i4.cloneBefore({ prop: "-ms-grid-columns", value: m6, raws: {} }), i4;
        }
      };
      c5.names = ["grid-template"], t.exports = c5;
    }), $p = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        prefixed(o7, s7) {
          return s7 + o7.replace("-inline", "");
        }
        normalize(o7) {
          return o7.replace(/(margin|padding|border)-(start|end)/, "$1-inline-$2");
        }
      };
      n3.names = ["border-inline-start", "border-inline-end", "margin-inline-start", "margin-inline-end", "padding-inline-start", "padding-inline-end", "border-start", "border-end", "margin-start", "margin-end", "padding-start", "padding-end"], t.exports = n3;
    }), Rp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        check(o7) {
          return !o7.value.includes("flex-") && o7.value !== "baseline";
        }
        prefixed(o7, s7) {
          return s7 + "grid-row-align";
        }
        normalize() {
          return "align-self";
        }
      };
      n3.names = ["grid-row-align"], t.exports = n3;
    }), Mp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        keyframeParents(o7) {
          let { parent: s7 } = o7;
          for (; s7; ) {
            if (s7.type === "atrule" && s7.name === "keyframes") return true;
            ({ parent: s7 } = s7);
          }
          return false;
        }
        contain3d(o7) {
          if (o7.prop === "transform-origin") return false;
          for (let s7 of n3.functions3d) if (o7.value.includes(`${s7}(`)) return true;
          return false;
        }
        set(o7, s7) {
          return o7 = super.set(o7, s7), s7 === "-ms-" && (o7.value = o7.value.replace(/rotatez/gi, "rotate")), o7;
        }
        insert(o7, s7, a4) {
          if (s7 === "-ms-") {
            if (!this.contain3d(o7) && !this.keyframeParents(o7)) return super.insert(o7, s7, a4);
          } else if (s7 === "-o-") {
            if (!this.contain3d(o7)) return super.insert(o7, s7, a4);
          } else return super.insert(o7, s7, a4);
        }
      };
      n3.names = ["transform", "transform-origin"], n3.functions3d = ["matrix3d", "translate3d", "translateZ", "scale3d", "scaleZ", "rotate3d", "rotateX", "rotateY", "perspective"], t.exports = n3;
    }), Up = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        normalize() {
          return "flex-direction";
        }
        insert(s7, a4, l3) {
          let c5;
          if ([c5, a4] = r3(a4), c5 !== 2009) return super.insert(s7, a4, l3);
          if (s7.parent.some((f6) => f6.prop === a4 + "box-orient" || f6.prop === a4 + "box-direction")) return;
          let i4 = s7.value, d6, u5;
          i4 === "inherit" || i4 === "initial" || i4 === "unset" ? (d6 = i4, u5 = i4) : (d6 = i4.includes("row") ? "horizontal" : "vertical", u5 = i4.includes("reverse") ? "reverse" : "normal");
          let p4 = this.clone(s7);
          return p4.prop = a4 + "box-orient", p4.value = d6, this.needCascade(s7) && (p4.raws.before = this.calcBefore(l3, s7, a4)), s7.parent.insertBefore(s7, p4), p4 = this.clone(s7), p4.prop = a4 + "box-direction", p4.value = u5, this.needCascade(s7) && (p4.raws.before = this.calcBefore(l3, s7, a4)), s7.parent.insertBefore(s7, p4);
        }
        old(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2009 ? [a4 + "box-orient", a4 + "box-direction"] : super.old(s7, a4);
        }
      };
      o7.names = ["flex-direction", "box-direction", "box-orient"], t.exports = o7;
    }), zp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        check(o7) {
          return o7.value === "pixelated";
        }
        prefixed(o7, s7) {
          return s7 === "-ms-" ? "-ms-interpolation-mode" : super.prefixed(o7, s7);
        }
        set(o7, s7) {
          return s7 !== "-ms-" ? super.set(o7, s7) : (o7.prop = "-ms-interpolation-mode", o7.value = "nearest-neighbor", o7);
        }
        normalize() {
          return "image-rendering";
        }
        process(o7, s7) {
          return super.process(o7, s7);
        }
      };
      n3.names = ["image-rendering", "interpolation-mode"], t.exports = n3;
    }), Fp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = _e3(), o7 = class extends r3 {
        constructor(s7, a4, l3) {
          super(s7, a4, l3), this.prefixes && (this.prefixes = n3.uniq(this.prefixes.map((c5) => c5 === "-ms-" ? "-webkit-" : c5)));
        }
      };
      o7.names = ["backdrop-filter"], t.exports = o7;
    }), Lp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = _e3(), o7 = class extends r3 {
        constructor(s7, a4, l3) {
          super(s7, a4, l3), this.prefixes && (this.prefixes = n3.uniq(this.prefixes.map((c5) => c5 === "-ms-" ? "-webkit-" : c5)));
        }
        check(s7) {
          return s7.value.toLowerCase() === "text";
        }
      };
      o7.names = ["background-clip"], t.exports = o7;
    }), Np = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = ["none", "underline", "overline", "line-through", "blink", "inherit", "initial", "unset"], o7 = class extends r3 {
        check(s7) {
          return s7.value.split(/\s+/).some((a4) => !n3.includes(a4));
        }
      };
      o7.names = ["text-decoration"], t.exports = o7;
    }), Vp = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Y3(), o7 = class extends n3 {
        prefixed(s7, a4) {
          let l3;
          return [l3, a4] = r3(a4), l3 === 2009 ? a4 + "box-pack" : l3 === 2012 ? a4 + "flex-pack" : super.prefixed(s7, a4);
        }
        normalize() {
          return "justify-content";
        }
        set(s7, a4) {
          let l3 = r3(a4)[0];
          if (l3 === 2009 || l3 === 2012) {
            let c5 = o7.oldValues[s7.value] || s7.value;
            if (s7.value = c5, l3 !== 2009 || c5 !== "distribute") return super.set(s7, a4);
          } else if (l3 === "final") return super.set(s7, a4);
        }
      };
      o7.names = ["justify-content", "flex-pack", "box-pack"], o7.oldValues = { "flex-end": "end", "flex-start": "start", "space-between": "justify", "space-around": "distribute" }, t.exports = o7;
    }), Wp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        set(o7, s7) {
          let a4 = o7.value.toLowerCase();
          return s7 === "-webkit-" && !a4.includes(" ") && a4 !== "contain" && a4 !== "cover" && (o7.value = o7.value + " " + o7.value), super.set(o7, s7);
        }
      };
      n3.names = ["background-size"], t.exports = n3;
    }), qp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = vt2(), o7 = class extends r3 {
        insert(s7, a4, l3) {
          if (a4 !== "-ms-") return super.insert(s7, a4, l3);
          let c5 = n3.parse(s7), [i4, d6] = n3.translate(c5, 0, 1);
          c5[0] && c5[0].includes("span") && (d6 = c5[0].join("").replace(/\D/g, "")), [[s7.prop, i4], [`${s7.prop}-span`, d6]].forEach(([u5, p4]) => {
            n3.insertDecl(s7, u5, p4);
          });
        }
      };
      o7.names = ["grid-row", "grid-column"], t.exports = o7;
    }), Gp = T7((e, t) => {
      O7();
      var r3 = Y3(), { prefixTrackProp: n3, prefixTrackValue: o7, autoplaceGridItems: s7, getGridGap: a4, inheritGridGap: l3 } = vt2(), c5 = vi(), i4 = class extends r3 {
        prefixed(d6, u5) {
          return u5 === "-ms-" ? n3({ prop: d6, prefix: u5 }) : super.prefixed(d6, u5);
        }
        normalize(d6) {
          return d6.replace(/^grid-(rows|columns)/, "grid-template-$1");
        }
        insert(d6, u5, p4, f6) {
          if (u5 !== "-ms-") return super.insert(d6, u5, p4);
          let { parent: g6, prop: h7, value: m6 } = d6, y9 = h7.includes("rows"), v6 = h7.includes("columns"), x5 = g6.some((_6) => _6.prop === "grid-template" || _6.prop === "grid-template-areas");
          if (x5 && y9) return false;
          let k5 = new c5({ options: {} }), w7 = k5.gridStatus(g6, f6), b7 = a4(d6);
          b7 = l3(d6, b7) || b7;
          let C5 = y9 ? b7.row : b7.column;
          (w7 === "no-autoplace" || w7 === true) && !x5 && (C5 = null);
          let S6 = o7({ value: m6, gap: C5 });
          d6.cloneBefore({ prop: n3({ prop: h7, prefix: u5 }), value: S6 });
          let E6 = g6.nodes.find((_6) => _6.prop === "grid-auto-flow"), A7 = "row";
          if (E6 && !k5.disabled(E6, f6) && (A7 = E6.value.trim()), w7 === "autoplace") {
            let _6 = g6.nodes.find((U4) => U4.prop === "grid-template-rows");
            if (!_6 && x5) return;
            if (!_6 && !x5) {
              d6.warn(f6, "Autoplacement does not work without grid-template-rows property");
              return;
            }
            !g6.nodes.find((U4) => U4.prop === "grid-template-columns") && !x5 && d6.warn(f6, "Autoplacement does not work without grid-template-columns property"), v6 && !x5 && s7(d6, f6, b7, A7);
          }
        }
      };
      i4.names = ["grid-template-rows", "grid-template-columns", "grid-rows", "grid-columns"], t.exports = i4;
    }), Yp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        check(o7) {
          return !o7.value.includes("flex-") && o7.value !== "baseline";
        }
        prefixed(o7, s7) {
          return s7 + "grid-column-align";
        }
        normalize() {
          return "justify-self";
        }
      };
      n3.names = ["grid-column-align"], t.exports = n3;
    }), Hp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        prefixed(o7, s7) {
          return s7 + "scroll-chaining";
        }
        normalize() {
          return "overscroll-behavior";
        }
        set(o7, s7) {
          return o7.value === "auto" ? o7.value = "chained" : (o7.value === "none" || o7.value === "contain") && (o7.value = "none"), super.set(o7, s7);
        }
      };
      n3.names = ["overscroll-behavior", "scroll-chaining"], t.exports = n3;
    }), Qp = T7((e, t) => {
      O7();
      var r3 = Y3(), { parseGridAreas: n3, warnMissedAreas: o7, prefixTrackProp: s7, prefixTrackValue: a4, getGridGap: l3, warnGridGap: c5, inheritGridGap: i4 } = vt2();
      function d6(p4) {
        return p4.trim().slice(1, -1).split(/["']\s*["']?/g);
      }
      var u5 = class extends r3 {
        insert(p4, f6, g6, h7) {
          if (f6 !== "-ms-") return super.insert(p4, f6, g6);
          let m6 = false, y9 = false, v6 = p4.parent, x5 = l3(p4);
          x5 = i4(p4, x5) || x5, v6.walkDecls(/-ms-grid-rows/, (b7) => b7.remove()), v6.walkDecls(/grid-template-(rows|columns)/, (b7) => {
            if (b7.prop === "grid-template-rows") {
              y9 = true;
              let { prop: C5, value: S6 } = b7;
              b7.cloneBefore({ prop: s7({ prop: C5, prefix: f6 }), value: a4({ value: S6, gap: x5.row }) });
            } else m6 = true;
          });
          let k5 = d6(p4.value);
          m6 && !y9 && x5.row && k5.length > 1 && p4.cloneBefore({ prop: "-ms-grid-rows", value: a4({ value: `repeat(${k5.length}, auto)`, gap: x5.row }), raws: {} }), c5({ gap: x5, hasColumns: m6, decl: p4, result: h7 });
          let w7 = n3({ rows: k5, gap: x5 });
          return o7(w7, p4, h7), p4;
        }
      };
      u5.names = ["grid-template-areas"], t.exports = u5;
    }), Jp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        set(o7, s7) {
          return s7 === "-webkit-" && (o7.value = o7.value.replace(/\s*(right|left)\s*/i, "")), super.set(o7, s7);
        }
      };
      n3.names = ["text-emphasis-position"], t.exports = n3;
    }), Zp = T7((e, t) => {
      O7();
      var r3 = Y3(), n3 = class extends r3 {
        set(o7, s7) {
          return o7.prop === "text-decoration-skip-ink" && o7.value === "auto" ? (o7.prop = s7 + "text-decoration-skip", o7.value = "ink", o7) : super.set(o7, s7);
        }
      };
      n3.names = ["text-decoration-skip-ink", "text-decoration-skip"], t.exports = n3;
    }), Xp = T7((e, t) => {
      O7(), t.exports = { wrap: r3, limit: n3, validate: o7, test: s7, curry: l3, name: a4 };
      function r3(c5, i4, d6) {
        var u5 = i4 - c5;
        return ((d6 - c5) % u5 + u5) % u5 + c5;
      }
      function n3(c5, i4, d6) {
        return Math.max(c5, Math.min(i4, d6));
      }
      function o7(c5, i4, d6, u5, p4) {
        if (!s7(c5, i4, d6, u5, p4)) throw new Error(d6 + " is outside of range [" + c5 + "," + i4 + ")");
        return d6;
      }
      function s7(c5, i4, d6, u5, p4) {
        return !(d6 < c5 || d6 > i4 || p4 && d6 === i4 || u5 && d6 === c5);
      }
      function a4(c5, i4, d6, u5) {
        return (d6 ? "(" : "[") + c5 + "," + i4 + (u5 ? ")" : "]");
      }
      function l3(c5, i4, d6, u5) {
        var p4 = a4.bind(null, c5, i4, d6, u5);
        return { wrap: r3.bind(null, c5, i4), limit: n3.bind(null, c5, i4), validate: function(f6) {
          return o7(c5, i4, f6, d6, u5);
        }, test: function(f6) {
          return s7(c5, i4, f6, d6, u5);
        }, toString: p4, name: p4 };
      }
    }), Kp = T7((e, t) => {
      O7();
      var r3 = Kn(), n3 = Xp(), o7 = Vt(), s7 = Ve3(), a4 = _e3(), l3 = /top|left|right|bottom/gi, c5 = class extends s7 {
        replace(i4, d6) {
          let u5 = r3(i4);
          for (let p4 of u5.nodes) if (p4.type === "function" && p4.value === this.name) if (p4.nodes = this.newDirection(p4.nodes), p4.nodes = this.normalize(p4.nodes), d6 === "-webkit- old") {
            if (!this.oldWebkit(p4)) return false;
          } else p4.nodes = this.convertDirection(p4.nodes), p4.value = d6 + p4.value;
          return u5.toString();
        }
        replaceFirst(i4, ...d6) {
          return d6.map((u5) => u5 === " " ? { type: "space", value: u5 } : { type: "word", value: u5 }).concat(i4.slice(1));
        }
        normalizeUnit(i4, d6) {
          return `${parseFloat(i4) / d6 * 360}deg`;
        }
        normalize(i4) {
          if (!i4[0]) return i4;
          if (/-?\d+(.\d+)?grad/.test(i4[0].value)) i4[0].value = this.normalizeUnit(i4[0].value, 400);
          else if (/-?\d+(.\d+)?rad/.test(i4[0].value)) i4[0].value = this.normalizeUnit(i4[0].value, 2 * Math.PI);
          else if (/-?\d+(.\d+)?turn/.test(i4[0].value)) i4[0].value = this.normalizeUnit(i4[0].value, 1);
          else if (i4[0].value.includes("deg")) {
            let d6 = parseFloat(i4[0].value);
            d6 = n3.wrap(0, 360, d6), i4[0].value = `${d6}deg`;
          }
          return i4[0].value === "0deg" ? i4 = this.replaceFirst(i4, "to", " ", "top") : i4[0].value === "90deg" ? i4 = this.replaceFirst(i4, "to", " ", "right") : i4[0].value === "180deg" ? i4 = this.replaceFirst(i4, "to", " ", "bottom") : i4[0].value === "270deg" && (i4 = this.replaceFirst(i4, "to", " ", "left")), i4;
        }
        newDirection(i4) {
          if (i4[0].value === "to" || (l3.lastIndex = 0, !l3.test(i4[0].value))) return i4;
          i4.unshift({ type: "word", value: "to" }, { type: "space", value: " " });
          for (let d6 = 2; d6 < i4.length && i4[d6].type !== "div"; d6++) i4[d6].type === "word" && (i4[d6].value = this.revertDirection(i4[d6].value));
          return i4;
        }
        isRadial(i4) {
          let d6 = "before";
          for (let u5 of i4) if (d6 === "before" && u5.type === "space") d6 = "at";
          else if (d6 === "at" && u5.value === "at") d6 = "after";
          else {
            if (d6 === "after" && u5.type === "space") return true;
            if (u5.type === "div") break;
            d6 = "before";
          }
          return false;
        }
        convertDirection(i4) {
          return i4.length > 0 && (i4[0].value === "to" ? this.fixDirection(i4) : i4[0].value.includes("deg") ? this.fixAngle(i4) : this.isRadial(i4) && this.fixRadial(i4)), i4;
        }
        fixDirection(i4) {
          i4.splice(0, 2);
          for (let d6 of i4) {
            if (d6.type === "div") break;
            d6.type === "word" && (d6.value = this.revertDirection(d6.value));
          }
        }
        fixAngle(i4) {
          let d6 = i4[0].value;
          d6 = parseFloat(d6), d6 = Math.abs(450 - d6) % 360, d6 = this.roundFloat(d6, 3), i4[0].value = `${d6}deg`;
        }
        fixRadial(i4) {
          let d6 = [], u5 = [], p4, f6, g6, h7, m6;
          for (h7 = 0; h7 < i4.length - 2; h7++) if (p4 = i4[h7], f6 = i4[h7 + 1], g6 = i4[h7 + 2], p4.type === "space" && f6.value === "at" && g6.type === "space") {
            m6 = h7 + 3;
            break;
          } else d6.push(p4);
          let y9;
          for (h7 = m6; h7 < i4.length; h7++) if (i4[h7].type === "div") {
            y9 = i4[h7];
            break;
          } else u5.push(i4[h7]);
          i4.splice(0, h7, ...u5, y9, ...d6);
        }
        revertDirection(i4) {
          return c5.directions[i4.toLowerCase()] || i4;
        }
        roundFloat(i4, d6) {
          return parseFloat(i4.toFixed(d6));
        }
        oldWebkit(i4) {
          let { nodes: d6 } = i4, u5 = r3.stringify(i4.nodes);
          if (this.name !== "linear-gradient" || d6[0] && d6[0].value.includes("deg") || u5.includes("px") || u5.includes("-corner") || u5.includes("-side")) return false;
          let p4 = [[]];
          for (let f6 of d6) p4[p4.length - 1].push(f6), f6.type === "div" && f6.value === "," && p4.push([]);
          this.oldDirection(p4), this.colorStops(p4), i4.nodes = [];
          for (let f6 of p4) i4.nodes = i4.nodes.concat(f6);
          return i4.nodes.unshift({ type: "word", value: "linear" }, this.cloneDiv(i4.nodes)), i4.value = "-webkit-gradient", true;
        }
        oldDirection(i4) {
          let d6 = this.cloneDiv(i4[0]);
          if (i4[0][0].value !== "to") return i4.unshift([{ type: "word", value: c5.oldDirections.bottom }, d6]);
          {
            let u5 = [];
            for (let f6 of i4[0].slice(2)) f6.type === "word" && u5.push(f6.value.toLowerCase());
            u5 = u5.join(" ");
            let p4 = c5.oldDirections[u5] || u5;
            return i4[0] = [{ type: "word", value: p4 }, d6], i4[0];
          }
        }
        cloneDiv(i4) {
          for (let d6 of i4) if (d6.type === "div" && d6.value === ",") return d6;
          return { type: "div", value: ",", after: " " };
        }
        colorStops(i4) {
          let d6 = [];
          for (let u5 = 0; u5 < i4.length; u5++) {
            let p4, f6 = i4[u5], g6;
            if (u5 === 0) continue;
            let h7 = r3.stringify(f6[0]);
            f6[1] && f6[1].type === "word" ? p4 = f6[1].value : f6[2] && f6[2].type === "word" && (p4 = f6[2].value);
            let m6;
            u5 === 1 && (!p4 || p4 === "0%") ? m6 = `from(${h7})` : u5 === i4.length - 1 && (!p4 || p4 === "100%") ? m6 = `to(${h7})` : p4 ? m6 = `color-stop(${p4}, ${h7})` : m6 = `color-stop(${h7})`;
            let y9 = f6[f6.length - 1];
            i4[u5] = [{ type: "word", value: m6 }], y9.type === "div" && y9.value === "," && (g6 = i4[u5].push(y9)), d6.push(g6);
          }
          return d6;
        }
        old(i4) {
          if (i4 === "-webkit-") {
            let d6 = this.name === "linear-gradient" ? "linear" : "radial", u5 = "-gradient", p4 = a4.regexp(`-webkit-(${d6}-gradient|gradient\\(\\s*${d6})`, false);
            return new o7(this.name, i4 + this.name, u5, p4);
          } else return super.old(i4);
        }
        add(i4, d6) {
          let u5 = i4.prop;
          if (u5.includes("mask")) {
            if (d6 === "-webkit-" || d6 === "-webkit- old") return super.add(i4, d6);
          } else if (u5 === "list-style" || u5 === "list-style-image" || u5 === "content") {
            if (d6 === "-webkit-" || d6 === "-webkit- old") return super.add(i4, d6);
          } else return super.add(i4, d6);
        }
      };
      c5.names = ["linear-gradient", "repeating-linear-gradient", "radial-gradient", "repeating-radial-gradient"], c5.directions = { top: "bottom", left: "right", bottom: "top", right: "left" }, c5.oldDirections = { top: "left bottom, left top", left: "right top, left top", bottom: "left top, left bottom", right: "left top, right top", "top right": "left bottom, right top", "top left": "right bottom, left top", "right top": "left bottom, right top", "right bottom": "left top, right bottom", "bottom right": "left top, right bottom", "bottom left": "right top, left bottom", "left top": "right bottom, left top", "left bottom": "right top, left bottom" }, t.exports = c5;
    }), ef = T7((e, t) => {
      O7();
      var r3 = Vt(), n3 = Ve3();
      function o7(a4) {
        return new RegExp(`(^|[\\s,(])(${a4}($|[\\s),]))`, "gi");
      }
      var s7 = class extends n3 {
        regexp() {
          return this.regexpCache || (this.regexpCache = o7(this.name)), this.regexpCache;
        }
        isStretch() {
          return this.name === "stretch" || this.name === "fill" || this.name === "fill-available";
        }
        replace(a4, l3) {
          return l3 === "-moz-" && this.isStretch() ? a4.replace(this.regexp(), "$1-moz-available$3") : l3 === "-webkit-" && this.isStretch() ? a4.replace(this.regexp(), "$1-webkit-fill-available$3") : super.replace(a4, l3);
        }
        old(a4) {
          let l3 = a4 + this.name;
          return this.isStretch() && (a4 === "-moz-" ? l3 = "-moz-available" : a4 === "-webkit-" && (l3 = "-webkit-fill-available")), new r3(this.name, l3, l3, o7(l3));
        }
        add(a4, l3) {
          if (!(a4.prop.includes("grid") && l3 !== "-webkit-")) return super.add(a4, l3);
        }
      };
      s7.names = ["max-content", "min-content", "fit-content", "fill", "fill-available", "stretch"], t.exports = s7;
    }), tf = T7((e, t) => {
      O7();
      var r3 = Vt(), n3 = Ve3(), o7 = class extends n3 {
        replace(s7, a4) {
          return a4 === "-webkit-" ? s7.replace(this.regexp(), "$1-webkit-optimize-contrast") : a4 === "-moz-" ? s7.replace(this.regexp(), "$1-moz-crisp-edges") : super.replace(s7, a4);
        }
        old(s7) {
          return s7 === "-webkit-" ? new r3(this.name, "-webkit-optimize-contrast") : s7 === "-moz-" ? new r3(this.name, "-moz-crisp-edges") : super.old(s7);
        }
      };
      o7.names = ["pixelated"], t.exports = o7;
    }), rf = T7((e, t) => {
      O7();
      var r3 = Ve3(), n3 = class extends r3 {
        replace(o7, s7) {
          let a4 = super.replace(o7, s7);
          return s7 === "-webkit-" && (a4 = a4.replace(/("[^"]+"|'[^']+')(\s+\d+\w)/gi, "url($1)$2")), a4;
        }
      };
      n3.names = ["image-set"], t.exports = n3;
    }), nf = T7((e, t) => {
      O7();
      var r3 = Re3().list, n3 = Ve3(), o7 = class extends n3 {
        replace(s7, a4) {
          return r3.space(s7).map((l3) => {
            if (l3.slice(0, +this.name.length + 1) !== this.name + "(") return l3;
            let c5 = l3.lastIndexOf(")"), i4 = l3.slice(c5 + 1), d6 = l3.slice(this.name.length + 1, c5);
            if (a4 === "-webkit-") {
              let u5 = d6.match(/\d*.?\d+%?/);
              u5 ? (d6 = d6.slice(u5[0].length).trim(), d6 += `, ${u5[0]}`) : d6 += ", 0.5";
            }
            return a4 + this.name + "(" + d6 + ")" + i4;
          }).join(" ");
        }
      };
      o7.names = ["cross-fade"], t.exports = o7;
    }), of = T7((e, t) => {
      O7();
      var r3 = Te2(), n3 = Vt(), o7 = Ve3(), s7 = class extends o7 {
        constructor(a4, l3) {
          super(a4, l3), a4 === "display-flex" && (this.name = "flex");
        }
        check(a4) {
          return a4.prop === "display" && a4.value === this.name;
        }
        prefixed(a4) {
          let l3, c5;
          return [l3, a4] = r3(a4), l3 === 2009 ? this.name === "flex" ? c5 = "box" : c5 = "inline-box" : l3 === 2012 ? this.name === "flex" ? c5 = "flexbox" : c5 = "inline-flexbox" : l3 === "final" && (c5 = this.name), a4 + c5;
        }
        replace(a4, l3) {
          return this.prefixed(l3);
        }
        old(a4) {
          let l3 = this.prefixed(a4);
          if (l3) return new n3(this.name, l3);
        }
      };
      s7.names = ["display-flex", "inline-flex"], t.exports = s7;
    }), sf = T7((e, t) => {
      O7();
      var r3 = Ve3(), n3 = class extends r3 {
        constructor(o7, s7) {
          super(o7, s7), o7 === "display-grid" && (this.name = "grid");
        }
        check(o7) {
          return o7.prop === "display" && o7.value === this.name;
        }
      };
      n3.names = ["display-grid", "inline-grid"], t.exports = n3;
    }), af = T7((e, t) => {
      O7();
      var r3 = Ve3(), n3 = class extends r3 {
        constructor(o7, s7) {
          super(o7, s7), o7 === "filter-function" && (this.name = "filter");
        }
      };
      n3.names = ["filter", "filter-function"], t.exports = n3;
    }), lf = T7((e, t) => {
      O7();
      var r3 = Ir2(), n3 = Y3(), o7 = Yd(), s7 = Xd(), a4 = vi(), l3 = tp(), c5 = gt2(), i4 = Wt(), d6 = np(), u5 = Ve3(), p4 = _e3(), f6 = op(), g6 = sp(), h7 = ap(), m6 = ip(), y9 = lp(), v6 = cp(), x5 = up(), k5 = dp(), w7 = pp(), b7 = fp(), C5 = hp(), S6 = mp(), E6 = gp(), A7 = vp(), _6 = yp(), U4 = bp(), D7 = wp(), j5 = xp(), L4 = kp(), F4 = Sp(), H4 = Cp(), Q3 = Ap(), we3 = Op(), Ce4 = _p(), R5 = Ep(), M6 = Tp(), P5 = Ip(), I7 = Pp(), G5 = jp(), B3 = Bp(), N4 = Dp(), K5 = $p(), J5 = Rp(), V3 = Mp(), ne4 = Up(), ie4 = zp(), q5 = Fp(), le4 = Lp(), We3 = Np(), ze3 = Vp(), Ae2 = Wp(), be4 = qp(), Ie2 = Gp(), Pe4 = Yp(), Qe2 = Hp(), Et2 = Qp(), Tt = Jp(), bt2 = Zp(), oo = Kp(), so = ef(), ao = tf(), io = rf(), lo = nf(), co = of(), Cf = sf(), Af = af();
      i4.hack(f6), i4.hack(g6), i4.hack(h7), i4.hack(m6), n3.hack(y9), n3.hack(v6), n3.hack(x5), n3.hack(k5), n3.hack(w7), n3.hack(b7), n3.hack(C5), n3.hack(S6), n3.hack(E6), n3.hack(A7), n3.hack(_6), n3.hack(U4), n3.hack(D7), n3.hack(j5), n3.hack(L4), n3.hack(F4), n3.hack(H4), n3.hack(Q3), n3.hack(we3), n3.hack(Ce4), n3.hack(R5), n3.hack(M6), n3.hack(P5), n3.hack(I7), n3.hack(G5), n3.hack(B3), n3.hack(N4), n3.hack(K5), n3.hack(J5), n3.hack(V3), n3.hack(ne4), n3.hack(ie4), n3.hack(q5), n3.hack(le4), n3.hack(We3), n3.hack(ze3), n3.hack(Ae2), n3.hack(be4), n3.hack(Ie2), n3.hack(Pe4), n3.hack(Qe2), n3.hack(Et2), n3.hack(Tt), n3.hack(bt2), u5.hack(oo), u5.hack(so), u5.hack(ao), u5.hack(io), u5.hack(lo), u5.hack(co), u5.hack(Cf), u5.hack(Af);
      var uo = /* @__PURE__ */ new Map(), po = class {
        constructor(ee3, Z3, te4 = {}) {
          this.data = ee3, this.browsers = Z3, this.options = te4, [this.add, this.remove] = this.preprocess(this.select(this.data)), this.transition = new s7(this), this.processor = new a4(this);
        }
        cleaner() {
          if (this.cleanerCache) return this.cleanerCache;
          if (this.browsers.selected.length) {
            let ee3 = new c5(this.browsers.data, []);
            this.cleanerCache = new po(this.data, ee3, this.options);
          } else return this;
          return this.cleanerCache;
        }
        select(ee3) {
          let Z3 = { add: {}, remove: {} };
          for (let te4 in ee3) {
            let W5 = ee3[te4], X4 = W5.browsers.map((ae4) => {
              let pe3 = ae4.split(" ");
              return { browser: `${pe3[0]} ${pe3[1]}`, note: pe3[2] };
            }), Se2 = X4.filter((ae4) => ae4.note).map((ae4) => `${this.browsers.prefix(ae4.browser)} ${ae4.note}`);
            Se2 = p4.uniq(Se2), X4 = X4.filter((ae4) => this.browsers.isSelected(ae4.browser)).map((ae4) => {
              let pe3 = this.browsers.prefix(ae4.browser);
              return ae4.note ? `${pe3} ${ae4.note}` : pe3;
            }), X4 = this.sort(p4.uniq(X4)), this.options.flexbox === "no-2009" && (X4 = X4.filter((ae4) => !ae4.includes("2009")));
            let re3 = W5.browsers.map((ae4) => this.browsers.prefix(ae4));
            W5.mistakes && (re3 = re3.concat(W5.mistakes)), re3 = re3.concat(Se2), re3 = p4.uniq(re3), X4.length ? (Z3.add[te4] = X4, X4.length < re3.length && (Z3.remove[te4] = re3.filter((ae4) => !X4.includes(ae4)))) : Z3.remove[te4] = re3;
          }
          return Z3;
        }
        sort(ee3) {
          return ee3.sort((Z3, te4) => {
            let W5 = p4.removeNote(Z3).length, X4 = p4.removeNote(te4).length;
            return W5 === X4 ? te4.length - Z3.length : X4 - W5;
          });
        }
        preprocess(ee3) {
          let Z3 = { selectors: [], "@supports": new l3(po, this) };
          for (let W5 in ee3.add) {
            let X4 = ee3.add[W5];
            if (W5 === "@keyframes" || W5 === "@viewport") Z3[W5] = new d6(W5, X4, this);
            else if (W5 === "@resolution") Z3[W5] = new o7(W5, X4, this);
            else if (this.data[W5].selector) Z3.selectors.push(i4.load(W5, X4, this));
            else {
              let Se2 = this.data[W5].props;
              if (Se2) {
                let re3 = u5.load(W5, X4, this);
                for (let ae4 of Se2) Z3[ae4] || (Z3[ae4] = { values: [] }), Z3[ae4].values.push(re3);
              } else {
                let re3 = Z3[W5] && Z3[W5].values || [];
                Z3[W5] = n3.load(W5, X4, this), Z3[W5].values = re3;
              }
            }
          }
          let te4 = { selectors: [] };
          for (let W5 in ee3.remove) {
            let X4 = ee3.remove[W5];
            if (this.data[W5].selector) {
              let Se2 = i4.load(W5, X4);
              for (let re3 of X4) te4.selectors.push(Se2.old(re3));
            } else if (W5 === "@keyframes" || W5 === "@viewport") for (let Se2 of X4) {
              let re3 = `@${Se2}${W5.slice(1)}`;
              te4[re3] = { remove: true };
            }
            else if (W5 === "@resolution") te4[W5] = new o7(W5, X4, this);
            else {
              let Se2 = this.data[W5].props;
              if (Se2) {
                let re3 = u5.load(W5, [], this);
                for (let ae4 of X4) {
                  let pe3 = re3.old(ae4);
                  if (pe3) for (let qt2 of Se2) te4[qt2] || (te4[qt2] = {}), te4[qt2].values || (te4[qt2].values = []), te4[qt2].values.push(pe3);
                }
              } else for (let re3 of X4) {
                let ae4 = this.decl(W5).old(W5, re3);
                if (W5 === "align-self") {
                  let pe3 = Z3[W5] && Z3[W5].prefixes;
                  if (pe3 && (re3 === "-webkit- 2009" && pe3.includes("-webkit-") || re3 === "-webkit-" && pe3.includes("-webkit- 2009"))) continue;
                }
                for (let pe3 of ae4) te4[pe3] || (te4[pe3] = {}), te4[pe3].remove = true;
              }
            }
          }
          return [Z3, te4];
        }
        decl(ee3) {
          return uo.has(ee3) || uo.set(ee3, n3.load(ee3)), uo.get(ee3);
        }
        unprefixed(ee3) {
          let Z3 = this.normalize(r3.unprefixed(ee3));
          return Z3 === "flex-direction" && (Z3 = "flex-flow"), Z3;
        }
        normalize(ee3) {
          return this.decl(ee3).normalize(ee3);
        }
        prefixed(ee3, Z3) {
          return ee3 = r3.unprefixed(ee3), this.decl(ee3).prefixed(ee3, Z3);
        }
        values(ee3, Z3) {
          let te4 = this[ee3], W5 = te4["*"] && te4["*"].values, X4 = te4[Z3] && te4[Z3].values;
          return W5 && X4 ? p4.uniq(W5.concat(X4)) : W5 || X4 || [];
        }
        group(ee3) {
          let Z3 = ee3.parent, te4 = Z3.index(ee3), { length: W5 } = Z3.nodes, X4 = this.unprefixed(ee3.prop), Se2 = (re3, ae4) => {
            for (te4 += re3; te4 >= 0 && te4 < W5; ) {
              let pe3 = Z3.nodes[te4];
              if (pe3.type === "decl") {
                if (re3 === -1 && pe3.prop === X4 && !c5.withPrefix(pe3.value) || this.unprefixed(pe3.prop) !== X4) break;
                if (ae4(pe3) === true) return true;
                if (re3 === 1 && pe3.prop === X4 && !c5.withPrefix(pe3.value)) break;
              }
              te4 += re3;
            }
            return false;
          };
          return { up(re3) {
            return Se2(-1, re3);
          }, down(re3) {
            return Se2(1, re3);
          } };
        }
      };
      t.exports = po;
    }), cf = T7((e, t) => {
      O7(), t.exports = { "backdrop-filter": { feature: "css-backdrop-filter", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5", "safari 16.5"] }, element: { props: ["background", "background-image", "border-image", "mask", "list-style", "list-style-image", "content", "mask-image"], feature: "css-element-function", browsers: ["firefox 114"] }, "user-select": { mistakes: ["-khtml-"], feature: "user-select-none", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5", "safari 16.5"] }, "background-clip": { feature: "background-clip-text", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, hyphens: { feature: "css-hyphens", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5", "safari 16.5"] }, fill: { props: ["width", "min-width", "max-width", "height", "min-height", "max-height", "inline-size", "min-inline-size", "max-inline-size", "block-size", "min-block-size", "max-block-size", "grid", "grid-template", "grid-template-rows", "grid-template-columns", "grid-auto-columns", "grid-auto-rows"], feature: "intrinsic-width", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "fill-available": { props: ["width", "min-width", "max-width", "height", "min-height", "max-height", "inline-size", "min-inline-size", "max-inline-size", "block-size", "min-block-size", "max-block-size", "grid", "grid-template", "grid-template-rows", "grid-template-columns", "grid-auto-columns", "grid-auto-rows"], feature: "intrinsic-width", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, stretch: { props: ["width", "min-width", "max-width", "height", "min-height", "max-height", "inline-size", "min-inline-size", "max-inline-size", "block-size", "min-block-size", "max-block-size", "grid", "grid-template", "grid-template-rows", "grid-template-columns", "grid-auto-columns", "grid-auto-rows"], feature: "intrinsic-width", browsers: ["firefox 114"] }, "fit-content": { props: ["width", "min-width", "max-width", "height", "min-height", "max-height", "inline-size", "min-inline-size", "max-inline-size", "block-size", "min-block-size", "max-block-size", "grid", "grid-template", "grid-template-rows", "grid-template-columns", "grid-auto-columns", "grid-auto-rows"], feature: "intrinsic-width", browsers: ["firefox 114"] }, "text-decoration-style": { feature: "text-decoration", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "text-decoration-color": { feature: "text-decoration", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "text-decoration-line": { feature: "text-decoration", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "text-decoration": { feature: "text-decoration", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "text-decoration-skip": { feature: "text-decoration", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "text-decoration-skip-ink": { feature: "text-decoration", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "text-size-adjust": { feature: "text-size-adjust", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5"] }, "mask-clip": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-composite": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-image": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-origin": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-repeat": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-border-repeat": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-border-source": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, mask: { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-position": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-size": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-border": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-border-outset": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-border-width": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "mask-border-slice": { feature: "css-masks", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, "clip-path": { feature: "css-clip-path", browsers: ["samsung 21"] }, "box-decoration-break": { feature: "css-boxdecorationbreak", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5", "opera 99", "safari 16.5", "samsung 21"] }, appearance: { feature: "css-appearance", browsers: ["samsung 21"] }, "image-set": { props: ["background", "background-image", "border-image", "cursor", "mask", "mask-image", "list-style", "list-style-image", "content"], feature: "css-image-set", browsers: ["and_uc 15.5", "chrome 109", "samsung 21"] }, "cross-fade": { props: ["background", "background-image", "border-image", "mask", "list-style", "list-style-image", "content", "mask-image"], feature: "css-cross-fade", browsers: ["and_chr 114", "and_uc 15.5", "chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99", "samsung 21"] }, isolate: { props: ["unicode-bidi"], feature: "css-unicode-bidi", browsers: ["ios_saf 16.1", "ios_saf 16.3", "ios_saf 16.4", "ios_saf 16.5", "safari 16.5"] }, "color-adjust": { feature: "css-color-adjust", browsers: ["chrome 109", "chrome 113", "chrome 114", "edge 114", "opera 99"] } };
    }), uf = T7((e, t) => {
      O7(), t.exports = {};
    }), df = T7((e, t) => {
      O7();
      var r3 = mi(), { agents: n3 } = (Xn(), Tr2), o7 = qd(), s7 = gt2(), a4 = lf(), l3 = cf(), c5 = uf(), i4 = { browsers: n3, prefixes: l3 }, d6 = `
  Replace Autoprefixer \`browsers\` option to Browserslist config.
  Use \`browserslist\` key in \`package.json\` or \`.browserslistrc\` file.

  Using \`browsers\` option can cause errors. Browserslist config can
  be used for Babel, Autoprefixer, postcss-normalize and other tools.

  If you really need to use option, rename it to \`overrideBrowserslist\`.

  Learn more at:
  https://github.com/browserslist/browserslist#readme
  https://twitter.com/browserslist

`;
      function u5(h7) {
        return Object.prototype.toString.apply(h7) === "[object Object]";
      }
      var p4 = /* @__PURE__ */ new Map();
      function f6(h7, m6) {
        m6.browsers.selected.length !== 0 && (m6.add.selectors.length > 0 || Object.keys(m6.add).length > 2 || h7.warn(`Autoprefixer target browsers do not need any prefixes.You do not need Autoprefixer anymore.
Check your Browserslist config to be sure that your targets are set up correctly.

  Learn more at:
  https://github.com/postcss/autoprefixer#readme
  https://github.com/browserslist/browserslist#readme

`));
      }
      t.exports = g6;
      function g6(...h7) {
        let m6;
        if (h7.length === 1 && u5(h7[0]) ? (m6 = h7[0], h7 = void 0) : h7.length === 0 || h7.length === 1 && !h7[0] ? h7 = void 0 : h7.length <= 2 && (Array.isArray(h7[0]) || !h7[0]) ? (m6 = h7[1], h7 = h7[0]) : typeof h7[h7.length - 1] == "object" && (m6 = h7.pop()), m6 || (m6 = {}), m6.browser) throw new Error("Change `browser` option to `overrideBrowserslist` in Autoprefixer");
        if (m6.browserslist) throw new Error("Change `browserslist` option to `overrideBrowserslist` in Autoprefixer");
        m6.overrideBrowserslist ? h7 = m6.overrideBrowserslist : m6.browsers && (typeof console < "u" && console.warn && (o7.red ? console.warn(o7.red(d6.replace(/`[^`]+`/g, (x5) => o7.yellow(x5.slice(1, -1))))) : console.warn(d6)), h7 = m6.browsers);
        let y9 = { ignoreUnknownVersions: m6.ignoreUnknownVersions, stats: m6.stats, env: m6.env };
        function v6(x5) {
          let k5 = i4, w7 = new s7(k5.browsers, h7, x5, y9), b7 = w7.selected.join(", ") + JSON.stringify(m6);
          return p4.has(b7) || p4.set(b7, new a4(k5.prefixes, w7, m6)), p4.get(b7);
        }
        return { postcssPlugin: "autoprefixer", prepare(x5) {
          let k5 = v6({ from: x5.opts.from, env: m6.env });
          return { OnceExit(w7) {
            f6(x5, k5), m6.remove !== false && k5.processor.remove(w7, x5), m6.add !== false && k5.processor.add(w7, x5);
          } };
        }, info(x5) {
          return x5 = x5 || {}, x5.from = x5.from || je3.cwd(), c5(v6(x5));
        }, options: m6, browsers: h7 };
      }
      g6.postcss = true, g6.data = i4, g6.defaults = r3.defaults, g6.info = () => g6().info();
    }), yi = {};
    Fe2(yi, { default: () => bi });
    var bi, pf = $3(() => {
      O7(), bi = [];
    }), wi = {};
    Fe2(wi, { default: () => ki });
    var xi, ki, ff = $3(() => {
      O7(), zr(), xi = he4(Jr()), ki = Dt2(xi.default.theme);
    }), Si = {};
    Fe2(Si, { default: () => Ai });
    var Ci, Ai, hf = $3(() => {
      O7(), zr(), Ci = he4(Jr()), Ai = Dt2(Ci.default);
    });
    O7();
    var mf = tt3(Vd()), gf = tt3(Re3()), vf = tt3(df()), yf = tt3((pf(), yi)), bf = tt3((ff(), wi)), wf = tt3((hf(), Si)), xf = tt3((Co(), So)), kf = tt3((Ma(), zn)), Sf = tt3((as(), ss));
    function tt3(e) {
      return e && e.__esModule ? e : { default: e };
    }
    console.warn("cdn.tailwindcss.com should not be used in production. To use Tailwind CSS in production, install it as a PostCSS plugin or use the Tailwind CLI: https://tailwindcss.com/docs/installation");
    var Pr = "tailwind", eo = "text/tailwindcss", Oi = "/template.html", yt2, _i = true, Ei = 0, to = /* @__PURE__ */ new Set(), ro, Ti = "", Ii = (e = false) => ({ get(t, r3) {
      return (!e || r3 === "config") && typeof t[r3] == "object" && t[r3] !== null ? new Proxy(t[r3], Ii()) : t[r3];
    }, set(t, r3, n3) {
      return t[r3] = n3, (!e || r3 === "config") && no(true), true;
    } });
    window[Pr] = new Proxy({ config: {}, defaultTheme: bf.default, defaultConfig: wf.default, colors: xf.default, plugin: kf.default, resolveConfig: Sf.default }, Ii(true));
    function Pi(e) {
      ro.observe(e, { attributes: true, attributeFilter: ["type"], characterData: true, subtree: true, childList: true });
    }
    new MutationObserver(async (e) => {
      let t = false;
      if (!ro) {
        ro = new MutationObserver(async () => await no(true));
        for (let r3 of document.querySelectorAll(`style[type="${eo}"]`)) Pi(r3);
      }
      for (let r3 of e) for (let n3 of r3.addedNodes) n3.nodeType === 1 && n3.tagName === "STYLE" && n3.getAttribute("type") === eo && (Pi(n3), t = true);
      await no(t);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });
    async function no(e = false) {
      e && (Ei++, to.clear());
      let t = "";
      for (let n3 of document.querySelectorAll(`style[type="${eo}"]`)) t += n3.textContent;
      let r3 = /* @__PURE__ */ new Set();
      for (let n3 of document.querySelectorAll("[class]")) for (let o7 of n3.classList) to.has(o7) || r3.add(o7);
      if (document.body && (_i || r3.size > 0 || t !== Ti || !yt2 || !yt2.isConnected)) {
        for (let o7 of r3) to.add(o7);
        _i = false, Ti = t, self[Oi] = Array.from(r3).join(" ");
        let { css: n3 } = await (0, gf.default)([(0, mf.default)({ ...window[Pr].config, _hash: Ei, content: { files: [Oi], extract: { html: (o7) => o7.split(" ") } }, plugins: [...yf.default, ...Array.isArray(window[Pr].config.plugins) ? window[Pr].config.plugins : []] }), (0, vf.default)({ remove: false })]).process(`@tailwind base;@tailwind components;@tailwind utilities;${t}`);
        (!yt2 || !yt2.isConnected) && (yt2 = document.createElement("style"), document.head.append(yt2)), yt2.textContent = n3;
      }
    }
  })();
});
var ho = Bf(Bi());
var bm = ho.default ?? ho;

// shakespeare-tailwind:shakespeare:tailwind.config.ts
tailwind.config = tailwind_config_default;
/*! Bundled license information:

cssesc/cssesc.js:
  (*! https://mths.be/cssesc v3.0.0 by @mathias *)
*/
/*! Bundled license information:

tailwindcss-cdn/tailwindcss.js:
  (*! https://mths.be/cssesc v3.0.0 by @mathias *)
*/
//# sourceMappingURL=shakespeare_tailwind.config-5TGO7TRT.js.map
