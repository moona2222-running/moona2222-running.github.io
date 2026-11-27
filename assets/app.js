/* 러닝 대시보드 — Strava 기록(runs.json)을 읽어 요약·차트·목록을 그립니다. */
(function () {
  "use strict";

  var PAGE_SIZE = 40;
  var state = { all: [], year: "all", q: "", shown: PAGE_SIZE };

  /* ---------- helpers ---------- */
  function km(v) {
    return v >= 100 ? Math.round(v).toLocaleString("ko-KR") : v.toFixed(1);
  }
  function n(v) { return v.toLocaleString("ko-KR"); }
  function paceText(sec, distKm) {
    if (!distKm || !sec) return "—";
    var p = sec / distKm;
    var m = Math.floor(p / 60);
    var s = Math.round(p % 60);
    if (s === 60) { m += 1; s = 0; }
    return m + "′" + String(s).padStart(2, "0") + "″";
  }
  function durText(sec) {
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return m + ":" + String(s).padStart(2, "0");
  }
  function d(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtLocal(x) {
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function mondayOf(date) {
    var x = new Date(date.getTime());
    var day = (x.getDay() + 6) % 7; // Mon = 0
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  /* ---------- rendering ---------- */
  function renderSummary(runs) {
    var totalKm = 0, totalSec = 0, totalElev = 0;
    runs.forEach(function (r) { totalKm += r.km; totalSec += r.sec; totalElev += r.elev; });

    document.getElementById("v-dist").innerHTML = km(totalKm) + "<small>km</small>";
    document.getElementById("v-count").innerHTML = n(runs.length) + "<small>회</small>";
    document.getElementById("v-pace").textContent = paceText(totalSec, totalKm);
    document.getElementById("v-pace").setAttribute("data-unit", "");
    document.getElementById("h-pace").textContent = "누적 " + Math.round(totalSec / 3600).toLocaleString("ko-KR") + "시간 기준";

    var last = runs[0];
    if (last) {
      document.getElementById("v-last").innerHTML = km(last.km) + "<small>km</small>";
      document.getElementById("h-last").textContent =
        last.date.slice(0, 4) + "." + last.date.slice(5, 7) + "." + last.date.slice(8, 10) +
        " · " + paceText(last.sec, last.km) + "/km";
    }
    document.getElementById("v-elev").innerHTML = n(Math.round(totalElev)) + "<small>m</small>";
    document.getElementById("h-elev").textContent = "누적 상승 고도";
    document.getElementById("v-hours").innerHTML = n(Math.round(totalSec / 3600)) + "<small>시간</small>";
    document.getElementById("h-hours").textContent = "누적 시간";
  }

  /* monthly bar chart: last 24 months ending this month */
  function renderMonthly(runs) {
    var host = document.getElementById("chart-monthly");
    var byMonth = {};
    runs.forEach(function (r) {
      var k = r.date.slice(0, 7);
      byMonth[k] = (byMonth[k] || 0) + r.km;
    });

    var now = new Date();
    var keys = [];
    for (var i = 23; i >= 0; i--) {
      var d0 = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var k = d0.getFullYear() + "-" + String(d0.getMonth() + 1).padStart(2, "0");
      keys.push({ key: k, label: (d0.getMonth() + 1) + "월", year: d0.getFullYear() });
    }
    var vals = keys.map(function (k) { return byMonth[k.key] || 0; });
    var max = Math.max.apply(null, vals.concat([1]));

    var W = 720, H = 210, padL = 34, padR = 6, padT = 14, padB = 34;
    var bw = (W - padL - padR) / vals.length;
    var svg = ['<svg class="chart" viewBox="0 0 ' + W + " " + H + '" width="100%" height="210" role="img" aria-label="월별 거리 추이">'];

    // gridlines
    var ticks = 3;
    for (var t = 0; t <= ticks; t++) {
      var yv = max * t / ticks;
      var y = padT + (H - padT - padB) * (1 - t / ticks);
      svg.push('<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y +
        '" stroke="' + cssVar("--line") + '" stroke-width="1"/>');
      svg.push('<text x="' + (padL - 6) + '" y="' + (y + 3.5) + '" text-anchor="end" font-size="9.5" fill="' +
        cssVar("--muted") + '">' + Math.round(yv) + "</text>");
    }

    vals.forEach(function (v, idx) {
      var h = (v / max) * (H - padT - padB);
      var x = padL + idx * bw + bw * 0.18;
      var w = bw * 0.64;
      var y = H - padB - h;
      var isCur = idx === vals.length - 1;
      svg.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) +
        '" height="' + Math.max(h, v > 0 ? 2 : 0).toFixed(1) + '" rx="3" fill="' +
        (isCur ? cssVar("--bar") : cssVar("--bar-soft")) + '"><title>' +
        keys[idx].year + "년 " + (keys[idx].label) + " · " + v.toFixed(1) + " km</title></rect>");
      if (v >= max * 0.55) {
        svg.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) +
          '" text-anchor="middle" font-size="9" font-weight="700" fill="' + cssVar("--muted") + '">' +
          Math.round(v) + "</text>");
      }
      // label every month on wide charts, every 2nd on narrow
      var every = 1;
      if (keys[idx].label === "1월" || idx === 0 || isCur) {
        svg.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - padB + 14) +
          '" text-anchor="middle" font-size="9.5" fill="' + cssVar("--muted") + '">' + keys[idx].label + "</text>");
        if (keys[idx].label === "1월") {
          svg.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - padB + 25) +
            '" text-anchor="middle" font-size="8.5" fill="' + cssVar("--muted") + '">' + keys[idx].year + "</text>");
        }
      }
    });

    svg.push("</svg>");
    host.innerHTML = svg.join("");
  }

  /* weekly bar chart: last 16 weeks */
  function renderWeekly(runs) {
    var host = document.getElementById("chart-weekly");
    var byWeek = {};
    runs.forEach(function (r) {
      var m = mondayOf(d(r.date));
      var k = fmtLocal(m);
      byWeek[k] = (byWeek[k] || 0) + r.km;
    });

    var thisMon = mondayOf(new Date());
    var keys = [];
    for (var i = 15; i >= 0; i--) {
      var wk = new Date(thisMon.getTime());
      wk.setDate(wk.getDate() - i * 7);
      var k = fmtLocal(wk);
      keys.push({ key: k, date: wk });
    }
    var vals = keys.map(function (k) { return byWeek[k.key] || 0; });
    var max = Math.max.apply(null, vals.concat([1]));

    var W = 720, H = 170, padL = 30, padR = 6, padT = 16, padB = 28;
    var bw = (W - padL - padR) / vals.length;
    var svg = ['<svg class="chart" viewBox="0 0 ' + W + " " + H + '" width="100%" height="170" role="img" aria-label="주별 거리">'];
    [0, 1, 2].forEach(function (t) {
      var y = padT + (H - padT - padB) * (1 - t / 2);
      svg.push('<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y +
        '" stroke="' + cssVar("--line") + '" stroke-width="1"/>');
      svg.push('<text x="' + (padL - 6) + '" y="' + (y + 3.5) + '" text-anchor="end" font-size="9.5" fill="' +
        cssVar("--muted") + '">' + Math.round(max * t / 2) + "</text>");
    });
    vals.forEach(function (v, idx) {
      var h = (v / max) * (H - padT - padB);
      var x = padL + idx * bw + bw * 0.22;
      var w = bw * 0.56;
      var y = H - padB - h;
      var isCur = idx === vals.length - 1;
      svg.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) +
        '" height="' + Math.max(h, v > 0 ? 2 : 0).toFixed(1) + '" rx="2.5" fill="' +
        (isCur ? cssVar("--bar") : cssVar("--bar-soft")) + '"><title>' +
        keys[idx].key + " 주 · " + v.toFixed(1) + " km</title></rect>");
      if (idx % 2 === 0 || isCur) {
        var lab = (keys[idx].date.getMonth() + 1) + "/" + keys[idx].date.getDate();
        svg.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - padB + 14) +
          '" text-anchor="middle" font-size="9" fill="' + cssVar("--muted") + '">' + lab + "</text>");
      }
    });
    svg.push("</svg>");
    host.innerHTML = svg.join("");
  }

  function filtered() {
    return state.all.filter(function (r) {
      if (state.year !== "all" && r.date.slice(0, 4) !== state.year) return false;
      if (state.q) {
        var q = state.q.toLowerCase();
        var hay = (r.title + " " + r.date).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderList() {
    var runs = filtered();
    var ol = document.getElementById("runs");
    var show = runs.slice(0, state.shown);
    var html = show.map(function (r) {
      var y = r.date.slice(0, 4), m = r.date.slice(5, 7), dd = r.date.slice(8, 10);
      var trail = r.sport === "TrailRun" ? '<span class="badge-trail">트레일</span>' : "";
      return '<li class="run">' +
        '<div class="date"><b>' + m + "." + dd + "</b>" + y + "</div>" +
        '<div class="title"><a href="https://www.strava.com/activities/' + r.id + '" target="_blank" rel="noopener">' +
        r.title.replace(/</g, "&lt;") + trail + "</a></div>" +
        '<div class="dist">' + r.km.toFixed(2) + "<small> km</small></div>" +
        '<div class="meta"><span>' + durText(r.sec) + "</span><span>" + paceText(r.sec, r.km) +
        "/km</span><span>↑" + Math.round(r.elev) + " m</span></div>" +
        "</li>";
    }).join("");
    ol.innerHTML = html || '<li class="empty">해당 기간에 기록이 없습니다.</li>';

    document.getElementById("count").textContent =
      n(runs.length) + "개 중 " + n(Math.min(show.length, runs.length)) + "개 표시";
    var btn = document.getElementById("more");
    btn.style.display = runs.length > state.shown ? "block" : "none";
  }

  function renderYearChips() {
    var years = {};
    state.all.forEach(function (r) {
      var y = r.date.slice(0, 4);
      years[y] = (years[y] || 0) + r.km;
    });
    var list = Object.keys(years).sort().reverse();
    var host = document.getElementById("chips");
    var parts = ['<button class="chip" data-year="all" aria-pressed="' + (state.year === "all") + '">전체</button>'];
    list.forEach(function (y) {
      parts.push('<button class="chip" data-year="' + y + '" aria-pressed="' + (state.year === y) + '">' +
        y + " <span style=\"opacity:.55;font-weight:600\">" + km(years[y]) + "km</span></button>");
    });
    host.innerHTML = parts.join("");
    host.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        state.year = b.getAttribute("data-year");
        state.shown = PAGE_SIZE;
        renderYearChips();
        renderList();
        renderPeriodSummary();
      });
    });
  }

  function renderPeriodSummary() {
    var runs = filtered();
    var el = document.getElementById("period-summary");
    if (!runs.length) { el.textContent = ""; return; }
    var tKm = 0, tSec = 0;
    runs.forEach(function (r) { tKm += r.km; tSec += r.sec; });
    el.textContent = state.year === "all"
      ? "전체 기간 " + n(runs.length) + "회 · " + km(tKm) + " km · 평균 페이스 " + paceText(tSec, tKm) + "/km"
      : state.year + "년 " + n(runs.length) + "회 · " + km(tKm) + "km · 평균 페이스 " + paceText(tSec, tKm) + "/km";
  }

  function setUpdated(runs) {
    var newest = runs[0];
    if (!newest) return;
    var el = document.getElementById("updated");
    el.textContent = "최근 기록 " + newest.date.replace(/-/g, ".") + " · Strava 연동 데이터";
  }

  /* ---------- boot ---------- */
  fetch("data/runs.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (runs) {
      runs.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.sec - a.sec; });
      state.all = runs;
      renderSummary(runs);
      renderMonthly(runs);
      renderWeekly(runs);
      renderYearChips();
      renderList();
      renderPeriodSummary();
      setUpdated(runs);

      document.getElementById("more").addEventListener("click", function () {
        state.shown += PAGE_SIZE;
        renderList();
      });
      var input = document.getElementById("q");
      var t = null;
      input.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.q = input.value.trim();
          state.shown = PAGE_SIZE;
          renderList();
          renderPeriodSummary();
        }, 140);
      });
    })
    .catch(function (e) {
      document.getElementById("chart-monthly").innerHTML =
        '<p class="empty">기록을 불러오지 못했습니다 (' + e.message + ").</p>";
    });
})();
