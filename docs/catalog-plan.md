# GitHub Catalog Implementation Plan

**Goal:** Two private repositories and authenticated download/verify/apply in the local Electron app.
**Spec:** [catalog-design.md](catalog-design.md)
**Architecture:** static versioned catalog; Electron main GitHub client + encrypted credentials + validated cache; renderer catalog UI uses existing profile/device transactions.
**Execution:** User explicitly requested implementation and repository creation. Proceed in supplied directory; initialize main for initial upload, no unrelated worktree.

- [ ] 1. Create private remotes; prepare independent catalog with 6 profiles, SHA manifest, documentation and CI validator.
- [ ] 2. TDD manifest validation, immutable GitHub reads, digest/model checks, auth failures, offline cache and secret boundary.
- [ ] 3. Add main/preload catalog IPC, credentials and compact UI; preserve draft/backup and prevent incompatible apply.
- [ ] 4. Test real private GitHub round-trip; review, package/update installed app, native UI verification.
- [ ] 5. Commit/push reviewed source and catalog; verify both private repositories and CI results.

Review focus: auth token never in renderer responses/logs; private backups excluded from Git; untrusted manifest is data only; cache validates on read; no failed new download silently replaced with stale version; same commit for manifest/profile; no replacement of unsaved profile on failure; device apply retains backup/rollback.
