/* ============================================================
   豆豆数学探险队 v4.0 · 间隔重复引擎
   Leitner 简化版：box 0→1天, 1→3天, 2→7天, 3→14天(掌握)
   ============================================================ */

const SRS = {
  INTERVALS: [1, 3, 7, 14],

  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  addDays(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  },

  first(store, key) {
    store.srs = store.srs || {};
    if (!store.srs[key]) {
      store.srs[key] = { box: 0, lastReview: null, dueDate: null, correct: 0, wrong: 0, mastered: false };
    }
    if (!store.srs[key].lastReview) {
      store.srs[key].box = 0;
      store.srs[key].lastReview = this.today();
      store.srs[key].dueDate = this.addDays(store.srs[key].lastReview, this.INTERVALS[0]);
    }
    return store.srs[key];
  },

  fail(store, key) {
    const rec = this.first(store, key);
    rec.box = 0;
    rec.wrong += 1;
    rec.lastReview = this.today();
    rec.dueDate = this.addDays(rec.lastReview, this.INTERVALS[0]);
    return rec;
  },

  pass(store, key) {
    const rec = this.first(store, key);
    rec.correct += 1;
    if (rec.box < this.INTERVALS.length - 1) rec.box += 1;
    rec.lastReview = this.today();
    if (rec.box >= this.INTERVALS.length - 1) {
      rec.dueDate = null;
      rec.mastered = true;
    } else {
      rec.dueDate = this.addDays(rec.lastReview, this.INTERVALS[rec.box]);
    }
    return rec;
  },

  dueToday(store) {
    const today = this.today();
    const out = [];
    Object.entries(store.srs || {}).forEach(([k, r]) => {
      if (r.mastered) return;
      if (r.dueDate && r.dueDate <= today) out.push(k);
    });
    return out;
  },

  wrongList(store) {
    const out = [];
    Object.entries(store.srs || {}).forEach(([k, r]) => {
      if (r.wrong > 0 && !r.mastered) out.push({ key: k, ...r });
    });
    return out.sort((a, b) => b.wrong - a.wrong);
  },
};