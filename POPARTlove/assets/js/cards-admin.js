/* Cards editor for the admin page: add a card, edit any card, hide or delete a card.
   PopartCardsAdmin.mount(container, { base, load, save }). base = the built-in cards, load/save = the saved changes. */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function field(label, control) { var w = el("label", "ev-field"); w.appendChild(el("span", "", label)); w.appendChild(control); return w; }
  function input(type, ph) { var i = document.createElement("input"); i.type = type; if (ph) i.placeholder = ph; return i; }
  function select(opts) { var s = document.createElement("select"); opts.forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; s.appendChild(op); }); return s; }
  function say(m, text, bad) { m.textContent = text; m.style.color = bad ? "var(--red)" : "var(--teal)"; }
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32); }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = Math.min(600, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        var q = 0.85, out = "";
        do { out = c.toDataURL("image/webp", q).split(",")[1]; q -= 0.12; } while (out.length > 390000 && q > 0.3);
        out.length > 390000 ? reject(new Error("big")) : resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
  }
  function src(c, side) {
    if (side === "front" && !c.front && !c._front && c.thumb) return c.thumb;
    if (c["_" + side]) return "data:image/webp;base64," + c["_" + side];
    var v = "&v=" + (c.imv || 0);
    if (side === "front") return c.front ? "/api/event-image?id=c-" + c.file + v : "/assets/img/cards/" + c.file + ".webp";
    return c.back ? "/api/event-image?id=c-" + c.file + "-back" + v : (c.front ? "" : "/assets/img/cards/" + c.file + "-back.webp");
  }

  function mount(root, api) {
    var base = api.base, extra = [], editing = null, dirty = false, armed = null, pf = null, pb = null;
    var baseFiles = {}; base.forEach(function (c) { baseFiles[c.file] = c; });
    root.innerHTML = "";
    var head = el("div", "section-head");
    var hd = el("div"); hd.appendChild(el("h2", "", "Edit cards")); hd.appendChild(el("p", "", "Add a new card or change a card's name, text and pictures. Stock, price and shop links are set in the table above."));
    var saveBtn = el("button", "btn", "Save cards"); saveBtn.type = "button";
    head.appendChild(hd); head.appendChild(saveBtn); root.appendChild(head);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "status"); root.appendChild(msg);

    var form = el("form", "panel ev-form"); form.noValidate = true;
    var name = input("text", "Card name"), fileId = input("text", "web name, e.g. happy-flower");
    var theme = select([["love", "Love"], ["freedom", "Freedom"], ["joy", "Joy"]]);
    var series = select([["Masterpiece", "Masterpiece"], ["Signed", "Signed"], ["Legend", "Legend"]]);
    var rarity = select(["Common", "Uncommon", "Rare", "Super Rare", "Ultra Rare", "Unique 1/1"].map(function (x) { return [x, x]; }));
    var run = input("text", "Run of 100, Open run, 1 of 1");
    var blurb = document.createElement("textarea"); blurb.rows = 2; blurb.placeholder = "One short line about the card";
    var ff = input("file"); ff.accept = "image/*"; var fb = input("file"); fb.accept = "image/*";
    var pvF = document.createElement("img"), pvB = document.createElement("img");
    [pvF, pvB].forEach(function (i) { i.alt = ""; i.hidden = true; i.className = "adm-prev"; });
    var grid = el("div", "ev-grid");
    [["Name", name], ["Web name (letters, numbers, dashes)", fileId], ["Theme", theme], ["Series", series], ["Rarity", rarity], ["Run", run]].forEach(function (p) { grid.appendChild(field(p[0], p[1])); });
    var h3 = el("h3", "", "Add a card");
    var note = el("p", "notice"); note.textContent = "The web name must match the card file name from the Card Maker, because the verify codes use it. You cannot change it later.";
    form.appendChild(h3); form.appendChild(grid); form.appendChild(note); form.appendChild(field("Description", blurb));
    form.appendChild(field("Front picture", ff)); form.appendChild(pvF); form.appendChild(field("Back picture (optional)", fb)); form.appendChild(pvB);
    var actions = el("div", "ev-actions");
    var add = el("button", "btn", "Add card"); add.type = "submit";
    var cancel = el("button", "btn ghost", "Cancel edit"); cancel.type = "button"; cancel.hidden = true;
    actions.appendChild(add); actions.appendChild(cancel); form.appendChild(actions); root.appendChild(form);
    var box = el("div", "ev-list"); root.appendChild(box);

    function mark() { dirty = true; say(msg, "You have unsaved changes. Press Save cards.", false); }
    function reset() { editing = null; pf = pb = null; form.reset(); fileId.disabled = false; pvF.hidden = pvB.hidden = true; cancel.hidden = true; add.textContent = "Add card"; h3.textContent = "Add a card"; }
    function pick(inp, pv, which) {
      inp.addEventListener("change", function () {
        if (!inp.files[0]) return;
        shrink(inp.files[0]).then(function (b) { if (which === "f") pf = b; else pb = b; pv.src = "data:image/webp;base64," + b; pv.hidden = false; })
          .catch(function () { inp.value = ""; say(msg, "That picture could not be used. Try a smaller picture file.", true); });
      });
    }
    pick(ff, pvF, "f"); pick(fb, pvB, "b");
    cancel.addEventListener("click", reset);

    function merged() {
      var map = {}; extra.forEach(function (e) { map[e.file] = e; });
      var out = extra.filter(function (e) { return !baseFiles[e.file]; });
      base.forEach(function (c) { out.push(Object.assign({}, c, map[c.file] || {})); });
      return out;
    }
    function ensure(c) {
      var e = extra.filter(function (x) { return x.file === c.file; })[0];
      if (!e) { e = { file: c.file, name: c.name, theme: c.theme, series: c.series, rarity: c.rarity, run: c.run, blurb: c.blurb || "", front: false, back: false, imv: 0, removed: false }; extra.unshift(e); }
      return e;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!name.value.trim() || !run.value.trim()) { say(msg, "Fill in the name and the run.", true); return; }
      var id = editing || (fileId.value.trim() ? slug(fileId.value) : slug(name.value));
      if (!id) { say(msg, "Give the card a web name.", true); return; }
      if (!editing && merged().some(function (c) { return c.file === id; })) { say(msg, "A card with the web name " + id + " already exists.", true); return; }
      if (!editing && !pf) { say(msg, "Choose the front picture.", true); return; }
      var cur = editing ? merged().filter(function (c) { return c.file === id; })[0] : { file: id, front: false, back: false, imv: 0 };
      var ent = ensure(cur);
      ent.name = name.value.trim(); ent.theme = theme.value; ent.series = series.value; ent.rarity = rarity.value; ent.run = run.value.trim(); ent.blurb = blurb.value.trim(); ent.removed = false;
      if (pf) { ent._front = pf; ent.front = true; }
      if (pb) { ent._back = pb; ent.back = true; }
      reset(); mark(); draw();
    });

    function draw() {
      box.innerHTML = "";
      var list = merged();
      box.appendChild(el("h3", "", "Cards (" + list.filter(function (c) { return !c.removed; }).length + ")"));
      list.forEach(function (c) {
        var row = el("div", "ev-row"); if (c.removed) row.style.opacity = ".55";
        var th = document.createElement("img"); th.src = src(c, "front"); th.alt = ""; th.className = "adm-thumb"; row.appendChild(th);
        var info = el("div", "ev-info"); info.appendChild(el("strong", "", c.name));
        info.appendChild(el("span", "", c.rarity + " \u00b7 " + c.run + " \u00b7 " + c.series + (baseFiles[c.file] ? "" : " \u00b7 new") + (c.removed ? " \u00b7 hidden" : "")));
        row.appendChild(info);
        var btns = el("div", "ev-btns");
        if (c.removed) {
          var rs = el("button", "btn ghost", "Show again"); rs.type = "button";
          rs.addEventListener("click", function () { ensure(c).removed = false; mark(); draw(); });
          btns.appendChild(rs);
        } else {
          var ed = el("button", "btn ghost", "Edit"); ed.type = "button";
          ed.addEventListener("click", function () {
            editing = c.file; pf = pb = null; ff.value = fb.value = "";
            name.value = c.name; fileId.value = c.file; fileId.disabled = true; theme.value = c.theme; series.value = c.series; rarity.value = c.rarity; run.value = c.run; blurb.value = c.blurb || "";
            pvF.src = src(c, "front"); pvF.hidden = !pvF.src; var bs = src(c, "back"); pvB.src = bs; pvB.hidden = !bs;
            cancel.hidden = false; add.textContent = "Update card"; h3.textContent = "Edit " + c.name;
            form.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          var del = el("button", "btn ghost", armed === c.file ? "Sure? " + (baseFiles[c.file] ? "Hide" : "Delete") : (baseFiles[c.file] ? "Hide" : "Delete")); del.type = "button";
          del.addEventListener("click", function () {
            if (armed !== c.file) { armed = c.file; draw(); return; }
            armed = null;
            if (baseFiles[c.file]) ensure(c).removed = true; else extra = extra.filter(function (x) { return x.file !== c.file; });
            if (editing === c.file) reset(); mark(); draw();
          });
          btns.appendChild(ed); btns.appendChild(del);
        }
        row.appendChild(btns); box.appendChild(row);
      });
    }

    saveBtn.addEventListener("click", function () {
      say(msg, "Saving...", false);
      api.save(extra).then(function (saved) { extra = saved; dirty = false; draw(); say(msg, "Saved. The Cards page shows the changes within a minute."); if (api.saved) api.saved(); })
        .catch(function () { say(msg, "Could not save. Try signing again.", true); });
    });
    window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    api.load().then(function (l) { extra = l; draw(); }).catch(function () { extra = []; draw(); say(msg, "Could not load the saved changes.", true); });
  }
  window.PopartCardsAdmin = { mount: mount };
})();
