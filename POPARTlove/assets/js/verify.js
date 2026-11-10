/* Verify my card: looks the code from the back of the card up. No serial number needed. */
(function () {
  var form = document.getElementById("verify-form");
  if (!form) return;
  var input = document.getElementById("v-code");
  var holderIn = document.getElementById("v-holder");
  var out = document.getElementById("v-result");

  function norm(t) { return t.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function show(kind, title, text, card) {
    out.className = "verify-result " + kind;
    out.innerHTML = "";
    out.style.gridTemplateColumns = card ? "" : "minmax(0, 1fr)";
    if (card) {
      var img = document.createElement("img");
      img.src = "/assets/img/cards/" + card + ".webp"; img.alt = "";
      img.width = 600; img.height = 840;
      out.appendChild(img);
    }
    var box = document.createElement("div");
    var h = document.createElement("h3"); h.textContent = title;
    var p = document.createElement("p"); p.textContent = text;
    box.appendChild(h); box.appendChild(p);
    out.appendChild(box);
    out.hidden = false;
    out.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  input.addEventListener("input", function () {
    var c = norm(input.value).slice(0, 8);
    input.value = c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c;
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var code = norm(input.value);
    if (code.length !== 8) { show("bad", "Check the code", "The card code has 8 letters and numbers, for example K7QM-2XP9. You find it on the back of the card, bottom right.", null); return; }
    try {
      var res = await fetch("/api/verify?code=" + encodeURIComponent(code) + (holderIn && holderIn.value.trim() ? "&holder=" + encodeURIComponent(holderIn.value.trim()) : ""));
      if (res.status === 429) { show("warn", "Slow down", "Too many tries. Wait a minute and try again.", null); return; }
      if (res.status === 503) { show("warn", "Not ready yet", "Card checking is not switched on yet. Please try again soon.", null); return; }
      if (!res.ok) throw new Error("no");
      var r = await res.json();
      if (!r.valid) { show("bad", "Code not found", "This code is not in the artist's system. Check the letters once more. If it still fails, ask the artist about this card.", null); return; }
      var num = r.run === 1 ? "1/1" : String(r.serial).padStart(3, "0") + "/" + String(r.run).padStart(3, "0");
      var text = r.name + " No. " + num + " is a real POPART card." + (r.recorded ? " It is on the artist's list of sold cards." : " It is not on the artist's sold list yet.");
      if (r.holderOk === false) { show("bad", "Holder number does not match", "The card code is real, but that holder number does not belong to this copy. The holder number is on the certificate and mount card.", r.card); return; }
      if (r.holderOk === true) text += " The holder number matches, so you hold the card and its certificate.";
      if (r.checks > 1) show("warn", "Real code, checked before", text + " This code has been checked " + r.checks + " times. If you just bought the card and that surprises you, tell the artist.", r.card);
      else show("good", "Authentic card", text + " This is the first time this code was checked.", r.card);
    } catch (err) {
      show("warn", "Could not check", "The check could not be reached right now. Try again in a moment.", null);
    }
  });
})();
