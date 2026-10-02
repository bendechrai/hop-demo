## ADDED Requirements

### Requirement: An old link with the code health does not hide the endpoint
A link stored under the code `health` before that code was reserved SHALL NOT change what `GET /health` answers. The endpoint SHALL still respond 200 with the health body, and that link SHALL count in `links` like any other.

#### Scenario: A link already stored as health
- **WHEN** a link with the code `health` exists in the database and a client fetches `/health`
- **THEN** the response is 200 with `{"status":"ok","links":<n>}` where `<n>` includes that link, and it is not a redirect to that link's destination
