/* Coach Lineup live update layer
   v118.7 — Native line selection + field open fix
   This file intentionally replaces the earlier 117.x patch stack.
*/
window.COACH_UPDATE_VERSION = "118.7";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-1187-style";
  const BADGE_ID = "coachUpdateBadge";
  const BACK_ID = "coachFieldBackBtn";
  const TOOL_MODE_CLASS = "coach-tool-modal-open";
  let refreshTimer = null;

  const LINE_COLORS = {
    BLACK: "#111111",
    BLUE: "#1593ff",
    GREEN: "#20c763",
    GOLD: "#f2c230"
  };

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      :root{
        --coach-bg:#04152f;
        --coach-panel:#082650;
        --coach-panel2:#0b3263;
        --coach-border:#2b6fa9;
        --coach-text:#ffffff;
        --coach-muted:#9cc2e7;
        --coach-blue:#0b78d0;
        --coach-cyan:#25a6ff;
        --coach-red:#ff4969;
        --coach-green:#24c76a;
        --coach-gold:#f2c230;
      }

      /* ---------- GENERAL CLEANUP ---------- */
      #fivePanelDashboard{
        background:linear-gradient(180deg,#051a38 0%,#03142d 100%)!important;
      }

      #fivePanelDashboard .fivePanel{
        border:1px solid var(--coach-border)!important;
        border-radius:8px!important;
        overflow:hidden!important;
        background:var(--coach-panel)!important;
        box-shadow:none!important;
      }

      #fivePanelDashboard .fivePanelLabel{
        min-height:42px!important;
        padding:8px 10px!important;
        background:linear-gradient(180deg,#0b376d,#082a57)!important;
        border-bottom:1px solid rgba(255,255,255,.14)!important;
      }

      #fivePanelDashboard .fivePanelLabel b{
        color:#fff!important;
        font-weight:1000!important;
        letter-spacing:.45px!important;
      }

      #fivePanelDashboard .fivePanelLabel small{
        color:#b9d5ef!important;
        font-weight:700!important;
      }

      /* The whole card is already tappable. Remove repetitive tiny instructions. */
      #fivePanelDashboard .expandHint{
        opacity:.48!important;
        font-size:6px!important;
        letter-spacing:.4px!important;
      }

      #fivePanelDashboard button,
      #fivePanelDashboard label[for]{
        touch-action:manipulation!important;
      }

      #fivePanelDashboard button:focus-visible,
      #fivePanelDashboard label[for]:focus-visible,
      #${BACK_ID}:focus-visible{
        outline:3px solid #fff!important;
        outline-offset:2px!important;
      }

      /* Clean the game-status strip. */
      #fivePanelDashboard .v102GameStrip > *{
        min-height:40px!important;
        font-size:9px!important;
        font-weight:900!important;
        letter-spacing:.3px!important;
      }

      /* ---------- UPDATE BADGE ---------- */
      #${BADGE_ID}{
        position:fixed!important;
        right:max(8px,env(safe-area-inset-right))!important;
        bottom:max(8px,env(safe-area-inset-bottom))!important;
        z-index:999999!important;
        padding:5px 8px!important;
        border:1px solid rgba(255,255,255,.75)!important;
        border-radius:5px!important;
        background:rgba(0,45,98,.95)!important;
        color:#fff!important;
        font:900 9px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        letter-spacing:.4px!important;
        pointer-events:none!important;
      }

      #buildBadge{
        opacity:.28!important;
        font-size:6px!important;
      }

      /* ---------- DASHBOARD FIELD ---------- */
      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField{
        position:relative!important;
        overflow:hidden!important;
        margin:6px!important;
        border:2px solid rgba(255,255,255,.85)!important;
        border-radius:5px!important;
        background:
          repeating-linear-gradient(
            to bottom,
            transparent 0 calc(10% - 2px),
            rgba(255,255,255,.72) calc(10% - 2px) 10%
          ),
          repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,.03) 0 5%,
            rgba(0,0,0,.025) 5% 10%
          ),
          linear-gradient(180deg,#188946,#0e7438)!important;
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
        inset:2%!important;
        width:96%!important;
        height:96%!important;
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

      #fivePanelDashboard .coachFieldMirror .field::before,
      #fivePanelDashboard .coachFieldMirror .field::after{
        display:none!important;
      }

      #fivePanelDashboard .coachFieldMirror .slot{
        min-width:42px!important;
        min-height:30px!important;
        padding:2px 4px!important;
        border-width:2px!important;
        border-radius:5px!important;
        font-size:7px!important;
        line-height:1.05!important;
      }

      #fivePanelDashboard .coachFieldMirror .slot b,
      #fivePanelDashboard .coachFieldMirror .slot small{
        font-size:7px!important;
        line-height:1!important;
      }

      #fivePanelDashboard .coachFieldMirror .tag{
        padding:2px 6px!important;
        font-size:6px!important;
      }

      /* ---------- FULL FIELD ---------- */
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
        display:flex!important;
        align-items:stretch!important;
        justify-content:center!important;
        min-height:0!important;
        overflow:hidden!important;
        padding:6px!important;
        background:#06160d!important;
      }
      body.coach-field-expanded #field.field{
        width:100%!important;
        height:100%!important;
        min-width:0!important;
        max-width:100%!important;
        margin:auto!important;
        aspect-ratio:auto!important;
        border:2px solid rgba(255,255,255,.9)!important;
      }
      body.coach-field-expanded #field .slot{
        z-index:5!important;
      }

      #${BACK_ID}{
        position:fixed!important;
        top:max(8px,env(safe-area-inset-top))!important;
        left:max(8px,env(safe-area-inset-left))!important;
        z-index:999999!important;
        min-height:42px!important;
        padding:7px 12px!important;
        border:2px solid #fff!important;
        border-radius:6px!important;
        background:#0057b8!important;
        color:#fff!important;
        font:900 10px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        letter-spacing:.35px!important;
        touch-action:manipulation!important;
      }

      /* ---------- PLAYERS / ROSTER ---------- */
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] #fivePlayersPreview{
        padding:10px!important;
        gap:6px!important;
      }

      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] #fivePlayersPreview > *{
        min-height:44px!important;
        font-size:12px!important;
      }

      body.coach-players-expanded #modal,
      body.${TOOL_MODE_CLASS} #modal{
        position:fixed!important;
        inset:0!important;
        z-index:200000!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        background:rgba(1,10,28,.80)!important;
      }

      body.coach-players-expanded #modal.hidden,
      body.${TOOL_MODE_CLASS} #modal.hidden{
        display:none!important;
      }

      body.coach-players-expanded #modalBody,
      body.${TOOL_MODE_CLASS} #modalBody{
        width:min(940px,88vw)!important;
        max-width:940px!important;
        max-height:88vh!important;
        margin:auto!important;
        overflow:auto!important;
        border:2px solid #2d85cf!important;
        border-radius:9px!important;
        background:#061b3a!important;
        box-shadow:0 16px 48px rgba(0,0,0,.52)!important;
      }

      body.coach-players-expanded #modalBody > *,
      body.${TOOL_MODE_CLASS} #modalBody > *{
        margin-left:auto!important;
        margin-right:auto!important;
      }

      /* ---------- PLAY LINES ---------- */
      #v114Lines:checked ~ .fivePanelGrid .fivePanel[data-panel="lines"]{
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
        background:#071b38!important;
      }

      #v114Lines:checked ~ .fivePanelGrid #fiveLinesPreview{
        display:none!important;
      }

      .coachReadableLines{display:none}

      #v114Lines:checked ~ .fivePanelGrid .coachReadableLines{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:12px!important;
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        padding:16px!important;
        align-content:start!important;
      }

      .coachLineCard{
        min-height:90px!important;
        display:grid!important;
        grid-template-columns:16px minmax(0,1fr) auto!important;
        grid-template-rows:auto auto!important;
        align-items:center!important;
        column-gap:12px!important;
        row-gap:5px!important;
        padding:13px 16px!important;
        border:2px solid rgba(255,255,255,.24)!important;
        border-radius:8px!important;
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
        height:54px!important;
        border-radius:5px!important;
        background:var(--line-color)!important;
        box-shadow:0 0 0 1px rgba(255,255,255,.3)!important;
      }

      .coachLineName{
        min-width:0!important;
        color:#fff!important;
        font-size:18px!important;
        line-height:1.1!important;
        font-weight:1000!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      .coachLineMeta{
        color:#acd0ed!important;
        font-size:11px!important;
        font-weight:800!important;
      }

      .coachLineStatus{
        grid-column:3!important;
        grid-row:1 / span 2!important;
        padding:6px 9px!important;
        border:1px solid rgba(255,255,255,.55)!important;
        border-radius:999px!important;
        color:#fff!important;
        font-size:9px!important;
        font-weight:1000!important;
        white-space:nowrap!important;
      }

      .coachLineStatus.live{
        background:#fff!important;
        color:#071b38!important;
      }

      .coachSectionFooter{
        display:none;
      }

      #v114Lines:checked ~ .fivePanelGrid .coachLinesFooter,
      #v114Stats:checked ~ .fivePanelGrid .coachStatsFooter,
      #v114Plays:checked ~ .fivePanelGrid .coachPlaysFooter{
        display:flex!important;
        flex:0 0 auto!important;
        justify-content:center!important;
        padding:12px 14px 15px!important;
        border-top:1px solid #2c73af!important;
        background:#04152f!important;
      }

      .coachSectionAction{
        width:min(440px,92%)!important;
        min-height:50px!important;
        border:2px solid #fff!important;
        border-radius:7px!important;
        background:#0057b8!important;
        color:#fff!important;
        font-size:14px!important;
        font-weight:1000!important;
        letter-spacing:.45px!important;
        touch-action:manipulation!important;
      }

      .coachSectionAction:active{
        transform:scale(.985)!important;
        filter:brightness(1.12)!important;
      }


      /* ---------- 118.2 PLAY LINES READABILITY ONLY ---------- */
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview{
        display:none!important;
      }

      .coach1182Lines{
        display:flex!important;
        flex-direction:column!important;
        gap:6px!important;
        padding:8px!important;
        min-height:0!important;
        overflow:auto!important;
      }

      .coach1182LineRow{
        display:grid!important;
        grid-template-columns:10px minmax(0,1fr) auto!important;
        align-items:center!important;
        gap:8px!important;
        min-height:46px!important;
        padding:7px 8px!important;
        border:1px solid rgba(255,255,255,.18)!important;
        border-radius:6px!important;
        background:#0b3263!important;
        color:#fff!important;
        overflow:hidden!important;
      }

      .coach1182LineRow.live{
        border-color:#fff!important;
        background:#123b6d!important;
      }

      .coach1182Bar{
        width:8px!important;
        height:30px!important;
        border-radius:4px!important;
        background:var(--coach-line-color)!important;
        box-shadow:0 0 0 1px rgba(255,255,255,.22)!important;
      }

      .coach1182LineText{
        min-width:0!important;
        display:flex!important;
        flex-direction:column!important;
        gap:2px!important;
      }

      .coach1182LineName{
        font-size:10px!important;
        line-height:1.05!important;
        font-weight:1000!important;
        letter-spacing:.15px!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      .coach1182LineMeta{
        font-size:8px!important;
        line-height:1!important;
        font-weight:800!important;
        color:#b8d8f3!important;
        white-space:nowrap!important;
      }

      .coach1182LineStatus{
        font-size:7px!important;
        font-weight:1000!important;
        letter-spacing:.3px!important;
        padding:4px 5px!important;
        border:1px solid rgba(255,255,255,.45)!important;
        border-radius:999px!important;
        white-space:nowrap!important;
      }

      .coach1182LineStatus.live{
        background:#fff!important;
        color:#071b38!important;
      }

      /* Larger version when Play Lines is expanded. */
      #v114Lines:checked ~ .fivePanelGrid .coach1182Lines{
        gap:10px!important;
        padding:14px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineRow{
        grid-template-columns:14px minmax(0,1fr) auto!important;
        min-height:72px!important;
        gap:12px!important;
        padding:12px 14px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182Bar{
        width:12px!important;
        height:48px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineName{
        font-size:17px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineMeta{
        font-size:11px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineStatus{
        font-size:9px!important;
        padding:5px 8px!important;
      }



      .coach1182LineRow{
        width:100%!important;
        text-align:left!important;
        appearance:none!important;
        -webkit-appearance:none!important;
        font-family:inherit!important;
      }

      /* ---------- 118.3: remove duplicate lower line cards ---------- */
      #fivePanelDashboard .fivePanel[data-panel="lines"] .coachReadableLines{
        display:none!important;
      }

      /* Make the readable rows obviously tappable. */
      .coach1182LineRow{
        cursor:pointer!important;
        touch-action:manipulation!important;
      }
      .coach1182LineRow:active{
        transform:scale(.992)!important;
        filter:brightness(1.12)!important;
      }


      /* ---------- 118.5: let Undo Play / Next Line receive the tap ---------- */
      #fivePanelDashboard .fivePanel[data-panel="lines"] .v114TapLayer{
        pointer-events:none!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="lines"] .v112LineActions{
        position:relative!important;
        z-index:50!important;
        pointer-events:auto!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="lines"] .v112LineActions button{
        position:relative!important;
        z-index:51!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }


      /* ---------- 118.6: restore native field geometry when a line is opened ---------- */
      body.coach-field-expanded .fieldArea{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        overflow:hidden!important;
      }

      body.coach-field-expanded #field.field{
        position:relative!important;
        width:min(1100px,96%)!important;
        height:auto!important;
        max-height:calc(100dvh - 175px)!important;
        aspect-ratio:1.78!important;
        min-width:0!important;
        margin:auto!important;
        overflow:hidden!important;
      }

      body.coach-field-expanded #field .slot{
        position:absolute!important;
        transform:translate(-50%,-50%)!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        body.coach-field-expanded #field.field{
          width:96%!important;
          height:auto!important;
          aspect-ratio:1.78!important;
          max-height:calc(100dvh - 135px)!important;
        }
      }


      /* ---------- 118.7: do not reshape the native Game Day field ---------- */
      body:not(.coach-field-expanded) #field.field{
        height:auto;
      }

      /* Line cards should show exactly one LIVE line: the line selected in lineSelect. */
      .coach1182LineRow.live{
        border-color:#fff!important;
      }

      /* ---------- STATS ---------- */
      #v114Stats:checked ~ .fivePanelGrid .fivePanel[data-panel="stats"]{
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
      }

      #v114Stats:checked ~ .fivePanelGrid #fiveStatsPreview{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        padding:14px!important;
        align-content:start!important;
      }

      #v114Stats:checked ~ .fivePanelGrid #fiveStatsPreview > *{
        min-height:58px!important;
        padding:10px 12px!important;
        border:1px solid rgba(255,255,255,.20)!important;
        border-radius:6px!important;
        background:#0b3263!important;
        color:#fff!important;
        font-size:12px!important;
      }

      /* ---------- PLAYS ---------- */
      #v114Plays:checked ~ .fivePanelGrid .fivePanel[data-panel="plays"]{
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
      }

      #v114Plays:checked ~ .fivePanelGrid #fivePlaysPreview{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        padding:14px!important;
        align-content:start!important;
      }

      #v114Plays:checked ~ .fivePanelGrid #fivePlaysPreview > *{
        min-height:52px!important;
        padding:10px 12px!important;
        border:1px solid rgba(255,255,255,.20)!important;
        border-radius:6px!important;
        background:#0b3263!important;
        color:#fff!important;
        font-size:12px!important;
      }

      /* ---------- SMALL TABLET LANDSCAPE ---------- */
      @media (orientation:landscape) and (max-height:700px){
        body.coach-field-expanded #app > .top{height:48px!important}
        body.coach-field-expanded #app > .layout{height:calc(100dvh - 48px)!important}

        #v114Lines:checked ~ .fivePanelGrid .coachReadableLines,
        #v114Stats:checked ~ .fivePanelGrid #fiveStatsPreview,
        #v114Plays:checked ~ .fivePanelGrid #fivePlaysPreview{
          gap:8px!important;
          padding:10px!important;
        }

        .coachLineCard{
          min-height:72px!important;
          padding:10px 12px!important;
        }

        .coachLineName{font-size:15px!important}
        .coachLineSwatch{height:44px!important}
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

  function resetDashboardToAll() {
    const all = document.getElementById("v114All");
    if (all) all.checked = true;
  }

  function showFivePanelDashboard() {
    const dashboard = document.getElementById("fivePanelDashboard");
    if (!dashboard) return;

    resetDashboardToAll();
    dashboard.classList.remove("hidden");
    dashboard.style.display = "grid";
    dashboard.scrollTop = 0;
    document.body.classList.remove(
      "coach-field-expanded",
      "coach-players-expanded",
      TOOL_MODE_CLASS
    );

    const back = document.getElementById(BACK_ID);
    if (back) back.hidden = true;

    setTimeout(function () {
      mirrorDashboardField();
      buildReadableLines();
    }, 50);
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

    document.body.classList.remove("coach-players-expanded", TOOL_MODE_CLASS);
    document.body.classList.add("coach-field-expanded");

    dashboard.classList.add("hidden");
    dashboard.style.display = "none";

    ensureBackButton().hidden = false;

    try {
      if (typeof renderAll === "function") renderAll();
      else if (typeof renderField === "function") renderField();
    } catch (error) {
      console.warn("Field refresh:", error);
    }

    setTimeout(coach1186RefreshOpenedField, 80);
    setTimeout(coach1186RefreshOpenedField, 240);
  }

  function closeFullField() {
    showFivePanelDashboard();
  }

  function openPlayersRosterStatus() {
    const dashboard = document.getElementById("fivePanelDashboard");

    document.body.classList.remove("coach-field-expanded", TOOL_MODE_CLASS);
    document.body.classList.add("coach-players-expanded");

    resetDashboardToAll();

    if (dashboard) {
      dashboard.classList.add("hidden");
      dashboard.style.display = "none";
    }

    try {
      if (typeof openRosterManager === "function") {
        openRosterManager();
        return;
      }

      const target =
        document.getElementById("rosterManageBtn") ||
        document.getElementById("manageRosterBtn") ||
        document.querySelector("[data-open-roster]");

      if (target) target.click();
    } catch (error) {
      console.warn("Roster/status:", error);
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

    const sourceRows = Array.from(preview.children);
    const cards = [];

    sourceRows.forEach(function (row, index) {
      const raw = (row.textContent || "").replace(/\s+/g, " ").trim();
      const nameMatch = raw.match(/(BLACK|BLUE|GREEN|GOLD)\s*LINE/i);
      const posMatch = raw.match(/(\d+)\s*POS/i);
      const selectedText = String(
        document.querySelector("#lineSelect option:checked")?.textContent || ""
      ).toUpperCase();
      const live = selectedText.indexOf(key) >= 0;
      const key = nameMatch ? nameMatch[1].toUpperCase() : ("LINE " + (index + 1));

      cards.push({
        name: nameMatch ? key + " LINE" : key,
        color: LINE_COLORS[key] || "#3aa7ff",
        positions: posMatch ? posMatch[1] : "",
        live: live
      });
    });

    if (!cards.length) {
      ["BLACK","BLUE","GREEN","GOLD"].forEach(function (key, index) {
        cards.push({
          name: key + " LINE",
          color: LINE_COLORS[key],
          positions: "",
          live: index === 0
        });
      });
    }

    const nodes = cards.map(function (item) {
      const card = document.createElement("div");
      card.className = "coachLineCard" + (item.live ? " live" : "");
      card.style.setProperty("--line-color", item.color);

      const swatch = document.createElement("div");
      swatch.className = "coachLineSwatch";

      const name = document.createElement("div");
      name.className = "coachLineName";
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "coachLineMeta";
      meta.textContent = item.positions
        ? item.positions + " POSITIONS"
        : "LINE ROTATION";

      const status = document.createElement("div");
      status.className = "coachLineStatus" + (item.live ? " live" : "");
      status.textContent = item.live ? "LIVE" : "READY";

      card.append(swatch, name, meta, status);
      return card;
    });

    host.replaceChildren(...nodes);
  }

  function clickExistingControl(candidates) {
    for (const candidate of candidates) {
      let target = null;

      if (candidate.startsWith("#")) {
        target = document.querySelector(candidate);
      } else {
        target = document.getElementById(candidate);
      }

      if (target) {
        target.click();
        return true;
      }
    }

    return false;
  }

  function openTool(kind) {
    const dashboard = document.getElementById("fivePanelDashboard");

    resetDashboardToAll();

    if (dashboard) {
      dashboard.classList.add("hidden");
      dashboard.style.display = "none";
    }

    document.body.classList.remove("coach-field-expanded", "coach-players-expanded");
    document.body.classList.add(TOOL_MODE_CLASS);

    let opened = false;

    if (kind === "lines") {
      if (typeof window.coachOpenSection === "function") {
        try {
          window.coachOpenSection("lines");
          opened = true;
        } catch {}
      }

      if (!opened) {
        opened = clickExistingControl([
          "linesCard",
          "linesBtn",
          "#dashboard .card[data-view='lines']",
          "[data-nav='lines']"
        ]);
      }
    }

    if (kind === "stats") {
      opened = clickExistingControl([
        "statsBtn",
        "allPlayerStatsBtn",
        "[data-open-stats]"
      ]);
    }

    if (kind === "plays") {
      opened = clickExistingControl([
        "playbookBtn",
        "[data-open-playbook]"
      ]);
    }

    if (!opened) {
      document.body.classList.remove(TOOL_MODE_CLASS);
      showFivePanelDashboard();
    }
  }

  function ensureSectionFooter(panelName, className, label, action) {
    const panel = document.querySelector(
      '#fivePanelDashboard .fivePanel[data-panel="' + panelName + '"]'
    );

    if (!panel || panel.querySelector("." + className)) return;

    const footer = document.createElement("div");
    footer.className = "coachSectionFooter " + className;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "coachSectionAction";
    button.textContent = label;

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      action();
    });

    footer.appendChild(button);
    panel.appendChild(footer);
  }

  function ensureSectionFooters() {
    ensureSectionFooter(
      "lines",
      "coachLinesFooter",
      "MANAGE LINES",
      function () { openTool("lines"); }
    );

    ensureSectionFooter(
      "stats",
      "coachStatsFooter",
      "FULL PLAYER STATS",
      function () { openTool("stats"); }
    );

    ensureSectionFooter(
      "plays",
      "coachPlaysFooter",
      "OPEN PLAYBOOK",
      function () { openTool("plays"); }
    );
  }


  /* ---------- 118.2: readable line rows ---------- */

  function coach1183NormalizeLineName(name) {
    return String(name || "").replace(/\s+/g, " ").trim().toUpperCase();
  }

  function coach1183SelectLine(lineName) {
    const wanted = coach1183NormalizeLineName(lineName);
    const select = document.getElementById("lineSelect");

    if (select) {
      const options = Array.from(select.options || []);
      const match = options.find(function (option) {
        return coach1183NormalizeLineName(option.textContent || option.label || "") === wanted;
      }) || options.find(function (option) {
        return coach1183NormalizeLineName(option.textContent || option.label || "").indexOf(wanted) >= 0;
      });

      if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event("change", { bubbles:true }));
        return true;
      }
    }

    return false;
  }

  function coach1183OpenLineField(lineName) {
    coach1183SelectLine(lineName);

    /* Use the app's own FULL FIELD button instead of forcing our field/fullscreen CSS.
       This preserves the field/player geometry and existing player-edit behavior. */
    setTimeout(function () {
      const fullField = document.getElementById("fivePanelClose");
      if (fullField) {
        fullField.click();
        return;
      }

      /* Fallback only if the native button is missing. */
      const dashboard = document.getElementById("fivePanelDashboard");
      if (dashboard) {
        dashboard.classList.add("hidden");
        dashboard.style.display = "none";
      }
      document.body.classList.remove("five-panel-open","coach-field-expanded");
      try {
        if (typeof renderAll === "function") renderAll();
        else if (typeof renderField === "function") renderField();
      } catch (error) {
        console.warn("118.7 native field fallback:", error);
      }
    }, 60);
  }

  function build1182ReadableLines() {
    const panel = document.querySelector('#fivePanelDashboard .fivePanel[data-panel="lines"]');
    const preview = document.getElementById("fiveLinesPreview");
    if (!panel || !preview) return;

    let host = panel.querySelector(".coach1182Lines");
    if (!host) {
      host = document.createElement("div");
      host.className = "coach1182Lines";
      preview.insertAdjacentElement("afterend", host);
    }

    const colors = {
      BLACK: "#111111",
      BLUE: "#1593ff",
      GREEN: "#20c763",
      GOLD: "#f2c230"
    };

    const source = Array.from(preview.children).map(function(row, index) {
      const raw = (row.textContent || "").replace(/\s+/g, " ").trim();

      let key = "";
      const match = raw.match(/(BLACK|BLUE|GREEN|GOLD)\s*LINE/i);
      if (match) key = match[1].toUpperCase();

      if (!key) {
        const fallback = ["BLACK","BLUE","GREEN","GOLD"];
        key = fallback[index] || ("LINE " + (index + 1));
      }

      const pos = raw.match(/(\d+)\s*POS/i);
      const live = /\bLIVE\b/i.test(raw);

      return {
        name: key + (key.indexOf("LINE ") === 0 ? "" : " LINE"),
        color: colors[key] || "#7aa8cf",
        positions: pos ? pos[1] : "",
        live: live
      };
    });

    if (!source.length) {
      const selectedText = String(
        document.querySelector("#lineSelect option:checked")?.textContent || ""
      ).toUpperCase();
      ["BLACK","BLUE","GREEN","GOLD"].forEach(function(key) {
        source.push({
          name: key + " LINE",
          color: colors[key],
          positions: "",
          live: selectedText.indexOf(key) >= 0
        });
      });
    }

    host.replaceChildren(...source.map(function(item) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "coach1182LineRow" + (item.live ? " live" : "");
      row.style.setProperty("--coach-line-color", item.color);
      row.setAttribute("aria-label", "Open " + item.name + " on full field");
      row.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        coach1183OpenLineField(item.name);
      });

      const bar = document.createElement("div");
      bar.className = "coach1182Bar";

      const textWrap = document.createElement("div");
      textWrap.className = "coach1182LineText";

      const name = document.createElement("div");
      name.className = "coach1182LineName";
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "coach1182LineMeta";
      meta.textContent = item.positions ? item.positions + " POSITIONS" : "LINE ROTATION";

      const status = document.createElement("div");
      status.className = "coach1182LineStatus" + (item.live ? " live" : "");
      status.textContent = item.live ? "LIVE" : "READY";

      textWrap.append(name, meta);
      row.append(bar, textWrap, status);
      return row;
    }));
  }


  /* ---------- 118.4: keep Undo Play / Next Line from expanding Play Lines ---------- */
  function bind1184LineControlButtons() {
    const panel = document.querySelector('#fivePanelDashboard .fivePanel[data-panel="lines"]');
    if (!panel) return;

    const buttons = Array.from(panel.querySelectorAll("button"));
    buttons.forEach(function(button) {
      const label = String(button.innerText || button.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      const isUndo = label.indexOf("UNDO PLAY") >= 0;
      const isNext = label.indexOf("NEXT LINE") >= 0;

      if ((!isUndo && !isNext) || button.dataset.coach1184Bound === "1") return;

      button.dataset.coach1184Bound = "1";

      /* Let the button's existing action run, but stop the click from
         bubbling into the panel's Expand handler. */
      button.addEventListener("click", function(event) {
        event.stopPropagation();
      });

      /* iPad Safari can promote touch/pointer events to the parent label.
         Stop those from bubbling too, without cancelling the button itself. */
      button.addEventListener("pointerup", function(event) {
        event.stopPropagation();
      });
      button.addEventListener("touchend", function(event) {
        event.stopPropagation();
      }, { passive: true });
    });
  }


  function coach1186RefreshOpenedField() {
    if (!document.body.classList.contains("coach-field-expanded")) return;
    try {
      if (typeof renderField === "function") renderField();
    } catch (error) {
      console.warn("118.6 field refresh:", error);
    }
  }

  function bindDashboardSections() {
    const fieldRadio = document.getElementById("v114Field");

    if (fieldRadio && fieldRadio.dataset.coach118 !== "1") {
      fieldRadio.dataset.coach118 = "1";

      fieldRadio.addEventListener("change", function () {
        if (fieldRadio.checked) {
          requestAnimationFrame(openFullField);
        }
      });
    }

    const playersRadio = document.getElementById("v114Players");

    if (playersRadio && playersRadio.dataset.coach118 !== "1") {
      playersRadio.dataset.coach118 = "1";

      playersRadio.addEventListener("change", function () {
        if (playersRadio.checked) {
          requestAnimationFrame(openPlayersRosterStatus);
        }
      });
    }

    const modal = document.getElementById("modal");

    if (modal && modal.dataset.coach118 !== "1") {
      modal.dataset.coach118 = "1";

      const observer = new MutationObserver(function () {
        const appManagedModal =
          document.body.classList.contains("coach-players-expanded") ||
          document.body.classList.contains(TOOL_MODE_CLASS);

        if (appManagedModal && modal.classList.contains("hidden")) {
          showFivePanelDashboard();
        }
      });

      observer.observe(modal, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }
  }

  function initialize() {
    installStyles();
    ensureUpdateBadge();
    ensureBackButton();
    ensureSectionFooters();
    bindDashboardSections();
    bind1184LineControlButtons();
    buildReadableLines();
    build1182ReadableLines();
    mirrorDashboardField();

    if (!refreshTimer) {
      refreshTimer = setInterval(function () {
        buildReadableLines();
        build1182ReadableLines();
        bind1184LineControlButtons();
        mirrorDashboardField();
      }, 1400);
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
