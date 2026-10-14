/* 예외는 어떻게 규범이 되는가 — 부록 렌더링 (의존성 없음, 데이터: assets/data.js) */
(function () {
  "use strict";
  const D = window.DATA, M = D.meta;
  const NS = "http://www.w3.org/2000/svg";
  const C = { green: "#1f6b45", orange: "#eb6834", gray: "#898781", ink: "#111111", ink2: "#3a3936",
    muted: "#6b6963", grid: "#ebe8e0", light: "#d9d6cd" };
  // 범주 색(포스터와 같게 주관부처 단독은 주황). 흑백 구분용 선 모양 병행.
  const COL = {
    x1_level: { 1: C.green, 2: C.orange, 3: C.gray },
    x2_struct: { 0: C.orange, 1: C.green, 2: C.gray },
    x3_ban: { 0: C.orange, 1: C.green },
    x4_t: { 1: C.gray, 2: C.orange, 3: C.green },
  };
  const DASH = ["", "7 4", "2 4"];
  const L1 = D.vars.x1_level.labels, L2 = D.vars.x2_struct.labels, L3 = D.vars.x3_ban.labels;
  const $ = (s) => document.querySelector(s);
  const p3 = (p) => (p < 0.001 ? "< .001" : p.toFixed(3).replace(/^0/, ""));
  const pct = (x, k = 1) => (100 * x).toFixed(k) + "%";
  const f2 = (x) => x.toFixed(2);
  const star = (p) => (p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : p < 0.1 ? "†" : "");

  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svg(box, w, h, label) { const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label }); box.appendChild(s); return s; }
  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const tip = $("#tip");
  function showTip(html, ev) {
    tip.innerHTML = html; tip.style.opacity = 1;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => { tip.style.opacity = 0; };
  function hover(node, html) { node.addEventListener("mousemove", (e) => showTip(html, e)); node.addEventListener("mouseleave", hideTip); }
  function table(id, head, rows) {
    $(id).innerHTML = `<thead><tr>${head.map((h) => `<th${h.n ? ' class="n"' : ""}>${h.t || h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody>`;
  }
  const H = (t, n) => ({ t, n });

  // ===== 부록 A
  table("#tA1", ["단계", "기준", H("건수", 1), "제외"], [
    `<tr><td>1</td><td>규제샌드박스 통합포털 산업융합 승인 전체(2026. 10. 13. 수집)</td><td class="n">${M.portal_total}</td><td>—</td></tr>`,
    `<tr><td>2</td><td>특례 유형이 실증특례인 승인</td><td class="n">${M.portal_total - 83}</td><td>임시허가 63, 적극해석 등 20</td></tr>`,
    `<tr><td>3</td><td>관측 종료일(2025. 8. 8.) 이전 승인</td><td class="n">${M.approvals}</td><td>이후 승인 108</td></tr>`,
    `<tr class="tot"><td>4</td><td>규제 과제(분석단위)</td><td class="n">${M.N}</td><td>전환 ${M.E} · 미전환 ${M.N - M.E}</td></tr>`,
  ]);

  const vars4 = ["x1_level", "x2_struct", "x3_ban", "x4_t"];
  (function tA2() {
    const rows = [];
    vars4.forEach((v) => {
      const k = D.km[v], m = D.vars[v];
      rows.push(`<tr class="sub"><td colspan="7">${m.h} ${m.name}</td></tr>`);
      k.groups.forEach((g) => rows.push(`<tr><td class="ind">${g.label}</td><td class="n">${g.n}</td><td class="n">${g.e}</td><td class="n">${pct(g.e / g.n)}</td><td class="n">${pct(g.at[24].cum)}</td><td class="n">${pct(g.at[48].cum)}</td><td class="n"><small>${pct(g.at[48].lo)}–${pct(g.at[48].hi)}</small></td></tr>`));
    });
    const a = D.km.all;
    rows.push(`<tr class="tot"><td>전체</td><td class="n">${a.n}</td><td class="n">${a.e}</td><td class="n">${pct(a.e / a.n)}</td><td class="n">${pct(a.at[24].cum)}</td><td class="n">${pct(a.at[48].cum)}</td><td class="n"><small>${pct(a.at[48].lo)}–${pct(a.at[48].hi)}</small></td></tr>`);
    table("#tA2", ["변수·범주", H("과제", 1), H("전환", 1), H("전환율", 1), H("24개월 누적", 1), H("48개월 누적", 1), H("95% CI", 1)], rows);
  })();

  (function fA1() {
    const box = $("#fA1");
    const verdict = { x1_level: ["기각", C.muted], x2_struct: ["기각 · 반대 방향", "#9a3a12"], x3_ban: ["기각 · 비유의", C.muted], x4_t: ["검증 불가 · 기술", C.muted] };
    const W = 1100, Hh = 420, top = 70, bot = 64, left = 46;
    const s = svg(box, W, Hh, "변수 범주별 48개월 누적 전환율");
    const y = lin(0, 0.5, Hh - bot, top);
    const units = vars4.map((v) => D.km[v].groups.length), tot = units.reduce((a, b) => a + b, 0);
    const gap = 26, avail = W - left - gap * 3;
    [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((t) => {
      el("line", { x1: left, x2: W, y1: y(t), y2: y(t), class: "gridline" }, s);
      el("text", { x: left - 8, y: y(t) + 4, "text-anchor": "end", fill: C.muted, "font-size": 12 }, s, Math.round(t * 100) + "%");
    });
    el("line", { x1: left, x2: W, y1: y(M.km48.cum), y2: y(M.km48.cum), stroke: C.gray, "stroke-dasharray": "4 4" }, s);
    el("text", { x: left + 4, y: y(M.km48.cum) - 6, fill: C.muted, "font-size": 12 }, s, "전체 " + pct(M.km48.cum));
    let x0 = left;
    vars4.forEach((v, vi) => {
      const g = D.km[v].groups, pw = (avail * units[vi]) / tot, m = D.vars[v];
      const cx = (i) => x0 + (pw * (i + 0.5)) / g.length;
      el("text", { x: x0 + 4, y: 24, "font-weight": 800, "font-size": 15, fill: C.ink }, s, `${m.h} ${m.name}`);
      el("text", { x: x0 + 4, y: 44, "font-size": 12.5, "font-weight": 700, fill: verdict[v][1] }, s, `${verdict[v][0]} · log-rank p = ${p3(D.km[v].logrank.p)}`);
      const up = v === "x4_t", ax1 = cx(0) - 6, ax2 = cx(g.length - 1) + 6, ay1 = up ? y(0.08) : y(0.42), ay2 = up ? y(0.42) : y(0.08);
      el("line", { x1: ax1, y1: ay1, x2: ax2, y2: ay2, stroke: "#d5d2c9", "stroke-width": 12, "stroke-linecap": "round", opacity: 0.4 }, s);
      el("text", { x: ax1 - 2, y: ay1 - 12, "font-size": 11, fill: "#a9a59a" }, s, "가설의 예상");
      el("polyline", { points: g.map((d, i) => `${cx(i)},${y(d.at[48].cum)}`).join(" "), fill: "none", stroke: C.green, "stroke-width": 2, opacity: 0.5 }, s);
      g.forEach((d, i) => {
        const a = d.at[48], col = COL[v][d.code];
        el("line", { x1: cx(i), x2: cx(i), y1: y(Math.min(a.hi, 0.5)), y2: y(a.lo), stroke: col, "stroke-width": 2, opacity: 0.45 }, s);
        const dot = el("circle", { cx: cx(i), cy: y(a.cum), r: 7, fill: col, stroke: "#fff", "stroke-width": 2 }, s);
        el("text", { x: cx(i), y: y(a.cum) - 14, "text-anchor": "middle", "font-weight": 800, "font-size": 14, fill: C.ink }, s, pct(a.cum));
        el("text", { x: cx(i), y: Hh - bot + 22, "text-anchor": "middle", "font-size": 13, fill: C.ink2 }, s, d.label);
        el("text", { x: cx(i), y: Hh - bot + 40, "text-anchor": "middle", "font-size": 12, fill: C.muted }, s, `n=${d.n} · 전환 ${d.e}`);
        hover(dot, `<b>${m.name} · ${d.label}</b><br>48개월 누적 전환 <b>${pct(a.cum)}</b><br><span class="k">95% CI</span> ${pct(a.lo)}–${pct(a.hi)} · <span class="k">24개월</span> ${pct(d.at[24].cum)}<br><span class="k">과제</span> ${d.n} · <span class="k">전환</span> ${d.e}`);
      });
      if (vi < 3) el("line", { x1: x0 + pw + gap / 2, x2: x0 + pw + gap / 2, y1: 10, y2: Hh - 16, stroke: C.grid }, s);
      x0 += pw + gap;
    });
  })();

  function stacked(box, rows, o) {
    box.innerHTML = `<div class="legend"><span><i class="dot" style="background:${C.green}"></i>전환</span><span><i class="dot" style="background:${C.light}"></i>미전환</span></div>`;
    const W = 520, Hh = 320, Lm = 40, R = 8, T = 26, B = 46;
    const s = svg(box, W, Hh, o.label), y = lin(0, o.ymax, Hh - B, T), bw = (W - Lm - R) / rows.length;
    for (let t = 0; t <= o.ymax; t += o.step) {
      el("line", { x1: Lm, x2: W - R, y1: y(t), y2: y(t), class: "gridline" }, s);
      el("text", { x: Lm - 7, y: y(t) + 4, "text-anchor": "end", fill: C.muted, "font-size": 12 }, s, t);
    }
    rows.forEach((r, i) => {
      const cx = Lm + bw * (i + 0.5), w = Math.min(44, bw * 0.62), g = el("g", {}, s);
      el("rect", { x: cx - w / 2, y: y(r.n), width: w, height: y(0) - y(r.n), fill: C.light, rx: 3 }, g);
      if (r.e) el("rect", { x: cx - w / 2, y: y(r.e), width: w, height: y(0) - y(r.e), fill: C.green, rx: 3 }, g);
      el("text", { x: cx, y: y(r.n) - 7, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: C.ink }, s, `${r.e}/${r.n}`);
      el("text", { x: cx, y: Hh - B + 18, "text-anchor": "middle", "font-size": 12, fill: C.ink2 }, s, r.label);
      hover(g, `<b>${o.unit}${r.label}</b><br>과제 ${r.n} · 전환 <b>${r.e}</b> (${pct(r.e / r.n)})`);
    });
    el("text", { x: (Lm + W - R) / 2, y: Hh - 6, "text-anchor": "middle", fill: C.muted, "font-size": 12.5 }, s, o.xlab);
  }
  stacked($("#fA2"), D.years.map((d) => ({ label: d.year, n: d.n, e: d.e })), { ymax: 60, step: 10, label: "승인연도별", unit: "", xlab: "최초 승인연도" });
  (function () {
    const bins = [[0, 0, "0"], [1, 9, "1–9"], [10, 49, "10–49"], [50, 99, "50–99"], [100, 499, "100–499"], [500, 999, "500–999"], [1000, 1e9, "1,000+"]];
    const rows = bins.map(([a, b, l]) => { const u = D.units.filter((d) => d.x4 >= a && d.x4 <= b); return { label: l, n: u.length, e: u.filter((d) => d.ev).length }; });
    stacked($("#fA3"), rows, { ymax: 70, step: 10, label: "기사 수 분포", unit: "기사 ", xlab: "승인 전 12개월 기사 수(건)" });
  })();
  (function () {
    const rows = [0, 1, 2].map((a) => {
      let nn = 0, ee = 0;
      const cells = [0, 1].map((b) => { const c = D.cross.find((d) => d.x2 === a && d.x3 === b); nn += c.n; ee += c.e; return `<td class="n">${c.n} / ${c.e} <small>(${pct(c.e / c.n, 0)})</small></td>`; }).join("");
      return `<tr><td>${L2[a]}</td>${cells}<td class="n">${nn} / ${ee} <small>(${pct(ee / nn, 0)})</small></td></tr>`;
    });
    rows.push(`<tr class="tot"><td>계</td>${[0, 1].map((b) => { const c = D.cross.filter((d) => d.x3 === b); const n = c.reduce((s, d) => s + d.n, 0), e = c.reduce((s, d) => s + d.e, 0); return `<td class="n">${n} / ${e} <small>(${pct(e / n, 0)})</small></td>`; }).join("")}<td class="n">${M.N} / ${M.E} <small>(${pct(M.E / M.N, 0)})</small></td></tr>`);
    table("#tA3", ["관할 구조", H(L3[0], 1), H(L3[1], 1), H("계", 1)], rows);
    table("#tA4", ["변수 쌍", H("Cramér's V", 1)], D.assoc.map((a) => `<tr><td>${a.a} × ${a.b}</td><td class="n">${a.v.toFixed(3).replace(/^0/, "")}</td></tr>`));
  })();

  // ===== 부록 B
  function cumAt(steps, t) { let c = 0; for (const [tt, v] of steps) { if (tt <= t) c = v; else break; } return c; }
  function km(box, groups, o) {
    const W = o.W || 520, Hh = o.H || 360, Lm = 50, R = 14, T = 14, B = 44, tmax = 80, ymax = o.ymax || 0.4;
    const s = svg(box, W, Hh, o.label), x = lin(0, tmax, Lm, W - R), y = lin(0, ymax, Hh - B, T);
    for (let t = 0; t <= ymax + 1e-9; t += 0.1) {
      el("line", { x1: Lm, x2: W - R, y1: y(t), y2: y(t), class: "gridline" }, s);
      el("text", { x: Lm - 8, y: y(t) + 4, "text-anchor": "end", fill: C.muted, "font-size": 12 }, s, Math.round(t * 100) + "%");
    }
    for (let t = 0; t <= 72; t += 12) el("text", { x: x(t), y: Hh - B + 18, "text-anchor": "middle", fill: C.muted, "font-size": 12 }, s, t);
    el("text", { x: (Lm + W - R) / 2, y: Hh - 4, "text-anchor": "middle", fill: C.muted, "font-size": 12 }, s, "최초 승인 후 경과 개월");
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
    hit.addEventListener("mousemove", (e) => {
      const r = s.getBoundingClientRect(), t = Math.max(0, Math.min(tmax, ((((e.clientX - r.left) / r.width) * W - Lm) / (W - Lm - R)) * tmax));
      vl.setAttribute("x1", x(t)); vl.setAttribute("x2", x(t)); vl.setAttribute("opacity", 0.3);
      showTip(`<b>${t.toFixed(0)}개월 시점 누적 전환</b>` + groups.map((g) => `<div class="row"><span><span class="sw" style="background:${g.color}"></span>${g.label}</span><b>${pct(cumAt(g.steps, t))}</b></div>`).join(""), e);
    });
    hit.addEventListener("mouseleave", () => { vl.setAttribute("opacity", 0); hideTip(); });
  }
  (function () {
    const a = D.km.all, box = $("#fB1");
    box.innerHTML = `<p class="panel-sub">N = ${a.n}, 전환 ${a.e} · 12개월 ${pct(a.at[12].cum)} · 24개월 ${pct(a.at[24].cum)} · 36개월 ${pct(a.at[36].cum)} · 48개월 ${pct(a.at[48].cum)}</p>`;
    km(box, [{ ...a, label: "전체", color: C.green }], { label: "전체 누적 전환", ymax: 0.3, W: 1000, H: 320 });
  })();
  vars4.forEach((v, i) => {
    const k = D.km[v], m = D.vars[v], groups = k.groups.map((g) => ({ ...g, color: COL[v][g.code] }));
    const fig = document.createElement("div"); fig.className = "fig";
    fig.innerHTML = `<p class="panel-title">(${"abcd"[i]}) ${m.name}</p><p class="panel-sub">log-rank χ²(${k.logrank.df}) = ${f2(k.logrank.chi2)}, p = ${p3(k.logrank.p)}</p><div class="legend">${groups.map((g, j) => `<span><i style="border-color:${g.color};border-top-style:${["solid", "dashed", "dotted"][j]}"></i>${g.label} (n=${g.n}, 전환 ${g.e})</span>`).join("")}</div>`;
    const ch = document.createElement("div"); ch.className = "chart"; fig.appendChild(ch);
    $("#fB2").appendChild(fig);
    km(ch, groups, { label: m.name });
  });
  (function () {
    const rows = vars4.map((v) => { const l = D.km[v].logrank; return `<tr><td>${D.vars[v].name}${v === "x4_t" ? " (기술용)" : ""}</td><td>${Object.values(D.vars[v].labels).join(" / ")}</td><td class="n">${f2(l.chi2)}</td><td class="n">${l.df}</td><td class="n">${p3(l.p)}${star(l.p)}</td></tr>`; });
    rows.push(`<tr class="sub"><td colspan="5">이분형(가설 판정용)</td></tr>`);
    [["x1_law", "법률", "법률 / 그 외"], ["x2_other", "타 부처 관여", "타 부처 관여 / 주관부처 단독"], ["x3_ban", "금지·제한형", "금지·제한형 / 기준 부재형"]].forEach(([b, n, g]) => {
      const l = D.binlr[b]; rows.push(`<tr><td class="ind">${n}</td><td>${g}</td><td class="n">${f2(l.chi2)}</td><td class="n">1</td><td class="n">${p3(l.p)}${star(l.p)}</td></tr>`);
    });
    table("#tB1", ["변수", "비교 범주", H("χ²", 1), H("df", 1), H("p", 1)], rows);
  })();

  // ===== 부록 C
  table("#tC1", ["변수", H("B", 1), H("SE", 1), H("HR", 1), H("95% CI", 1), H("p", 1)],
    D.cox.map((c) => `<tr><td>${c.label}</td><td class="n">${c.b.toFixed(3)}</td><td class="n">${c.se.toFixed(3)}</td><td class="n">${f2(c.hr)}</td><td class="n">[${f2(c.lo)}, ${f2(c.hi)}]</td><td class="n">${p3(c.p)}${star(c.p)}</td></tr>`)
      .concat([`<tr class="tot"><td colspan="6">−2LL = ${D.fit.m2ll} (공모형 ${D.fit.m2ll0}), LR χ²(3) = ${D.fit.lr}, <em>N</em> = ${M.N}, 전환 = ${M.E}</td></tr>`]));
  $("#tC1-note").innerHTML = `<em>주.</em> 최초 승인연도로 층화, 동률은 Breslow 방식. 각 변수는 이분형(법률 대 그 외, 타 부처 관여 대 주관부처 단독, 금지·제한형 대 기준 부재형). 변수당 사건 수 ${D.fit.epv}로 권장 기준 10에 못 미쳐 추정이 불안정할 수 있다. †<em>p</em> &lt; .10, *<em>p</em> &lt; .05, **<em>p</em> &lt; .01, ***<em>p</em> &lt; .001.`;
  (function fC1() {
    const box = $("#fC1");
    box.innerHTML = `<div class="legend"><span><i class="dot" style="background:${C.green}"></i>M1 주 모형</span><span><i class="dot" style="background:${C.orange}"></i>R3 승인 건 단위</span><span><i class="dot" style="background:${C.gray}"></i>R4 연도 공변량</span></div>`;
    const W = 1000, Hh = 300, Lm = 190, R = 90, T = 34, B = 40;
    const s = svg(box, W, Hh, "위험비 포레스트"), lx = lin(Math.log(0.15), Math.log(10), Lm, W - R), x = (v) => lx(Math.log(v));
    [0.25, 0.5, 1, 2, 4, 8].forEach((t) => { el("line", { x1: x(t), x2: x(t), y1: T, y2: Hh - B, class: "gridline" }, s); el("text", { x: x(t), y: Hh - B + 18, "text-anchor": "middle", fill: C.muted, "font-size": 12 }, s, t); });
    el("line", { x1: x(1), x2: x(1), y1: T - 12, y2: Hh - B, stroke: C.muted, "stroke-dasharray": "4 3" }, s);
    el("text", { x: x(1) - 8, y: T - 16, "text-anchor": "end", fill: C.muted, "font-size": 12 }, s, "← 전환 지연");
    el("text", { x: x(1) + 8, y: T - 16, fill: C.muted, "font-size": 12 }, s, "전환 촉진 →");
    el("text", { x: W - R + 12, y: T - 16, fill: C.muted, "font-size": 12 }, s, "M1 HR");
    const band = (Hh - T - B) / 3, cols = [C.green, C.orange, C.gray];
    D.forest.forEach((f, i) => {
      const yc = T + band * (i + 0.5);
      el("text", { x: Lm - 14, y: yc + 4, "text-anchor": "end", "font-size": 14, "font-weight": 700, fill: C.ink }, s, f.label);
      el("text", { x: W - R + 12, y: yc - 14, "font-size": 13, "font-weight": 700, fill: C.ink }, s, f2(f.models[0].hr));
      f.models.forEach((m, k) => {
        const yy = yc + (k - 1) * 18, col = cols[k], hx = x(m.hr);
        el("line", { x1: x(Math.max(m.lo, 0.15)), x2: x(Math.min(m.hi, 10)), y1: yy, y2: yy, stroke: col, "stroke-width": k ? 2 : 3 }, s);
        const mk = k === 0 ? el("circle", { cx: hx, cy: yy, r: 6.5, fill: col, stroke: "#fff", "stroke-width": 2 }, s)
          : k === 1 ? el("rect", { x: hx - 5.5, y: yy - 5.5, width: 11, height: 11, fill: col, stroke: "#fff", "stroke-width": 2 }, s)
            : el("path", { d: `M${hx},${yy - 7}L${hx + 7},${yy}L${hx},${yy + 7}L${hx - 7},${yy}Z`, fill: col, stroke: "#fff", "stroke-width": 2 }, s);
        hover(mk, `<b>${f.label}</b><br>${m.model}<br>HR <b>${f2(m.hr)}</b> [${f2(m.lo)}, ${f2(m.hi)}] · p = ${p3(m.p)}`);
      });
    });
  })();
  (function tC2() {
    const c = D.cox, b = D.binlr, kmv = (v, code) => D.km[v].groups.find((g) => g.code === code).at[48].cum;
    const rows = [
      ["H1", "입법형식 위계가 높을수록 전환 지연", "HR < 1", f2(c[0].hr), p3(c[0].p), p3(b.x1_law.p), `법률 ${pct(kmv("x1_level", 3))} · 행정규칙 ${pct(kmv("x1_level", 1))} · 하위법령 ${pct(kmv("x1_level", 2))}`, "rej", "기각"],
      ["H2", "타 부처·복수 부처 소관일 때 전환 지연", "HR < 1", f2(c[1].hr), p3(c[1].p), p3(b.x2_other.p), `주관부처 단독 ${pct(kmv("x2_struct", 0))} · 타 부처 단독 ${pct(kmv("x2_struct", 1))} · 복수 ${pct(kmv("x2_struct", 2))}`, "rev", "기각(반대 방향 유의)"],
      ["H3", "금지·제한형이 기준 부재형보다 전환 지연", "HR < 1", f2(c[2].hr), p3(c[2].p), p3(b.x3_ban.p), `금지·제한형 ${pct(kmv("x3_ban", 1))} · 기준 부재형 ${pct(kmv("x3_ban", 0))}`, "rej", "기각"],
      ["H4", "승인 전 사회적 주목도가 높을수록 전환 촉진", "HR > 1", "—", "—", "—", `3분위 log-rank p = ${p3(D.km.x4_t.logrank.p)}(기술)`, "na", "검증 불가"],
      ["H5", "법률 단계에서 주목도의 촉진 효과가 더 큼", "HR > 1", "—", "—", "—", "상호작용 모형 미추정", "na", "검증 불가"],
    ];
    table("#tC2", ["가설", "내용", "기대", H("HR", 1), H("Cox p", 1), H("log-rank p", 1), "48개월 누적 전환", "판정"],
      rows.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="nw">${r[2]}</td><td class="n">${r[3]}</td><td class="n">${r[4]}</td><td class="n">${r[5]}</td><td><small>${r[6]}</small></td><td><span class="mark ${r[7]}">${r[8]}</span></td></tr>`));
  })();

  // ===== 부록 D
  (function () {
    const r1 = D.r1, rows = [`<tr class="sub"><td colspan="5">R1 48개월 내 전환 로지스틱 회귀 (N = ${r1.n}, 전환 ${r1.e})</td></tr>`,
      `<tr><td class="ind">법률</td><td>OR</td><td class="n">${f2(r1.x1.or)}</td><td class="n">[${f2(r1.x1.lo)}, ${f2(r1.x1.hi)}]</td><td class="n">${p3(r1.x1.p)}</td></tr>`,
      `<tr><td class="ind">타 부처 관여</td><td>OR</td><td class="n" colspan="2">추정 불가(준완전분리: 주관부처 단독 ${r1.x2.main_conv}/${r1.x2.main_n}, 타 부처 관여 ${r1.x2.other_conv}/${r1.x2.other_n})</td><td class="n">${p3(r1.x2.fisher_p)}<sup>a</sup></td></tr>`,
      `<tr><td class="ind">금지·제한형</td><td>OR</td><td class="n">${f2(r1.x3.or)}</td><td class="n">[${f2(r1.x3.lo)}, ${f2(r1.x3.hi)}]</td><td class="n">${p3(r1.x3.p)}</td></tr>`];
    [["R3 승인 건 단위, 과제 군집 강건 표준오차 (승인 747건, 전환 37)", 1], ["R4 승인연도를 범주형 공변량으로 투입 (N = 238, 전환 26)", 2]].forEach(([nm, k]) => {
      rows.push(`<tr class="sub"><td colspan="5">${nm}</td></tr>`);
      D.forest.forEach((f) => { const m = f.models[k]; rows.push(`<tr><td class="ind">${f.label.replace(/ \(H\d\)/, "")}</td><td>HR</td><td class="n">${f2(m.hr)}</td><td class="n">[${f2(m.lo)}, ${f2(m.hi)}]</td><td class="n">${p3(m.p)}</td></tr>`); });
    });
    table("#tD1", ["검증·변수", "추정치", H("값", 1), H("95% CI", 1), H("p", 1)], rows);
    table("#tD2", ["변수", H("χ²", 1), H("p", 1), "판정"], D.ph.map((r) => `<tr><td>${r.label}</td><td class="n">${r.chi2.toFixed(3)}</td><td class="n">${p3(r.p)}</td><td>${r.p < 0.05 ? '<span class="mark rev">위반 의심</span>' : '<span class="mark c">가정 유지</span>'}</td></tr>`));
    const tv = D.ph_tv, c = D.cox;
    table("#tD3", ["변수", H("HR", 1), H("95% CI", 1), H("p", 1)], [
      `<tr><td>법률 단계</td><td class="n">2.08</td><td class="n">[0.85, 5.10]</td><td class="n">.111</td></tr>`,
      `<tr><td>타 부처 관여</td><td class="n">2.58</td><td class="n">[0.84, 7.92]</td><td class="n">.098</td></tr>`,
      `<tr><td>금지·제한형</td><td class="n">0.23</td><td class="n">[0.01, 7.27]</td><td class="n">.408</td></tr>`,
      `<tr><td>금지·제한형 × ln(t)</td><td class="n">${f2(tv.hr)}</td><td class="n">[${f2(tv.lo)}, ${f2(tv.hi)}]</td><td class="n">${p3(tv.p)}</td></tr>`]);
    document.querySelector("#tD1").closest(".exhibit").querySelector(".apa-note").insertAdjacentHTML("beforeend", " <sup>a</sup>Fisher 정확검정 <em>p</em>.");
  })();

  // ===== 부록 E
  (function fE1() {
    const box = $("#fE1"), conv = D.units.filter((u) => u.ev).sort((a, b) => a.t - b.t);
    box.innerHTML = `<div class="legend">${[0, 1, 2].map((c) => `<span><i class="dot" style="background:${COL.x2_struct[c]}"></i>${L2[c]}</span>`).join("")}</div>`;
    const rowH = 22, Lm = 330, R = 60, T = 8, W = 1000, Hh = T + conv.length * rowH + 36;
    const s = svg(box, W, Hh, "전환 과제 소요기간"), x = lin(0, 50, Lm, W - R);
    [0, 12, 24, 36, 48].forEach((t) => { el("line", { x1: x(t), x2: x(t), y1: T, y2: Hh - 28, class: "gridline" }, s); el("text", { x: x(t), y: Hh - 10, "text-anchor": "middle", fill: C.muted, "font-size": 12 }, s, t + "개월"); });
    conv.forEach((u, i) => {
      const yy = T + i * rowH + rowH / 2, nm = u.title.length > 30 ? u.title.slice(0, 29) + "…" : u.title, g = el("g", {}, s);
      el("text", { x: Lm - 10, y: yy + 4, "text-anchor": "end", "font-size": 12.5, fill: C.ink2 }, s, nm);
      el("rect", { x: Lm, y: yy - 7, width: x(u.t) - Lm, height: 14, rx: 3, fill: COL.x2_struct[u.x2] }, g);
      el("text", { x: x(u.t) + 6, y: yy + 4, "font-size": 12, fill: C.ink }, s, u.t.toFixed(1));
      hover(g, `<b>${u.title}</b><br>${u.first} → ${u.eff} · <b>${u.t.toFixed(1)}개월</b><br>${L1[u.x1]} · ${L2[u.x2]} · ${L3[u.x3]}<br><span class="k">개선법령</span> ${u.imp.slice(0, 120)}`);
    });
  })();
  (function fE2() {
    const box = $("#fE2");
    box.innerHTML = `<div class="legend">${[0, 1, 2].map((c) => `<span><i style="border-color:${COL.x2_struct[c]}"></i>${L2[c]}</span>`).join("")}<span><i class="dot" style="background:${C.ink}"></i>전환 시점</span></div>`;
    const t0 = Date.parse("2019-01-01"), t1 = Date.parse("2025-10-01"), END = Date.parse(M.end);
    const rowH = 4.2, gapH = 34, Lm = 150, R = 20, T = 26, W = 1000;
    const groups = [0, 1, 2].map((c) => D.units.filter((u) => u.x2 === c).sort((a, b) => a.first.localeCompare(b.first)));
    const Hh = T + groups.reduce((a, g) => a + g.length * rowH + gapH, 0) + 30;
    const s = svg(box, W, Hh, "전체 과제 관찰 기간"), x = lin(t0, t1, Lm, W - R);
    for (let yv = 2019; yv <= 2025; yv++) { const xx = x(Date.parse(yv + "-01-01")); el("line", { x1: xx, x2: xx, y1: T - 6, y2: Hh - 26, class: "gridline" }, s); el("text", { x: xx + 4, y: T - 10, fill: C.muted, "font-size": 12 }, s, yv); }
    el("line", { x1: x(END), x2: x(END), y1: T - 6, y2: Hh - 26, stroke: C.ink, "stroke-dasharray": "3 3", opacity: 0.5 }, s);
    el("text", { x: x(END) - 4, y: Hh - 10, "text-anchor": "end", fill: C.muted, "font-size": 12 }, s, "관측 종료 2025. 8. 8.");
    let yy = T; const rows = [];
    groups.forEach((g, gi) => {
      el("text", { x: 0, y: yy + 14, "font-size": 13.5, "font-weight": 800, fill: C.ink }, s, L2[gi]);
      el("text", { x: 0, y: yy + 32, "font-size": 12, fill: C.muted }, s, `${g.length}개 · 전환 ${g.filter((u) => u.ev).length}`);
      g.forEach((u) => {
        const a = Date.parse(u.first), b = u.ev ? Date.parse(u.eff) : END;
        el("line", { x1: x(a), x2: x(b), y1: yy + rowH / 2, y2: yy + rowH / 2, stroke: COL.x2_struct[gi], "stroke-width": 2.6, opacity: u.ev ? 1 : 0.38 }, s);
        if (u.ev) el("circle", { cx: x(b), cy: yy + rowH / 2, r: 3.6, fill: C.ink, stroke: "#fff", "stroke-width": 1 }, s);
        rows.push({ y0: yy, y1: yy + rowH, u }); yy += rowH;
      });
      yy += gapH;
    });
    const hl = el("rect", { x: Lm, width: W - Lm - R, height: rowH, fill: C.ink, opacity: 0 }, s);
    const hit = el("rect", { x: 0, y: T, width: W, height: Hh - T, fill: "transparent" }, s);
    hit.addEventListener("mousemove", (e) => {
      const r = s.getBoundingClientRect(), py = ((e.clientY - r.top) / r.height) * Hh, row = rows.find((q) => py >= q.y0 - 0.6 && py < q.y1 + 0.6);
      if (!row) { hl.setAttribute("opacity", 0); hideTip(); return; }
      const u = row.u; hl.setAttribute("y", row.y0); hl.setAttribute("opacity", 0.08);
      showTip(`<b>${u.title}</b><br><span class="k">${u.id} · 최초 승인</span> ${u.first} · 승인 ${u.n}건<br>${u.ev ? `<b style="color:${C.green}">전환</b> ${u.eff} (${u.t.toFixed(1)}개월)` : `미전환 · ${u.t.toFixed(1)}개월 관찰`}<br>${L1[u.x1]} · ${L2[u.x2]} · ${L3[u.x3]} · 기사 ${u.x4.toLocaleString()}건`, e);
    });
    hit.addEventListener("mouseleave", () => { hl.setAttribute("opacity", 0); hideTip(); });
  })();
  (function tE1() {
    const head = ["ID", "과제명", "최초 승인", H("승인", 1), "위계(X1)", "관할(X2)", "장벽(X3)", H("기사(X4)", 1), "결과", H("기간(월)", 1)];
    function render() {
      const q = $("#f-q").value.trim().toLowerCase(), fx = $("#f-x2").value, fe = $("#f-ev").value;
      const rows = D.units.filter((u) => (!q || (u.title + u.prov + u.ag + u.x3note).toLowerCase().includes(q)) && (fx === "" || String(u.x2) === fx) && (fe === "" || String(u.ev) === fe));
      table("#tE1", head, rows.map((u) => `<tr><td>${u.id}</td><td><details><summary>${u.title}</summary><div class="more"><b>관련규정</b> ${u.prov}<br><b>소관기관</b> ${u.ag.replace(/;/g, ", ")}<br><b>장벽 판단</b> ${u.x3note} <span class="mark ${u.x3c === "C" ? "c" : "j"}">${u.x3c === "C" ? "규칙" : "판단"}</span><br><b>검색식</b> ${u.q}${u.imp ? `<br><b>개선법령</b> ${u.imp}` : ""}</div></details></td><td>${u.first}</td><td class="n">${u.n}</td><td>${L1[u.x1]}</td><td>${L2[u.x2]}</td><td>${L3[u.x3]}</td><td class="n">${u.x4.toLocaleString()}</td><td>${u.ev ? `<span class="mark ev">전환</span> ${u.eff}` : '<span class="mark ce">미전환</span>'}</td><td class="n">${u.t.toFixed(1)}</td></tr>`));
      $("#tE1-note").innerHTML = `<em>주.</em> 현재 ${rows.length}개 표시(전환 ${rows.filter((u) => u.ev).length}). 과제명을 누르면 관련규정·소관기관·장벽 판단 근거·검색식이 표시된다. 장벽 판단의 '판단'은 경계 사례로 연구자 판단이 개입된 코딩(${M.x3.j}개)이다. 기간은 최초 승인부터 전환 또는 관측 종료일까지다.`;
    }
    ["#f-q", "#f-x2", "#f-ev"].forEach((s) => $(s).addEventListener("input", render));
    render();
  })();

  // ===== 부록 F
  const by = Object.fromEntries(D.units.map((u) => [u.id, u]));
  table("#tF1", [H("#", 1), "전환 과제", H("기간", 1), "대응 미전환 과제", H("관찰", 1), "공통 조건", "다른 조건"], D.pairs.map((p, i) => {
    const c = by[p.conv], n = by[p.non], diff = [];
    if (c.x1 !== n.x1) diff.push(`위계 ${L1[c.x1]}↔${L1[n.x1]}`);
    if (c.x3 !== n.x3) diff.push(`장벽 ${L3[c.x3]}↔${L3[n.x3]}`);
    if (p.gap_years >= 0.5) diff.push(`승인 시기 ${p.gap_years}년 차`);
    return `<tr><td class="n">${i + 1}</td><td>${c.title}<br><small>${c.first}</small></td><td class="n">${c.t.toFixed(1)}개월</td><td>${n.title}<br><small>${n.first} · 승인 ${n.n}건</small></td><td class="n">${n.t.toFixed(1)}개월+</td><td><small>${L2[c.x2]}${p.same.includes("위계") ? " · " + L1[c.x1] : ""}${p.same.includes("장벽") ? " · " + L3[c.x3] : ""}</small></td><td><small>${diff.join("<br>") || "—"}</small></td></tr>`;
  }));
  function pairTable(id, left, right, rows) {
    table(id, ["구분", `${left} <span class="mark ev">전환</span>`, `${right} <span class="mark ce">미전환</span>`], rows.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`));
  }
  (function () {
    const w = by.U005, w2 = by.U012, m = by.U026;
    pairTable("#tF2", "휠체어 전동보조키트(U005)", "공유미용실(U026)", [
      ["공통 조건", "타 부처 단독 소관(식품의약품안전처) · 법률 아래 단계 규범(고시)", "타 부처 단독 소관(보건복지부) · 법률 아래 단계 규범(시행규칙)"],
      ["최초 승인", `${w.first} · 승인 ${w.n}건`, `${m.first} · 같은 규제 승인 ${m.n}건 누적`],
      ["규제 장벽", "기준 부재형: 전동보조키트에 적용할 의료기기 기준규격·품목분류 없음", "금지·제한형: 영업장마다 독립 시설을 요구하는 '1영업장 1영업자' 원칙"],
      ["해소 경로", "품목분류 신설(식약처 고시 개정)", "시설기준 완화 필요(공중위생관리법 시행규칙)"],
      ["승인 후 경과", `약 9개월 만에 품목분류 고시 개정(사례분석) · 규제법령현황 시행일 ${w.eff}, ${w.t.toFixed(1)}개월(정량분석) · 유사 과제 서브키트(U012) ${w2.t.toFixed(1)}개월`, `${m.t.toFixed(1)}개월째 미전환`],
      ["승인 전 기사 수", `${w.x4}건`, `${m.x4}건`],
      ["차이 요인", "반대 집단 부재 — 새 기준을 만들면 끝나는 문제", "미용업계의 조직적 반대 — 기존 사업자 보호 규정의 완화 필요"],
    ]);
    $("#tF2-note").innerHTML = "<em>주.</em> 휠체어 사례의 전환 시점은 기준에 따라 다르다. 사례분석은 품목분류 고시 개정 시점, 정량분석은 한국산업기술진흥원 규제법령현황의 시행일을 썼다.";
    const pp = by.U125, vib = by.U066, lh = by.U055, lh2 = by.U127;
    pairTable("#tF3", "PP 전력케이블(U125) · VIB ESS 충전소(U066)", "액화수소 생산·운송·충전소(U055)", [
      ["공통 조건", "주관부처(산업통상자원부) 단독 소관 · 기준 부재형", "주관부처(산업통상자원부) 단독 소관 · 기준 부재형"],
      ["최초 승인", `PP 케이블 ${pp.first} · VIB ESS ${vib.first}`, `${lh.first} · 승인 ${lh.n}건`],
      ["규제 장벽", "기존 기술기준(한국전기설비규정, KEC)이 새 소재·전지를 포함하지 않음", "개정할 대상 기준 자체가 없음(액화수소 설비 안전기준 신규 제정 필요)"],
      ["해소 경로", "KEC 개정(기존 체계에 항목 추가)", "실증안전기준 → 정식 기준 제정 대기"],
      ["승인 후 경과", `PP 케이블 ${pp.t.toFixed(1)}개월(${pp.eff}) · VIB ESS ${vib.t.toFixed(1)}개월(${vib.eff})`, `${lh.t.toFixed(1)}개월째 미전환 · 상용차용 액화수소충전소(U127)도 ${lh2.t.toFixed(1)}개월째 미전환`],
      ["승인 전 기사 수", `${pp.x4}건 · ${vib.x4}건`, `${lh.x4.toLocaleString()}건`],
      ["차이 요인", "개정할 기준 체계 존재", "기준 제정 지연 — 주목도가 높아도 전환되지 않음"],
    ]);
    $("#tF3-note").innerHTML = "<em>주.</em> 주관부처 단독 과제 111개 중 62개가 수소·가스 계열이며, 이것이 정량분석에서 H2가 반대 방향으로 나온 배경으로 보인다. PP 케이블은 포털 관련규정에 법률 조항만 기재되어 정량 코딩상 법률 단계(X1 = 3)이나 실제 개정 대상은 고시(KEC)였다.";
  })();

  // ===== 부록 G
  table("#tG1", ["자료", "기준일·수집일", "사용 변수"], [
    "<tr><td>규제샌드박스 통합포털 산업융합 과제 목록·상세(938건)</td><td>2026. 10. 13. 수집</td><td>모집단, 승인일, 특례 유형, 규제부처, 관련규정(법령·조항)</td></tr>",
    "<tr><td>한국산업기술진흥원 규제법령현황(규제개선 '완료' 40행)</td><td>2025. 8. 8.</td><td>전환 여부, 개선법령 시행일(종속변수)</td></tr>",
    "<tr><td>한국산업기술진흥원 규제샌드박스 규제유형별 총괄 현황</td><td>2026. 8. 14.</td><td>규제 장벽 유형(X3) 판단 참고</td></tr>",
    "<tr><td>국가법령정보센터 Open API</td><td>2026. 10. 13. 조회</td><td>관련규정별 법령 종류(X1), 소관부처(X2, 2025. 8. 직제로 환산)</td></tr>",
    "<tr><td>빅카인즈 뉴스 검색</td><td>2026. 10. 13. 조회</td><td>최초 승인 전 12개월 기사 수(X4)</td></tr>",
  ]);
  table("#tG2", ["검증 항목", "결과", "판정"], D.verify.items.map((s) => {
    const m = s.match(/^\[(.+?)\]\s*(.+?)(?:\s+(독립 [\dχ].*|p [\d.]+))?$/) || [null, "통과", s, ""];
    return `<tr><td>${m[2]}</td><td><small>${m[3] || "재계산 결과 동일"}</small></td><td><span class="mark ${m[1] === "통과" ? "c" : "rev"}">${m[1] === "통과" ? "일치" : "불일치"}</span></td></tr>`;
  }));
})();
