/* POPART.love — tiny site script: theme toggle, mobile menu, newsletter form.
   No dependencies. */

(function () {
  "use strict";

  // Set this to a form endpoint (Formspree, Cloudflare Worker, Buttondown, etc.)
  // that accepts a POST with an "email" field. Leave empty until it exists.
  var NEWSLETTER_ENDPOINT = "";

  var root = document.documentElement;

  function readTheme() {
    try { return localStorage.getItem("popart-theme"); } catch (e) { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem("popart-theme", t); } catch (e) { /* ignore */ }
  }

  function applyTheme(t) {
    if (t === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    var btn = document.getElementById("theme-btn");
    if (btn) {
      btn.textContent = t === "dark" ? "☀" : "☾";
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  var initial = readTheme() ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initial);

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    var themeBtn = document.getElementById("theme-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        saveTheme(next);
      });
    }

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
