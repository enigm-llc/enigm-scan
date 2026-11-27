## Summary

Describe the change and its effect on users, privacy or security.

## Verification

- [ ] `npm ci`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `cargo fmt --check` and `cargo test --locked` for `agent/core`, `agent/runtime` and `src-tauri`
- [ ] Engine adapter tests, if `scripts/engines` changed
- [ ] Tried on a real phone (say which), or not applicable

## Privacy impact

- [ ] Phone data still never leaves the computer and no tracking is added (any new anonymous count is documented in `docs/STATISTICS.md`).
- [ ] New user-facing text exists in all six languages.
- [ ] No real backups, reports, phone identifiers, credentials or keys are included.
