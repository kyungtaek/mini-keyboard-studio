# 단일 Electron 앱

2026-10-24 사용자 승인: 기존 UI와 HID 보조 프로세스를 하나의 Electron macOS 앱으로 패키징한다.

## 구성

- Electron 45의 창에 기존 정적 편집기를 로드한다. `mini-keyboard://studio/`를 고정 origin으로 사용하여 앱 전용 Chromium 저장소가 실행마다 유지된다.
- sandbox/contextIsolation을 켜고 Node integration을 끈다. preload는 명령별 검증을 거치는 HID 호출만 노출한다. 외부 페이지와 임의 파일은 앱 내부에 로드하지 않는다.
- 기존 Python/hidapi 구현을 PyInstaller onedir 실행 파일로 동봉한다. 개발 경로와 시스템 Python에 의존하지 않는다. 백업은 userData/companion-backups에 저장한다.
- 창 닫기는 숨김, 메뉴 막대 또는 Cmd+Q 종료는 HID 복구·프로세스 종료를 기다린다. 메뉴 막대에서 설정, 연결 상태, 데이터 폴더, 로그인 자동 실행, 로컬 API 설정, 종료를 제공한다.
- 로그인 자동 실행은 설치된 앱 경로를 사용하며 --hidden으로 시작한다. 샘플 6종은 첫 실행 보관함에 넣는다. 기존 브라우저 작업은 JSON 내보내기/가져오기로 이동한다.
- 선택적인 loopback API는 기존 세션 토큰·Origin 검증을 유지한다. API는 앱과 같은 HID owner를 공유한다. 포트 충돌 시 다른 서비스에 접근하거나 종료하지 않고 오류를 표시한다.
- 공유 링크는 mini-keyboard scheme으로 전달하고 앱이 등록된 Mac에서 편집기로 연다. JSON은 앱 설치와 무관하게 공유 가능하다.

## 범위와 검증

Apple Silicon 로컬 .app와 ZIP을 만들고 설치 경로에서 실행한다. 현재 단계는 ad-hoc 서명이며 Developer ID/notarization 배포와 구분한다. 로그인 항목 등록 결과를 확인하되 실제 재로그인 검증으로 주장하지 않는다. 앱별 상태 수집기/자동 키맵 전환은 기존 별도 트랙을 유지한다. HID 검증은 식별과 키맵 읽기로 시작하며 샘플을 자동 기록하지 않는다.

대안: 웹 서버만 담은 네이티브 wrapper보다 Electron이 기존 UI 재사용과 메뉴 막대 통합에 직접 맞는다. 네이티브 HID 전체 재작성은 이미 검증한 프로토콜을 바꾸므로 이번 범위에서 제외한다.
