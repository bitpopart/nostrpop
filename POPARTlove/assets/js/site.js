/* POPART.love — tiny site script: mobile menu, newsletter form.
   No dependencies. */

(function () {
  "use strict";

  // Set this to a form endpoint (Formspree, Cloudflare Worker, Buttondown, etc.)
  // that accepts a POST with an "email" field. Leave empty until it exists.
  var NEWSLETTER_ENDPOINT = "";

  var root = document.documentElement;

  // One look only: the site is always light.
  root.removeAttribute("data-theme");
  try { localStorage.removeItem("popart-theme"); } catch (e) { /* ignore */ }

  document.addEventListener("DOMContentLoaded", function () {
    var menuBtn = document.getElementById("menu-btn");
    var panel = document.getElementById("menu-panel");
    if (menuBtn && panel) {
      menuBtn.addEventListener("click", function () {
        var open = panel.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        menuBtn.textContent = open ? "✕" : "☰";
      });
    }

    var form = document.getElementById("newsletter-form");
    if (form) {
      var msg = document.getElementById("newsletter-msg");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = (form.elements["email"].value || "").trim();
        if (!email) return;

        if (!NEWSLETTER_ENDPOINT) {
          msg.textContent = "The newsletter opens soon. Please check back!";
          return;
        }

        msg.textContent = "Sending…";
        fetch(NEWSLETTER_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
          body: "email=" + encodeURIComponent(email)
        }).then(function (r) {
          if (!r.ok) throw new Error("bad status");
          form.reset();
          msg.textContent = "Thank you! You are on the list.";
        }).catch(function () {
          msg.textContent = "Something went wrong. Please try again later.";
        });
      });
    }
  });
})();


/* Flip example cards: click shows the back, click again shows the front */
document.addEventListener("click", function (e) {
  var b = e.target.closest && e.target.closest(".flip");
  if (!b) return;
  var on = b.classList.toggle("flipped");
  b.setAttribute("aria-pressed", on ? "true" : "false");
});

/* Live card stock: the page ships with the saved defaults, the stock API refreshes them */
(function () {
  var badges = document.querySelectorAll("[data-card] [data-stock]");
  if (!badges.length || !window.fetch) return;
  fetch("/api/stock").then(function (r) { return r.ok ? r.json() : null; }).then(function (stock) {
    if (!stock) return;
    badges.forEach(function (b) {
      var card = b.closest("[data-card]");
      var s = stock[card.getAttribute("data-card")];
      if (!s) return;
      var run = card.getAttribute("data-run");
      var label = "Available", cls = "ok";
      if (s.status === "sold-out") { label = "Sold out"; cls = "out"; }
      else if (s.status === "coming-soon") { label = "Coming soon"; cls = "soon"; }
      else if (s.left !== null && s.left !== undefined) { label = s.left + (run ? " of " + run : "") + " left"; }
      b.textContent = label;
      b.className = "tag stock " + cls;
      var pe = card.querySelector("[data-price]");
      if (pe) {
        var pr = s.price ? String(s.price) : "";
        if (pr && s.status !== "sold-out") {
          var n = Number(pr), t = n % 1 === 0 ? String(n) : n.toFixed(2);
          pe.innerHTML = "<strong>\u20ac" + t + " / $" + t + "</strong> <span>same price in euro and dollar</span>";
          pe.hidden = false;
        } else { pe.hidden = true; }
      }
      var row = card.querySelector(".where-row");
      if (row) {
        var online = row.querySelector('[data-where="online"]');
        var offline = row.querySelector('[data-where="offline"]');
        var out = s.status === "sold-out";
        if (online) {
          online.hidden = out || s.online === false;
          if (s.url) { online.setAttribute("href", s.url); online.setAttribute("target", "_blank"); online.setAttribute("rel", "noopener"); online.lastChild.textContent = " Buy online"; }
        }
        if (offline) offline.hidden = out || s.offline === false;
      }
    });
  }).catch(function () {});
})();


/* Owner shortcut: an Admin link appears only after the owner key has signed in on /admin/ in this browser */
(function () {
  var on = false;
  try { on = localStorage.getItem("popart-admin") === "1"; } catch (e) {}
  if (!on) return;
  document.querySelectorAll(".nav-links, .menu-panel ul").forEach(function (ul) {
    var li = document.createElement("li");
    li.innerHTML = '<a href="/admin/">Admin</a>';
    ul.appendChild(li);
  });
})();
