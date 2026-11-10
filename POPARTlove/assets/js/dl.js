/* Shop page: digital files people print at home, and the download-code form for paid files. */
(function () {
  var form = document.getElementById("dl-form");
  if (!form) return;
  var input = document.getElementById("dl-code"), out = document.getElementById("dl-result");
  var grid = document.getElementById("digital-grid");
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function norm(t) { return t.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function msg(kind, text) { out.className = "form-msg"; out.style.color = kind === "bad" ? "var(--red)" : "var(--teal)"; out.textContent = text; }

  input.addEventListener("input", function () {
    var c = norm(input.value).slice(0, 12);
    input.value = c.replace(/(.{4})(?=.)/g, "$1-");
  });
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var code = norm(input.value);
    if (code.length !== 12) { msg("bad", "The download code has 12 letters and numbers, like ABCD-EFGH-JKLM."); return; }
    msg("ok", "Checking your code...");
    try {
      var res = await fetch("/api/download?code=" + encodeURIComponent(code));
      if (!res.ok) {
        var r = {}; try { r = await res.json(); } catch (x) {}
        msg("bad", r.error === "this code has been used up" ? "This code has been used up. Ask the artist for a new one." : res.status === 429 ? "Too many tries. Wait a minute and try again." : "Code not found. Check the letters and try again.");
        return;
      }
      var cd = res.headers.get("content-disposition") || "", m = /filename="([^"]+)"/.exec(cd);
      var blob = await res.blob(), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = m ? m[1] : "popart-download"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      msg("ok", "Your download has started. Thank you!");
    } catch (err) { msg("bad", "Could not reach the download service. Try again in a moment."); }
  });

  if (!grid) return;
  function card(it) {
    var a = el("article", "card"), f = el("figure");
    if (it.image) {
      var img = document.createElement("img");
      img.src = it._src || ("/api/event-image?id=" + encodeURIComponent(it.id) + "&v=" + (it.imv || 0));
      img.alt = it.title; img.width = 400; img.height = 400; img.loading = "lazy"; f.appendChild(img);
    } else { f.className = "file-fig"; f.appendChild(el("span", "file-kind", "PDF")); }
    a.appendChild(f);
    var b = el("div", "body"), tags = el("div", "tags");
    tags.appendChild(el("span", "tag " + (it.digital === "free" ? "stock ok" : ""), it.digital === "free" ? "Free" : "Paid"));
    if (it.price) tags.appendChild(el("span", "tag", it.price));
    b.appendChild(tags); b.appendChild(el("h3", "", it.title));
    if (it.description) b.appendChild(el("p", "", it.description));
    if (it.digital === "free") { var d = el("a", "btn yellow", "Download to print"); d.href = it._href || ("/api/file?id=" + encodeURIComponent(it.id)); d.setAttribute("download", it.fname || ""); b.appendChild(d); }
    else if (it.url) { var l = el("a", "btn", "Buy digital file"); l.href = it.url; l.target = "_blank"; l.rel = "noopener"; b.appendChild(l); }
    a.appendChild(b); return a;
  }
  function render(list) {
    list = list.filter(function (i) { return i.digital && i.file; });
    if (!list.length) return;
    grid.innerHTML = "";
    list.forEach(function (i) { grid.appendChild(card(i)); });
  }
  window.PopartDigital = { render: render };
  Promise.all(["stickers", "prints"].map(function (k) { return fetch("/api/catalog?kind=" + k).then(function (r) { return r.ok ? r.json() : []; }); }))
    .then(function (r) { render(r[0].concat(r[1])); }).catch(function () { if (window.POPART_DEMO_DIGITAL) render(window.POPART_DEMO_DIGITAL); });
})();
