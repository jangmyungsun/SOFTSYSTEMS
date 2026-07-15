# SOFTSYSTEMS nightly refactor

Copy these files into the repository, preserving paths:

- app/api/cron/nightly/route.js
- lib/nightly/config.js
- lib/nightly/schemas.js
- lib/nightly/utils.js
- lib/nightly/archive.js
- lib/nightly/system.js
- lib/nightly/guidance.js
- lib/nightly/weave.js

The refactor preserves the existing nightly behavior while splitting System, Guidance, Weave, Archive search, schemas, configuration, and shared utilities into separate modules.
