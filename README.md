# Auction Label Printer

A simple web application for managing silent auction checkout and printing winner labels for Dymo label printers.

## Features

- **Attendee Management**: Upload attendees via CSV or add them manually
- **Auction Packages**: Upload packages via CSV or add them manually
- **Label Printing**: Generate and print labels sized for Dymo printers (2¼" × 1¼")
- **Progress Tracking**: Visual indicators show which attendees and packages have been processed

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python app.py
   ```

3. Open http://localhost:5001 in your browser

## Using with ngrok

To access from other devices on your network or the internet:

```bash
ngrok http 5000
```

## CSV Format

### Attendees CSV
```
first name,last name,table number
John,Doe,5
Jane,Smith,12
```

### Packages CSV
```
package name
Wine Basket
Spa Day Package
Golf Outing
```

## Label Printing

Labels are optimized for Dymo label printers with label size 2¼" × 1¼". Make sure your printer is configured as the default printer, or select it in the print dialog.

## Keyboard Shortcuts

- `Escape` - Clear current selection
- `Cmd/Ctrl + P` - Print label (when attendee and packages are selected)
