/* ============================================================
 *  三维宝物模型库（Three.js 程序化几何，无外部模型文件）
 *  ------------------------------------------------------------
 *  每个构造函数返回一个 THREE.Group；TreasureViewer 负责挂载、打光、
 *  自转与"拖动多视角旋转"。THREE 由 index.html 的 CDN 提供为全局。
 * ============================================================ */

const MODEL_BUILDERS = {
  /* 银鞘：楠木鞘 + 露头银锭 */
  ingot(THREE) {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4b2a, roughness: 0.85, metalness: 0.05 });
    const silver = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, roughness: 0.35, metalness: 0.9 });
    const sheath = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 1.0), wood);
    g.add(sheath);
    // 银锭露头（马蹄形）
    const ingot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.7, 24), silver);
    ingot.rotation.z = Math.PI / 2; ingot.position.x = 1.45;
    g.add(ingot);
    // 铭文槽
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a2a15 }));
    band.position.x = 0.2; g.add(band);
    return g;
  },

  /* 玉圭：扁平尖首长条 + 谷纹（用小球阵近似） */
  gui(THREE) {
    const g = new THREE.Group();
    const jade = new THREE.MeshStandardMaterial({ color: 0x7fae8f, roughness: 0.25, metalness: 0.1, emissive: 0x143020, emissiveIntensity: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.16), jade);
    g.add(body);
    // 尖首
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.64, 0.7, 4), jade);
    tip.rotation.y = Math.PI / 4; tip.position.y = 1.55; g.add(tip);
    // 谷纹
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), jade);
      dot.position.set(-0.3 + c * 0.3, -1 + r * 0.35, 0.09); g.add(dot);
    }
    // 穿孔
    const hole = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), jade);
    hole.position.y = -1.05; g.add(hole);
    return g;
  },

  /* 梅瓶：小口丰肩瘦底 + 青花带 */
  vase(THREE) {
    const g = new THREE.Group();
    const porcelain = new THREE.MeshStandardMaterial({ color: 0xf0f2ee, roughness: 0.15, metalness: 0.05 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x2a4a9a, roughness: 0.3 });
    // 用 LatheGeometry 车出梅瓶轮廓
    const pts = [];
    const profile = [
      [0.18, -1.6],[0.55, -1.5],[0.7, -1.0],[0.82, -0.2],[0.86, 0.4],
      [0.7, 0.9],[0.42, 1.25],[0.24, 1.45],[0.26, 1.6],[0.22, 1.66]
    ];
    profile.forEach(p => pts.push(new THREE.Vector2(p[0], p[1])));
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), porcelain);
    g.add(body);
    // 青花缠枝带（两道环）
    [0.55, -0.1].forEach(y => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.06, 10, 40), blue);
      ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
    });
    return g;
  },

  /* 金印：方台 + 龟钮 */
  seal(THREE) {
    const g = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xe6b53c, roughness: 0.3, metalness: 1.0, emissive: 0x3a2600, emissiveIntensity: 0.2 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.6), gold);
    g.add(base);
    // 龟身
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2), gold);
    shell.position.y = 0.35; shell.scale.set(1, 0.8, 1.3); g.add(shell);
    // 龟头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), gold);
    head.position.set(0, 0.42, 0.75); g.add(head);
    // 四足
    [[-0.35,0.55],[0.35,0.55],[-0.35,-0.35],[0.35,-0.35]].forEach(([x,z])=>{
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.28,8), gold);
      leg.position.set(x,0.28,z); g.add(leg);
    });
    // 印面篆格
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.02,1.4), new THREE.MeshStandardMaterial({color:0xb8901f,metalness:1,roughness:0.5}));
    face.position.y = -0.36; g.add(face);
    return g;
  },

  /* 玉山子：层叠山峰 */
  mountain(THREE) {
    const g = new THREE.Group();
    const jade = new THREE.MeshStandardMaterial({ color: 0x9fc0ad, roughness: 0.3, metalness: 0.1, emissive: 0x16281c, emissiveIntensity: 0.2, flatShading: true });
    const peaks = [[0,0,0,1.6,1],[-0.7,0,-0.4,1.0,1],[0.8,0,0.2,1.2,1],[0.2,0,-0.7,0.8,1]];
    peaks.forEach(([x,y,z,h,r])=>{
      const peak = new THREE.Mesh(new THREE.ConeGeometry(0.7*r, h, 6), jade);
      peak.position.set(x, h/2 - 0.6, z);
      peak.rotation.y = Math.random ? 0 : 0; g.add(peak);
    });
    // 底座
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9,2.1,0.4,8), new THREE.MeshStandardMaterial({color:0x5a3d22,roughness:0.9}));
    base.position.y = -0.8; g.add(base);
    // 山腹龛（凹）
    const niche = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.4,0.2), new THREE.MeshStandardMaterial({color:0x2a3a2e}));
    niche.position.set(0,0,0.75); g.add(niche);
    return g;
  },

  /* 鼎：方/圆鼎 + 双耳 + 四足 */
  ding(THREE) {
    const g = new THREE.Group();
    const bronze = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 0.6, metalness: 0.7, emissive: 0x0a1508, emissiveIntensity: 0.2 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a3a22, roughness: 0.8, metalness: 0.5 });
    // 腹部（截头圆锥）
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.85, 1.6, 32), bronze);
    body.position.y = 0.4; g.add(body);
    // 口沿
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.1, 0.18, 32), dark);
    rim.position.y = 1.29; g.add(rim);
    // 双耳
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 8, 18, Math.PI), bronze);
      ear.rotation.z = side * Math.PI / 2;
      ear.position.set(side * 1.15, 1.35, 0); g.add(ear);
    });
    // 四足（柱状）
    [[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]].forEach(([x,z])=>{
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.12,1.1,10), bronze);
      leg.position.set(x,-0.75,z); g.add(leg);
    });
    // 饕餮纹（用浮雕方块近似）
    for(let a=0;a<4;a++){
      const angle = (a/4)*Math.PI*2;
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.8,0.5), dark);
      band.position.set(Math.sin(angle)*1.12, 0.4, Math.cos(angle)*1.12);
      band.rotation.y = -angle; g.add(band);
    }
    return g;
  },

  /* 画卷：展开的卷轴 */
  scroll(THREE) {
    const g = new THREE.Group();
    const silk = new THREE.MeshStandardMaterial({ color: 0xe8d5a0, roughness: 0.85, metalness: 0.0 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9, metalness: 0.05 });
    const ink  = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 });
    // 画面展开绢面
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), silk);
    canvas.rotation.x = -0.15; g.add(canvas);
    // 左右轴杆
    [-1.65, 1.65].forEach(x => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,2.0,16), wood);
      rod.rotation.z = Math.PI/2; rod.position.set(x, 0, 0.05); g.add(rod);
      // 轴头
      [-1,1].forEach(s=>{
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.12,16), wood);
        cap.rotation.z=Math.PI/2; cap.position.set(x, s*1.06, 0.05); g.add(cap);
      });
    });
    // 墨线（近似画中线条）
    for(let i=0;i<6;i++){
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.01), ink);
      line.position.set(-1.2+i*0.44, 0, 0.01); g.add(line);
    }
    return g;
  },

  /* 凤冠：圆形冠体 + 珠串 + 凤凰装饰 */
  crown(THREE) {
    const g = new THREE.Group();
    const gold  = new THREE.MeshStandardMaterial({ color: 0xe8b84a, roughness: 0.3, metalness: 0.95, emissive: 0x3a2500, emissiveIntensity: 0.15 });
    const jade  = new THREE.MeshStandardMaterial({ color: 0x2a9a5a, roughness: 0.2, metalness: 0.1 });
    const ruby  = new THREE.MeshStandardMaterial({ color: 0xc02020, roughness: 0.1, metalness: 0.2 });
    const pearl = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.15, metalness: 0.35 });
    // 冠体骨架
    const base = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 18, 0, Math.PI*2, Math.PI*0.3, Math.PI*0.55), gold);
    base.position.y = -0.1; g.add(base);
    // 顶部凤凰（简化为锥+翼）
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.2,0.7,12), gold);
    body.position.y = 0.9; g.add(body);
    [-1,1].forEach(s=>{
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.08,0.3), gold);
      wing.position.set(s*0.45,0.95,0); wing.rotation.z=s*0.35; g.add(wing);
    });
    // 宝石点缀
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2, r=0.92;
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.07,8,8), i%2===0?ruby:jade);
      gem.position.set(Math.sin(a)*r, 0.18+Math.cos(a*2)*0.12, Math.cos(a)*r); g.add(gem);
    }
    // 珍珠串（下垂流苏）
    for(let col=0;col<5;col++){
      const ax = -0.8+col*0.4;
      for(let row=0;row<4;row++){
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.055,8,8), pearl);
        p.position.set(ax, -0.55-row*0.22, 0.75); g.add(p);
      }
    }
    return g;
  },

  /* 碗/盏：浅腹圈足 */
  bowl(THREE) {
    const g = new THREE.Group();
    const celadon = new THREE.MeshStandardMaterial({ color: 0xadd8c8, roughness: 0.12, metalness: 0.08, emissive: 0x0a1c14, emissiveIntensity: 0.18 });
    const foot  = new THREE.MeshStandardMaterial({ color: 0xc8c0a8, roughness: 0.35, metalness: 0.05 });
    // 碗形旋转体
    const pts = [];
    [[0.08,-0.65],[0.55,-0.6],[0.88,-0.35],[1.02,0.0],[1.05,0.35],[0.98,0.58],[0.82,0.68]].forEach(p=>
      pts.push(new THREE.Vector2(p[0],p[1]))
    );
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), celadon);
    g.add(body);
    // 圈足
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.3,0.18,24), foot);
    ring.position.y = -0.72; g.add(ring);
    return g;
  },

  /* 尊盘：尊立于盘中，口沿镂空附饰（失蜡法） */
  zunpan(THREE) {
    const g = new THREE.Group();
    const bronze = new THREE.MeshStandardMaterial({ color: 0x6a7a4a, roughness: 0.55, metalness: 0.75, emissive: 0x0a1508, emissiveIntensity: 0.18 });
    const dark   = new THREE.MeshStandardMaterial({ color: 0x2a3a22, roughness: 0.8, metalness: 0.5 });
    const gold   = new THREE.MeshStandardMaterial({ color: 0xc9a961, roughness: 0.3, metalness: 0.9, emissive: 0x2a1800, emissiveIntensity: 0.15 });

    // 盘（浅腹大口）
    const panPts = [];
    [[0.3,-0.15],[1.0,-0.12],[1.3,0.0],[1.3,0.15],[1.1,0.22],[0.4,0.25]].forEach(p =>
      panPts.push(new THREE.Vector2(p[0], p[1]))
    );
    const pan = new THREE.Mesh(new THREE.LatheGeometry(panPts, 48), bronze);
    pan.position.y = -1.3;
    g.add(pan);

    // 盘内凸座（承尊）
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.5, 0.2, 24), dark);
    seat.position.y = -1.12; g.add(seat);

    // 尊体（束颈广肩）
    const zunPts = [];
    [[0.32,-0.9],[0.55,-0.7],[0.72,-0.3],[0.6,0.1],[0.4,0.4],[0.36,0.6],[0.55,0.75],[0.85,0.85]].forEach(p =>
      zunPts.push(new THREE.Vector2(p[0], p[1]))
    );
    const zun = new THREE.Mesh(new THREE.LatheGeometry(zunPts, 40), bronze);
    g.add(zun);

    // 尊口沿镂空附饰（用小环排列近似失蜡法蟠虺纹）
    const rimY = 0.85, rimR = 0.82;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 12), gold);
      torus.position.set(Math.cos(a) * rimR, rimY + 0.06, Math.sin(a) * rimR);
      torus.rotation.y = -a;
      g.add(torus);
    }
    // 第二层镂空（更密）
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + 0.07;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), gold);
      dot.position.set(Math.cos(a) * (rimR + 0.14), rimY + 0.12, Math.sin(a) * (rimR + 0.14));
      g.add(dot);
    }

    // 尊腹纹饰带
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.04, 8, 36), dark);
    band.rotation.x = Math.PI / 2; band.position.y = -0.3; g.add(band);
    const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 8, 36), dark);
    band2.rotation.x = Math.PI / 2; band2.position.y = 0.1; g.add(band2);

    // 盘沿镂空
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), gold);
      dot.position.set(Math.cos(a) * 1.28, -1.08, Math.sin(a) * 1.28);
      g.add(dot);
    }

    return g;
  },

  /* ===== 武器模型 ===== */
  /* 武器外观随洗练品质动态变化：品质越高，材质越华贵、宝石越多、光效越强 */

  /* 錾金凿：凿体 + 刃 + 护手 */
  w_chisel(THREE, opts) {
    const g = new THREE.Group();
    const q = Math.max(opts?.qualityLevel ?? 0, opts?.appearanceIdx ?? 0);
    const main = wMat(THREE, 0xb8860b, q);
    const dark = wMat(THREE, 0x2a1800, Math.max(0, q - 1));
    // 凿杆
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,3.2,16), main);
    g.add(rod);
    // 凿刃（楔形）——高品质刃更亮
    const bladeMat = new THREE.MeshStandardMaterial({
      color: q >= 3 ? 0xfff4d0 : 0xd4af37, roughness: Math.max(0.05, 0.2 - q * 0.03),
      metalness: 1.0, emissive: q >= 4 ? 0xe0a83e : 0x000000, emissiveIntensity: q >= 4 ? 0.4 : 0
    });
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.18,0.55,4), bladeMat);
    blade.position.y = -1.87; g.add(blade);
    // 护手
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.12,24), main);
    guard.position.y = 0.85; g.add(guard);
    // 护手宝石（品质越高越多）
    const gemPos = [];
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      gemPos.push([Math.sin(a) * 0.25, 0.85, Math.cos(a) * 0.25]);
    }
    wGems(THREE, g, gemPos, q);
    // 凿尾帽
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16,12,12), dark);
    cap.position.y = 1.65; g.add(cap);
    // 高品质加尾饰
    if (q >= 3) {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 8), main);
      tail.position.y = 1.85; g.add(tail);
    }
    wAura(THREE, g, q);
    return g;
  },

  /* 史笔·春秋：毛笔形，笔尖+笔肚+笔杆+笔帽 */
  w_brush(THREE, opts) {
    const g = new THREE.Group();
    const q = Math.max(opts?.qualityLevel ?? 0, opts?.appearanceIdx ?? 0);
    const ivory = wMat(THREE, 0xe8d5a0, q);
    const black = new THREE.MeshStandardMaterial({color:0x181008,roughness:0.8,metalness:0.0});
    const gold  = wMat(THREE, 0xe0a83e, q);
    // 笔杆
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,3.0,16), ivory);
    g.add(rod);
    // 笔肚（锥形）
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.22,0.6,16), black);
    belly.position.y = -1.62; g.add(belly);
    // 笔尖——高品质笔尖泛光
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x181008, roughness: 0.8, metalness: 0.0,
      emissive: q >= 4 ? 0xe0a83e : 0x000000, emissiveIntensity: q >= 4 ? 0.3 : 0
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08,0.55,12), tipMat);
    tip.position.y = -2.2; g.add(tip);
    // 金箍（三道）
    [-0.4,0.4,1.1].forEach(y=>{
      const band=new THREE.Mesh(new THREE.CylinderGeometry(0.115,0.115,0.07,20), gold);
      band.position.y=y; g.add(band);
    });
    // 金箍宝石
    const gemPos = [
      [0, -0.4, 0.12], [0, 0.4, 0.12], [0, 1.1, 0.12],
      [0, -0.4, -0.12], [0, 0.4, -0.12], [0, 1.1, -0.12]
    ];
    wGems(THREE, g, gemPos, q);
    // 笔帽（圆顶）
    const capBody=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.12,0.6,16), ivory);
    capBody.position.y=1.8; g.add(capBody);
    const capTop=new THREE.Mesh(new THREE.SphereGeometry(0.14,12,12,0,Math.PI*2,0,Math.PI/2), ivory);
    capTop.position.y=2.1; g.add(capTop);
    // 高品质笔顶嵌宝
    if (q >= 3) {
      const topGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.1, 0),
        new THREE.MeshStandardMaterial({color: 0xff4444, roughness: 0.1, metalness: 0.3, emissive: 0xff4444, emissiveIntensity: 0.6})
      );
      topGem.position.y = 2.3; g.add(topGem);
    }
    wAura(THREE, g, q);
    return g;
  },

  /* 山海杖：节竹杖形，杖首灵兽 + 多节杖身 + 金属底尖 */
  w_staff(THREE, opts) {
    const g = new THREE.Group();
    const q = Math.max(opts?.qualityLevel ?? 0, opts?.appearanceIdx ?? 0);
    const bamboo = wMat(THREE, 0x8a6a2a, q);
    const node   = wMat(THREE, 0x5a4010, q);
    const gold   = wMat(THREE, 0xe0a83e, q);
    const teal   = new THREE.MeshStandardMaterial({color: q >= 3 ? 0x1a6a8a : 0x2a8a7a, roughness: 0.2, metalness: 0.15 + q * 0.08,
      emissive: q >= 2 ? 0x2a8a7a : 0x000000, emissiveIntensity: q >= 2 ? 0.15 + q * 0.06 : 0});
    // 杖身（多节）
    const nodePositions = [-1.8,-0.9,0,0.9,1.8];
    let lastY = -2.2;
    const gemPos = [];
    nodePositions.forEach(ny=>{
      const seg=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,ny-lastY-0.1,12), bamboo);
      seg.position.y=(ny+lastY)/2+0.05; g.add(seg);
      const knot=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.12,16), node);
      knot.position.y=ny; g.add(knot);
      gemPos.push([0, ny, 0.15]);
      lastY=ny;
    });
    // 杖首（龙头）
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.25,14,14), teal);
    head.position.y=2.2; head.scale.set(1,1.3,0.9); g.add(head);
    const snout=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,10), teal);
    snout.position.set(0,2.18,0.28); g.add(snout);
    // 龙眼（高品质变宝石）
    [-1,1].forEach(s=>{
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.05 + q * 0.008,8,8), gold);
      eye.position.set(s*0.13,2.3,0.2); g.add(eye);
    });
    // 杖底尖
    const tip=new THREE.Mesh(new THREE.ConeGeometry(0.09,0.45,8), gold);
    tip.position.y=-2.42; tip.rotation.x=Math.PI; g.add(tip);
    // 节点宝石
    wGems(THREE, g, gemPos, q);
    // 高品质龙角
    if (q >= 3) {
      [-1, 1].forEach(s => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), gold);
        horn.position.set(s * 0.12, 2.5, 0.1);
        horn.rotation.z = s * 0.3;
        g.add(horn);
      });
    }
    wAura(THREE, g, q);
    return g;
  },

  /* 银针十三支：针盒展开 + 针阵 */
  w_needle(THREE, opts) {
    const g = new THREE.Group();
    const q = Math.max(opts?.qualityLevel ?? 0, opts?.appearanceIdx ?? 0);
    const silver = wMat(THREE, 0xd8d8dc, q);
    const redwood = new THREE.MeshStandardMaterial({color: 0x6a2010, roughness: 0.7, metalness: 0.0});
    const silk   = new THREE.MeshStandardMaterial({color: 0xc8102e, roughness: 0.9, metalness: 0.0});
    const handleGold = wMat(THREE, 0xe0a83e, q);
    // 针盒底座——高品质盒身镶金边
    const box=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.25,0.6), redwood);
    box.position.y=-1.5; g.add(box);
    if (q >= 2) {
      const goldEdge = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.04, 0.62), handleGold);
      goldEdge.position.y = -1.37; g.add(goldEdge);
    }
    const liner=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.08,0.44), silk);
    liner.position.y=-1.36; g.add(liner);
    // 13支针，扇形排列——高品质针更亮
    const gemPos = [];
    for(let i=0;i<13;i++){
      const frac=(i-6)/6;
      const x=frac*1.22;
      const angle=frac*0.22;
      const needle=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.012,2.6,8), silver);
      needle.position.set(x,0.0,0);
      needle.rotation.z=angle; g.add(needle);
      const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.35,10), handleGold);
      const hx = x + Math.sin(angle) * 1.17;
      const hy = Math.cos(angle) * 1.17;
      handle.position.set(hx, hy, 0);
      handle.rotation.z = angle; g.add(handle);
      if (i % 2 === 0) gemPos.push([hx, hy + 0.2, 0]);
    }
    wGems(THREE, g, gemPos, q);
    // 高品质盒端嵌宝
    if (q >= 3) {
      [-1.3, 1.3].forEach(x => {
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.08, 0),
          new THREE.MeshStandardMaterial({color: 0x9a6fd0, roughness: 0.1, metalness: 0.3, emissive: 0x9a6fd0, emissiveIntensity: 0.6})
        );
        gem.position.set(x, -1.3, 0);
        g.add(gem);
      });
    }
    wAura(THREE, g, q);
    return g;
  }
};

/* ---------- 武器品质外观工具函数 ---------- */
/* 品质层级参数：粗糙度、金属度、自发光强度、宝石色、宝石数、是否有光环 */
function wTier(q) {
  const tiers = [
    { rough: 0.65, metal: 0.45, ei: 0.0,  gemColor: 0x8593a3, gemCount: 0, aura: false },
    { rough: 0.45, metal: 0.65, ei: 0.10, gemColor: 0x5aa469, gemCount: 2, aura: false },
    { rough: 0.30, metal: 0.80, ei: 0.22, gemColor: 0x4a86c7, gemCount: 4, aura: false },
    { rough: 0.20, metal: 0.92, ei: 0.38, gemColor: 0x9a6fd0, gemCount: 6, aura: false },
    { rough: 0.10, metal: 1.00, ei: 0.60, gemColor: 0xff4444, gemCount: 8, aura: true  }
  ];
  return tiers[Math.min(4, Math.max(0, q | 0))];
}
/* 根据品质生成材质：高品质趋向金色、增强自发光 */
function wMat(THREE, baseColor, q) {
  const t = wTier(q);
  const color = q >= 4 ? 0xffd700 : q >= 3 ? 0xe0a83e : baseColor;
  const emColor = q >= 4 ? 0xe0a83e : q >= 1 ? baseColor : 0x000000;
  return new THREE.MeshStandardMaterial({
    color, roughness: t.rough, metalness: t.metal,
    emissive: emColor, emissiveIntensity: t.ei
  });
}
/* 按品质在指定位置嵌宝石 */
function wGems(THREE, group, positions, q) {
  const t = wTier(q);
  const count = Math.min(positions.length, t.gemCount);
  if (count === 0) return;
  const mat = new THREE.MeshStandardMaterial({
    color: t.gemColor, roughness: 0.1, metalness: 0.3,
    emissive: t.gemColor, emissiveIntensity: 0.5 + q * 0.05
  });
  const size = 0.05 + q * 0.012;
  for (let i = 0; i < count; i++) {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), mat);
    const p = positions[i];
    gem.position.set(p[0], p[1], p[2]);
    group.add(gem);
  }
}
/* 国宝级光环特效 */
function wAura(THREE, group, q) {
  if (q < 4) return;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.025, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.015, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.2 })
  );
  ring2.rotation.x = Math.PI / 2;
  ring2.rotation.z = 0.3;
  group.add(ring2);
}

/* ---------- 三维观赏器：挂载 + 拖动旋转 + 自转 ---------- */
class TreasureViewer {
  constructor(canvas) {
    const THREE = window.THREE;
    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0.5, 6);

    // 打光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.1); key.position.set(4, 6, 5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5); rim.position.set(-5, 2, -4); this.scene.add(rim);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 只保留最新一个 viewer 的渲染循环，旧的自动停止
    window.__activeViewer = this;

    this.autoRotate = true;
    this.dragging = false;
    this.lastX = 0; this.lastY = 0;
    this.velX = 0.004; this.velY = 0;
    this._bindDrag(canvas);
    this._animate();
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  load(modelKey, opts) {
    // 清空旧模型
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    const builder = MODEL_BUILDERS[modelKey] || MODEL_BUILDERS.ingot;
    const model = builder(this.THREE, opts);
    this.group.add(model);
    this.group.rotation.set(0, 0, 0);
  }

  _bindDrag(canvas) {
    const down = (x, y) => { this.dragging = true; this.lastX = x; this.lastY = y; this.autoRotate = false; };
    const move = (x, y) => {
      if (!this.dragging) return;
      const dx = (x - this.lastX) * 0.01, dy = (y - this.lastY) * 0.01;
      this.group.rotation.y += dx; this.group.rotation.x += dy;
      this.velX = dx; this.velY = dy;
      this.lastX = x; this.lastY = y;
    };
    const up = () => { this.dragging = false; };
    canvas.addEventListener("mousedown", e => down(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", up);
    canvas.addEventListener("touchstart", e => { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    canvas.addEventListener("touchmove", e => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    canvas.addEventListener("touchend", up);
  }

  _animate() {
    if (window.__activeViewer !== this) return; // 旧 viewer 停止循环
    requestAnimationFrame(() => this._animate());
    if (!this.dragging) {
      if (this.autoRotate) { this.group.rotation.y += 0.004; }
      else {
        // 惯性
        this.group.rotation.y += this.velX; this.group.rotation.x += this.velY;
        this.velX *= 0.95; this.velY *= 0.95;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  _resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth, h = c.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
}

window.TreasureViewer = TreasureViewer;
