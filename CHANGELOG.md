# Changelog

All notable changes to the Perfect Collection Transaction Database application are documented below.

## [1.1.0] - 2026-06-07

### Added
- **Monthly Chart Button**: Added a visible, styled button (`#mbtn` - emerald green) to the bottom-left of the homepage to navigate to `/users/month`.
- **Cash/Card Toggle Button**: Added a visible, styled button (`#ttb` - violet purple) to the bottom-left of the homepage to toggle between Cash and Card payment modes.
- **Phone Column in Ledger**: Added a dedicated `Phone` column to the Daily Sales table in `user_profile.ejs` to display the customer phone number stored in MongoDB.
- **Node.js Environment Versioning**: Added the `"engines"` field in `package.json` to lock the runtime environment to Node.js `20.x`, resolving deployment issues on Render.com.

### Changed
- **digits-only Phone Constraint**: Restricted the Customer Phone input to allow numeric digits `0-9` only. Any letters, spaces, or symbols (including `+`) are stripped instantly as they are typed. The input length is capped at a maximum of 10 digits.
- **Sequential Validation & Cursor Focus**:
  - Pressing Enter on the Phone input checks for a valid 10-digit number. If invalid, it alerts the user and keeps focus on the phone input.
  - Pressing Enter on the Customer Name input checks that it is not empty. If empty, it alerts the user and keeps focus on the name input.
  - Pressing Enter on a valid Customer Name input correctly moves focus to the Item Number input.
- **Cart Retention on Validation Errors**: Removed `window.location.reload()` calls from validation failure paths. This prevents the operator from losing their entered transaction items when correcting typing mistakes.
- **Shopname Decoupling**: Decoupled the codebase from `localStorage` browser identification logic, setting a robust static fallback configuration on the server.

### Removed
- **Hotkey Listeners**: Removed keyboard listeners for `m`/`M` (navigating to monthly sales) and `c`/`C` (toggling cash/card mode) to prevent keyboard conflict issues. The `Shift` key listener for printing/saving bills was preserved.
- **Input Disabling on Enter**: Removed the logic that disabled the Customer Name field on Enter keypress so that typos can be corrected easily.

### Security
- **Untracked `.env` file**: Removed `.env` from the Git index using `git rm --cached` and ignored it in `.gitignore` to prevent database credentials and Meta API secret tokens from being exposed to the public GitHub repository.
