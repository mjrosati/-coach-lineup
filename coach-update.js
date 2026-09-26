/* Coach Lineup live update layer
   v124.9 — GAME DAY SWAP FIX
   This file intentionally replaces the earlier 117.x patch stack.
*/
window.COACH_UPDATE_VERSION = "125.2";

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
        <button type="button" onclick="coach1201OpenSpecialTeams()">SPECIAL TEAMS</button>
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

  async function coach1249WriteAssignment(lineId,positionId,playerId){
    if(typeof sb==="undefined") throw new Error("Database unavailable");
    // Remove this position first. This bypasses the old UI duplicate guard while
    // the swap routine temporarily has players in transition.
    const del=await sb.from("assignments")
      .delete().eq("line_id",lineId).eq("position_label_id",positionId);
    if(del.error) throw del.error;
    if(!playerId) return;
    const ins=await sb.from("assignments").insert({
      line_id:lineId, position_label_id:positionId, player_id:playerId
    });
    if(ins.error) throw ins.error;
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
      await coach1249WriteAssignment(line.id,target.id,"");
      if(incomingHere && String(incomingHere.pos.id)!==String(target.id)){
        await coach1249WriteAssignment(line.id,incomingHere.pos.id,"");
      }

      // Put incoming player in target; outgoing player takes incoming's old spot.
      await coach1249WriteAssignment(line.id,target.id,newPlayerId);
      if(incomingHere && String(incomingHere.pos.id)!==String(target.id) && oldPlayerId){
        await coach1249WriteAssignment(line.id,incomingHere.pos.id,oldPlayerId);
      }

      /* Keep offense and defense linked on this same line.
         If both players are already on the opposite side, swap those spots too.
         If only the outgoing player is there, replace that spot with incoming. */
      if(oldOpp){
        await coach1249WriteAssignment(line.id,oldOpp.pos.id,"");
        if(incomingOpp && String(incomingOpp.pos.id)!==String(oldOpp.pos.id)){
          await coach1249WriteAssignment(line.id,incomingOpp.pos.id,"");
        }

        await coach1249WriteAssignment(line.id,oldOpp.pos.id,newPlayerId);

        if(incomingOpp &&
           String(incomingOpp.pos.id)!==String(oldOpp.pos.id) &&
           oldPlayerId){
          await coach1249WriteAssignment(line.id,incomingOpp.pos.id,oldPlayerId);
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



/* =========================================================
   122.0 — SIDELINE STABILIZATION RELEASE
   Built from the stable 120.4 live-field baseline.
   Goals:
   - keep one live-field dashboard
   - one reliable roster editor
   - full-roster linked substitutions
   - clean lines/stats/playbook routing
   - one Special Teams implementation only
   - no Special Teams stats
   - reduce duplicate/competing UI paths
   ========================================================= */
(function(){
  "use strict";

  const VERSION="124.9";
  const ROOT_ID="coach1220Special";
  const OBSERVER_KEY="coach1220Observer";

  try{ window.COACH_UPDATE_VERSION=VERSION; }catch(e){}

  function esc(v){
    return String(v??"").replace(/[&<>"']/g,c=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function currentLineObj(){ return Array.isArray(lines)?lines[currentLine]:null; }

  function activePlayers(){
    return (Array.isArray(players)?players:[])
      .filter(p=>{
        const s=String(p.availability_status||"active").toLowerCase();
        return s!=="out";
      })
      .slice()
      .sort((a,b)=>{
        const an=Number(a.jersey_number),bn=Number(b.jersey_number);
        if(Number.isFinite(an)&&Number.isFinite(bn)&&an!==bn) return an-bn;
        return String(a.name||"").localeCompare(String(b.name||""));
      });
  }

  /* ---------- one reliable roster editor ---------- */
  function openPlayers(){
    if(typeof openModal!=="function"){
      if(typeof openRosterSetup==="function") return openRosterSetup();
      return;
    }
    const list=(Array.isArray(players)?players.slice():[])
      .sort((a,b)=>Number(a.jersey_number||999)-Number(b.jersey_number||999));

    openModal(`
      <div class="coach1220Head">
        <div><small>GAME DAY</small><h2>Players</h2></div>
        <div class="coach1220HeadBtns">
          <button class="primary" onclick="coach1220AddPlayer()">+ ADD PLAYER</button>
          <button class="secondary" onclick="closeModal()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1220Roster">
        ${list.map(p=>{
          const status=String(p.availability_status||"active").toLowerCase();
          const off=Array.isArray(p.offense_positions)?p.offense_positions.join(" / "):"";
          const def=Array.isArray(p.defense_positions)?p.defense_positions.join(" / "):"";
          return `<button type="button" class="coach1220RosterRow" onclick="coach1220EditPlayer('${esc(p.id)}')">
            <b>#${esc(p.jersey_number??"")}</b>
            <span><b>${esc(p.name||"Player")}</b>
              <small>${esc([off&&"O: "+off,def&&"D: "+def].filter(Boolean).join(" • ")||"No saved positions")}</small>
            </span>
            <span class="coach1220Status ${esc(status)}">${status==="injured"?"INJ":status==="out"?"OUT":"ACTIVE"}</span>
          </button>`;
        }).join("") || `<div class="notice">No players loaded.</div>`}
      </div>`);
  }

  function editPlayer1220(id){
    try{ closeModal?.(); }catch(e){}
    if(typeof editPlayer==="function") return editPlayer(id);
    if(typeof openPlayerModal==="function") return openPlayerModal(id);
    if(typeof openRosterSetup==="function") return openRosterSetup();
  }
  function addPlayer1220(){
    try{ closeModal?.(); }catch(e){}
    if(typeof openPlayerModal==="function") return openPlayerModal(null);
    if(typeof openRosterSetup==="function") return openRosterSetup();
  }

  /* ---------- linked full-roster substitution ---------- */
  function installSubstitution(){
    try{
      if(typeof coach1196OpenSwapPlayerModal==="function"){
        window.openReplacePlayerModal=function(positionId){
          return coach1196OpenSwapPlayerModal(positionId);
        };
      }
      if(typeof replacePlayerLinked==="function"){
        window.replacePlayerAtPosition=async function(positionId,newPlayerId){
          return replacePlayerLinked(positionId,newPlayerId);
        };
      }
    }catch(e){ console.warn("122.0 substitution install",e); }
  }

  /* ---------- clean navigation ---------- */
  function openLines1220(){
    if(typeof openLines==="function") return openLines();
    const b=document.getElementById("linesBtn"); if(b) b.click();
  }
  function openStats1220(){
    if(typeof openStats==="function") return openStats();
    const b=document.getElementById("statsBtn"); if(b) b.click();
  }
  function openPlaybook1220(){
    if(typeof openPlaybook==="function") return openPlaybook();
    const b=document.getElementById("playbookBtn"); if(b) b.click();
  }
  function openGameList1220(){
    if(typeof coach11819OpenGameList==="function") return coach11819OpenGameList();
    if(typeof openGamePlayList==="function") return openGamePlayList();
    return openPlaybook1220();
  }

  /* ---------- Special Teams: one implementation ---------- */
  const DIAGRAM={
    kickoff:{
      offense:[
        ["RE",5,24],["LE",14,24],["BC",23,24],["FC",32,24],["NG",41,24],
        ["R",50,24],["D",59,24],["FS",68,24],["RD",77,24],["W",86,24],["S",95,24]
      ],
      defense:[
        ["D",13,60],["FC",31,60],["RE",50,60],["BC",68,60],["R",86,60],
        ["S",22,72],["LE",50,72],["W",77,72],
        ["SS/RD",31,86],["NG",50,86],["FS",68,86]
      ]
    },
    punt:{
      offense:[
        ["X",8,26],["H",18,34],["LT",31,26],["LG",40,26],["C",50,26],
        ["RG",60,26],["RT",69,26],["Y",78,26],["Z",94,31],
        ["F",40,41],["P",50,47]
      ],
      defense:[
        ["D",22,62],["T",40,62],["T",61,62],["R",77,62],
        ["SS/RD",22,73],["NG",50,73],["FS",77,73],
        ["FC",5,82],["BC",95,82],["W",40,92],["S",61,92]
      ]
    }
  };

  let stMode="kickoff";
  let stMove=false;
  let stRename=false;

  function scoreUnit(unit,side){
    const l=currentLineObj(); if(!unit||!l) return -999;
    const n=String(unit.name||"").toUpperCase();
    const ln=String(l.name||"").toUpperCase();
    let s=n.includes(ln)?20:0;
    if(stMode==="kickoff"){
      if(side==="offense"){
        if(n.includes("KICKOFF")) s+=25;
        if(!n.includes("RETURN")) s+=10;
      }else{
        if(n.includes("KICK RETURN")) s+=30;
        else if(n.includes("RETURN")) s+=15;
      }
    }else{
      if(side==="offense"){
        if(n.includes("PUNT")) s+=24;
        if(!n.includes("RETURN")) s+=12;
      }else{
        if(n.includes("PUNT RETURN")) s+=30;
        else if(n.includes("RETURN")) s+=15;
      }
    }
    if(!n.includes("OFFENSE")&&!n.includes("DEFENSE")) s+=8;
    return s;
  }

  function bestUnit(side){
    const u=(Array.isArray(specialUnits)?specialUnits.slice():[])
      .sort((a,b)=>scoreUnit(b,side)-scoreUnit(a,side))[0];
    return u&&scoreUnit(u,side)>10?u:null;
  }

  function unitSlots(unit){
    if(!unit) return [];
    return (Array.isArray(specialSlots)?specialSlots:[])
      .filter(s=>String(s.unit_id)===String(unit.id))
      .slice()
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
  }

  function assignedMap(unit){
    const m=new Map();
    if(!unit) return m;
    (Array.isArray(specialAssignments)?specialAssignments:[])
      .filter(a=>String(a.unit_id)===String(unit.id))
      .forEach(a=>m.set(String(a.slot_id),
        (Array.isArray(players)?players:[]).find(p=>String(p.id)===String(a.player_id))));
    return m;
  }

  function prefKey(side,slotId,index){
    const l=currentLineObj();
    return `coach1220:st:${team?.id||"team"}:${l?.id||currentLine}:${stMode}:${side}:${slotId||index}`;
  }
  function getPref(side,slotId,index){
    try{return JSON.parse(localStorage.getItem(prefKey(side,slotId,index))||"{}");}catch(e){return{};}
  }
  function setPref(side,slotId,index,pref){
    try{localStorage.setItem(prefKey(side,slotId,index),JSON.stringify(pref||{}));}catch(e){}
  }

  function lineButtons(){
    return (Array.isArray(lines)?lines:[]).map((l,i)=>`
      <button type="button" class="coach1220LineBtn ${i===currentLine?"current":""}"
        style="border-color:${esc(l.color||"#168cff")}!important"
        onclick="coach1220SwitchLine(${i})">${esc(l.name||`LINE ${i+1}`)}</button>`).join("");
  }

  function spotHtml(side,slot,index,player){
    const model=(DIAGRAM[stMode]?.[side]||[])[index]||[`SPOT ${index+1}`,50,side==="offense"?28:72];
    const pref=getPref(side,slot?.id,index);
    // 124.4: Kickoff/Kick Return use one authoritative formation on EVERY line.
    // Old per-line slot labels (K, L1, KR1, FB-L, etc.) were overriding the
    // correct formation. Punt keeps its existing saved rename/move behavior.
    const label=stMode==="kickoff"
      ? model[0]
      : (pref.label||slot?.label||slot?.slot_key||model[0]);
    const x=stMode==="kickoff"
      ? model[1]
      : (Number.isFinite(pref.x)?pref.x:model[1]);
    const y=stMode==="kickoff"
      ? model[2]
      : (Number.isFinite(pref.y)?pref.y:model[2]);
    return `<button type="button"
      class="coach1220STSpot ${side==="defense"?"def":""} ${stMove?"move":""} ${stRename?"rename":""}"
      data-side="${side}" data-index="${index}" data-slot="${esc(slot?.id||"")}"
      style="left:${x}%;top:${y}%"
      onclick="coach1220SpotTap('${side}',${index},'${esc(slot?.id||"")}')">
      ${esc(label)}<small>${player?esc(player.name||"PLAYER"):"OPEN"}</small>
    </button>`;
  }

  function renderST(){
    const root=document.getElementById(ROOT_ID); if(!root) return;
    const l=currentLineObj();
    if(!l){
      root.innerHTML=`<div class="coach1220STEmpty">No line selected.</div>`;
      return;
    }

    const ou=bestUnit("offense"),du=bestUnit("defense");
    const os=unitSlots(ou),ds=unitSlots(du);
    const om=assignedMap(ou),dm=assignedMap(du);
    // Kickoff is exactly 11 + 11. Do not let legacy 12-slot units add the old K spot.
    const maxOff=stMode==="kickoff"
      ? DIAGRAM.kickoff.offense.length
      : Math.max(os.length,DIAGRAM[stMode].offense.length);
    const maxDef=stMode==="kickoff"
      ? DIAGRAM.kickoff.defense.length
      : Math.max(ds.length,DIAGRAM[stMode].defense.length);
    const labels=stMode==="kickoff"?["KICKOFF","KICK RETURN"]:["PUNT","PUNT RETURN"];

    root.innerHTML=`
      <div class="coach1220STTop">
        <div class="coach1220STTitle">
          <b>${esc(l.name)} — SPECIAL TEAMS</b>
          <div class="coach1220Tabs">
            <button class="${stMode==="kickoff"?"active":""}" onclick="coach1220STMode('kickoff')">KICKOFF</button>
            <button class="${stMode==="punt"?"active":""}" onclick="coach1220STMode('punt')">PUNT</button>
          </div>
          <div class="coach1220STLines">${lineButtons()}</div>
        </div>
        <div class="coach1220STActions">
          <button onclick="coach1220AutoFill()">AUTO FILL</button>
          <button class="${stMove?"active":""}" onclick="coach1220ToggleMove()">MOVE SPOTS</button>
          <button class="${stRename?"active":""}" onclick="coach1220ToggleRename()">RENAME</button>
          <button onclick="coach1220CloseST()">✕ CLOSE</button>
        </div>
      </div>
      <div class="coach1220STField">
        <div class="coach1220STLabel off">${labels[0]}</div>
        <div class="coach1220STLabel def">${labels[1]}</div>
        ${Array.from({length:maxOff},(_,i)=>spotHtml("offense",os[i],i,os[i]?om.get(String(os[i].id)):null)).join("")}
        ${Array.from({length:maxDef},(_,i)=>spotHtml("defense",ds[i],i,ds[i]?dm.get(String(ds[i].id)):null)).join("")}
      </div>
      <div class="coach1220STFoot">Special Teams assignments do not count toward Game Day participation stats.</div>`;
    bindSTDrag();
  }

  async function ensureSTData(){
    if(typeof loadSpecialTeams==="function"){
      try{ await loadSpecialTeams(); }catch(e){ console.warn("122.0 Special Teams refresh",e); }
    }
  }

  async function openST(){
    document.getElementById(ROOT_ID)?.remove();
    ["coach1205SpecialPanel","coach1207SpecialDashboard","coach1209SpecialDashboard","coach1212Special"]
      .forEach(id=>document.getElementById(id)?.remove());
    const root=document.createElement("div");
    root.id=ROOT_ID;
    document.body.appendChild(root);
    renderST();
    ensureSTData().then(renderST);
  }
  function closeST(){ document.getElementById(ROOT_ID)?.remove(); stMove=false; stRename=false; }
  function setSTMode(m){ stMode=m==="punt"?"punt":"kickoff"; stMove=false; stRename=false; renderST(); }
  function switchLine(i){
    const n=Number(i); if(!Number.isFinite(n)||!lines?.[n]) return;
    if(typeof setLine==="function"){
      try{ setLine(n); }catch(e){ currentLine=n; }
    }else currentLine=n;
    try{ const s=document.getElementById("lineSelect"); if(s) s.value=String(n); }catch(e){}
    try{ renderAll?.(); }catch(e){}
    renderST();
  }
  function toggleMove(){ stMove=!stMove; stRename=false; renderST(); }
  function toggleRename(){ stRename=!stRename; stMove=false; renderST(); }

  function slotBy(side,index,slotId){
    const u=bestUnit(side);
    const slots=unitSlots(u);
    return slots.find(s=>String(s.id)===String(slotId))||slots[index]||null;
  }

  function spotTap(side,index,slotId){
    if(stMove) return;
    const slot=slotBy(side,index,slotId);
    if(stRename){
      const model=(DIAGRAM[stMode]?.[side]||[])[index]||[`SPOT ${index+1}`];
      const pref=getPref(side,slot?.id,index);
      const old=pref.label||slot?.label||slot?.slot_key||model[0];
      const n=prompt("New spot name:",old);
      if(n&&n.trim()){
        if(stMode==="kickoff"){
          // Change the shared Kickoff/Kick Return formation label for every line.
          if(DIAGRAM.kickoff?.[side]?.[index]) DIAGRAM.kickoff[side][index][0]=n.trim();
        }else{
          setPref(side,slot?.id,index,{...pref,label:n.trim()});
        }
        renderST();
      }
      return;
    }
    openSTPlayerPicker(side,index,slot);
  }

  function openSTPlayerPicker(side,index,slot){
    if(!slot){
      alert("This diagram spot is not connected to a saved Special Teams slot yet.");
      return;
    }
    if(typeof openModal!=="function") return;
    const current=(Array.isArray(specialAssignments)?specialAssignments:[])
      .find(a=>String(a.slot_id)===String(slot.id));
    const currentId=current?String(current.player_id):"";
    const roster=activePlayers();

    openModal(`
      <div class="coach1220Head">
        <div><small>SPECIAL TEAMS</small><h2>${esc(slot.label||slot.slot_key||"Spot")}</h2></div>
        <button class="secondary" onclick="closeModal()">✕ CLOSE</button>
      </div>
      <div class="coach1220Roster">
        ${roster.map(p=>`<button type="button" class="coach1220RosterRow ${String(p.id)===currentId?"current":""}"
          onclick="coach1220AssignSpecial('${esc(slot.id)}','${esc(p.id)}')">
          <b>#${esc(p.jersey_number??"")}</b>
          <span><b>${esc(p.name||"Player")}</b><small>${String(p.id)===currentId?"CURRENT":"TAP TO ASSIGN"}</small></span>
          <span class="coach1220Status active">${String(p.id)===currentId?"CURRENT":"SELECT"}</span>
        </button>`).join("")}
      </div>`);
  }

  async function assignSpecial(slotId,playerId){
    try{
      if(typeof assignSpecialPlayer==="function"){
        await assignSpecialPlayer(slotId,playerId);
      }else if(typeof sb!=="undefined"){
        const slot=(Array.isArray(specialSlots)?specialSlots:[]).find(s=>String(s.id)===String(slotId));
        if(!slot) return;
        await sb.from("special_team_assignments").upsert(
          {unit_id:slot.unit_id,slot_id:slot.id,player_id:playerId},
          {onConflict:"unit_id,slot_id"}
        );
      }
      try{ closeModal?.(); }catch(e){}
      await ensureSTData();
      renderST();
    }catch(e){ console.error(e); alert("That Special Teams assignment could not be saved."); }
  }

  function linePool(side){
    const l=currentLineObj(); if(!l) return [];
    const ids=new Set((Array.isArray(positions)?positions:[]).filter(p=>p.side===side).map(p=>String(p.id)));
    const arr=(Array.isArray(assignments)?assignments:[])
      .filter(a=>String(a.line_id)===String(l.id)&&ids.has(String(a.position_label_id)));
    const out=[],seen=new Set();
    arr.forEach(a=>{
      const p=(Array.isArray(players)?players:[]).find(x=>String(x.id)===String(a.player_id));
      if(p&&!seen.has(String(p.id))){seen.add(String(p.id));out.push(p);}
    });
    if(out.length<11){
      (Array.isArray(assignments)?assignments:[])
        .filter(a=>String(a.line_id)===String(l.id))
        .forEach(a=>{
          const p=(Array.isArray(players)?players:[]).find(x=>String(x.id)===String(a.player_id));
          if(p&&!seen.has(String(p.id))){seen.add(String(p.id));out.push(p);}
        });
    }
    return out.filter(p=>String(p.availability_status||"active").toLowerCase()!=="out");
  }

  async function fillUnit(unit,side){
    if(!unit||typeof sb==="undefined") return;
    const slots=unitSlots(unit),pool=linePool(side);
    try{
      await sb.from("special_team_assignments").delete().eq("unit_id",unit.id);
      for(let i=0;i<slots.length&&i<pool.length;i++){
        await sb.from("special_team_assignments").upsert(
          {unit_id:unit.id,slot_id:slots[i].id,player_id:pool[i].id},
          {onConflict:"unit_id,slot_id"}
        );
      }
    }catch(e){ console.warn("122.0 auto fill",e); }
  }

  async function autoFill(){
    const ou=bestUnit("offense"),du=bestUnit("defense");
    if(!ou||!du){
      alert("Saved Special Teams units were not found for this line.");
      return;
    }
    await fillUnit(ou,"offense");
    await fillUnit(du,"defense");
    await ensureSTData();
    renderST();
  }

  function bindSTDrag(){
    if(!stMove) return;
    document.querySelectorAll(`#${ROOT_ID} .coach1220STSpot`).forEach(el=>{
      const field=el.closest(".coach1220STField"); if(!field) return;
      let dragging=false;
      const move=e=>{
        if(!dragging) return;
        const r=field.getBoundingClientRect(),t=e.touches?.[0]||e;
        const x=Math.max(3,Math.min(97,(t.clientX-r.left)/r.width*100));
        const y=Math.max(5,Math.min(95,(t.clientY-r.top)/r.height*100));
        el.style.left=x+"%";el.style.top=y+"%";el.dataset.x=x;el.dataset.y=y;
        e.preventDefault();
      };
      const end=()=>{
        if(!dragging) return; dragging=false;
        document.removeEventListener("mousemove",move,true);
        document.removeEventListener("mouseup",end,true);
        document.removeEventListener("touchmove",move,true);
        document.removeEventListener("touchend",end,true);
        const side=el.dataset.side,index=Number(el.dataset.index),slotId=el.dataset.slot||"";
        const x=Number(el.dataset.x),y=Number(el.dataset.y);
        if(Number.isFinite(x)&&Number.isFinite(y)){
          const pref=getPref(side,slotId,index);
          setPref(side,slotId,index,{...pref,x,y});
        }
      };
      const start=e=>{
        dragging=true;
        document.addEventListener("mousemove",move,true);
        document.addEventListener("mouseup",end,true);
        document.addEventListener("touchmove",move,{capture:true,passive:false});
        document.addEventListener("touchend",end,true);
        e.preventDefault();e.stopPropagation();
      };
      el.addEventListener("mousedown",start,{capture:true,once:false});
      el.addEventListener("touchstart",start,{capture:true,passive:false});
    });
  }

  /* ---------- toolbar cleanup ---------- */
  function rebuildBar(){
    const bar=document.getElementById("coach1200DashboardBar");
    if(!bar) return;
    const lineButtons=(Array.isArray(lines)?lines:[]).map((l,i)=>`
      <button type="button" class="coach1200LineBtn ${i===currentLine?"live":""}"
        style="border-color:${esc(l.color||"#1593ff")}!important"
        onclick="coach1200SelectLine(${i})">${esc(l.name||`LINE ${i+1}`)}
        <small>${i===currentLine?"CURRENT":"SELECT"}</small></button>`).join("");
    bar.innerHTML=`
      <div class="coach1200Tools">
        <button type="button" onclick="coach1220OpenPlayers()">PLAYERS</button>
        <button type="button" onclick="coach1220OpenLines()">LINES</button>
      </div>
      <div class="coach1200Lines">${lineButtons}</div>
      <div class="coach1200Tools">
        <button type="button" class="coach1204MoveBtn" onclick="coach1204ToggleMoveMode()">MOVE PLAYERS</button>
        <button type="button" onclick="coach1220OpenStats()">STATS</button>
        <button type="button" onclick="coach1220OpenPlaybook()">PLAYBOOK</button>
        <button type="button" onclick="coach1220OpenST()">SPECIAL TEAMS</button>
      </div>`;
  }

  function hideUnusedStatus(){
    ["gameStrip","quarterDisplay","clockDisplay","clockToggleBtn","possessionDisplay",
     "opponentBtn","driveDisplay","downDisplay","distanceDisplay"].forEach(id=>{
      const el=document.getElementById(id); if(!el) return;
      el.style.setProperty("display","none","important");
      el.style.setProperty("pointer-events","none","important");
    });
  }

  function wireNativeSpecialButton(){
    const old=document.getElementById("specialTab");
    if(!old||old.dataset.coach1220==="1") return;
    const n=old.cloneNode(true);
    n.dataset.coach1220="1";
    n.removeAttribute("onclick");
    n.onclick=e=>{ e?.preventDefault?.(); openST(); };
    old.replaceWith(n);
  }

  function stabilize(){
    installSubstitution();
    hideUnusedStatus();
    rebuildBar();
    wireNativeSpecialButton();

    const badge=document.getElementById("coachUpdateBadge");
    if(badge) badge.textContent="UPDATE "+VERSION;

    const exit=[...document.querySelectorAll(".fullscreenControls button")]
      .find(b=>/EXIT FULL SCREEN|MAIN DASHBOARD/i.test(String(b.textContent||"")));
    if(exit){
      exit.textContent="⌂ MAIN DASHBOARD";
    }
  }

  /* 122.1: removed the 122.0 document-wide MutationObserver.
     It could retrigger itself when the toolbar was rebuilt and interfere
     with the native Resume Game transition on iPad Safari. */

  /* ---------- public functions ---------- */
  window.coach1220OpenPlayers=openPlayers;
  window.coach1220EditPlayer=editPlayer1220;
  window.coach1220AddPlayer=addPlayer1220;
  window.coach1220OpenLines=openLines1220;
  window.coach1220OpenStats=openStats1220;
  window.coach1220OpenPlaybook=openPlaybook1220;
  window.coach1220OpenGameList=openGameList1220;
  window.coach1220OpenST=openST;
  window.coach1220CloseST=closeST;
  window.coach1220STMode=setSTMode;
  window.coach1220SwitchLine=switchLine;
  window.coach1220ToggleMove=toggleMove;
  window.coach1220ToggleRename=toggleRename;
  window.coach1220SpotTap=spotTap;
  window.coach1220AssignSpecial=assignSpecial;
  window.coach1220AutoFill=autoFill;

  /* Make every existing dashboard entry use the clean versions. */
  window.coach1200OpenPlayers=openPlayers;
  window.coach1200OpenStats=openStats1220;
  window.coach1200OpenPlaybook=openPlaybook1220;
  window.coach1201OpenSpecialTeams=openST;

  /* ---------- styles ---------- */
  const style=document.createElement("style");
  style.id="coach1220Styles";
  style.textContent=`
    .coach1220Head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}
    .coach1220Head h2{margin:0}.coach1220Head small{font-weight:900;color:#7dc4ff}
    .coach1220HeadBtns{display:flex;gap:7px}
    .coach1220Roster{display:grid;gap:6px;max-height:68vh;overflow:auto}
    .coach1220RosterRow{display:grid;grid-template-columns:52px minmax(0,1fr) 78px;gap:8px;align-items:center;
      width:100%;text-align:left;padding:8px;border:1px solid #314965;border-radius:7px;background:#07111d;color:#fff}
    .coach1220RosterRow>span{display:grid}.coach1220RosterRow small{color:#9fb3c7;font-size:9px}
    .coach1220RosterRow.current{box-shadow:0 0 0 2px #fff inset}
    .coach1220Status{justify-self:end;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:1000;background:#166534}
    .coach1220Status.injured{background:#9a6700}.coach1220Status.out{background:#8b1e24}

    #${ROOT_ID}{position:fixed;inset:0;z-index:2147483000;background:#030912;color:#fff;padding:8px;display:grid;
      grid-template-rows:auto minmax(0,1fr) auto;gap:7px}
    .coach1220STTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;background:#07182a;
      border:1px solid #31557c;border-radius:8px;padding:7px}
    .coach1220STTitle b{font-size:12px}.coach1220Tabs,.coach1220STLines,.coach1220STActions{display:flex;gap:5px;flex-wrap:wrap}
    .coach1220Tabs{margin-top:5px}.coach1220STLines{margin-top:5px}
    #${ROOT_ID} button{min-height:31px;border:1px solid #6aa9df;border-radius:6px;background:#0a4f89;color:#fff;
      padding:4px 8px;font-size:8px;font-weight:1000;touch-action:manipulation}
    #${ROOT_ID} button.active{background:#8a5a00;border-color:#ffd34e}
    .coach1220LineBtn.current{box-shadow:0 0 0 2px #fff inset}
    .coach1220STField{position:relative;overflow:hidden;border:3px solid #e9f2e5;border-radius:8px;background:
      linear-gradient(to bottom,rgba(255,255,255,.2) 1px,transparent 1px) 0 0/100% 10%,
      linear-gradient(90deg,transparent 49.8%,rgba(255,255,255,.25) 49.8% 50.2%,transparent 50.2%),
      #168f39}
    .coach1220STField:before{content:"";position:absolute;left:0;right:0;top:50%;height:4px;background:#fff;opacity:.85}
    .coach1220STLabel{position:absolute;left:50%;transform:translateX(-50%);z-index:3;padding:3px 10px;border-radius:5px;
      font-size:9px;font-weight:1000}
    .coach1220STLabel.off{top:5px;background:#b42d29}.coach1220STLabel.def{top:calc(50% + 5px);background:#1768c8}
    .coach1220STSpot{position:absolute;transform:translate(-50%,-50%);z-index:5;min-width:64px;min-height:43px;
      border:2px solid #ec3b33!important;background:#07111de8!important;padding:4px 5px!important}
    .coach1220STSpot.def{border-color:#1698ff!important}.coach1220STSpot small{display:block;color:#d0e2ee;font-size:7px;margin-top:2px}
    .coach1220STSpot.move{box-shadow:0 0 0 3px #ffd34e}.coach1220STSpot.rename{box-shadow:0 0 0 3px #c084fc}
    .coach1220STFoot{text-align:center;font-size:8px;font-weight:900;color:#9fb3c7}
    @media (orientation:landscape) and (max-height:700px){
      #${ROOT_ID}{padding:5px;gap:4px}.coach1220STTop{padding:5px}.coach1220STSpot{min-width:58px;min-height:38px}
    }
  `;
  document.head.appendChild(style);

  setTimeout(stabilize,50);
  setTimeout(stabilize,400);
})();


/* =========================================================
   122.1 — RESUME GAME / GAME DAY ENTRY FIX
   Keep native dashboard transition intact, then open the already-stable
   120.4 live-field dashboard after the app becomes visible.
   No document-wide click interception.
   ========================================================= */
(function(){
  "use strict";

  function appIsReady(){
    const app=document.getElementById("app");
    return !!(app && !app.classList.contains("hidden"));
  }

  function openLiveFieldWhenReady(){
    let tries=0;
    const attempt=()=>{
      tries++;
      if(appIsReady() && typeof coach1200OpenGameDashboard==="function"){
        try{
          coach1200OpenGameDashboard();
          return;
        }catch(e){
          console.warn("122.1 Game Day open retry",e);
        }
      }
      if(tries<8) setTimeout(attempt,80);
    };
    setTimeout(attempt,20);
  }

  function bindOne(el){
    if(!el || el.dataset.coach1221Resume==="1") return;
    el.dataset.coach1221Resume="1";

    // Let the app's original click handler run first. We only follow it.
    el.addEventListener("click",function(){
      openLiveFieldWhenReady();
    },false);
  }

  function bindResumeButtons(){
    ["gameDayCard","fivePanelBtn"].forEach(id=>bindOne(document.getElementById(id)));

    // Covers buttons whose text is RESUME GAME even if the native id changes.
    document.querySelectorAll("button,a").forEach(el=>{
      const t=String(el.textContent||"").trim().toUpperCase();
      if(t==="RESUME GAME" || t==="GAME DAY" || t==="OPEN GAME DAY"){
        bindOne(el);
      }
    });
  }

  // Small bounded binder: it never rebuilds DOM and stops after startup.
  let passes=0;
  const timer=setInterval(()=>{
    bindResumeButtons();
    passes++;
    if(passes>=20) clearInterval(timer);
  },250);

  bindResumeButtons();

  // If native rendering recreates the dashboard later, re-bind only when
  // returning to the main dashboard.
  window.coach1221BindResumeButtons=bindResumeButtons;

  // Keep toolbar clean without observing the whole document.
  setTimeout(()=>{
    try{
      if(typeof hideUnusedStatus==="function") hideUnusedStatus();
    }catch(e){}
  },500);
})();


/* =========================================================
   122.3 — SPECIAL TEAMS MANUAL PLAYER CHANGE
   Match Game Day offense/defense substitution rules:
   - tap a Special Teams player/spot to change it
   - show the full active roster
   - show current player and recommended/position-fit information
   - allow a player already used on the SAME Special Teams unit by swapping
     the two assignments rather than rejecting the selection
   - preserve each line/unit assignment
   - never record Special Teams participation in Game Day stats
   ========================================================= */
(function(){
  "use strict";

  function esc(v){
    return String(v??"").replace(/[&<>"']/g,c=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function getSlot(slotId){
    return (Array.isArray(specialSlots)?specialSlots:[])
      .find(s=>String(s.id)===String(slotId))||null;
  }

  function getAssignment(slotId){
    return (Array.isArray(specialAssignments)?specialAssignments:[])
      .find(a=>String(a.slot_id)===String(slotId))||null;
  }

  function getPlayer(id){
    return (Array.isArray(players)?players:[])
      .find(p=>String(p.id)===String(id))||null;
  }

  function availableRoster(){
    // 124.6: Special Teams may choose ANY rostered player.
    // A player on Kickoff remains available for Punt because those are separate units.
    return (Array.isArray(players)?players:[])
      .slice()
      .sort((a,b)=>{
        const an=Number(a.jersey_number),bn=Number(b.jersey_number);
        if(Number.isFinite(an)&&Number.isFinite(bn)&&an!==bn) return an-bn;
        return String(a.name||"").localeCompare(String(b.name||""));
      });
  }

  function sideForSlot(slot){
    if(!slot) return "offense";
    const unit=(Array.isArray(specialUnits)?specialUnits:[])
      .find(u=>String(u.id)===String(slot.unit_id));
    const n=String(unit?.name||"").toUpperCase();
    if(n.includes("RETURN")||n.includes("BLOCK")||n.includes("DEFENSE")) return "defense";
    return "offense";
  }

  function desiredPosition(slot){
    return String(slot?.label||slot?.slot_key||"").trim();
  }

  function fitScore(player,slot){
    const wanted=desiredPosition(slot);
    if(!wanted) return 0;
    try{
      if(typeof playerPositionMatchScore==="function"){
        const side=sideForSlot(slot);
        const result=playerPositionMatchScore(player,wanted,side);
        if(Number.isFinite(Number(result))) return Number(result);
      }
    }catch(e){}
    const side=sideForSlot(slot);
    const saved=side==="defense"?player?.defense_positions:player?.offense_positions;
    if(Array.isArray(saved)&&saved.some(x=>String(x).toUpperCase()===wanted.toUpperCase())) return 100;
    return 0;
  }

  function fitLabel(score){
    if(score>=80) return "BEST FIT";
    if(score>0) return "POSITION FIT";
    return "AVAILABLE";
  }

  function unitAssignmentForPlayer(unitId,playerId){
    return (Array.isArray(specialAssignments)?specialAssignments:[])
      .find(a=>String(a.unit_id)===String(unitId)&&String(a.player_id)===String(playerId))||null;
  }

  function openPicker(slotId){
    const slot=getSlot(slotId);
    if(!slot || typeof openModal!=="function") return;

    const currentA=getAssignment(slot.id);
    const currentP=currentA?getPlayer(currentA.player_id):null;
    const roster=availableRoster().map(p=>({
      p,
      score:fitScore(p,slot),
      used:unitAssignmentForPlayer(slot.unit_id,p.id)
    })).sort((a,b)=>{
      if(String(a.p.id)===String(currentP?.id)) return -1;
      if(String(b.p.id)===String(currentP?.id)) return 1;
      if(b.score!==a.score) return b.score-a.score;
      return Number(a.p.jersey_number||999)-Number(b.p.jersey_number||999);
    });

    const recommended=roster.find(x=>!x.used && String(x.p.id)!==String(currentP?.id)) || roster[0];

    openModal(`
      <div class="coach1223Head">
        <div>
          <small>SPECIAL TEAMS • ${esc(sideForSlot(slot).toUpperCase())}</small>
          <h2>Change ${esc(desiredPosition(slot)||"Player")}</h2>
          <div class="coach1223Current">
            CURRENT: ${currentP?`#${esc(currentP.jersey_number??"")} ${esc(currentP.name||"Player")}`:"OPEN"}
          </div>
          ${recommended?`<div class="coach1223Recommend">
            RECOMMENDED: #${esc(recommended.p.jersey_number??"")} ${esc(recommended.p.name||"Player")}
          </div>`:""}
        </div>
        <button class="secondary" onclick="closeModal()">✕ CLOSE</button>
      </div>

      <div class="coach1223TableHead">
        <span>PLAYER</span><span>POSITION FIT</span><span>STATUS</span>
      </div>

      <div class="coach1223Roster">
        ${roster.map(x=>{
          const p=x.p;
          const isCurrent=String(p.id)===String(currentP?.id);
          const usedElsewhere=x.used && String(x.used.slot_id)!==String(slot.id);
          const availability=String(p.availability_status||"active").toLowerCase();
          const mismatch=x.score<=0;
          return `<button type="button"
            class="coach1223Row ${isCurrent?"current":""} ${mismatch?"mismatch":""} ${availability!=="active"?"notactive":""}"
            onclick="coach1223Select('${esc(slot.id)}','${esc(p.id)}')">
            <span><b>#${esc(p.jersey_number??"")} ${esc(p.name||"Player")}</b>
              <small>${isCurrent?"CURRENT PLAYER":usedElsewhere?"ALREADY ON THIS UNIT — WILL SWAP":"TAP TO SELECT"}</small>
            </span>
            <b>${mismatch?"⚠ NO POSITION MATCH":esc(fitLabel(x.score))}</b>
            <b>${isCurrent?"CURRENT":usedElsewhere?"SWAP":"SELECT"}</b>
          </button>`;
        }).join("")}
      </div>
      <div class="coach1223Note">
        Any rostered player can be selected. A player may be on Kickoff and Punt.
        Players already on THIS unit will swap spots. ⚠ marks a position mismatch.
        Special Teams does not count toward participation stats.
      </div>
    `);
  }

  async function directUpsert(unitId,slotId,playerId){
    if(typeof sb==="undefined") throw new Error("Database unavailable");
    const {error}=await sb.from("special_team_assignments").upsert(
      {unit_id:unitId,slot_id:slotId,player_id:playerId},
      {onConflict:"unit_id,slot_id"}
    );
    if(error) throw error;
  }

  async function selectPlayer(slotId,newPlayerId){
    const slot=getSlot(slotId);
    if(!slot) return;

    const oldA=getAssignment(slot.id);
    const oldPlayerId=oldA?.player_id||null;
    if(String(oldPlayerId||"")===String(newPlayerId)) {
      try{ closeModal?.(); }catch(e){}
      return;
    }

    const otherA=unitAssignmentForPlayer(slot.unit_id,newPlayerId);

    try{
      // If the selected player is already on this unit, perform a true swap.
      if(otherA && String(otherA.slot_id)!==String(slot.id)){
        if(!oldPlayerId){
          // Move selected player into an open spot and clear the old spot.
          if(typeof sb==="undefined") throw new Error("Database unavailable");
          await sb.from("special_team_assignments").delete()
            .eq("unit_id",slot.unit_id).eq("slot_id",otherA.slot_id);
          await directUpsert(slot.unit_id,slot.id,newPlayerId);
        }else{
          // Two-step swap using a temporary delete avoids same-unit duplicate constraint.
          if(typeof sb==="undefined") throw new Error("Database unavailable");
          const {error:delErr}=await sb.from("special_team_assignments").delete()
            .eq("unit_id",slot.unit_id).eq("slot_id",otherA.slot_id);
          if(delErr) throw delErr;
          await directUpsert(slot.unit_id,slot.id,newPlayerId);
          await directUpsert(slot.unit_id,otherA.slot_id,oldPlayerId);
        }
      }else{
        // 124.6: normal replacement is scoped ONLY to this Special Teams unit.
        // Do not use native assignSpecialPlayer here: its duplicate check can see
        // the same player on Kickoff and incorrectly block selecting him for Punt.
        await directUpsert(slot.unit_id,slot.id,newPlayerId);
      }

      // Refresh assignments only. No Game Day play/stat recording is called.
      if(typeof loadSpecialTeams==="function"){
        try{ await loadSpecialTeams(); }catch(e){}
      }
      try{ closeModal?.(); }catch(e){}
      if(typeof coach1220OpenST==="function"){
        // If the Special Teams page remains mounted, redraw it instead of reopening.
        const root=document.getElementById("coach1220Special");
        if(root && typeof coach1220STMode==="function"){
          const active=[...root.querySelectorAll(".coach1220Tabs button")]
            .find(b=>b.classList.contains("active"));
          coach1220STMode(active&&/PUNT/i.test(active.textContent)?"punt":"kickoff");
        }
      }
    }catch(e){
      console.error("122.3 manual Special Teams change",e);
      alert("That player change could not be saved. Please try again.");
    }
  }

  /* Replace only the 122.0/122.2 Special Teams picker path. */
  window.coach1220AssignSpecial=selectPlayer;
  window.coach1223Select=selectPlayer;
  window.coach1223OpenPicker=openPicker;

  // The existing spot handler calls openSTPlayerPicker. Override it with
  // the Game-Day-style manual picker while preserving Move/Rename behavior.
  try{
    window.openSTPlayerPicker=function(side,index,slot){
      if(slot) openPicker(slot.id);
    };
  }catch(e){}

  // Directly bind rendered spots after each Special Teams render so the
  // manual picker wins without adding a document-level click interceptor.
  function bindSpots(){
    document.querySelectorAll("#coach1220Special .coach1220STSpot").forEach(el=>{
      if(el.dataset.coach1223==="1") return;
      el.dataset.coach1223="1";
      el.addEventListener("click",function(e){
        const root=document.getElementById("coach1220Special");
        if(!root) return;
        const move=root.querySelector(".coach1220STActions button.active");
        // Let MOVE/RENAME continue to use the existing 122.2 handlers.
        if(move && /MOVE SPOTS|RENAME/i.test(String(move.textContent||""))) return;
        const slotId=el.dataset.slot;
        if(slotId){
          e.preventDefault();
          e.stopImmediatePropagation();
          openPicker(slotId);
        }
      },true);
    });
  }

  let passes=0;
  const timer=setInterval(()=>{
    bindSpots();
    passes++;
    if(passes>240) clearInterval(timer);
  },250);

  const style=document.createElement("style");
  style.textContent=`
    .coach1223Head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:9px}
    .coach1223Head h2{margin:1px 0 4px}.coach1223Head small{color:#7dc4ff;font-weight:1000}
    .coach1223Current,.coach1223Recommend{font-size:9px;font-weight:900;margin-top:3px}
    .coach1223Recommend{color:#8ed0ff}
    .coach1223TableHead,.coach1223Row{display:grid;grid-template-columns:minmax(0,1fr) 100px 76px;gap:8px;align-items:center}
    .coach1223TableHead{padding:4px 8px;color:#91a9bf;font-size:8px;font-weight:1000}
    .coach1223Roster{display:grid;gap:5px;max-height:60vh;overflow:auto}
    .coach1223Row{width:100%;text-align:left;padding:8px;border:1px solid #314965;border-radius:7px;background:#07111d;color:#fff}
    .coach1223Row span{display:grid}.coach1223Row small{font-size:7px;color:#9fb3c7}
    .coach1223Row.current{box-shadow:0 0 0 2px #fff inset}
    .coach1223Row.mismatch{border-color:#f5b942!important;background:rgba(245,185,66,.12)!important}
    .coach1223Row.mismatch>span small{color:#ffd36a!important}
    .coach1223Row.notactive{opacity:.72}
    .coach1223Note{margin-top:8px;padding:7px;border-radius:6px;background:#0a1a29;color:#a9bfd2;font-size:8px;font-weight:800}
  `;
  document.head.appendChild(style);
})();


/* =========================================================
   122.4 — SPECIAL TEAMS TAP FIX
   Fix only the manual-player tap path.
   The 122.2/122.3 field, Auto Fill, line switching, Move/Rename,
   and no-Special-Teams-stats behavior are left unchanged.
   ========================================================= */
(function(){
  "use strict";

  function getSlot(slotId){
    return (Array.isArray(specialSlots)?specialSlots:[])
      .find(s=>String(s.id)===String(slotId))||null;
  }

  function openManual(slotId){
    if(!slotId) return;
    const slot=getSlot(slotId);
    if(!slot) return;
    if(typeof coach1223OpenPicker==="function"){
      coach1223OpenPicker(slot.id);
    }
  }

  function bindSpot(el){
    if(!el || el.dataset.coach1224Tap==="1") return;
    el.dataset.coach1224Tap="1";

    // Pointer/touch path for iPad Safari.
    const fire=function(e){
      const root=document.getElementById("coach1220Special");
      if(!root) return;

      // Preserve the existing Move and Rename modes.
      const active=[...root.querySelectorAll(".coach1220STActions button.active")]
        .map(b=>String(b.textContent||"").toUpperCase()).join(" ");
      if(active.includes("MOVE SPOTS") || active.includes("RENAME")) return;

      const slotId=el.dataset.slot;
      if(!slotId) return;

      e.preventDefault();
      e.stopPropagation();
      if(typeof e.stopImmediatePropagation==="function") e.stopImmediatePropagation();
      openManual(slotId);
    };

    // pointerup is the most reliable route on current iPad Safari.
    el.addEventListener("pointerup",fire,true);

    // Fallback for browsers/devices where pointer events are unavailable.
    if(!window.PointerEvent){
      el.addEventListener("touchend",fire,{capture:true,passive:false});
      el.addEventListener("click",fire,true);
    }
  }

  function bindAll(){
    document.querySelectorAll("#coach1220Special .coach1220STSpot").forEach(bindSpot);
  }

  // Patch the renderer itself so every freshly-rendered Special Teams field
  // gets its tap handlers immediately after rendering.
  if(typeof renderST==="function" && !window.__coach1224RenderWrapped){
    const originalRenderST=renderST;
    try{
      renderST=function(){
        const result=originalRenderST.apply(this,arguments);
        setTimeout(bindAll,0);
        return result;
      };
      window.__coach1224RenderWrapped=true;
    }catch(e){}
  }

  // Also wrap the public Special Teams opener/mode/line functions because
  // those functions can redraw the field without exposing renderST globally.
  ["coach1220OpenST","coach1220STMode","coach1220SwitchLine"].forEach(name=>{
    const fn=window[name];
    if(typeof fn!=="function" || fn.__coach1224Wrapped) return;
    const wrapped=function(){
      const result=fn.apply(this,arguments);
      setTimeout(bindAll,20);
      setTimeout(bindAll,250);
      return result;
    };
    wrapped.__coach1224Wrapped=true;
    window[name]=wrapped;
  });

  // Bounded startup/re-render binder. It never intercepts document clicks
  // and never rebuilds the Special Teams DOM.
  let count=0;
  const timer=setInterval(()=>{
    bindAll();
    count++;
    if(count>=120) clearInterval(timer);
  },250);

  bindAll();
})();

/* =========================================================
   122.5 — SPECIAL TEAMS MODAL LAYER FIX
   Keep the replacement picker visually inside/above Special Teams.
   No assignment/stat logic changes.
   ========================================================= */
(function(){
  "use strict";

  function liftModal(){
    const st=document.getElementById("coach1220Special");
    if(!st) return;

    // Native modal implementations in this app use a modal/backdrop pair.
    // Rather than moving nodes (which can break close/save handlers), place
    // those layers above the fixed Special Teams screen.
    const selectors=[
      ".modalBackdrop",".modal-backdrop","#modalBackdrop",
      ".modalOverlay",".modal-overlay","#modalOverlay",
      ".modal",".modalShell",".modal-shell","#modal"
    ];
    selectors.forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        if(el.closest("#coach1220Special")) return;
        el.classList.add("coach1225AboveSpecial");
      });
    });
  }

  // Wrap the working 122.3 picker. Assignment behavior remains untouched.
  if(typeof coach1223OpenPicker==="function" && !window.__coach1225PickerWrapped){
    const old=coach1223OpenPicker;
    window.coach1223OpenPicker=function(){
      const r=old.apply(this,arguments);
      setTimeout(liftModal,0);
      setTimeout(liftModal,30);
      return r;
    };
    window.__coach1225PickerWrapped=true;
  }

  // 122.4's tap path calls coach1223OpenPicker dynamically, so the wrapper
  // above is enough. This bounded fallback catches a native modal rendered
  // one frame later on iPad.
  let n=0;
  const t=setInterval(()=>{
    if(document.getElementById("coach1220Special")) liftModal();
    if(++n>=80) clearInterval(t);
  },100);

  const style=document.createElement("style");
  style.id="coach1225ModalLayer";
  style.textContent=`
    .coach1225AboveSpecial{
      z-index:2147483600!important;
    }
    .modalBackdrop.coach1225AboveSpecial,
    .modal-backdrop.coach1225AboveSpecial,
    #modalBackdrop.coach1225AboveSpecial,
    .modalOverlay.coach1225AboveSpecial,
    .modal-overlay.coach1225AboveSpecial,
    #modalOverlay.coach1225AboveSpecial{
      position:fixed!important;
      inset:0!important;
      z-index:2147483500!important;
    }
    .modal.coach1225AboveSpecial,
    .modalShell.coach1225AboveSpecial,
    .modal-shell.coach1225AboveSpecial,
    #modal.coach1225AboveSpecial{
      position:fixed!important;
      z-index:2147483600!important;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   122.6 — SPECIAL TEAMS RENAME FIX
   Rename mode gets priority over the 122.4 manual-player tap binding.
   Everything else stays unchanged.
   ========================================================= */
(function(){
  "use strict";

  function root(){ return document.getElementById("coach1220Special"); }

  function renameIsActive(){
    const r=root(); if(!r) return false;
    return [...r.querySelectorAll(".coach1220STActions button.active")]
      .some(b=>/RENAME/i.test(String(b.textContent||"")));
  }

  function renameSpot(el){
    if(!el) return;
    const side=el.dataset.side||"offense";
    const index=Number(el.dataset.index||0);
    const slotId=el.dataset.slot||"";

    // Use the same persisted preference key/schema as the 122.0 renderer.
    try{
      const l=(Array.isArray(lines)?lines[currentLine]:null);
      const modeBtn=[...(root()?.querySelectorAll(".coach1220Tabs button")||[])]
        .find(b=>b.classList.contains("active"));
      const mode=modeBtn&&/PUNT/i.test(String(modeBtn.textContent||""))?"punt":"kickoff";
      const key=`coach1220:st:${team?.id||"team"}:${l?.id||currentLine}:${mode}:${side}:${slotId||index}`;

      let pref={};
      try{ pref=JSON.parse(localStorage.getItem(key)||"{}"); }catch(e){}

      // Read the displayed label only, excluding the player name in <small>.
      let current="";
      for(const node of el.childNodes){
        if(node.nodeType===Node.TEXT_NODE && String(node.textContent||"").trim()){
          current=String(node.textContent||"").trim();
          break;
        }
      }
      if(!current) current="POSITION";

      const next=prompt("New position name:",current);
      if(!next || !next.trim()) return;

      pref={...pref,label:next.trim()};
      localStorage.setItem(key,JSON.stringify(pref));

      // Update immediately so Rename works even before a full field redraw.
      for(const node of el.childNodes){
        if(node.nodeType===Node.TEXT_NODE && String(node.textContent||"").trim()){
          node.textContent=next.trim();
          break;
        }
      }

      // Exit Rename mode after one successful rename, matching a quick
      // sideline workflow and preventing the next tap from renaming by accident.
      if(typeof coach1220ToggleRename==="function"){
        try{ coach1220ToggleRename(); }catch(e){}
      }
    }catch(e){
      console.error("122.6 rename",e);
      alert("That position name could not be changed.");
    }
  }

  function bind(el){
    if(!el || el.dataset.coach1226Rename==="1") return;
    el.dataset.coach1226Rename="1";

    // Capture before 122.4's manual-player pointerup handler. When Rename is
    // active this owns the tap; otherwise it does nothing and player change works.
    el.addEventListener("pointerup",function(e){
      if(!renameIsActive()) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      renameSpot(el);
    },true);

    if(!window.PointerEvent){
      el.addEventListener("touchend",function(e){
        if(!renameIsActive()) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.();
        renameSpot(el);
      },{capture:true,passive:false});
    }
  }

  function bindAll(){
    document.querySelectorAll("#coach1220Special .coach1220STSpot").forEach(bind);
  }

  // Bind existing and newly rendered Special Teams spots without changing DOM.
  let count=0;
  const timer=setInterval(()=>{
    bindAll();
    if(++count>=240) clearInterval(timer);
  },250);
  bindAll();
})();

/* =========================================================
   122.7 — PUNT LAYOUT SYNC
   Copies the CURRENT line's saved Punt spot names + coordinates to
   the other three lines. Player assignments are NOT copied.
   This runs on the user's device, so it uses the exact renames/moves
   already saved in localStorage by 122.6.
   ========================================================= */
(function(){
  "use strict";

  function currentMode(){
    const root=document.getElementById("coach1220Special");
    const active=root && [...root.querySelectorAll(".coach1220Tabs button")]
      .find(b=>b.classList.contains("active"));
    return active && /PUNT/i.test(String(active.textContent||"")) ? "punt" : "kickoff";
  }

  function syncPuntFromCurrent(){
    if(currentMode()!=="punt") return;
    const allLines=Array.isArray(lines)?lines:[];
    const source=allLines[currentLine];
    if(!source || allLines.length<2) return;

    const teamId=team?.id||"team";
    const sides=["offense","defense"];
    let copied=0;

    for(const side of sides){
      // Punt diagram currently has 11 spots per side. Read both slot-id and
      // index-key variants so renamed/moved spots survive regardless of how
      // the saved unit was originally created.
      const unit=(Array.isArray(specialUnits)?specialUnits:[])
        .filter(u=>{
          const n=String(u.name||"").toUpperCase();
          if(!n.includes("PUNT")) return false;
          if(side==="defense") return n.includes("RETURN")||n.includes("DEFENSE");
          return !n.includes("RETURN")&&!n.includes("DEFENSE");
        })[0]||null;

      const slots=(Array.isArray(specialSlots)?specialSlots:[])
        .filter(sl=>unit && String(sl.unit_id)===String(unit.id))
        .slice()
        .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));

      for(let i=0;i<11;i++){
        const sourceSlotId=slots[i]?.id||i;
        const sourceKey=`coach1220:st:${teamId}:${source.id}:${"punt"}:${side}:${sourceSlotId}`;
        const sourceIndexKey=`coach1220:st:${teamId}:${source.id}:${"punt"}:${side}:${i}`;

        let raw=localStorage.getItem(sourceKey);
        if(!raw) raw=localStorage.getItem(sourceIndexKey);
        if(!raw) continue;

        let pref;
        try{ pref=JSON.parse(raw); }catch(e){ continue; }
        if(!pref || (!pref.label && !Number.isFinite(pref.x) && !Number.isFinite(pref.y))) continue;

        allLines.forEach((ln,li)=>{
          if(li===currentLine) return;
          const targetSlotId=slots[i]?.id||i;
          const targetKey=`coach1220:st:${teamId}:${ln.id}:${"punt"}:${side}:${targetSlotId}`;
          const targetIndexKey=`coach1220:st:${teamId}:${ln.id}:${"punt"}:${side}:${i}`;
          localStorage.setItem(targetKey,JSON.stringify(pref));
          localStorage.setItem(targetIndexKey,JSON.stringify(pref));
          copied++;
        });
      }
    }

    // Redraw current view; other lines will use the copied layout when selected.
    try{
      if(typeof coach1220STMode==="function") coach1220STMode("punt");
    }catch(e){}

    return copied;
  }

  function addSyncButton(){
    const root=document.getElementById("coach1220Special");
    if(!root || currentMode()!=="punt") return;
    const actions=root.querySelector(".coach1220STActions");
    if(!actions || actions.querySelector("#coach1227SyncPunt")) return;

    const b=document.createElement("button");
    b.id="coach1227SyncPunt";
    b.type="button";
    b.textContent="COPY PUNT LAYOUT TO ALL LINES";
    b.addEventListener("click",function(e){
      e.preventDefault();
      e.stopPropagation();
      const n=syncPuntFromCurrent();
      alert(n ? "Punt position names and locations copied to the other lines. Player assignments were not changed."
              : "No saved Punt renames or moved spots were found on this line.");
    });
    actions.insertBefore(b,actions.firstChild);
  }

  // Add the button whenever Punt is visible. This avoids guessing which line
  // contains the user's customized layout; the user simply opens that Punt line
  // and taps one button.
  let passes=0;
  const timer=setInterval(()=>{
    addSyncButton();
    if(++passes>=240) clearInterval(timer);
  },250);

  window.coach1227SyncPuntFromCurrent=syncPuntFromCurrent;
})();

/* =========================================================
   122.8 — AUTOMATIC PUNT LAYOUT SYNC
   Finds the line with the most saved Punt customizations on this device
   and copies ONLY labels/coordinates to the other lines automatically.
   Player assignments are never copied.
   Runs once per customization signature so it will not keep overwriting.
   ========================================================= */
(function(){
  "use strict";

  function allPrefsForLine(lineId){
    const teamId=team?.id||"team";
    const prefix=`coach1220:st:${teamId}:${lineId}:punt:`;
    const found=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k || !k.startsWith(prefix)) continue;
      try{
        const p=JSON.parse(localStorage.getItem(k)||"{}");
        if(p && (p.label || Number.isFinite(p.x) || Number.isFinite(p.y))){
          found.push({key:k,pref:p,suffix:k.slice(prefix.length)});
        }
      }catch(e){}
    }
    return found;
  }

  function signature(items){
    return JSON.stringify(items.map(x=>[x.suffix,x.pref.label||"",x.pref.x??"",x.pref.y??""]).sort());
  }

  function autoSync(){
    const ls=Array.isArray(lines)?lines:[];
    if(ls.length<2) return false;

    const candidates=ls.map((ln,i)=>({ln,i,items:allPrefsForLine(ln.id)}))
      .sort((a,b)=>b.items.length-a.items.length);

    const source=candidates[0];
    if(!source || !source.items.length) return false;

    const sig=signature(source.items);
    const doneKey=`coach1228:puntSync:${team?.id||"team"}`;
    if(localStorage.getItem(doneKey)===sig) return true;

    const sourcePrefix=`coach1220:st:${team?.id||"team"}:${source.ln.id}:punt:`;

    ls.forEach((ln,i)=>{
      if(i===source.i) return;
      const targetPrefix=`coach1220:st:${team?.id||"team"}:${ln.id}:punt:`;
      source.items.forEach(item=>{
        const suffix=item.key.slice(sourcePrefix.length);
        localStorage.setItem(targetPrefix+suffix,JSON.stringify(item.pref));
      });
    });

    localStorage.setItem(doneKey,sig);
    return true;
  }

  function puntVisible(){
    const root=document.getElementById("coach1220Special");
    if(!root) return false;
    const active=[...root.querySelectorAll(".coach1220Tabs button")]
      .find(b=>b.classList.contains("active"));
    return !!(active && /PUNT/i.test(String(active.textContent||"")));
  }

  function runAndRefresh(){
    if(!puntVisible()) return;
    if(autoSync()){
      // Remove the temporary 122.7 manual-copy button; 122.8 does it itself.
      document.getElementById("coach1227SyncPunt")?.remove();
    }
  }

  let n=0;
  const timer=setInterval(()=>{
    runAndRefresh();
    if(++n>=240) clearInterval(timer);
  },250);

  // Also run once at startup in case the saved customization is already present.
  setTimeout(autoSync,300);
})();

/* =========================================================
   122.9 — BLACK LINE PUNT IS THE MASTER
   Copies Black Line's exact saved Punt labels + coordinates to
   Blue, Green, and Gold. Player assignments are never copied.
   ========================================================= */
(function(){
  "use strict";

  function blackLineIndex(){
    const ls=Array.isArray(lines)?lines:[];
    let i=ls.findIndex(l=>/BLACK/i.test(String(l.name||"")));
    return i>=0?i:0;
  }

  function copyBlackPunt(){
    const ls=Array.isArray(lines)?lines:[];
    if(ls.length<2) return false;
    const bi=blackLineIndex(), source=ls[bi];
    if(!source) return false;

    const teamId=team?.id||"team";
    const prefix=`coach1220:st:${teamId}:${source.id}:punt:`;
    const items=[];

    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k || !k.startsWith(prefix)) continue;
      try{
        const pref=JSON.parse(localStorage.getItem(k)||"{}");
        if(pref && (pref.label || Number.isFinite(pref.x) || Number.isFinite(pref.y))){
          items.push({suffix:k.slice(prefix.length),pref});
        }
      }catch(e){}
    }
    if(!items.length) return false;

    ls.forEach((ln,i)=>{
      if(i===bi) return;
      const target=`coach1220:st:${teamId}:${ln.id}:punt:`;
      items.forEach(x=>localStorage.setItem(target+x.suffix,JSON.stringify(x.pref)));
    });

    localStorage.setItem(`coach1229:blackPuntSynced:${teamId}`,String(Date.now()));
    return true;
  }

  function refreshIfPunt(){
    const root=document.getElementById("coach1220Special");
    if(!root) return;
    const active=[...root.querySelectorAll(".coach1220Tabs button")]
      .find(b=>b.classList.contains("active"));
    if(!(active && /PUNT/i.test(String(active.textContent||"")))) return;

    // Remove the old temporary copy button if present.
    document.getElementById("coach1227SyncPunt")?.remove();

    // Re-render current Punt line after Black master values have been copied.
    try{
      if(typeof coach1220STMode==="function") coach1220STMode("punt");
    }catch(e){}
  }

  let done=false, attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(!done && copyBlackPunt()){
      done=true;
      setTimeout(refreshIfPunt,30);
    }
    if(done || attempts>=80) clearInterval(timer);
  },250);

  // Re-sync whenever Black's saved Punt layout changes later in this session.
  // This is bounded and touches only local layout preferences, never players.
  let last="";
  let checks=0;
  const watcher=setInterval(()=>{
    checks++;
    const ls=Array.isArray(lines)?lines:[];
    const source=ls[blackLineIndex()];
    if(source){
      const prefix=`coach1220:st:${team?.id||"team"}:${source.id}:punt:`;
      const vals=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k&&k.startsWith(prefix)) vals.push(k+"="+localStorage.getItem(k));
      }
      vals.sort();
      const sig=vals.join("|");
      if(sig && sig!==last){
        last=sig;
        if(copyBlackPunt()) setTimeout(refreshIfPunt,30);
      }
    }
    if(checks>=240) clearInterval(watcher);
  },500);
})();

/* =========================================================
   123.0 — PUNT INDEX SYNC FIX
   Kickoff worked because labels were standardized by rendered position.
   Punt now mirrors Black the same way: source and target are matched by
   rendered spot INDEX, not by database slot ID.
   Player assignments are untouched.
   ========================================================= */
(function(){
  "use strict";

  function lineIndexByName(name){
    const ls=Array.isArray(lines)?lines:[];
    const i=ls.findIndex(l=>String(l.name||"").toUpperCase().includes(name));
    return i>=0?i:0;
  }

  function scoreUnitForLine(unit,line,side){
    if(!unit||!line) return -999;
    const n=String(unit.name||"").toUpperCase();
    const ln=String(line.name||"").toUpperCase();
    let score=n.includes(ln)?20:0;
    if(!n.includes("PUNT")) return -999;
    if(side==="offense"){
      if(!n.includes("RETURN")&&!n.includes("DEFENSE")) score+=36;
    }else{
      if(n.includes("PUNT RETURN")) score+=40;
      else if(n.includes("RETURN")||n.includes("DEFENSE")) score+=25;
    }
    return score;
  }

  function unitFor(line,side){
    return (Array.isArray(specialUnits)?specialUnits:[]).slice()
      .sort((a,b)=>scoreUnitForLine(b,line,side)-scoreUnitForLine(a,line,side))[0]||null;
  }

  function slotsFor(unit){
    if(!unit) return [];
    return (Array.isArray(specialSlots)?specialSlots:[])
      .filter(x=>String(x.unit_id)===String(unit.id))
      .slice().sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
  }

  function readPref(teamId,lineId,side,slotId,index){
    const keys=[
      `coach1220:st:${teamId}:${lineId}:punt:${side}:${slotId}`,
      `coach1220:st:${teamId}:${lineId}:punt:${side}:${index}`
    ];
    for(const k of keys){
      try{
        const raw=localStorage.getItem(k);
        if(raw){
          const p=JSON.parse(raw);
          if(p&&(p.label||Number.isFinite(p.x)||Number.isFinite(p.y))) return p;
        }
      }catch(e){}
    }
    return null;
  }

  function writePref(teamId,lineId,side,slotId,index,pref){
    localStorage.setItem(
      `coach1220:st:${teamId}:${lineId}:punt:${side}:${slotId}`,
      JSON.stringify(pref)
    );
    localStorage.setItem(
      `coach1220:st:${teamId}:${lineId}:punt:${side}:${index}`,
      JSON.stringify(pref)
    );
  }

  function sync(){
    const ls=Array.isArray(lines)?lines:[];
    if(ls.length<2) return false;
    const black=ls[lineIndexByName("BLACK")];
    if(!black) return false;
    const teamId=team?.id||"team";
    let copied=0;

    ["offense","defense"].forEach(side=>{
      const srcUnit=unitFor(black,side);
      const srcSlots=slotsFor(srcUnit);

      ls.forEach(target=>{
        if(String(target.id)===String(black.id)) return;
        const dstUnit=unitFor(target,side);
        const dstSlots=slotsFor(dstUnit);

        const count=Math.max(srcSlots.length,dstSlots.length,11);
        for(let i=0;i<count;i++){
          const srcSlot=srcSlots[i];
          const dstSlot=dstSlots[i];
          const pref=readPref(teamId,black.id,side,srcSlot?.id||i,i);
          if(!pref) continue;
          writePref(teamId,target.id,side,dstSlot?.id||i,i,pref);
          copied++;
        }
      });
    });

    return copied>0;
  }

  function puntVisible(){
    const root=document.getElementById("coach1220Special");
    if(!root) return false;
    const active=[...root.querySelectorAll(".coach1220Tabs button")]
      .find(b=>b.classList.contains("active"));
    return !!(active&&/PUNT/i.test(String(active.textContent||"")));
  }

  let tries=0,completed=false;
  const t=setInterval(()=>{
    tries++;
    if(!completed && sync()){
      completed=true;
      if(puntVisible() && typeof coach1220STMode==="function"){
        setTimeout(()=>coach1220STMode("punt"),30);
      }
    }
    if(completed||tries>=80) clearInterval(t);
  },250);

  // Re-run when switching lines so the target line is always rendered
  // from Black's indexed Punt layout.
  if(typeof coach1220SwitchLine==="function"&&!window.__coach1230LineWrapped){
    const old=coach1220SwitchLine;
    window.coach1220SwitchLine=function(){
      sync();
      const r=old.apply(this,arguments);
      setTimeout(sync,20);
      return r;
    };
    window.__coach1230LineWrapped=true;
  }
})();

/* =========================================================
   123.1 — PUNT RETURN SYNC FIX
   123.0 synced the upper Punt side correctly but selected the wrong
   source unit for the lower Punt Return side. This explicitly selects
   Black's PUNT RETURN unit and maps its 11 rendered spots by index to
   Blue/Green/Gold. Players are untouched.
   ========================================================= */
(function(){
  "use strict";

  function blackLine(){
    const ls=Array.isArray(lines)?lines:[];
    return ls.find(l=>/BLACK/i.test(String(l.name||"")))||ls[0]||null;
  }

  function puntReturnUnitFor(line){
    if(!line) return null;
    const ln=String(line.name||"").toUpperCase();
    const units=(Array.isArray(specialUnits)?specialUnits:[]);
    const candidates=units.filter(u=>{
      const n=String(u.name||"").toUpperCase();
      return n.includes("PUNT") && n.includes("RETURN");
    });
    return candidates.slice().sort((a,b)=>{
      const an=String(a.name||"").toUpperCase(),bn=String(b.name||"").toUpperCase();
      const as=an.includes(ln)?100:0, bs=bn.includes(ln)?100:0;
      return bs-as;
    })[0]||null;
  }

  function slots(unit){
    if(!unit) return [];
    return (Array.isArray(specialSlots)?specialSlots:[])
      .filter(x=>String(x.unit_id)===String(unit.id))
      .slice().sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
  }

  function read(teamId,lineId,slotId,index){
    const keys=[
      `coach1220:st:${teamId}:${lineId}:punt:defense:${slotId}`,
      `coach1220:st:${teamId}:${lineId}:punt:defense:${index}`
    ];
    for(const k of keys){
      try{
        const raw=localStorage.getItem(k);
        if(!raw) continue;
        const p=JSON.parse(raw);
        if(p&&(p.label||Number.isFinite(p.x)||Number.isFinite(p.y))) return p;
      }catch(e){}
    }
    return null;
  }

  function write(teamId,lineId,slotId,index,pref){
    localStorage.setItem(
      `coach1220:st:${teamId}:${lineId}:punt:defense:${slotId}`,
      JSON.stringify(pref)
    );
    localStorage.setItem(
      `coach1220:st:${teamId}:${lineId}:punt:defense:${index}`,
      JSON.stringify(pref)
    );
  }

  function syncReturn(){
    const ls=Array.isArray(lines)?lines:[];
    const black=blackLine();
    if(!black||ls.length<2) return false;
    const teamId=team?.id||"team";
    const srcSlots=slots(puntReturnUnitFor(black));
    let copied=0;

    ls.forEach(target=>{
      if(String(target.id)===String(black.id)) return;
      const dstSlots=slots(puntReturnUnitFor(target));
      for(let i=0;i<11;i++){
        const pref=read(teamId,black.id,srcSlots[i]?.id||i,i);
        if(!pref) continue;
        write(teamId,target.id,dstSlots[i]?.id||i,i,pref);
        copied++;
      }
    });
    return copied>0;
  }

  let tries=0,done=false;
  const timer=setInterval(()=>{
    tries++;
    if(!done&&syncReturn()){
      done=true;
      const root=document.getElementById("coach1220Special");
      if(root&&typeof coach1220STMode==="function"){
        setTimeout(()=>coach1220STMode("punt"),30);
      }
    }
    if(done||tries>=80) clearInterval(timer);
  },250);

  if(typeof coach1220SwitchLine==="function"&&!window.__coach1231ReturnWrapped){
    const old=coach1220SwitchLine;
    window.coach1220SwitchLine=function(){
      syncReturn();
      const r=old.apply(this,arguments);
      setTimeout(syncReturn,20);
      return r;
    };
    window.__coach1231ReturnWrapped=true;
  }
})();

/* =========================================================
   123.2 — PUNT RETURN LIVE MIRROR
   Stop guessing database/unit mappings. Capture the ACTUAL rendered
   Black Punt Return boxes (label + x/y) and mirror those 11 rendered
   positions onto Blue/Green/Gold. Player assignments remain untouched.
   ========================================================= */
(function(){
  "use strict";
  const SNAPKEY=()=>`coach1232:blackPuntReturn:${team?.id||"team"}`;

  function isPunt(){
    const r=document.getElementById("coach1220Special");
    if(!r) return false;
    const a=[...r.querySelectorAll(".coach1220Tabs button")].find(b=>b.classList.contains("active"));
    return !!(a&&/PUNT/i.test(String(a.textContent||"")));
  }
  function isBlack(){
    const l=Array.isArray(lines)?lines[currentLine]:null;
    return !!(l&&/BLACK/i.test(String(l.name||"")));
  }
  function defenseEls(){
    return [...document.querySelectorAll("#coach1220Special .coach1220STSpot.def")]
      .sort((a,b)=>Number(a.dataset.index||0)-Number(b.dataset.index||0));
  }
  function labelOf(el){
    for(const n of el.childNodes){
      if(n.nodeType===Node.TEXT_NODE&&String(n.textContent||"").trim())
        return String(n.textContent||"").trim();
    }
    return "";
  }
  function capture(){
    if(!isPunt()||!isBlack()) return false;
    const els=defenseEls();
    if(els.length<1) return false;
    const snap=els.map((el,i)=>({
      i,
      label:labelOf(el),
      x:parseFloat(el.style.left),
      y:parseFloat(el.style.top)
    }));
    localStorage.setItem(SNAPKEY(),JSON.stringify(snap));
    return true;
  }
  function loadSnap(){
    try{return JSON.parse(localStorage.getItem(SNAPKEY())||"[]");}catch(e){return[];}
  }
  function applyToCurrent(){
    if(!isPunt()||isBlack()) return false;
    const snap=loadSnap(),els=defenseEls();
    if(!snap.length||!els.length) return false;
    const line=Array.isArray(lines)?lines[currentLine]:null;
    if(!line) return false;
    const teamId=team?.id||"team";

    snap.forEach((p,i)=>{
      const el=els[i]; if(!el) return;
      const slotId=el.dataset.slot||i;
      const key=`coach1220:st:${teamId}:${line.id}:punt:defense:${slotId}`;
      const ikey=`coach1220:st:${teamId}:${line.id}:punt:defense:${i}`;
      let old={}; try{old=JSON.parse(localStorage.getItem(key)||"{}");}catch(e){}
      const pref={...old,label:p.label,x:p.x,y:p.y};
      localStorage.setItem(key,JSON.stringify(pref));
      localStorage.setItem(ikey,JSON.stringify(pref));

      // Apply directly to the rendered box now.
      for(const n of el.childNodes){
        if(n.nodeType===Node.TEXT_NODE&&String(n.textContent||"").trim()){
          n.textContent=p.label; break;
        }
      }
      if(Number.isFinite(p.x)) el.style.left=p.x+"%";
      if(Number.isFinite(p.y)) el.style.top=p.y+"%";
    });
    return true;
  }

  function addMasterButton(){
    const r=document.getElementById("coach1220Special");
    if(!r||!isPunt()||!isBlack()) return;
    const actions=r.querySelector(".coach1220STActions");
    if(!actions||actions.querySelector("#coach1232Capture")) return;
    const b=document.createElement("button");
    b.id="coach1232Capture";
    b.textContent="SET BLACK PUNT RETURN AS MASTER";
    b.onclick=function(e){
      e.preventDefault();e.stopPropagation();
      if(capture()) alert("Black Punt Return saved as the master. Blue, Green, and Gold will now match its position names and locations.");
    };
    actions.insertBefore(b,actions.firstChild);
  }

  // Capture automatically whenever Black Punt is displayed; apply automatically
  // whenever another Punt line is displayed. This works from rendered boxes,
  // not database slot IDs.
  let n=0;
  const timer=setInterval(()=>{
    if(isPunt()){
      if(isBlack()) { capture(); addMasterButton(); }
      else applyToCurrent();
    }
    if(++n>=480) clearInterval(timer);
  },250);
})();

/* =========================================================
   123.3 — FIELD PLAYER NUMBERS
   Show jersey number together with the player name on the live
   Offense/Defense field for every line. Existing NAMES/NUMBERS
   controls and all assignment/stat logic remain unchanged.
   ========================================================= */
(function(){
  "use strict";

  function playerForName(name){
    const n=String(name||"").trim().toLowerCase();
    if(!n) return null;
    return (Array.isArray(players)?players:[]).find(p=>{
      const full=String(p.name||"").trim().toLowerCase();
      const last=full.split(/\s+/).pop();
      return full===n || last===n;
    })||null;
  }

  function enhanceField(){
    const field=document.getElementById("field");
    if(!field) return;

    field.querySelectorAll(".slot").forEach(slot=>{
      // Once this card has the stacked name/number display, do not wrap it again.
      if(slot.querySelector(".coach1234Number")) return;
      // Native slot cards contain the position plus player-name text.
      // Find the smallest text element that resolves to a roster player.
      const candidates=[...slot.querySelectorAll("small,.playerName,.name,span,div")];
      let target=null,player=null;

      for(const el of candidates){
        if(el.children.length) continue;
        const txt=String(el.textContent||"").trim();
        const p=playerForName(txt);
        if(p){ target=el; player=p; break; }
      }
      if(!target||!player) return;

      const num=player.jersey_number ?? player.number ?? "";
      if(String(num).trim()==="") return;

      const original=String(player.name||target.textContent||"").trim();
      target.dataset.coach1233Name=original;
      target.innerHTML=`<span class="coach1234Name">${original}</span><span class="coach1234Number">#${num}</span>`;
      target.classList.add("coach1233Player");
    });
  }

  // Wrap the native field renderer so all Black/Blue/Green/Gold lines
  // receive numbers whenever the field redraws.
  if(typeof renderField==="function"&&!window.__coach1233RenderWrapped){
    const old=renderField;
    try{
      renderField=function(){
        const r=old.apply(this,arguments);
        enhanceField();
        return r;
      };
      window.__coach1233RenderWrapped=true;
    }catch(e){}
  }

  if(typeof renderUnifiedField==="function"&&!window.__coach1233UnifiedWrapped){
    const old=renderUnifiedField;
    try{
      renderUnifiedField=function(){
        const r=old.apply(this,arguments);
        enhanceField();
        return r;
      };
      window.__coach1233UnifiedWrapped=true;
    }catch(e){}
  }

  // 123.9: no polling. Repeated DOM writes caused the jersey numbers to flash.
  // renderField/renderUnifiedField wrappers above update numbers only when the field truly redraws.
  setTimeout(enhanceField,0);

  const style=document.createElement("style");
  style.textContent=`
    #field .coach1233Player{
      white-space:nowrap!important;
      font-size:clamp(8px,1.05vw,13px)!important;
      font-weight:800!important;
      letter-spacing:-.15px!important;
    }
  `;
  document.head.appendChild(style);
})();

/* 123.4 — stack player name above jersey number on live field cards */
(function(){
  const style=document.createElement("style");
  style.textContent=`
    #field .coach1233Player{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      line-height:1.05!important;
      white-space:normal!important;
    }
    #field .coach1234Name{
      display:block!important;
      font-size:clamp(8px,1.05vw,13px)!important;
      font-weight:800!important;
    }
    #field .coach1234Number{
      display:block!important;
      margin-top:3px!important;
      font-size:clamp(7px,.82vw,10px)!important;
      font-weight:900!important;
      opacity:.9!important;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   123.5 — COMBINED FIELD + NUMBER LAYOUT
   Built from working 123.4.
   1) Player cards: position, name, then jersey number underneath.
   2) Extend the live field down through the unused blue gap.
   No Special Teams / substitution / stats behavior changed.
   ========================================================= */
(function(){
  "use strict";
  const style=document.createElement("style");
  style.id="coach1235CombinedLayout";
  style.textContent=`
    /* Keep all three lines readable inside the existing player card. */
    #field .coach1233Player{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      line-height:1!important;
      white-space:normal!important;
      overflow:visible!important;
    }
    #field .coach1234Name{
      display:block!important;
      font-size:clamp(8px,1vw,12px)!important;
      font-weight:800!important;
      line-height:1.05!important;
    }
    #field .coach1234Number{
      display:block!important;
      margin-top:3px!important;
      font-size:clamp(7px,.82vw,10px)!important;
      font-weight:900!important;
      line-height:1!important;
      opacity:.92!important;
    }

    /* Use the blue dead-space below the field, stopping above the controls. */
    body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
      padding-bottom:0!important;
      height:calc(100dvh - 88px)!important;
      max-height:calc(100dvh - 88px)!important;
    }
    body.coach1200-game-dashboard.fieldFullscreen #field.field{
      width:100%!important;
      height:100%!important;
      max-width:none!important;
      max-height:none!important;
      min-height:0!important;
      aspect-ratio:auto!important;
      margin:0!important;
    }

    @media (orientation:landscape) and (max-height:700px){
      body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
        height:calc(100dvh - 82px)!important;
        max-height:calc(100dvh - 82px)!important;
      }
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   123.6 — FIELD GAP + DUPLICATE NUMBER FIX
   The visible blue gap is outside #field, so 123.5 changed the wrong
   container. Extend the field wrapper itself down to the custom toolbar.
   Also suppress duplicate jersey-number text.
   ========================================================= */
(function(){
  "use strict";

  function fixDuplicateNumbers(){
    document.querySelectorAll("#field .slot").forEach(slot=>{
      const nums=[...slot.querySelectorAll(".coach1234Number")];
      nums.slice(1).forEach(n=>n.remove());

      const playerLine=slot.querySelector(".coach1233Player");
      if(!playerLine) return;
      const jersey=playerLine.querySelector(".coach1234Number")?.textContent?.trim();
      if(!jersey) return;

      [...slot.querySelectorAll("small,span,div")].forEach(el=>{
        if(el===playerLine || playerLine.contains(el) || el.children.length) return;
        if(String(el.textContent||"").trim()===jersey) el.style.display="none";
      });
    });
  }

  function extendField(){
    const field=document.getElementById("field");
    if(!field) return;

    const toolbar=document.querySelector(".coach1200MenuBar, #coach1200MenuBar, .coach1200BottomBar");
    const rect=field.getBoundingClientRect();
    const targetTop=toolbar ? toolbar.getBoundingClientRect().top : (window.innerHeight-92);
    const extra=Math.max(0,targetTop-rect.bottom);

    if(extra>2){
      const current=rect.height;
      field.style.setProperty("height",(current+extra)+"px","important");
      field.style.setProperty("max-height","none","important");
      field.style.setProperty("aspect-ratio","auto","important");

      const parent=field.parentElement;
      if(parent){
        parent.style.setProperty("height",(parent.getBoundingClientRect().height+extra)+"px","important");
        parent.style.setProperty("max-height","none","important");
        parent.style.setProperty("padding-bottom","0","important");
      }
    }
  }

  function apply(){
    fixDuplicateNumbers();
    extendField();
  }

  setTimeout(apply,50);
  setTimeout(apply,300);
  setTimeout(apply,900);
  window.addEventListener("resize",()=>setTimeout(apply,50),{passive:true});

  let n=0;
  const timer=setInterval(()=>{
    apply();
    if(++n>=80) clearInterval(timer);
  },250);

  const style=document.createElement("style");
  style.textContent=`
    body.coach1200-game-dashboard.fieldFullscreen #field{
      margin-bottom:0!important;
    }
    body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
      padding-bottom:0!important;
      margin-bottom:0!important;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   123.7 — FIELD TO ACTUAL TOOLBAR + SINGLE NUMBER
   Uses the real #coach1200DashboardBar as the lower edge of the field.
   Cleans any number nesting left by 123.5/123.6.
   ========================================================= */
(function(){
  "use strict";

  function cleanNumbers(){
    document.querySelectorAll("#field .slot").forEach(slot=>{
      const playerLine=slot.querySelector(".coach1233Player");
      if(!playerLine) return;

      const nameEl=playerLine.querySelector(".coach1234Name");
      const numberEls=[...playerLine.querySelectorAll(".coach1234Number")];
      if(!nameEl || !numberEls.length) return;

      // Preserve only the first valid number and rebuild this line cleanly.
      const number=String(numberEls[0].textContent||"").trim();
      const name=String(nameEl.textContent||"").trim();
      if(!name || !number) return;

      playerLine.replaceChildren();
      const n=document.createElement("span");
      n.className="coach1234Name";
      n.textContent=name;
      const j=document.createElement("span");
      j.className="coach1234Number";
      j.textContent=number;
      playerLine.append(n,j);
    });
  }

  function extendExactly(){
    const field=document.getElementById("field");
    const area=field?.closest(".fieldArea");
    const bar=document.getElementById("coach1200DashboardBar");
    if(!field || !area || !bar) return;

    const fr=field.getBoundingClientRect();
    const ar=area.getBoundingClientRect();
    const br=bar.getBoundingClientRect();

    // The green field should end exactly at the top of the custom line/tool bar.
    const fieldHeight=Math.max(200, br.top-fr.top);
    const areaHeight=Math.max(200, br.top-ar.top);

    area.style.setProperty("height",areaHeight+"px","important");
    area.style.setProperty("max-height",areaHeight+"px","important");
    area.style.setProperty("padding-bottom","0","important");
    area.style.setProperty("margin-bottom","0","important");
    area.style.setProperty("overflow","hidden","important");

    field.style.setProperty("height",fieldHeight+"px","important");
    field.style.setProperty("max-height",fieldHeight+"px","important");
    field.style.setProperty("min-height",fieldHeight+"px","important");
    field.style.setProperty("width","100%","important");
    field.style.setProperty("max-width","none","important");
    field.style.setProperty("aspect-ratio","auto","important");
    field.style.setProperty("margin-bottom","0","important");
  }

  function apply(){
    // 123.8: do not rebuild player labels on a timer; that caused flashing.
    extendExactly();
  }

  [0,60,180,500,1000].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener("resize",()=>setTimeout(apply,60),{passive:true});

  let passes=0;
  const timer=setInterval(()=>{
    apply();
    if(++passes>=120) clearInterval(timer);
  },250);

  const style=document.createElement("style");
  style.id="coach1237ExactField";
  style.textContent=`
    body.coach1200-game-dashboard.fieldFullscreen .fieldArea{
      padding-bottom:0!important;
      margin-bottom:0!important;
    }
    body.coach1200-game-dashboard.fieldFullscreen #field.field{
      margin-bottom:0!important;
      aspect-ratio:auto!important;
    }
    #field .coach1233Player > .coach1234Number ~ .coach1234Number{
      display:none!important;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   123.8 — STOP NUMBER FLASH
   123.7's cleanup loop rebuilt the name/number DOM every 250ms.
   That repeated replacement caused the visible flashing.
   Freeze already-correct cards and only repair cards when their
   displayed player actually changes.
   ========================================================= */
(function(){
  "use strict";

  function stabilize(){
    document.querySelectorAll("#field .slot").forEach(slot=>{
      const line=slot.querySelector(".coach1233Player");
      if(!line) return;
      const name=line.querySelector(".coach1234Name");
      const num=line.querySelector(".coach1234Number");
      if(!name||!num) return;

      const sig=(name.textContent||"").trim()+"|"+(num.textContent||"").trim();
      if(line.dataset.coach1238Stable===sig) return;

      // Remove duplicates once, but do not continuously rebuild the card.
      [...line.querySelectorAll(".coach1234Number")].slice(1).forEach(x=>x.remove());
      line.dataset.coach1238Stable=sig;
    });
  }

  // Hide the old 123.7 cleanup function from causing visual churn by making
  // repeated replaceChildren calls visually unnecessary: stable cards are
  // normalized immediately after native redraws only.
  // 123.9: no MutationObserver. Keep the rendered card static between real field redraws.
  stabilize();

  const style=document.createElement("style");
  style.id="coach1238NoFlash";
  style.textContent=`
    #field .coach1233Player,
    #field .coach1234Name,
    #field .coach1234Number{
      transition:none!important;
      animation:none!important;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   123.9 — STATIC FIELD NUMBERS
   Final anti-flash layer: no timer or observer is allowed to rewrite
   player-card text. Numbers update only when native field rendering runs.
   ========================================================= */
(function(){
  "use strict";

  // Ensure any legacy CSS animation/transition cannot visually pulse text.
  const style=document.createElement("style");
  style.id="coach1239StaticNumbers";
  style.textContent=`
    #field .slot .coach1233Player,
    #field .slot .coach1234Name,
    #field .slot .coach1234Number{
      animation:none!important;
      transition:none!important;
      opacity:1!important;
      visibility:visible!important;
      transform:none!important;
    }
  `;
  document.head.appendChild(style);
})();

/* 124.0 — numbers are inserted during the native field render, before Safari paints */
(function(){
  "use strict";
  if(typeof enhanceField==="function"){
    try{ enhanceField(); }catch(e){}
  }
  const style=document.createElement("style");
  style.id="coach1240NoNumberPaintGap";
  style.textContent=`
    #field .coach1233Player{
      contain:layout style!important;
      backface-visibility:hidden!important;
      -webkit-font-smoothing:antialiased!important;
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   124.4 — SHARED KICKOFF FORMATION PERSISTENCE
   One 11-player Kickoff and one 11-player Kick Return formation
   are used by Black/Blue/Green/Gold. Players remain line-specific.
   ========================================================= */
(function(){
  "use strict";
  const KEY=()=>`coach1244:kickoffFormation:${team?.id||"team"}`;

  function saveShared(){
    try{localStorage.setItem(KEY(),JSON.stringify(DIAGRAM.kickoff));}catch(e){}
  }
  function loadShared(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY())||"null");
      if(x?.offense?.length===11 && x?.defense?.length===11){
        DIAGRAM.kickoff.offense=x.offense;
        DIAGRAM.kickoff.defense=x.defense;
      }
    }catch(e){}
  }

  loadShared();

  // Persist shared names/locations after Rename or Move interactions.
  document.addEventListener("click",e=>{
    if(!document.getElementById("coach1220Special")) return;
    if(!String(e.target?.closest?.("button")?.textContent||"").match(/RENAME|MOVE SPOTS|KICKOFF/i)) return;
    setTimeout(saveShared,150);
  },false);

  // Seed the authoritative formation immediately.
  saveShared();
})();

/* 124.5 GAME DAY CLEANUP
   Working 124.4 behavior preserved.
   Removed obsolete 124.2/124.3 Kickoff mirror timers/observers.
   No new game behavior added.
*/

/* 124.6 — Special Teams roster rules
   - Kickoff participation does not block Punt selection.
   - Any rostered player can be manually selected.
   - Same-unit duplicate selection performs a swap.
   - No-position-match players are highlighted as a warning, not blocked.
   - Special Teams remains excluded from Game Day participation stats.
*/

/* =========================================================
   124.7 — PLAYER STAR MARKER
   Game Day only. Tap MARK ⭐, then tap a player card.
   Marker belongs to that exact line + side + position + player.
   Tap marked player while MARK mode is on to remove.
   If the player in that position changes, the marker disappears.
   No stats / Special Teams effects.
   ========================================================= */
(function(){
  "use strict";

  let markMode=false;
  const marks=new Map();

  function lineId(){
    const l=Array.isArray(lines)?lines[currentLine]:null;
    return String(l?.id ?? currentLine ?? "");
  }

  function sideOf(slot){
    if(slot.classList.contains("offense")) return "offense";
    if(slot.classList.contains("defense")) return "defense";
    const y=parseFloat(slot.style.top||"0");
    return y<55?"offense":"defense";
  }

  function positionOf(slot){
    return String(slot.dataset.positionId || slot.dataset.position || slot.dataset.pos || 
      slot.querySelector(".pos,.position,.slotPos")?.textContent || "").trim();
  }

  function playerIdOf(slot){
    return String(slot.dataset.playerId || slot.dataset.player || 
      slot.querySelector("[data-player-id]")?.dataset.playerId || "").trim();
  }

  function playerSignature(slot){
    const pid=playerIdOf(slot);
    if(pid) return "id:"+pid;
    const name=slot.querySelector(".coach1234Name")?.textContent ||
      slot.querySelector(".coach1233Player")?.textContent || "";
    return "name:"+String(name).replace(/#\d+/g,"").trim();
  }

  function keyFor(slot){
    return [lineId(),sideOf(slot),positionOf(slot)].join("|");
  }

  function ensureButton(){
    if(document.getElementById("coach1247MarkBtn")) return;
    // Find the menu that is actually visible on the live field. Older versions
    // used different IDs, so key off the MOVE PLAYERS button shown on screen.
    const move=[...document.querySelectorAll("button")].find(b=>
      /MOVE PLAYERS/i.test(b.textContent||"") &&
      b.offsetParent!==null
    );
    if(!move || !move.parentElement) return;
    const bar=move.parentElement;
    const b=document.createElement("button");
    b.id="coach1247MarkBtn";
    b.type="button";
    b.className=move.className;
    b.textContent="⭐ MARK";
    b.addEventListener("click",e=>{
      e.preventDefault(); e.stopPropagation();
      markMode=!markMode;
      b.classList.toggle("active",markMode);
      b.textContent=markMode?"⭐ TAP PLAYER":"⭐ MARK";
    });
    bar.insertBefore(b,move);
  }

  function clearVisual(slot){
    slot.classList.remove("coach1247Marked");
    slot.querySelectorAll(":scope > .coach1247Star").forEach(x=>x.remove());
  }

  function addVisual(slot){
    clearVisual(slot);
    const star=document.createElement("span");
    star.className="coach1247Star";
    star.textContent="★";
    star.setAttribute("aria-label","marked player");
    slot.appendChild(star);
    slot.classList.add("coach1247Marked");
  }

  function refresh(){
    ensureButton();
    document.querySelectorAll("#field .slot").forEach(slot=>{
      const key=keyFor(slot);
      const sig=playerSignature(slot);
      const saved=marks.get(key);
      clearVisual(slot);
      if(!saved) return;
      if(saved!==sig){
        // Position occupant changed: marker automatically expires.
        marks.delete(key);
        return;
      }
      addVisual(slot);
    });
  }

  document.addEventListener("click",e=>{
    if(!markMode) return;
    const slot=e.target.closest?.("#field .slot");
    if(!slot) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const key=keyFor(slot);
    const sig=playerSignature(slot);
    if(marks.get(key)===sig){
      marks.delete(key);
      clearVisual(slot);
    }else{
      marks.set(key,sig);
      addVisual(slot);
    }

    markMode=false;
    const b=document.getElementById("coach1247MarkBtn");
    if(b){b.classList.remove("active"); b.textContent="⭐ MARK";}
  },true);

  // Refresh only when Game Day actually redraws / changes.
  const wrap=name=>{
    try{
      const old=window[name];
      if(typeof old!=="function" || old.__coach1247) return;
      const fn=function(){
        const r=old.apply(this,arguments);
        requestAnimationFrame(refresh);
        return r;
      };
      fn.__coach1247=true;
      window[name]=fn;
    }catch(e){}
  };
  wrap("renderField");
  wrap("renderUnifiedField");
  wrap("nextLineOnly");

  setTimeout(refresh,0);
  setTimeout(refresh,300);
  const uiObserver=new MutationObserver(()=>{
    if(!document.getElementById("coach1247MarkBtn")) ensureButton();
  });
  uiObserver.observe(document.body,{childList:true,subtree:true});

  const style=document.createElement("style");
  style.id="coach1247StarStyle";
  style.textContent=`
    #coach1247MarkBtn.active{
      background:#f3b61f!important;
      color:#07111f!important;
      border-color:#ffe28a!important;
    }
    #field .slot.coach1247Marked{
      position:absolute!important;
    }
    #field .slot .coach1247Star{
      position:absolute!important;
      right:4px!important;
      top:3px!important;
      z-index:12!important;
      font-size:18px!important;
      line-height:1!important;
      color:#ffd84d!important;
      text-shadow:0 1px 2px #000,0 0 4px #000!important;
      pointer-events:none!important;
    }
  `;
  document.head.appendChild(style);
})();

/* 124.8 fix:
   124.7 targeted an obsolete dashboard-bar ID, so the button never appeared.
   124.8 anchors directly to the visible MOVE PLAYERS control instead.
*/

/* 124.9 — GAME DAY SWAP FIX
   Fixes the "Player is already assigned on this OFFENSE line" block.
   The full-roster Game Day picker can now truly swap two players already on
   the same side. Linked offense/defense behavior is preserved.
   Star marker and 124.6 Special Teams behavior are unchanged.
*/


/* =========================================================
   125.0 — REBUILT GAME DAY PLAYER MOVE
   One authoritative picker + transaction-style swap.
   It intentionally bypasses native replacePlayerLinked /
   assignPlayerDirect duplicate checks.
   ========================================================= */
(()=>{
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function lineNow(){ return Array.isArray(lines)?lines[currentLine]:null; }
  function posById(id){ return (positions||[]).find(p=>String(p.id)===String(id)); }
  function lineAsn(lineId){
    return (assignments||[]).filter(a=>String(a.line_id)===String(lineId));
  }
  function posOfAssignment(a){
    return (positions||[]).find(p=>String(p.id)===String(a.position_label_id));
  }
  function sideAssignment(lineId,side,playerId){
    return lineAsn(lineId).map(a=>({a,pos:posOfAssignment(a)}))
      .find(x=>x.pos && x.pos.side===side && String(x.a.player_id)===String(playerId));
  }

  async function write(lineId,posId,playerId){
    if(typeof sb==="undefined") throw new Error("Database unavailable");
    const d=await sb.from("assignments").delete()
      .eq("line_id",lineId).eq("position_label_id",posId);
    if(d.error) throw d.error;
    if(!playerId) return;
    const i=await sb.from("assignments").insert({
      line_id:lineId,position_label_id:posId,player_id:playerId
    });
    if(i.error) throw i.error;
  }

  async function swap(positionId,newPlayerId){
    const line=lineNow(), target=posById(positionId);
    if(!line||!target) return;
    const current=lineAsn(line.id).find(a=>String(a.position_label_id)===String(positionId));
    const oldId=current?.player_id||"";
    if(String(oldId)===String(newPlayerId)){ try{closeModal();}catch(e){} return; }

    const incoming=(players||[]).find(p=>String(p.id)===String(newPlayerId));
    if(!incoming){ alert("Player not found."); return; }
    if(typeof playerCanPlay==="function" && !playerCanPlay(incoming)){
      alert("That player is not currently available."); return;
    }

    const side=target.side, opp=side==="offense"?"defense":"offense";
    const inSame=sideAssignment(line.id,side,newPlayerId);
    const oldOpp=oldId?sideAssignment(line.id,opp,oldId):null;
    const inOpp=sideAssignment(line.id,opp,newPlayerId);

    try{
      // Clear every affected position FIRST, so no intermediate duplicate exists.
      const clearIds=new Set([String(target.id)]);
      if(inSame?.pos) clearIds.add(String(inSame.pos.id));
      if(oldOpp?.pos) clearIds.add(String(oldOpp.pos.id));
      if(inOpp?.pos) clearIds.add(String(inOpp.pos.id));
      for(const id of clearIds) await write(line.id,id,"");

      // Same-side true swap / replacement.
      await write(line.id,target.id,newPlayerId);
      if(inSame?.pos && String(inSame.pos.id)!==String(target.id) && oldId)
        await write(line.id,inSame.pos.id,oldId);

      // Preserve linked offense/defense behavior.
      if(oldOpp?.pos){
        await write(line.id,oldOpp.pos.id,newPlayerId);
        if(inOpp?.pos && String(inOpp.pos.id)!==String(oldOpp.pos.id) && oldId)
          await write(line.id,inOpp.pos.id,oldId);
      }

      if(typeof loadAssignments==="function") await loadAssignments();
      try{saveOfflineSnapshot?.();}catch(e){}
      try{closeModal?.();}catch(e){}
      try{renderField?.();}catch(e){}
      try{renderPlayers?.();}catch(e){}
      try{mirrorDashboardField?.();}catch(e){}
    }catch(e){
      console.error("125.0 rebuilt swap",e);
      // Reload authoritative DB state if any write failed.
      try{ if(typeof loadAssignments==="function") await loadAssignments(); }catch(_){}
      alert("Could not move that player. "+(e?.message||"Please try again."));
    }
  }

  function openPicker(positionId){
    const line=lineNow(), pos=posById(positionId);
    if(!line||!pos) return;
    const la=lineAsn(line.id);
    const curA=la.find(a=>String(a.position_label_id)===String(positionId));
    const cur=(players||[]).find(p=>String(p.id)===String(curA?.player_id));
    const rows=(players||[]).filter(p=>typeof playerCanPlay!=="function"||playerCanPlay(p))
      .map(p=>{
        const occupied=sideAssignment(line.id,pos.side,p.id);
        const prefs=(pos.side==="offense"?p.offense_positions:p.defense_positions)||[];
        let score=0;
        try{ score=typeof playerPositionMatchScore==="function"?playerPositionMatchScore(p,pos.label,pos.side):0; }catch(e){}
        return {p,occupied,prefs,score};
      }).sort((a,b)=>b.score-a.score || String(a.p.name||"").localeCompare(String(b.p.name||"")));

    const recommended=rows.find(x=>!x.occupied && String(x.p.id)!==String(cur?.id)) || rows[0];
    const html=`<div class="coach1196SwapModal">
      <div class="coach1196SwapHead">
        <div><small>${esc(line.name||"LINE")} • ${esc(String(pos.side||"").toUpperCase())}</small>
        <h2>${esc(pos.label)}${cur?" — "+esc(cur.name):""}</h2></div>
        <button type="button" class="secondary" onclick="closeModal()">✕ CLOSE</button>
      </div>
      ${recommended?`<div class="coach1196Recommended"><span><small>RECOMMENDED REPLACEMENT</small><b>#${esc(recommended.p.jersey_number??"")} ${esc(recommended.p.name||"Player")}</b></span>
      <button type="button" onclick="coach1250Swap('${esc(positionId)}','${esc(recommended.p.id)}')">USE RECOMMENDATION</button></div>`:""}
      <p class="coach1196SwapHint">Full roster shown. A player already on this ${esc(pos.side)} line can be selected and the two positions will swap.</p>
      <div class="coach1196SwapList">
      ${rows.map(x=>{
        const isCur=String(x.p.id)===String(cur?.id);
        return `<button type="button" class="coach1196SwapRow ${x.occupied?"onField":""} ${isCur?"current":""}"
          onclick="coach1250Swap('${esc(positionId)}','${esc(x.p.id)}')">
          <b>#${esc(x.p.jersey_number??"")}</b>
          <span><b>${esc(x.p.name||"Player")}</b><small>${isCur?"CURRENT PLAYER":x.occupied?"ON FIELD — TAP TO SWAP":"TAP TO REPLACE"}</small></span>
          <span class="coach1196SwapWhere">${x.occupied?"ON FIELD • "+esc(x.occupied.pos?.label||""):"BENCH"}</span>
          <span class="coach1196SwapPrefs">${esc(x.prefs.length?x.prefs.join(" / "):"OTHER POSITION")}</span>
          <span class="coach1196SwapPlays">${Number(counts?.[x.p.id]||0)}</span>
        </button>`;
      }).join("")}</div></div>`;

    if(typeof openModal==="function") openModal(html);
  }

  window.coach1250Swap=swap;
  window.coach1250OpenPicker=openPicker;

  // Make these the final authoritative entry points after every older patch.
  window.openReplacePlayerModal=openPicker;
  window.replacePlayerAtPosition=swap;

  // Reassert after startup/render timers from older versions.
  [0,100,500,1500].forEach(ms=>setTimeout(()=>{
    window.openReplacePlayerModal=openPicker;
    window.replacePlayerAtPosition=swap;
  },ms));
})();


/* =========================================================
   125.2 — SAFE EXACT GAME LINEUP REPAIR
   Never clears a side first. Uses two-phase staging so same-side
   unique-player rules cannot leave OPEN positions.
   Special Teams and participation stats are untouched.
   ========================================================= */
(()=>{
const EXACT={"Black":{"offense":{"LT":"Schnittker","LG":"Tinucci","C":"Miller","RG":"Webber","RT":"McLellan","Y":"Raymond","Z":"Seebinger","H":"Adams","X":"Witt","QB":"Scherbring","F":"Rosati"},"defense":{"D":"Seebinger","LE":"Tinucci","NG":"Rosati","RE":"Miller","R":"Raymond","W":"Scherbring","S":"Webber","FC":"McLellan","RD":"Adams","FS":"Witt","BC":"Schnittker"}},"Blue":{"offense":{"LT":"Miller","LG":"Raymond","C":"Webber","RG":"Klein","RT":"Pattain","Y":"Tinucci","Z":"Scherbring","H":"Sandness","X":"Rosati","QB":"Puckett","F":"Novogratz"},"defense":{"D":"Webber","LE":"Pattain","NG":"Scherbring","RE":"Raymond","R":"Miller","W":"Novogratz","S":"Rosati","FC":"Sandness","RD":"Tinucci","FS":"Puckett","BC":"Klein"}},"Green":{"offense":{"LT":"Schnittker","LG":"Tinucci","C":"Miller","RG":"Pattain","RT":"McLellan","Y":"Raymond","Z":"Seebinger","H":"Adams","X":"Witt","QB":"Scherbring","F":"Rosati"},"defense":{"D":"Seebinger","LE":"Tinucci","NG":"Rosati","RE":"Miller","R":"Raymond","W":"Scherbring","S":"Pattain","FC":"McLellan","RD":"Adams","FS":"Witt","BC":"Schnittker"}},"Gold":{"offense":{"LT":"Miller","LG":"Schnittker","C":"Webber","RG":"Klein","RT":"Pattain","Y":"Adams","Z":"Witt","H":"Sandness","X":"Seebinger","QB":"Puckett","F":"Novogratz"},"defense":{"D":"Webber","LE":"Pattain","NG":"Adams","RE":"Seebinger","R":"Miller","W":"Novogratz","S":"Schnittker","FC":"Sandness","RD":"Witt","FS":"Puckett","BC":"Klein"}}};
const norm=v=>String(v??'').trim().toLowerCase();
const APPLIED='coach1252ExactLineupsApplied';

function lastName(v){const a=norm(v).split(/\s+/);return a[a.length-1]||'';}
function findPlayer(name){
  return players.find(p=>norm(p.name)===norm(name)||lastName(p.name)===norm(name));
}
function findLine(name){
  return lines.find(l=>norm(l.name)===norm(name)||norm(l.name).includes(norm(name)));
}
function sidePositions(side){
  return positions.filter(p=>norm(p.side)===norm(side));
}
function findPos(ps,label){
  return ps.find(p=>norm(p.label)===norm(label)||norm(p.name)===norm(label)||norm(p.code)===norm(label));
}
async function del(lineId,posId){
  const r=await sb.from('assignments').delete().eq('line_id',lineId).eq('position_label_id',posId);
  if(r.error) throw r.error;
}
async function put(lineId,posId,playerId){
  const r=await sb.from('assignments').insert({line_id:lineId,position_label_id:posId,player_id:playerId});
  if(r.error) throw r.error;
}
async function repairSide(line,side,map){
  const ps=sidePositions(side);
  const targets=[];
  for(const [label,pname] of Object.entries(map)){
    const pos=findPos(ps,label), pl=findPlayer(pname);
    if(!pos) throw new Error(line.name+' '+side+' position '+label+' not found');
    if(!pl) throw new Error('Player '+pname+' not found');
    targets.push({pos,pl,label,pname});
  }
  // Stage all target positions empty, then refill immediately. This avoids
  // duplicate-player conflicts while guaranteeing we already resolved every
  // position/player before changing the database.
  for(const t of targets) await del(line.id,t.pos.id);
  try{
    for(const t of targets) await put(line.id,t.pos.id,t.pl.id);
  }catch(e){
    // One retry after reloading assignments handles transient duplicate state.
    try{await loadAssignments?.();}catch(_e){}
    for(const t of targets){
      const existing=(Array.isArray(assignments)?assignments:[]).find(a=>String(a.line_id)===String(line.id)&&String(a.position_label_id)===String(t.pos.id));
      if(!existing){
        try{await put(line.id,t.pos.id,t.pl.id);}catch(_e){}
      }
    }
    throw e;
  }
}
async function apply1252(){
  if(localStorage.getItem(APPLIED)==='1') return true;
  if(typeof sb==='undefined'||!Array.isArray(lines)||lines.length<4||!Array.isArray(players)||!players.length||!Array.isArray(positions)||!positions.length) return false;
  try{
    // Resolve EVERYTHING before writing anything.
    for(const [ln,sides] of Object.entries(EXACT)){
      const line=findLine(ln); if(!line) throw new Error(ln+' line not found');
      for(const [side,map] of Object.entries(sides)){
        const ps=sidePositions(side);
        for(const [label,pname] of Object.entries(map)){
          if(!findPos(ps,label)) throw new Error(ln+' '+side+' '+label+' position not found');
          if(!findPlayer(pname)) throw new Error('Player '+pname+' not found');
        }
      }
    }
    for(const [ln,sides] of Object.entries(EXACT)){
      const line=findLine(ln);
      for(const [side,map] of Object.entries(sides)) await repairSide(line,side,map);
    }
    await loadAssignments?.();
    try{saveOfflineSnapshot?.();}catch(e){}
    try{renderField?.();}catch(e){}
    localStorage.setItem(APPLIED,'1');
    alert('125.2 complete: all four game lineups repaired.');
    return true;
  }catch(e){
    console.error('125.2 lineup repair',e);
    try{await loadAssignments?.();renderField?.();}catch(_e){}
    alert('125.2 stopped: '+(e?.message||e));
    return true;
  }
}
window.coach1252ApplyExactLineups=apply1252;
let tries=0;
const timer=setInterval(async()=>{
  if(localStorage.getItem(APPLIED)==='1'||++tries>30){clearInterval(timer);return;}
  if(await apply1252()) clearInterval(timer);
},500);
})();
