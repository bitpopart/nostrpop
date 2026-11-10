/* Stickers / Prints editor for the admin page.
   PopartCatalogAdmin.mount(container, kind, { load, save }) with the same idea as the events editor. */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function field(label, control) { var w = el("label", "ev-field"); w.appendChild(el("span", "", label)); w.appendChild(control); return w; }
  function input(type, ph) { var i = document.createElement("input"); i.type = type; if (ph) i.placeholder = ph; return i; }
  function say(m, text, bad) { m.textContent = text; m.style.color = bad ? "var(--red)" : "var(--teal)"; }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = Math.min(800, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/webp", 0.82).split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
  }
  function imgSrc(it) {
    if (it._img) return "data:image/webp;base64," + it._img;
    return it.image ? "/api/event-image?id=" + encodeURIComponent(it.id) + "&v=" + (it.imv || 0) : "";
  }

  function mount(root, kind, api) {
    var free = kind === "free";
    var one = free ? "download" : kind === "stickers" ? "sticker" : "print", label = free ? "Free downloads" : kind === "stickers" ? "Stickers" : "Prints";
    var noun = free ? "downloads" : kind;
    var list = [], editing = null, dirty = false, armed = null, pending = null;
    root.innerHTML = "";
    var head = el("div", "section-head");
    var hd = el("div"); hd.appendChild(el("h2", "", label)); hd.appendChild(el("p", "", free ? "Upload free files for the Free downloads page: PDFs, pictures, zip files, music, anything up to 20 MB." : "Add " + kind + ". Press Available or Coming soon on an item to switch it."));
    var saveBtn = el("button", "btn", "Save " + noun); saveBtn.type = "button";
    head.appendChild(hd); head.appendChild(saveBtn); root.appendChild(head);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "status"); root.appendChild(msg);

    var form = el("form", "panel ev-form"); form.noValidate = true;
    var title = input("text", "Name"), price = input("text", "Price, e.g. 4.50 EUR (optional)"), link = input("url", "Shop link https:// (optional)");
    var desc = document.createElement("textarea"); desc.rows = 3; desc.placeholder = "A line or two (optional)";
    var status = document.createElement("select");
    [["coming-soon", "Coming soon"], ["available", "Available"]].forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; status.appendChild(op); });
    var file = input("file"); file.accept = "image/*";
    var preview = document.createElement("img"); preview.alt = ""; preview.hidden = true; preview.className = "ev-preview";
    var drop = el("button", "btn ghost", "Remove picture"); drop.type = "button"; drop.hidden = true;
    var cat = input("text", "Wallpapers, Coloring, Cards, Music..."); cat.setAttribute("list", "cat-list");
    var catList = document.createElement("datalist"); catList.id = "cat-list";
    ["Wallpapers", "Coloring pages", "Printables", "Cards", "Stickers", "Music", "Other"].forEach(function (n) { var o = document.createElement("option"); o.value = n; catList.appendChild(o); });
    var dl = input("file"); var dlInfo = el("p", "form-msg");
    var grid = el("div", "ev-grid");
    (free ? [["Name", title], ["Category", cat]] : [["Name", title], ["Status", status], ["Price", price], ["Link", link]]).forEach(function (p) { grid.appendChild(field(p[0], p[1])); });
    var h3 = el("h3", "", "Add a " + one);
    form.appendChild(h3); form.appendChild(grid); form.appendChild(field("Description", desc)); if (free) { form.appendChild(catList); form.appendChild(field("File to download", dl)); form.appendChild(dlInfo); }
    form.appendChild(field(free ? "Thumbnail picture" : "Picture", file)); form.appendChild(preview); form.appendChild(drop);
    var actions = el("div", "ev-actions");
    var add = el("button", "btn", "Add " + one); add.type = "submit";
    var cancel = el("button", "btn ghost", "Cancel edit"); cancel.type = "button"; cancel.hidden = true;
    actions.appendChild(add); actions.appendChild(cancel); form.appendChild(actions); root.appendChild(form);
    var box = el("div", "ev-list"); root.appendChild(box);

    function mark() { dirty = true; say(msg, "You have unsaved changes. Press Save " + noun + ".", false); }
    function resetForm() { editing = null; pending = null; pendingFile = null; dlInfo.textContent = ""; form.reset(); preview.hidden = true; drop.hidden = true; cancel.hidden = true; add.textContent = "Add " + one; h3.textContent = "Add a " + one; }
    function showPreview(src) { preview.hidden = !src; if (src) preview.src = src; drop.hidden = !src; }
    file.addEventListener("change", function () {
      if (!file.files[0]) return;
      shrink(file.files[0]).then(function (b64) { pending = { b64: b64 }; showPreview("data:image/webp;base64," + b64); }).catch(function () { say(msg, "That file is not a picture.", true); });
    });
    drop.addEventListener("click", function () { pending = { clear: true }; file.value = ""; showPreview(""); });
    var pendingFile = null;
    function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
    dl.addEventListener("change", function () {
      var f = dl.files[0]; if (!f) return;
      if (f.size > 20 * 1024 * 1024) { dl.value = ""; pendingFile = null; say(dlInfo, "That file is bigger than 20 MB.", true); return; }
      pendingFile = f; say(dlInfo, f.name + " (" + size(f.size) + ")", false);
    });
    cancel.addEventListener("click", resetForm);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!title.value.trim()) { say(msg, "Fill in the name.", true); return; }
      if (free && !pendingFile && !(editing && list.filter(function (x) { return x.id === editing; })[0].file)) { say(msg, "Choose the file people can download.", true); return; }
      if (link.value.trim() && !/^https:\/\//i.test(link.value.trim())) { say(msg, "The link must start with https://", true); return; }
      var it = editing ? list.filter(function (x) { return x.id === editing; })[0] : { id: kind.slice(0, 1) + Date.now().toString(36), image: false, imv: 0 };
      it.title = title.value.trim(); it.description = desc.value.trim();
      if (free) { it.status = "available"; it.price = ""; it.url = ""; it.category = cat.value.trim(); if (pendingFile) { it._file = pendingFile; it.file = true; it.fname = pendingFile.name; it.size = pendingFile.size; it.ftype = pendingFile.type || ""; } }
      else { it.status = status.value; it.price = price.value.trim(); it.url = link.value.trim(); }
      if (pending && pending.b64) { it._img = pending.b64; it.image = true; }
      else if (pending && pending.clear) { delete it._img; it.image = false; }
      if (!editing) list.unshift(it);
      resetForm(); mark(); draw();
    });

    function draw() {
      box.innerHTML = "";
      box.appendChild(el("h3", "", label + " (" + list.length + ")"));
      if (!list.length) box.appendChild(el("p", "notice", free ? "Nothing here yet. Add your first free download." : "Nothing here yet. The draft designs show on the page until you add and save your first " + one + "."));
      list.forEach(function (it) {
        var row = el("div", "ev-row"), src = imgSrc(it);
        if (src) { var th = document.createElement("img"); th.src = src; th.alt = ""; th.className = "ev-thumb"; row.appendChild(th); }
        var info = el("div", "ev-info");
        info.appendChild(el("strong", "", it.title));
        info.appendChild(el("span", "", free ? (it.category || "No category") + " \u00b7 " + (it.fname || "") + (it.size ? " (" + size(it.size) + ")" : "") : (it.price ? it.price + " \u00b7 " : "") + (it.url ? "has shop link" : "no shop link")));
        row.appendChild(info);
        var btns = el("div", "ev-btns");
        var st = el("button", "btn " + (it.status === "available" ? "" : "ghost"), it.status === "available" ? "Available" : "Coming soon"); st.type = "button";
        st.setAttribute("aria-label", "Switch status, now " + st.textContent);
        st.addEventListener("click", function () { it.status = it.status === "available" ? "coming-soon" : "available"; mark(); draw(); });
        var ed = el("button", "btn ghost", "Edit"); ed.type = "button";
        ed.addEventListener("click", function () {
          editing = it.id; pending = null; file.value = "";
          title.value = it.title; status.value = it.status; price.value = it.price || ""; link.value = it.url || ""; desc.value = it.description || ""; cat.value = it.category || ""; dl.value = ""; dlInfo.textContent = free && it.fname ? "Current file: " + it.fname + ". Choose a file only to replace it." : "";
          showPreview(imgSrc(it)); cancel.hidden = false; add.textContent = "Update " + one; h3.textContent = "Edit " + one;
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        var del = el("button", "btn ghost", armed === it.id ? "Sure? Delete" : "Delete"); del.type = "button";
        del.addEventListener("click", function () {
          if (armed !== it.id) { armed = it.id; draw(); return; }
          armed = null; list = list.filter(function (x) { return x.id !== it.id; }); if (editing === it.id) resetForm(); mark(); draw();
        });
        if (!free) btns.appendChild(st); btns.appendChild(ed); btns.appendChild(del); row.appendChild(btns); box.appendChild(row);
      });
    }

    saveBtn.addEventListener("click", function () {
      say(msg, "Saving...", false);
      api.save(list).then(function (saved) { list = saved; dirty = false; draw(); say(msg, "Saved. The page shows the changes within a minute."); })
        .catch(function () { say(msg, "Could not save. Check the link, or try signing again.", true); });
    });
    window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
    api.load().then(function (l) { list = l; draw(); }).catch(function () { list = []; draw(); say(msg, "Could not load the list.", true); });
  }
  window.PopartCatalogAdmin = { mount: mount };
})();
