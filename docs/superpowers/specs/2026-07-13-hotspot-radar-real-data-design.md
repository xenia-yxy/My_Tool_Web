# Hotspot Radar Real Data Upgrade Design

## Goal

Upgrade `热点雷达` from a stable external-entry directory into a real-data-first hotspot query tool. The tool should show verifiable hotspot data when a source can be fetched reliably, clearly mark source and fetch time, and fall back to official external pages when platform restrictions prevent reliable in-app data.

## Core Principle

The UI must never present guessed, cached sample, or generated items as live hotspot data.

Every displayed item must be one of:

- `真实数据`: fetched from a reachable source during the current request, with source URL and fetch time.
- `官方入口`: an external source the user can open when in-app fetching is unavailable or unreliable.
- `分析建议`: analysis derived from the visible query context and clearly separated from source data.

## Scope

In scope:

- Add a server-side hotspot query path for real data where reliable sources are available.
- Keep Douyin, Xiaohongshu, and Bilibili as the first supported platforms.
- Prioritize Bilibili for in-app real data because public web endpoints and public pages are usually more accessible.
- Treat Douyin and Xiaohongshu as fallback-first sources unless a reliable fetch path succeeds.
- Display platform, rank, title, source URL, fetch time, and data status for real entries.
- Display explicit fallback cards for official pages when real data cannot be fetched.
- Add an analysis panel that summarizes hotspot direction, usable content angles, platform fit, and risk checks.
- Add tests for normalization, fallback behavior, and analysis generation.

Out of scope:

- Circumventing login, anti-bot, or platform access controls.
- Using private cookies, user platform accounts, or browser automation to scrape logged-in pages.
- Claiming Douyin or Xiaohongshu data is real-time when it is only an external link.
- Building a database cache or scheduled crawler.
- Paid third-party trend APIs.
- LLM-based claims of exact rank, views, or heat unless those values are present in fetched source data.

## Data Source Strategy

Use a source adapter boundary:

- `bilibili`: attempts real-data fetch first.
- `douyin`: returns fallback entries unless a direct fetch succeeds without auth or brittle scraping.
- `xiaohongshu`: returns fallback entries unless a direct fetch succeeds without auth or brittle scraping.

Each adapter returns a normalized result:

- `platform`
- `status`: `real` or `fallback`
- `items`
- `sourceName`
- `sourceUrl`
- `fetchedAt`
- `message`

Real items include:

- `id`
- `rank`
- `title`
- `url`
- `topic`
- optional `heatLabel`
- optional `author`

Fallback items include:

- `id`
- `title`
- `description`
- `url`
- `reason`

## Analysis Strategy

Analysis must be deterministic and transparent in the first version. It should not invent facts.

Inputs:

- selected platform
- selected topic
- keyword
- returned real items
- fallback status

Outputs:

- `trendSummary`: what the visible data or query context suggests.
- `contentAngles`: concrete content directions the user can try.
- `platformFit`: how Douyin, Xiaohongshu, and Bilibili differ for this query.
- `commerceAngles`: optional product, seed content, or conversion angles.
- `riskChecks`: what needs manual verification before publishing.

Rules:

- If real items exist, analysis may reference their titles and ranks.
- If only fallback entries exist, analysis must say it is based on the keyword and platform characteristics, not live rank data.
- If keyword is empty, analysis should focus on current source coverage and how to inspect live pages.

## User Experience

The current `热点雷达` page remains the entry point.

New sections:

- `实时数据状态`: shows which platforms returned real data and which require external confirmation.
- `真实热点列表`: shows fetched items when available.
- `官方确认入口`: shows fallback links with reasons.
- `热点分析`: shows deterministic analysis and validation suggestions.

Controls remain:

- platform filter
- topic filter
- keyword input

## API Design

Add an internal API route:

- `GET /api/tools/hotspots`

Query params:

- `platform`: `all`, `douyin`, `xiaohongshu`, `bilibili`
- `topic`: existing topic labels or `all`
- `query`: optional keyword

Response:

```ts
type HotspotQueryResponse = {
  fetchedAt: string;
  sources: HotspotSourceResult[];
  analysis: HotspotAnalysis;
};
```

The client component fetches this endpoint and renders loading, error, real-data, fallback, and analysis states.

## Error Handling

- Network failures become source-level fallback results.
- Invalid query params are normalized to `all` or an empty keyword.
- API route should return HTTP 200 when at least fallback entries are available.
- API route should return HTTP 500 only for unexpected server errors outside source adapters.
- Client should show a compact error state with a retry action if the API request itself fails.

## Testing

Add focused tests for:

- Query param normalization.
- Bilibili item normalization from a representative source payload.
- Source fallback result shape.
- Analysis when real items exist.
- Analysis when only fallback entries exist.
- API handler helper behavior without depending on live network.

Live network calls should not be required for unit tests.

## Implementation Notes

- Keep source adapters in server-side modules only.
- Keep deterministic analysis in a pure helper for testability.
- Reuse existing static entry data for official fallback links where possible.
- Do not add Prisma models or migrations.
- Do not remove the existing static cards until real-data rendering covers the same navigation need.
