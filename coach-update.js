/* Coach Lineup live update layer
   v117.5 — Centered Players + Play Lines workspaces
*/
window.COACH_UPDATE_VERSION = "117.5";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-1175-style";
  const BADGE_ID = "coachUpdateBadge";
  const BACK_ID = "coachFieldBackBtn";
  let mirrorTimer = null;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* ===== visible live-update version ===== */
      #${BADGE_ID}{
        position:fixed!important;
        right:max(8px,env(safe-area-inset-right))!important;
        bottom:max(8px,env(safe-area-inset-bottom))!important;
        z-index:999999!important;
        padding:5px 8px!important;
        border:1px solid rgba(255,255,255,.75)!important;
        border-radius:4px!important;
        background:rgba(0,45,98,.94)!important;
        color:#fff!important;
        font:900 9px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        letter-spacing:.35px!important;
        pointer-events:none!important;
      }

      /* ===== dashboard FIELD mirrors full Game Day field ===== */
      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField{
        position:relative!important;
        overflow:hidden!important;
        margin:5px!important;
        border:2px solid #fff!important;
        background:
          repeating-linear-gradient(
            to bottom,
            transparent 0 calc(10% - 2px),
            rgba(255,255,255,.80) calc(10% - 2px) 10%
          ),
          linear-gradient(180deg,#168a43 0%,#0e7536 50%,#168a43 100%)!important;
      }

      #fivePanelDashboard .miniField.coach-live-mirror > .miniFieldMid,
      #fivePanelDashboard .miniField.coach-live-mirror > .miniOffense,
      #fivePanelDashboard .miniField.coach-live-mirror > .miniDefense,
      #fivePanelDashboard .miniField.coach-live-mirror > i,
      #fivePanelDashboard .miniField.coach-live-mirror > .v102MiniPlayer,
      #fivePanelDashboard .miniField.coach-live-mirror > .v104Mini,
      #fivePanelDashboard .miniField.coach-live-mirror > .v106Mini{
        display:none!important;
      }

      #fivePanelDashboard .coachFieldMirror{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        overflow:hidden!important;
        pointer-events:none!important;
      }

      #fivePanelDashboard .coachFieldMirror .field{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        max-width:none!important;
        aspect-ratio:auto!important;
        margin:0!important;
        border:0!important;
        background:transparent!important;
        box-shadow:none!important;
        transform:none!important;
      }

      #fivePanelDashboard .coachFieldMirror .slot{
        min-width:46px!important;
        padding:3px!important;
        font-size:7px!important;
        border-width:2px!important;
      }

      /* ===== FIELD section opens the real full Game Day screen ===== */
      body.coach-field-expanded #fivePanelDashboard{display:none!important}
      body.coach-field-expanded #app{display:block!important}
      body.coach-field-expanded #app > .top{
        display:flex!important;
        padding-left:150px!important;
      }
      body.coach-field-expanded #app > .layout{
        display:flex!important;
        min-height:0!important;
        height:calc(100dvh - 62px)!important;
      }
      body.coach-field-expanded #app > .layout > .main{
        flex:1 1 auto!important;
        min-width:0!important;
      }
      body.coach-field-expanded .fieldArea{
        min-height:0!important;
        overflow:hidden!important;
        padding:5px!important;
      }
      body.coach-field-expanded #field.field{
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        aspect-ratio:auto!important;
      }

      #${BACK_ID}{
        position:fixed!important;
        top:max(8px,env(safe-area-inset-top))!important;
        left:max(8px,env(safe-area-inset-left))!important;
        z-index:999999!important;
        min-height:42px!important;
        padding:7px 12px!important;
        border:2px solid #fff!important;
        border-radius:5px!important;
        background:#0057b8!important;
        color:#fff!important;
        font:900 10px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        touch-action:manipulation!important;
      }

      /* ===== PLAYERS full workspace =====
         Keep the roster-manager functions, but center the entire player workspace. */
      body.coach-players-expanded #modal{
        position:fixed!important;
        inset:0!important;
        z-index:200000!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:18px!important;
        background:rgba(1,10,28,.78)!important;
      }

      body.coach-players-expanded #modal.hidden{
        display:none!important;
      }

      body.coach-players-expanded #modalBody{
        position:relative!important;
        width:min(900px,82vw)!important;
        max-width:900px!important;
        height:min(620px,84vh)!important;
        max-height:84vh!important;
        margin:auto!important;
        overflow:auto!important;
        border:2px solid #2d85cf!important;
        border-radius:8px!important;
        background:#061b3a!important;
        box-shadow:0 18px 55px rgba(0,0,0,.55)!important;
      }

      /* Center roster content itself rather than pinning it to the left. */
      body.coach-players-expanded #modalBody > *{
        margin-left:auto!important;
        margin-right:auto!important;
      }

      body.coach-players-expanded #modalBody .rosterCards,
      body.coach-players-expanded #modalBody .rosterGrid,
      body.coach-players-expanded #modalBody .playerCards{
        width:100%!important;
        max-width:820px!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }

      body.coach-players-expanded #modalBody h2,
      body.coach-players-expanded #modalBody h3{
        text-align:left!important;
      }


      /* ===== PLAY LINES full workspace =====
         Use the real Lines manager and center it just like Players. */
      body.coach-lines-expanded #modal{
        position:fixed!important;
        inset:0!important;
        z-index:200000!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:18px!important;
        background:rgba(1,10,28,.78)!important;
      }

      body.coach-lines-expanded #modal.hidden{
        display:none!important;
      }

      body.coach-lines-expanded #modalBody{
        position:relative!important;
        width:min(940px,86vw)!important;
        max-width:940px!important;
        height:min(650px,86vh)!important;
        max-height:86vh!important;
        margin:auto!important;
        overflow:auto!important;
        border:2px solid #ff4d6d!important;
        border-radius:8px!important;
        background:#061b3a!important;
        box-shadow:0 18px 55px rgba(0,0,0,.55)!important;
      }

      body.coach-lines-expanded #modalBody > *{
        margin-left:auto!important;
        margin-right:auto!important;
      }

      body.coach-lines-expanded #modalBody .lineCards,
      body.coach-lines-expanded #modalBody .linesGrid,
      body.coach-lines-expanded #modalBody .lineManager{
        width:100%!important;
        max-width:860px!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        body.coach-field-expanded #app > .top{height:48px!important}
        body.coach-field-expanded #app > .layout{height:calc(100dvh - 48px)!important}

        body.coach-players-expanded #modal{
          padding:8px!important;
        }
        body.coach-players-expanded #modalBody{
          width:min(920px,88vw)!important;
          height:88vh!important;
          max-height:88vh!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUpdateBadge() {
    let badge = document.getElementById(BADGE_ID);
    if (!badge) {
      badge = document.createElement("div");
      badge.id = BADGE_ID;
      document.body.appendChild(badge);
    }
    badge.textContent = "UPDATE " + window.COACH_UPDATE_VERSION;
  }

  function ensureBackButton() {
    let button = document.getElementById(BACK_ID);
    if (button) return button;

    button = document.createElement("button");
    button.id = BACK_ID;
    button.type = "button";
    button.textContent = "← ALL 5 SECTIONS";
    button.hidden = true;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeFullField();
    });
    document.body.appendChild(button);
    return button;
  }

  function mirrorDashboardField() {
    const dashboard = document.getElementById("fivePanelDashboard");
    if (!dashboard || dashboard.classList.contains("hidden")) return;

    const mini = dashboard.querySelector('.fivePanel[data-panel="field"] .miniField');
    const realField = document.getElementById("field");
    if (!mini || !realField) return;

    mini.classList.add("coach-live-mirror");

    let host = mini.querySelector(".coachFieldMirror");
    if (!host) {
      host = document.createElement("div");
      host.className = "coachFieldMirror";
      mini.appendChild(host);
    }

    const clone = realField.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach(function (node) {
      node.removeAttribute("id");
    });
    clone.querySelectorAll("button,input,select,textarea,a").forEach(function (node) {
      node.setAttribute("tabindex", "-1");
      node.setAttribute("aria-hidden", "true");
    });

    host.replaceChildren(clone);
  }

  function openFullField() {
    const dashboard = document.getElementById("fivePanelDashboard");
    if (!dashboard) return;

    document.body.classList.remove("coach-players-expanded","coach-lines-expanded");
    document.body.classList.add("coach-field-expanded");

    dashboard.classList.add("hidden");
    dashboard.style.display = "none";

    ensureBackButton().hidden = false;

    try {
      if (typeof renderAll === "function") renderAll();
      else if (typeof renderField === "function") renderField();
    } catch (error) {
      console.warn("Coach field render:", error);
    }
  }

  function closeFullField() {
    const dashboard = document.getElementById("fivePanelDashboard");
    const all = document.getElementById("v114All");

    document.body.classList.remove("coach-field-expanded");
    if (all) all.checked = true;

    if (dashboard) {
      dashboard.classList.remove("hidden");
      dashboard.style.display = "grid";
      dashboard.scrollTop = 0;
    }

    const back = document.getElementById(BACK_ID);
    if (back) back.hidden = true;

    setTimeout(mirrorDashboardField, 50);
  }

  function openPlayersRosterStatus() {
    const dashboard = document.getElementById("fivePanelDashboard");
    const all = document.getElementById("v114All");

    document.body.classList.remove("coach-field-expanded","coach-lines-expanded");
    document.body.classList.add("coach-players-expanded");

    if (all) all.checked = true;
    if (dashboard) {
      dashboard.classList.add("hidden");
      dashboard.style.display = "none";
    }

    try {
      if (typeof openRosterManager === "function") {
        openRosterManager();
        return;
      }

      const rosterBtn =
        document.getElementById("rosterManageBtn") ||
        document.getElementById("manageRosterBtn") ||
        document.querySelector("[data-open-roster]");

      if (rosterBtn) rosterBtn.click();
    } catch (error) {
      console.warn("Coach roster/status:", error);
    }
  }


  function openPlayLinesManager() {
    const dashboard = document.getElementById("fivePanelDashboard");
    const all = document.getElementById("v114All");

    document.body.classList.remove("coach-field-expanded","coach-players-expanded");
    document.body.classList.add("coach-lines-expanded");

    if (all) all.checked = true;
    if (dashboard) {
      dashboard.classList.add("hidden");
      dashboard.style.display = "none";
    }

    try {
      if (typeof window.coachOpenSection === "function") {
        window.coachOpenSection("lines");
        return;
      }

      const linesBtn =
        document.getElementById("linesCard") ||
        document.getElementById("linesBtn") ||
        document.querySelector("[data-nav='lines']");

      if (linesBtn) linesBtn.click();
    } catch (error) {
      console.warn("Coach play lines:", error);
    }
  }

  function bindDashboardSections() {
    const fieldRadio = document.getElementById("v114Field");
    if (fieldRadio && fieldRadio.dataset.coach1175 !== "1") {
      fieldRadio.dataset.coach1175 = "1";
      fieldRadio.addEventListener("change", function () {
        if (fieldRadio.checked) requestAnimationFrame(openFullField);
      });
    }

    const playersRadio = document.getElementById("v114Players");
    if (playersRadio && playersRadio.dataset.coach1175 !== "1") {
      playersRadio.dataset.coach1175 = "1";
      playersRadio.addEventListener("change", function () {
        if (playersRadio.checked) requestAnimationFrame(openPlayersRosterStatus);
      });
    }

    const linesRadio = document.getElementById("v114Lines");
    if (linesRadio && linesRadio.dataset.coach1175 !== "1") {
      linesRadio.dataset.coach1175 = "1";
      linesRadio.addEventListener("change", function () {
        if (linesRadio.checked) requestAnimationFrame(openPlayLinesManager);
      });
    }

    /* When the roster modal closes, return to the five-section dashboard. */
    const modal = document.getElementById("modal");
    if (modal && modal.dataset.coach1175 !== "1") {
      modal.dataset.coach1175 = "1";
      const observer = new MutationObserver(function () {
        if (
          (document.body.classList.contains("coach-players-expanded") ||
           document.body.classList.contains("coach-lines-expanded")) &&
          modal.classList.contains("hidden")
        ) {
          document.body.classList.remove("coach-players-expanded","coach-lines-expanded");
          const dashboard = document.getElementById("fivePanelDashboard");
          const all = document.getElementById("v114All");
          if (all) all.checked = true;
          if (dashboard) {
            dashboard.classList.remove("hidden");
            dashboard.style.display = "grid";
          }
          setTimeout(mirrorDashboardField, 50);
        }
      });
      observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function initialize() {
    installStyles();
    ensureUpdateBadge();
    ensureBackButton();
    bindDashboardSections();
    mirrorDashboardField();

    if (!mirrorTimer) {
      mirrorTimer = setInterval(mirrorDashboardField, 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  setTimeout(initialize, 500);
  setTimeout(initialize, 1500);
})();
