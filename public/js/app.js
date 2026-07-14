/* ============================================================
   豆豆数学探险队 v5.0 · 儿童友好版主控
   - 角色化语气（狐狸老师 + 贴纸 + emoji）
   - 底部 tab 导航
   - 贴纸飞舞动画
   ============================================================ */

const state = {
  profile: { grade: 3, name: '' },
  store: null,
  view: 'home',
  todayQueue: [],
  currentQueueIdx: 0,
  selectedAnswer: null,
  answered: false,
  timerStart: 0,
  currentQKey: null,
  currentUnit: 0,
  hintsUsed: 0,
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const escapeHTML = v => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]);

function loadStore() { state.store = Storage.load(); state.profile = state.store.profile; }
function saveStore() { state.store.profile = state.profile; Storage.save(state.store); }
function grade() { return CURRICULUM[state.profile.grade]; }
function unit(uIdx) { return grade().units[uIdx]; }
function qKey(uIdx, qIdx) { return `${state.profile.grade}:${uIdx}:${qIdx}`; }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function init() {
  loadStore();
  bind();
  if (!state.profile.name && !localStorage.getItem('doudou_math_v5')) openProfile();
  renderAll();
  // 每 30 秒刷新 streak（实际不需要，因为关闭再开会重算）
  setInterval(updateStreakPill, 30000);
}

function bind() {
  $$('.tab-item').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $$('[data-jump]').forEach(b => b.addEventListener('click', () => showView(b.dataset.jump)));
  $('#openProfile').addEventListener('click', openProfile);
  $('#closeProfile').addEventListener('click', closeProfile);
  $('#saveProfile').addEventListener('click', saveProfile);
  $('#randomProblem')?.addEventListener('click', startRandom);
  $('#showHint').addEventListener('click', showHint);
  $('#checkAnswer').addEventListener('click', checkAnswer);
  $('#nextQuestion').addEventListener('click', nextQuestion);
  $('#saveNoteBtn').addEventListener('click', saveNote);
  $('#profileModal').addEventListener('click', e => { if (e.target.id === 'profileModal') closeProfile(); });
  document.addEventListener('keydown', onKey);
}

function onKey(e) {
  if (state.view !== 'practice' || !state.todayQueue.length) return;
  if (e.key >= '1' && e.key <= '4' && !state.answered) {
    const idx = +e.key - 1;
    const btns = $$('.option');
    if (btns[idx]) btns[idx].click();
  } else if (e.key === 'Enter') {
    if (state.answered) nextQuestion();
    else if (!$('#checkAnswer').disabled) checkAnswer();
  } else if (e.key.toLowerCase() === 'h' && !state.answered) {
    showHint();
  }
}

function showView(view) {
  state.view = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `${view}View`));
  $$('.tab-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'home') renderHome();
  else if (view === 'learn') renderLearn();
  else if (view === 'practice') renderPractice();
  else if (view === 'wrong') renderWrong();
  else if (view === 'stickers') renderStickers();
  else if (view === 'progress') renderProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ Home ============ */
function renderHome() {
  state.todayQueue = generateTodayQueue();
  renderHero();
  renderTodayCards();
  renderStickerGrid();
  renderHomePlanets();
  renderRecommend();
  renderCalendar('calendarHeatmap', 30);
}

function renderHero() {
  const g = grade();
  $('#studentName').textContent = state.profile.name || '豆豆';
  const fb = $('#foxBubble');
  if (fb) fb.textContent = Stickers.foxSays('welcome');
}

function renderTodayCards() {
  const cards = $('#todayCards');
  if (!cards) return;
  const today = todayStr();
  const doneToday = state.store.checkIn[today]?.questions || [];
  if (state.todayQueue.length === 0) {
    cards.innerHTML = `<div class="empty-state"><span class="empty-emoji">🎉</span><p>今天的任务完成啦！明天见～</p></div>`;
    return;
  }
  cards.innerHTML = state.todayQueue.map((it, i) => {
    const done = doneToday.includes(qKey(it.unitIdx, it.qIdx));
    return `
      <button class="task-card ${it.source === 'srs' ? 'is-srs' : ''} ${done ? 'is-done' : ''}" data-i="${i}">
        <span class="task-source">${it.source === 'srs' ? '🔁 复盘' : '✨ 新题'}</span>
        <span class="task-num">${String(i+1).padStart(2,'0')}</span>
        <span class="task-diff">${'★'.repeat(it.q.diff)}</span>
        <h4>${escapeHTML(it.q.q.length > 30 ? it.q.q.slice(0, 30) + '…' : it.q.q)}</h4>
        <span class="task-cta">${done ? '已完成 ✓' : '开始 →'}</span>
      </button>`;
  }).join('');
  cards.querySelectorAll('.task-card').forEach(b => b.addEventListener('click', () => {
    state.currentQueueIdx = +b.dataset.i;
    resetQuestion();
    showView('practice');
  }));
}

function renderStickerGrid() {
  const grid = $('#stickerGrid');
  if (!grid) return;
  grid.innerHTML = Object.values(Stickers.themes).map(t => {
    const p = Stickers.progressFor(state.store, t.id);
    return `
      <div class="sticker-mini" style="border-color:${t.color}40">
        <div class="sticker-emoji">${t.emoji}</div>
        <div class="sticker-name" style="color:${t.color}">${t.name}</div>
        <div class="sticker-progress"><div class="sticker-progress-fill" style="width:${p.progress}%;background:${t.color}"></div></div>
        <div class="sticker-count">${p.count} 颗 ${p.nextLevel ? '· 还差 ' + p.need + ' 升' + p.nextLevel : '· 🏆 满级'}</div>
      </div>`;
  }).join('');
}

function renderHomePlanets() {
  const g = grade();
  const planets = $('#homePlanets');
  if (!planets) return;
  const colors = ['#FB923C', '#34D399', '#8B5CF6', '#F472B6'];
  planets.innerHTML = g.units.map((u, i) => {
    const report = Analytics.unitReport(state.store, state.profile.grade, i);
    const pct = Math.round(((report.solved + report.mastered) / report.total) * 100);
    const color = colors[i % colors.length];
    return `
      <div class="planet-card" data-unit="${i}" style="border-color:${color}40">
        <div class="planet-icon" style="background:${color}20;color:${color}"><i class="fa-solid ${u.icon}"></i></div>
        <div class="planet-info">
          <p class="planet-title">${u.title}</p>
          <div class="planet-progress-row">
            <span>${report.solved + report.mastered}/${report.total}</span>
            <div class="planet-progress-bar"><div class="planet-progress-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>
        </div>
        <span>→</span>
      </div>`;
  }).join('');
  planets.querySelectorAll('.planet-card').forEach(b => b.addEventListener('click', () => {
    state.currentUnit = +b.dataset.unit;
    showView('learn');
  }));
}

function renderRecommend() {
  const row = $('#recommendRow');
  if (!row) return;
  const recs = Analytics.recommend(state.store, state.profile.grade).slice(0, 4);
  if (!recs.length) {
    row.innerHTML = `<div class="empty-state"><span class="empty-emoji">💡</span><p>先把今天的任务做完，小狐狸再来建议～</p></div>`;
    return;
  }
  row.innerHTML = recs.map(r => `
    <div class="rec-card" data-grade="${r.grade}" data-unit="${r.unitIdx}">
      <div class="rec-grade">${CURRICULUM[r.grade].name} · ${r.title}</div>
      <h4 class="rec-title">${r.report.unseen > 0 ? `🌱 未做 ${r.report.unseen} 题` : r.report.flaky > 0 ? `⚠️ ${r.report.flaky} 题要再练` : '继续巩固'}</h4>
      <div class="rec-stats">已掌握 ${r.report.solved + r.report.mastered}/${r.report.total}</div>
    </div>
  `).join('');
  row.querySelectorAll('.rec-card').forEach(b => b.addEventListener('click', () => {
    state.profile.grade = +b.dataset.grade;
    state.currentUnit = +b.dataset.unit;
    saveStore();
    renderAll();
    showView('learn');
  }));
}

function renderCalendar(containerId, days) {
  const container = $('#' + containerId);
  if (!container) return;
  const cal = Analytics.calendar(state.store, days);
  container.innerHTML = cal.map(c => {
    let level = 0;
    if (c.done) level = c.correct >= 3 ? 4 : c.correct >= 2 ? 3 : c.correct >= 1 ? 2 : 1;
    const tip = `${c.date}: ${c.done ? c.correct + '对 ' + c.wrong + '错' : '还没学习'}`;
    return `<div class="heat-cell" data-level="${level}" title="${tip}"></div>`;
  }).join('');
}

function updateStreakPill() {
  const el = $('#streakNum');
  if (el) el.textContent = Storage.streak();
}

/* ============ Learn (units) ============ */
function renderLearn() {
  const g = grade();
  const map = $('#planetMap');
  if (!map) return;
  map.innerHTML = g.units.map((u, i) => {
    const report = Analytics.unitReport(state.store, state.profile.grade, i);
    return `<button class="${i === state.currentUnit ? 'active' : ''}" data-unit="${i}">
      <i class="fa-solid ${u.icon}"></i><span>${u.title}</span><span style="opacity:.6">${report.solved}/${report.total}</span>
    </button>`;
  }).join('');
  map.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    state.currentUnit = +b.dataset.unit;
    renderLearn();
  }));

  const u = g.units[state.currentUnit];
  if (!u) return;
  $('#lessonPanel').innerHTML = `
    <p class="eyebrow">${g.name} · ${g.phase} · 第 ${state.currentUnit + 1} 章</p>
    <h2>${u.title}</h2>
    <blockquote>${u.motto}</blockquote>
    <div class="example"><span>先想一个小例子</span><p>${u.example}</p></div>
    <div class="mini-steps">${u.steps.map((s, i) => `<div><b>${i+1}</b><span>${s}</span></div>`).join('')}</div>
    <div style="margin-top:18px; padding-top:18px; border-top:2px dashed var(--line);">
      <p class="eyebrow">本单元 ${u.questions.length} 关</p>
      ${u.questions.map((q, i) => {
        const cls = Analytics.classifyQuestion(state.store, qKey(state.currentUnit, i));
        const badge = { solved:'✓ 已掌握', mastered:'🏆 满级', flaky:'⚠️ 反复错', shaky:'? 待巩固', unseen:'· 未做' }[cls];
        const color = { solved:'var(--mint)', mastered:'var(--mint)', flaky:'var(--coral)', shaky:'var(--peach)', unseen:'var(--muted)' }[cls];
        return `<div style="padding:8px 12px;background:var(--cream);border-radius:12px;margin-bottom:6px;display:flex;gap:10px;align-items:center;">
          <span class="task-num" style="font-size:18px">${String(i+1).padStart(2,'0')}</span>
          <span style="flex:1;font-size:13px">${escapeHTML(q.q.slice(0, 40))}${q.q.length > 40 ? '…' : ''}</span>
          <span style="font-size:12px;color:${color};font-weight:700">${badge} · ${'★'.repeat(q.diff)}</span>
        </div>`;
      }).join('')}
    </div>
    <button class="primary-btn full" id="lessonPracticeBtn">⚔️ 开始本单元挑战</button>
  `;
  $('#lessonPracticeBtn').addEventListener('click', () => {
    state.todayQueue = u.questions.map((q, qi) => ({ grade: state.profile.grade, unitIdx: state.currentUnit, qIdx: qi, q, source: 'new' }));
    state.currentQueueIdx = 0;
    resetQuestion();
    showView('practice');
  });
}

/* ============ Practice ============ */
function generateTodayQueue() {
  const out = [];
  const srsDue = SRS.dueToday(state.store);
  const gradeNum = state.profile.grade;

  if (srsDue.length > 0) {
    const prefer = srsDue.find(k => k.startsWith(`${gradeNum}:`)) || srsDue[0];
    const [g, u, q] = prefer.split(':').map(Number);
    const question = CURRICULUM[g]?.units[u]?.questions[q];
    if (question) out.push({ grade: g, unitIdx: u, qIdx: q, q: question, source: 'srs' });
  }

  const solved = new Set(state.store.attempts.filter(a => a.correct).map(a => a.key));
  for (let u = 0; u < CURRICULUM[gradeNum].units.length && out.length < 3; u++) {
    for (let q = 0; q < CURRICULUM[gradeNum].units[u].questions.length && out.length < 3; q++) {
      const k = qKey(u, q);
      if (solved.has(k)) continue;
      if (out.find(x => x.grade === gradeNum && x.unitIdx === u && x.qIdx === q)) continue;
      out.push({ grade: gradeNum, unitIdx: u, qIdx: q, q: CURRICULUM[gradeNum].units[u].questions[q], source: 'new' });
    }
  }
  if (out.length < 3) {
    for (let u = 0; u < CURRICULUM[gradeNum].units.length && out.length < 3; u++) {
      for (let q = 0; q < CURRICULUM[gradeNum].units[u].questions.length && out.length < 3; q++) {
        const question = CURRICULUM[gradeNum].units[u].questions[q];
        if (question.diff !== 1) continue;
        if (out.find(x => x.unitIdx === u && x.qIdx === q)) continue;
        out.push({ grade: gradeNum, unitIdx: u, qIdx: q, q: question, source: 'review' });
      }
    }
  }
  return out.slice(0, 3);
}

function startRandom() {
  const g = grade();
  const ui = Math.floor(Math.random() * g.units.length);
  const qi = Math.floor(Math.random() * g.units[ui].questions.length);
  state.todayQueue = [{ grade: state.profile.grade, unitIdx: ui, qIdx: qi, q: g.units[ui].questions[qi], source: 'random' }];
  state.currentQueueIdx = 0;
  resetQuestion();
  showView('practice');
}

function renderPractice() {
  const item = state.todayQueue[state.currentQueueIdx];
  if (!item) {
    $('#questionText').textContent = '今天 3 关全部完成！回首页看看明天的任务吧～';
    $('#options').innerHTML = '';
    $('#checkAnswer').disabled = true;
    $('#explainCard').classList.add('hidden');
    return;
  }
  const q = item.q;
  state.currentQKey = qKey(item.unitIdx, item.qIdx);

  $('#questionIndex').textContent = String(state.currentQueueIdx + 1).padStart(2, '0');
  $('#questionTotal').textContent = String(state.todayQueue.length).padStart(2, '0');
  $('#questionDiff').textContent = '★'.repeat(q.diff);
  $('#questionText').textContent = q.q;
  $('#options').innerHTML = q.options.map((opt, i) =>
    `<button class="option ${state.selectedAnswer === i ? 'selected' : ''}" data-answer="${i}"><b>${'ABCD'[i]}</b><span>${escapeHTML(opt)}</span></button>`
  ).join('');
  $$('.option').forEach(b => b.addEventListener('click', () => {
    if (state.answered) return;
    state.selectedAnswer = +b.dataset.answer;
    $$('.option').forEach(x => x.classList.toggle('selected', +x.dataset.answer === state.selectedAnswer));
    $('#checkAnswer').disabled = false;
  }));
  $('#hintBox').textContent = q.hint;
  $('#hintBox').classList.remove('visible');
  $('#checkAnswer').disabled = state.selectedAnswer === null || state.answered;
  $('#checkAnswer').innerHTML = '<span>✅ 看看对不对</span>';
  $('#explainCard').classList.add('hidden');
  $('#noteInput').value = Storage.getNote(state.currentQKey);
  $('#timerChip').textContent = '00:00';
  $('#nextBtnText').textContent = state.currentQueueIdx + 1 < state.todayQueue.length ? '下一关' : '回到营地';

  state.timerStart = Date.now();
  state.hintsUsed = 0;
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - state.timerStart) / 1000);
    $('#timerChip').textContent = formatTime(elapsed);
  }, 1000);
}

function resetQuestion() {
  state.selectedAnswer = null;
  state.answered = false;
  state.hintsUsed = 0;
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

function showHint() {
  $('#hintBox').classList.add('visible');
  state.hintsUsed += 1;
  toast(Stickers.foxSays('hint'));
}

function checkAnswer() {
  if (state.selectedAnswer === null || state.answered) return;
  const item = state.todayQueue[state.currentQueueIdx];
  if (!item) return;
  const q = item.q;
  const correct = state.selectedAnswer === q.answer;
  state.answered = true;

  const timeSpent = Math.round((Date.now() - state.timerStart) / 1000);
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }

  $$('.option').forEach(b => {
    const n = +b.dataset.answer;
    b.classList.toggle('correct', n === q.answer);
    b.classList.toggle('wrong', n === state.selectedAnswer && !correct);
    b.disabled = true;
  });
  $('#checkAnswer').disabled = true;

  // 答对奖励：贴纸 + 升级提示
  let stickerResult = null;
  // SRS + 流水
  const key = state.currentQKey;
  if (item.source !== 'srs') SRS.first(state.store, key);
  if (correct) {
    SRS.pass(state.store, key);
    const theme = Stickers.pickTheme(q);
    stickerResult = Stickers.award(state.store, theme.id);
  } else {
    SRS.fail(state.store, key);
  }
  Storage.recordAttempt(state.profile.grade, item.unitIdx, item.qIdx, correct, key, timeSpent, state.hintsUsed);
  // 同步：把内存里的 srs + stickers + wrongBook 都合并到 localStorage
  const latest = Storage.load();
  latest.srs = state.store.srs;
  latest.stickers = state.store.stickers;
  if (!correct) {
    latest.wrongBook[key] = latest.wrongBook[key] || { addedAt: todayStr(), attempts: 0, mastered: false };
    latest.wrongBook[key].attempts += 1;
  }
  Storage.save(latest);
  loadStore();

  // 贴纸飞舞动画
  try {
    if (correct && stickerResult) {
      const theme = Stickers.themes[stickerResult.themeId];
      const cardRect = document.querySelector('.question-card').getBoundingClientRect();
      flySticker(theme.emoji, cardRect.left + cardRect.width / 2, cardRect.top + 60, () => {
        renderStickerGrid();
      });
    }
  } catch (e) { console.error('flySticker err:', e); }

  try {
    // 解题路线 + 讲解（正确和错误都显示）
    const showSteps = true;
    const explainTitle = correct
      ? '✅ 答对啦！来看解题思路 👇'
      : Stickers.encourage(false);
    $('#explainTitle').textContent = explainTitle;
    const stickerTheme = correct && stickerResult ? Stickers.themes[stickerResult.themeId] : null;
    if (stickerTheme) {
      $('#rewardEmoji').textContent = stickerTheme.emoji;
    } else {
      $('#rewardEmoji').textContent = correct ? '⭐' : '💪';
    }
    $('#rewardTitle').textContent = correct
      ? (stickerResult?.level > 0 && stickerResult.count === Stickers.levels[stickerResult.level].count
          ? `🎉 升级到${Stickers.levels[stickerResult.level].name}啦！`
          : `贴纸 +1 · ${stickerTheme?.name || '数学之星'}`)
      : '继续努力！下次一定行 💪';
    $('#solutionSteps').innerHTML = Explanations.render(q.explanation) + q.steps.map((s, i) =>
      `<div class="solution-step"><span>${i+1}</span><span>${s}</span></div>`
    ).join('');
    $('#explainCard').classList.remove('hidden');
    toast(Stickers.encourage(correct, stickerResult?.count === (Stickers.levels[stickerResult?.level]?.count)));
    $('#explainCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) { console.error('checkAnswer 异常:', e.message, e.stack); }
}

function flySticker(emoji, fromX, fromY, callback) {
  const el = document.createElement('div');
  el.className = 'flying-sticker';
  el.textContent = emoji;
  el.style.left = fromX + 'px';
  el.style.top = fromY + 'px';
  document.getElementById('flyLayer').appendChild(el);
  // 目标位置：sidebar 顶部
  const target = document.querySelector('.streak-pill') || document.querySelector('.profile-pill');
  let targetX = window.innerWidth - 100;
  let targetY = 30;
  if (target) {
    const r = target.getBoundingClientRect();
    targetX = r.left + r.width / 2;
    targetY = r.top + r.height / 2;
  }
  requestAnimationFrame(() => {
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`;
    el.style.opacity = '0';
  });
  setTimeout(() => {
    el.remove();
    if (callback) callback();
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${String(m).padStart(2,'0')}:${ss}`;
}

function saveNote() {
  if (!state.currentQKey) return;
  Storage.setNote(state.currentQKey, $('#noteInput').value);
  toast('💾 笔记保存啦');
}

function nextQuestion() {
  if (state.currentQueueIdx + 1 < state.todayQueue.length) {
    state.currentQueueIdx += 1;
    resetQuestion();
    renderPractice();
  } else {
    showView('home');
    toast(Stickers.foxSays('finish'));
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============ Wrong book ============ */
function renderWrong() {
  const container = $('#wrongList');
  if (!container) return;
  const wrongs = SRS.wrongList(state.store);
  if (!wrongs.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-emoji">🌟</span><p>${Stickers.foxSays('empty_wrong')}</p></div>`;
    return;
  }
  container.innerHTML = wrongs.map(w => {
    const [g, u, q] = w.key.split(':').map(Number);
    const question = CURRICULUM[g]?.units[u]?.questions[q];
    if (!question) return '';
    return `<div class="wrong-row">
      <div class="wrong-meta">
        <span class="wrong-grade">${CURRICULUM[g].name} · ${CURRICULUM[g].units[u].title}</span>
        <span class="wrong-stars">${'★'.repeat(question.diff)}</span>
        <span>box ${w.box + 1} / 4</span>
      </div>
      <p class="wrong-q">${escapeHTML(question.q)}</p>
      <div class="wrong-stats">
        <span>✅ ${w.correct} 次</span>
        <span>❌ ${w.wrong} 次</span>
        <span>${w.box >= 3 ? '🏆 已掌握' : `${SRS.INTERVALS[w.box]} 天后再来`}</span>
      </div>
      <div class="wrong-actions">
        <button class="primary-btn small" data-practice="${w.key}">⚔️ 再来一次</button>
        <button class="ghost-btn small" data-master="${w.key}">✓ 我会啦</button>
      </div>
    </div>`;
  }).join('');
  container.querySelectorAll('[data-practice]').forEach(b => b.addEventListener('click', () => {
    const [g, u, q] = b.dataset.practice.split(':').map(Number);
    const question = CURRICULUM[g].units[u].questions[q];
    state.profile.grade = g;
    saveStore();
    state.todayQueue = [{ grade: g, unitIdx: u, qIdx: q, q: question, source: 'srs' }];
    state.currentQueueIdx = 0;
    resetQuestion();
    showView('practice');
  }));
  container.querySelectorAll('[data-master]').forEach(b => b.addEventListener('click', () => {
    Storage.markMastered(b.dataset.master);
    loadStore();
    renderWrong();
    toast('🎉 标为已掌握！');
  }));
}

/* ============ Stickers Album ============ */
function renderStickers() {
  const album = $('#stickerAlbum');
  if (!album) return;
  album.innerHTML = Object.values(Stickers.themes).map(t => {
    const stickers = state.store.stickers?.[t.id] || [];
    const cells = [];
    for (let i = 0; i < 20; i++) {
      const has = i < stickers.length;
      cells.push(`<div class="sticker-cell ${has ? '' : 'empty'}" style="${has ? 'border-color:' + t.color : ''}">
        <div class="sticker-emoji-big">${has ? t.emoji : '⬜'}</div>
        <div class="sticker-label">${has ? '已收集' : '待收集'}</div>
      </div>`);
    }
    return `<div style="grid-column:1/-1; margin-top:12px;">
      <p class="eyebrow" style="color:${t.color}">${t.emoji} ${t.name} · 已收集 ${stickers.length} / 20</p>
      <div class="sticker-album">${cells.join('')}</div>
    </div>`;
  }).join('');
}

/* ============ Progress ============ */
function renderProgress() {
  const g = Analytics.globalReport(state.store);
  $('#statAttempts').textContent = g.totalAttempts;
  $('#statAccuracy').textContent = g.accuracy + '%';
  $('#statAvgTime').textContent = g.avgTime + 's';
  $('#statMastered').textContent = g.mastered;
  updateStreakPill();

  const ur = $('#unitReport');
  if (ur) {
    ur.innerHTML = grade().units.map((u, i) => {
      const r = Analytics.unitReport(state.store, state.profile.grade, i);
      const total = r.total || 1;
      const segs = [
        { cls: 'mastered', count: r.mastered, color: 'var(--mint)' },
        { cls: 'solved', count: r.solved, color: 'var(--peach)' },
        { cls: 'shaky', count: r.shaky, color: 'var(--amber, #F59E0B)' },
        { cls: 'flaky', count: r.flaky, color: 'var(--coral)' },
        { cls: 'unseen', count: r.unseen, color: 'var(--line)' },
      ];
      return `<div class="unit-row">
        <span class="unit-num">${String(i+1).padStart(2,'0')}</span>
        <div>
          <div class="unit-title">${u.title}</div>
          <div class="unit-bar">
            ${segs.map(s => s.count > 0 ? `<div style="width:${(s.count/total*100)}%;background:${s.color}"></div>` : '').join('')}
          </div>
        </div>
        <div class="unit-legend">${r.solved + r.mastered}/${r.total} · ${r.score}分</div>
      </div>`;
    }).join('');
  }
  renderCalendar('calendarLarge', 60);
}

/* ============ Profile ============ */
function renderProfile() {
  const g = grade();
  $('#profileName').textContent = state.profile.name || '豆豆';
  $('#profileGrade').textContent = g.name;
  $('#profileAvatar').textContent = (state.profile.name || '豆').slice(0, 1);
  updateStreakPill();
}

function openProfile() {
  renderGrades();
  $('#nameInput').value = state.profile.name || '';
  $('#profileModal').classList.remove('hidden');
}
function closeProfile() { $('#profileModal').classList.add('hidden'); }
function renderGrades() {
  $('#gradeGrid').innerHTML = Object.entries(CURRICULUM).map(([g, c]) =>
    `<button class="grade-choice ${+g === state.profile.grade ? 'selected' : ''}" data-grade="${g}"><b>${c.name}</b><span>${c.age}</span></button>`
  ).join('');
  $$('.grade-choice').forEach(b => b.addEventListener('click', () => {
    state.profile.grade = +b.dataset.grade;
    renderGrades();
  }));
}
function saveProfile() {
  state.profile.name = $('#nameInput').value.trim();
  saveStore();
  loadStore();
  closeProfile();
  renderAll();
  toast(`🎉 切换到${grade().name}啦！`);
}

function renderAll() {
  state.todayQueue = generateTodayQueue();
  renderProfile();
  renderHome();
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 2600);
}

document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();