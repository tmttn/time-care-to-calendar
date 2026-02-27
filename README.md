# time-care-to-calendar

Chrome extension that exports your [Time Care](https://timecare.com/) schedule as an `.ics` calendar file.

## Features

- Scrapes your schedule directly from the Time Care web app
- Shows a preview of all shifts before downloading
- Exports as `.ics` — works with Google Calendar, Apple Calendar, Outlook, etc.
- Configurable shift codes with readable names
- Auto-detects new codes and adds them to the config
- Deterministic event UIDs prevent duplicates on re-import
- Brussels timezone support (`Europe/Brussels`)

## Install

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

## How to use

1. Navigate to your Time Care schedule page
2. Click the extension icon in the toolbar
3. Review the shift overview
4. Click **Download** to save the `.ics` file
5. Import the file into your calendar app

## Configuration

Right-click the extension icon → **Options**, or go to `chrome://extensions` → Time Care to Calendar → **Details** → **Extension options**.

From there you can:

- **Add codes** with a readable name and set them to export
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

## Project structure

```
time-care-to-calendar/
├── manifest.json     # Chrome extension manifest (V3)
├── popup.html        # Extension popup UI
├── popup.js          # Popup logic, config filtering, ICS generation
├── content.js        # Content script that scrapes the Time Care table
├── config.js         # Shared config defaults and storage helpers
├── options.html      # Options page UI
├── options.js        # Options page logic
└── icon.png          # Extension icon
```

## License

MIT — Thomas Metten
