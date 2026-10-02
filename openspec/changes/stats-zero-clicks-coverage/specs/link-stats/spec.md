## ADDED Requirements

### Requirement: Links with no clicks are reported in creation order
When links exist but none has been clicked, `GET /api/stats` SHALL report the number of links, 0 clicks, and those links in the top list, at most five, oldest first, each with a click count of 0.

#### Scenario: Links exist and none was clicked
- **WHEN** three links created on different days exist and none has a click
- **THEN** the response reports 3 links and 0 clicks, and `top` lists the three links from the oldest to the newest, each with 0 clicks
