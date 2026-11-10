/* Card admin. The page looks like a 404 to everyone. The editor only appears when the
   Nostr extension signs in with the owner key. Saving is checked again on the server. */
(function () {
  var OWNER = "43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c";
  var root = document.getElementById("admin-root");
  var cards = [];

  function say(el, text, bad) { el.textContent = text; el.style.color = bad ? "var(--red)" : "var(--teal)"; }
  async function sha256hex(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
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
    document.title = "Card admin | POPART.love";
    var head = document.querySelector(".page-head");
    if (head) head.innerHTML = '<div class="container"><h1>Card admin</h1><p>Update which cards are available.</p></div>';
    root.innerHTML = '<div class="section-head"><div><h2>Cards</h2><p>Signed in with your Nostr key.</p></div><button class="btn" type="button" id="admin-save">Save changes</button></div>' +
      '<div class="table-wrap"><table class="simple" id="admin-table"><thead><tr><th>Card</th><th>Status</th><th>Copies left</th><th>Online</th><th>At events</th><th>Shop link (https)</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="form-msg" id="admin-save-msg" role="status"></p>';
    var tbody = root.querySelector("tbody");
    cards.forEach(function (c) {
      var cur = stock[c.file] || { status: c.status || "available", left: c.left };
      var tr = document.createElement("tr");
      tr.setAttribute("data-card", c.file);
      tr.innerHTML = '<td><strong></strong></td><td><select aria-label="Status"><option value="available">Available</option><option value="sold-out">Sold out</option><option value="coming-soon">Coming soon</option></select></td><td><input type="number" min="0" step="1" inputmode="numeric" aria-label="Copies left" placeholder="not tracked" style="width:8rem"></td><td><input type="checkbox" class="on" aria-label="Sold online"></td><td><input type="checkbox" class="off" aria-label="Sold at events"></td><td><input type="url" class="url" aria-label="Shop link" placeholder="https://" style="width:16rem"></td>';
      tr.querySelector("strong").textContent = c.name + " (" + c.rarity + ", " + c.run + ")";
      tr.querySelector("select").value = cur.status;
      tr.querySelector("input[type=number]").value = cur.left === null || cur.left === undefined ? "" : cur.left;
      tr.querySelector(".on").checked = cur.online === undefined ? c.online !== false : cur.online;
      tr.querySelector(".off").checked = cur.offline === undefined ? c.offline !== false : cur.offline;
      tr.querySelector(".url").value = cur.url === undefined ? (c.url || "") : cur.url;
      tbody.appendChild(tr);
    });
    var saveMsg = document.getElementById("admin-save-msg");
    document.getElementById("admin-save").addEventListener("click", async function () {
      var data = {};
      tbody.querySelectorAll("tr").forEach(function (tr) {
        var v = tr.querySelector("input[type=number]").value.trim();
        data[tr.getAttribute("data-card")] = {
          status: tr.querySelector("select").value, left: v === "" ? null : Number(v),
          online: tr.querySelector(".on").checked, offline: tr.querySelector(".off").checked, url: tr.querySelector(".url").value.trim()
        };
      });
      var body = JSON.stringify(data);
      try {
        var ev = await window.nostr.signEvent({
          kind: 27235, created_at: Math.floor(Date.now() / 1000), content: "",
          tags: [["u", location.origin + "/api/stock"], ["method", "PUT"], ["payload", await sha256hex(body)]]
        });
        var res = await fetch("/api/stock", { method: "PUT", headers: { "content-type": "application/json", authorization: "Nostr " + btoa(JSON.stringify(ev)) }, body: body });
        if (res.ok) say(saveMsg, "Saved. The site shows the new stock within a minute.");
        else say(saveMsg, "Could not save. Check the numbers and that the shop link starts with https://.", true);
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
