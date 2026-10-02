# health-check Specification

## Purpose
Gives a monitoring system one cheap address to poll that shows hop is running and can read its database, and how many links it holds.

## Requirements

### Requirement: The health endpoint reports status and link count
`GET /health` SHALL respond 200 with content type `application/json` and the body `{"status":"ok","links":<n>}`, where `<n>` is the number of links stored, expired ones included. It SHALL NOT count a click on any link.

#### Scenario: An empty database
- **WHEN** a client fetches `/health` and no links exist
- **THEN** the response is 200 with `{"status":"ok","links":0}`

#### Scenario: Some links
- **WHEN** three links exist, one of them expired, and a client fetches `/health`
- **THEN** the response is 200 with `{"status":"ok","links":3}`

#### Scenario: Health is not a short code
- **WHEN** a client fetches `/health`
- **THEN** it gets the health response, not a redirect or a 404 for an unknown code

### Requirement: An old link with the code health does not hide the endpoint
A link stored under the code `health` before that code was reserved SHALL NOT change what `GET /health` answers. The endpoint SHALL still respond 200 with the health body, and that link SHALL count in `links` like any other.

#### Scenario: A link already stored as health
- **WHEN** a link with the code `health` exists in the database and a client fetches `/health`
- **THEN** the response is 200 with `{"status":"ok","links":<n>}` where `<n>` includes that link, and it is not a redirect to that link's destination
