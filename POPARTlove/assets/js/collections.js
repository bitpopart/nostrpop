/* Collections. Home: tiles that link to the Collections page. Cards page: tiles that filter the cards.
   Collections page: tiles, and below them everything in the chosen collection (cards, stickers, prints). */
(function () {
  var boxes = document.querySelectorAll("[data-collections]");
  if (!boxes.length) return;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  var renderers = [];
  boxes.forEach(function (box) { renderers.push(setup(box)); });
  function render(list) { renderers.forEach(function (r) { r(list); }); }
  window.PopartCollections = { render: render };
  if (window.POPART_DEMO_COLLECTIONS) { render(window.POPART_DEMO_COLLECTIONS); return; }
  if (!window.fetch) return;
  fetch("/api/collections").then(function (r) { return r.ok ? r.json() : []; }).then(render).catch(function () {});

  function count(c) { return c.cards.length + (c.stickers || []).length + (c.prints || []).length; }
  function thumb(c) {
    if (c._src) return c._src;
    if (c.image) return "/api/event-image?id=k-" + encodeURIComponent(c.id) + "&v=" + (c.imv || 0);
    var a = c.cards && c.cards[0];
    return a ? "/assets/img/cards/" + a + ".webp" : "";
  }
  function tile(c, mode) {
    var b = mode === "home" ? el("a", "coll-tile") : el("button", "coll-tile");
    if (mode === "home") b.href = "/collections/#c-" + c.id; else { b.type = "button"; b.setAttribute("aria-pressed", "false"); }
    b.setAttribute("data-id", c.id);
    var t = thumb(c);
    if (t) { var im = document.createElement("img"); im.src = t; im.alt = ""; im.loading = "lazy"; b.appendChild(im); }
    var info = el("span", "coll-info"); info.appendChild(el("strong", "", c.name));
    var n = count(c); info.appendChild(el("small", "", n + (n === 1 ? " item" : " items")));
    if (c.text) info.appendChild(el("em", "", c.text));
    b.appendChild(info);
    return b;
  }
  function hashId(list) { var m = /^#c-([a-z0-9-]+)$/.exec(location.hash); return m && list.some(function (c) { return c.id === m[1]; }) ? m[1] : null; }

  function setup(box) {
    var mode = box.getAttribute("data-home") === "1" ? "home" : box.getAttribute("data-page") === "1" ? "page" : "cards";
    var active = null, observer = null, detail = null, extra = null;

    function press(list) { box.querySelectorAll(".coll-tile").forEach(function (t) { t.setAttribute("aria-pressed", t.getAttribute("data-id") === active ? "true" : "false"); }); }

    function applyCards(list) {
      var sel = list.filter(function (c) { return c.id === active; })[0];
      document.querySelectorAll("article[data-card]").forEach(function (a) {
        if (a.parentNode.getAttribute("data-limit")) return;
        a.hidden = !!(sel && sel.cards.indexOf(a.getAttribute("data-card")) < 0);
      });
      var bar = box.querySelector(".coll-bar"); if (!bar) return;
      bar.hidden = !sel;
      if (sel) {
        bar.querySelector("span").textContent = "Showing the " + sel.name + " collection (" + sel.cards.length + (sel.cards.length === 1 ? " card)" : " cards)");
        var more = bar.querySelector("a"); more.hidden = !((sel.stickers || []).length || (sel.prints || []).length); more.href = "/collections/#c-" + sel.id;
      }
      press(list);
    }

    // data for the Collections page: cards (built in + admin), stickers, prints
    function loadExtra() {
      if (extra) return extra;
      if (window.POPART_DEMO_BASE) return (extra = Promise.resolve({ cards: window.POPART_DEMO_BASE, stickers: window.POPART_DEMO_CATALOG_STICKERS || [], prints: window.POPART_DEMO_CATALOG_PRINTS || [] }));
      function get(u, d) { return fetch(u).then(function (r) { return r.ok ? r.json() : d; }).catch(function () { return d; }); }
      return (extra = Promise.all([get("/assets/cards.json", []), get("/api/cards", []), get("/api/catalog?kind=stickers", []), get("/api/catalog?kind=prints", [])]).then(function (r) {
        var map = {}; r[1].forEach(function (e) { map[e.file] = e; });
        var base = {}; r[0].forEach(function (c) { base[c.file] = 1; });
        var cards = r[1].filter(function (e) { return !base[e.file]; }).concat(r[0].map(function (c) { return Object.assign({}, c, map[c.file] || {}); })).filter(function (c) { return !c.removed; });
        return { cards: cards, stickers: r[2], prints: r[3] };
      }));
    }
    function itemCard(img, title, sub, href) {
      var a = el("a", "coll-item"); a.href = href;
      if (img) { var i = document.createElement("img"); i.src = img; i.alt = ""; i.loading = "lazy"; a.appendChild(i); }
      a.appendChild(el("strong", "", title)); if (sub) a.appendChild(el("small", "", sub));
      return a;
    }
    function showDetail(list) {
      if (detail) detail.innerHTML = "";
      var sel = list.filter(function (c) { return c.id === active; })[0];
      press(list);
      if (!sel) return;
      loadExtra().then(function (d) {
        if (!detail || active !== sel.id) return;
        detail.innerHTML = "";
        var h = el("h2", "", sel.name); detail.appendChild(h);
        if (sel.text) detail.appendChild(el("p", "", sel.text));
        var groups = [
          ["Cards", sel.cards.map(function (f) { return d.cards.filter(function (c) { return c.file === f; })[0]; }).filter(Boolean).map(function (c) {
            return itemCard(c._front || (c.front ? "/api/event-image?id=c-" + encodeURIComponent(c.file) + "&v=" + (c.imv || 0) : (c.thumb || "/assets/img/cards/" + c.file + ".webp")), c.name, c.rarity, "/cards/");
          })],
          ["Stickers", (sel.stickers || []).map(function (i) { return d.stickers.filter(function (x) { return x.id === i; })[0]; }).filter(Boolean).map(function (x) { return itemCard(x.image ? (x._src || "/api/event-image?id=" + encodeURIComponent(x.id) + "&v=" + (x.imv || 0)) : "", x.title, x.price, "/stickers/"); })],
          ["Prints", (sel.prints || []).map(function (i) { return d.prints.filter(function (x) { return x.id === i; })[0]; }).filter(Boolean).map(function (x) { return itemCard(x.image ? (x._src || "/api/event-image?id=" + encodeURIComponent(x.id) + "&v=" + (x.imv || 0)) : "", x.title, x.price, "/prints/"); })]
        ];
        var any = false;
        groups.forEach(function (g) {
          if (!g[1].length) return; any = true;
          detail.appendChild(el("h3", "", g[0]));
          var row = el("div", "coll-items"); g[1].forEach(function (n) { row.appendChild(n); }); detail.appendChild(row);
        });
        if (!any) detail.appendChild(el("p", "notice", "Nothing in this collection yet."));
      });
    }

    return function (list) {
      box.innerHTML = "";
      if (!list || !list.length) { box.hidden = true; return; }
      box.hidden = false;
      var ce = document.getElementById("coll-empty"); if (ce && mode === "page") ce.hidden = true;
      var h = el("h2", "", "Collections"); if (mode === "home") h.style.marginTop = "2rem"; if (mode !== "page") box.appendChild(h);
      var row = el("div", "coll-row");
      list.forEach(function (c) {
        var b = tile(c, mode);
        if (mode === "cards") b.addEventListener("click", function () { active = active === c.id ? null : c.id; applyCards(list); if (active) { var g = document.querySelector("article[data-card]"); if (g) g.parentNode.scrollIntoView({ behavior: "smooth", block: "start" }); } });
        if (mode === "page") b.addEventListener("click", function () { active = active === c.id ? null : c.id; showDetail(list); if (active) detail.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
        row.appendChild(b);
      });
      box.appendChild(row);
      if (mode === "home") return;
      if (mode === "page") {
        detail = el("div", "coll-detail"); box.appendChild(detail);
        var id = hashId(list); if (id) { active = id; showDetail(list); }
        return;
      }
      var bar = el("div", "coll-bar"); bar.hidden = true;
      bar.appendChild(el("span"));
      var more = el("a", "btn ghost", "See stickers and prints too"); more.hidden = true; bar.appendChild(more);
      var all = el("button", "btn ghost", "Show all cards"); all.type = "button";
      all.addEventListener("click", function () { active = null; applyCards(list); });
      bar.appendChild(all); box.appendChild(bar);
      var hid = hashId(list); if (hid) { active = hid; applyCards(list); }
      var g = document.querySelector("article[data-card]");
      if (g && window.MutationObserver) { if (observer) observer.disconnect(); observer = new MutationObserver(function () { applyCards(list); }); observer.observe(g.parentNode, { childList: true }); }
    };
  }
})();
