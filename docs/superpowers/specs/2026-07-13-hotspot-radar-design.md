# Hotspot Radar Design

## Goal

Add a hotspot query tool to the existing tools workspace. The first version focuses on Douyin, Xiaohongshu, and Bilibili, while keeping the topic coverage broad enough for daily trend discovery across content, commerce, entertainment, social issues, technology, lifestyle, games, film, knowledge, finance, and AI.

## Scope

In scope:

- Add a `/tools/hotspots` page named `热点查询` in the tools workspace.
- Place the navigation entry under the existing `资源` group.
- Provide platform filtering for `全部`, `抖音`, `小红书`, and `B站`.
- Provide topic filtering for common broad hotspot categories.
- Provide a keyword input that generates platform-specific search links.
- Show stable hotspot entry cards that open platform search, hot list, or reliable third-party trend/data pages.
- Add operation-use tags such as `选题观察`, `爆款拆解`, `商品趋势`, and `评论区洞察`.
- Add focused unit tests for data filtering and search link generation.

Out of scope for this version:

- Scraping live platform hot lists.
- Storing or ranking real-time trend data in the local database.
- Requiring platform login credentials.
- Adding paid third-party API integrations.
- Building an automated trend scoring model.

## User Experience

The page should feel like an operational radar rather than a marketing page. The first screen should show the usable controls and the hotspot entry grid directly.

Primary workflow:

1. The user opens `热点查询`.
2. The user selects a platform, a topic category, or keeps both as `全部`.
3. The user optionally enters a keyword.
4. The page shows relevant hotspot entry cards and generated search shortcuts.
5. The user opens an external source in a new tab to inspect the live hotspot details.

## Page Structure

Route:

- `/tools/hotspots`

Header:

- Title: `热点雷达`
- Description: `聚合抖音、小红书、B站的热点观察入口，按平台、类型和关键词快速跳转到实时来源。`

Controls:

- Platform segmented filter.
- Topic segmented or compact filter.
- Keyword search input.

Content:

- Search shortcut row for the current keyword.
- Hotspot entry grid grouped by platform and topic.
- Each card includes platform, title, description, topic category, operation-use tags, and an external open action.

## Data Model

Use static TypeScript configuration for the first version.

Core types:

- `HotspotPlatform`: `douyin`, `xiaohongshu`, `bilibili`
- `HotspotTopic`: broad hotspot categories such as `综合`, `娱乐`, `社会`, `科技`, `财经`, `生活`, `影视`, `游戏`, `知识`, `电商`, `AI`
- `HotspotEntry`: platform, title, description, topic, tags, href
- `HotspotSearchShortcut`: platform, title, href

The data module should expose pure helpers:

- `filterHotspotEntries(filter, entries)`
- `buildHotspotSearchShortcuts(keyword)`
- `getHotspotStats(entries)`

## Data Source Strategy

This version uses stable external entry links rather than direct scraping. This avoids fragile anti-bot behavior, login-only pages, and platform interface changes.

Suitable links include:

- Official platform search pages.
- Official or semi-official hot/ranking pages where accessible.
- Stable third-party trend/data pages already useful for content operators.

When an external page may require login or may change its interface, the card copy should describe it as an observation entry rather than promising guaranteed in-page data.

## Components

Add:

- `src/lib/hotspot-radar.ts`: static data, types, and pure helpers.
- `src/components/tools/hotspot-radar.tsx`: client component for filters, keyword input, generated shortcuts, and cards.
- `src/app/tools/hotspots/page.tsx`: authenticated workspace page shell.
- `tests/hotspot-radar.test.ts`: unit tests for helper behavior.

Update:

- `src/components/tools/nav-config.ts`: add `热点查询` under `资源`.

## Error Handling

Because the first version does not call a live API, runtime error handling is minimal. The UI should still handle:

- Empty filter results.
- Empty keyword input by hiding generated shortcuts or showing default platform entry cards.
- External links opening in a new tab with `rel="noreferrer"`.

## Testing

Tests should verify:

- Filtering by platform.
- Filtering by topic.
- Combining platform and topic filters.
- Keyword filtering over entry title, description, platform label, and tags.
- Search shortcut generation encodes Chinese and English keywords correctly.
- Empty keyword input returns no generated search shortcuts.

## Implementation Notes

Follow existing tools workspace patterns:

- Use `WorkspacePageHeader` for the page header.
- Use existing Tailwind utility style and compact operational UI.
- Use lucide icons for external-open actions if needed.
- Keep cards compact and scan-friendly.
- Do not add database tables or migrations for this version.
