# OneMouse PC 1.6.4의 zeroconf 소스와 재조합 자료

이 자료는 OneMouse PC 1.6.4 백엔드에 포함된 LGPL 라이브러리
`zeroconf 0.151.3`을 사용자가 수정하고, 기존 앱 객체 코드와 다시 조합할 수
있도록 제공합니다. 정식 Store 업데이트나 설치 프로그램이 아닙니다.
OneMouse의 비공개 앱 소스는 포함하지 않습니다.

정식 백엔드는 라이브러리까지 담은 PyInstaller 단일 실행 파일입니다.
설치된 정식 앱이 외부 라이브러리를 바로 읽는 구조라는 설명 대신,
다음의 별도 재조합 방법을 제공합니다.

## 제공 파일

- `OneMouse-1.6.4-LGPL-kit.zip`: 이 설명, 영문 설명, 재조합 도구,
  원본 객체 코드 조각의 SHA-256 목록, 정확한 upstream 라이브러리 소스,
  라이선스 사본과 검증 결과.
- `MouseLinkBackend-1.6.4.exe.part01`, `MouseLinkBackend-1.6.4.exe.part02`:
  원본 앱 백엔드 객체 코드입니다. 홈페이지 파일 크기 제한 때문에 둘로
  나눴으며, 설치된 앱·로그인·페어링·설정·사용자 데이터는 들어 있지 않습니다.

두 조각을 합친 원본은 27,941,314바이트이며 SHA-256은 다음과 같습니다.

`b67ce2a54b4599a10fda902fcc6f5750f1046899574c9634ede16008986ec444`

원본 `zeroconf-0.151.3.tar.gz`는 223,165바이트이며 SHA-256은 다음과 같습니다.

`ce6c548e665759b6150cef4db9ab9d7bdd89857e90c513abd6b7340bdd7dbd6a`

해당 파일은 [PyPI의 0.151.3 배포 메타데이터](https://pypi.org/pypi/zeroconf/0.151.3/json)에
기록된 주소에서 받아 SHA-256을 대조했습니다. 원본 `COPYING`, Python/Cython
소스, 빌드 스크립트, 기존 저작권 표시를 보존합니다.

## 사용 방법

Windows용 64비트 **CPython 3.11**이 필요합니다. 앱 객체 코드 형식이
Python 버전에 따라 달라져 3.12나 3.13으로 대신 실행할 수 없습니다.
재조합 도구는 Python 표준 라이브러리만 사용합니다.

1. 비어 있는 작업 폴더에 ZIP과 두 조각 파일을 모두 저장합니다.
   ZIP을 같은 폴더에 풀어, 조각 파일과 `object-manifest.json`,
   `recompose_backend.py`가 같은 위치에 있게 합니다.
2. `source/zeroconf-0.151.3.tar.gz`를 풉니다. 수정할 곳은
   `zeroconf-0.151.3/src/zeroconf`입니다. 라이선스와 기존 저작권 표시를
   보존하고, 변경한 파일에 변경 사실과 날짜를 표시합니다.
3. 작업 폴더에서 다음을 실행합니다. 설치된 정식 앱 파일은 건드리지 않고
   `custom` 폴더에 새 실행 파일을 만듭니다.

   ```powershell
   py -3.11 recompose_backend.py --base-manifest object-manifest.json --zeroconf-dir zeroconf-0.151.3/src/zeroconf --output custom/MouseLinkBackend.exe
   ```

4. 앱을 시작하지 않고 수정 라이브러리의 로드를 확인하려면 별도 진단 파일을
   만들고 실행합니다.

   ```powershell
   py -3.11 recompose_backend.py --base-manifest object-manifest.json --zeroconf-dir zeroconf-0.151.3/src/zeroconf --output custom/MouseLinkBackend-probe.exe --probe
   .\custom\MouseLinkBackend-probe.exe
   ```

   이 진단 파일은 정식 앱 진입점보다 먼저 종료합니다. 로그인·페어링·설정
   데이터를 읽거나 바꾸지 않고, 기기 검색이나 연결용 소켓도 시작하지 않습니다.
   실제 교체 라이브러리를 가져와 버전과 선택적 변경 표식을 출력하고,
   `ServiceInfo`와 `DNSCache` 자료 객체 생성을 확인합니다.

5. 실제 데스크톱 화면과 조합해 사용하려면 사용자가 정식 앱을 닫은 뒤,
   합법적으로 받은 같은 버전의 MSIX를 별도의 쓰기 가능한 작업 폴더에 풉니다.
   **그 별도 사본 안의** `resources/backend/MouseLinkBackend.exe`만 3단계
   결과로 교체하고, `OneMouse.exe`를 실행합니다. `WindowRecovery` 및 나머지
   파일은 유지합니다. `WindowsApps`의 설치본을 바꾸거나 정식 앱을 삭제할
   필요가 없으며 정식 앱과 사본을 동시에 실행하지 않습니다.

5단계의 별도 데스크톱 사본 전체 동작은 이 검증에서 시험하지 않았습니다.
사본이 정식 앱과 같은 데이터 폴더를 사용할 수 있으므로 직접 사용할 때에는
본인 설정을 먼저 백업하세요. 진단 성공은 라이브러리 교체와 자료 객체 API의
검증 결과이며, 실제 검색·원격 입력·파일 전송 전체를 검증했다는 뜻은 아닙니다.
수정본은 Store 서명을 유지하는 업데이트가 아니며 Windows 신뢰 설정을
바꾸거나 우회하지 않습니다.

## 재조합 동작과 권리

도구는 원본 두 조각의 크기·SHA-256과 최종 원본 SHA-256을 확인합니다.
기존 앱 객체 코드와 부트로더를 보존하고, zeroconf의 Python 코드를 교체합니다.
기존 zeroconf Cython 확장 18개는 수정본에서 제거하여 변경한 Python 소스가
실제로 사용되게 합니다. upstream이 지원하는 순수 Python 구현을 쓰므로
C/C++ 컴파일러는 필요하지 않지만 정식 최적화 빌드보다 느릴 수 있습니다.
기존 의존성을 유지하는 인터페이스 호환 변경을 대상으로 하며, 새로운 외부
의존성을 추가하면 별도 패키징 작업이 필요합니다.

제공 자료는 LGPL 라이브러리를 수정하여 해당 라이브러리를 사용하는 앱 객체
코드와 재조합할 수 있게 하기 위한 것입니다. 수정 라이브러리의 디버깅에
필요한 역공학을 포함한 수령인의 LGPL 권리는 OneMouse의 독점적 사용 조건으로
제한하지 않습니다. 라이선스 원문이 우선하며 이 문서는 법률 의견이 아닙니다.
재조합 도구 자체는 MIT 라이선스로 제공합니다.

수령인이 본인의 사용을 위해 LGPL 라이브러리를 수정하고 이 객체 코드 자료를
복사·결합·재조합하는 것과, 그 수정의 디버깅에 필요한 역공학을 허용합니다.
OneMouse 앱 객체 코드의 기존 저작권과 독점적 사용 조건은 이러한 허용 및
제3자 라이선스 권리를 전제로 유지됩니다. 객체 코드 제공으로 앱 전체가
MIT로 재라이선스되는 것이 아닙니다. MIT는 별도 재조합 도구와 직접 작성한
설명에만 적용하며, 제3자 구성요소에는 각 원래 라이선스가 적용됩니다.

- upstream: <https://github.com/python-zeroconf/python-zeroconf>
- LGPL 2.1: <https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html>
- PyInstaller 단일 실행 파일 구조:
  <https://pyinstaller.org/en/stable/operating-mode.html#how-the-one-file-program-works>
