/* Verify my card: checks the serial against the print run and the artist's sold list. */
(function () {
  var form = document.getElementById("verify-form");
  if (!form) return;
  var data = JSON.parse(document.getElementById("cards-data").textContent);
  var sel = document.getElementById("v-card");
  var input = document.getElementById("v-serial");
  var codeIn = document.getElementById("v-code");
  var out = document.getElementById("v-result");

  function runOf(card) { var m = /\d+/.exec(card.run || ""); return m ? Number(m[0]) : null; }
  function show(kind, title, text, card) {
    out.className = "verify-result " + kind;
    out.innerHTML = "";
    if (card) {
      var img = document.createElement("img");
      img.src = "/assets/img/cards/" + card.file + ".webp"; img.alt = card.name + " card";
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

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var card = data.filter(function (c) { return c.file === sel.value; })[0];
    if (!card) { show("bad", "Pick a card", "Choose the card you want to check.", null); return; }
    var raw = input.value.trim();
    var run = runOf(card);
    if (run === null) {
      show("info", "No serial on this card", card.name + " is an open edition card. It has no serial number, so there is nothing to verify. Its rarity badge and artist line are the details to look at.", card);
      return;
    }
    var m = /^(\d{1,6})(?:\s*\/\s*(\d{1,6}))?$/.exec(raw);
    if (!m) { show("bad", "Check the number", "Type the serial as it is printed at the bottom right of the card, for example 007/" + String(run).padStart(3, "0") + " or just 7.", card); return; }
    var serial = Number(m[1]);
    if (m[2] && Number(m[2]) !== run) {
      show("bad", "Not a match", card.name + " has a print run of " + run + ", but the number you typed says " + Number(m[2]) + ". Check that you picked the right card.", card);
      return;
    }
    if (serial < 1 || serial > run) {
      show("bad", "Not a valid serial", "Serial " + serial + " does not exist for " + card.name + ". This card has " + run + " numbered " + (run === 1 ? "copy" : "copies") + ", from 1 to " + run + ".", card);
      return;
    }
    var label = String(serial).padStart(3, "0") + "/" + String(run).padStart(3, "0");
    if (run === 1) label = "1/1";
    try {
      var res = await fetch("/api/verify?card=" + encodeURIComponent(card.file) + "&serial=" + serial + (codeIn.value.trim() ? "&code=" + encodeURIComponent(codeIn.value.trim()) : ""));
      if (!res.ok) throw new Error("no");
      var r = await res.json();
      if (r.valid === false) { show("bad", "Not a valid serial", "Serial " + serial + " does not exist for " + card.name + ".", card); return; }
      if (r.codeOk === false) { show("bad", "Code does not match", card.name + " No. " + label + " exists, but the code you typed is not the one made for that copy. Check the code on the certificate and mount card.", card); return; }
      if (r.codeOk === true) {
        show("good", "Authentic copy", card.name + " No. " + label + " matches its own code" + (r.recorded ? " and is on the artist's list of sold cards." : ". It is not on the artist's sold list yet."), card);
        return;
      }
      if (r.recorded) {
        show("good", "Verified", card.name + " No. " + label + " is on the artist's list of sold cards.", card);
      } else {
        show("warn", "Valid number, not listed yet", card.name + " No. " + label + " is a real number in the print run, but it is not on the artist's sold list yet. If you bought it from the artist or at an event, ask for it to be added.", card);
      }
    } catch (err) {
      show("warn", "Valid number", card.name + " No. " + label + " is within the print run. The artist's sold list could not be reached right now, so this copy could not be matched against it.", card);
    }
  });
})();
