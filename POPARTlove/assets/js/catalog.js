/* Stickers and Prints pages: show the items saved in the admin. Without items the draft designs stay. */
(function () {
  var grids = document.querySelectorAll("[data-kind]");
  if (!grids.length) return;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function card(it) {
    var a = el("article", "card");
    if (it.image) {
      var f = el("figure"), img = document.createElement("img");
      img.src = it._src || ("/api/event-image?id=" + encodeURIComponent(it.id) + "&v=" + (it.imv || 0));
      img.alt = it.title; img.width = 400; img.height = 400; img.loading = "lazy";
      f.appendChild(img); a.appendChild(f);
    }
    var b = el("div", "body"), tags = el("div", "tags");
    var soon = it.status === "coming-soon";
    tags.appendChild(el("span", "tag " + (soon ? "soon" : "stock ok"), soon ? "Coming soon" : "Available"));
    if (it.price) tags.appendChild(el("span", "tag", it.price));
    b.appendChild(tags);
    b.appendChild(el("h3", "", it.title));
    if (it.description) b.appendChild(el("p", "", it.description));
    if (it.digital && it.file) tags.appendChild(el("span", "tag", "Digital file"));
    if (!soon && it.url) { var l = el("a", "btn", it.digital === "paid" ? "Buy digital file" : "Buy"); l.href = it.url; l.target = "_blank"; l.rel = "noopener"; b.appendChild(l); }
    if (it.digital === "free" && it.file) { var d = el("a", "btn yellow", "Download to print"); d.href = it._href || ("/api/file?id=" + encodeURIComponent(it.id)); d.setAttribute("download", it.fname || ""); b.appendChild(d); }
    if (it.digital === "paid" && it.file) { var h = el("a", "", "Bought it? Enter your download code"); h.href = "/shop/#digital"; b.appendChild(h); }
    a.appendChild(b);
    return a;
  }
  function render(grid, list) {
    if (!list.length) return;
    grid.innerHTML = "";
    list.forEach(function (it) { grid.appendChild(card(it)); });
    var n = grid.parentNode.querySelector("[data-catalog-notice]");
    if (n) n.hidden = true;
  }
  window.PopartCatalog = { render: function (kind, list) { grids.forEach(function (g) { if (g.getAttribute("data-kind") === kind) render(g, list); }); } };
  grids.forEach(function (grid) {
    var kind = grid.getAttribute("data-kind");
    fetch("/api/catalog?kind=" + kind).then(function (r) { if (!r.ok) throw new Error("no"); return r.json(); }).then(function (l) { render(grid, l); }).catch(function () { if (window.POPART_DEMO_CATALOG) render(grid, window.POPART_DEMO_CATALOG[kind] || []); });
  });
})();
