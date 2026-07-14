/* ============================================================
   豆豆数学探险队 v5.0 · 贴纸收集册
   4 个主题：⭐ 数学之星 / 🧭 探险家 / 🔬 科学家 / 🏆 冠军
   每个主题下分 3 级：铜 (5 颗) → 银 (10 颗) → 金 (20 颗)
   每次答对 1 题，自动给一个对应主题的贴纸
   ============================================================ */

const Stickers = {
  themes: {
    star:  { id: 'star',  name: '数学之星', emoji: '⭐', color: '#F59E0B', desc: '答对数学题的奖励' },
    road:  { id: 'road',  name: '探险家',   emoji: '🧭', color: '#34D399', desc: '探索新章节' },
    lab:   { id: 'lab',   name: '科学家',   emoji: '🔬', color: '#8B5CF6', desc: '突破难题' },
    champ: { id: 'champ', name: '冠军',     emoji: '🏆', color: '#FB923C', desc: '连续学习' },
  },
  levels: [
    { name: '铜', count: 5,  emoji: '🥉' },
    { name: '银', count: 10, emoji: '🥈' },
    { name: '金', count: 20, emoji: '🥇' },
  ],

  /** 根据题目类型选贴纸主题 */
  pickTheme(q) {
    const tags = q.tags || [];
    if (tags.includes('实验') || tags.includes('探究')) return this.themes.lab;
    if (tags.includes('探险') || q.diff === 3) return this.themes.road;
    if (q.diff === 1) return this.themes.star;
    return this.themes.star;
  },

  /** 答对时奖励 1 颗贴纸 */
  award(store, themeId) {
    if (!this.themes[themeId]) return null;
    store.stickers = store.stickers || { star: [], road: [], lab: [], champ: [] };
    const stamp = { date: this._today(), ts: Date.now() };
    store.stickers[themeId].push(stamp);
    // 检查升级
    const count = store.stickers[themeId].length;
    const level = this._levelFor(count);
    return { themeId, count, level };
  },

  /** 根据题库全局时间线奖连续学习贴纸 */
  awardStreak(store) {
    return this.award(store, 'champ');
  },

  _levelFor(count) {
    let level = 0;
    for (let i = 0; i < this.levels.length; i++) {
      if (count >= this.levels[i].count) level = i;
    }
    return level;
  },

  progressFor(store, themeId) {
    const stickers = store.stickers?.[themeId] || [];
    const count = stickers.length;
    const level = this._levelFor(count);
    const currentTarget = this.levels[level].count;
    const nextLevel = this.levels[level + 1];
    let progress;
    if (nextLevel) {
      // 当前等级内的进度：count / currentTarget * 100
      progress = Math.round(count / currentTarget * 100);
    } else {
      // 满级
      progress = 100;
    }
    return {
      count,
      level,
      levelName: this.levels[level].name,
      nextLevel: nextLevel?.name,
      need: nextLevel ? nextLevel.count - count : 0,
      progress: Math.max(0, Math.min(100, progress)),
    };
  },

  totalCount(store) {
    if (!store.stickers) return 0;
    return Object.values(store.stickers).reduce((s, arr) => s + arr.length, 0);
  },

  /** 友好鼓励语（按对错 + 等级） */
  encourage(correct, levelUp = false) {
    if (levelUp) return ['🎉 升级啦！', '太厉害啦！', '新等级解锁 ✨', '你比昨天更强！'][Math.floor(Math.random() * 4)];
    if (correct) return ['太棒了！', '答对啦！', '聪明！', '你真会动脑筋！', '再来一题！'][Math.floor(Math.random() * 5)];
    return ['别灰心，再想想！', '看看提示吧～', '下次一定行！', '错了也没关系～'][Math.floor(Math.random() * 4)];
  },

  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  /** 老师小狐狸的气泡语 */
  foxSays(context) {
    const lines = {
      welcome: ['嗨，豆豆！今天我们来探险啦～', '准备好今天的 3 关了吗？', '小狐狸陪你一起思考！'],
      start: ['先看看题目，慢慢想～', '图里藏着小提示哦！', '读题三遍，再下手！'],
      hint: ['提示来了，睁大眼睛看！', '小狐狸觉得可以从这里开始想～', '看看图，关系就出来啦～'],
      correct: ['太棒了！思路清晰！', '你跟小狐狸想的一样！', '答对啦，奖励一颗⭐！'],
      wrong: ['别急，看看图解我们再走一遍～', '小提示：试试画个图？', '订正一次，记忆更深！'],
      finish: ['今天的 3 关搞定！休息一下吧～', '你真厉害，明天继续！', '小狐狸为你骄傲！'],
      empty_wrong: ['错题本是空的，太棒啦！', '你真是个小数学家！'],
      streak: ['连续学习 N 天！', '坚持就是胜利！'],
    };
    const arr = lines[context] || ['加油！'];
    return arr[Math.floor(Math.random() * arr.length)];
  },
};