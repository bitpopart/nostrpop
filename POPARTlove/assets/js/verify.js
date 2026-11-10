/* Verify my card: looks the secret card code up in the artist's private list. */
(function () {
  var form = document.getElementById("verify-form");
  if (!form) return;
  var input = document.getElementById("v-code");
  var out = document.getElementById("v-result");

  function norm(t) { return t.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0"); }
  function show(kind, title, text, card) {
    out.className = "verify-result " + kind;
    out.innerHTML = "";
    if (card) {
      var img = document.createElement("img");
      img.src = "/assets/img/cards/" + card + ".webp"; img.alt = "";
      img.width = 600; img.height = 840;
      out.appendChild(img);
    } else { out.style.gridTemplateColumns = "minmax(0, 1fr)"; }
    if (card) out.style.gridTemplateColumns = "";
    var box = document.createElement("div");
    var h = document.createElement("h3"); h.textContent = title;
    var p = document.createElement("p"); p.textContent = text;
    box.appendChild(h); box.appendChild(p);
    out.appendChild(box);
    out.hidden = false;
    out.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  input.addEventListener("input", function () {
    var c = norm(input.value).slice(0, 10);
    input.value = c.length > 5 ? c.slice(0, 5) + "-" + c.slice(5) : c;
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var code = norm(input.value);
    if (code.length !== 10) { show("bad", "Check the code", "The code has 10 letters and numbers, for example 7K3QM-9X2TA.", null); return; }
    try {
      var res = await fetch("/api/verify?code=" + encodeURIComponent(code));
      if (res.status === 429) { show("warn", "Slow down", "Too many tries. Wait a minute and try again.", null); return; }
      if (!res.ok) throw new Error("no");
      var r = await res.json();
      if (!r.valid) { show("bad", "Code not found", "This code is not on the artist's list. Check the letters, or ask the artist if you are unsure about the card.", null); return; }
      var num = r.run === 1 ? "1/1" : String(r.serial).padStart(3, "0") + (r.run ? "/" + String(r.run).padStart(3, "0") : "");
      var text = r.name + " No. " + num + " is a real POPART card.";
      if (r.checks > 1) {
        show("warn", "Real code, checked before", text + " This code has been checked " + r.checks + " times. If you just bought the card and that surprises you, tell the artist.", r.card);
      } else {
        show("good", "Verified", text + " This is the first time the code was checked.", r.card);
      }
    } catch (err) {
      show("warn", "Could not check", "The check could not be reached right now. Try again in a moment.", null);
    }
  });
})();
