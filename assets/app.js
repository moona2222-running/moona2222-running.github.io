/* 러닝 대시보드 — 서울마라톤 16주 훈련 계획(plan.json)과 Strava 기록(runs.json)을 읽어 그립니다. */
(function () {
  "use strict";

  var PAGE_SIZE = 40;
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];
  var state = {
    all: [], plan: null, planMap: {}, byDate: {},
    year: "all", q: "", shown: PAGE_SIZE, view: "plan"
  };
  var runsSub = "Strava 연동 데이터";

  /* ---------- helpers ---------- */
  function km(v) {
    if (v >= 100) {
      return v.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return v.toFixed(1);
  }
  function fmtKm(v) {
    return v.toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  function kmLabel(v) {
    return v % 1 === 0 ? v.toFixed(1) : v.toLocaleString("ko-KR", { maximumFractionDigits: 3 });
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
  function md(iso) { return iso.slice(5, 7) + "." + iso.slice(8, 10); }
  function dot(iso) { return iso.replace(/-/g, "."); }
  function today0() { var x = new Date(); x.setHours(0, 0, 0, 0); return x; }
  function dayDiff(a, b) { return Math.round((a.getTime() - b.getTime()) / 86400000); }
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
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- 화면 전환 ---------- */
  function planHeadline() {
    if (!state.plan) return "서울마라톤 16주 훈련";
    var dd = dayDiff(d(state.plan.race.date), today0());
    var ddTxt = dd > 0 ? "D-" + dd : dd === 0 ? "D-DAY" : "D+" + (-dd);
    return "서울마라톤 " + ddTxt + " · 16주 훈련 · 목표 Sub 3:20";
  }
  function headerFor(view) {
    document.getElementById("updated").textContent = view === "plan" ? planHeadline() : runsSub;
    document.getElementById("head-pill").textContent =
      view === "plan" ? "🏅 서울마라톤 Sub 3:20" : "🏃 러닝 대시보드";
  }
  function setView(view, scroll) {
    state.view = view === "runs" ? "runs" : "plan";
    document.getElementById("view-plan").hidden = state.view !== "plan";
    document.getElementById("view-runs").hidden = state.view !== "runs";
    ["plan", "runs"].forEach(function (k) {
      document.getElementById("tab-" + k).setAttribute("aria-selected", String(state.view === k));
    });
    headerFor(state.view);
    try {
      if (location.hash !== "#" + state.view) history.replaceState(null, "", "#" + state.view);
    } catch (e) { /* hash 갱신 실패는 무시 */ }
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 전체 러닝 기록 ---------- */
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
      // label: every other month (not crowding the last bar), plus the current month
      var every = (idx % 2 === 0 && idx < vals.length - 2) || idx === vals.length - 1;
      if (every) {
        svg.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - padB + 14) +
          '" text-anchor="middle" font-size="9.5" fill="' + cssVar("--muted") + '">' + keys[idx].label + "</text>");
        if (keys[idx].label === "1월" || idx === 0) {
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
        y + ' <span style="opacity:.55;font-weight:600">' + Math.round(years[y]).toLocaleString("ko-KR") + "km</span></button>");
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
    runsSub = "최근 기록 " + newest.date.replace(/-/g, ".") + " · Strava 연동 데이터";
    if (state.view === "runs") document.getElementById("updated").textContent = runsSub;
  }

  /* ---------- 서울마라톤 훈련 현황 ---------- */
  function runsByDate(runs) {
    var map = {};
    runs.forEach(function (r) {
      var e = map[r.date] || (map[r.date] = { km: 0, sec: 0, count: 0 });
      e.km += r.km;
      e.sec += r.sec;
      e.count += 1;
    });
    return map;
  }

  function weekOfDate(plan, date) {
    for (var i = 0; i < plan.weeks.length; i++) {
      var w = plan.weeks[i];
      if (date >= d(w.start) && date <= d(w.end)) return w;
    }
    return null;
  }

  function weekActual(w) {
    return w.days.reduce(function (s, day) {
      var rec = state.byDate[day.date];
      return s + (rec ? rec.km : 0);
    }, 0);
  }

  function weekSessions(w, today) {
    var due = 0, done = 0;
    w.days.forEach(function (day) {
      if (day.type === "rest") return;
      var dd = d(day.date);
      if (dd > today) return;
      due++;
      var rec = state.byDate[day.date];
      if (rec && rec.km >= day.targetKm * 0.9) done++;
    });
    return { due: due, done: done };
  }

  function cumulative(plan, today) {
    var target = 0, actual = 0, due = 0, done = 0, planned = 0;
    var start = d(plan.race.startDate), race = d(plan.race.date);
    plan.weeks.forEach(function (w) {
      planned += w.targetKm;
      var st = d(w.start), en = d(w.end);
      if (st > today) return;
      if (en <= today) target += w.targetKm;
      else target += w.targetKm * Math.min(7, Math.max(0, dayDiff(today, st) + 1)) / 7;
      w.days.forEach(function (day) {
        if (day.type === "rest" || d(day.date) > today) return;
        due++;
        var rec = state.byDate[day.date];
        if (rec && rec.km >= day.targetKm * 0.9) done++;
      });
    });
    var upto = fmtLocal(today < race ? today : race);
    Object.keys(state.byDate).forEach(function (k) {
      if (k >= plan.race.startDate && k <= upto) actual += state.byDate[k].km;
    });
    if (today < start) actual = 0;
    return { target: target, actual: actual, due: due, done: done, planned: planned };
  }

  function dayStatus(day, today) {
    var rec = state.byDate[day.date];
    var dt = d(day.date);
    if (day.type === "rest") {
      return rec && rec.km > 0 ? { key: "extra", label: "휴식일 러닝" } : { key: "rest", label: "휴식" };
    }
    if (dt > today) return { key: "future", label: "예정" };
    if (!rec) {
      if (fmtLocal(today) === day.date) return { key: "future", label: "예정" };
      return { key: "miss", label: "미실시" };
    }
    var r = rec.km / day.targetKm;
    if (r >= 0.9) return { key: "ok", label: "달성" };
    if (r >= 0.6) return { key: "partial", label: "부분 달성" };
    return { key: "short", label: "미달" };
  }

  function paceTagFor(day, rec) {
    var z = state.plan && state.plan.paceZones ? state.plan.paceZones[day.paceZone] : null;
    if (!z || !z.min || !rec || !rec.km) return "";
    if (["easy", "recovery", "mlr", "long", "shake", "race"].indexOf(day.type) === -1) return "";
    var p = rec.sec / rec.km;
    if (p < z.min - 10) return '<span class="ptag fast">계획보다 빠름</span>';
    if (p > z.max + 10) return '<span class="ptag slow">계획보다 느림</span>';
    return '<span class="ptag fit">페이스 적정</span>';
  }

  function dayRow(day, today) {
    var dt = d(day.date);
    var rec = state.byDate[day.date];
    var st = dayStatus(day, today);
    var dow = DOW[dt.getDay()];
    var cls = "day " + st.key;
    if (dt.getDay() === 6) cls += " sat";
    if (dt.getDay() === 0) cls += " sun";
    if (fmtLocal(today) === day.date) cls += " today";

    var planTxt = day.type === "rest"
      ? "계획 · 휴식"
      : "계획 " + kmLabel(day.targetKm) + " km · " + day.targetPace;

    var actTxt = "";
    if (rec) {
      actTxt = "실제 " + fmtKm(rec.km) + " km · " + paceText(rec.sec, rec.km) + "/km" +
        (rec.count > 1 ? " · " + rec.count + "회 합산" : "") + paceTagFor(day, rec);
    } else if (st.key === "miss" || st.key === "short") {
      actTxt = "실제 기록 없음";
    }

    return '<div class="' + cls + '">' +
      '<div class="dow"><b>' + dow + "</b>" + md(day.date) + "</div>" +
      '<div class="db">' +
        '<div class="dl"><span class="dt">' + esc(day.title) + '</span><span class="badge ' + st.key + '">' + st.label + "</span></div>" +
        '<div class="dm">' + planTxt + "</div>" +
        (actTxt ? '<div class="da">' + actTxt + "</div>" : "") +
        '<div class="dd">' + esc(day.detail) + "</div>" +
      "</div>" +
      "</div>";
  }

  function barState(pct, finished) {
    if (pct >= 95) return "ok";
    if (!finished) return "";
    return pct >= 60 ? "warn" : "bad";
  }

  function renderPlanCards(plan, today) {
    var race = d(plan.race.date);
    var dd = dayDiff(race, today);
    document.getElementById("p-dday").textContent = dd > 0 ? "D-" + dd : dd === 0 ? "D-DAY" : "D+" + (-dd);
    document.getElementById("p-dday-hint").textContent =
      dot(plan.race.date) + " (" + plan.race.weekday + ") · " + plan.race.distanceKm + "km";

    document.getElementById("p-goal").textContent = plan.race.goal;
    document.getElementById("p-goal-hint").textContent =
      "3시간 20분 언더 · " + plan.race.goalPace + " · " + plan.race.schedule;

    /* 이번 주 */
    var cur = weekOfDate(plan, today);
    var pre = false, post = false;
    if (!cur) {
      if (today < d(plan.race.startDate)) { cur = plan.weeks[0]; pre = true; }
      else { cur = plan.weeks[plan.weeks.length - 1]; post = true; }
    }
    var act = weekActual(cur);
    var pct = cur.targetKm > 0 ? act / cur.targetKm * 100 : 0;
    var sess = weekSessions(cur, today);
    var finished = d(cur.end) < today;
    document.getElementById("p-week").innerHTML =
      fmtKm(act) + " <small>/ " + fmtKm(cur.targetKm) + " km</small>";
    var wbar = document.getElementById("p-week-bar");
    wbar.querySelector("i").style.width = Math.min(100, pct).toFixed(1) + "%";
    wbar.setAttribute("data-state", barState(pct, finished));
    var weekHint = cur.week + "주차 · " + cur.phase + " · 세션 " + sess.done + "/" + cur.sessions + " 완료";
    if (pre) weekHint = "11.30(월) 시작 · D-" + dayDiff(d(plan.race.startDate), today) + " · " + cur.week + "주차 " + cur.phase;
    else if (post) weekHint = "16주 훈련 종료 · 서울마라톤 결과는 아래 16주차 참고";
    else weekHint += " · 남은 계획 " + fmtKm(Math.max(0, cur.targetKm - act)) + " km";
    document.getElementById("p-week-hint").textContent = weekHint;

    /* 누적 */
    var acc = cumulative(plan, today);
    var accPct = acc.target > 0 ? acc.actual / acc.target * 100 : 0;
    document.getElementById("p-acc").innerHTML = Math.round(accPct) + "<small>%</small>";
    var abar = document.getElementById("p-acc-bar");
    abar.querySelector("i").style.width = Math.min(100, accPct).toFixed(1) + "%";
    abar.setAttribute("data-state", barState(accPct, false));
    document.getElementById("p-acc-hint").textContent = acc.target > 0
      ? "계획 " + fmtKm(acc.target) + " km 중 " + fmtKm(acc.actual) + " km · 세션 " + acc.done + "/" + acc.due + " 완료"
      : "훈련 시작 전 · 16주 총 계획 " + fmtKm(acc.planned) + " km";

    /* 오늘의 훈련 */
    var tISO = fmtLocal(today);
    var day = state.planMap[tISO];
    var badge = document.getElementById("p-today-badge");
    var dateEl = document.getElementById("p-today-date");
    var titleEl = document.getElementById("p-today-title");
    var metaEl = document.getElementById("p-today-meta");
    var detailEl = document.getElementById("p-today-detail");
    dateEl.textContent = "";
    badge.hidden = true;
    badge.className = "badge";
    metaEl.innerHTML = "";
    detailEl.textContent = "";

    if (day) {
      var dt = d(day.date);
      dateEl.textContent = md(day.date) + " (" + DOW[dt.getDay()] + ")";
      titleEl.textContent = day.title;
      var st = dayStatus(day, today);
      if (day.type !== "rest") {
        badge.hidden = false;
        badge.className = "badge " + st.key;
        badge.textContent = st.label;
      }
      var rec = state.byDate[day.date];
      var parts = [];
      parts.push('<span>계획 ' + kmLabel(day.targetKm) + " km · " + day.targetPace + "</span>");
      if (rec) {
        parts.push('<span class="sep">|</span><span>실제 ' + fmtKm(rec.km) + " km · " + paceText(rec.sec, rec.km) + "/km" +
          (rec.count > 1 ? " (" + rec.count + "회 합산)" : "") + "</span>");
      }
      metaEl.innerHTML = parts.join("");
      var next = nextSession(plan, day);
      detailEl.textContent = day.detail + (next ? "  ·  다음 훈련: " + md(next.date) + "(" + DOW[d(next.date).getDay()] + ") " + next.title : "");
    } else if (today < d(plan.race.startDate)) {
      var first = plan.weeks[0].days.filter(function (x) { return x.type !== "rest"; })[0];
      titleEl.textContent = "훈련 시작 전 — 11.30(월)부터";
      dateEl.textContent = md(tISO) + " (" + DOW[today.getDay()] + ")";
      metaEl.innerHTML = '<span>첫 세션 ' + md(first.date) + "(" + DOW[d(first.date).getDay()] + ") · " + esc(first.title) +
        " · " + first.targetPace + "</span>";
      detailEl.textContent = plan.weeks[0].focus;
    } else {
      titleEl.textContent = "16주 훈련 종료";
      dateEl.textContent = md(tISO) + " (" + DOW[today.getDay()] + ")";
      var rr = state.byDate[plan.race.date];
      metaEl.innerHTML = rr
        ? "<span>서울마라톤 " + fmtKm(rr.km) + " km · " + paceText(rr.sec, rr.km) + "/km</span>"
        : "<span>서울마라톤 결과 기록이 없습니다.</span>";
      detailEl.textContent = "수고하셨습니다. 전체 러닝 기록 탭에서 대회 기록을 확인할 수 있습니다.";
    }
  }

  function nextSession(plan, day) {
    var found = null;
    for (var i = 0; i < plan.weeks.length && !found; i++) {
      var w = plan.weeks[i];
      for (var j = 0; j < w.days.length; j++) {
        if (w.days[j].date > day.date && w.days[j].type !== "rest") { found = w.days[j]; break; }
      }
    }
    return found;
  }

  function renderZones(plan) {
    var order = ["easy", "mlr", "mp", "lt", "int", "recovery", "race"];
    var host = document.getElementById("zones");
    host.innerHTML = order.map(function (k) {
      var z = plan.paceZones[k];
      if (!z) return "";
      return '<div class="zone"><div class="zlabel">' + z.label + '</div><div class="zpace">' +
        z.range.replace("/km", "") + "</div></div>";
    }).join("");
    var planned = plan.weeks.reduce(function (s, w) { return s + w.targetKm; }, 0);
    var sessions = plan.weeks.reduce(function (s, w) { return s + w.sessions; }, 0);
    document.getElementById("goal-cap").textContent =
      dot(plan.race.startDate) + " ~ " + dot(plan.race.date) + " · 16주 · " + plan.race.schedule +
      " · 총 " + fmtKm(planned) + " km / " + sessions + "세션";
  }

  function renderWeeks(plan, today) {
    var host = document.getElementById("weeks");
    var html = plan.weeks.map(function (w) {
      var st = d(w.start), en = d(w.end);
      var act = weekActual(w);
      var pct = w.targetKm > 0 ? act / w.targetKm * 100 : 0;
      var sess = weekSessions(w, today);
      var isCur = today >= st && today <= en;
      var done = en < today;
      var cls = "week" + (isCur ? " cur" : "");
      return '<details class="' + cls + '" data-week="' + w.week + '"' + (isCur ? " open" : "") + ">" +
        "<summary>" +
          '<span class="wbadge">' + w.week + "<small>주</small></span>" +
          '<span class="wmain">' +
            '<span class="wtitle">' + esc(w.title) +
              '<span class="phase p-' + w.phaseKey + '">' + esc(w.phase) + "</span></span>" +
            '<span class="wmeta">' + md(w.start) + " ~ " + md(w.end) +
              '<span class="dotsep">·</span>' + w.sessions + "세션" +
              '<span class="dotsep">·</span>완료 ' + sess.done + "</span>" +
            '<span class="bar" data-state="' + barState(pct, done) + '"><i style="width:' +
              Math.min(100, pct).toFixed(1) + '%"></i></span>' +
          "</span>" +
          '<span class="wkm">' + fmtKm(act) + "<small>/ " + fmtKm(w.targetKm) + " km</small></span>" +
          '<span class="chev" aria-hidden="true">›</span>' +
        "</summary>" +
        '<div class="days">' +
          '<div class="wfocus">' + esc(w.focus) + "</div>" +
          w.days.map(function (day) { return dayRow(day, today); }).join("") +
        "</div>" +
        "</details>";
    }).join("");
    host.innerHTML = html;

    var acc = cumulative(plan, today);
    document.getElementById("weeks-summary").textContent = acc.target > 0
      ? "지금까지 " + fmtKm(acc.actual) + " km / 계획 " + fmtKm(acc.target) + " km"
      : "16주 총 계획 " + fmtKm(acc.planned) + " km · " + plan.race.schedule;
  }

  function renderPlan() {
    var plan = state.plan;
    if (!plan) {
      document.getElementById("weeks").innerHTML = '<p class="empty">훈련 계획(data/plan.json)을 불러오지 못했습니다.</p>';
      return;
    }
    var today = today0();
    renderPlanCards(plan, today);
    renderZones(plan);
    renderWeeks(plan, today);
  }

  /* ---------- boot ---------- */
  function boot() {
    var runsP = fetch("data/runs.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    var planP = fetch("data/plan.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function (e) { return null; });

    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.getAttribute("data-view"), true); });
    });
    setView(location.hash === "#runs" ? "runs" : "plan", false);
    window.addEventListener("hashchange", function () {
      var v = location.hash === "#runs" ? "runs" : "plan";
      if (v !== state.view) setView(v, false);
    });

    Promise.all([runsP, planP]).then(function (res) {
      var runs = res[0], plan = res[1];

      runs.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.sec - a.sec; });
      state.all = runs;
      state.byDate = runsByDate(runs);

      if (plan) {
        state.plan = plan;
        state.planMap = {};
        plan.weeks.forEach(function (w) {
          w.days.forEach(function (day) { state.planMap[day.date] = day; });
        });
      }

      renderSummary(runs);
      renderMonthly(runs);
      renderWeekly(runs);
      renderYearChips();
      renderList();
      renderPeriodSummary();
      setUpdated(runs);
      renderPlan();
      headerFor(state.view);

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
    }).catch(function (e) {
      document.getElementById("chart-monthly").innerHTML =
        '<p class="empty">기록을 불러오지 못했습니다 (' + e.message + ").</p>";
      document.getElementById("weeks").innerHTML =
        '<p class="empty">데이터를 불러오지 못했습니다 (' + e.message + ").</p>";
      renderPlan();
    });
  }

  boot();
})();
