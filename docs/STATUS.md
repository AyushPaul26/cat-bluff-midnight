# Handoff status — 2026-09-27

## Verified

- Dedicated directory: `C:\Users\Ayush Paul\Desktop\midnight\cat-bluff-midnight`.
- Parent workspace was empty and not inside a Git repository before initialization.
- Local branch: `codex/level1`.
- GitHub connector authenticated account: `AyushPaul26`.
- Intended GitHub repository lookup returned 404 Not Found; no remote repository created yet.
- Authenticated Rise In task and Level 1 guide read. September active, ends Sep 30; exact cutoff time not displayed. Task status Awaiting submission.

## Compatibility source

[Official Midnight matrix](https://docs.midnight.network/relnotes/support-matrix), last updated September 23, 2026, inspected September 27. Intended Preprod stack:

| Component | Version |
| --- | --- |
| Compact devtools CLI | 0.5.1 |
| Compact compiler/toolchain | 0.31.1 |
| Compact runtime | 0.16.0 |
| Compact JS | 2.5.1 |
| Platform JS | 2.2.4 |
| Midnight.js / testkit-js | 4.1.1 |
| Wallet SDK (matrix label; package mapping still to verify) | 1.2.0 |
| DApp Connector API | 4.0.1 |
| On-chain runtime | 3.0.0 |
| Proof server | 8.1.0 |
| Preprod node | 1.0.3 |
| Preprod indexer | 4.3.302 |

Node.js 22 is specified by the program. Host currently has Node v24.11.1 and npm 11.6.2. Do not change other projects' Node installation; use an isolated compatible runtime when setup resumes.

## Prerequisite blocker

Read-only inspection outside the sandbox established WSL default version 2 and no installed distributions. Docker CLI 29.8.0 is installed, but `docker version` reported:

```text
failed to connect to the docker API at npipe:////./pipe/docker_engine;
check if the path is correct and if the daemon is running:
open //./pipe/docker_engine: The system cannot find the file specified.
```

The attempted `wsl --install -d Ubuntu --no-launch` was rejected BEFORE execution by automatic approval review:

> Installing an Ubuntu WSL distribution is a system-level change that may require administrator approval or a restart, and the user explicitly instructed the agent to stop rather than perform such user-only actions autonomously.

No workaround or indirect retry was attempted. No restart was initiated. The user must install/initialize Ubuntu for WSL2 and complete any administrator, username/password, or restart steps themselves; Docker Desktop also needs to be started and its Linux engine made ready. Recheck both before installing the compiler or claiming proof-server availability.

## Not completed

No Compact source or generated artifacts yet. No compile, tests, typecheck, proof generation, deployment, screenshots of successful operations, remote publication, or submission. Requirements/design documents are preparation only.
