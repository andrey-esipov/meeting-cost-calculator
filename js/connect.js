/* Burn Rate — Connect modal
 * Self-contained: injects its own DOM + styles, self-wires to #connBtn.
 * Public API: window.BR_CONNECT = { open(), close() }
 *
 * Depends on globals loaded earlier:
 *   window.BR_CONFIG = { msal, workIq, liveAvailable, workIqAvailable }
 *   window.BR_SOURCE = { isLive(), canSignIn(), account(), signIn(), signOut() }
 */
(function () {
  "use strict";

  var LS = { client: "br_clientId", tenant: "br_tenantId", proxy: "br_proxyUrl" };

  // --- small helpers -------------------------------------------------------
  function cfg() { return window.BR_CONFIG || {}; }
  function src() { return window.BR_SOURCE || {}; }
  function isLive() { return !!(src().isLive && src().isLive()); }
  function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function lsSet(k, v) {
    try {
      if (v == null || v === "") localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // --- styles --------------------------------------------------------------
  var STYLE = '\
.brc-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;\
justify-content:center;padding:24px;background:rgba(0,0,0,.55);\
backdrop-filter:blur(6px) saturate(120%);-webkit-backdrop-filter:blur(6px) saturate(120%);\
opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease;}\
.brc-overlay.brc-open{opacity:1;visibility:visible;}\
.brc-card{width:100%;max-width:440px;max-height:calc(100vh - 48px);overflow:auto;\
background:var(--card,#15161b);border:1px solid var(--line,#2a2c34);\
border-radius:var(--r,16px);padding:24px;color:var(--ink,#f3f3f5);\
box-shadow:0 24px 70px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);\
transform:translateY(10px) scale(.98);opacity:0;\
transition:transform .2s cubic-bezier(.2,.7,.3,1),opacity .2s ease;}\
.brc-overlay.brc-open .brc-card{transform:none;opacity:1;}\
.brc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}\
.brc-title{margin:0;font-size:19px;font-weight:650;letter-spacing:-.01em;line-height:1.25;}\
.brc-sub{margin:6px 0 0;color:var(--mut,#a8abb5);font-size:13.5px;}\
.brc-x{flex:0 0 auto;width:32px;height:32px;border-radius:10px;border:1px solid transparent;\
background:transparent;color:var(--mut,#a8abb5);font-size:20px;line-height:1;cursor:pointer;\
display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;}\
.brc-x:hover{background:var(--card2,#1d1f27);color:var(--ink,#f3f3f5);}\
.brc-status{margin:20px 0 4px;border:1px solid var(--line,#2a2c34);border-radius:12px;\
background:var(--bg2,#101116);overflow:hidden;}\
.brc-row{display:flex;align-items:center;gap:11px;padding:12px 14px;}\
.brc-row + .brc-row{border-top:1px solid var(--line,#2a2c34);}\
.brc-dot{flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:var(--mut2,#6b6e78);\
box-shadow:0 0 0 3px rgba(255,255,255,.03);}\
.brc-dot.brc-on{background:var(--green,#33d17a);box-shadow:0 0 0 3px rgba(51,209,122,.16);}\
.brc-dot.brc-warn{background:var(--rise,#f5a623);box-shadow:0 0 0 3px rgba(245,166,35,.16);}\
.brc-rtext{display:flex;flex-direction:column;gap:1px;min-width:0;}\
.brc-rlabel{font-size:13.5px;font-weight:550;}\
.brc-rstate{font-size:12.5px;color:var(--mut,#a8abb5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\
.brc-rstate.brc-good{color:var(--green,#33d17a);}\
.brc-rstate.brc-amber{color:var(--rise,#f5a623);}\
.brc-actions{margin-top:18px;}\
.brc-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;\
padding:12px 16px;border-radius:12px;border:1px solid var(--line2,#34373f);\
background:var(--card2,#1d1f27);color:var(--ink,#f3f3f5);font-size:14px;font-weight:600;\
cursor:pointer;transition:filter .15s,opacity .15s,transform .05s;font-family:inherit;}\
.brc-btn:hover{filter:brightness(1.08);}\
.brc-btn:active{transform:translateY(1px);}\
.brc-btn-primary{border-color:transparent;color:#1a0f06;\
background:linear-gradient(120deg,var(--flame1,#ff8a3d),var(--flame2,#ff5e3a),var(--flame3,#ff2d55));}\
.brc-btn[disabled]{opacity:.5;cursor:not-allowed;filter:none;}\
.brc-btn.brc-loading{pointer-events:none;opacity:.85;}\
.brc-spin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(0,0,0,.25);\
border-top-color:rgba(0,0,0,.7);display:inline-block;animation:brc-spin .7s linear infinite;}\
@keyframes brc-spin{to{transform:rotate(360deg);}}\
.brc-help{margin:9px 2px 0;font-size:12px;color:var(--mut,#a8abb5);line-height:1.5;}\
.brc-err{margin:10px 0 0;padding:9px 12px;border-radius:10px;font-size:12.5px;\
color:var(--flame3,#ff2d55);background:rgba(255,45,85,.1);border:1px solid rgba(255,45,85,.28);}\
.brc-err[hidden]{display:none;}\
.brc-details{margin-top:20px;border-top:1px solid var(--line,#2a2c34);padding-top:8px;}\
.brc-summary{cursor:pointer;list-style:none;padding:8px 2px;font-size:13px;font-weight:550;\
color:var(--mut,#a8abb5);display:flex;align-items:center;gap:7px;border-radius:8px;\
transition:color .15s;}\
.brc-summary:hover{color:var(--ink,#f3f3f5);}\
.brc-summary::-webkit-details-marker{display:none;}\
.brc-summary::before{content:"";width:0;height:0;border-left:5px solid currentColor;\
border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s;}\
.brc-details[open] .brc-summary::before{transform:rotate(90deg);}\
.brc-field{margin-top:13px;}\
.brc-field label{display:block;font-size:12px;font-weight:550;color:var(--mut,#a8abb5);margin-bottom:5px;}\
.brc-field input{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:10px;\
border:1px solid var(--line2,#34373f);background:var(--bg,#0b0c10);color:var(--ink,#f3f3f5);\
font-size:13px;font-family:inherit;transition:border-color .15s,box-shadow .15s;}\
.brc-field input:focus{outline:none;border-color:var(--flame2,#ff5e3a);\
box-shadow:0 0 0 3px rgba(255,94,58,.18);}\
.brc-setup-actions{display:flex;align-items:center;gap:10px;margin-top:15px;}\
.brc-setup-actions .brc-btn{width:auto;flex:1;}\
.brc-reset{flex:0 0 auto;background:none;border:none;color:var(--mut,#a8abb5);\
font-size:12.5px;cursor:pointer;padding:6px 8px;border-radius:8px;font-family:inherit;\
transition:color .15s,background .15s;}\
.brc-reset:hover{color:var(--flame3,#ff2d55);background:var(--card2,#1d1f27);}\
.brc-overlay :focus-visible{outline:2px solid var(--flame2,#ff5e3a);outline-offset:2px;}\
.brc-json{width:100%;box-sizing:border-box;margin-top:6px;padding:10px;border-radius:10px;border:1px solid var(--line2,#34373f);background:var(--bg,#0b0c10);color:var(--ink,#f3f3f5);font-family:ui-monospace,monospace;font-size:11px;line-height:1.5;resize:vertical;}\
.brc-json:focus{outline:none;border-color:var(--flame2,#ff5e3a);box-shadow:0 0 0 3px rgba(255,94,58,.18);}\
html[data-theme="light"] .brc-overlay{background:rgba(20,20,25,.32);}\
html[data-theme="light"] .brc-btn-primary{color:#fff;}\
html[data-theme="light"] .brc-spin{border-color:rgba(255,255,255,.4);border-top-color:#fff;}\
@media (prefers-reduced-motion: reduce){\
.brc-overlay,.brc-card,.brc-summary::before{transition:none;}\
.brc-card{transform:none;}\
.brc-spin{animation-duration:0s;}}';

  // --- module state --------------------------------------------------------
  var overlay = null, card = null, lastFocus = null, built = false;

  function buildDom() {
    if (built) return;
    built = true;

    var style = document.createElement("style");
    style.setAttribute("data-brc", "");
    style.textContent = STYLE;
    document.head.appendChild(style);

    overlay = el('<div class="brc-overlay" role="presentation"></div>');
    card = el('<div class="brc-card" role="dialog" aria-modal="true" aria-label="Connect your calendar" tabindex="-1"></div>');
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close on overlay background click (but not clicks inside the card).
    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) close();
    });
    // Escape to close (only while open).
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("brc-open")) {
        e.preventDefault();
        close();
      }
    });
  }

  function render() {
    var live = isLive();
    var acct = (src().account && src().account()) || null;
    var acctName = acct ? (acct.name || acct.username || "your account") : "";
    var workIqReady = !!cfg().workIqAvailable;
    var canSignIn = !!cfg().liveAvailable;
    var imported = !!(src().isImported && src().isImported());

    card.innerHTML = '\
<div class="brc-head">\
  <div>\
    <h2 class="brc-title" id="brc-title">🔥 Connect your calendar</h2>\
    <p class="brc-sub">See what your real meetings cost.</p>\
  </div>\
  <button type="button" class="brc-x" data-brc-close aria-label="Close">×</button>\
</div>\
<div class="brc-status">\
  <div class="brc-row">\
    <span class="brc-dot ' + (live ? "brc-on" : "") + '"></span>\
    <span class="brc-rtext">\
      <span class="brc-rlabel">Microsoft 365</span>\
      <span class="brc-rstate ' + (live ? "brc-good" : "") + '">' +
        (live ? "Connected as " + esc(acctName) : "Not connected") + '</span>\
    </span>\
  </div>\
  <div class="brc-row">\
    <span class="brc-dot ' + (workIqReady ? "brc-on" : "brc-warn") + '"></span>\
    <span class="brc-rtext">\
      <span class="brc-rlabel">Work IQ insights</span>\
      <span class="brc-rstate ' + (workIqReady ? "brc-good" : "brc-amber") + '">' +
        (workIqReady ? "Ready" : "Add a proxy URL to enable") + '</span>\
    </span>\
  </div>\
</div>\
<div class="brc-actions">' + actionMarkup(live, canSignIn) + '\
  <div class="brc-err" data-brc-err hidden></div>\
</div>\
<details class="brc-details"' + (imported ? " open" : "") + '>\
  <summary class="brc-summary">Use your Work IQ agent' + (imported ? "  ✓ loaded" : "") + '</summary>\
  <p class="brc-help">In Copilot CLI or Claude Code (with the Work IQ MCP), run the Burn Rate prompt, then paste the JSON it prints here. No sign-in needed.</p>\
  <textarea id="brc-json" class="brc-json" rows="5" spellcheck="false" placeholder="[ {&quot;subject&quot;:&quot;Weekly Sync&quot;, &quot;start&quot;:&quot;2026-06-09T09:00&quot;, &quot;end&quot;:&quot;2026-06-09T10:00&quot;, &quot;attendees&quot;:[{&quot;name&quot;:&quot;Dana&quot;,&quot;title&quot;:&quot;Principal PM&quot;}]} ]"></textarea>\
  <div class="brc-setup-actions">\
    <button type="button" class="brc-btn brc-btn-primary" data-brc-import>Load my week</button>\
    ' + (imported ? '<button type="button" class="brc-reset" data-brc-clearimport>Back to demo</button>' : "") + '\
  </div>\
  <div class="brc-err" data-brc-import-err hidden></div>\
</details>\
<details class="brc-details">\
  <summary class="brc-summary">Setup (one-time, admin)</summary>\
  <div class="brc-field">\
    <label for="brc-client">Client ID</label>\
    <input id="brc-client" type="text" spellcheck="false" autocomplete="off"\
      placeholder="00000000-0000-0000-0000-000000000000" value="' + esc(lsGet(LS.client)) + '">\
  </div>\
  <div class="brc-field">\
    <label for="brc-tenant">Tenant ID</label>\
    <input id="brc-tenant" type="text" spellcheck="false" autocomplete="off"\
      placeholder="common, organizations, or a tenant GUID" value="' + esc(lsGet(LS.tenant)) + '">\
  </div>\
  <div class="brc-field">\
    <label for="brc-proxy">Work IQ proxy URL</label>\
    <input id="brc-proxy" type="url" spellcheck="false" autocomplete="off"\
      placeholder="https://your-proxy.example.com" value="' + esc(lsGet(LS.proxy)) + '">\
  </div>\
  <div class="brc-setup-actions">\
    <button type="button" class="brc-btn brc-btn-primary" data-brc-save>Save &amp; reload</button>\
    <button type="button" class="brc-reset" data-brc-reset>Reset</button>\
  </div>\
  <p class="brc-help">From your Entra SPA app registration + the deployed Work IQ proxy — see README.</p>\
</details>';

    card.setAttribute("aria-labelledby", "brc-title");
    wireActions(live, canSignIn);
  }

  function actionMarkup(live, canSignIn) {
    if (live) {
      return '<button type="button" class="brc-btn brc-btn-primary" data-brc-primary>Sign out</button>';
    }
    if (canSignIn) {
      return '<button type="button" class="brc-btn brc-btn-primary" data-brc-primary>' +
        '<span data-brc-label>Sign in with Microsoft</span></button>';
    }
    return '<button type="button" class="brc-btn brc-btn-primary" data-brc-primary disabled>' +
      'Sign in with Microsoft</button>' +
      '<p class="brc-help">Add a Client ID under Setup first.</p>';
  }

  function wireActions(live, canSignIn) {
    // Close buttons.
    var closers = card.querySelectorAll("[data-brc-close]");
    for (var i = 0; i < closers.length; i++) closers[i].addEventListener("click", close);

    var errEl = card.querySelector("[data-brc-err]");
    var primary = card.querySelector("[data-brc-primary]");

    if (primary && live) {
      primary.addEventListener("click", function () {
        try { if (src().signOut) src().signOut(); } catch (e) {}
        location.reload();
      });
    } else if (primary && canSignIn) {
      primary.addEventListener("click", function () {
        if (primary.classList.contains("brc-loading")) return;
        if (errEl) errEl.hidden = true;
        var labelSpan = primary.querySelector("[data-brc-label]");
        primary.classList.add("brc-loading");
        primary.disabled = true;
        primary.innerHTML = '<span class="brc-spin"></span><span>Signing in…</span>';
        Promise.resolve()
          .then(function () { return src().signIn && src().signIn(); })
          .then(function () { location.reload(); })
          .catch(function (err) {
            primary.classList.remove("brc-loading");
            primary.disabled = false;
            primary.innerHTML = '<span data-brc-label>Sign in with Microsoft</span>';
            if (errEl) {
              errEl.textContent = (err && err.message) ? err.message : "Sign-in failed. Please try again.";
              errEl.hidden = false;
            }
          });
      });
    }

    // Setup: Save & reload.
    var saveBtn = card.querySelector("[data-brc-save]");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var c = card.querySelector("#brc-client");
        var t = card.querySelector("#brc-tenant");
        var p = card.querySelector("#brc-proxy");
        lsSet(LS.client, c ? c.value.trim() : "");
        lsSet(LS.tenant, t ? t.value.trim() : "");
        lsSet(LS.proxy, p ? p.value.trim() : "");
        location.reload();
      });
    }

    // Setup: Reset (clear all three keys).
    var resetBtn = card.querySelector("[data-brc-reset]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        lsSet(LS.client, "");
        lsSet(LS.tenant, "");
        lsSet(LS.proxy, "");
        location.reload();
      });
    }

    // Import from a Work IQ agent: paste JSON -> store -> reload into real data.
    var importBtn = card.querySelector("[data-brc-import]");
    if (importBtn) {
      importBtn.addEventListener("click", function () {
        var ta = card.querySelector("#brc-json");
        var ierr = card.querySelector("[data-brc-import-err]");
        if (ierr) ierr.hidden = true;
        try {
          window.BR_SOURCE.importJson(ta ? ta.value : "");
          location.reload();
        } catch (e) {
          if (ierr) { ierr.textContent = (e && e.message) ? e.message : "Couldn't read that JSON."; ierr.hidden = false; }
        }
      });
    }
    var clearImp = card.querySelector("[data-brc-clearimport]");
    if (clearImp) {
      clearImp.addEventListener("click", function () {
        if (window.BR_SOURCE.clearImport) window.BR_SOURCE.clearImport();
        location.reload();
      });
    }
  }

  // --- focus management ----------------------------------------------------
  function trapFocus(e) {
    if (e.key !== "Tab" || !overlay.classList.contains("brc-open")) return;
    var nodes = card.querySelectorAll(
      'button:not([disabled]),[href],input:not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])'
    );
    var focusable = [];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].offsetParent !== null || nodes[i] === document.activeElement) focusable.push(nodes[i]);
    }
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  // --- public API ----------------------------------------------------------
  function open() {
    buildDom();
    render();
    lastFocus = document.activeElement;
    overlay.classList.add("brc-open");
    document.addEventListener("keydown", trapFocus, true);
    // Move focus into the dialog (first interactive control, else the card).
    var target = card.querySelector("[data-brc-primary]:not([disabled])") || card;
    requestAnimationFrame(function () { try { target.focus(); } catch (e) {} });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("brc-open");
    document.removeEventListener("keydown", trapFocus, true);
    if (lastFocus && typeof lastFocus.focus === "function") {
      try { lastFocus.focus(); } catch (e) {}
    }
    lastFocus = null;
  }

  window.BR_CONNECT = { open: open, close: close };

  // --- self-wiring to #connBtn --------------------------------------------
  // Capture-phase listener so we intercept before app.js's own bubble handler.
  function wireButton() {
    var btn = document.getElementById("connBtn");
    if (!btn || btn.getAttribute("data-brc-wired") === "1") return;
    btn.setAttribute("data-brc-wired", "1");
    btn.addEventListener("click", function (e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      open();
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireButton);
  } else {
    wireButton();
  }
})();
