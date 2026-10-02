# Spec Delta

## Purpose

Gives a monitoring system one cheap address to poll that shows hop is running and can read its database, and how many links it holds.

## ADDED Requirements

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
