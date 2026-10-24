# GitHub 카탈로그 검증 — 2026-10-24

## 저장소와 실제 네트워크

- 앱: `kyungtaek/mini-keyboard-studio`, 카탈로그: `kyungtaek/mini-keyboard-keymap-catalog`. 두 저장소 모두 private.
- 카탈로그 커밋 `f7ff1aea02eb4f690db1960f0fc77d9ea7edd9a8`의 목록과 6개 프로필을 실제 GitHub API로 내려받아 SHA-256, 프로필 형식, 이름·ID·모델 일치를 확인했다. 각 3레이어, 총 450개 동작이다.
- 기존 GitHub CLI 인증을 재사용했다. 토큰은 출력·소스·프로필·renderer 응답에 포함하지 않았다. 별도 저장 토큰 경로는 가짜 암호화 공급자 단위 테스트로 확인했으며, 실제 토큰을 새로 저장하지 않았다.
- 카탈로그 독립 생성·검사·테스트 10개와 GitHub Actions 성공을 확인했다.

## 자동 검증

- JavaScript 전체 테스트: 57개. manifest/path/중복/모델, 고정 커밋 요청, 인증·크기 제한, 원격 해시 변조, 오프라인 캐시 검증, 손상 캐시 온라인 복구 포함.
- Python 27개: 물리 장치 없이 가짜 HID 전송으로 백업·쓰기·검증·롤백·LED·소유권·종료 동작 검증.
- UI 테스트는 가짜 DOM/장치를 사용한다. 실패 시 현재 작업 유지, 새 ID·보관함·draft 저장, 다운로드부터 적용까지 장치 잠금, 연결 변경·모델 불일치 차단, 기존 적용·재읽기 호출, 오프라인 표시·검색을 확인했다.
- 독립 리뷰에서 발견한 손상 캐시의 온라인 복구 문제를 회귀 테스트와 함께 수정했다. 같은 커밋의 파일만 다시 받아 검증한 뒤 교체한다.

## 증거 경계

카탈로그 샘플을 실제 연결된 키보드에 덮어쓰는 테스트는 하지 않는다. 실제 USB 장치의 기존 설정을 유지하며, 다운로드 후 적용 경로는 가짜 장치 검증과 기존 장치 백업·기록·재읽기 검증을 구분한다. 게임 샘플은 사용자가 게임 설정에 맞춰야 하는 바인딩 제안이다.

## 설치된 앱과 CI

- Apple Silicon 0.3.0 앱을 `~/Applications/Mini Keyboard Studio.app`에 업데이트하고 `codesign --verify --deep --strict` 성공, Info.plist 버전 0.3.0을 확인했다. 기존 HID 실행 파일을 동봉한다.
- 실제 앱 화면에서 GitHub CLI 연결, 목록 6개, 모델·플랫폼·버전 카드, 다운로드·적용 버튼을 확인했다. VS Code 카드를 **편집기로 열기**로 다운로드하고 보관함에 새 항목이 생기며 편집기 이름이 바뀌는 것을 확인한 뒤 기존 Codex 작업으로 돌아왔다.
- 앱 캐시에는 검증한 목록과 프로필만 권한 0600으로 저장되었다. 실제 토큰 등록은 수행하지 않았다.
- 앱 상태 파일: packaged=true, version=0.3.0, connected=true, trayCreated=true, launch-at-login enabled. 기존 로컬 API 설정 유지. 창 높이 안의 카탈로그 대화상자를 확인했다.
- 앱 CI: https://github.com/kyungtaek/mini-keyboard-studio/actions/runs/40095965239 성공. 카탈로그 CI: https://github.com/kyungtaek/mini-keyboard-keymap-catalog/actions/runs/40095491460 성공.
- ZIP SHA-256: `843eacdc0083e426ca7e99c63f6f2c9a4db6ab91946a717f1e3cf08faa0a5bb4` (`dist/Mini Keyboard Studio-0.3.0-arm64-mac.zip`). 패키지는 로컬 ad-hoc 서명이며 공증 배포는 범위 밖이다.
