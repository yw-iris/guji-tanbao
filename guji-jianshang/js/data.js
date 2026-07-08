/* ============================================================
 *  鉴藏司 · 青铜秘案 —— 数据层
 *  ------------------------------------------------------------
 *  ARTIFACTS : 结构化"文物卡片"知识库。
 *              每张卡片是 AI 生成谜题时的【事实边界】与【标准答案来源】，
 *              带 sources 出处字段，玩家在游戏里可见 —— 这就是准确性护城河。
 *  LEVELS    : 关卡（谜题）。当前为"预生成 + 人工审校"版本，
 *              generated_by 字段标注它未来将由 AI 生成管线产出。
 *              真实生成代码见 /ai-pipeline/generate-levels.js
 * ============================================================ */

/* ---------- 一、文物卡片知识库 ---------- */
const ARTIFACTS = {
  houmuwu_ding: {
    id: "houmuwu_ding",
    name: "后母戊鼎",
    alias: "旧称司母戊鼎",
    shape: "fangding",
    era: "商代晚期",
    era_key: "shang",
    type: "方鼎（祭祀礼器）",
    patterns: ["饕餮纹", "夔龙纹"],
    weight: "832.84 千克",
    excavated: "1939 年 · 河南安阳武官村",
    museum: "中国国家博物馆",
    facts: [
      "现存最大、最重的商代青铜礼器",
      "腹内壁铸铭文「后母戊」，是商王为祭祀母亲「戊」所铸",
      "鼎耳外廓饰双虎噬人首纹"
    ],
    sources: ["中国国家博物馆藏品档案", "《殷周金文集成》"]
  },
  siyang_zun: {
    id: "siyang_zun",
    name: "四羊方尊",
    shape: "fangzun",
    era: "商代晚期",
    era_key: "shang",
    type: "方尊（盛酒礼器）",
    patterns: ["羊角", "云雷纹", "夔龙纹"],
    weight: "约 34.5 千克",
    excavated: "1938 年 · 湖南宁乡月山铺",
    museum: "中国国家博物馆",
    facts: [
      "器身四角各铸一只卷角羊头，为现存商代青铜方尊中最大者",
      "采用分铸法：先铸羊头与龙头，再与器身合铸",
      "出土于长江以南，印证商文化对南方的影响"
    ],
    sources: ["中国国家博物馆藏品档案", "湖南省博物馆考古报告"]
  },
  fuhao_owl: {
    id: "fuhao_owl",
    name: "妇好鸮尊",
    shape: "owl",
    era: "商代晚期",
    era_key: "shang",
    type: "鸮形尊（盛酒礼器）",
    patterns: ["羽翎纹", "蝉纹", "夔龙纹"],
    weight: "约 16 千克",
    excavated: "1976 年 · 河南安阳殷墟妇好墓",
    museum: "河南博物院 / 中国国家博物馆（各藏一件）",
    facts: [
      "「鸮」即猫头鹰，商人视其为通神、勇武的神鸟",
      "妇好是商王武丁的王后，也是中国有据可考最早的女性军事统帅",
      "器口内壁铸有「妇好」二字铭文"
    ],
    sources: ["殷墟妇好墓发掘报告（1980）", "中国社会科学院考古研究所"]
  },
  he_zun: {
    id: "he_zun",
    name: "何尊",
    shape: "zun",
    era: "西周早期（成王时）",
    era_key: "xizhou_early",
    type: "尊（盛酒礼器）",
    patterns: ["饕餮纹", "蕉叶纹"],
    weight: "约 14.6 千克",
    excavated: "1963 年 · 陕西宝鸡贾村",
    museum: "宝鸡青铜器博物院",
    facts: [
      "内底铸铭文 122 字，出现「宅兹中国」——「中国」二字迄今最早的文字记录",
      "此处「中国」意为「天下中心 / 国之中央（洛邑一带）」，非今日国名之义",
      "记载周成王营建东都成周（洛邑）之事"
    ],
    sources: ["宝鸡青铜器博物院", "《集成》6014 何尊铭文"]
  },
  li_gui: {
    id: "li_gui",
    name: "利簋",
    alias: "又称武王征商簋",
    shape: "gui",
    era: "西周早期（武王时）",
    era_key: "xizhou_early",
    type: "簋（盛黍稷食器）",
    patterns: ["饕餮纹", "云雷纹"],
    weight: "约 7.95 千克",
    excavated: "1976 年 · 陕西临潼零口",
    museum: "中国国家博物馆",
    facts: [
      "铭文记「武王征商，唯甲子朝」——为「牧野之战」提供了确切日期",
      "是目前所知最早的西周青铜器之一",
      "作器者为随武王伐纣的官员「利」，战后受赏铜料而铸此簋"
    ],
    sources: ["中国国家博物馆藏品档案", "夏商周断代工程报告"]
  },
  dayu_ding: {
    id: "dayu_ding",
    name: "大盂鼎",
    shape: "yuanding",
    era: "西周早期（康王时）",
    era_key: "xizhou_early",
    type: "圆鼎（祭祀礼器）",
    patterns: ["饕餮纹"],
    weight: "约 153.5 千克",
    excavated: "清道光初年 · 陕西眉县礼村",
    museum: "中国国家博物馆",
    facts: [
      "内壁铸铭文 291 字，记周康王告诫贵族盂勿贪酒、勤勉理政",
      "与大克鼎、毛公鼎并称「海内三宝」",
      "铭文中有「殷边侯甸」等语，反映周初分封与殷鉴之训"
    ],
    sources: ["中国国家博物馆藏品档案", "《集成》2837"]
  },
  maogong_ding: {
    id: "maogong_ding",
    name: "毛公鼎",
    shape: "yuanding",
    era: "西周晚期（宣王时）",
    era_key: "xizhou_late",
    type: "圆鼎（祭祀礼器）",
    patterns: ["重环纹", "瓦纹"],
    weight: "约 34.7 千克",
    excavated: "清道光年间 · 陕西岐山",
    museum: "台北故宫博物院",
    facts: [
      "内壁铭文 497 字（一说 499 字），是现存青铜器中铭文最长者",
      "铭文为周宣王诰命叔父毛公辅政之辞，文辞近于《尚书》",
      "器形已趋简朴，纹饰退为环带纹，反映西周晚期礼器风格转变"
    ],
    sources: ["台北故宫博物院", "《集成》2841"]
  },
  lianhe_hu: {
    id: "lianhe_hu",
    name: "莲鹤方壶",
    shape: "fanghu",
    era: "春秋中期",
    era_key: "chunqiu",
    type: "方壶（盛酒礼器）",
    patterns: ["蟠螭纹", "莲瓣", "立鹤"],
    weight: "约 64 千克（一对）",
    excavated: "1923 年 · 河南新郑李家楼郑公大墓",
    museum: "河南博物院 / 北京故宫博物院（各藏一件）",
    facts: [
      "壶顶双层莲瓣中央立一振翅仙鹤，姿态灵动，一改商周凝重之风",
      "被誉为「时代精神之象征」，标志春秋青铜艺术走向清新写实",
      "器身满饰镂空蟠螭，采用了分铸焊接工艺"
    ],
    sources: ["河南博物院", "郭沫若《新郑古器之一二考核》"]
  },
  zenghouyi_zunpan: {
    id: "zenghouyi_zunpan",
    name: "曾侯乙尊盘",
    shape: "zunpan",
    era: "战国早期",
    era_key: "zhanguo",
    type: "尊 + 盘（酒器组合）",
    patterns: ["镂空蟠虺纹"],
    weight: "尊约 9 千克 / 盘约 19.2 千克",
    excavated: "1978 年 · 湖北随州曾侯乙墓",
    museum: "湖北省博物馆",
    facts: [
      "口沿镂空附饰以「失蜡法（熔模铸造）」铸成，玲珑剔透、层叠繁复",
      "是迄今所见失蜡法工艺最精湛的先秦青铜器，代表当时最高铸造水平",
      "与曾侯乙编钟同出一墓，同属曾国国君乙的随葬礼器"
    ],
    sources: ["湖北省博物馆", "《曾侯乙墓》发掘报告（1989）"]
  },
  goujian_sword: {
    id: "goujian_sword",
    name: "越王勾践剑",
    shape: "sword",
    era: "春秋晚期",
    era_key: "chunqiu",
    type: "青铜剑（兵器）",
    patterns: ["菱形暗格纹", "蓝色琉璃 / 绿松石镶嵌"],
    weight: "约 0.875 千克",
    excavated: "1965 年 · 湖北江陵望山一号墓",
    museum: "湖北省博物馆",
    facts: [
      "剑身近格处鸟篆铭文「越王鸠浅自作用剑」，「鸠浅」即「勾践」（通假）",
      "出土时寒光凛冽、刃薄锋利，历两千余年几乎不锈",
      "剑身菱形暗格花纹系表面合金化处理所致，工艺至今仍在研究"
    ],
    sources: ["湖北省博物馆", "《望山沙冢楚墓》发掘报告"]
  }
};

/* ---------- 二、断代坐标轴（供"断代"玩法用） ---------- */
const ERAS = [
  { key: "shang",        label: "商代晚期",        span: "约公元前 1300–前 1046 年" },
  { key: "xizhou_early", label: "西周早期",        span: "约公元前 1046–前 950 年" },
  { key: "xizhou_late",  label: "西周晚期",        span: "约公元前 950–前 771 年" },
  { key: "chunqiu",      label: "春秋",            span: "约公元前 770–前 476 年" },
  { key: "zhanguo",      label: "战国",            span: "约公元前 475–前 221 年" }
];

/* ---------- 三、关卡（AI 生成管线的产物；此处为已审校版本） ---------- */
const LEVELS = [
  {
    id: "L1",
    artifact: "houmuwu_ding",
    type: "dating",            // 断代
    title: "第一案 · 巨鼎问年",
    generated_by: "预生成 · 已人工审校",
    dialogue: "老鉴师推来一尊沉重的方鼎：「新来的，先看这件。它腹内有『后母戊』三字，是商王为亡母所铸。器大逾八百斤，纹作饕餮。——你说，它是何时之物？」",
    question: "综合器型、纹饰与铭文，此鼎应断为哪个时代？",
    options: [
      { text: "商代晚期", correct: true },
      { text: "西周早期", correct: false },
      { text: "春秋", correct: false },
      { text: "战国", correct: false }
    ],
    explanation: "「后母戊」为商王祭母之器，巨大厚重、饕餮纹狞厉威严，正是商代晚期青铜礼器的典型气象。西周以后礼器渐趋简朴，纹饰也转向环带、窃曲之类。",
    reward: "结识线索：商人重祭祀，青铜多为「藏礼于器」。"
  },
  {
    id: "L2",
    artifact: "he_zun",
    type: "riddle",            // 解谜
    title: "第二案 · 宅兹中国",
    generated_by: "预生成 · 已人工审校",
    dialogue: "一尊西周酒器摆上案头，内底铭文一百二十二字。老鉴师指着其中两字：「此二字，你可识得？它可是了不得的东西。」你辨认出——「中國」。",
    question: "何尊铭文「宅兹中国」中的「中国」，在当时最贴切的含义是？",
    options: [
      { text: "天下的中心 / 国之中央（指洛邑一带）", correct: true },
      { text: "今日「中华人民共和国」的简称", correct: false },
      { text: "一个诸侯国的名字", correct: false },
      { text: "中原地区所有城邑的统称", correct: false }
    ],
    explanation: "何尊是「中国」二字最早的文字记录，但此处指「天下之中、国之中央」，即周王营建的东都成周（洛邑）。它记录的是一种「居天下之中以统四方」的政治观念，与现代国名含义不同。",
    reward: "结识线索：读铭文要回到造字时的语境，切忌以今度古。"
  },
  {
    id: "L3",
    artifact: "siyang_zun",
    type: "forgery",           // 辨伪
    title: "第三案 · 四羊辨踪",
    generated_by: "预生成 · 已人工审校",
    dialogue: "有商人持一份「四羊方尊」的鉴定文书求售，洋洋四条，看似头头是道。老鉴师斜眼一笑：「其中一条是假话。鉴藏师的本事，就在于揪出那一条。」",
    question: "以下四条描述中，哪一条与史实相悖（即「作伪」之处）？",
    options: [
      { text: "它出土于陕西宝鸡的周原遗址，是西周王室重器", correct: true },
      { text: "器身四角各铸一只卷角羊头", correct: false },
      { text: "属商代晚期，是现存最大的商代青铜方尊", correct: false },
      { text: "现藏于中国国家博物馆", correct: false }
    ],
    explanation: "四羊方尊 1938 年出土于【湖南宁乡】，是【商代】晚期器物，而非陕西周原的西周器。这条把年代和出土地都改错了——它恰恰印证了商文化对长江以南的影响，是「以假乱真」中最需警惕的一类破绽。",
    reward: "结识线索：辨伪先核「时、地、形」三要素，一处对不上便是疑点。"
  },
  {
    id: "L4",
    artifact: "li_gui",
    type: "riddle",
    title: "第四案 · 甲子之朝",
    generated_by: "预生成 · 已人工审校",
    dialogue: "一件其貌不扬的簋，铭文却让老鉴师肃然：「『武王征商，唯甲子朝』——短短数字，抵得上半部史书。你可知它记的是哪一战？」",
    question: "利簋铭文中「武王征商，唯甲子朝」，记录的是下列哪一历史事件？",
    options: [
      { text: "牧野之战：武王伐纣、商亡周兴", correct: true },
      { text: "涿鹿之战：黄帝战蚩尤", correct: false },
      { text: "长平之战：秦赵决战", correct: false },
      { text: "巨鹿之战：项羽破秦", correct: false }
    ],
    explanation: "利簋是同时代的「实物证词」，铭文明确牧野之战发生在某个「甲子日清晨」，为夏商周断代工程推定武王克商之年（约公元前 1046 年）提供了关键坐标。器物有时比传世文献更硬。",
    reward: "结识线索：一件带纪时铭文的青铜器，可能改写一段年表。"
  },
  {
    id: "L5",
    artifact: "fuhao_owl",
    type: "riddle",
    title: "第五案 · 鸮尊主人",
    generated_by: "预生成 · 已人工审校",
    dialogue: "一尊形似猫头鹰的酒器立在灯下，双目圆睁、气势不凡。器口内铸「妇好」二字。老鉴师问：「这位『妇好』，你以为是何等人物？」",
    question: "殷墟妇好墓的墓主「妇好」，其最广为人知的身份是？",
    options: [
      { text: "商王武丁的王后，且是有据可考最早的女性军事统帅", correct: true },
      { text: "一位以卜辞占卜为业的女巫", correct: false },
      { text: "西周开国功臣的夫人", correct: false },
      { text: "传说中的神话人物，并非真实存在", correct: false }
    ],
    explanation: "甲骨卜辞与妇好墓出土器物相互印证：妇好是武丁之妻，曾多次领兵出征、主持祭祀，是信史所见最早的女将。鸮（猫头鹰）在商人心中通神勇武，以鸮为尊，正配其身份。",
    reward: "结识线索：文物与甲骨文「二重证据」互证，可让传说落地为信史。"
  },
  {
    id: "L6",
    artifact: "maogong_ding",
    type: "forgery",
    title: "第六案 · 铭文之最",
    generated_by: "预生成 · 已人工审校",
    dialogue: "又是一份鉴定文书，说的是「铭文最长」的毛公鼎。老鉴师捻须：「这份写得漂亮，可惜藏着一处硬伤。找出来。」",
    question: "以下关于毛公鼎的四条描述，哪一条是错误的？",
    options: [
      { text: "它现藏于北京故宫博物院", correct: true },
      { text: "内壁铭文近五百字，是现存青铜器铭文最长者", correct: false },
      { text: "属西周晚期，铭文为周王诰命毛公辅政之辞", correct: false },
      { text: "清道光年间出土于陕西岐山", correct: false }
    ],
    explanation: "毛公鼎现藏【台北故宫博物院】，而非北京故宫——这是最易被张冠李戴的一处。其余三条（铭文约 497 字、西周晚期、陕西岐山出土）均属实。鉴藏尤须核对「今藏何处」，流传有序是真伪的重要旁证。",
    reward: "结识线索：核验「递藏与现藏」是辨伪的最后一道关。"
  },
  {
    id: "L7",
    artifact: "lianhe_hu",
    type: "dating",
    title: "第七案 · 莲鹤问风",
    generated_by: "预生成 · 已人工审校",
    dialogue: "一件方壶顶上，莲瓣簇拥间立着一只振翅欲飞的仙鹤，轻盈灵动，全无商周礼器的森严。老鉴师意味深长：「风气变了。你说，这是何时的新气象？」",
    question: "莲鹤方壶那种「清新写实、生动灵巧」的风格，标志青铜艺术进入哪个时代？",
    options: [
      { text: "春秋", correct: true },
      { text: "商代晚期", correct: false },
      { text: "西周早期", correct: false },
      { text: "秦代", correct: false }
    ],
    explanation: "商与西周礼器凝重威严、以饕餮示威。至春秋，王纲解纽、思想活跃，青铜艺术随之转向清新写实——莲瓣舒展、仙鹤欲飞，被誉为「时代精神之象征」。断代不仅看器型，更要读出背后的时代气质。",
    reward: "结识线索：风格是有年代的——凝重属商周，灵动多春秋。"
  },
  {
    id: "L8",
    artifact: "zenghouyi_zunpan",
    type: "dating",
    title: "第八案 · 玲珑失蜡",
    generated_by: "预生成 · 已人工审校",
    dialogue: "一套尊盘端上来，口沿的镂空附饰繁密如云、层层相叠，竟看不出范线拼缝。老鉴师肃然：「能铸出这般玲珑之物的工艺，非同小可。你可断得出它的年代？」",
    question: "曾侯乙尊盘那种以「失蜡法（熔模铸造）」造就的镂空繁饰，代表哪个时代的最高铸造水平？",
    options: [
      { text: "战国早期", correct: true },
      { text: "商代", correct: false },
      { text: "西周", correct: false },
      { text: "东汉", correct: false }
    ],
    explanation: "曾侯乙尊盘出自战国早期曾侯乙墓，其镂空附饰以失蜡法铸成，玲珑剔透、繁复至极，代表先秦青铜铸造的巅峰。工艺水平本身就是一把断代的尺子：能做到这般精微，非早期所能及。",
    reward: "结识线索：工艺的复杂度，往往随时代递进——这也是断代的暗线。"
  },
  {
    id: "L9",
    artifact: "goujian_sword",
    type: "riddle",
    title: "结案 · 越王之剑",
    generated_by: "预生成 · 已人工审校",
    dialogue: "最后一件，是一柄寒光逼人的青铜剑，历两千年而不锈。近格处有八字鸟篆铭文。老鉴师递上：「认出剑主，你便可出师了。铭文写着——『越王鸠浅自作用剑』。」",
    question: "剑铭「越王鸠浅自作用剑」中的「鸠浅」，指的是哪位越王？",
    options: [
      { text: "勾践（「鸠浅」为「勾践」的通假写法）", correct: true },
      { text: "夫差", correct: false },
      { text: "阖闾", correct: false },
      { text: "允常", correct: false }
    ],
    explanation: "古文字多通假，「鸠浅」即「勾践」——正是「卧薪尝胆」的越王。铭文的鸟篆华美，剑身菱形暗格历久不锈，是春秋晚期吴越铸剑绝技的见证。识铭断主，须通音韵、明通假，方不致失之交臂。",
    reward: "出师！你已能辨形、读铭、断代、识伪——鉴藏之门，就此为你敞开。"
  }
];

/* 导出到全局（无构建工具，直接挂 window） */
window.GAME_DATA = { ARTIFACTS, ERAS, LEVELS };
