/* ============================================================
   豆豆数学探险队 v5.0 · 本地存储
   单一 key：doudou_math_v5
   自动从 v1/v2/v3/v4 迁移
   ============================================================ */

const STORAGE_KEY = 'doudou_math_v5';
const LEGACY_KEYS = ['doudou_math_v1', 'doudou_math_v2', 'doudou_math_v3', 'doudou_math_v4',
                     'doudou_math_profile_v2', 'doudou_math_profile_v3',
                     'doudou_math_progress_v2', 'doudou_math_progress_v3'];

const Storage = {
  defaults() {
    return {
      version: 5,
      profile: { grade: 3, name: '' },
      attempts: [],
      srs: {},
      wrongBook: {},
      checkIn: {},
      totalCorrect: 0,
      totalWrong: 0,
      totalTime: 0,
      notes: {},
      stickers: { star: [], road: [], lab: [], champ: [] },  // 4 类贴纸
    };
  },

  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  load() {
    let data = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) { console.warn('v5 加载失败', e); }
    if (!data) data = this._migrate();
    const merged = { ...this.defaults(), ...data };
    merged.profile = { ...this.defaults().profile, ...(data.profile || {}) };
    merged.stickers = { ...this.defaults().stickers, ...(data.stickers || {}) };
    return merged;
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) { console.error('保存失败', e); return false; }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
    return this.defaults();
  },

  _migrate() {
    const out = this.defaults();
    try {
      const v4 = JSON.parse(localStorage.getItem('doudou_math_v4') || localStorage.getItem('doudou_math_v3') || 'null');
      if (v4) {
        if (v4.profile) out.profile = v4.profile;
        if (Array.isArray(v4.attempts)) out.attempts = v4.attempts;
        if (v4.srs) out.srs = v4.srs;
        if (v4.wrongBook) out.wrongBook = v4.wrongBook;
        if (v4.checkIn) out.checkIn = v4.checkIn;
        if (v4.notes) out.notes = v4.notes;
        if (v4.totalCorrect) out.totalCorrect = v4.totalCorrect;
        if (v4.totalWrong) out.totalWrong = v4.totalWrong;
        if (v4.totalTime) out.totalTime = v4.totalTime;
      }
    } catch (e) { console.warn('v4 迁移失败', e); }
    this.save(out);
    return out;
  },

  recordAttempt(grade, unitIdx, qIdx, isCorrect, qKey, timeSpent = 0, hintsUsed = 0) {
    const data = this.load();
    const date = this._today();
    data.attempts.push({ key: qKey, grade, unit: unitIdx, qIdx, correct: isCorrect, date, timeSpent, hintsUsed, ts: Date.now() });
    if (isCorrect) data.totalCorrect += 1;
    else data.totalWrong += 1;
    data.totalTime += timeSpent;
    if (!data.checkIn[date]) data.checkIn[date] = { done: false, correct: 0, wrong: 0, timeSpent: 0, questions: [] };
    const ci = data.checkIn[date];
    if (isCorrect) ci.correct += 1; else ci.wrong += 1;
    ci.timeSpent += timeSpent;
    ci.done = true;
    if (!ci.questions.includes(qKey)) ci.questions.push(qKey);
    if (!isCorrect) {
      data.wrongBook[qKey] = data.wrongBook[qKey] || { addedAt: date, attempts: 0, mastered: false };
      data.wrongBook[qKey].attempts += 1;
    }
    this.save(data);
  },

  markMastered(key) {
    const data = this.load();
    if (data.wrongBook[key]) data.wrongBook[key].mastered = true;
    if (data.srs[key]) data.srs[key].mastered = true;
    this.save(data);
  },

  removeWrong(key) {
    const data = this.load();
    delete data.wrongBook[key];
    this.save(data);
  },

  setNote(key, note) {
    const data = this.load();
    if (note && note.trim()) data.notes[key] = note.trim();
    else delete data.notes[key];
    this.save(data);
  },

  getNote(key) {
    return this.load().notes[key] || '';
  },

  streak() {
    const data = this.load();
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      if (data.checkIn[key] && data.checkIn[key].done) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return streak;
  },

  statsForGrade(grade) {
    const data = this.load();
    const items = data.attempts.filter(a => a.grade === grade);
    const correct = items.filter(a => a.correct).length;
    const acc = items.length ? Math.round(correct / items.length * 100) : 0;
    const timeSum = items.reduce((s, a) => s + (a.timeSpent || 0), 0);
    return {
      attempts: items.length,
      correct, wrong: items.length - correct,
      accuracy: acc, timeSum,
      avgTime: items.length ? Math.round(timeSum / items.length) : 0,
      streak: this.streak(),
      mastered: Object.values(data.srs).filter(r => r.mastered).length,
    };
  },

  statsForUnit(grade, unitIdx) {
    const data = this.load();
    const items = data.attempts.filter(a => a.grade === grade && a.unit === unitIdx);
    const correct = items.filter(a => a.correct).length;
    const total = CURRICULUM[grade]?.units[unitIdx]?.questions.length || 0;
    const firstTry = items.filter(a => a.correct && a.hintsUsed === 0).length;
    return {
      attempts: items.length, correct,
      solved: new Set(items.filter(a => a.correct).map(a => a.key)).size,
      total, firstTry,
      accuracy: items.length ? Math.round(correct / items.length * 100) : 0,
    };
  },

  statsForQuestion(key) {
    const data = this.load();
    const items = data.attempts.filter(a => a.key === key);
    return {
      attempts: items.length,
      correct: items.filter(a => a.correct).length,
      wrong: items.filter(a => !a.correct).length,
      lastTry: items.length ? items[items.length - 1] : null,
    };
  },
};