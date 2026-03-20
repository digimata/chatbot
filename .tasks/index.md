---
path: .tasks/index.md
outline: |
  • Chatbot — Tasks          L8
    ◦ Dependency Graph      L14
---

# Chatbot — Tasks

| Task | Title | Status | Priority | Blocked on |
|---|---|---|---|---|
| [T-0002](T-0002.md) | Integrate Chat SDK for multi-platform bot support | backlog | medium | |

## Dependency Graph

```
T-0001 (BetterAuth)       T-0003 (ToolLoopAgent)        parallel
                              │
                              ▼
                           T-0002 (Chat SDK)
```
