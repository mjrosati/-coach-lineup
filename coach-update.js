/* Coach Lineup live update layer
   v118.38 — Unassigned players filter
   This file intentionally replaces the earlier 117.x patch stack.
*/
window.COACH_UPDATE_VERSION = "118.38";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-11838-style";
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


      /* ---------- 118.9: isolated editable line field ---------- */
      .coach1189LineOverlay{
        position:fixed!important;
        inset:0!important;
        z-index:999990!important;
        display:flex!important;
        flex-direction:column!important;
        background:#04152f!important;
        color:#fff!important;
      }
      .coach1189LineOverlay.hidden{display:none!important}

      .coach1189LineHeader{
        flex:0 0 auto!important;
        min-height:58px!important;
        display:flex!important;
        align-items:center!important;
        gap:12px!important;
        padding:8px 12px!important;
        background:#082650!important;
        border-bottom:1px solid #2b6fa9!important;
      }
      .coach1189LineHeader button{
        min-height:42px!important;
        padding:8px 14px!important;
        border:2px solid #fff!important;
        border-radius:6px!important;
        background:#0057b8!important;
        color:#fff!important;
        font-weight:900!important;
      }
      .coach1189LineHeader b{
        font-size:18px!important;
        letter-spacing:.5px!important;
      }
      .coach1189LineHeader small{
        margin-left:auto!important;
        color:#b9d5ef!important;
        font-weight:800!important;
      }

      .coach1189FieldHost{
        flex:1 1 auto!important;
        min-height:0!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        padding:10px!important;
        overflow:hidden!important;
        background:#06160d!important;
      }

      .coach1189FieldHost #field.field{
        position:relative!important;
        width:min(1180px,98vw)!important;
        height:auto!important;
        max-width:98vw!important;
        max-height:calc(100dvh - 82px)!important;
        aspect-ratio:1.78!important;
        margin:auto!important;
        overflow:hidden!important;
        border:3px solid #e7eee2!important;
      }

      .coach1189FieldHost #field .slot{
        position:absolute!important;
        transform:translate(-50%,-50%)!important;
      }

      .coach1182LineRow{
        width:100%!important;
        text-align:left!important;
        appearance:none!important;
        -webkit-appearance:none!important;
        font-family:inherit!important;
        cursor:pointer!important;
        touch-action:manipulation!important;
      }
      .coach1182LineRow:active{
        transform:scale(.992)!important;
        filter:brightness(1.10)!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        .coach1189LineHeader{min-height:48px!important}
        .coach1189LineHeader b{font-size:15px!important}
        .coach1189FieldHost{padding:4px!important}
        .coach1189FieldHost #field.field{
          width:auto!important;
          height:calc(100dvh - 56px)!important;
          max-width:98vw!important;
          max-height:calc(100dvh - 56px)!important;
          aspect-ratio:1.78!important;
        }
      }


      /* ---------- 118.10: clean Play Lines expansion ---------- */
      /* Remove the old duplicated 2x2 line-card block completely. */
      #fivePanelDashboard .fivePanel[data-panel="lines"] .coachReadableLines{
        display:none!important;
      }

      /* Keep only the four readable color-bar rows. */
      #v114Lines:checked ~ .fivePanelGrid .fivePanel[data-panel="lines"]{
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182Lines{
        display:flex!important;
        flex-direction:column!important;
        flex:0 0 auto!important;
        gap:10px!important;
        padding:14px 16px!important;
        overflow:visible!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineRow{
        min-height:78px!important;
        max-height:78px!important;
        grid-template-columns:14px minmax(0,1fr) auto!important;
        gap:12px!important;
        padding:12px 16px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182Bar{
        width:12px!important;
        height:48px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineName{
        font-size:18px!important;
        line-height:1.05!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineMeta{
        font-size:10px!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .coach1182LineStatus{
        font-size:9px!important;
        padding:6px 9px!important;
      }

      /* Keep controls and Manage Lines separated below the four rows. */
      #v114Lines:checked ~ .fivePanelGrid .coachLinesFooter{
        margin-top:auto!important;
      }


      /* ---------- 118.11: make Undo Play / Next Line truly tappable ---------- */
      #fivePanelDashboard .fivePanel[data-panel="lines"]{
        position:relative!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="lines"] > .v114TapLayer{
        pointer-events:none!important;
        z-index:1!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="lines"] .v112LineActions{
        position:relative!important;
        z-index:100!important;
        pointer-events:auto!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="lines"] .v112LineActions button{
        position:relative!important;
        z-index:101!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }


      /* ---------- 118.12: editable expanded line field ---------- */
      /* The expanded line overlay sits above the app, so its player picker
         must sit above the overlay too. */
      body.coach11812-line-editing #modal{
        z-index:1000010!important;
        pointer-events:auto!important;
      }

      body.coach11812-line-editing #modal:not(.hidden){
        display:flex!important;
        position:fixed!important;
        inset:0!important;
        align-items:center!important;
        justify-content:center!important;
        padding:14px!important;
        background:rgba(1,10,28,.84)!important;
      }

      body.coach11812-line-editing #modalBody{
        width:min(940px,92vw)!important;
        max-width:940px!important;
        max-height:88dvh!important;
        overflow:auto!important;
        margin:auto!important;
        border:2px solid #2d85cf!important;
        border-radius:9px!important;
        background:#061b3a!important;
        box-shadow:0 16px 48px rgba(0,0,0,.55)!important;
      }

      #coach1189LineOverlay #field .slot{
        pointer-events:auto!important;
        cursor:pointer!important;
        touch-action:manipulation!important;
      }

      #coach1189LineOverlay #field .slot *{
        pointer-events:none!important;
      }

      #coach1189LineOverlay .coach11812TapHint{
        margin-left:auto!important;
        color:#d9ecff!important;
        font-size:11px!important;
        font-weight:900!important;
        letter-spacing:.3px!important;
        white-space:nowrap!important;
      }


      /* ---------- 118.13: switch lines without leaving expanded editor ---------- */
      #coach1189LineOverlay .coach11813LineTabs{
        display:flex!important; gap:6px!important; margin-left:12px!important;
        align-items:center!important; flex-wrap:nowrap!important;
      }
      #coach1189LineOverlay .coach11813LineTab{
        min-height:34px!important; padding:7px 11px!important;
        border:1px solid #4d8bc7!important; border-radius:6px!important;
        background:#071c3c!important; color:#eaf5ff!important;
        font-size:10px!important; font-weight:900!important;
        pointer-events:auto!important; touch-action:manipulation!important;
      }
      #coach1189LineOverlay .coach11813LineTab.active{
        background:#1689e8!important; border-color:#a9dbff!important; color:#fff!important;
      }


      /* ---------- 118.14: visible line switch row under blue header ---------- */
      #coach1189LineOverlay .coach11814SwitchBar{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:8px!important;
        padding:8px 12px!important;
        background:#062552!important;
        border-top:1px solid #2b70b5!important;
        border-bottom:1px solid #2b70b5!important;
        position:relative!important;
        z-index:1000005!important;
        pointer-events:auto!important;
      }

      #coach1189LineOverlay .coach11814SwitchBtn{
        flex:1 1 0!important;
        max-width:180px!important;
        min-height:38px!important;
        padding:8px 10px!important;
        border:1px solid #4a91d4!important;
        border-radius:6px!important;
        background:#071d3f!important;
        color:#eef8ff!important;
        font-size:11px!important;
        font-weight:900!important;
        letter-spacing:.3px!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }

      #coach1189LineOverlay .coach11814SwitchBtn.active{
        background:#1689e8!important;
        border-color:#b4e0ff!important;
        color:#fff!important;
        box-shadow:0 0 0 2px rgba(92,182,255,.18)!important;
      }


      /* ---------- 118.15: per-line player placement editing ---------- */
      #coach1189LineOverlay .coach11815PlacementBar{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:8px!important;
        padding:6px 12px 8px!important;
        background:#041a39!important;
        border-bottom:1px solid #245c93!important;
        position:relative!important;
        z-index:1000005!important;
        pointer-events:auto!important;
      }

      #coach1189LineOverlay .coach11815MoveBtn{
        min-height:36px!important;
        min-width:150px!important;
        padding:8px 14px!important;
        border:1px solid #5a9bd5!important;
        border-radius:6px!important;
        background:#0b315d!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:900!important;
        letter-spacing:.3px!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }

      #coach1189LineOverlay .coach11815MoveBtn.active{
        background:#f1b500!important;
        border-color:#ffe488!important;
        color:#07162d!important;
      }

      #coach1189LineOverlay .coach11815PlacementHint{
        color:#cfeaff!important;
        font-size:10px!important;
        font-weight:800!important;
      }

      #coach1189LineOverlay.coach11815-moving #field .slot{
        cursor:grab!important;
        touch-action:none!important;
        user-select:none!important;
        -webkit-user-select:none!important;
        z-index:40!important;
        box-shadow:0 0 0 3px rgba(255,199,0,.55)!important;
      }

      #coach1189LineOverlay.coach11815-moving #field .slot.coach11815-dragging{
        cursor:grabbing!important;
        z-index:100!important;
        transform:translate(-50%,-50%) scale(1.08)!important;
      }


      /* ---------- 118.16: per-line special teams ---------- */
      #coach1189LineOverlay .coach11816SpecialBtn{
        min-height:36px!important;
        min-width:150px!important;
        padding:8px 14px!important;
        border:1px solid #5a9bd5!important;
        border-radius:6px!important;
        background:#0b315d!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:900!important;
        letter-spacing:.3px!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }

      #coach1189LineOverlay .coach11816SpecialPanel{
        display:none;
        gap:8px!important;
        align-items:center!important;
        justify-content:center!important;
        padding:8px 12px!important;
        background:#03152f!important;
        border-bottom:1px solid #245c93!important;
        position:relative!important;
        z-index:1000005!important;
        pointer-events:auto!important;
      }

      #coach1189LineOverlay .coach11816SpecialPanel.open{
        display:flex!important;
      }

      #coach1189LineOverlay .coach11816UnitBtn{
        min-height:38px!important;
        min-width:130px!important;
        padding:8px 14px!important;
        border:1px solid #4d8bc7!important;
        border-radius:6px!important;
        background:#082242!important;
        color:#eef8ff!important;
        font-size:11px!important;
        font-weight:900!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }

      #coach1189LineOverlay .coach11816UnitBtn.active{
        background:#1689e8!important;
        border-color:#b5e2ff!important;
      }

      #coach1189LineOverlay .coach11816BackBtn{
        min-height:34px!important;
        padding:6px 10px!important;
        border:1px solid #58799d!important;
        border-radius:6px!important;
        background:#07182d!important;
        color:#d8ebff!important;
        font-size:10px!important;
        font-weight:900!important;
        pointer-events:auto!important;
      }


      /* ---------- 118.17: cleaner player cards in expanded line editor ---------- */
      #coach1189LineOverlay #field .slot{
        min-width:68px!important;
        max-width:82px!important;
        padding:4px 5px!important;
        border-width:2px!important;
        border-radius:6px!important;
        font-size:10px!important;
        line-height:1.05!important;
        font-weight:900!important;
        white-space:nowrap!important;
        overflow:visible!important;
        box-shadow:0 2px 8px rgba(0,0,0,.35)!important;
      }

      #coach1189LineOverlay #field .slot small{
        display:block!important;
        width:100%!important;
        max-width:72px!important;
        margin-top:2px!important;
        font-size:8.5px!important;
        line-height:1.05!important;
        font-weight:800!important;
        color:#eef6ff!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      /* NEXT indicators are useful on the dashboard, but clutter the line editor. */
      #coach1189LineOverlay #field .slot.playsNextLine{
        box-shadow:0 2px 8px rgba(0,0,0,.35)!important;
      }

      #coach1189LineOverlay #field .slot.playsNextLine::before,
      #coach1189LineOverlay #field .slot.playsNextLine::after{
        display:none!important;
        content:none!important;
      }

      /* Keep offense/defense borders obvious without oversized glow. */
      #coach1189LineOverlay #field .slot:not(.def){
        border-color:#ef5c54!important;
      }

      #coach1189LineOverlay #field .slot.def{
        border-color:#2da4ff!important;
      }

      /* Special-teams cards get the same cleanup. */
      #coach1189LineOverlay #field .slot.specialSlot{
        min-width:68px!important;
        max-width:82px!important;
        border-color:#f3c547!important;
      }

      @media (orientation:landscape){
        #coach1189LineOverlay #field .slot{
          min-width:66px!important;
          max-width:80px!important;
          font-size:10px!important;
        }
        #coach1189LineOverlay #field .slot small{
          max-width:70px!important;
          font-size:8.5px!important;
        }
      }


      /* ---------- 118.18: move positions for each line's special teams ---------- */
      #coach1189LineOverlay .coach11818MoveSpecialBtn{
        min-height:38px!important;
        min-width:150px!important;
        padding:8px 14px!important;
        border:1px solid #e4b83f!important;
        border-radius:6px!important;
        background:#33280b!important;
        color:#ffe99c!important;
        font-size:11px!important;
        font-weight:900!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }

      #coach1189LineOverlay .coach11818MoveSpecialBtn.active{
        background:#f1b500!important;
        border-color:#ffe488!important;
        color:#07162d!important;
      }

      #coach1189LineOverlay.coach11818-special-moving #field{
        outline:3px solid #f1b500!important;
        outline-offset:-3px!important;
      }

      #coach1189LineOverlay.coach11818-special-moving #field .specialSlot{
        box-shadow:0 0 0 3px rgba(255,199,0,.55)!important;
        cursor:move!important;
        touch-action:none!important;
      }


      /* ---------- 118.19: simplified Plays section ---------- */
      #fivePanelDashboard .fivePanel[data-panel="plays"] #fivePlaysPreview{
        display:none!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="plays"] .coachPlaysFooter{
        display:none!important;
      }

      .coach11819Plays{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        padding:10px!important;
        min-height:0!important;
        overflow:auto!important;
      }

      .coach11819PlayBtn{
        min-height:48px!important;
        padding:8px 10px!important;
        border:1px solid rgba(255,255,255,.28)!important;
        border-radius:7px!important;
        background:#0b3263!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:1000!important;
        letter-spacing:.35px!important;
        text-align:center!important;
        touch-action:manipulation!important;
      }

      .coach11819PlayBtn.gameList{
        grid-column:1 / -1!important;
        background:#0057b8!important;
        border-color:#6bb8ff!important;
      }

      #v114Plays:checked ~ .fivePanelGrid .coach11819Plays{
        grid-template-columns:repeat(3,1fr)!important;
        gap:12px!important;
        padding:16px!important;
        align-content:start!important;
      }

      #v114Plays:checked ~ .fivePanelGrid .coach11819PlayBtn{
        min-height:76px!important;
        font-size:16px!important;
      }

      #v114Plays:checked ~ .fivePanelGrid .coach11819PlayBtn.gameList{
        grid-column:1 / -1!important;
        min-height:62px!important;
      }

      .coach11819ModalHead{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        margin-bottom:12px!important;
      }

      .coach11819ModalHead h2{
        margin:0!important;
      }

      .coach11819PlayList{
        display:grid!important;
        gap:8px!important;
        max-height:58vh!important;
        overflow:auto!important;
      }

      .coach11819PlayRow{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) auto!important;
        gap:10px!important;
        align-items:center!important;
        padding:10px 12px!important;
        border:1px solid #334b68!important;
        border-radius:8px!important;
        background:#0b1523!important;
      }

      .coach11819PlayRow b{
        display:block!important;
        font-size:13px!important;
      }

      .coach11819PlayRow small{
        display:block!important;
        margin-top:3px!important;
        color:#9fb6cd!important;
        font-size:10px!important;
      }

      .coach11819AddBtn{
        min-width:74px!important;
        min-height:36px!important;
        border:1px solid #64b7ff!important;
        border-radius:6px!important;
        background:#0867be!important;
        color:#fff!important;
        font-size:10px!important;
        font-weight:1000!important;
      }

      .coach11819AddBtn.added{
        background:#17462a!important;
        border-color:#5fca8c!important;
        color:#bff4d3!important;
      }

      @media(max-width:700px){
        #v114Plays:checked ~ .fivePanelGrid .coach11819Plays{
          grid-template-columns:1fr 1fr!important;
        }
      }


      /* ---------- 118.20: remove plays from Game Play List ---------- */
      .coach11820RemoveBtn{
        min-width:78px!important;
        min-height:36px!important;
        padding:7px 10px!important;
        border:1px solid #b85763!important;
        border-radius:6px!important;
        background:#3a1118!important;
        color:#ffb7be!important;
        font-size:10px!important;
        font-weight:1000!important;
        touch-action:manipulation!important;
      }

      .coach11820ClearBtn{
        min-height:36px!important;
        padding:7px 12px!important;
        border:1px solid #b85763!important;
        border-radius:6px!important;
        background:#2a0d13!important;
        color:#ffb7be!important;
        font-size:10px!important;
        font-weight:1000!important;
        touch-action:manipulation!important;
      }

      .coach11820GameListHead{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:8px!important;
        flex-wrap:wrap!important;
      }


      /* ---------- 118.21: simplified Stats section ---------- */
      #fivePanelDashboard .fivePanel[data-panel="stats"] #fiveStatsPreview{
        display:none!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="stats"] .coachStatsFooter{
        display:none!important;
      }

      .coach11821Stats{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        padding:10px!important;
        min-height:0!important;
        overflow:auto!important;
      }

      .coach11821StatsBtn{
        min-height:50px!important;
        padding:9px 10px!important;
        border:1px solid #4d84bd!important;
        border-radius:7px!important;
        background:#0b3263!important;
        color:#fff!important;
        font-size:10px!important;
        font-weight:1000!important;
        letter-spacing:.25px!important;
        text-align:center!important;
        touch-action:manipulation!important;
      }

      #v114Stats:checked ~ .fivePanelGrid .coach11821Stats{
        grid-template-columns:1fr 1fr!important;
        gap:14px!important;
        padding:18px!important;
        align-content:start!important;
      }

      #v114Stats:checked ~ .fivePanelGrid .coach11821StatsBtn{
        min-height:86px!important;
        font-size:16px!important;
      }


      /* ---------- 118.22: Player Lines detail ---------- */
      .coach11822LineDetail{
        display:grid!important;
        gap:4px!important;
        margin-top:5px!important;
      }

      .coach11822LineChip{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        padding:5px 7px!important;
        border:1px solid #2f4a67!important;
        border-radius:6px!important;
        background:#0d1c2d!important;
        color:#dcebfa!important;
        font-size:10px!important;
      }

      .coach11822LineChip b{
        font-size:10px!important;
        color:#fff!important;
      }

      .coach11822Pos{
        color:#7fc6ff!important;
        font-weight:900!important;
        text-align:right!important;
      }


      /* ---------- 118.23: Player Participation summary ---------- */
      .coach11823SummaryHead{
        display:grid!important;
        grid-template-columns:1fr 1fr 1fr!important;
        gap:8px!important;
        margin:0 0 12px!important;
      }

      .coach11823SummaryCard{
        padding:10px!important;
        border:1px solid #355678!important;
        border-radius:8px!important;
        background:#0d1b2c!important;
        text-align:center!important;
      }

      .coach11823SummaryCard b{
        display:block!important;
        color:#fff!important;
        font-size:18px!important;
      }

      .coach11823SummaryCard small{
        display:block!important;
        margin-top:2px!important;
        color:#9fb6cd!important;
        font-size:9px!important;
        font-weight:900!important;
      }

      .coach11823PlayerRow{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 70px 64px!important;
        gap:8px!important;
        align-items:center!important;
        padding:9px 10px!important;
        border:1px solid #334b68!important;
        border-radius:8px!important;
        background:#0b1523!important;
      }

      .coach11823PlayerRow .name{
        min-width:0!important;
      }

      .coach11823PlayerRow .name b{
        display:block!important;
        color:#fff!important;
        font-size:12px!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      .coach11823PlayerRow .name small{
        display:block!important;
        margin-top:2px!important;
        color:#9fb6cd!important;
        font-size:9px!important;
      }

      .coach11823Plays,
      .coach11823Pct{
        text-align:right!important;
        font-weight:1000!important;
      }

      .coach11823Plays{
        color:#fff!important;
        font-size:13px!important;
      }

      .coach11823Pct{
        color:#7fc6ff!important;
        font-size:13px!important;
      }

      .coach11823HeaderRow{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 70px 64px!important;
        gap:8px!important;
        padding:0 10px 4px!important;
        color:#7f9bb5!important;
        font-size:8px!important;
        font-weight:1000!important;
        letter-spacing:.4px!important;
      }

      .coach11823HeaderRow span:nth-child(2),
      .coach11823HeaderRow span:nth-child(3){
        text-align:right!important;
      }


      /* ---------- 118.24: Opponent Stats summary ---------- */
      .coach11824OppRow{
        display:grid!important;
        grid-template-columns:58px 72px 64px minmax(0,1fr)!important;
        gap:8px!important;
        align-items:center!important;
        padding:9px 10px!important;
        border:1px solid #334b68!important;
        border-radius:8px!important;
        background:#0b1523!important;
      }

      .coach11824OppRow.warning{
        border-color:#d9a633!important;
        box-shadow:inset 0 0 0 1px rgba(217,166,51,.25)!important;
      }

      .coach11824OppRow b{
        color:#fff!important;
        font-size:13px!important;
      }

      .coach11824OppRow .num{
        font-size:14px!important;
        font-weight:1000!important;
      }

      .coach11824OppRow .apps,
      .coach11824OppRow .pct{
        text-align:right!important;
        font-weight:1000!important;
      }

      .coach11824OppRow .pct{
        color:#7fc6ff!important;
      }

      .coach11824OppRow.warning .pct{
        color:#ffd66b!important;
      }

      .coach11824OppMeta{
        min-width:0!important;
        color:#b9c9da!important;
        font-size:9px!important;
        line-height:1.25!important;
      }

      .coach11824OppHead{
        display:grid!important;
        grid-template-columns:58px 72px 64px minmax(0,1fr)!important;
        gap:8px!important;
        padding:0 10px 4px!important;
        color:#7f9bb5!important;
        font-size:8px!important;
        font-weight:1000!important;
        letter-spacing:.35px!important;
      }

      .coach11824OppHead span:nth-child(2),
      .coach11824OppHead span:nth-child(3){
        text-align:right!important;
      }

      @media(max-width:620px){
        .coach11824OppRow,
        .coach11824OppHead{
          grid-template-columns:52px 58px 52px minmax(0,1fr)!important;
        }
      }


      /* ---------- 118.26: Stats section visual polish ---------- */
      .coach11821StatsBtn{
        position:relative!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:flex-start!important;
        justify-content:center!important;
        text-align:left!important;
        padding:10px 11px 10px 38px!important;
        overflow:hidden!important;
      }

      .coach11821StatsBtn::before{
        position:absolute!important;
        left:10px!important;
        top:50%!important;
        transform:translateY(-50%)!important;
        width:20px!important;
        text-align:center!important;
        font-size:17px!important;
        line-height:1!important;
      }

      .coach11821StatsBtn[data-stat="participation"]::before{content:"%";}
      .coach11821StatsBtn[data-stat="player-lines"]::before{content:"☰";}
      .coach11821StatsBtn[data-stat="opponent-stats"]::before{content:"#";}
      .coach11821StatsBtn[data-stat="opponent-rotation"]::before{content:"↻";}

      .coach11821StatsBtn::after{
        display:block!important;
        margin-top:3px!important;
        color:#9fc1e4!important;
        font-size:8px!important;
        font-weight:800!important;
        letter-spacing:0!important;
        text-transform:none!important;
      }

      .coach11821StatsBtn[data-stat="participation"]::after{content:"Plays and percentages";}
      .coach11821StatsBtn[data-stat="player-lines"]::after{content:"Assignments by player";}
      .coach11821StatsBtn[data-stat="opponent-stats"]::after{content:"Rotation usage and alerts";}
      .coach11821StatsBtn[data-stat="opponent-rotation"]::after{content:"Track the opponent's 11";}

      #v114Stats:checked ~ .fivePanelGrid .coach11821StatsBtn{
        padding-left:54px!important;
      }

      #v114Stats:checked ~ .fivePanelGrid .coach11821StatsBtn::before{
        left:17px!important;
        width:24px!important;
        font-size:22px!important;
      }

      #v114Stats:checked ~ .fivePanelGrid .coach11821StatsBtn::after{
        font-size:10px!important;
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


      /* ---------- 118.27: Call plays from Game Play List ---------- */

      /* ---------- 118.28: Active play indicator ---------- */

      /* ---------- 118.29: Clear active play ---------- */

      /* ---------- 118.30: Game Play List ordering ---------- */
      .coach11830MoveBtns{
        display:flex!important;
        flex-direction:column!important;
        gap:3px!important;
      }
      .coach11830MoveBtn{
        min-width:28px!important;
        padding:3px 6px!important;
        border:1px solid #526b84!important;
        border-radius:5px!important;
        background:#172536!important;
        color:#dce9f6!important;
        font-size:10px!important;
        font-weight:1000!important;
        line-height:1!important;
      }
      .coach11830MoveBtn:disabled{
        opacity:.25!important;
      }

      .coach11829ClearCallBtn{
        border:1px solid #657b91!important;
        background:#172333!important;
        color:#d9e5f1!important;
        border-radius:7px!important;
        padding:7px 10px!important;
        font-size:9px!important;
        font-weight:1000!important;
      }
      .coach11829ClearCallBtn:active{transform:scale(.97)!important;}

      .coach11828ActivePlay{
        border-color:#3f89d8!important;
        background:#102946!important;
        box-shadow:inset 3px 0 0 #5aa9ff!important;
      }

      .coach11828ActiveBadge{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        margin-left:7px!important;
        padding:2px 6px!important;
        border-radius:999px!important;
        background:#1c5f9f!important;
        color:#fff!important;
        font-size:8px!important;
        font-weight:1000!important;
        letter-spacing:.35px!important;
        vertical-align:middle!important;
      }

      .coach11827CallBtn.is-active{
        opacity:.7!important;
        cursor:default!important;
      }

      .coach11827PlayActions{
        display:flex!important;
        gap:6px!important;
        align-items:center!important;
        flex-shrink:0!important;
      }

      .coach11827CallBtn{
        border:1px solid #4e90d5!important;
        background:#14385e!important;
        color:#fff!important;
        border-radius:7px!important;
        padding:7px 10px!important;
        font-size:9px!important;
        font-weight:1000!important;
      }

      .coach11827CallBtn:active{
        transform:scale(.97)!important;
      }

      .coach11827Hint{
        margin:0 0 10px!important;
        color:#9fb6cd!important;
        font-size:10px!important;
        font-weight:800!important;
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

  let coach1189FieldHome = null;
  let coach1189FieldNext = null;

  function coach1189SelectedLineText() {
    return String(
      document.querySelector("#lineSelect option:checked")?.textContent || ""
    ).replace(/\s+/g, " ").trim();
  }

  function coach1189SelectLine(lineName) {
    const select = document.getElementById("lineSelect");
    if (!select) return false;

    const wanted = String(lineName || "").replace(/\s+/g, " ").trim().toUpperCase();
    const options = Array.from(select.options || []);
    const option = options.find(function(opt) {
      return String(opt.textContent || opt.label || "").replace(/\s+/g, " ").trim().toUpperCase() === wanted;
    }) || options.find(function(opt) {
      return String(opt.textContent || opt.label || "").toUpperCase().indexOf(wanted) >= 0;
    });

    if (!option) return false;

    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  }

  function coach1189EnsureOverlay() {
    let overlay = document.getElementById("coach1189LineOverlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "coach1189LineOverlay";
    overlay.className = "coach1189LineOverlay hidden";
    overlay.innerHTML =
      '<div class="coach1189LineHeader">' +
        '<button type="button" id="coach1189Back">← PLAY LINES</button>' +
        '<b id="coach1189Title">LINE</b>' +
        '<span class="coach11812TapHint">TAP ANY PLAYER TO REPLACE</span>' +
      '</div>' +
      '<div class="coach1189FieldHost" id="coach1189FieldHost"></div>';

    document.body.appendChild(overlay);

    overlay.querySelector("#coach1189Back").addEventListener("click", function(event) {
      event.preventDefault();
      event.stopPropagation();
      coach1189CloseLineField();
    });

    return overlay;
  }

  function coach1189OpenLineField(lineName) {
    const field = document.getElementById("field");
    if (!field) return;

    coach1189SelectLine(lineName);

    setTimeout(function() {
      try {
        if (typeof renderAll === "function") renderAll();
        else if (typeof renderField === "function") renderField();
      } catch (error) {
        console.warn("118.9 line render:", error);
      }

      const liveField = document.getElementById("field");
      if (!liveField) return;

      const overlay = coach1189EnsureOverlay();
      const host = overlay.querySelector("#coach1189FieldHost");

      if (!coach1189FieldHome) {
        coach1189FieldHome = liveField.parentNode;
        coach1189FieldNext = liveField.nextSibling;
      }

      overlay.querySelector("#coach1189Title").textContent =
        coach1189SelectedLineText() || lineName || "LINE";

      host.appendChild(liveField);
      overlay.classList.remove("hidden");

      requestAnimationFrame(function() {
        try {
          if (typeof renderField === "function") renderField();
        } catch (error) {
          console.warn("118.12 overlay refresh:", error);
        }
        coach11812RefreshEditableField();
        coach11813RenderLineTabs();
        coach11814RenderSwitchBar();
        coach11815RefreshPlacementEditor();
      });
    }, 70);
  }






  let coach11816SpecialOpen=false;
  let coach11816ActiveType="";
  let coach11818SpecialMoveMode=false;


  function coach11818ToggleSpecialMove(){
    if(!coach11816ActiveType) return;

    coach11818SpecialMoveMode=!coach11818SpecialMoveMode;
    editFieldMode=coach11818SpecialMoveMode;

    const overlay=document.getElementById("coach1189LineOverlay");
    overlay?.classList.toggle("coach11818-special-moving",coach11818SpecialMoveMode);

    try{
      if(typeof renderField==="function") renderField();
    }catch(error){
      console.warn("118.18 special move:",error);
    }

    coach11816RenderControls();
  }

  function coach11818StopSpecialMove(){
    coach11818SpecialMoveMode=false;
    editFieldMode=false;
    document.getElementById("coach1189LineOverlay")?.classList.remove("coach11818-special-moving");
  }

  function coach11816SafeName(value){
    return String(value||"LINE").trim().replace(/\s+/g," ");
  }

  function coach11816UnitName(type){
    const lineName=coach11816SafeName(lines?.[currentLine]?.name || `Line ${currentLine+1}`);
    return `${lineName} — ${type}`;
  }

  function coach11816DefaultsFor(type){
    if(type==="KICKOFF") return (typeof SPECIAL_DEFAULTS!=="undefined" && SPECIAL_DEFAULTS["Kickoff"]) || [];
    if(type==="PUNT") return (typeof SPECIAL_DEFAULTS!=="undefined" && SPECIAL_DEFAULTS["Punt"]) || [];
    return (typeof SPECIAL_DEFAULTS!=="undefined" && (SPECIAL_DEFAULTS["Kick Return"] || SPECIAL_DEFAULTS["Punt Return"])) || [];
  }

  async function coach11816EnsureUnit(type){
    const wanted=coach11816UnitName(type);
    let index=Array.isArray(specialUnits)
      ? specialUnits.findIndex(u=>String(u?.name||"")===wanted)
      : -1;

    if(index>=0) return index;
    if(typeof roleCanEdit==="function" && !roleCanEdit()){
      alert("Coach access is required to create a special-teams unit.");
      return -1;
    }

    try{
      const order=(Array.isArray(specialUnits)?specialUnits.length:0)+100+(currentLine*10);
      const result=await sb.from("special_team_units")
        .insert({team_id:team.id,name:wanted,sort_order:order})
        .select()
        .single();

      if(result.error) throw result.error;
      const unit=result.data;
      const defs=coach11816DefaultsFor(type);

      if(defs.length){
        const slots=defs.map((x,i)=>({
          unit_id:unit.id,
          slot_key:x[0],
          label:x[1],
          x_pct:x[2],
          y_pct:x[3],
          sort_order:i
        }));
        const slotResult=await sb.from("special_team_slots").insert(slots);
        if(slotResult.error) throw slotResult.error;
      }

      if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
      index=specialUnits.findIndex(u=>String(u?.id)===String(unit.id));
      return index;
    }catch(error){
      console.error("118.16 create special team:",error);
      alert(error?.message || "Could not create this special-teams unit.");
      return -1;
    }
  }

  async function coach11816OpenUnit(type){
    coach11818StopSpecialMove();
    const index=await coach11816EnsureUnit(type);
    if(index<0) return;

    coach11816ActiveType=type;
    currentSpecialUnit=index;
    activeView="special";
    coach11818StopSpecialMove();
    coach11816ActiveType="";
    coach11816SpecialOpen=false;
    activeView="offense";
        coach11815MoveMode=false;

    const overlay=document.getElementById("coach1189LineOverlay");
    overlay?.classList.remove("coach11815-moving");

    try{
      if(typeof renderField==="function") renderField();
      if(typeof renderSpecialUnitSelect==="function") renderSpecialUnitSelect();
    }catch(error){
      console.warn("118.16 render special:",error);
    }

    const title=document.getElementById("coach1189LineTitle");
    if(title) title.textContent=`${coach11816SafeName(lines?.[currentLine]?.name)} • ${type}`;

    coach11816RenderControls();
  }

  function coach11816BackToLine(){
    coach11818StopSpecialMove();
    coach11816ActiveType="";
    activeView="offense";

    try{
      if(typeof setUnifiedFieldView==="function") setUnifiedFieldView();
      else if(typeof renderField==="function") renderField();
    }catch(error){
      console.warn("118.16 back to line:",error);
    }

    const title=document.getElementById("coach1189LineTitle");
    if(title) title.textContent=coach11816SafeName(lines?.[currentLine]?.name).toUpperCase();

    coach11812RefreshEditableField();
    coach11815RefreshPlacementEditor();
    coach11816RenderControls();
  }

  function coach11816RenderControls(){
    const overlay=document.getElementById("coach1189LineOverlay");
    if(!overlay || overlay.classList.contains("hidden")) return;

    const placementBar=overlay.querySelector(".coach11815PlacementBar");
    if(!placementBar) return;

    let specialBtn=placementBar.querySelector(".coach11816SpecialBtn");
    if(!specialBtn){
      specialBtn=document.createElement("button");
      specialBtn.type="button";
      specialBtn.className="coach11816SpecialBtn";
      specialBtn.textContent="★ SPECIAL TEAMS";
      placementBar.appendChild(specialBtn);
    }

    let panel=overlay.querySelector(".coach11816SpecialPanel");
    if(!panel){
      panel=document.createElement("div");
      panel.className="coach11816SpecialPanel";
      placementBar.insertAdjacentElement("afterend",panel);
    }

    specialBtn.onclick=(event)=>{
      event.preventDefault();
      event.stopPropagation();
      coach11816SpecialOpen=!coach11816SpecialOpen;
      coach11816RenderControls();
    };

    panel.classList.toggle("open",coach11816SpecialOpen || !!coach11816ActiveType);
    panel.innerHTML=`
      ${coach11816ActiveType?'<button type="button" class="coach11816BackBtn">← BACK TO OFFENSE / DEFENSE</button>':''}
      ${coach11816ActiveType?`<button type="button" class="coach11818MoveSpecialBtn ${coach11818SpecialMoveMode?'active':''}">${coach11818SpecialMoveMode?'✓ DONE MOVING':'↔ MOVE POSITIONS'}</button>`:''}
      ${["KICKOFF","PUNT","RETURN"].map(type=>`
        <button type="button" class="coach11816UnitBtn ${coach11816ActiveType===type?'active':''}" data-type="${type}">
          ${type}
        </button>`).join("")}
    `;

    panel.querySelectorAll(".coach11816UnitBtn").forEach(btn=>{
      btn.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        coach11816OpenUnit(btn.dataset.type);
      };
    });

    const moveSpecial=panel.querySelector(".coach11818MoveSpecialBtn");
    if(moveSpecial){
      moveSpecial.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        coach11818ToggleSpecialMove();
      };
    }

    const back=panel.querySelector(".coach11816BackBtn");
    if(back){
      back.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        coach11816BackToLine();
      };
    }
  }

  let coach11815MoveMode=false;

  function coach11815StorageKey(){
    const teamId=(typeof team!=="undefined" && team?.id) ? String(team.id) : "team";
    const lineId=(Array.isArray(lines) && lines[currentLine]?.id) ? String(lines[currentLine].id) : String(currentLine);
    return `coachLineupLinePlacement:v1:${teamId}:${lineId}`;
  }

  function coach11815ReadPlacements(){
    try{
      return JSON.parse(localStorage.getItem(coach11815StorageKey())||"{}")||{};
    }catch{
      return {};
    }
  }

  function coach11815WritePlacements(data){
    try{
      localStorage.setItem(coach11815StorageKey(),JSON.stringify(data||{}));
    }catch(error){
      console.warn("118.15 placement save:",error);
    }
  }

  function coach11815ApplyPlacements(){
    const overlay=document.getElementById("coach1189LineOverlay");
    const field=document.getElementById("field");
    if(!overlay || overlay.classList.contains("hidden") || !field || !Array.isArray(positions)) return;

    const saved=coach11815ReadPlacements();
    const regularPositions=positions.filter(pos=>pos && (pos.side==="offense" || pos.side==="defense"));
    const slots=Array.from(field.querySelectorAll(".slot"));

    slots.forEach((slot,index)=>{
      const pos=regularPositions[index];
      if(!pos?.id) return;
      slot.dataset.coach11815PositionId=String(pos.id);
      const p=saved[String(pos.id)];
      if(p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))){
        slot.style.left=Math.max(2,Math.min(98,Number(p.x)))+"%";
        slot.style.top=Math.max(4,Math.min(96,Number(p.y)))+"%";
      }
    });
  }

  function coach11815RenderPlacementBar(){
    const overlay=document.getElementById("coach1189LineOverlay");
    if(!overlay || overlay.classList.contains("hidden")) return;

    let bar=overlay.querySelector(".coach11815PlacementBar");
    if(!bar){
      bar=document.createElement("div");
      bar.className="coach11815PlacementBar";
      const switchBar=overlay.querySelector(".coach11814SwitchBar");
      if(switchBar) switchBar.insertAdjacentElement("afterend",bar);
      else{
        const head=overlay.querySelector(".coach1189Head");
        if(head) head.insertAdjacentElement("afterend",bar);
      }
    }

    bar.innerHTML=`
      <button type="button" class="coach11815MoveBtn ${coach11815MoveMode?'active':''}">
        ${coach11815MoveMode?'✓ DONE MOVING':'↔ MOVE PLAYERS'}
      </button>
      <span class="coach11815PlacementHint">
        ${coach11815MoveMode?'Drag any player box, then tap DONE MOVING.':'Placement is saved for this line on this device.'}
      </span>`;

    coach11816RenderControls();

    const btn=bar.querySelector(".coach11815MoveBtn");
    if(btn){
      btn.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        coach11815MoveMode=!coach11815MoveMode;
        overlay.classList.toggle("coach11815-moving",coach11815MoveMode);
        coach11815RenderPlacementBar();
        coach11815WirePlacementDrag();
        if(!coach11815MoveMode) coach11812RefreshEditableField();
      };
    }
  }

  function coach11815WirePlacementDrag(){
    const overlay=document.getElementById("coach1189LineOverlay");
    const field=document.getElementById("field");
    if(!overlay || overlay.classList.contains("hidden") || !field) return;

    coach11815ApplyPlacements();

    field.querySelectorAll(".slot").forEach(slot=>{
      if(slot.dataset.coach11815DragBound==="1") return;
      slot.dataset.coach11815DragBound="1";

      slot.addEventListener("pointerdown",event=>{
        if(!coach11815MoveMode) return;
        const positionId=slot.dataset.coach11815PositionId;
        if(!positionId) return;

        event.preventDefault();
        event.stopPropagation();

        slot.classList.add("coach11815-dragging");
        try{ slot.setPointerCapture(event.pointerId); }catch{}

        const move=e=>{
          if(!coach11815MoveMode) return;
          const rect=field.getBoundingClientRect();
          if(!rect.width || !rect.height) return;

          const x=Math.max(2,Math.min(98,((e.clientX-rect.left)/rect.width)*100));
          const y=Math.max(4,Math.min(96,((e.clientY-rect.top)/rect.height)*100));

          slot.style.left=x+"%";
          slot.style.top=y+"%";

          const saved=coach11815ReadPlacements();
          saved[String(positionId)]={x:Number(x.toFixed(2)),y:Number(y.toFixed(2))};
          coach11815WritePlacements(saved);
        };

        const end=e=>{
          event.preventDefault();
          event.stopPropagation();
          slot.classList.remove("coach11815-dragging");
          slot.removeEventListener("pointermove",move);
          slot.removeEventListener("pointerup",end);
          slot.removeEventListener("pointercancel",end);
          try{ slot.releasePointerCapture(event.pointerId); }catch{}
        };

        slot.addEventListener("pointermove",move);
        slot.addEventListener("pointerup",end);
        slot.addEventListener("pointercancel",end);
      },true);
    });
  }

  function coach11815RefreshPlacementEditor(){
    coach11815MoveMode=false;
    const overlay=document.getElementById("coach1189LineOverlay");
    if(overlay) overlay.classList.remove("coach11815-moving");
    coach11815RenderPlacementBar();
    coach11815ApplyPlacements();
    coach11815WirePlacementDrag();
    setTimeout(()=>{
      coach11815ApplyPlacements();
      coach11815WirePlacementDrag();
    },120);
  }

  function coach11814RenderSwitchBar(){
    const overlay=document.getElementById("coach1189LineOverlay");
    if(!overlay || overlay.classList.contains("hidden") || !Array.isArray(lines)) return;

    let bar=overlay.querySelector(".coach11814SwitchBar");
    if(!bar){
      bar=document.createElement("div");
      bar.className="coach11814SwitchBar";

      const head=overlay.querySelector(".coach1189Head");
      if(head && head.parentNode){
        head.insertAdjacentElement("afterend",bar);
      }else{
        overlay.prepend(bar);
      }
    }

    bar.innerHTML=lines.map((line,index)=>{
      const name=String(line?.name||`LINE ${index+1}`).toUpperCase();
      return `<button type="button" class="coach11814SwitchBtn ${index===currentLine?'active':''}" data-index="${index}">${name}</button>`;
    }).join("");

    bar.querySelectorAll(".coach11814SwitchBtn").forEach(btn=>{
      btn.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        const index=Number(btn.dataset.index);
        coach11813SwitchLine(index);
        setTimeout(coach11814RenderSwitchBar,100);
      };
    });
  }

  function coach11813RenderLineTabs(){
    const overlay=document.getElementById("coach1189LineOverlay");
    if(!overlay || overlay.classList.contains("hidden") || !Array.isArray(lines)) return;
    const head=overlay.querySelector(".coach1189Head");
    if(!head) return;

    let tabs=head.querySelector(".coach11813LineTabs");
    if(!tabs){
      tabs=document.createElement("div");
      tabs.className="coach11813LineTabs";
      const title=head.querySelector("h2");
      if(title) title.insertAdjacentElement("afterend",tabs);
      else head.appendChild(tabs);
    }

    tabs.innerHTML=lines.map((line,index)=>{
      const name=String(line?.name||`LINE ${index+1}`).toUpperCase();
      return `<button type="button" class="coach11813LineTab ${index===currentLine?'active':''}" data-index="${index}">${name}</button>`;
    }).join("");

    tabs.querySelectorAll(".coach11813LineTab").forEach(btn=>{
      btn.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        coach11813SwitchLine(Number(btn.dataset.index));
      };
    });
  }

  function coach11813SwitchLine(index){
    if(!Number.isInteger(index) || !lines[index]) return;
    coach11816ActiveType="";
    coach11816SpecialOpen=false;
    activeView="offense";
    try{ if(typeof setUnifiedFieldView==="function") setUnifiedFieldView(); }catch{}
    const select=document.getElementById("lineSelect");
    if(select){
      select.selectedIndex=index;
      select.dispatchEvent(new Event("change",{bubbles:true}));
    }else{
      currentLine=index;
      if(typeof renderAll==="function") renderAll();
      else if(typeof renderField==="function") renderField();
    }

    setTimeout(()=>{
      const title=document.getElementById("coach1189LineTitle");
      if(title) title.textContent=String(lines[currentLine]?.name||"LINE").toUpperCase();
      coach11813RenderLineTabs();
      coach11814RenderSwitchBar();
      coach11812RefreshEditableField();
      coach11815RefreshPlacementEditor();
    },80);
  }

  function coach11812WirePlayerTaps() {
    const overlay = document.getElementById("coach1189LineOverlay");
    const field = document.getElementById("field");
    if (!overlay || overlay.classList.contains("hidden") || !field) return;

    document.body.classList.add("coach11812-line-editing");

    const regularPositions =
      (typeof positions !== "undefined" && Array.isArray(positions))
        ? positions.filter(function(pos) {
            return pos && (pos.side === "offense" || pos.side === "defense");
          })
        : [];

    const slots = Array.from(field.querySelectorAll(".slot"));
    slots.forEach(function(slot, index) {
      const pos = regularPositions[index];
      if (!pos || !pos.id) return;

      slot.dataset.coach11812PositionId = String(pos.id);
      slot.dataset.coach11812Side = String(pos.side || "");

      slot.onclick = function(event) {
        if (coach11815MoveMode) return;
        event.preventDefault();
        event.stopPropagation();

        try {
          if (typeof openReplacePlayerModal !== "function") return;

          /* openReplacePlayerModal reads activeView to decide offense/defense.
             Use the tapped position's real side while the picker is built. */
          const priorView = (typeof activeView !== "undefined") ? activeView : "offense";
          activeView = pos.side;
          openReplacePlayerModal(pos.id);
          activeView = priorView;
        } catch (error) {
          console.warn("118.12 player replace:", error);
        }
      };
    });
  }

  function coach11812RefreshEditableField() {
    coach11812WirePlayerTaps();
    setTimeout(coach11812WirePlayerTaps, 40);
    setTimeout(coach11812WirePlayerTaps, 140);
  }

  function coach1189CloseLineField() {
    const overlay = document.getElementById("coach1189LineOverlay");
    const field = document.getElementById("field");

    if (field && coach1189FieldHome) {
      if (coach1189FieldNext && coach1189FieldNext.parentNode === coach1189FieldHome) {
        coach1189FieldHome.insertBefore(field, coach1189FieldNext);
      } else {
        coach1189FieldHome.appendChild(field);
      }
    }

    if (overlay) overlay.classList.add("hidden");
    document.body.classList.remove("coach11812-line-editing");
    coach11815MoveMode=false;
    document.getElementById("coach1189LineOverlay")?.classList.remove("coach11815-moving");

    try {
      if (typeof renderAll === "function") renderAll();
    } catch (error) {
      console.warn("118.9 restore:", error);
    }

    setTimeout(build1182ReadableLines, 60);
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
      const selectedText = String(
        document.querySelector("#lineSelect option:checked")?.textContent || ""
      ).toUpperCase();
      const live = selectedText.indexOf(key) >= 0;

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
      row.setAttribute("aria-label", "Open " + item.name + " field");
      row.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        coach1189OpenLineField(item.name);
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


  function bind11811LineControls() {
    const undo = document.getElementById("v112UndoPlayBtn");
    const next = document.getElementById("v112NextLineBtn");

    [[undo,"prevBtn"],[next,"nextBtn"]].forEach(function(pair) {
      const button = pair[0];
      const targetId = pair[1];
      if (!button || button.dataset.coach11811Bound === "1") return;

      button.dataset.coach11811Bound = "1";
      button.removeAttribute("onclick");

      button.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();

        const target = document.getElementById(targetId);
        if (target) target.click();

        setTimeout(function() {
          if (typeof renderFivePanelRealData === "function") renderFivePanelRealData();
          if (typeof build1182ReadableLines === "function") build1182ReadableLines();
        }, 90);
      });
    });
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


  function coach11819Esc(value){
    return String(value??"").replace(/[&<>"']/g,ch=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }

  function coach11819GameListKey(){
    const id=(typeof team!=="undefined" && team?.id) ? String(team.id) : "team";
    return `coachLineupGamePlayList:v1:${id}`;
  }

  function coach11819ReadGameList(){
    try{
      const value=JSON.parse(localStorage.getItem(coach11819GameListKey())||"[]");
      return Array.isArray(value)?value:[];
    }catch{
      return [];
    }
  }

  function coach11819WriteGameList(ids){
    try{
      localStorage.setItem(coach11819GameListKey(),JSON.stringify(Array.from(new Set(ids||[]))));
    }catch(error){
      console.warn("118.19 game play list:",error);
    }
  }

  function coach11819CategoryMatch(play,type){
    const raw=String(play?.category||"").trim().toLowerCase();

    if(type==="PASSING"){
      return raw.includes("pass") || raw.includes("throw");
    }

    if(type==="RUNNING"){
      return raw.includes("run") || raw.includes("rush");
    }

    if(type==="KICKING"){
      return raw.includes("kick") || raw.includes("punt") || raw.includes("field goal") ||
             raw.includes("extra point") || raw.includes("pat");
    }

    return false;
  }

  function coach11819PlayTitle(play){
    return play?.name || play?.play_name || play?.play_code || play?.code || "Play";
  }

  function coach11819PlayMeta(play){
    const pieces=[
      play?.play_code || play?.code,
      play?.formation,
      play?.category
    ].filter(Boolean);
    return pieces.join(" • ");
  }

  function coach11819AddPlay(playId){
    const ids=coach11819ReadGameList();
    const id=String(playId);
    if(!ids.map(String).includes(id)){
      ids.push(id);
      coach11819WriteGameList(ids);
    }
  }

  function coach11819OpenCategory(type){
    const all=(typeof playbookPlays!=="undefined" && Array.isArray(playbookPlays))
      ? playbookPlays
      : [];

    const selected=all.filter(play=>coach11819CategoryMatch(play,type));
    const gameIds=coach11819ReadGameList().map(String);

    const rows=selected.length
      ? selected.map(play=>{
          const id=String(play.id);
          const added=gameIds.includes(id);
          return `
            <div class="coach11819PlayRow">
              <div>
                <b>${coach11819Esc(coach11819PlayTitle(play))}</b>
                <small>${coach11819Esc(coach11819PlayMeta(play))}</small>
              </div>
              <button type="button"
                class="coach11819AddBtn ${added?'added':''}"
                data-play-id="${coach11819Esc(id)}"
                ${added?'disabled':''}>
                ${added?'✓ ADDED':'ADD'}
              </button>
            </div>`;
        }).join("")
      : `<div class="notice">No ${coach11819Esc(type.toLowerCase())} plays are currently saved in the playbook.</div>`;

    if(typeof openModal!=="function") return;

    openModal(`
      <div class="coach11819ModalHead">
        <h2>${coach11819Esc(type)}</h2>
        <button type="button" class="secondary" data-coach11819-close>✕ CLOSE</button>
      </div>
      ${selected.length?'<div class="coach11827Hint">Tap CALL to make that the active play for the next recorded play.</div>':''}
      <div class="coach11819PlayList">${rows}</div>
    `);

    const modalBody=document.getElementById("modalBody");
    modalBody?.querySelector("[data-coach11819-close]")?.addEventListener("click",()=>closeModal());

    modalBody?.querySelectorAll(".coach11819AddBtn:not(.added)").forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();
        const id=btn.dataset.playId;
        coach11819AddPlay(id);
        btn.textContent="✓ ADDED";
        btn.classList.add("added");
        btn.disabled=true;
      });
    });
  }


  function coach11820RemovePlay(playId){
    const id=String(playId);
    const ids=coach11819ReadGameList().map(String).filter(x=>x!==id);
    coach11819WriteGameList(ids);
    coach11819OpenGameList();
  }

  function coach11820ClearGameList(){
    coach11819WriteGameList([]);
    coach11819OpenGameList();
  }

  function coach11819OpenGameList(){
    const all=(typeof playbookPlays!=="undefined" && Array.isArray(playbookPlays))
      ? playbookPlays
      : [];
    const ids=coach11819ReadGameList().map(String);
    const selected=ids.map(id=>all.find(play=>String(play?.id)===id)).filter(Boolean);

    const activePlayId=(typeof pendingCalledPlay!=="undefined" && pendingCalledPlay?.id!=null)
      ? String(pendingCalledPlay.id)
      : "";

    const rows=selected.length
      ? selected.map((play,index)=>{
          const isActive=activePlayId && String(play.id)===activePlayId;
          return `
          <div class="coach11819PlayRow ${isActive?'coach11828ActivePlay':''}">
            <div>
              <b>${index+1}. ${coach11819Esc(coach11819PlayTitle(play))}${isActive?'<span class="coach11828ActiveBadge">ACTIVE</span>':''}</b>
              <small>${coach11819Esc(coach11819PlayMeta(play))}</small>
            </div>
            <div class="coach11827PlayActions">
              <div class="coach11830MoveBtns">
                <button type="button" class="coach11830MoveBtn"
                  data-move-play="${coach11819Esc(String(play.id))}" data-direction="-1"
                  ${index===0?'disabled':''}>▲</button>
                <button type="button" class="coach11830MoveBtn"
                  data-move-play="${coach11819Esc(String(play.id))}" data-direction="1"
                  ${index===selected.length-1?'disabled':''}>▼</button>
              </div>
              <button type="button"
                class="coach11827CallBtn ${isActive?'is-active':''}"
                data-call-play="${coach11819Esc(String(play.id))}"
                ${isActive?'disabled':''}>
                ${isActive?'CALLED':'CALL'}
              </button>
              <button type="button"
                class="coach11820RemoveBtn"
                data-remove-play="${coach11819Esc(String(play.id))}">
                REMOVE
              </button>
            </div>
          </div>`;
        }).join("")
      : `<div class="notice">Your Game Play List is empty. Choose Passing, Running, or Kicking and add plays.</div>`;

    if(typeof openModal!=="function") return;

    openModal(`
      <div class="coach11819ModalHead coach11820GameListHead">
        <h2>GAME PLAY LIST</h2>
        <div style="display:flex;gap:8px;align-items:center">
          ${activePlayId?'<button type="button" class="coach11829ClearCallBtn" data-coach11829-clear-call>CLEAR ACTIVE</button>':''}
          ${selected.length?'<button type="button" class="coach11820ClearBtn" data-coach11820-clear>CLEAR LIST</button>':''}
          <button type="button" class="secondary" data-coach11819-close>✕ CLOSE</button>
        </div>
      </div>
      <div class="coach11819PlayList">${rows}</div>
    `);

    const modalBody=document.getElementById("modalBody");

    modalBody
      ?.querySelector("[data-coach11819-close]")
      ?.addEventListener("click",()=>closeModal());

    modalBody
      ?.querySelector("[data-coach11829-clear-call]")
      ?.addEventListener("click",event=>{
        event.preventDefault();
        if(typeof clearCalledPlay==="function"){
          clearCalledPlay();
        }else{
          if(typeof pendingCalledPlay!=="undefined") pendingCalledPlay=null;
          if(typeof renderCalledPlay==="function") renderCalledPlay();
        }
        coach11819OpenGameList();
      });

    modalBody
      ?.querySelector("[data-coach11820-clear]")
      ?.addEventListener("click",event=>{
        event.preventDefault();
        coach11820ClearGameList();
      });

    modalBody
      ?.querySelectorAll("[data-move-play]")
      ?.forEach(btn=>{
        btn.addEventListener("click",event=>{
          event.preventDefault();
          const ids=coach11819ReadGameList().map(String);
          const id=String(btn.dataset.movePlay||"");
          const from=ids.indexOf(id);
          const to=from+Number(btn.dataset.direction||0);
          if(from<0 || to<0 || to>=ids.length) return;
          [ids[from],ids[to]]=[ids[to],ids[from]];
          coach11819WriteGameList(ids);
          coach11819OpenGameList();
        });
      });

    modalBody
      ?.querySelectorAll("[data-call-play]")
      ?.forEach(btn=>{
        btn.addEventListener("click",event=>{
          event.preventDefault();
          const playId=btn.dataset.callPlay;

          if(typeof choosePlayForGame==="function"){
            choosePlayForGame(playId);
            return;
          }

          const play=all.find(item=>String(item?.id)===String(playId));
          if(!play) return;

          if(typeof currentGame!=="undefined" && !currentGame){
            alert("Start a game before calling a play.");
            return;
          }

          if(typeof pendingCalledPlay!=="undefined"){
            pendingCalledPlay=play;
          }

          closeModal();
          if(typeof renderCalledPlay==="function") renderCalledPlay();
        });
      });

    modalBody
      ?.querySelectorAll("[data-remove-play]")
      ?.forEach(btn=>{
        btn.addEventListener("click",event=>{
          event.preventDefault();
          coach11820RemovePlay(btn.dataset.removePlay);
        });
      });
  }

  function coach11819BuildPlays(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel) return;

    let box=panel.querySelector(".coach11819Plays");
    if(!box){
      box=document.createElement("div");
      box.className="coach11819Plays";
      panel.appendChild(box);
    }

    box.innerHTML=`
      <button type="button" class="coach11819PlayBtn" data-type="PASSING">PASSING</button>
      <button type="button" class="coach11819PlayBtn" data-type="RUNNING">RUNNING</button>
      <button type="button" class="coach11819PlayBtn" data-type="KICKING">KICKING</button>
      <button type="button" class="coach11819PlayBtn gameList" data-game-list="1">GAME PLAY LIST</button>
    `;

    box.querySelectorAll("[data-type]").forEach(btn=>{
      btn.onclick=event=>{
        event.preventDefault();
        event.stopPropagation();
        coach11819OpenCategory(btn.dataset.type);
      };
    });

    box.querySelector("[data-game-list]")?.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      coach11819OpenGameList();
    });
  }




  function coach11832OpenRoster(filter="all"){
    let list=(typeof players!=="undefined" && Array.isArray(players)) ? players.slice() : [];

    if(filter==="unassigned"){
      const assignList=(typeof assignments!=="undefined" && Array.isArray(assignments)) ? assignments : [];
      list=list.filter(player=>!assignList.some(a=>
        String(a.player_id)===String(player.id) && a.line_id!=null
      ));
    }else if(filter!=="all"){
      list=list.filter(player=>String(player.availability_status||"active").toLowerCase()===filter);
    }

    list.sort((a,b)=>{
      const an=Number(a.jersey_number ?? a.number ?? 9999);
      const bn=Number(b.jersey_number ?? b.number ?? 9999);
      return an-bn;
    });

    const rows=list.map(player=>{
      const jersey=player.jersey_number ?? player.number ?? "";
      const name=player.name || player.full_name || "Player";
      const status=String(player.availability_status||"active").toLowerCase();
      const label=status==="injured" ? "INJURED" : status==="out" ? "OUT" : "ACTIVE";
      const assignList=(typeof assignments!=="undefined" && Array.isArray(assignments)) ? assignments : [];
      const lineIds=Array.from(new Set(
        assignList
          .filter(a=>String(a.player_id)===String(player.id) && a.line_id!=null)
          .map(a=>String(a.line_id))
      ));
      const lineCount=lineIds.length;
      const lineList=(typeof lines!=="undefined" && Array.isArray(lines)) ? lines : [];
      const lineNames=lineIds
        .map(id=>lineList.find(line=>String(line.id)===id)?.name)
        .filter(Boolean);

      return `
        <div class="coach11832RosterRow ${lineCount===0?"coach11837Unassigned":""}">
          <div class="coach11835PlayerInfo">
            <b>${jersey!==""?"#"+coach11819Esc(jersey)+" ":""}${coach11819Esc(name)}</b>
            <small>${lineCount} ${lineCount===1?"LINE":"LINES"} ASSIGNED</small>
            ${lineNames.length?`<span class="coach11836LineNames">${coach11819Esc(lineNames.join(" • "))}</span>`:""}
            ${lineCount===0?'<span class="coach11837UnassignedBadge">NEEDS LINE ASSIGNMENT</span>':""}
          </div>
          <span class="coach11832Status ${status}">${label}</span>
        </div>`;
    }).join("");

    if(typeof openModal!=="function") return;
    openModal(`
      <div class="coach11819ModalHead">
        <h2>PLAYERS</h2>
        <div style="display:flex;gap:8px">
          <button type="button" class="primary" data-coach11832-manage>MANAGE ROSTER</button>
          <button type="button" class="secondary" data-coach11832-close>✕ CLOSE</button>
        </div>
      </div>
      <div class="coach11833Filters coach11838Five">
        <button type="button" class="coach11833Filter ${filter==="all"?"active":""}" data-player-filter="all">ALL</button>
        <button type="button" class="coach11833Filter ${filter==="active"?"active":""}" data-player-filter="active">ACTIVE</button>
        <button type="button" class="coach11833Filter ${filter==="injured"?"active":""}" data-player-filter="injured">INJURED</button>
        <button type="button" class="coach11833Filter ${filter==="out"?"active":""}" data-player-filter="out">OUT</button>
        <button type="button" class="coach11833Filter coach11838Needs ${filter==="unassigned"?"active":""}" data-player-filter="unassigned">NEEDS LINE</button>
      </div>
      <div class="coach11832RosterList">${rows || '<div class="notice">No players found for this status.</div>'}</div>
    `);

    const body=document.getElementById("modalBody");
    body?.querySelectorAll("[data-player-filter]")?.forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();
        coach11832OpenRoster(btn.dataset.playerFilter||"all");
      });
    });
    body?.querySelector("[data-coach11832-close]")?.addEventListener("click",()=>closeModal());
    body?.querySelector("[data-coach11832-manage]")?.addEventListener("click",()=>{
      closeModal();
      if(typeof openRosterManager==="function") openRosterManager();
    });
  }

  function coach11831BuildPlayersSummary(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="players"]');
    if(!panel) return;

    const list=(typeof players!=="undefined" && Array.isArray(players)) ? players : [];
    const active=list.filter(p=>String(p.availability_status||"active").toLowerCase()==="active").length;
    const injured=list.filter(p=>String(p.availability_status||"").toLowerCase()==="injured").length;
    const out=list.filter(p=>String(p.availability_status||"").toLowerCase()==="out").length;

    let box=panel.querySelector(".coach11831PlayerSummary");
    if(!box){
      box=document.createElement("div");
      box.className="coach11831PlayerSummary";
      panel.appendChild(box);
    }

    box.innerHTML=`
      <button type="button" class="coach11831PlayerStat" data-coach11834-status="active">
        <b>${active}</b><small>ACTIVE</small>
      </button>
      <button type="button" class="coach11831PlayerStat injured" data-coach11834-status="injured">
        <b>${injured}</b><small>INJURED</small>
      </button>
      <button type="button" class="coach11831PlayerStat out" data-coach11834-status="out">
        <b>${out}</b><small>OUT</small>
      </button>
      <button type="button" class="coach11832RosterBtn" data-coach11832-roster>VIEW PLAYERS</button>
    `;

    box.querySelectorAll("[data-coach11834-status]").forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        coach11832OpenRoster(btn.dataset.coach11834Status||"all");
      });
    });

    box.querySelector("[data-coach11832-roster]")?.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      coach11832OpenRoster();
    });
  }

  function coach11821ClickAny(selectors){
    for(const selector of selectors){
      const el=selector.startsWith("#")
        ? document.querySelector(selector)
        : document.getElementById(selector) || document.querySelector(selector);

      if(el && typeof el.click==="function"){
        el.click();
        return true;
      }
    }
    return false;
  }

  function coach11821PlayerLines(){
    const list=(typeof players!=="undefined" && Array.isArray(players)) ? players : [];
    const lineList=(typeof lines!=="undefined" && Array.isArray(lines)) ? lines : [];
    const assignList=(typeof assignments!=="undefined" && Array.isArray(assignments)) ? assignments : [];

    const rows=list
      .slice()
      .sort((a,b)=>Number(a.jersey_number||a.number||999)-Number(b.jersey_number||b.number||999))
      .map(player=>{
        const playerAssignments=assignList
          .filter(a=>String(a.player_id)===String(player.id));

        const lineDetails=lineList
          .map(line=>{
            const matches=playerAssignments.filter(a=>String(a.line_id)===String(line.id));
            if(!matches.length) return null;

            const posNames=matches.map(a=>{
              const pos=(typeof positions!=="undefined" && Array.isArray(positions))
                ? positions.find(p=>String(p.id)===String(a.position_label_id))
                : null;
              return pos?.label || pos?.name || pos?.code || "Assigned";
            }).filter(Boolean);

            return {
              name: line.name || "Line",
              positions: Array.from(new Set(posNames))
            };
          })
          .filter(Boolean);

        const jersey=player.jersey_number ?? player.number ?? "";
        const name=player.name || player.full_name || "Player";

        return `
          <div class="coach11819PlayRow">
            <div style="width:100%">
              <b>${jersey!=="" ? "#" + coach11819Esc(jersey) + " " : ""}${coach11819Esc(name)}</b>
              ${lineDetails.length
                ? `<div class="coach11822LineDetail">
                    ${lineDetails.map(detail=>`
                      <div class="coach11822LineChip">
                        <b>${coach11819Esc(detail.name)}</b>
                        <span class="coach11822Pos">${coach11819Esc(detail.positions.join(" / "))}</span>
                      </div>
                    `).join("")}
                  </div>`
                : `<small>Not assigned to a line</small>`}
            </div>
          </div>`;
      }).join("");

    if(typeof openModal!=="function") return;

    openModal(`
      <div class="coach11819ModalHead">
        <h2>PLAYER LINES</h2>
        <button type="button" class="secondary" data-coach11821-close>✕ CLOSE</button>
      </div>
      <div class="coach11819PlayList">${rows || '<div class="notice">No players found.</div>'}</div>
    `);

    document.getElementById("modalBody")
      ?.querySelector("[data-coach11821-close]")
      ?.addEventListener("click",()=>closeModal());
  }


  function coach11823PlayerLineNames(playerId){
    const assignList=(typeof assignments!=="undefined" && Array.isArray(assignments)) ? assignments : [];
    const lineList=(typeof lines!=="undefined" && Array.isArray(lines)) ? lines : [];

    const lineIds=new Set(
      assignList
        .filter(a=>String(a.player_id)===String(playerId))
        .map(a=>String(a.line_id))
    );

    return lineList
      .filter(line=>lineIds.has(String(line.id)))
      .map(line=>line.name)
      .filter(Boolean);
  }

  function coach11823OpenParticipation(){
    const list=(typeof players!=="undefined" && Array.isArray(players)) ? players : [];
    const total=Math.max(0,Number(typeof playCount!=="undefined" ? playCount : 0));
    const countMap=(typeof counts!=="undefined" && counts) ? counts : {};

    const active=list.filter(p=>String(p.availability_status||"active").toLowerCase()!=="out");

    const rows=active
      .map(player=>{
        const plays=Math.max(0,Number(countMap?.[player.id]||0));
        const pct=total>0 ? Math.round((plays/total)*100) : 0;
        const jersey=player.jersey_number ?? player.number ?? "";
        const name=player.name || player.full_name || "Player";
        const lineNames=coach11823PlayerLineNames(player.id);

        return {player,plays,pct,jersey,name,lineNames};
      })
      .sort((a,b)=>b.plays-a.plays || Number(a.jersey||999)-Number(b.jersey||999));

    const maxPlays=rows.length ? Math.max(...rows.map(r=>r.plays)) : 0;
    const minPlays=rows.length ? Math.min(...rows.map(r=>r.plays)) : 0;

    const body=rows.length
      ? rows.map(r=>`
          <div class="coach11823PlayerRow">
            <div class="name">
              <b>${r.jersey!=="" ? "#" + coach11819Esc(r.jersey) + " " : ""}${coach11819Esc(r.name)}</b>
              <small>${r.lineNames.length ? coach11819Esc(r.lineNames.join(" • ")) : "No line assignment"}</small>
            </div>
            <div class="coach11823Plays">${r.plays}</div>
            <div class="coach11823Pct">${r.pct}%</div>
          </div>
        `).join("")
      : `<div class="notice">No active players found.</div>`;

    if(typeof openModal!=="function") return;

    openModal(`
      <div class="coach11819ModalHead">
        <h2>PLAYER PARTICIPATION</h2>
        <button type="button" class="secondary" data-coach11823-close>✕ CLOSE</button>
      </div>

      <div class="coach11823SummaryHead">
        <div class="coach11823SummaryCard">
          <b>${total}</b>
          <small>RECORDED PLAYS</small>
        </div>
        <div class="coach11823SummaryCard">
          <b>${maxPlays}</b>
          <small>HIGHEST PLAYER</small>
        </div>
        <div class="coach11823SummaryCard">
          <b>${minPlays}</b>
          <small>LOWEST PLAYER</small>
        </div>
      </div>

      <div class="coach11823HeaderRow">
        <span>PLAYER / LINES</span>
        <span>PLAYS</span>
        <span>%</span>
      </div>

      <div class="coach11819PlayList">${body}</div>
    `);

    document.getElementById("modalBody")
      ?.querySelector("[data-coach11823-close]")
      ?.addEventListener("click",()=>closeModal());
  }


  function coach11824OpenOpponentStats(){
    const tracker=(typeof opponentTracker!=="undefined" && opponentTracker)
      ? opponentTracker
      : null;

    if(!tracker){
      if(typeof openOpponentStats==="function") openOpponentStats();
      return;
    }

    const total=Math.max(0,Number(tracker.rotations||0));
    const slots=Array.isArray(tracker.slots) ? tracker.slots : [];
    const slotMap={};

    slots.forEach((num,index)=>{
      const value=String(num||"").trim();
      if(!value) return;
      if(!slotMap[value]) slotMap[value]=[];
      slotMap[value].push(index+1);
    });

    const roster=Array.from(new Set([
      ...(Array.isArray(tracker.roster)?tracker.roster:[]).map(String),
      ...Object.keys(tracker.appearances||{}).map(String),
      ...slots.filter(Boolean).map(String)
    ])).sort((a,b)=>Number(a)-Number(b) || a.localeCompare(b));

    const rows=roster
      .map(num=>{
        const apps=Math.max(0,Number(tracker.appearances?.[num]||0));
        const pct=total ? Math.round((apps/total)*100) : 0;
        const streak=Math.max(0,Number(tracker.streaks?.[num]||0));
        const currentSlots=slotMap[num]||[];
        const warning=pct>75 && streak>3;
        return {num,apps,pct,streak,currentSlots,warning};
      })
      .sort((a,b)=>b.pct-a.pct || b.apps-a.apps || Number(a.num)-Number(b.num));

    const warningCount=rows.filter(r=>r.warning).length;
    const currentCount=slots.filter(Boolean).length;

    const body=rows.length
      ? rows.map(r=>`
          <div class="coach11824OppRow ${r.warning?'warning':''}">
            <div class="num">#${coach11819Esc(r.num)}</div>
            <div class="apps">${r.apps}</div>
            <div class="pct">${r.pct}%</div>
            <div class="coach11824OppMeta">
              ${r.currentSlots.length ? `ON FIELD • SLOT ${coach11819Esc(r.currentSlots.join(", "))}` : "NOT IN CURRENT 11"}
              ${r.streak ? `<br>${r.streak} STRAIGHT ROTATION${r.streak===1?'':'S'}` : ""}
              ${r.warning ? `<br><b style="color:#ffd66b">⚠ ROTATION ALERT</b>` : ""}
            </div>
          </div>
        `).join("")
      : `<div class="notice">No opponent rotations recorded yet.</div>`;

    if(typeof openModal!=="function") return;

    openModal(`
      <div class="coach11819ModalHead">
        <h2>OPPONENT STATS</h2>
        <button type="button" class="secondary" data-coach11824-close>✕ CLOSE</button>
      </div>

      <div class="coach11823SummaryHead">
        <div class="coach11823SummaryCard">
          <b>${total}</b>
          <small>TOTAL ROTATIONS</small>
        </div>
        <div class="coach11823SummaryCard">
          <b>${currentCount}/11</b>
          <small>CURRENT SLOTS</small>
        </div>
        <div class="coach11823SummaryCard">
          <b>${warningCount}</b>
          <small>ACTIVE ALERTS</small>
        </div>
      </div>

      <div class="coach11824OppHead">
        <span>JERSEY</span>
        <span>ROT.</span>
        <span>%</span>
        <span>CURRENT / STREAK</span>
      </div>

      <div class="coach11819PlayList">${body}</div>
    `);

    document.getElementById("modalBody")
      ?.querySelector("[data-coach11824-close]")
      ?.addEventListener("click",()=>closeModal());
  }

  function coach11821Open(kind){
    if(kind==="participation"){
      coach11823OpenParticipation();
      return;
    }

    if(kind==="player-lines"){
      coach11821PlayerLines();
      return;
    }

    if(kind==="opponent-stats"){
      coach11824OpenOpponentStats();
      return;
    }

    if(kind==="opponent-rotation"){
      if(typeof openOpponentTracker==="function"){
        openOpponentTracker();
      }else if(typeof openOpponentRotation==="function"){
        openOpponentRotation();
      }
      return;
    }
  }

  function coach11821BuildStats(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="stats"]');
    if(!panel) return;

    let box=panel.querySelector(".coach11821Stats");
    if(!box){
      box=document.createElement("div");
      box.className="coach11821Stats";
      panel.appendChild(box);
    }

    box.innerHTML=`
      <button type="button" class="coach11821StatsBtn" data-stat="participation">PLAYER PARTICIPATION</button>
      <button type="button" class="coach11821StatsBtn" data-stat="player-lines">PLAYER LINES</button>
      <button type="button" class="coach11821StatsBtn" data-stat="opponent-stats">OPPONENT STATS</button>
      <button type="button" class="coach11821StatsBtn" data-stat="opponent-rotation">OPPONENT ROTATION</button>
    `;

    box.querySelectorAll("[data-stat]").forEach(btn=>{
      btn.onclick=event=>{
        event.preventDefault();
        event.stopPropagation();
        coach11821Open(btn.dataset.stat);
      };
    });
  }

  function initialize() {
    installStyles();
    ensureUpdateBadge();
    ensureBackButton();
    ensureSectionFooters();
    coach11819BuildPlays();
    coach11831BuildPlayersSummary();
    coach11821BuildStats();
    bindDashboardSections();
    bind11811LineControls();
    buildReadableLines();
    build1182ReadableLines();
    mirrorDashboardField();

    if (!refreshTimer) {
      refreshTimer = setInterval(function () {
        buildReadableLines();
        build1182ReadableLines();
        coach11819BuildPlays();
      coach11831BuildPlayersSummary();
        coach11821BuildStats();
        bind11811LineControls();
        coach11812WirePlayerTaps();
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
