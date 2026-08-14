# OneMouse (원마우스)

**Windows 마우스와 키보드 하나로 Android, 다른 Windows PC, Apple Silicon Mac을 제어하는 로컬 연결 도구**

마우스를 화면 끝으로 넘기면 커서가 폰이나 옆 Windows PC, Mac으로 이어지고 키보드 입력·파일·클립보드도 따라갑니다. macOS 13+ Apple Silicon용 서명·공증 DMG를 제공합니다.

> OneMouse lets a Windows PC control Android, another Windows PC, and Apple Silicon Macs running macOS 13+. [English site](https://onemouse.pages.dev/en/)

🌐 **공식 사이트**: [onemouse.pages.dev](https://onemouse.pages.dev/)

---

## 📺 데모 영상

| OneMouse 사용법: PC 마우스와 키보드로 Android 제어 | 마우스 하나로 여러 대의 PC와 모바일 제어 & 원격제어 |
| :---: | :---: |
| [![OneMouse 사용법: PC 마우스와 키보드로 Android 제어 테스트](https://img.youtube.com/vi/gpKYPqPXx7M/hqdefault.jpg)](https://youtu.be/gpKYPqPXx7M) | [![마우스하나로 여러대의 PC와 모바일을 제어 & 원격제어 테스트](https://img.youtube.com/vi/7oTqDNkBOZc/hqdefault.jpg)](https://youtu.be/7oTqDNkBOZc) |
| [▶ 영상 보기](https://youtu.be/gpKYPqPXx7M) | [▶ 영상 보기](https://youtu.be/7oTqDNkBOZc) |

---

## 🎬 데모

| 모바일 화면 원격 제어 | PC to PC 제어 |
| :---: | :---: |
| ![모바일 화면 원격 제어](assets/demo/mobile.gif) | ![PC to PC 제어](assets/demo/pc-to-pc.gif) |

| 파일 드래그 전송 | 원격 제어 창 |
| :---: | :---: |
| ![파일 드래그 전송](assets/demo/drag-file.gif) | ![원격 제어 창](assets/demo/window.gif) |

---

## ✨ 주요 기능

- **마우스 이동** — 커서를 화면 가장자리로 밀면 Android 또는 다른 Windows PC로 제어가 넘어갑니다.
- **키보드 입력** — 한글을 포함한 PC 키보드 입력이 Android의 입력 칸으로 그대로 전달됩니다.
- **모바일 화면 원격 제어** — PC 창에서 Android 화면을 보면서 클릭·드래그·스크롤·키 입력을 보냅니다.
- **PC-to-PC 제어** — 서브 PC를 페어링하면 한 세트의 마우스/키보드로 여러 PC를 오가며 작업합니다.
- **Windows-to-Mac 제어** — macOS 13+ Apple Silicon Mac으로 커서·키보드·파일·클립보드 입력을 이어서 사용합니다.
- **파일 전송** — 빠른 드롭존에 파일을 놓아 보내거나, 파일을 잡은 채 화면 가장자리로 드래그해 다른 PC에 바로 놓습니다.
- **클립보드 동기화** — PC와 Android 사이에서 복사한 텍스트·파일을 이어서 붙여넣습니다.
- **QR / 6자리 코드 페어링** — 페어링된 기기만 연결되며, 전송 구간은 세션 키로 암호화됩니다.

---

## 🚀 빠른 시작

1. **PC 앱 실행** — Windows에서 OneMouse를 켜면 화면에 6자리 코드와 QR 코드가 표시됩니다.
2. **Android 접근성 권한 켜기** — PC로 폰을 제어하기 위한 사실상 유일한 필수 권한입니다.
3. **PC 검색** — PC와 폰이 같은 Wi-Fi에 있으면 앱이 PC를 자동으로 찾습니다.
4. **페어링** — PC 화면의 QR을 스캔하거나 6자리 코드를 입력합니다.
5. **폰 위치 배치** — 모니터의 왼쪽/오른쪽/위/아래 중 실제로 커서를 넘길 방향에 폰을 배치합니다.
6. **사용 시작** — 마우스를 배치한 방향으로 밀면 제어가 넘어갑니다. 파일은 드롭존에, 화면 원격 제어는 기기 관리에서 시작합니다.

자세한 단계별 안내는 [사용 가이드](https://onemouse.pages.dev/guide)에서 확인할 수 있습니다.

### Mac 연결

Apple Silicon용 DMG를 설치한 뒤 다음 순서로 연결합니다.

1. Windows 앱과 macOS 13+ Apple Silicon Mac 앱을 실행합니다.
2. Mac에서 손쉬운 사용 권한을 허용합니다. macOS 15+에서는 로컬 네트워크 권한도 허용하며, macOS 13/14에는 해당 항목이 표시되지 않을 수 있습니다.
3. Windows 기기 관리에서 Mac을 선택하고 Mac에 표시된 6자리 코드를 입력합니다.
4. Windows 배치 화면에서 Mac 위치를 지정하고 화면 경계로 마우스를 넘깁니다.

Mac 블루투스는 베타로 제공됩니다(Mac 앱 설정에서 켜기, 기본 꺼짐). 공식 지원 범위는 LAN 연결이며, 화면 녹화 권한은 LAN에서 Windows로 Mac 화면·창을 볼 때만 필요합니다.

---

## 📥 다운로드

| 플랫폼 | 링크 |
| --- | --- |
| Windows PC | [Setup 1.3.3 다운로드](https://github.com/sdlckdrl/mouselink-web/releases/download/v1.3.3/OneMouse-Setup-1.3.3-x64.exe) |
| Android | [Google Play](https://play.google.com/store/apps/details?id=com.mouselink.app) |
| macOS 13+ (Apple Silicon) | [DMG 0.1.3 다운로드](https://github.com/sdlckdrl/mouselink-web/releases/download/mac-v0.1.3/OneMouse-macOS-0.1.3-Apple-Silicon.dmg) |

Mac 다운로드는 `downloads.json`의 `macos.status`가 `released`이고, 서명·공증된
`universal` 자산, 단일 아키텍처 자산 또는 아키텍처 선택용 `downloadPageUrl`이 있을 때
활성화됩니다. 단일 아키텍처 자산은 홈페이지 버튼에도 해당 아키텍처를 명시합니다.

```json
{
  "status": "released",
  "downloadPageUrl": "https://github.com/example/releases/tag/mac-v0.1.1",
  "assets": [
    { "arch": "arm64", "url": "https://example.invalid/OneMouse-arm64.dmg", "filename": "OneMouse-arm64.dmg" }
  ]
}
```

단일 universal 또는 아키텍처별 배포라면 `assets`에 직접 다운로드 URL을 넣을 수 있습니다. 여러 아키텍처 중 사용자가 골라야 할 때는 `downloadPageUrl`을 함께 제공합니다. 모든 활성화 URL은 절대 `https://` 주소여야 합니다.

---

## 🔗 더 알아보기

- [소개](https://onemouse.pages.dev/) · [사용 가이드](https://onemouse.pages.dev/guide) · [도움말](https://onemouse.pages.dev/help) · [기술/보안](https://onemouse.pages.dev/technical) · [요금/Pro](https://onemouse.pages.dev/pricing)
- Languages: [한국어](https://onemouse.pages.dev/) · [English](https://onemouse.pages.dev/en/) · [日本語](https://onemouse.pages.dev/ja/) · [中文](https://onemouse.pages.dev/zh/)
