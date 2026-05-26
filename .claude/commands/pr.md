---
description: 현재 브랜치의 변경사항으로 PR을 생성한다. 코드를 직접 읽어 PR 본문을 작성하고, 추상적 표현을 피한다.
allowed-tools: Bash, Read
---

# /pr — Pull Request 자동 생성

## Instructions

### Step 0: 변경사항 존재 확인
- `git status`로 unstaged/staged 변경 또는 unpushed 커밋이 있는지 확인
- 없으면: "PR을 만들 변경이 없습니다" 출력 후 종료

### Step 1: 현재 브랜치 상태 분석
- `git branch --show-current` → 현재 브랜치
- `git log main..HEAD --oneline` → main과의 커밋 차이
- `git diff main...HEAD --stat` → 변경 파일/라인 수
- 브랜치 prefix 확인 (`feature/` / `fix/` / `docs/` / `refactor/`)

### Step 2: 코드 깊이 읽기 ⭐ CRITICAL ⭐
**커밋 메시지만 보고 PR 본문 작성 금지.**

- `git diff main...HEAD` 전체 출력 검토
- 변경된 핵심 파일은 `Read` 도구로 **전체 내용** 확인
- 특히:
  - **신규 함수/타입의 의도**가 코드에서 명확한가
  - **테스트가 무엇을 검증**하는가 (단순 happy path? 엣지 케이스?)
  - **SPEC.md 갱신이 필요한 변경**인데 SPEC이 안 바뀌었나
  - 커밋 메시지의 `Refs: SPEC.md §N`이 실제 SPEC 섹션과 일치하나

### Step 3: Push 확인
- 현재 브랜치가 origin에 있는지: `git ls-remote --heads origin <branch>`
- 없으면: `git push -u origin <branch>` 수행
- 있으면: `git push` 수행 (필요 시)

### Step 4: 이슈/스펙 참조 추출
- 커밋 메시지에서 `Refs: SPEC.md §N` 모두 추출 → PR 본문에 정리
- 브랜치 이름에서 GitHub Issue 번호 추출 (예: `feature/42-rate-limit` → #42)

### Step 5: PR 제목 형식
```
<Type>(<scope>): <헤더, 동사형 명사 종결>
```
- 가장 큰 커밋의 헤더를 기본으로
- 여러 도메인 섞였으면 `Multi: <요약>` 또는 별도 PR로 분할 제안

### Step 6: PR 본문 (타입별)

#### Feature
```markdown
## What
<무엇을 추가했는가, 1~2줄>

## Why
<왜 필요했는가 — SPEC.md 관련 섹션 인용 가능>

## Changes
| 영역 | 변경 |
|---|---|
| `<file>` | <어떤 변화> |
| ... | ... |

## Tests
- <테스트가 무엇을 검증하나>

## SPEC References
- SPEC.md §N

## Self-Review Checklist
- [ ] SPEC.md 갱신이 필요한 변경이 모두 반영되었는가
- [ ] 커밋이 기능 단위로 분리되어 있는가
- [ ] 핵심 로직 테스트가 추가되었는가
- [ ] LESSONS.md에 추가할 새 교훈은 없는가
```

#### Bug Fix
```markdown
## 문제
<무엇이 잘못 동작했나>

## 원인
<왜 발생했나>

## 해결
<어떻게 풀었나>

## Changes
| 영역 | 변경 |

## Tests
- <회귀 방지 테스트가 추가되었나>

## LESSONS.md
- <추가된 교훈 항목 링크>
```

#### Refactoring
```markdown
## 정리 대상
<무엇을 정리했나>

## 이유
<왜 정리가 필요했나>

## 동작 변화 없음 확인
- [ ] 기존 테스트 모두 통과
- [ ] 외부 API 변경 없음

## Changes
| 영역 | 변경 |
```

### Step 7: `gh pr create` 실행
```bash
gh pr create \
  --base main \
  --head <current-branch> \
  --title "<제목>" \
  --body "<본문>"
```

생성 후 PR URL을 출력.

## 절대 금지

- ❌ "여러 가지 개선" 같은 추상적 PR 제목
- ❌ Changes에 "X 파일 수정" 같이 무엇이 변했는지 없는 표현
- ❌ 커밋 메시지를 그대로 복사 (코드를 읽고 재구성)
- ❌ SPEC.md 미반영 변경 (반드시 별도 커밋으로 SPEC 갱신 먼저)
