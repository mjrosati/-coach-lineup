
const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const DEFAULT_POS = [
  // Offense: 11 players, now including TE.
  ['WRL','offense','WRL','WR (Left)',12,18],['WRR','offense','WRR','WR (Right)',88,18],
  ['LT','offense','LT','LT',29,31],['LG','offense','LG','LG',39,31],['C','offense','C','C',49,31],
  ['RG','offense','RG','RG',59,31],['RT','offense','RT','RT',69,31],['TE','offense','TE','TE',78,31],
  ['QB','offense','QB','QB',49,40],['RBL','offense','RBL','RB (Left)',40,46],['RBR','offense','RBR','RB (Right)',59,46],
  // Defense: 11 players (4-3 front, 4 DB).
  ['DEL','defense','DEL','DE (Left)',24,64],['DTL','defense','DTL','DT (Left)',42,64],
  ['DTR','defense','DTR','DT (Right)',58,64],['DER','defense','DER','DE (Right)',76,64],
  ['LBL','defense','LBL','OLB (Left)',31,75],['LBC','defense','LBC','MLB',50,75],['LBR','defense','LBR','OLB (Right)',69,75],
  ['CBL','defense','CBL','CB (Left)',18,88],['SSL','defense','SSL','SS',40,88],
  ['FS','defense','FS','FS',60,88],['CBR','defense','CBR','CB (Right)',82,88]
];

let team=null, membership=null, lines=[], players=[], positions=[], assignments=[], playbookPlays=[];
let gameModeLocked=false, sidelineMode=false;
let gameQuarter='Q1', possession='ours', clockSeconds=480, clockRunning=false, clockTimer=null, clockEndAt=null;
let deferredInstallPrompt=null;

let currentLine=0, displayMode='names', currentGame=null, playCount=0, counts={}, threshold=75, channel=null;
let activeView='offense', editFieldMode=false, specialUnits=[], specialSlots=[], specialAssignments=[], currentSpecialUnit=0, deviceMode=localStorage.getItem('coachLineupDeviceMode')||'auto';
let fieldFullscreen=false;
let pendingLineupLabel='Current lineup';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function openModal(html){ $('modalBody').innerHTML=html; $('modal').classList.remove('hidden'); }
function closeModal(){ $('modal').classList.add('hidden'); }
function showAuth(){ $('auth').classList.remove('hidden'); $('app').classList.add('hidden'); }
function showApp(){ $('auth').classList.add('hidden'); $('app').classList.remove('hidden'); }
function msg(t){ $('authMsg').textContent=t||''; }
function updateConnectionStatus(){
  const el=$('syncStatus');
  if(!el) return;
  const online=navigator.onLine;
  el.textContent=online?'● LIVE':'● OFFLINE';
  el.classList.toggle('offline',!online);
}
window.addEventListener('online',updateConnectionStatus);
window.addEventListener('offline',updateConnectionStatus);
function userId(){ return sb.auth.getUser().then(r=>r.data.user?.id); }
function roleCanEdit(){ return membership && ['owner','admin','coach'].includes(membership.role); }
function roleIsAdmin(){ return membership && ['owner','admin'].includes(membership.role); }
function roleIsOwner(){ return membership?.role==='owner'; }


const ALLOWED_REGULAR_SLOTS=new Set(DEFAULT_POS.map(x=>x[2]));
const SPECIAL_DEFAULTS={
  'Kickoff':[
    ['K','K',50,82],['L1','L1',16,62],['L2','L2',29,62],['L3','L3',41,62],['L4','L4',50,62],
    ['R1','R1',84,62],['R2','R2',71,62],['R3','R3',59,62],['S1','S1',35,38],['S2','S2',65,38],['S3','S3',50,22]
  ],
  'Kick Return':[
    ['KR1','KR1',38,22],['KR2','KR2',62,22],['L1','L1',15,44],['L2','L2',28,44],['L3','L3',41,44],
    ['R1','R1',85,44],['R2','R2',72,44],['R3','R3',59,44],['FBL','FB-L',38,64],['FBR','FB-R',62,64],['C','C',50,78]
  ],
  'Punt':[
    ['P','P',50,80],['PP','PP',50,64],['LS','LS',50,44],['LT','LT',30,44],['LG','LG',40,44],['RG','RG',60,44],
    ['RT','RT',70,44],['LW','LW',15,30],['RW','RW',85,30],['G1','G1',30,68],['G2','G2',70,68]
  ],
  'Punt Return':[
    ['PR','PR',50,20],['CBL','CB-L',17,35],['CBR','CB-R',83,35],['L1','L1',26,54],['L2','L2',38,54],['L3','L3',50,54],
    ['R1','R1',62,54],['R2','R2',74,54],['S1','S1',35,73],['S2','S2',50,73],['S3','S3',65,73]
  ],
  'FG/PAT':[
    ['K','K',50,78],['H','H',58,68],['LS','LS',50,50],['LT','LT',30,50],['LG','LG',40,50],['C','C',50,50],
    ['RG','RG',60,50],['RT','RT',70,50],['LW','LW',18,50],['RW','RW',82,50],['TE','TE',76,60]
  ],
  'FG Block':[
    ['E1','E1',22,62],['T1','T1',34,62],['N','N',50,62],['T2','T2',66,62],['E2','E2',78,62],
    ['L1','L1',28,45],['L2','L2',40,45],['R1','R1',60,45],['R2','R2',72,45],['S1','S1',40,27],['S2','S2',60,27]
  ]
};

function applyDeviceMode(mode=deviceMode){
  deviceMode=mode;
  localStorage.setItem('coachLineupDeviceMode',mode);
  document.body.classList.remove('mode-mobile','mode-tablet','mode-desktop');
  if(mode==='mobile') document.body.classList.add('mode-mobile');
  if(mode==='tablet') document.body.classList.add('mode-tablet');
  if(mode==='desktop') document.body.classList.add('mode-desktop');
}
function displayYForRegular(p){
  const y=Number(p.y_pct);
  if(p.side==='offense') return 8+(y/50)*84;
  return 8+((y-50)/50)*84;
}
function storedYFromDisplay(side,displayY){
  const d=Math.max(8,Math.min(92,displayY));
  return side==='offense' ? ((d-8)/84)*50 : 50+((d-8)/84)*50;
}
function setActiveView(view){
  activeView=view;
  ['offense','defense','special'].forEach(v=>{
    const id=v==='special'?'specialTab':v+'Tab';
    $(id)?.classList.toggle('active',v===view);
  });
  $('specialUnitSelect').classList.toggle('hidden',view!=='special');
  renderField();
}
function toggleEditField(){
  editFieldMode=!editFieldMode;
  $('editFieldBtn').textContent=editFieldMode?'DONE':'EDIT FIELD';
  $('editFieldBtn').classList.toggle('activeEdit',editFieldMode);
  renderField();
}




function setFieldFullscreen(on){
  fieldFullscreen=!!on;
  document.body.classList.toggle('field-fullscreen',fieldFullscreen);
  const btn=$('fullscreenBtn');
  if(btn) btn.textContent=fieldFullscreen?'EXIT FULL SCREEN':'FULL SCREEN';

  if(fieldFullscreen){
    renderLineSelect();
    document.documentElement.requestFullscreen?.().catch(()=>{});
    try{ screen.orientation?.lock?.('landscape').catch(()=>{}); }catch(e){}
  }else{
    if(document.fullscreenElement) document.exitFullscreen?.().catch(()=>{});
    try{ screen.orientation?.unlock?.(); }catch(e){}
  }
  renderField();
}
function toggleFieldFullscreen(){ setFieldFullscreen(!fieldFullscreen); }

document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement && fieldFullscreen){
    fieldFullscreen=false;
    document.body.classList.remove('field-fullscreen');
    const btn=$('fullscreenBtn');
    if(btn) btn.textContent='FULL SCREEN';
  }
});

let appLoadInProgress=false;

async function loadAppSafe(){
  if(appLoadInProgress) return;
  appLoadInProgress=true;
  try{
    await loadApp();
  }catch(e){
    console.error('Coach Lineup load failed:',e);
    msg('Signed in, but the app could not finish loading. Please try again.');
    showAuth();
  }finally{
    appLoadInProgress=false;
  }
}

async function boot(){
  applyDeviceMode();

  const {data:{session},error}=await sb.auth.getSession();
  if(error) console.error('Session check failed:',error);

  if(session) await loadAppSafe();
  else showAuth();

  // Do not await database/API calls directly inside Supabase's auth callback.
  // Scheduling the app load outside the callback prevents the auth transition
  // from stalling after a successful password login.
  sb.auth.onAuthStateChange((_event,s)=>{
    setTimeout(()=>{
      if(s) loadAppSafe();
      else showAuth();
    },0);
  });

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(()=>{});
  }
  updateConnectionStatus();
}

async function loadApp(){
  showApp();

  // Load only memberships belonging to the current signed-in user.
  const uid=await userId();
  if(!uid){ showAuth(); return; }

  const {data,error}=await sb
    .from('team_members')
    .select('team_id,user_id,role,created_at,teams(id,name,invite_code,warning_threshold,created_by)')
    .eq('user_id',uid)
    .order('created_at',{ascending:true});
  if(error){ alert(error.message); return; }
  if(!data?.length){ openTeamModal(true); return; }

  membership=data[0];
  team=data[0].teams;
  threshold=Number(team.warning_threshold||75);
  $('teamName').textContent=team.name;
  $('teamRole').textContent=(membership.role||'coach').toUpperCase()+' • CODE '+team.invite_code;
  await loadTeamData();
  subscribe();
  showDashboard();
}



function gameStateKey(id=currentGame?.id){ return id?`coachLineupGameState:${id}`:null; }
function persistGameState(){
  const key=gameStateKey(); if(!key) return;
  const state={quarter:gameQuarter,possession,clockSeconds,clockRunning,clockEndAt};
  try{ localStorage.setItem(key,JSON.stringify(state)); }catch(e){}
}
function loadGameState(){
  gameQuarter='Q1'; possession='ours'; clockSeconds=480; clockRunning=false; clockEndAt=null;
  const key=gameStateKey(); if(key){
    try{
      const s=JSON.parse(localStorage.getItem(key)||'null');
      if(s){
        gameQuarter=s.quarter||'Q1';
        possession=s.possession==='theirs'?'theirs':'ours';
        clockSeconds=Math.max(0,Number(s.clockSeconds??480));
        clockRunning=!!s.clockRunning;
        clockEndAt=s.clockEndAt?Number(s.clockEndAt):null;
        if(clockRunning && clockEndAt){
          clockSeconds=Math.max(0,Math.ceil((clockEndAt-Date.now())/1000));
          if(clockSeconds<=0){ clockRunning=false; clockEndAt=null; }
        }
      }
    }catch(e){}
  }
  syncClockTimer();
  renderGameStrip();
}
function formatClock(sec){
  sec=Math.max(0,Math.floor(Number(sec)||0));
  return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
}
function renderGameStrip(){
  const q=$('quarterDisplay'), c=$('clockDisplay'), p=$('possessionDisplay'), b=$('clockToggleBtn');
  if(q) q.textContent=gameQuarter;
  if(c) c.textContent=formatClock(clockSeconds);
  if(p){
    p.textContent=possession==='ours'?'OUR BALL':'THEIR BALL';
    p.classList.toggle('ours',possession==='ours');
    p.classList.toggle('theirs',possession==='theirs');
  }
  if(b) b.textContent=clockRunning?'⏸ PAUSE':'▶ START';
}
function tickClock(){
  if(!clockRunning || !clockEndAt) return;
  clockSeconds=Math.max(0,Math.ceil((clockEndAt-Date.now())/1000));
  if(clockSeconds<=0){
    clockRunning=false; clockEndAt=null;
    if(clockTimer){ clearInterval(clockTimer); clockTimer=null; }
  }
  renderGameStrip(); persistGameState();
}
function syncClockTimer(){
  if(clockTimer){ clearInterval(clockTimer); clockTimer=null; }
  if(clockRunning){
    if(!clockEndAt) clockEndAt=Date.now()+clockSeconds*1000;
    clockTimer=setInterval(tickClock,250);
  }
}
function toggleGameClock(){
  if(!currentGame) return alert('Start a game first.');
  if(clockRunning){
    tickClock(); clockRunning=false; clockEndAt=null;
  }else{
    if(clockSeconds<=0) return openClockSettings();
    clockRunning=true; clockEndAt=Date.now()+clockSeconds*1000;
  }
  syncClockTimer(); persistGameState(); renderGameStrip();
}
function setQuarter(q){
  gameQuarter=q; persistGameState(); renderGameStrip();
}
function togglePossession(){
  possession=possession==='ours'?'theirs':'ours';
  persistGameState(); renderGameStrip();
}
function openClockSettings(){
  openModal(`<h2>Quarter & Game Clock</h2>
    <div class="quarterPicker">
      ${['Q1','Q2','Q3','Q4','OT'].map(q=>`<button class="${gameQuarter===q?'primary':'secondary'}" onclick="setQuarter('${q}');openClockSettings()">${q}</button>`).join('')}
    </div>
    <div class="formgrid">
      <label>Minutes<input id="clockMin" type="number" min="0" max="99" value="${Math.floor(clockSeconds/60)}"></label>
      <label>Seconds<input id="clockSec" type="number" min="0" max="59" value="${clockSeconds%60}"></label>
    </div>
    <button class="secondary full possessionSetting" onclick="togglePossession();openClockSettings()">${possession==='ours'?'🏈 OUR BALL':'THEIR BALL'}</button>
    <div class="modalFoot">
      <button class="secondary" onclick="closeModal()">CANCEL</button>
      <button class="primary" onclick="saveClockSettings()">SAVE</button>
    </div>`);
}
function saveClockSettings(){
  const m=Math.max(0,Math.min(99,Number($('clockMin').value||0)));
  const s=Math.max(0,Math.min(59,Number($('clockSec').value||0)));
  clockSeconds=Math.floor(m*60+s);
  clockRunning=false; clockEndAt=null; syncClockTimer();
  persistGameState(); renderGameStrip(); closeModal();
}
async function openAllGameHistory(){
  if(!team) return;
  const {data,error}=await sb.from('games').select('id,opponent,status,total_plays,started_at,finished_at,created_at').eq('team_id',team.id).order('created_at',{ascending:false}).limit(50);
  if(error) return alert(error.message);
  const games=data||[];
  openModal(`<h2>🏈 Game History</h2>
    <p class="muted">Your most recent games are saved here.</p>
    <div class="savedGamesList">${games.length?games.map(g=>`
      <button class="savedGameRow" onclick="openSavedGameReport('${g.id}')">
        <span><b>vs ${esc(g.opponent||'Opponent')}</b><small>${new Date(g.started_at||g.created_at).toLocaleDateString()}</small></span>
        <span>${Number(g.total_plays||0)} plays</span>
        <span class="gameStatus ${g.status==='active'?'active':''}">${String(g.status||'').toUpperCase()}</span>
      </button>`).join(''):`<div class="notice">No saved games yet.</div>`}</div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
async function openSavedGameReport(gameId){
  const {data:g,error:ge}=await sb.from('games').select('*').eq('id',gameId).single();
  if(ge) return alert(ge.message);
  const {data:plays,error:pe}=await sb.from('game_plays').select('id,play_number,line_id,note,created_at').eq('game_id',gameId).order('play_number');
  if(pe) return alert(pe.message);
  const ids=(plays||[]).map(x=>x.id);
  let participants=[];
  if(ids.length){
    const {data,error}=await sb.from('play_participants').select('game_play_id,player_id').in('game_play_id',ids);
    if(error) return alert(error.message);
    participants=data||[];
  }
  const playerCounts={};
  participants.forEach(x=>playerCounts[x.player_id]=(playerCounts[x.player_id]||0)+1);
  const rows=players.map(p=>({p,c:playerCounts[p.id]||0})).sort((a,b)=>b.c-a.c||a.p.name.localeCompare(b.p.name));
  const total=Number(g.total_plays||plays?.length||0);
  openModal(`<h2>Game Report</h2>
    <div class="notice"><b>vs ${esc(g.opponent||'Opponent')}</b><br>${new Date(g.started_at||g.created_at).toLocaleDateString()} • ${total} plays • ${String(g.status||'').toUpperCase()}</div>
    <div class="endReport">${rows.map(r=>`<div class="statRow"><span>#${esc(r.p.jersey_number)}</span><span>${esc(r.p.name)}</span><span>${r.c} plays</span><b>${total?Math.round(r.c/total*100):0}%</b></div>`).join('')}</div>
    <div class="modalFoot"><button class="secondary" onclick="openAllGameHistory()">BACK</button><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
function openInstallApp(){
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(()=>{ deferredInstallPrompt=null; });
    return;
  }
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const msg=ios
    ? 'On iPhone/iPad: tap the Share button in Safari, then choose “Add to Home Screen,” then tap Add.'
    : 'Coach Lineup can be installed from your browser menu. Look for “Install app” or “Add to Home Screen.”';
  openModal(`<h2>📲 Install Coach Lineup</h2>
    <div class="notice">${msg}</div>
    <p class="muted">Installing it gives you an app icon and a cleaner full-screen game-day experience.</p>
    <div class="modalFoot"><button class="primary" onclick="closeModal()">GOT IT</button></div>`);
}
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); deferredInstallPrompt=e;
});

function showDashboard(){
  if(currentGame) loadGameState();
  $('auth').classList.add('hidden');
  $('app').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  if(team){
    $('dashTeamName').textContent=team.name;
    $('dashTeamRole').textContent=(membership?.role||'coach').toUpperCase()+' • TEAM CODE '+team.invite_code;
  }
  if(currentGame){
    $('gameDayTitle').textContent='RESUME GAME';
    $('gameDaySub').textContent=`vs ${currentGame.opponent||'Opponent'} • ${playCount} plays recorded`;
  }else{
    $('gameDayTitle').textContent='GAME DAY';
    $('gameDaySub').textContent='Start a new game or open the field';
  }
}
function showGameScreen(){
  if(currentGame) loadGameState();
  $('dashboard').classList.add('hidden');
  $('app').classList.remove('hidden');
  renderAll();
  setActiveView(activeView);
}
function availabilityLabel(p){
  return (p?.availability_status||'active').toUpperCase();
}
function availabilityClass(p){
  const s=p?.availability_status||'active';
  return s==='injured'?'statusInjured':s==='out'?'statusOut':'statusActive';
}
function playerCanPlay(p){ return (p?.availability_status||'active')==='active'; }

function openRosterManager(){
  const unavailable=players.filter(p=>!playerCanPlay(p)).length;
  openModal(`<h2>Roster</h2>
    <p class="muted">${players.length} players${unavailable?` • ${unavailable} unavailable`:''}</p>
    <div class="rosterManage">
      ${players.map(p=>`<button class="playerPick rosterPlayer ${availabilityClass(p)}" onclick="editPlayer('${p.id}')">
        <span>#${esc(p.jersey_number)} &nbsp; ${esc(p.name)}</span>
        <span class="rosterStatus">${availabilityLabel(p)}</span>
        <small>${esc(p.primary_position||'')}</small>
      </button>`).join('')}
    </div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button><button class="primary" onclick="closeModal();openPlayerModal()">+ ADD PLAYER</button></div>`);
}
function openTeamSettings(){
  const isAdmin=roleIsAdmin();
  openModal(`<h2>Team Settings</h2>
    <div class="notice"><b>${esc(team?.name||'Team')}</b><br>Invite code:<br><span class="inviteCode">${esc(team?.invite_code||'')}</span></div>
    <p class="muted">Share this code only with coaches you want to join the team.</p>
    <label class="deviceModeLabel">Screen layout
      <select id="deviceModeSelect" onchange="applyDeviceMode(this.value)">
        <option value="auto" ${deviceMode==='auto'?'selected':''}>AUTO</option>
        <option value="mobile" ${deviceMode==='mobile'?'selected':''}>MOBILE</option>
        <option value="tablet" ${deviceMode==='tablet'?'selected':''}>TABLET</option>
        <option value="desktop" ${deviceMode==='desktop'?'selected':''}>DESKTOP</option>
      </select>
    </label>
    ${isAdmin?`<button class="primary full" onclick="openTeamAdmin()">🛡️ TEAM ADMIN</button>`:''}
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}

async function openTeamAdmin(){
  if(!roleIsAdmin()) return alert('Team Admin is restricted to owners and admins.');
  const {data,error}=await sb.rpc('get_team_admin_members',{p_team_id:team.id});
  if(error) return alert(error.message);
  const members=data||[];
  const isOwner=roleIsOwner();

  openModal(`<h2>Team Admin</h2>
    <div class="notice">
      <b>${esc(team.name)}</b><br>
      Current invite code: <span class="inviteCode">${esc(team.invite_code)}</span>
      <button class="secondary full" style="margin-top:10px" onclick="rotateInviteCode()">REGENERATE INVITE CODE</button>
    </div>

    <div class="roleGuide">
      <div><b>OWNER</b><span>Everything, including team deletion and assigning admins.</span></div>
      <div><b>ADMIN</b><span>Manage members and all football data.</span></div>
      <div><b>COACH</b><span>Edit roster, lines, plays and run games.</span></div>
      <div><b>VIEWER</b><span>View team and game information without editing.</span></div>
    </div>

    <h3>Team Members</h3>
    <div class="adminMemberList">
      ${members.map(m=>`
        <div class="adminMemberRow">
          <div>
            <b>${esc(m.email||'Unknown user')}</b>
            <small>Joined ${new Date(m.joined_at).toLocaleDateString()}</small>
          </div>
          <div class="adminMemberActions">
            ${m.role==='owner'
              ? `<span class="roleBadge owner">OWNER</span>`
              : isOwner
                ? `<select class="roleSelect" onchange="changeMemberRole('${m.user_id}',this.value)">
                    <option value="admin" ${m.role==='admin'?'selected':''}>ADMIN</option>
                    <option value="coach" ${m.role==='coach'?'selected':''}>COACH</option>
                    <option value="viewer" ${m.role==='viewer'?'selected':''}>VIEWER</option>
                  </select>`
                : `<span class="roleBadge">${esc(m.role).toUpperCase()}</span>`}
            ${m.role!=='owner' && !(membership?.role==='admin' && m.role==='admin')
              ? `<button class="dangerBtn" onclick="removeTeamMember('${m.user_id}','${esc(m.email||'this member')}')">REMOVE</button>`
              : ''}
          </div>
        </div>`).join('')}
    </div>

    ${isOwner?`
      <div class="dangerZone">
        <h3>Danger Zone</h3>
        <p>Deleting the team permanently removes its roster, games, lineups, saved templates and stats.</p>
        <button class="dangerBtn full" onclick="deleteTeamConfirm()">DELETE TEAM</button>
      </div>`:''}

    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}

async function rotateInviteCode(){
  if(!confirm('Generate a new invite code? The old code will stop working.')) return;
  const {data,error}=await sb.rpc('rotate_team_invite_code',{p_team_id:team.id});
  if(error) return alert(error.message);
  team.invite_code=data;
  $('teamRole').textContent=(membership.role||'coach').toUpperCase()+' • CODE '+team.invite_code;
  $('dashTeamRole').textContent=(membership.role||'coach').toUpperCase()+' • TEAM CODE '+team.invite_code;
  await openTeamAdmin();
}

async function changeMemberRole(userId,newRole){
  const {error}=await sb.rpc('set_team_member_role',{
    p_team_id:team.id,
    p_user_id:userId,
    p_role:newRole
  });
  if(error) return alert(error.message);
  await openTeamAdmin();
}

async function removeTeamMember(userId,email){
  if(!confirm(`Remove ${email} from this team? They will immediately lose access to team data.`)) return;
  const {error}=await sb.rpc('remove_team_member',{
    p_team_id:team.id,
    p_user_id:userId
  });
  if(error) return alert(error.message);
  await openTeamAdmin();
}

async function deleteTeamConfirm(){
  const typed=window.prompt(`Type the exact team name to permanently delete it:\n\n${team.name}`);
  if(typed===null) return;
  if(typed!==team.name) return alert('Team name did not match. Nothing was deleted.');
  if(!confirm('This permanently deletes the team and all of its football data. Continue?')) return;
  const {error}=await sb.rpc('delete_team_safe',{
    p_team_id:team.id,
    p_confirm_name:typed
  });
  if(error) return alert(error.message);
  team=null; membership=null; lines=[]; players=[]; positions=[]; assignments=[]; currentGame=null; counts={}; playCount=0;
  closeModal();
  await loadApp();
}

async function ensureDefaults(){
  if(!lines.length && roleCanEdit()){
    const names=['RED LINE','BLUE LINE','GREEN LINE','GOLD LINE','SCOUT LINE'];
    const colors=['#ef4444','#2584ff','#22c55e','#eab308','#a855f7'];
    const rows=names.map((name,i)=>({team_id:team.id,name,color:colors[i],sort_order:i}));
    const r=await sb.from('lines').insert(rows).select();
    if(r.error) throw r.error;
    lines=r.data||[];
  }

  if(roleCanEdit()){
    // Add any missing standard positions (including the new TE) without disturbing custom labels/locations.
    const existing=new Set(positions.map(p=>`${p.side}:${p.slot_key}`));
    const missing=DEFAULT_POS.filter(x=>!existing.has(`${x[1]}:${x[2]}`)).map(x=>({
      team_id:team.id,side:x[1],slot_key:x[2],label:x[3],x_pct:x[4],y_pct:x[5]
    }));
    if(missing.length){
      const r=await sb.from('position_labels').insert(missing).select();
      if(r.error) throw r.error;
      positions=[...positions,...(r.data||[])];
    }
    // Standardize the middle linebacker label while keeping its saved location.
    const mlb=positions.find(p=>p.side==='defense'&&p.slot_key==='LBC');
    if(mlb && mlb.label==='LB (Left Center)'){
      await sb.from('position_labels').update({label:'MLB'}).eq('id',mlb.id);
      mlb.label='MLB';
    }
  }

  // Only display the 11 approved offense and 11 approved defense slots.
  positions=positions.filter(p=>ALLOWED_REGULAR_SLOTS.has(p.slot_key));

  await loadSpecialTeams();
  if(!specialUnits.length && roleCanEdit()){
    const names=Object.keys(SPECIAL_DEFAULTS);
    const r=await sb.from('special_team_units').insert(names.map((name,i)=>({team_id:team.id,name,sort_order:i}))).select();
    if(r.error) throw r.error;
    specialUnits=r.data||[];
    for(const unit of specialUnits){
      const defs=SPECIAL_DEFAULTS[unit.name]||SPECIAL_DEFAULTS['Kickoff'];
      const sr=await sb.from('special_team_slots').insert(defs.map((x,i)=>({
        unit_id:unit.id,slot_key:x[0],label:x[1],x_pct:x[2],y_pct:x[3],sort_order:i
      }))).select();
      if(sr.error) throw sr.error;
    }
    await loadSpecialTeams();
  }
}
async function loadTeamData(){
  try{
    const [p,l,pos,g,pb]=await Promise.all([
      sb.from('players').select('*').eq('team_id',team.id).eq('active',true).order('jersey_number'),
      sb.from('lines').select('*').eq('team_id',team.id).order('sort_order'),
      sb.from('position_labels').select('*').eq('team_id',team.id).order('side').order('slot_key'),
      sb.from('games').select('*').eq('team_id',team.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle(),
      sb.from('playbook_plays').select('*').eq('team_id',team.id).order('category').order('sort_order').order('created_at')
    ]);
    for(const r of [p,l,pos,g,pb]) if(r.error) throw r.error;
    players=p.data||[]; lines=l.data||[]; positions=pos.data||[]; playbookPlays=pb.data||[];
    await ensureDefaults();
    if(lines[currentLine]===undefined) currentLine=0;
    currentGame=g.data||null;
    playCount=currentGame?.total_plays||0;
    if(currentGame) threshold=Number(currentGame.warning_threshold||team.warning_threshold||75);
    await loadAssignments();
    await loadCounts();
    renderAll();
    if(players.length===0 && roleCanEdit()) openRosterSetup();
  }catch(e){ alert(e.message||String(e)); }
}


async function loadSpecialTeams(){
  const {data:u,error:ue}=await sb.from('special_team_units').select('*').eq('team_id',team.id).order('sort_order');
  if(ue){ console.error(ue); specialUnits=[]; return; }
  specialUnits=u||[];
  if(!specialUnits.length){ specialSlots=[]; specialAssignments=[]; return; }
  const ids=specialUnits.map(x=>x.id);
  const [{data:s,error:se},{data:a,error:ae}]=await Promise.all([
    sb.from('special_team_slots').select('*').in('unit_id',ids).order('sort_order'),
    sb.from('special_team_assignments').select('*').in('unit_id',ids)
  ]);
  if(se||ae){ console.error(se||ae); return; }
  specialSlots=s||[];
  specialAssignments=a||[];
  if(currentSpecialUnit>=specialUnits.length) currentSpecialUnit=0;
}

async function loadAssignments(){
  if(!lines.length){ assignments=[]; return; }
  const ids=lines.map(l=>l.id);
  const {data,error}=await sb.from('line_assignments').select('*').in('line_id',ids);
  if(error){ console.error(error); assignments=[]; return; }
  assignments=data||[];
}

async function loadCounts(){
  counts={};
  if(!currentGame) return;
  const {data:plays,error}=await sb.from('game_plays').select('id').eq('game_id',currentGame.id);
  if(error) return;
  const playIds=(plays||[]).map(x=>x.id);
  if(!playIds.length) return;
  const {data:pp}=await sb.from('play_participants').select('player_id').in('play_id',playIds);
  (pp||[]).forEach(r=>counts[r.player_id]=(counts[r.player_id]||0)+1);
}

function renderAll(){
  renderLineSelect(); renderPlayers(); renderSpecialUnitSelect(); renderField(); renderSummary();
}

function renderLineSelect(){
  $('lineSelect').innerHTML=lines.map((l,i)=>`<option value="${i}" ${i===currentLine?'selected':''}>${esc(l.name)}</option>`).join('');
  $('lineChips').innerHTML=lines.map((l,i)=>`<button class="chip lineChip ${i===currentLine?'activeLine':''}" style="border-color:${esc(l.color)};${i===currentLine?`background:${esc(l.color)}`:''}" onclick="setLine(${i})">${i+1} ${esc(l.name)}</button>`).join('');
  const selected=lines[currentLine];
  if(selected){
    $('lineSelect').style.backgroundColor=selected.color||'#2584ff';
    $('lineSelect').style.borderColor=selected.color||'#2584ff';
    $('lineSelect').style.color='#fff';
    const badge=$('fullscreenLineBadge');
    if(badge){
      badge.textContent=selected.name||`LINE ${currentLine+1}`;
      badge.style.backgroundColor=selected.color||'#2584ff';
      badge.style.borderColor=selected.color||'#2584ff';
    }
  }
}


function renderSpecialUnitSelect(){
  $('specialUnitSelect').innerHTML=specialUnits.map((u,i)=>`<option value="${i}" ${i===currentSpecialUnit?'selected':''}>${esc(u.name)}</option>`).join('');
}

function renderPlayers(){
  const q=($('search').value||'').toLowerCase();
  $('players').innerHTML=players
    .filter(p=>(`${p.name} ${p.jersey_number} ${p.primary_position||''} ${availabilityLabel(p)}`).toLowerCase().includes(q))
    .map(p=>`<div class="player ${availabilityClass(p)}">
      <span class="num">#${esc(p.jersey_number)}</span>
      <span>${esc(p.name)} <span class="miniStatus">${availabilityLabel(p)}</span><br><small class="muted">${esc(p.primary_position||'')}</small></span>
      ${roleCanEdit()?`<button class="iconBtn" onclick="editPlayer('${p.id}')">✎</button>`:''}
    </div>`).join('');
}

function currentLineAssignments(){
  const line=lines[currentLine]; if(!line) return [];
  return assignments.filter(a=>a.line_id===line.id);
}


function ensureFieldDecor(){
  const f=$('field');
  if(!f || f.querySelector('.fieldDecor')) return;
  const d=document.createElement('div');
  d.className='fieldDecor';
  const nums=['10','20','30','40','50','40','30','20','10'];
  d.innerHTML=`
    <div class="fieldLogoMark">COACH <span>LINEUP</span></div>
    ${nums.map((n,i)=>`<span class="yardNumber leftNum" style="top:${10+i*10}%">${n}</span>`).join('')}
    ${nums.map((n,i)=>`<span class="yardNumber rightNum" style="top:${10+i*10}%">${n}</span>`).join('')}
    <div class="hashCol hashLeft"></div>
    <div class="hashCol hashRight"></div>`;
  f.prepend(d);
}

function renderField(){
  const f=$('field');
  ensureFieldDecor();
  f.querySelectorAll('.slot').forEach(x=>x.remove());
  f.classList.toggle('editing',editFieldMode);
  f.classList.remove('view-offense','view-defense','view-special');
  f.classList.add('view-'+activeView);

  const offenseTag=f.querySelector('.tag.offense');
  const defenseTag=f.querySelector('.tag.defense');
  if(offenseTag) offenseTag.style.display=activeView==='offense'?'block':'none';
  if(defenseTag) defenseTag.style.display=activeView==='defense'?'block':'none';

  if(activeView==='special'){
    const unit=specialUnits[currentSpecialUnit];
    if(!unit) return;
    const slots=specialSlots.filter(s=>s.unit_id===unit.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    const map=new Map(specialAssignments.filter(a=>a.unit_id===unit.id).map(a=>[a.slot_id,players.find(p=>p.id===a.player_id)]));
    slots.forEach(slot=>{
      const pl=map.get(slot.id);
      const el=document.createElement('div');
      el.className='slot specialSlot '+(pl?availabilityClass(pl):'');
      el.style.left=Number(slot.x_pct)+'%';
      el.style.top=Number(slot.y_pct)+'%';
      el.innerHTML=`${esc(slot.label)}<small>${pl?(displayMode==='names'?esc(pl.name):'#'+esc(pl.jersey_number)):'OPEN'}${pl&&!playerCanPlay(pl)?` • ${availabilityLabel(pl)}`:''}</small>`;
      if(editFieldMode && roleCanEdit()) makeDraggable(el,slot,'special');
      else if(roleCanEdit() && !gameModeLocked) el.onclick=()=>openSpecialAssignment(slot.id);
      f.appendChild(el);
    });
    return;
  }

  const map={};
  currentLineAssignments().forEach(a=>{ map[a.position_label_id]=players.find(p=>p.id===a.player_id); });
  positions.filter(p=>p.side===activeView).forEach(p=>{
    const pl=map[p.id];
    const el=document.createElement('div');
    el.className='slot '+(p.side==='defense'?'def ':'')+(pl?availabilityClass(pl):'');
    el.style.left=Number(p.x_pct)+'%';
    el.style.top=displayYForRegular(p)+'%';
    el.innerHTML=`${esc(p.label)}<small>${pl?(displayMode==='names'?esc(pl.name):'#'+esc(pl.jersey_number)):'OPEN'}${pl&&!playerCanPlay(pl)?` • ${availabilityLabel(pl)}`:''}</small>`;
    if(editFieldMode && roleCanEdit()) makeDraggable(el,p,'regular');
    else if(roleCanEdit() && !gameModeLocked) el.onclick=()=>openLineupEditor(p.id);
    f.appendChild(el);
  });
}

function makeDraggable(el,item,type){
  el.classList.add('draggable');
  el.style.touchAction='none';
  el.onpointerdown=(ev)=>{
    ev.preventDefault();
    el.setPointerCapture?.(ev.pointerId);
    const field=$('field');
    const rect=field.getBoundingClientRect();
    const move=(e)=>{
      const x=Math.max(4,Math.min(96,((e.clientX-rect.left)/rect.width)*100));
      const y=Math.max(8,Math.min(92,((e.clientY-rect.top)/rect.height)*100));
      el.style.left=x+'%'; el.style.top=y+'%';
    };
    const up=async(e)=>{
      el.removeEventListener('pointermove',move);
      el.removeEventListener('pointerup',up);
      const x=parseFloat(el.style.left), displayY=parseFloat(el.style.top);
      if(type==='regular'){
        const y=storedYFromDisplay(item.side,displayY);
        item.x_pct=x; item.y_pct=y;
        const {error}=await sb.from('position_labels').update({x_pct:x,y_pct:y}).eq('id',item.id);
        if(error) alert(error.message);
      }else{
        item.x_pct=x; item.y_pct=displayY;
        const {error}=await sb.from('special_team_slots').update({x_pct:x,y_pct:displayY}).eq('id',item.id);
        if(error) alert(error.message);
      }
      renderField();
    };
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',up);
  };
}

async function openSpecialAssignment(slotId){
  const unit=specialUnits[currentSpecialUnit];
  const slot=specialSlots.find(s=>s.id===slotId);
  const existing=specialAssignments.find(a=>a.unit_id===unit.id&&a.slot_id===slotId);
  const onField=playersCurrentlyOnField();
  openModal(`<h2>${esc(unit.name)} — ${esc(slot?.label||'Position')}</h2>
    <p class="muted">Red = already used in this special-teams unit. INJURED/OUT players cannot be selected.</p>
    <button class="secondary full" onclick="clearSpecialAssignment('${slotId}')">CLEAR POSITION</button>
    <div class="picker">
      ${players.map(p=>{
        const used=onField.has(p.id) && existing?.player_id!==p.id;
        const unavailable=!playerCanPlay(p);
        const disabled=used||unavailable;
        return `<button class="playerPick ${existing?.player_id===p.id?'selected':''} ${used?'onFieldPlayer':''} ${availabilityClass(p)}" ${disabled?'disabled':''} onclick="assignSpecialPlayer('${slotId}','${p.id}')">
          #${esc(p.jersey_number)} ${esc(p.name)}
          ${used?' <span class="usedTag">ALREADY USED</span>':''}
          ${unavailable?` <span class="usedTag">${availabilityLabel(p)}</span>`:''}
        </button>`;
      }).join('')}
    </div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
async function clearSpecialAssignment(slotId){
  const unit=specialUnits[currentSpecialUnit];
  const {error}=await sb.from('special_team_assignments').delete().eq('unit_id',unit.id).eq('slot_id',slotId);
  if(error) return alert(error.message);
  closeModal(); await loadSpecialTeams(); renderField();
}
async function assignSpecialPlayer(slotId,playerId){
  const unit=specialUnits[currentSpecialUnit];
  const player=players.find(p=>p.id===playerId);
  if(!playerCanPlay(player)) return alert(`${player?.name||'This player'} is marked ${availabilityLabel(player)} and cannot be assigned.`);
  const duplicate=specialAssignments.find(a=>a.unit_id===unit.id&&a.player_id===playerId&&a.slot_id!==slotId);
  if(duplicate){
    const ds=specialSlots.find(s=>s.id===duplicate.slot_id);
    return alert(`${player.name} is already assigned to ${ds?.label||'another position'} in ${unit.name}.`);
  }
  const {error}=await sb.from('special_team_assignments').upsert({unit_id:unit.id,slot_id:slotId,player_id:playerId},{onConflict:'unit_id,slot_id'});
  if(error) return alert(error.message);
  closeModal(); await loadSpecialTeams(); renderField();
}

function renderSummary(){
  $('playNo').textContent=playCount;
  const over=players.filter(p=>{
    const pct=playCount?Math.round(((counts[p.id]||0)/playCount)*100):0;
    return pct>=threshold;
  });
  $('summary').textContent=`PLAY ${playCount} • ${over.length?`⚠️ ${over.length} OVER ${threshold}%`:'✓ PLAYING TIME OK'}`;
  const warningEl=$('warning');
  warningEl.textContent=over.length?'⚠️ PLAYING-TIME ALERT':'✓ ALL GOOD';
  warningEl.classList.toggle('hasAlert',over.length>0);
  warningEl.setAttribute('role','button');
  warningEl.setAttribute('tabindex','0');
  warningEl.setAttribute('aria-label',over.length
    ? `Playing-time alert. ${over.length} player${over.length===1?'':'s'} at or above ${threshold} percent. Tap for details.`
    : `Playing time is okay. Tap for details.`);
}

function setLine(i){ currentLine=i; renderLineSelect(); renderField(); }

function openTeamModal(first=false){
  openModal(`<h2>${first?'Create or Join a Team':'Team'}</h2>
    ${team?`<div class="notice"><b>${esc(team.name)}</b><br>Invite code: <b>${esc(team.invite_code)}</b></div>`:''}
    <div class="formgrid">
      <label>New team name<input id="newTeamName" placeholder="Team name"></label>
      <label>Join code<input id="joinCode" placeholder="8-character code"></label>
    </div>
    <div class="modalFoot">
      <button class="secondary" onclick="joinTeam()">JOIN TEAM</button>
      <button class="primary" onclick="createTeam()">CREATE TEAM</button>
      ${!first?`<button class="secondary" onclick="closeModal()">CLOSE</button>`:''}
    </div>`);
}

async function createTeam(){
  const name=$('newTeamName').value.trim(); if(!name) return alert('Enter a team name.');
  const uid=await userId();
  const {data,error}=await sb.from('teams').insert({name,created_by:uid}).select().single();
  if(error){ alert(error.message); return; }
  closeModal(); team=data; await loadApp();
}

async function joinTeam(){
  const code=$('joinCode').value.trim(); if(!code) return alert('Enter the team invite code.');
  const {error}=await sb.rpc('join_team_by_code',{p_invite_code:code});
  if(error){ alert(error.message); return; }
  closeModal(); await loadApp();
}

function openRosterSetup(){
  openModal(`<h2>Team Roster Setup</h2>
    <p class="muted">Enter players and jersey numbers. You can edit them later.</p>
    <div id="rosterRows"></div>
    <button class="secondary full" onclick="addRosterRow()">+ ADD PLAYER</button>
    <div class="modalFoot"><button class="primary" onclick="saveRosterSetup()">SAVE ROSTER</button></div>`);
  for(let i=0;i<11;i++) addRosterRow();
}
function addRosterRow(name='',num='',pos=''){
  const d=document.createElement('div'); d.className='formgrid rosterRow';
  d.innerHTML=`<label>Name<input class="rn" value="${esc(name)}"></label>
    <label>Jersey #<input class="rnum" value="${esc(num)}"></label>
    <label>Position<input class="rpos" value="${esc(pos)}"></label>`;
  $('rosterRows').appendChild(d);
}
async function saveRosterSetup(){
  const rows=[...document.querySelectorAll('.rosterRow')].map(r=>({
    name:r.querySelector('.rn').value.trim(),
    jersey_number:r.querySelector('.rnum').value.trim(),
    primary_position:r.querySelector('.rpos').value.trim(),
    team_id:team.id
  })).filter(x=>x.name&&x.jersey_number);
  if(!rows.length) return alert('Add at least one player.');
  const {error}=await sb.from('players').insert(rows);
  if(error) return alert(error.message);
  closeModal(); await loadTeamData();
}

function openPlayerModal(p=null){
  const status=p?.availability_status||'active';
  openModal(`<h2>${p?'Edit':'Add'} Player</h2>
  <div class="formgrid">
    <label>Jersey #<input id="pmNum" value="${esc(p?.jersey_number||'')}"></label>
    <label>Name<input id="pmName" value="${esc(p?.name||'')}"></label>
    <label>Primary Position<input id="pmPos" value="${esc(p?.primary_position||'')}"></label>
    <label>Player Status
      <select id="pmStatus">
        <option value="active" ${status==='active'?'selected':''}>ACTIVE — Can play</option>
        <option value="injured" ${status==='injured'?'selected':''}>INJURED — Do not play</option>
        <option value="out" ${status==='out'?'selected':''}>OUT — Unavailable</option>
      </select>
    </label>
  </div>
  <div class="notice statusHelp">INJURED and OUT players stay on the roster and keep their stats, but Coach Lineup will block them from being used on a new play.</div>
  <div class="modalFoot">
    <button class="secondary" onclick="closeModal()">CANCEL</button>
    <button class="primary" onclick="savePlayer('${p?.id||''}')">SAVE</button>
  </div>`);
}
function editPlayer(id){ openPlayerModal(players.find(p=>p.id===id)); }
async function savePlayer(id){
  const payload={
    team_id:team.id,
    jersey_number:$('pmNum').value.trim(),
    name:$('pmName').value.trim(),
    primary_position:$('pmPos').value.trim(),
    availability_status:$('pmStatus').value
  };
  if(!payload.jersey_number||!payload.name) return alert('Enter a name and jersey number.');
  const r=id?await sb.from('players').update(payload).eq('id',id):await sb.from('players').insert(payload);
  if(r.error) return alert(r.error.message);
  closeModal(); await loadTeamData();
}

function openLines(){
  openModal(`<h2>Manage Lines</h2>
    <p class="muted">Add as many lines as you need. Deleting a line removes its current assignments, but does not delete roster players or old game statistics.</p>
    <div class="manageLineList">
      ${lines.map((l,i)=>`<div class="manageLineRow">
        <label>Line ${i+1}<input id="ln${i}" value="${esc(l.name)}"></label>
        <label>Color<input id="lc${i}" type="color" value="${/^#[0-9a-f]{6}$/i.test(l.color)?l.color:'#2584ff'}"></label>
        <button class="dangerBtn lineDeleteBtn" onclick="deleteLine('${l.id}','${esc(l.name)}')">DELETE</button>
      </div>`).join('')}
    </div>
    <div class="addLineBox">
      <label>New line name<input id="newLineName" placeholder="Example: Gold Line"></label>
      <label>Color<input id="newLineColor" type="color" value="#f2b134"></label>
      <button class="primary" onclick="addLine()">+ ADD LINE</button>
    </div>
    <div class="lineTemplateActions">
      <button class="secondary" onclick="promptSaveLineup()">💾 SAVE CURRENT AS TEMPLATE</button>
      <button class="secondary" onclick="openSavedLineups()">OPEN SAVED LINEUPS</button>
    </div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CANCEL</button><button class="primary" onclick="saveLines()">SAVE CHANGES</button></div>`);
}
async function addLine(){
  const name=$('newLineName').value.trim();
  const color=$('newLineColor').value||'#2584ff';
  if(!name) return alert('Enter a name for the new line.');
  const sort=Math.max(-1,...lines.map(l=>Number(l.sort_order||0)))+1;
  const {error}=await sb.from('lines').insert({team_id:team.id,name,color,sort_order:sort});
  if(error) return alert(error.message);
  await loadTeamData();
  openLines();
}
async function deleteLine(id,name){
  if(lines.length<=1) return alert('Keep at least one line on the team.');
  if(!confirm(`Delete "${name}"? Current assignments on this line will be removed.`)) return;
  const {error}=await sb.from('lines').delete().eq('id',id);
  if(error) return alert(error.message);
  currentLine=0;
  await loadTeamData();
  openLines();
}
async function saveLines(){
  for(let i=0;i<lines.length;i++){
    const {error}=await sb.from('lines').update({name:$('ln'+i).value.trim()||`Line ${i+1}`,color:$('lc'+i).value}).eq('id',lines[i].id);
    if(error) return alert(error.message);
  }
  closeModal(); await loadTeamData();
}

function openPositions(){
  openModal(`<h2>Edit Position Labels</h2>
    <div class="formgrid">${positions.map((p,i)=>`<label>${esc(p.slot_key)}<input id="pos${i}" value="${esc(p.label)}"></label>`).join('')}</div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CANCEL</button><button class="primary" onclick="savePositions()">SAVE</button></div>`);
}
async function savePositions(){
  for(let i=0;i<positions.length;i++){
    const label=$('pos'+i).value.trim()||positions[i].slot_key;
    const {error}=await sb.from('position_labels').update({label}).eq('id',positions[i].id);
    if(error) return alert(error.message);
  }
  closeModal(); await loadTeamData();
}


function playersCurrentlyOnField(){
  if(activeView==='special'){
    const unit=specialUnits[currentSpecialUnit];
    if(!unit) return new Set();
    return new Set(
      specialAssignments
        .filter(a=>a.unit_id===unit.id)
        .map(a=>a.player_id)
    );
  }
  const activePositions=new Set(positions.filter(p=>p.side===activeView).map(p=>p.id));
  return new Set(
    currentLineAssignments()
      .filter(a=>activePositions.has(a.position_label_id))
      .map(a=>a.player_id)
  );
}

function openLineupEditor(positionId){
  const pos=positions.find(p=>p.id===positionId);
  const existing=currentLineAssignments().find(a=>a.position_label_id===positionId);
  const onField=playersCurrentlyOnField();
  openModal(`<h2>${esc(pos?.label||'Position')} — Assign Player</h2>
    <p class="muted">Red = already used in this ${activeView.toUpperCase()} line. INJURED/OUT players cannot be selected.</p>
    <div class="picker">
      <button class="secondary full" onclick="clearAssignment('${positionId}')">CLEAR POSITION</button>
      ${players.map(p=>{
        const used=onField.has(p.id) && existing?.player_id!==p.id;
        const unavailable=!playerCanPlay(p);
        const disabled=used||unavailable;
        return `<button class="playerPick ${existing?.player_id===p.id?'selected':''} ${used?'onFieldPlayer':''} ${availabilityClass(p)}" ${disabled?'disabled':''} onclick="assignPlayer('${positionId}','${p.id}')">
          #${esc(p.jersey_number)} ${esc(p.name)}
          ${used?' <span class="usedTag">ALREADY USED</span>':''}
          ${unavailable?` <span class="usedTag">${availabilityLabel(p)}</span>`:''}
        </button>`;
      }).join('')}
    </div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
async function clearAssignment(positionId){
  const line=lines[currentLine]; if(!line) return;
  const {error}=await sb.from('line_assignments').delete().eq('line_id',line.id).eq('position_label_id',positionId);
  if(error) return alert(error.message);
  closeModal(); await loadAssignments(); renderField();
}
async function assignPlayer(positionId,playerId){
  const line=lines[currentLine]; if(!line) return;
  const player=players.find(p=>p.id===playerId);
  if(!playerCanPlay(player)) return alert(`${player?.name||'This player'} is marked ${availabilityLabel(player)} and cannot be assigned.`);
  const side=positions.find(p=>p.id===positionId)?.side;
  const sidePos=new Set(positions.filter(p=>p.side===side).map(p=>p.id));
  const duplicate=currentLineAssignments().find(a=>a.player_id===playerId && a.position_label_id!==positionId && sidePos.has(a.position_label_id));
  if(duplicate){
    const dp=positions.find(p=>p.id===duplicate.position_label_id);
    return alert(`${player.name} is already assigned to ${dp?.label||'another position'} on this ${side?.toUpperCase()||''} line.`);
  }
  await sb.from('line_assignments').delete().eq('line_id',line.id).eq('position_label_id',positionId);
  const {error}=await sb.from('line_assignments').insert({line_id:line.id,player_id:playerId,position_label_id:positionId});
  if(error) return alert(error.message.includes('already assigned')?error.message:'Could not assign player: '+error.message);
  closeModal(); await loadAssignments(); renderField();
}


async function snapshotCurrentLineup(name, sourceGameId=null, isAuto=false, silent=false){
  if(!team || !roleCanEdit()) return null;
  const uid=await userId();
  const cleanName=(name||'Saved Lineup').trim()||'Saved Lineup';

  const {data:tpl,error:tplErr}=await sb.from('lineup_templates').insert({
    team_id:team.id,
    name:cleanName,
    source_game_id:sourceGameId,
    is_auto:isAuto,
    created_by:uid
  }).select().single();
  if(tplErr){
    if(!silent) alert(tplErr.message);
    return null;
  }

  try{
    const currentLines=[...lines].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    const {data:templateLines,error:lineErr}=await sb.from('lineup_template_lines').insert(
      currentLines.map(l=>({
        template_id:tpl.id,
        name:l.name,
        color:l.color||'#2584ff',
        sort_order:l.sort_order||0
      }))
    ).select();
    if(lineErr) throw lineErr;

    const templateLineBySort=new Map((templateLines||[]).map(l=>[Number(l.sort_order||0),l]));
    const posById=new Map(positions.map(p=>[p.id,p]));
    const lineById=new Map(currentLines.map(l=>[l.id,l]));
    const rows=[];

    for(const a of assignments){
      const liveLine=lineById.get(a.line_id);
      const pos=posById.get(a.position_label_id);
      const templateLine=liveLine?templateLineBySort.get(Number(liveLine.sort_order||0)):null;
      if(!templateLine || !pos) continue;
      rows.push({
        template_line_id:templateLine.id,
        player_id:a.player_id,
        slot_key:pos.slot_key,
        position_label:a.custom_position_label||pos.label||pos.slot_key,
        sort_order:a.sort_order||0
      });
    }

    if(rows.length){
      const {error:aErr}=await sb.from('lineup_template_assignments').insert(rows);
      if(aErr) throw aErr;
    }

    // Save movable offense/defense position labels and coordinates.
    const posRows=positions.map(p=>({
      template_id:tpl.id,side:p.side,slot_key:p.slot_key,label:p.label,
      x_pct:Number(p.x_pct),y_pct:Number(p.y_pct)
    }));
    if(posRows.length){
      const {error:pErr}=await sb.from('lineup_template_positions').insert(posRows);
      if(pErr) throw pErr;
    }

    // Save all Special Teams units, layouts and player assignments.
    for(const u of specialUnits){
      const {data:tu,error:tuErr}=await sb.from('lineup_template_special_units').insert({
        template_id:tpl.id,name:u.name,sort_order:u.sort_order||0
      }).select().single();
      if(tuErr) throw tuErr;
      const assignBySlot=new Map(specialAssignments.filter(a=>a.unit_id===u.id).map(a=>[a.slot_id,a.player_id]));
      const slots=specialSlots.filter(s=>s.unit_id===u.id);
      if(slots.length){
        const {error:tsErr}=await sb.from('lineup_template_special_slots').insert(slots.map(s=>({
          template_unit_id:tu.id,slot_key:s.slot_key,label:s.label,x_pct:Number(s.x_pct),y_pct:Number(s.y_pct),
          sort_order:s.sort_order||0,player_id:assignBySlot.get(s.id)||null
        })));
        if(tsErr) throw tsErr;
      }
    }

    if(!silent) alert(`Saved "${cleanName}".`);
    return tpl;
  }catch(e){
    await sb.from('lineup_templates').delete().eq('id',tpl.id);
    if(!silent) alert(e.message||String(e));
    return null;
  }
}

async function promptSaveLineup(){
  const suggested=currentGame
    ? `vs ${currentGame.opponent||'Opponent'}`
    : `Lineup ${new Date().toLocaleDateString()}`;
  const name=window.prompt('Name this saved lineup:',suggested);
  if(!name) return;
  await snapshotCurrentLineup(name,null,false,false);
}

async function getSavedLineups(){
  const {data,error}=await sb.from('lineup_templates')
    .select('id,name,source_game_id,is_auto,created_at')
    .eq('team_id',team.id)
    .order('created_at',{ascending:false});
  if(error){ alert(error.message); return []; }
  return data||[];
}

async function openSavedLineups(){
  const templates=await getSavedLineups();
  const manual=templates.filter(t=>!t.is_auto);
  openModal(`<h2>Saved Lineups</h2>
    <p class="muted">Save today's setup once, then reuse it for future games. Loading a saved lineup changes the current line assignments, but it does not copy old game stats or play counts.</p>
    <button class="primary full" onclick="promptSaveLineup()">💾 SAVE CURRENT LINEUP</button>
    <div class="savedList">
      ${manual.length?manual.map(t=>`
        <div class="savedRow">
          <button class="playerPick" onclick="loadSavedLineup('${t.id}','${esc(t.name)}')">
            <b>${esc(t.name)}</b><small>${new Date(t.created_at).toLocaleDateString()}</small>
          </button>
          <button class="dangerBtn" onclick="deleteSavedLineup('${t.id}')">DELETE</button>
        </div>`).join(''):`<div class="notice">No saved lineup templates yet. Tap <b>Save Current Lineup</b> to create one.</div>`}
    </div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}

async function deleteSavedLineup(id){
  if(!confirm('Delete this saved lineup?')) return;
  const {error}=await sb.from('lineup_templates').delete().eq('id',id);
  if(error) return alert(error.message);
  await openSavedLineups();
}

async function applyLineupTemplate(templateId, label='Saved lineup'){
  const {data:tLines,error:lErr}=await sb.from('lineup_template_lines')
    .select('*').eq('template_id',templateId).order('sort_order');
  if(lErr) return alert(lErr.message);
  if(!tLines?.length) return alert('This saved lineup is empty.');

  const tLineIds=tLines.map(x=>x.id);
  const {data:tAssignments,error:aErr}=await sb.from('lineup_template_assignments')
    .select('*').in('template_line_id',tLineIds);
  if(aErr) return alert(aErr.message);

  let current=[...lines].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

  // Create any missing line slots so a saved lineup can be restored completely.
  for(const tl of tLines){
    if(!current.find(l=>Number(l.sort_order||0)===Number(tl.sort_order||0))){
      const {data:newLine,error:newLineErr}=await sb.from('lines').insert({
        team_id:team.id,
        name:tl.name,
        color:tl.color||'#2584ff',
        sort_order:tl.sort_order||0
      }).select().single();
      if(newLineErr) return alert(newLineErr.message);
      current.push(newLine);
    }
  }
  current=current.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

  for(const tl of tLines){
    const live=current.find(l=>Number(l.sort_order||0)===Number(tl.sort_order||0));
    if(!live) continue;
    const {error}=await sb.from('lines').update({
      name:tl.name,
      color:tl.color||'#2584ff'
    }).eq('id',live.id);
    if(error) return alert(error.message);
  }

  const currentLineIds=current.map(l=>l.id);
  if(currentLineIds.length){
    const {error:delErr}=await sb.from('line_assignments').delete().in('line_id',currentLineIds);
    if(delErr) return alert(delErr.message);
  }

  const liveLineBySort=new Map(current.map(l=>[Number(l.sort_order||0),l]));
  const templateLineById=new Map(tLines.map(l=>[l.id,l]));
  const posBySlot=new Map(positions.map(p=>[p.slot_key,p]));
  const activePlayerIds=new Set(players.map(p=>p.id));
  const insertRows=[];

  for(const ta of (tAssignments||[])){
    if(!activePlayerIds.has(ta.player_id)) continue;
    const tl=templateLineById.get(ta.template_line_id);
    const liveLine=tl?liveLineBySort.get(Number(tl.sort_order||0)):null;
    const pos=posBySlot.get(ta.slot_key);
    if(!liveLine || !pos) continue;
    insertRows.push({
      line_id:liveLine.id,
      player_id:ta.player_id,
      position_label_id:pos.id,
      custom_position_label:ta.position_label||null,
      sort_order:ta.sort_order||0
    });
  }

  if(insertRows.length){
    const {error:insErr}=await sb.from('line_assignments').insert(insertRows);
    if(insErr) return alert(insErr.message);
  }

  // Restore saved offense/defense position coordinates.
  const {data:tPos,error:tPosErr}=await sb.from('lineup_template_positions').select('*').eq('template_id',templateId);
  if(tPosErr) return alert(tPosErr.message);
  for(const tp of (tPos||[])){
    const live=positions.find(p=>p.side===tp.side&&p.slot_key===tp.slot_key);
    if(live){
      const {error}=await sb.from('position_labels').update({label:tp.label,x_pct:tp.x_pct,y_pct:tp.y_pct}).eq('id',live.id);
      if(error) return alert(error.message);
    }
  }

  // Restore saved Special Teams layouts and assignments when present.
  const {data:tUnits,error:tUErr}=await sb.from('lineup_template_special_units').select('*').eq('template_id',templateId).order('sort_order');
  if(tUErr) return alert(tUErr.message);
  if(tUnits?.length){
    await loadSpecialTeams();
    for(const tu of tUnits){
      let liveUnit=specialUnits.find(u=>u.name===tu.name);
      if(!liveUnit){
        const r=await sb.from('special_team_units').insert({team_id:team.id,name:tu.name,sort_order:tu.sort_order||0}).select().single();
        if(r.error) return alert(r.error.message);
        liveUnit=r.data;
      }
      const {data:tSlots,error:tSErr}=await sb.from('lineup_template_special_slots').select('*').eq('template_unit_id',tu.id).order('sort_order');
      if(tSErr) return alert(tSErr.message);
      const {data:liveSlots}=await sb.from('special_team_slots').select('*').eq('unit_id',liveUnit.id);
      for(const ts of (tSlots||[])){
        let ls=(liveSlots||[]).find(s=>s.slot_key===ts.slot_key);
        if(!ls){
          const r=await sb.from('special_team_slots').insert({unit_id:liveUnit.id,slot_key:ts.slot_key,label:ts.label,x_pct:ts.x_pct,y_pct:ts.y_pct,sort_order:ts.sort_order||0}).select().single();
          if(r.error) return alert(r.error.message);
          ls=r.data;
        }else{
          const r=await sb.from('special_team_slots').update({label:ts.label,x_pct:ts.x_pct,y_pct:ts.y_pct,sort_order:ts.sort_order||0}).eq('id',ls.id);
          if(r.error) return alert(r.error.message);
        }
        await sb.from('special_team_assignments').delete().eq('unit_id',liveUnit.id).eq('slot_id',ls.id);
        if(ts.player_id && players.some(p=>p.id===ts.player_id)){
          const r=await sb.from('special_team_assignments').insert({unit_id:liveUnit.id,slot_id:ls.id,player_id:ts.player_id});
          if(r.error) return alert(r.error.message);
        }
      }
    }
  }

  pendingLineupLabel=label;
  await loadTeamData();
  closeModal();
  alert(`Loaded "${label}". New game stats will still start at 0.`);
}

async function loadSavedLineup(templateId,name){
  await applyLineupTemplate(templateId,name);
}

async function duplicatePreviousGameLineup(){
  const {data,error}=await sb.from('lineup_templates')
    .select('id,name,created_at,source_game_id')
    .eq('team_id',team.id)
    .eq('is_auto',true)
    .not('source_game_id','is',null)
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error) return alert(error.message);
  if(!data) return alert('There is not a previous game lineup to duplicate yet.');
  await applyLineupTemplate(data.id,`Previous game: ${data.name}`);
}



async function resetCurrentField(){
  if(!roleCanEdit()) return;
  if(!confirm('Reset the positions in this view to the default formation? Player assignments will stay in place.')) return;
  if(activeView==='special'){
    const unit=specialUnits[currentSpecialUnit];
    const defs=SPECIAL_DEFAULTS[unit?.name]||SPECIAL_DEFAULTS['Kickoff'];
    const slots=specialSlots.filter(s=>s.unit_id===unit.id);
    for(const d of defs){
      const s=slots.find(x=>x.slot_key===d[0]);
      if(s) await sb.from('special_team_slots').update({label:d[1],x_pct:d[2],y_pct:d[3]}).eq('id',s.id);
    }
    await loadSpecialTeams();
  }else{
    const defs=DEFAULT_POS.filter(x=>x[1]===activeView);
    for(const d of defs){
      const p=positions.find(x=>x.side===d[1]&&x.slot_key===d[2]);
      if(p) await sb.from('position_labels').update({label:d[3],x_pct:d[4],y_pct:d[5]}).eq('id',p.id);
    }
    const r=await sb.from('position_labels').select('*').eq('team_id',team.id);
    if(!r.error) positions=(r.data||[]).filter(p=>ALLOWED_REGULAR_SLOTS.has(p.slot_key));
  }
  renderField();
}


function playCategoryLabel(c){
  return c==='running'?'🏃 RUNNING':c==='passing'?'🏈 PASSING':'⭐ SPECIAL';
}
function playLabelsArray(v){
  return String(v||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);
}
async function reloadPlaybook(){
  const {data,error}=await sb.from('playbook_plays').select('*').eq('team_id',team.id)
    .order('category').order('sort_order').order('created_at');
  if(error){ alert(error.message); return; }
  playbookPlays=data||[];
}
function openPlaybook(category='all'){
  const cats=['running','passing','special'];
  const filtered=category==='all'?playbookPlays:playbookPlays.filter(p=>p.category===category);
  openModal(`<h2>📘 Team Playbook</h2>
    <div class="playbookTabs">
      <button class="secondary ${category==='all'?'activePlayTab':''}" onclick="openPlaybook('all')">ALL</button>
      ${cats.map(c=>`<button class="secondary ${category===c?'activePlayTab':''}" onclick="openPlaybook('${c}')">${playCategoryLabel(c)}</button>`).join('')}
    </div>
    <div class="playbookActions">
      ${roleCanEdit()?`<button class="primary" onclick="openPlayEditor()">+ ADD PLAY</button>`:''}
      <button class="secondary" onclick="openPlaybookPdf()">📄 PDF PLAYBOOK</button>
    </div>
    <div class="playList">
      ${filtered.length?filtered.map(p=>`
        <div class="playCard">
          <div class="playCardTop">
            <div>
              <span class="playCategory">${playCategoryLabel(p.category)}</span>
              <h3>${esc(p.play_code?`${p.play_code} — ${p.name}`:p.name)}</h3>
            </div>
            ${roleCanEdit()?`<div class="playCardBtns">
              <button class="iconBtn" onclick="openPlayEditor('${p.id}')">✎</button>
              <button class="dangerBtn" onclick="deletePlay('${p.id}','${esc(p.name)}')">DELETE</button>
            </div>`:''}
          </div>
          ${p.formation?`<div class="playMeta"><b>Formation:</b> ${esc(p.formation)}</div>`:''}
          ${p.description?`<div class="playDesc">${esc(p.description)}</div>`:''}
          ${(p.labels||[]).length?`<div class="playLabels">${p.labels.map(l=>`<span>${esc(l)}</span>`).join('')}</div>`:''}
        </div>`).join(''):`<div class="notice">No ${category==='all'?'':category+' '}plays yet. Tap <b>+ Add Play</b> to build your playbook.</div>`}
    </div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
function openPlayEditor(id=''){
  const p=playbookPlays.find(x=>x.id===id);
  openModal(`<h2>${p?'Edit':'Add'} Play</h2>
    <div class="formgrid">
      <label>Play Name<input id="playName" value="${esc(p?.name||'')}" placeholder="24 Power"></label>
      <label>Category
        <select id="playCategory">
          <option value="running" ${p?.category==='running'?'selected':''}>RUNNING</option>
          <option value="passing" ${p?.category==='passing'?'selected':''}>PASSING</option>
          <option value="special" ${p?.category==='special'?'selected':''}>SPECIAL PLAY</option>
        </select>
      </label>
      <label>Play # / Code<input id="playCode" value="${esc(p?.play_code||'')}" placeholder="24"></label>
      <label>Formation<input id="playFormation" value="${esc(p?.formation||'')}" placeholder="I Right"></label>
      <label class="wideLabel">Labels — separate with commas<input id="playLabels" value="${esc((p?.labels||[]).join(', '))}" placeholder="Goal Line, Red Zone, 3rd & Short"></label>
      <label class="wideLabel">Description / Notes<textarea id="playDescription" rows="5" placeholder="Blocking, motion, reads, coaching points...">${esc(p?.description||'')}</textarea></label>
    </div>
    <div class="modalFoot">
      <button class="secondary" onclick="openPlaybook()">CANCEL</button>
      <button class="primary" onclick="savePlay('${p?.id||''}')">SAVE PLAY</button>
    </div>`);
}
async function savePlay(id=''){
  const name=$('playName').value.trim();
  if(!name) return alert('Enter a play name.');
  const uid=await userId();
  const payload={
    team_id:team.id,
    name,
    category:$('playCategory').value,
    play_code:$('playCode').value.trim()||null,
    formation:$('playFormation').value.trim()||null,
    description:$('playDescription').value.trim()||null,
    labels:playLabelsArray($('playLabels').value),
    updated_at:new Date().toISOString()
  };
  if(!id) payload.created_by=uid;
  const r=id
    ? await sb.from('playbook_plays').update(payload).eq('id',id)
    : await sb.from('playbook_plays').insert(payload);
  if(r.error) return alert(r.error.message);
  await reloadPlaybook();
  openPlaybook();
}
async function deletePlay(id,name){
  if(!confirm(`Delete play "${name}"?`)) return;
  const {error}=await sb.from('playbook_plays').delete().eq('id',id);
  if(error) return alert(error.message);
  await reloadPlaybook();
  openPlaybook();
}
function pdfText(s){
  return String(s??'').replace(/[^\x20-\x7E]/g,'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
}
function wrapPdfText(text,max=78){
  const words=String(text||'').split(/\s+/).filter(Boolean), lines=[]; let line='';
  for(const w of words){
    if((line+' '+w).trim().length>max){ if(line) lines.push(line); line=w; }
    else line=(line+' '+w).trim();
  }
  if(line) lines.push(line);
  return lines;
}
function buildSimplePlaybookPdf(){
  const ordered=[...playbookPlays].sort((a,b)=>a.category.localeCompare(b.category)||(a.sort_order||0)-(b.sort_order||0)||a.name.localeCompare(b.name));
  const pages=[]; let page=[], y=760;
  const add=(text,size=11,bold=false,indent=0)=>{
    if(y<70){ pages.push(page); page=[]; y=760; }
    page.push({text:pdfText(text),size,bold,x:54+indent,y}); y-=size+7;
  };
  add(`${team?.name||'Coach Lineup'} Playbook`,20,true); add(`Generated ${new Date().toLocaleDateString()}`,10,false); y-=8;
  let lastCat='';
  for(const p of ordered){
    if(p.category!==lastCat){ y-=6; add(playCategoryLabel(p.category).replace(/[^\x20-\x7E]/g,''),15,true); lastCat=p.category; }
    add(p.play_code?`${p.play_code} - ${p.name}`:p.name,13,true,8);
    if(p.formation) add(`Formation: ${p.formation}`,10,false,14);
    if((p.labels||[]).length) add(`Labels: ${(p.labels||[]).join(', ')}`,9,false,14);
    for(const line of wrapPdfText(p.description||'',80)) add(line,10,false,14);
    y-=7;
  }
  if(!ordered.length) add('No plays have been added yet.',12,false);
  pages.push(page);

  const objects=[null];
  const addObj=s=>{objects.push(s); return objects.length-1;};
  const font=addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold=addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageObjs=[], contentObjs=[];
  for(const pg of pages){
    let stream='BT\\n';
    for(const l of pg){
      stream+=`/${l.bold?'F2':'F1'} ${l.size} Tf ${l.x} ${l.y} Td (${l.text}) Tj ${-l.x} ${-l.y} Td\\n`;
    }
    stream+='ET';
    contentObjs.push(addObj(`<< /Length ${stream.length} >>\\nstream\\n${stream}\\nendstream`));
    pageObjs.push(addObj(''));
  }
  const pagesObj=addObj('');
  pageObjs.forEach((obj,i)=>{
    objects[obj]=`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${contentObjs[i]} 0 R >>`;
  });
  objects[pagesObj]=`<< /Type /Pages /Kids [${pageObjs.map(x=>`${x} 0 R`).join(' ')}] /Count ${pageObjs.length} >>`;
  const catalog=addObj(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
  let pdf='%PDF-1.4\\n', offsets=[0];
  for(let i=1;i<objects.length;i++){ offsets[i]=pdf.length; pdf+=`${i} 0 obj\\n${objects[i]}\\nendobj\\n`; }
  const xref=pdf.length;
  pdf+=`xref\\n0 ${objects.length}\\n0000000000 65535 f \\n`;
  for(let i=1;i<objects.length;i++) pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \\n';
  pdf+=`trailer\\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\\nstartxref\\n${xref}\\n%%EOF`;
  return new Blob([pdf],{type:'application/pdf'});
}
function openPlaybookPdf(){
  const blob=buildSimplePlaybookPdf();
  const url=URL.createObjectURL(blob);
  const win=window.open(url,'_blank');
  if(!win) alert('Your browser blocked the PDF window. Allow pop-ups for Coach Lineup and try again.');
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}


function linePlayersForView(line){
  if(activeView==='special'){
    const unit=specialUnits[currentSpecialUnit];
    return unit ? specialAssignments.filter(a=>a.unit_id===unit.id).map(a=>a.player_id) : [];
  }
  const posIds=new Set(positions.filter(p=>p.side===activeView).map(p=>p.id));
  return assignments.filter(a=>a.line_id===line.id&&posIds.has(a.position_label_id)).map(a=>a.player_id);
}
function recommendedLineIndex(){
  if(!lines.length) return -1;
  const scored=lines.map((line,i)=>{
    const ids=[...new Set(linePlayersForView(line))].filter(id=>playerCanPlay(players.find(p=>p.id===id)));
    if(!ids.length) return {i,score:999999,count:0};
    const score=ids.reduce((sum,id)=>sum+(counts[id]||0),0)/ids.length;
    return {i,score,count:ids.length};
  }).filter(x=>x.count>0);
  if(!scored.length) return -1;
  scored.sort((a,b)=>a.score-b.score||a.i-b.i);
  return scored[0].i;
}
function recommendNextLine(){
  const idx=recommendedLineIndex();
  if(idx<0) return alert('Add players to your lines before using recommendations.');
  currentLine=idx;
  renderLineSelect(); renderField();
  const line=lines[idx];
  const ids=[...new Set(linePlayersForView(line))];
  const avg=ids.length?(ids.reduce((s,id)=>s+(counts[id]||0),0)/ids.length).toFixed(1):'0';
  closeModal();
  alert(`Recommended next line: ${line.name}\nAverage plays for this group: ${avg}\n\nCoach Lineup switched to this line.`);
}
function openQuickSub(){
  if(gameModeLocked) return alert('Game Mode is locked. Unlock editing before making substitutions.');
  if(activeView==='special'){
    const unit=specialUnits[currentSpecialUnit];
    if(!unit) return;
    const assigned=new Map(specialAssignments.filter(a=>a.unit_id===unit.id).map(a=>[a.slot_id,players.find(p=>p.id===a.player_id)]));
    openModal(`<h2>Quick Sub — ${esc(unit.name)}</h2>
      <div class="quickSubList">${specialSlots.filter(s=>s.unit_id===unit.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(s=>{
        const p=assigned.get(s.id);
        return `<button class="playerPick quickSubRow" onclick="openSpecialAssignment('${s.id}')"><b>${esc(s.label)}</b><span>${p?`#${esc(p.jersey_number)} ${esc(p.name)}`:'OPEN'}</span></button>`;
      }).join('')}</div>
      <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
    return;
  }
  const amap=new Map(currentLineAssignments().map(a=>[a.position_label_id,players.find(p=>p.id===a.player_id)]));
  openModal(`<h2>Quick Sub — ${esc(lines[currentLine]?.name||'Line')}</h2>
    <div class="quickSubList">${positions.filter(p=>p.side===activeView).map(pos=>{
      const p=amap.get(pos.id);
      return `<button class="playerPick quickSubRow" onclick="openLineupEditor('${pos.id}')"><b>${esc(pos.label)}</b><span>${p?`#${esc(p.jersey_number)} ${esc(p.name)}`:'OPEN'}</span></button>`;
    }).join('')}</div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
function toggleGameLock(){
  gameModeLocked=!gameModeLocked;
  document.body.classList.toggle('gameLocked',gameModeLocked);
  const b=$('lockBtn'); if(b) b.textContent=gameModeLocked?'🔒 GAME LOCKED':'🔓 LOCK GAME';
  renderField();
}
function toggleSidelineMode(){
  sidelineMode=!sidelineMode;
  document.body.classList.toggle('sidelineMode',sidelineMode);
  const b=$('sidelineBtn'); if(b) b.textContent=sidelineMode?'SIDELINE ✓':'SIDELINE MODE';
}
async function openGameHistory(){
  if(!currentGame) return alert('Start a game first.');
  const {data,error}=await sb.from('game_plays').select('id,play_number,line_id,note,created_at').eq('game_id',currentGame.id).order('play_number',{ascending:false});
  if(error) return alert(error.message);
  const rows=data||[];
  openModal(`<h2>Game History</h2>
    <div class="notice"><b>vs ${esc(currentGame.opponent||'Opponent')}</b> • ${gameQuarter} • ${formatClock(clockSeconds)} • ${possession==='ours'?'OUR BALL':'THEIR BALL'}<br>${rows.length} recorded plays</div>
    <div class="historyList">${rows.length?rows.map(r=>{
      const line=lines.find(l=>l.id===r.line_id);
      const view=String(r.note||'').startsWith('special:')?String(r.note).replace('special:','Special — '):String(r.note||'').toUpperCase();
      return `<div class="historyRow"><b>Play ${r.play_number}</b><span>${esc(line?.name||'Line')}</span><span>${esc(view)}</span></div>`;
    }).join(''):`<div class="notice">No plays recorded yet.</div>`}</div>
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}
function endGameReportHtml(){
  const rows=players.map(p=>{
    const c=counts[p.id]||0, pct=playCount?Math.round(c/playCount*100):0;
    return {p,c,pct};
  }).sort((a,b)=>b.c-a.c||a.p.name.localeCompare(b.p.name));
  return `<div class="notice"><b>vs ${esc(currentGame?.opponent||'Opponent')}</b><br>Total plays: <b>${playCount}</b></div>
    <div class="endReport">${rows.map(r=>`<div class="statRow"><span>#${esc(r.p.jersey_number)}</span><span>${esc(r.p.name)}</span><span>${r.c} plays</span><b>${r.pct}%</b></div>`).join('')}</div>`;
}
async function finishGame(){
  if(!currentGame) return;
  openModal(`<h2>End-of-Game Report</h2>
    ${endGameReportHtml()}
    <div class="modalFoot">
      <button class="secondary" onclick="closeModal()">KEEP GAME OPEN</button>
      <button class="primary" onclick="confirmFinishGame()">END GAME</button>
    </div>`);
}
async function confirmFinishGame(){
  if(!currentGame) return;
  if(clockTimer){clearInterval(clockTimer);clockTimer=null;} clockRunning=false; clockEndAt=null;
  const {error}=await sb.from('games').update({status:'finished',finished_at:new Date().toISOString()}).eq('id',currentGame.id);
  if(error) return alert(error.message);
  currentGame=null; playCount=0; counts={}; pendingLineupLabel='Current lineup'; closeModal(); renderSummary(); showDashboard();
}

function openGameSetup(){
  openModal(`<h2>${currentGame?'Current Game':'Game Day'}</h2>
    ${currentGame?`<div class="notice"><b>vs ${esc(currentGame.opponent||'Opponent')}</b><br>${playCount} plays recorded</div>`:`
      <div class="notice"><b>Lineup for this game:</b><br>${esc(pendingLineupLabel)}</div>
      <div class="gameLineupChoices">
        <button class="secondary" onclick="closeModal();showGameScreen()">🏈 USE CURRENT / EDIT ON FIELD</button>
        <button class="secondary" onclick="openSavedLineups()">💾 USE SAVED LINEUP</button>
        <button class="secondary" onclick="duplicatePreviousGameLineup()">⧉ DUPLICATE PREVIOUS GAME</button>
      </div>`}
    <div class="formgrid">
      <label>Opponent<input id="gameOpponent" value="${esc(currentGame?.opponent||'')}"></label>
      <label>Playing-time warning %<input id="gameThreshold" type="number" min="1" max="100" value="${threshold}"></label>
    </div>
    <div class="modalFoot">
      <button class="secondary" onclick="closeModal()">CANCEL</button>
      ${currentGame?`<button class="secondary" onclick="finishGame()">FINISH GAME</button>`:`<button class="primary" onclick="startGame()">START GAME</button>`}
    </div>`);
}
async function startGame(){
  const uid=await userId();
  const opp=$('gameOpponent').value.trim()||'Opponent';
  threshold=Math.max(1,Math.min(100,Number($('gameThreshold').value||75)));
  const {data,error}=await sb.from('games').insert({
    team_id:team.id, opponent:opp, status:'active', warning_threshold:threshold,
    created_by:uid, started_at:new Date().toISOString()
  }).select().single();
  if(error) return alert(error.message);
  currentGame=data; playCount=0; counts={};
  gameQuarter='Q1'; possession='ours'; clockSeconds=480; clockRunning=false; clockEndAt=null;
  persistGameState(); renderGameStrip();

  await snapshotCurrentLineup(`vs ${opp} - ${new Date().toLocaleDateString()}`,data.id,true,true);
  pendingLineupLabel='Current lineup';
  closeModal(); renderSummary(); showGameScreen();
}
async function nextPlay(){
  if(nextPlay.busy) return;
  if(!currentGame){ openGameSetup(); return; }
  const line=lines[currentLine]; if(!line) return alert('Create a line first.');

  let participants=[];
  if(activeView==='special'){
    const unit=specialUnits[currentSpecialUnit];
    if(!unit) return alert('Select a special teams unit.');
    const slots=new Map(specialSlots.filter(s=>s.unit_id===unit.id).map(s=>[s.id,s]));
    participants=specialAssignments.filter(a=>a.unit_id===unit.id).map(a=>({
      player_id:a.player_id,
      position_label:`${unit.name}: ${slots.get(a.slot_id)?.label||''}`
    }));
  }else{
    const posById=new Map(positions.filter(p=>p.side===activeView).map(p=>[p.id,p]));
    participants=currentLineAssignments()
      .filter(a=>posById.has(a.position_label_id))
      .map(a=>({player_id:a.player_id,position_label:posById.get(a.position_label_id)?.label||''}));
  }

  if(!participants.length){
    alert(`No players are assigned to the ${activeView==='special'?(specialUnits[currentSpecialUnit]?.name||'Special Teams'):activeView.toUpperCase()} view yet.`);
    return;
  }

  const seen=new Set(), duplicateIds=new Set();
  participants.forEach(x=>{ if(seen.has(x.player_id)) duplicateIds.add(x.player_id); seen.add(x.player_id); });
  if(duplicateIds.size){
    const names=[...duplicateIds].map(id=>players.find(p=>p.id===id)?.name||'Unknown').join(', ');
    return alert(`Duplicate player on this lineup: ${names}. Each player can only appear once in the active lineup.`);
  }

  const unavailable=participants
    .map(x=>players.find(p=>p.id===x.player_id))
    .filter(p=>p && !playerCanPlay(p));
  if(unavailable.length){
    const details=unavailable.map(p=>`#${p.jersey_number} ${p.name} — ${availabilityLabel(p)}`).join('\n');
    return alert(`Cannot record this play. These players are unavailable:\n\n${details}\n\nMake a substitution or mark the player ACTIVE.`);
  }

  const unique=[...new Map(participants.map(x=>[x.player_id,x])).values()];
  const note=activeView==='special' ? `special:${specialUnits[currentSpecialUnit]?.name||''}` : activeView;

  nextPlay.busy=true;
  document.querySelectorAll('#nextBtn,#nextSide,.fullscreenControls .primary').forEach(b=>{
    b.disabled=true; b.classList.add('savingPlay');
  });

  try{
    const {data,error}=await sb.rpc('record_game_play',{
      p_game_id:currentGame.id,
      p_line_id:line.id,
      p_note:note,
      p_participants:unique
    });
    if(error) throw error;

    const result=Array.isArray(data)?data[0]:data;
    playCount=Number(result?.total_plays ?? result?.play_number ?? (playCount+1));
    currentGame.total_plays=playCount;
    unique.forEach(r=>counts[r.player_id]=(counts[r.player_id]||0)+1);
    renderSummary();

    // Automatically rotate to the next configured line after each recorded play.
    if(lines.length>1){
      currentLine=(currentLine+1)%lines.length;
      renderLineSelect();
      renderField();
    }

    const flash=$('playNo');
    flash?.classList.add('playFlash');
    setTimeout(()=>flash?.classList.remove('playFlash'),450);
  }catch(e){
    alert(`Next Play could not be recorded: ${e.message||String(e)}`);
    await loadCounts();
    const {data:g}=await sb.from('games').select('total_plays').eq('id',currentGame.id).single();
    if(g){ playCount=Number(g.total_plays||0); currentGame.total_plays=playCount; renderSummary(); }
  }finally{
    nextPlay.busy=false;
    document.querySelectorAll('#nextBtn,#nextSide,.fullscreenControls .primary').forEach(b=>{
      b.disabled=false; b.classList.remove('savingPlay');
    });
  }
}
async function prevPlay(){
  if(!currentGame||playCount<=0) return;
  if(!confirm(`Undo Play ${playCount}? Playing-time counts will be corrected.`)) return;
  const {data:gp,error}=await sb.from('game_plays').select('id').eq('game_id',currentGame.id).eq('play_number',playCount).maybeSingle();
  if(error||!gp) return;
  const {data:pps}=await sb.from('play_participants').select('player_id').eq('play_id',gp.id);
  const d=await sb.from('game_plays').delete().eq('id',gp.id);
  if(d.error) return alert(d.error.message);
  (pps||[]).forEach(r=>counts[r.player_id]=Math.max(0,(counts[r.player_id]||0)-1));
  playCount--; currentGame.total_plays=playCount;
  await sb.from('games').update({total_plays:playCount}).eq('id',currentGame.id);
  renderSummary();
}


function openPlayingTimeAlert(){
  if(!playCount){
    openModal(`<h2>Playing-Time Alert</h2>
      <div class="notice">No plays have been recorded yet.</div>
      <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
    return;
  }
  const rows=players.filter(playerCanPlay).map(p=>{
    const c=counts[p.id]||0;
    const pct=Math.round(c/playCount*100);
    return {p,c,pct};
  });
  const high=rows.filter(r=>r.pct>=threshold).sort((a,b)=>b.pct-a.pct||b.c-a.c);
  const lowCut=Math.max(0,100-threshold);
  const low=rows.filter(r=>r.pct<=lowCut).sort((a,b)=>a.pct-b.pct||a.c-b.c);
  openModal(`<h2>⚠️ Smart Playing-Time Alert</h2>
    <div class="notice">Team plays: <b>${playCount}</b> • High-use warning: <b>${threshold}%+</b> • Low-use watch: <b>${lowCut}% or less</b></div>
    <h3>High Use</h3>
    ${high.length?`<div class="alertPlayerList">${high.map(r=>`
      <div class="alertPlayerRow">
        <div class="alertPlayerIdentity"><span class="alertJersey">#${esc(r.p.jersey_number)}</span><span><b>${esc(r.p.name)}</b></span></div>
        <div class="alertPlayerStats"><span>${r.c} / ${playCount}</span><b>${r.pct}%</b></div>
      </div>`).join('')}</div>`:`<div class="notice">✓ Nobody is over the high-use threshold.</div>`}
    <h3>Needs More Plays</h3>
    ${low.length?`<div class="alertPlayerList">${low.map(r=>`
      <div class="alertPlayerRow lowUseRow">
        <div class="alertPlayerIdentity"><span class="alertJersey">#${esc(r.p.jersey_number)}</span><span><b>${esc(r.p.name)}</b></span></div>
        <div class="alertPlayerStats"><span>${r.c} / ${playCount}</span><b>${r.pct}%</b></div>
      </div>`).join('')}</div>`:`<div class="notice">✓ No active players are currently in the low-use range.</div>`}
    <div class="modalFoot">
      <button class="secondary" onclick="closeModal()">CLOSE</button>
      <button class="primary" onclick="closeModal();recommendNextLine()">RECOMMEND NEXT LINE</button>
    </div>`);
}
function openStats(){
  const rows=players.map(p=>{
    const c=counts[p.id]||0, pct=playCount?Math.round(c/playCount*100):0;
    return {p,c,pct};
  }).sort((a,b)=>b.pct-a.pct);
  openModal(`<h2>Playing Time</h2>
    <div class="notice">Warning threshold: <b>${threshold}%</b> • Plays: <b>${playCount}</b></div>
    ${rows.map(r=>`<div class="statRow"><span>#${esc(r.p.jersey_number)}</span><span>${esc(r.p.name)}</span><span>${r.c} plays</span><b style="${r.pct>=threshold?'color:#ff5b5b':''}">${r.pct}%</b></div>`).join('')}
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CLOSE</button></div>`);
}

function subscribe(){
  if(channel) sb.removeChannel(channel);
  channel=sb.channel('coach-lineup-'+team.id)
    .on('postgres_changes',{event:'*',schema:'public',table:'players',filter:`team_id=eq.${team.id}`},()=>loadTeamData())
    .on('postgres_changes',{event:'*',schema:'public',table:'lines',filter:`team_id=eq.${team.id}`},()=>loadTeamData())
    .on('postgres_changes',{event:'*',schema:'public',table:'position_labels',filter:`team_id=eq.${team.id}`},()=>loadTeamData())
    .on('postgres_changes',{event:'*',schema:'public',table:'games',filter:`team_id=eq.${team.id}`},()=>loadTeamData())
    .subscribe();
}

$('authBtn').onclick=async()=>{
  msg('');
  const email=$('email').value.trim(), password=$('password').value;
  if(!email||!password) return msg('Enter email and password.');

  const create=$('authBtn').dataset.create==='1';
  const btn=$('authBtn');
  const originalText=btn.textContent;
  btn.disabled=true;
  btn.textContent=create?'Creating...':'Signing in...';

  try{
    const r=create
      ? await sb.auth.signUp({email,password})
      : await sb.auth.signInWithPassword({email,password});

    if(r.error){
      msg(r.error.message);
      return;
    }

    if(create){
      msg('Account created. Check your email if Supabase asks you to confirm it.');
      return;
    }

    // Password authentication succeeded. Load the team/dashboard immediately.
    await loadAppSafe();
  }catch(e){
    console.error('Sign in failed:',e);
    msg(e?.message||'Unable to sign in. Please try again.');
  }finally{
    btn.disabled=false;
    btn.textContent=originalText;
  }
};
$('toggleAuth').onclick=()=>{
  const create=$('authBtn').dataset.create!=='1';
  $('authBtn').dataset.create=create?'1':'0';
  $('authBtn').textContent=create?'Create account':'Sign in';
  $('authTitle').textContent=create?'Create account':'Sign in';
  $('toggleAuth').textContent=create?'Back to sign in':'Create an account';
};
$('addPlayerBtn').onclick=()=>openPlayerModal();
$('linesBtn').onclick=openLines;
$('positionsBtn').onclick=openPositions;
$('subBtn').onclick=openQuickSub;
$('statsBtn').onclick=openStats;
$('warning').onclick=openPlayingTimeAlert;
$('warning').onkeydown=e=>{
  if(e.key==='Enter'||e.key===' '){
    e.preventDefault();
    openPlayingTimeAlert();
  }
};
$('gameBtn').onclick=openGameSetup;
$('playbookBtn')?.addEventListener('click',()=>openPlaybook());
$('recommendBtn')?.addEventListener('click',recommendNextLine);
$('historyBtn')?.addEventListener('click',openGameHistory);
$('lockBtn')?.addEventListener('click',toggleGameLock);
$('sidelineBtn')?.addEventListener('click',toggleSidelineMode);
$('clockToggleBtn')?.addEventListener('click',toggleGameClock);
$('clockDisplay')?.addEventListener('click',openClockSettings);
$('quarterDisplay')?.addEventListener('click',openClockSettings);
$('possessionDisplay')?.addEventListener('click',togglePossession);

$('nextBtn').onclick=nextPlay;
$('nextSide').onclick=nextPlay;
$('prevBtn').onclick=prevPlay;
$('search').oninput=renderPlayers;
$('lineSelect').onchange=e=>setLine(Number(e.target.value));
$('namesBtn').onclick=()=>{displayMode='names';$('namesBtn').classList.add('active');$('numbersBtn').classList.remove('active');renderField();};
$('numbersBtn').onclick=()=>{displayMode='numbers';$('numbersBtn').classList.add('active');$('namesBtn').classList.remove('active');renderField();};
$('teamBtn').onclick=()=>openTeamModal(false);
$('logoutBtn').onclick=()=>sb.auth.signOut();
$('modal').onclick=e=>{ if(e.target===$('modal')) closeModal(); };


$('offenseTab').onclick=()=>setActiveView('offense');
$('defenseTab').onclick=()=>setActiveView('defense');
$('specialTab').onclick=()=>setActiveView('special');
$('editFieldBtn').onclick=toggleEditField;
$('resetFieldBtn').onclick=resetCurrentField;
$('fullscreenBtn').onclick=toggleFieldFullscreen;
$('specialUnitSelect').onchange=e=>{currentSpecialUnit=Number(e.target.value);renderField();};
$('homeBtn')?.addEventListener('click',showDashboard);
$('dashLogout')?.addEventListener('click',()=>sb.auth.signOut());
$('gameDayCard')?.addEventListener('click',()=>{ if(currentGame) showGameScreen(); else openGameSetup(); });
$('rosterCard')?.addEventListener('click',openRosterManager);
$('linesCard')?.addEventListener('click',openLines);
$('templatesCard')?.addEventListener('click',openSavedLineups);
$('positionsCard')?.addEventListener('click',openPositions);
$('settingsCard')?.addEventListener('click',openTeamSettings);
$('playbookCard')?.addEventListener('click',()=>openPlaybook());
$('gameHistoryCard')?.addEventListener('click',openAllGameHistory);
$('installCard')?.addEventListener('click',openInstallApp);


boot();
