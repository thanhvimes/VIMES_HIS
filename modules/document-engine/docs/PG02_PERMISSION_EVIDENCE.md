# PG-02 evidence

- Read endpoints now require `DOCUMENT_TEMPLATE_VIEW` (or `DOCUMENT_TEMPLATE_ADMIN`).
- Write/test/review/publish endpoints retain their narrower permissions.
- Permission enforcement is enabled by default outside `NODE_ENV=test`; setting `TEMPLATE_STUDIO_ENFORCE_PERMISSIONS=false` is no longer sufficient to bypass production because production must never use that setting.
- Tests passed: middleware denial, default enforcement and role separation.
- Download, preview and signed URL now write `DOWNLOAD`, `PREVIEW`, `SIGNED_URL` audit events with actor, IP, version and action metadata.

Remaining: execute authenticated E2E with real Admin/Editor/Tester/Reviewer/Publisher roles and capture database audit records for download/preview/export.
