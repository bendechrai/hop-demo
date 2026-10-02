# custom-codes Specification

## Purpose
Decides which custom short codes a person may choose when creating a link, so that every code that is accepted can actually redirect.

## Requirements

### Requirement: Reserved words cannot be custom codes
Creating a link with a custom code that equals a reserved word SHALL respond 400 with a message saying the code is reserved, and SHALL NOT create a link. The reserved words SHALL be every first path segment the app serves itself: at least `api`, `stats`, `health`, and the name without extension of every file the app serves from `public/`. The comparison SHALL ignore case.

#### Scenario: The stats page name
- **WHEN** a client posts a new link with the custom code `stats`
- **THEN** the response is 400 with a message saying the code is reserved, and no link with that code exists

#### Scenario: The health endpoint name
- **WHEN** a client posts a new link with the custom code `health`
- **THEN** the response is 400 with a message saying the code is reserved, and no link with that code exists

#### Scenario: A reserved word in another case
- **WHEN** a client posts a new link with the custom code `API`
- **THEN** the response is 400 with a message saying the code is reserved

#### Scenario: The stats page still shows
- **WHEN** a client asks to create the code `stats` and then fetches `/stats`
- **THEN** the creation is refused and `/stats` shows the stats page

#### Scenario: An ordinary code
- **WHEN** a client posts a new link with the custom code `my-stats`
- **THEN** the link is created with that code

### Requirement: A custom code cannot end in a plus sign
Creating a link with a custom code that ends in `+` SHALL respond 400 with a message saying a code cannot end in `+` because that address shows the link's preview, and SHALL NOT create a link.

#### Scenario: A trailing plus
- **WHEN** a client posts a new link with the custom code `abc+`
- **THEN** the response is 400 with a message that names the trailing `+`, and no link is created
