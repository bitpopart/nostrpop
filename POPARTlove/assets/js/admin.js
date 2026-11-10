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

  async function render() {
    var results = await Promise.all([
      fetch("/assets/cards.json").then(function (r) { return r.json(); }),
      fetch("/api/stock").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]);
    cards = results[0];
    var stock = results[1];
    var registry = {};
    try {
      var rr = await fetch("/api/registry", { headers: { authorization: await authHeader("GET", "/api/registry", "") } });
      if (rr.ok) registry = await rr.json();
    } catch (e) {}
    document.title = "Admin | POPART.love";
    var head = document.querySelector(".page-head");
    if (head) head.innerHTML = '<div class="container"><h1>Admin</h1><p>Cards, PopUp events, stickers and prints.</p></div>';
    root.innerHTML = '<div class="section-head"><div><h2>Cards</h2><p>Signed in with your Nostr key.</p></div><button class="btn" type="button" id="admin-save">Save changes</button></div>' +
      '<div class="table-wrap"><table class="simple" id="admin-table"><thead><tr><th>Card</th><th>Status</th><th>Copies left</th><th>Price (EUR = USD)</th><th>Sold where</th><th>Shop link (https)</th><th>Sold serials</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="form-msg" id="admin-save-msg" role="status"></p>';
    var tbody = root.querySelector("tbody");
    cards.forEach(function (c) {
      var cur = stock[c.file] || { status: c.status || "available", left: c.left };
      var tr = document.createElement("tr");
      tr.setAttribute("data-card", c.file);
      tr.innerHTML = '<td><strong></strong></td><td><select aria-label="Status"><option value="available">Available</option><option value="sold-out">Sold out</option><option value="coming-soon">Coming soon</option></select></td><td><input type="number" min="0" step="1" inputmode="numeric" aria-label="Copies left" placeholder="not tracked" ></td><td><input type="text" class="price" inputmode="decimal" aria-label="Price, same in euro and dollar" placeholder="e.g. 5" ></td><td><select class="where" aria-label="Sold where"><option value="both">Online and at events</option><option value="online">Online only</option><option value="events">At events only</option><option value="none">Not sold now</option></select></td><td><input type="url" class="url" aria-label="Shop link" placeholder="https://" ></td><td><input type="text" class="sold" aria-label="Sold serials" placeholder="1-5, 7" ></td>';
      ['Card','Status','Copies left','Price (EUR = USD)','Sold where','Shop link (https)','Sold serials'].forEach(function (l, i) { tr.children[i].setAttribute('data-label', l); });
      tr.querySelector("strong").textContent = c.name + " (" + c.rarity + ", " + c.run + ")";
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
    var evBox = document.createElement("div");
    evBox.style.marginTop = "2.4rem";
    root.appendChild(evBox);
    async function signedPut(path, body) {
      var res = await fetch(path, { method: "PUT", headers: { authorization: await authHeader("PUT", path.split("?")[0], body) }, body: body });
      if (!res.ok) throw new Error("save failed");
      return res;
    }
    ["stickers", "prints", "free"].forEach(function (kind) {
      var box = document.createElement("div");
      box.style.marginTop = "2.4rem";
      root.appendChild(box);
      window.PopartCatalogAdmin.mount(box, kind, {
        codes: async function (id, count, uses) {
          var body = JSON.stringify({ id: id, count: count, uses: uses });
          var res = await fetch("/api/dl-codes", { method: "POST", headers: { authorization: await authHeader("POST", "/api/dl-codes", body) }, body: body });
          if (!res.ok) throw new Error("no");
          return (await res.json()).codes;
        },
        load: function () { return fetch("/api/catalog?kind=" + kind).then(function (r) { return r.ok ? r.json() : []; }); },
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
    window.PopartEventsAdmin.mount(evBox, {
      load: function () { return fetch("/api/events").then(function (r) { return r.ok ? r.json() : []; }); },
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
        if (res.ok) say(saveMsg, "Saved. The site shows the new stock within a minute.");
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
