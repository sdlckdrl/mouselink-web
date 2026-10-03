# OneMouse 홈페이지

OneMouse의 소개, 사용 가이드, 다운로드, 지원 안내를 제공하는 정적 사이트입니다.
앱 소스와 홈페이지 소스는 별도 저장소에서 관리합니다.

- 공식 사이트: [onemouse.pages.dev](https://onemouse.pages.dev/)
- 앱 소스·문서: [MouseLink](https://github.com/sdlckdrl/MouseLink)
- 홈페이지 개발 문서: [문서 목록](docs/README.md)

## 사용자 안내

Windows 마우스와 키보드로 Android, 다른 Windows PC, macOS 13+ Apple Silicon Mac을
제어합니다. 설치·권한·페어링·파일 전송의 상세 절차는 아래 페이지에서 관리합니다.

| 필요한 정보 | 안내 |
| --- | --- |
| 앱 설치 | [Windows·Android·macOS 다운로드](https://onemouse.pages.dev/#get) |
| 첫 연결·사용법 | [사용 가이드](https://onemouse.pages.dev/guide) |
| 연결·권한·전송 문제 | [도움말](https://onemouse.pages.dev/help) |
| 연결 구조·권한·보안 | [기술 안내](https://onemouse.pages.dev/technical) |
| 다른 도구와 비교 | [프로그램 비교](https://onemouse.pages.dev/compare) |
| 개인정보·약관·라이선스 | [개인정보](https://onemouse.pages.dev/privacy) · [약관](https://onemouse.pages.dev/terms) · [라이선스](https://onemouse.pages.dev/licenses) |

언어: [한국어](https://onemouse.pages.dev/) · [English](https://onemouse.pages.dev/en/) ·
[Español](https://onemouse.pages.dev/es/) · [日本語](https://onemouse.pages.dev/ja/) ·
[中文](https://onemouse.pages.dev/zh/).

## 데모

- [PC 마우스·키보드로 Android 제어](https://youtu.be/gpKYPqPXx7M)
- [여러 PC·모바일 제어와 원격제어](https://youtu.be/7oTqDNkBOZc)
- 짧은 시연: [모바일 제어](assets/demo/mobile.mp4) · [PC-to-PC](assets/demo/pc-to-pc.mp4) ·
  [파일 드래그](assets/demo/drag-file.mp4) · [원격 제어 창](assets/demo/window.mp4).

## 홈페이지 작업 시작

1. [소스 지도](docs/source-map-ko.md)에서 바꿀 페이지와 공통 코드를 찾습니다.
2. [유지보수 안내](docs/maintenance-guide-ko.md)에서 미리보기·다국어 수정·검증 절차를 확인합니다.
3. 다운로드 변경은 같은 안내의 [다운로드·앱 호환성](docs/maintenance-guide-ko.md#다운로드앱-호환성)을 따릅니다.

이 저장소에는 번들러나 `package.json`이 없습니다. HTML·CSS·JavaScript를 직접 제공하며,
홈페이지 수정에 앱 빌드가 필요하지 않습니다. 앱 버전과 공개 다운로드 버전은 다를 수 있으므로
기능 안내를 바꿀 때는 실제 배포판을 확인합니다.
