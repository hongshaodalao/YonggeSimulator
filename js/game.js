"use strict";

/* ================= 常量 ================= */

const ASK_LIMIT = 5;
const SAVE_KEY = "yongge_sim_save_v1";

const VERDICTS = {
  guiling:   { label: "归零",   desc: "劝退：这门生意别干了" },
  nengkai:   { label: "能开",   desc: "条件够了，可以干" },
  huanyi:    { label: "缓一缓", desc: "别急着辞职砸钱，先小成本验证" },
  gaihuan:   { label: "换一换", desc: "换铺子或换品类，调整后再战" },
  suoxiao:   { label: "缩规模", desc: "砍一半，从档口小店试起" },
  chaichuan: { label: "拆穿",   desc: "这连线有诈——当众揭穿（慎用）" },
};

const BUST_WRONG_REVEAL = "事后证实，人家是真心实意来讨教的老实人，被你当众钉在『骗子』的耻辱柱上。剪辑视频传遍了同行群，标题叫《知名博主当众冤枉创业者》。直播间掉了一波粉，弹幕骂你『流量判官』——这单，是你自己砸的场子。";

const ACHIEVEMENTS = [
  { id: "first_zero", name: "首杀归零",   desc: "首次判对『归零』" },
  { id: "first_open", name: "独具慧眼",   desc: "首次判对『能开』" },
  { id: "first_bust", name: "火眼金睛",   desc: "首次拆穿伪装者" },
  { id: "three_q",    name: "三问破案",   desc: "用不超过 3 次提问判对一单" },
  { id: "full_keys",  name: "教科书问诊", desc: "一单问全 3 个关键问题并判对" },
  { id: "streak5",    name: "五连红",     desc: "连续判对 5 单" },
  { id: "old_friend", name: "六亲不认",   desc: "判对老同学老赵那单" },
  { id: "allclear",   name: "十二单全对", desc: "故事模式零失误通关" },
  { id: "bust_wrong", name: "冤枉好人",   desc: "把真客户当伪装者拆穿" },
  { id: "fans1k",     name: "千粉直播间", desc: "粉丝数达到 1000" },
  { id: "title_top",  name: "勇哥本尊",   desc: "头衔达到『勇哥本尊』" },
  { id: "endless10",  name: "流量常青树", desc: "无尽模式累计判对 10 单" },
  { id: "s12",        name: "S级半打",    desc: "图鉴中获得 12 个 S 级评价" },
  { id: "s24",        name: "完美图鉴",   desc: "图鉴 24 格全部 S 级" },
];

const TITLES = [
  [0, "见习连线员"],
  [100, "连线常客"],
  [260, "餐饮参谋"],
  [450, "选址军师"],
  [650, "勇哥本尊"],
];

const DM_ASK = [
  "这问题问到点子上了！", "蹲！", "房东才是爹", "前排吃瓜",
  "这单有点悬……", "学到了学到了", "补给勇哥！", "先看转让费",
];
const DM_OK = [
  "判得准！", "这就是专业", "勇哥yyds", "一针见血", "又救了一个家庭", "关注了！",
];
const DM_BAD = [
  "哎呀，翻车了", "兄弟挺住", "勇哥也有失手的时候", "下把稳住", "这波大意了",
];
const DM_BUST = [
  "卧槽破案了", "主播杀疯了", "拆得好！", "当面揭穿，爽", "这就叫专业", "取关不可能，太下饭了",
];

/* ================= 状态 ================= */

const state = {
  exp: 0, followers: 0, caseIndex: 0, endless: false,
  achievements: [], sound: true, streak: 0, storyWrong: 0, endlessWins: 0,
  rep: 50, pendingCallbacks: [], firedCallbacks: [], codex: {},
  heat: 50, endlessRun: 0, endlessBest: 0,
};
let cur = null; // 当前案件运行时：{ c, asked, follows, slots, maxSlots, freeActionUsed, ended }

const $ = (id) => document.getElementById(id);

/* ================= 存档 ================= */

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 4, ...state })); } catch (e) { /* file:// 隐私模式等场景忽略 */ }
}
function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && (s.v === 1 || s.v === 2 || s.v === 3 || s.v === 4)) {
      state.exp = s.exp || 0;
      state.followers = s.followers || 0;
      state.caseIndex = s.caseIndex || 0;
      state.endless = !!s.endless;
      state.achievements = Array.isArray(s.achievements) ? s.achievements : [];
      state.sound = s.sound !== false;
      state.streak = s.streak || 0;
      state.storyWrong = s.storyWrong || 0;
      state.endlessWins = s.endlessWins || 0;
      state.rep = typeof s.rep === "number" ? s.rep : 50;
      state.pendingCallbacks = Array.isArray(s.pendingCallbacks) ? s.pendingCallbacks : [];
      state.firedCallbacks = Array.isArray(s.firedCallbacks) ? s.firedCallbacks : [];
      state.heat = typeof s.heat === "number" ? s.heat : 50;
      state.endlessRun = s.endlessRun || 0;
      state.endlessBest = s.endlessBest || 0;
      // codex 迁移：v3 数值(1=遭遇) → {g, seen}
      const raw = s.codex && typeof s.codex === "object" ? s.codex : {};
      const cx = {};
      for (const k of Object.keys(raw)) {
        const v = raw[k];
        cx[k] = (v && typeof v === "object") ? { g: v.g || 0, seen: 1 } : { g: 0, seen: 1 };
      }
      state.codex = cx;
      return true;
    }
  } catch (e) { /* 忽略坏档 */ }
  return false;
}

/* ================= 等级 / 头衔 ================= */

function levelOf() {
  if (state.endless) return 3;
  if (state.caseIndex >= 7) return 3;
  if (state.caseIndex >= 3) return 2;
  return 1;
}
function titleOf(exp) {
  let t = TITLES[0][1];
  for (const [min, name] of TITLES) if (exp >= min) t = name;
  return t;
}
function nextTitleThreshold(exp) {
  for (const [min] of TITLES) if (exp < min) return min;
  return null;
}

/* ================= 渲染：顶栏 ================= */

function renderTopBar() {
  $("level-badge").textContent = "Lv" + levelOf();
  $("title-badge").textContent = titleOf(state.exp);
  const next = nextTitleThreshold(state.exp);
  if (next === null) {
    $("exp-bar").style.width = "100%";
    $("exp-text").textContent = "经验 " + state.exp + "（已满级）";
  } else {
    const curMin = TITLES.filter(([m]) => m <= state.exp).pop()[0];
    const pct = Math.min(100, Math.round(((state.exp - curMin) / (next - curMin)) * 100));
    $("exp-bar").style.width = pct + "%";
    $("exp-text").textContent = "经验 " + state.exp + " / " + next;
  }
  $("followers").textContent = "👁 粉丝 " + state.followers.toLocaleString();
  $("rep-stat").textContent = "🤝 声望 " + state.rep;
  $("heat-stat").classList.toggle("hidden", !state.endless);
  if (state.endless) $("heat-stat").textContent = "🔥 人气 " + Math.round(state.heat);
  $("progress").textContent = challenge
    ? "每日挑战 " + Math.min(challenge.i + 1, DAILY_LEN) + " / " + DAILY_LEN
    : state.endless
      ? "无尽模式"
      : "第 " + Math.min(state.caseIndex + 1, CASES.length) + " / " + CASES.length + " 单";
  // 弹幕层跟随顶栏实际高度（移动端顶栏会换行变高）
  const tb = document.getElementById("topbar");
  if (tb) $("danmaku").style.top = tb.offsetHeight + "px";
}

/* ================= 渲染：客户与对话 ================= */

function appendChat(kind, text, flag) {
  const chat = $("chat");
  const div = document.createElement("div");
  div.className = "msg " + kind + (flag === "danger" ? " f-danger" : flag === "good" ? " f-good" : "");
  const who = kind === "q" ? "勇哥" : cur.c.name;
  div.innerHTML = '<span class="who">' + who + '</span><span class="txt"></span>';
  div.querySelector(".txt").textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function renderClient() {
  const c = cur.c;
  $("avatar").textContent = c.avatar;
  $("avatar").style.background = c.color;
  $("client-name").textContent = c.name;
  $("chat").innerHTML = "";
  appendChat("a", c.intro);
}

/* ================= 渲染：问题卡 ================= */

const CAT_ORDER = ["资金", "加盟", "位置", "经营", "动机", "动作"];

function renderQuestions() {
  const lvl = levelOf();
  const list = $("q-list");
  list.innerHTML = "";
  for (const cat of CAT_ORDER) {
    if (cat === "加盟" && !cur.c.franchise) continue; // 加盟问题只对加盟案例出现
    const qs = QUESTIONS.filter((q) => q.cat === cat);
    if (!qs.length) continue;
    const h = document.createElement("div");
    h.className = "cat-head";
    h.textContent = (cat === "动作" ? "🎯 " : "") + cat;
    list.appendChild(h);
    for (const q of qs) {
      const btn = document.createElement("button");
      btn.className = "q-card";
      btn.dataset.qid = q.id;
      if (q.unlock > lvl) {
        btn.classList.add("locked");
        btn.disabled = true;
        btn.innerHTML = '<span class="q-text"></span><span class="q-lock">🔒 完成' + (q.unlock === 2 ? "3" : "7") + '单解锁</span>';
        btn.querySelector(".q-text").textContent = q.text;
      } else {
        btn.innerHTML = '<span class="q-text"></span>';
        btn.querySelector(".q-text").textContent = (cat === "动作" ? "🔎 " : "") + q.text;
        btn.addEventListener("click", () => ask(q.id));
      }
      list.appendChild(btn);
    }
  }
  updateSlots();
}

function updateSlots() {
  $("slots").textContent = "剩余提问 " + cur.slots + " / " + cur.maxSlots;
  $("btn-end").disabled = cur.asked.length === 0;
  $("btn-end").classList.toggle("urgent", cur.slots === 0);
  // 移动端标签栏同步
  $("tab-q-badge").textContent = cur.slots;
  $("tab-verdict").disabled = cur.asked.length === 0;
  $("tab-verdict").classList.toggle("urgent", cur.slots === 0);
  document.querySelectorAll(".fu-btn").forEach((b) => {
    b.disabled = cur.slots <= 0 || cur.ended || cur.follows.includes(b.dataset.qid);
  });
}

/* ---------- 位置图片 ---------- */

// 这些案例的 B 卷位置不同，用独立图组；其余案例两卷共用
const IMG_B_VARIANTS = { c02: 1, c03: 1, c04: 1, c05: 1, x01: 1, c06: 1, c08: 1 };
function locImgPrefix() {
  return cur.c.id + ((cur.c.vi === 1 && IMG_B_VARIANTS[cur.c.id]) ? "b" : "");
}
function appendLocationImages() {
  const prefix = locImgPrefix();
  const wrap = document.createElement("div");
  wrap.className = "loc-imgs";
  let failed = 0;
  ["a", "b", "c"].forEach((suf) => {
    const img = document.createElement("img");
    img.src = "img/" + prefix + "-" + suf + ".jpg";
    img.alt = "位置照片 " + suf.toUpperCase();
    img.loading = "lazy";
    img.addEventListener("click", () => openLightbox(img.src, suf));
    img.addEventListener("error", () => {
      img.remove();
      if (++failed >= 3) wrap.remove(); // 图组缺失时整体不显示
    });
    wrap.appendChild(img);
  });
  $("chat").appendChild(wrap);
  $("chat").scrollTop = $("chat").scrollHeight;
}
function openLightbox(src, suf) {
  $("lightbox-img").src = src;
  $("lightbox-cap").textContent = suf === "c" ? "🗺 位置示意图（客户手机截图）" : "📷 现场照片 " + suf.toUpperCase();
  $("lightbox").classList.remove("hidden");
}

/* ---------- 移动端标签页 ---------- */

const paneMQ = window.matchMedia("(max-width: 640px)");

function setPane(pane) {
  document.body.classList.toggle("pane-chat", paneMQ.matches && pane === "chat");
  document.body.classList.toggle("pane-q", paneMQ.matches && pane === "q");
  $("tab-chat").classList.toggle("active", paneMQ.matches && pane === "chat");
  $("tab-q").classList.toggle("active", paneMQ.matches && pane === "q");
}
function initPaneSwitcher() {
  $("tab-chat").addEventListener("click", () => setPane("chat"));
  $("tab-q").addEventListener("click", () => setPane("q"));
  $("tab-verdict").addEventListener("click", () => endCall());
  paneMQ.addEventListener("change", () => {
    if (!paneMQ.matches) setPane("none"); // 回到桌面/横屏：清除互斥状态
    else setPane("chat");
  });
}

/* ================= 渲染：记录板 ================= */

function addClue(text, flag) {
  if (!text) return;
  const wrap = $("clues");
  const empty = wrap.querySelector(".empty");
  if (empty) empty.remove();
  const chip = document.createElement("span");
  chip.className = "chip " + (flag === "danger" ? "c-danger" : flag === "good" ? "c-good" : "c-neutral");
  chip.textContent = text;
  wrap.appendChild(chip);
  wrap.scrollLeft = wrap.scrollWidth;
}

function renderBoard() {
  $("clues").innerHTML = '<span class="empty">问出关键信息后，线索会留在这里</span>';
}

/* ================= 弹幕 ================= */

function dm(text) {
  const layer = $("danmaku");
  if (layer.childElementCount > 14) return;
  const s = document.createElement("span");
  s.className = "dm";
  s.textContent = text;
  s.style.top = Math.round(4 + Math.random() * 86) + "%";
  s.style.fontSize = 13 + Math.round(Math.random() * 3) + "px";
  s.style.animationDuration = (6 + Math.random() * 5).toFixed(1) + "s";
  s.addEventListener("animationend", () => s.remove());
  layer.appendChild(s);
}
function dmFrom(pool) {
  if (Math.random() < 0.5) dm(pool[Math.floor(Math.random() * pool.length)]);
}

/* ================= 变体与每日挑战 ================= */

let challenge = null; // { seed, queue:[{ci,vi}], i, score, correct }
const DAILY_LEN = 5;
const BEST_KEY = "yongge_daily_best";

// 卷号 0=原版，1..n=变体；answers 浅合并，其余字段被变体同名覆盖；产物携带 vi 供图鉴定位
function instantiate(c, vi) {
  if (!vi || !c.variants || !c.variants[vi - 1]) return Object.assign({}, c, { vi: 0 });
  const v = c.variants[vi - 1];
  return Object.assign({}, c, v, { answers: Object.assign({}, c.answers, v.overrides || {}), vi });
}
function rollVariant(c) {
  if (!c.variants || !c.variants.length) return 0;
  return Math.floor(Math.random() * (c.variants.length + 1));
}
function drawCase() {
  if (challenge) {
    const q = challenge.queue[challenge.i];
    return instantiate(CASES[q.ci], q.vi);
  }
  if (state.endless) {
    const c = CASES[Math.floor(Math.random() * CASES.length)];
    return instantiate(c, rollVariant(c));
  }
  const c = CASES[Math.min(state.caseIndex, CASES.length - 1)];
  return instantiate(c, rollVariant(c));
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function buildDailyQueue(seed) {
  const rng = mulberry32(seed);
  const idx = CASES.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
  }
  return idx.slice(0, DAILY_LEN).map((ci) => {
    const n = (CASES[ci].variants ? CASES[ci].variants.length : 0) + 1;
    return { ci, vi: Math.floor(rng() * n) };
  });
}
function dailyBest(seed) {
  try {
    const b = JSON.parse(localStorage.getItem(BEST_KEY)) || {};
    return b[seed] || null;
  } catch (e) { return null; }
}
function saveDailyBest(seed, rec) {
  try {
    const b = JSON.parse(localStorage.getItem(BEST_KEY)) || {};
    b[seed] = rec;
    localStorage.setItem(BEST_KEY, JSON.stringify(b));
  } catch (e) { /* ignore */ }
}
function openDaily() {
  if (challenge) { showToast("📅 每日挑战进行中", "先把这 5 单打完"); return; }
  const seed = todaySeed();
  const best = dailyBest(seed);
  $("daily-info").textContent =
    "今天是 " + String(seed).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") +
    "，5 单固定题，判对得分＝挑战中获得的经验（关键问题与追问照常计）。" +
    (best ? "你今天的最佳：" + best.score + " 分（判对 " + best.correct + "/5）" : "今天还没挑战过。");
  $("daily-modal").classList.remove("hidden");
}
function startDaily() {
  const seed = todaySeed();
  challenge = { seed, queue: buildDailyQueue(seed), i: 0, score: 0, correct: 0 };
  $("daily-modal").classList.add("hidden");
  $("intro").classList.add("hidden");
  $("finale").classList.add("hidden");
  sfx.play("ring");
  dm("📅 每日挑战开始，今日 5 单，祝勇哥笔下留情");
  startCase();
}
function dailyNext() {
  if (challenge && challenge.i >= challenge.queue.length) finishDaily();
  else startCase();
}
function finishDaily() {
  const ch = challenge;
  challenge = null;
  cur = null;
  const prev = dailyBest(ch.seed);
  const isBest = !prev || ch.score > prev.score;
  if (isBest) saveDailyBest(ch.seed, { score: ch.score, correct: ch.correct });
  $("daily-result-stats").innerHTML =
    "今日挑战成绩：<br><br>得分 <b>" + ch.score + "</b> ・ 判对 <b>" + ch.correct + " / " + DAILY_LEN + "</b><br><br>" +
    (isBest ? "🎉 刷新今日最佳纪录！" : "今日最佳：" + Math.max(prev ? prev.score : 0, ch.score) + " 分，再接再厉。");
  $("daily-result").classList.remove("hidden");
  renderTopBar();
}

/* ================= 头衔特权 ================= */

function perkSlots() {
  return ASK_LIMIT + (state.exp >= 260 ? 1 : 0) + (state.exp >= 650 ? 1 : 0);
}

/* ================= 流程 ================= */

function startCase() {
  cur = { c: drawCase(), asked: [], follows: [], slots: perkSlots(), maxSlots: perkSlots(), freeActionUsed: false, ended: false };
  renderTopBar();
  renderClient();
  renderQuestions();
  renderBoard();
  $("btn-end").disabled = true;
  $("hint").classList.toggle("hidden", !(state.caseIndex === 0 && !state.endless && !challenge));
  sfx.play("ring");
  setPane("chat"); // 新一单自动切回连线页
  dm("…… 新客户接入连线 ……");
  if (state.exp >= 100) {
    const kq = QUESTIONS.find((q) => q.id === cur.c.keys[0]);
    if (kq) dm("弹幕老哥：『" + kq.cat + "这块，有故事』");
  }
  if (!challenge) {
    const due = state.pendingCallbacks.find((p) => p.ticks <= 0);
    if (due) {
      const src = CASES.find((c) => c.id === due.caseId);
      if (src && src.callback && $("cb-modal").classList.contains("hidden")) openCallback(due, src);
    }
  }
}

function ask(qid) {
  if (!cur || cur.ended || cur.asked.includes(qid)) return;
  const q = QUESTIONS.find((x) => x.id === qid);
  const freeAction = state.exp >= 450 && q.cat === "动作" && !cur.freeActionUsed;
  if (!freeAction && cur.slots <= 0) return;
  const caseAtAsk = cur.c;
  const ans = cur.c.answers[qid] || { text: cur.c.fallback };
  cur.asked.push(qid);
  if (freeAction) {
    cur.freeActionUsed = true;
    dm("🤝 军师人脉：这趟腿儿，不占名额");
  } else {
    cur.slots--;
  }

  sfx.play("click");
  appendChat("q", q.text);
  setTimeout(() => {
    if (!cur || cur.c !== caseAtAsk) return; // 换单后忽略延迟追加
    appendChat("a", ans.text, ans.flag);
    addClue(ans.clue, ans.flag);
    sfx.play(ans.flag === "danger" ? "danger" : ans.flag === "good" ? "good" : "click");
    if (qid === "w_location") {
      appendLocationImages();
      dm("📷 客户发来了现场照片");
    }
    if (ans.followup && !cur.follows.includes(qid)) appendFollowupBtn(qid);
  }, 260);

  const card = document.querySelector('.q-card[data-qid="' + qid + '"]');
  if (card) { card.classList.add("asked"); card.disabled = true; }
  updateSlots();
  dmFrom(DM_ASK);
  if (cur.slots === 0) dm("问题卡用完了，该给判决了！");
}

/* ---------- 追问链 ---------- */

function appendFollowupBtn(qid) {
  const b = document.createElement("button");
  b.className = "fu-btn";
  b.dataset.qid = qid;
  b.textContent = "🔍 追问一下（-1 名额）";
  b.addEventListener("click", () => askFollowup(qid));
  b.disabled = cur.slots <= 0 || cur.ended;
  $("chat").appendChild(b);
  $("chat").scrollTop = $("chat").scrollHeight;
}

function askFollowup(qid) {
  if (!cur || cur.ended || cur.slots <= 0 || cur.follows.includes(qid)) return;
  const ans = cur.c.answers[qid];
  const fu = ans && ans.followup;
  if (!fu) return;
  const caseAtAsk = cur.c;
  cur.follows.push(qid);
  cur.slots--;

  const btn = document.querySelector('.fu-btn[data-qid="' + qid + '"]');
  if (btn) btn.remove();

  const qDiv = document.createElement("div");
  qDiv.className = "msg q";
  qDiv.innerHTML = '<span class="who">勇哥 · 追问</span><span class="txt"></span>';
  qDiv.querySelector(".txt").textContent = fu.probe;
  $("chat").appendChild(qDiv);
  $("chat").scrollTop = $("chat").scrollHeight;

  sfx.play("click");
  setTimeout(() => {
    if (!cur || cur.c !== caseAtAsk) return;
    appendChat("a", fu.text, fu.flag);
    addClue(fu.clue, fu.flag);
    sfx.play(fu.flag === "danger" ? "danger" : fu.flag === "good" ? "good" : "click");
    dmFrom(DM_ASK);
  }, 260);
  updateSlots();
}

function endCall() {
  if (!cur || cur.asked.length === 0) return;
  cur.ended = true;
  updateSlots();
  sfx.play("paper");
  $("verdict-modal").classList.remove("hidden");
  dm("勇哥要给结论了……");
}

function closeVerdictModal() {
  $("verdict-modal").classList.add("hidden");
  cur.ended = false; // 继续问（若还有名额）
}

function pickVerdict(vid) {
  if (!cur) return;
  if (challenge) { pickVerdictDaily(vid); return; }
  const c = cur.c;
  const correct = vid === c.correct;
  const keysHit = c.keys.filter((k) => cur.asked.includes(k)).length;
  const fuHit = cur.follows.length;
  const bustWrong = vid === "chaichuan" && !c.impostor;

  const expGain = (correct ? c.exp : 0) + 10 * keysHit + 5 * fuHit;
  let fanDelta;
  if (correct && c.impostor) fanDelta = 2 * (c.exp + 5 * keysHit); // 破案涨粉加倍
  else if (bustWrong) fanDelta = -100;                             // 冤枉好人
  else if (correct) fanDelta = c.exp + 5 * keysHit;
  else fanDelta = -60;

  state.exp += expGain;
  state.followers = Math.max(0, state.followers + fanDelta);
  if (correct) {
    state.streak++;
    if (state.endless) state.endlessWins++;
  } else {
    state.streak = 0;
    if (!state.endless) state.storyWrong++;
  }
  let endlessOver = false;
  if (state.endless) {
    state.heat = Math.max(0, Math.min(100, state.heat + (correct ? 8 : -15)));
    state.endlessRun++;
    endlessOver = state.heat <= 0;
  }

  const isLastStoryCase = !state.endless && state.caseIndex >= CASES.length - 1;
  if (!state.endless) state.caseIndex++;
  tickCallbacks(correct);
  saveGame();
  checkAchievements({ vid, correct, keysHit });

  $("verdict-modal").classList.add("hidden");
  renderTopBar();
  sfx.play(correct ? (c.impostor ? "bust" : "correct") : "wrong");
  dmFrom(correct ? (c.impostor ? DM_BUST : DM_OK) : DM_BAD);
  showResult({ vid, correct, keysHit, fuHit, expGain, fanDelta, isLastStoryCase, bustWrong, endlessOver });
}

// 每日挑战：独立计分，不动主存档数值
function pickVerdictDaily(vid) {
  const c = cur.c;
  const correct = vid === c.correct;
  const keysHit = c.keys.filter((k) => cur.asked.includes(k)).length;
  const fuHit = cur.follows.length;
  const bustWrong = vid === "chaichuan" && !c.impostor;
  const expGain = (correct ? c.exp : 0) + 10 * keysHit + 5 * fuHit;

  challenge.score += expGain;
  if (correct) challenge.correct++;
  checkAchievements({ vid, correct, keysHit });
  challenge.i++;
  const done = challenge.i >= challenge.queue.length;

  $("verdict-modal").classList.add("hidden");
  renderTopBar();
  sfx.play(correct ? (c.impostor ? "bust" : "correct") : "wrong");
  dmFrom(correct ? (c.impostor ? DM_BUST : DM_OK) : DM_BAD);
  showResult({ vid, correct, keysHit, fuHit, expGain, fanDelta: 0, isLastStoryCase: done, bustWrong });
}

/* ================= 单案评级 ================= */

const GRADE_META = { 4: ["S", "g4"], 3: ["A", "g3"], 2: ["B", "g2"], 1: ["C", "g1"] };
function gradeRank(correct, keysHit, fuHit, fuTotal) {
  if (!correct) return 0;
  if (keysHit === 3 && fuHit >= 1) return 4;
  if (keysHit >= 2) return 3;
  if (keysHit >= 1) return 2;
  return 1;
}

function showResult(r) {
  const c = cur.c;
  // 图鉴记录：评级只升不降
  const fuTotal = Object.values(c.answers).filter((a) => a.followup).length;
  const rank = gradeRank(r.correct, r.keysHit, r.fuHit, fuTotal);
  const cxKey = c.id + ":" + (c.vi || 0);
  const prev = state.codex[cxKey] || { g: 0, seen: 0 };
  state.codex[cxKey] = { g: Math.max(prev.g || 0, rank), seen: 1 };
  saveGame();

  $("result-compare").innerHTML =
    '你的判决：<b class="' + (r.correct ? "ok" : "bad") + '">' + VERDICTS[r.vid].label + "</b>" +
    '　｜　勇哥的判决：<b>' + VERDICTS[c.correct].label + "</b>";
  const gm = GRADE_META[rank];
  if (gm) {
    $("result-grade").textContent = "单案评级 " + gm[0];
    $("result-grade").className = "result-grade " + gm[1];
  } else {
    $("result-grade").textContent = "单案评级 ——（判错不评级）";
    $("result-grade").className = "result-grade g0";
  }
  if (c.impostor && r.correct) {
    $("result-who").textContent = "🎭 真实身份：" + c.who;
    $("result-who").classList.remove("hidden");
  } else {
    $("result-who").classList.add("hidden");
  }
  $("result-badge").textContent = r.correct ? "✔ 判断正确" : "✘ 判断失误";
  $("result-badge").className = "result-badge " + (r.correct ? "ok" : "bad");
  $("result-reveal").textContent = r.bustWrong
    ? (c.revealBadBust || BUST_WRONG_REVEAL)
    : (r.correct ? c.revealOk : c.revealBad);
  $("result-comment").textContent = "勇哥点评：" + c.comment;
  $("result-gains").innerHTML =
    "经验 +" + r.expGain +
    "（判决 " + (r.correct ? "+" + c.exp : "+0") +
    " ｜ 关键问题 ×" + r.keysHit + " +" + 10 * r.keysHit +
    " ｜ 追问 ×" + r.fuHit + " +" + 5 * r.fuHit + "）" +
    "　｜　粉丝 " + (r.fanDelta >= 0 ? "+" : "") + r.fanDelta;
  const sCount = Object.values(state.codex).filter((e) => e && e.g === 4).length;
  if (sCount >= 12) unlockAch("s12");
  if (sCount >= 24) unlockAch("s24");
  $("btn-next").textContent = r.endlessOver
    ? "🔥 查看掉播结算"
    : challenge
      ? (r.isLastStoryCase ? "查看战绩 →" : "下一题 →")
      : (r.isLastStoryCase ? "🏁 查看结算" : "下一单 →");
  $("result").classList.remove("hidden");
}

function nextFromResult() {
  $("result").classList.add("hidden");
  if (challenge) { dailyNext(); return; }
  if (state.endless && state.heat <= 0) { showOffAir(); return; }
  if (!state.endless && state.caseIndex >= CASES.length) {
    if (state.storyWrong === 0) unlockAch("allclear");
    showFinale();
  } else {
    startCase();
  }
}

/* ================= 无尽人气 ================= */

function showOffAir() {
  const isBest = state.endlessRun > state.endlessBest && state.endlessRun > 0;
  if (isBest) { state.endlessBest = state.endlessRun; saveGame(); }
  $("offair-stats").innerHTML =
    "直播间人气耗尽，掉播了：<br><br>" +
    "本次存活 <b>" + state.endlessRun + "</b> 单 ・ 历史最佳 <b>" + state.endlessBest + "</b> 单<br>" +
    "无尽累计判对 <b>" + state.endlessWins + "</b> 单<br><br>" +
    (isBest ? "🎉 刷新生存纪录！" : "调整心态，换个开播姿势再来。");
  $("offair").classList.remove("hidden");
  renderTopBar();
}

/* ================= 战绩分享 ================= */

function buildShareText(kind) {
  const entries = Object.values(state.codex).filter((e) => e && e.seen);
  const sCount = entries.filter((e) => e.g === 4).length;
  const lines = ["🎙️ 勇哥模拟器战绩"];
  lines.push("头衔：" + titleOf(state.exp) + "（经验 " + state.exp + "）");
  lines.push("粉丝 " + state.followers.toLocaleString() + " ｜ 江湖声望 " + state.rep);
  lines.push("图鉴：" + entries.length + "/24（S 级 " + sCount + "）");
  if (kind === "daily") {
    const b = dailyBest(todaySeed());
    lines.push("今日挑战：" + (b ? b.score + " 分（判对 " + b.correct + "/5）" : "未挑战"));
  }
  if (kind === "offair") lines.push("无尽生存：最佳 " + state.endlessBest + " 单");
  if (state.endless) lines.push("🔥 当前人气 " + Math.round(state.heat));
  lines.push("https://hongshaodalao.github.io/YonggeSimulator/");
  return lines.filter((l) => l !== "").join("\n");
}
function copyShare(kind) {
  const text = buildShareText(kind);
  const done = () => showToast("📋 战绩已复制", "去群里炫耀一下吧");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    done();
  } catch (e) {
    showToast("复制失败", "浏览器限制了剪贴板，请手动截图分享");
  }
}

function showFinale() {
  $("finale-stats").innerHTML =
    "故事模式接完，你的成绩：<br><br>" +
    "经验 <b>" + state.exp + "</b> ・ 头衔 <b>" + titleOf(state.exp) + "</b><br>" +
    "粉丝 <b>" + state.followers.toLocaleString() + "</b> ・ 失误 <b>" + state.storyWrong + "</b> 单<br><br>" +
    (state.storyWrong === 0
      ? "零失误通关——客户排队三小时，就为听你一句『归零』。"
      : "还想再练练？无尽模式随机连线，头衔和粉丝继续累计。");
  $("finale").classList.remove("hidden");
  renderTopBar();
}

/* ================= 成就 ================= */

function unlockAch(id) {
  if (state.achievements.includes(id)) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  state.achievements.push(id);
  saveGame();
  sfx.play("achv");
  dm("🏆 达成成就：" + a.name);
  showToast("🏆 成就达成：" + a.name, a.desc);
}

function checkAchievements(ctxInfo) {
  const { vid, correct, keysHit } = ctxInfo;
  const c = cur.c;
  if (correct && vid === "guiling") unlockAch("first_zero");
  if (correct && vid === "nengkai") unlockAch("first_open");
  if (correct && c.impostor) unlockAch("first_bust");
  if (correct && cur.asked.length + cur.follows.length <= 3) unlockAch("three_q");
  if (correct && keysHit === 3) unlockAch("full_keys");
  if (correct && state.streak >= 5) unlockAch("streak5");
  if (correct && c.id === "c10") unlockAch("old_friend");
  if (vid === "chaichuan" && !c.impostor) unlockAch("bust_wrong");
  if (challenge) return; // 每日挑战只结算与主状态无关的单案成就
  if (state.followers >= 1000) unlockAch("fans1k");
  if (titleOf(state.exp) === "勇哥本尊") unlockAch("title_top");
  if (state.endlessWins >= 10) unlockAch("endless10");
}

function showToast(title, desc) {
  const wrap = $("toasts");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = "<b></b><span></span>";
  t.querySelector("b").textContent = title;
  t.querySelector("span").textContent = desc;
  wrap.appendChild(t);
  setTimeout(() => t.classList.add("out"), 3600);
  setTimeout(() => t.remove(), 4150);
}

function openAchievements() {
  const wrap = $("ach-list");
  wrap.innerHTML = "";
  for (const a of ACHIEVEMENTS) {
    const got = state.achievements.includes(a.id);
    const div = document.createElement("div");
    div.className = "ach-item" + (got ? " got" : "");
    div.innerHTML = "<b></b><span></span>";
    div.querySelector("b").textContent = (got ? "🏆 " : "🔒 ") + a.name;
    div.querySelector("span").textContent = a.desc;
    wrap.appendChild(div);
  }
  $("ach-modal").classList.remove("hidden");
}

function startEndless() {
  state.endless = true;
  state.heat = 50;
  state.endlessRun = 0;
  saveGame();
  $("finale").classList.add("hidden");
  startCase();
}

function newGame() {
  state.exp = 0; state.followers = 0; state.caseIndex = 0; state.endless = false;
  state.achievements = []; state.streak = 0; state.storyWrong = 0; state.endlessWins = 0;
  state.rep = 50; state.pendingCallbacks = []; state.firedCallbacks = [];
  state.heat = 50; state.endlessRun = 0;
  saveGame();
  $("intro").classList.add("hidden");
  $("finale").classList.add("hidden");
  startCase();
}

function continueGame() {
  $("intro").classList.add("hidden");
  if (!state.endless && state.caseIndex >= CASES.length) {
    showFinale();
  } else {
    startCase();
  }
}

/* ================= 回访 ================= */

function tickCallbacks(correct) {
  state.pendingCallbacks.forEach((p) => { p.ticks--; });
  const cb = cur.c.callback;
  if (cb && !state.firedCallbacks.includes(cur.c.id) &&
      !state.pendingCallbacks.some((p) => p.caseId === cur.c.id)) {
    state.pendingCallbacks.push({ caseId: cur.c.id, ticks: cb.after, ok: correct });
  }
}

let activeCallback = null;
function openCallback(due, src) {
  activeCallback = { due, cb: src.callback };
  $("cb-avatar").textContent = src.avatar;
  $("cb-avatar").style.background = src.color;
  $("cb-name").textContent = "📞 回访 · " + src.name;
  const intro = due.ok ? (src.callback.introOk || src.callback.intro) : (src.callback.introBad || src.callback.intro);
  $("cb-intro").textContent = intro;
  const wrap = $("cb-choices");
  wrap.innerHTML = "";
  src.callback.choices.forEach((ch) => {
    const b = document.createElement("button");
    b.className = "cb-choice";
    b.textContent = ch.label;
    b.addEventListener("click", () => chooseCallback(ch));
    wrap.appendChild(b);
  });
  $("cb-reply-wrap").classList.add("hidden");
  sfx.play("ring");
  dm("📞 一个熟悉的号码打了进来……");
  $("cb-modal").classList.remove("hidden");
}

function chooseCallback(ch) {
  if (!activeCallback) return;
  state.followers = Math.max(0, state.followers + ch.fans);
  state.rep = Math.max(0, Math.min(100, state.rep + (ch.rep || 0)));
  state.firedCallbacks.push(activeCallback.due.caseId);
  state.pendingCallbacks = state.pendingCallbacks.filter((p) => p !== activeCallback.due);
  saveGame();
  sfx.play(ch.fans >= 0 ? "good" : "wrong");
  $("cb-choices").innerHTML = "";
  $("cb-reply-wrap").classList.remove("hidden");
  $("cb-reply").textContent = ch.reply;
  $("cb-effect").textContent = "粉丝 " + (ch.fans >= 0 ? "+" : "") + ch.fans +
    " ｜ 江湖声望 " + ((ch.rep || 0) >= 0 ? "+" : "") + (ch.rep || 0) +
    "（当前 " + state.rep + "）";
  dmFrom(ch.fans >= 0 ? DM_OK : DM_BAD);
  renderTopBar();
}

/* ================= 图鉴 ================= */

function openCodex() {
  const wrap = $("codex-grid");
  wrap.innerHTML = "";
  let seen = 0, sCount = 0;
  for (const c of CASES) {
    const count = 1 + (c.variants ? c.variants.length : 0);
    for (let vi = 0; vi < count; vi++) {
      const e = state.codex[c.id + ":" + vi];
      const got = !!(e && e.seen);
      if (got) seen++;
      if (got && e.g === 4) sCount++;
      const src = vi === 0 ? c : c.variants[vi - 1];
      const div = document.createElement("div");
      div.className = "codex-item" + (got ? " got" : "");
      div.innerHTML = "<b></b><span></span>";
      div.querySelector("b").textContent = c.name + " · " + (vi === 0 ? "原版" : "B卷");
      let sub;
      if (!got) sub = "？？？ 未遭遇";
      else {
        const gtag = e.g === 4 ? " ｜ 🏆S" : e.g === 3 ? " ｜ ✅A" : e.g === 2 ? " ｜ ✅B" : e.g === 1 ? " ｜ ✅C" : " ｜ 已遭遇";
        sub = "判决：" + VERDICTS[src.correct].label + gtag;
      }
      div.querySelector("span").textContent = sub;
      wrap.appendChild(div);
    }
  }
  $("codex-stats").textContent = "已遭遇 " + seen + " / " + wrap.childElementCount + "（S 级 " + sCount + "）· 跨存档累计";
  const pl = $("perk-list");
  pl.innerHTML = "";
  for (const [min, desc] of [
    [100, "弹幕剧透：开局提示一个关键话题方向"],
    [260, "每单提问名额 +1"],
    [450, "每单首个动作类问题不占名额"],
    [650, "提问名额再 +1（共 +2）"],
  ]) {
    const on = state.exp >= min;
    const div = document.createElement("div");
    div.className = "ach-item" + (on ? " got" : "");
    div.innerHTML = "<b></b><span></span>";
    div.querySelector("b").textContent = (on ? "✅ " : "🔒 ") + TITLES.find((t) => t[0] === min)[1];
    div.querySelector("span").textContent = desc;
    pl.appendChild(div);
  }
  $("codex-modal").classList.remove("hidden");
}

/* ================= 初始化 ================= */

function buildVerdictButtons() {
  const wrap = $("verdict-list");
  wrap.innerHTML = "";
  for (const [vid, v] of Object.entries(VERDICTS)) {
    const b = document.createElement("button");
    b.className = "verdict-btn v-" + vid;
    b.innerHTML = '<b></b><span></span>';
    b.querySelector("b").textContent = v.label;
    b.querySelector("span").textContent = v.desc;
    b.addEventListener("click", () => pickVerdict(vid));
    wrap.appendChild(b);
  }
}

function init() {
  buildVerdictButtons();
  initPaneSwitcher();
  if (paneMQ.matches) setPane("chat");

  $("btn-end").addEventListener("click", endCall);
  $("btn-askmore").addEventListener("click", closeVerdictModal);
  $("btn-next").addEventListener("click", nextFromResult);
  $("btn-endless").addEventListener("click", startEndless);
  $("btn-finale-new").addEventListener("click", () => {
    if (confirm("确定要放弃当前进度，重新开档吗？")) newGame();
  });
  $("btn-reset").addEventListener("click", () => {
    if (confirm("确定要放弃当前进度，重新开档吗？")) newGame();
  });
  $("btn-ach").addEventListener("click", openAchievements);
  $("btn-ach-close").addEventListener("click", () => $("ach-modal").classList.add("hidden"));
  $("btn-codex").addEventListener("click", openCodex);
  $("btn-codex-close").addEventListener("click", () => $("codex-modal").classList.add("hidden"));
  $("btn-cb-continue").addEventListener("click", () => {
    $("cb-modal").classList.add("hidden");
    activeCallback = null;
  });
  $("btn-daily").addEventListener("click", openDaily);
  $("btn-daily-start").addEventListener("click", startDaily);
  $("btn-daily-cancel").addEventListener("click", () => $("daily-modal").classList.add("hidden"));
  $("btn-daily-close").addEventListener("click", () => {
    $("daily-result").classList.add("hidden");
    if (!state.endless && state.caseIndex >= CASES.length) showFinale();
    else startCase();
  });
  $("btn-share-story").addEventListener("click", () => copyShare("story"));
  $("btn-share-daily").addEventListener("click", () => copyShare("daily"));
  $("btn-reopen").addEventListener("click", () => {
    state.heat = 50; state.endlessRun = 0;
    saveGame();
    $("offair").classList.add("hidden");
    startCase();
  });
  $("btn-back-story").addEventListener("click", () => {
    state.endless = false; state.heat = 50; state.endlessRun = 0;
    saveGame();
    $("offair").classList.add("hidden");
    if (state.caseIndex >= CASES.length) showFinale();
    else startCase();
  });
  $("btn-share-offair").addEventListener("click", () => copyShare("offair"));
  $("lightbox").addEventListener("click", () => $("lightbox").classList.add("hidden"));
  $("btn-sound").addEventListener("click", () => {
    state.sound = !state.sound;
    $("btn-sound").textContent = state.sound ? "🔊" : "🔇";
    saveGame();
    if (state.sound) sfx.play("click");
  });
  $("btn-sound").textContent = state.sound ? "🔊" : "🔇";

  const hasSave = loadGame();
  $("btn-continue").classList.toggle("hidden", !hasSave);
  $("btn-start").addEventListener("click", newGame);
  $("btn-continue").addEventListener("click", continueGame);
  $("intro").classList.remove("hidden");

  renderTopBar();
}

init();
