/* ============================================================
 *  鉴藏司 · 青铜秘案 —— 游戏逻辑
 * ============================================================ */
(function () {
  const { ARTIFACTS, LEVELS } = window.GAME_DATA;

  const TYPE_LABEL = {
    dating:  { name: "断代", hint: "判定年代", color: "#c9a961" },
    forgery: { name: "辨伪", hint: "揪出破绽", color: "#c98a5a" },
    riddle:  { name: "解谜", hint: "读铭识义", color: "#8fae8a" }
  };

  const state = {
    idx: 0,
    rep: 60,          // 鉴力值
    answered: false,
    correctCount: 0,
    log: []           // 结算用
  };

  const $ = (sel) => document.querySelector(sel);
  const app = $("#app");

  /* ---------- 屏幕：开始页 ---------- */
  function renderStart() {
    app.innerHTML = `
      <section class="screen start">
        <div class="seal">鉴</div>
        <h1 class="title">鉴藏司<span>·</span>青铜秘案</h1>
        <p class="subtitle">一款由古籍文物知识驱动的鉴藏解谜游戏</p>
        <p class="lede">
          你是「鉴藏司」新晋鉴藏师。九件青铜重器摆在案头，<br>
          辨其形、读其铭、断其代、揪其伪——过关者，方可出师。
        </p>
        <div class="modes">
          ${Object.entries(TYPE_LABEL).map(([k, v]) => `
            <div class="mode-chip" style="--c:${v.color}">
              <b>${v.name}</b><span>${v.hint}</span>
            </div>`).join("")}
        </div>
        <button class="btn primary" id="startBtn">入司 · 开始鉴藏</button>
        <p class="note">共 ${LEVELS.length} 案 · 每案皆据真实文物与史料 · 答案标注出处</p>
      </section>`;
    $("#startBtn").onclick = () => { resetRun(); renderLevel(); };
  }

  function resetRun() {
    state.idx = 0; state.rep = 60; state.answered = false;
    state.correctCount = 0; state.log = [];
  }

  /* ---------- 屏幕：关卡 ---------- */
  function renderLevel() {
    const lv = LEVELS[state.idx];
    const art = ARTIFACTS[lv.artifact];
    const t = TYPE_LABEL[lv.type];
    state.answered = false;

    app.innerHTML = `
      <section class="screen level">
        <header class="hud">
          <div class="progress">
            <span class="case-no">案 ${state.idx + 1} / ${LEVELS.length}</span>
            <div class="bar"><i style="width:${(state.idx / LEVELS.length) * 100}%"></i></div>
          </div>
          <div class="rep">鉴力 <b id="repVal">${state.rep}</b></div>
        </header>

        <div class="board">
          <aside class="exhibit">
            <div class="frame">${window.artifactSVG(art.shape)}</div>
            <h3 class="art-name">${art.name}${art.alias ? `<small>${art.alias}</small>` : ""}</h3>
            <ul class="art-meta">
              <li><span>年代</span>${maskEra(lv, art)}</li>
              <li><span>器类</span>${art.type}</li>
              <li><span>纹饰</span>${art.patterns.join("、")}</li>
              <li><span>出土</span>${art.excavated}</li>
            </ul>
            <div class="badge" style="--c:${t.color}">${t.name} · ${t.hint}</div>
          </aside>

          <main class="inquiry">
            <div class="case-title">${lv.title}</div>
            <div class="dialogue"><p>${lv.dialogue}</p></div>
            <div class="question">${lv.question}</div>
            <div class="options" id="options">
              ${lv.options.map((o, i) => `
                <button class="opt" data-i="${i}">
                  <span class="tick">${"甲乙丙丁戊"[i]}</span>${o.text}
                </button>`).join("")}
            </div>
            <div class="verdict" id="verdict" hidden></div>
          </main>
        </div>
      </section>`;

    document.querySelectorAll(".opt").forEach(btn => {
      btn.onclick = () => choose(parseInt(btn.dataset.i, 10));
    });
  }

  // 断代题不剧透年代
  function maskEra(lv, art) {
    return lv.type === "dating"
      ? `<em class="masked">待鉴定</em>`
      : art.era;
  }

  /* ---------- 作答 ---------- */
  function choose(i) {
    if (state.answered) return;
    state.answered = true;
    const lv = LEVELS[state.idx];
    const art = ARTIFACTS[lv.artifact];
    const chosen = lv.options[i];
    const correct = !!chosen.correct;

    document.querySelectorAll(".opt").forEach((btn, j) => {
      btn.classList.add("locked");
      if (lv.options[j].correct) btn.classList.add("right");
      if (j === i && !correct) btn.classList.add("wrong");
    });

    const delta = correct ? 10 : -6;
    state.rep = Math.max(0, Math.min(100, state.rep + delta));
    if (correct) state.correctCount++;
    state.log.push({ title: lv.title, correct });
    animateRep();

    const v = $("#verdict");
    v.hidden = false;
    v.className = `verdict ${correct ? "ok" : "no"}`;
    v.innerHTML = `
      <div class="v-head">${correct ? "✔ 鉴定精准" : "✘ 尚有疏漏"}
        <span class="v-delta">${correct ? "+" : ""}${delta} 鉴力</span></div>
      <p class="v-explain">${lv.explanation}</p>
      <p class="v-reward">🔖 ${lv.reward}</p>
      <div class="v-source">
        <span>据 · 出处</span>${art.sources.join(" ／ ")}
        <em class="gen-tag">${lv.generated_by}</em>
      </div>
      <button class="btn primary" id="nextBtn">
        ${state.idx + 1 < LEVELS.length ? "下一案 →" : "呈交结案 · 查看评定"}
      </button>`;
    v.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("#nextBtn").onclick = next;
  }

  function animateRep() {
    const el = $("#repVal");
    if (!el) return;
    el.textContent = state.rep;
    el.parentElement.classList.remove("pulse");
    void el.parentElement.offsetWidth;
    el.parentElement.classList.add("pulse");
  }

  function next() {
    state.idx++;
    if (state.idx < LEVELS.length) renderLevel();
    else renderEnd();
  }

  /* ---------- 屏幕：结算 ---------- */
  function renderEnd() {
    const n = LEVELS.length;
    const c = state.correctCount;
    const tier = rankTier(state.rep, c, n);

    app.innerHTML = `
      <section class="screen end">
        <div class="seal big" style="--c:${tier.color}">${tier.mark}</div>
        <h1 class="title">${tier.title}</h1>
        <p class="subtitle">鉴力值 ${state.rep} · 断案 ${c} / ${n} 正确</p>
        <p class="lede">${tier.words}</p>

        <ul class="scoreboard">
          ${state.log.map((r, i) => `
            <li class="${r.correct ? "ok" : "no"}">
              <span>${i + 1}. ${r.title}</span>
              <b>${r.correct ? "✔" : "✘"}</b>
            </li>`).join("")}
        </ul>

        <div class="end-actions">
          <button class="btn primary" id="againBtn">再战一轮</button>
          <button class="btn ghost" id="homeBtn">回到首页</button>
        </div>

        <p class="pipeline-note">
          本作 9 案均为「预生成 + 人工审校」的固定关卡。<br>
          它们未来将由 <b>AI 生成管线</b> 从文物知识库中实时产出——
          代码见项目内 <code>ai-pipeline/generate-levels.js</code>。
        </p>
      </section>`;

    $("#againBtn").onclick = () => { resetRun(); renderLevel(); };
    $("#homeBtn").onclick = renderStart;
  }

  function rankTier(rep, c, n) {
    const ratio = c / n;
    if (ratio === 1) return { title: "鉴藏司 · 掌眼大师", mark: "師", color: "#c9a961",
      words: "九案全中，明察秋毫。你已尽得辨形、读铭、断代、识伪之精要，堪当掌眼。" };
    if (ratio >= 0.7) return { title: "鉴藏司 · 出师鉴师", mark: "鑒", color: "#b8935a",
      words: "大体无碍，眼力已成。个别疑难尚需磨练，但足以独当一面。" };
    if (ratio >= 0.4) return { title: "鉴藏司 · 见习学徒", mark: "習", color: "#9a8a6a",
      words: "初窥门径。青铜之学博大，愿你多读铭、多核史，来日必成。" };
    return { title: "鉴藏司 · 初入门墙", mark: "初", color: "#8a7a5a",
      words: "莫气馁——每一件重器背后都是一段真实历史。回炉再看，必有精进。" };
  }

  /* ---------- 启动 ---------- */
  renderStart();
})();
