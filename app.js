(function () {
  "use strict";
  const IC = window.IChing;
  const $ = id => document.getElementById(id);
  const HKEY = "yaogua_history_v1";

  let stepValues = [];   // 逐爻模式累積的爻值
  let busy = false;

  /* ---------- 繪圖 ---------- */
  function hexHTML(bits, kinds, showMarks) {
    // 由上往下顯示
    let html = '<div class="hx">';
    for (let i = 5; i >= 0; i--) {
      const yang = bits[i] === 1;
      const mv = kinds && kinds[i].moving;
      html += '<div class="ln ' + (yang ? "yang" : "yin") + (mv && showMarks ? " mv" : "") + '">' +
        (yang ? "<i></i>" : "<i></i><i></i>") +
        (showMarks && mv ? '<span class="mk">' + kinds[i].mark + "</span>" : "") +
        "</div>";
    }
    return html + "</div>";
  }

  function col(title, h, bits, kinds, marks) {
    return '<div class="col">' + hexHTML(bits, kinds, marks) +
      '<div class="cap">' + title + '</div><div class="nm">' + h.name + "</div>" +
      '<div class="cap">第' + h.no + "卦</div></div>";
  }

  /* ---------- 結果顯示 ---------- */
  function render(res, question) {
    $("result").hidden = false;
    $("r-question").textContent = question ? "所問:" + question : "";

    let trio = col("本卦", res.main, res.bits, res.kinds, true);
    trio += col("互卦", res.mutual, res.mutual.bits, null, false);
    trio += res.changed
      ? col("變卦", res.changed, res.changed.bits, null, false)
      : '<div class="col"><div class="cap" style="padding-top:40px">無動爻<br>無變卦</div></div>';
    $("r-trio").innerHTML = trio;

    const g = res.guide;
    $("r-guide").innerHTML =
      "<h2>斷卦重點</h2>" +
      '<span class="badge">' + (res.moving.length ? res.moving.length + " 爻動" : "靜卦") + "</span>" +
      '<span class="badge">' + g.rule + "</span>" +
      '<div class="focus">' + g.focus + "</div><p>" + g.detail + "</p>";

    $("r-main").innerHTML =
      "<h2>本卦 · " + res.main.name + "</h2>" +
      '<p><span class="badge">' + res.main.keyword + '</span><span class="badge">' + res.main.structure + "</span></p>" +
      "<p>" + res.main.text + "</p>" +
      "<p class='hint'>本卦代表目前的處境與事情的起點。</p>";

    const ch = $("r-changed");
    if (res.changed) {
      ch.hidden = false;
      ch.innerHTML =
        "<h2>變卦 · " + res.changed.name + "</h2>" +
        '<p><span class="badge">' + res.changed.keyword + '</span><span class="badge">' + res.changed.structure + "</span></p>" +
        "<p>" + res.changed.text + "</p>" +
        "<p class='hint'>變卦代表事情的發展方向與可能的結果。</p>";
    } else {
      ch.hidden = true;
    }

    let lines = "<h2>各爻位置</h2>";
    if (res.moving.length) {
      lines += "<p class='hint'>動爻是目前最需要留意的變化點。</p>";
      res.moving.forEach(n => {
        const k = res.kinds[n - 1];
        lines += '<div class="mvline"><b>' + IC.LINE_NAMES[n - 1] + "(" + k.label + k.mark + ")</b>:" +
          IC.LINE_MEANING[n - 1] + "。</div>";
      });
    } else {
      lines += "<p>沒有動爻,六爻皆安靜。可直接以本卦整體卦義為主。</p>";
    }
    $("r-lines").innerHTML = lines;

    $("r-extra").innerHTML =
      "<h2>延伸卦象</h2><div class='extra-grid'>" +
      "<div><small>互卦(事情過程、內在)</small><b>" + res.mutual.name + "</b><br>" + res.mutual.keyword + "</div>" +
      "<div><small>錯卦(陰陽全反、對立面)</small><b>" + res.opposite.name + "</b><br>" + res.opposite.keyword + "</div>" +
      "<div><small>綜卦(上下顛倒、對方視角)</small><b>" + res.reversed.name + "</b><br>" + res.reversed.keyword + "</div>" +
      "</div>";

    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resultText(res, question) {
    const lines = [];
    if (question) lines.push("所問:" + question);
    lines.push("本卦:" + res.main.name + "(" + res.main.keyword + ")");
    lines.push("互卦:" + res.mutual.name);
    lines.push("變卦:" + (res.changed ? res.changed.name + "(" + res.changed.keyword + ")" : "無"));
    lines.push("動爻:" + (res.moving.length ? res.moving.map(n => IC.LINE_NAMES[n - 1]).join("、") : "無"));
    lines.push("斷卦:" + res.guide.focus);
    lines.push(res.guide.detail);
    return lines.join("\n");
  }

  /* ---------- 起卦過程 ---------- */
  function liveRow(i, t) {
    const k = IC.LINE_KIND[t.value];
    const coins = t.coins.map(c => (c === 3 ? "正" : "反")).join(" ");
    return '<div class="live-row"><span class="nm">' + IC.LINE_NAMES[i] + "</span>" +
      '<div class="ln ' + (k.yang ? "yang" : "yin") + (k.moving ? " mv" : "") + '" style="flex:1;max-width:120px">' +
      (k.yang ? "<i></i>" : "<i></i><i></i>") + "</div>" +
      "<span>" + coins + " = " + t.value + " " + k.label + k.mark + "</span></div>";
  }

  function showCoins(t, spin) {
    const els = $("coins").children;
    for (let i = 0; i < 3; i++) {
      els[i].textContent = t.coins[i] === 3 ? "正" : "反";
      els[i].classList.remove("spin");
      if (spin) { void els[i].offsetWidth; els[i].classList.add("spin"); }
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function castAll() {
    if (busy) return;
    busy = true;
    setButtons(true);
    $("result").hidden = true;
    $("live").hidden = false;
    $("live-lines").innerHTML = "";
    const tosses = [];
    for (let i = 0; i < 6; i++) {
      const t = IC.tossLine();
      tosses.push(t);
      showCoins(t, true);
      $("live-lines").insertAdjacentHTML("beforeend", liveRow(i, t));
      if (!reduced()) await sleep(550);
    }
    finish(tosses.map(t => t.value));
    busy = false;
    setButtons(false);
  }

  function castStep() {
    if (busy) return;
    if (stepValues.length === 0) {
      $("result").hidden = true;
      $("live").hidden = false;
      $("live-lines").innerHTML = "";
    }
    const t = IC.tossLine();
    showCoins(t, true);
    $("live-lines").insertAdjacentHTML("beforeend", liveRow(stepValues.length, t));
    stepValues.push(t.value);
    $("step-n").textContent = Math.min(stepValues.length + 1, 6);
    if (stepValues.length === 6) {
      const vals = stepValues.slice();
      stepValues = [];
      $("step-n").textContent = 1;
      finish(vals);
    }
  }

  function finish(values) {
    const q = $("question").value.trim();
    const res = IC.analyze(values);
    render(res, q);
    saveHistory(values, q, res);
  }

  function setButtons(dis) {
    ["btn-all", "btn-step", "btn-manual"].forEach(id => ($(id).disabled = dis));
  }

  /* ---------- 手動排卦 ---------- */
  function buildManual() {
    const wrap = $("manual-rows");
    let html = "";
    for (let i = 0; i < 6; i++) {
      html += '<div class="mrow"><span>' + IC.LINE_NAMES[i] + "</span>" +
        '<select data-i="' + i + '">' +
        '<option value="7">少陽 ⚊(不動)</option>' +
        '<option value="8">少陰 ⚋(不動)</option>' +
        '<option value="9">老陽 ○(動,陽變陰)</option>' +
        '<option value="6">老陰 ×(動,陰變陽)</option>' +
        "</select></div>";
    }
    wrap.innerHTML = html;
  }

  function manualCast() {
    const vals = Array.from(document.querySelectorAll("#manual-rows select")).map(s => +s.value);
    $("live").hidden = true;
    finish(vals);
  }

  /* ---------- 歷史紀錄(localStorage,失敗時靜默) ---------- */
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch (e) { return []; }
  }
  function storeHistory(list) {
    try { localStorage.setItem(HKEY, JSON.stringify(list)); } catch (e) { /* 忽略 */ }
  }
  function saveHistory(values, q, res) {
    const list = loadHistory();
    list.unshift({ t: Date.now(), v: values, q: q, m: res.main.name, c: res.changed ? res.changed.name : "" });
    storeHistory(list.slice(0, 10));
    renderHistory();
  }
  function renderHistory() {
    const list = loadHistory();
    $("history-card").hidden = list.length === 0;
    const ul = $("history");
    ul.innerHTML = "";
    list.forEach((h, idx) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const d = new Date(h.t);
      const when = d.toLocaleString("zh-TW", { hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      left.innerHTML = "<b></b> <span class='when'></span><div class='when q'></div>";
      left.querySelector("b").textContent = h.m + (h.c ? " → " + h.c : "");
      left.querySelector(".when").textContent = when;
      left.querySelector(".q").textContent = h.q || "";
      const btn = document.createElement("button");
      btn.textContent = "查看";
      btn.addEventListener("click", () => {
        $("question").value = h.q || "";
        $("live").hidden = true;
        render(IC.analyze(h.v), h.q || "");
      });
      li.appendChild(left); li.appendChild(btn); ul.appendChild(li);
    });
  }

  /* ---------- 其他互動 ---------- */
  function toast(msg) {
    $("toast").textContent = msg;
    setTimeout(() => { $("toast").textContent = ""; }, 2200);
  }

  async function copyResult() {
    const last = loadHistory()[0];
    if (!last) return;
    const text = resultText(IC.analyze(last.v), last.q);
    try {
      await navigator.clipboard.writeText(text);
      toast("已複製");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("已複製"); } catch (e2) { toast("複製失敗,請手動選取"); }
      document.body.removeChild(ta);
    }
  }

  function switchMode(mode) {
    document.querySelectorAll(".tab").forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    $("mode-coin").hidden = mode !== "coin";
    $("mode-manual").hidden = mode !== "manual";
  }

  function init() {
    buildManual();
    renderHistory();
    $("btn-all").addEventListener("click", castAll);
    $("btn-step").addEventListener("click", castStep);
    $("btn-manual").addEventListener("click", manualCast);
    $("btn-copy").addEventListener("click", copyResult);
    $("btn-again").addEventListener("click", () => {
      $("result").hidden = true; $("live").hidden = true;
      stepValues = []; $("step-n").textContent = 1;
      $("question").value = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("btn-clear").addEventListener("click", () => { storeHistory([]); renderHistory(); });
    document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => switchMode(b.dataset.mode)));
  }

  init();
})();
