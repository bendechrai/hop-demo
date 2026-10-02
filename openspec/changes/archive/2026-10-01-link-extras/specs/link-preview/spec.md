# Spec Delta

## Purpose

Lets people see where a short code leads, and how it is doing, without following it and without adding a click.

## ADDED Requirements

### Requirement: A plus sign after a code shows a preview page
`GET /<code>+` SHALL respond 200 with a plain HTML page showing the destination URL, the created date, the click count and the expiry. A link with no expiry SHALL show "Never" as its expiry. The page SHALL NOT redirect.

#### Scenario: A live link
- **WHEN** a client fetches `/<code>+` for a link that has not expired
- **THEN** the page shows the destination URL, the created date, the click count and the expiry, and the response is not a redirect

#### Scenario: A link with no expiry
- **WHEN** a client fetches `/<code>+` for a link that never expires
- **THEN** the expiry is shown as "Never"

### Requirement: Previewing never counts a click
Fetching `/<code>+` SHALL NOT change the click count of the link.

#### Scenario: Preview twice
- **WHEN** a client fetches `/<code>+` twice for a link with 0 clicks
- **THEN** the link still has 0 clicks, and the page showed 0 both times

### Requirement: The preview shows expired links as expired
`GET /<code>+` for an expired link SHALL respond 200 and mark the expiry as expired. It SHALL NOT return the 410 page that following the code returns.

#### Scenario: An expired link
- **WHEN** a client fetches `/<code>+` for an expired link
- **THEN** the response is 200 and the page marks the expiry as expired

### Requirement: The preview of an unknown code is not found
`GET /<code>+` for a code that does not exist SHALL respond 404.

#### Scenario: Unknown code
- **WHEN** a client fetches `/nope123+` and no such link exists
- **THEN** the response is 404
