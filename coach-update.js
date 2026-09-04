/* Coach Lineup live update layer
   v117.3 — Dashboard field mirrors Game Day + Players opens Roster/Status
*/
window.COACH_UPDATE_VERSION = "117.3";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-1173-style";
  const BACK_ID = "coachFieldBackBtn";
  const BADGE_ID = "coachUpdateBadge";
  let mirrorTimer = null;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BADGE_ID}{
        position:fixed!important;right:max(8px,env(safe-area-inset-right))!important;
        bottom:max(8px,env(safe-area-inset-bottom))!important;z-index:999999!important;
        padding:5px 8px!important;border:1px solid rgba(255,255,255,.75)!important;
        border-radius:4px!important;background:rgba(0,45,98,.94)!important;color:#fff!important;
        font:900 9px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        letter-spacing:.35px!important;pointer-events:none!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField{
        position:relative!important;overflow:hidden!important;margin:5px!important;border:2px solid #fff!important;
        background:
          repeating-linear-gradient(to bottom,transparent 0 calc(10% - 2px),rgba(255,255,255,.80) calc(10% - 2px) 10%),
          repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0 5%,rgba(0,0,0,.02) 5% 10%),
          linear-gradient(180deg,#168a43 0%,#0e7536 50%,#168a43 100%)!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField::before,
      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField::after{
        content:""!important;position:absolute!important;top:0!important;bottom:0!important;width:22px!important;
        z-index:2!important;opacity:.68!important;pointer-events:none!important;
        background:repeating-linear-gradient(to bottom,transparent 0 4.2%,rgba(255,255,255,.94) 4.2% 4.7%,transparent 4.7% 5%)!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField::before{left:31%!important}
      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField::after{right:31%!important}

      #fivePanelDashboard .miniField.coach-live-mirror > .miniFieldMid,
      #fivePanelDashboard .miniField.coach-live-mirror > .miniOffense,
      #fivePanelDashboard .miniField.coach-live-mirror > .miniDefense,
      #fivePanelDashboard .miniField.coach-live-mirror > i,
      #fivePanelDashboard .miniField.coach-live-mirror > .v102MiniPlayer,
      #fivePanelDashboard .miniField.coach-live-mirror > .v104Mini,
      #fivePanelDashboard .miniField.coach-live-mirror > .v106Mini{display:none!important}

      #fivePanelDashboard .coachFieldMirror{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
        overflow:hidden!important;pointer-events:none!important;
      }
      #fivePanelDashboard .coachFieldMirror .field{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;
        max-width:none!important;aspect-ratio:auto!important;margin:0!important;border:0!important;
        background:transparent!important;box-shadow:none!important;transform:none!important;
      }
      #fivePanelDashboard .coachFieldMirror .field::before,
      #fivePanelDashboard .coachFieldMirror .field::after{display:none!important}
      #fivePanelDashboard .coachFieldMirror .slot{
        min-width:46px!important;padding:3px!important;font-size:7px!important;border-width:2px!important;
        border-radius:4px!important;box-shadow:0 1px 3px rgba(0,0,0,.45)!important;
      }
      #fivePanelDashboard .coachFieldMirror .slot small{font-size:7px!important}
      #fivePanelDashboard .coachFieldMirror .tag{padding:3px 8px!important;font-size:7px!important}

      body.coach-field-expanded #fivePanelDashboard{display:none!important}
      body.coach-field-expanded #app{display:block!important}
      body.coach-field-expanded #app > .top{display:flex!important;padding-left:150px!important}
      body.coach-field-expanded #app > .layout{display:flex!important;min-height:0!important;height:calc(100dvh - 62px)!important}
      body.coach-field-expanded #app > .layout > .main{flex:1 1 auto!important;min-width:0!important}
      body.coach-field-expanded .fieldArea{min-height:0!important;overflow:hidden!important;padding:5px!important;background:#06150c!important}
      body.coach-field-expanded #field.field{
        width:100%!important;height:100%!important;min-width:0!important;aspect-ratio:auto!important;border:3px solid #fff!important;
        background:
          repeating-linear-gradient(to bottom,transparent 0 calc(10% - 2px),rgba(255,255,255,.88) calc(10% - 2px) 10%),
          repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0 5%,rgba(0,0,0,.025) 5% 10%),
          linear-gradient(180deg,#168a43 0%,#0e7536 50%,#168a43 100%)!important;
      }
      body.coach-field-expanded #field.field::before,
      body.coach-field-expanded #field.field::after{
        content:""!important;position:absolute!important;top:0!important;bottom:0!important;width:34px!important;
        z-index:1!important;opacity:.72!important;pointer-events:none!important;
        background:repeating-linear-gradient(to bottom,transparent 0 4.2%,rgba(255,255,255,.95) 4.2% 4.7%,transparent 4.7% 5%)!important;
      }
      body.coach-field-expanded #field.field::before{left:31%!important}
      body.coach-field-expanded #field.field::after{right:31%!important}
      body.coach-field-expanded #field .mid{background:#fff!important;opacity:.95!important;height:4px!important;z-index:2!important}
      body.coach-field-expanded #field .slot{z-index:5!important}

      #${BACK_ID}{
        position:fixed!important;top:max(8px,env(safe-area-inset-top))!important;left:max(8px,env(safe-area-inset-left))!important;
        z-index:999999!important;min-height:42px!important;padding:7px 12px!important;border:2px solid #fff!important;
        border-radius:5px!important;background:#0057b8!important;color:#fff!important;
        font:900 10px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        letter-spacing:.35px!important;box-shadow:0 2px 8px rgba(0,0,0,.35)!important;touch-action:manipulation!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        body.coach-field-expanded #app > .top{height:48px!important}
        body.coach-field-expanded #app > .layout{height:calc(100dvh - 48px)!important}
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
    clone.querySelectorAll("[id]").forEach(function (node) { node.removeAttribute("id"); });
    clone.querySelectorAll("button,input,select,textarea,a").forEach(function (node) {
      node.setAttribute("tabindex", "-1");
      node.setAttribute("aria-hidden", "true");
    });
    host.replaceChildren(clone);
  }

  function openFullField() {
    const dashboard = document.getElementById("fivePanelDashboard");
    if (!dashboard) return;
    document.body.classList.add("coach-field-expanded");
    dashboard.classList.add("hidden");
    dashboard.style.display = "none";
    ensureBackButton().hidden = false;
    try {
      if (typeof renderAll === "function") renderAll();
      else if (typeof renderField === "function") renderField();
    } catch (error) {
      console.warn("Coach update field render:", error);
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
      console.warn("Coach update roster/status:", error);
    }
  }

  function bindDashboardSections() {
    const fieldRadio = document.getElementById("v114Field");
    if (fieldRadio && fieldRadio.dataset.coach1173 !== "1") {
      fieldRadio.dataset.coach1173 = "1";
      fieldRadio.addEventListener("change", function () {
        if (fieldRadio.checked) requestAnimationFrame(openFullField);
      });
    }

    const playersRadio = document.getElementById("v114Players");
    if (playersRadio && playersRadio.dataset.coach1173 !== "1") {
      playersRadio.dataset.coach1173 = "1";
      playersRadio.addEventListener("change", function () {
        if (playersRadio.checked) requestAnimationFrame(openPlayersRosterStatus);
      });
    }
  }

  function initialize() {
    installStyles();
    ensureUpdateBadge();
    ensureBackButton();
    bindDashboardSections();
    mirrorDashboardField();
    if (!mirrorTimer) mirrorTimer = setInterval(mirrorDashboardField, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  setTimeout(initialize, 500);
  setTimeout(initialize, 1500);
})();
