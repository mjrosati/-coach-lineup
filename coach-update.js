/* Coach Lineup live update layer
   v121.3 — RESTORE SPECIAL TEAMS
   This file intentionally replaces the earlier 117.x patch stack.
*/
window.COACH_UPDATE_VERSION = "121.3";

(function () {
  "use strict";

  const STYLE_ID = "coach-update-1191-style";
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

      /* =========================================================
         119.0 STABILIZATION BUILD
         ========================================================= */
      #fivePanelDashboard .fivePanelLabel b{
        font-size:12px!important;line-height:1.15!important;
      }
      #fivePanelDashboard .fivePanelLabel small{
        font-size:9px!important;line-height:1.15!important;
        color:#e4f2ff!important;font-weight:900!important;
      }
      #fivePanelDashboard .expandHint{
        opacity:.9!important;font-size:8px!important;
        font-weight:900!important;color:#d9ecff!important;
      }
      #fivePanelDashboard .coach1182LineMeta,
      #fivePanelDashboard .coach1182LineStatus{
        font-size:9px!important;font-weight:1000!important;
      }

      /* Keep our real controls above the transparent expand layers. */
      #fivePanelDashboard .fivePanel[data-panel="stats"] .v114TapLayer,
      #fivePanelDashboard .fivePanel[data-panel="plays"] .v114TapLayer,
      #fivePanelDashboard .fivePanel[data-panel="lines"] .v114TapLayer{
        pointer-events:none!important;
      }
      #fivePanelDashboard .coach11821Stats,
      #fivePanelDashboard .coach11819Plays,
      #fivePanelDashboard .coach1182Lines,
      #fivePanelDashboard .v112LineActions{
        position:relative!important;z-index:25!important;pointer-events:auto!important;
      }
      #fivePanelDashboard .coach11821StatsBtn,
      #fivePanelDashboard .coach11819PlayBtn{
        position:relative!important;z-index:26!important;pointer-events:auto!important;
      }

      /* Larger expanded-field player boxes and names. */
      #coach1189LineOverlay #field .slot,
      #coach1189LineOverlay #field .slot.specialSlot{
        min-width:88px!important;max-width:106px!important;
        min-height:44px!important;padding:6px 7px!important;
        border-width:3px!important;border-radius:8px!important;
        font-size:13px!important;line-height:1.05!important;font-weight:1000!important;
      }
      #coach1189LineOverlay #field .slot b{
        font-size:13px!important;line-height:1!important;font-weight:1000!important;
      }
      #coach1189LineOverlay #field .slot small{
        max-width:94px!important;margin-top:3px!important;
        font-size:11px!important;line-height:1.05!important;
        font-weight:1000!important;color:#fff!important;
      }
      @media (orientation:landscape){
        #coach1189LineOverlay #field .slot,
        #coach1189LineOverlay #field .slot.specialSlot{
          min-width:84px!important;max-width:102px!important;font-size:12px!important;
        }
        #coach1189LineOverlay #field .slot b{font-size:12px!important}
        #coach1189LineOverlay #field .slot small{max-width:90px!important;font-size:10.5px!important}
      }

      #coach1189LineOverlay.coach1190-special #field .tag{
        font-size:14px!important;font-weight:1000!important;padding:5px 12px!important;
      }
      #coach1189LineOverlay.coach1190-special .coach11812TapHint{color:#ffe08a!important}

      #fivePanelDashboard .coach11821StatsBtn{
        min-height:60px!important;font-size:11px!important;
      }
      #fivePanelDashboard .coach11819PlayBtn{
        min-height:54px!important;font-size:12px!important;font-weight:1000!important;
      }


      /* =========================================================
         119.1 DASHBOARD REPAIR BUILD
         ========================================================= */
      @media (orientation:landscape){
        html,body{max-height:100dvh!important}
        /* Team dashboard: tighten vertical spacing so its menu fits an iPad screen. */
        body:not(.coach-field-expanded):not(.coach-players-expanded) .dashboardHero,
        body:not(.coach-field-expanded):not(.coach-players-expanded) .teamHero{
          padding-top:10px!important;padding-bottom:10px!important;min-height:0!important;
        }
        body:not(.coach-field-expanded):not(.coach-players-expanded) .dashboardGrid,
        body:not(.coach-field-expanded):not(.coach-players-expanded) .teamDashboardGrid{
          gap:6px!important;
        }
        body:not(.coach-field-expanded):not(.coach-players-expanded) .dashboardCard,
        body:not(.coach-field-expanded):not(.coach-players-expanded) .teamDashboardCard{
          min-height:64px!important;padding-top:8px!important;padding-bottom:8px!important;
        }
      }

      /* Dashboard field keeps football-field geometry instead of stretching. */
      #fivePanelDashboard .fivePanel[data-panel="field"] .miniField{
        aspect-ratio:1.58/1!important;
      }
      #fivePanelDashboard .coachFieldMirror{
        inset:0!important;width:100%!important;height:100%!important;
      }
      #fivePanelDashboard .coachFieldMirror .field{
        width:100%!important;height:100%!important;aspect-ratio:1.58/1!important;
        transform:none!important;transform-origin:center center!important;
      }

      /* Current-line control above the dashboard field. */
      .coach1191FieldLineBar{
        display:flex!important;align-items:center!important;gap:8px!important;
        padding:5px 8px!important;background:#061d3e!important;
        border-bottom:1px solid rgba(255,255,255,.18)!important;
        position:relative!important;z-index:30!important;
      }
      .coach1191FieldLineBar b{font-size:9px!important;color:#fff!important;white-space:nowrap!important}
      .coach1191FieldLineBar select{
        flex:1!important;min-width:0!important;min-height:30px!important;
        border:1px solid #55b9ff!important;border-radius:5px!important;
        background:#0a376d!important;color:#fff!important;font-size:10px!important;font-weight:1000!important;
        padding:3px 7px!important;
      }

      /* Full field: preserve geometry and keep the field centered. */
      body.coach-field-expanded .fieldArea{
        align-items:center!important;justify-content:center!important;overflow:hidden!important;
      }
      body.coach-field-expanded #field.field{
        width:min(100%,calc((100dvh - 112px) * 1.58))!important;
        height:auto!important;aspect-ratio:1.58/1!important;
        max-height:calc(100dvh - 112px)!important;
        flex:none!important;margin:auto!important;
      }

      /* Expanded Players is a roster board, not a blocking modal. */
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"]{
        overflow:auto!important;
      }
      #v114Players:checked ~ .fivePanelGrid .coach1191RosterBoard{
        display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:5px!important;padding:8px!important;overflow:auto!important;
      }
      .coach1191RosterBoard{display:none}
      .coach1191RosterRow{
        display:grid!important;grid-template-columns:48px 1fr 72px 58px!important;
        align-items:center!important;gap:6px!important;min-height:38px!important;
        padding:5px 7px!important;border:1px solid #2d72ad!important;border-radius:5px!important;
        background:#0a315f!important;color:#fff!important;
      }
      .coach1191RosterRow b{font-size:10px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      .coach1191RosterRow small{font-size:8px!important;color:#d3e8fa!important;font-weight:900!important}
      .coach1191RosterStatus{font-size:8px!important;font-weight:1000!important;text-align:center!important;padding:4px!important;border-radius:4px!important;background:#137c49!important}
      .coach1191RosterStatus.injured{background:#a66b00!important}.coach1191RosterStatus.out{background:#8d2637!important}

      /* 119.2 repair pass */
      @media (orientation:landscape){
        #dashboard.dashScreen{height:100dvh!important;overflow:hidden!important}
        #dashboard .dashTop{height:48px!important;min-height:48px!important;padding:5px 12px!important}
        #dashboard .dashWrap{height:calc(100dvh - 48px)!important;max-width:900px!important;padding:8px 14px!important;overflow:hidden!important}
        #dashboard .teamHero{padding:4px 0 7px!important;margin:0!important;min-height:68px!important}
        #dashboard .teamHero h1{font-size:30px!important;line-height:1!important;margin:2px 0!important}
        #dashboard .teamBadge{font-size:34px!important}
        #dashboard .dashCard{min-height:54px!important;padding:7px 12px!important}
        #dashboard .dashCard.gameDay{min-height:62px!important;margin-bottom:6px!important}
        #dashboard .dashGrid{gap:5px!important}
        #dashboard .dashCard b{font-size:13px!important}
        #dashboard .dashCard small{font-size:9px!important;line-height:1.05!important}
        #dashboard .dashHint{display:none!important}
      }
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] #fivePlayersPreview,
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach11831PlayerSummary,
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .expandHint{display:none!important}
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach1191RosterBoard{height:100%!important;align-content:start!important}
      #coach1189LineOverlay{--coach-active-line:#1593ff}
      #coach1189LineOverlay .coach1189LineHeader{border-bottom:5px solid var(--coach-active-line)!important;box-shadow:inset 0 -2px 0 var(--coach-active-line)!important}
      #coach1189LineOverlay .coach11814SwitchBtn{border-top:5px solid var(--coach-line-button,#1593ff)!important}
      #coach1189LineOverlay .coach11814SwitchBtn.active{background:var(--coach-line-button,#1593ff)!important;color:#fff!important;box-shadow:0 0 0 2px #fff inset!important}

      /* Make all Plays controls unmistakably interactive. */
      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach11819Plays,
      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach11819PlayBtn{
        pointer-events:auto!important;touch-action:manipulation!important;z-index:100!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach11819PlayBtn:active{transform:scale(.97)!important}

      /* Expanded line field also keeps correct field proportions. */
      #coach1189LineOverlay .coach1189FieldHost{
        display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;
      }
      #coach1189LineOverlay .coach1189FieldHost #field.field{
        width:min(100%,calc((100dvh - 155px) * 1.58))!important;
        height:auto!important;aspect-ratio:1.58/1!important;max-height:calc(100dvh - 155px)!important;
        margin:auto!important;flex:none!important;
      }


      /* =========================================================
         119.3 — remove unused 8-part game-status controls everywhere
         QTR / CLOCK / START / POSSESSION / OPPONENT / DRIVE / DOWN / DISTANCE
         ========================================================= */
      #gameStrip,
      .gameStrip,
      #fivePanelDashboard .v102GameStrip{
        display:none!important;
      }

      /* Reclaim the space anywhere those controls previously occupied. */
      body.coach-field-expanded #gameStrip,
      body.fieldFullscreen #gameStrip,
      body.sidelineMode #gameStrip,
      #coach1189LineOverlay #gameStrip{
        display:none!important;
        height:0!important;
        min-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
      }


      /* =========================================================
         119.4 — FIVE-PANEL MAIN HUB
         The five-panel dashboard is the Game Day home.
         ========================================================= */

      body.coach1194-fivehub #fivePanelDashboard:not(.hidden){
        display:grid!important;
        height:100dvh!important;
        max-height:100dvh!important;
        overflow:hidden!important;
      }

      /* When the hub is visible, do not show a second copy of the native
         Game Day screen underneath it. */
      body.coach1194-fivehub #fivePanelDashboard:not(.hidden) ~ .top,
      body.coach1194-fivehub #fivePanelDashboard:not(.hidden) ~ .fullscreenControls,
      body.coach1194-fivehub #fivePanelDashboard:not(.hidden) ~ .layout{
        display:none!important;
      }

      #fivePanelDashboard .v114Back{
        font-weight:1000!important;
        letter-spacing:.35px!important;
      }

      /* One consistent action bar for expanded sections. */
      .coach1194PanelActions{
        display:flex!important;
        gap:8px!important;
        align-items:center!important;
        justify-content:center!important;
        padding:8px 10px!important;
        border-top:1px solid #2c73af!important;
        background:#04152f!important;
        position:relative!important;
        z-index:40!important;
        pointer-events:auto!important;
      }

      .coach1194PanelAction{
        min-height:44px!important;
        padding:8px 15px!important;
        border:2px solid #fff!important;
        border-radius:7px!important;
        background:#076fc5!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:1000!important;
        letter-spacing:.35px!important;
        touch-action:manipulation!important;
      }

      /* FIELD: keep the dashboard field as the preview/source of truth.
         The live/editable field opens only when the coach asks for it. */
      #v114Field:checked ~ .fivePanelGrid .fivePanel[data-panel="field"]{
        display:flex!important;
        flex-direction:column!important;
        min-height:0!important;
        overflow:hidden!important;
      }
      #v114Field:checked ~ .fivePanelGrid .fivePanel[data-panel="field"] .miniField{
        flex:1 1 auto!important;
        min-height:0!important;
        width:auto!important;
        max-width:100%!important;
        margin:6px auto!important;
      }

      /* PLAYERS: one roster board, editable from the same screen. */
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] #fivePlayersPreview,
      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach11831PlayerSummary{
        display:none!important;
      }

      #v114Players:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach1191RosterBoard{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:6px!important;
        padding:8px!important;
        overflow:auto!important;
        align-content:start!important;
      }

      .coach1191RosterRow{
        grid-template-columns:42px minmax(0,1fr) minmax(120px,1.2fr) 54px 58px!important;
        min-height:42px!important;
      }

      .coach1194RosterEdit{
        min-height:30px!important;
        padding:4px 7px!important;
        border:1px solid #9bd4ff!important;
        border-radius:5px!important;
        background:#0b4f89!important;
        color:#fff!important;
        font-size:8px!important;
        font-weight:1000!important;
        touch-action:manipulation!important;
      }

      /* Shared player editor. */
      .coach1194EditorHead{
        display:flex!important;
        justify-content:space-between!important;
        align-items:center!important;
        gap:10px!important;
        margin-bottom:12px!important;
      }
      .coach1194EditorHead h2{margin:0!important;color:#fff!important}
      .coach1194EditorGrid{
        display:grid!important;
        grid-template-columns:130px 1fr!important;
        gap:9px 12px!important;
        align-items:center!important;
      }
      .coach1194EditorGrid label{
        color:#bcd8ef!important;
        font-size:10px!important;
        font-weight:900!important;
      }
      .coach1194EditorGrid input,
      .coach1194EditorGrid select{
        width:100%!important;
        min-height:40px!important;
        box-sizing:border-box!important;
        border:1px solid #4a85b8!important;
        border-radius:6px!important;
        background:#0b294a!important;
        color:#fff!important;
        padding:7px 9px!important;
        font-size:13px!important;
        font-weight:800!important;
      }
      .coach1194EditorHint{
        margin-top:10px!important;
        color:#9ebbd3!important;
        font-size:9px!important;
      }
      .coach1194EditorActions{
        display:flex!important;
        justify-content:flex-end!important;
        gap:8px!important;
        margin-top:14px!important;
      }

      /* PLAYS: categories live in Team Playbook now; dashboard only launches
         the shared playbook and the shared ordered Game Play List. */
      #fivePanelDashboard .coach11819Plays{
        grid-template-columns:1fr!important;
        gap:8px!important;
      }
      #fivePanelDashboard .coach11819PlayBtn{
        min-height:52px!important;
      }

      /* Avoid duplicate legacy section footers after consolidation. */
      .coachLinesFooter,
      .coachStatsFooter,
      .coachPlaysFooter{
        display:none!important;
      }

      @media (orientation:landscape) and (max-height:760px){
        #fivePanelDashboard .fivePanelTop{
          min-height:42px!important;
          padding-top:5px!important;
          padding-bottom:5px!important;
        }
        #fivePanelDashboard .fivePanelLabel{
          min-height:34px!important;
          padding:5px 8px!important;
        }
        #fivePanelDashboard .coach1194PanelActions{
          padding:5px 8px!important;
        }
      }


      /* =========================================================
         119.5 — direct fixes from 119.4 test
         ========================================================= */

      #fivePanelDashboard .fivePanel[data-panel="field"]{cursor:pointer!important;}

      #fivePanelDashboard .fivePanel[data-panel="players"] .v114TapLayer,
      #fivePanelDashboard .fivePanel[data-panel="plays"] .v114TapLayer,
      #fivePanelDashboard .fivePanel[data-panel="lines"] .v114TapLayer{
        pointer-events:none!important;
      }

      #fivePanelDashboard .coach1191RosterBoard,
      #fivePanelDashboard .coach1194RosterEdit,
      #fivePanelDashboard .coach11819Plays,
      #fivePanelDashboard .coach1182Lines,
      #fivePanelDashboard .coach1194PanelActions{
        position:relative!important;
        z-index:60!important;
        pointer-events:auto!important;
      }

      #v114Lines:checked ~ .fivePanelGrid .fivePanel[data-panel="lines"] .coach1182Lines{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        grid-auto-rows:minmax(48px,auto)!important;
        gap:6px!important;
        padding:7px!important;
        overflow:visible!important;
        flex:1 1 auto!important;
        align-content:start!important;
      }
      #v114Lines:checked ~ .fivePanelGrid .coach1182LineRow{
        min-height:48px!important;
        padding:6px 8px!important;
      }
      #v114Lines:checked ~ .fivePanelGrid .v112LineActions,
      #v114Lines:checked ~ .fivePanelGrid .coach1194PanelActions{
        padding:5px 7px!important;
        gap:6px!important;
      }

      .coach1194RosterEdit{
        min-width:56px!important;
        min-height:34px!important;
        font-size:9px!important;
      }

      #v114Plays:checked ~ .fivePanelGrid .coach11819Plays{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:12px!important;
        padding:16px!important;
        align-content:center!important;
      }
      #v114Plays:checked ~ .fivePanelGrid .coach11819PlayBtn{
        min-height:76px!important;
        font-size:14px!important;
      }


      /* =========================================================
         119.6 — player edit, line fit, full on-field swap list
         ========================================================= */

      /* On the main 5-panel screen, give the upper row (Players / Play Lines)
         more height and make the Plays box smaller. */
      #v114All:checked ~ .fivePanelGrid{
        grid-template-rows:minmax(0,1.42fr) minmax(0,.58fr)!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="plays"]{
        min-height:0!important;
        overflow:hidden!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="plays"] .coach11819Plays{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:5px!important;
        padding:5px!important;
        overflow:hidden!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="plays"] .coach11819PlayBtn{
        min-height:32px!important;
        padding:4px 6px!important;
        font-size:9px!important;
      }

      /* Play Lines: all lines visible at once instead of a scrolling list. */
      #fivePanelDashboard .fivePanel[data-panel="lines"] .coach1182Lines{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        grid-auto-rows:minmax(42px,auto)!important;
        gap:5px!important;
        padding:5px!important;
        overflow:hidden!important;
        align-content:start!important;
        min-height:0!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="lines"] .coach1182LineRow{
        min-height:42px!important;
        padding:5px 7px!important;
        margin:0!important;
      }

      /* Native player editor sits above every dashboard/line overlay. */
      body.coach1196-player-editor #modal{
        z-index:1000025!important;
        pointer-events:auto!important;
      }
      body.coach1196-player-editor #modal:not(.hidden){
        display:grid!important;
      }

      /* Full swap picker. */
      .coach1196SwapHead{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
        margin-bottom:8px!important;
      }
      .coach1196SwapHead h2{margin:2px 0 0!important}
      .coach1196SwapHint{
        margin:0 0 10px!important;
        color:#b8d3e8!important;
        font-size:10px!important;
      }
      .coach1196SwapList{
        display:grid!important;
        gap:5px!important;
        max-height:64dvh!important;
        overflow:auto!important;
      }
      .coach1196SwapRow{
        display:grid!important;
        grid-template-columns:50px minmax(150px,1.1fr) minmax(100px,.8fr) minmax(120px,1fr) 48px!important;
        align-items:center!important;
        gap:7px!important;
        width:100%!important;
        min-height:48px!important;
        padding:6px 8px!important;
        text-align:left!important;
        border:1px solid #376589!important;
        border-radius:6px!important;
        background:#0a213c!important;
        color:#fff!important;
      }
      .coach1196SwapRow.onField{
        border-color:#f0b800!important;
        background:#2b260c!important;
      }
      .coach1196SwapRow.current{
        border-color:#50b7ff!important;
        box-shadow:0 0 0 1px #50b7ff inset!important;
      }
      .coach1196SwapRow small{color:#a9c4da!important}
      .coach1196SwapWhere{
        font-size:9px!important;
        font-weight:1000!important;
        color:#ffd45c!important;
      }
      .coach1196SwapPrefs{
        font-size:9px!important;
        color:#c5d9ea!important;
      }
      .coach1196SwapPlays{
        text-align:center!important;
        font-weight:1000!important;
      }


      /* 119.7 — screenshot-driven dashboard repair */
      #fivePanelDashboard .fivePanel[data-panel="lines"]{
        overflow:hidden!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        grid-template-rows:1fr 1fr!important;
        gap:7px!important;
        padding:7px!important;
        overflow:hidden!important;
        min-height:0!important;
        flex:1 1 auto!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview > *{
        min-width:0!important;
        min-height:54px!important;
        height:auto!important;
        overflow:hidden!important;
        padding:7px!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview *{
        white-space:normal!important;
        overflow:visible!important;
        text-overflow:clip!important;
        line-height:1.1!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview b{
        font-size:11px!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview small,
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview span{
        font-size:8px!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="lines"] .v112LineActions{
        flex:0 0 auto!important;
        min-height:40px!important;
      }

      /* Smaller Plays panel, but with two large, readable actions. */
      #fivePanelDashboard .fivePanel[data-panel="plays"]{
        overflow:hidden!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach1197PlayActions{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:7px!important;
        padding:9px!important;
        align-content:center!important;
        height:100%!important;
      }
      .coach1197PlayActions button{
        min-height:46px!important;
        border:2px solid #dcefff!important;
        border-radius:7px!important;
        background:#0786dc!important;
        color:white!important;
        font-size:11px!important;
        font-weight:1000!important;
      }

      /* Player editor overlay must always be above five-panel dashboard. */
      #coach1197PlayerEditor{
        position:fixed!important;
        inset:0!important;
        z-index:2147483000!important;
        background:#000c!important;
        display:grid!important;
        place-items:center!important;
        padding:14px!important;
      }
      #coach1197PlayerEditor .coach1197EditorCard{
        width:min(760px,96vw)!important;
        max-height:92dvh!important;
        overflow:auto!important;
        background:#0b3768!important;
        border:2px solid #67c7ff!important;
        border-radius:9px!important;
        padding:16px!important;
        color:#fff!important;
      }
      #coach1197PlayerEditor .coach1197EditorHead{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:10px!important;
      }
      #coach1197PlayerEditor .coach1197EditorGrid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:10px!important;
        margin-top:12px!important;
      }
      #coach1197PlayerEditor label{
        display:grid!important;
        gap:4px!important;
        font-size:10px!important;
        font-weight:900!important;
      }
      #coach1197PlayerEditor input,
      #coach1197PlayerEditor select{
        width:100%!important;
        min-height:42px!important;
        padding:8px!important;
        background:#071d35!important;
        color:#fff!important;
        border:1px solid #5ea7dd!important;
        border-radius:5px!important;
      }
      #coach1197PlayerEditor .coach1197EditorFoot{
        display:flex!important;
        justify-content:flex-end!important;
        gap:8px!important;
        margin-top:14px!important;
      }


      /* =========================================================
         119.8 — hard replacement of the 3 unreliable dashboard areas
         ========================================================= */

      /* PLAYERS: whole row is a tap target; no hidden layer above it. */
      #fivePanelDashboard .fivePanel[data-panel="players"] .v114TapLayer{
        pointer-events:none!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="players"] .coach1191RosterBoard{
        position:relative!important;
        z-index:100!important;
        pointer-events:auto!important;
      }
      #fivePanelDashboard .fivePanel[data-panel="players"] .coach1191RosterRow{
        cursor:pointer!important;
        pointer-events:auto!important;
      }

      /* PLAY LINES: remove the old crowded preview and use four clean cards. */
      #fivePanelDashboard .fivePanel[data-panel="lines"] #fiveLinesPreview,
      #fivePanelDashboard .fivePanel[data-panel="lines"] .coach1182Lines{
        display:none!important;
      }
      #fivePanelDashboard .coach1198LineGrid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        grid-template-rows:1fr 1fr!important;
        gap:8px!important;
        padding:8px!important;
        min-height:0!important;
        flex:1 1 auto!important;
        overflow:hidden!important;
        position:relative!important;
        z-index:120!important;
      }
      #fivePanelDashboard .coach1198LineCard{
        min-width:0!important;
        min-height:58px!important;
        border:2px solid #83c9ff!important;
        border-left-width:8px!important;
        border-radius:7px!important;
        background:#082a50!important;
        color:#fff!important;
        display:grid!important;
        grid-template-columns:1fr auto!important;
        grid-template-rows:auto auto!important;
        align-items:center!important;
        gap:3px 8px!important;
        padding:9px 10px!important;
        text-align:left!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }
      #fivePanelDashboard .coach1198LineCard b{
        font-size:14px!important;
        line-height:1!important;
        white-space:nowrap!important;
      }
      #fivePanelDashboard .coach1198LineCard small{
        font-size:9px!important;
        color:#c7ddf1!important;
        white-space:nowrap!important;
      }
      #fivePanelDashboard .coach1198LineCard .coach1198Live{
        grid-row:1 / span 2!important;
        grid-column:2!important;
        background:#14a854!important;
        border:1px solid #80f0ad!important;
        border-radius:999px!important;
        padding:4px 7px!important;
        font-size:8px!important;
        font-weight:1000!important;
      }
      #fivePanelDashboard .coach1198LineCard:not(.live) .coach1198Live{
        display:none!important;
      }

      /* Keep controls compact under the four line cards. */
      #fivePanelDashboard .fivePanel[data-panel="lines"] .v112LineActions,
      #fivePanelDashboard .fivePanel[data-panel="lines"] .coach1194PanelActions{
        min-height:38px!important;
        padding:4px 7px!important;
        gap:6px!important;
      }

      /* PLAYS: hide every older play implementation, show only two direct controls. */
      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach11819Plays,
      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach1197PlayActions,
      #fivePanelDashboard .fivePanel[data-panel="plays"] #fivePlaysPreview{
        display:none!important;
      }
      #fivePanelDashboard .coach1198PlayBox{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:8px!important;
        padding:9px!important;
        align-content:center!important;
        min-height:0!important;
        flex:1 1 auto!important;
        position:relative!important;
        z-index:150!important;
        pointer-events:auto!important;
      }
      #fivePanelDashboard .coach1198PlayButton{
        min-height:48px!important;
        padding:7px 9px!important;
        border:2px solid #e7f5ff!important;
        border-radius:7px!important;
        background:#0784d8!important;
        color:#fff!important;
        font-size:11px!important;
        font-weight:1000!important;
        pointer-events:auto!important;
        touch-action:manipulation!important;
      }

      /* Main five-panel proportions: more room for lines, less for plays. */
      @media (orientation:landscape){
        #v114All:checked ~ .fivePanelGrid{
          grid-template-rows:minmax(0,1.52fr) minmax(0,.48fr)!important;
        }
      }


      /* =========================================================
         119.9 — CLEANUP ONLY
         Preserve the working Field, Play Lines and Playbook behavior.
         ========================================================= */

      /* PLAYERS: one clean roster list + one management button.
         Remove the duplicate status/filter controls shown under the roster. */
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach11831PlayerSummary,
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach11832RosterFilters,
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach11839Search,
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .expandHint{
        display:none!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"]{
        overflow:hidden!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach1191RosterBoard{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        padding:4px 6px!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach1191RosterRow{
        min-height:32px!important;
        padding:3px 4px!important;
      }

      /* Hide per-row EDIT buttons on the compact dashboard.
         The whole player row remains the edit target. */
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach1194RosterEdit{
        display:none!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="players"] .coach1191RosterRow{
        grid-template-columns:34px minmax(0,1fr) minmax(76px,.8fr) 38px!important;
      }

      /* STATS: remove old overlapping footer widgets and keep one clear action. */
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="stats"] .coach11821StatsQuick,
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="stats"] .coach11826StatsPolish,
      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="stats"] .expandHint{
        display:none!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="stats"]{
        overflow:hidden!important;
      }

      #v114All:checked ~ .fivePanelGrid .fivePanel[data-panel="stats"] #fiveStatsPreview{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:hidden!important;
      }

      /* PLAYS: only the two working 119.8 controls remain visible.
         Remove duplicate footer/open-playbook controls beneath them. */
      #fivePanelDashboard .fivePanel[data-panel="plays"] > .coach1194PanelActions,
      #fivePanelDashboard .fivePanel[data-panel="plays"] > .expandHint{
        display:none!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach1198PlayBox{
        padding:8px!important;
        gap:8px!important;
        height:auto!important;
        flex:1 1 auto!important;
      }

      #fivePanelDashboard .fivePanel[data-panel="plays"] .coach1198PlayButton{
        min-height:44px!important;
      }

      /* PLAY LINES: keep the working 119.8 four-card layout untouched,
         but remove the redundant "tap to expand" label. */
      #fivePanelDashboard .fivePanel[data-panel="lines"] > .expandHint{
        display:none!important;
      }

      /* Compact dashboard action bars so the five-panel screen stays balanced. */
      #v114All:checked ~ .fivePanelGrid .coach1194PanelActions{
        min-height:36px!important;
        padding:4px 6px!important;
      }

      #v114All:checked ~ .fivePanelGrid .coach1194PanelAction{
        min-height:34px!important;
        padding:5px 9px!important;
        font-size:9px!important;
      }


      /* =========================================================
         120.0 — LIVE FIELD IS THE GAME DAY DASHBOARD
         Reuse the proven native full-field screen instead of mini-panels.
         ========================================================= */

      body.coach1200-game-dashboard #fivePanelDashboard{
        display:none!important;
      }

      /* The old 8-item game-status strip remains removed. */
      body.coach1200-game-dashboard #gameStrip,
      body.coach1200-game-dashboard .gameStrip,
      body.coach1200-game-dashboard .v102GameStrip{
        display:none!important;
      }

      /* Dashboard tool strip sits above the proven native fullscreen controls. */
      #coach1200DashboardBar{
        position:fixed!important;
        left:10px!important;
        right:10px!important;
        bottom:62px!important;
        z-index:99990!important;
        display:grid!important;
        grid-template-columns:auto minmax(0,1fr) auto!important;
        align-items:center!important;
        gap:8px!important;
        padding:6px 8px!important;
        background:#06162be8!important;
        border:1px solid #4e8fca!important;
        border-radius:8px!important;
        box-shadow:0 8px 24px #0009!important;
        backdrop-filter:blur(7px)!important;
      }

      #coach1200DashboardBar .coach1200Tools,
      #coach1200DashboardBar .coach1200Lines{
        display:flex!important;
        align-items:center!important;
        gap:5px!important;
        min-width:0!important;
      }

      #coach1200DashboardBar .coach1200Lines{
        justify-content:center!important;
        overflow:auto!important;
        scrollbar-width:none!important;
      }

      #coach1200DashboardBar .coach1200Lines::-webkit-scrollbar{
        display:none!important;
      }

      #coach1200DashboardBar button{
        min-height:36px!important;
        border:1px solid #78b9eb!important;
        border-radius:6px!important;
        background:#0a4f89!important;
        color:#fff!important;
        padding:5px 9px!important;
        font-size:9px!important;
        font-weight:1000!important;
        white-space:nowrap!important;
        touch-action:manipulation!important;
      }

      #coach1200DashboardBar button.coach1200Home{
        background:#182334!important;
      }

      #coach1200DashboardBar .coach1200LineBtn{
        border-width:2px!important;
        min-width:72px!important;
      }

      #coach1200DashboardBar .coach1200LineBtn.live{
        box-shadow:0 0 0 2px #fff inset,0 0 0 1px #fff!important;
        transform:translateY(-1px)!important;
      }

      #coach1200DashboardBar .coach1200LineBtn small{
        display:block!important;
        font-size:7px!important;
        opacity:.84!important;
        margin-top:1px!important;
      }

      /* Make the native fullscreen control bar feel like the dashboard footer. */
      body.coach1200-game-dashboard .fullscreenControls{
        z-index:99989!important;
        min-height:54px!important;
        background:#040b14f2!important;
        border-top:1px solid #294a67!important;
      }

      /* "Exit Full Screen" is now a dashboard/home action and should not suggest
         that the live field is merely an expanded secondary view. */
      body.coach1200-game-dashboard .fullscreenControls button[data-coach1200-home]{
        background:#182334!important;
        border-color:#597188!important;
      }

      /* Players modal for quick roster access from the field dashboard. */
      .coach1200PlayersHead{
        display:flex!important;
        justify-content:space-between!important;
        align-items:center!important;
        gap:10px!important;
        margin-bottom:10px!important;
      }

      .coach1200PlayersActions{
        display:flex!important;
        gap:7px!important;
      }

      .coach1200PlayersList{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:6px!important;
        max-height:68dvh!important;
        overflow:auto!important;
      }

      .coach1200PlayerRow{
        display:grid!important;
        grid-template-columns:42px minmax(0,1fr) auto!important;
        gap:8px!important;
        align-items:center!important;
        min-height:46px!important;
        padding:7px 9px!important;
        border:1px solid #365f82!important;
        border-radius:6px!important;
        background:#0a213c!important;
        color:#fff!important;
        text-align:left!important;
      }

      .coach1200PlayerRow b{
        font-size:12px!important;
      }

      .coach1200PlayerRow small{
        display:block!important;
        color:#b7cee0!important;
        font-size:8px!important;
        margin-top:2px!important;
      }

      .coach1200Status{
        font-size:8px!important;
        font-weight:1000!important;
        padding:4px 6px!important;
        border-radius:999px!important;
        background:#124c32!important;
      }

      .coach1200Status.injured{background:#7b4a05!important}
      .coach1200Status.out{background:#69242a!important}

      /* Give the field a little breathing room above the dashboard bar without
         changing the native field's geometry. */
      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        padding-bottom:56px!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        #coach1200DashboardBar{
          bottom:55px!important;
          padding:4px 6px!important;
        }
        #coach1200DashboardBar button{
          min-height:32px!important;
          padding:4px 7px!important;
          font-size:8px!important;
        }
        body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
          padding-bottom:48px!important;
        }
      }


      /* =========================================================
         120.1 — CLEAN LIVE FIELD DASHBOARD
         The native field becomes the screen. Old five-panel chrome disappears.
         ========================================================= */

      body.coach1200-game-dashboard #fivePanelDashboard{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }

      /* Hide the old dashboard's duplicated entry/control surfaces. */
      body.coach1200-game-dashboard #fivePanelBtn,
      body.coach1200-game-dashboard #fivePanelClose,
      body.coach1200-game-dashboard #gameStrip,
      body.coach1200-game-dashboard .gameStrip,
      body.coach1200-game-dashboard .v102GameStrip{
        display:none!important;
      }

      /* Let the proven native live-field layout own the viewport. */
      body.coach1200-game-dashboard .layout{
        grid-template-columns:1fr!important;
      }
      body.coach1200-game-dashboard .sidebar,
      body.coach1200-game-dashboard .rightRail{
        display:none!important;
      }
      body.coach1200-game-dashboard .main{
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        margin:0!important;
      }

      /* One compact toolbar across the top. */
      #coach1200DashboardBar{
        top:7px!important;
        bottom:auto!important;
        left:50%!important;
        right:auto!important;
        transform:translateX(-50%)!important;
        width:min(980px,calc(100vw - 18px))!important;
        display:grid!important;
        grid-template-columns:auto minmax(0,1fr) auto!important;
        gap:7px!important;
        padding:5px 7px!important;
        border-radius:7px!important;
        background:#06162bf2!important;
        z-index:2147482000!important;
      }

      #coach1200DashboardBar .coach1200Tools{
        gap:4px!important;
      }

      #coach1200DashboardBar .coach1200Lines{
        gap:4px!important;
        justify-content:center!important;
      }

      #coach1200DashboardBar button{
        min-height:32px!important;
        padding:4px 8px!important;
        font-size:8px!important;
      }

      #coach1200DashboardBar .coach1200LineBtn{
        min-width:67px!important;
      }

      /* Field fills the usable area. Do not alter the field's internal geometry. */
      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        padding-top:43px!important;
        padding-bottom:55px!important;
      }

      /* Native bottom controls remain the only game-action footer. */
      body.coach1200-game-dashboard .fullscreenControls{
        display:flex!important;
        z-index:2147481900!important;
        min-height:50px!important;
        padding:5px 8px!important;
        gap:6px!important;
        background:#030a13f5!important;
      }

      /* Main Dashboard is a compact exit, not a second dashboard layer. */
      body.coach1200-game-dashboard .fullscreenControls button[data-coach1200-home]{
        min-width:auto!important;
        padding-left:10px!important;
        padding-right:10px!important;
      }

      /* No extra "open live field" action once the field IS the dashboard. */
      body.coach1200-game-dashboard #coach1194OpenLiveField,
      body.coach1200-game-dashboard .coach1194OpenLiveField,
      body.coach1200-game-dashboard [data-open-live-field]{
        display:none!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        #coach1200DashboardBar{
          top:4px!important;
          padding:4px 6px!important;
        }
        #coach1200DashboardBar button{
          min-height:29px!important;
          padding:3px 6px!important;
          font-size:7.5px!important;
        }
        #coach1200DashboardBar .coach1200LineBtn{
          min-width:62px!important;
        }
        body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
          padding-top:38px!important;
          padding-bottom:49px!important;
        }
      }


      /* =========================================================
         120.2 — REMOVE 8 GAME-STATUS BUTTONS
         Move the dashboard menu bar into their bottom location.
         ========================================================= */

      /* Hard-hide every legacy game-status control individually. */
      body.coach1200-game-dashboard #gameStrip,
      body.coach1200-game-dashboard .gameStrip,
      body.coach1200-game-dashboard #quarterDisplay,
      body.coach1200-game-dashboard #clockDisplay,
      body.coach1200-game-dashboard #clockToggleBtn,
      body.coach1200-game-dashboard #possessionDisplay,
      body.coach1200-game-dashboard #opponentBtn,
      body.coach1200-game-dashboard .opponentUnderPossession,
      body.coach1200-game-dashboard #driveDisplay,
      body.coach1200-game-dashboard #downDisplay,
      body.coach1200-game-dashboard #distanceDisplay{
        display:none!important;
        visibility:hidden!important;
        height:0!important;
        min-height:0!important;
        max-height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        overflow:hidden!important;
        pointer-events:none!important;
      }

      /* Put the dashboard menu where the 8 white buttons used to be. */
      #coach1200DashboardBar{
        top:auto!important;
        bottom:51px!important;
        left:50%!important;
        right:auto!important;
        transform:translateX(-50%)!important;
        width:min(1040px,calc(100vw - 16px))!important;
        padding:5px 7px!important;
      }

      /* Keep the native game-action footer directly below it. */
      body.coach1200-game-dashboard .fullscreenControls{
        bottom:0!important;
      }

      /* Field can now use the top edge again. */
      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        padding-top:4px!important;
        padding-bottom:96px!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        #coach1200DashboardBar{
          top:auto!important;
          bottom:47px!important;
          padding:4px 6px!important;
        }

        body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
          padding-top:2px!important;
          padding-bottom:86px!important;
        }
      }


      /* =========================================================
         120.3 — SEPARATE THE TWO BOTTOM BARS
         Keep dashboard menu above game controls with a clear gap.
         ========================================================= */

      body.coach1200-game-dashboard .fullscreenControls{
        position:fixed!important;
        left:0!important;
        right:0!important;
        bottom:0!important;
        min-height:54px!important;
        height:54px!important;
        margin:0!important;
        padding:5px 8px!important;
        display:flex!important;
        align-items:center!important;
        gap:6px!important;
        z-index:2147481900!important;
      }

      #coach1200DashboardBar{
        position:fixed!important;
        top:auto!important;
        bottom:61px!important;
        left:50%!important;
        right:auto!important;
        transform:translateX(-50%)!important;
        width:min(1040px,calc(100vw - 18px))!important;
        min-height:39px!important;
        margin:0!important;
        padding:5px 7px!important;
        z-index:2147482000!important;
      }

      body.coach1200-game-dashboard .fullscreenLineBadge{
        position:static!important;
        flex:0 0 auto!important;
        margin:0 4px 0 0!important;
      }

      body.coach1200-game-dashboard .fullscreenControls button{
        position:static!important;
        flex:0 0 auto!important;
        margin:0!important;
      }

      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        padding-top:2px!important;
        padding-bottom:108px!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        body.coach1200-game-dashboard .fullscreenControls{
          min-height:49px!important;
          height:49px!important;
          padding:4px 6px!important;
        }

        #coach1200DashboardBar{
          bottom:55px!important;
          min-height:35px!important;
          padding:4px 6px!important;
        }

        body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
          padding-bottom:96px!important;
        }
      }


      /* =========================================================
         120.4 — MOVE / SWAP PLAYERS DIRECTLY ON THE LIVE FIELD
         ========================================================= */

      #coach1200DashboardBar .coach1204MoveBtn.active{
        background:#8a5a00!important;
        border-color:#ffd34e!important;
        box-shadow:0 0 0 2px #ffd34e inset!important;
      }

      body.coach1204-move-mode #field .slot{
        cursor:pointer!important;
      }

      body.coach1204-move-mode #field .slot.coach1204-selected{
        box-shadow:0 0 0 4px #ffd34e,0 0 18px #ffd34e!important;
        z-index:999!important;
      }

      #coach1204MoveNotice{
        position:fixed!important;
        left:50%!important;
        bottom:106px!important;
        transform:translateX(-50%)!important;
        z-index:2147482500!important;
        background:#7a5000f2!important;
        border:2px solid #ffd34e!important;
        color:#fff!important;
        border-radius:7px!important;
        padding:6px 12px!important;
        font-size:10px!important;
        font-weight:1000!important;
        pointer-events:none!important;
        white-space:nowrap!important;
      }

      @media (orientation:landscape) and (max-height:700px){
        #coach1204MoveNotice{
          bottom:94px!important;
        }
      }


      /* 120.5 — fill field gap + simplified per-line Special Teams */
      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        padding-top:2px!important;
        padding-bottom:91px!important;
        min-height:0!important;
      }
      body.coach1200-game-dashboard.fieldFullscreen #field{
        width:100%!important;
        max-width:none!important;
        height:100%!important;
        min-height:0!important;
        aspect-ratio:auto!important;
      }
      #coach1205SpecialPanel{
        position:fixed!important;inset:0!important;z-index:2147483000!important;
        background:#000c!important;display:grid!important;place-items:center!important;padding:14px!important;
      }
      #coach1205SpecialPanel .coach1205Card{
        width:min(860px,96vw)!important;max-height:92dvh!important;overflow:auto!important;
        background:#092849!important;border:2px solid #58b8f0!important;border-radius:10px!important;
        padding:14px!important;color:#fff!important;
      }
      .coach1205Head{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;margin-bottom:10px!important}
      .coach1205UnitGrid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
      .coach1205UnitBtn{
        min-height:62px!important;padding:10px!important;border:2px solid #7bc7f5!important;border-radius:8px!important;
        background:#0b4f88!important;color:#fff!important;text-align:left!important;font-weight:1000!important;
      }
      .coach1205UnitBtn small{display:block!important;margin-top:3px!important;color:#c7e3f7!important;font-size:9px!important}
      .coach1205ManageRow{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin-top:12px!important}
      #coach1205RenamePanel{display:grid!important;gap:7px!important;margin-top:12px!important}
      .coach1205RenameRow{display:grid!important;grid-template-columns:72px 1fr!important;gap:8px!important;align-items:center!important}
      .coach1205RenameRow input{min-height:38px!important;background:#071b30!important;color:#fff!important;border:1px solid #5aa7d7!important;border-radius:5px!important;padding:7px!important}
      @media (orientation:landscape) and (max-height:700px){
        body.coach1200-game-dashboard.fieldFullscreen .fieldArea{padding-bottom:84px!important}
      }


      /* =========================================================
         120.6 — make the native Special Teams screen itself use
         only the four requested per-line units.
         ========================================================= */

      /* Fill more of the vertical gap above the menu bars. */
      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        padding-top:0!important;
        padding-bottom:82px!important;
      }

      body.coach1200-game-dashboard.fieldFullscreen #field{
        height:calc(100dvh - 82px)!important;
        max-height:calc(100dvh - 82px)!important;
        width:100%!important;
        max-width:none!important;
        aspect-ratio:auto!important;
      }

      /* Compact tools beside the native Special Teams selector. */
      #coach1206SpecialTools{
        display:flex!important;
        gap:5px!important;
        align-items:center!important;
        margin-left:6px!important;
      }

      #coach1206SpecialTools button{
        min-height:31px!important;
        padding:4px 7px!important;
        border:1px solid #79c9ff!important;
        border-radius:6px!important;
        background:#0b4f89!important;
        color:#fff!important;
        font-size:8px!important;
        font-weight:1000!important;
      }

      #coach1206RenameOverlay{
        position:fixed!important;
        inset:0!important;
        z-index:2147483200!important;
        background:#000c!important;
        display:grid!important;
        place-items:center!important;
        padding:12px!important;
      }

      #coach1206RenameOverlay .coach1206RenameCard{
        width:min(760px,95vw)!important;
        max-height:90dvh!important;
        overflow:auto!important;
        background:#0a294a!important;
        border:2px solid #64c3ff!important;
        border-radius:9px!important;
        padding:14px!important;
        color:#fff!important;
      }

      .coach1206RenameList{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        margin-top:10px!important;
      }

      .coach1206RenameList label{
        display:grid!important;
        grid-template-columns:64px 1fr!important;
        gap:7px!important;
        align-items:center!important;
        font-size:10px!important;
        font-weight:900!important;
      }

      .coach1206RenameList input{
        min-height:38px!important;
        background:#071b31!important;
        color:#fff!important;
        border:1px solid #5aa6d6!important;
        border-radius:5px!important;
        padding:7px!important;
      }


      /* =========================================================
         120.9 — SPECIAL TEAMS MIMICS THE NORMAL COMBINED FIELD
         One full field: offense on top, defense on bottom.
         ========================================================= */

      #coach1209SpecialDashboard{
        position:fixed!important;
        inset:0!important;
        z-index:2147483500!important;
        display:grid!important;
        grid-template-rows:auto 1fr!important;
        background:#03101e!important;
        color:#fff!important;
      }

      .coach1209Top{
        display:flex!important;
        justify-content:space-between!important;
        align-items:center!important;
        gap:8px!important;
        padding:6px 8px!important;
        background:#071b32!important;
        border-bottom:1px solid #4a83ad!important;
      }

      .coach1209TopLeft,
      .coach1209TopRight{
        display:flex!important;
        align-items:center!important;
        gap:6px!important;
        flex-wrap:wrap!important;
      }

      .coach1209Top button{
        min-height:32px!important;
        padding:4px 8px!important;
        border:1px solid #79bde9!important;
        border-radius:6px!important;
        background:#0a4f89!important;
        color:#fff!important;
        font-size:9px!important;
        font-weight:1000!important;
      }

      .coach1209Top button.active{
        background:#1482d5!important;
        box-shadow:0 0 0 2px #fff inset!important;
      }

      .coach1209Field{
        position:relative!important;
        min-height:0!important;
        overflow:hidden!important;
        background:
          linear-gradient(to bottom,rgba(255,255,255,.2) 1px,transparent 1px) 0 0/100% 10%,
          linear-gradient(90deg,transparent 49.8%,rgba(255,255,255,.22) 49.8% 50.2%,transparent 50.2%),
          #16923a!important;
        border:2px solid #e7eee2!important;
      }

      .coach1209Field:before{
        content:""!important;
        position:absolute!important;
        left:0!important;
        right:0!important;
        top:50%!important;
        height:4px!important;
        background:#e6eee3!important;
        z-index:1!important;
      }

      .coach1209FieldLabel{
        position:absolute!important;
        left:50%!important;
        transform:translateX(-50%)!important;
        z-index:5!important;
        padding:3px 12px!important;
        border-radius:5px!important;
        font-size:9px!important;
        font-weight:1000!important;
        letter-spacing:.4px!important;
      }

      .coach1209FieldLabel.offense{
        top:7px!important;
        background:#b82c28!important;
      }

      .coach1209FieldLabel.defense{
        top:calc(50% + 7px)!important;
        background:#1768c8!important;
      }

      .coach1209Spot{
        position:absolute!important;
        transform:translate(-50%,-50%)!important;
        min-width:66px!important;
        min-height:44px!important;
        padding:5px 6px!important;
        border:2px solid #e43b32!important;
        border-radius:6px!important;
        background:#090d12ed!important;
        color:#fff!important;
        text-align:center!important;
        font-size:9px!important;
        font-weight:1000!important;
        z-index:4!important;
        touch-action:none!important;
        user-select:none!important;
      }

      .coach1209Spot.defense{
        border-color:#1493ff!important;
      }

      .coach1209Spot small{
        display:block!important;
        color:#cbd5e1!important;
        font-size:7px!important;
        margin-top:2px!important;
      }

      .coach1209Spot.moveMode{
        box-shadow:0 0 0 3px #ffd34e!important;
        cursor:move!important;
      }

      .coach1209Hint{
        position:absolute!important;
        left:8px!important;
        bottom:6px!important;
        z-index:6!important;
        font-size:8px!important;
        color:#d5e7f4!important;
        background:#05111dcc!important;
        padding:3px 6px!important;
        border-radius:4px!important;
      }

      .coach1209RenameOverlay{
        position:fixed!important;
        inset:0!important;
        z-index:2147483600!important;
        background:#000c!important;
        display:grid!important;
        place-items:center!important;
        padding:12px!important;
      }

      .coach1209RenameCard{
        width:min(780px,95vw)!important;
        max-height:90dvh!important;
        overflow:auto!important;
        background:#0a294a!important;
        border:2px solid #64c3ff!important;
        border-radius:9px!important;
        padding:14px!important;
      }

      .coach1209RenameGrid{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:8px!important;
        margin-top:10px!important;
      }

      .coach1209RenameGrid label{
        display:grid!important;
        grid-template-columns:70px 1fr!important;
        gap:7px!important;
        align-items:center!important;
        font-size:9px!important;
        font-weight:900!important;
      }

      .coach1209RenameGrid input{
        min-height:36px!important;
        background:#071b31!important;
        color:#fff!important;
        border:1px solid #5aa6d6!important;
        border-radius:5px!important;
        padding:6px!important;
      }


      /* =========================================================
         121.0 — Special Teams uses ONE full field, matching normal
         offense/defense Game Day view.
         ========================================================= */

      #coach1207SpecialDashboard,
      #coach1205SpecialPanel,
      #coach1206RenameOverlay{
        display:none!important;
        pointer-events:none!important;
      }

      #coach1209SpecialDashboard{
        background:#07100a!important;
      }

      #coach1209SpecialDashboard .coach1209Field{
        margin:0!important;
        width:100%!important;
        height:100%!important;
        border:3px solid #e7eee2!important;
        background:repeating-linear-gradient(0deg,#236f2e 0 44px,#2c8138 44px 88px)!important;
      }

      #coach1209SpecialDashboard .coach1209Field:after{
        content:""!important;
        position:absolute!important;
        inset:0!important;
        background:repeating-linear-gradient(90deg,transparent 0 9.6%,#ffffffaa 9.6% 9.9%)!important;
        opacity:.35!important;
        pointer-events:none!important;
      }

      #coach1209SpecialDashboard .coach1209FieldLabel.offense{
        top:7px!important;
        background:#b82c28!important;
      }

      #coach1209SpecialDashboard .coach1209FieldLabel.defense{
        top:51%!important;
        background:#1768c8!important;
      }

      #coach1209SpecialDashboard .coach1209Spot{
        min-width:70px!important;
        min-height:48px!important;
        padding:5px 5px!important;
        font-size:10px!important;
        border-radius:5px!important;
      }

      #coach1209SpecialDashboard .coach1209Spot small{
        font-size:8px!important;
      }


      /* 121.1 loading/error states */
      #coach1211Loading{
        position:absolute!important;
        inset:0!important;
        display:grid!important;
        place-items:center!important;
        z-index:20!important;
        background:#07100a!important;
        color:#fff!important;
        font-weight:1000!important;
      }
      #coach1211Error{
        max-width:520px!important;
        padding:18px!important;
        border:2px solid #ff8b8b!important;
        border-radius:9px!important;
        background:#2b1115!important;
        text-align:center!important;
      }


      /* 121.2 hard-reset Special Teams view */
      #coach1212Special{
        position:fixed!important;
        inset:0!important;
        z-index:2147483640!important;
        display:grid!important;
        grid-template-rows:auto 1fr!important;
        background:#06110a!important;
        color:#fff!important;
      }
      #coach1212Special .coach1212Top{
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:8px!important;
        padding:6px 8px!important;
        background:#071b32!important;
        border-bottom:1px solid #4b86b0!important;
      }
      #coach1212Special .coach1212Top>div{
        display:flex!important;
        gap:6px!important;
        align-items:center!important;
        flex-wrap:wrap!important;
      }
      #coach1212Special button{
        min-height:32px!important;
        padding:4px 8px!important;
        border:1px solid #78bde9!important;
        border-radius:6px!important;
        background:#0a4f89!important;
        color:#fff!important;
        font-size:9px!important;
        font-weight:1000!important;
      }
      #coach1212Special button.active{
        background:#1482d5!important;
        box-shadow:0 0 0 2px #fff inset!important;
      }
      #coach1212Special .coach1212Field{
        position:relative!important;
        min-height:0!important;
        overflow:hidden!important;
        border:3px solid #e7eee2!important;
        background:
          linear-gradient(to bottom,rgba(255,255,255,.20) 1px,transparent 1px) 0 0/100% 10%,
          linear-gradient(90deg,transparent 49.8%,rgba(255,255,255,.24) 49.8% 50.2%,transparent 50.2%),
          #16923a!important;
      }
      #coach1212Special .coach1212Field:before{
        content:""!important;
        position:absolute!important;
        left:0!important;right:0!important;top:50%!important;
        height:4px!important;background:#fff!important;opacity:.85!important;
      }
      #coach1212Special .coach1212Label{
        position:absolute!important;
        left:50%!important;
        transform:translateX(-50%)!important;
        z-index:4!important;
        padding:3px 12px!important;
        border-radius:5px!important;
        font-size:9px!important;
        font-weight:1000!important;
      }
      #coach1212Special .coach1212Label.off{top:7px!important;background:#b82c28!important}
      #coach1212Special .coach1212Label.def{top:calc(50% + 7px)!important;background:#1768c8!important}
      #coach1212Special .coach1212Spot{
        position:absolute!important;
        transform:translate(-50%,-50%)!important;
        min-width:68px!important;
        min-height:46px!important;
        padding:5px 6px!important;
        border:2px solid #e43b32!important;
        border-radius:6px!important;
        background:#091018ee!important;
        color:#fff!important;
        text-align:center!important;
        font-size:9px!important;
        font-weight:1000!important;
        z-index:3!important;
        touch-action:none!important;
      }
      #coach1212Special .coach1212Spot.def{border-color:#1493ff!important}
      #coach1212Special .coach1212Spot small{
        display:block!important;
        margin-top:2px!important;
        color:#d3e2ed!important;
        font-size:7px!important;
      }
      #coach1212Special .coach1212Spot.move{
        box-shadow:0 0 0 3px #ffd34e!important;
      }
      #coach1212Special .coach1212Empty{
        position:absolute!important;
        inset:0!important;
        display:grid!important;
        place-items:center!important;
        font-size:14px!important;
        font-weight:1000!important;
        color:#fff!important;
      }


      /* 121.3 — line switching inside Special Teams */
      #coach1212Special .coach1213Lines{
        display:flex!important;
        align-items:center!important;
        gap:5px!important;
        flex-wrap:wrap!important;
      }
      #coach1212Special .coach1213LineBtn{
        min-width:72px!important;
        border-width:2px!important;
      }
      #coach1212Special .coach1213LineBtn.current{
        box-shadow:0 0 0 2px #fff inset!important;
      }
      #coach1212Special .coach1213RestoreNote{
        font-size:8px!important;
        color:#c9dff0!important;
        margin-left:6px!important;
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
    coach1200OpenGameDashboard();
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
      const key = nameMatch ? nameMatch[1].toUpperCase() : ("LINE " + (index + 1));
      const selectedText = String(
        document.querySelector("#lineSelect option:checked")?.textContent || ""
      ).toUpperCase();
      const live = selectedText.indexOf(key) >= 0;

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
    coach11816SpecialOpen=true;
    currentSpecialUnit=index;
    activeView="special";
    coach11815MoveMode=false;

    try{ if(typeof unifiedFieldView!=="undefined") unifiedFieldView=false; }catch{}

    const overlay=document.getElementById("coach1189LineOverlay");
    overlay?.classList.remove("coach11815-moving");
    overlay?.classList.add("coach1190-special");

    try{
      if(typeof renderSpecialUnitSelect==="function") renderSpecialUnitSelect();
      if(typeof renderField==="function") renderField();
    }catch(error){
      console.warn("119.0 render special:",error);
    }

    const title=document.getElementById("coach1189Title");
    if(title) title.textContent=type;

    const hint=overlay?.querySelector(".coach11812TapHint");
    if(hint) hint.textContent=`${type} • 11 PLAYER SPECIAL TEAMS`;

    coach11816RenderControls();
  }

  function coach11816BackToLine(){
    coach11818StopSpecialMove();
    coach11816ActiveType="";
    coach11816SpecialOpen=false;
    activeView="offense";

    const overlay=document.getElementById("coach1189LineOverlay");
    overlay?.classList.remove("coach1190-special");

    try{
      if(typeof setUnifiedFieldView==="function") setUnifiedFieldView();
      else{
        if(typeof unifiedFieldView!=="undefined") unifiedFieldView=true;
        if(typeof renderField==="function") renderField();
      }
    }catch(error){
      console.warn("119.0 back to line:",error);
    }

    const title=document.getElementById("coach1189Title");
    if(title) title.textContent=coach11816SafeName(lines?.[currentLine]?.name).toUpperCase();

    const hint=overlay?.querySelector(".coach11812TapHint");
    if(hint) hint.textContent="TAP ANY PLAYER TO REPLACE";

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
          /* Use the app's full substitution flow when available. */
          activeView = pos.side;
          try{
            coach1196OpenSwapPlayerModal(pos.id);
            return;
          }catch(error){console.warn("119.2 substitution:",error);}
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

    if (overlay){
      overlay.classList.add("hidden");
      overlay.classList.remove("coach1190-special");
    }
    coach11816ActiveType="";
    coach11816SpecialOpen=false;
    activeView="offense";
    try{if(typeof unifiedFieldView!=="undefined") unifiedFieldView=true;}catch{}
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


  function coach1190RefreshAfterLineChange(){
    const refresh=()=>{
      try{
        if(typeof renderAll==="function") renderAll();
        else if(typeof renderField==="function") renderField();
      }catch(error){console.warn("119.0 line refresh:",error);}
      try{if(typeof renderFivePanelRealData==="function") renderFivePanelRealData();}catch{}
      build1182ReadableLines();
      mirrorDashboardField();
    };
    requestAnimationFrame(refresh);
    setTimeout(refresh,80);
    setTimeout(refresh,220);
  }

  function bind11811LineControls() {
    const undo=document.getElementById("v112UndoPlayBtn");
    const next=document.getElementById("v112NextLineBtn");

    [[undo,"prevBtn"],[next,"nextBtn"]].forEach(([button,targetId])=>{
      if(!button||button.dataset.coach1190Bound==="1") return;
      button.dataset.coach1190Bound="1";
      button.removeAttribute("onclick");
      button.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        document.getElementById(targetId)?.click();
        coach1190RefreshAfterLineChange();
      });
    });

    const nativeNext=document.getElementById("nextBtn");
    if(nativeNext&&nativeNext.dataset.coach1190Refresh!=="1"){
      nativeNext.dataset.coach1190Refresh="1";
      nativeNext.addEventListener("click",coach1190RefreshAfterLineChange);
    }
    const select=document.getElementById("lineSelect");
    if(select&&select.dataset.coach1190Refresh!=="1"){
      select.dataset.coach1190Refresh="1";
      select.addEventListener("change",coach1190RefreshAfterLineChange);
    }
  }

  function coach1191BuildFieldLineBar(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="field"]');
    const native=document.getElementById("lineSelect");
    if(!panel||!native) return;
    let bar=panel.querySelector(".coach1191FieldLineBar");
    if(!bar){
      bar=document.createElement("div");bar.className="coach1191FieldLineBar";
      const label=panel.querySelector(".fivePanelLabel");
      if(label?.nextSibling) panel.insertBefore(bar,label.nextSibling); else panel.prepend(bar);
    }
    const options=Array.from(native.options||[]).map((opt,i)=>
      `<option value="${i}" ${i===native.selectedIndex?'selected':''}>${coach11819Esc(opt.textContent||opt.label||('LINE '+(i+1)))}</option>`
    ).join("");
    bar.innerHTML=`<b>CURRENT LINE</b><select aria-label="Current play line">${options}</select>`;
    const select=bar.querySelector("select");
    select?.addEventListener("change",event=>{
      event.preventDefault();event.stopPropagation();
      native.selectedIndex=Number(select.value);
      native.dispatchEvent(new Event("change",{bubbles:true}));
      coach1190RefreshAfterLineChange();
      setTimeout(coach1191BuildFieldLineBar,100);
    });
  }

  function coach1191BuildRosterBoard(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="players"]');
    if(!panel) return;

    let board=panel.querySelector(".coach1191RosterBoard");
    if(!board){
      board=document.createElement("div");
      board.className="coach1191RosterBoard";
      panel.appendChild(board);
    }

    const list=(typeof players!=="undefined"&&Array.isArray(players))?players.slice():[];
    list.sort((a,b)=>Number(a.jersey_number??a.number??9999)-Number(b.jersey_number??b.number??9999));

    board.innerHTML=list.map(player=>{
      const num=player.jersey_number??player.number??"";
      const name=player.name||player.full_name||"Player";
      const status=String(player.availability_status||"active").toLowerCase();
      const label=status==="injured"?"INJ":status==="out"?"OUT":"OK";
      const offense=Array.isArray(player.offense_positions)?player.offense_positions.join("/"):"";
      const defense=Array.isArray(player.defense_positions)?player.defense_positions.join("/"):"";
      const pos=[offense&&`O:${offense}`,defense&&`D:${defense}`].filter(Boolean).join("  ")||"—";
      return `
        <div class="coach1191RosterRow" data-coach1194-player="${coach11819Esc(String(player.id))}">
          <small>#${coach11819Esc(num)}</small>
          <b>${coach11819Esc(name)}</b>
          <small>${coach11819Esc(pos)}</small>
          <span class="coach1191RosterStatus ${status}">${label}</span>
          <button type="button" class="coach1194RosterEdit" data-coach1194-edit="${coach11819Esc(String(player.id))}" onclick="event.preventDefault();event.stopPropagation();coach1197OpenPlayerEditor('${coach11819Esc(String(player.id))}');return false;">EDIT</button>
        </div>`;
    }).join("")||'<div class="notice">No players loaded.</div>';

    if(board.dataset.coach1194Bound!=="1"){
      board.dataset.coach1194Bound="1";
      board.addEventListener("click",event=>{
        const btn=event.target.closest("[data-coach1194-edit]");
        if(!btn) return;
        event.preventDefault();
        event.stopPropagation();
        coach1197OpenPlayerEditor(btn.dataset.coach1194Edit);
      });
    }
  }

  function coach1191BindPlayButtonsGlobal(){
    if(document.documentElement.dataset.coach1191Plays==="1") return;
    document.documentElement.dataset.coach1191Plays="1";
    document.addEventListener("pointerup",event=>{
      const btn=event.target.closest('#fivePanelDashboard .coach11819PlayBtn');
      if(!btn) return;
      event.preventDefault();event.stopPropagation();
      if(btn.dataset.type) coach11819OpenCategory(btn.dataset.type);
      else if(btn.dataset.gameList) coach11819OpenGameList();
    },true);
  }

  function bindDashboardSections() {
    const fieldRadio = document.getElementById("v114Field");
    if (fieldRadio && fieldRadio.dataset.coach1194 !== "1") {
      fieldRadio.dataset.coach1194 = "1";
      fieldRadio.addEventListener("change", function () {
        if (!fieldRadio.checked) return;
        requestAnimationFrame(function(){
          coach1191BuildFieldLineBar();
          mirrorDashboardField();
          coach1194EnsurePanelActions();
        });
      });
    }

    const playersRadio = document.getElementById("v114Players");
    if (playersRadio && playersRadio.dataset.coach1194 !== "1") {
      playersRadio.dataset.coach1194 = "1";
      playersRadio.addEventListener("change", function () {
        if (!playersRadio.checked) return;
        requestAnimationFrame(function(){
          coach1191BuildRosterBoard();
          coach1194EnsurePanelActions();
        });
      });
    }

    ["v114Lines","v114Stats","v114Plays"].forEach(function(id){
      const radio=document.getElementById(id);
      if(!radio || radio.dataset.coach1194==="1") return;
      radio.dataset.coach1194="1";
      radio.addEventListener("change",function(){
        if(!radio.checked) return;
        requestAnimationFrame(coach1194EnsurePanelActions);
      });
    });

    const modal = document.getElementById("modal");
    if (modal && modal.dataset.coach1194 !== "1") {
      modal.dataset.coach1194 = "1";
      const observer = new MutationObserver(function () {
        if (!modal.classList.contains("hidden")) return;
        document.body.classList.remove("coach1196-player-editor");
        const lineOverlay=document.getElementById("coach1189LineOverlay");
        if(lineOverlay && !lineOverlay.classList.contains("hidden")) return;
        if(document.body.classList.contains("coach1194-player-editing")) return;
        coach1194ShowHubIfGameVisible();
      });
      observer.observe(modal,{attributes:true,attributeFilter:["class"]});
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
      localStorage.setItem(coach11819GameListKey(),JSON.stringify(Array.isArray(ids)?ids:[]));
    }catch(error){
      console.warn("119.0 game play list:",error);
    }
  }

  function coach11819CategoryMatch(play,type){
    const haystack=[
      play?.category,play?.name,play?.play_name,play?.play_code,
      play?.code,play?.description
    ].filter(Boolean).join(" ").toLowerCase();

    if(type==="PASSING") return /(pass|passing|throw|screen)/.test(haystack);
    if(type==="RUNNING") return /(run|running|rush|dive|sweep|counter|iso|trap|power|zone)/.test(haystack);
    if(type==="KICKING") return /(kick|kickoff|punt|field goal|extra point|pat)/.test(haystack);
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
    const ids=coach11819ReadGameList().map(String);
    ids.push(String(playId));
    coach11819WriteGameList(ids);
  }

  function coach11819OpenCategory(type){
    const all=(typeof playbookPlays!=="undefined" && Array.isArray(playbookPlays))?playbookPlays:[];
    const selected=all.filter(play=>coach11819CategoryMatch(play,type));
    const gameIds=coach11819ReadGameList().map(String);

    const rows=selected.length ? selected.map(play=>{
      const id=String(play.id);
      const count=gameIds.filter(x=>x===id).length;
      return `
        <div class="coach11819PlayRow">
          <div>
            <b>${coach11819Esc(coach11819PlayTitle(play))}</b>
            <small>${coach11819Esc(coach11819PlayMeta(play))}${count?` • ${count} ON GAME LIST`:""}</small>
          </div>
          <button type="button" class="coach11819AddBtn" data-play-id="${coach11819Esc(id)}">+ ADD</button>
        </div>`;
    }).join("") :
    `<div class="notice">No ${coach11819Esc(type.toLowerCase())} plays match this category.</div>`;

    if(typeof openModal!=="function") return;
    openModal(`
      <div class="coach11819ModalHead">
        <h2>${coach11819Esc(type)}</h2>
        <button type="button" class="secondary" data-coach11819-close>✕ CLOSE</button>
      </div>
      <div class="coach11819PlayList">${rows}</div>
    `);

    const body=document.getElementById("modalBody");
    body?.querySelector("[data-coach11819-close]")?.addEventListener("click",()=>closeModal());
    body?.querySelectorAll("[data-play-id]").forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        coach11819AddPlay(btn.dataset.playId);
        btn.textContent="✓ ADDED";
        setTimeout(()=>{if(btn.isConnected) btn.textContent="+ ADD";},400);
      });
    });
  }


  function coach11820RemovePlay(entryIndex){
    const ids=coach11819ReadGameList().map(String);
    const index=Number(entryIndex);
    if(Number.isInteger(index)&&index>=0&&index<ids.length) ids.splice(index,1);
    coach11819WriteGameList(ids);
    coach11819OpenGameList();
  }

  function coach11820ClearGameList(){
    coach11819WriteGameList([]);
    coach11819OpenGameList();
  }

  function coach11819OpenGameList(){
    const all=(typeof playbookPlays!=="undefined" && Array.isArray(playbookPlays))?playbookPlays:[];
    const ids=coach11819ReadGameList().map(String);
    const entries=ids.map((id,index)=>({
      id,index,play:all.find(play=>String(play?.id)===id)
    })).filter(entry=>entry.play);

    const activePlayId=(typeof pendingCalledPlay!=="undefined" && pendingCalledPlay?.id!=null)
      ? String(pendingCalledPlay.id) : "";

    const rows=entries.length ? entries.map((entry,rowIndex)=>{
      const play=entry.play;
      const active=activePlayId===String(play.id);
      return `
        <div class="coach11819PlayRow ${active?'coach11828ActivePlay':''}">
          <div>
            <b>${rowIndex+1}. ${coach11819Esc(coach11819PlayTitle(play))}${active?'<span class="coach11828ActiveBadge">ACTIVE</span>':''}</b>
            <small>${coach11819Esc(coach11819PlayMeta(play))}</small>
          </div>
          <div class="coach11827PlayActions">
            <div class="coach11830MoveBtns">
              <button type="button" class="coach11830MoveBtn" data-move-index="${entry.index}" data-direction="-1" ${entry.index===0?'disabled':''}>▲</button>
              <button type="button" class="coach11830MoveBtn" data-move-index="${entry.index}" data-direction="1" ${entry.index===ids.length-1?'disabled':''}>▼</button>
            </div>
            <button type="button" class="coach11827CallBtn" data-call-play="${coach11819Esc(String(play.id))}">CALL</button>
            <button type="button" class="coach11820RemoveBtn" data-remove-index="${entry.index}">REMOVE</button>
          </div>
        </div>`;
    }).join("") :
    `<div class="notice">Your Game Play List is empty. Choose Passing, Running, or Kicking and tap + ADD.</div>`;

    if(typeof openModal!=="function") return;
    openModal(`
      <div class="coach11819ModalHead coach11820GameListHead">
        <h2>GAME PLAY LIST</h2>
        <div style="display:flex;gap:8px;align-items:center">
          ${activePlayId?'<button type="button" class="coach11829ClearCallBtn" data-coach11829-clear-call>CLEAR ACTIVE</button>':''}
          ${entries.length?'<button type="button" class="coach11820ClearBtn" data-coach11820-clear>CLEAR LIST</button>':''}
          <button type="button" class="secondary" data-coach11819-close>✕ CLOSE</button>
        </div>
      </div>
      <div class="coach11827Hint">Duplicates are allowed. CALL selects the play for the next recorded snap.</div>
      <div class="coach11819PlayList">${rows}</div>
    `);

    const body=document.getElementById("modalBody");
    body?.querySelector("[data-coach11819-close]")?.addEventListener("click",()=>closeModal());
    body?.querySelector("[data-coach11829-clear-call]")?.addEventListener("click",event=>{
      event.preventDefault();
      if(typeof clearCalledPlay==="function") clearCalledPlay();
      else{
        if(typeof pendingCalledPlay!=="undefined") pendingCalledPlay=null;
        if(typeof renderCalledPlay==="function") renderCalledPlay();
      }
      coach11819OpenGameList();
    });
    body?.querySelector("[data-coach11820-clear]")?.addEventListener("click",event=>{
      event.preventDefault();coach11820ClearGameList();
    });
    body?.querySelectorAll("[data-move-index]").forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();
        const list=coach11819ReadGameList().map(String);
        const from=Number(btn.dataset.moveIndex);
        const to=from+Number(btn.dataset.direction||0);
        if(!Number.isInteger(from)||to<0||to>=list.length) return;
        [list[from],list[to]]=[list[to],list[from]];
        coach11819WriteGameList(list);
        coach11819OpenGameList();
      });
    });
    body?.querySelectorAll("[data-call-play]").forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();
        const id=btn.dataset.callPlay;
        if(typeof choosePlayForGame==="function"){choosePlayForGame(id);return;}
        const play=all.find(item=>String(item?.id)===String(id));
        if(!play) return;
        if(typeof currentGame!=="undefined"&&!currentGame){alert("Start a game before calling a play.");return;}
        if(typeof pendingCalledPlay!=="undefined") pendingCalledPlay=play;
        closeModal();
        if(typeof renderCalledPlay==="function") renderCalledPlay();
      });
    });
    body?.querySelectorAll("[data-remove-index]").forEach(btn=>{
      btn.addEventListener("click",event=>{
        event.preventDefault();coach11820RemovePlay(btn.dataset.removeIndex);
      });
    });
  }

  function coach1190BindPlaysDelegation(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel||panel.dataset.coach1190Plays==="1") return;
    panel.dataset.coach1190Plays="1";
    panel.addEventListener("click",event=>{
      const typeBtn=event.target.closest("[data-type]");
      if(typeBtn&&panel.contains(typeBtn)){
        event.preventDefault();event.stopPropagation();
        coach11819OpenCategory(typeBtn.dataset.type);return;
      }
      const listBtn=event.target.closest("[data-game-list]");
      if(listBtn&&panel.contains(listBtn)){
        event.preventDefault();event.stopPropagation();
        coach11819OpenGameList();
      }
    },true);
  }

  function coach11819BuildPlays(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel) return;

    const oldPreview=document.getElementById("fivePlaysPreview");
    if(oldPreview) oldPreview.style.display="none";

    let box=panel.querySelector(".coach11819Plays");
    if(!box){
      box=document.createElement("div");
      box.className="coach11819Plays";
      panel.appendChild(box);
    }

    box.innerHTML=`
      <button type="button" class="coach11819PlayBtn" data-open-team-playbook="1">
        📘 OPEN TEAM PLAYBOOK
      </button>
      <button type="button" class="coach11819PlayBtn gameList" data-game-list="1">
        GAME PLAY LIST
      </button>
    `;

    box.querySelector("[data-open-team-playbook]")?.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      coach1192OpenPlaybook();
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
      <input type="search" class="coach11839Search" data-coach11839-search
        placeholder="Search player name or number" autocomplete="off">
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
    const search=body?.querySelector("[data-coach11839-search]");
    const roster=body?.querySelector(".coach11832RosterList");
    if(search && roster){
      search.addEventListener("input",()=>{
        const q=String(search.value||"").trim().toLowerCase();
        roster.querySelectorAll(".coach11832RosterRow").forEach(row=>{
          row.style.display=!q || row.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }

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

  function coach1190BindStatsDelegation(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="stats"]');
    if(!panel||panel.dataset.coach1190Stats==="1") return;
    panel.dataset.coach1190Stats="1";
    panel.addEventListener("click",event=>{
      const btn=event.target.closest("[data-stat]");
      if(!btn||!panel.contains(btn)) return;
      event.preventDefault();event.stopPropagation();
      coach11821Open(btn.dataset.stat);
    },true);
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


  function coach1192LineKey(name){
    const upper=String(name||"").toUpperCase();
    if(upper.includes("BLACK")) return "BLACK";
    if(upper.includes("BLUE")) return "BLUE";
    if(upper.includes("GREEN")) return "GREEN";
    if(upper.includes("GOLD")) return "GOLD";
    return "BLUE";
  }

  function coach1192ApplyLineColor(){
    const overlay=document.getElementById("coach1189LineOverlay");
    if(!overlay) return;
    const key=coach1192LineKey(lines?.[currentLine]?.name || coach1189SelectedLineText());
    overlay.style.setProperty("--coach-active-line",LINE_COLORS[key]||"#1593ff");
    overlay.querySelectorAll(".coach11814SwitchBtn").forEach(btn=>{
      const k=coach1192LineKey(btn.textContent);
      btn.style.setProperty("--coach-line-button",LINE_COLORS[k]||"#1593ff");
    });
  }

  function coach1192OpenPlaybook(){
    try{
      if(typeof openPlaybook==="function"){ openPlaybook(); return true; }
      const btn=document.getElementById("playbookBtn");
      if(btn){ btn.click(); return true; }
    }catch(error){console.warn("119.2 playbook:",error);}
    return false;
  }

  function coach1192BindPlayPanel(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel || panel.dataset.coach1194Bound==="1") return;
    panel.dataset.coach1194Bound="1";

    panel.addEventListener("click",event=>{
      const game=event.target.closest("[data-game-list]");
      if(game){
        event.preventDefault();
        event.stopImmediatePropagation();
        coach11819OpenGameList();
        return;
      }

      const playbook=event.target.closest("[data-open-team-playbook]");
      if(playbook){
        event.preventDefault();
        event.stopImmediatePropagation();
        coach1192OpenPlaybook();
        return;
      }

      /* Tapping the PLAY section itself opens the one shared Team Playbook. */
      if(event.target.closest(".fivePanelLabel,.expandHint,.v114TapLayer")){
        event.preventDefault();
        event.stopImmediatePropagation();
        coach1192OpenPlaybook();
      }
    },true);
  }

  function coach1192BindExpandedPlayers(){
    const radio=document.getElementById("v114Players");
    if(!radio || radio.dataset.coach1192Players==="1") return;
    radio.dataset.coach1192Players="1";
    radio.addEventListener("change",()=>{
      if(!radio.checked) return;
      requestAnimationFrame(()=>{coach1191BuildRosterBoard();});
    });
  }

  function coach1192PatchLineOverlay(){
    const overlay=document.getElementById("coach1189LineOverlay");
    if(!overlay || overlay.classList.contains("hidden")) return;
    coach1192ApplyLineColor();
  }


  function coach1194CurrentLineName(){
    return String(
      document.querySelector("#lineSelect option:checked")?.textContent ||
      lines?.[currentLine]?.name ||
      "LINE"
    ).trim();
  }

  function coach1194OpenLiveField(){
    const name=coach1194CurrentLineName();
    if(typeof coach1189OpenLineField==="function"){
      coach1189OpenLineField(name);
      return;
    }
    if(typeof renderField==="function") renderField();
  }

  function coach1194EnsurePanelActions(){
    const configs=[
      ["field","OPEN LIVE FIELD",coach1194OpenLiveField],
      ["players","MANAGE / ADD PLAYERS",()=>{
        if(typeof openRosterManager==="function") openRosterManager();
      }],
      ["lines","MANAGE LINES",()=>openTool("lines")],
      ["stats","FULL STATS",()=>openTool("stats")],
      ["plays","OPEN TEAM PLAYBOOK",()=>coach1192OpenPlaybook()]
    ];

    configs.forEach(([panelName,label,action])=>{
      const panel=document.querySelector(`#fivePanelDashboard .fivePanel[data-panel="${panelName}"]`);
      if(!panel) return;

      let bar=panel.querySelector(".coach1194PanelActions");
      if(!bar){
        bar=document.createElement("div");
        bar.className="coach1194PanelActions";
        panel.appendChild(bar);
      }

      if(bar.dataset.coach1194Built==="1") return;
      bar.dataset.coach1194Built="1";

      const button=document.createElement("button");
      button.type="button";
      button.className="coach1194PanelAction";
      button.textContent=label;
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        action();
      });
      bar.replaceChildren(button);
    });
  }

  function coach1194CsvToArray(value){
    return String(value||"")
      .split(",")
      .map(x=>x.trim())
      .filter(Boolean)
      .slice(0,3);
  }

  function coach1194OpenPlayerEditor(playerId){
    const list=(typeof players!=="undefined"&&Array.isArray(players))?players:[];
    const player=list.find(p=>String(p.id)===String(playerId));
    if(!player || typeof openModal!=="function") return;

    const num=player.jersey_number??player.number??"";
    const name=player.name||player.full_name||"";
    const status=String(player.availability_status||"active").toLowerCase();
    const offense=Array.isArray(player.offense_positions)?player.offense_positions.join(", "):"";
    const defense=Array.isArray(player.defense_positions)?player.defense_positions.join(", "):"";

    document.body.classList.add("coach1194-player-editing");

    openModal(`
      <div class="coach1194EditorHead">
        <div><small>PLAYER EDITOR</small><h2>#${coach11819Esc(num)} ${coach11819Esc(name)}</h2></div>
        <button type="button" class="secondary" data-coach1194-close>✕ CLOSE</button>
      </div>
      <div class="coach1194EditorGrid">
        <label>JERSEY #</label>
        <input inputmode="numeric" data-coach1194-number value="${coach11819Esc(num)}">

        <label>PLAYER NAME</label>
        <input data-coach1194-name value="${coach11819Esc(name)}">

        <label>AVAILABILITY</label>
        <select data-coach1194-status>
          <option value="active" ${status==="active"?"selected":""}>ACTIVE</option>
          <option value="injured" ${status==="injured"?"selected":""}>INJURED</option>
          <option value="out" ${status==="out"?"selected":""}>OUT</option>
        </select>

        <label>OFFENSE POSITIONS</label>
        <input data-coach1194-offense value="${coach11819Esc(offense)}" placeholder="QB, F, Y">

        <label>DEFENSE POSITIONS</label>
        <input data-coach1194-defense value="${coach11819Esc(defense)}" placeholder="S, LE, FC">
      </div>
      <div class="coach1194EditorHint">Enter up to three positions on each side, separated by commas.</div>
      <div class="coach1194EditorActions">
        <button type="button" class="secondary" data-coach1194-cancel>CANCEL</button>
        <button type="button" class="primary" data-coach1194-save>SAVE PLAYER</button>
      </div>
    `);

    const body=document.getElementById("modalBody");
    const close=()=>{
      document.body.classList.remove("coach1194-player-editing");
      if(typeof closeModal==="function") closeModal();
      coach1191BuildRosterBoard();
    };

    body?.querySelector("[data-coach1194-close]")?.addEventListener("click",close);
    body?.querySelector("[data-coach1194-cancel]")?.addEventListener("click",close);

    body?.querySelector("[data-coach1194-save]")?.addEventListener("click",async event=>{
      event.preventDefault();

      if(typeof roleCanEdit==="function" && !roleCanEdit()){
        alert("Coach access is required to edit players.");
        return;
      }
      if(!navigator.onLine){
        alert("Player roster edits require an internet connection.");
        return;
      }

      const numberRaw=String(body.querySelector("[data-coach1194-number]")?.value||"").trim();
      const nameValue=String(body.querySelector("[data-coach1194-name]")?.value||"").trim();
      const statusValue=String(body.querySelector("[data-coach1194-status]")?.value||"active");
      const offenseValue=coach1194CsvToArray(body.querySelector("[data-coach1194-offense]")?.value);
      const defenseValue=coach1194CsvToArray(body.querySelector("[data-coach1194-defense]")?.value);

      if(!nameValue){
        alert("Enter the player's name.");
        return;
      }

      const jerseyNumber=Number(numberRaw);
      if(!Number.isFinite(jerseyNumber)){
        alert("Enter a valid jersey number.");
        return;
      }

      const saveBtn=body.querySelector("[data-coach1194-save]");
      if(saveBtn){saveBtn.disabled=true;saveBtn.textContent="SAVING…";}

      try{
        const payload={
          jersey_number:jerseyNumber,
          name:nameValue,
          availability_status:statusValue,
          offense_positions:offenseValue,
          defense_positions:defenseValue
        };

        const result=await sb.from("players")
          .update(payload)
          .eq("id",player.id)
          .select()
          .single();

        if(result.error) throw result.error;

        const index=players.findIndex(p=>String(p.id)===String(player.id));
        if(index>=0) players[index]={...players[index],...result.data};

        try{
          if(typeof renderPlayers==="function") renderPlayers();
          if(typeof renderAll==="function") renderAll();
          if(typeof saveOfflineSnapshot==="function") saveOfflineSnapshot();
        }catch{}

        close();
        coach11831BuildPlayersSummary();
        mirrorDashboardField();
      }catch(error){
        console.error("119.4 save player:",error);
        alert(error?.message||"Could not save this player.");
        if(saveBtn){saveBtn.disabled=false;saveBtn.textContent="SAVE PLAYER";}
      }
    });
  }

  function coach1194ShowHubIfGameVisible(){
    const app=document.getElementById("app");
    const dashboard=document.getElementById("fivePanelDashboard");
    if(!app || app.classList.contains("hidden") || !dashboard) return;

    const lineOverlay=document.getElementById("coach1189LineOverlay");
    if(lineOverlay && !lineOverlay.classList.contains("hidden")) return;

    const modal=document.getElementById("modal");
    if(modal && !modal.classList.contains("hidden")) return;

    if(document.body.classList.contains("coach-field-expanded") ||
       document.body.classList.contains("coach-players-expanded") ||
       document.body.classList.contains(TOOL_MODE_CLASS)) return;

    showFivePanelDashboard();
  }

  function coach1194BindHub(){
    document.body.classList.add("coach1194-fivehub");

    const back=document.querySelector("#fivePanelDashboard .v114Back");
    if(back) back.textContent="← 5-PANEL DASHBOARD";

    const live=document.getElementById("fivePanelClose");
    if(live && live.dataset.coach1194!=="1"){
      live.dataset.coach1194="1";
      live.textContent="LIVE FIELD";
      live.addEventListener("click",event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        coach1194OpenLiveField();
      },true);
    }

    const app=document.getElementById("app");
    if(app && app.dataset.coach1194Observed!=="1"){
      app.dataset.coach1194Observed="1";
      const observer=new MutationObserver(()=>setTimeout(coach1194ShowHubIfGameVisible,40));
      observer.observe(app,{attributes:true,attributeFilter:["class"]});
    }

    coach1194EnsurePanelActions();
  }







  function coach1200LineColor(line,index){
    return line?.color || ["#111111","#178bff","#16b35d","#e2ac17"][index] || "#178bff";
  }

  function coach1200RenderBar(){
    let bar=document.getElementById("coach1200DashboardBar");
    if(!bar){
      bar=document.createElement("div");
      bar.id="coach1200DashboardBar";
      document.body.appendChild(bar);
    }

    const lineButtons=(Array.isArray(lines)?lines:[]).map((line,i)=>{
      const color=coach1200LineColor(line,i);
      const live=i===currentLine;
      return `
        <button type="button"
          class="coach1200LineBtn ${live?"live":""}"
          style="border-color:${coach11819Esc(color)}!important;background:${coach11819Esc(color)}!important"
          onclick="coach1200SelectLine(${i})">
          ${coach11819Esc(line.name||`LINE ${i+1}`)}
          <small>${live?"CURRENT":"SELECT"}</small>
        </button>`;
    }).join("");

    bar.innerHTML=`
      <div class="coach1200Tools">
        <button type="button" onclick="coach1200OpenPlayers()">PLAYERS</button>
        <button type="button" onclick="openLines()">LINES</button>
      </div>
      <div class="coach1200Lines">${lineButtons}</div>
      <div class="coach1200Tools">
        <button type="button" class="coach1204MoveBtn" onclick="coach1204ToggleMoveMode()">MOVE PLAYERS</button>
        <button type="button" onclick="coach1200OpenStats()">STATS</button>
        <button type="button" onclick="coach1200OpenPlaybook()">PLAYBOOK</button>
        <button type="button" onclick="coach1213Open()">SPECIAL TEAMS</button>
      </div>`;
    bar.querySelectorAll(".coach1204MoveBtn").forEach(b=>b.classList.toggle("active",coach1204MoveMode));
  }

  function coach1200SelectLine(index){
    const i=Number(index);
    if(!Number.isFinite(i) || !lines?.[i]) return;

    if(typeof setLine==="function"){
      setLine(i);
    }else{
      currentLine=i;
      if(typeof renderAll==="function") renderAll();
    }

    setTimeout(()=>{
      coach1200RenderBar();
      try{
        const badge=document.getElementById("fullscreenLineBadge");
        if(badge){
          badge.textContent=lines?.[currentLine]?.name||`LINE ${currentLine+1}`;
          badge.style.backgroundColor=coach1200LineColor(lines?.[currentLine],currentLine);
          badge.style.borderColor=coach1200LineColor(lines?.[currentLine],currentLine);
        }
      }catch(e){}
    },40);
  }

  function coach1200GoMainDashboard(){
    document.body.classList.remove("coach1200-game-dashboard");
    document.getElementById("coach1200DashboardBar")?.remove();

    try{
      if(typeof setFieldFullscreen==="function") setFieldFullscreen(false);
    }catch(e){}

    try{
      const fp=document.getElementById("fivePanelDashboard");
      if(fp){
        fp.classList.add("hidden");
        fp.style.display="";
      }
    }catch(e){}

    try{
      if(typeof showDashboard==="function") showDashboard();
    }catch(e){}
  }

  function coach1200OpenPlayers(){
    if(typeof openModal!=="function") return;

    const list=(Array.isArray(players)?players.slice():[])
      .sort((a,b)=>Number(a.jersey_number||999)-Number(b.jersey_number||999));

    openModal(`
      <div class="coach1200PlayersHead">
        <div><small>GAME DAY DASHBOARD</small><h2>Players</h2></div>
        <div class="coach1200PlayersActions">
          <button class="primary" onclick="openPlayerModal(null)">+ ADD PLAYER</button>
          <button class="secondary" onclick="closeModal()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1200PlayersList">
        ${list.map(p=>{
          const status=String(p.availability_status||"active").toLowerCase();
          const off=Array.isArray(p.offense_positions)?p.offense_positions.join("/"):"";
          const def=Array.isArray(p.defense_positions)?p.defense_positions.join("/"):"";
          return `
            <button class="coach1200PlayerRow" onclick="editPlayer('${coach11819Esc(String(p.id))}')">
              <b>#${coach11819Esc(p.jersey_number??"")}</b>
              <span>
                <b>${coach11819Esc(p.name||"Player")}</b>
                <small>${coach11819Esc([off&&`O:${off}`,def&&`D:${def}`].filter(Boolean).join(" • ")||"No saved positions")}</small>
              </span>
              <span class="coach1200Status ${coach11819Esc(status)}">${status==="injured"?"INJ":status==="out"?"OUT":"OK"}</span>
            </button>`;
        }).join("")||'<div class="notice">No players loaded.</div>'}
      </div>`);
  }



  let coach1204MoveMode=false;
  let coach1204FirstPositionId=null;

  function coach1204Notice(message){
    let el=document.getElementById("coach1204MoveNotice");
    if(!message){
      el?.remove();
      return;
    }
    if(!el){
      el=document.createElement("div");
      el.id="coach1204MoveNotice";
      document.body.appendChild(el);
    }
    el.textContent=message;
  }

  function coach1204ClearSelection(){
    coach1204FirstPositionId=null;
    document.querySelectorAll("#field .slot.coach1204-selected")
      .forEach(el=>el.classList.remove("coach1204-selected"));
  }

  function coach1204ToggleMoveMode(force){
    coach1204MoveMode = typeof force==="boolean" ? force : !coach1204MoveMode;
    coach1204ClearSelection();
    document.body.classList.toggle("coach1204-move-mode",coach1204MoveMode);

    document.querySelectorAll(".coach1204MoveBtn")
      .forEach(b=>b.classList.toggle("active",coach1204MoveMode));

    if(coach1204MoveMode){
      coach1204Notice("MOVE PLAYERS: tap one player, then tap the position to swap with");
    }else{
      coach1204Notice("");
    }
  }

  function coach1204SlotLabel(slot){
    if(!slot) return "";
    for(const node of slot.childNodes){
      if(node.nodeType===Node.TEXT_NODE && String(node.textContent||"").trim()){
        return String(node.textContent||"").trim();
      }
    }
    return String(slot.textContent||"").trim().split(/\s+/)[0]||"";
  }

  function coach1204PositionForSlot(slot){
    const label=coach1204SlotLabel(slot);
    if(!label) return null;
    const side=slot.classList.contains("def") ? "defense" : "offense";
    return (positions||[]).find(p=>
      String(p.side)===side &&
      String(p.label||p.slot_key||"").trim().toUpperCase()===label.toUpperCase()
    ) || null;
  }

  function coach1204AssignmentAt(positionId){
    const line=lines?.[currentLine];
    if(!line) return null;
    return (assignments||[]).find(a=>
      String(a.line_id)===String(line.id) &&
      String(a.position_label_id)===String(positionId)
    ) || null;
  }

  async function coach1204SwapPositions(firstId,secondId){
    const line=lines?.[currentLine];
    const first=positions.find(p=>String(p.id)===String(firstId));
    const second=positions.find(p=>String(p.id)===String(secondId));
    if(!line||!first||!second) return;

    if(first.side!==second.side){
      alert("Choose two positions on the same side of the ball.");
      return;
    }

    const a=coach1204AssignmentAt(first.id);
    const b=coach1204AssignmentAt(second.id);
    const firstPlayer=a?.player_id||"";
    const secondPlayer=b?.player_id||"";

    try{
      await assignPlayerDirect(line.id,first.id,"");
      await assignPlayerDirect(line.id,second.id,"");

      if(secondPlayer) await assignPlayerDirect(line.id,first.id,secondPlayer);
      if(firstPlayer) await assignPlayerDirect(line.id,second.id,firstPlayer);

      if(navigator.onLine && typeof loadAssignments==="function"){
        await loadAssignments();
      }

      if(typeof saveOfflineSnapshot==="function") saveOfflineSnapshot();
      if(typeof renderField==="function") renderField();
      if(typeof renderPlayers==="function") renderPlayers();

      coach1204ClearSelection();
      coach1204Notice("PLAYERS MOVED — tap another player to continue");
      setTimeout(()=>{
        if(coach1204MoveMode){
          coach1204Notice("MOVE PLAYERS: tap one player, then tap the position to swap with");
        }
      },1100);
    }catch(error){
      console.error("120.4 field swap:",error);
      coach1204ClearSelection();
      alert(error?.message||"Could not move these players.");
    }
  }

  function coach1204BindFieldMove(){
    const field=document.getElementById("field");
    if(!field || field.dataset.coach1204MoveBound==="1") return;
    field.dataset.coach1204MoveBound="1";

    field.addEventListener("click",event=>{
      if(!coach1204MoveMode) return;
      const slot=event.target.closest(".slot");
      if(!slot) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const pos=coach1204PositionForSlot(slot);
      if(!pos){
        alert("I could not identify that field position.");
        return;
      }

      if(!coach1204FirstPositionId){
        coach1204FirstPositionId=pos.id;
        slot.classList.add("coach1204-selected");
        coach1204Notice(`SELECTED ${pos.label} — now tap the position to swap with`);
        return;
      }

      if(String(coach1204FirstPositionId)===String(pos.id)){
        coach1204ClearSelection();
        coach1204Notice("MOVE PLAYERS: tap one player, then tap the position to swap with");
        return;
      }

      coach1204SwapPositions(coach1204FirstPositionId,pos.id);
    },true);
  }

  window.coach1204ToggleMoveMode=coach1204ToggleMoveMode;



  const COACH1206_SPECIAL_TYPES = [
    {key:"kickoff_offense", label:"KICKOFF OFFENSE", base:"Kickoff"},
    {key:"kickoff_defense", label:"KICKOFF DEFENSE", base:"Kick Return"},
    {key:"punt_offense", label:"PUNT OFFENSE", base:"Punt"},
    {key:"punt_defense", label:"PUNT DEFENSE", base:"Punt Return"}
  ];

  function coach1206CurrentLine(){ return lines?.[currentLine] || null; }
  function coach1206UnitName(line,type){ return `${line.name} — ${type.label}`; }

  async function coach1206EnsureFourUnits(){
    const line=coach1206CurrentLine();
    if(!line) return [];
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const ensured=[];
    for(const type of COACH1206_SPECIAL_TYPES){
      let unit=(specialUnits||[]).find(u=>String(u.name)===coach1206UnitName(line,type));
      if(!unit && navigator.onLine){
        const sort=Math.max(-1,...(specialUnits||[]).map(u=>Number(u.sort_order||0)))+1;
        const r=await sb.from("special_team_units")
          .insert({team_id:team.id,name:coach1206UnitName(line,type),sort_order:sort})
          .select().single();
        if(r.error){ console.error(r.error); continue; }
        unit=r.data;

        const defs=(typeof SPECIAL_DEFAULTS!=="undefined" && SPECIAL_DEFAULTS[type.base]) || [];
        if(defs.length){
          const sr=await sb.from("special_team_slots").insert(defs.map((x,i)=>({
            unit_id:unit.id,slot_key:x[0],label:x[1],x_pct:x[2],y_pct:x[3],sort_order:i
          })));
          if(sr.error) console.error(sr.error);
        }
        if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
        unit=(specialUnits||[]).find(u=>String(u.id)===String(unit.id)) || unit;
      }
      if(unit) ensured.push({type,unit});
    }
    return ensured;
  }

  async function coach1206RefreshNativeSpecialSelector(){
    const select=document.getElementById("specialUnitSelect");
    if(!select) return;

    const line=coach1206CurrentLine();
    if(!line) return;

    const units=await coach1206EnsureFourUnits();
    if(!units.length) return;

    const currentId=specialUnits?.[currentSpecialUnit]?.id;
    let desiredIndex=units.findIndex(x=>String(x.unit.id)===String(currentId));
    if(desiredIndex<0) desiredIndex=0;

    select.innerHTML=units.map((x,i)=>
      `<option value="${i}" ${i===desiredIndex?"selected":""}>${x.type.label}</option>`
    ).join("");

    select.onchange=()=>{
      const picked=units[Number(select.value)];
      if(!picked) return;
      const idx=(specialUnits||[]).findIndex(u=>String(u.id)===String(picked.unit.id));
      if(idx<0) return;
      currentSpecialUnit=idx;
      activeView="special";
      unifiedFieldView=false;
      editFieldMode=false;
      if(typeof renderField==="function") renderField();
      setTimeout(coach1206RefreshNativeSpecialSelector,30);
    };

    const selected=units[desiredIndex];
    if(selected){
      const idx=(specialUnits||[]).findIndex(u=>String(u.id)===String(selected.unit.id));
      if(idx>=0 && currentSpecialUnit!==idx){
        currentSpecialUnit=idx;
      }
    }

    coach1206EnsureSpecialTools();
  }

  function coach1206EnsureSpecialTools(){
    const select=document.getElementById("specialUnitSelect");
    if(!select) return;
    const host=select.parentElement;
    if(!host) return;

    let tools=document.getElementById("coach1206SpecialTools");
    if(!tools){
      tools=document.createElement("div");
      tools.id="coach1206SpecialTools";
      tools.innerHTML=`
        <button type="button" onclick="coach1206RenameSpots()">RENAME SPOTS</button>
        <button type="button" onclick="coach1206MoveSpots()">MOVE SPOTS</button>`;
      host.appendChild(tools);
    }
  }

  function coach1206CurrentSpecialUnit(){
    return specialUnits?.[currentSpecialUnit] || null;
  }

  function coach1206CloseRename(){
    document.getElementById("coach1206RenameOverlay")?.remove();
  }

  async function coach1206RenameSpots(){
    const unit=coach1206CurrentSpecialUnit();
    if(!unit) return alert("Choose a Special Teams unit first.");
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const slots=(specialSlots||[])
      .filter(s=>String(s.unit_id)===String(unit.id))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));

    coach1206CloseRename();
    const overlay=document.createElement("div");
    overlay.id="coach1206RenameOverlay";
    overlay.innerHTML=`
      <div class="coach1206RenameCard">
        <div class="coach1205Head">
          <div><small>${coach11819Esc(unit.name)}</small><h2>Rename Spots</h2></div>
          <button class="secondary" onclick="coach1206CloseRename()">✕ CLOSE</button>
        </div>
        <div class="coach1206RenameList">
          ${slots.map((s,i)=>`
            <label><b>${coach11819Esc(s.slot_key)}</b>
              <input id="coach1206Spot${i}" value="${coach11819Esc(s.label||s.slot_key||"")}">
            </label>`).join("")}
        </div>
        <div class="coach1205ManageRow">
          <button class="primary" onclick="coach1206SaveSpotNames('${coach11819Esc(String(unit.id))}')">SAVE NAMES</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  async function coach1206SaveSpotNames(unitId){
    const slots=(specialSlots||[])
      .filter(s=>String(s.unit_id)===String(unitId))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));

    for(let i=0;i<slots.length;i++){
      const label=document.getElementById(`coach1206Spot${i}`)?.value.trim() || slots[i].slot_key;
      const r=await sb.from("special_team_slots").update({label}).eq("id",slots[i].id);
      if(r.error){ alert(r.error.message); return; }
    }

    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    if(typeof renderField==="function") renderField();
    coach1206CloseRename();
    setTimeout(coach1206RefreshNativeSpecialSelector,30);
  }

  function coach1206MoveSpots(){
    if(activeView!=="special") return alert("Choose a Special Teams unit first.");
    editFieldMode=true;
    if(typeof renderField==="function") renderField();
    alert("MOVE SPOTS is on. Drag any Special Teams spot box to a new location.");
  }

  function coach1206WatchSpecialMode(){
    if(!document.body.classList.contains("coach1200-game-dashboard")) return;
    if(activeView==="special"){
      coach1206RefreshNativeSpecialSelector();
    }else{
      document.getElementById("coach1206SpecialTools")?.remove();
    }
  }

  window.coach1206RenameSpots=coach1206RenameSpots;
  window.coach1206CloseRename=coach1206CloseRename;
  window.coach1206SaveSpotNames=coach1206SaveSpotNames;
  window.coach1206MoveSpots=coach1206MoveSpots;
  window.coach1206RefreshNativeSpecialSelector=coach1206RefreshNativeSpecialSelector;

  const COACH1205_SPECIAL_TYPES = [
    {key:"kickoff_offense", label:"KICKOFF OFFENSE", base:"Kickoff"},
    {key:"kickoff_defense", label:"KICKOFF DEFENSE", base:"Kick Return"},
    {key:"punt_offense", label:"PUNT OFFENSE", base:"Punt"},
    {key:"punt_defense", label:"PUNT DEFENSE", base:"Punt Return"}
  ];

  function coach1205CurrentLine(){ return lines?.[currentLine] || null; }
  function coach1205UnitName(line,type){ return `${line.name} • ${type.label}`; }

  async function coach1205EnsureUnit(line,type){
    if(!line) return null;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    let unit=(specialUnits||[]).find(u=>String(u.name)===coach1205UnitName(line,type));
    if(unit) return unit;
    if(!navigator.onLine){ alert("Creating a new Special Teams unit requires an internet connection."); return null; }

    const sort=Math.max(-1,...(specialUnits||[]).map(u=>Number(u.sort_order||0)))+1;
    const r=await sb.from("special_team_units")
      .insert({team_id:team.id,name:coach1205UnitName(line,type),sort_order:sort})
      .select().single();
    if(r.error){ alert(r.error.message); return null; }
    unit=r.data;

    const defs=(typeof SPECIAL_DEFAULTS!=="undefined" && SPECIAL_DEFAULTS[type.base]) || [];
    if(defs.length){
      const sr=await sb.from("special_team_slots").insert(defs.map((x,i)=>({
        unit_id:unit.id,slot_key:x[0],label:x[1],x_pct:x[2],y_pct:x[3],sort_order:i
      })));
      if(sr.error){ alert(sr.error.message); return null; }
    }
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    return (specialUnits||[]).find(u=>String(u.id)===String(unit.id)) || unit;
  }

  async function coach1205ActivateUnit(typeKey){
    const line=coach1205CurrentLine();
    const type=COACH1205_SPECIAL_TYPES.find(t=>t.key===typeKey);
    if(!line||!type) return;
    const unit=await coach1205EnsureUnit(line,type);
    if(!unit) return;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const idx=(specialUnits||[]).findIndex(u=>String(u.id)===String(unit.id));
    if(idx<0) return;
    currentSpecialUnit=idx;
    activeView="special";
    unifiedFieldView=false;
    editFieldMode=false;
    if(typeof renderSpecialUnitSelect==="function") renderSpecialUnitSelect();
    if(typeof renderField==="function") renderField();
    coach1205CloseSpecialTeams();
  }

  function coach1205CloseSpecialTeams(){ document.getElementById("coach1205SpecialPanel")?.remove(); }

  function coach1205OpenSpecialTeams(){
    coach1205CloseSpecialTeams();
    const line=coach1205CurrentLine();
    if(!line) return alert("Select a line first.");
    const panel=document.createElement("div");
    panel.id="coach1205SpecialPanel";
    panel.innerHTML=`
      <div class="coach1205Card">
        <div class="coach1205Head">
          <div><small>${coach11819Esc(line.name)}</small><h2>Special Teams</h2></div>
          <button type="button" class="secondary" onclick="coach1205CloseSpecialTeams()">✕ CLOSE</button>
        </div>
        <div class="coach1205UnitGrid">
          ${COACH1205_SPECIAL_TYPES.map(t=>`
            <button type="button" class="coach1205UnitBtn" onclick="coach1205ActivateUnit('${t.key}')">
              ${t.label}<small>${coach11819Esc(line.name)} only</small>
            </button>`).join("")}
        </div>
        <div class="coach1205ManageRow">
          <button type="button" class="secondary" onclick="coach1205RenameCurrentSpots()">RENAME SPOTS</button>
          <button type="button" class="secondary" onclick="coach1205MoveCurrentSpots()">MOVE SPOTS</button>
        </div>
        <div id="coach1205RenamePanel"></div>
      </div>`;
    document.body.appendChild(panel);
  }

  async function coach1205PickType(message){
    const n=Number(prompt(`${message}\n1 = Kickoff Offense\n2 = Kickoff Defense\n3 = Punt Offense\n4 = Punt Defense`));
    return COACH1205_SPECIAL_TYPES[n-1] || null;
  }

  async function coach1205RenameCurrentSpots(){
    const line=coach1205CurrentLine(); if(!line) return;
    const type=await coach1205PickType("Which unit do you want to rename spots for?");
    if(!type) return;
    const unit=await coach1205EnsureUnit(line,type); if(!unit) return;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const host=document.getElementById("coach1205RenamePanel"); if(!host) return;
    host.innerHTML=`
      <h3>${type.label} — Rename Spots</h3>
      ${slots.map((s,i)=>`
        <label class="coach1205RenameRow">
          <b>${coach11819Esc(s.slot_key||`SPOT ${i+1}`)}</b>
          <input id="coach1205Spot${i}" value="${coach11819Esc(s.label||s.slot_key||"")}">
        </label>`).join("")}
      <div class="coach1205ManageRow">
        <button type="button" class="primary" onclick="coach1205SaveSpotNames('${coach11819Esc(String(unit.id))}')">SAVE NAMES</button>
      </div>`;
  }

  async function coach1205SaveSpotNames(unitId){
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unitId)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    for(let i=0;i<slots.length;i++){
      const label=document.getElementById(`coach1205Spot${i}`)?.value.trim() || slots[i].slot_key;
      const r=await sb.from("special_team_slots").update({label}).eq("id",slots[i].id);
      if(r.error){ alert(r.error.message); return; }
    }
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    alert("Spot names saved.");
    coach1205OpenSpecialTeams();
  }

  async function coach1205MoveCurrentSpots(){
    const line=coach1205CurrentLine(); if(!line) return;
    const type=await coach1205PickType("Which unit do you want to move spots for?");
    if(!type) return;
    const unit=await coach1205EnsureUnit(line,type); if(!unit) return;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const idx=(specialUnits||[]).findIndex(u=>String(u.id)===String(unit.id));
    if(idx<0) return;
    currentSpecialUnit=idx;
    activeView="special";
    unifiedFieldView=false;
    editFieldMode=true;
    if(typeof renderSpecialUnitSelect==="function") renderSpecialUnitSelect();
    if(typeof renderField==="function") renderField();
    coach1205CloseSpecialTeams();
    alert("MOVE SPOTS is on. Drag the Special Teams spot boxes to new locations. Use the native edit/back control when finished.");
  }

  window.coach1205OpenSpecialTeams=coach1205OpenSpecialTeams;
  window.coach1205CloseSpecialTeams=coach1205CloseSpecialTeams;
  window.coach1205ActivateUnit=coach1205ActivateUnit;
  window.coach1205RenameCurrentSpots=coach1205RenameCurrentSpots;
  window.coach1205SaveSpotNames=coach1205SaveSpotNames;
  window.coach1205MoveCurrentSpots=coach1205MoveCurrentSpots;

  function coach1201OpenSpecialTeams(){
    try{
      if(typeof openSpecialTeams==="function"){
        openSpecialTeams();
        return;
      }
      if(typeof openSpecialTeamsManager==="function"){
        openSpecialTeamsManager();
        return;
      }
      const btn=document.getElementById("specialTeamsBtn");
      if(btn){ btn.click(); return; }

      /* Native field already has OFFENSE/DEFENSE + SPECIAL TEAMS tabs.
         If no manager function exists, activate that proven native control. */
      const native=[...document.querySelectorAll("button")].find(b=>
        /SPECIAL TEAMS/i.test(String(b.textContent||"")) &&
        !b.closest("#coach1200DashboardBar")
      );
      if(native){ native.click(); return; }
    }catch(error){
      console.error("120.1 special teams:",error);
    }
    alert("Special Teams could not be opened.");
  }


  function coach1202HideGameStatus(){
    [
      "gameStrip","quarterDisplay","clockDisplay","clockToggleBtn",
      "possessionDisplay","opponentBtn","driveDisplay","downDisplay","distanceDisplay"
    ].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.style.setProperty("display","none","important");
      el.style.setProperty("visibility","hidden","important");
      el.style.setProperty("height","0","important");
      el.style.setProperty("min-height","0","important");
      el.style.setProperty("margin","0","important");
      el.style.setProperty("padding","0","important");
      el.style.setProperty("border","0","important");
      el.style.setProperty("pointer-events","none","important");
    });

    document.querySelectorAll(".opponentUnderPossession,.gameStrip").forEach(el=>{
      el.style.setProperty("display","none","important");
      el.style.setProperty("height","0","important");
      el.style.setProperty("margin","0","important");
      el.style.setProperty("padding","0","important");
    });
  }

  function coach1201EnforceCleanField(){
    if(!document.body.classList.contains("coach1200-game-dashboard")) return;
    coach1202HideGameStatus();

    const fp=document.getElementById("fivePanelDashboard");
    if(fp){
      fp.classList.add("hidden");
      fp.style.setProperty("display","none","important");
      fp.style.setProperty("visibility","hidden","important");
      fp.style.setProperty("pointer-events","none","important");
    }

    /* Fullscreen is the dashboard state; keep native field active. */
    if(!document.body.classList.contains("fieldFullscreen")){
      try{
        if(typeof setFieldFullscreen==="function") setFieldFullscreen(true);
      }catch(e){}
    }

    coach1200PrepareNativeControls();
    coach1200RenderBar();
    coach1204BindFieldMove();
  }

  window.coach1201OpenSpecialTeams=coach1201OpenSpecialTeams;
  window.coach1202HideGameStatus=coach1202HideGameStatus;

  function coach1200OpenStats(){
    if(typeof openStats==="function"){
      openStats();
      return;
    }
    const btn=document.getElementById("statsBtn");
    if(btn){ btn.click(); return; }
    alert("Stats could not be opened.");
  }

  function coach1200OpenPlaybook(){
    if(typeof openPlaybook==="function"){
      openPlaybook();
      return;
    }
    const btn=document.getElementById("playbookBtn");
    if(btn){ btn.click(); return; }
    alert("Playbook could not be opened.");
  }

  function coach1200PrepareNativeControls(){
    const controls=document.querySelector(".fullscreenControls");
    if(!controls) return;

    const exit=[...controls.querySelectorAll("button")].find(b=>
      /EXIT FULL SCREEN/i.test(String(b.textContent||""))
    );
    if(exit && exit.dataset.coach1200Home!=="1"){
      exit.dataset.coach1200Home="1";
      exit.setAttribute("data-coach1200-home","1");
      exit.textContent="⌂ MAIN DASHBOARD";
      exit.onclick=null;
      exit.addEventListener("click",event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        coach1200GoMainDashboard();
      },true);
    }
  }

  function coach1200InstallSwapPicker(){
    try{
      if(typeof coach1196OpenSwapPlayerModal==="function"){
        window.openReplacePlayerModal=function(positionId){
          return coach1196OpenSwapPlayerModal(positionId);
        };
      }
    }catch(error){
      console.warn("120.0 swap picker install:",error);
    }
  }

  function coach1200OpenGameDashboard(){
    const app=document.getElementById("app");
    if(!app || app.classList.contains("hidden")) return;

    document.body.classList.add("coach1200-game-dashboard");

    const fp=document.getElementById("fivePanelDashboard");
    if(fp){
      fp.classList.add("hidden");
      fp.style.display="none";
    }

    try{
      if(typeof setFieldFullscreen==="function"){
        setFieldFullscreen(true);
      }else{
        document.body.classList.add("fieldFullscreen");
        if(typeof renderField==="function") renderField();
      }
    }catch(error){
      console.error("120.0 fullscreen dashboard:",error);
    }

    coach1200InstallSwapPicker();
    coach1200PrepareNativeControls();
    coach1200RenderBar();
    coach1202HideGameStatus();
    coach1201EnforceCleanField();

    setTimeout(()=>{
      coach1200PrepareNativeControls();
      coach1200RenderBar();
      coach1201EnforceCleanField();
      try{ if(typeof renderField==="function") renderField(); }catch(e){}
    },80);
  }

  function coach1200BindEntryPoints(){
    if(document.documentElement.dataset.coach1200Bound==="1") return;
    document.documentElement.dataset.coach1200Bound="1";

    /* Existing 5-panel buttons now mean "Game Day Dashboard". */
    ["fivePanelBtn","gameDayCard"].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.addEventListener("click",event=>{
        setTimeout(coach1200OpenGameDashboard,30);
      },true);
    });

    /* Preserve the normal main dashboard, but when the app asks to reopen the
       old five-panel view, show the live field dashboard instead. */
    try{
      window.coachShowFivePanel=function(event){
        event?.preventDefault?.();
        event?.stopPropagation?.();
        coach1200OpenGameDashboard();
      };
    }catch(e){}
  }

  window.coach1200OpenGameDashboard=coach1200OpenGameDashboard;
  window.coach1200GoMainDashboard=coach1200GoMainDashboard;
  window.coach1200OpenPlayers=coach1200OpenPlayers;
  window.coach1200OpenStats=coach1200OpenStats;
  window.coach1200OpenPlaybook=coach1200OpenPlaybook;
  window.coach1200SelectLine=coach1200SelectLine;

  function coach1199CleanupDashboard(){
    const root=document.getElementById("fivePanelDashboard");
    if(!root) return;

    /* Players: make each visible roster row explicitly explain its action. */
    root.querySelectorAll(".fivePanel[data-panel='players'] .coach1191RosterRow").forEach(row=>{
      row.setAttribute("title","Tap to edit player");
      row.setAttribute("aria-label","Edit player");
    });

    /* Stats: make the existing single dashboard action unambiguous. */
    const statsAction=root.querySelector(".fivePanel[data-panel='stats'] .coach1194PanelAction");
    if(statsAction) statsAction.textContent="FULL STATS";

    /* Lines: preserve 119.8 behavior and wording. */
    const lineAction=root.querySelector(".fivePanel[data-panel='lines'] .coach1194PanelAction");
    if(lineAction) lineAction.textContent="MANAGE / ADD / DELETE LINES";
  }

  function coach1198OpenRoster(){
    if(typeof openRosterManager==="function"){ openRosterManager(); return; }
    if(typeof openRosterSetup==="function"){ openRosterSetup(); return; }
    alert("Roster manager could not be opened.");
  }

  function coach1198SelectLine(index){
    const i=Number(index);
    if(!Number.isFinite(i) || !lines?.[i]) return;
    if(typeof setLine==="function") setLine(i);
    else{
      currentLine=i;
      if(typeof renderAll==="function") renderAll();
    }
    setTimeout(()=>{
      coach1198BuildLines();
      try{ mirrorDashboardField(); }catch(e){}
    },50);
  }

  function coach1198BuildLines(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="lines"]');
    if(!panel) return;

    let grid=panel.querySelector(".coach1198LineGrid");
    if(!grid){
      grid=document.createElement("div");
      grid.className="coach1198LineGrid";
      const before=panel.querySelector(".v112LineActions");
      panel.insertBefore(grid,before||null);
    }

    const list=(Array.isArray(lines)?lines:[]).slice(0,4);
    grid.innerHTML=list.map((line,i)=>{
      const live=i===currentLine;
      const color=line.color||["#111111","#168cff","#1bb35b","#e3ad16"][i]||"#168cff";
      return `
        <button type="button"
          class="coach1198LineCard ${live?"live":""}"
          style="border-left-color:${coach11819Esc(color)}!important"
          onclick="event.preventDefault();event.stopImmediatePropagation();coach1198SelectLine(${i});return false;">
          <b>${coach11819Esc(line.name||`LINE ${i+1}`)}</b>
          <small>${live?"CURRENT LINE":"TAP TO SELECT"}</small>
          <span class="coach1198Live">LIVE</span>
        </button>`;
    }).join("") || '<div class="notice">No play lines loaded.</div>';

    const manage=panel.querySelector(".coach1194PanelActions .coach1194PanelAction");
    if(manage){
      manage.textContent="MANAGE / ADD / DELETE LINES";
      manage.setAttribute("onclick","event.preventDefault();event.stopImmediatePropagation();openLines();return false;");
    }
  }

  function coach1198OpenPlaybookDirect(){
    try{
      if(typeof openPlaybook==="function"){
        openPlaybook();
        return;
      }
    }catch(e){ console.error(e); }
    try{
      const btn=document.getElementById("playbookBtn");
      if(btn){ btn.click(); return; }
    }catch(e){ console.error(e); }
    alert("Team Playbook could not be opened.");
  }

  function coach1198OpenGameListDirect(){
    try{
      if(typeof coach11819OpenGameList==="function"){
        coach11819OpenGameList();
        return;
      }
    }catch(e){ console.error(e); }
    alert("Game Play List could not be opened.");
  }

  function coach1198BuildPlays(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel) return;

    let box=panel.querySelector(".coach1198PlayBox");
    if(!box){
      box=document.createElement("div");
      box.className="coach1198PlayBox";
      const footer=panel.querySelector(".coach1194PanelActions");
      panel.insertBefore(box,footer||null);
    }

    box.innerHTML=`
      <button type="button" class="coach1198PlayButton"
        onclick="event.preventDefault();event.stopImmediatePropagation();coach1198OpenPlaybookDirect();return false;">
        OPEN TEAM PLAYBOOK
      </button>
      <button type="button" class="coach1198PlayButton"
        onclick="event.preventDefault();event.stopImmediatePropagation();coach1198OpenGameListDirect();return false;">
        GAME PLAY LIST
      </button>`;
  }

  function coach1198BindHardControls(){
    if(document.documentElement.dataset.coach1198Bound==="1") return;
    document.documentElement.dataset.coach1198Bound="1";

    /* Capture at document level so old transparent layers cannot steal taps. */
    document.addEventListener("click",event=>{
      const root=event.target.closest("#fivePanelDashboard");
      if(!root) return;

      const row=event.target.closest(".coach1191RosterRow");
      if(row){
        const id=row.dataset.coach1194Player || row.querySelector("[data-coach1194-edit]")?.dataset.coach1194Edit;
        if(id){
          event.preventDefault();
          event.stopImmediatePropagation();
          coach1197OpenPlayerEditor(id);
          return;
        }
      }

      const managePlayers=event.target.closest(".fivePanel[data-panel='players'] .coach1194PanelAction");
      if(managePlayers){
        event.preventDefault();
        event.stopImmediatePropagation();
        coach1198OpenRoster();
        return;
      }
    },true);
  }

  window.coach1198OpenRoster=coach1198OpenRoster;
  window.coach1198SelectLine=coach1198SelectLine;
  window.coach1198OpenPlaybookDirect=coach1198OpenPlaybookDirect;
  window.coach1198OpenGameListDirect=coach1198OpenGameListDirect;

  function coach1197ClosePlayerEditor(){
    document.getElementById("coach1197PlayerEditor")?.remove();
  }

  function coach1197PositionOptions(side,selected){
    const labels=[...new Set(
      (positions||[]).filter(p=>p.side===side).map(p=>p.label||p.slot_key).filter(Boolean)
    )];
    return `<option value="">—</option>`+labels.map(v=>
      `<option value="${coach11819Esc(v)}" ${String(v)===String(selected||"")?"selected":""}>${coach11819Esc(v)}</option>`
    ).join("");
  }

  async function coach1197SavePlayer(id){
    const player=players.find(p=>String(p.id)===String(id));
    if(!player) return;
    const name=document.getElementById("coach1197Name")?.value.trim()||"";
    const jersey=document.getElementById("coach1197Jersey")?.value.trim()||"";
    const status=document.getElementById("coach1197Status")?.value||"active";
    const offense=[1,2,3].map(i=>document.getElementById(`coach1197Off${i}`)?.value||"").filter(Boolean);
    const defense=[1,2,3].map(i=>document.getElementById(`coach1197Def${i}`)?.value||"").filter(Boolean);
    if(!name||!jersey){ alert("Enter a player name and jersey number."); return; }

    const payload={
      name,
      jersey_number:jersey,
      availability_status:status,
      offense_positions:offense,
      defense_positions:defense,
      primary_position:offense[0]||defense[0]||""
    };

    try{
      const r=await sb.from("players").update(payload).eq("id",id);
      if(r.error) throw r.error;
      coach1197ClosePlayerEditor();
      await loadTeamData();
      setTimeout(()=>{
        try{ coach1191BuildExpandedPlayers(); }catch(e){}
        try{ coach11831BuildPlayersSummary(); }catch(e){}
      },80);
    }catch(error){
      console.error("119.7 player save:",error);
      alert(error?.message||"Could not save player.");
    }
  }

  function coach1197OpenPlayerEditor(id){
    const p=players.find(x=>String(x.id)===String(id));
    if(!p) return alert("Player could not be found.");
    coach1197ClosePlayerEditor();

    const off=Array.isArray(p.offense_positions)?p.offense_positions:[];
    const def=Array.isArray(p.defense_positions)?p.defense_positions:[];
    const overlay=document.createElement("div");
    overlay.id="coach1197PlayerEditor";
    overlay.innerHTML=`
      <div class="coach1197EditorCard">
        <div class="coach1197EditorHead">
          <div><small>PLAYERS</small><h2>Edit ${coach11819Esc(p.name||"Player")}</h2></div>
          <button type="button" class="secondary" onclick="coach1197ClosePlayerEditor()">✕ CLOSE</button>
        </div>
        <div class="coach1197EditorGrid">
          <label>JERSEY NUMBER<input id="coach1197Jersey" value="${coach11819Esc(p.jersey_number??"")}"></label>
          <label>PLAYER NAME<input id="coach1197Name" value="${coach11819Esc(p.name||"")}"></label>
          <label>STATUS<select id="coach1197Status">
            <option value="active" ${String(p.availability_status||"active")==="active"?"selected":""}>ACTIVE</option>
            <option value="injured" ${String(p.availability_status)==="injured"?"selected":""}>INJURED</option>
            <option value="out" ${String(p.availability_status)==="out"?"selected":""}>OUT</option>
          </select></label>
          <div></div>
          <label>OFFENSE 1<select id="coach1197Off1">${coach1197PositionOptions("offense",off[0])}</select></label>
          <label>DEFENSE 1<select id="coach1197Def1">${coach1197PositionOptions("defense",def[0])}</select></label>
          <label>OFFENSE 2<select id="coach1197Off2">${coach1197PositionOptions("offense",off[1])}</select></label>
          <label>DEFENSE 2<select id="coach1197Def2">${coach1197PositionOptions("defense",def[1])}</select></label>
          <label>OFFENSE 3<select id="coach1197Off3">${coach1197PositionOptions("offense",off[2])}</select></label>
          <label>DEFENSE 3<select id="coach1197Def3">${coach1197PositionOptions("defense",def[2])}</select></label>
        </div>
        <div class="coach1197EditorFoot">
          <button type="button" class="secondary" onclick="coach1197ClosePlayerEditor()">CANCEL</button>
          <button type="button" class="primary" onclick="coach1197SavePlayer('${coach11819Esc(String(p.id))}')">SAVE PLAYER</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  window.coach1197ClosePlayerEditor=coach1197ClosePlayerEditor;
  window.coach1197OpenPlayerEditor=coach1197OpenPlayerEditor;
  window.coach1197SavePlayer=coach1197SavePlayer;

  function coach1197OpenPlaybook(){
    try{
      if(typeof openPlaybook==="function"){
        openPlaybook();
        return;
      }
    }catch(error){ console.error(error); }
    const native=document.getElementById("playbookBtn");
    if(native){ native.click(); return; }
    alert("Team Playbook could not be opened.");
  }

  function coach1197BuildPlays(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel) return;
    const old=panel.querySelector(".coach11819Plays");
    if(old){
      old.className="coach1197PlayActions";
      old.innerHTML=`
        <button type="button" data-coach1197-playbook>OPEN TEAM PLAYBOOK</button>
        <button type="button" data-coach1197-game-list>GAME PLAY LIST</button>`;
    }
  }

  function coach1197BindControls(){
    const root=document.getElementById("fivePanelDashboard");
    if(!root || root.dataset.coach1197Bound==="1") return;
    root.dataset.coach1197Bound="1";

    root.addEventListener("click",event=>{
      const edit=event.target.closest("[data-coach1194-edit]");
      if(edit){
        event.preventDefault(); event.stopImmediatePropagation();
        coach1197OpenPlayerEditor(edit.dataset.coach1194Edit);
        return;
      }

      if(event.target.closest("[data-coach1197-playbook]")){
        event.preventDefault(); event.stopImmediatePropagation();
        coach1197OpenPlaybook();
        return;
      }

      if(event.target.closest("[data-coach1197-game-list]")){
        event.preventDefault(); event.stopImmediatePropagation();
        if(typeof coach11819OpenGameList==="function") coach11819OpenGameList();
        return;
      }
    },true);
  }

  function coach1196SidePositionAssignment(lineId,side,playerId){
    const ids=new Set(
      (typeof positions!=="undefined"&&Array.isArray(positions)?positions:[])
        .filter(p=>String(p.side)===String(side))
        .map(p=>String(p.id))
    );
    const a=(typeof assignments!=="undefined"&&Array.isArray(assignments)?assignments:[])
      .find(x=>String(x.line_id)===String(lineId) &&
        String(x.player_id)===String(playerId) &&
        ids.has(String(x.position_label_id)));
    if(!a) return null;
    const pos=positions.find(p=>String(p.id)===String(a.position_label_id));
    return pos?{assignment:a,pos}:null;
  }

  async function coach1196SwapPlayerAtPosition(positionId,newPlayerId){
    const line=lines?.[currentLine];
    const target=positions?.find(p=>String(p.id)===String(positionId));
    if(!line||!target) return;

    const side=target.side;
    const opposite=side==="offense"?"defense":"offense";
    const targetAssignment=currentLineAssignments()
      .find(a=>String(a.position_label_id)===String(positionId));
    const oldPlayerId=targetAssignment?.player_id||"";

    if(String(oldPlayerId)===String(newPlayerId)){
      if(typeof closeModal==="function") closeModal();
      return;
    }

    const incoming=players.find(p=>String(p.id)===String(newPlayerId));
    if(!incoming || !playerCanPlay(incoming)){
      alert("That player is not currently available.");
      return;
    }

    /* Full on-field swap:
       If the incoming player already occupies another position on this side,
       put the outgoing player into that position instead of blocking the swap. */
    const incomingHere=coach1196SidePositionAssignment(line.id,side,newPlayerId);
    const oldOpp=oldPlayerId?coach1196SidePositionAssignment(line.id,opposite,oldPlayerId):null;
    const incomingOpp=coach1196SidePositionAssignment(line.id,opposite,newPlayerId);

    try{
      // Clear affected same-side positions first.
      await assignPlayerDirect(line.id,target.id,"");
      if(incomingHere && String(incomingHere.pos.id)!==String(target.id)){
        await assignPlayerDirect(line.id,incomingHere.pos.id,"");
      }

      // Put incoming player in target; outgoing player takes incoming's old spot.
      await assignPlayerDirect(line.id,target.id,newPlayerId);
      if(incomingHere && String(incomingHere.pos.id)!==String(target.id) && oldPlayerId){
        await assignPlayerDirect(line.id,incomingHere.pos.id,oldPlayerId);
      }

      /* Keep offense and defense linked on this same line.
         If both players are already on the opposite side, swap those spots too.
         If only the outgoing player is there, replace that spot with incoming. */
      if(oldOpp){
        await assignPlayerDirect(line.id,oldOpp.pos.id,"");
        if(incomingOpp && String(incomingOpp.pos.id)!==String(oldOpp.pos.id)){
          await assignPlayerDirect(line.id,incomingOpp.pos.id,"");
        }

        await assignPlayerDirect(line.id,oldOpp.pos.id,newPlayerId);

        if(incomingOpp &&
           String(incomingOpp.pos.id)!==String(oldOpp.pos.id) &&
           oldPlayerId){
          await assignPlayerDirect(line.id,incomingOpp.pos.id,oldPlayerId);
        }
      }

      if(navigator.onLine && typeof loadAssignments==="function"){
        await loadAssignments();
      }
      if(typeof saveOfflineSnapshot==="function") saveOfflineSnapshot();
      if(typeof closeModal==="function") closeModal();
      if(typeof renderField==="function") renderField();
      if(typeof renderPlayers==="function") renderPlayers();
      if(typeof mirrorDashboardField==="function") mirrorDashboardField();

      setTimeout(coach11812RefreshEditableField,60);
    }catch(error){
      console.error("119.6 player swap:",error);
      alert(error?.message||"Could not swap these players.");
    }
  }

  function coach1196OpenSwapPlayerModal(positionId){
    const line=lines?.[currentLine];
    const pos=positions?.find(p=>String(p.id)===String(positionId));
    if(!line||!pos || typeof openModal!=="function") return;

    activeView=pos.side;

    const current=currentLineAssignments()
      .find(a=>String(a.position_label_id)===String(positionId));
    const currentPlayer=current
      ? players.find(p=>String(p.id)===String(current.player_id))
      : null;

    const sideIds=new Set(
      positions.filter(p=>p.side===pos.side).map(p=>String(p.id))
    );

    const sideAssignments=currentLineAssignments()
      .filter(a=>sideIds.has(String(a.position_label_id)));

    const whereByPlayer=new Map();
    sideAssignments.forEach(a=>{
      const p=positions.find(x=>String(x.id)===String(a.position_label_id));
      if(p) whereByPlayer.set(String(a.player_id),p.label||p.slot_key||"ON FIELD");
    });

    const list=players
      .filter(p=>playerCanPlay(p))
      .slice()
      .sort((a,b)=>{
        const aon=whereByPlayer.has(String(a.id))?0:1;
        const bon=whereByPlayer.has(String(b.id))?0:1;
        if(aon!==bon) return aon-bon;
        const ap=(pos.side==="offense"?a.offense_positions:a.defense_positions)||[];
        const bp=(pos.side==="offense"?b.offense_positions:b.defense_positions)||[];
        const ai=ap.findIndex(x=>String(x).toUpperCase()===String(pos.label).toUpperCase());
        const bi=bp.findIndex(x=>String(x).toUpperCase()===String(pos.label).toUpperCase());
        const ar=ai<0?99:ai, br=bi<0?99:bi;
        if(ar!==br) return ar-br;
        return Number(a.jersey_number||999)-Number(b.jersey_number||999);
      });

    openModal(`
      <div>
        <div class="coach1196SwapHead">
          <div>
            <small>${coach11819Esc(line.name||"LINE")} • ${coach11819Esc(pos.side.toUpperCase())}</small>
            <h2>${coach11819Esc(pos.label)}${currentPlayer?" — "+coach11819Esc(currentPlayer.name):""}</h2>
          </div>
          <button type="button" class="secondary" onclick="closeModal()">✕ CLOSE</button>
        </div>
        <p class="coach1196SwapHint">
          Full roster shown. Players already on this ${coach11819Esc(pos.side)} line are marked ON FIELD.
          Selecting one swaps the two positions. If the outgoing player is also on the opposite side of this line,
          that side is updated automatically too.
        </p>
        <div class="coach1196SwapList">
          ${list.map(p=>{
            const onField=whereByPlayer.get(String(p.id))||"";
            const currentId=String(currentPlayer?.id||"")===String(p.id);
            const prefs=(pos.side==="offense"?p.offense_positions:p.defense_positions)||[];
            return `
              <button type="button"
                class="coach1196SwapRow ${onField?"onField":""} ${currentId?"current":""}"
                onclick="coach1196SwapPlayerAtPosition('${coach11819Esc(String(positionId))}','${coach11819Esc(String(p.id))}')">
                <b>#${coach11819Esc(p.jersey_number??"")}</b>
                <span><b>${coach11819Esc(p.name||"Player")}</b><small>${currentId?"CURRENT PLAYER":(onField?"TAP TO SWAP":"TAP TO REPLACE")}</small></span>
                <span class="coach1196SwapWhere">${onField?"ON FIELD • "+coach11819Esc(onField):"BENCH"}</span>
                <span class="coach1196SwapPrefs">${coach11819Esc(Array.isArray(prefs)&&prefs.length?prefs.join(" / "):"OTHER POSITION")}</span>
                <span class="coach1196SwapPlays">${Number(counts?.[p.id]||0)}</span>
              </button>`;
          }).join("")}
        </div>
      </div>
    `);
  }

  window.coach1196SwapPlayerAtPosition=coach1196SwapPlayerAtPosition;
  window.coach1196OpenSwapPlayerModal=coach1196OpenSwapPlayerModal;

  function coach1195BindDirectFieldOpen(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="field"]');
    if(!panel || panel.dataset.coach1195Direct==="1") return;
    panel.dataset.coach1195Direct="1";

    panel.addEventListener("click",event=>{
      if(event.target.closest("select,option,button")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      coach1194OpenLiveField();
    },true);
  }

  function coach1195BindPlayerEdit(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="players"]');
    if(!panel || panel.dataset.coach1195Edit==="1") return;
    panel.dataset.coach1195Edit="1";

    panel.addEventListener("click",event=>{
      const btn=event.target.closest("[data-coach1194-edit]");
      if(!btn) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      coach1194OpenPlayerEditor(btn.dataset.coach1194Edit);
    },true);
  }

  function coach1195BindLines(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="lines"]');
    if(!panel || panel.dataset.coach1195Lines==="1") return;
    panel.dataset.coach1195Lines="1";

    const actions=panel.querySelector(".coach1194PanelActions");
    const btn=actions?.querySelector(".coach1194PanelAction");
    if(btn){
      btn.textContent="MANAGE / ADD / DELETE LINES";
      btn.onclick=null;
      btn.addEventListener("click",event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        if(typeof openLines==="function") openLines();
        else openTool("lines");
      },true);
    }
  }

  function coach1195BindPlays(){
    const panel=document.querySelector('#fivePanelDashboard .fivePanel[data-panel="plays"]');
    if(!panel || panel.dataset.coach1195Plays==="1") return;
    panel.dataset.coach1195Plays="1";

    panel.addEventListener("click",event=>{
      const list=event.target.closest("[data-game-list]");
      if(list){
        event.preventDefault();
        event.stopImmediatePropagation();
        coach11819OpenGameList();
        return;
      }

      const playbook=event.target.closest("[data-open-team-playbook]");
      if(playbook){
        event.preventDefault();
        event.stopImmediatePropagation();
        if(typeof openPlaybook==="function") openPlaybook();
        else coach1192OpenPlaybook();
      }
    },true);
  }

  function coach1195InstallLinkedSubstitution(){
    try{
      if(typeof replacePlayerLinked==="function"){
        window.replacePlayerAtPosition=async function(positionId,newPlayerId){
          return replacePlayerLinked(positionId,newPlayerId);
        };
      }
    }catch(error){
      console.warn("119.5 linked substitution install:",error);
    }
  }

  function coach1195BindFixes(){
    coach1195BindDirectFieldOpen();
    coach1195BindPlayerEdit();
    coach1195BindLines();
    coach1195BindPlays();
    coach1195InstallLinkedSubstitution();
  }

  function initialize() {
    installStyles();
    ensureUpdateBadge();
    ensureBackButton();
    coach1194BindHub();
    coach1194EnsurePanelActions();
    coach1195BindFixes();
    coach1197BuildPlays();
    coach1197BindControls();
    coach1198BuildLines();
    coach1198BuildPlays();
    coach1198BindHardControls();
    coach1199CleanupDashboard();
    coach1200BindEntryPoints();
    coach1200InstallSwapPicker();
    coach11819BuildPlays();
    coach1190BindPlaysDelegation();
    coach1191BindPlayButtonsGlobal();
    coach1192BindPlayPanel();
    coach1192BindExpandedPlayers();
    coach1192PatchLineOverlay();
    coach1191BuildFieldLineBar();
    coach1191BuildRosterBoard();
    coach11831BuildPlayersSummary();
    coach11821BuildStats();
    coach1190BindStatsDelegation();
    bindDashboardSections();
    bind11811LineControls();
    buildReadableLines();
    build1182ReadableLines();
    mirrorDashboardField();

    if (!refreshTimer) {
      refreshTimer = setInterval(function () {
        buildReadableLines();
        build1182ReadableLines();
        coach11831BuildPlayersSummary();
        coach1191BuildFieldLineBar();
        if(document.getElementById("v114Players")?.checked) coach1191BuildRosterBoard();
        bind11811LineControls();
        coach1190BindPlaysDelegation();
        coach1192BindPlayPanel();
        coach1192PatchLineOverlay();
        coach1190BindStatsDelegation();
        coach11812WirePlayerTaps();
        coach1194EnsurePanelActions();
        coach1195BindFixes();
        coach1197BuildPlays();
        coach1197BindControls();
        coach1198BuildLines();
        coach1198BuildPlays();
        coach1198BindHardControls();
        coach1199CleanupDashboard();
        coach1200BindEntryPoints();
        coach1200InstallSwapPicker();
        if(document.body.classList.contains("coach1200-game-dashboard")){
          coach1201EnforceCleanField();
          coach1206WatchSpecialMode();
        }
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


/* ================================================================
   120.7 — COMBINED SPECIAL TEAMS
   Kickoff/Punt show offense + defense together for the selected line.
   Includes line-only Auto Fill, rename spots, move spots, and clean snap.
   ================================================================ */
(function(){
  const STYLE_ID_1207='coach-update-1213-combined-special-style';
  if(!document.getElementById(STYLE_ID_1207)){
    const s=document.createElement('style');
    s.id=STYLE_ID_1207;
    s.textContent=`
      #coach1207SpecialDashboard{position:fixed;inset:0;z-index:2147483300;background:#03101ef2;color:#fff;display:grid;grid-template-rows:auto 1fr;font-family:inherit}
      .coach1207Top{display:flex;align-items:center;justify-content:space-between;gap:7px;padding:6px 8px;background:#071b32;border-bottom:1px solid #4a83ad}
      .coach1207TopLeft,.coach1207TopRight{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
      .coach1207Top b{font-size:11px;white-space:nowrap}
      .coach1207Top button{min-height:32px;padding:4px 8px;border:1px solid #78bce8;border-radius:6px;background:#0a4f89;color:#fff;font-size:8px;font-weight:1000;white-space:nowrap}
      .coach1207Top button.active{background:#1382d6;box-shadow:0 0 0 2px #fff inset}
      .coach1207Pair{min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px}
      .coach1207Side{min-width:0;min-height:0;display:grid;grid-template-rows:auto 1fr auto;border:2px solid #4d9fd2;border-radius:8px;overflow:hidden;background:#071b30}
      .coach1207Side.offense{border-color:#e54d43}.coach1207Side.defense{border-color:#4d9fd2}
      .coach1207SideHead{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:5px 7px;background:#0a335b;border-bottom:1px solid #4d9fd2}
      .coach1207Side.offense .coach1207SideHead{background:#51201f;border-color:#a83d38}
      .coach1207SideHead b{font-size:11px}.coach1207SideHead span{font-size:7px;color:#bdd7e9}
      .coach1207MiniField{position:relative;min-height:0;overflow:hidden;background:linear-gradient(to bottom,rgba(255,255,255,.2) 1px,transparent 1px) 0 0/100% 10%,linear-gradient(90deg,transparent 49.8%,rgba(255,255,255,.25) 49.8% 50.2%,transparent 50.2%),#168f39}
      .coach1207MiniField:before{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:#fff9}
      .coach1207Spot{position:absolute;transform:translate(-50%,-50%);min-width:58px;min-height:38px;padding:3px 5px;border:2px solid #ffc62a;border-radius:6px;background:#07121fee;color:#fff;text-align:center;font-size:8px;font-weight:1000;touch-action:none;user-select:none;z-index:5}
      .coach1207Side.defense .coach1207Spot{border-color:#4fb2ff}.coach1207Side.offense .coach1207Spot{border-color:#ff655e}
      .coach1207Spot small{display:block;margin-top:1px;font-size:6.5px;color:#d6e6f2;font-weight:800;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .coach1207Spot.moveMode{box-shadow:0 0 0 2px #ffd34e;cursor:move}
      .coach1207Hint{padding:4px 7px;font-size:7px;color:#c6dcec;background:#061425;border-top:1px solid #315b7d}
      .coach1207RenameOverlay,.coach1207PickerOverlay{position:fixed;inset:0;z-index:2147483400;background:#000c;display:grid;place-items:center;padding:10px}
      .coach1207ModalCard{width:min(780px,95vw);max-height:90dvh;overflow:auto;background:#0a294a;border:2px solid #64c3ff;border-radius:9px;padding:12px;color:#fff}
      .coach1207ModalHead{display:flex;align-items:center;justify-content:space-between;gap:8px}.coach1207ModalHead h2{margin:2px 0 0}
      .coach1207RenameGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}
      .coach1207RenameGrid label{display:grid;grid-template-columns:72px 1fr;gap:6px;align-items:center;font-size:8px;font-weight:900}
      .coach1207RenameGrid input{min-height:34px;background:#071b31;color:#fff;border:1px solid #5aa6d6;border-radius:5px;padding:5px}
      .coach1207PickerList{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}
      .coach1207PickerRow{display:grid;grid-template-columns:42px 1fr auto;gap:7px;align-items:center;min-height:40px;padding:6px;border:1px solid #3c739a;border-radius:6px;background:#0b213a;color:#fff;text-align:left}
      .coach1207PickerRow small{display:block;color:#bad1e2;font-size:7px}.coach1207PickerRow.onUnit{border-color:#ffd34e}
      .coach1207Foot{display:flex;justify-content:flex-end;gap:6px;margin-top:9px}
      @media(orientation:landscape) and (max-height:700px){.coach1207Top{padding:4px 6px}.coach1207Top button{min-height:28px;padding:3px 6px;font-size:7px}.coach1207Pair{gap:4px;padding:4px}.coach1207Spot{min-width:52px;min-height:33px;font-size:7px}.coach1207SideHead{padding:4px 6px}}
    `;
    document.head.appendChild(s);
  }

  const TYPES={
    kickoff:{offense:{label:'KICKOFF OFFENSE',base:'Kickoff'},defense:{label:'KICKOFF DEFENSE',base:'Kick Return'}},
    punt:{offense:{label:'PUNT OFFENSE',base:'Punt'},defense:{label:'PUNT DEFENSE',base:'Punt Return'}}
  };
  let mode='kickoff';
  let moveMode=false;

  function esc1207(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function line1207(){try{return lines?.[currentLine]||null}catch{return null}}
  function unitName1207(line,type){return `${line.name} — ${type.label}`}
  function oldUnitNames1207(line,type){return [unitName1207(line,type),`${line.name} • ${type.label}`]}

  async function ensureUnit1207(type){
    const line=line1207(); if(!line) return null;
    if(typeof loadSpecialTeams==='function') await loadSpecialTeams();
    let unit=(specialUnits||[]).find(u=>oldUnitNames1207(line,type).includes(String(u.name)));
    if(unit) return unit;
    if(!navigator.onLine){alert('Creating Special Teams units requires an internet connection.');return null;}
    const sort=Math.max(-1,...(specialUnits||[]).map(u=>Number(u.sort_order||0)))+1;
    const r=await sb.from('special_team_units').insert({team_id:team.id,name:unitName1207(line,type),sort_order:sort}).select().single();
    if(r.error){alert(r.error.message);return null;}
    unit=r.data;
    const defs=(typeof SPECIAL_DEFAULTS!=='undefined'&&SPECIAL_DEFAULTS[type.base])||[];
    if(defs.length){
      const sr=await sb.from('special_team_slots').insert(defs.map((x,i)=>({unit_id:unit.id,slot_key:x[0],label:x[1],x_pct:x[2],y_pct:x[3],sort_order:i})));
      if(sr.error){alert(sr.error.message);return null;}
    }
    if(typeof loadSpecialTeams==='function') await loadSpecialTeams();
    return (specialUnits||[]).find(u=>String(u.id)===String(unit.id))||unit;
  }

  function lineAssignments1207(side){
    const line=line1207(); if(!line) return [];
    const posIds=new Set((positions||[]).filter(p=>p.side===side).map(p=>String(p.id)));
    return (assignments||[]).filter(a=>String(a.line_id)===String(line.id)&&posIds.has(String(a.position_label_id))).map(a=>({a,pos:positions.find(p=>String(p.id)===String(a.position_label_id)),player:players.find(p=>String(p.id)===String(a.player_id))})).filter(x=>x.player);
  }

  function pool1207(side){
    const primary=lineAssignments1207(side).map(x=>x.player);
    const secondary=lineAssignments1207(side==='offense'?'defense':'offense').map(x=>x.player);
    const seen=new Set(),out=[];
    [...primary,...secondary].forEach(p=>{if(!p||seen.has(String(p.id)))return;seen.add(String(p.id));out.push(p)});
    return out;
  }

  function assignmentMap1207(unitId){
    const m=new Map();
    (specialAssignments||[]).filter(a=>String(a.unit_id)===String(unitId)).forEach(a=>m.set(String(a.slot_id),players.find(p=>String(p.id)===String(a.player_id))));
    return m;
  }

  async function sideData1207(side,type){
    const unit=await ensureUnit1207(type); if(!unit) return {unit:null,slots:[],html:''};
    if(typeof loadSpecialTeams==='function') await loadSpecialTeams();
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const amap=assignmentMap1207(unit.id);
    const html=slots.map(s=>{const p=amap.get(String(s.id));return `<button type="button" class="coach1207Spot ${moveMode?'moveMode':''}" data-slot-id="${esc1207(s.id)}" data-unit-id="${esc1207(unit.id)}" data-side="${side}" style="left:${Number(s.x_pct)}%;top:${Number(s.y_pct)}%" onclick="coach1207SpotClick(event,'${esc1207(unit.id)}','${esc1207(s.id)}','${side}')">${esc1207(s.label||s.slot_key||'SPOT')}<small>${p?esc1207(p.name||'PLAYER'):'OPEN'}</small></button>`}).join('');
    return {unit,slots,html};
  }

  async function render1207(){
    const root=document.getElementById('coach1207SpecialDashboard'); if(!root) return;
    const line=line1207(),pair=TYPES[mode]; if(!line||!pair)return;
    const off=await sideData1207('offense',pair.offense),def=await sideData1207('defense',pair.defense);
    root.innerHTML=`<div class="coach1207Top"><div class="coach1207TopLeft"><b>${esc1207(line.name)} — SPECIAL TEAMS</b><button class="${mode==='kickoff'?'active':''}" onclick="coach1207SetMode('kickoff')">KICKOFF</button><button class="${mode==='punt'?'active':''}" onclick="coach1207SetMode('punt')">PUNT</button></div><div class="coach1207TopRight"><button onclick="coach1207AutoFill()">AUTO FILL FROM ${esc1207(line.name.toUpperCase())}</button><button onclick="coach1207Clean()">CLEAN ARRANGEMENT</button><button class="${moveMode?'active':''}" onclick="coach1207ToggleMove()">MOVE SPOTS</button><button onclick="coach1207Rename()">RENAME SPOTS</button><button onclick="coach1207Close()">✕ CLOSE</button></div></div><div class="coach1207Pair"><section class="coach1207Side offense"><div class="coach1207SideHead"><b>${esc1207(pair.offense.label)}</b><span>${pool1207('offense').length} line players</span></div><div class="coach1207MiniField" data-unit-id="${esc1207(off.unit?.id||'')}" data-side="offense">${off.html}</div><div class="coach1207Hint">${moveMode?'Drag spots to move them.':'Tap a spot to change its player.'}</div></section><section class="coach1207Side defense"><div class="coach1207SideHead"><b>${esc1207(pair.defense.label)}</b><span>${pool1207('defense').length} line players</span></div><div class="coach1207MiniField" data-unit-id="${esc1207(def.unit?.id||'')}" data-side="defense">${def.html}</div><div class="coach1207Hint">${moveMode?'Drag spots to move them.':'Tap a spot to change its player.'}</div></section></div>`;
    if(moveMode) bindDrag1207();
  }

  async function autoFillUnit1207(unit,side){
    if(!unit)return;
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams();
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const pool=pool1207(side);
    for(let i=0;i<slots.length;i++){
      await sb.from('special_team_assignments').delete().eq('unit_id',unit.id).eq('slot_id',slots[i].id);
      if(pool[i]){const r=await sb.from('special_team_assignments').insert({unit_id:unit.id,slot_id:slots[i].id,player_id:pool[i].id});if(r.error)console.error(r.error)}
    }
  }

  async function autoFill1207(){
    const pair=TYPES[mode],off=await ensureUnit1207(pair.offense),def=await ensureUnit1207(pair.defense); if(!off||!def)return;
    await autoFillUnit1207(off,'offense'); await autoFillUnit1207(def,'defense');
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams(); await render1207();
  }

  async function cleanUnit1207(unit){
    if(!unit)return;
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams();
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id));
    const occupied=[];
    for(const s of slots){
      let x=Math.round(Number(s.x_pct||50)/5)*5, y=Math.round(Number(s.y_pct||50)/5)*5;
      x=Math.max(5,Math.min(95,x));y=Math.max(8,Math.min(92,y));
      let tries=0;while(occupied.some(o=>Math.abs(o.x-x)<6&&Math.abs(o.y-y)<6)&&tries<6){x=Math.min(95,x+7);tries++}
      occupied.push({x,y});
      const r=await sb.from('special_team_slots').update({x_pct:x,y_pct:y}).eq('id',s.id);if(r.error)console.error(r.error);
    }
  }

  async function clean1207(){
    const pair=TYPES[mode],off=await ensureUnit1207(pair.offense),def=await ensureUnit1207(pair.defense);if(!off||!def)return;
    await cleanUnit1207(off);await cleanUnit1207(def);if(typeof loadSpecialTeams==='function')await loadSpecialTeams();await render1207();
  }

  function bindDrag1207(){
    document.querySelectorAll('#coach1207SpecialDashboard .coach1207Spot').forEach(spot=>{
      const field=spot.closest('.coach1207MiniField');if(!field)return;let dragging=false;
      const move=e=>{if(!dragging)return;const r=field.getBoundingClientRect(),p=e.touches?.[0]||e,x=Math.max(3,Math.min(97,(p.clientX-r.left)/r.width*100)),y=Math.max(5,Math.min(95,(p.clientY-r.top)/r.height*100));spot.style.left=x+'%';spot.style.top=y+'%';spot.dataset.x=x;spot.dataset.y=y;e.preventDefault()};
      const end=async()=>{if(!dragging)return;dragging=false;document.removeEventListener('mousemove',move,true);document.removeEventListener('mouseup',end,true);document.removeEventListener('touchmove',move,true);document.removeEventListener('touchend',end,true);const x=Number(spot.dataset.x||parseFloat(spot.style.left)),y=Number(spot.dataset.y||parseFloat(spot.style.top));const r=await sb.from('special_team_slots').update({x_pct:x,y_pct:y}).eq('id',spot.dataset.slotId);if(r.error)alert(r.error.message);if(typeof loadSpecialTeams==='function')await loadSpecialTeams()};
      const start=e=>{dragging=true;document.addEventListener('mousemove',move,true);document.addEventListener('mouseup',end,true);document.addEventListener('touchmove',move,{capture:true,passive:false});document.addEventListener('touchend',end,true);e.preventDefault();e.stopPropagation()};
      spot.addEventListener('mousedown',start,true);spot.addEventListener('touchstart',start,{capture:true,passive:false});
    });
  }

  async function spotClick1207(event,unitId,slotId,side){
    if(moveMode){event.preventDefault();event.stopPropagation();return;}
    event.preventDefault();event.stopPropagation();
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams();
    const pool=pool1207(side),unitAssignments=(specialAssignments||[]).filter(a=>String(a.unit_id)===String(unitId));
    const current=unitAssignments.find(a=>String(a.slot_id)===String(slotId));
    document.querySelector('.coach1207PickerOverlay')?.remove();
    const o=document.createElement('div');o.className='coach1207PickerOverlay';
    o.innerHTML=`<div class="coach1207ModalCard"><div class="coach1207ModalHead"><div><small>${esc1207(line1207()?.name||'LINE')}</small><h2>Choose Player</h2></div><button onclick="this.closest('.coach1207PickerOverlay').remove()">✕ CLOSE</button></div><div class="coach1207PickerList">${pool.map(p=>{const a=unitAssignments.find(x=>String(x.player_id)===String(p.id)),on=a?true:false;return `<button class="coach1207PickerRow ${on?'onUnit':''}" onclick="coach1207AssignSpot('${esc1207(unitId)}','${esc1207(slotId)}','${esc1207(p.id)}')"><b>#${esc1207(p.jersey_number||'')}</b><span><b>${esc1207(p.name||'Player')}</b><small>${on?'Already on this unit — tap to swap':'From selected line'}</small></span><span>${String(current?.player_id)===String(p.id)?'CURRENT':''}</span></button>`}).join('')}</div><div class="coach1207Foot"><button onclick="coach1207AssignSpot('${esc1207(unitId)}','${esc1207(slotId)}','')">CLEAR SPOT</button></div></div>`;
    document.body.appendChild(o);
  }

  async function assignSpot1207(unitId,slotId,playerId){
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams();
    const ua=(specialAssignments||[]).filter(a=>String(a.unit_id)===String(unitId));
    const target=ua.find(a=>String(a.slot_id)===String(slotId));
    const existing=playerId?ua.find(a=>String(a.player_id)===String(playerId)):null;
    await sb.from('special_team_assignments').delete().eq('unit_id',unitId).eq('slot_id',slotId);
    if(existing&&String(existing.slot_id)!==String(slotId)){
      await sb.from('special_team_assignments').delete().eq('unit_id',unitId).eq('slot_id',existing.slot_id);
      if(target?.player_id)await sb.from('special_team_assignments').insert({unit_id:unitId,slot_id:existing.slot_id,player_id:target.player_id});
    }
    if(playerId)await sb.from('special_team_assignments').insert({unit_id:unitId,slot_id:slotId,player_id:playerId});
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams();document.querySelector('.coach1207PickerOverlay')?.remove();await render1207();
  }

  async function rename1207(){
    const pair=TYPES[mode],off=await ensureUnit1207(pair.offense),def=await ensureUnit1207(pair.defense);if(!off||!def)return;if(typeof loadSpecialTeams==='function')await loadSpecialTeams();
    const groups=[{label:pair.offense.label,unit:off},{label:pair.defense.label,unit:def}];document.querySelector('.coach1207RenameOverlay')?.remove();const o=document.createElement('div');o.className='coach1207RenameOverlay';
    o.innerHTML=`<div class="coach1207ModalCard"><div class="coach1207ModalHead"><div><small>${esc1207(line1207()?.name||'LINE')}</small><h2>Rename ${mode.toUpperCase()} Spots</h2></div><button onclick="this.closest('.coach1207RenameOverlay').remove()">✕ CLOSE</button></div><div class="coach1207RenameGrid">${groups.map((g,gi)=>(specialSlots||[]).filter(s=>String(s.unit_id)===String(g.unit.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map((s,si)=>`<label><b>${gi===0?'OFF':'DEF'} ${esc1207(s.slot_key||si+1)}</b><input data-slot-id="${esc1207(s.id)}" value="${esc1207(s.label||s.slot_key||'')}"></label>`).join('')).join('')}</div><div class="coach1207Foot"><button onclick="coach1207SaveRename()">SAVE NAMES</button></div></div>`;document.body.appendChild(o);
  }

  async function saveRename1207(){
    for(const input of [...document.querySelectorAll('.coach1207RenameOverlay input[data-slot-id]')]){const r=await sb.from('special_team_slots').update({label:input.value.trim()||'SPOT'}).eq('id',input.dataset.slotId);if(r.error){alert(r.error.message);return}}
    if(typeof loadSpecialTeams==='function')await loadSpecialTeams();document.querySelector('.coach1207RenameOverlay')?.remove();await render1207();
  }

  async function open1207(){
    document.getElementById('coach1207SpecialDashboard')?.remove();const line=line1207();if(!line)return alert('Select a line first.');
    const root=document.createElement('div');root.id='coach1207SpecialDashboard';root.innerHTML='<div style="display:grid;place-items:center">Loading Special Teams…</div>';document.body.appendChild(root);await render1207();
  }
  function close1207(){document.getElementById('coach1207SpecialDashboard')?.remove();moveMode=false}
  function setMode1207(m){if(!TYPES[m])return;mode=m;moveMode=false;render1207()}
  function toggleMove1207(){moveMode=!moveMode;render1207()}

  window.coach1207OpenSpecialTeams=open1207;window.coach1207Close=close1207;window.coach1207SetMode=setMode1207;window.coach1207ToggleMove=toggleMove1207;window.coach1207AutoFill=autoFill1207;window.coach1207Clean=clean1207;window.coach1207Rename=rename1207;window.coach1207SaveRename=saveRename1207;window.coach1207SpotClick=spotClick1207;window.coach1207AssignSpot=assignSpot1207;

  // Capture the dashboard Special Teams button before the older inline handler fires.
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('#coach1200DashboardBar button');
    if(!b||!/SPECIAL TEAMS/i.test(String(b.textContent||'')))return;
    e.preventDefault();e.stopImmediatePropagation();open1207();
  },true);
})();


/* =========================================================
   120.8 — force combined Special Teams from BOTH entry points,
   and auto-fill empty spots from the selected line.
   ========================================================= */
(function(){
  async function get1207UnitsForMode(){
    const rootApi=window;
    // 120.7 owns the combined UI; opening it creates the two units if needed.
    // We use the loaded globals to find the visible pair after open.
    const line=lines?.[currentLine];
    if(!line) return [];
    const labels = window.coach1208Mode==="punt"
      ? ["PUNT OFFENSE","PUNT DEFENSE"]
      : ["KICKOFF OFFENSE","KICKOFF DEFENSE"];

    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const units=[];
    for(const label of labels){
      let unit=(specialUnits||[]).find(u=>{
        const n=String(u.name||"");
        return (n===`${line.name} — ${label}` || n===`${line.name} • ${label}`);
      });
      units.push(unit||null);
    }
    return units;
  }

  function linePlayers1208(side){
    const line=lines?.[currentLine];
    if(!line) return [];
    const posIds=new Set((positions||[]).filter(p=>p.side===side).map(p=>String(p.id)));
    const otherIds=new Set((positions||[]).filter(p=>p.side!=="special" && p.side!==side).map(p=>String(p.id)));

    const first=(assignments||[])
      .filter(a=>String(a.line_id)===String(line.id) && posIds.has(String(a.position_label_id)))
      .map(a=>players.find(p=>String(p.id)===String(a.player_id)))
      .filter(Boolean);

    const second=(assignments||[])
      .filter(a=>String(a.line_id)===String(line.id) && otherIds.has(String(a.position_label_id)))
      .map(a=>players.find(p=>String(p.id)===String(a.player_id)))
      .filter(Boolean);

    const seen=new Set(), out=[];
    [...first,...second].forEach(p=>{
      if(!p || seen.has(String(p.id))) return;
      seen.add(String(p.id));
      out.push(p);
    });
    return out;
  }

  async function fillEmptyUnit1208(unit,side){
    if(!unit) return;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const slots=(specialSlots||[])
      .filter(s=>String(s.unit_id)===String(unit.id))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));

    const ua=(specialAssignments||[]).filter(a=>String(a.unit_id)===String(unit.id));
    const used=new Set(ua.map(a=>String(a.player_id)));
    const pool=linePlayers1208(side).filter(p=>!used.has(String(p.id)));

    let pi=0;
    for(const slot of slots){
      const existing=ua.find(a=>String(a.slot_id)===String(slot.id));
      if(existing) continue;
      const p=pool[pi++];
      if(!p) break;
      const r=await sb.from("special_team_assignments").insert({
        unit_id:unit.id,
        slot_id:slot.id,
        player_id:p.id
      });
      if(r.error) console.error("120.8 auto fill:",r.error);
    }
  }

  async function autoFillVisiblePair1208(){
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    const units=await get1207UnitsForMode();
    if(units[0]) await fillEmptyUnit1208(units[0],"offense");
    if(units[1]) await fillEmptyUnit1208(units[1],"defense");
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
  }

  async function open1208(){
    window.coach1208Mode=window.coach1208Mode||"kickoff";

    // Open the actual combined 120.7 overlay.
    if(typeof window.coach1207OpenSpecialTeams==="function"){
      await window.coach1207OpenSpecialTeams();
    }else{
      alert("Combined Special Teams could not be opened.");
      return;
    }

    // Let unit creation/render finish, then auto-fill EMPTY spots only.
    setTimeout(async()=>{
      try{
        await autoFillVisiblePair1208();
        if(typeof window.coach1207OpenSpecialTeams==="function"){
          // re-render so the player names appear immediately
          const existing=document.getElementById("coach1207SpecialDashboard");
          if(existing){
            await window.coach1207OpenSpecialTeams();
          }
        }
      }catch(e){ console.error("120.8 auto-fill open:",e); }
    },180);
  }

  async function setMode1208(mode){
    window.coach1208Mode=mode;
    if(typeof window.coach1207SetMode==="function"){
      window.coach1207SetMode(mode);
    }
    setTimeout(async()=>{
      try{
        await autoFillVisiblePair1208();
        // force a fresh render of the chosen pair
        if(typeof window.coach1207SetMode==="function"){
          window.coach1207SetMode(mode);
        }
      }catch(e){console.error("120.8 auto-fill mode:",e);}
    },160);
  }

  window.coach1208OpenSpecialTeams=open1208;
  window.coach1208SetMode=setMode1208;

  // Force BOTH Special Teams entry points into the combined page:
  // 1) bottom dashboard menu, 2) native top SPECIAL TEAMS tab.
  document.addEventListener("click",function(e){
    const nativeTab=e.target.closest?.("#specialTab");
    const dashboardBtn=e.target.closest?.("#coach1200DashboardBar button");
    const isDashboardSpecial=dashboardBtn && /SPECIAL TEAMS/i.test(String(dashboardBtn.textContent||""));

    if(true) return;
  },true);

  // Intercept KICKOFF/PUNT buttons inside combined overlay so auto-fill happens
  // automatically when the coach switches between the two pairs.
  document.addEventListener("click",function(e){
    const root=e.target.closest?.("#coach1207SpecialDashboard");
    if(!root) return;
    return;
    const b=e.target.closest?.("button");
    if(!b) return;
    const t=String(b.textContent||"").trim().toUpperCase();
    if(t==="KICKOFF"){
      e.preventDefault(); e.stopImmediatePropagation(); setMode1208("kickoff");
    }else if(t==="PUNT"){
      e.preventDefault(); e.stopImmediatePropagation(); setMode1208("punt");
    }
  },true);
})();


/* =========================================================
   120.9 — single-field Special Teams, matching normal field view.
   ========================================================= */
(function(){
  const TYPES={
    kickoff:{
      offense:{label:"KICKOFF OFFENSE",base:"Kickoff"},
      defense:{label:"KICKOFF DEFENSE",base:"Kick Return"}
    },
    punt:{
      offense:{label:"PUNT OFFENSE",base:"Punt"},
      defense:{label:"PUNT DEFENSE",base:"Punt Return"}
    }
  };

  let mode="kickoff";
  let moveMode=false;

  function line(){ return lines?.[currentLine]||null; }
  function unitName(type){ const l=line(); return l?`${l.name} — ${type.label}`:""; }

  async function ensureUnit(type){
    const l=line(); if(!l) return null;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    let u=(specialUnits||[]).find(x=>{
      const n=String(x.name||"");
      return n===unitName(type) || n===`${l.name} • ${type.label}`;
    });
    if(u) return u;
    if(!navigator.onLine) return null;

    const sort=Math.max(-1,...(specialUnits||[]).map(x=>Number(x.sort_order||0)))+1;
    const r=await sb.from("special_team_units")
      .insert({team_id:team.id,name:unitName(type),sort_order:sort})
      .select().single();
    if(r.error){ alert(r.error.message); return null; }
    u=r.data;

    const defs=(typeof SPECIAL_DEFAULTS!=="undefined" && SPECIAL_DEFAULTS[type.base])||[];
    if(defs.length){
      const sr=await sb.from("special_team_slots").insert(defs.map((x,i)=>({
        unit_id:u.id,slot_key:x[0],label:x[1],x_pct:x[2],y_pct:x[3],sort_order:i
      })));
      if(sr.error){ alert(sr.error.message); return null; }
    }
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    return (specialUnits||[]).find(x=>String(x.id)===String(u.id))||u;
  }

  function linePool(side){
    const l=line(); if(!l) return [];
    const ids=new Set((positions||[]).filter(p=>p.side===side).map(p=>String(p.id)));
    const otherIds=new Set((positions||[]).filter(p=>p.side!==side && p.side!=="special").map(p=>String(p.id)));

    const preferred=(assignments||[])
      .filter(a=>String(a.line_id)===String(l.id) && ids.has(String(a.position_label_id)))
      .map(a=>players.find(p=>String(p.id)===String(a.player_id)))
      .filter(Boolean);

    const fallback=(assignments||[])
      .filter(a=>String(a.line_id)===String(l.id) && otherIds.has(String(a.position_label_id)))
      .map(a=>players.find(p=>String(p.id)===String(a.player_id)))
      .filter(Boolean);

    const seen=new Set(), out=[];
    [...preferred,...fallback].forEach(p=>{
      if(seen.has(String(p.id))) return;
      seen.add(String(p.id)); out.push(p);
    });
    return out;
  }

  async function fillEmpty(unit,side){
    if(!unit) return;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const ua=(specialAssignments||[]).filter(a=>String(a.unit_id)===String(unit.id));
    const used=new Set(ua.map(a=>String(a.player_id)));
    const pool=linePool(side).filter(p=>!used.has(String(p.id)));
    let pi=0;
    for(const slot of slots){
      if(ua.some(a=>String(a.slot_id)===String(slot.id))) continue;
      const p=pool[pi++]; if(!p) break;
      const r=await sb.from("special_team_assignments").insert({
        unit_id:unit.id,slot_id:slot.id,player_id:p.id
      });
      if(r.error) console.error(r.error);
    }
  }

  function assignmentMap(unitId){
    const map=new Map();
    (specialAssignments||[]).filter(a=>String(a.unit_id)===String(unitId)).forEach(a=>{
      map.set(String(a.slot_id),players.find(p=>String(p.id)===String(a.player_id)));
    });
    return map;
  }

  // Convert unit-local 0-100 Y into top-half / bottom-half coordinates.
  function yFor(side,y){
    const yy=Math.max(4,Math.min(96,Number(y)||50));
    return side==="offense" ? 5 + yy*0.43 : 52 + yy*0.43;
  }

  function spotHtml(slot,player,side){
    return `<button type="button"
      class="coach1209Spot ${side==="defense"?"defense":""} ${moveMode?"moveMode":""}"
      data-slot-id="${coach11819Esc(String(slot.id))}"
      data-unit-id="${coach11819Esc(String(slot.unit_id))}"
      data-side="${side}"
      style="left:${Number(slot.x_pct)}%;top:${yFor(side,slot.y_pct)}%">
      ${coach11819Esc(slot.label||slot.slot_key||"SPOT")}
      <small>${player?coach11819Esc(player.name||"PLAYER"):"OPEN"}</small>
    </button>`;
  }

  async function render(){
    const root=document.getElementById("coach1209SpecialDashboard");
    if(!root) return;
    const l=line(); if(!l) return;

    const pair=TYPES[mode];
    const off=await ensureUnit(pair.offense);
    const def=await ensureUnit(pair.defense);
    if(!off||!def) return;

    await fillEmpty(off,"offense");
    await fillEmpty(def,"defense");
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const offSlots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(off.id))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const defSlots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(def.id))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));

    const offMap=assignmentMap(off.id), defMap=assignmentMap(def.id);

    root.innerHTML=`
      <div class="coach1209Top">
        <div class="coach1209TopLeft">
          <b>${coach11819Esc(l.name)} — SPECIAL TEAMS</b>
          <button class="${mode==="kickoff"?"active":""}" onclick="coach1209SetMode('kickoff')">KICKOFF</button>
          <button class="${mode==="punt"?"active":""}" onclick="coach1209SetMode('punt')">PUNT</button>
        </div>
        <div class="coach1209TopRight">
          <button onclick="coach1209AutoFill()">AUTO FILL FROM ${coach11819Esc(l.name.toUpperCase())}</button>
          <button class="${moveMode?"active":""}" onclick="coach1209ToggleMove()">MOVE SPOTS</button>
          <button onclick="coach1209Rename()">RENAME SPOTS</button>
          <button onclick="coach1209Close()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1209Field">
        <div class="coach1209FieldLabel offense">${coach11819Esc(pair.offense.label)}</div>
        <div class="coach1209FieldLabel defense">${coach11819Esc(pair.defense.label)}</div>
        ${offSlots.map(s=>spotHtml(s,offMap.get(String(s.id)),"offense")).join("")}
        ${defSlots.map(s=>spotHtml(s,defMap.get(String(s.id)),"defense")).join("")}
        <div class="coach1209Hint">${moveMode?"Drag any spot to reposition it.":"Tap MOVE SPOTS to rearrange. Empty spots auto-fill from the selected line."}</div>
      </div>`;

    bindDrag();
  }

  async function autoFill(){
    const pair=TYPES[mode];
    const off=await ensureUnit(pair.offense);
    const def=await ensureUnit(pair.defense);
    if(!off||!def) return;
    // Explicit auto-fill resets these two units using selected line players.
    for(const unit of [off,def]){
      await sb.from("special_team_assignments").delete().eq("unit_id",unit.id);
    }
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    await fillEmpty(off,"offense");
    await fillEmpty(def,"defense");
    await render();
  }

  function bindDrag(){
    if(!moveMode) return;
    document.querySelectorAll("#coach1209SpecialDashboard .coach1209Spot").forEach(spot=>{
      const field=spot.closest(".coach1209Field");
      if(!field) return;
      let dragging=false;

      const move=e=>{
        if(!dragging) return;
        const rect=field.getBoundingClientRect();
        const px=e.touches?.[0]?.clientX ?? e.clientX;
        const py=e.touches?.[0]?.clientY ?? e.clientY;
        const x=Math.max(3,Math.min(97,(px-rect.left)/rect.width*100));
        const overallY=Math.max(4,Math.min(96,(py-rect.top)/rect.height*100));
        const side=spot.dataset.side;
        const localY=side==="offense"
          ? Math.max(0,Math.min(100,(overallY-5)/0.43))
          : Math.max(0,Math.min(100,(overallY-52)/0.43));
        spot.style.left=x+"%";
        spot.style.top=overallY+"%";
        spot.dataset.x=x;
        spot.dataset.localY=localY;
        e.preventDefault();
      };

      const end=async()=>{
        if(!dragging) return;
        dragging=false;
        document.removeEventListener("mousemove",move,true);
        document.removeEventListener("mouseup",end,true);
        document.removeEventListener("touchmove",move,true);
        document.removeEventListener("touchend",end,true);

        const id=spot.dataset.slotId;
        const x=Number(spot.dataset.x||parseFloat(spot.style.left));
        const y=Number(spot.dataset.localY);
        if(id && Number.isFinite(x) && Number.isFinite(y)){
          const r=await sb.from("special_team_slots").update({x_pct:x,y_pct:y}).eq("id",id);
          if(r.error) alert(r.error.message);
          if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
        }
      };

      const start=e=>{
        dragging=true;
        document.addEventListener("mousemove",move,true);
        document.addEventListener("mouseup",end,true);
        document.addEventListener("touchmove",move,{capture:true,passive:false});
        document.addEventListener("touchend",end,true);
        e.preventDefault(); e.stopPropagation();
      };

      spot.addEventListener("mousedown",start,true);
      spot.addEventListener("touchstart",start,{capture:true,passive:false});
    });
  }

  async function rename(){
    const pair=TYPES[mode];
    const off=await ensureUnit(pair.offense), def=await ensureUnit(pair.defense);
    if(!off||!def) return;
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();

    const groups=[{label:pair.offense.label,unit:off},{label:pair.defense.label,unit:def}];
    document.querySelector(".coach1209RenameOverlay")?.remove();

    const overlay=document.createElement("div");
    overlay.className="coach1209RenameOverlay";
    overlay.innerHTML=`
      <div class="coach1209RenameCard">
        <div class="coach1209Top">
          <b>RENAME ${coach11819Esc(mode.toUpperCase())} SPOTS</b>
          <button onclick="document.querySelector('.coach1209RenameOverlay')?.remove()">✕ CLOSE</button>
        </div>
        <div class="coach1209RenameGrid">
          ${groups.map(g=>{
            const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(g.unit.id))
              .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
            return slots.map(s=>`
              <label>
                <b>${coach11819Esc(s.slot_key||"SPOT")}</b>
                <input data-slot-id="${coach11819Esc(String(s.id))}" value="${coach11819Esc(s.label||s.slot_key||"")}">
              </label>`).join("");
          }).join("")}
        </div>
        <div class="coach1209TopRight" style="margin-top:12px">
          <button onclick="coach1209SaveRename()">SAVE NAMES</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  async function saveRename(){
    for(const input of document.querySelectorAll(".coach1209RenameOverlay input[data-slot-id]")){
      const r=await sb.from("special_team_slots")
        .update({label:input.value.trim()||"SPOT"})
        .eq("id",input.dataset.slotId);
      if(r.error){ alert(r.error.message); return; }
    }
    if(typeof loadSpecialTeams==="function") await loadSpecialTeams();
    document.querySelector(".coach1209RenameOverlay")?.remove();
    await render();
  }

  async function open(){
    close();
    const l=line(); if(!l) return alert("Select a line first.");
    const root=document.createElement("div");
    root.id="coach1209SpecialDashboard";
    root.innerHTML='<div style="display:grid;place-items:center">Loading Special Teams…</div>';
    document.body.appendChild(root);
    await render();
  }

  function close(){
    document.getElementById("coach1209SpecialDashboard")?.remove();
    moveMode=false;
  }

  function setMode(m){ if(!TYPES[m]) return; mode=m; moveMode=false; render(); }
  function toggleMove(){ moveMode=!moveMode; render(); }

  window.coach1209OpenSpecialTeams=open;
  window.coach1209Close=close;
  window.coach1209SetMode=setMode;
  window.coach1209ToggleMove=toggleMove;
  window.coach1209AutoFill=autoFill;
  window.coach1209Rename=rename;
  window.coach1209SaveRename=saveRename;

  // Both Special Teams entry points open the single-field version.
  document.addEventListener("click",function(e){
    const native=e.target.closest?.("#specialTab");
    const dash=e.target.closest?.("#coach1200DashboardBar button");
    const dashSpecial=dash && /SPECIAL TEAMS/i.test(String(dash.textContent||""));
    if(!native && !dashSpecial) return;
    e.preventDefault(); e.stopImmediatePropagation();
    open();
  },true);
})();


/* =========================================================
   121.0 — FINAL SPECIAL TEAMS ROUTING
   ========================================================= */
(function(){
  async function open1210(){
    document.getElementById("coach1207SpecialDashboard")?.remove();
    document.getElementById("coach1205SpecialPanel")?.remove();
    document.getElementById("coach1209SpecialDashboard")?.remove();

    if(typeof window.coach1209OpenSpecialTeams==="function"){
      await window.coach1209OpenSpecialTeams();
    }else{
      alert("Special Teams could not be opened.");
    }
  }

  window.coach1210OpenSpecialTeams=open1210;

  function rewireNativeSpecialTab(){
    const old=document.getElementById("specialTab");
    if(!old || old.dataset.coach1210==="1") return;
    old.id="specialTab1210";
    old.dataset.coach1210="1";
    old.onclick=null;
    old.addEventListener("click",function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      open1210();
    },true);
  }

  function rewireDashboardButton(){
    const bar=document.getElementById("coach1200DashboardBar");
    if(!bar) return;
    const btn=[...bar.querySelectorAll("button")].find(b=>/SPECIAL TEAMS/i.test(String(b.textContent||"")));
    if(!btn || btn.dataset.coach1210==="1") return;
    btn.dataset.coach1210="1";
    btn.textContent="SPECIAL";
    btn.onclick=null;
    btn.addEventListener("click",function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      open1210();
    },true);
  }

  function enforce(){
    rewireNativeSpecialTab();
    rewireDashboardButton();
    document.getElementById("coach1207SpecialDashboard")?.remove();
  }

  setInterval(enforce,250);
  setTimeout(enforce,50);
})();


/* =========================================================
   121.1 — NON-BLOCKING SPECIAL TEAMS LOAD
   Render immediately from cached/live arrays; refresh in background.
   ========================================================= */
(function(){
  const TYPES={
    kickoff:{off:["KICKOFF OFFENSE","Kickoff"],def:["KICKOFF DEFENSE","Kick Return"]},
    punt:{off:["PUNT OFFENSE","Punt"],def:["PUNT DEFENSE","Punt Return"]}
  };
  let mode="kickoff";
  let moveMode=false;

  function esc1211(v){ return typeof coach11819Esc==="function" ? coach11819Esc(String(v??"")) : String(v??""); }
  function currentLine1211(){ return lines?.[currentLine]||null; }

  function findUnit1211(kind){
    const l=currentLine1211();
    if(!l) return null;
    const names=TYPES[mode][kind];
    const preferred=[
      `${l.name} — ${names[0]}`,
      `${l.name} • ${names[0]}`,
      `${l.name} — ${names[1]}`,
      `${l.name} • ${names[1]}`,
      names[0],
      names[1]
    ];
    for(const n of preferred){
      const u=(specialUnits||[]).find(x=>String(x.name||"").toUpperCase()===String(n).toUpperCase());
      if(u) return u;
    }
    return null;
  }

  function amap1211(unitId){
    const map=new Map();
    (specialAssignments||[]).filter(a=>String(a.unit_id)===String(unitId)).forEach(a=>{
      map.set(String(a.slot_id),players.find(p=>String(p.id)===String(a.player_id)));
    });
    return map;
  }

  function y1211(side,y){
    const yy=Math.max(4,Math.min(96,Number(y)||50));
    return side==="offense"?5+yy*.43:52+yy*.43;
  }

  function spot1211(slot,player,side){
    return `<button type="button"
      class="coach1209Spot ${side==="defense"?"defense":""} ${moveMode?"moveMode":""}"
      data-slot-id="${esc1211(slot.id)}" data-side="${side}"
      style="left:${Number(slot.x_pct)||50}%;top:${y1211(side,slot.y_pct)}%">
      ${esc1211(slot.label||slot.slot_key||"SPOT")}
      <small>${player?esc1211(player.name||"PLAYER"):"OPEN"}</small>
    </button>`;
  }

  function render1211(){
    const root=document.getElementById("coach1209SpecialDashboard");
    if(!root) return;
    const l=currentLine1211();
    if(!l) return;

    const off=findUnit1211("off");
    const def=findUnit1211("def");

    if(!off || !def){
      root.innerHTML=`
        <div class="coach1209Top">
          <div class="coach1209TopLeft"><b>${esc1211(l.name)} — SPECIAL TEAMS</b></div>
          <div class="coach1209TopRight"><button onclick="coach1211Close()">✕ CLOSE</button></div>
        </div>
        <div class="coach1209Field">
          <div id="coach1211Loading">
            <div id="coach1211Error">
              Special Teams data is not ready yet.<br><br>
              <button onclick="coach1211Retry()">RETRY LOAD</button>
            </div>
          </div>
        </div>`;
      return;
    }

    const offSlots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(off.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const defSlots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(def.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const om=amap1211(off.id), dm=amap1211(def.id);
    const labels=mode==="kickoff"?["KICKOFF OFFENSE","KICKOFF DEFENSE"]:["PUNT OFFENSE","PUNT DEFENSE"];

    root.innerHTML=`
      <div class="coach1209Top">
        <div class="coach1209TopLeft">
          <b>${esc1211(l.name)} — SPECIAL TEAMS</b>
          <button class="${mode==="kickoff"?"active":""}" onclick="coach1211SetMode('kickoff')">KICKOFF</button>
          <button class="${mode==="punt"?"active":""}" onclick="coach1211SetMode('punt')">PUNT</button>
        </div>
        <div class="coach1209TopRight">
          <button onclick="coach1211AutoFill()">AUTO FILL FROM ${esc1211(l.name.toUpperCase())}</button>
          <button class="${moveMode?"active":""}" onclick="coach1211ToggleMove()">MOVE SPOTS</button>
          <button onclick="coach1209Rename()">RENAME SPOTS</button>
          <button onclick="coach1211Close()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1209Field">
        <div class="coach1209FieldLabel offense">${labels[0]}</div>
        <div class="coach1209FieldLabel defense">${labels[1]}</div>
        ${offSlots.map(s=>spot1211(s,om.get(String(s.id)),"offense")).join("")}
        ${defSlots.map(s=>spot1211(s,dm.get(String(s.id)),"defense")).join("")}
        <div class="coach1209Hint">${moveMode?"Drag any spot to reposition it.":"One field: offense top, defense bottom."}</div>
      </div>`;
    bindDrag1211();
  }

  async function refresh1211(){
    try{
      const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),3500));
      if(typeof loadSpecialTeams==="function") await Promise.race([loadSpecialTeams(),timeout]);
    }catch(e){
      console.warn("121.1 Special Teams refresh:",e);
    }
    render1211();
  }

  async function open1211(){
    document.getElementById("coach1207SpecialDashboard")?.remove();
    document.getElementById("coach1205SpecialPanel")?.remove();
    document.getElementById("coach1209SpecialDashboard")?.remove();

    const root=document.createElement("div");
    root.id="coach1209SpecialDashboard";
    root.innerHTML=`
      <div class="coach1209Top">
        <div class="coach1209TopLeft"><b>${esc1211(currentLine1211()?.name||"LINE")} — SPECIAL TEAMS</b></div>
        <div class="coach1209TopRight"><button onclick="coach1211Close()">✕ CLOSE</button></div>
      </div>
      <div class="coach1209Field"><div id="coach1211Loading">Loading Special Teams…</div></div>`;
    document.body.appendChild(root);

    // Paint immediately from current in-memory data.
    render1211();
    // Then refresh without blocking the screen.
    refresh1211();
  }

  async function retry1211(){ await refresh1211(); }

  function linePool1211(side){
    const l=currentLine1211(); if(!l) return [];
    const ids=new Set((positions||[]).filter(p=>p.side===side).map(p=>String(p.id)));
    const other=new Set((positions||[]).filter(p=>p.side!==side&&p.side!=="special").map(p=>String(p.id)));
    const arr=[...(assignments||[]).filter(a=>String(a.line_id)===String(l.id)&&ids.has(String(a.position_label_id))),
               ...(assignments||[]).filter(a=>String(a.line_id)===String(l.id)&&other.has(String(a.position_label_id)))];
    const seen=new Set(), out=[];
    arr.forEach(a=>{
      const p=players.find(x=>String(x.id)===String(a.player_id));
      if(p&&!seen.has(String(p.id))){seen.add(String(p.id));out.push(p);}
    });
    return out;
  }

  async function fillUnit1211(unit,side){
    if(!unit) return;
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const pool=linePool1211(side);
    await sb.from("special_team_assignments").delete().eq("unit_id",unit.id);
    for(let i=0;i<slots.length && i<pool.length;i++){
      const r=await sb.from("special_team_assignments").upsert(
        {unit_id:unit.id,slot_id:slots[i].id,player_id:pool[i].id},
        {onConflict:"unit_id,slot_id"}
      );
      if(r.error) console.error(r.error);
    }
  }

  async function autoFill1211(){
    const off=findUnit1211("off"), def=findUnit1211("def");
    if(!off||!def) return alert("Special Teams units are not loaded yet.");
    await fillUnit1211(off,"offense");
    await fillUnit1211(def,"defense");
    await refresh1211();
  }

  function setMode1211(m){ mode=m; moveMode=false; render1211(); refresh1211(); }
  function toggleMove1211(){ moveMode=!moveMode; render1211(); }

  function bindDrag1211(){
    if(!moveMode) return;
    document.querySelectorAll("#coach1209SpecialDashboard .coach1209Spot").forEach(spot=>{
      const field=spot.closest(".coach1209Field"); if(!field) return;
      let drag=false;
      const mv=e=>{
        if(!drag) return;
        const r=field.getBoundingClientRect();
        const x0=e.touches?.[0]?.clientX??e.clientX, y0=e.touches?.[0]?.clientY??e.clientY;
        const x=Math.max(3,Math.min(97,(x0-r.left)/r.width*100));
        const oy=Math.max(4,Math.min(96,(y0-r.top)/r.height*100));
        const side=spot.dataset.side;
        const ly=side==="offense"?Math.max(0,Math.min(100,(oy-5)/.43)):Math.max(0,Math.min(100,(oy-52)/.43));
        spot.style.left=x+"%"; spot.style.top=oy+"%"; spot.dataset.x=x; spot.dataset.ly=ly;
        e.preventDefault();
      };
      const end=async()=>{
        if(!drag) return; drag=false;
        document.removeEventListener("mousemove",mv,true);document.removeEventListener("mouseup",end,true);
        document.removeEventListener("touchmove",mv,true);document.removeEventListener("touchend",end,true);
        const id=spot.dataset.slotId,x=Number(spot.dataset.x),y=Number(spot.dataset.ly);
        if(id&&Number.isFinite(x)&&Number.isFinite(y)){
          await sb.from("special_team_slots").update({x_pct:x,y_pct:y}).eq("id",id);
          const s=(specialSlots||[]).find(v=>String(v.id)===String(id)); if(s){s.x_pct=x;s.y_pct=y;}
        }
      };
      const start=e=>{drag=true;document.addEventListener("mousemove",mv,true);document.addEventListener("mouseup",end,true);
        document.addEventListener("touchmove",mv,{capture:true,passive:false});document.addEventListener("touchend",end,true);
        e.preventDefault();e.stopPropagation();};
      spot.addEventListener("mousedown",start,true);spot.addEventListener("touchstart",start,{capture:true,passive:false});
    });
  }

  function close1211(){ document.getElementById("coach1209SpecialDashboard")?.remove(); moveMode=false; }

  window.coach1211OpenSpecialTeams=open1211;
  window.coach1211Retry=retry1211;
  window.coach1211SetMode=setMode1211;
  window.coach1211ToggleMove=toggleMove1211;
  window.coach1211AutoFill=autoFill1211;
  window.coach1211Close=close1211;

  // Rewire dashboard button and native tab to this non-blocking opener.
  setInterval(()=>{
    const native=document.getElementById("specialTab1210")||document.getElementById("specialTab");
    if(native && native.dataset.coach1211!=="1"){
      native.dataset.coach1211="1";
      native.onclick=null;
      native.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();open1211();},true);
    }
    const bar=document.getElementById("coach1200DashboardBar");
    if(bar){
      const b=[...bar.querySelectorAll("button")].find(x=>/SPECIAL/i.test(String(x.textContent||"")));
      if(b && b.dataset.coach1211!=="1"){
        b.dataset.coach1211="1"; b.textContent="SPECIAL";
        b.onclick=null;
        b.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();open1211();},true);
      }
    }
  },250);
})();


/* =========================================================
   121.2 — HARD RESET SPECIAL TEAMS
   No old overlay functions are called.
   ========================================================= */
(function(){
  let mode="kickoff";
  let move=false;

  const SPEC={
    kickoff:{off:["KICKOFF OFFENSE","Kickoff"],def:["KICKOFF DEFENSE","Kick Return"]},
    punt:{off:["PUNT OFFENSE","Punt"],def:["PUNT DEFENSE","Punt Return"]}
  };

  function line(){ return lines?.[currentLine]||null; }

  function findUnit(kind){
    const l=line(); if(!l) return null;
    const [full,generic]=SPEC[mode][kind];
    const names=[
      `${l.name} — ${full}`,`${l.name} • ${full}`,
      `${l.name} — ${generic}`,`${l.name} • ${generic}`,
      full,generic
    ].map(x=>x.toUpperCase());
    return (specialUnits||[]).find(u=>names.includes(String(u.name||"").toUpperCase()))||null;
  }

  function amap(unit){
    const m=new Map();
    if(!unit) return m;
    (specialAssignments||[]).filter(a=>String(a.unit_id)===String(unit.id)).forEach(a=>{
      m.set(String(a.slot_id),players.find(p=>String(p.id)===String(a.player_id)));
    });
    return m;
  }

  function y(side,v){
    const yy=Math.max(4,Math.min(96,Number(v)||50));
    return side==="offense" ? 5+yy*.43 : 52+yy*.43;
  }

  function slotHtml(s,p,side){
    return `<button type="button"
      class="coach1212Spot ${side==="defense"?"def":""} ${move?"move":""}"
      data-slot="${String(s.id)}" data-side="${side}"
      style="left:${Number(s.x_pct)||50}%;top:${y(side,s.y_pct)}%">
      ${String(s.label||s.slot_key||"SPOT")}
      <small>${p?String(p.name||"PLAYER"):"OPEN"}</small>
    </button>`;
  }

  function render(){
    const root=document.getElementById("coach1212Special");
    if(!root) return;
    const l=line(); if(!l) return;

    const off=findUnit("off"), def=findUnit("def");
    const labels=mode==="kickoff"?["KICKOFF OFFENSE","KICKOFF DEFENSE"]:["PUNT OFFENSE","PUNT DEFENSE"];

    if(!off || !def){
      root.innerHTML=`
        <div class="coach1212Top">
          <div><b>${l.name} — SPECIAL TEAMS</b></div>
          <div><button onclick="coach1212Close()">✕ CLOSE</button></div>
        </div>
        <div class="coach1212Field">
          <div class="coach1212Empty">No saved ${labels[0]} / ${labels[1]} units were found.</div>
        </div>`;
      return;
    }

    const os=(specialSlots||[]).filter(s=>String(s.unit_id)===String(off.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const ds=(specialSlots||[]).filter(s=>String(s.unit_id)===String(def.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const om=amap(off), dm=amap(def);

    root.innerHTML=`
      <div class="coach1212Top">
        <div>
          <b>${l.name} — SPECIAL TEAMS</b>
          <button class="${mode==="kickoff"?"active":""}" onclick="coach1212Mode('kickoff')">KICKOFF</button>
          <button class="${mode==="punt"?"active":""}" onclick="coach1212Mode('punt')">PUNT</button>
        </div>
        <div>
          <button onclick="coach1212AutoFill()">AUTO FILL FROM ${l.name.toUpperCase()}</button>
          <button class="${move?"active":""}" onclick="coach1212Move()">MOVE SPOTS</button>
          <button onclick="coach1212Close()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1212Field">
        <div class="coach1212Label off">${labels[0]}</div>
        <div class="coach1212Label def">${labels[1]}</div>
        ${os.map(s=>slotHtml(s,om.get(String(s.id)),"offense")).join("")}
        ${ds.map(s=>slotHtml(s,dm.get(String(s.id)),"defense")).join("")}
      </div>`;
    bindDrag();
  }

  function linePool(side){
    const l=line(); if(!l) return [];
    const ids=new Set((positions||[]).filter(p=>p.side===side).map(p=>String(p.id)));
    const other=new Set((positions||[]).filter(p=>p.side!==side && p.side!=="special").map(p=>String(p.id)));
    const arr=[
      ...(assignments||[]).filter(a=>String(a.line_id)===String(l.id)&&ids.has(String(a.position_label_id))),
      ...(assignments||[]).filter(a=>String(a.line_id)===String(l.id)&&other.has(String(a.position_label_id)))
    ];
    const out=[],seen=new Set();
    arr.forEach(a=>{
      const p=players.find(x=>String(x.id)===String(a.player_id));
      if(p&&!seen.has(String(p.id))){seen.add(String(p.id));out.push(p);}
    });
    return out;
  }

  async function fill(unit,side){
    if(!unit) return;
    const slots=(specialSlots||[]).filter(s=>String(s.unit_id)===String(unit.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const pool=linePool(side);
    await sb.from("special_team_assignments").delete().eq("unit_id",unit.id);
    for(let i=0;i<slots.length && i<pool.length;i++){
      const r=await sb.from("special_team_assignments").upsert(
        {unit_id:unit.id,slot_id:slots[i].id,player_id:pool[i].id},
        {onConflict:"unit_id,slot_id"}
      );
      if(r.error) console.error(r.error);
    }
  }

  async function autoFill(){
    const off=findUnit("off"),def=findUnit("def");
    if(!off||!def) return;
    await fill(off,"offense");
    await fill(def,"defense");
    if(typeof loadSpecialTeams==="function") {
      try{ await loadSpecialTeams(); }catch(e){ console.warn(e); }
    }
    render();
  }

  function bindDrag(){
    if(!move) return;
    document.querySelectorAll("#coach1212Special .coach1212Spot").forEach(spot=>{
      const field=spot.closest(".coach1212Field"); if(!field) return;
      let drag=false;
      const mv=e=>{
        if(!drag) return;
        const r=field.getBoundingClientRect();
        const cx=e.touches?.[0]?.clientX??e.clientX;
        const cy=e.touches?.[0]?.clientY??e.clientY;
        const x=Math.max(3,Math.min(97,(cx-r.left)/r.width*100));
        const oy=Math.max(4,Math.min(96,(cy-r.top)/r.height*100));
        const side=spot.dataset.side;
        const ly=side==="offense"?Math.max(0,Math.min(100,(oy-5)/.43)):Math.max(0,Math.min(100,(oy-52)/.43));
        spot.style.left=x+"%";spot.style.top=oy+"%";spot.dataset.x=x;spot.dataset.ly=ly;
        e.preventDefault();
      };
      const end=async()=>{
        if(!drag) return; drag=false;
        document.removeEventListener("mousemove",mv,true);document.removeEventListener("mouseup",end,true);
        document.removeEventListener("touchmove",mv,true);document.removeEventListener("touchend",end,true);
        const id=spot.dataset.slot,x=Number(spot.dataset.x),yy=Number(spot.dataset.ly);
        if(id&&Number.isFinite(x)&&Number.isFinite(yy)){
          await sb.from("special_team_slots").update({x_pct:x,y_pct:yy}).eq("id",id);
          const s=(specialSlots||[]).find(q=>String(q.id)===String(id));if(s){s.x_pct=x;s.y_pct=yy;}
        }
      };
      const st=e=>{drag=true;document.addEventListener("mousemove",mv,true);document.addEventListener("mouseup",end,true);
        document.addEventListener("touchmove",mv,{capture:true,passive:false});document.addEventListener("touchend",end,true);
        e.preventDefault();e.stopPropagation();};
      spot.addEventListener("mousedown",st,true);spot.addEventListener("touchstart",st,{capture:true,passive:false});
    });
  }

  function open(){
    // remove every prior special-teams overlay
    ["coach1205SpecialPanel","coach1207SpecialDashboard","coach1209SpecialDashboard","coach1212Special"].forEach(id=>document.getElementById(id)?.remove());

    const root=document.createElement("div");
    root.id="coach1212Special";
    document.body.appendChild(root);
    render();

    // background refresh only, never blocks the screen
    if(typeof loadSpecialTeams==="function"){
      Promise.resolve(loadSpecialTeams()).then(render).catch(()=>{});
    }
  }

  function close(){document.getElementById("coach1212Special")?.remove();move=false;}
  function setMode(m){mode=m;move=false;render();}
  function toggleMove(){move=!move;render();}

  window.coach1212Open=open;
  window.coach1212Close=close;
  window.coach1212Mode=setMode;
  window.coach1212Move=toggleMove;
  window.coach1212AutoFill=autoFill;

  function hardRewire(){
    // Replace nodes entirely to remove every old click listener.
    const oldTab=document.getElementById("specialTab1210")||document.getElementById("specialTab");
    if(oldTab && oldTab.dataset.coach1212!=="1"){
      const n=oldTab.cloneNode(true);
      n.id="specialTab1212";
      n.dataset.coach1212="1";
      n.onclick=null;
      n.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open();},true);
      oldTab.replaceWith(n);
    }

    const bar=document.getElementById("coach1200DashboardBar");
    if(bar){
      const oldBtn=[...bar.querySelectorAll("button")].find(b=>/SPECIAL/i.test(String(b.textContent||"")));
      if(oldBtn && oldBtn.dataset.coach1212!=="1"){
        const n=oldBtn.cloneNode(true);
        n.dataset.coach1212="1";
        n.textContent="SPECIAL TEAMS";
        n.onclick=null;
        n.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open();},true);
        oldBtn.replaceWith(n);
      }
    }
  }

  setInterval(hardRewire,250);
  setTimeout(hardRewire,40);
})();


/* =========================================================
   121.3 — RESTORE ORIGINAL SPECIAL-TEAMS SPOT NAMES/LOCATIONS
   + switch lines without leaving Special Teams
   + Special Teams never feeds participation stats
   ========================================================= */
(function(){
  function currentLine1213(){ return lines?.[currentLine]||null; }

  function scoreLegacyUnit1213(unit,kind,mode){
    const l=currentLine1213();
    if(!l||!unit) return -999;
    const n=String(unit.name||"").toUpperCase();
    const ln=String(l.name||"").toUpperCase();
    let s=0;
    if(n.includes(ln)) s+=20;

    if(mode==="kickoff"){
      if(kind==="off"){
        if(n.includes("KICKOFF")) s+=20;
        if(!n.includes("OFFENSE")&&!n.includes("DEFENSE")) s+=8;
      }else{
        if(n.includes("KICK RETURN")) s+=22;
        if(n.includes("RETURN")) s+=12;
        if(n.includes("DEFENSE")) s+=6;
      }
    }else{
      if(kind==="off"){
        if(n.includes("PUNT")) s+=20;
        if(!n.includes("RETURN")&&!n.includes("DEFENSE")) s+=8;
      }else{
        if(n.includes("PUNT RETURN")) s+=22;
        else if(n.includes("RETURN")) s+=12;
        if(n.includes("DEFENSE")) s+=6;
      }
    }

    // Prefer older simpler unit names over newly-created "... OFFENSE/DEFENSE" clones.
    if(!n.includes("OFFENSE")&&!n.includes("DEFENSE")) s+=15;
    return s;
  }

  function bestLegacyUnit1213(kind,mode){
    const candidates=(specialUnits||[]).slice().sort((a,b)=>
      scoreLegacyUnit1213(b,kind,mode)-scoreLegacyUnit1213(a,kind,mode)
    );
    const best=candidates[0];
    return best && scoreLegacyUnit1213(best,kind,mode)>10 ? best : null;
  }

  function restoreAssignments1213(unit){
    if(!unit) return new Map();
    const m=new Map();
    (specialAssignments||[]).filter(a=>String(a.unit_id)===String(unit.id)).forEach(a=>{
      m.set(String(a.slot_id),players.find(p=>String(p.id)===String(a.player_id)));
    });
    return m;
  }

  function y1213(side,v){
    const yy=Math.max(4,Math.min(96,Number(v)||50));
    return side==="offense"?5+yy*.43:52+yy*.43;
  }

  function lineButtons1213(){
    return (lines||[]).map((l,i)=>`
      <button type="button"
        class="coach1213LineBtn ${i===currentLine?"current":""}"
        style="border-color:${String(l.color||"#168cff")}!important"
        onclick="coach1213SwitchLine(${i})">
        ${String(l.name||`LINE ${i+1}`)}
      </button>`).join("");
  }

  function render1213(){
    const root=document.getElementById("coach1212Special");
    if(!root) return;
    const l=currentLine1213(); if(!l) return;

    const mode=window.coach1213Mode||"kickoff";
    const off=bestLegacyUnit1213("off",mode);
    const def=bestLegacyUnit1213("def",mode);

    const labels=mode==="kickoff"
      ?["KICKOFF OFFENSE","KICKOFF DEFENSE"]
      :["PUNT OFFENSE","PUNT DEFENSE"];

    if(!off||!def){
      root.innerHTML=`
        <div class="coach1212Top">
          <div>
            <b>${String(l.name)} — SPECIAL TEAMS</b>
            <div class="coach1213Lines">${lineButtons1213()}</div>
          </div>
          <div><button onclick="coach1213Close()">✕ CLOSE</button></div>
        </div>
        <div class="coach1212Field">
          <div class="coach1212Empty">Could not find the previously saved ${labels[0]} / ${labels[1]} units for ${String(l.name)}.</div>
        </div>`;
      return;
    }

    const os=(specialSlots||[]).filter(s=>String(s.unit_id)===String(off.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const ds=(specialSlots||[]).filter(s=>String(s.unit_id)===String(def.id)).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
    const om=restoreAssignments1213(off),dm=restoreAssignments1213(def);

    const spot=(s,p,side)=>`<button type="button"
      class="coach1212Spot ${side==="defense"?"def":""}"
      style="left:${Number(s.x_pct)||50}%;top:${y1213(side,s.y_pct)}%">
      ${String(s.label||s.slot_key||"SPOT")}
      <small>${p?String(p.name||"PLAYER"):"OPEN"}</small>
    </button>`;

    root.innerHTML=`
      <div class="coach1212Top">
        <div>
          <b>${String(l.name)} — SPECIAL TEAMS</b>
          <button class="${mode==="kickoff"?"active":""}" onclick="coach1213SetMode('kickoff')">KICKOFF</button>
          <button class="${mode==="punt"?"active":""}" onclick="coach1213SetMode('punt')">PUNT</button>
          <span class="coach1213RestoreNote">RESTORED SAVED SPOTS</span>
          <div class="coach1213Lines">${lineButtons1213()}</div>
        </div>
        <div>
          <button onclick="coach1213Close()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1212Field">
        <div class="coach1212Label off">${labels[0]}</div>
        <div class="coach1212Label def">${labels[1]}</div>
        ${os.map(s=>spot(s,om.get(String(s.id)),"offense")).join("")}
        ${ds.map(s=>spot(s,dm.get(String(s.id)),"defense")).join("")}
      </div>`;
  }

  async function open1213(){
    ["coach1205SpecialPanel","coach1207SpecialDashboard","coach1209SpecialDashboard","coach1212Special"].forEach(id=>document.getElementById(id)?.remove());
    const root=document.createElement("div");
    root.id="coach1212Special";
    document.body.appendChild(root);

    // Use already-loaded saved values first.
    render1213();

    // Refresh data in background, then repaint with same unit names/locations.
    if(typeof loadSpecialTeams==="function"){
      Promise.resolve(loadSpecialTeams()).then(render1213).catch(()=>{});
    }
  }

  function close1213(){ document.getElementById("coach1212Special")?.remove(); }

  function switchLine1213(i){
    const n=Number(i);
    if(!Number.isFinite(n)||!lines?.[n]) return;
    currentLine=n;
    try{
      const sel=document.getElementById("lineSelect");
      if(sel) sel.value=String(n);
    }catch(e){}
    if(typeof renderAll==="function"){
      try{ renderAll(); }catch(e){}
    }
    render1213();
  }

  function setMode1213(m){
    window.coach1213Mode=(m==="punt"?"punt":"kickoff");
    render1213();
  }

  window.coach1213Open=open1213;
  window.coach1213Close=close1213;
  window.coach1213SwitchLine=switchLine1213;
  window.coach1213SetMode=setMode1213;

  // Replace Special Teams buttons again so only restored same-field view opens.
  setInterval(()=>{
    const native=document.getElementById("specialTab1212")||document.getElementById("specialTab1210")||document.getElementById("specialTab");
    if(native && native.dataset.coach1213!=="1"){
      const n=native.cloneNode(true);
      n.dataset.coach1213="1";
      n.onclick=null;
      n.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open1213();},true);
      native.replaceWith(n);
    }

    const bar=document.getElementById("coach1200DashboardBar");
    if(bar){
      const old=[...bar.querySelectorAll("button")].find(b=>/SPECIAL/i.test(String(b.textContent||"")));
      if(old && old.dataset.coach1213!=="1"){
        const n=old.cloneNode(true);
        n.dataset.coach1213="1";
        n.textContent="SPECIAL TEAMS";
        n.onclick=null;
        n.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open1213();},true);
        old.replaceWith(n);
      }
    }
  },250);

  /* Special Teams stats rule:
     this custom Special Teams view does not call any play-recording or
     participation-count functions, so Special Teams assignments never add
     to player stats. Stats remain offense/defense Game Day participation only. */
})();
