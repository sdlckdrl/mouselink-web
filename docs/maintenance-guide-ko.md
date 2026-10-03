# 홈페이지 유지보수 안내

이 저장소는 정적 사이트입니다. HTML·CSS·JavaScript를 직접 제공하며 앱 실행 코드와
설치 파일 빌드는 [MouseLink 저장소](https://github.com/sdlckdrl/MouseLink)에서 관리합니다.
파일별 역할은 [소스 지도](source-map-ko.md)를 참고합니다.

## 작업 시작·로컬 미리보기

작업 전에 `git status --short --branch`로 기존 변경을 확인합니다. `git fetch origin` 후
`git rev-list --left-right --count HEAD...origin/main`으로 원격 상태를 비교합니다.
작업 트리가 깨끗하고 로컬 전용 커밋이 없을 때만 `git merge --ff-only origin/main`으로
갱신합니다. 이미 변경이 있으면 되돌리지 않고 먼저 차이를 확인합니다.

저장소 루트에서 실행합니다.

```powershell
python -B -m http.server 8000 --bind 127.0.0.1
```

브라우저에서 `http://127.0.0.1:8000/`를 엽니다. Python 서버는 배포 사이트의 확장자 없는
경로 처리를 제공하지 않으므로 하위 페이지는 `/guide.html`, `/en/guide.html`처럼 엽니다.
배포판의 `/guide`·`/en/guide` 연결과 404 처리는 공개 사이트에서 별도로 확인합니다.
서버는 확인 후 `Ctrl+C`로 종료합니다.

## 페이지·다국어 수정

한국어는 루트, 영어·스페인어·일본어·중국어 간체는 각각 `en/`, `es/`, `ja/`, `zh/`입니다.
템플릿 생성 단계가 없으므로 같은 안내·메뉴·다운로드 변경은 5개 언어 파일을 함께 확인합니다.

- 사용자 설정 절차는 `guide.html`, 문제 해결은 `help.html`, 연결 구조·권한은
  `technical.html`에서 관리합니다. README에 같은 절차를 다시 쓰지 않습니다.
- 루트는 `./assets/`, `./css/`, `./js/`, 언어 폴더는 `../assets/`, `../css/`, `../js/`를 씁니다.
- 링크·앵커, `lang`, title/description, canonical, hreflang, 구조화 데이터도 함께 확인합니다.
- 홈페이지의 기기 배치 체험은 각 `index.html`의 인라인 스크립트입니다. 앱 자체의 배치
  로직과 별개이므로 시연을 바꿨다고 앱 동작을 바꾼 것은 아닙니다.
- 공개 페이지를 수정하면 `sitemap.xml`의 해당 URL과 `lastmod`를 확인합니다. 404·검색 엔진
  소유권 확인 파일은 일반 사용자 페이지 목록에 추가하지 않습니다.
- `llms.txt`에는 공개판의 짧은 요약과 안내 링크만 남깁니다. 설치 절차·경쟁사 정보·구매
  조건을 별도 복제하면 불일치가 생기므로 원문을 연결합니다.

### 단축키 안내를 바꿀 때

PC 기본 키·역할 조건·변경/끄기 설정은 앱 저장소의
[`shortcuts-config.js`](https://github.com/sdlckdrl/MouseLink/blob/main/pc/electron/renderer/shortcuts-config.js)와
[`shortcut-manager.js`](https://github.com/sdlckdrl/MouseLink/blob/main/pc/electron/shortcut-manager.js)를
기준으로 확인합니다. 실제 동작은 `main.js`, `input_bridge.py`, `local_hotkeys.py`와 플랫폼별
수신 코드를 대조합니다. Android 입력 조합과 Mac 수정키 변환을 PC 전역 단축키와 구분합니다.

`guide.html#shortcuts` 5개 언어의 표·조건, 첫 연결의 캡처 안내, 번호 연결 안내,
`help.html`의 기본 복귀 키 설명을 함께 확인합니다. 배포 전 기능은
`#shortcuts-next-release`에서 공개판과 구분합니다. 해당 버전이 실제로 공개되면 예정 표시와
번호 배정 조건을 현재 배포판에 맞게 갱신하며, 버전 숫자만 소스에 맞춰 올리지 않습니다.

## 다운로드·앱 호환성

홈페이지 다운로드와 앱 업데이트가 함께 사용하는 파일이므로 배포된 자산을 먼저 확인합니다.
소스 버전만 올랐다고 매니페스트나 공개 기능 설명을 올리지 않습니다.

| 대상                 | 확인·수정할 곳                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Windows              | GitHub Releases의 Setup EXE, `js/downloads.js`의 `windowsFallbackUrl`, 5개 `index.html`의 폴백 링크, `latest.json`의 `pc.version`          |
| Android 최소 PC 버전 | `latest.json`의 `android.minimumPcVersion`·`pcUpdateMessage`. 실제 기능 호환성이 바뀔 때만 변경                                            |
| macOS                | `downloads.json`의 `macos.status`·`version`·`minimumOs`·아키텍처별 자산 URL/파일명/SHA-256·`downloadPageUrl`, 5개 `index.html`의 폴백 링크 |

`js/downloads.js`는 Windows 릴리스 목록에서 draft/prerelease를 제외하고 Setup EXE를
찾습니다. `/releases/latest`만 읽는 Windows 앱 업데이트와 다르므로, Windows Setup
릴리스를 GitHub의 Latest로 유지해야 합니다. 조회 실패에는 폴백 URL을 사용하고,
성공 결과는 세션 저장소에서 1시간 캐시합니다. 브라우저 검증 시 이전 캐시도 확인합니다.

macOS는 `status=released`일 때 HTTPS 자산을 선택합니다. 우선순위는 universal 자산,
다운로드 가능한 단일 자산, `downloadPageUrl`입니다. 여러 아키텍처이면 선택 페이지가
필요합니다. 공개 버튼은 SHA-256·서명·공증을 검사하지 않으므로 릴리스 단계에서 확인합니다.
Mac 앱의 업데이트에도 사용되는 SHA-256을 실제 업로드 파일과 일치시킵니다.

전체 빌드·서명·업로드 절차는 앱 저장소의
[Windows 릴리스 안내](https://github.com/sdlckdrl/MouseLink/blob/main/docs/windows-release-guide-ko.md)와
[macOS 릴리스 안내](https://github.com/sdlckdrl/MouseLink/blob/main/docs/macos-release-guide-ko.md)를
따릅니다. 이 문서에 빌드 절차나 예시 버전을 복제하지 않습니다.

## 남아 있는 과거 안내

`pricing.html` 5개 언어는 과거 Free/Pro 안내를 포함합니다. `css/style.css`의 유료 안내
숨김 블록이 본문 전체를 숨기며, 이 스타일은 현재도 사용 중입니다. CSS를 미사용으로
삭제하거나 숨김만 해제하면 과거 일일 전송 제한·광고 문구가 노출됩니다.

요금 안내를 다시 공개할 때는 앱 저장소의
[현재 정책](https://github.com/sdlckdrl/MouseLink/blob/main/docs/monetization.md),
`Monetization.kt`, 스토어별 `BillingManager.kt`, 실제 배포판·스토어 상품 상태를 함께
대조해 5개 언어의 본문·메타데이터·약관·요약을 갱신합니다. 현재 숨겨진 숫자를 정책 근거로
사용하지 않습니다.

`technical.html` 5개 언어의 과거 업데이트 기록 중에는 “다음 배포 예정” 표시가 있습니다.
해당 기능이 어느 출시 태그에 들어갔는지 확인한 뒤에만 완료 기록으로 변경합니다.
새 소스 기능을 공개 안내에 추가할 때도 다운로드 가능한 Windows·Android·Mac 조합에서
사용할 수 있는지 확인합니다.

## 자산·중복 정리

`assets/`와 `bg.png`는 HTML뿐 아니라 CSS·README·직접 다운로드 링크에서도 참조할 수
있습니다. 파일명 검색, Git 이력, 대체 자산, 실제 내용까지 확인한 뒤 제거합니다. GIF와
MP4는 형식별 용도가 다르므로 이름이 같아도 중복 파일로 판단하지 않습니다.
빌드 산출물·로컬 실행 캐시는 커밋하지 않습니다.

## 검증·커밋·푸시

루트에서 다음 검증을 실행합니다. 테스트는 5개 언어의 마우스 제스처·FAQ·표 접근성과
관련 CSS를 확인하며, 다른 페이지 전체나 앱 동작을 검증하지는 않습니다.

```powershell
python -B -m unittest discover -s tests -v
node --check js/downloads.js
git diff --check
```

포맷은 `.prettierrc.json`을 따릅니다. 전체 사이트에 포맷터를 적용하지 말고 바꾼 지원 파일만
검사합니다. `.prettierignore`에 있는 파일은 의도적으로 검사에서 빠집니다.

```powershell
npx.cmd --yes prettier@3.6.2 --check ja/guide.html
```

변경에 맞춰 다음도 확인합니다.

- 로컬 파일·앵커, 언어별 메뉴와 canonical/hreflang, JSON·구조화 데이터·sitemap 유효성.
- 본문이나 스타일 변경: 데스크톱·모바일 화면, 표·긴 문구의 가로 넘침, 언어별 변경 내용.
- 다운로드 변경: API/매니페스트 실패 시 폴백, 실제 선택 URL, 자산 HTTP 응답·파일명·해시.

`git diff --stat`과 `git diff`를 검토한 뒤 관련 파일만 명시해서 커밋합니다. 푸시 전 다시
fetch해 원격 변경을 확인합니다. 일반 `git push origin main` 후
`git ls-remote --heads origin refs/heads/main`의 해시를 로컬 HEAD와 비교하고
`git status --short --branch`를 확인합니다.

공개 호스팅 주소는 `onemouse.pages.dev`입니다. 이 저장소에는 Cloudflare 배포 워크플로나
대시보드 설정이 없으므로 Git 푸시 성공만으로 공개 반영을 확정하지 않습니다. 페이지 변경이
있으면 배포 사이트의 해당 응답도 확인합니다.
