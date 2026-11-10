/* Card admin: sign in with a Nostr extension (NIP-07), save with a signed NIP-98 header. */
(function () {
  var msg = document.getElementById("admin-msg");
  var saveMsg = document.getElementById("admin-save-msg");
  var login = document.getElementById("admin-login");
  var editor = document.getElementById("admin-editor");
  var tbody = document.querySelector("#admin-table tbody");
  var cards = [];

  function say(el, text, bad) { el.textContent = text; el.style.color = bad ? "var(--red)" : "var(--teal)"; }

  async function sha256hex(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  async function load() {
    var results = await Promise.all([fetch("/assets/cards.json").then(function (r) { return r.json(); }), fetch("/api/stock").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })]);
    cards = results[0];
    var stock = results[1];
    tbody.innerHTML = "";
    cards.forEach(function (c) {
      var cur = stock[c.file] || { status: c.status || "available", left: c.left };
      var tr = document.createElement("tr");
      tr.setAttribute("data-card", c.file);
      tr.innerHTML = '<td><strong></strong></td><td><select aria-label="Status"><option value="available">Available</option><option value="sold-out">Sold out</option><option value="coming-soon">Coming soon</option></select></td><td><input type="number" min="0" step="1" inputmode="numeric" aria-label="Copies left" placeholder="not tracked" style="width:8rem"></td>';
      tr.querySelector("strong").textContent = c.name + " (" + c.rarity + ", " + c.run + ")";
      tr.querySelector("select").value = cur.status;
      tr.querySelector("input").value = cur.left === null || cur.left === undefined ? "" : cur.left;
      tbody.appendChild(tr);
    });
  }

  document.getElementById("admin-signin").addEventListener("click", async function () {
    if (!window.nostr) { say(msg, "No Nostr extension found in this browser. Install one such as Alby or nos2x and try again.", true); return; }
    try {
      var pk = await window.nostr.getPublicKey();
      await load();
      login.hidden = true;
      editor.hidden = false;
      document.getElementById("admin-who").textContent = "Signed in as " + pk.slice(0, 8) + "… Saving only works for the owner key.";
    } catch (e) { say(msg, "Sign in was cancelled or failed.", true); }
  });

  document.getElementById("admin-save").addEventListener("click", async function () {
    var data = {};
    tbody.querySelectorAll("tr").forEach(function (tr) {
      var v = tr.querySelector("input").value.trim();
      data[tr.getAttribute("data-card")] = { status: tr.querySelector("select").value, left: v === "" ? null : Number(v) };
    });
    var body = JSON.stringify(data);
    try {
      var ev = await window.nostr.signEvent({
        kind: 27235, created_at: Math.floor(Date.now() / 1000), content: "",
        tags: [["u", location.origin + "/api/stock"], ["method", "PUT"], ["payload", await sha256hex(body)]]
      });
      var res = await fetch("/api/stock", { method: "PUT", headers: { "content-type": "application/json", authorization: "Nostr " + btoa(JSON.stringify(ev)) }, body: body });
      if (res.ok) say(saveMsg, "Saved. The site shows the new stock within a minute.");
      else say(saveMsg, res.status === 401 ? "This key is not allowed to change the cards." : "Could not save. Check the numbers and try again.", true);
    } catch (e) { say(saveMsg, "Signing was cancelled or failed.", true); }
  });
})();
