# Maestro E2E Tests for ROTUS

P0 (critical) and P1 (important) mobile test flows.

## Setup

Install Maestro CLI:
```bash
curl -Ls https://get.maestro.dev | bash
```

## Running Tests

```bash
# Single flow
maestro test flows/p0/00-quotes-load.yml

# All P0 tests
maestro test flows/p0/

# All tests
maestro test flows/
```

## Test ID Requirements

Ensure the webapp includes these `testID` attributes:

- `quotes-container` – main quote list
- `quote-card` – individual quote cards (class)
- `random-quote-btn` – random button
- `quote-modal` – modal dialog
- `modal-quote` – quote text in modal
- `close-modal-btn` – close button
- `search-input` – search input field
- `platform-filter` – platform dropdown
- `category-filter` – category dropdown
- `stats` – stats container

## CI Integration

Add to GitHub Actions:
```yaml
- name: Run Maestro tests
  run: |
    curl -Ls https://get.maestro.dev | bash
    maestro test flows/
```
