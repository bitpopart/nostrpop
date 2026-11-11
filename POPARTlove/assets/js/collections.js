/* Card collections on the Cards page: tiles with a thumbnail; click one to show only its cards. */
(function () {
  var boxes = document.querySelectorAll("[data-collections]");
  if (!boxes.length) return;
  var renderers = [];
  boxes.forEach(function (box) { renderers.push(setup(box)); });
  function render(list) { renderers.forEach(function (r) { r(list); }); }
  window.PopartCollections = { render: render };
  if (window.POPART_DEMO_COLLECTIONS) { render(window.POPART_DEMO_COLLECTIONS); return; }
  if (!window.fetch) return;
  fetch("/api/collections").then(function (r) { return r.ok ? r.json() : []; }).then(render).catch(function () {});

  function setup(box) {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  var active = null, home = box.getAttribute("data-home") === "1", observer = null;
  function thumb(c) {
    if (c._src) return c._src;
    if (c.image) return "/api/event-image?id=k-" + encodeURIComponent(c.id) + "&v=" + (c.imv || 0);
    var a = c.cards && c.cards[0];
    return a ? "/assets/img/cards/" + a + ".webp" : "";
  }
  function apply(list) {
    var sel = list.filter(function (c) { return c.id === active; })[0];
    document.querySelectorAll("article[data-card]").forEach(function (a) {
      if (a.parentNode.getAttribute("data-limit")) return;
      a.hidden = !!(sel && sel.cards.indexOf(a.getAttribute("data-card")) < 0);
    });
    var bar = box.querySelector(".coll-bar");
    if (!bar) return;
    bar.hidden = !sel;
    if (sel) bar.querySelector("span").textContent = "Showing the " + sel.name + " collection (" + sel.cards.length + (sel.cards.length === 1 ? " card)" : " cards)");
    box.querySelectorAll(".coll-tile").forEach(function (t) { t.setAttribute("aria-pressed", t.getAttribute("data-id") === active ? "true" : "false"); });
  }
  function render(list) {
    box.innerHTML = "";
    if (!list || !list.length) { box.hidden = true; return; }
    box.hidden = false;
    var h = el("h2", "", "Collections"); if (home) h.style.marginTop = "2rem"; box.appendChild(h);
    var row = el("div", "coll-row");
    list.forEach(function (c) {
      var b = home ? el("a", "coll-tile") : el("button", "coll-tile");
      if (home) b.href = "/cards/#c-" + c.id; else { b.type = "button"; b.setAttribute("aria-pressed", "false"); }
      b.setAttribute("data-id", c.id);
      var t = thumb(c);
      if (t) { var im = document.createElement("img"); im.src = t; im.alt = ""; im.loading = "lazy"; b.appendChild(im); }
      var info = el("span", "coll-info"); info.appendChild(el("strong", "", c.name));
      info.appendChild(el("small", "", c.cards.length + (c.cards.length === 1 ? " card" : " cards")));
      if (c.text) info.appendChild(el("em", "", c.text));
      b.appendChild(info);
      if (!home) b.addEventListener("click", function () { active = active === c.id ? null : c.id; apply(list); if (active) { var g = document.querySelector("article[data-card]"); if (g) g.parentNode.scrollIntoView({ behavior: "smooth", block: "start" }); } });
      row.appendChild(b);
    });
    box.appendChild(row);
    if (home) return;
    var bar = el("div", "coll-bar"); bar.hidden = true;
    bar.appendChild(el("span"));
    var all = el("button", "btn ghost", "Show all cards"); all.type = "button";
    all.addEventListener("click", function () { active = null; apply(list); });
    bar.appendChild(all); box.appendChild(bar);
    var m = /^#c-([a-z0-9-]+)$/.exec(location.hash);
    if (m && list.some(function (c) { return c.id === m[1]; })) { active = m[1]; apply(list); }
    var g = document.querySelector("article[data-card]");
    if (g && window.MutationObserver) { if (observer) observer.disconnect(); observer = new MutationObserver(function () { apply(list); }); observer.observe(g.parentNode, { childList: true }); }
  }
  return render;
  }
})();
