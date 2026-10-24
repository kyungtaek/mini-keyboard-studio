# Electron 0.2.0 검증

2026-10-24, macOS Apple Silicon arm64. Electron 45.0.0 / electron-builder 26.18.0 / PyInstaller 6.22.3 / hidapi 0.15.0.

## 확인한 결과

- 설치 위치: `~/Applications/Mini Keyboard Studio.app`. ZIP: `dist/Mini Keyboard Studio-0.2.0-arm64-mac.zip`.
- `codesign --verify --deep --strict` 통과, ad-hoc 서명. Apple 공증은 하지 않았다.
- 설치 앱은 `.app/Contents/Resources/hid/mini-keyboard-hid`를 실행하며 시스템 Python/Node나 개발 디렉터리를 사용하지 않는다. 동봉한 실행 파일 단독으로 상태 조회와 실제 USB 목록 조회 성공.
- 고정된 `mini-keyboard://studio/`에서 UI 로드. 샘플 6종 자동 생성. Codex 샘플을 연 뒤 앱 종료·다시 실행해 샘플 보관함과 현재 작업 유지 확인.
- 설치 앱에서 실제 `514C:8850` USB 키보드 연결과 현재 키 값 표시 확인. 앱의 로컬 API를 통해 75개 키 동작을 독립적으로 다시 읽어 기존 원본의 저장 바이트 2..50과 전부 일치. 키/LED 설정 쓰기는 보내지 않았다. [증거](../evidence/electron-readback-20261024.json).
- 로그인 항목 `openAtLogin:true`, `status:enabled` 확인. 재로그인 실행은 미검증.
- 설정 창 닫기 후 `windowVisible:false`, `trayCreated:true`, `connected:true` 및 로컬 API 응답 유지 확인.
- 네이티브 앱 메뉴에 설정 열기, 데이터 폴더, 로그인 자동 실행, 로컬 API, 종료 표시. 로컬 API를 메뉴에서 켜고 실제 호출 성공.
- 네이티브 종료 후 앱과 HID 자식 프로세스 모두 제거 확인. 다시 실행해 USB 자동 연결 확인.
- 공유 링크는 제한된 preload IPC로 복사. 복사 후 앱의 저장하지 않은 입력 필드에 붙여넣어 `mini-keyboard://studio/#keymap=...` 확인하고 원래 입력값으로 되돌렸다. Chrome 자동화의 클립보드와 네이티브 클립보드는 별개로 관측되어 네이티브 붙여넣기를 최종 증거로 사용했다.
- ASAR 파일 목록에 개발 가상 환경, 개인 백업, 조사 증거가 없음.

## 자동 검증과 독립 리뷰

기존 프로필/코덱/롤백 테스트에 packaged runtime/cwd, graceful EOF, 종료 지연 시 소유권 보존, IPC sender/origin, 파일 접근, 샘플 seeding, malformed API URL을 추가했다. 최종 실행 횟수와 결과는 `evidence/electron-build-20261024.json`에 기록한다.

독립 리뷰에서 찾은 malformed API URL의 main crash, 종료 취소 시 API/폴링 재개, 지연 종료 중 stdin 재기록 문제를 보완했다. URL 오류는 400을 반환하며 다음 정상 요청이 성공한다. 종료 중인 HID 소유자가 끝나기 전에는 다른 프로세스를 시작하거나 stdin에 다시 쓰지 않는다.

## 미확인 범위

브라우저 자동화는 http/https만 허용하여 외부 `mini-keyboard:` 링크 열기를 거부했다. 우회하지 않았으며 OS 링크 활성화는 미검증이다. 실제 재로그인, 외부 Mac의 Gatekeeper/공증 배포, 물리 키 누름 전체, LED 쓰기/시각 효과, 전원 유지, 앱별 상태 수집기와 자동 키맵 전환은 이번 패키징 검증에 포함하지 않는다.
