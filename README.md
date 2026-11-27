# 달리는 기록 · 러닝 대시보드

Strava에 기록된 개인 러닝 로그를 모아 보여 주는 정적 대시보드입니다.
GitHub Pages로 https://moona2222-running.github.io/ 에 배포됩니다.

## 구성

| 경로 | 설명 |
| --- | --- |
| `index.html` | 페이지 본문 (요약 카드, 차트, 기록 목록) |
| `assets/style.css` | 스타일 (라이트/다크 모드, 모바일 우선) |
| `assets/app.js` | 데이터 로드, 월별·주별 차트(SVG), 목록·검색·연도 필터 |
| `data/runs.json` | Strava 활동 기록 (날짜·제목·거리·시간·고도·활동 ID·종목) |

## 데이터

`data/runs.json`은 Strava 웹의 활동 로그(**My Activities**, Sport = Run / Trail Run)에서
최신순으로 수집한 기록입니다.

```json
{"date":"2026-11-26","title":"Morning Run","km":6.5,"sec":2150,"elev":15,"id":"21125366487","sport":"Run"}
```

- `km` 거리(km), `sec` 시간(초), `elev` 상승 고도(m), `id` Strava 활동 ID
- 페이스는 화면에서 `sec / km`로 계산합니다.

## 갱신 방법

Strava에서 새 기록을 내려받은 뒤 `data/runs.json` 맨 앞에 추가하고 `main`에 push하면
GitHub Pages가 자동으로 다시 배포합니다(보통 1분 이내).
