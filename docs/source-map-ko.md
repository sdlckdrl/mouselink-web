# 홈페이지 소스 지도

이 저장소는 OneMouse 공개 홈페이지의 정적 HTML·CSS·JavaScript와 다운로드/호환성 JSON을 관리한다. 앱 구현은 별도 `MouseLink` 저장소에 있다. 수정 절차와 검증 명령은 [유지보수 가이드](maintenance-guide-ko.md)를 따른다.

이 지도는 기능을 바꿀 때 먼저 볼 파일과 함께 확인할 주변 파일을 연결한다. 릴리스 버전이나 다운로드 주소의 현재 값은 문서에 복사하지 않고 해당 JSON과 소스를 읽는다.

## 저장소와 페이지 경로

페이지는 템플릿에서 생성되지 않는다. 한국어는 루트, 영어·스페인어·일본어·중국어는 각각 `en/`, `es/`, `ja/`, `zh/`의 독립 HTML로 저장된다.

| 구분             | 실제 파일 / 수정 범위                                                                                                      | 역할                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 소개·홈          | [index.html](../index.html)                                                                                                | 제품 설명, 체험 시뮬레이터, 사용 사례, 시작 안내, 스토어/직접 다운로드 버튼 |
| 사용법           | [guide.html](../guide.html)                                                                                                | 페어링·배치·파일·입력·마우스 제스처·화면 보기의 단계별 안내                 |
| 도움말           | [help.html](../help.html)                                                                                                  | FAQ와 연결·권한·제스처 문제 해결; 사용법의 관련 앵커로 연결                 |
| 비교             | [compare.html](../compare.html)                                                                                            | 다른 제품과 지원 범위 비교; 기능 사실·외부 출처를 함께 확인                 |
| 기술·보안        | [technical.html](../technical.html)                                                                                        | 플랫폼·권한·로컬 연결·전송 보호 설명                                        |
| 요금             | [pricing.html](../pricing.html)                                                                                            | 예전 Free/Pro 설명이 남아 있으며 현재 CSS가 본문을 숨김                     |
| 개인정보         | [privacy.html](../privacy.html)                                                                                            | 공개 개인정보처리방침                                                       |
| 약관             | [terms.html](../terms.html)                                                                                                | 공개 이용약관                                                               |
| 라이선스         | [licenses.html](../licenses.html)                                                                                          | 배포에 포함되는 오픈소스 고지와 라이선스 원문                               |
| 언어별 대응 파일 | [영어 홈](../en/index.html), [스페인어 홈](../es/index.html), [일본어 홈](../ja/index.html), [중국어 홈](../zh/index.html) | 위 9종 페이지가 각 언어 디렉터리에 동일한 파일명으로 존재                   |
| 기타 HTML        | [404.html](../404.html), [Google 소유권 검증](../google828538c28dc5ab5a.html)                                              | 오류 안내와 검색 사이트 소유권 검증; 제품 설명 페이지에 포함하지 않음       |

HTML은 총 47개다. 9종 페이지 × 5개 언어가 45개이고, 404와 Google 검증 파일이 각각 하나다. 제품/오류 안내 페이지만 셀 때는 46개다.

공개 URL은 `/guide`, `/en/guide`처럼 `.html` 없이 기록되어도 저장소 파일은 `guide.html`, `en/guide.html`이다. 언어 홈은 `/en/` → `en/index.html`처럼 대응한다. 로컬 파일 검사에서는 이 대응을 적용하고, 일반 정적 HTTP 서버에서 확인할 때는 `.html` 파일 경로도 구분한다.

한 기능 설명을 수정하면 동일 페이지의 5개 언어를 함께 확인한다. 파일명이 같다는 이유로 번역 페이지를 중복 파일로 삭제하지 않는다.

## 요구별 수정 진입점

| 바꾸려는 내용                                 | 먼저 볼 파일                                                                                            | 함께 확인할 내용                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 첫 화면의 제품 설명·지원 플랫폼               | [한국어 홈](../index.html)과 4개 언어의 `index.html`                                                    | 본문, 제목, description, Open Graph, Twitter, JSON-LD, 이미지 alt; 기술·도움말·검색용 요약의 설명과 일치하는지    |
| 화면 속 기기 배치·커서·파일 체험              | 각 `index.html` 하단 inline `<script>`                                                                  | `#desk`, `#stage`, `.dev`, `#cursor`, `#reset` DOM과 [onemouse.css](../css/onemouse.css)의 시뮬레이터 스타일      |
| Windows 직접 다운로드                         | [downloads.js](../js/downloads.js)의 첫 IIFE                                                            | 홈의 `data-latest-windows-download`, 기본 href, `data-download-filename`; API 실패 시 fallback 주소               |
| Mac 직접 다운로드·지원 아키텍처               | [downloads.json](../downloads.json), downloads.js의 두 번째 IIFE                                        | 홈의 `data-latest-macos-download`, 기본 href, ready label, `data-macos-download-filename`; 실제 배포 자산·해시    |
| Google Play·Galaxy Store·Microsoft Store 링크 | 각 `index.html` 다운로드 영역                                                                           | 스토어 ID, Microsoft Store의 `cid` 유입 구분 값, JSON-LD의 관련 링크; downloads.js는 스토어 링크를 선택하지 않음  |
| Android가 확인하는 PC 호환성 정보             | [latest.json](../latest.json)                                                                           | `pc.version`, `android.minimumPcVersion`, `android.pcUpdateMessage`; 홈페이지 버튼용 downloads.json과 역할이 다름 |
| 페어링·전송·단축키 사용법                     | [guide.html](../guide.html)과 각 언어 대응 파일                                                         | 목차·section id, [help.html](../help.html)의 연결 앵커, 실제 앱의 기능·권한·지원 범위                             |
| 마우스 제스처 안내                            | 각 언어 `guide.html`의 `#mouse-gestures`, `help.html`의 제스처 FAQ                                      | [제스처 안내 테스트](../tests/test_mouse_gesture_help.py)의 액션 순서·방향·지원 조건과 CSS 표 너비                |
| FAQ·문제 해결                                 | [help.html](../help.html)과 각 언어 대응 파일                                                           | `details` / `summary`, 관련 사용법 앵커, 설정/권한 명칭                                                           |
| 공통 외형·모바일 표시                         | [onemouse.css](../css/onemouse.css)                                                                     | `header.site`, `.wrap`, `.btn`, 표·카드·시뮬레이터, 반응형·다크 테마·모션 감소 조건                               |
| 남아 있는 요금 화면의 표시 정책               | [style.css](../css/style.css), 5개 언어 `pricing.html`                                                  | 숨김 선택자와 요금 내용이 실제 정책에 맞는지; 본문만 바꿔서는 표시가 바뀌지 않음                                  |
| 화면 캡처·가이드 그림·데모 교체               | [assets 디렉터리](../assets/)와 참조 HTML                                                               | `src`, 링크 원본, alt, 크기·종횡비, 각 언어 상대 경로; README의 데모 링크도 참조 대상                             |
| 검색 결과·공유 카드·언어별 노출               | 각 HTML의 `<head>`, [sitemap.xml](../sitemap.xml), [robots.txt](../robots.txt), [llms.txt](../llms.txt) | canonical·hreflang·JSON-LD·공유 이미지·색인 대상 경로; 기능 설명 변경은 검색용 요약에도 반영                      |
| 공개 정책·법적 고지                           | privacy / terms / licenses의 5개 언어 파일                                                              | 앱 동작·배포 구성에 근거한 사실과 번역 일치; 라이선스 원문을 일반 중복 문구로 축약하지 않음                       |

## 홈 체험 시뮬레이터

홈의 기기 배치·커서·파일 체험은 앱 서버에 연결하지 않는 브라우저 내부 시뮬레이터다. 실제 기기 연결 코드와 혼동하지 않는다.

각 언어 `index.html`의 하단 inline script는 같은 구조를 가지며 기기 이름·상태 표시 문구가 번역되어 있다. HTML만 고치거나 한 언어 script만 바꾸면 DOM 참조 또는 동작이 달라질 수 있다.

```text
index.html의 #desk / #stage / .dev / #cursor
  → inline script가 HOME 배치와 devs 상태 초기화
  → pointerdown / pointermove / pointerup / pointercancel
  → deviceAt · cross · setCursor / moveFile · endFileDrag
  → 장치 위치·커서·파일 아이콘·상태 문구 갱신
  → #reset 버튼이 처음 배치 복원
```

작업할 때 `fit`의 가상 화면 배율, 기기 배치 제한·스냅, 파일 drop 종료, pointercancel, `prefers-reduced-motion`을 함께 확인한다. 시뮬레이터에 새 실제 지원 기능처럼 읽히는 문구를 추가하기 전에는 앱 쪽 지원 여부를 먼저 확인한다.

## 다운로드 버튼의 호출 흐름

공통 [downloads.js](../js/downloads.js)는 5개 언어의 홈에서만 로드한다. Windows와 Mac은 서로 다른 IIFE로 처리하며 브라우저 OS를 감지해서 둘 중 하나만 고르는 구조가 아니다. 각 버튼의 `data-*` 속성이 처리 대상을 정한다.

```text
각 언어 index.html의 기본 다운로드 href
  → 공통 js/downloads.js
  ├─ Windows: data-latest-windows-download
  │   → 유효한 sessionStorage 캐시가 있으면 적용
  │   → 없으면 GitHub releases API 조회 → 공개 정식 릴리스의 Setup/EXE 자산 선택
  │   → 버튼 href·파일명 갱신 + 캐시 저장
  │   → 실패하면 기본 fallback 주소로 이동
  └─ Mac: data-latest-macos-download
      → script URL 기준 ../downloads.json 조회
      → macos.status 확인 → HTTPS 자산/다운로드 페이지 선택
      → 버튼 href·상태·문구·파일명 갱신
      → 실패하면 HTML에 기록된 현재 기본 링크 유지
```

Windows 캐시는 `sessionStorage`에 파일명·URL·저장 시각을 저장하며 유효 시간은 1시간이다. API 요청의 제한 시간은 8초다. 공개된 정식 릴리스만 대상으로 하고 Setup EXE를 우선하며, 없으면 EXE를 선택한다. API 실패 시 캐시·HTML 기본 href·script fallback 사이의 관계를 함께 확인한다.

Mac은 `macos.status === 'released'`일 때 활성 자산을 선택한다. 선택 순서는 유효한 HTTPS universal 자산, 유효한 자산이 하나뿐인 경우 그 자산, `downloadPageUrl`이다. 여러 아키텍처가 있고 선택용 URL도 없으면 script가 임의 아키텍처를 고르지 않는다.

downloads.json에 SHA-256이 있어도 홈페이지 script가 브라우저에서 다운로드 파일의 해시를 계산하는 것은 아니다. 자산 URL·파일명·arch·해시는 실제 릴리스 파일에 맞춰 관리한다.

[latest.json](../latest.json)은 다운로드 버튼을 해석하는 script에서 읽지 않는다. Android 앱의 PC 호환성 확인용 정보이므로 다운로드 표시를 바꾸는 작업과 최소 호환 버전 변경을 구분한다.

## CSS 두 파일과 요금 표시

[onemouse.css](../css/onemouse.css)는 홈·가이드·도움말·비교·기술·정책·라이선스와 404가 사용하는 현행 스타일이다. [style.css](../css/style.css)는 5개 언어 요금 페이지가 계속 참조하므로 미사용 파일이 아니다.

style.css에는 무료 운영 중 유료 요금 설명을 숨기는 블록이 남아 있다. `body:has(.pricing-hero) main`, `.paid-plan-copy`, `.pricing-hero`, `.plan-cards`, `.compare-table-wrap` 등의 표시를 막고, 단축키 표의 `.shortcut-table-wrap`은 별도로 다시 표시한다.

이는 파일 삭제나 URL 차단이 아니다. HTML·메타데이터·CSS가 남아 있으므로 요금 정책을 다시 공개하거나 폐기할 때 페이지·내비게이션·검색 메타데이터·숨김 블록을 함께 판단한다. CSS 파일 전체를 제거하면 남아 있는 요금 페이지의 레이아웃도 사라진다.

## 자산·검색·포맷 설정

[assets](../assets/)에는 화면 캡처·가이드 그림·데모 GIF/MP4와 이미지가 있다. 사용 여부는 홈페이지 HTML뿐 아니라 CSS 배경, 공유 카드의 절대 URL, [README](../README.md)의 데모 링크까지 확인한다. 파일명이 비슷한 그림이나 GIF/MP4 쌍을 같은 파일로 단정하지 않는다.

검색과 배포되는 메타데이터는 다음 파일을 확인한다.

- [sitemap.xml](../sitemap.xml): 공개 페이지 URL과 변경 날짜. 새 경로나 실제 내용 변경을 반영한다.
- [robots.txt](../robots.txt): 크롤러 접근 정책과 sitemap 주소.
- [llms.txt](../llms.txt): 검색·응답용 제품 요약. 실제 기능·지원 범위와 정책을 기준으로 유지한다.
- [Google 검증 HTML](../google828538c28dc5ab5a.html), [BingSiteAuth.xml](../BingSiteAuth.xml): 사이트 소유권 검증 파일. 제품 페이지가 아니어도 정리 대상에서 제외한다.
- [.editorconfig](../.editorconfig), [.prettierrc.json](../.prettierrc.json), [.prettierignore](../.prettierignore): 인코딩·줄바꿈·포맷 규칙. 라이선스 원문 등 제외 항목을 확인하고 관련 파일만 정리한다.

## 테스트와 개발·배포 경계

현재 저장소의 자동 회귀 테스트는 [test_mouse_gesture_help.py](../tests/test_mouse_gesture_help.py)다. Python 표준 라이브러리 `unittest`와 HTMLParser를 사용하므로 별도 Python 패키지 설치를 전제로 하지 않는다.

테스트는 5개 언어의 7개 실제 제스처 패턴·순서, 표 접근성, 목차/FAQ 앵커, 안내 단계·지원 조건, 스크롤 양·취소 안내와 모바일 표 너비를 확인한다. 전체 사이트 링크, 다운로드 API, 브라우저 시뮬레이터, 실제 앱 제스처를 대신 검증하지 않는다.

내용·외형을 바꾸면 변경한 페이지의 데스크톱/좁은 화면 표시와 언어별 대응을 확인한다. 다운로드 동작을 바꾸면 API/manifest 성공과 실패, 캐시, 기본 href, Mac 자산 선택 분기를 확인한다. 실행 명령과 작업 순서는 [유지보수 가이드](maintenance-guide-ko.md)의 검증 절차를 따른다.

소스에는 package.json, 프런트엔드 빌드 설정, 추적된 CI workflow 또는 Cloudflare 배포 설정이 없다. 배포 산출물을 만들기 위한 npm 빌드를 추측해서 추가하지 않는다. 공개 주소는 README·HTML의 `onemouse.pages.dev`이지만, 이 사실만으로 현재 Cloudflare 계정의 Git 연결·빌드 설정·배포 완료를 확인할 수는 없다.

문서나 로컬 검증 완료와 공개 사이트 반영을 구분한다. 실제 릴리스 파일 업로드·호스팅 설정·공개 결과 확인은 유지보수 가이드와 승인된 배포 작업 범위에 따라 진행한다.
