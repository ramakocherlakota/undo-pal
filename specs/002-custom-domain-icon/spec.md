# Feature Specification: Friendly Address & App Icon

**Feature Branch**: `002-custom-domain-icon`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "I'd like to make it easier to navigate to the app. Can you add a Route53 alias from one of my domains (maybe rkocherl.net) mapping /undo-pal to the new application? Also, if there isn't a user-friendly icon attached to the application, let's add one, maybe an icon that shows somebody lifting a weight"

## Overview

Two independent quality-of-life improvements to the existing Daily Workout Randomizer, which is currently reachable only at a long auto-generated hosting endpoint and shows a generic (blank) browser-tab icon:

1. **A memorable web address** on the user's own domain so the app is easy to open and share, instead of typing the long endpoint URL.
2. **A recognizable weightlifting-themed app icon** shown in the browser tab and when the app is saved to a phone home screen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the app from a memorable address (Priority: P1)

The user wants to reach the workout app by typing a short, memorable address on their own domain (e.g. under `rkocherl.net`), rather than the long hosting endpoint, and to share that address easily.

**Why this priority**: This is the headline request ("make it easier to navigate"). A memorable address is what turns the app from "buried behind a long URL" into something the user opens daily without friction.

**Independent Test**: After setup, type the memorable address into a fresh mobile browser and confirm the same live app loads and functions (routine renders, re-roll and persistence work).

**Acceptance Scenarios**:

1. **Given** the memorable address has been configured, **When** the user enters it in a browser, **Then** the current live app loads and behaves identically to the existing endpoint.
2. **Given** the user is on a phone, **When** they enter the memorable address, **Then** the app loads and is fully usable.
3. **Given** the existing hosting endpoint URL, **When** it is used after the change, **Then** it still reaches the app (existing links/bookmarks do not break).
4. **Given** the chosen domain already hosts other services, **When** the new address is configured, **Then** no existing service on that domain is disrupted.

---

### User Story 2 - Recognize the app by its icon (Priority: P2)

The user wants the app to display a clear weightlifting icon (someone lifting a weight) so they can identify its browser tab at a glance and recognize it on their phone home screen.

**Why this priority**: A distinct icon makes the app easy to spot among tabs and home-screen shortcuts, but the app is fully functional without it, so it ranks below the address.

**Independent Test**: Load the app and confirm a weightlifting icon appears in the browser tab; add the app to a phone home screen and confirm the same icon appears on the shortcut.

**Acceptance Scenarios**:

1. **Given** the app is open in a browser, **When** the tab is displayed, **Then** a weightlifting-themed icon appears in the tab (not a blank/default icon).
2. **Given** the user saves the app to their phone home screen, **When** they view the home screen, **Then** the shortcut shows the weightlifting icon.
3. **Given** a crowded row of browser tabs, **When** the user glances at them, **Then** the app's tab is identifiable by its icon at small size.

---

### Edge Cases

- **Domain not controlled / no manageable DNS zone**: If the user does not actually control DNS for the chosen domain, the memorable address cannot be created — surfaced as a dependency/blocker, not a silent failure.
- **Name already in use on the domain**: If the chosen name already has DNS records pointing elsewhere, configuration must not overwrite or disrupt them.
- **Insecure-connection warning**: Because the address is served over plain HTTP (by choice), browsers will show a "Not secure" label. This is expected and accepted for this feature; it must still load and function normally (no blocking error page).
- **Existing endpoint after cutover**: The current hosting endpoint (and the URL already referenced in the project/GitHub) should continue to work, or clearly redirect, so nothing previously shared breaks.
- **Icon legibility**: The icon must stay recognizable at very small sizes (≈16–32px tab favicon) and larger sizes (home-screen ≈180px), and remain visible against both light and dark tab backgrounds.
- **Re-deploys**: If the app is re-deployed later, the memorable address must continue to resolve to the current app without reconfiguration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to open the app by entering a short, memorable address on the user's own domain, instead of the long hosting endpoint.
- **FR-002**: The memorable address MUST resolve to the same live app that is currently deployed (identical content and behavior).
- **FR-003**: The memorable address MUST work from mobile browsers.
- **FR-004**: The memorable address MUST be the subdomain **`undo-pal.rkocherl.net`**, served over plain **HTTP** by pointing that subdomain's DNS at the existing hosting endpoint. (Chosen for simplicity; secure HTTPS access is explicitly **out of scope** for this feature and may be added later.)
- **FR-005**: Configuring the memorable address MUST NOT disrupt any other services already using the chosen domain.
- **FR-006**: The existing hosting endpoint MUST continue to serve the app after the change (existing links must not break), or clearly redirect to the new address.
- **FR-007**: The app MUST display a recognizable weightlifting-themed icon (a person lifting a weight, or an equivalent unmistakable weightlifting glyph) in the browser tab.
- **FR-008**: The same icon MUST appear when the app is saved or pinned to a phone home screen.
- **FR-009**: The icon MUST remain recognizable at small (browser-tab) and large (home-screen) sizes, and be visible on both light and dark tab backgrounds.
- **FR-010**: The icon MUST be an original/neutral graphic, not a third-party brand or copyrighted logo.

### Key Entities *(include if feature involves data)*

- **Memorable Address**: The user-facing web address (on the user's domain) that maps to the deployed app. Attributes: the address string the user types, the target it points to (the live app), and coexistence with other records on the domain.
- **App Icon**: The visual mark identifying the app in browser tabs and home-screen shortcuts. Attributes: weightlifting theme, multiple size variants (tab-sized through home-screen-sized), legibility on light/dark backgrounds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once configured, a user can reach the app by typing the memorable address into a browser and see the working app within a few seconds, 100% of the time.
- **SC-002**: The memorable address is short and easy to type on a phone — a single memorable name on the user's domain (roughly 25 characters or fewer), with no long random suffixes.
- **SC-003**: The app displays the weightlifting icon in the browser tab within 1 second of loading, and the identical icon appears on a phone home-screen shortcut.
- **SC-004**: A user can pick the app's tab out of a row of open tabs by its icon at ≈16–32px.
- **SC-005**: After the change, previously shared links to the app (the existing hosting endpoint) still reach the app — zero broken existing links.
- **SC-006**: The memorable address (`undo-pal.rkocherl.net`) is reachable over HTTP and loads the working app. A browser "Not secure" label is expected and accepted; HTTPS is out of scope for this feature.

## Assumptions

- The user owns and controls a domain (the request suggests `rkocherl.net`) whose DNS can be managed to add the new address. To be confirmed during planning by checking the available hosted zones.
- The app's content and hosting remain unchanged; this feature only adds a memorable address in front of the existing deployment and an icon within the app.
- "Make it easier to navigate" means a memorable, human-typable address — not a change to the app's internal navigation or UI flow.
- The icon will be an original, simple weightlifting glyph (e.g., a figure pressing a barbell overhead, or a dumbbell) designed to read clearly at small sizes; the user can refine the exact artwork later.
- The user has chosen plain **HTTP** for the memorable address (simplest setup); HTTPS/certificate provisioning is explicitly out of scope for this feature and can be added later (e.g., by placing a CDN in front) if desired.
- The memorable address is expected to keep pointing at the current app across future re-deploys without manual reconfiguration.
- A single user/owner; no authentication or multi-user concerns are introduced by this feature.

## Dependencies

- Control of the DNS zone for `rkocherl.net` (ability to add a record for the `undo-pal` subdomain). To be confirmed in planning by checking the available hosted zones.
- The existing deployed app remains available as the target of the memorable address.
- No certificate is required for this feature (HTTP-only by choice).
