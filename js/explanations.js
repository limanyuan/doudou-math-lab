/* ============================================================
   豆豆数学探险队 v3.0 · 图解工厂
   每道题可内联一个 explanation 对象：{kind, ...}
   kind 包括：
     - lineSeg        线段图（和差、分数、年龄等）
     - balance        天平（等量代换）
     - table          数表 / 数轴
     - tree           倒推 / 因果树
     - sequence       数列 / 找规律
     - fractionBar    分数条
     - circle         环形间隔 / 植树
     - travel         行程图（含动画：车/船移动）
     - geometry       几何图（含 Canvas 拖拽：标对应顶点/辅助线）
     - probability    概率 / 统计图
     - proof          证明 / 数轴
   ============================================================ */

const Explanations = {
  /* ---------- 静态 SVG 基础 ---------- */
  wrap(title, tip, svgBody, caption = '先看颜色、箭头和分段，再读下面的文字步骤。') {
    return `
      <section class="visual-explanation">
        <h3><i class="fa-solid fa-image"></i> 看图想关系：${title}</h3>
        <p>${tip}</p>
        ${svgBody}
        <div class="visual-caption"><i class="fa-solid fa-eye"></i><span>${caption}</span></div>
      </section>`;
  },

  /* ---------- 1. 线段图 ---------- */
  lineSeg({ a = 1, b = 1, diff = 1, total = '', labels = ['一份', '一份', '差'] }) {
    const W = 560, H = 170, baseY = 50, gap = 30;
    const unit = 90;
    const w1 = unit * a, w2 = unit * b, wd = unit * diff;
    const x = 60;
    const y1 = baseY;
    const y2 = baseY + 50 + gap;
    const y3 = y2 + 50 + gap;
    return this.wrap(
      '把"总数"和"差"画成线段',
      '两条长度相近的线段，让"谁多、谁少、差多少"一眼可见。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="线段图">
        <rect class="soft" x="${x}" y="${y1}" width="${w1}" height="30" rx="8"/>
        <text x="${x + 10}" y="${y1 + 20}">${labels[0]}</text>
        <rect class="warm" x="${x}" y="${y2}" width="${w2}" height="30" rx="8"/>
        <text x="${x + 10}" y="${y2 + 20}">${labels[1]}</text>
        <rect class="accent" x="${x + w2}" y="${y2}" width="${wd}" height="30" rx="8"/>
        <text x="${x + w2 + 6}" y="${y2 + 20}">${labels[2]}</text>
        <path class="dash" d="M${x} ${y1 + 32} H${x + Math.max(w1, w2 + wd)}"/>
        <text class="small" x="${x + Math.max(w1, w2 + wd) + 6}" y="${y1 + 36}">总数 ${total}</text>
        <text class="small" x="${x + w2 - 30}" y="${y2 + 50}">先去掉"差"</text>
        <text class="small" x="${x + 10}" y="${y3 - 8}">剩下两份一样多</text>
        <path class="line" d="M${x} ${y2 + 30} H${x + w2}"/>
        <path class="line" d="M${x + w2} ${y2 + 30} H${x + w2 + wd}"/>
      </svg>`
    );
  },

  /* ---------- 2. 天平 / 等量代换 ---------- */
  balance({ left = ['🍎', 1], right = ['🍐', 1], extra = '?', extraLabel = '一个梨' }) {
    const W = 560, H = 200;
    return this.wrap(
      '天平的两边永远一样重',
      '把相同的部分互相抵消，看哪一边"多出来"的就是答案。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="天平">
        <line class="line" x1="280" y1="40" x2="280" y2="180"/>
        <line class="line" x1="120" y1="80" x2="440" y2="80"/>
        <circle class="accent" cx="280" cy="40" r="8"/>
        <text class="small" x="298" y="44">支点</text>
        <g><text x="150" y="120" font-size="34">${left[0]}</text>
           <text x="180" y="120" font-size="34">${left[0]}</text>
           <text class="small" x="140" y="148">${left[1]} 个</text></g>
        <g><text x="380" y="120" font-size="34">${right[0]}</text>
           <text x="410" y="120" font-size="34">${right[0]}</text>
           <text class="small" x="370" y="148">${right[1]} 个</text></g>
        <path class="dash" d="M120 160 H440"/>
        <text class="small" x="220" y="180">两边重量相等 → 多出来的 = ${extraLabel}</text>
        <text x="275" y="195" font-size="22" font-weight="700" fill="#e76f51">${extra}</text>
      </svg>`
    );
  },

  /* ---------- 3. 倒推 / 因果树 ---------- */
  tree({ result = 5, ops = ['×2', '+1', '×2', '+2'], labels = ['最后', '前一天', '前两天', '原来'] }) {
    const W = 560, H = 200;
    const cols = ops.length + 1;
    const colW = W / (cols + 1);
    let svg = '';
    for (let i = 0; i < cols; i++) {
      const cx = colW * (i + 1);
      const cy = 100;
      const cls = i === 0 ? 'accent' : i === cols - 1 ? 'warm' : 'soft';
      svg += `<rect class="${cls}" x="${cx - 40}" y="${cy - 25}" width="80" height="50" rx="10"/>`;
      svg += `<text x="${cx}" y="${cy + 5}" font-size="14" fill="#164b4a">${labels[i] || ''}</text>`;
      if (i < cols - 1) {
        svg += `<path class="line" d="M${cx + 40} ${cy} H${cx + colW - 40}"/>`;
        svg += `<path class="line" d="M${cx + colW - 40} ${cy} l-12 -8 M${cx + colW - 40} ${cy} l-12 8"/>`;
        svg += `<text class="small" x="${cx + colW / 2 - 14}" y="${cy - 12}">${ops[i]}</text>`;
      }
    }
    return this.wrap(
      '从最后的结果倒着走',
      '箭头向左，把原来的"减、除"反过来变成"加、乘"。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="倒推">${svg}
       <text class="small" x="40" y="180">结果 = ${result}</text>
       <text class="small" x="430" y="180">原来的量 = ?</text>
      </svg>`
    );
  },

  /* ---------- 4. 数列 / 找规律 ---------- */
  sequence({ seq = [2, 4, 6, 8, '?'], op = '+2' }) {
    const W = 560, H = 170;
    const n = seq.length;
    const R = 28, gap = (W - 120) / (n - 1);
    let circles = '', arrows = '', labels = '';
    seq.forEach((v, i) => {
      const cx = 60 + gap * i;
      const cls = i === n - 1 ? 'warm' : 'soft';
      circles += `<circle class="${cls}" cx="${cx}" cy="85" r="${R}"/>`;
      circles += `<text x="${cx}" y="92" text-anchor="middle" font-weight="700" fill="#164b4a">${v}</text>`;
      if (i < n - 1) {
        arrows += `<path class="line" d="M${cx + R} 85 H${cx + gap - R}"/>`;
        arrows += `<path class="line" d="M${cx + gap - R} 85 l-10 -7 M${cx + gap - R} 85 l-10 7"/>`;
        labels += `<text class="small" x="${cx + gap / 2 - 8}" y="60">${op}</text>`;
      }
    });
    return this.wrap(
      '把变化排成队',
      '看相邻两项之间"加了什么、乘了什么"，就能预测下一项。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="数列">
        ${circles}${arrows}${labels}
        <text class="small" x="40" y="150">相邻两项：</text>
        <text class="small" x="120" y="150">每次 +2 → 8 + 2 = 10</text>
      </svg>`
    );
  },

  /* ---------- 5. 分数条 ---------- */
  fractionBar({ total = 3, fill = 1, label = '1/3' }) {
    const W = 560, H = 170;
    const barX = 60, barY = 50, barW = 440, barH = 50;
    const segW = barW / total;
    let segs = '';
    for (let i = 0; i < total; i++) {
      const cls = i < fill ? 'accent' : 'soft';
      segs += `<rect class="${cls}" x="${barX + segW * i}" y="${barY}" width="${segW}" height="${barH}" rx="4"/>`;
      segs += `<line class="line" x1="${barX + segW * (i + 1)}" y1="${barY}" x2="${barX + segW * (i + 1)}" y2="${barY + barH}"/>`;
    }
    return this.wrap(
      '把整体平均分成几份',
      `先确定"整体 1"是谁，再看占了 ${total} 份中的几份。`,
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="分数条">
        ${segs}
        <text x="${barX + segW * fill - 14}" y="${barY + barH + 22}" font-weight="700" fill="#164b4a">${label}</text>
        <text class="small" x="${barX + 10}" y="${barY - 8}">整体 = 1</text>
        <text class="small" x="${barX + barW - 80}" y="${barY + barH + 22}">共 ${total} 份</text>
      </svg>`
    );
  },

  /* ---------- 6. 环形间隔 / 植树 ---------- */
  circle({ points = 5, interval = 1 }) {
    const W = 560, H = 200;
    const cx = W / 2, cy = 110, R = 75;
    let dots = '', labels = '';
    for (let i = 0; i < points; i++) {
      const a = (i / points) * 2 * Math.PI - Math.PI / 2;
      const px = cx + R * Math.cos(a);
      const py = cy + R * Math.sin(a);
      dots += `<circle class="warm" cx="${px}" cy="${py}" r="10"/>`;
      labels += `<text class="small" x="${px + 14}" y="${py + 4}">${i + 1}</text>`;
    }
    return this.wrap(
      '环形首尾相连',
      '点数和间隔数的关系：两端都种 = 间隔数；环形 = 间隔数 = 点数。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="环形">
        <circle class="line" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e6dcc7" stroke-width="2" stroke-dasharray="6 4"/>
        ${dots}${labels}
        <text class="small" x="${cx - 30}" y="${cy + R + 30}">${points} 个点，${points} 个间隔</text>
      </svg>`
    );
  },

  /* ---------- 7. 行程图（带 SVG 动画） ---------- */
  travel({ aStart = 'A', aSpeed = 60, bStart = 'B', bSpeed = 60, mode = 'meet', totalKm = 240 }) {
    const W = 560, H = 220;
    const startX = 50, endX = W - 50, roadY = 130;
    const totalSec = 4; // 动画时长 4s
    let aDir = mode === 'meet' ? 1 : 0; // 相向 1，同向 0（追及往后）
    let bDir = mode === 'meet' ? -1 : mode === 'chase' ? 1 : 1;
    let aPath = '', bPath = '';
    if (mode === 'meet') {
      aPath = `M${startX} ${roadY - 30} H${endX}`;
      bPath = `M${endX} ${roadY + 30} H${startX}`;
    } else if (mode === 'chase') {
      aPath = `M${startX + 40} ${roadY - 30} H${endX - 20}`;
      bPath = `M${startX} ${roadY + 30} H${endX}`;
    } else {
      aPath = `M${startX} ${roadY - 30} H${endX - 40}`;
      bPath = `M${startX + 80} ${roadY + 30} H${endX}`;
    }
    return this.wrap(
      mode === 'meet' ? '相向而行，速度相加' : mode === 'chase' ? '同向追及，速度相减' : '同向而行',
      mode === 'meet' ? '相向时每小时靠近的距离 = 两车速度之和。' : '追及时每小时靠近的距离 = 两车速度之差。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="行程">
        <line class="line" x1="${startX}" y1="${roadY}" x2="${endX}" y2="${roadY}" stroke-dasharray="6 4"/>
        <text class="small" x="${startX - 14}" y="${roadY + 4}">${aStart}</text>
        <text class="small" x="${endX - 8}" y="${roadY + 4}">${bStart}</text>
        <text class="small" x="${startX}" y="${roadY + 24}">甲 ${aSpeed} km/h</text>
        <text class="small" x="${endX - 80}" y="${roadY + 24}">乙 ${bSpeed} km/h</text>
        <path class="line" stroke="#e76f51" stroke-width="3" fill="none" d="${aPath}"/>
        <path class="line" stroke="#3988c8" stroke-width="3" fill="none" d="${bPath}"/>
        <circle cx="${startX}" cy="${roadY - 30}" r="10" fill="#e76f51">
          <animateMotion dur="${totalSec}s" repeatCount="indefinite" path="${aPath}"/>
        </circle>
        <circle cx="${endX}" cy="${roadY + 30}" r="10" fill="#3988c8">
          <animateMotion dur="${totalSec}s" repeatCount="indefinite" path="${bPath}"/>
        </circle>
        <text class="small" x="${W/2 - 60}" y="${H - 16}">总距离 = ${totalKm} km</text>
      </svg>`,
      '图中两辆车会动起来。相向而行时它们靠得越来越近。'
    );
  },

  /* ---------- 8. 几何图（Canvas 拖拽，标顶点 / 辅助线） ---------- */
  geometry({ shape = 'triangle', labels = ['A', 'B', 'C'] }) {
    // 返回一个 canvas + 控制按钮，嵌入 JS 交互
    const id = 'geo-' + Math.random().toString(36).slice(2, 8);
    let points = [];
    if (shape === 'triangle') {
      points = [[120, 30], [40, 200], [240, 200]];
    } else if (shape === 'rect') {
      points = [[60, 60], [260, 60], [260, 180], [60, 180]];
    } else if (shape === 'square') {
      points = [[60, 60], [200, 60], [200, 200], [60, 200]];
    } else {
      points = [[160, 30], [60, 200], [260, 200]];
    }
    const labelStr = labels.slice(0, points.length).join('、');
    setTimeout(() => {
      const cv = document.getElementById(id);
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const draw = (aux = []) => {
        ctx.clearRect(0, 0, cv.width, cv.height);
        // 辅助线
        ctx.strokeStyle = '#f2a65a';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        aux.forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });
        ctx.setLineDash([]);
        // 图形
        ctx.strokeStyle = '#164b4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        points.forEach((p, i) => i === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p));
        ctx.closePath(); ctx.stroke();
        // 顶点
        points.forEach((p, i) => {
          ctx.fillStyle = '#e76f51';
          ctx.beginPath(); ctx.arc(...p, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#164b4a';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(labels[i] || '', p[0] - 6, p[1] - 10);
        });
      };
      draw();
      let dragging = null;
      cv.addEventListener('mousedown', e => {
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        dragging = points.findIndex(p => Math.hypot(p[0]-x, p[1]-y) < 14);
      });
      cv.addEventListener('mousemove', e => {
        if (dragging === null) return;
        const r = cv.getBoundingClientRect();
        points[dragging] = [e.clientX - r.left, e.clientY - r.top];
        draw();
      });
      cv.addEventListener('mouseup', () => dragging = null);
      cv.addEventListener('mouseleave', () => dragging = null);
      const btnAux = document.getElementById(id + '-aux');
      btnAux?.addEventListener('click', () => {
        if (points.length >= 2) draw([[points[0][0], points[0][1], points[1][0], points[1][1]]]);
      });
      const btnReset = document.getElementById(id + '-reset');
      btnReset?.addEventListener('click', () => draw());
    }, 50);
    return this.wrap(
      `几何图（${labelStr}）`,
      '拖动顶点试试。注意：图形变形时，"边长"和"角"会变，但"对应关系"不变。',
      `<canvas id="${id}" width="320" height="240" style="background:#fffdf7;border-radius:12px;cursor:grab;display:block;margin:auto;"></canvas>
       <div style="text-align:center;margin-top:8px;display:flex;gap:8px;justify-content:center;">
         <button id="${id}-aux" class="text-button"><i class="fa-solid fa-ruler"></i> 显示第一条边</button>
         <button id="${id}-reset" class="text-button"><i class="fa-solid fa-rotate-left"></i> 重置</button>
       </div>`
    );
  },

  /* ---------- 9. 概率 / 统计 ---------- */
  probability({ bars = [{label:'红', h:40}, {label:'蓝', h:60}, {label:'绿', h:80}] }) {
    const W = 560, H = 180;
    const bw = 80, gap = 30;
    const startX = (W - (bw * bars.length + gap * (bars.length - 1))) / 2;
    let rects = '';
    bars.forEach((b, i) => {
      const x = startX + i * (bw + gap);
      const y = H - 40 - b.h;
      rects += `<rect class="soft" x="${x}" y="${y}" width="${bw}" height="${b.h}" rx="6"/>`;
      rects += `<text x="${x + bw/2}" y="${H - 22}" text-anchor="middle" font-size="13" fill="#164b4a">${b.label}</text>`;
      rects += `<text class="small" x="${x + bw/2 - 6}" y="${y - 6}">${b.h}</text>`;
    });
    return this.wrap(
      '条形图让概率一眼可见',
      '条形越高代表出现次数越多；总数 = 所有条形高度之和。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="条形图">
        <line class="line" x1="40" y1="${H - 40}" x2="${W - 40}" y2="${H - 40}"/>
        ${rects}
      </svg>`
    );
  },

  /* ---------- 10. 证明 / 数轴 ---------- */
  proof({ left = '-3', right = '5', delta = '+8' }) {
    const W = 560, H = 150;
    const y = H / 2 + 10;
    let svg = `<line class="line" x1="40" y1="${y}" x2="${W - 40}" y2="${y}"/>`;
    svg += `<path class="line" d="M${W - 40} ${y} l-12 -8 M${W - 40} ${y} l-12 8"/>`;
    [left, '0', right].forEach((v, i) => {
      const x = 80 + i * 200;
      svg += `<line class="line" x1="${x}" y1="${y - 12}" x2="${x}" y2="${y + 12}"/>`;
      svg += `<text x="${x}" y="${y + 32}" text-anchor="middle" font-size="14" fill="#164b4a">${v}</text>`;
    });
    svg += `<path class="dash" d="M80 ${y - 30} H${80 + 2 * 200}"/>`;
    svg += `<text class="small" x="${80 + 200 - 12}" y="${y - 38}">${delta}</text>`;
    svg += `<circle class="accent" cx="${80 + 2 * 200}" cy="${y}" r="8"/>`;
    return this.wrap(
      '把关系画到数轴上',
      '数轴让"方向（正负）"和"距离（大小）"同时被看见。',
      `<svg class="math-diagram" viewBox="0 0 ${W} ${H}" role="img" aria-label="数轴">${svg}</svg>`
    );
  },

  /* ---------- 11. 通用 fallback ---------- */
  generic(tip = '把已知条件画进图里') {
    return this.wrap(
      '三步思维地图',
      tip,
      `<svg class="math-diagram" viewBox="0 0 560 170" role="img" aria-label="思维地图">
        <rect class="soft" x="50" y="58" width="120" height="55" rx="12"/>
        <rect class="warm" x="220" y="58" width="120" height="55" rx="12"/>
        <rect class="accent" x="390" y="58" width="120" height="55" rx="12"/>
        <text x="82" y="91">已知条件</text>
        <text x="252" y="91">找到关系</text>
        <text x="422" y="91">得到结论</text>
        <path class="line" d="M175 85 H215 M345 85 H385"/>
      </svg>`
    );
  },

  /* ---------- 统一入口 ---------- */
  render(exp) {
    if (!exp || !exp.kind) return this.generic();
    try {
      const fn = this[exp.kind];
      if (typeof fn === 'function') return fn.call(this, exp);
    } catch (e) {
      console.warn('explanation render failed:', e);
    }
    return this.generic();
  },
};