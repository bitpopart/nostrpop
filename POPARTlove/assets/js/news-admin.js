/* News editor for the admin page: add, edit and delete news items (title, date, text, thumbnail).
   PopartNewsAdmin.mount(container, { load, save }). */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function field(label, control) { var w = el("label", "ev-field"); w.appendChild(el("span", "", label)); w.appendChild(control); return w; }
  function input(type, ph) { var i = document.createElement("input"); i.type = type; if (ph) i.placeholder = ph; return i; }
  function say(m, text, bad) { m.textContent = text; m.style.color = bad ? "var(--red)" : "var(--teal)"; }
  function pad(n) { return String(n).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function nice(date) { var p = date.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = Math.min(800, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
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
  function imgSrc(n) {
    if (n._img) return "data:image/webp;base64," + n._img;
    return n.image ? "/api/event-image?id=n-" + encodeURIComponent(n.id) + "&v=" + (n.imv || 0) : "";
  }

  function mount(root, api) {
    var list = [], editing = null, dirty = false, armed = null, pending = null;
    root.innerHTML = "";
    var head = el("div", "section-head");
    var hd = el("div"); hd.appendChild(el("h2", "", "News")); hd.appendChild(el("p", "", "Write news for the News page and the home page. The newest item shows first."));
    var saveBtn = el("button", "btn", "Save news"); saveBtn.type = "button";
    head.appendChild(hd); head.appendChild(saveBtn); root.appendChild(head);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "status"); root.appendChild(msg);

    var form = el("form", "panel ev-form"); form.noValidate = true;
    var title = input("text", "Headline"), date = input("date"); date.value = today();
    var text = document.createElement("textarea"); text.rows = 6; text.placeholder = "Write the news here";
    var file = input("file"); file.accept = "image/*";
    var preview = document.createElement("img"); preview.alt = ""; preview.hidden = true; preview.className = "ev-preview";
    var drop = el("button", "btn ghost", "Remove thumbnail"); drop.type = "button"; drop.hidden = true;
    var grid = el("div", "ev-grid");
    [["Title", title], ["Date", date]].forEach(function (p) { grid.appendChild(field(p[0], p[1])); });
    var h3 = el("h3", "", "Add a news item");
    form.appendChild(h3); form.appendChild(grid); form.appendChild(field("Text", text)); form.appendChild(field("Thumbnail photo", file)); form.appendChild(preview); form.appendChild(drop);
    var actions = el("div", "ev-actions");
    var add = el("button", "btn", "Add news"); add.type = "submit";
    var cancel = el("button", "btn ghost", "Cancel edit"); cancel.type = "button"; cancel.hidden = true;
    actions.appendChild(add); actions.appendChild(cancel); form.appendChild(actions); root.appendChild(form);
    var box = el("div", "ev-list"); root.appendChild(box);

    function mark() { dirty = true; say(msg, "You have unsaved changes. Press Save news.", false); }
    function showPreview(src) { preview.hidden = !src; if (src) preview.src = src; drop.hidden = !src; }
    function reset() { editing = null; pending = null; form.reset(); date.value = today(); preview.hidden = true; drop.hidden = true; cancel.hidden = true; add.textContent = "Add news"; h3.textContent = "Add a news item"; }
    file.addEventListener("change", function () {
      if (!file.files[0]) return;
      shrink(file.files[0]).then(function (b64) { pending = { b64: b64 }; showPreview("data:image/webp;base64," + b64); }).catch(function () { file.value = ""; say(msg, "That file could not be used as a picture.", true); });
    });
    drop.addEventListener("click", function () { pending = { clear: true }; file.value = ""; showPreview(""); });
    cancel.addEventListener("click", reset);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!title.value.trim() || !date.value || !text.value.trim()) { say(msg, "Fill in the title, date and text.", true); return; }
      var n = editing ? list.filter(function (x) { return x.id === editing; })[0] : { id: "n" + Date.now().toString(36), image: false, imv: 0 };
      n.title = title.value.trim(); n.date = date.value; n.text = text.value.trim();
      if (pending && pending.b64) { n._img = pending.b64; n.image = true; }
      else if (pending && pending.clear) { delete n._img; n.image = false; }
      if (!editing) list.unshift(n);
      reset(); mark(); draw();
    });

    function draw() {
      box.innerHTML = "";
      list.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      box.appendChild(el("h3", "", "News items (" + list.length + ")"));
      if (!list.length) box.appendChild(el("p", "notice", "No news added yet. The starter news shows on the site until you save your first item."));
      list.forEach(function (n) {
        var row = el("div", "ev-row"), src = imgSrc(n);
        if (src) { var th = document.createElement("img"); th.src = src; th.alt = ""; th.className = "ev-thumb"; row.appendChild(th); }
        var info = el("div", "ev-info"); info.appendChild(el("strong", "", n.title)); info.appendChild(el("span", "", nice(n.date)));
        row.appendChild(info);
        var btns = el("div", "ev-btns");
        var ed = el("button", "btn ghost", "Edit"); ed.type = "button";
        ed.addEventListener("click", function () {
          editing = n.id; pending = null; file.value = ""; title.value = n.title; date.value = n.date; text.value = n.text;
          showPreview(imgSrc(n)); cancel.hidden = false; add.textContent = "Update news"; h3.textContent = "Edit news item";
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        var del = el("button", "btn ghost", armed === n.id ? "Sure? Delete" : "Delete"); del.type = "button";
        del.addEventListener("click", function () {
          if (armed !== n.id) { armed = n.id; draw(); return; }
          armed = null; list = list.filter(function (x) { return x.id !== n.id; }); if (editing === n.id) reset(); mark(); draw();
        });
        btns.appendChild(ed); btns.appendChild(del); row.appendChild(btns); box.appendChild(row);
      });
    }

    saveBtn.addEventListener("click", function () {
      say(msg, "Saving...", false);
      api.save(list).then(function (saved) { list = saved; dirty = false; draw(); say(msg, "Saved. The News page and the home page show the changes within a minute."); })
        .catch(function () { say(msg, "Could not save. Try signing again.", true); });
    });
    window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    api.load().then(function (l) { list = l; draw(); }).catch(function () { list = []; draw(); say(msg, "Could not load the news.", true); });
  }
  window.PopartNewsAdmin = { mount: mount };
})();
