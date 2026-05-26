# LESSONS.md

> 개발 중 발견한 실수 / 함정 / 의외의 사실을 누적해 같은 실수 반복을 막는다.

## 프로토콜

1. **작업 시작 전**: 이 문서에서 관련 키워드 검색 (예: "rate limit", "OpenAI", "Vercel")
2. **작업 중 발견**: 새 항목 추가 (아래 형식)
3. **PR 머지 후**: 다음 작업자(또는 AI)가 같은 곳에서 멈추지 않도록

## 기록 형식

```markdown
### YYYY-MM-DD — <한 줄 요약>

- **상황**: 무엇을 하려 했나
- **문제**: 무엇이 발생했나
- **원인**: 왜 발생했나
- **해결**: 어떻게 풀었나
- **예방**: 다음 사람이 어떻게 피할 수 있나
```

---

## 누적 교훈

### 2026-05-26 — Vercel Functions의 stateless 환경에서 메모리 기반 rate limit은 무력

- **상황**: 토이 프로젝트에 가벼운 rate limit을 붙이려고 in-memory Map을 검토
- **문제**: Vercel Functions는 요청마다 instance가 다를 수 있어 카운터가 공유되지 않음
- **원인**: serverless는 stateless. 인스턴스 단위 메모리는 신뢰 불가
- **해결**: Vercel KV (Vercel-hosted Redis) 사용. INCR + EXPIRE 원자 연산
- **예방**: Functions 안에서 카운터·중복방지·세션을 다룰 때는 항상 외부 저장소 필요. KV / Upstash / DB 등

---

> 항목이 누적되면 카테고리별로 ## 섹션 분리.
