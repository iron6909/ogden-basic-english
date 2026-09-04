const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let vocabulary;
try {
  vocabulary = JSON.parse(
    fs.readFileSync(path.join(root, "assets/vocabulary.json"), "utf8"),
  );
} catch (error) {
  throw new Error(`Unable to read assets/vocabulary.json: ${error.message}`);
}
const categoryInfo = {
  op: {
    nameEn: "Operations",
    nameZh: "操作词",
    stageEn: "Sentence foundations",
    stageZh: "句子骨架",
  },
  gt: {
    nameEn: "General Things",
    nameZh: "通用词",
    stageEn: "General vocabulary",
    stageZh: "通用事物",
  },
  pt: {
    nameEn: "Picturable",
    nameZh: "图示词",
    stageEn: "Picturable vocabulary",
    stageZh: "看得见的词",
  },
  qg: {
    nameEn: "Qualities",
    nameZh: "性质词",
    stageEn: "Describing qualities",
    stageZh: "描述世界",
  },
  qo: {
    nameEn: "Opposites",
    nameZh: "反义对",
    stageEn: "Contrasting qualities",
    stageZh: "对照边界",
  },
};
const counts = { op: 10, gt: 40, pt: 20, qg: 10, qo: 5 };
const categories = Object.keys(counts);
const grouped = Object.fromEntries(
  categories.map((c) => [c, vocabulary.filter((w) => w.c === c)]),
);
for (const c of categories)
  if (grouped[c].length !== counts[c] * 10)
    throw new Error(`${c} source count mismatch`);

const lessonTitle = (info, words) => ({
  titleZh: `${info.stageZh}：${words[0].w}–${words[words.length - 1].w}`,
  titleEn: `${info.stageEn}: ${words[0].w}–${words[words.length - 1].w}`,
});
const contrast = (left, right) => ({
  words: [left.w, right.w],
  noteZh: `比较 ${left.w}（${left.zh}）和 ${right.w}（${right.zh}）：${left.w} 的英文释义是“${left.en}”，${right.w} 的英文释义是“${right.en}”；例句分别是“${left.ex}”和“${right.ex}”。`,
});

const lessons = [];
let number = 1;
for (const c of categories) {
  const info = categoryInfo[c];
  for (let i = 0; i < counts[c]; i++) {
    const words = grouped[c].slice(i * 10, i * 10 + 10);
    if (words.length !== 10 || words.some((w) => !w.core || !w.en || !w.ex))
      throw new Error(`lesson ${number} has incomplete vocabulary data`);
    const titles = lessonTitle(info, words);
    const contrasts = [
      contrast(words[0], words[1]),
      contrast(words[2], words[3]),
    ];
    lessons.push({
      number,
      category: c,
      ...titles,
      teachingFocusZh:
        c === "op"
          ? "先找句子的发动机和路标，再把动作、对象与时间关系拼成整句。"
          : c === "qo"
            ? "将本课的性质词放回句子，依据定义、例句和上下文辨认具体状态与边界。"
            : `用可见的对象、事件或性质把词放回句子，训练从上下文确认词义。`,
      words: words.map((w) => w.w),
      contrasts,
    });
    number++;
  }
}
if (
  lessons.length !== 85 ||
  lessons.reduce((n, l) => n + l.words.length, 0) !== 850 ||
  new Set(lessons.flatMap((l) => l.words)).size !== 850
)
  throw new Error("curriculum integrity failure");
fs.writeFileSync(
  path.join(root, "assets/curriculum-map.json"),
  JSON.stringify({ version: 2, lessons }, null, 2) + "\n",
);

const byWord = Object.fromEntries(vocabulary.map((w) => [w.w, w]));
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (x) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        x
      ],
  );
const en = (s) => `<span lang="en">${esc(s)}</span>`;
const nav = (n, lessonPrefix = "") =>
  `<nav class="course-nav" aria-label="课程导航"><a href="../index.html">课程总览</a>${n > 1 ? ` · <a href="${lessonPrefix}${String(n - 1).padStart(4, "0")}-lesson.html">第 ${n - 1} 课</a>` : ""}${n < 85 ? ` · <a href="${lessonPrefix}${String(n + 1).padStart(4, "0")}-lesson.html">第 ${n + 1} 课</a>` : ""}</nav>`;
const cards = (words) =>
  words
    .map((name) => {
      const w = byWord[name];
      return `<article class="word"><strong>${en(w.w)}</strong><span>${esc(w.zh)}</span><small>${en(w.en)}</small><em>${esc(w.core)}</em></article>`;
    })
    .join("");
const examples = (words) =>
  words
    .map((name) => {
      const w = byWord[name];
      return `<div class="example"><b lang="en">${esc(w.ex)}</b><small>${esc(w.exz)}</small></div>`;
    })
    .join("");
const choice = (name, wrong1, wrong2, i) =>
  `<label><input type="radio" name="q${i}" value="${esc(name)}"> ${en(name)}</label><label><input type="radio" name="q${i}" value="${esc(wrong1)}"> ${en(wrong1)}</label><label><input type="radio" name="q${i}" value="${esc(wrong2)}"> ${en(wrong2)}</label>`;
const quiz = (lesson, previous) => {
  const ws = lesson.words;
  const q = [];
  for (let i = 0; i < 3; i++)
    q.push(
      `<fieldset><legend>哪个词最接近“${esc(byWord[ws[i]].zh)}”？</legend>${choice(ws[i], ws[(i + 1) % 10], ws[(i + 2) % 10], i + 1)}</fieldset>`,
    );
  q.push(
    `<fieldset><legend lang="en">${esc(byWord[ws[3]].ex)}</legend>${choice(ws[3], ws[4], ws[5], 4)}</fieldset>`,
  );
  const contrastWords = lesson.contrasts[0].words;
  const contrastAnswer = byWord[contrastWords[0]];
  q.push(
    `<fieldset><legend>辨析：哪个词符合“${esc(contrastAnswer.en)}”（${esc(contrastAnswer.ex)}）？</legend>${choice(contrastWords[0], contrastWords[1], ws[4], 5)}</fieldset>`,
  );
  const review = previous?.words[0] || ws[9];
  const reviewPrompt = previous
    ? `间隔复习：哪个词属于第 ${previous.number} 课？`
    : `间隔复习：哪个词是本课最后一个目标词（${ws[9]}）？`;
  q.push(
    `<fieldset><legend>${reviewPrompt}</legend>${choice(review, ws[6], ws[7], 6)}</fieldset>`,
  );
  const key = [
    ws[0],
    ws[1],
    ws[2],
    ws[3],
    lesson.contrasts[0].words[0],
    review,
  ];
  const script = `<script>document.querySelector('#quiz').addEventListener('submit',function(e){e.preventDefault();const key=${JSON.stringify(key)};const data=new FormData(this);const answers=key.map((_,i)=>data.get('q'+(i+1)));const f=document.querySelector('#feedback');if(answers.some(a=>a===null)){f.textContent='请完成六题后再检查。';return;}const score=answers.reduce((n,a,i)=>n+(a===key[i]?1:0),0);f.textContent='你答对了 '+score+'/6 题。'+(score===6?'很好：你已经在上下文中识别词义。':'回到例句和辨析，再做一次；低分词下次会再次出现。');});</script>`;
  return (
    q.join("") +
    `<button type="submit">检查答案</button><p class="feedback" id="feedback" aria-live="polite"></p>${script}`
  );
};

fs.rmSync(path.join(root, "lessons"), { recursive: true, force: true });
fs.rmSync(path.join(root, "reference"), { recursive: true, force: true });
fs.mkdirSync(path.join(root, "lessons"));
fs.mkdirSync(path.join(root, "reference"));
for (const lesson of lessons) {
  const n = lesson.number;
  const file = `${String(n).padStart(4, "0")}-lesson.html`;
  const info = categoryInfo[lesson.category];
  const previous = lessons[n - 2];
  const phaseChange = !previous || previous.category !== lesson.category;
  const phaseIntro = phaseChange
    ? `<aside class="phase-note"><strong>进入新阶段：${esc(info.nameZh)}</strong><span>这一阶段共 ${lessons.filter((l) => l.category === lesson.category).length} 课；每课 10 个词，先掌握本阶段的阅读任务，再逐步累积。</span></aside>`
    : "";
  const page = `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Ogden Basic English 850 词中文学习课程，第 ${n} 课。"><meta name="theme-color" content="#f7f5ef"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><title>第 ${n} 课：${esc(lesson.titleZh)}</title><link rel="stylesheet" href="../assets/lesson.css"></head><body><a class="skip-link" href="#main">跳到正文</a><main id="main">\n${nav(n)}${phaseIntro}<p class="kicker"><span lang="en">${esc(info.nameEn)}</span> · ${esc(info.nameZh)} · <span lang="en">Lesson ${String(n).padStart(2, "0")}</span> · 约 8 分钟</p><h1>第 ${n} 课：${esc(lesson.titleZh)}</h1><p class="lead">${esc(lesson.teachingFocusZh)} 本课固定学习 10 个目标词。</p><hr class="rule"><h2>本课的共同画面</h2><p>${esc(lesson.teachingFocusZh)} 先读下面的核心意象，再回到例句中验证。</p><section class="words">${cards(lesson.words)}</section><h2>把词放回句子</h2>${examples(lesson.words)}<section class="contrast"><h2>易混边界</h2>${lesson.contrasts.map((c) => `<p><b>${c.words.map(en).join(" / ")}</b>　${esc(c.noteZh)}</p>`).join("")}</section><p class="reading-tip">阅读提示：先圈出本课目标词，再问“它和句子里的哪个对象发生了什么关系？”不确定时，优先相信整句，不要硬套单一中文释义。</p><section class="quiz"><h2>回忆与阅读检查</h2><p>先遮住上面的词卡，凭记忆完成。第 5 题辨析本课词义边界，第 6 题是间隔复习题。</p><form id="quiz">${quiz(lesson, previous)}</form></section><h2>继续学习</h2>${nav(n)}<p><a href="../reference/ogden-${String(n).padStart(4, "0")}.html">打开本课速查卡</a></p><footer>词义、核心意象与例句参考：<a href="https://ogden.munch.love/">Ogden's Basic English 850 词学习手册</a>。有任何句子读不通，直接问我。</footer></main></body></html>\n`;
  fs.writeFileSync(path.join(root, "lessons", file), page);
  const ref = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Ogden Basic English 850 词中文学习课程，第 ${n} 课速查卡。"><meta name="theme-color" content="#f7f5ef"><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><title>第 ${n} 课速查卡：${esc(lesson.titleZh)}</title><link rel="stylesheet" href="../assets/lesson.css"></head><body><a class="skip-link" href="#main">跳到正文</a><main id="main">${nav(n, "../lessons/")}<p class="kicker"><span lang="en">${esc(info.nameEn)}</span> · ${esc(info.nameZh)}</p><h1>第 ${n} 课 · ${esc(lesson.titleZh)}</h1><p class="lead">${esc(lesson.teachingFocusZh)}</p><section class="words">${cards(lesson.words)}</section><hr class="rule">${examples(lesson.words)}<p><a href="../lessons/${file}">回到本课 →</a></p></main></body></html>`;
  fs.writeFileSync(
    path.join(root, "reference", `ogden-${String(n).padStart(4, "0")}.html`),
    ref,
  );
}
const sections = categories
  .map((c) => {
    const ls = lessons.filter((l) => l.category === c);
    return `<section><h2><span lang="en">${esc(categoryInfo[c].nameEn)}</span> · ${esc(categoryInfo[c].nameZh)} <small>${ls.length} 课 · ${ls.length * 10} 词</small></h2><ol>${ls.map((l) => `<li><a href="lessons/${String(l.number).padStart(4, "0")}-lesson.html">第 ${l.number} 课：${esc(l.titleZh)}</a><span lang="en">${esc(l.titleEn)}</span></li>`).join("")}</ol></section>`;
  })
  .join("");
const coursePage = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="面向中文学习者的 Ogden Basic English 850 词完整课程，共 85 课，每课 10 词。"><meta name="theme-color" content="#f7f5ef"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><title>Ogden Basic English · 850 词完整课程</title><link rel="stylesheet" href="assets/lesson.css"></head><body><a class="skip-link" href="#main">跳到正文</a><main class="course-index" id="main"><p class="kicker">Complete course · 850 words</p><h1>从句子骨架到完整阅读</h1><p class="lead">一套连续的 85 课课程：先掌握操作词，再把人物、事物、图示、性质和反义关系放回句子。</p><p>每课恰好 10 个目标词。建议按顺序每天完成一课；小测低于 5/6 时，隔天重做本课再继续。</p><p><a class="start-link" href="lessons/0001-lesson.html">开始第 1 课 →</a></p><hr class="rule">${sections}<hr class="rule"><p><a href="https://ogden.munch.love/">打开原始 850 词学习手册</a> · <a href="MISSION.md">查看学习使命</a></p><footer>五阶段：Operations 10 课、General Things 40 课、Picturable 20 课、Qualities 10 课、Opposites 5 课。</footer></main></body></html>`;
fs.writeFileSync(path.join(root, "index.html"), coursePage);
fs.writeFileSync(path.join(root, "COURSE.html"), coursePage);
console.log(`built ${lessons.length} lessons and 850 words`);
