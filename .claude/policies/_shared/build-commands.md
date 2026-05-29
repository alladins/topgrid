# SHARED-BUILD — 빌드 명령 (universal SSoT)

> tw-mail / tw-harness / tw-grid 공통 빌드/타입체크 표준 명령.
>
> 출처 통합:
> - tw-mail: constraints C-9 + POL-BUILD
> - tw-harness: constraints (FE/BE strict)
> - tw-grid: constraints C-12 + tw-grid 자체 build 명령

---

## §1. 명령 카탈로그

### §1.1 Spring Boot BE (Java 17 + Gradle)
```powershell
cd <project_root>
.\gradlew.bat compileJava
.\gradlew.bat clean build -x test
.\gradlew.bat test
```
- 통과 기준: **0 errors**. warnings는 별도 추적 (블로커 X).

### §1.2 Vite + React FE (TypeScript strict)
```powershell
cd <project_root>
npx tsc --noEmit
npm run build
npm run test  # 또는 npx vitest
```
- 통과 기준: **0 errors**.

### §1.3 PNPM Monorepo (tw-grid 환경)
```powershell
cd <monorepo_root>
pnpm install
pnpm -r build
pnpm -r typecheck
pnpm -r test
pnpm -r lint
```

### §1.4 Module Federation manifest (tw-mail 환경)
```powershell
cd tw-mail-front
npm run build
# dist/remoteEntry.js 존재 + 신규 노출 컴포넌트 manifest 포함 확인
```

---

## §2. Strict 정책

→ [SHARED-QUALITY/§2 + §3](code-quality.md#2-typescript-strict)
*요약*: `any` 0건 + raw type 0건 + 0 errors.

---

## §3. 통과 의무 시점

| Stage | 의무 명령 |
|-------|----------|
| Implement 완료 조건 | 변경 영역별 §1.1~§1.4 |
| Verify build category | 동일 |
| Migration validate | §1.1 + §1.2 |

1건이라도 실패 → 해당 stage NO.

---

## §4. 실패 시 처리

### §4.1 In-scope 실패
- 본 Goal 변경 파일이 build 실패에 기여 → 정상 NO + blocking
- 최대 3회 수정 재시도

### §4.2 Out-of-scope 실패
- 원인 파일이 본 Goal 외부 → [SHARED-DRIFT/§5](drift-spec.md#5-out-of-scope-build-break-처리)

---

## §5. Windows 환경 규칙 (CLAUDE.md 준수)

| 잘못된 예 (Linux/Mac) | 올바른 예 (Windows) |
|----------------------|---------------------|
| `./gradlew` | `gradlew.bat` 또는 `cmd /c gradlew.bat` |
| `./mvnw` | `mvnw.cmd` |
| `sh script.sh` | `cmd /c script.bat` |
| `export VAR=value` | `set VAR=value` (cmd) 또는 `$env:VAR='value'` (PowerShell) |
| `cat file` | Read 도구 |
| `grep pattern` | Grep 도구 |
| `find . -name` | Glob 도구 |

bash 의존 명령 금지. PowerShell 또는 cmd 만 사용.

### §5.1 MCP 서버 설정 (Windows)
```json
{
  "command": "cmd",
  "args": ["/c", "npx", "-y", "패키지명", ...]
}
```

### §5.2 PowerShell-via-Bash 우회 (tw-grid worktree 환경)
- Worktree 경계 우회 시 `powershell -NoProfile -Command "..."` 사용 (tw-grid C-34 참조)
