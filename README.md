# 달리는 기록 · 러닝 대시보드

Strava에 기록된 개인 러닝 로그와 서울마라톤(2027-03-21) Sub 3:20 16주 훈련 계획을 함께 보여 주는
정적 대시보드입니다. GitHub Pages로 https://moona2222-running.github.io/ 에 배포됩니다.

## 화면

상단 탭으로 두 화면을 오갑니다(`#plan` / `#runs`).

- **🏅 서울마라톤 훈련**: D-day, 목표 기록, 이번 주·누적 달성률, 오늘의 훈련, 페이스 존,
  16주 주차별 계획 대비 실제(주차를 누르면 요일별 계획과 Strava 기록 비교)
- **📈 전체 러닝 기록**: 누적 요약, 월별·주별 차트, 연도 필터·검색 목록

## 구성

| 경로 | 설명 |
| --- | --- |
| `index.html` | 페이지 본문 (탭, 요약 카드, 훈련 현황, 차트, 기록 목록) |
| `assets/style.css` | 스타일 (라이트/다크 모드, 모바일 우선) |
| `assets/app.js` | 데이터 로드, 훈련 현황, 월별·주별 차트(SVG), 목록·검색·연도 필터 |
| `data/runs.json` | Strava 활동 기록 (날짜·제목·거리·시간·고도·활동 ID·종목) |
| `data/plan.json` | 서울마라톤 16주 훈련 계획 (주차·요일별 목표·페이스·상세) |


## 데이터

`data/runs.json`은 Strava 웹의 활동 로그(**My Activities**, Sport = Run / Trail Run)에서
최신순으로 수집한 기록입니다.

```json
{"date":"2026-11-26","title":"Morning Run","km":6.5,"sec":2150,"elev":15,"id":"21125366487","sport":"Run"}
```

- `km` 거리(km), `sec` 시간(초), `elev` 상승 고도(m), `id` Strava 활동 ID
- 페이스는 화면에서 `sec / km`로 계산합니다.

## 훈련 계획 (`data/plan.json`)

2026-11-30 ~ 2027-03-21, 16주, 화·수·목·토·일 훈련 / 월·금 휴식.
목표 Sub 3:20(MP 4′44″/km). 주차별 `targetKm`은 요일별 `targetKm`의 합이며,
16주차는 준비 주행 24km + 대회 42.195km입니다.

```json
{"date":"2026-12-01","week":1,"phase":"기반기","type":"easy","title":"이지 런 8km",
 "targetKm":8,"targetPace":"5′30″~5′55″/km","paceZone":"easy","detail":"..."}
```

생성 스크립트: `../build_plan.py` (주차 합계·날짜 연속성·휴식 요일 검증 후 출력).

## 갱신 방법

Strava에서 새 기록을 내려받은 뒤 `data/runs.json` 맨 앞에 추가하고 `main`에 push하면
GitHub Pages가 자동으로 다시 배포합니다(보통 1분 이내).
