# link-labels Specification

## Purpose
Lets people tag each short link with a short optional label, see the label in the links table, and narrow the table to the links that carry a given label.

## Requirements

### Requirement: A link can be created with a label
Creating a link SHALL accept an optional `label`. A label SHALL be trimmed, and SHALL then be 1 to 40 characters of letters, digits, spaces and hyphens. A missing, null or blank label SHALL store no label. Any other label, or a label that is not text, SHALL be refused with 400 and a message that states the rule, and no link SHALL be created.

#### Scenario: A valid label
- **WHEN** a client posts a new link with the label `Spring launch`
- **THEN** the response is 201 and its `label` is `Spring launch`

#### Scenario: Surrounding spaces are trimmed
- **WHEN** a client posts a new link with the label `  docs  `
- **THEN** the stored label is `docs`

#### Scenario: No label
- **WHEN** a client posts a new link with no label, or a blank one
- **THEN** the response is 201 and its `label` is `null`

#### Scenario: A label that is too long
- **WHEN** a client posts a new link with a label of 41 characters
- **THEN** the response is 400 with a message that states the label rule, and no link is created

#### Scenario: A label with a character outside the rule
- **WHEN** a client posts a new link with the label `sale!`
- **THEN** the response is 400 with a message that states the label rule, and no link is created

### Requirement: The API returns the label
Every API response that returns a link (creating, listing and fetching one) SHALL include its `label`, which SHALL be `null` for a link without one. Links that existed before labels SHALL have a `null` label.

#### Scenario: Listing links
- **WHEN** one link has the label `docs` and another has none, and a client fetches `/api/links`
- **THEN** the first link's `label` is `docs` and the second's is `null`

#### Scenario: Fetching one link
- **WHEN** a client fetches `/api/links/<code>` for a link labelled `docs`
- **THEN** its `label` is `docs`

### Requirement: The home page form takes a label
The home page form SHALL have an optional field labelled "Label (optional)" whose value is sent as the new link's label.

#### Scenario: Creating a labelled link from the page
- **WHEN** a visitor enters a URL and the label `docs` and presses Shorten
- **THEN** the link is created with the label `docs` and its row appears in the table

### Requirement: Each row shows its label as a tag
Each row of the links table SHALL show the link's label as a small tag next to its destination. A link without a label SHALL show no tag.

#### Scenario: A labelled and an unlabelled link
- **WHEN** the table holds a link labelled `docs` and a link with no label
- **THEN** the first row shows a `docs` tag and the second row shows none

### Requirement: The table can be filtered by label
The home page SHALL have a filter box labelled "Filter by label". When it holds text, the table SHALL show only links whose label contains that text, ignoring case, and links without a label SHALL be hidden. When it is empty, every link SHALL show. The filter SHALL still apply after the table refreshes. When no link matches, the table SHALL say so.

#### Scenario: Narrowing by label
- **WHEN** links labelled `docs`, `Docs team` and `sales` exist and a visitor types `doc` in the filter box
- **THEN** only the `docs` and `Docs team` rows show

#### Scenario: No match
- **WHEN** a visitor types a label that no link carries
- **THEN** no link rows show and the table says no links match

#### Scenario: Clearing the filter
- **WHEN** a visitor clears the filter box
- **THEN** every link shows again

### Requirement: A label tag stays inside the destination cell
The destination cell of a link row SHALL keep the label tag inside the cell for any valid label, including a 40-character label in wide capital letters. A tag too wide for the cell SHALL be cut short with an ellipsis, and its full text SHALL be available as the tag's title. The tag SHALL NOT push the cell wider.

#### Scenario: A wide label
- **WHEN** a link has a 40-character label of capital W and a long destination, and the home page is 1280px wide
- **THEN** the tag's right edge is inside the destination cell and the tag ends in an ellipsis

#### Scenario: A normal label
- **WHEN** a link has the label `docs`
- **THEN** the tag shows `docs` in full

### Requirement: The destination URL keeps the room the tag does not need
The destination URL in a row SHALL use all the width of the destination cell that the tag does not need, and SHALL be cut short with an ellipsis only when it does not fit. A row without a label SHALL show the URL across the whole cell. The URL SHALL always show at least some of its text.

#### Scenario: A long destination with a short label
- **WHEN** a link has a long destination and the label `campaign`
- **THEN** the URL shows well beyond 240px of text, ends in an ellipsis and the tag is fully visible

#### Scenario: A short destination with a wide label
- **WHEN** a link has the destination `https://example.com/a` and a 40-character label of capital W
- **THEN** the URL still shows some of its text
