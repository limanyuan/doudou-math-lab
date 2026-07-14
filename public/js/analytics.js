/* ============================================================
   豆豆数学探险队 v4.0 · 分析与推荐
   - 掌握度细化（每题的首次答对率、平均用时）
   - 推荐路径（基于错题频率推荐先做哪个单元）
   ============================================================ */

const Analytics = {
  /** 题目掌握度：solved (首次即对) / flaky (反复错) / unseen (没做过) / mastered (SRS 4级) */
  classifyQuestion(store, key) {
    const items = store.attempts.filter(a => a.key === key);
    const srs = store.srs[key];
    if (!items.length) return 'unseen';
    if (srs?.mastered) return 'mastered';
    const wrong = items.filter(a => !a.correct).length;
    const correct = items.filter(a => a.correct).length;
    const firstTry = items.find(a => a.correct && a.hintsUsed === 0);
    if (firstTry && wrong === 0) return 'solved';
    if (wrong >= 2) return 'flaky';
    if (correct > 0 && wrong > 0) return 'shaky';
    return 'unseen';
  },

  /** 单元掌握度报告 */
  unitReport(store, grade, unitIdx) {
    const u = CURRICULUM[grade]?.units[unitIdx];
    if (!u) return null;
    const report = {
      title: u.title,
      total: u.questions.length,
      solved: 0, flaky: 0, shaky: 0, unseen: 0, mastered: 0,
      questions: [],
    };
    u.questions.forEach((q, qi) => {
      const key = `${grade}:${unitIdx}:${qi}`;
      const cls = this.classifyQuestion(store, key);
      const items = store.attempts.filter(a => a.key === key);
      const timeAvg = items.length ? Math.round(items.reduce((s,a) => s + (a.timeSpent||0), 0) / items.length) : 0;
      report[cls] += 1;
      report.questions.push({ key, q, classification: cls, attempts: items.length, timeAvg });
    });
    report.score = Math.round((report.solved + report.mastered * 2) / (report.total * 2) * 100);
    return report;
  },

  /** 推荐下一个要做的单元（按错题率 + 未完成度排序） */
  recommend(store, currentGrade) {
    const recs = [];
    Object.entries(CURRICULUM).forEach(([g, grade]) => {
      // 推荐当前年级和上下 1 个年级
      if (Math.abs(+g - currentGrade) > 1) return;
      grade.units.forEach((u, ui) => {
        const r = this.unitReport(store, +g, ui);
        if (!r) return;
        // 优先级：未做 > flaky > shaky > solved > mastered
        let priority = 0;
        priority += r.unseen * 3;
        priority += r.flaky * 5;
        priority += r.shaky * 2;
        if (r.total > 0 && r.solved + r.mastered === r.total) priority -= 10;  // 已完成的降权
        recs.push({ grade: +g, unitIdx: ui, title: u.title, priority, report: r });
      });
    });
    return recs.sort((a, b) => b.priority - a.priority).slice(0, 5);
  },

  /** 总体学习日历（过去 N 天） */
  calendar(store, days = 30) {
    const out = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dd}`;
      const ci = store.checkIn[key];
      out.push({
        date: key,
        done: !!ci?.done,
        correct: ci?.correct || 0,
        wrong: ci?.wrong || 0,
        timeSpent: ci?.timeSpent || 0,
      });
    }
    return out;
  },

  /** 全局小报告 */
  globalReport(store) {
    return {
      totalAttempts: store.attempts.length,
      accuracy: store.attempts.length ? Math.round(store.totalCorrect / store.attempts.length * 100) : 0,
      totalTime: store.totalTime,
      avgTime: store.attempts.length ? Math.round(store.totalTime / store.attempts.length) : 0,
      mastered: Object.values(store.srs).filter(r => r.mastered).length,
      streak: Storage.streak(),
      grades: Object.keys(CURRICULUM).map(g => ({
        grade: +g,
        ...Storage.statsForGrade(+g),
      })),
    };
  },
};