# time-care-to-calendar

Chrome extension that exports your [Time Care](https://timecare.com/) schedule as an `.ics` calendar file.

## Features

- Scrapes your schedule directly from the Time Care web app
- Shows a preview of all shifts before downloading
- Exports as `.ics` — works with Google Calendar, Apple Calendar, Outlook, etc.
- Configurable shift codes with readable names and colors
- Auto-detects new codes and adds them to the config as unassigned
- Week filter — select which weeks to include in the export
- Shift stats — see a frequency breakdown per shift type
- Total hours summary
- Night shift support — shifts crossing midnight are handled correctly
- Conflict detection — overlapping shifts are highlighted
- Copy as text — paste your schedule into chat or email
- Auto-detect Time Care pages — badge indicator when on a schedule page
- Keyboard shortcut (`Cmd+Shift+R` / `Ctrl+Shift+R`)
- Deterministic event UIDs prevent duplicates on re-import
- Brussels timezone support (`Europe/Brussels`)

## Install

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## How to use

1. Navigate to your Time Care schedule page
2. Click the extension icon in the toolbar (or press `Cmd+Shift+R`)
3. Toggle weeks on/off to filter the export
4. Review the shift overview, stats, and total hours
5. Click **Download** to save the `.ics` file, or **Kopieer als tekst** to copy to clipboard
6. Import the `.ics` file into your calendar app

## Configuration

Right-click the extension icon → **Options**, or go to `chrome://extensions` → Time Care to Calendar → **Details** → **Extension options**.

From there you can:

- **Add codes** with a readable name, color, and action
- **Skip codes** that are free days or not relevant
- **Review unassigned codes** — new codes found on the page are automatically added here

### Default codes

| Code | Name | Action |
|------|------|--------|
| `L` | Late dienst | Export |
| `LL3` | Dagpost | Export |
| `V` | Vroege dienst | Export |
| `D` | Dagdienst | Export |
| `WD` | Wachtdienst | Export |
| `VOR` | Bijscholing | Export |
| `ZT` | Zorgteam vergadering | Export |
| `VETO` | — | Skip |
| `POTA` | — | Skip |
| `BFU` | — | Skip |

## Deployment

Publishing to the Chrome Web Store is automated via GitHub Actions. Creating a GitHub release triggers the pipeline:

```bash
gh release create v1.5 --title "v1.5" --notes "Description of changes"
```

Requires the following repository secrets:

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_REFRESH_TOKEN`

## Project structure

```
time-care-to-calendar/
├── manifest.json     # Chrome extension manifest (V3)
├── popup.html        # Extension popup UI
├── popup.js          # Popup logic, filtering, stats, ICS generation
├── content.js        # Content script that scrapes the Time Care table
├── config.js         # Shared config defaults and storage helpers
├── options.html      # Options page UI
├── options.js        # Options page logic
├── background.js     # Service worker for Time Care page detection
├── icon.png          # Extension icon
└── .github/
    └── workflows/
        └── publish.yml  # GitHub Actions pipeline for Chrome Web Store
```

## License

MIT — Thomas Metten
