/* News from the admin: when news items are saved they replace the starter items on the News page and the home page. */
(function () {
  var grids = document.querySelectorAll("[data-news]");
  if (!grids.length) return;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function nice(d) { var p = d.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function card(n) {
    var a = el("article", "card news-item");
    if (n.image) {
      var f = el("figure"), img = document.createElement("img");
      img.src = n._src || "/api/event-image?id=n-" + encodeURIComponent(n.id) + "&v=" + (n.imv || 0);
      img.alt = ""; img.loading = "lazy"; img.width = 800; img.height = 600;
      f.appendChild(img); a.appendChild(f);
    }
    var b = el("div", "body");
    var t = el("time", "tag soon", nice(n.date)); t.setAttribute("datetime", n.date);
    b.appendChild(t); b.appendChild(el("h3", "", n.title)); b.appendChild(el("p", "news-text", n.text));
    a.appendChild(b);
    return a;
  }
  function render(list) {
    if (!list || !list.length) return;
    var sorted = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    grids.forEach(function (g) {
      var limit = Number(g.getAttribute("data-news")) || 0;
      g.innerHTML = "";
      (limit ? sorted.slice(0, limit) : sorted).forEach(function (n) { g.appendChild(card(n)); });
    });
  }
  window.PopartNews = { render: render };
  if (window.POPART_DEMO_NEWS) { render(window.POPART_DEMO_NEWS); return; }
  if (!window.fetch) return;
  fetch("/api/news").then(function (r) { return r.ok ? r.json() : []; }).then(render).catch(function () {});
})();
