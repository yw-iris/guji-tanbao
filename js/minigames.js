/* ============================================================
 *  墨家机关 · 小游戏模块
 *  ------------------------------------------------------------
 *  一、华容道（HuarongDao）—— 经典滑块解谜，拖动将「曹操」移至出口
 *  二、鲁班锁（LubanLock）  —— 三维六柱互锁机关，按正确顺序拆解
 *
 *  两者皆为副本中的固定机关：解开方能继续前行。
 *  暴露：window.MiniGames = { HuarongDao, LubanLock }
 * ============================================================ */
(function () {
  "use strict";

  /* ========================================================
   * 一、华容道
   * ======================================================== */
  const HR_ROWS = 5, HR_COLS = 4;

  // 经典「横刀立马」布局：曹操居顶，关羽横刀于中，四将守侧，四兵布底
  const HR_PIECES = [
    { id: "caocao",   name: "曹操", shape: "2x2", row: 0, col: 1, cls: "hr-cao" },
    { id: "guanyu",   name: "关羽", shape: "2x1", row: 2, col: 1, cls: "hr-guan" },
    { id: "zhangfei", name: "张飞", shape: "1x2", row: 0, col: 0, cls: "hr-gen" },
    { id: "zhaoyun",  name: "赵云", shape: "1x2", row: 0, col: 3, cls: "hr-gen" },
    { id: "machao",   name: "马超", shape: "1x2", row: 2, col: 0, cls: "hr-gen" },
    { id: "huangzhong",name:"黄忠", shape: "1x2", row: 2, col: 3, cls: "hr-gen" },
    { id: "bing1",    name: "兵",   shape: "1x1", row: 3, col: 1, cls: "hr-bing" },
    { id: "bing2",    name: "兵",   shape: "1x1", row: 3, col: 2, cls: "hr-bing" },
    { id: "bing3",    name: "兵",   shape: "1x1", row: 4, col: 0, cls: "hr-bing" },
    { id: "bing4",    name: "兵",   shape: "1x1", row: 4, col: 3, cls: "hr-bing" }
  ];

  function shapeSize(shape) {
    if (shape === "2x2") return [2, 2];
    if (shape === "2x1") return [2, 1];
    if (shape === "1x2") return [1, 2];
    return [1, 1];
  }

  /* ---- BFS 求解器：返回最短步骤序列 [{pieceIdx, dir}] ---- */
  function solveKlotski(pieces) {
    function makeBoard(state) {
      const b = Array.from({ length: HR_ROWS }, () => Array(HR_COLS).fill(-1));
      state.forEach((p, i) => {
        const [w, h] = shapeSize(p.shape);
        for (let r = 0; r < h; r++)
          for (let c = 0; c < w; c++)
            b[p.row + r][p.col + c] = i;
      });
      return b;
    }
    function getKey(state) {
      const b = makeBoard(state);
      return b.map(row =>
        row.map(v => {
          if (v < 0) return ".";
          const s = state[v].shape;
          if (s === "2x2") return "C";
          if (s === "2x1") return "G";
          if (s === "1x2") return "V";
          return "S";
        }).join("")
      ).join("");
    }
    function isGoal(state) { return state[0].row === 3 && state[0].col === 1; }

    function tryMove(state, idx, dr, dc) {
      const p = state[idx];
      const [w, h] = shapeSize(p.shape);
      const nr = p.row + dr, nc = p.col + dc;
      if (nr < 0 || nc < 0 || nr + h > HR_ROWS || nc + w > HR_COLS) return null;
      const b = makeBoard(state);
      for (let r = 0; r < h; r++)
        for (let c = 0; c < w; c++) {
          const cell = b[nr + r][nc + c];
          if (cell !== -1 && cell !== idx) return null;
        }
      return state.map((pp, i) => i === idx ? { ...pp, row: nr, col: nc } : pp);
    }

    const init = pieces.map(p => ({ shape: p.shape, row: p.row, col: p.col }));
    if (isGoal(init)) return [];
    const dirs = [[-1, 0, "up"], [1, 0, "down"], [0, -1, "left"], [0, 1, "right"]];
    const visited = new Set([getKey(init)]);
    const queue = [{ state: init, parent: null, move: null }];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++];
      const st = node.state;
      for (let i = 0; i < st.length; i++) {
        for (const [dr, dc, dir] of dirs) {
          const ns = tryMove(st, i, dr, dc);
          if (!ns) continue;
          const k = getKey(ns);
          if (visited.has(k)) continue;
          visited.add(k);
          const child = { state: ns, parent: node, move: { pieceIdx: i, dir } };
          if (isGoal(ns)) {
            const path = [];
            let cur = child;
            while (cur.parent) { path.unshift(cur.move); cur = cur.parent; }
            return path;
          }
          queue.push(child);
        }
      }
      if (queue.length > 300000) break; // 安全上限
    }
    return null;
  }

  class HuarongDao {
    constructor(container, opts = {}) {
      this.container = container;
      this.onSolve = opts.onSolve || (() => {});
      this.pieces = HR_PIECES.map(p => ({ ...p }));
      this.moves = 0;
      this.solved = false;
      this.dragging = null;
      this.solution = null;
      this.hintIdx = 0;
      this.render();
      // 后台求解（用于提示）
      setTimeout(() => {
        try { this.solution = solveKlotski(this.pieces); } catch (e) { /* 静默 */ }
      }, 50);
    }

    render() {
      const c = this.container;
      c.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "hr-wrap";
      wrap.innerHTML = `
        <div class="hr-bar">
          <span class="hr-moves">步数：<b id="hrMoves">0</b></span>
          <span class="hr-goal">将 <em class="hr-cao-text">曹操</em> 移至底部出口</span>
        </div>
        <div class="hr-board" id="hrBoard">
          <div class="hr-exit"></div>
        </div>
        <div class="hr-ctrls">
          <button class="btn ghost hr-btn" id="hrReset">重置</button>
          <button class="btn ghost hr-btn" id="hrHint">提示</button>
          <button class="btn ghost hr-btn" id="hrAuto">自动解</button>
        </div>
        <p class="hr-tip">拖动棋子滑动，空格让路。</p>`;
      c.appendChild(wrap);
      this.boardEl = c.querySelector("#hrBoard");
      this.movesEl = c.querySelector("#hrMoves");
      this.renderPieces();
      c.querySelector("#hrReset").onclick = () => this.reset();
      c.querySelector("#hrHint").onclick = () => this.hint();
      c.querySelector("#hrAuto").onclick = () => this.autoSolve();
      this.bindDrag();
    }

    renderPieces() {
      // 移除旧棋子
      this.boardEl.querySelectorAll(".hr-piece").forEach(el => el.remove());
      this.pieces.forEach((p, i) => {
        const [w, h] = shapeSize(p.shape);
        const el = document.createElement("div");
        el.className = "hr-piece " + p.cls;
        el.dataset.idx = i;
        el.style.left = (p.col / HR_COLS * 100) + "%";
        el.style.top = (p.row / HR_ROWS * 100) + "%";
        el.style.width = (w / HR_COLS * 100) + "%";
        el.style.height = (h / HR_ROWS * 100) + "%";
        el.innerHTML = `<span>${p.name}</span>`;
        this.boardEl.appendChild(el);
      });
    }

    cellSize() {
      const rect = this.boardEl.getBoundingClientRect();
      return { w: rect.width / HR_COLS, h: rect.height / HR_ROWS };
    }

    canMove(idx, dir) {
      const p = this.pieces[idx];
      const [w, h] = shapeSize(p.shape);
      let dr = 0, dc = 0;
      if (dir === "up") dr = -1;
      else if (dir === "down") dr = 1;
      else if (dir === "left") dc = -1;
      else if (dir === "right") dc = 1;
      const nr = p.row + dr, nc = p.col + dc;
      if (nr < 0 || nc < 0 || nr + h > HR_ROWS || nc + w > HR_COLS) return false;
      // 构建碰撞表
      const occ = Array.from({ length: HR_ROWS }, () => Array(HR_COLS).fill(-1));
      this.pieces.forEach((pp, j) => {
        if (j === idx) return;
        const [pw, ph] = shapeSize(pp.shape);
        for (let r = 0; r < ph; r++)
          for (let c2 = 0; c2 < pw; c2++)
            occ[pp.row + r][pp.col + c2] = j;
      });
      for (let r = 0; r < h; r++)
        for (let c2 = 0; c2 < w; c2++)
          if (occ[nr + r][nc + c2] !== -1) return false;
      return true;
    }

    move(idx, dir) {
      if (!this.canMove(idx, dir)) return false;
      const p = this.pieces[idx];
      if (dir === "up") p.row--;
      else if (dir === "down") p.row++;
      else if (dir === "left") p.col--;
      else if (dir === "right") p.col++;
      this.moves++;
      this.movesEl.textContent = this.moves;
      this.updatePiecePos(idx);
      this.checkWin();
      return true;
    }

    updatePiecePos(idx) {
      const p = this.pieces[idx];
      const el = this.boardEl.querySelector(`.hr-piece[data-idx="${idx}"]`);
      if (!el) return;
      el.style.left = (p.col / HR_COLS * 100) + "%";
      el.style.top = (p.row / HR_ROWS * 100) + "%";
    }

    checkWin() {
      if (this.pieces[0].row === 3 && this.pieces[0].col === 1) {
        this.solved = true;
        const cao = this.boardEl.querySelector('.hr-piece[data-idx="0"]');
        if (cao) cao.classList.add("hr-win");
        setTimeout(() => {
          const banner = document.createElement("div");
          banner.className = "hr-solved";
          banner.innerHTML = `✔ 机关破解！${this.moves} 步`;
          this.container.querySelector(".hr-wrap").appendChild(banner);
        }, 300);
        setTimeout(() => this.onSolve(), 1100);
      }
    }

    reset() {
      this.pieces = HR_PIECES.map(p => ({ ...p }));
      this.moves = 0;
      this.solved = false;
      this.hintIdx = 0;
      this.movesEl.textContent = "0";
      this.renderPieces();
      // 重新求解
      setTimeout(() => {
        try { this.solution = solveKlotski(this.pieces); } catch (e) {}
      }, 50);
    }

    hint() {
      if (this.solved) { this.flashTip("已破解！"); return; }
      // 始终从当前状态重新求解，确保提示对应当前棋局
      const sol = solveKlotski(this.pieces);
      if (!sol || sol.length === 0) { this.flashTip("暂无提示，自行摸索！"); return; }
      const m = sol[0];
      const piece = this.pieces[m.pieceIdx];
      const dirText = { up: "上", down: "下", left: "左", right: "右" }[m.dir];
      this.flashTip(`将「${piece.name}」向${dirText}移一格`);
      // 高亮
      const els = this.boardEl.querySelectorAll(".hr-piece");
      els.forEach(el => el.classList.remove("hr-hint"));
      const target = this.boardEl.querySelector(`.hr-piece[data-idx="${m.pieceIdx}"]`);
      if (target) {
        target.classList.add("hr-hint");
        setTimeout(() => target.classList.remove("hr-hint"), 2000);
      }
    }

    autoSolve() {
      if (this.solved) return;
      const sol = solveKlotski(this.pieces);
      if (!sol) { this.flashTip("求解失败！"); return; }
      let i = 0;
      const step = () => {
        if (i >= sol.length || this.solved) return;
        const m = sol[i];
        this.move(m.pieceIdx, m.dir);
        i++;
        setTimeout(step, 280);
      };
      step();
    }

    flashTip(text) {
      let tip = this.container.querySelector(".hr-flash-tip");
      if (!tip) {
        tip = document.createElement("div");
        tip.className = "hr-flash-tip";
        this.container.querySelector(".hr-wrap").appendChild(tip);
      }
      tip.textContent = text;
      tip.classList.remove("show");
      void tip.offsetWidth;
      tip.classList.add("show");
    }

    bindDrag() {
      const start = (x, y, target) => {
        const pieceEl = target.closest(".hr-piece");
        if (!pieceEl || this.solved) return;
        this.dragging = {
          idx: parseInt(pieceEl.dataset.idx, 10),
          startX: x, startY: y
        };
        pieceEl.classList.add("hr-active");
      };
      const move = (x, y) => {
        if (!this.dragging) return;
        const { idx, startX, startY } = this.dragging;
        const { w: cw, h: ch } = this.cellSize();
        const dx = x - startX, dy = y - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) > cw * 0.45) {
            const dir = dx > 0 ? "right" : "left";
            if (this.move(idx, dir)) {
              this.dragging.startX += dir === "right" ? cw : -cw;
            } else { this.dragging.startX = x; this.dragging.startY = y; }
          }
        } else {
          if (Math.abs(dy) > ch * 0.45) {
            const dir = dy > 0 ? "down" : "up";
            if (this.move(idx, dir)) {
              this.dragging.startY += dir === "down" ? ch : -ch;
            } else { this.dragging.startX = x; this.dragging.startY = y; }
          }
        }
      };
      const end = () => {
        if (this.dragging) {
          const el = this.boardEl.querySelector(`.hr-piece[data-idx="${this.dragging.idx}"]`);
          if (el) el.classList.remove("hr-active");
        }
        this.dragging = null;
      };
      this.boardEl.addEventListener("mousedown", e => start(e.clientX, e.clientY, e.target));
      window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
      window.addEventListener("mouseup", end);
      this.boardEl.addEventListener("touchstart", e => {
        const t = e.touches[0]; start(t.clientX, t.clientY, e.target);
      }, { passive: true });
      window.addEventListener("touchmove", e => {
        if (!this.dragging) return;
        const t = e.touches[0]; move(t.clientX, t.clientY);
      }, { passive: true });
      window.addEventListener("touchend", end);
    }
  }

  /* ========================================================
   * 二、鲁班锁（三维六柱互锁机关）
   * ======================================================== */
  class LubanLock {
    constructor(container, opts = {}) {
      this.container = container;
      this.onSolve = opts.onSolve || (() => {});
      this.THREE = window.THREE;
      this.removed = new Set();
      this.wrongCount = 0;
      this.solved = false;

      // 六柱定义：轴向、位置、滑出方向、颜色、名称
      // blockBy 声明此柱被哪些柱卡住——须先拆走阻塞者方可取出
      this.defs = [
        { name: "天柱", axis: "z", pos: [ 0.55, 0.55, 0], slide: [ 0, 0, 1], color: 0xe0a83e, blockBy: [] },
        { name: "地柱", axis: "z", pos: [-0.55,-0.55, 0], slide: [ 0, 0,-1], color: 0x7fae8f, blockBy: [0] },
        { name: "玄柱", axis: "y", pos: [ 0.55, 0, 0.55], slide: [ 0, 1, 0], color: 0x4a86c7, blockBy: [0] },
        { name: "黄柱", axis: "y", pos: [-0.55, 0,-0.55], slide: [ 0,-1, 0], color: 0x9a6fd0, blockBy: [1] },
        { name: "宇柱", axis: "x", pos: [ 0, 0.55, 0.55], slide: [ 1, 0, 0], color: 0xcf6b5a, blockBy: [2] },
        { name: "宙柱", axis: "x", pos: [ 0,-0.55,-0.55], slide: [-1, 0, 0], color: 0xc9d2dc, blockBy: [3, 4] }
      ];

      this.render();
    }

    render() {
      const c = this.container;
      c.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "lb-wrap";
      wrap.innerHTML = `
        <div class="lb-bar">
          <span class="lb-progress">已拆：<b id="lbCount">0</b> / 6</span>
          <span class="lb-goal">点击可滑出的柱子将其拆下</span>
        </div>
        <div class="lb-canvas-wrap">
          <canvas id="lbCanvas" class="lb-canvas"></canvas>
          <div class="lb-hint" id="lbHint">拖动旋转 · 点击柱子尝试拆解</div>
        </div>
        <div class="lb-ctrls">
          <button class="btn ghost lb-btn" id="lbReset">重置</button>
          <button class="btn ghost lb-btn" id="lbHintBtn">提示</button>
        </div>
        <p class="lb-tip">六柱互锁，须按正确顺序逐一拆解。被卡住的柱子无法取出。</p>`;
      c.appendChild(wrap);
      this.countEl = c.querySelector("#lbCount");
      this.hintEl = c.querySelector("#lbHint");
      c.querySelector("#lbReset").onclick = () => this.reset();
      c.querySelector("#lbHintBtn").onclick = () => this.showHint();
      this.initThree();
    }

    initThree() {
      const THREE = this.THREE;
      if (!THREE) { this.fallback("三维引擎加载失败"); return; }
      this.canvas = this.container.querySelector("#lbCanvas");
      try {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      } catch (e) {
        this.fallback("WebGL 不可用，无法显示三维机关");
        return;
      }
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      this.camera.position.set(4.5, 3.5, 5.5);
      this.camera.lookAt(0, 0, 0);

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xfff2d8, 1.0); key.position.set(5, 7, 5); this.scene.add(key);
      const rim = new THREE.DirectionalLight(0x88aaff, 0.45); rim.position.set(-5, 2, -4); this.scene.add(rim);

      this.group = new THREE.Group();
      this.scene.add(this.group);

      this.pieceMeshes = [];
      this.defs.forEach((def, i) => {
        const mesh = this.buildPiece(def);
        mesh.userData.idx = i;
        this.group.add(mesh);
        this.pieceMeshes.push(mesh);
      });

      // 底座光圈
      const ringGeo = new THREE.RingGeometry(1.8, 2.2, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xe0a83e, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = -1.6;
      this.scene.add(ring);

      this.autoRotate = true;
      this.dragging = false;
      this.lastX = 0; this.lastY = 0;
      this.velX = 0.005;
      this.bindInteract();
      window.__activeViewer = this;
      this._animate();
      this._resize();
      window.addEventListener("resize", () => this._resize());
    }

    buildPiece(def) {
      const THREE = this.THREE;
      let geo;
      const len = 3.0, thick = 0.62;
      if (def.axis === "x") geo = new THREE.BoxGeometry(len, thick, thick);
      else if (def.axis === "y") geo = new THREE.BoxGeometry(thick, len, thick);
      else geo = new THREE.BoxGeometry(thick, thick, len);

      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: 0.35,
        metalness: 0.65,
        emissive: def.color,
        emissiveIntensity: 0.12
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(def.pos[0], def.pos[1], def.pos[2]);

      // 边线
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1a1208, linewidth: 2 }));
      mesh.add(line);

      // 端帽（两端的装饰凸起）
      const capGeo = new THREE.BoxGeometry(thick * 1.15, thick * 1.15, thick * 1.15);
      const capMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.2, metalness: 0.9, emissive: def.color, emissiveIntensity: 0.3 });
      [-1, 1].forEach(s => {
        const cap = new THREE.Mesh(capGeo, capMat);
        if (def.axis === "x") cap.position.x = s * len / 2;
        else if (def.axis === "y") cap.position.y = s * len / 2;
        else cap.position.z = s * len / 2;
        mesh.add(cap);
      });

      return mesh;
    }

    isRemovable(idx) {
      const def = this.defs[idx];
      return def.blockBy.every(b => this.removed.has(b));
    }

    bindInteract() {
      const THREE = this.THREE;
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const down = (x, y) => {
        this.dragging = true; this.lastX = x; this.lastY = y;
        this.autoRotate = false;
        this._downPos = { x, y };
      };
      const move = (x, y) => {
        if (!this.dragging) return;
        const dx = (x - this.lastX) * 0.01, dy = (y - this.lastY) * 0.01;
        this.group.rotation.y += dx;
        this.group.rotation.x += dy;
        this.velX = dx;
        this.lastX = x; this.lastY = y;
      };
      const up = (x, y) => {
        this.dragging = false;
        // 判断是否为点击（位移很小）
        if (this._downPos) {
          const dist = Math.hypot(x - this._downPos.x, y - this._downPos.y);
          if (dist < 6) this.handleClick(x, y, raycaster, mouse);
          this._downPos = null;
        }
      };

      this.canvas.addEventListener("mousedown", e => down(e.clientX, e.clientY));
      window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
      window.addEventListener("mouseup", e => up(e.clientX, e.clientY));
      this.canvas.addEventListener("touchstart", e => {
        const t = e.touches[0]; down(t.clientX, t.clientY);
      }, { passive: true });
      this.canvas.addEventListener("touchmove", e => {
        if (!this.dragging) return;
        const t = e.touches[0]; move(t.clientX, t.clientY);
      }, { passive: true });
      this.canvas.addEventListener("touchend", e => {
        const t = e.changedTouches[0];
        if (t) up(t.clientX, t.clientY);
      });
    }

    handleClick(x, y, raycaster, mouse) {
      if (this.solved) return;
      const rect = this.canvas.getBoundingClientRect();
      mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const meshes = this.pieceMeshes.filter((_, i) => !this.removed.has(i));
      // 同时检测子级（端帽）
      const all = [];
      meshes.forEach(m => { all.push(m); m.children.forEach(c => all.push(c)); });
      const hits = raycaster.intersectObjects(all);
      if (hits.length === 0) return;
      // 找到对应的顶层 mesh
      let obj = hits[0].object;
      while (obj.parent && obj.parent !== this.group) obj = obj.parent;
      const idx = obj.userData.idx;
      if (idx === undefined) return;
      this.tryRemove(idx);
    }

    tryRemove(idx) {
      if (this.webglFailed || this.solved) return;
      if (this.removed.has(idx)) return;
      const def = this.defs[idx];
      if (this.isRemovable(idx)) {
        this.removed.add(idx);
        this.countEl.textContent = this.removed.size;
        this.animateRemove(idx);
        this.flashHint(`✔ ${def.name}滑出，机关松动！`, true);
        this.wrongCount = 0;
        if (this.removed.size === 6) {
          this.solved = true;
          setTimeout(() => {
            const banner = document.createElement("div");
            banner.className = "lb-solved";
            banner.innerHTML = "✔ 六柱尽解，机关破解！";
            this.container.querySelector(".lb-wrap").appendChild(banner);
          }, 600);
          setTimeout(() => this.onSolve(), 1400);
        }
      } else {
        this.wrongCount++;
        this.shake(idx);
        const blockers = def.blockBy.filter(b => !this.removed.has(b)).map(b => this.defs[b].name);
        if (this.wrongCount >= 3) {
          this.flashHint(`✘ ${def.name}被「${blockers.join("、")}」卡住，须先拆之。`, false);
        } else {
          this.flashHint(`✘ ${def.name}纹丝不动，尚有他柱卡住。`, false);
        }
      }
    }

    animateRemove(idx) {
      if (!this.pieceMeshes) return;
      const mesh = this.pieceMeshes[idx];
      const def = this.defs[idx];
      const dir = def.slide;
      const startX = mesh.position.x, startY = mesh.position.y, startZ = mesh.position.z;
      const t0 = performance.now();
      const dur = 600;
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        mesh.position.x = startX + dir[0] * e * 4;
        mesh.position.y = startY + dir[1] * e * 4;
        mesh.position.z = startZ + dir[2] * e * 4;
        mesh.material.opacity = 1 - e;
        mesh.material.transparent = true;
        mesh.children.forEach(c => { c.material.opacity = 1 - e; c.material.transparent = true; });
        if (t < 1) requestAnimationFrame(step);
        else { mesh.visible = false; }
      };
      step();
    }

    shake(idx) {
      if (!this.pieceMeshes) return;
      const mesh = this.pieceMeshes[idx];
      const ox = mesh.position.x, oy = mesh.position.y, oz = mesh.position.z;
      const t0 = performance.now();
      const dur = 350;
      const step = () => {
        const t = (performance.now() - t0) / dur;
        if (t >= 1) { mesh.position.set(ox, oy, oz); return; }
        const amp = (1 - t) * 0.12;
        mesh.position.x = ox + Math.sin(t * 30) * amp;
        requestAnimationFrame(step);
      };
      step();
    }

    showHint() {
      if (this.solved || !this.pieceMeshes) return;
      for (let i = 0; i < this.defs.length; i++) {
        if (!this.removed.has(i) && this.isRemovable(i)) {
          const mesh = this.pieceMeshes[i];
          const orig = mesh.material.emissiveIntensity;
          mesh.material.emissiveIntensity = 1.2;
          setTimeout(() => { mesh.material.emissiveIntensity = orig; }, 1500);
          this.flashHint(`提示：${this.defs[i].name}可以滑出`, true);
          return;
        }
      }
    }

    flashHint(text, ok) {
      this.hintEl.textContent = text;
      this.hintEl.style.color = ok ? "var(--ok)" : "#f3b0a2";
      this.hintEl.classList.remove("flash");
      void this.hintEl.offsetWidth;
      this.hintEl.classList.add("flash");
    }

    /* WebGL 不可用时的降级：展示文字版拆解，保证流程不卡死 */
    fallback(msg) {
      this.webglFailed = true;
      const wrap = this.container.querySelector(".lb-wrap");
      if (!wrap) return;
      const canvasWrap = this.container.querySelector(".lb-canvas-wrap");
      if (canvasWrap) {
        canvasWrap.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:var(--dim);font-size:14px;text-align:center;padding:20px">
          <div><p style="margin-bottom:12px">${msg}</p>
          <p style="font-size:13px;line-height:2">六柱互锁，拆解顺序：<br>天柱 → 地柱/玄柱 → 黄柱/宇柱 → 宙柱</p></div></div>`;
      }
      // 添加跳过按钮
      const skipBtn = document.createElement("button");
      skipBtn.className = "btn primary";
      skipBtn.textContent = "机关已解 · 继续 →";
      skipBtn.style.cssText = "margin-top:14px";
      skipBtn.onclick = () => { if (!this.solved) { this.solved = true; this.onSolve(); } };
      const ctrls = this.container.querySelector(".lb-ctrls");
      if (ctrls) ctrls.appendChild(skipBtn);
    }

    reset() {
      this.removed.clear();
      this.solved = false;
      this.wrongCount = 0;
      if (this.countEl) this.countEl.textContent = "0";
      if (this.hintEl) { this.hintEl.textContent = "拖动旋转 · 点击柱子尝试���解"; this.hintEl.style.color = ""; }
      const banner = this.container.querySelector(".lb-solved");
      if (banner) banner.remove();
      if (!this.pieceMeshes) return;
      // 重建柱子
      this.pieceMeshes.forEach((mesh, i) => {
        const def = this.defs[i];
        mesh.position.set(def.pos[0], def.pos[1], def.pos[2]);
        mesh.visible = true;
        mesh.material.opacity = 1;
        mesh.material.transparent = false;
        mesh.children.forEach(c => { c.material.opacity = 1; c.material.transparent = false; });
      });
      this.autoRotate = true;
    }

    _animate() {
      if (window.__activeViewer !== this) return;
      requestAnimationFrame(() => this._animate());
      if (!this.dragging) {
        if (this.autoRotate) this.group.rotation.y += 0.005;
        else { this.group.rotation.y += this.velX; this.velX *= 0.95; }
      }
      this.renderer.render(this.scene, this.camera);
    }

    _resize() {
      const c = this.canvas;
      const w = c.clientWidth, h = c.clientHeight;
      if (w === 0 || h === 0) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  window.MiniGames = { HuarongDao, LubanLock };
})();
