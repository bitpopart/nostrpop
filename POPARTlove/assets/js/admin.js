/* Card admin. The page looks like a 404 to everyone. The editor only appears when the
   Nostr extension signs in with the owner key. Saving is checked again on the server. */
(function () {
  var OWNER = "43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c";
  var root = document.getElementById("admin-root");
  var cards = [];

  function say(el, text, bad) { el.textContent = text; el.style.color = bad ? "var(--red)" : "var(--teal)"; }
  async function sha256hex(text) {
    var buf = await crypto.subtle.digest("SHA-256", typeof text === "string" ? new TextEncoder().encode(text) : text);
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  async function authHeader(method, path, body) {
    var ev = await window.nostr.signEvent({
      kind: 27235, created_at: Math.floor(Date.now() / 1000), content: "",
      tags: [["u", location.origin + path], ["method", method], ["payload", await sha256hex(body)]]
    });
    return "Nostr " + btoa(JSON.stringify(ev));
  }
  function waitForNostr() {
    return new Promise(function (resolve) {
      var n = 0;
      (function check() { if (window.nostr) return resolve(window.nostr); if (++n > 20) return resolve(null); setTimeout(check, 100); })();
    });
  }

  // Always read the saved lists fresh in the admin, so a reload never shows an older copy from the browser cache.
  function fresh(url) { return fetch(url + (url.indexOf("?") > -1 ? "&" : "?") + "_=" + Date.now(), { cache: "no-store" }); }

  async function render() {
    var results = await Promise.all([
      fetch("/assets/cards.json").then(function (r) { return r.json(); }),
      fresh("/api/stock").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]);
    var baseCards = results[0];
    var saved = [];
    try { var cr = await fresh("/api/cards"); if (cr.ok) saved = await cr.json(); } catch (e) {}
    var byFile = {}; saved.forEach(function (e) { byFile[e.file] = e; });
    var baseSet = {}; baseCards.forEach(function (c) { baseSet[c.file] = 1; });
    cards = saved.filter(function (e) { return !baseSet[e.file]; }).concat(baseCards.map(function (c) { return Object.assign({}, c, byFile[c.file] || {}); })).filter(function (c) { return !c.removed; });
    var stock = results[1];
    var registry = {};
    try {
      var rr = await fetch("/api/registry", { headers: { authorization: await authHeader("GET", "/api/registry", "") } });
      if (rr.ok) registry = await rr.json();
    } catch (e) {}
    document.title = "Admin | POPART.love";
    var head = document.querySelector(".page-head");
    if (head) head.innerHTML = '<div class="container"><h1>Admin</h1><p>Cards, news, PopUp events, stickers, prints and free downloads.</p></div>';
    root.innerHTML = '<nav class="admin-jump" aria-label="Jump to a section"></nav><div class="section-head" id="sec-stock"><div><h2>Cards</h2><p>Signed in with your Nostr key.</p></div><button class="btn" type="button" id="admin-save">Save changes</button></div>' +
      '<div class="table-wrap"><table class="simple" id="admin-table"><thead><tr><th>Card</th><th>Status</th><th>Copies left</th><th>Price (EUR = USD)</th><th>Sold where</th><th>Shop link (https)</th><th>Sold serials</th><th>Collections</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="form-msg" id="admin-save-msg" role="status"></p>';
    var tbody = root.querySelector("tbody");
    cards.forEach(function (c) {
      var cur = stock[c.file] || { status: c.status || "available", left: c.left };
      var tr = document.createElement("tr");
      tr.setAttribute("data-card", c.file);
      tr.innerHTML = '<td><strong></strong></td><td><select aria-label="Status"><option value="available">Available</option><option value="sold-out">Sold out</option><option value="coming-soon">Coming soon</option></select></td><td><input type="number" min="0" step="1" inputmode="numeric" aria-label="Copies left" placeholder="not tracked" ></td><td><input type="text" class="price" inputmode="decimal" aria-label="Price, same in euro and dollar" placeholder="e.g. 5" ></td><td><select class="where" aria-label="Sold where"><option value="both">Online and at events</option><option value="online">Online only</option><option value="events">At events only</option><option value="none">Not sold now</option></select></td><td><input type="url" class="url" aria-label="Shop link" placeholder="https://" ></td><td><input type="text" class="sold" aria-label="Sold serials" placeholder="1-5, 7" ></td><td class="coll-cell"></td>';
      ['Card','Status','Copies left','Price (EUR = USD)','Sold where','Shop link (https)','Sold serials','Add to collection'].forEach(function (l, i) { tr.children[i].setAttribute('data-label', l); });
      var first = tr.children[0];
      first.innerHTML = '<div class="adm-card"><img alt="" width="60" height="84"><strong></strong></div>';
      first.querySelector("img").src = c.front ? "/api/event-image?id=c-" + encodeURIComponent(c.file) + "&v=" + (c.imv || 0) : "/assets/img/cards/" + c.file + ".webp";
      first.querySelector("img").alt = c.name + " card";
      first.querySelector("strong").textContent = c.name + " (" + c.rarity + ", " + c.run + ")";
      tr.querySelector("select").value = cur.status;
      tr.querySelector("input[type=number]").value = cur.left === null || cur.left === undefined ? "" : cur.left;
      var on = cur.online === undefined ? c.online !== false : cur.online;
      var off = cur.offline === undefined ? c.offline !== false : cur.offline;
      tr.querySelector(".where").value = on && off ? "both" : on ? "online" : off ? "events" : "none";
      tr.querySelector(".sold").value = registry[c.file] || "";
      tr.querySelector(".price").value = cur.price || "";
      tr.querySelector(".url").value = cur.url === undefined ? (c.url || "") : cur.url;
      tbody.appendChild(tr);
    });
    var saveMsg = document.getElementById("admin-save-msg");
    var cardsBox = document.createElement("div");
    cardsBox.style.marginTop = "2.4rem";
    root.appendChild(cardsBox);
    var collBox = document.createElement("div");
    collBox.style.marginTop = "2.4rem";
    root.appendChild(collBox);
    var newsBox = document.createElement("div");
    newsBox.style.marginTop = "2.4rem";
    root.appendChild(newsBox);
    var evBox = document.createElement("div");
    evBox.style.marginTop = "2.4rem";
    root.appendChild(evBox);
    async function signedPut(path, body) {
      var res = await fetch(path, { method: "PUT", headers: { authorization: await authHeader("PUT", path.split("?")[0], body) }, body: body });
      if (!res.ok) {
        var why = "";
        try { why = (await res.json()).error || ""; } catch (e) {}
        throw new Error("HTTP " + res.status + (why ? " " + why : ""));
      }
      return res;
    }
    ["stickers", "prints", "free"].forEach(function (kind) {
      var box = document.createElement("div");
      box.setAttribute("data-kind", kind);
      box.style.marginTop = "2.4rem";
      root.appendChild(box);
      window.PopartCatalogAdmin.mount(box, kind, {
        codes: async function (id, count, uses) {
          var body = JSON.stringify({ id: id, count: count, uses: uses });
          var res = await fetch("/api/dl-codes", { method: "POST", headers: { authorization: await authHeader("POST", "/api/dl-codes", body) }, body: body });
          if (!res.ok) throw new Error("no");
          return (await res.json()).codes;
        },
        load: function () { return fresh("/api/catalog?kind=" + kind).then(function (r) { return r.ok ? r.json() : []; }); },
        save: async function (list) {
          var out = [];
          for (var i = 0; i < list.length; i++) {
            var it = Object.assign({}, list[i]);
            if (it._img) { await signedPut("/api/event-image?id=" + encodeURIComponent(it.id), it._img); it.image = true; it.imv = Date.now(); delete it._img; }
            if (it._file) { await signedPut("/api/file?id=" + encodeURIComponent(it.id), await it._file.arrayBuffer()); delete it._file; }
            out.push(it);
          }
          var res = await signedPut("/api/catalog?kind=" + kind, JSON.stringify(out));
          return (await res.json()).items;
        }
      });
    });
    window.PopartCardsAdmin.mount(cardsBox, {
      base: baseCards,
      load: function () { return fresh("/api/cards").then(function (r) { return r.ok ? r.json() : []; }); },
      saved: function () { render(); },
      save: async function (list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var c = Object.assign({}, list[i]);
          if (c._front) { await signedPut("/api/event-image?id=c-" + encodeURIComponent(c.file), c._front); c.front = true; c.imv = Date.now(); }
          if (c._back) { await signedPut("/api/event-image?id=c-" + encodeURIComponent(c.file) + "-back", c._back); c.back = true; c.imv = Date.now(); }
          delete c._front; delete c._back;
          out.push(c);
        }
        var res = await signedPut("/api/cards", JSON.stringify(out));
        return (await res.json()).cards;
      }
    });
    function thumbOf(c) { return c.front ? "/api/event-image?id=c-" + encodeURIComponent(c.file) + "&v=" + (c.imv || 0) : "/assets/img/cards/" + c.file + ".webp"; }
    var stickerList = [], printList = [];
    try { var sr = await fresh("/api/catalog?kind=stickers"); if (sr.ok) stickerList = await sr.json(); var pr = await fresh("/api/catalog?kind=prints"); if (pr.ok) printList = await pr.json(); } catch (e) {}
    var coll = window.PopartCollectionsAdmin.mount(collBox, {
      stickers: function () { return stickerList; },
      prints: function () { return printList; },
      cards: function () { return cards; },
      thumbOf: thumbOf,
      load: function () { return fresh("/api/collections").then(function (r) { return r.ok ? r.json() : []; }); },
      save: async function (list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var c = Object.assign({}, list[i]);
          if (c._img) { await signedPut("/api/event-image?id=k-" + encodeURIComponent(c.id), c._img); c.image = true; c.imv = Date.now(); delete c._img; }
          out.push(c);
        }
        var res = await signedPut("/api/collections", JSON.stringify(out));
        var saved = (await res.json()).collections;
        // read it back, so we know the server really kept it
        try {
          var back = await (await fresh("/api/collections")).json();
          var ids = back.map(function (c) { return c.id; });
          if (saved.some(function (c) { return ids.indexOf(c.id) < 0; })) throw new Error("The server accepted the save but did not return it when read back. Wait a minute and reload to check.");
        } catch (e) { if (/read back/.test(e.message)) throw e; }
        return saved;
      }
    });
    function fillCollCells() {
      var all = coll.list();
      tbody.querySelectorAll("tr").forEach(function (tr) {
        var cell = tr.querySelector(".coll-cell"), file = tr.getAttribute("data-card");
        cell.innerHTML = "";
        if (!all.length) { cell.textContent = "Make a collection below first."; return; }
        all.forEach(function (c) {
          var l = document.createElement("label"); l.className = "coll-chip";
          var cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = coll.has(c.id, file);
          cb.addEventListener("change", function () { coll.toggle(c.id, file, cb.checked); });
          l.appendChild(cb); l.appendChild(document.createTextNode(" " + c.name)); cell.appendChild(l);
        });
      });
    }
    coll.onChange(fillCollCells);
    fillCollCells();
    window.PopartNewsAdmin.mount(newsBox, {
      load: function () { return fresh("/api/news").then(function (r) { return r.ok ? r.json() : []; }); },
      save: async function (list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var n = Object.assign({}, list[i]);
          if (n._img) { await signedPut("/api/event-image?id=n-" + encodeURIComponent(n.id), n._img); n.image = true; n.imv = Date.now(); delete n._img; }
          out.push(n);
        }
        var res = await signedPut("/api/news", JSON.stringify(out));
        return (await res.json()).news;
      }
    });
    window.PopartEventsAdmin.mount(evBox, {
      load: function () { return fresh("/api/events").then(function (r) { return r.ok ? r.json() : []; }); },
      save: async function (list) {
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var ev = Object.assign({}, list[i]);
          if (ev._img) { await signedPut("/api/event-image?id=" + encodeURIComponent(ev.id), ev._img); ev.image = true; ev.imv = Date.now(); delete ev._img; }
          out.push(ev);
        }
        var res = await signedPut("/api/events", JSON.stringify(out));
        return (await res.json()).events;
      }
    });
    var jumps = [["Cards", document.getElementById("sec-stock")], ["Edit cards", cardsBox], ["Collections", collBox], ["News", newsBox], ["PopUp", evBox]];
    [["Stickers", "stickers"], ["Prints", "prints"], ["Free downloads", "free"]].forEach(function (k) { jumps.push([k[0], root.querySelector('[data-kind="' + k[1] + '"]')]); });
    var jbar = root.querySelector(".admin-jump");
    jumps.forEach(function (j) {
      if (!j[1]) return;
      j[1].style.scrollMarginTop = "8rem";
      var bt = document.createElement("button"); bt.type = "button"; bt.className = "btn ghost"; bt.textContent = j[0];
      bt.addEventListener("click", function () { j[1].scrollIntoView({ behavior: "smooth", block: "start" }); });
      jbar.appendChild(bt);
    });
    document.getElementById("admin-save").addEventListener("click", async function () {
      var data = {};
      tbody.querySelectorAll("tr").forEach(function (tr) {
        var v = tr.querySelector("input[type=number]").value.trim();
        data[tr.getAttribute("data-card")] = {
          status: tr.querySelector("select").value, left: v === "" ? null : Number(v),
          online: ["both", "online"].indexOf(tr.querySelector(".where").value) > -1, offline: ["both", "events"].indexOf(tr.querySelector(".where").value) > -1, url: tr.querySelector(".url").value.trim(), price: tr.querySelector(".price").value.trim(), sold: tr.querySelector(".sold").value.trim()
        };
      });
      var body = JSON.stringify(data);
      try {
        var res = await fetch("/api/stock", { method: "PUT", headers: { "content-type": "application/json", authorization: await authHeader("PUT", "/api/stock", body) }, body: body });
        if (res.ok) {
          if (coll.isDirty()) { try { await coll.save(); } catch (e) { say(saveMsg, "Stock saved, but the collections could not be saved.", true); return; } }
          say(saveMsg, "Saved. The site shows the changes within a minute.");
        }
        else say(saveMsg, "Could not save. Check the numbers and that the shop link starts with https:// and sold serials look like 1-5, 7, and the price is a number like 5 or 7.50.", true);
      } catch (e) { say(saveMsg, "Signing was cancelled or failed.", true); }
    });
  }

  waitForNostr().then(function (nostr) {
    if (!nostr) return;
    return nostr.getPublicKey().then(function (pk) {
      if (pk !== OWNER) return;
      try { localStorage.setItem("popart-admin", "1"); } catch (e) {}
      return render();
    });
  }).catch(function () {});
})();
