# 예외는 어떻게 규범이 되는가 — 분석 부록

규제샌드박스 특례의 법령정비 전환 결정요인 분석
2026 한국정책학회 추계학술대회 · 대학(원)생 포스터 세션 부록

사이트: https://susuhyuck.github.io/sandbox-conversion/

## 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 부록 페이지(부록 A 기술통계 · B Kaplan-Meier · C Cox와 가설 판정 · D 강건성·모형 가정 · E 전체 과제 238개 · F 사례 대응쌍 · G 자료 출처·수치 검증 · 참고문헌) |
| `assets/data.js` | 페이지가 읽는 분석 결과(과제 238개, 생존곡선, Cox·강건성, 대응쌍 후보, 점검 결과) |
| `assets/main.js`, `assets/style.css` | 차트·표 렌더링(외부 라이브러리 없음) |
| `data/analysis_units.csv` | 규제 과제 단위 분석 자료(238행) |
| `data/analysis_approvals.csv` | 승인 건 단위 자료(747행, 강건성 R3용) |

## 배포

이 폴더의 내용을 저장소 `sandbox-conversion`의 루트에 올리고 Settings → Pages → Branch `main` / `(root)`로 지정한다.

## 자료 출처

규제샌드박스 통합포털(sandbox.go.kr), 한국산업기술진흥원 규제법령현황·규제유형별 총괄 현황(공공데이터포털), 국가법령정보센터 Open API, 빅카인즈.
