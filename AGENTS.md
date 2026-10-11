# Terminal Browser development

This repository maintains the Terminal Browser fork with pinned AgentCursor integration. It does not contain unrelated web research tools or a Herdr fork.

## Read first

Read `README.md`, `docs/development.md`, and `docs/installation.md`. This repository is the browser pnpm workspace root. `SOURCE.md` records the extraction. Do not make changes in the former monorepo or retained browser repositories for work assigned here.

## Development and verification

- Preserve certificate decisions, same-endpoint secure WebSocket approval reuse, control ownership, and human takeover boundaries.
- Preserve upstream licenses, dependency pins, and source provenance.
- Use focused branches/worktrees and change only assigned files. Coordinate shared interfaces before editing another worker's scope.
- Use the pinned pnpm version and existing required checks. Prefer small practical checks over new large test suites.
- Coordinate native builds and set `CARGO_BUILD_JOBS=2` unless a different budget is explicitly approved.
- Isolate test HOME, XDG directories, browser profile, interop state, and Pi state. Remove inherited Herdr and browser-owner routes. Use only task-owned fixture instances.
- Do not stop, restart, navigate, resize, or change control of a browser or agent that another task is using. Installation selection and running activation are separate stages.
- Keep Herdr upstream. Do not patch or deploy a custom Herdr binary to solve browser compatibility.

## Publication and delivery

Treat this repository as public. Inspect exact outgoing files and commit metadata for secrets, private paths, and personal information. Use `JCFrags` for the fork owner's identity. Keep private runtime records and investigation reports outside Git.

Follow the repository's normal checks and merge workflow. A local branch or open pull request is not remote integration. A successful build or selected release is not loaded activation. Preserve live work and obtain the required approval before replacing a shared browser daemon.
