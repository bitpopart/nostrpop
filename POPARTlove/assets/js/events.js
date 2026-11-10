/* PopUp page: shows upcoming and past events from /api/events. */
(function () {
  var up = document.getElementById("events-upcoming");
  var past = document.getElementById("events-past");
  if (!up || !past) return;

  function pad(n) { return String(n).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function nice(date) {
    var p = date.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function card(ev, isPast) {
    var c = el("article", "event" + (isPast ? " past" : ""));
    if (ev.image) {
      var img = document.createElement("img");
      img.src = (ev._src || "/api/event-image?id=" + encodeURIComponent(ev.id) + "&v=" + (ev.imv || 0));
      img.alt = ""; img.loading = "lazy"; img.width = 800; img.height = 600;
      c.appendChild(img);
    }
    var b = el("div", "event-body");
    var tags = el("div", "tags");
    tags.appendChild(el("span", "tag " + (isPast ? "" : "stock ok"), isPast ? "Past event" : "Upcoming"));
    b.appendChild(tags);
    b.appendChild(el("h3", "", ev.title));
    b.appendChild(el("p", "event-when", nice(ev.date) + (ev.time ? " \u00b7 " + ev.time : "")));
    if (ev.location) {
      var p = el("p", "event-where");
      var a = el("a", "", ev.location);
      a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ev.location);
      a.target = "_blank"; a.rel = "noopener";
      p.appendChild(a); b.appendChild(p);
    }
    if (ev.description) b.appendChild(el("p", "event-desc", ev.description));
    if (ev.url) {
      var l = el("a", "btn" + (isPast ? " ghost" : ""), "More info");
      l.href = ev.url; l.target = "_blank"; l.rel = "noopener";
      b.appendChild(l);
    }
    c.appendChild(b);
    return c;
  }

  function fill(box, list, isPast, emptyText) {
    box.innerHTML = "";
    if (!list.length) { box.appendChild(el("p", "notice", emptyText)); return; }
    list.forEach(function (ev) { box.appendChild(card(ev, isPast)); });
  }

  function render(list) {
    var t = today();
    var isPast = function (e) { return e.past || e.date < t; };
    var upcoming = list.filter(function (e) { return !isPast(e); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var old = list.filter(isPast).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    fill(up, upcoming, false, "No events scheduled yet. Dates and places will be listed here.");
    fill(past, old, true, "No past events yet.");
  }
  window.PopartEvents = { render: render };

  fetch("/api/events").then(function (r) { if (!r.ok) throw new Error("no"); return r.json(); }).then(render).catch(function () { render(window.POPART_DEMO_EVENTS || []); });
})();
