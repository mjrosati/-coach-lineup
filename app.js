
const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const DEFAULT_POS = [
  ['WRL','offense','WRL','WR (Left)',16,18],['WRR','offense','WRR','WR (Right)',84,18],
  ['LT','offense','LT','LT',31,29],['LG','offense','LG','LG',41,29],['C','offense','C','C',50,29],
  ['RG','offense','RG','RG',59,29],['RT','offense','RT','RT',69,29],['QB','offense','QB','QB',50,39],
  ['RBL','offense','RBL','RB (Left)',40,46],['RBR','offense','RBR','RB (Right)',60,46],
  ['DEL','defense','DEL','DE (Left)',26,63],['DTL','defense','DTL','DT (Left)',42,63],
  ['DTR','defense','DTR','DT (Right)',58,63],['DER','defense','DER','DE (Right)',74,63],
  ['LBL','defense','LBL','LB (Left)',29,75],['LBC','defense','LBC','LB (Left Center)',44,75],
  ['RBC','defense','RBC','LB (Right Center)',58,75],['LBR','defense','LBR','LB (Right)',71,75],
  ['CBL','defense','CBL','CB (Left)',21,88],['SSL','defense','SSL','SS',41,88],
  ['FS','defense','FS','FS',59,88],['CBR','defense','CBR','CB (Right)',79,88]
];

let team=null, membership=null, lines=[], players=[], positions=[], assignments=[];
let currentLine=0, displayMode='names', currentGame=null, playCount=0, counts={}, threshold=75, channel=null;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function openModal(html){ $('modalBody').innerHTML=html; $('modal').classList.remove('hidden'); }
function closeModal(){ $('modal').classList.add('hidden'); }
function showAuth(){ $('auth').classList.remove('hidden'); $('app').classList.add('hidden'); }
function showApp(){ $('auth').classList.add('hidden'); $('app').classList.remove('hidden'); }
function msg(t){ $('authMsg').textContent=t||''; }
function userId(){ return sb.auth.getUser().then(r=>r.data.user?.id); }
function roleCanEdit(){ return membership && ['owner','coach'].includes(membership.role); }

async function boot(){
  const {data:{session}}=await sb.auth.getSession();
  if(session) await loadApp(); else showAuth();
  sb.auth.onAuthStateChange(async(_e,s)=>{ if(s) await loadApp(); else showAuth(); });
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

async function loadApp(){
  showApp();
  const {data,error}=await sb
    .from('team_members')
    .select('team_id,role,created_at,teams(id,name,invite_code,warning_threshold,created_by)')
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
  if(!positions.length && roleCanEdit()){
    const rows=DEFAULT_POS.map(x=>({
      team_id:team.id, side:x[1], slot_key:x[2], label:x[3], x_pct:x[4], y_pct:x[5]
    }));
    const r=await sb.from('position_labels').insert(rows).select();
    if(r.error) throw r.error;
    positions=r.data||[];
  }
}

async function loadTeamData(){
  try{
    const [p,l,pos,g]=await Promise.all([
      sb.from('players').select('*').eq('team_id',team.id).eq('active',true).order('jersey_number'),
      sb.from('lines').select('*').eq('team_id',team.id).order('sort_order'),
      sb.from('position_labels').select('*').eq('team_id',team.id).order('side').order('slot_key'),
      sb.from('games').select('*').eq('team_id',team.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle()
    ]);
    for(const r of [p,l,pos,g]) if(r.error) throw r.error;
    players=p.data||[]; lines=l.data||[]; positions=pos.data||[];
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

function renderAll(){ renderLineSelect(); renderPlayers(); renderField(); renderSummary(); }

function renderLineSelect(){
  $('lineSelect').innerHTML=lines.map((l,i)=>`<option value="${i}" ${i===currentLine?'selected':''}>${esc(l.name)}</option>`).join('');
  $('lineChips').innerHTML=lines.map((l,i)=>`<button class="chip lineChip" style="border-color:${esc(l.color)}" onclick="setLine(${i})">${i+1} ${esc(l.name)}</button>`).join('');
}

function renderPlayers(){
  const q=($('search').value||'').toLowerCase();
  $('players').innerHTML=players
    .filter(p=>(`${p.name} ${p.jersey_number} ${p.primary_position||''}`).toLowerCase().includes(q))
    .map(p=>`<div class="player">
      <span class="num">#${esc(p.jersey_number)}</span>
      <span>${esc(p.name)}<br><small class="muted">${esc(p.primary_position||'')}</small></span>
      ${roleCanEdit()?`<button class="iconBtn" onclick="editPlayer('${p.id}')">✎</button>`:''}
    </div>`).join('');
}

function currentLineAssignments(){
  const line=lines[currentLine]; if(!line) return [];
  return assignments.filter(a=>a.line_id===line.id);
}

function renderField(){
  const f=$('field');
  f.querySelectorAll('.slot').forEach(x=>x.remove());
  const map={};
  currentLineAssignments().forEach(a=>{ map[a.position_label_id]=players.find(p=>p.id===a.player_id); });
  positions.forEach(p=>{
    const pl=map[p.id];
    const e=document.createElement('div');
    e.className='slot '+(p.side==='defense'?'def':'');
    e.style.left=Number(p.x_pct)+'%'; e.style.top=Number(p.y_pct)+'%';
    e.innerHTML=`${esc(p.label)}<small>${pl?(displayMode==='names'?esc(pl.name):'#'+esc(pl.jersey_number)):'OPEN'}</small>`;
    if(roleCanEdit()) e.onclick=()=>openLineupEditor(p.id);
    f.appendChild(e);
  });
}

function renderSummary(){
  $('playNo').textContent=playCount;
  const over=players.filter(p=>{
    const pct=playCount?Math.round(((counts[p.id]||0)/playCount)*100):0;
    return pct>=threshold;
  });
  $('summary').textContent=`PLAY ${playCount} • ${over.length?`⚠️ ${over.length} OVER ${threshold}%`:'✓ PLAYING TIME OK'}`;
  $('warning').textContent=over.length?'⚠️ PLAYING-TIME ALERT':'✓ ALL GOOD';
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
  openModal(`<h2>${p?'Edit':'Add'} Player</h2>
  <div class="formgrid">
    <label>Jersey #<input id="pmNum" value="${esc(p?.jersey_number||'')}"></label>
    <label>Name<input id="pmName" value="${esc(p?.name||'')}"></label>
    <label>Primary Position<input id="pmPos" value="${esc(p?.primary_position||'')}"></label>
  </div>
  <div class="modalFoot">
    <button class="secondary" onclick="closeModal()">CANCEL</button>
    <button class="primary" onclick="savePlayer('${p?.id||''}')">SAVE</button>
  </div>`);
}
function editPlayer(id){ openPlayerModal(players.find(p=>p.id===id)); }
async function savePlayer(id){
  const payload={team_id:team.id,jersey_number:$('pmNum').value.trim(),name:$('pmName').value.trim(),primary_position:$('pmPos').value.trim()};
  if(!payload.jersey_number||!payload.name) return alert('Enter a name and jersey number.');
  const r=id?await sb.from('players').update(payload).eq('id',id):await sb.from('players').insert(payload);
  if(r.error) return alert(r.error.message);
  closeModal(); await loadTeamData();
}

function openLines(){
  openModal(`<h2>Manage Lines</h2>
    ${lines.map((l,i)=>`<div class="formgrid">
      <label>Line ${i+1}<input id="ln${i}" value="${esc(l.name)}"></label>
      <label>Color<input id="lc${i}" type="color" value="${/^#[0-9a-f]{6}$/i.test(l.color)?l.color:'#2584ff'}"></label>
    </div>`).join('')}
    <div class="modalFoot"><button class="secondary" onclick="closeModal()">CANCEL</button><button class="primary" onclick="saveLines()">SAVE</button></div>`);
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

function openLineupEditor(positionId){
  const pos=positions.find(p=>p.id===positionId);
  const existing=currentLineAssignments().find(a=>a.position_label_id===positionId);
  openModal(`<h2>${esc(pos?.label||'Position')} — Assign Player</h2>
    <div class="picker">
      <button class="secondary full" onclick="clearAssignment('${positionId}')">CLEAR POSITION</button>
      ${players.map(p=>`<button class="playerPick ${existing?.player_id===p.id?'selected':''}" onclick="assignPlayer('${positionId}','${p.id}')">#${esc(p.jersey_number)} ${esc(p.name)}</button>`).join('')}
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
  await sb.from('line_assignments').delete().eq('line_id',line.id).eq('position_label_id',positionId);
  await sb.from('line_assignments').delete().eq('line_id',line.id).eq('player_id',playerId);
  const {error}=await sb.from('line_assignments').insert({line_id:line.id,player_id:playerId,position_label_id:positionId});
  if(error) return alert(error.message);
  closeModal(); await loadAssignments(); renderField();
}

function openGameSetup(){
  openModal(`<h2>${currentGame?'Current Game':'Start Game'}</h2>
    ${currentGame?`<div class="notice"><b>vs ${esc(currentGame.opponent||'Opponent')}</b><br>${playCount} plays recorded</div>`:''}
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
  currentGame=data; playCount=0; counts={}; closeModal(); renderSummary();
}
async function finishGame(){
  if(!currentGame) return;
  const {error}=await sb.from('games').update({status:'finished',finished_at:new Date().toISOString()}).eq('id',currentGame.id);
  if(error) return alert(error.message);
  currentGame=null; playCount=0; counts={}; closeModal(); renderSummary();
}

async function nextPlay(){
  if(!currentGame){ openGameSetup(); return; }
  const line=lines[currentLine]; if(!line) return alert('Create a line first.');
  const a=currentLineAssignments();
  if(!a.length) return alert('This line has no assigned players. Tap positions on the field first.');
  const uid=await userId();
  const {data:gp,error}=await sb.from('game_plays').insert({
    game_id:currentGame.id, play_number:playCount+1, line_id:line.id, created_by:uid
  }).select().single();
  if(error) return alert(error.message);
  const rows=a.map(x=>{
    const pos=positions.find(p=>p.id===x.position_label_id);
    return {play_id:gp.id,player_id:x.player_id,position_label:pos?.label||''};
  });
  const pp=await sb.from('play_participants').insert(rows);
  if(pp.error){ await sb.from('game_plays').delete().eq('id',gp.id); return alert(pp.error.message); }
  playCount++;
  rows.forEach(r=>counts[r.player_id]=(counts[r.player_id]||0)+1);
  currentGame.total_plays=playCount;
  renderSummary();
}

async function prevPlay(){
  if(!currentGame||playCount<=0) return;
  const {data:gp,error}=await sb.from('game_plays').select('id').eq('game_id',currentGame.id).eq('play_number',playCount).maybeSingle();
  if(error||!gp) return;
  const {data:pps}=await sb.from('play_participants').select('player_id').eq('play_id',gp.id);
  const d=await sb.from('game_plays').delete().eq('id',gp.id);
  if(d.error) return alert(d.error.message);
  (pps||[]).forEach(r=>counts[r.player_id]=Math.max(0,(counts[r.player_id]||0)-1));
  playCount--; currentGame.total_plays=playCount; renderSummary();
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
  const r=create?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
  if(r.error) msg(r.error.message); else if(create) msg('Account created. Check your email if Supabase asks you to confirm it.');
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
$('subBtn').onclick=()=>{ const p=positions[0]; if(p) openLineupEditor(p.id); };
$('statsBtn').onclick=openStats;
$('gameBtn').onclick=openGameSetup;
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

boot();
