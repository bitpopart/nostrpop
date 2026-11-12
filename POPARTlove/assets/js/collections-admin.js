/* Collections editor for the admin page: make collections (name, text, thumbnail) and choose which cards are in them.
   PopartCollectionsAdmin.mount(container, { cards, thumbOf, load, save }) returns a controller used by the cards table. */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function field(label, control) { var w = el("label", "ev-field"); w.appendChild(el("span", "", label)); w.appendChild(control); return w; }
  function input(type, ph) { var i = document.createElement("input"); i.type = type; if (ph) i.placeholder = ph; return i; }
  function say(m, text, bad) { m.textContent = text; m.style.color = bad ? "var(--red)" : "var(--teal)"; }
  function shrink(file, max) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = Math.min(max || 600, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        var q = 0.82, out = "";
        do { out = c.toDataURL("image/webp", q).split(",")[1]; q -= 0.12; } while (out.length > 390000 && q > 0.3);
        out.length > 390000 ? reject(new Error("big")) : resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
  }
  function imgSrc(c) {
    if (c._img) return "data:image/webp;base64," + c._img;
    return c.image ? "/api/event-image?id=k-" + encodeURIComponent(c.id) + "&v=" + (c.imv || 0) : "";
  }

  function mount(root, api) {
    var list = [], editing = null, dirty = false, armed = null, pending = null, pendingH = null, listeners = [];
    root.innerHTML = "";
    var head = el("div", "section-head");
    var hd = el("div"); hd.appendChild(el("h2", "", "Collections")); hd.appendChild(el("p", "", "Group cards, stickers and prints into collections. Fans can open a collection on the Cards page. You can also tick collections on each card in the table above."));
    var saveBtn = el("button", "btn", "Save collections"); saveBtn.type = "button";
    head.appendChild(hd); head.appendChild(saveBtn); root.appendChild(head);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "status"); root.appendChild(msg);

    var form = el("form", "panel ev-form"); form.noValidate = true;
    var name = input("text", "Collection name"), text = input("text", "One short line (optional)");
    var file = input("file"); file.accept = "image/*";
    var preview = document.createElement("img"); preview.alt = ""; preview.hidden = true; preview.className = "ev-preview";
    var drop = el("button", "btn ghost", "Remove thumbnail"); drop.type = "button"; drop.hidden = true;
    var slugIn = input("text", "bangpop"), body = document.createElement("textarea"); body.rows = 6; body.placeholder = "Write about the collection. This shows on its own page.";
    var hfile = input("file"); hfile.accept = "image/*";
    var hprev = document.createElement("img"); hprev.alt = ""; hprev.hidden = true; hprev.className = "ev-preview";
    var hdrop = el("button", "btn ghost", "Remove header picture"); hdrop.type = "button"; hdrop.hidden = true;
    var h3 = el("h3", "", "Add a collection");
    var grid = el("div", "ev-grid"); grid.appendChild(field("Name", name)); grid.appendChild(field("Short line", text)); grid.appendChild(field("Page address (/collections/...)", slugIn));
    var picks = el("div", "coll-picks");
    var checks = {}, sChecks = {}, pChecks = {};
    api.cards().forEach(function (c) {
      var l = el("label", "coll-pick"); var cb = document.createElement("input"); cb.type = "checkbox"; cb.value = c.file; checks[c.file] = cb;
      var im = document.createElement("img"); im.src = api.thumbOf(c); im.alt = ""; im.width = 30; im.height = 42;
      l.appendChild(cb); l.appendChild(im); l.appendChild(el("span", "", c.name)); picks.appendChild(l);
    });
    function itemPicks(items, store) {
      var box = el("div", "coll-picks");
      items.forEach(function (it) {
        var l = el("label", "coll-pick"); var cb = document.createElement("input"); cb.type = "checkbox"; cb.value = it.id; store[it.id] = cb;
        if (it.image) { var im = document.createElement("img"); im.src = "/api/event-image?id=" + encodeURIComponent(it.id) + "&v=" + (it.imv || 0); im.alt = ""; im.width = 30; im.height = 42; l.appendChild(cb); l.appendChild(im); } else l.appendChild(cb);
        l.appendChild(el("span", "", it.title)); box.appendChild(l);
      });
      return box;
    }
    var sPicks = itemPicks(api.stickers(), sChecks), pPicks = itemPicks(api.prints(), pChecks);
    form.appendChild(h3); form.appendChild(grid); form.appendChild(field("Text about the collection (own page)", body));
    form.appendChild(field("Header picture for the collection page (wide, optional)", hfile)); form.appendChild(hprev); form.appendChild(hdrop);
    form.appendChild(field("Thumbnail (optional, the first card is used if empty)", file)); form.appendChild(preview); form.appendChild(drop);
    form.appendChild(el("p", "notice", "Cards in this collection:")); form.appendChild(picks);
    form.appendChild(el("p", "notice", "Stickers in this collection (saved stickers only):"));
    if (!api.stickers().length) form.appendChild(el("p", "form-msg", "No saved stickers yet.")); else form.appendChild(sPicks);
    form.appendChild(el("p", "notice", "Prints in this collection (saved prints only):"));
    if (!api.prints().length) form.appendChild(el("p", "form-msg", "No saved prints yet.")); else form.appendChild(pPicks);
    var actions = el("div", "ev-actions");
    var add = el("button", "btn", "Add collection"); add.type = "submit";
    var cancel = el("button", "btn ghost", "Cancel edit"); cancel.type = "button"; cancel.hidden = true;
    actions.appendChild(add); actions.appendChild(cancel); form.appendChild(actions); root.appendChild(form);
    var box = el("div", "ev-list"); root.appendChild(box);

    function changed() { listeners.forEach(function (f) { f(); }); }
    function mark() { dirty = true; say(msg, "You have unsaved changes. Press Save collections.", false); changed(); }
    function showPreview(src) { preview.hidden = !src; if (src) preview.src = src; drop.hidden = !src; }
    function showHPreview(src) { hprev.hidden = !src; if (src) hprev.src = src; hdrop.hidden = !src; }
    function reset() { editing = null; pending = null; pendingH = null; showHPreview(""); form.reset(); [checks, sChecks, pChecks].forEach(function (m) { Object.keys(m).forEach(function (k) { m[k].checked = false; }); }); preview.hidden = true; drop.hidden = true; cancel.hidden = true; add.textContent = "Add collection"; h3.textContent = "Add a collection"; }
    file.addEventListener("change", function () {
      if (!file.files[0]) return;
      shrink(file.files[0]).then(function (b) { pending = { b64: b }; showPreview("data:image/webp;base64," + b); }).catch(function () { file.value = ""; say(msg, "That file could not be used as a picture.", true); });
    });
    hfile.addEventListener("change", function () {
      if (!hfile.files[0]) return;
      shrink(hfile.files[0], 1400).then(function (b) { pendingH = { b64: b }; showHPreview("data:image/webp;base64," + b); }).catch(function () { hfile.value = ""; say(msg, "That file could not be used as a picture.", true); });
    });
    hdrop.addEventListener("click", function () { pendingH = { clear: true }; hfile.value = ""; showHPreview(""); });
    drop.addEventListener("click", function () { pending = { clear: true }; file.value = ""; showPreview(""); });
    cancel.addEventListener("click", reset);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!name.value.trim()) { say(msg, "Give the collection a name.", true); return; }
      var c = editing ? list.filter(function (x) { return x.id === editing; })[0] : { id: "k" + Date.now().toString(36), image: false, imv: 0 };
      c.name = name.value.trim(); c.text = text.value.trim(); c.body = body.value.trim();
      var sg = (slugIn.value.trim() || c.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || c.id;
      if (list.some(function (x) { return x.id !== c.id && (x.slug || x.id) === sg; })) { say(msg, "Another collection already uses the address " + sg + ".", true); return; }
      c.slug = sg;
      if (pendingH && pendingH.b64) { c._hdr = pendingH.b64; c.hdr = true; }
      else if (pendingH && pendingH.clear) { delete c._hdr; c.hdr = false; }
      c.cards = Object.keys(checks).filter(function (k) { return checks[k].checked; });
      c.stickers = Object.keys(sChecks).filter(function (k) { return sChecks[k].checked; });
      c.prints = Object.keys(pChecks).filter(function (k) { return pChecks[k].checked; });
      if (pending && pending.b64) { c._img = pending.b64; c.image = true; }
      else if (pending && pending.clear) { delete c._img; c.image = false; }
      if (!editing) list.push(c);
      reset(); mark(); draw(); doSave().catch(function () {});
    });

    function draw() {
      box.innerHTML = "";
      box.appendChild(el("h3", "", "Collections (" + list.length + ")"));
      if (!list.length) box.appendChild(el("p", "notice", "No collections yet."));
      list.forEach(function (c) {
        var row = el("div", "ev-row"), src = imgSrc(c) || (c.cards[0] ? api.thumbOf({ file: c.cards[0] }) : "");
        if (src) { var th = document.createElement("img"); th.src = src; th.alt = ""; th.className = "adm-thumb"; row.appendChild(th); }
        var info = el("div", "ev-info"); info.appendChild(el("strong", "", c.name)); var total = c.cards.length + (c.stickers || []).length + (c.prints || []).length;
        var pg = el("a", "", "/collections/" + (c.slug || c.id)); pg.href = "/collections/" + (c.slug || c.id); pg.target = "_blank"; pg.rel = "noopener"; pg.style.fontSize = ".85rem"; info.appendChild(pg);
        info.appendChild(el("span", "", c.cards.length + (c.cards.length === 1 ? " card" : " cards") + ", " + (c.stickers || []).length + " stickers, " + (c.prints || []).length + " prints"));
        row.appendChild(info);
        var btns = el("div", "ev-btns");
        var ed = el("button", "btn ghost", "Edit"); ed.type = "button";
        ed.addEventListener("click", function () {
          editing = c.id; pending = null; file.value = ""; name.value = c.name; text.value = c.text || ""; slugIn.value = c.slug || c.id; body.value = c.body || ""; pendingH = null; hfile.value = ""; showHPreview(c._hdr ? "data:image/webp;base64," + c._hdr : (c.hdr ? "/api/event-image?id=h-" + encodeURIComponent(c.id) + "&v=" + (c.himv || 0) : ""));
          Object.keys(checks).forEach(function (k) { checks[k].checked = c.cards.indexOf(k) > -1; });
          Object.keys(sChecks).forEach(function (k) { sChecks[k].checked = (c.stickers || []).indexOf(k) > -1; });
          Object.keys(pChecks).forEach(function (k) { pChecks[k].checked = (c.prints || []).indexOf(k) > -1; });
          showPreview(imgSrc(c)); cancel.hidden = false; add.textContent = "Update collection"; h3.textContent = "Edit " + c.name;
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        var del = el("button", "btn ghost", armed === c.id ? "Sure? Delete" : "Delete"); del.type = "button";
        del.addEventListener("click", function () {
          if (armed !== c.id) { armed = c.id; draw(); return; }
          armed = null; list = list.filter(function (x) { return x.id !== c.id; }); if (editing === c.id) reset(); mark(); draw(); doSave().catch(function () {});
        });
        btns.appendChild(ed); btns.appendChild(del); row.appendChild(btns); box.appendChild(row);
      });
    }

    function doSave() {
      say(msg, "Saving...", false);
      return api.save(list).then(function (saved) { list = saved; dirty = false; draw(); changed(); say(msg, "Saved " + list.length + (list.length === 1 ? " collection." : " collections.") + " The site shows them within a minute."); })
        .catch(function (e) { var hint = e && /HTTP 40[45]/.test(e.message) ? " This usually means the site's worker on Cloudflare has not been updated to the latest version yet." : ""; say(msg, "Could not save the collections (" + (e && e.message ? e.message : "unknown error") + ")." + hint + " Your changes are still here, press Save collections to try again.", true); throw e; });
    }
    saveBtn.addEventListener("click", function () { doSave().catch(function () {}); });
    window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    api.load().then(function (l) { list = l; draw(); changed(); }).catch(function () { list = []; draw(); say(msg, "Could not load the collections.", true); });

    return {
      list: function () { return list; },
      isDirty: function () { return dirty; },
      has: function (id, file) { var c = list.filter(function (x) { return x.id === id; })[0]; return !!c && c.cards.indexOf(file) > -1; },
      toggle: function (id, file, on) {
        var c = list.filter(function (x) { return x.id === id; })[0]; if (!c) return;
        var i = c.cards.indexOf(file);
        if (on && i < 0) c.cards.push(file); else if (!on && i > -1) c.cards.splice(i, 1);
        dirty = true; say(msg, "You have unsaved changes. Press Save collections.", false); draw();
      },
      onChange: function (f) { listeners.push(f); },
      save: doSave
    };
  }
  window.PopartCollectionsAdmin = { mount: mount };
})();
