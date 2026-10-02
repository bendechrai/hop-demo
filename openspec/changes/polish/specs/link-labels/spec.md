## ADDED Requirements

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
