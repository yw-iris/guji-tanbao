/* ============================================================
 *  江口沉银 · 寻银诀 —— 游戏逻辑 v2
 *  主线五关 · 无限题库 · 历史副本 · 鉴宝 · 藏宝阁(出售/弧光/武器/洗练)
 *  职业系统 · 武器词条 · 本地排行榜
 * ============================================================ */
(function () {
  const { QUALITY, AFFIXES, TREASURES, DUNGEONS, STAGES, QUESTION_BANK,
          PROFESSIONS, WEAPONS, ARC_ITEMS } = window.GAME_DATA;
  const $ = s => document.querySelector(s);
  const app = document.getElementById("app");
  // 返回《古籍探宝续》合集封面页（游戏在 jiangkou-chenyin/ 子目录时回到上一级）
  const COVER = location.pathname.includes("/jiangkou-chenyin/") ? "../" : "./";

  /* ===== 持久化 ===== */
  const LS_KEY = "jccy_save_v2";
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
  }
  function writeSave(obj) {
    const base = loadSave();
    localStorage.setItem(LS_KEY, JSON.stringify(Object.assign(base, obj)));
  }

  /* ===== 全局存档 ===== */
  const save = loadSave();
  const G = {
    vault:      save.vault      || [],   // [{id,name,dynasty,museum,model,parts,value,sold}]
    taels:      save.taels      || 0,    // 银两
    arcs:       save.arcs       || {},   // {arc_common:2, ...}
    profExp:    save.profExp    || {},   // {jianshang:7, ...}
    weapons:    save.weapons    || {},   // {w_chisel:{appearance:0,trait:0,quality:…}}
    leaderboard:save.leaderboard|| [],   // [{name,score,taels,date}]
    totalRight: save.totalRight || 0,    // 累计答对
    totalPlayed:save.totalPlayed|| 0,    // 累计答题
    seenGuide: save.seenGuide  || false, // 是否已看过新手引导
  };
  /* 旧存档武器格式迁移：{appearance,traitIdx,qualityIdx} → {parts:[...],appearanceIdx} */
  (function migrateWeapons() {
    Object.keys(G.weapons).forEach(wKey => {
      const wd = G.weapons[wKey];
      if (!wd) return;
      if (!wd.parts) {
        const w = WEAPONS[wKey];
        if (!w) return;
        const q = wd.qualityIdx || 0, t = wd.traitIdx || 0, a = wd.appearance || 0;
        G.weapons[wKey] = {
          appearanceIdx: a,
          parts: w.partNames.map(pn => ({ name: pn, qualityIdx: q, traitIdx: t, appearanceIdx: a }))
        };
      }
    });
  })();

  function persist() {
    writeSave({ vault:G.vault, taels:G.taels, arcs:G.arcs, profExp:G.profExp,
                weapons:G.weapons, leaderboard:G.leaderboard,
                totalRight:G.totalRight, totalPlayed:G.totalPlayed,
                seenGuide:G.seenGuide });
  }

  /* ===== 单局状态 ===== */
  let S = {};
  function newRun(mode) {
    // 每道题的选项在进题库前就预先打乱，彻底避免正确答案位置固定
    const pool = QUESTION_BANK.map(q => ({
      ...q,
      opts: shuffle([...q.opts])
    }));
    S = { mode, stageIdx:0, hp:3, vault:[], totalValue:0,
          qPool: shuffle(pool), qIdx:0, rightThisRun:0,
          _stageShuffledOpts: null };
  }

  let viewer = null;

  /* ===== 小工具 ===== */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function pick(n) { return Math.random() * n; }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rollQuality() {
    const total = QUALITY.reduce((s, q) => s + q.weight, 0);
    let r = pick(total);
    for (const q of QUALITY) { if (r < q.weight) return q; r -= q.weight; }
    return QUALITY[0];
  }

  /* ===== 职业工具 ===== */
  function profLevel(key) {
    const exp = G.profExp[key] || 0;
    return exp >= 25 ? 3 : exp >= 12 ? 2 : exp >= 5 ? 1 : 0;
  }
  function profLevelName(key) {
    const p = PROFESSIONS[key];
    return p.levels[profLevel(key)];
  }
  function addProfExp(cat) {
    for (const [key, p] of Object.entries(PROFESSIONS)) {
      if (p.cats.includes(cat)) {
        G.profExp[key] = (G.profExp[key] || 0) + 1;
        persist();
        return { key, p, newExp: G.profExp[key] };
      }
    }
    return null;
  }
  function unlockedWeapons() {
    return Object.entries(PROFESSIONS)
      .filter(([k]) => profLevel(k) >= 1)
      .map(([, p]) => p.weapon);
  }

  /* ===== 悬浮按钮注入 ===== */
  function injectFloatBtns() {
    let wrap = document.getElementById("floatBtns");
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.id = "floatBtns";
    wrap.style.cssText = "position:fixed;bottom:22px;right:18px;z-index:100;display:flex;flex-direction:column;gap:8px;align-items:flex-end";
    wrap.innerHTML = `
      <button id="fbHome" class="fb-btn fb-home" title="合集封面">🏠</button>
      <button id="fbHelp" class="fb-btn fb-help" title="新手引导">❓</button>
      <button id="fbVault" class="fb-btn fb-vault big" title="藏宝阁">🏺</button>
      <button id="fbWeapon" class="fb-btn fb-weapon" title="武器间">⚔</button>
      <button id="fbShop" class="fb-btn fb-shop" title="弧光商店">✨</button>
      <button id="fbBoard" class="fb-btn fb-board" title="排行榜">🏆</button>`;
    document.body.appendChild(wrap);
    document.getElementById("fbHome").onclick = () => { window.location.href = COVER; };
    document.getElementById("fbHelp").onclick = () => showGuideModal();
    document.getElementById("fbVault").onclick = () => showVaultModal();
    document.getElementById("fbWeapon").onclick = () => showWeaponModal();
    document.getElementById("fbShop").onclick = () => showShopModal();
    document.getElementById("fbBoard").onclick = () => showLeaderboard();
  }
  function removeFloatBtns() {
    const el = document.getElementById("floatBtns");
    if (el) el.remove();
  }

  /* ============================================================
   *  开始页
   * ============================================================ */
  function renderStart() {
    disposeOverlay();
    removeFloatBtns();
    const topProf = Object.entries(G.profExp).sort((a,b)=>b[1]-a[1])[0];
    const profBadge = topProf && PROFESSIONS[topProf[0]]
      ? `<span style="color:var(--gold)">${PROFESSIONS[topProf[0]].icon} ${profLevelName(topProf[0])}</span>` : "";
    app.innerHTML = `
      <section class="screen start">
        <div class="seal">银</div>
        <h1 class="title">江口沉银<span>·</span>寻银诀</h1>
        <p class="subtitle">古籍探宝解密 · 历史副本 · 鉴宝观赏 · 无限题库</p>
        <blockquote class="hook">
          「石龙对石虎，金银万万五，<br>谁人识得破，买到成都府。」
        </blockquote>
        <div style="margin:12px 0 16px;font-size:14px;color:var(--dim)">
          存档：银两 <b style="color:var(--gold-hi)">${G.taels.toLocaleString()}</b> 两 ·
          藏品 <b style="color:var(--silver-hi)">${G.vault.filter(v=>!v.sold).length}</b> 件 ·
          累计答对 <b style="color:var(--ok)">${G.totalRight}</b> 题
          ${profBadge ? "· " + profBadge : ""}
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:18px">
          <button class="btn primary" id="startStory">主线 · 五关寻银</button>
          <button class="btn" id="startInfinite">无限题库 · 闯关</button>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:22px">
          <button class="btn ghost" id="btnHome" style="padding:9px 18px;font-size:15px">🏠 合集封面</button>
          <button class="btn ghost" id="btnGuide" style="padding:9px 18px;font-size:15px">❓ 新手引导</button>
          <button class="btn ghost" id="btnVault" style="padding:9px 18px;font-size:15px">🏺 藏宝阁</button>
          <button class="btn ghost" id="btnWeapon" style="padding:9px 18px;font-size:15px">⚔ 武器间</button>
          <button class="btn ghost" id="btnShop" style="padding:9px 18px;font-size:15px">✨ 弧光商店</button>
          <button class="btn ghost" id="btnBoard" style="padding:9px 18px;font-size:15px">🏆 排行榜</button>
        </div>
        <p class="note">史料：《明史》《蜀碧》《荒书》《山海经》《黄帝内经》《本草纲目》</p>
      </section>`;
    const beginStory = () => { newRun("story"); renderStage(); };
    const beginInfinite = () => { newRun("infinite"); renderInfinite(); };
    $("#startStory").onclick = () => { if (!G.seenGuide) showGuideModal(beginStory); else beginStory(); };
    $("#startInfinite").onclick = () => { if (!G.seenGuide) showGuideModal(beginInfinite); else beginInfinite(); };
    $("#btnHome").onclick = () => { window.location.href = COVER; };
    $("#btnGuide").onclick = showGuideModal;
    $("#btnVault").onclick = showVaultModal;
    $("#btnWeapon").onclick = showWeaponModal;
    $("#btnShop").onclick = showShopModal;
    $("#btnBoard").onclick = showLeaderboard;
  }

  /* ============================================================
   *  主线关卡（五关）
   * ============================================================ */
  function renderStage() {
    disposeOverlay(); injectFloatBtns();
    const st = STAGES[S.stageIdx];
    // 打乱主线选项顺序
    const shuffledOpts = shuffle(st.options.map((o, i) => ({ ...o, origIdx: i })));
    S._stageShuffledOpts = shuffledOpts;
    app.innerHTML = `
      <section class="screen stage">
        <header class="hud">
          <span class="loc">关 ${S.stageIdx+1}/${STAGES.length}</span>
          <div class="bar"><i style="width:${(S.stageIdx/STAGES.length)*100}%"></i></div>
          <span class="hp">命 ${"❤".repeat(S.hp)}${"·".repeat(3-S.hp)}</span>
          <span class="gold">${G.taels.toLocaleString()} 两</span>
          <button class="btn ghost" id="exitStory" style="padding:4px 12px;font-size:13px;margin-left:auto">退出</button>
        </header>
        <div class="case-title">${st.title}</div>
        <p class="scene">${st.scene}</p>
        <blockquote class="quote">${st.quote}</blockquote>
        <div class="question">${st.question}</div>
        <div class="options" id="opts">
          ${shuffledOpts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="tick">${"甲乙丙丁"[i]}</span>${o.text}</button>`).join("")}
        </div>
        <div class="verdict" id="verdict" hidden></div>
      </section>`;
    document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>answerStage(+b.dataset.i));
    const exitBtn = document.getElementById("exitStory");
    if (exitBtn) exitBtn.onclick = () => { submitScore(); renderEnd(); };
  }

  function answerStage(i) {
    const st = STAGES[S.stageIdx];
    const opts = S._stageShuffledOpts;
    const correct = opts[i].correct;
    G.totalPlayed++;
    lockOpts(opts.map(o=>o.correct), i);
    let extra = "";
    if (correct) {
      G.totalRight++;
      G.taels += 50;
      // 主线归「史学夫子 · 江口沉银」线，答对累计可升职业、解锁专属武器
      const profGain = addProfExp("江口沉银");
      if (profGain) {
        const newLv = profLevel(profGain.key);
        const p = profGain.p;
        if (profGain.newExp === 5 || profGain.newExp === 12 || profGain.newExp === 25) {
          extra = `<p style="color:var(--gold);margin-top:6px">${p.icon} 职业升级！→ <b>${profLevelName(profGain.key)}</b></p>`;
          if (newLv >= 1 && !G.weapons[p.weapon]) {
            const w0 = WEAPONS[p.weapon];
            G.weapons[p.weapon] = {
              appearanceIdx: 0,
              parts: w0.partNames.map(pn => ({ name: pn, qualityIdx: 0, traitIdx: 0, appearanceIdx: 0 }))
            };
            extra += `<p style="color:var(--ok);font-size:13px">🎉 解锁专属武器：${WEAPONS[p.weapon].name}</p>`;
          }
        }
      }
    }
    persist();
    showVerdict(correct, st.explanation + extra, () => {
      const afterAppraise = () => {
        // 偶然事件：有 triggerDungeon 配置时以 40% 概率触发
        if (st.triggerDungeon && Math.random() < 0.4) {
          enterDungeon(st.triggerDungeon, ()=>advanceStage());
        } else {
          advanceStage();
        }
      };
      // 青铜秘案等无掉落关卡：跳过鉴宝直接继续
      if (st.drop) enterAppraise(st.drop, afterAppraise);
      else afterAppraise();
    }, correct ? "破关 · 起获宝物 →" : "记下考据 · 继续 →");
  }

  function advanceStage() {
    S.stageIdx++;
    if (S.stageIdx < STAGES.length) renderStage();
    else { submitScore(); renderEnd(); }
  }

  /* ============================================================
   *  公用：锁定选项 + 标对错
   * ============================================================ */
  function lockOpts(correctFlags, chosen) {
    document.querySelectorAll(".opt").forEach((b, j) => {
      b.classList.add("locked");
      if (correctFlags[j]) b.classList.add("right");
      if (j === chosen && !correctFlags[j]) b.classList.add("wrong");
    });
  }

  /* 公用判词：correct=bool, explanation=string, onNext=fn, btnLabel=string */
  function showVerdict(correct, explanation, onNext, btnLabel) {
    const v = $("#verdict");
    v.hidden = false;
    v.className = "verdict " + (correct ? "ok" : "no");
    v.innerHTML = `
      <div class="v-head">${correct ? "✔ 答对了" : "✘ 答错了"}</div>
      <p>${explanation}</p>
      <button class="btn primary" id="verdNext">${btnLabel || "继续 →"}</button>`;
    v.scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("#verdNext").onclick = onNext;
  }

  /* ============================================================
   *  无限题库模式
   * ============================================================ */
  function renderInfinite() {
    disposeOverlay(); injectFloatBtns();
    if (S.qIdx >= S.qPool.length) {
      S.qPool = shuffle(QUESTION_BANK.map(q => ({ ...q, opts: shuffle([...q.opts]) })));
      S.qIdx = 0;
    }
    const q = S.qPool[S.qIdx];
    const total = S.qPool.length;
    // 打乱选项顺序，避免正确答案固定在第一位
    const shuffledOpts = shuffle(q.opts.map((o, origIdx) => ({ ...o, origIdx })));
    app.innerHTML = `
      <section class="screen stage">
        <header class="hud">
          <span class="loc">第 ${S.qIdx + 1} 题</span>
          <div class="bar"><i style="width:${((S.qIdx % total) / total) * 100}%"></i></div>
          <span class="hp">命 ${"❤".repeat(S.hp)}${"·".repeat(Math.max(0,3-S.hp))}</span>
          <span class="gold">${G.taels.toLocaleString()} 两</span>
          <button class="btn ghost" id="exitInf" style="padding:4px 12px;font-size:13px;margin-left:auto">退出</button>
        </header>
        <div class="case-title" style="font-size:15px;color:var(--dim)">【${q.cat}】</div>
        <div class="question">${q.q}</div>
        <div class="options" id="opts">
          ${shuffledOpts.map((o, i) => `<button class="opt" data-i="${i}"><span class="tick">${"甲乙丙丁"[i]}</span>${o.t}</button>`).join("")}
        </div>
        <div class="verdict" id="verdict" hidden></div>
      </section>`;
    document.querySelectorAll(".opt").forEach(b => b.onclick = () => answerInfinite(+b.dataset.i, shuffledOpts));
    $("#exitInf").onclick = () => { submitScore(); renderEnd(); };
  }

  function answerInfinite(i, shuffledOpts) {
    const q = S.qPool[S.qIdx];
    const correct = shuffledOpts[i].c;
    lockOpts(shuffledOpts.map(o => o.c), i);
    G.totalPlayed++;
    if (correct) {
      G.totalRight++;
      S.rightThisRun++;
      S.totalValue = (S.totalValue || 0) + 50;
      G.taels += 50;
      const profGain = addProfExp(q.cat);
      let extra = "";
      if (profGain) {
        const prev = profLevel(profGain.key);
        const newLv = profLevel(profGain.key);
        const p = profGain.p;
        if (newLv > prev - 1 && (profGain.newExp === 5 || profGain.newExp === 12 || profGain.newExp === 25)) {
          extra = `<p style="color:var(--gold);margin-top:6px">${p.icon} 职业升级！→ <b>${profLevelName(profGain.key)}</b></p>`;
          if (newLv >= 1 && !G.weapons[p.weapon]) {
            const w0 = WEAPONS[p.weapon];
            G.weapons[p.weapon] = {
              appearanceIdx: 0,
              parts: w0.partNames.map(pn => ({ name: pn, qualityIdx: 0, traitIdx: 0, appearanceIdx: 0 }))
            };
            extra += `<p style="color:var(--ok);font-size:13px">🎉 解锁专属武器：${WEAPONS[p.weapon].name}</p>`;
            persist();
          }
        }
      }
      persist();
      showVerdict(true, q.exp + extra, () => {
        S.qIdx++;
        const dropChance = Math.random();
        if (dropChance < 0.25) {
          const keys = Object.keys(TREASURES);
          enterAppraise(keys[Math.floor(Math.random() * keys.length)], () => renderInfinite());
        } else {
          renderInfinite();
        }
      }, "下一题 →");
    } else {
      persist();
      showVerdict(false, q.exp, () => {
        S.qIdx++;
        renderInfinite();
      }, "记住了 · 下一题 →");
    }
  }

  /* ============================================================
   *  历史副本（偶然事件）
   * ============================================================ */
  function enterDungeon(dungeonId, onClear) {
    const d = DUNGEONS[dungeonId];
    let round = 0;
    disposeOverlay();

    function renderIntro() {
      app.innerHTML = `
        <section class="screen dungeon">
          <div class="dungeon-flash">偶然事件</div>
          <div class="case-title danger">${d.title}</div>
          <div class="era">${d.era} · 遭遇【${d.boss}】</div>
          <p class="scene intro">${d.intro}</p>
          <div class="warn">⚠ 副本中答错将立即死亡。你需凭真实历史知识安全通过。</div>
          <button class="btn danger-btn" id="enter">直面 ${d.boss} →</button>
        </section>`;
      $("#enter").onclick = renderRound;
    }

    function renderRound() {
      const r = d.rounds[round];
      // 机关轮次：渲染华容道或鲁班锁小游戏
      if (r.mechanism) {
        renderMechanism(r);
        return;
      }
      app.innerHTML = `
        <section class="screen dungeon">
          <header class="hud">
            <span class="loc danger">${d.boss}</span>
            <span class="loc">第 ${round+1}/${d.rounds.length} 问</span>
            <span class="hp">命 ${"❤".repeat(S.hp)}${"·".repeat(3-S.hp)}</span>
          </header>
          <p class="scene q">${r.q}</p>
          <div class="options" id="opts">
            ${r.choices.map((c,i)=>`<button class="opt danger-opt" data-i="${i}">${c.text}</button>`).join("")}
          </div>
          <div class="verdict" id="verdict" hidden></div>
        </section>`;
      document.querySelectorAll(".opt").forEach(b => b.onclick = () => answerDungeon(+b.dataset.i, r));
    }

    function renderMechanism(r) {
      disposeOverlay();
      const type = r.mechanism;
      app.innerHTML = `
        <section class="screen dungeon">
          <header class="hud">
            <span class="loc danger">${d.boss}</span>
            <span class="loc">机关 · ${round+1}/${d.rounds.length}</span>
            <span class="hp">命 ${"❤".repeat(S.hp)}${"·".repeat(3-S.hp)}</span>
          </header>
          <div class="dungeon-flash">墨家机关</div>
          <div class="case-title danger">${r.title}</div>
          <p class="scene intro">${r.intro}</p>
          <div class="warn">⚠ 解开机关，方能继续前行。</div>
          <div id="mechanismArea" class="mechanism-area"></div>
        </section>`;
      const area = document.getElementById("mechanismArea");
      const onSolve = () => {
        const v = document.createElement("div");
        v.className = "verdict ok";
        v.innerHTML = `<div class="v-head">✔ 机关破解</div>
          <p>机关松动，前路已开。</p>
          <button class="btn primary" id="mechNext">${round+1<d.rounds.length?"继续前行 →":"安全脱险 · 起获宝物 →"}</button>`;
        area.appendChild(v);
        v.scrollIntoView({ behavior: "smooth", block: "nearest" });
        document.getElementById("mechNext").onclick = () => {
          round++;
          round < d.rounds.length ? renderRound() : renderClear();
        };
      };
      if (type === "huarong" && window.MiniGames) {
        try { new window.MiniGames.HuarongDao(area, { onSolve }); }
        catch(e) { area.innerHTML = `<p style="color:var(--dim)">机关加载异常，已放行。</p>`; setTimeout(onSolve, 800); }
      } else if (type === "luban" && window.MiniGames) {
        try { new window.MiniGames.LubanLock(area, { onSolve }); }
        catch(e) { area.innerHTML = `<p style="color:var(--dim)">机关加载异常，已放行。</p>`; setTimeout(onSolve, 800); }
      } else {
        // 回退：若小游戏模块未加载，直接放行
        area.innerHTML = `<p style="color:var(--dim)">机关模块未加载，已放行。</p>`;
        setTimeout(onSolve, 600);
      }
    }

    function answerDungeon(i, r) {
      const c = r.choices[i];
      document.querySelectorAll(".opt").forEach((b, j) => {
        b.classList.add("locked");
        if (r.choices[j].safe) b.classList.add("right");
        if (j === i && !c.safe) b.classList.add("wrong");
      });
      const v = $("#verdict"); v.hidden = false;
      if (c.safe) {
        v.className = "verdict ok";
        v.innerHTML = `<div class="v-head">✔ 化险为夷</div><p>${c.note}</p>
          <button class="btn primary" id="verdNext">${round+1<d.rounds.length?"继续应对 →":"安全脱险 · 起获宝物 →"}</button>`;
        $("#verdNext").onclick = () => { round++; round < d.rounds.length ? renderRound() : renderClear(); };
      } else {
        S.hp--;
        v.className = "verdict no death";
        v.innerHTML = `<div class="v-head">☠ 你死了</div><p>${c.note}</p>
          ${S.hp > 0
            ? `<p class="hp-left">残命 ${"❤".repeat(S.hp)}——历史再给你一次机会。</p><button class="btn danger-btn" id="retry">重历此劫 →</button>`
            : `<p class="hp-left">三命已尽。</p><button class="btn" id="gameover">魂归当代 · 结算 →</button>`}`;
        if (S.hp > 0) $("#retry").onclick = () => { round = 0; renderIntro(); };
        else $("#gameover").onclick = () => { submitScore(); renderEnd(); };
      }
    }

    function renderClear() {
      app.innerHTML = `
        <section class="screen dungeon">
          <div class="dungeon-flash win">脱险</div>
          <div class="case-title">${d.title} · 通关</div>
          <p class="scene">${d.win}</p>
          <button class="btn primary" id="loot">擦拭鉴宝 →</button>
        </section>`;
      $("#loot").onclick = () => enterAppraise(d.drop, onClear);
    }

    renderIntro();
  }

  /* ============================================================
   *  鉴宝：擦拭覆泥 → 逐部位品质词条 → 三维观赏
   * ============================================================ */
  function enterAppraise(treasureId, onDone) {
    disposeOverlay();
    const t = TREASURES[treasureId];
    const parts = t.parts.map(p => {
      const q = rollQuality();
      return { ...p, quality: q, affix: choice(AFFIXES), revealed: false };
    });
    const partValue = t.baseValue / parts.length;

    app.innerHTML = `
      <section class="screen appraise">
        <div class="case-title">起获宝物 · ${t.name}</div>
        <div class="tre-meta">${t.dynasty} ｜ ${t.museum}</div>
        <div class="viewer-wrap">
          <canvas id="tre3d" class="tre3d"></canvas>
          <canvas id="wipe" class="wipe"></canvas>
          <div class="wipe-hint" id="wipeHint">✋ 擦拭屏幕，拂去泥沙，逐一显露宝物各部位</div>
        </div>
        <div class="parts" id="parts">
          ${parts.map((p,i)=>`<div class="part" data-i="${i}"><span class="pn">${p.name}</span><span class="pq" style="--c:${p.quality.color}">？</span></div>`).join("")}
        </div>
        <div class="appraise-foot" id="foot"></div>
      </section>`;

    const canvas3d = $("#tre3d");
    viewer = new window.TreasureViewer(canvas3d);
    viewer.load(t.model);
    viewer.autoRotate = true;

    const wipe = $("#wipe");
    const ctx = wipe.getContext("2d");
    let revealedCount = 0;
    const sizeWipe = () => {
      const r = wipe.getBoundingClientRect();
      wipe.width = r.width; wipe.height = r.height;
      const grad = ctx.createLinearGradient(0,0,r.width,r.height);
      grad.addColorStop(0,"#2a2418"); grad.addColorStop(1,"#15110a");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = grad; ctx.fillRect(0,0,r.width,r.height);
      ctx.fillStyle = "rgba(120,100,70,.25)";
      for (let k=0;k<60;k++) ctx.fillRect(Math.random()*r.width,Math.random()*r.height,3,3);
    };
    sizeWipe();

    let painting = false;
    const erasedGrid = new Set();
    const cols=12,rows=8;

    function eraseAt(cx,cy) {
      const r = wipe.getBoundingClientRect();
      const x=cx-r.left,y=cy-r.top;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(x,y,26,0,Math.PI*2); ctx.fill();
      const gc=Math.floor((x/r.width)*cols),gr=Math.floor((y/r.height)*rows);
      erasedGrid.add(gr*cols+gc);
      const frac=erasedGrid.size/(cols*rows);
      const shouldReveal=Math.floor(frac*(parts.length+0.3));
      while(revealedCount<shouldReveal&&revealedCount<parts.length){revealPart(revealedCount);revealedCount++;}
      if(frac>0.82&&revealedCount<parts.length){while(revealedCount<parts.length){revealPart(revealedCount);revealedCount++;}}
    }

    function revealPart(i) {
      const p=parts[i];
      const el=document.querySelector(`.part[data-i="${i}"]`);
      el.classList.add("shown");
      el.querySelector(".pq").textContent=`${p.quality.name}·${p.affix}`;
      el.querySelector(".pq").style.color=p.quality.color;
      el.querySelector(".pq").style.borderColor=p.quality.color;
      const tip=document.createElement("span");tip.className="ptip";tip.textContent=p.real;
      el.appendChild(tip);
      if(i===0) $("#wipeHint").classList.add("fade");
      if(parts.every((_,pi)=>document.querySelector(`.part[data-i="${pi}"]`).classList.contains("shown"))) finishAppraise();
    }

    let finished=false;
    function finishAppraise() {
      if(finished)return;finished=true;
      ctx.globalCompositeOperation="destination-out";
      ctx.fillRect(0,0,wipe.width,wipe.height);
      wipe.style.pointerEvents="none";
      viewer.autoRotate=false;
      $("#wipeHint").textContent="✋ 现在可拖动宝物·多视角旋转观赏";
      $("#wipeHint").classList.remove("fade");
      setTimeout(()=>$("#wipeHint").classList.add("fade"),2600);
      const value=Math.round(parts.reduce((s,p)=>s+partValue*p.quality.mult,0));
      const best=parts.reduce((a,b)=>a.quality.mult>=b.quality.mult?a:b);
      const item={id:t.id,name:t.name,dynasty:t.dynasty,museum:t.museum,model:t.model,desc:t.desc,
                  parts,value,sold:false,ts:Date.now()};
      S.vault.push(item);
      G.vault.push(item);
      S.totalValue=(S.totalValue||0)+value;
      G.taels+=value;
      persist();
      $("#foot").innerHTML=`
        <div class="appr-result">
          <div class="ar-line">综合估值 <b>${value.toLocaleString()} 两</b>白银</div>
          <div class="ar-sub">最高词条：<span style="color:${best.quality.color}">${best.quality.name} · ${best.affix}</span>（${best.name}）</div>
          <p class="ar-desc">${t.desc}</p>
          <button class="btn primary" id="stash">收入藏宝阁 · 继续 →</button>
        </div>`;
      $("#stash").onclick = ()=>onDone();
    }

    wipe.addEventListener("mousedown",e=>{painting=true;eraseAt(e.clientX,e.clientY);});
    window.addEventListener("mousemove",e=>{if(painting)eraseAt(e.clientX,e.clientY);});
    window.addEventListener("mouseup",()=>painting=false);
    wipe.addEventListener("touchstart",e=>{painting=true;const t2=e.touches[0];eraseAt(t2.clientX,t2.clientY);},{passive:true});
    wipe.addEventListener("touchmove",e=>{if(painting){const t2=e.touches[0];eraseAt(t2.clientX,t2.clientY);}},{passive:true});
    wipe.addEventListener("touchend",()=>painting=false);
  }

  function disposeOverlay(){viewer=null;window.__activeViewer=null;}

  /* ============================================================
   *  结算 · renderEnd
   * ============================================================ */
  function submitScore() {
    const name = "旅人";
    G.leaderboard.push({
      name, score: G.totalRight, taels: G.taels,
      date: new Date().toLocaleDateString("zh-CN")
    });
    G.leaderboard.sort((a,b)=>b.score-a.score);
    if(G.leaderboard.length>20) G.leaderboard.length=20;
    persist();
  }

  function renderEnd() {
    disposeOverlay();
    const cleared = S.mode==="story" && S.stageIdx>=STAGES.length;
    const tier = G.taels>=30000?"掌眼宗师":G.taels>=15000?"老练银主":"初出寻宝人";
    app.innerHTML = `
      <section class="screen end">
        <div class="seal big">${cleared?"終":"歿"}</div>
        <h1 class="title">${cleared?"江口沉银 · 大白于世":"寻宝止步"}</h1>
        <p class="subtitle">${tier} ｜ 累计银两 ${G.taels.toLocaleString()} 两 ｜ 总答对 ${G.totalRight} 题</p>
        <p class="lede">${cleared
          ?"你破尽五关、历遍险境——证实沉银乃兵败零散所沉，非一人主藏，遂联名上报，成就「江口沉银遗址」。传说，就此落地为信史。"
          :"你未能走到终局，但已窥见这段真实历史的重量。"}</p>
        <div class="end-actions" style="flex-wrap:wrap;justify-content:center;gap:12px;margin-top:20px">
          <button class="btn primary" id="againStory">再入主线</button>
          <button class="btn" id="againInf">无限题库</button>
          <button class="btn ghost" id="goVault">🏺 藏宝阁</button>
          <button class="btn ghost" id="goBoard">🏆 排行榜</button>
          <button class="btn ghost" id="goHome">首页</button>
        </div>
      </section>`;
    $("#againStory").onclick=()=>{newRun("story");renderStage();};
    $("#againInf").onclick=()=>{newRun("infinite");renderInfinite();};
    $("#goVault").onclick=showVaultModal;
    $("#goBoard").onclick=showLeaderboard;
    $("#goHome").onclick=renderStart;
  }

  /* ============================================================
   *  新手引导
   * ============================================================ */
  function showGuideModal(onDone) {
    removeModal("guideModal");
    const m = document.createElement("div");
    m.id = "guideModal";
    m.style.cssText = "position:fixed;inset:0;z-index:400;background:rgba(6,8,12,.92);overflow-y:auto;padding:20px;display:grid;place-items:center";
    const steps = [
      { i:"①", t:"答题成长", d:"进入「主线五关」或「无限题库」，<b>答对题目</b>即可获得 <b>银两</b>（每题 +50）与 <b>职业经验</b>。" },
      { i:"②", t:"解锁职业与武器", d:"某类题目（江口沉银 / 文物·青铜 / 故宫 / 山海经 / 中医药…）累计答对 <b>5 题</b>，对应<b>职业升至 1 级</b>，并<b>解锁该职业专属武器</b>；继续答对可升至 2、3 级。" },
      { i:"③", t:"银两买弧光", d:"在「✨ 弧光商店」用银两购买 <b>弧光</b>（武器洗练材料）与续命符。弧光是让武器焕新的关键资源。" },
      { i:"④", t:"武器洗练 · 外观焕新", d:"在「⚔ 武器间」用弧光洗练武器，提升<b>词条品质</b>。品质越高，武器外观越华贵、自带流光：凡品 → 良品 → 精品 → 珍品 → 国宝。" },
      { i:"⑤", t:"藏宝与排行", d:"鉴宝所得宝物进入「🏺 藏宝阁」，可<b>出售换银两</b>；你的成绩会记入「🏆 排行榜」。" },
      { i:"🏠", t:"随时返回合集", d:"点右下角 <b>🏠</b> 可回到《古籍探宝续》封面，重温本合集的介绍；封面下方还可直达本作「江口沉银 · 青铜秘案」主线。" }
    ];
    m.innerHTML = `
      <div style="width:100%;max-width:560px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <h2 style="color:var(--gold-hi);letter-spacing:2px">❓ 新手引导 · 寻银之路</h2>
          <button id="closeGuide" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer">✕</button>
        </div>
        <p style="color:var(--dim);font-size:13px;margin-bottom:14px">把这五步走通，你就能从「答题」一路玩到「武器流光」。</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${steps.map(s=>`
            <div style="display:flex;gap:12px;border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--panel2)">
              <div style="font-size:22px;color:var(--gold);min-width:28px;text-align:center;line-height:1.2">${s.i}</div>
              <div>
                <div style="font-size:16px;color:var(--silver-hi);margin-bottom:3px">${s.t}</div>
                <div style="font-size:13px;color:var(--dim);line-height:1.7">${s.d}</div>
              </div>
            </div>`).join("")}
        </div>
        <button class="btn primary" id="startGuide" style="width:100%;margin-top:18px;padding:12px;font-size:16px;letter-spacing:2px">开始寻银 →</button>
      </div>`;
    document.body.appendChild(m);
    const close = () => { G.seenGuide = true; persist(); m.remove(); if (typeof onDone === "function") onDone(); };
    document.getElementById("closeGuide").onclick = close;
    document.getElementById("startGuide").onclick = close;
  }

  /* ============================================================
   *  藏宝阁 Modal（悬浮 + 结算页）
   * ============================================================ */
  function showVaultModal() {
    removeModal("vaultModal");
    const unsold = G.vault.filter(v=>!v.sold);
    const modal = document.createElement("div");
    modal.id = "vaultModal";
    modal.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(6,8,12,.88);overflow-y:auto;padding:20px";
    modal.innerHTML = `
      <div style="max-width:680px;margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="color:var(--gold-hi);letter-spacing:3px">🏺 藏宝阁 · ${unsold.length} 件</h2>
          <button id="closeVault" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer">✕</button>
        </div>
        <div style="color:var(--dim);font-size:13px;margin-bottom:14px">银两：<b style="color:var(--gold-hi)">${G.taels.toLocaleString()}</b> 两 ｜
          <a id="goShop" style="color:var(--gold);cursor:pointer;text-decoration:underline">🛒 弧光商店</a> ｜
          <a id="goWeapon" style="color:var(--jade);cursor:pointer;text-decoration:underline">⚔ 武器间</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px" id="vaultGrid">
          ${unsold.length===0?"<p style='color:var(--dim)'>尚无藏品</p>":
            unsold.map((v,i)=>`
              <div style="border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel2);cursor:pointer" data-vi="${i}" class="vcard2">
                <div style="color:var(--silver-hi);font-size:14px;letter-spacing:1px">${v.name}</div>
                <div style="color:var(--gold-hi);font-size:13px;margin:5px 0">${v.value.toLocaleString()} 两</div>
                <div style="font-size:11px">${v.parts.map(p=>`<span style="color:${p.quality.color}">${p.quality.name}</span>`).join(" ")}</div>
                <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
                  <button class="btn" style="padding:4px 10px;font-size:12px" data-view="${i}">观赏</button>
                  <button class="btn danger-btn" style="padding:4px 10px;font-size:12px" data-sell="${i}">出售</button>
                </div>
              </div>`).join("")}
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("closeVault").onclick=()=>modal.remove();
    document.getElementById("goShop").onclick=()=>{modal.remove();showShopModal();};
    document.getElementById("goWeapon").onclick=()=>{modal.remove();showWeaponModal();};
    modal.querySelectorAll("[data-view]").forEach(btn=>{
      btn.onclick=e=>{e.stopPropagation();openItemViewer(unsold[+btn.dataset.view]);};
    });
    modal.querySelectorAll("[data-sell]").forEach(btn=>{
      btn.onclick=e=>{
        e.stopPropagation();
        const item=unsold[+btn.dataset.sell];
        item.sold=true;
        G.taels+=item.value;
        persist();
        modal.remove();
        showVaultModal();
      };
    });
  }

  function removeModal(id){const el=document.getElementById(id);if(el)el.remove();}

  /* 快速3D观赏弹窗 */
  function openItemViewer(item) {
    removeModal("itemViewModal");
    const m = document.createElement("div");
    m.id="itemViewModal";
    m.style.cssText="position:fixed;inset:0;z-index:300;background:rgba(6,8,12,.9);display:grid;place-items:center;padding:20px";
    m.innerHTML=`
      <div style="width:100%;max-width:560px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;text-align:center">
        <canvas id="ivm3d" style="width:100%;height:340px;display:block;border-radius:6px;background:radial-gradient(120% 100% at 50% 30%,#23402c,#0a0f08);cursor:grab;touch-action:none"></canvas>
        <div style="text-align:left;padding:14px 6px 6px">
          <div style="color:var(--silver-hi);font-size:20px;letter-spacing:2px">${item.name}</div>
          <div style="color:var(--dim);font-size:13px;margin:4px 0">${item.dynasty} ｜ ${item.museum}</div>
          <div style="color:var(--gold-hi);font-size:15px;margin-bottom:10px">估值 ${item.value.toLocaleString()} 两</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px 14px;font-size:13px">
            ${item.parts.map(p=>`<div style="display:flex;justify-content:space-between;border-bottom:1px dashed var(--line);padding:3px 0"><span style="color:var(--paper-dim)">${p.name}</span><b style="color:${p.quality.color}">${p.quality.name}·${p.affix}</b></div>`).join("")}
          </div>
        </div>
        <button class="btn" id="closeIvm">合上</button>
      </div>`;
    document.body.appendChild(m);
    const c=document.getElementById("ivm3d");
    const v=new window.TreasureViewer(c);
    v.load(item.model); v.autoRotate=false;
    document.getElementById("closeIvm").onclick=()=>{window.__activeViewer=null;m.remove();};
  }

  /* ============================================================
   *  弧光商店
   * ============================================================ */
  function showShopModal() {
    removeModal("shopModal");
    const m=document.createElement("div");
    m.id="shopModal";
    m.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(6,8,12,.88);overflow-y:auto;padding:20px";
    m.innerHTML=`
      <div style="max-width:600px;margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="color:var(--gold-hi);letter-spacing:3px">✨ 弧光商店</h2>
          <button id="closeShop" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer">✕</button>
        </div>
        <div style="color:var(--dim);font-size:13px;margin-bottom:16px">当前银两：<b style="color:var(--gold-hi)" id="shopTaels">${G.taels.toLocaleString()}</b> 两</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${ARC_ITEMS.map(item=>`
            <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:10px;padding:12px 16px;background:var(--panel2)">
              <div>
                <div style="font-size:17px;color:var(--silver-hi)">${item.icon} ${item.name}</div>
                <div style="font-size:13px;color:var(--dim);margin-top:3px">${item.desc}</div>
                ${item.key!=="hp_potion"?`<div style="font-size:12px;color:var(--jade);margin-top:2px">库存：${G.arcs[item.key]||0}</div>`:""}
              </div>
              <button class="btn primary" style="padding:8px 18px;font-size:14px;white-space:nowrap" data-buy="${item.key}">
                ${item.price.toLocaleString()} 两
              </button>
            </div>`).join("")}
        </div>
        <div style="margin-top:16px;font-size:12px;color:var(--dim)">弧光用于武器洗练；续命符立即增加一条命（上限5）。</div>
      </div>`;
    document.body.appendChild(m);
    document.getElementById("closeShop").onclick=()=>m.remove();
    m.querySelectorAll("[data-buy]").forEach(btn=>{
      btn.onclick=()=>{
        const key=btn.dataset.buy;
        const item=ARC_ITEMS.find(a=>a.key===key);
        if(G.taels<item.price){alert("银两不足！");return;}
        G.taels-=item.price;
        if(key==="hp_potion"){S.hp=Math.min(5,(S.hp||3)+1);}
        else{G.arcs[key]=(G.arcs[key]||0)+1;}
        persist();
        document.getElementById("shopTaels").textContent=G.taels.toLocaleString();
        m.querySelectorAll("[data-buy]").forEach(b=>{
          const it=ARC_ITEMS.find(a=>a.key===b.dataset.buy);
          if(it&&it.key!=="hp_potion"){
            const kvEl=b.closest("div[style]")&&b.closest("div[style]").querySelector(".arc-stock");
          }
        });
        m.remove();showShopModal();
      };
    });
  }

  /* ============================================================
   *  武器间 + 洗练系统
   * ============================================================ */
  function showWeaponModal() {
    removeModal("weaponModal");
    const m = document.createElement("div");
    m.id = "weaponModal";
    m.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(6,8,12,.88);overflow-y:auto;padding:20px";

    const profHtml = Object.entries(PROFESSIONS).map(([profKey, p]) => {
      const exp = G.profExp[profKey] || 0;
      const lv = profLevel(profKey);
      const next = lv===0?5:lv===1?12:lv===2?25:null;
      const w = WEAPONS[p.weapon];
      const wData = G.weapons[p.weapon] || null;

      // 武器部位展示
      let partsHtml = "";
      if (lv >= 1 && wData) {
        const parts = wData.parts || w.partNames.map((pn,i) => ({
          name: pn, qualityIdx: 0, traitIdx: 0, appearanceIdx: 0
        }));
        partsHtml = `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-top:10px">
            ${parts.map((pt, pi) => `
              <div style="border:1px solid ${QUALITY[pt.qualityIdx].color};border-radius:8px;padding:8px 10px;background:var(--panel);font-size:12px">
                <div style="color:var(--dim);margin-bottom:3px">${pt.name}</div>
                <div style="color:${QUALITY[pt.qualityIdx].color};font-weight:700">${QUALITY[pt.qualityIdx].name}</div>
                <div style="color:var(--silver);font-size:11px">${w.traits[pt.traitIdx]}</div>
                <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
                  ${["arc_common","arc_fine","arc_master","arc_divine"].map(ak => {
                    const ai = ARC_ITEMS.find(a => a.key === ak);
                    const cnt = G.arcs[ak] || 0;
                    return `<button style="padding:2px 6px;font-size:11px;border-radius:4px;border:1px solid var(--line);background:var(--panel2);color:var(--parch);cursor:${cnt?'pointer':'default'};opacity:${cnt?1:0.4}"
                      data-prof="${profKey}" data-pi="${pi}" data-arc="${ak}" ${cnt===0?"disabled":""}>${ai.icon}</button>`;
                  }).join("")}
                </div>
              </div>`).join("")}
          </div>`;
      }

      return `
        <div style="border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--panel2);margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="font-size:24px">${p.icon}</span>
            <div>
              <div style="color:var(--silver-hi);font-size:15px">${p.name}</div>
              <div style="color:var(--dim);font-size:12px">${p.cats.join("、")}</div>
            </div>
            <div style="margin-left:auto;text-align:right">
              <div style="color:var(--gold-hi);font-size:13px">Lv${lv} ${profLevelName(profKey)}</div>
              <div style="color:var(--dim);font-size:11px">${exp}题${next?` · 下级${next}题`:" · 满级"}</div>
            </div>
          </div>
          ${lv >= 1 && wData ? `
            <div style="border-top:1px solid var(--line);padding-top:10px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="color:var(--jade);font-size:15px">${w.icon} ${w.name}</span>
                <span style="color:var(--dim);font-size:12px">· ${w.appearances[wData.appearanceIdx||0]}</span>
                <button style="margin-left:auto;padding:4px 10px;font-size:12px;border-radius:6px;border:1px solid var(--jade);background:none;color:var(--jade);cursor:pointer" data-view3d="${p.weapon}">3D观赏</button>
              </div>
              <div style="font-size:12px;color:var(--dim);margin-bottom:8px">${w.base} · 洗练提升词条品质，武器外观随之焕新（品质越高越华贵）</div>
              ${partsHtml}
            </div>` :
          lv === 0 ? `<div style="color:var(--dim);font-size:13px;margin-top:4px">答对 5 题该类问题即可解锁：${w.icon} ${w.name}</div>` : ""}
        </div>`;
    }).join("");

    m.innerHTML = `
      <div style="max-width:660px;margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="color:var(--jade);letter-spacing:3px">⚔ 武器间 · 职业</h2>
          <button id="closeWeapon" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer">✕</button>
        </div>
        <div style="color:var(--dim);font-size:12px;margin-bottom:14px">弧光库存：${ARC_ITEMS.filter(a=>a.key!=="hp_potion").map(a=>`${a.icon}×${G.arcs[a.key]||0}`).join("  ")}</div>
        ${profHtml}
      </div>`;
    document.body.appendChild(m);
    document.getElementById("closeWeapon").onclick = () => m.remove();

    // 3D观赏按钮
    m.querySelectorAll("[data-view3d]").forEach(btn => {
      btn.onclick = () => openWeaponViewer(btn.dataset.view3d);
    });

    // 逐部位洗练按钮
    m.querySelectorAll("[data-prof][data-pi][data-arc]").forEach(btn => {
      btn.onclick = () => {
        const profKey = btn.dataset.prof;
        const pi = +btn.dataset.pi;
        const arcKey = btn.dataset.arc;
        if ((G.arcs[arcKey] || 0) === 0) return;

        const wKey = PROFESSIONS[profKey].weapon;
        const w = WEAPONS[wKey];
        const arcIdx = ["arc_common","arc_fine","arc_master","arc_divine"].indexOf(arcKey);

        // 计算新词条
        const maxQ = Math.min(4, arcIdx + 1 + (Math.random() < 0.3 ? 1 : 0));
        const minQ = Math.max(0, arcIdx - 1);
        const newQIdx = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
        const newTIdx = Math.floor(Math.random() * w.traits.length);
        const newAIdx = Math.floor(Math.random() * Math.min(w.appearances.length, arcIdx + 2));
        const newQ = QUALITY[newQIdx];

        // 先扣除弧光，弹出确认弹窗
        showRefineResult(profKey, pi, arcKey, newQIdx, newTIdx, newAIdx, wKey, w, newQ);
      };
    });
  }

  /* 洗练结果弹窗：保留 or 放弃 */
  function showRefineResult(profKey, pi, arcKey, newQIdx, newTIdx, newAIdx, wKey, w, newQ) {
    removeModal("refineModal");
    // 获取当前部位旧词条
    const wData = G.weapons[wKey] || { parts: w.partNames.map(pn=>({name:pn,qualityIdx:0,traitIdx:0,appearanceIdx:0})), appearanceIdx:0 };
    if (!wData.parts) wData.parts = w.partNames.map(pn=>({name:pn,qualityIdx:0,traitIdx:0,appearanceIdx:0}));
    const oldPart = wData.parts[pi];
    const oldQ = QUALITY[oldPart.qualityIdx];

    const rf = document.createElement("div");
    rf.id = "refineModal";
    rf.style.cssText = "position:fixed;inset:0;z-index:300;background:rgba(6,8,12,.9);display:grid;place-items:center;padding:20px";
    rf.innerHTML = `
      <div style="max-width:380px;width:100%;background:var(--panel);border:2px solid var(--gold);border-radius:16px;padding:24px;text-align:center">
        <div style="font-size:18px;color:var(--gold-hi);letter-spacing:2px;margin-bottom:16px">✨ 洗练结果</div>
        <div style="font-size:14px;color:var(--dim);margin-bottom:12px">${w.name} · ${oldPart.name}</div>
        <div style="display:flex;justify-content:center;align-items:center;gap:16px;margin-bottom:20px">
          <div style="text-align:center;opacity:.6">
            <div style="color:${oldQ.color};font-size:16px;font-weight:700">${oldQ.name}</div>
            <div style="color:var(--dim);font-size:12px">${w.traits[oldPart.traitIdx]}</div>
            <div style="color:var(--dim);font-size:11px;margin-top:2px">旧词条</div>
          </div>
          <div style="color:var(--gold);font-size:22px">→</div>
          <div style="text-align:center">
            <div style="color:${newQ.color};font-size:20px;font-weight:700;text-shadow:0 0 10px ${newQ.color}">${newQ.name}</div>
            <div style="color:var(--silver-hi);font-size:13px">${w.traits[newTIdx]}</div>
            <div style="color:var(--dim);font-size:11px;margin-top:2px">新词条</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn primary" id="refineKeep" style="padding:10px 24px">保留新词条</button>
          <button class="btn ghost" id="refineDiscard" style="padding:10px 24px">放弃，不保留</button>
        </div>
        <div style="font-size:12px;color:var(--dim);margin-top:12px">选择保留则消耗弧光；放弃则弧光归还</div>
      </div>`;
    document.body.appendChild(rf);

    document.getElementById("refineKeep").onclick = () => {
      // 扣弧光，保存新词条
      G.arcs[arcKey] = Math.max(0, (G.arcs[arcKey] || 0) - 1);
      const wData2 = G.weapons[wKey] || { parts: w.partNames.map(pn=>({name:pn,qualityIdx:0,traitIdx:0,appearanceIdx:0})), appearanceIdx:0 };
      if (!wData2.parts) wData2.parts = w.partNames.map(pn=>({name:pn,qualityIdx:0,traitIdx:0,appearanceIdx:0}));
      wData2.parts[pi] = { name: oldPart.name, qualityIdx: newQIdx, traitIdx: newTIdx, appearanceIdx: newAIdx };
      wData2.appearanceIdx = newAIdx;
      G.weapons[wKey] = wData2;
      persist();
      rf.remove();
      removeModal("weaponModal");
      showWeaponModal();
    };

    document.getElementById("refineDiscard").onclick = () => {
      rf.remove(); // 弧光不扣
    };
  }

  /* 武器3D观赏弹窗 */
  function openWeaponViewer(wKey) {
    removeModal("weaponViewModal");
    const w = WEAPONS[wKey];
    const wData = G.weapons[wKey] || {};
    const parts = wData.parts || w.partNames.map(pn => ({ name: pn, qualityIdx: 0, traitIdx: 0 }));
    const maxQ = parts.length > 0 ? Math.max(...parts.map(p => p.qualityIdx || 0)) : 0;
    const maxA = wData.appearanceIdx != null ? wData.appearanceIdx
      : (parts.length > 0 ? Math.max(...parts.map(p => p.appearanceIdx || 0)) : 0);
    const overallQ = Math.max(maxQ, maxA);
    const qInfo = QUALITY[overallQ];
    const mv = document.createElement("div");
    mv.id = "weaponViewModal";
    mv.style.cssText = "position:fixed;inset:0;z-index:350;background:rgba(6,8,12,.92);display:grid;place-items:center;padding:20px";
    mv.innerHTML = `
      <div style="width:100%;max-width:520px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;text-align:center">
        <canvas id="wv3d" style="width:100%;height:320px;display:block;border-radius:6px;background:radial-gradient(120% 100% at 50% 30%,#1d2c1f,#0a0f0c);cursor:grab;touch-action:none"></canvas>
        <div style="text-align:left;padding:12px 4px 6px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:var(--jade);font-size:18px;letter-spacing:2px">${w.icon} ${w.name}</span>
            <span style="border:1px solid ${qInfo.color};color:${qInfo.color};font-size:12px;padding:2px 10px;border-radius:6px;font-weight:700">${qInfo.name} · ${w.appearances[maxA] || w.appearances[0]}</span>
          </div>
          <div style="color:var(--dim);font-size:13px;margin:4px 0 10px">${w.base}</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">
            ${parts.map(pt => `
              <div style="border:1px solid ${QUALITY[pt.qualityIdx].color};border-radius:7px;padding:6px 10px;font-size:12px">
                <span style="color:var(--dim)">${pt.name}</span>
                <span style="color:${QUALITY[pt.qualityIdx].color};font-weight:700;margin-left:6px">${QUALITY[pt.qualityIdx].name}</span>
                <span style="color:var(--silver);margin-left:4px">${w.traits[pt.traitIdx]}</span>
              </div>`).join("")}
          </div>
        </div>
        <button class="btn" id="closeWV" style="margin-top:8px">合上</button>
      </div>`;
    document.body.appendChild(mv);
    const c = document.getElementById("wv3d");
    const v = new window.TreasureViewer(c);
    v.load(w.model, { qualityLevel: maxQ, appearanceIdx: maxA }); v.autoRotate = true;
    document.getElementById("closeWV").onclick = () => { window.__activeViewer = null; mv.remove(); };
  }

  /* ============================================================
   *  排行榜
   * ============================================================ */
  function showLeaderboard() {
    removeModal("boardModal");
    const m=document.createElement("div");
    m.id="boardModal";
    m.style.cssText="position:fixed;inset:0;z-index:200;background:rgba(6,8,12,.88);overflow-y:auto;padding:20px";
    const rows=G.leaderboard.slice(0,10);
    m.innerHTML=`
      <div style="max-width:560px;margin:0 auto;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="color:var(--gold-hi);letter-spacing:3px">🏆 本机排行榜</h2>
          <button id="closeBoard" style="background:none;border:none;color:var(--dim);font-size:22px;cursor:pointer">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:36px 1fr 80px 90px 80px;gap:6px;font-size:13px;margin-bottom:8px;color:var(--dim);padding:0 4px">
          <span>#</span><span>称号</span><span style="text-align:right">答对</span><span style="text-align:right">银两</span><span style="text-align:right">日期</span>
        </div>
        ${rows.length===0?"<p style='color:var(--dim);text-align:center;padding:20px'>暂无记录，完成一局即上榜</p>":
          rows.map((r,i)=>`
          <div style="display:grid;grid-template-columns:36px 1fr 80px 90px 80px;gap:6px;padding:8px 4px;border-bottom:1px solid var(--line);font-size:14px;align-items:center">
            <span style="color:${i===0?"var(--gold)":i===1?"var(--silver)":i===2?"var(--bronze)":"var(--paper-dim)"};font-weight:700">${i+1}</span>
            <span style="color:var(--silver-hi)">${r.name}</span>
            <span style="text-align:right;color:var(--ok)">${r.score}</span>
            <span style="text-align:right;color:var(--gold-hi)">${(r.taels||0).toLocaleString()}</span>
            <span style="text-align:right;color:var(--dim);font-size:12px">${r.date||""}</span>
          </div>`).join("")}
        <div style="margin-top:16px;font-size:12px;color:var(--dim);text-align:center">完成主线或无限模式一局后自动上榜。</div>
      </div>`;
    document.body.appendChild(m);
    document.getElementById("closeBoard").onclick=()=>m.remove();
  }

  /* ============================================================
   *  启动
   * ============================================================ */
  renderStart();
})();

