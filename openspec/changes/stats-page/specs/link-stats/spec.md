# Spec Delta

## Purpose

Reports how the short link service is used as a whole: how many links exist, how many clicks they have drawn, and which links are clicked most.

## ADDED Requirements

### Requirement: The stats API reports the totals
`GET /api/stats` SHALL return JSON with the total number of links and the total number of clicks across all links. Expired links SHALL be counted in both totals.

#### Scenario: No links
- **WHEN** a client fetches `/api/stats` and no links exist
- **THEN** the response reports 0 links and 0 clicks

#### Scenario: Totals include expired links
- **WHEN** three links exist with 4, 2 and 0 clicks and the one with 2 clicks has expired
- **THEN** the response reports 3 links and 6 clicks

### Requirement: The stats API reports the five most clicked links
`GET /api/stats` SHALL return the links with the most clicks, at most five, ordered from most clicked to least. Each SHALL carry its code, destination, click count and whether it has expired. Links with the same click count SHALL keep the same order from one request to the next.

#### Scenario: More than five links
- **WHEN** seven links exist with different click counts
- **THEN** the response lists exactly the five with the most clicks, most clicked first

#### Scenario: Fewer than five links
- **WHEN** two links exist
- **THEN** the response lists both, most clicked first

#### Scenario: An expired link in the top five
- **WHEN** an expired link has enough clicks to be among the five most clicked
- **THEN** it is listed in its place with `expired` true

### Requirement: The stats page shows the numbers
`GET /stats` SHALL return an HTML page that shows the total number of links, the total number of clicks, and the five most clicked links with their code, destination and click count. An expired link in that list SHALL be marked as expired. The page SHALL have a link back to the home page. The page SHALL read its numbers from `GET /api/stats`.

#### Scenario: Stats page with links
- **WHEN** a user opens `/stats` while links exist
- **THEN** the page shows the two totals and a table with up to five rows, one per most clicked link, showing code, destination and click count

#### Scenario: Expired link on the stats page
- **WHEN** an expired link is among the five most clicked
- **THEN** its row is marked expired and its click count is still shown

#### Scenario: Stats page with no links
- **WHEN** a user opens `/stats` and no links exist
- **THEN** the page shows 0 links, 0 clicks and a note that there are no links yet

#### Scenario: Back to the home page
- **WHEN** a user follows the Home link on the stats page
- **THEN** the home page opens

### Requirement: The home page links to the stats page
The home page header SHALL carry a link labelled Stats that opens `/stats`.

#### Scenario: Follow the Stats link
- **WHEN** a user follows the Stats link in the home page header
- **THEN** the stats page opens
