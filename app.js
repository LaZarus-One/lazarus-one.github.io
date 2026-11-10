// lazarus frontend: high-performance static client-side router & interactive learning engine.
// Hosted on GitHub Pages: supports subpath repositories, custom domains, and pre-rendered fallbacks.

const SITE = {
  name: "Lazarus",
  tagline: "Machine Execution & Reverse Engineering",
  blurb: "Master low-level machine execution, CPU internals, binary analysis, and reverse engineering from an offensive security perspective. 100% free and open source."
};

const app = document.getElementById("app");

// ---- GitHub Pages Base Path & Route Resolution ----
// Supports both root hosting (https://domain.com/learn/1-1)
// and repository subfolder hosting (https://username.github.io/LZ-Blog/learn/1-1 or /lazarus/learn/1-1)
function getBasePath() {
  const baseEl = document.querySelector("base");
  if (baseEl && baseEl.getAttribute("href")) {
    return baseEl.getAttribute("href").replace(/\/+$/, "");
  }
  const path = location.pathname;
  // If pathname matches /<repo>/... where repo is not 'learn' or index
  const match = path.match(/^(\/[^\/]+)\/(?:learn|lessons)/);
  if (match) return match[1];
  return "";
}
const BASE = getBasePath();

// Format an internal app link
function appUrl(path) {
  if (path === "/") return BASE ? `${BASE}/` : "/";
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---- Progress & LocalStorage ----
const SOLVED_KEY = "lazarus:solved";
function solvedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY)) ?? []); } catch { return new Set(); }
}
function setSolved(id, solved) {
  const set = solvedSet();
  solved ? set.add(id) : set.delete(id);
  try { localStorage.setItem(SOLVED_KEY, JSON.stringify([...set])); return true; } catch { return false; }
}

// ---- Data Fetching ----
let chaptersCache = null;
async function getJson(path) {
  const target = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(target);
  const isJson = res.headers.get("content-type")?.includes("json");
  if (!res.ok || !isJson) {
    const status = res.ok ? 404 : res.status;
    throw Object.assign(new Error(`${target} returned ${status}`), { status });
  }
  return res.json();
}
const getChapters = async () => (chaptersCache ??= await getJson("/lessons/chapters.json"));
const topicCount = chapters => chapters.reduce((n, c) => n + c.topics.length, 0);
const topicKey = id => `lesson:${id}`;
const topicsDone = (chapters, solved) =>
  chapters.reduce((n, c) => n + c.topics.filter(t => solved.has(topicKey(t.id))).length, 0);
const topicsChip = (done, total) =>
  `<span class="chip${total && done === total ? " ok" : ""}"><span class="icon fill">check_circle</span>${done} of ${plural(total, "topic")} completed</span>`;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ---- Helpers ----
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function setTitle(t) {
  document.title = t ? `${t} · ${SITE.name}` : `${SITE.name}: ${SITE.tagline}`;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", `${location.origin}${location.pathname}`);
}

function page(headerHtml, body = "") {
  return `<div class="page">${headerHtml}${body}</div>`;
}
function header({ above = "", title, lead = "", below = "" }) {
  return `<header class="page-header">
    ${above}
    <h1>${title}</h1>
    ${lead ? `<p class="lead">${lead}</p>` : ""}
    ${below}
  </header>`;
}
function errorBox(err) {
  return `<div class="card empty">Couldn't load content (${esc(err.message)}). Please check connection or try again.</div>`;
}
function loading(text) {
  return page(header({ title: "&nbsp;", below: `<div class="running"><span class="spinner"></span>${text}</div>` }));
}

// ---- Home Page ----
async function homePage() {
  setTitle("");
  const head = chip => header({
    above: `<div class="chips"><span class="chip"><span class="icon fill">terminal</span>Cybersecurity Focus</span><span class="chip"><span class="icon">code</span>Free & Open Source</span>${chip}</div>`,
    title: SITE.tagline,
    lead: SITE.blurb
  });
  app.innerHTML = page(head(""));
  try {
    const chapters = await getChapters();
    const solved = solvedSet();
    app.innerHTML = page(
      head(topicsChip(topicsDone(chapters, solved), topicCount(chapters))),
      chapters.map(c => chapterBlock(c, solved)).join("")
    );
  } catch (err) {
    app.innerHTML = page(head(""), errorBox(err));
  }
}

function chapterBlock(c, solved) {
  return `<section class="chapter" aria-label="Chapter ${c.number}">
    <div class="card chapter-head">
      <span class="eyebrow"><span class="icon fill">folder</span>Chapter ${c.number}</span>
      <h2>${esc(c.title)}</h2>
    </div>
    <nav class="list">${c.topics.map(t => {
      const isDone = solved.has(topicKey(t.id));
      return `<a class="list-item ${isDone ? "solved" : ""}" href="${appUrl(`/learn/${esc(t.id)}`)}" data-link>
        <span class="num">${isDone ? '<span class="icon fill">check</span>' : esc(t.id.replace("-", "."))}</span>
        <span>
          <span class="title">${esc(t.title)}</span>
          <span class="meta">${esc(t.summary)} ${isDone ? "· <b>Completed</b>" : ""}</span>
        </span>
        <span class="icon go">chevron_right</span>
      </a>`;
    }).join("")}</nav>
  </section>`;
}

// ---- Lesson Page ----
async function lessonPage(id) {
  const p = { name: SITE.name, url: appUrl("/") };
  setTitle("");
  if ("prerendered" in app.dataset) delete app.dataset.prerendered;
  else app.innerHTML = loading("Loading reverse engineering module");

  let chapters;
  try { chapters = await getChapters(); } catch (err) {
    app.innerHTML = page(header({ title: "Module Not Found" }), errorBox(err));
    return;
  }

  const all = chapters.flatMap(c => c.topics.map(t => ({ ...t, chapter: c })));
  const i = all.findIndex(t => t.id === id);
  if (i < 0) {
    app.innerHTML = page(header({ title: "No such lesson", below: `<div class="actions"><a class="btn btn-tonal" href="${p.url}" data-link>${p.name}</a></div>` }));
    return;
  }

  const topic = all[i], prev = all[i - 1], next = all[i + 1];
  let body;
  try {
    const res = await fetch(`${BASE}/lessons/${topic.file}`);
    if (!res.ok) throw new Error(`/lessons/${topic.file} returned ${res.status}`);
    body = await res.text();
  } catch (err) {
    body = errorBox(err);
  }

  const num = topic.id.replace("-", ".");
  setTitle(`${num} ${topic.title}`);
  const navLink = (t, dir) => `<a class="card lesson-nav ${dir}" href="${appUrl(`/learn/${esc(t.id)}`)}" data-link>
      <span class="meta">${dir === "prev" ? "Previous Topic" : "Next Topic"}</span>
      <span class="title">${esc(t.id.replace("-", "."))} ${esc(t.title)}</span>
    </a>`;

  app.innerHTML = page(
    header({
      above: `<div class="chips">
        <a class="chip" href="${p.url}" data-link><span class="icon">arrow_back</span>Home</a>
        <span class="chip">Chapter ${topic.chapter.number}: ${esc(topic.chapter.title)}</span>
      </div>`,
      title: `<span class="topic-num">${num}</span> ${esc(topic.title)}`,
    }),
    `${body.split(CHALLENGE_SLOT).map(part => `<article class="lesson">${part}</article>`).join(topic.challenge ? CHALLENGE_CARD : "")}
    ${topic.challenge && !body.includes(CHALLENGE_SLOT) ? CHALLENGE_CARD : ""}
    ${topic.challenge ? "" : MARK_CARD}
    <nav class="lesson-navs" aria-label="Topics">
      ${prev ? navLink(prev, "prev") : "<span></span>"}
      ${next ? navLink(next, "next") : `<a class="card lesson-nav next" href="${p.url}" data-link><span class="meta">Curriculum Complete</span><span class="title">Review all completed topics</span></a>`}
    </nav>`
  );

  // Initialize interactive widgets
  initFdeStepper();
  initRegisterSlicer();
  initBufferOverflowSim();
  initStackSim();
  initRopSim();

  if (topic.challenge && CHALLENGES[topic.challenge]) {
    startChallenge(app.querySelector(".challenge"), CHALLENGES[topic.challenge], topicKey(topic.id));
  } else {
    startMark(app.querySelector(".mark"), topicKey(topic.id));
  }
}

// ---- Interactive Widget Logic ----
function initFdeStepper() {
  const nextBtn = document.getElementById("fde-next-btn");
  const resetBtn = document.getElementById("fde-reset-btn");
  if (!nextBtn) return;

  const instructions = [
    { rip: "0x401000", bytes: "48 89 E5", inst: "mov rbp, rsp", explain: "Pointers aligned. Frame established.", line: "asm-0" },
    { rip: "0x401003", bytes: "48 83 EC 10", inst: "sub rsp, 0x10", explain: "RSP decremented by 16 bytes. Space reserved on stack.", line: "asm-1" },
    { rip: "0x401007", bytes: "B8 2A 00 00 00", inst: "mov eax, 42", explain: "Value 42 loaded into return register EAX (zero extends RAX!).", line: "asm-2" },
    { rip: "0x40100C", bytes: "C9", inst: "leave", explain: "Stack frame deconstructed: RSP = RBP, pops Saved RBP.", line: "asm-3" },
    { rip: "0x40100D", bytes: "C3", inst: "ret", explain: "Pops return address from [RSP] into RIP. Control returns to caller!", line: "asm-4" }
  ];

  let step = 0;
  const update = () => {
    const cur = instructions[step];
    document.getElementById("fde-rip").textContent = cur.rip;
    document.getElementById("fde-dec").textContent = cur.bytes;
    document.getElementById("fde-exec").textContent = cur.inst;
    document.getElementById("fde-msg").textContent = `Step ${step + 1} of ${instructions.length}: ${cur.explain}`;

    document.querySelectorAll(".asm-line").forEach(l => l.style.background = "none");
    const activeLine = document.getElementById(cur.line);
    if (activeLine) activeLine.style.background = "var(--primary-container)";
  };

  nextBtn.addEventListener("click", () => {
    step = (step + 1) % instructions.length;
    update();
  });
  resetBtn?.addEventListener("click", () => {
    step = 0;
    update();
  });
  update();
}

function initRegisterSlicer() {
  const track = document.getElementById("reg-bytes-track");
  if (!track) return;

  const bytes = ["00", "00", "7F", "FF", "DE", "AD", "BE", "EF"];
  const render = (highlightIdx = [], zeroedIdx = [], desc = "") => {
    for (let i = 0; i < 8; i++) {
      const cell = document.getElementById(`rb-${7 - i}`);
      if (cell) {
        cell.textContent = bytes[i];
        cell.className = "reg-byte-box" +
          (highlightIdx.includes(i) ? " highlight" : "") +
          (zeroedIdx.includes(i) ? " zeroed" : "");
      }
    }
    const valText = "0x" + bytes.join("");
    const exp = document.getElementById("reg-exp-text");
    if (exp) exp.textContent = desc || `Current RAX: ${valText}`;
  };

  document.getElementById("op-mov-al")?.addEventListener("click", () => {
    bytes[7] = "42"; // LSB
    render([7], [], "mov al, 0x42: AL modified. High 56 bits of RAX remain completely untouched!");
  });

  document.getElementById("op-mov-ax")?.addEventListener("click", () => {
    bytes[6] = "13";
    bytes[7] = "37";
    render([6, 7], [], "mov ax, 0x1337: AX (lower 16 bits) modified. Upper 48 bits remain untouched.");
  });

  document.getElementById("op-mov-eax")?.addEventListener("click", () => {
    bytes[0] = "00"; bytes[1] = "00"; bytes[2] = "00"; bytes[3] = "00"; // Upper 32 bits ZEROED!
    bytes[4] = "CA"; bytes[5] = "FE"; bytes[6] = "BA"; bytes[7] = "BE";
    render([4, 5, 6, 7], [0, 1, 2, 3], "CRITICAL QUIRK: mov eax, 0xCAFEBABE automatically zero-extends into bits 63:32! Upper 32 bits are wiped to 0!");
  });

  document.getElementById("op-xor-rax")?.addEventListener("click", () => {
    for (let i = 0; i < 8; i++) bytes[i] = "00";
    render([], [0,1,2,3,4,5,6,7], "xor rax, rax: All 64 bits cleared to zero. RAX = 0x0000000000000000.");
  });

  document.getElementById("op-reset-rax")?.addEventListener("click", () => {
    const def = ["00", "00", "7F", "FF", "DE", "AD", "BE", "EF"];
    for (let i = 0; i < 8; i++) bytes[i] = def[i];
    render([], [], "Reset to default test address: 0x00007FFFDEADBEEF.");
  });
}

function initBufferOverflowSim() {
  const bar = document.getElementById("overflow-cells-bar");
  if (!bar) return;

  const msg = document.getElementById("overflow-msg");
  const badge = document.getElementById("overflow-status-badge");
  const cells = bar.querySelectorAll(".overflow-byte");

  const reset = () => {
    cells.forEach((c, idx) => {
      if (idx < 16) { c.className = "overflow-byte safe"; c.textContent = "00"; }
      else if (idx < 24) { c.className = "overflow-byte saved-rbp"; c.textContent = "BP"; }
      else { c.className = "overflow-byte"; c.textContent = "IP"; }
    });
    if (badge) { badge.className = "badge-sec off"; badge.textContent = "STATE: NORMAL"; }
    if (msg) msg.textContent = "Buffer is uncorrupted. Memory integrity intact.";
  };

  document.getElementById("btn-send-16")?.addEventListener("click", () => {
    reset();
    for (let i = 0; i < 16; i++) {
      cells[i].textContent = "41";
      cells[i].className = "overflow-byte safe";
    }
    if (badge) { badge.className = "badge-sec on"; badge.textContent = "STATE: BOUNDS SAFE"; }
    if (msg) msg.textContent = "Sent 16 bytes: Buffer is full, but Stopped exactly at boundary. Saved RBP and RIP are safe!";
  });

  document.getElementById("btn-send-24")?.addEventListener("click", () => {
    reset();
    for (let i = 0; i < 16; i++) { cells[i].textContent = "41"; }
    for (let i = 16; i < 24; i++) {
      cells[i].textContent = "42";
      cells[i].className = "overflow-byte saved-rbp";
    }
    if (badge) { badge.className = "badge-sec off"; badge.textContent = "STATE: RBP CORRUPTED"; }
    if (msg) msg.textContent = "Sent 24 bytes: Buffer overflowed into Saved Frame Pointer (RBP). Function will crash or misbehave on leave!";
  });

  document.getElementById("btn-send-32")?.addEventListener("click", () => {
    reset();
    for (let i = 0; i < 16; i++) { cells[i].textContent = "41"; }
    for (let i = 16; i < 24; i++) { cells[i].textContent = "42"; }
    for (let i = 24; i < 32; i++) {
      cells[i].textContent = "13";
      cells[i].className = "overflow-byte smashed-rip";
    }
    if (badge) { badge.className = "badge-sec on"; badge.textContent = "STATE: RIP HIJACKED!"; }
    if (msg) msg.innerHTML = "<b>RETURN ADDRESS OVERWRITTEN!</b> On <code>RET</code>, CPU pops <code>0x1313131313131313</code> into <code>RIP</code>. Arbitrary Control Flow Achieved!";
  });

  document.getElementById("btn-reset-overflow")?.addEventListener("click", reset);
}

function initStackSim() {
  const container = document.getElementById("stack-frame-display");
  const pushBtn = document.getElementById("btn-stack-push");
  const popBtn = document.getElementById("btn-stack-pop");
  const resetBtn = document.getElementById("btn-stack-reset");
  const expText = document.getElementById("stack-exp-text");
  if (!container || !pushBtn) return;

  const defaultItems = [
    { addr: 0x7fffffffe028, text: "[ Return Address: 0x4011bd ]", cls: "ret", ptr: "&larr; Caller Return" },
    { addr: 0x7fffffffe020, text: "[ Saved RBP: 0x7fffffffe050 ]", cls: "rbp", ptr: "&larr; RBP (Base)" },
    { addr: 0x7fffffffe018, text: "[ Local Var: buffer[8..15] ]", cls: "local", ptr: "" },
    { addr: 0x7fffffffe010, text: "[ Local Var: buffer[0..7] ]", cls: "local", ptr: "&larr; RSP (Top)" }
  ];

  let items = [...defaultItems];

  const render = () => {
    container.innerHTML = items.map((it, idx) => {
      const isTop = idx === items.length - 1;
      const ptrLabel = isTop ? "&larr; RSP (Top)" : (it.cls === "rbp" ? "&larr; RBP (Base)" : (it.cls === "ret" ? "&larr; Caller Return" : ""));
      return `<div class="stack-row-item">
        <span class="stack-addr">0x${it.addr.toString(16)}</span>
        <div class="stack-slot ${it.cls}">${esc(it.text)}</div>
        <span class="stack-ptr">${ptrLabel}</span>
      </div>`;
    }).join("");
    const top = items[items.length - 1];
    if (expText && top) {
      expText.innerHTML = `<code>RSP</code> points to <code>0x${top.addr.toString(16)}</code>. Stack depth: <b>${items.length} slots</b> (${items.length * 8} bytes).`;
    }
  };

  pushBtn.addEventListener("click", () => {
    if (items.length >= 8) {
      if (expText) expText.textContent = "Stack frame limit reached for this simulation.";
      return;
    }
    const topAddr = items[items.length - 1].addr;
    const newAddr = topAddr - 8;
    items.push({ addr: newAddr, text: `[ Pushed: 0x1337 ]`, cls: "local", ptr: "&larr; RSP (Top)" });
    render();
  });

  popBtn.addEventListener("click", () => {
    if (items.length <= 1) {
      if (expText) expText.textContent = "Cannot pop further: stack frame base reached!";
      return;
    }
    const popped = items.pop();
    render();
    if (expText) {
      expText.innerHTML = `Popped <code>${esc(popped.text)}</code> from <code>0x${popped.addr.toString(16)}</code> into <code>RAX</code>. <code>RSP</code> increased by 8 bytes.`;
    }
  });

  resetBtn?.addEventListener("click", () => {
    items = [...defaultItems];
    render();
  });
}

function initRopSim() {
  const stepBtn = document.getElementById("btn-rop-step");
  const resetBtn = document.getElementById("btn-rop-reset");
  const ripVal = document.getElementById("rop-val-rip");
  const rspVal = document.getElementById("rop-val-rsp");
  const regsVal = document.getElementById("rop-val-regs");
  const msg = document.getElementById("rop-exp-msg");
  const badge = document.getElementById("rop-shell-badge");
  if (!stepBtn) return;

  const steps = [
    {
      rip: "0x401800",
      rsp: "0x7fffffffe000",
      regs: "RDI=0 | RAX=0",
      msg: "At Gadget 1 (<code>pop rdi; ret</code>). Click Step ROP Chain to execute <code>pop rdi</code>.",
      activeLine: "rop-line-0",
      badgeCls: "off",
      badgeText: "SHELL: STANDBY"
    },
    {
      rip: "0x401850",
      rsp: "0x7fffffffe010",
      regs: "RDI=0x402008 | RAX=0",
      msg: "Executed <code>pop rdi</code> (consumed string pointer) &amp; <code>ret</code>. RIP is now at Gadget 2 (<code>pop rax; ret</code>)!",
      activeLine: "rop-line-2",
      badgeCls: "off",
      badgeText: "SHELL: STANDBY"
    },
    {
      rip: "0x401890",
      rsp: "0x7fffffffe020",
      regs: "RDI=0x402008 | RAX=0x3B",
      msg: "Executed <code>pop rax</code> (loaded 59 = sys_execve) &amp; <code>ret</code>. RIP is now at <code>syscall</code>!",
      activeLine: "rop-line-4",
      badgeCls: "on",
      badgeText: "SYSCALL READY"
    },
    {
      rip: "KERNEL",
      rsp: "0x7fffffffe028",
      regs: "RDI='/bin/sh' | RAX=59",
      msg: "<b>BOOM!</b> <code>syscall</code> executed: Kernel dispatched <code>sys_execve('/bin/sh', NULL, NULL)</code>. <b>Interactive Root Shell Spawned!</b>",
      activeLine: "rop-line-4",
      badgeCls: "on",
      badgeText: "ROOT SHELL SPAWNED!"
    }
  ];

  let current = 0;
  const render = () => {
    const s = steps[current];
    if (ripVal) ripVal.textContent = s.rip;
    if (rspVal) rspVal.textContent = s.rsp;
    if (regsVal) regsVal.textContent = s.regs;
    if (msg) msg.innerHTML = s.msg;
    if (badge) {
      badge.className = `badge-sec ${s.badgeCls}`;
      badge.textContent = s.badgeText;
    }
    for (let i = 0; i < 5; i++) {
      const line = document.getElementById(`rop-line-${i}`);
      if (line) line.style.background = (s.activeLine === `rop-line-${i}`) ? "var(--primary-container)" : "none";
    }
  };

  stepBtn.addEventListener("click", () => {
    current = (current + 1) % steps.length;
    render();
  });
  resetBtn?.addEventListener("click", () => {
    current = 0;
    render();
  });
  render();
}

// ---- End-of-Topic Interactive Challenges ----
const clean = a => String(a || "").trim().toLowerCase().replace(/\s+/g, "");

const QUESTION = {
  text: (prompt, checkFn, answerDesc, mode = "text") => ({
    html: `<div class="hex-q wide"><code>?</code></div>`,
    prompt,
    mode,
    check: a => checkFn(clean(a)),
    answer: answerDesc
  })
};

const CHALLENGES = {
  "fde-cycle": {
    title: "Instruction Pointer & Pipeline Mastery",
    intro: "Answer each question accurately to verify your comprehension of the CPU Instruction Cycle.",
    make: () => [
      QUESTION.text(
        "Which 64-bit register holds the address of the next instruction to execute on x86_64?",
        a => a === "rip" || a === "%rip",
        "The 64-bit Instruction Pointer register is <code>RIP</code>."
      ),
      QUESTION.text(
        "If RIP is 0x401000 and executes a 3-byte instruction (48 89 E5), what is the new value of RIP in hex?",
        a => a === "0x401003" || a === "401003",
        "0x401000 + 3 bytes = <code>0x401003</code>."
      ),
      QUESTION.text(
        "Which stage of the Fetch-Decode-Execute cycle translates raw opcodes into micro-operations (μops)?",
        a => a === "decode" || a === "id",
        "The <code>Decode</code> (Instruction Decode) stage parses opcodes into micro-ops."
      )
    ]
  },
  "register-slicing": {
    title: "Register Slicing & Zero-Extension",
    intro: "Test your mastery over x86_64 register sub-slices and the 32-bit zero extension quirk.",
    make: () => [
      QUESTION.text(
        "What is the name of the lower 32-bit sub-register of RAX?",
        a => a === "eax" || a === "%eax",
        "The lower 32-bit slice of RAX is <code>EAX</code>."
      ),
      QUESTION.text(
        "What is the name of the 8-bit least significant byte of RAX?",
        a => a === "al" || a === "%al",
        "The lowest 8 bits of RAX are held in <code>AL</code>."
      ),
      QUESTION.text(
        "When 'mov eax, 0x1234' executes, what happens to the upper 32 bits of RAX? (write 'zeroed' or 'untouched')",
        a => a === "zeroed" || a === "zero" || a === "cleared" || a === "zeroes",
        "Writing to any 32-bit register automatically <code>zeroes</code> the upper 32 bits of RAX!"
      )
    ]
  },
  "virtual-paging": {
    title: "Virtual Memory & Paging Verification",
    intro: "Verify your understanding of page tables, permissions, and the NX bit.",
    make: () => [
      QUESTION.text(
        "What is the standard memory page size in bytes on modern x86_64 architectures?",
        a => a === "4096" || a === "4kb" || a === "4096bytes",
        "The standard page size is <code>4096</code> bytes (4 KB)."
      ),
      QUESTION.text(
        "Which bit in an x86_64 Page Table Entry marks a page non-executable to stop shellcode injection?",
        a => a === "nx" || a === "xd" || a === "no-execute" || a === "63",
        "The <code>NX</code> (No-Execute) / XD (Execute-Disable) bit (bit 63) stops execution."
      ),
      QUESTION.text(
        "Which CPU control register anchors the PML4 page table base address?",
        a => a === "cr3" || a === "%cr3",
        "The CPU register holding the PML4 base is <code>CR3</code>."
      )
    ]
  },
  "stack-frames": {
    title: "Stack Geometry & ABI Conventions",
    intro: "Confirm your understanding of stack growth and calling conventions.",
    make: () => [
      QUESTION.text(
        "As values are pushed onto the stack in x86_64, does RSP increase or decrease? (write 'increase' or 'decrease')",
        a => a === "decrease" || a === "decreases" || a === "down",
        "The stack grows towards lower memory, so RSP <code>decreases</code>."
      ),
      QUESTION.text(
        "In Linux x86_64 System V ABI, which register holds the 1st function argument?",
        a => a === "rdi" || a === "%rdi",
        "The 1st function argument is passed in <code>RDI</code>."
      ),
      QUESTION.text(
        "Which assembly instruction is equivalent to popping the top 8 bytes of the stack into RIP?",
        a => a === "ret" || a === "retq",
        "The <code>ret</code> instruction pops 8 bytes from [RSP] directly into RIP."
      )
    ]
  },
  "binary-headers": {
    title: "Binary Headers & Dynamic Linking",
    intro: "Identify binary magic signatures and dynamic resolution tables.",
    make: () => [
      QUESTION.text(
        "What are the 4 magic bytes starting an ELF binary in ASCII? (e.g. .ELF)",
        a => a === ".elf" || a === "\\x7felf" || a === "7f454c46" || a === "elf",
        "The ELF magic is <code>.ELF</code> (<code>0x7f 0x45 0x4c 0x46</code>)."
      ),
      QUESTION.text(
        "What are the 2 initial magic bytes of every Windows PE binary? (ASCII)",
        a => a === "mz",
        "The DOS stub header begins with <code>MZ</code> (Mark Zbikowski)."
      ),
      QUESTION.text(
        "Which table in an ELF binary holds writable function pointers resolved by the dynamic linker?",
        a => a === "got" || a === ".got" || a === ".got.plt" || a === "globaloffsettable",
        "The <code>GOT</code> (Global Offset Table) holds the resolved function pointers."
      )
    ]
  },
  "opcode-decode": {
    title: "Opcode Mechanics & Disassembly",
    intro: "Identify standard opcode hex bytes used in reverse engineering.",
    make: () => [
      QUESTION.text(
        "What is the 1-byte hex opcode for the software breakpoint instruction (INT 3)?",
        a => a === "0xcc" || a === "cc",
        "INT 3 is opcode <code>0xCC</code>."
      ),
      QUESTION.text(
        "What is the 1-byte hex opcode for NOP (No Operation)?",
        a => a === "0x90" || a === "90",
        "NOP is opcode <code>0x90</code>."
      ),
      QUESTION.text(
        "What is the 1-byte hex opcode for RET (Return)?",
        a => a === "0xc3" || a === "c3",
        "RET is opcode <code>0xC3</code>."
      )
    ]
  },
  "cfg-logic": {
    title: "Control Flow Logic Deconstruction",
    intro: "Verify your ability to interpret basic blocks and jump logic.",
    make: () => [
      QUESTION.text(
        "What do we call a sequence of instructions with exactly one entry point and one exit point?",
        a => a === "basicblock" || a === "block",
        "A single-entry, single-exit sequence is a <code>Basic Block</code>."
      ),
      QUESTION.text(
        "What C decision structure is implemented in assembly as an indirect jump through an array of addresses?",
        a => a === "switch" || a === "jumptable" || a === "switchcase",
        "A dense <code>switch</code> statement is compiled into an indirect Jump Table."
      ),
      QUESTION.text(
        "What is the 1-byte hex opcode for JNE (Jump if Not Equal)?",
        a => a === "0x75" || a === "75",
        "JNE short jump is opcode <code>0x75</code>."
      )
    ]
  },
  "static-triage": {
    title: "Static Triage & Cryptographic Detection",
    intro: "Test your static analysis indicators.",
    make: () => [
      QUESTION.text(
        "A Shannon entropy value above what score (out of 8.0) strongly indicates packing or encryption?",
        a => Number(a) >= 7.0 && Number(a) <= 8.0,
        "Shannon entropy above <code>7.2</code> indicates packed or encrypted content."
      ),
      QUESTION.text(
        "Which Windows API function is commonly used to allocate executable (RWX) memory for shellcode?",
        a => a === "virtualalloc",
        "<code>VirtualAlloc</code> with PAGE_EXECUTE_READWRITE is commonly used."
      ),
      QUESTION.text(
        "Which symmetric block cipher is identified by an S-box starting with 63 7C 77 7B?",
        a => a === "aes" || a === "rijndael",
        "That is the substitution box for <code>AES</code> (Rijndael)."
      )
    ]
  },
  "debugger-mechanics": {
    title: "Debugger Traps & Hardware Registers",
    intro: "Confirm your understanding of how debuggers control target processes.",
    make: () => [
      QUESTION.text(
        "Which byte does a debugger write into memory to set a software breakpoint?",
        a => a === "0xcc" || a === "cc",
        "A debugger writes <code>0xCC</code> (INT 3)."
      ),
      QUESTION.text(
        "Which dedicated hardware CPU registers (DR0 through DR3) allow breakpoints without modifying memory?",
        a => a === "debugregisters" || a === "dr" || a === "dr0-dr3" || a === "dr0" || a === "hardware",
        "The CPU's <code>Debug Registers (DR0-DR3)</code> set hardware breakpoints."
      ),
      QUESTION.text(
        "Which bit in RFLAGS is enabled by debuggers to execute one single instruction at a time?",
        a => a === "tf" || a === "trapflag" || a === "trap",
        "The <code>Trap Flag (TF)</code> forces single-step execution."
      )
    ]
  },
  "anti-debug": {
    title: "Anti-Reverse Engineering Tactics",
    intro: "Detect common evasion methods in malware and protected binaries.",
    make: () => [
      QUESTION.text(
        "In the Windows PEB, what is the name of the byte flag checked by IsDebuggerPresent()?",
        a => a === "beingdebugged",
        "The flag is <code>PEB.BeingDebugged</code>."
      ),
      QUESTION.text(
        "In Linux, which field in /proc/self/status reveals the PID of an attached debugger?",
        a => a === "tracerpid",
        "The field is <code>TracerPid</code>."
      ),
      QUESTION.text(
        "Which assembly instruction measures elapsed CPU clock cycles for timing checks?",
        a => a === "rdtsc" || a === "rdtscp",
        "The <code>rdtsc</code> instruction reads the CPU timestamp counter."
      )
    ]
  },
  "stack-smashing": {
    title: "Stack Overflow & Control Flow Hijack",
    intro: "Calculate exact stack offsets to control RIP.",
    make: () => [
      QUESTION.text(
        "If a stack buffer is 16 bytes and Saved RBP is 8 bytes, how many bytes of input reach the Return Address?",
        a => a === "24" || a === "24bytes",
        "16 bytes buffer + 8 bytes RBP = <code>24</code> bytes to reach RIP."
      ),
      QUESTION.text(
        "What pattern type (like Aa0Aa1Aa2...) is generated to calculate exact RIP offsets without guessing?",
        a => a === "cyclic" || a === "cyclicpattern" || a === "debruijn",
        "A <code>cyclic</code> (De Bruijn) pattern gives exact offsets."
      ),
      QUESTION.text(
        "What signal is raised in Linux when a program attempts to execute unmapped memory?",
        a => a === "sigsegv" || a === "segfault" || a === "11",
        "The signal is <code>SIGSEGV</code> (Segmentation Fault)."
      )
    ]
  },
  "mitigation-matrix": {
    title: "Mitigation Matrix & Countermeasures",
    intro: "Match modern exploit defenses with their mechanics.",
    make: () => [
      QUESTION.text(
        "Which defense marks the stack and heap as non-executable?",
        a => a === "nx" || a === "dep" || a === "nx/dep",
        "<code>NX</code> (No-Execute) / DEP enforces W^X memory permissions."
      ),
      QUESTION.text(
        "What is the value of the least significant byte of a Linux stack canary?",
        a => a === "0x00" || a === "00" || a === "0" || a === "null",
        "The lowest byte is always <code>0x00</code> (a null byte)."
      ),
      QUESTION.text(
        "Which compiler flag randomizes the base address of the main executable binary in memory?",
        a => a === "pie",
        "<code>PIE</code> (Position Independent Executable) randomizes code base addresses."
      )
    ]
  },
  "rop-gadgets": {
    title: "Return-Oriented Programming Mastery",
    intro: "Order gadgets and registers for an execve ROP chain.",
    make: () => [
      QUESTION.text(
        "What instruction must every ROP gadget conclude with?",
        a => a === "ret" || a === "retq" || a === "c3",
        "Every gadget ends in a <code>ret</code> instruction."
      ),
      QUESTION.text(
        "In Linux x86_64 calling conventions, which register holds the 1st argument (the string '/bin/sh') for execve?",
        a => a === "rdi" || a === "%rdi",
        "The 1st argument is passed in <code>RDI</code>."
      ),
      QUESTION.text(
        "What is the syscall number in RAX for sys_execve on Linux x86_64? (decimal or hex 0x3b)",
        a => a === "59" || a === "0x3b" || a === "3b",
        "Syscall <code>59</code> (<code>0x3B</code>) invokes <code>sys_execve</code>."
      )
    ]
  }
};

const CHALLENGE_SLOT = '<div class="challenge-slot"></div>';
const CHALLENGE_CARD = `<section class="card challenge" aria-label="Challenge">
  <span class="eyebrow"><span class="icon fill">bolt</span>Practical Challenge</span>
  <h2></h2>
  <p class="intro"></p>
  <div class="rounds" aria-hidden="true"></div>
  <form class="challenge-form" autocomplete="off">
    <div class="question"></div>
    <label class="prompt" for="challenge-answer"></label>
    <div class="flag-row">
      <input id="challenge-answer" type="text" spellcheck="false" autocapitalize="off" required>
      <button class="btn btn-filled" type="submit"><span class="icon">check</span>Submit Answer</button>
    </div>
  </form>
  <p class="challenge-msg" aria-live="polite"></p>
  <div class="actions again" hidden><button class="btn btn-tonal" type="button"><span class="icon">replay</span>Practice Again</button></div>
</section>`;

function startChallenge(card, c, key) {
  if (!card) return;
  const form = card.querySelector("form");
  const input = card.querySelector("input");
  const msg = card.querySelector(".challenge-msg");
  const again = card.querySelector(".again");
  card.querySelector("h2").textContent = c.title;
  card.querySelector(".intro").textContent = c.intro;
  let questions, round;

  const showRound = () => {
    const q = questions[round];
    card.querySelector(".rounds").innerHTML = questions
      .map((_, i) => `<span class="${i < round ? "done" : i === round ? "now" : ""}"></span>`).join("");
    card.querySelector(".question").innerHTML = q.html;
    card.querySelector(".prompt").textContent = q.prompt;
    input.inputMode = q.mode;
    input.value = "";
  };
  const focus = () => input.focus();
  const restart = () => { questions = c.make(); round = 0; showRound(); };
  const complete = (fresh) => {
    card.classList.add("completed");
    form.hidden = true;
    again.hidden = false;
    card.querySelector(".rounds").innerHTML = "";
    msg.innerHTML = `<span class="icon fill">check_circle</span><span>${fresh ? `All ${questions.length} questions correct! ` : ""}Module mastered. Progress saved locally.</span>`;
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const q = questions[round];
    if (q.check(input.value)) {
      msg.textContent = "";
      card.classList.remove("wrong");
      if (++round < questions.length) return showRound();
      const saved = setSolved(key, true);
      complete(true);
      if (!saved) msg.textContent = `All right, but browser local storage is blocked.`;
      return;
    }
    card.classList.remove("wrong");
    void card.offsetWidth;
    card.classList.add("wrong");
    msg.innerHTML = `Not quite: ${q.answer}. Generating new attempt...`;
    restart();
    focus();
  });

  again.querySelector("button").addEventListener("click", () => {
    card.classList.remove("completed", "wrong");
    form.hidden = false;
    again.hidden = true;
    msg.textContent = "";
    restart();
    focus();
  });

  restart();
  if (solvedSet().has(key)) complete(false);
}

const MARK_CARD = `<section class="card challenge mark" aria-label="Progress">
  <span class="eyebrow"><span class="icon fill">flag</span>Done Reading?</span>
  <p class="challenge-msg" aria-live="polite"></p>
  <div class="actions"><button class="btn btn-filled" type="button"></button></div>
</section>`;

function startMark(card, key) {
  if (!card) return;
  const msg = card.querySelector(".challenge-msg");
  const btn = card.querySelector("button");
  const show = (done) => {
    card.classList.toggle("completed", done);
    btn.className = `btn ${done ? "btn-tonal" : "btn-filled"}`;
    btn.innerHTML = done ? '<span class="icon">undo</span>Mark incomplete' : '<span class="icon">check</span>Mark completed';
    msg.innerHTML = done ? '<span class="icon fill">check_circle</span><span>Module completed. Progress saved.</span>' : "";
  };
  btn.addEventListener("click", () => {
    const done = !solvedSet().has(key);
    if (!setSolved(key, done)) { msg.textContent = "Local storage is disabled."; return; }
    show(done);
  });
  show(solvedSet().has(key));
}

// ---- Dark / Light Theme Manager ----
const THEME_KEY = "lazarus:theme";
const darkQuery = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (document.documentElement.dataset.theme ?? (darkQuery.matches ? "dark" : "light")) === "dark";
const themeBtn = document.querySelector(".theme");
function showTheme() {
  if (!themeBtn) return;
  const label = `Switch to ${isDark() ? "light" : "dark"} theme`;
  themeBtn.innerHTML = `<span class="icon">${isDark() ? "light_mode" : "dark_mode"}</span>`;
  themeBtn.setAttribute("aria-label", label);
  themeBtn.title = label;
  const color = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.content = color);
}
themeBtn?.addEventListener("click", () => {
  const t = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch {}
  showTheme();
});
darkQuery.addEventListener("change", showTheme);
showTheme();

// ---- Router ----
function render() {
  let path = location.pathname;
  // If running in subfolder, strip base
  if (BASE && path.startsWith(BASE)) {
    path = path.slice(BASE.length);
  }
  path = path.replace(/\/+$/, "") || "/";

  // Support hash routing fallback (#/learn/1-1)
  if (location.hash && location.hash.startsWith("#/")) {
    path = location.hash.slice(1).replace(/\/+$/, "") || "/";
  }

  // Handle direct .html requests like learn/1-1.html
  const directHtml = path.match(/learn\/(\d+-\d+)(?:\.html)?$/);
  if (directHtml) {
    window.scrollTo(0, 0);
    return lessonPage(directHtml[1]);
  }

  const lesson = path.match(/^\/learn\/(\d+-\d+)$/);
  window.scrollTo(0, 0);
  if (path === "/" || path === "/index.html") return homePage();
  if (lesson) return lessonPage(lesson[1]);

  setTitle("Not found");
  app.innerHTML = page(header({ title: "Page Not Found", below: `<div class="actions"><a class="btn btn-tonal" href="${appUrl("/")}" data-link>Back to Curriculum</a></div>` }));
}

document.addEventListener("click", e => {
  const a = e.target.closest("a[data-link]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const href = a.getAttribute("href");
  if (href !== location.pathname) history.pushState(null, "", href);
  render();
});
addEventListener("popstate", render);
render();
