/* Coach Lineup live update layer
   v117.1 — Expanded Field workspace
   Upload ONLY this file for this update.
*/
window.COACH_UPDATE_VERSION = "117.1";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-field-style";
  const BACK_ID = "coachFieldBackBtn";

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Expanded FIELD uses the original working Game Day screen */
      body.coach-field-expanded #fivePanelDashboard {
        display: none !important;
      }

      body.coach-field-expanded #app {
        display: block !important;
      }

      body.coach-field-expanded #app > .top {
        display: flex !important;
      }

      body.coach-field-expanded #app > .layout {
        display: flex !important;
        height: calc(100dvh - 62px) !important;
        min-height: 0 !important;
      }

      /* Give the center field as much space as possible without removing
         the original roster/actions/game controls. */
      body.coach-field-expanded #app > .layout > .main {
        min-width: 0 !important;
        flex: 1 1 auto !important;
      }

      body.coach-field-expanded .fieldArea {
        min-height: 0 !important;
        overflow: hidden !important;
        padding: 6px !important;
        background: #06150c !important;
      }

      body.coach-field-expanded #field.field {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        aspect-ratio: auto !important;
        position: relative !important;
        overflow: hidden !important;
        border: 3px solid #fff !important;
        background:
          repeating-linear-gradient(
            to bottom,
            transparent 0 calc(10% - 2px),
            rgba(255,255,255,.88) calc(10% - 2px) 10%
          ),
          repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,.035) 0 5%,
            rgba(0,0,0,.025) 5% 10%
          ),
          linear-gradient(180deg,#168a43 0%,#0e7536 50%,#168a43 100%) !important;
        box-shadow:
          inset 0 0 0 2px rgba(255,255,255,.12),
          inset 0 0 32px rgba(0,0,0,.18) !important;
      }

      /* Hash marks */
      body.coach-field-expanded #field.field::before,
      body.coach-field-expanded #field.field::after {
        content: "" !important;
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 34px !important;
        z-index: 1 !important;
        opacity: .72 !important;
        pointer-events: none !important;
        background:
          repeating-linear-gradient(
            to bottom,
            transparent 0 4.2%,
            rgba(255,255,255,.95) 4.2% 4.7%,
            transparent 4.7% 5%
          ) !important;
      }

      body.coach-field-expanded #field.field::before { left: 31% !important; }
      body.coach-field-expanded #field.field::after  { right: 31% !important; }

      body.coach-field-expanded #field .mid {
        background: #fff !important;
        opacity: .95 !important;
        height: 4px !important;
        z-index: 2 !important;
      }

      body.coach-field-expanded #field .slot {
        z-index: 5 !important;
      }

      /* Keep original controls easy to hit on the iPad. */
      body.coach-field-expanded button,
      body.coach-field-expanded select {
        touch-action: manipulation !important;
      }

      #${BACK_ID} {
        position: fixed !important;
        top: max(8px, env(safe-area-inset-top)) !important;
        left: max(8px, env(safe-area-inset-left)) !important;
        z-index: 999999 !important;
        min-height: 42px !important;
        padding: 7px 12px !important;
        border: 2px solid #fff !important;
        border-radius: 5px !important;
        background: #0057b8 !important;
        color: #fff !important;
        font: 900 10px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        letter-spacing: .35px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,.35) !important;
        touch-action: manipulation !important;
      }

      /* In expanded FIELD, leave room for the return button. */
      body.coach-field-expanded #app > .top {
        padding-left: 150px !important;
      }

      @media (orientation: landscape) and (max-height: 700px) {
        body.coach-field-expanded #app > .top {
          height: 48px !important;
        }
        body.coach-field-expanded #app > .layout {
          height: calc(100dvh - 48px) !important;
        }
        body.coach-field-expanded #field .slot {
          min-width: 62px !important;
          min-height: 40px !important;
        }
      }
    `;
    document.head.appendChild(style);
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
      closeExpandedField();
    });

    document.body.appendChild(button);
    return button;
  }

  function openExpandedField() {
    const dashboard = document.getElementById("fivePanelDashboard");
    if (!dashboard) return;

    document.body.classList.add("coach-field-expanded");
    dashboard.classList.add("hidden");
    dashboard.style.display = "none";

    const back = ensureBackButton();
    back.hidden = false;

    /* Use the original working field/rendering and controls. */
    try {
      if (typeof renderAll === "function") renderAll();
      else if (typeof renderField === "function") renderField();
    } catch (error) {
      console.warn("Coach update field render:", error);
    }
  }

  function closeExpandedField() {
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

    try {
      if (typeof renderFivePanelRealData === "function") renderFivePanelRealData();
    } catch (error) {
      console.warn("Coach update dashboard render:", error);
    }
  }

  function initialize() {
    installStyles();
    ensureBackButton();

    const fieldRadio = document.getElementById("v114Field");
    if (!fieldRadio || fieldRadio.dataset.coachUpdateBound === "1") return;

    fieldRadio.dataset.coachUpdateBound = "1";
    fieldRadio.addEventListener("change", function () {
      if (fieldRadio.checked) {
        /* Let the native v114 label/radio expansion complete first. */
        requestAnimationFrame(openExpandedField);
      }
    });
  }

  /* app.js is loaded before this file, but the app screen may render later. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  /* Re-check after auth/team load in case the dashboard was built later. */
  setTimeout(initialize, 500);
  setTimeout(initialize, 1500);
})();
