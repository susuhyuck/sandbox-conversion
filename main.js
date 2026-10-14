/* 예외는 어떻게 규범이 되는가 — 부록 렌더링 (의존성 없음, 데이터: data.js)
   모든 그림은 실제 표시 폭으로 그린다(글자가 화면에서 제 크기로 보이도록). 폭이 바뀌면 다시 그린다. */
(function () {
  "use strict";
  const D = window.DATA, M = D.meta;
  const NS = "http://www.w3.org/2000/svg";
  const C = { green: "#1f6b45", orange: "#eb6834", gray: "#898781", ink: "#111111", ink2: "#3a3936",
    muted: "#6b6963", grid: "#ebe8e0", light: "#d9d6cd", band: "#d5d2c9" };
  // 범주 색(포스터와 같게 주관부처 단독은 주황). 흑백 구분용 선 모양 병행.
  const COL = {
    x1_level: { 1: C.green, 2: C.orange, 3: C.gray },
    x2_struct: { 0: C.orange, 1: C.green, 2: C.gray },
    x3_ban: { 0: C.orange, 1: C.green },
    x4_t: { 1: C.gray, 2: C.orange, 3: C.green },
  };
  const DASH = ["", "7 4", "2 4"], LINE = ["solid", "dashed", "dotted"];
  const L1 = D.vars.x1_level.labels, L2 = D.vars.x2_struct.labels, L3 = D.vars.x3_ban.labels;
  const vars4 = ["x1_level", "x2_struct", "x3_ban", "x4_t"];
  const $ = (s) => document.querySelector(s);
  const narrow = () => window.innerWidth < 640;
  const p3 = (p) => (p < 0.001 ? "< .001" : p.toFixed(3).replace(/^0/, ""));
  const pct = (x, k = 1) => (100 * x).toFixed(k) + "%";
  const f2 = (x) => x.toFixed(2);
  const star = (p) => (p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : p < 0.1 ? "†" : "");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const strip = (h) => String(h).replace(/<[^>]+>/g, "").trim();
  const ymd = (s) => s.replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, "$1. $2. $3.");
  const by = Object.fromEntries(D.units.map((u) => [u.id, u]));
  const LAST_EFF = D.units.filter((u) => u.ev).map((u) => u.eff).sort().pop();

  // ---------- SVG 도우미
  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svg(box, w, h, label) { const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label }); box.appendChild(s); return s; }
  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const txt = (p, x, y, s, a) => el("text", Object.assign({ x, y, "font-size": 12, fill: C.muted }, a || {}), p, s);
  const halo = { "paint-order": "stroke", stroke: "#fff", "stroke-width": 4, "stroke-linejoin": "round" };
  const cut = (s, n) => (s.length > n ? s.slice(0, Math.max(1, n - 1)) + "…" : s);

  // ---------- 툴팁: 마우스는 따라다니고, 터치는 누르면 화면 아래 카드로 뜬다
  const tip = $("#tip");
  let tipClear = null;
  function showTip(html, ev, clear) {
    if (tipClear && tipClear !== clear) tipClear();
    tipClear = clear || null;
    tip.innerHTML = html;
    tip.style.visibility = "visible"; tip.style.opacity = 1;
    if (narrow() || ev.pointerType === "touch") { tip.classList.add("sheet"); return; }
    tip.classList.remove("sheet");
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  }
  function hideTip() {
    tip.style.opacity = 0; tip.style.visibility = "hidden";
    if (tipClear) { const c = tipClear; tipClear = null; c(); }
  }
  document.addEventListener("click", hideTip);
  addEventListener("scroll", () => { if (tip.classList.contains("sheet") && tip.style.visibility === "visible") hideTip(); }, { passive: true });
  function mark(node, html, on, off) {
    node.style.cursor = "pointer";
    const clear = () => { if (off) off(); };
    const show = (e) => { if (on) on(); showTip(typeof html === "function" ? html() : html, e, clear); };
    node.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") show(e); });
    node.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
    node.addEventListener("click", (e) => { e.stopPropagation(); show(e); });
  }
  // 십자선형(생존곡선·관찰 기간): 위치에 따라 내용이 바뀐다. 세로 스크롤은 그대로 둔다.
  function track(hit, s, W, H, at, clear) {
    hit.style.touchAction = "pan-y";
    hit.style.cursor = "crosshair";
    const go = (e) => {
      const r = s.getBoundingClientRect(), html = at(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
      if (html) showTip(html, e, clear); else hideTip();
    };
    hit.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.pressure > 0) go(e); });
    hit.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hideTip(); });
    hit.addEventListener("click", (e) => { e.stopPropagation(); go(e); });
  }

  // ---------- 그림 등록과 폭 변화 시 다시 그리기
  const charts = [];
  function chart(box, fn) { charts.push({ box, fn, w: 0 }); }
  function drawAll() {
    charts.forEach((c) => {
      const w = Math.floor(c.box.getBoundingClientRect().width);
      if (!w || Math.abs(w - c.w) < 4) return;
      c.w = w; c.box.innerHTML = ""; c.fn(c.box, Math.max(150, w));
    });
    swipeHints();
  }

  // ---------- 표 도우미(모바일에서 카드형으로 바뀌도록 칸마다 이름표를 단다)
  function table(id, cols, rows, opt) {
    opt = opt || {};
    const t = $(id);
    t.classList.toggle("stack", !!opt.stack);
    t.classList.toggle("wide", !!opt.wide);
    t.classList.toggle("g3", !!opt.grid);
    const head = `<thead><tr>${cols.map((c) => `<th${c.n ? ' class="n"' : ""}>${c.t}</th>`).join("")}</tr></thead>`;
    const body = rows.map((r) => {
      if (r.sub) return `<tr class="sub"><td colspan="${cols.length}">${r.sub}</td></tr>`;
      const cells = Array.isArray(r) ? r : r.cells;
      let i = 0;
      const tds = cells.map((c) => {
        const o = c !== null && typeof c === "object" ? c : { h: c };
        const col = cols[i] || {}; i += o.span || 1;
        const cls = [col.n && !o.span ? "n" : "", col.cls || "", o.cls || ""].filter(Boolean).join(" ");
        const lab = esc(col.lab !== undefined ? col.lab : strip(col.t));
        return `<td${o.span ? ` colspan="${o.span}"` : ""}${cls ? ` class="${cls}"` : ""} data-label="${lab}"><span class="v">${o.h === undefined || o.h === null ? "" : o.h}</span></td>`;
      }).join("");
      return `<tr${r.tot ? ' class="tot"' : ""}>${tds}</tr>`;
    }).join("");
    t.innerHTML = head + `<tbody>${body}</tbody>`;
  }
  const col = (t, o) => Object.assign({ t }, o || {});
  function fold(id, n, noun) {
    const t = $(id), rows = [...t.tBodies[0].rows];
    if (rows.length <= n + 3) return;
    const wrap = t.closest(".tbl-wrap");
    const btn = document.createElement("button"); btn.type = "button"; btn.className = "more-btn";
    let open = false;
    const set = () => {
      rows.forEach((r, i) => { r.hidden = !open && i >= n; r.classList.toggle("lastv", !open && i === n - 1); });
      btn.textContent = open ? "접기" : `전체 ${rows.length}${noun} 보기 (${rows.length - n}${noun} 더)`;
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); open = !open; set(); if (!open) wrap.scrollIntoView({ block: "nearest" }); swipeHints(); });
    wrap.after(btn); set();
  }
  function swipeHints() {
    document.querySelectorAll(".tbl-wrap").forEach((w) => {
      let h = w.previousElementSibling;
      if (!h || !h.classList.contains("swipe")) { h = document.createElement("p"); h.className = "swipe"; h.textContent = "표를 옆으로 밀면 나머지 열이 보입니다 →"; w.before(h); }
      h.classList.toggle("show", w.scrollWidth > w.clientWidth + 2);
    });
  }

  // ===== 결과 요약
  (function () {
    const a = D.km.all, x2 = D.km.x2_struct.groups, g0 = x2.find((g) => g.code == 0), g1 = x2.find((g) => g.code == 1);
    $("#tiles").innerHTML = [
      [`${M.N}`, "분석 규제 과제", `승인 ${M.approvals}건 · 2019. 2.~2025. 8.`],
      [`${M.E}<small>건</small>`, "법령정비 전환", `전체 과제의 ${pct(M.E / M.N)}`],
      [pct(a.at[48].cum), "48개월 누적 전환율", `95% CI ${pct(a.at[48].lo)}–${pct(a.at[48].hi)}`],
      [`${pct(g0.at[48].cum)} <small>vs</small> ${pct(g1.at[48].cum)}`, "주관부처 단독 vs 타 부처 단독(48개월)", `log-rank p = ${p3(D.km.x2_struct.logrank.p)}`],
    ].map(([b, s, e]) => `<div class="tile"><b>${b}</b><span>${s}</span><em>${e}</em></div>`).join("");
    $("#hyp").innerHTML = [["H1", "입법형식 위계", "rej", "기각"], ["H2", "관할 구조", "rev", "기각(반대 방향 유의)"], ["H3", "규제 장벽 유형", "rej", "기각"],
      ["H4", "사회적 주목도", "na", "검증 불가"], ["H5", "주목도 × 법률", "na", "검증 불가"]]
      .map(([h, n, c, v]) => `<li><a href="#C"><b>${h}</b> ${n}</a><span class="mark ${c}">${v}</span></li>`).join("");
  })();

  // ===== 부록 A
  table("#tA1", [col("단계"), col("기준"), col("건수", { n: 1 }), col("제외")], [
    ["1", "규제샌드박스 통합포털 산업융합 승인 전체(2026. 10. 13. 수집)", M.portal_total, "—"],
    ["2", "특례 유형이 실증특례인 승인", M.portal_total - 83, "임시허가 63, 적극해석 등 20"],
    ["3", `관측 종료일(${ymd(M.end)}) 이전 승인`, M.approvals, "이후 승인 108"],
    { tot: 1, cells: ["4", "규제 과제(분석단위)", M.N, `전환 ${M.E} · 미전환 ${M.N - M.E}`] },
  ]);

  (function () {
    const rows = [];
    vars4.forEach((v) => {
      const m = D.vars[v];
      rows.push({ sub: `${m.h} ${m.name}` });
      D.km[v].groups.forEach((g) => rows.push([{ h: g.label, cls: "ind" }, g.n, g.e, pct(g.e / g.n), pct(g.at[24].cum), pct(g.at[48].cum), `<small>${pct(g.at[48].lo)}–${pct(g.at[48].hi)}</small>`]));
    });
    const a = D.km.all;
    rows.push({ tot: 1, cells: ["전체", a.n, a.e, pct(a.e / a.n), pct(a.at[24].cum), pct(a.at[48].cum), `<small>${pct(a.at[48].lo)}–${pct(a.at[48].hi)}</small>`] });
    table("#tA2", [col("변수·범주"), col("과제", { n: 1 }), col("전환", { n: 1 }), col("전환율", { n: 1 }), col("24개월 누적", { n: 1 }), col("48개월 누적", { n: 1 }), col("95% CI", { n: 1 })], rows);
  })();

  // 그림 A1: 변수마다 한 패널. 넓은 화면은 한 줄, 좁은 화면은 2열 또는 1열.
  const VERD = { x1_level: ["기각", C.muted], x2_struct: ["기각 · 반대 방향", "#9a3a12"], x3_ban: ["기각 · 비유의", C.muted], x4_t: ["검증 불가 · 기술용", C.muted] };
  vars4.forEach((v, vi) => {
    const box = document.createElement("div"); box.className = "chart"; $("#fA1").appendChild(box);
    chart(box, (b, W) => ratePanel(b, W, v, vi));
  });
  function ratePanel(box, W, v, vi) {
    const g = D.km[v].groups, m = D.vars[v], solo = innerWidth <= 960;
    const showY = vi === 0 || solo, left = showY ? 34 : 4, right = 6, top = 58, bot = 62, Hh = solo ? 290 : 370;
    const s = svg(box, W, Hh, `${m.name} 범주별 48개월 누적 전환율`), y = lin(0, 0.5, Hh - bot, top);
    el("text", { x: 0, y: 16, "font-weight": 800, "font-size": 14, fill: C.ink }, s, `${m.h} ${m.name}`);
    el("text", { x: 0, y: 35, "font-size": 12, "font-weight": 700, fill: VERD[v][1] }, s, `${VERD[v][0]} · log-rank p = ${p3(D.km[v].logrank.p)}`);
    [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((t) => {
      el("line", { x1: left, x2: W - right, y1: y(t), y2: y(t), class: "gridline" }, s);
      if (showY) txt(s, left - 6, y(t) + 4, Math.round(t * 100) + "%", { "text-anchor": "end", "font-size": 11 });
    });
    el("line", { x1: left, x2: W - right, y1: y(M.km48.cum), y2: y(M.km48.cum), stroke: C.gray, "stroke-dasharray": "4 4" }, s);
    const cx = (i) => left + ((W - left - right) * (i + 0.5)) / g.length;
    const up = v === "x4_t", ax1 = cx(0) - 8, ax2 = cx(g.length - 1) + 8;
    el("line", { x1: ax1, y1: up ? y(0.08) : y(0.42), x2: ax2, y2: up ? y(0.42) : y(0.08), stroke: C.band, "stroke-width": 12, "stroke-linecap": "round", opacity: 0.45 }, s);
    txt(s, up ? ax2 : ax1, y(0.42) - 12, "가설의 예상", { "text-anchor": up ? "end" : "start", "font-size": 11, fill: "#a29e93" });
    el("polyline", { points: g.map((d, i) => `${cx(i)},${y(d.at[48].cum)}`).join(" "), fill: "none", stroke: "#b9b5ab", "stroke-width": 1.5 }, s);
    g.forEach((d, i) => {
      const a = d.at[48], c = COL[v][d.code], gg = el("g", {}, s);
      el("line", { x1: cx(i), x2: cx(i), y1: y(Math.min(a.hi, 0.5)), y2: y(a.lo), stroke: c, "stroke-width": 2, opacity: 0.5 }, gg);
      el("circle", { cx: cx(i), cy: y(a.cum), r: 7, fill: c, stroke: "#fff", "stroke-width": 2 }, gg);
      el("text", Object.assign({ x: cx(i), y: y(a.cum) - 13, "text-anchor": "middle", "font-weight": 800, "font-size": 14, fill: C.ink }, halo), gg, pct(a.cum));
      el("rect", { x: cx(i) - 22, y: top - 6, width: 44, height: Hh - top - bot + 12, fill: "transparent" }, gg);
      el("text", { x: cx(i), y: Hh - bot + 19, "text-anchor": "middle", "font-size": 12.5, fill: C.ink2 }, s, d.label);
      txt(s, cx(i), Hh - bot + 35, `n=${d.n}`, { "text-anchor": "middle", "font-size": 11.5 });
      txt(s, cx(i), Hh - bot + 50, `전환 ${d.e}`, { "text-anchor": "middle", "font-size": 11.5 });
      mark(gg, `<b>${m.name} · ${d.label}</b><br>48개월 누적 전환 <b>${pct(a.cum)}</b><br><span class="k">95% CI</span> ${pct(a.lo)}–${pct(a.hi)} · <span class="k">24개월</span> ${pct(d.at[24].cum)}<br><span class="k">과제</span> ${d.n} · <span class="k">전환</span> ${d.e}`);
    });
  }

  // 그림 A2·A3: 넓으면 세로 막대, 좁으면 가로 막대
  function bars(box, W, rows, o) {
    box.insertAdjacentHTML("beforeend", `<div class="legend"><span><i class="sq" style="background:${C.green}"></i>전환</span><span><i class="sq" style="background:${C.light}"></i>미전환</span></div>`);
    const tipOf = (r) => `<b>${o.unit}${r.label}</b><br>과제 ${r.n} · 전환 <b>${r.e}</b> (${pct(r.e / r.n)})`;
    if (W < 470) {
      const rowH = 30, Lm = 64, R = 44, T = 4, Hh = T + rows.length * rowH + 30;
      const s = svg(box, W, Hh, o.label), x = lin(0, o.ymax, Lm, W - R);
      for (let t = 0; t <= o.ymax; t += o.step * 2) { el("line", { x1: x(t), x2: x(t), y1: T, y2: Hh - 26, class: "gridline" }, s); txt(s, x(t), Hh - 10, t, { "text-anchor": "middle" }); }
      rows.forEach((r, i) => {
        const yc = T + i * rowH + rowH / 2, g = el("g", {}, s);
        el("rect", { x: 0, y: yc - rowH / 2, width: W, height: rowH, fill: "transparent" }, g);
        el("rect", { x: Lm, y: yc - 8, width: Math.max(0, x(r.n) - Lm), height: 16, fill: C.light, rx: 3 }, g);
        if (r.e) el("rect", { x: Lm, y: yc - 8, width: x(r.e) - Lm, height: 16, fill: C.green, rx: 3 }, g);
        txt(s, Lm - 8, yc + 4, r.label, { "text-anchor": "end", fill: C.ink2, "font-size": 12.5 });
        el("text", { x: x(r.n) + 6, y: yc + 4, "font-size": 12, "font-weight": 700, fill: C.ink }, s, `${r.e}/${r.n}`);
        mark(g, tipOf(r));
      });
      return;
    }
    const Hh = 300, Lm = 36, R = 6, T = 22, B = 46;
    const s = svg(box, W, Hh, o.label), y = lin(0, o.ymax, Hh - B, T), bw = (W - Lm - R) / rows.length;
    for (let t = 0; t <= o.ymax; t += o.step) { el("line", { x1: Lm, x2: W - R, y1: y(t), y2: y(t), class: "gridline" }, s); txt(s, Lm - 7, y(t) + 4, t, { "text-anchor": "end" }); }
    rows.forEach((r, i) => {
      const cx = Lm + bw * (i + 0.5), w = Math.min(44, bw * 0.62), g = el("g", {}, s);
      el("rect", { x: cx - bw / 2, y: T, width: bw, height: Hh - T - B, fill: "transparent" }, g);
      el("rect", { x: cx - w / 2, y: y(r.n), width: w, height: y(0) - y(r.n), fill: C.light, rx: 3 }, g);
      if (r.e) el("rect", { x: cx - w / 2, y: y(r.e), width: w, height: y(0) - y(r.e), fill: C.green, rx: 3 }, g);
      el("text", { x: cx, y: y(r.n) - 7, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C.ink }, s, `${r.e}/${r.n}`);
      txt(s, cx, Hh - B + 18, r.label, { "text-anchor": "middle", fill: C.ink2 });
      mark(g, tipOf(r));
    });
    txt(s, (Lm + W - R) / 2, Hh - 6, o.xlab, { "text-anchor": "middle", "font-size": 12.5 });
  }
  const yearRows = D.years.map((d) => ({ label: String(d.year), n: d.n, e: d.e }));
  chart($("#fA2"), (b, W) => bars(b, W, yearRows, { ymax: 60, step: 10, label: "승인연도별 과제 수와 전환", unit: "", xlab: "최초 승인연도" }));
  const artRows = [[0, 0, "0"], [1, 9, "1–9"], [10, 49, "10–49"], [50, 99, "50–99"], [100, 499, "100–499"], [500, 999, "500–999"], [1000, 1e9, "1,000+"]]
    .map(([a, b, l]) => { const u = D.units.filter((d) => d.x4 >= a && d.x4 <= b); return { label: l, n: u.length, e: u.filter((d) => d.ev).length }; });
  chart($("#fA3"), (b, W) => bars(b, W, artRows, { ymax: 70, step: 10, label: "승인 전 기사 수 분포와 전환", unit: "기사 ", xlab: "승인 전 12개월 기사 수(건)" }));

  (function () {
    const cell = (n, e) => `${n} / ${e} <small class="pc">(${pct(e / n, 0)})</small>`;
    const rows = [0, 1, 2].map((a) => {
      const cs = [0, 1].map((b) => D.cross.find((d) => d.x2 === a && d.x3 === b));
      return [L2[a], ...cs.map((c) => cell(c.n, c.e)), cell(cs[0].n + cs[1].n, cs[0].e + cs[1].e)];
    });
    const colTot = [0, 1].map((b) => { const c = D.cross.filter((d) => d.x3 === b); return [c.reduce((s, d) => s + d.n, 0), c.reduce((s, d) => s + d.e, 0)]; });
    rows.push({ tot: 1, cells: ["계", ...colTot.map(([n, e]) => cell(n, e)), cell(M.N, M.E)] });
    table("#tA3", [col("관할 구조"), col(L3[0], { n: 1 }), col(L3[1], { n: 1 }), col("계", { n: 1 })], rows);
    table("#tA4", [col("변수 쌍"), col("Cramér's V", { n: 1 })], D.assoc.map((a) => [`${a.a} × ${a.b}`, a.v.toFixed(3).replace(/^0/, "")]));
  })();

  // ===== 부록 B
  function cumAt(steps, t) { let c = 0; for (const [tt, v] of steps) { if (tt <= t) c = v; else break; } return c; }
  function km(box, W, groups, o) {
    const Hh = o.H ? o.H(W) : Math.round(Math.min(330, Math.max(230, W * 0.62)));
    const Lm = 38, R = 12, T = 12, B = 40, tmax = 80, ymax = o.ymax || 0.4;
    const s = svg(box, W, Hh, o.label), x = lin(0, tmax, Lm, W - R), y = lin(0, ymax, Hh - B, T);
    for (let t = 0; t <= ymax + 1e-9; t += 0.1) { el("line", { x1: Lm, x2: W - R, y1: y(t), y2: y(t), class: "gridline" }, s); txt(s, Lm - 6, y(t) + 4, Math.round(t * 100) + "%", { "text-anchor": "end", "font-size": 11.5 }); }
    for (let t = 0; t <= 72; t += 12) txt(s, x(t), Hh - B + 17, t, { "text-anchor": "middle" });
    txt(s, (Lm + W - R) / 2, Hh - 4, "최초 승인 후 경과 개월", { "text-anchor": "middle" });
    el("line", { x1: Lm, x2: W - R, y1: Hh - B, y2: Hh - B, stroke: "#c9c5ba" }, s);
    groups.forEach((g, i) => {
      let d = `M${x(0)},${y(0)}`;
      g.steps.forEach(([t, v]) => { d += `H${x(Math.min(t, tmax))}V${y(v)}`; });
      d += `H${x(Math.min(Math.max(...g.censor, g.steps[g.steps.length - 1][0]), tmax))}`;
      el("path", { d, fill: "none", stroke: g.color, "stroke-width": 2.4, "stroke-dasharray": DASH[i] }, s);
      g.censor.forEach((t) => { const yy = y(cumAt(g.steps, t)); el("line", { x1: x(t), x2: x(t), y1: yy - 3.5, y2: yy + 3.5, stroke: g.color, opacity: 0.6 }, s); });
    });
    const vl = el("line", { y1: T, y2: Hh - B, stroke: C.ink, opacity: 0 }, s);
    const hit = el("rect", { x: Lm, y: T, width: W - Lm - R, height: Hh - T - B, fill: "transparent" }, s);
    track(hit, s, W, Hh, (px) => {
      const t = Math.max(0, Math.min(tmax, ((px - Lm) / (W - Lm - R)) * tmax));
      vl.setAttribute("x1", x(t)); vl.setAttribute("x2", x(t)); vl.setAttribute("opacity", 0.3);
      return `<b>${t.toFixed(0)}개월 시점 누적 전환</b>` + groups.map((g) => `<div class="row"><span><span class="sw" style="background:${g.color}"></span>${g.label}</span><b>${pct(cumAt(g.steps, t))}</b></div>`).join("");
    }, () => vl.setAttribute("opacity", 0));
  }
  (function () {
    const a = D.km.all, box = $("#fB1");
    box.insertAdjacentHTML("beforebegin", `<p class="panel-sub">N = ${a.n}, 전환 ${a.e} · 12개월 ${pct(a.at[12].cum)} · 24개월 ${pct(a.at[24].cum)} · 36개월 ${pct(a.at[36].cum)} · 48개월 ${pct(a.at[48].cum)}</p>`);
    chart(box, (b, W) => km(b, W, [{ ...a, label: "전체", color: C.green }], { label: "전체 누적 전환", ymax: 0.3, H: (w) => Math.round(Math.min(320, Math.max(220, w * 0.4))) }));
  })();
  vars4.forEach((v, i) => {
    const k = D.km[v], m = D.vars[v], groups = k.groups.map((g) => ({ ...g, color: COL[v][g.code] }));
    const fig = document.createElement("div"); fig.className = "fig exhibit-panel";
    fig.innerHTML = `<p class="panel-title">(${"abcd"[i]}) ${m.name}</p><p class="panel-sub">log-rank χ²(${k.logrank.df}) = ${f2(k.logrank.chi2)}, p = ${p3(k.logrank.p)}</p><div class="legend">${groups.map((g, j) => `<span><i style="border-color:${g.color};border-top-style:${LINE[j]}"></i>${g.label} (n=${g.n}, 전환 ${g.e})</span>`).join("")}</div>`;
    const ch = document.createElement("div"); ch.className = "chart"; fig.appendChild(ch);
    $("#fB2").appendChild(fig);
    chart(ch, (b, W) => km(b, W, groups, { label: m.name }));
  });
  (function () {
    const rows = vars4.map((v) => { const l = D.km[v].logrank; return [`${D.vars[v].name}${v === "x4_t" ? " (기술용)" : ""}`, Object.values(D.vars[v].labels).join(" / "), f2(l.chi2), l.df, p3(l.p) + star(l.p)]; });
    rows.push({ sub: "이분형(가설 판정용)" });
    [["x1_law", "법률", "법률 / 그 외"], ["x2_other", "타 부처 관여", "타 부처 관여 / 주관부처 단독"], ["x3_ban", "금지·제한형", "금지·제한형 / 기준 부재형"]].forEach(([b, n, g]) => {
      const l = D.binlr[b]; rows.push([{ h: n, cls: "ind" }, g, f2(l.chi2), 1, p3(l.p) + star(l.p)]);
    });
    table("#tB1", [col("변수", { cls: "full" }), col("비교 범주", { cls: "s3" }), col("χ²", { n: 1 }), col("df", { n: 1 }), col("p", { n: 1 })], rows, { stack: 1, grid: 1 });
  })();

  // ===== 부록 C
  table("#tC1", [col("변수"), col("B", { n: 1 }), col("SE", { n: 1 }), col("HR", { n: 1 }), col("95% CI", { n: 1 }), col("p", { n: 1 })],
    D.cox.map((c) => [c.label, c.b.toFixed(3), c.se.toFixed(3), f2(c.hr), `[${f2(c.lo)}, ${f2(c.hi)}]`, p3(c.p) + star(c.p)])
      .concat([{ tot: 1, cells: [{ span: 6, h: `−2LL = ${D.fit.m2ll} (공모형 ${D.fit.m2ll0}), LR χ²(3) = ${D.fit.lr}, <em>N</em> = ${M.N}, 전환 = ${M.E}` }] }]));
  $("#tC1-note").innerHTML = `<em>주.</em> 최초 승인연도로 층화, 동률은 Breslow 방식. 각 변수는 이분형(법률 대 그 외, 타 부처 관여 대 주관부처 단독, 금지·제한형 대 기준 부재형). 변수당 사건 수 ${D.fit.epv}로 권장 기준 10에 못 미쳐 추정이 불안정할 수 있다. †<em>p</em> &lt; .10, *<em>p</em> &lt; .05, **<em>p</em> &lt; .01, ***<em>p</em> &lt; .001.`;

  const FCOL = [C.green, C.orange, C.gray], FSYM = ["●", "■", "◆"];
  function forest(box, W) {
    box.insertAdjacentHTML("beforeend", `<div class="legend">${["M1 주 모형", "R3 승인 건 단위", "R4 연도 공변량"].map((t, k) => `<span><b style="color:${FCOL[k]}">${FSYM[k]}</b> ${t}</span>`).join("")}</div>`);
    const nr = W < 560, Lm = nr ? 8 : 180, R = nr ? 44 : 80, T = 34, B = 34, band = nr ? 98 : 84;
    const Hh = T + band * 3 + B;
    const s = svg(box, W, Hh, "위험비 포레스트"), lx = lin(Math.log(0.15), Math.log(10), Lm, W - R), x = (v) => lx(Math.log(Math.min(10, Math.max(0.15, v))));
    [0.25, 0.5, 1, 2, 4, 8].forEach((t) => { el("line", { x1: x(t), x2: x(t), y1: T, y2: Hh - B, class: "gridline" }, s); txt(s, x(t), Hh - B + 18, t, { "text-anchor": "middle" }); });
    el("line", { x1: x(1), x2: x(1), y1: T - 10, y2: Hh - B, stroke: C.muted, "stroke-dasharray": "4 3" }, s);
    txt(s, x(1) - 6, T - 14, "← 전환 지연", { "text-anchor": "end" });
    txt(s, x(1) + 6, T - 14, "전환 촉진 →");
    txt(s, W - R + 8, T - 14, "M1 HR", { "font-size": 11.5 });
    D.forest.forEach((f, i) => {
      const y0 = T + band * i, lines = (k) => (nr ? y0 + 36 + k * 20 : y0 + band / 2 + (k - 1) * 18);
      if (nr) el("text", { x: Lm, y: y0 + 17, "font-size": 13.5, "font-weight": 800, fill: C.ink }, s, f.label);
      else el("text", { x: Lm - 14, y: lines(1) + 4, "text-anchor": "end", "font-size": 14, "font-weight": 700, fill: C.ink }, s, f.label);
      el("text", { x: W - R + 8, y: lines(0) + 4, "font-size": 13, "font-weight": 800, fill: C.ink }, s, f2(f.models[0].hr));
      if (i) el("line", { x1: nr ? 0 : Lm, x2: W, y1: y0, y2: y0, stroke: C.grid }, s);
      f.models.forEach((m, k) => {
        const yy = lines(k), c = FCOL[k], hx = x(m.hr), g = el("g", {}, s);
        el("rect", { x: Lm, y: yy - 9, width: W - Lm - R, height: 18, fill: "transparent" }, g);
        el("line", { x1: x(m.lo), x2: x(m.hi), y1: yy, y2: yy, stroke: c, "stroke-width": k ? 2 : 3 }, g);
        if (k === 0) el("circle", { cx: hx, cy: yy, r: 6.5, fill: c, stroke: "#fff", "stroke-width": 2 }, g);
        else if (k === 1) el("rect", { x: hx - 5.5, y: yy - 5.5, width: 11, height: 11, fill: c, stroke: "#fff", "stroke-width": 2 }, g);
        else el("path", { d: `M${hx},${yy - 7}L${hx + 7},${yy}L${hx},${yy + 7}L${hx - 7},${yy}Z`, fill: c, stroke: "#fff", "stroke-width": 2 }, g);
        mark(g, `<b>${f.label}</b><br>${m.model}<br>HR <b>${f2(m.hr)}</b> [${f2(m.lo)}, ${f2(m.hi)}] · p = ${p3(m.p)}`);
      });
    });
  }
  chart($("#fC1"), forest);

  (function () {
    const c = D.cox, b = D.binlr, kmv = (v, code) => D.km[v].groups.find((g) => g.code === code).at[48].cum;
    const rows = [
      ["H1", "입법형식 위계가 높을수록 전환 지연", "HR < 1", f2(c[0].hr), p3(c[0].p), p3(b.x1_law.p), `법률 ${pct(kmv("x1_level", 3))} · 행정규칙 ${pct(kmv("x1_level", 1))} · 하위법령 ${pct(kmv("x1_level", 2))}`, "rej", "기각"],
      ["H2", "타 부처·복수 부처 소관일수록 전환 지연", "HR < 1", f2(c[1].hr), p3(c[1].p), p3(b.x2_other.p), `주관부처 단독 ${pct(kmv("x2_struct", 0))} · 타 부처 단독 ${pct(kmv("x2_struct", 1))} · 복수 ${pct(kmv("x2_struct", 2))}`, "rev", "기각(반대 방향 유의)"],
      ["H3", "금지·제한형이 기준 부재형보다 전환 지연", "HR < 1", f2(c[2].hr), p3(c[2].p), p3(b.x3_ban.p), `금지·제한형 ${pct(kmv("x3_ban", 1))} · 기준 부재형 ${pct(kmv("x3_ban", 0))}`, "rej", "기각"],
      ["H4", "승인 전 사회적 주목도가 높을수록 전환 촉진", "HR > 1", "—", "—", "—", `3분위 log-rank p = ${p3(D.km.x4_t.logrank.p)}(기술용)`, "na", "검증 불가"],
      ["H5", "주목도의 촉진 효과는 법률 단계에서 더 큼", "상호작용 HR > 1", "—", "—", "—", "상호작용 모형 미추정", "na", "검증 불가"],
    ];
    table("#tC2", [col("가설", { cls: "lbl" }), col("내용", { cls: "full" }), col("기대", { cls: "nw" }), col("HR", { n: 1 }), col("Cox p", { n: 1 }), col("log-rank p", { n: 1 }), col("48개월 누적 전환", { cls: "s3" }), col("판정", { cls: "s2" })],
      rows.map((r) => [`<b>${r[0]}</b>`, r[1], r[2], r[3], r[4], r[5], `<small>${r[6]}</small>`, `<span class="mark ${r[7]}">${r[8]}</span>`]), { stack: 1, grid: 1 });
  })();

  // ===== 부록 D
  (function () {
    const r1 = D.r1, rows = [{ sub: `R1 48개월 내 전환 로지스틱 회귀 (N = ${r1.n}, 전환 ${r1.e})` },
      [{ h: "법률", cls: "ind" }, "OR", f2(r1.x1.or), `[${f2(r1.x1.lo)}, ${f2(r1.x1.hi)}]`, p3(r1.x1.p)],
      [{ h: "타 부처 관여", cls: "ind" }, "OR", { span: 2, h: `<small>추정 불가(준완전분리: 주관부처 단독 ${r1.x2.main_conv}/${r1.x2.main_n}, 타 부처 관여 ${r1.x2.other_conv}/${r1.x2.other_n})</small>` }, { h: `${p3(r1.x2.fisher_p)}<sup>a</sup>`, cls: "n" }],
      [{ h: "금지·제한형", cls: "ind" }, "OR", f2(r1.x3.or), `[${f2(r1.x3.lo)}, ${f2(r1.x3.hi)}]`, p3(r1.x3.p)]];
    [["R3 승인 건 단위, 과제 군집 강건 표준오차 (승인 747건, 전환 37)", 1], ["R4 승인연도를 범주형 공변량으로 투입 (N = 238, 전환 26)", 2]].forEach(([nm, k]) => {
      rows.push({ sub: nm });
      D.forest.forEach((f) => { const m = f.models[k]; rows.push([{ h: f.label.replace(/ \(H\d\)/, ""), cls: "ind" }, "HR", f2(m.hr), `[${f2(m.lo)}, ${f2(m.hi)}]`, p3(m.p)]); });
    });
    table("#tD1", [col("검증·변수"), col("추정치"), col("값", { n: 1 }), col("95% CI", { n: 1 }), col("p", { n: 1 })], rows);
    $("#tD1").closest(".exhibit").querySelector(".apa-note").insertAdjacentHTML("beforeend", " <sup>a</sup>Fisher 정확검정 <em>p</em>.");
    table("#tD2", [col("변수"), col("χ²", { n: 1 }), col("p", { n: 1 }), col("판정")],
      D.ph.map((r) => [r.label, r.chi2.toFixed(3), p3(r.p), r.p < 0.05 ? '<span class="mark rev">위반 의심</span>' : '<span class="mark c">가정 유지</span>']));
    const tv = D.ph_tv;
    table("#tD3", [col("변수"), col("HR", { n: 1 }), col("95% CI", { n: 1 }), col("p", { n: 1 })], [
      ["법률 단계", "2.08", "[0.85, 5.10]", ".111"],
      ["타 부처 관여", "2.58", "[0.84, 7.92]", ".098"],
      ["금지·제한형", "0.23", "[0.01, 7.27]", ".408"],
      ["금지·제한형 × ln(t)", f2(tv.hr), `[${f2(tv.lo)}, ${f2(tv.hi)}]`, p3(tv.p)]]);
  })();

  // ===== 부록 E
  const LEG2 = (shape) => `<div class="legend">${[0, 1, 2].map((c) => `<span><i class="${shape}" style="background:${COL.x2_struct[c]};border-color:${COL.x2_struct[c]}"></i>${L2[c]}</span>`).join("")}</div>`;
  function convBars(box, W) {
    box.insertAdjacentHTML("beforeend", LEG2("sq"));
    const conv = D.units.filter((u) => u.ev).sort((a, b) => a.t - b.t), nr = W < 600;
    const rowH = nr ? 40 : 22, Lm = nr ? 0 : Math.min(330, Math.round(W * 0.36)), R = 40, T = 6;
    const Hh = T + conv.length * rowH + 30, s = svg(box, W, Hh, "전환 과제 소요기간"), x = lin(0, 50, Lm, W - R);
    [0, 12, 24, 36, 48].forEach((t) => { el("line", { x1: x(t), x2: x(t), y1: T, y2: Hh - 26, class: "gridline" }, s); txt(s, x(t), Hh - 9, t === 48 || !nr ? t + "개월" : t, { "text-anchor": "middle" }); });
    const maxc = Math.floor((nr ? W - 50 : Lm - 12) / 12);
    conv.forEach((u, i) => {
      const y0 = T + i * rowH, g = el("g", {}, s), by0 = nr ? y0 + 20 : y0 + rowH / 2 - 7;
      el("rect", { x: 0, y: y0, width: W, height: rowH, fill: "transparent" }, g);
      if (nr) el("text", { x: 0, y: y0 + 14, "font-size": 12.5, fill: C.ink2 }, g, cut(u.title, maxc));
      else el("text", { x: Lm - 10, y: y0 + rowH / 2 + 4, "text-anchor": "end", "font-size": 12.5, fill: C.ink2 }, g, cut(u.title, maxc));
      el("rect", { x: Lm, y: by0, width: x(u.t) - Lm, height: nr ? 12 : 14, rx: 3, fill: COL.x2_struct[u.x2] }, g);
      el("text", { x: x(u.t) + 6, y: by0 + (nr ? 10 : 11), "font-size": 12, "font-weight": 700, fill: C.ink }, g, u.t.toFixed(1));
      mark(g, `<b>${esc(u.title)}</b><br>${ymd(u.first)} → ${ymd(u.eff)} · <b>${u.t.toFixed(1)}개월</b><br>${L1[u.x1]} · ${L2[u.x2]} · ${L3[u.x3]}<br><span class="k">개선법령</span> ${esc(cut(u.imp, 120))}`);
    });
  }
  chart($("#fE1"), convBars);

  function swimmer(box, W) {
    box.insertAdjacentHTML("beforeend", LEG2("").replace("</div>", `<span><i class="dot" style="background:${C.ink}"></i>전환 시점</span></div>`));
    const nr = W < 600, t0 = Date.parse("2019-01-01"), t1 = Date.parse("2025-10-01"), END = Date.parse(M.end), DE = Date.parse(LAST_EFF);
    const rowH = nr ? 3.4 : 4.2, Lm = nr ? 2 : 150, R = 8, T = 24, head = nr ? 26 : 0, gapH = nr ? 16 : 34;
    const groups = [0, 1, 2].map((c) => D.units.filter((u) => u.x2 === c).sort((a, b) => a.first.localeCompare(b.first)));
    const Hh = T + groups.reduce((a, g) => a + head + g.length * rowH + gapH, 0) + 34;
    const s = svg(box, W, Hh, "전체 과제 관찰 기간"), x = lin(t0, t1, Lm, W - R);
    for (let yv = 2019; yv <= 2025; yv++) {
      const xx = x(Date.parse(yv + "-01-01"));
      el("line", { x1: xx, x2: xx, y1: T - 6, y2: Hh - 34, class: "gridline" }, s);
      txt(s, xx + 3, T - 10, W < 440 ? "’" + String(yv).slice(2) : yv);
    }
    el("line", { x1: x(DE), x2: x(DE), y1: T - 6, y2: Hh - 34, stroke: C.orange, "stroke-dasharray": "3 3", opacity: 0.8 }, s);
    el("line", { x1: x(END), x2: x(END), y1: T - 6, y2: Hh - 34, stroke: C.ink, "stroke-dasharray": "3 3", opacity: 0.5 }, s);
    txt(s, x(DE) - 4, Hh - 20, `전환 자료 끝 ${ymd(LAST_EFF)}`, { "text-anchor": "end", "font-size": 11.5, fill: "#b4502a" });
    txt(s, x(END), Hh - 5, `관측 종료 ${ymd(M.end)}`, { "text-anchor": "end", "font-size": 11.5 });
    let yy = T; const rows = [];
    groups.forEach((g, gi) => {
      const lab = `${g.length}개 · 전환 ${g.filter((u) => u.ev).length}`;
      if (nr) {
        el("text", { x: 0, y: yy + 16, "font-size": 13, "font-weight": 800, fill: C.ink }, s, L2[gi]);
        txt(s, W - R, yy + 16, lab, { "text-anchor": "end" });
        yy += head;
      } else {
        el("text", { x: 0, y: yy + 14, "font-size": 13.5, "font-weight": 800, fill: C.ink }, s, L2[gi]);
        txt(s, 0, yy + 32, lab);
      }
      g.forEach((u) => {
        const a = Date.parse(u.first), b = u.ev ? Date.parse(u.eff) : END;
        el("line", { x1: x(a), x2: x(b), y1: yy + rowH / 2, y2: yy + rowH / 2, stroke: COL.x2_struct[gi], "stroke-width": nr ? 2.2 : 2.6, opacity: u.ev ? 1 : 0.38 }, s);
        if (u.ev) el("circle", { cx: x(b), cy: yy + rowH / 2, r: 3.4, fill: C.ink, stroke: "#fff", "stroke-width": 1 }, s);
        rows.push({ y0: yy, y1: yy + rowH, u }); yy += rowH;
      });
      yy += gapH;
    });
    const hl = el("rect", { x: Lm, width: W - Lm - R, height: rowH, fill: C.ink, opacity: 0 }, s);
    const hit = el("rect", { x: 0, y: T, width: W, height: Hh - T - 34, fill: "transparent" }, s);
    track(hit, s, W, Hh, (px, py) => {
      let row = null, best = 1e9;
      rows.forEach((q) => { const d = Math.abs((q.y0 + q.y1) / 2 - py); if (d < best) { best = d; row = q; } });
      if (!row || best > rowH * 2.5) { hl.setAttribute("opacity", 0); return null; }
      const u = row.u; hl.setAttribute("y", row.y0); hl.setAttribute("opacity", 0.1);
      return `<b>${esc(u.title)}</b><br><span class="k">${u.id} · 최초 승인</span> ${ymd(u.first)} · 승인 ${u.n}건<br>${u.ev ? `<b style="color:${C.green}">전환</b> ${ymd(u.eff)} (${u.t.toFixed(1)}개월)` : `미전환 · ${u.t.toFixed(1)}개월 관찰`}<br>${L1[u.x1]} · ${L2[u.x2]} · ${L3[u.x3]} · 기사 ${u.x4.toLocaleString()}건`;
    }, () => hl.setAttribute("opacity", 0));
  }
  chart($("#fE2"), swimmer);

  (function () {
    const PAGE = narrow() ? 20 : 30, pager = $("#tE1-pager");
    let shown = PAGE;
    const cols = [col("ID", { cls: "lbl" }), col("과제명", { cls: "full" }), col("최초 승인"), col("승인", { n: 1, lab: "승인 건" }), col("위계(X1)"), col("관할(X2)"), col("장벽(X3)"), col("기사(X4)", { n: 1 }), col("결과", { cls: "s2" }), col("기간(월)", { n: 1 })];
    function render() {
      const q = $("#f-q").value.trim().toLowerCase(), fx = $("#f-x2").value, fe = $("#f-ev").value;
      const all = D.units.filter((u) => (!q || (u.title + u.prov + u.ag + u.x3note + u.id).toLowerCase().includes(q)) && (fx === "" || String(u.x2) === fx) && (fe === "" || String(u.ev) === fe));
      const rows = all.slice(0, shown);
      table("#tE1", cols, rows.map((u) => [u.id,
        `<details><summary>${esc(u.title)}</summary><div class="more"><b>관련규정</b> ${esc(u.prov)}<br><b>소관기관</b> ${esc(u.ag.replace(/;/g, ", "))}<br><b>장벽 판단</b> ${esc(u.x3note)} <span class="mark ${u.x3c === "C" ? "c" : "j"}">${u.x3c === "C" ? "규칙" : "판단"}</span><br><b>검색식</b> ${esc(u.q)}${u.imp ? `<br><b>개선법령</b> ${esc(u.imp)}` : ""}</div></details>`,
        u.first, u.n, L1[u.x1], L2[u.x2], L3[u.x3], u.x4.toLocaleString(),
        u.ev ? `<span class="mark ev">전환</span> ${u.eff}` : '<span class="mark ce">미전환</span>', u.t.toFixed(1)]), { stack: 1, grid: 1 });
      const left = all.length - rows.length;
      pager.innerHTML = left > 0 ? `<button type="button" class="more-btn" data-k="more">${Math.min(PAGE, left)}개 더 보기</button><button type="button" class="more-btn" data-k="all">전체 보기 (남은 ${left}개)</button>` : "";
      $("#tE1-note").innerHTML = `<em>주.</em> 조건에 맞는 과제 ${all.length}개 중 ${rows.length}개 표시(전환 ${all.filter((u) => u.ev).length}). 과제명을 누르면 관련규정·소관기관·장벽 판단 근거·기사 검색식이 표시된다. 장벽 판단의 '판단'은 경계 사례로 연구자 판단이 개입된 코딩(전체 ${M.x3.j}개)이다. 기간은 최초 승인부터 전환 또는 관측 종료일까지다.`;
      swipeHints();
    }
    pager.addEventListener("click", (e) => { const k = e.target.dataset && e.target.dataset.k; if (!k) return; e.stopPropagation(); shown = k === "all" ? 1e9 : shown + PAGE; render(); });
    ["#f-q", "#f-x2", "#f-ev"].forEach((sel) => $(sel).addEventListener("input", () => { shown = PAGE; render(); }));
    render();
  })();

  // ===== 부록 F
  table("#tF1", [col("후보", { n: 1, cls: "lbl", lab: "대응쌍" }), col("전환 과제", { cls: "full" }), col("전환 기간", { n: 1 }), col("대응 미전환 과제"), col("관찰 기간", { n: 1 }), col("공통 조건"), col("다른 조건")],
    D.pairs.map((p, i) => {
      const c = by[p.conv], n = by[p.non], diff = [];
      if (c.x1 !== n.x1) diff.push(`위계 ${L1[c.x1]}↔${L1[n.x1]}`);
      if (c.x3 !== n.x3) diff.push(`장벽 ${L3[c.x3]}↔${L3[n.x3]}`);
      if (p.gap_years >= 0.5) diff.push(`승인 시기 ${p.gap_years}년 차`);
      const same = [L2[c.x2]].concat(p.same.includes("위계") ? [L1[c.x1]] : [], p.same.includes("장벽") ? [L3[c.x3]] : []);
      return [i + 1, `${esc(c.title)}<br><small>${c.first}</small>`, `${c.t.toFixed(1)}개월`, `${esc(n.title)}<br><small>${n.first} · 승인 ${n.n}건</small>`, `${n.t.toFixed(1)}개월+`, `<small>${same.join(" · ")}</small>`, `<small>${diff.join("<br>") || "—"}</small>`];
    }), { stack: 1 });
  fold("#tF1", 8, "쌍");

  function pairTable(id, left, right, labL, labR, rows) {
    table(id, [col("구분", { cls: "lbl", lab: "" }), col(`${left} <span class="mark ev">전환</span>`, { lab: labL }), col(`${right} <span class="mark ce">미전환</span>`, { lab: labR })], rows, { stack: 1, wide: 1 });
  }
  (function () {
    const w = by.U005, w2 = by.U012, m = by.U026;
    pairTable("#tF2", "휠체어 전동보조키트(U005)", "공유미용실(U026)", "전환 · 휠체어 전동보조키트", "미전환 · 공유미용실", [
      ["공통 조건", "타 부처 단독 소관(식품의약품안전처) · 법률 아래 단계 규범(고시)", "타 부처 단독 소관(보건복지부) · 법률 아래 단계 규범(시행규칙)"],
      ["최초 승인", `${ymd(w.first)} · 승인 ${w.n}건`, `${ymd(m.first)} · 같은 규제 승인 ${m.n}건 누적`],
      ["규제 장벽", "기준 부재형: 전동보조키트에 적용할 의료기기 기준규격·품목분류 없음", "금지·제한형: 영업장마다 독립 시설을 요구하는 '1영업장 1영업자' 원칙"],
      ["해소 경로", "품목분류 신설(식약처 고시 개정)", "시설기준 완화 필요(공중위생관리법 시행규칙)"],
      ["승인 후 경과", `약 9개월 만에 품목분류 고시 개정(사례분석) · 규제법령현황 시행일 ${ymd(w.eff)}, ${w.t.toFixed(1)}개월(정량분석) · 유사 과제 서브키트(U012) ${w2.t.toFixed(1)}개월`, `${m.t.toFixed(1)}개월째 미전환`],
      ["승인 전 기사 수", `${w.x4}건`, `${m.x4}건`],
      ["차이 요인", "반대 집단 부재 — 새 기준을 만들면 끝나는 문제", "미용업계의 조직적 반대 — 기존 사업자 보호 규정의 완화 필요"],
    ].map((r) => [`<b>${r[0]}</b>`, r[1], r[2]]));
    $("#tF2-note").innerHTML = "<em>주.</em> 휠체어 사례의 전환 시점은 기준에 따라 다르다. 사례분석은 품목분류 고시 개정 시점, 정량분석은 한국산업기술진흥원 규제법령현황의 시행일을 썼다.";
    const pp = by.U125, vib = by.U066, lh = by.U055, lh2 = by.U127;
    pairTable("#tF3", "PP 전력케이블(U125) · VIB ESS 충전소(U066)", "액화수소 생산·운송·충전소(U055)", "전환 · PP 케이블, VIB ESS", "미전환 · 액화수소 충전소", [
      ["공통 조건", "주관부처(산업통상자원부) 단독 소관 · 기준 부재형", "주관부처(산업통상자원부) 단독 소관 · 기준 부재형"],
      ["최초 승인", `PP 케이블 ${ymd(pp.first)} · VIB ESS ${ymd(vib.first)}`, `${ymd(lh.first)} · 승인 ${lh.n}건`],
      ["규제 장벽", "기존 기술기준(한국전기설비규정, KEC)이 새 소재·전지를 포함하지 않음", "개정할 대상 기준 자체가 없음(액화수소 설비 안전기준 신규 제정 필요)"],
      ["해소 경로", "KEC 개정(기존 체계에 항목 추가)", "실증안전기준 → 정식 기준 제정 대기"],
      ["승인 후 경과", `PP 케이블 ${pp.t.toFixed(1)}개월(${ymd(pp.eff)}) · VIB ESS ${vib.t.toFixed(1)}개월(${ymd(vib.eff)})`, `${lh.t.toFixed(1)}개월째 미전환 · 상용차용 액화수소충전소(U127)도 ${lh2.t.toFixed(1)}개월째 미전환`],
      ["승인 전 기사 수", `${pp.x4}건 · ${vib.x4}건`, `${lh.x4.toLocaleString()}건`],
      ["차이 요인", "개정할 기준 체계 존재", "기준 제정 지연 — 주목도가 높아도 전환되지 않음"],
    ].map((r) => [`<b>${r[0]}</b>`, r[1], r[2]]));
    $("#tF3-note").innerHTML = "<em>주.</em> 주관부처 단독 과제 111개 중 62개가 수소·가스 계열이며, 이것이 정량분석에서 H2가 반대 방향으로 나온 배경으로 보인다. PP 케이블은 포털 관련규정에 법률 조항만 기재되어 정량 코딩상 법률 단계(X1 = 3)이나 실제 개정 대상은 고시(KEC)였다.";
  })();

  // ===== 부록 G
  table("#tG1", [col("자료", { cls: "full" }), col("기준일·수집일"), col("사용 변수")], [
    ["규제샌드박스 통합포털 산업융합 과제 목록·상세(938건)", "2026. 10. 13. 수집", "모집단, 승인일, 특례 유형, 규제부처, 관련규정(법령·조항)"],
    ["한국산업기술진흥원 규제법령현황(규제개선 '완료' 40행)", "2025. 8. 8. (시행일 범위 2019. 6.~2023. 10.)", "전환 여부, 개선법령 시행일(종속변수)"],
    ["한국산업기술진흥원 규제샌드박스 규제유형별 총괄 현황", "2026. 8. 14.", "규제 장벽 유형(X3) 판단 참고"],
    ["국가법령정보센터 Open API", "2026. 10. 13. 조회", "관련규정별 법령 종류(X1), 소관부처(X2, 2025. 8. 직제로 환산)"],
    ["빅카인즈 뉴스 검색", "2026. 10. 13. 조회", "최초 승인 전 12개월 기사 수(X4)"],
  ], { stack: 1 });
  table("#tG2", [col("검증 항목"), col("결과"), col("판정")], D.verify.items.map((s) => {
    const m = s.match(/^\[(.+?)\]\s*(.+?)(?:\s+(독립 [\dχ].*|p [\d.]+))?$/) || [null, "통과", s, ""];
    return [m[2], `<small>${m[3] || "재계산 결과 동일"}</small>`, `<span class="mark ${m[1] === "통과" ? "c" : "rev"}">${m[1] === "통과" ? "일치" : "불일치"}</span>`];
  }));
  fold("#tG2", 12, "개");

  // ===== 바로가기 막대·맨 위로
  (function () {
    const links = [...document.querySelectorAll("#jump a")], nav = $("#jump .jump-in"), totop = $("#totop");
    const secs = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
    let cur = -1, ticking = false;
    function update() {
      ticking = false;
      const y = 90;
      let k = 0;
      secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= y) k = i; });
      if (k !== cur) {
        cur = k; links.forEach((a, i) => a.classList.toggle("on", i === k));
        const a = links[k]; nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
      }
      totop.classList.toggle("show", scrollY > 900);
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  drawAll();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawAll, 150); });
  // 웹폰트가 늦게 오면 표 폭이 바뀌므로 한 번 더 점검
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawAll(); swipeHints(); });
})();
