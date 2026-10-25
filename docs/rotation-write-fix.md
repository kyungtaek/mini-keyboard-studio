# 방향 재배치·FD 기록 오류·진단 로그 — 2026-10-24

> **0.6.1 correction:** The historical keep-screen-position remap below counter-rotated function labels after applying an orientation change. Rotation now keeps physical action IDs and LED slots unchanged so the board and its functions turn together. Dial assignments remain unchanged; orientation does not add a USB permutation. The FD write/backup/readback findings below still apply.

## 사용자 요청과 화면

- 방향 제어를 왼쪽 회전 / 오른쪽 회전 / 초기화로 축소한다.
- 방향 변경 직후 “변경된 방향으로 키를 다시 설정할까요?”를 표시한다. 화면 방향만 바꿀 수도 있다.
- 키 재배치·적용은 세 레이어의 기존 화면 위치를 유지하도록 물리 키 ID에 동작을 다시 배정한다. 모든 노브 동작은 이 쓰기 작업에서 preserve 처리한다. 직사각형 모델의 행/열이 달라지는 90도 전환은 재배치가 불가능하다고 표시하며 화면 회전은 허용한다.
- 알 수 없는 preserve 키를 추정해 옮기지 않는다. 현재 장치에서 해석 가능한 동작이 있으면 사용하고, 없으면 적용을 차단한다.
- 사용자 이미지대로 상단 앱 헤더를 없애고 연결 상태와 장치 관리 진입을 하단 적용 바에 통합한다. 파일은 왼쪽과 네이티브 메뉴에서 연다.

## 오류 원인과 수정

사용자가 본 상세 오류는 레이어 1 / 동작 19·21·23 저장 확인 실패였다. 최초 단일 슬롯 시험에서 3항목 키 조합을 2항목 미디어로 변경하면 이전 세 번째 항목 바이트가 남는 것을 확인했다. 전체 시스템 키맵 시험에서는 복원 과정의 미디어 timing 바이트도 그대로 기록되지 않는 경우를 확인했다. 구버전 helper를 종료한 뒤 디스크에 저장된 원본 백업으로 복구하고 75개 저장 영역을 전부 비교해 일치를 확인했다.

이 펌웨어는 FD 입력의 비활성 항목과 미디어 timing 필드를 단순한 전체 레코드 복사처럼 갱신하지 않는다. 이에 다음을 적용했다.

1. 인코더는 원본에서 비활성 바이트를 보존하고 새 동작의 활성 필드만 구성한다.
2. JS writer는 동일 슬롯에 14개 키 항목과 timing 필드를 먼저 준비한 뒤 최종 종류/count를 기록하고 기존 commit·전체 재읽기를 수행한다. 중간 준비만으로 성공을 알리지 않는다.
3. Python helper의 EOF/abort 원본 복구에도 같은 기록 순서를 적용했다.
4. 검증은 여전히 저장 영역 2..50 전체를 비교한다. 불일치 로그에는 레이어·동작 ID·바이트 위치만 기록하고 실제 키 값은 넣지 않는다.

## 실기 증거

- 실제 연결된 514C:8850 / 10·03·0B에서 수정된 JS+Python 경로로 시스템 샘플의 세 레이어 적용 및 엄격한 재읽기 검증을 통과했다.
- 시험 직후 원본 백업을 복원하고 세 레이어 75개 전체 저장 영역 일치를 확인했다.
- 원본과 wire 관찰은 Git에서 제외되는 로컬 `device-backups/`, `evidence/full-system-apply-verified.json`에만 보관한다.
- 이 결과는 설정 저장/재읽기 증거다. 실제 게임 입력·전원 차단 후 유지·모든 다른 펌웨어의 동작을 입증하지 않는다.

로그 형식과 보관 위치는 [logging.md](logging.md)를 따른다. 키보드 입력값·인증 토큰을 로그로 덤프하지 않는다.
