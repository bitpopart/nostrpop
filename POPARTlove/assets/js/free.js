/* Free downloads page: lists the files saved in the admin, with category filters. */
(function () {
  var grid = document.getElementById("free-grid");
  var bar = document.getElementById("free-filters");
  if (!grid || !bar) return;
  var all = [], current = "All";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function kind(it) { var m = /\.([A-Za-z0-9]{1,6})$/.exec(it.fname || ""); return m ? m[1].toUpperCase() : "FILE"; }

  function card(it) {
    var a = el("article", "card");
    var f = el("figure");
    if (it.image) {
      var img = document.createElement("img");
      img.src = it._src || ("/api/event-image?id=" + encodeURIComponent(it.id) + "&v=" + (it.imv || 0));
      img.alt = it.title; img.width = 400; img.height = 400; img.loading = "lazy";
      f.appendChild(img);
    } else { f.className = "file-fig"; f.appendChild(el("span", "file-kind", kind(it))); }
    a.appendChild(f);
    var b = el("div", "body"), tags = el("div", "tags");
    if (it.category) tags.appendChild(el("span", "tag", it.category));
    tags.appendChild(el("span", "tag", kind(it) + (it.size ? " · " + size(it.size) : "")));
    b.appendChild(tags);
    b.appendChild(el("h3", "", it.title));
    if (it.description) b.appendChild(el("p", "", it.description));
    var l = el("a", "btn", "Download");
    l.href = it._href || ("/api/file?id=" + encodeURIComponent(it.id));
    l.setAttribute("download", it.fname || "");
    b.appendChild(l);
    a.appendChild(b);
    return a;
  }
  function draw() {
    grid.innerHTML = "";
    var shown = all.filter(function (i) { return current === "All" || i.category === current; });
    shown.forEach(function (it) { grid.appendChild(card(it)); });
  }
  function render(list) {
    list = list.filter(function (i) { return i.file; });
    if (!list.length) return;
    all = list;
    var cats = ["All"];
    list.forEach(function (i) { if (i.category && cats.indexOf(i.category) < 0) cats.push(i.category); });
    bar.innerHTML = "";
    if (cats.length > 2) cats.forEach(function (c) {
      var t = el("button", "btn " + (c === current ? "" : "ghost"), c); t.type = "button";
      t.addEventListener("click", function () { current = c; render(all); });
      bar.appendChild(t);
    });
    draw();
  }
  window.PopartFree = { render: render };
  fetch("/api/catalog?kind=free").then(function (r) { if (!r.ok) throw new Error("no"); return r.json(); }).then(render).catch(function () { if (window.POPART_DEMO_FREE) render(window.POPART_DEMO_FREE); });
})();
