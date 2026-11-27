#!/usr/bin/env python3
# 서울마라톤(2027-03-21) Sub-3:20 16주 훈련 계획 생성기
# 2026-11-30(월) ~ 2027-03-21(일), 화·수·목·토·일 훈련 / 월·금 휴식
import json, datetime, sys, os

OUT = sys.argv[1] if len(sys.argv) > 1 else "data/plan.json"

START = datetime.date(2026, 11, 30)
RACE = datetime.date(2027, 3, 21)

ZONES = {
    "easy":     {"label": "Easy/회복",       "range": "5′30″~5′55″/km", "min": 330, "max": 355},
    "recovery": {"label": "리커버리",         "range": "5′55″~6′20″/km", "min": 355, "max": 380},
    "mlr":      {"label": "중장거리(MLR)",    "range": "5′15″~5′35″/km", "min": 315, "max": 335},
    "mp":       {"label": "마라톤페이스(MP)", "range": "4′40″~4′45″/km", "min": 280, "max": 285},
    "lt":       {"label": "템포/역치(LT)",    "range": "4′15″~4′25″/km", "min": 255, "max": 265},
    "int":      {"label": "인터벌",           "range": "3′55″~4′05″/km", "min": 235, "max": 245},
    "shake":    {"label": "셰이크아웃",        "range": "6′00″~6′20″/km", "min": 360, "max": 380},
    "race":     {"label": "레이스",           "range": "4′44″/km",      "min": 284, "max": 284},
    "rest":     {"label": "휴식",             "range": "—",             "min": 0,   "max": 0},
}

DOW = ["월", "화", "수", "목", "금", "토", "일"]

# (type, title, km, zone, detail)
weeks_spec = [
    dict(week=1, phase="기반기", phase_key="base",
         title="기반 다지기 · 이지 볼륨 적응",
         focus="주 5일 리듬에 몸을 맞추는 주. 모든 세션은 대화가 가능한 강도로.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "16주 플랜 시작. 월·금은 휴식일 — 폼롤러·스트레칭 10분, 수면 7시간 이상."),
             ("easy", "이지 런 8km", 8, "easy", "5′30″~5′55″ 편안하게. 마지막에 20초 스트라이드 4회(숨이 차지 않을 정도, 자세 위주)."),
             ("interval", "인터벌 800m × 5", 10, "int", "웜업 2.5km + 800m × 5 (3′55″~4′05″, 사이 400m 리커버리 조깅) + 쿨다운 2.5km = 10km."),
             ("mlr", "중장거리 런 8km", 8, "mlr", "5′15″~5′35″. 전날 인터벌 피로가 남아 있으면 5′35″까지 늦춰도 좋음."),
             ("rest", "완전 휴식", 0, "rest", "주중 두 번째 휴식일. 다리 올리기·가벼운 코어 10분."),
             ("easy", "이지 런 8km", 8, "easy", "주말 이지 런. 마지막 2km만 살짝 올려 리듬 확인."),
             ("long", "장거리 런 16km (LSD)", 16, "easy", "5′30″~5′55″. 첫 LSD — 90~100분 지속. 물 500ml 지참, 후반에도 페이스 올리지 않기."),
         ]),
    dict(week=2, phase="기반기", phase_key="base",
         title="기반 다지기 · 템포 첫 도입",
         focus="주 1회 템포(LT)를 넣어 역치 자극을 시작합니다.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 지난주 장거리 다리 상태 점검."),
             ("easy", "이지 런 9km + 스트라이드", 9, "easy", "5′30″~5′55″ 9km, 마지막 4회 × 20초 스트라이드."),
             ("tempo", "템포 런 12km (LT 6km)", 12, "lt", "웜업 3km + LT 6km(4′15″~4′25″) + 쿨다운 3km. LT 구간은 호흡이 무거워지되 10분 이상 유지 가능한 강도."),
             ("mlr", "중장거리 런 10km", 10, "mlr", "5′15″~5′35″. 템포 다음 날 — 다리 무거우면 5′40″까지 허용."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식. 주말 장거리 전 탄수 섭취 조금 늘리기."),
             ("easy", "이지 런 9km", 9, "easy", "5′30″~5′55″. 장거리 하루 전이므로 4회 스트라이드로 다리 깨우기."),
             ("long", "장거리 런 18km — 후반 4km MLR", 18, "mlr", "기본 5′30″~5′55″, 마지막 4km만 5′15″~5′35″로 올리기."),
         ]),
    dict(week=3, phase="기반기", phase_key="base",
         title="기반 다지기 · 인터벌 볼륨 증가",
         focus="1000m 인터벌로 산소섭취량 자극, 주간 64km.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″ 편안하게 10km. 스트라이드 4회."),
             ("interval", "인터벌 1000m × 5", 13, "int", "웜업 3km + 1000m × 5 (3′55″~4′05″, 사이 400m 조깅) + 쿨다운 3km ≈ 13km."),
             ("mlr", "중장거리 런 11km", 11, "mlr", "5′15″~5′35″. 인터벌 다음 날은 페이스보다 지속에 집중."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″, 마지막 2km 살짝 올리기."),
             ("long", "장거리 런 20km — 후반 5km MP", 20, "mlr", "기본 5′30″~5′55″, 마지막 5km는 MP 4′40″~4′45″. MP 구간에서 호흡이 급해지면 5′00″로 낮춰도 됨."),
         ]),
    dict(week=4, phase="기반기", phase_key="base",
         title="기반기 마무리 · 출국 전 장거리",
         focus="12/27(일) 도쿄 가족 여행 출국. 장거리(24km)는 하루 앞당겨 12/26(토)에, 출국일은 10km 가벼운 조깅.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 여행 짐·일정 정리."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″. 스트라이드 4회."),
             ("tempo", "템포 런 12km (LT 6km)", 12, "lt", "웜업 3km + LT 6km(4′15″~4′25″) + 쿨다운 3km."),
             ("mlr", "중장거리 런 10km", 10, "mlr", "5′15″~5′35″. 여행 전 마지막 평일 훈련 — 무리하지 않기."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식. 크리스마스 — 장거리 전날이므로 음주·야식 자제."),
             ("long", "장거리 런 24km (이번 주 메인)", 24, "mlr", "출국 전날로 앞당긴 장거리. 기본 5′30″~5′55″, 후반 8km는 MP 4′40″~4′45″. 끝나고 바로 수분·탄수 보충."),
             ("easy", "출국일 가벼운 조깅 10km", 10, "easy", "도쿄행 비행 전 이른 아침 10km. 5′30″~5′55″ 아주 편하게, 공항 이동 시간 넉넉히."),
         ]),
    dict(week=5, phase="도쿄 여행 · 회복", phase_key="recovery",
         title="도쿄 여행 회복 주간",
         focus="12/28~30 도쿄 일정에 맞춘 가벼운 주(~42km). 12/29 호텔 주변 아침 조깅, 12/30 귀국일은 컨디션에 따라 휴식으로 대체.",
         days=[
             ("rest", "도쿄 · 완전 휴식", 0, "rest", "여행 첫날 — 이동과 관광에 집중. 많이 걷는 것만으로 충분한 활동량."),
             ("easy", "도쿄 아침 조깅 7km", 7, "easy", "호텔 주변 평탄한 코스(황궁 외원 등) 5′30″~5′55″. 관광 일정 전 가볍게, 스트라이드 3회."),
             ("easy", "귀국일 가벼운 조깅 6km (또는 휴식)", 6, "easy", "체크아웃·이동 일정이 빠듯하면 휴식으로 대체. 뛸 경우 6′00″ 전후 아주 가볍게."),
             ("mlr", "중장거리 런 9km", 9, "mlr", "귀국 후 첫 정상 훈련. 5′15″~5′35″보다 5′35″~5′50″로 시작해 몸 상태 확인."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식. 시차·피로 회복."),
             ("easy", "이지 런 10km + 스트라이드", 10, "easy", "5′30″~5′55″ 10km, 마지막 4회 × 20초 스트라이드."),
             ("long", "장거리 런 14km (회복 위주)", 14, "easy", "5′40″~6′00″ 편안하게. 여행 후 첫 주는 볼륨보다 리듬 회복이 목적."),
         ]),
    dict(week=6, phase="빌드업기", phase_key="build",
         title="빌드업 시작 · MP 감각 익히기",
         focus="본격 증량 시작. 장거리 후반에 마라톤 페이스를 붙입니다.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 10km + 스트라이드", 10, "easy", "5′30″~5′55″, 마지막 6회 × 20초 스트라이드."),
             ("interval", "인터벌 1000m × 5", 12, "int", "웜업 2.5km + 1000m × 5 (3′55″~4′05″ / 400m 조깅) + 쿨다운 2.5km = 12km."),
             ("mlr", "중장거리 런 10km", 10, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 8km", 8, "easy", "5′30″~5′55″, 스트라이드 4회. 내일 장거리 대비."),
             ("long", "장거리 런 25km — 후반 8km MP", 25, "mlr", "기본 5′30″~5′55″, 마지막 8km MP 4′40″~4′45″. MP 구간 젤 1개 보충 연습."),
         ]),
    dict(week=7, phase="빌드업기", phase_key="build",
         title="빌드업 · 템포 볼륨 증가",
         focus="LT 7km, 주간 72km. 장거리는 28km까지.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 11km", 11, "easy", "5′30″~5′55″ 11km, 스트라이드 4회."),
             ("tempo", "템포 런 13km (LT 7km)", 13, "lt", "웜업 3km + LT 7km(4′15″~4′25″) + 쿨다운 3km. LT 중간에 30초만 4′10″로 당겨보는 서지 2회."),
             ("mlr", "중장거리 런 11km", 11, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 9km", 9, "easy", "5′30″~5′55″."),
             ("long", "장거리 런 28km — 후반 10km MP", 28, "mlr", "기본 5′30″~5′55″, 마지막 10km MP 4′40″~4′45″. 2시간 10분 이상 지속 — 젤 2개."),
         ]),
    dict(week=8, phase="빌드업기", phase_key="build",
         title="빌드업 · 장거리 30km 돌입",
         focus="주간 78km. 장거리 30km + MP 12km로 레이스 후반을 예습.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 12km", 12, "easy", "5′30″~5′55″ 12km, 스트라이드 4회."),
             ("interval", "인터벌 1200m × 5", 14, "int", "웜업 3km + 1200m × 5 (3′55″~4′05″ / 400m 조깅) + 쿨다운 3km = 14km."),
             ("mlr", "중장거리 런 12km", 12, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 30km — 후반 12km MP", 30, "mlr", "기본 5′30″~5′55″, 마지막 12km MP 4′40″~4′45″. 레이스 복장·화 테스트."),
         ]),
    dict(week=9, phase="빌드업기", phase_key="build",
         title="회복 주간 (다운 위크)",
         focus="볼륨을 62km로 낮춰 8주간의 피로를 흡수합니다. MP 구간 없이 편하게.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 수면·영양에 집중."),
             ("recovery", "회복 조깅 10km", 10, "recovery", "5′45″~6′05″ 아주 편하게. 심박 낮게 유지."),
             ("tempo", "템포 런 11km (LT 5km)", 11, "lt", "웜업 3km + LT 5km(4′20″~4′30″) + 쿨다운 3km. 짧게, 여유 있게."),
             ("mlr", "중장거리 런 10km", 10, "mlr", "5′20″~5′40″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 8km", 8, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 23km (MP 없이)", 23, "easy", "5′30″~5′55″ 편안하게 23km. 후반 페이스 올리지 말고 지속만."),
         ]),
    dict(week=10, phase="빌드업기", phase_key="build",
         title="빌드업 마무리 · 82km",
         focus="회복 주 뒤 최대 빌드업. 장거리 31km, 후반 14km MP.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 12km", 12, "easy", "5′30″~5′55″ 12km, 스트라이드 5회."),
             ("interval", "인터벌 1200m × 5", 16, "int", "웜업 4km + 1200m × 5 (3′55″~4′05″ / 400m 조깅) + 쿨다운 4km = 16km."),
             ("mlr", "중장거리 런 13km", 13, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 31km — 후반 14km MP", 31, "mlr", "기본 5′30″~5′55″, 마지막 14km MP 4′40″~4′45″. 젤 3개, 이온음료 지참."),
         ]),
    dict(week=11, phase="피크기", phase_key="peak",
         title="피크 진입 · 85km",
         focus="시즌 최대 볼륨 구간 시작. 33km 장거리 후반 16km MP.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 피크 구간 — 수면 시간을 30분 늘리기."),
             ("easy", "이지 런 12km", 12, "easy", "5′30″~5′55″ 12km, 스트라이드 5회."),
             ("tempo", "템포 런 16km (LT 8km)", 16, "lt", "웜업 4km + LT 8km(4′15″~4′25″) + 쿨다운 4km. LT 2km 단위로 10초씩 당기기."),
             ("mlr", "중장거리 런 14km", 14, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 33km — 후반 16km MP", 33, "mlr", "기본 5′30″~5′55″, 마지막 16km MP 4′40″~4′45″. 실제 대회 급수 간격(5km) 연습."),
         ]),
    dict(week=12, phase="피크기", phase_key="peak",
         title="최고 볼륨 88km · 피크 장거리 34km",
         focus="시즌 최고 주간 볼륨. 장거리 34km(후반 18km MP)가 이번 사이클의 핵심 세션.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 이번 주가 가장 무거운 주 — 일정 비우기."),
             ("easy", "이지 런 13km", 13, "easy", "5′30″~5′55″ 13km, 스트라이드 5회."),
             ("mp", "마라톤 페이스 런 16km", 16, "mp", "웜업 4km + MP 10km(4′40″~4′45″) + 쿨다운 2km. MP 구간 호흡·리듬을 레이스처럼."),
             ("mlr", "중장거리 런 14km", 14, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식. 탄수 섭취 늘리기."),
             ("easy", "이지 런 11km", 11, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 34km — 후반 18km MP", 34, "mlr", "기본 5′30″~5′55″, 마지막 18km MP 4′40″~4′45″. 대회 복장·화·젤 전부 그대로 테스트. 완주 후 다리 상태 기록."),
         ]),
    dict(week=13, phase="피크기", phase_key="peak",
         title="피크 마무리 · 74km",
         focus="볼륨을 조금 내리며 피크를 닫습니다. 장거리 23km 후반 10km MP.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 12km", 12, "easy", "5′30″~5′55″ 12km, 스트라이드 4회."),
             ("tempo", "템포 런 15km (LT 7km)", 15, "lt", "웜업 4km + LT 7km(4′15″~4′25″) + 쿨다운 4km."),
             ("mlr", "중장거리 런 14km", 14, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 23km — 후반 10km MP", 23, "mlr", "기본 5′30″~5′55″, 마지막 10km MP. 피크의 마지막 긴 세션."),
         ]),
    dict(week=14, phase="테이퍼링", phase_key="taper",
         title="테이퍼링 1주 · 62km",
         focus="볼륨을 줄이고 강도는 유지. MP 감각을 짧게 확인합니다.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 테이퍼링 시작 — 몸이 무겁게 느껴지는 것이 정상."),
             ("easy", "이지 런 10km", 10, "easy", "5′30″~5′55″ 10km, 스트라이드 5회."),
             ("mp", "MP 런 14km", 14, "mp", "웜업 3km + MP 8km(4′40″~4′45″) + 쿨다운 3km. 힘 빼고 리듬만."),
             ("mlr", "중장거리 런 12km", 12, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 8km", 8, "easy", "5′30″~5′55″, 스트라이드 4회."),
             ("long", "장거리 런 18km — 후반 8km MP", 18, "mlr", "기본 5′30″~5′55″, 마지막 8km MP. 대회 3주 전 마지막 18km."),
         ]),
    dict(week=15, phase="테이퍼링", phase_key="taper",
         title="테이퍼링 2주 · 44km",
         focus="볼륨 절반으로. 짧은 템포만 남기고 다리를 채웁니다.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식."),
             ("easy", "이지 런 8km", 8, "easy", "5′30″~5′55″, 스트라이드 5회."),
             ("tempo", "템포 런 8km (LT 4km)", 8, "lt", "웜업 2km + LT 4km(4′15″~4′25″) + 쿨다운 2km. 짧고 날카롭게."),
             ("mlr", "중장거리 런 7km", 7, "mlr", "5′15″~5′35″."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식."),
             ("easy", "이지 런 5km + 스트라이드", 5, "easy", "5′30″~5′55″ 5km, 마지막 4회 × 20초 스트라이드."),
             ("long", "장거리 런 16km — 후반 6km MP", 16, "mlr", "기본 5′30″~5′55″, 마지막 6km MP. 대회 2주 전 마지막 긴 세션."),
         ]),
    dict(week=16, phase="테이퍼링 & 레이스", phase_key="race",
         title="대회 주간 · 서울마라톤 Sub 3:20",
         focus="준비 주행 24km + 3/21(일) 서울마라톤 42.195km. 수·목은 짧게, 토는 셰이크아웃만.",
         days=[
             ("rest", "완전 휴식", 0, "rest", "월요일 휴식. 수면 7~8시간, 탄수 섭취 서서히 늘리기."),
             ("easy", "이지 런 8km + 스트라이드", 8, "easy", "5′30″~5′55″ 8km + 스트라이드 5회. 다리 감각만 확인."),
             ("easy", "가벼운 조깅 6km", 6, "easy", "5′40″~6′00″ 6km. 이상 신호(종아리·아킬레스) 점검."),
             ("easy", "가벼운 조깅 6km + 스트라이드", 6, "easy", "5′40″~6′00″ 6km, 스트라이드 3회. 이날 이후 볼륨 없음."),
             ("rest", "완전 휴식", 0, "rest", "금요일 휴식. 대회 2일 전 — 탄수 로딩 본격화(밥·면 위주)."),
             ("shakeout", "셰이크아웃 4km", 4, "shake", "6′00″~6′20″ 아주 가볍게 4km + 스트라이드 3회. 대회 복장·화·번호표 최종 점검, 21시 취침."),
             ("race", "서울마라톤 · Sub 3:20", 42.195, "race", "목표 3시간 20분 언더(4′44″/km). 웜업 10분 + 초반 5km 4′50″로 몸 풀기 → 10~30km 4′44″ → 35km 이후 버티기. 5km마다 젤, 급수는 마시고 머리에 붓기. 3:19대 목표."),
         ]),
]

def pace_text(zone):
    return ZONES[zone]["range"]

def day_pace(typ, zone, detail):
    """세션 성격을 드러내는 페이스 문구 — 장거리의 MP 후반, 템포/인터벌 본구간."""
    if typ == "long":
        if "MP" in detail:
            return "5′30″~5′55″ / 후반 MP 4′40″~4′45″"
        return "5′30″~5′55″/km"
    if typ == "tempo":
        return "4′15″~4′25″/km (LT)"
    if typ == "interval":
        return "3′55″~4′05″/km"
    return pace_text(zone)

plan_weeks = []
for w in weeks_spec:
    days = []
    start = START + datetime.timedelta(days=(w["week"] - 1) * 7)
    for i, (typ, title, km, zone, detail) in enumerate(w["days"]):
        dt = start + datetime.timedelta(days=i)
        assert DOW[dt.weekday()]  # sanity
        days.append({
            "date": dt.isoformat(),
            "week": w["week"],
            "phase": w["phase"],
            "type": typ,
            "title": title,
            "targetKm": round(float(km), 3),
            "targetPace": day_pace(typ, zone, detail),
            "paceZone": zone,
            "detail": detail,
        })
    total = round(sum(d["targetKm"] for d in days), 3)
    plan_weeks.append({
        "week": w["week"],
        "start": days[0]["date"],
        "end": days[-1]["date"],
        "phase": w["phase"],
        "phaseKey": w["phase_key"],
        "title": w["title"],
        "focus": w["focus"],
        "targetKm": total,
        "sessions": sum(1 for d in days if d["type"] != "rest"),
        "days": days,
    })

plan = {
    "race": {
        "name": "서울마라톤",
        "date": RACE.isoformat(),
        "weekday": DOW[RACE.weekday()],
        "distanceKm": 42.195,
        "goal": "Sub 3:20",
        "goalSeconds": 12000,
        "goalPace": "4′44″/km",
        "startDate": START.isoformat(),
        "totalWeeks": 16,
        "schedule": "화·수·목·토·일 훈련 / 월·금 휴식",
    },
    "paceZones": ZONES,
    "weeks": plan_weeks,
}

# ---- 검증 ----
errs = []
if len(plan_weeks) != 16:
    errs.append("week count %d" % len(plan_weeks))
last = max(d["date"] for w in plan_weeks for d in w["days"])
if last != RACE.isoformat():
    errs.append("last day %s" % last)
for w in plan_weeks:
    st = datetime.date.fromisoformat(w["start"])
    if st.weekday() != 0:
        errs.append("week %d start not Monday" % w["week"])
    if len(w["days"]) != 7:
        errs.append("week %d has %d days" % (w["week"], len(w["days"])))
    for d in w["days"]:
        for k in ("date", "week", "phase", "type", "title", "targetKm", "targetPace", "detail"):
            if k not in d:
                errs.append("missing %s in %s" % (k, d.get("date")))
        if d["type"] == "rest" and datetime.date.fromisoformat(d["date"]).weekday() not in (0, 4):
            errs.append("rest on non-rest weekday %s" % d["date"])
        if d["type"] != "rest" and datetime.date.fromisoformat(d["date"]).weekday() in (0, 4):
            errs.append("training on rest weekday %s" % d["date"])

# dates contiguous
all_dates = [d["date"] for w in plan_weeks for d in w["days"]]
for a, b in zip(all_dates, all_dates[1:]):
    if (datetime.date.fromisoformat(b) - datetime.date.fromisoformat(a)).days != 1:
        errs.append("gap %s -> %s" % (a, b))

for w in plan_weeks:
    print("W%02d %s~%s %-12s %5.1f km  %d세션  %s" % (
        w["week"], w["start"], w["end"], w["phase"], w["targetKm"], w["sessions"], w["title"]))
print("total planned km:", round(sum(w["targetKm"] for w in plan_weeks), 3))
print("errors:", errs)

if errs:
    sys.exit(1)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(plan, f, ensure_ascii=False, indent=1)
print("wrote " + OUT)
