# link-export Specification

## Purpose
Lets people take the list of links out of hop as a CSV file they can open in a spreadsheet or feed to another tool.

## Requirements

### Requirement: The CSV export lists every link
`GET /api/links.csv` SHALL return all links, expired ones included, as CSV with content type `text/csv`. The first row SHALL be the header `code,url,clicks,created_at,expires_at`. Each later row SHALL hold one link. An empty `expires_at` means the link never expires.

#### Scenario: No links
- **WHEN** a client fetches `/api/links.csv` and no links exist
- **THEN** the response is only the header row

#### Scenario: Several links
- **WHEN** three links exist, one of them expired and one with no expiry
- **THEN** the response has the header row and three data rows, and the link with no expiry has an empty `expires_at`

### Requirement: The CSV export quotes values correctly
A value containing a comma, a double quote or a line break SHALL be wrapped in double quotes, and each double quote inside it SHALL be doubled. Other values SHALL NOT be quoted.

#### Scenario: A destination with a comma and a quote
- **WHEN** a link points to `https://example.com/a,b?q="x"`
- **THEN** its `url` field is `"https://example.com/a,b?q=""x"""`

### Requirement: The home page links to the export
The home page SHALL show an "Export CSV" link that points to `/api/links.csv`.

#### Scenario: Following the link
- **WHEN** a visitor opens the home page and follows the "Export CSV" link
- **THEN** they receive the CSV file
