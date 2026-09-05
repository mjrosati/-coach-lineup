/* Coach Lineup live update layer
   v117.8 — Clean readable Play Lines
*/
window.COACH_UPDATE_VERSION = "117.8";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-1178-style";
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


      /* ===== PLAY LINES clean readable expanded section ===== */
      #v114Lines:checked ~ .fivePanelGrid .fivePanel[data-panel="lines"]{
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
        background:#071b38!important;
      }
      #v114Lines:checked ~ .fivePanelGrid .fivePanel[data-panel="lines"] .fivePanelLabel{
        min-height:62px!important;
        padding:14px 20px 12px 150px!important;
        background:#0a2f5d!important;
        border-bottom:1px solid #2e6ea9!important;
      }
      #v114Lines:checked ~ .fivePanelGrid .fivePanel[data-panel="lines"] .fivePanelLabel b{
        font-size:20px!important;
        letter-spacing:.5px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid #fiveLinesPreview{
        display:none!important;
      }

      .coachReadableLines{display:none}
      #v114Lines:checked ~ .fivePanelGrid .coachReadableLines{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:14px!important;
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        padding:18px!important;
        align-content:start!important;
      }

      .coachLineCard{
        min-height:96px!important;
        display:grid!important;
        grid-template-columns:18px minmax(0,1fr) auto!important;
        grid-template-rows:auto auto!important;
        align-items:center!important;
        column-gap:14px!important;
        row-gap:5px!important;
        padding:14px 18px!important;
        border:2px solid rgba(255,255,255,.26)!important;
        border-radius:9px!important;
        background:#0d3261!important;
        color:#fff!important;
        overflow:hidden!important;
      }
      .coachLineCard.live{
        border-color:#fff!important;
        background:#123b6d!important;
      }
      .coachLineSwatch{
        grid-row:1 / span 2!important;
        width:14px!important;
        height:58px!important;
        border-radius:5px!important;
        background:var(--line-color)!important;
        box-shadow:0 0 0 1px rgba(255,255,255,.3)!important;
      }
      .coachLineName{
        min-width:0!important;
        font-size:20px!important;
        line-height:1.1!important;
        font-weight:1000!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      .coachLineMeta{
        min-width:0!important;
        font-size:12px!important;
        line-height:1.2!important;
        font-weight:800!important;
        opacity:.78!important;
      }
      .coachLineStatus{
        grid-column:3!important;
        grid-row:1 / span 2!important;
        align-self:center!important;
        padding:6px 9px!important;
        border:1px solid rgba(255,255,255,.55)!important;
        border-radius:999px!important;
        font-size:10px!important;
        font-weight:1000!important;
        letter-spacing:.4px!important;
        white-space:nowrap!important;
      }
      .coachLineStatus.live{
        background:#fff!important;
        color:#071b38!important;
      }

      .coachLinesFooter{display:none}
      #v114Lines:checked ~ .fivePanelGrid .coachLinesFooter{
        display:flex!important;
        flex:0 0 auto!important;
        justify-content:center!important;
        padding:14px 16px 18px!important;
        border-top:1px solid #2c73af!important;
        background:#04152f!important;
      }
      .coachManageLinesBtn{
        width:min(460px,92%)!important;
        min-height:54px!important;
        border:2px solid #fff!important;
        border-radius:7px!important;
        background:#0057b8!important;
        color:#fff!important;
        font-size:15px!important;
        font-weight:1000!important;
        letter-spacing:.5px!important;
        touch-action:manipulation!important;
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

    document.body.classList.remove("coach-players-expanded");
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

    document.body.classList.remove("coach-field-expanded");
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




  function buildReadableLines() {
    const panel = document.querySelector('#fivePanelDashboard .fivePanel[data-panel="lines"]');
    const preview = document.getElementById("fiveLinesPreview");
    if (!panel || !preview) return;

    let host = panel.querySelector(".coachReadableLines");
    if (!host) {
      host = document.createElement("div");
      host.className = "coachReadableLines";
      const footer = panel.querySelector(".coachLinesFooter");
      panel.insertBefore(host, footer || null);
    }

    const colors = {
      BLACK:"#111111",
      BLUE:"#1593ff",
      GREEN:"#20c763",
      GOLD:"#f2c230"
    };

    const sourceRows = Array.from(preview.children);
    const cards = [];

    sourceRows.forEach(function(row, index){
      const raw = (row.textContent || "").replace(/\s+/g," ").trim();
      const nameMatch = raw.match(/(BLACK|BLUE|GREEN|GOLD)\s*LINE/i);
      const posMatch = raw.match(/(\d+)\s*POS/i);
      const live = /\bLIVE\b/i.test(raw) || index === 0;
      const key = nameMatch ? nameMatch[1].toUpperCase() : ("LINE " + (index+1));
      const displayName = nameMatch ? (key + " LINE") : key;
      cards.push({
        name: displayName,
        color: colors[key] || "#3aa7ff",
        positions: posMatch ? posMatch[1] : "",
        live: live
      });
    });

    if (!cards.length) {
      ["BLACK","BLUE","GREEN","GOLD"].forEach(function(key,index){
        cards.push({name:key+" LINE",color:colors[key],positions:"",live:index===0});
      });
    }

    host.replaceChildren(...cards.map(function(item){
      const card=document.createElement("div");
      card.className="coachLineCard"+(item.live?" live":"");
      card.style.setProperty("--line-color",item.color);

      const swatch=document.createElement("div");
      swatch.className="coachLineSwatch";

      const name=document.createElement("div");
      name.className="coachLineName";
      name.textContent=item.name;

      const meta=document.createElement("div");
      meta.className="coachLineMeta";
      meta.textContent=item.positions ? item.positions+" POSITIONS" : "LINE ROTATION";

      const status=document.createElement("div");
      status.className="coachLineStatus"+(item.live?" live":"");
      status.textContent=item.live ? "LIVE" : "READY";

      card.append(swatch,name,meta,status);
      return card;
    }));
  }

  function openManageLines() {
    const dashboard = document.getElementById("fivePanelDashboard");
    const all = document.getElementById("v114All");
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
      const target =
        document.getElementById("linesCard") ||
        document.getElementById("linesBtn") ||
        document.querySelector("[data-nav='lines']");
      if (target) target.click();
    } catch (error) {
      console.warn("Manage Lines:", error);
    }
  }

  function ensureLinesFooter() {
    const panel = document.querySelector('#fivePanelDashboard .fivePanel[data-panel="lines"]');
    if (!panel || panel.querySelector(".coachLinesFooter")) return;

    const footer = document.createElement("div");
    footer.className = "coachLinesFooter";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "coachManageLinesBtn";
    button.textContent = "MANAGE LINES";
    button.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();
      openManageLines();
    });

    footer.appendChild(button);
    panel.appendChild(footer);
  }

  function bindDashboardSections() {
    const fieldRadio = document.getElementById("v114Field");
    if (fieldRadio && fieldRadio.dataset.coach1178 !== "1") {
      fieldRadio.dataset.coach1178 = "1";
      fieldRadio.addEventListener("change", function () {
        if (fieldRadio.checked) requestAnimationFrame(openFullField);
      });
    }

    const playersRadio = document.getElementById("v114Players");
    if (playersRadio && playersRadio.dataset.coach1178 !== "1") {
      playersRadio.dataset.coach1178 = "1";
      playersRadio.addEventListener("change", function () {
        if (playersRadio.checked) requestAnimationFrame(openPlayersRosterStatus);
      });
    }


    /* When the roster modal closes, return to the five-section dashboard. */
    const modal = document.getElementById("modal");
    if (modal && modal.dataset.coach1178 !== "1") {
      modal.dataset.coach1178 = "1";
      const observer = new MutationObserver(function () {
        if (
          document.body.classList.contains("coach-players-expanded") &&
          modal.classList.contains("hidden")
        ) {
          document.body.classList.remove("coach-players-expanded");
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
    ensureLinesFooter();
    buildReadableLines();
    mirrorDashboardField();

    if (!mirrorTimer) {
      mirrorTimer = setInterval(function(){
        mirrorDashboardField();
        buildReadableLines();
      }, 1200);
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
