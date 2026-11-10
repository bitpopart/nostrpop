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
    document.title = "Card admin | POPART.love";
    var head = document.querySelector(".page-head");
    if (head) head.innerHTML = '<div class="container"><h1>Card admin</h1><p>Update which cards are available.</p></div>';
    root.innerHTML = '<div class="section-head"><div><h2>Cards</h2><p>Signed in with your Nostr key.</p></div><button class="btn" type="button" id="admin-save">Save changes</button></div>' +
      '<div class="table-wrap"><table class="simple" id="admin-table"><thead><tr><th>Card</th><th>Status</th><th>Copies left</th><th>Sold where</th><th>Shop link (https)</th><th>Sold serials</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="form-msg" id="admin-save-msg" role="status"></p>' +
      '<div class="section-head" style="margin-top:2rem"><div><h2>Secret card codes</h2><p>Make one unique code for every copy of a numbered card. Print them on the card or sleeve. Making new codes for a card replaces its old ones. Codes are shown only once, so copy the list and keep it safe.</p></div></div>' +
      '<div class="panel" style="display:grid;gap:.8rem"><label for="code-card">Card</label><select id="code-card"></select><div><button class="btn" type="button" id="code-make">Make codes</button></div><p class="form-msg" id="code-msg" role="status"></p><textarea id="code-out" rows="8" readonly hidden style="width:100%;font-family:monospace;padding:.8rem;border:1.5px solid var(--line);border-radius:16px;background:var(--panel2);color:var(--ink)"></textarea><div><button class="btn" type="button" id="code-copy" hidden>Copy list</button></div></div>';
    var tbody = root.querySelector("tbody");
    cards.forEach(function (c) {
      var cur = stock[c.file] || { status: c.status || "available", left: c.left };
      var tr = document.createElement("tr");
      tr.setAttribute("data-card", c.file);
      tr.innerHTML = '<td><strong></strong></td><td><select aria-label="Status"><option value="available">Available</option><option value="sold-out">Sold out</option><option value="coming-soon">Coming soon</option></select></td><td><input type="number" min="0" step="1" inputmode="numeric" aria-label="Copies left" placeholder="not tracked" style="width:8rem"></td><td><select class="where" aria-label="Sold where"><option value="both">Online and at events</option><option value="online">Online only</option><option value="events">At events only</option><option value="none">Not sold now</option></select></td><td><input type="url" class="url" aria-label="Shop link" placeholder="https://" style="width:16rem"></td><td><input type="text" class="sold" aria-label="Sold serials" placeholder="1-5, 7" style="width:11rem"></td>';
      tr.querySelector("strong").textContent = c.name + " (" + c.rarity + ", " + c.run + ")";
      tr.querySelector("select").value = cur.status;
      tr.querySelector("input[type=number]").value = cur.left === null || cur.left === undefined ? "" : cur.left;
      var on = cur.online === undefined ? c.online !== false : cur.online;
      var off = cur.offline === undefined ? c.offline !== false : cur.offline;
      tr.querySelector(".where").value = on && off ? "both" : on ? "online" : off ? "events" : "none";
      tr.querySelector(".sold").value = registry[c.file] || "";
      tr.querySelector(".url").value = cur.url === undefined ? (c.url || "") : cur.url;
      tbody.appendChild(tr);
    });
    var codeSel = document.getElementById("code-card");
    cards.forEach(function (c) { var m = /\d+/.exec(c.run || ""); if (m && Number(m[0]) <= 1000) { var o = document.createElement("option"); o.value = c.file; o.textContent = c.name + " (" + c.run + ")"; codeSel.appendChild(o); } });
    var codeMsg = document.getElementById("code-msg"), codeOut = document.getElementById("code-out"), codeCopy = document.getElementById("code-copy"), codeBtn = document.getElementById("code-make"), armed = false;
    codeSel.addEventListener("change", function () { armed = false; codeBtn.textContent = "Make codes"; });
    codeBtn.addEventListener("click", async function () {
      if (!codeSel.value) return;
      if (!armed) { armed = true; codeBtn.textContent = "Click again to replace any old codes"; say(codeMsg, "Old codes for this card stop working when you make new ones.", false); return; }
      armed = false; codeBtn.textContent = "Make codes";
      var body = JSON.stringify({ card: codeSel.value });
      try {
        var res = await fetch("/api/codes", { method: "POST", headers: { "content-type": "application/json", authorization: await authHeader("POST", "/api/codes", body) }, body: body });
        if (!res.ok) { say(codeMsg, "Could not make codes for this card.", true); return; }
        var r = await res.json();
        codeOut.value = "copy,code\n" + r.codes.map(function (x) { return x.serial + "/" + r.run + "," + x.code.slice(0, 5) + "-" + x.code.slice(5); }).join("\n");
        codeOut.hidden = false; codeCopy.hidden = false;
        say(codeMsg, r.run + " codes made. Copy them now, they are not shown again.");
      } catch (e) { say(codeMsg, "Signing was cancelled or failed.", true); }
    });
    codeCopy.addEventListener("click", function () { codeOut.select(); try { navigator.clipboard.writeText(codeOut.value); say(codeMsg, "Copied."); } catch (e) { document.execCommand("copy"); } });
    var saveMsg = document.getElementById("admin-save-msg");
    document.getElementById("admin-save").addEventListener("click", async function () {
      var data = {};
      tbody.querySelectorAll("tr").forEach(function (tr) {
        var v = tr.querySelector("input[type=number]").value.trim();
        data[tr.getAttribute("data-card")] = {
          status: tr.querySelector("select").value, left: v === "" ? null : Number(v),
          online: ["both", "online"].indexOf(tr.querySelector(".where").value) > -1, offline: ["both", "events"].indexOf(tr.querySelector(".where").value) > -1, url: tr.querySelector(".url").value.trim(), sold: tr.querySelector(".sold").value.trim()
        };
      });
      var body = JSON.stringify(data);
      try {
        var res = await fetch("/api/stock", { method: "PUT", headers: { "content-type": "application/json", authorization: await authHeader("PUT", "/api/stock", body) }, body: body });
        if (res.ok) say(saveMsg, "Saved. The site shows the new stock within a minute.");
        else say(saveMsg, "Could not save. Check the numbers and that the shop link starts with https:// and sold serials look like 1-5, 7.", true);
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
