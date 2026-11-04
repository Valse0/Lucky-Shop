# Changelog and Version Policy

- Maintain a human-readable `docs/CHANGELOG.md`.
- Every implementation stage adds a dated entry (use current repository date/context; do not invent a date if unavailable).
- Record added, changed, fixed, removed, and known limitations.
- Do not increment version for an audit-only report.
- Patch: bug fixes and small visual corrections.
- Minor: backward-compatible features or gameplay additions.
- Major: breaking architecture/save-format changes, only with approval.
- Never claim a build passed unless the command was actually run and succeeded.


## AI Studio behavior
- Keep a concise implementation log in `docs/CHANGELOG.md`.
- For each stage, list exact files and commands.
- Never report visual inspection or tests that were not actually performed.
