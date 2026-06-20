/* ========================================================
   ShrineUI.js — 神庙答题挑战（四年级强化版）
   设计目标：
     ✅ 一次只显示一题（减少视觉干扰）
     ✅ 大字体、大按钮（易于点击，不要求精细操作）
     ✅ 无闪烁动画（防止诱发抽动）
     ✅ 不计时（避免焦虑）
     ✅ 答错温和提示，可重试，不惩罚
     ✅ 答对强烈正向反馈（烟花 + 鼓励语）
     ✅ 清晰进度条（"第2题/共12题"）
   ======================================================== */

const ShrineUI = {
  isOpen: false,
  currentShrine: null,
  questions: [],     // 本关题目数组
  qIndex: 0,         // 当前题目索引
  correctCount: 0,   // 答对数
  wrongThisQ: 0,     // 本题答错次数（用于温和提示）
  answers: [],       // 每题作答记录，结束时用于错题回顾

  init() {
    // 动态创建独立 DOM（不依赖现有 HTML）
    this.el = document.createElement('div');
    this.el.id = 'shrine-ui';
    this.el.className = 'hidden';
    this.el.innerHTML = `
      <div class="shrine-panel">
        <div class="shrine-top">
          <div class="shrine-title" id="shrine-title">神庙</div>
          <div class="shrine-progress">
            <span id="shrine-progress-text">第 1 题 / 共 5 题</span>
            <div class="shrine-progress-bar"><div id="shrine-progress-fill"></div></div>
          </div>
          <button class="shrine-close" id="shrine-close" aria-label="关闭神庙挑战">✕</button>
        </div>
        <div class="shrine-body" id="shrine-body"></div>
      </div>
    `;
    document.body.appendChild(this.el);
    this._bindTap(document.getElementById('shrine-close'), () => this.close());
  },

  // ---------- 开启神庙 ----------
  open(shrine, game) {
    if (shrine.cleared) {
      Dialogue.show('这座神庙已经通关了');
      return;
    }
    this.currentShrine = shrine;
    // 当前版本统一使用四年级强化题库，避免低年级题过于简单。
    const diff = { grassland: 'easy', snowland: 'normal', volcano: 'normal', desert: 'normal', castle: 'hard' }[shrine.def.region] || 'normal';
    const grade = QuizHelper.gradeByDifficulty(diff);
    this.questions = QuizHelper.pick(grade, 12);
    this.qIndex = 0;
    this.correctCount = 0;
    this.answers = [];
    this.isOpen = true;
    this.el.classList.remove('hidden');
    this._renderQuestion();
  },

  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
  },

  // ★ Game.update 在 ShrineUI 打开时会调用此方法
  //   答题界面是纯事件驱动（点击选项触发），不需要每帧更新，留空即可
  update(game) {},

  // ---------- 渲染当前题目 ----------
  _renderQuestion() {
    const q = this.questions[this.qIndex];
    this.wrongThisQ = 0;
    // 标题与进度
    document.getElementById('shrine-title').textContent = '🏛️ ' + this.currentShrine.def.name;
    document.getElementById('shrine-progress-text').textContent =
      `第 ${this.qIndex + 1} 题 / 共 ${this.questions.length} 题　已答对 ${this.correctCount} 题`;
    const pct = (this.qIndex / this.questions.length) * 100;
    document.getElementById('shrine-progress-fill').style.width = pct + '%';

    // 科目标签
    const subjectNames = { math: '🔢 数学', chinese: '📖 语文', english: '🔤 英语', science: '🔬 科学' };
    const subject = subjectNames[q.subject] || q.subject;

    // 题目主体
    const body = document.getElementById('shrine-body');
    body.innerHTML = `
      <div class="quiz-subject">${subject}</div>
      <button class="quiz-question quiz-question-btn" id="quiz-question-read">${this._esc(q.q)}</button>
      <div class="quiz-options" id="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-i="${i}">
            <span class="opt-letter">${'ABCD'[i]}</span>
            <span class="opt-text">${this._esc(opt)}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback">点选答案后会自动进入下一题</div>
    `;
    const qBtn = document.getElementById('quiz-question-read');
    if (qBtn) qBtn.addEventListener('click', () => this._pulseOptions());
    // 绑定点击
    body.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => this._answer(parseInt(btn.dataset.i)));
    });
  },

  // ---------- 答题处理 ----------
  _answer(choice) {
    const q = this.questions[this.qIndex];
    const feedback = document.getElementById('quiz-feedback');
    const options = Array.from(document.querySelectorAll('.quiz-option'));
    if (!options.length || options.some(o => o.disabled)) return;

    const correct = choice === q.answer;
    if (correct) this.correctCount++;
    this.answers.push({
      question: q.q,
      subject: q.subject,
      options: q.options.slice(),
      choice,
      answer: q.answer,
      correct,
      explain: q.explain
    });

    options.forEach(o => o.disabled = true);
    if (options[q.answer]) options[q.answer].classList.add('correct');
    if (!correct && options[choice]) options[choice].classList.add('wrong-shake', 'picked-wrong');

    feedback.className = correct ? 'quiz-feedback correct' : 'quiz-feedback wrong';
    feedback.innerHTML = correct
      ? `<div class="feedback-icon">🎉</div><div class="feedback-text">${this._praise()}</div><div class="feedback-explain">${this._esc(q.explain)}</div><div class="quiz-auto-next">自动进入下一题…</div>`
      : `<div class="feedback-icon">💡</div><div class="feedback-text">已记录错题，正确答案：${'ABCD'[q.answer]} ${this._esc(q.options[q.answer])}</div><div class="feedback-explain">${this._esc(q.explain)}</div><div class="quiz-auto-next">自动进入下一题…</div>`;
    if (correct) this._confetti();
    setTimeout(() => this._next(), 900);
  },

  // ---------- 下一题 ----------
  _next() {
    this.qIndex++;
    if (this.qIndex >= this.questions.length) {
      this._finish();
    } else {
      this._renderQuestion();
    }
  },

  // ---------- 完成挑战 ----------
  _finish() {
    const total = this.questions.length;
    const correct = this.correctCount;
    const passLine = Math.ceil(total * 0.7);
    const passed = correct >= passLine;
    const wrongRows = this.answers.filter(a => !a.correct);
    const reviewHtml = this._renderWrongReview(wrongRows);

    const body = document.getElementById('shrine-body');
    document.getElementById('shrine-progress-text').textContent = `挑战完成！答对 ${correct}/${total}`;
    document.getElementById('shrine-progress-fill').style.width = '100%';

    if (passed) {
      body.innerHTML = `
        <div class="quiz-result pass">
          <div class="result-icon">🏆</div>
          <div class="result-title">挑战成功！</div>
          <div class="result-score">答对 ${correct} / ${total} 题，通过线 ${passLine} 题</div>
          <div class="result-msg">${this._finalPraise(correct, total)}</div>
          ${reviewHtml}
          <div class="quiz-result-actions">
            <button class="quiz-next" id="quiz-collect">领取奖励 ⭕ 克服之玉</button>
            <button class="quiz-quit" id="quiz-close-pass">关闭神庙挑战</button>
          </div>
        </div>
      `;
      this._bindTap(document.getElementById('quiz-collect'), () => {
        this.currentShrine.complete(window.game);
        this.close();
      });
      this._bindTap(document.getElementById('quiz-close-pass'), () => this.close());
      this._bigConfetti();
    } else {
      body.innerHTML = `
        <div class="quiz-result fail">
          <div class="result-icon">🌱</div>
          <div class="result-title">再试一次吧</div>
          <div class="result-score">答对 ${correct} / ${total} 题，通过线 ${passLine} 题</div>
          <div class="result-msg">没关系，每一次尝试都是进步！休息一下再来挑战～</div>
          ${reviewHtml}
          <div class="quiz-result-actions">
            <button class="quiz-next" id="quiz-retry">重新挑战</button>
            <button class="quiz-quit" id="quiz-quit">关闭神庙挑战</button>
          </div>
        </div>
      `;
      this._bindTap(document.getElementById('quiz-retry'), () => {
        this.qIndex = 0;
        this.correctCount = 0;
        this.answers = [];
        // 换一组新题
        const diff = { grassland: 'easy', snowland: 'normal', volcano: 'normal', desert: 'normal', castle: 'hard' }[this.currentShrine.def.region] || 'normal';
        this.questions = QuizHelper.pick(QuizHelper.gradeByDifficulty(diff), 12);
        this._renderQuestion();
      });
      this._bindTap(document.getElementById('quiz-quit'), () => this.close());
    }
  },

  // ---------- 鼓励语 ----------
  _praise() {
    const praises = ['太棒了！', '答对了！', '你真聪明！', '好厉害！', '完全正确！', '继续加油！', '真了不起！'];
    return praises[Math.floor(Math.random() * praises.length)];
  },
  _finalPraise(correct, total) {
    if (correct === total) return '全部答对！你是学习小达人！🌟';
    if (correct >= total - 1) return '非常出色！你掌握得真好！🌟';
    return '通过了挑战，继续努力会更好！🌟';
  },

  _renderWrongReview(rows) {
    if (!rows.length) return '<div class="quiz-review empty">本次没有错题，太稳了！</div>';
    return `
      <div class="quiz-review">
        <div class="quiz-review-title">错题回顾</div>
        ${rows.map((r, i) => `
          <div class="quiz-review-item">
            <b>${i + 1}. ${this._esc(r.question)}</b>
            <span>你的答案：${'ABCD'[r.choice] || '-'} ${this._esc(r.options[r.choice] || '未作答')}</span>
            <span>正确答案：${'ABCD'[r.answer]} ${this._esc(r.options[r.answer])}</span>
            <small>${this._esc(r.explain || '')}</small>
          </div>
        `).join('')}
      </div>
    `;
  },

  _pulseOptions() {
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.classList.add('hint-pulse');
      setTimeout(() => btn.classList.remove('hint-pulse'), 360);
    });
  },

  _esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  },

  _bindTap(el, fn) {
    if (!el || !fn) return;
    let lastRun = 0;
    const run = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastRun < 260) return;
      lastRun = now;
      fn();
    };
    el.addEventListener('click', run);
    el.addEventListener('touchend', run, { passive: false });
  },

  // ---------- 烟花效果（温和的粒子，不闪烁） ----------
  _confetti() {
    const colors = ['#ff6b9d', '#ffd56a', '#6bff9d', '#6bb6ff', '#c46bff'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.style.background = colors[i % colors.length];
      p.style.left = (50 + (Math.random() - 0.5) * 30) + '%';
      p.style.top = '50%';
      const dx = (Math.random() - 0.5) * 400;
      const dy = -150 - Math.random() * 200;
      const rot = (Math.random() - 0.5) * 720;
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.setProperty('--rot', rot + 'deg');
      container.appendChild(p);
    }
    setTimeout(() => container.remove(), 1500);
  },
  _bigConfetti() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this._confetti(), i * 300);
    }
  }
};
