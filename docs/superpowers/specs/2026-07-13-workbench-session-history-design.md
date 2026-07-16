# Workbench Session and History Design

**Date:** 2026-07-13

## Goal

Keep every workbench tool's in-progress work, complete prompt, output, and operation history available after page navigation or reload. Users must be able to inspect and edit the full prompt before generation, return to a tool-specific history view, and use the hotspot query tool from the Create navigation group.

## Scope

- Cover all workbench entries exposed from `/tools`, including planning, creation, ecommerce, and resource tools.
- Persist generation state and generated images while generation is running and after it completes.
- Provide a shared prompt modal for viewing and editing the full prompt.
- Provide a history route and a tool-scoped history entry for every tool.
- Move Hotspot Query from Resource to Create.
- Verify all visible tool actions, relevant APIs, and navigation paths; record the results in a Markdown delivery report.

## Non-Goals

- Replacing the existing AI provider, file storage, or image gallery.
- Building a separate audit system for administrative operations.
- Rewriting each tool's business-specific form or output layout.

## Architecture

Introduce a user-owned `WorkbenchSession` record as the common persistence boundary. A record stores the tool identifier, human-readable title, current status, editable prompt, serialized input snapshot, serialized output snapshot, optional image asset IDs, error details, and timestamps.

The session service exposes create, update, list, and retrieve operations. It validates tool identifiers and status transitions, scopes every query to the authenticated user, and limits stored payload size. Existing AI image assets and image jobs remain the source of truth for image files and remote execution; their IDs are referenced from the session record.

Each tool receives a small client-side session adapter. The adapter restores the most recent active session on mount, writes a debounced browser cache for instant return, saves important transitions to the API, and clears only transient cache after a completed session is safely persisted. Local cache is a recovery layer, not the historical source of truth.

## User Flows

### Generation and Return

1. The user configures a tool and starts a generation or analysis task.
2. The page creates a `RUNNING` session before awaiting the API result.
3. Input, prompt, task ID, and provisional image references are persisted immediately.
4. The user may navigate away. Returning restores the latest active session and polls or refreshes its associated image job where applicable.
5. Success saves the output and image IDs as `SUCCEEDED`; failures save a readable error as `FAILED`.

### Prompt Inspection and Editing

Every tool page presents a compact prompt action. It opens one shared accessible modal that displays the complete prompt in an editable textarea. Saving updates the current session and the tool's local state. For image generation, a final confirmation continues to use the edited prompt as the provider input.

Tools that do not call an image model still expose their generated instruction, query, or content prompt when one exists. Tools with no meaningful prompt expose the full action/input summary in the same modal, labelled accurately for that tool.

### Tool History

`/tools/history/[toolId]` lists sessions for the requested tool with status, title, time, output summary, thumbnail where applicable, and actions to reopen or inspect the full prompt. Every workbench page has a History action pointing to its own route. The route resolves invalid tool IDs safely and never returns another user's records.

For non-generative tools, a history entry records a completed action or captured result, such as a search query, bookmark update, planning update, or directory filter. The UI only displays fields the tool recorded.

## UI Components

- `WorkbenchSessionProvider` or a focused hook manages restore, persistence, and status updates without changing tool-specific visual output.
- `PromptEditorDialog` is shared by all workbench pages. It supports full text display, edit, copy, cancel, and save states.
- `ToolHistoryLink` provides a consistent history action in tool headers.
- `WorkbenchHistoryPage` renders tool-specific records from a shared route and uses existing cards, badges, and image patterns.

The existing image gallery remains available and continues to surface all image assets. It is not replaced by the new per-tool history views.

## Data Model and API

`WorkbenchSession` fields:

- `id`, `authorId`, `toolId`, `title`, `status`
- `prompt`, `inputSnapshot`, `outputSnapshot`
- `imageAssetIds`, `externalJobId`, `errorMessage`
- `createdAt`, `updatedAt`, `completedAt`

Payload snapshots are JSON with explicit size limits. `status` is one of `DRAFT`, `RUNNING`, `SUCCEEDED`, `FAILED`. API routes support:

- `POST /api/tools/sessions` to create a session.
- `GET /api/tools/sessions?toolId=...` to list sessions for the current user.
- `GET /api/tools/sessions/[id]` to retrieve one session.
- `PATCH /api/tools/sessions/[id]` to update prompt, snapshots, status, and linked IDs.

## Error Handling

- If restoring a server session fails, the client offers the cached local state and reports that it has not yet been synchronized.
- A failed background persistence request leaves the tool usable and retries on the next important state change.
- Missing image assets or jobs render a recoverable status rather than clearing the session.
- Invalid session, tool, or ownership requests return existing standard API errors.

## Test and Acceptance Criteria

- Start image generation, navigate to another page, return, and confirm the running/success state and generated images remain available.
- Confirm the full prompt action opens an editable modal on every tool route and saved changes are used by the next submission.
- Confirm every navigation tool exposes a working history action and can list only its own records.
- Confirm Hotspot Query appears under Create and activates that group.
- Add unit tests for validation, ownership filtering, prompt updates, session restoration helpers, route resolution, and navigation.
- Run targeted API/component tests, lint, production build, and browser-level smoke checks for all tool action buttons that do not require external provider credentials.
- Publish a Markdown delivery report with the tested functions, commands, outcomes, and any provider-dependent limitations.

## Risks and Mitigations

- Broad tool coverage can cause repetitive integration work. The shared session adapter and prompt dialog reduce duplication while allowing each tool to record its own output schema.
- Browser navigation can interrupt client-side provider calls. Persisting `RUNNING` before request submission and reconciling existing image jobs ensures state is not discarded.
- Serialized payloads can grow without bounds. Server-side validation limits text, image reference counts, and JSON payload sizes.
