/* PopUp events editor for the admin page.
   PopartEventsAdmin.mount(container, { load: () => Promise<list>, save: (list) => Promise<list> }).
   The real admin passes functions that sign every save with the Nostr extension. */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function field(label, control) { var w = el("label", "ev-field"); w.appendChild(el("span", "", label)); w.appendChild(control); return w; }
  function input(type, ph) { var i = document.createElement("input"); i.type = type; if (ph) i.placeholder = ph; return i; }
  function say(m, text, bad) { m.textContent = text; m.style.color = bad ? "var(--red)" : "var(--teal)"; }
  function nice(d) { var p = d.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  // resize a picked image to a small WebP and return its base64 text
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
  function imgSrc(ev) {
    if (ev._img) return "data:image/webp;base64," + ev._img;
    return ev.image ? "/api/event-image?id=" + encodeURIComponent(ev.id) + "&v=" + (ev.imv || 0) : "";
  }

  function mount(root, api) {
    var list = [], editing = null, dirty = false, armed = null;
    root.innerHTML = "";
    var head = el("div", "section-head");
    var hd = el("div"); hd.appendChild(el("h2", "", "PopUp events")); hd.appendChild(el("p", "", "Add events and places. Past events stay under Past events on the PopUp page."));
    var saveBtn = el("button", "btn", "Save events"); saveBtn.type = "button";
    head.appendChild(hd); head.appendChild(saveBtn); root.appendChild(head);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "status"); root.appendChild(msg);

    var form = el("form", "panel ev-form"); form.noValidate = true;
    var title = input("text", "Event name"), date = input("date"), time = input("text", "10:00 to 17:00"), loc = input("text", "Place, city"), link = input("url", "https:// (optional)");
    var desc = document.createElement("textarea"); desc.rows = 3; desc.placeholder = "A line or two about the event (optional)";
    var file = input("file"); file.accept = "image/*";
    var preview = document.createElement("img"); preview.alt = ""; preview.hidden = true; preview.className = "ev-preview";
    var drop = el("button", "btn ghost", "Remove thumbnail"); drop.type = "button"; drop.hidden = true;
    var grid = el("div", "ev-grid");
    [["Event", title], ["Date", date], ["Time", time], ["Location", loc], ["Link", link]].forEach(function (p) { grid.appendChild(field(p[0], p[1])); });
    form.appendChild(el("h3", "", "Add an event"));
    form.appendChild(grid); form.appendChild(field("Description", desc)); form.appendChild(field("Thumbnail", file)); form.appendChild(preview); form.appendChild(drop);
    var actions = el("div", "ev-actions");
    var add = el("button", "btn", "Add event"); add.type = "submit";
    var cancel = el("button", "btn ghost", "Cancel edit"); cancel.type = "button"; cancel.hidden = true;
    actions.appendChild(add); actions.appendChild(cancel); form.appendChild(actions);
    root.appendChild(form);

    var box = el("div", "ev-list"); root.appendChild(box);

    function mark(d) { dirty = d; if (d) say(msg, "You have unsaved changes. Press Save events.", false); }
    var pending = null; // { b64 } | { clear: true } | null
    function resetForm() {
      editing = null; pending = null; form.reset(); preview.hidden = true; drop.hidden = true; cancel.hidden = true;
      add.textContent = "Add event"; form.querySelector("h3").textContent = "Add an event";
    }
    function showPreview(src) { preview.hidden = !src; if (src) preview.src = src; drop.hidden = !src; }

    file.addEventListener("change", function () {
      if (!file.files[0]) return;
      shrink(file.files[0]).then(function (b64) { pending = { b64: b64 }; showPreview("data:image/webp;base64," + b64); }).catch(function () { say(msg, "That file is not a picture.", true); });
    });
    drop.addEventListener("click", function () { pending = { clear: true }; file.value = ""; showPreview(""); });
    cancel.addEventListener("click", resetForm);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!title.value.trim() || !date.value || !loc.value.trim()) { say(msg, "Fill in the event name, date and location.", true); return; }
      if (link.value.trim() && !/^https:\/\//i.test(link.value.trim())) { say(msg, "The link must start with https://", true); return; }
      var ev = editing ? list.filter(function (x) { return x.id === editing; })[0] : { id: "e" + Date.now().toString(36), past: false, image: false, imv: 0 };
      ev.title = title.value.trim(); ev.date = date.value; ev.time = time.value.trim(); ev.location = loc.value.trim();
      ev.url = link.value.trim(); ev.description = desc.value.trim();
      if (pending && pending.b64) { ev._img = pending.b64; ev.image = true; }
      else if (pending && pending.clear) { delete ev._img; ev.image = false; }
      if (!editing) list.push(ev);
      resetForm(); mark(true); draw();
    });

    function draw() {
      box.innerHTML = "";
      var t = today();
      var isPast = function (e) { return e.past || e.date < t; };
      [["Upcoming events", false], ["Past events", true]].forEach(function (grp) {
        var items = list.filter(function (e) { return isPast(e) === grp[1]; }).sort(function (a, b) { return grp[1] ? (a.date < b.date ? 1 : -1) : (a.date < b.date ? -1 : 1); });
        box.appendChild(el("h3", "", grp[0] + " (" + items.length + ")"));
        if (!items.length) box.appendChild(el("p", "notice", grp[1] ? "Nothing in the past yet." : "No upcoming events."));
        items.forEach(function (ev) {
          var row = el("div", "ev-row");
          var src = imgSrc(ev);
          if (src) { var th = document.createElement("img"); th.src = src; th.alt = ""; th.className = "ev-thumb"; row.appendChild(th); }
          var info = el("div", "ev-info");
          info.appendChild(el("strong", "", ev.title));
          info.appendChild(el("span", "", nice(ev.date) + (ev.time ? " \u00b7 " + ev.time : "") + " \u00b7 " + ev.location));
          row.appendChild(info);
          var btns = el("div", "ev-btns");
          var b1 = el("button", "btn ghost", "Edit"); b1.type = "button";
          b1.addEventListener("click", function () {
            editing = ev.id; pending = null; file.value = "";
            title.value = ev.title; date.value = ev.date; time.value = ev.time || ""; loc.value = ev.location; link.value = ev.url || ""; desc.value = ev.description || "";
            showPreview(imgSrc(ev)); cancel.hidden = false; add.textContent = "Update event"; form.querySelector("h3").textContent = "Edit event";
            form.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          var b2 = el("button", "btn ghost", ev.past || ev.date < t ? (ev.past ? "Back to upcoming" : "Mark as past") : "Move to past events"); b2.type = "button";
          if (!ev.past && ev.date < t) b2.hidden = true;
          b2.addEventListener("click", function () { ev.past = !ev.past; mark(true); draw(); });
          var b3 = el("button", "btn ghost", armed === ev.id ? "Sure? Delete" : "Delete"); b3.type = "button";
          b3.addEventListener("click", function () {
            if (armed !== ev.id) { armed = ev.id; draw(); return; }
            armed = null; list = list.filter(function (x) { return x.id !== ev.id; }); if (editing === ev.id) resetForm(); mark(true); draw();
          });
          btns.appendChild(b1); btns.appendChild(b2); btns.appendChild(b3); row.appendChild(btns); box.appendChild(row);
        });
      });
    }

    saveBtn.addEventListener("click", function () {
      say(msg, "Saving...", false);
      api.save(list).then(function (saved) {
        list = saved; dirty = false; draw(); say(msg, "Saved. The PopUp page shows the changes within a minute.");
      }).catch(function () { say(msg, "Could not save. Check the dates and links, or try signing again.", true); });
    });
    window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

    api.load().then(function (l) { list = l; draw(); }).catch(function () { list = []; draw(); say(msg, "Could not load the events.", true); });
  }
  window.PopartEventsAdmin = { mount: mount };
})();
