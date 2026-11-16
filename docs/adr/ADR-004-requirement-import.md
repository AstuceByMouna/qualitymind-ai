# ADR-004 — Manual CSV/XLSX import (QA-87)

Status: Proposed, 2026-11-16.

Two-step API: POST /api/v1/imports/preview multipart (file, mapping JSON) stages
a bounded, immutable snapshot in PostgreSQL and reports create/ignore/reject rows.
No requirements are created during preview. POST /api/v1/imports/{batch}/confirm
locks the staging batch, refuses any rejected rows, and commits requirements,
provenance (source filename + external ID), optional priority, a single
acceptance-criteria cell and batch status atomically. Replays of confirmed batch
are idempotent; unique (source filename, external ID) rejects duplicate writes.
Import intentionally never updates existing requirements. GET /api/v1/imports/{batch}
retrieves the audit report. Source filename defines import scope in this MVP;
project-level isolation is pending future multi-tenancy. Limits: UTF-8 CSV/XLSX,
one worksheet, at most 2 MiB and 500 rows. The optional column mapping names
physical input headers; default columns: external_id, title, description, priority,
acceptance_criteria. Formula values are read only as cached data.
Never upload private production data or secrets to QA.
