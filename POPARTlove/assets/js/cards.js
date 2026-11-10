/* Cards added or edited in the admin: new cards appear first, edited cards update in place, removed cards disappear. */
(function () {
  var first = document.querySelector("article[data-card]");
  if (!first) return;
  var grid, limit, inShop;
  var THEMES = { love: ["Love", "love"], freedom: ["Freedom", "freedom"], joy: ["Joy", "joy"] };
  var CART = '<svg class="ico-s" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 1.9-1.4L21 8H6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.6" fill="currentColor"/><circle cx="17" cy="20" r="1.6" fill="currentColor"/></svg>';
  var PIN = '<svg class="ico-s" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>';

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function imgs(c) {
    var v = "&v=" + (c.imv || 0);
    var front = c._front || (c.front ? "/api/event-image?id=c-" + encodeURIComponent(c.file) + v : "/assets/img/cards/" + c.file + ".webp");
    var back = c._back || (c.back ? "/api/event-image?id=c-" + encodeURIComponent(c.file) + "-back" + v : (c.front ? "" : "/assets/img/cards/" + c.file + "-back.webp"));
    return { front: front, back: back };
  }
  function runNum(c) { var m = /\d+/.exec(c.run || ""); return m ? m[0] : ""; }
  function body(c) {
    var t = THEMES[c.theme] || THEMES.love;
    return { theme: t, text: c.series + " series. " + c.run + ". " + (c.blurb || "") };
  }
  function build(c) {
    var im = imgs(c), b = body(c), n = runNum(c);
    var a = document.createElement("article");
    a.className = "card"; a.setAttribute("data-card", c.file); a.setAttribute("data-run", n);
    var fig = '<figure class="cardfig">' + (im.back
      ? '<button class="flip" type="button" aria-pressed="false" aria-label="Flip the ' + esc(c.name) + ' card"><span class="flip-inner"><img class="face front" src="' + esc(im.front) + '" alt="POPART ' + esc(c.name) + ' card front" width="600" height="840" loading="lazy"><img class="face back" src="' + esc(im.back) + '" alt="POPART ' + esc(c.name) + ' card back" width="600" height="840" loading="lazy"></span></button><span class="flip-hint">Tap the card to flip</span>'
      : '<img class="face front" src="' + esc(im.front) + '" alt="POPART ' + esc(c.name) + ' card" width="600" height="840" loading="lazy" style="width:100%;border-radius:4.5%">') + '</figure>';
    var online = inShop ? '<a class="tag where" data-where="online">' + CART + ' Online</a>' : '<a class="tag where" data-where="online" href="/shop/">' + CART + ' Online</a>';
    a.innerHTML = fig + '<div class="body"><div class="tags"><span class="tag ' + b.theme[1] + '">' + b.theme[0] + '</span><span class="tag" data-rarity>' + esc(c.rarity) + '</span><span class="tag stock ok" data-stock>Available</span></div>' +
      '<div class="tags where-row">' + online + '<a class="tag where" data-where="offline" href="/popup/">' + PIN + ' At events</a></div><p class="card-price" data-price hidden></p><h3>' + esc(c.name) + '</h3><p data-info>' + esc(b.text) + '</p></div>';
    return a;
  }
  function update(a, c) {
    var im = imgs(c), b = body(c);
    a.setAttribute("data-run", runNum(c));
    var fr = a.querySelector("img.front"), bk = a.querySelector("img.back");
    if (c.front && fr) { fr.src = im.front; }
    if (c.back && bk) bk.src = im.back;
    if (fr) fr.alt = "POPART " + c.name + " card front";
    var tags = a.querySelectorAll(".tags")[0].children;
    tags[0].textContent = b.theme[0]; tags[0].className = "tag " + b.theme[1];
    tags[1].textContent = c.rarity;
    var h = a.querySelector("h3"); if (h) h.textContent = c.name;
    var p = h && h.nextElementSibling; if (p) p.textContent = b.text;
  }
  function render(list) {
    var seen = [];
    document.querySelectorAll("article[data-card]").forEach(function (a) { if (seen.indexOf(a.parentNode) < 0) seen.push(a.parentNode); });
    seen.forEach(function (g) {
      grid = g; limit = Number(g.getAttribute("data-limit")) || 0; inShop = g.getAttribute("data-shop") === "1";
      renderGrid(list);
    });
    if (window.popartRefreshStock) window.popartRefreshStock();
  }
  function renderGrid(list) {
    var fresh = [];
    list.forEach(function (c) {
      var a = grid.querySelector('article[data-card="' + c.file + '"]');
      if (c.removed) { if (a) a.parentNode.removeChild(a); return; }
      if (a) update(a, c); else fresh.push(c);
    });
    for (var i = fresh.length - 1; i >= 0; i--) grid.insertBefore(build(fresh[i]), grid.firstChild);
    if (limit) { var all = grid.querySelectorAll("article[data-card]"); for (var j = limit; j < all.length; j++) all[j].parentNode.removeChild(all[j]); }
  }
  window.PopartCards = { render: render };
  if (window.POPART_DEMO_CARDS) { render(window.POPART_DEMO_CARDS); return; }
  if (!window.fetch) return;
  fetch("/api/cards").then(function (r) { return r.ok ? r.json() : []; }).then(function (l) { if (l && l.length) render(l); }).catch(function () {});
})();
