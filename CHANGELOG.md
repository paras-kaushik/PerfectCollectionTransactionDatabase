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
- **Frictionless Sequential Focus**: Pressing Enter on the Phone input validates the 10-digit requirement, and then jumps the cursor **directly** to the **Enter Item Number** field.
- **Cart Retention on Validation Errors**: Removed `window.location.reload()` calls from validation failure paths. This prevents the operator from losing their entered transaction items when correcting typing mistakes.
- **Shopname Decoupling**: Decoupled the codebase from `localStorage` browser identification logic, setting a robust static fallback configuration on the server.

### Removed
- **Customer Name Input**: Completely removed the Customer Name (`#wild-input`) input field and its validations to speed up data entry for the shopkeeper. Defaulted transaction payload customer name to `"Customer"`.
- **Hotkey Listeners**: Removed keyboard listeners for `m`/`M` (navigating to monthly sales) and `c`/`C` (toggling cash/card mode) to prevent keyboard conflict issues. The `Shift` key listener for printing/saving bills was preserved.

### Security
- **Untracked `.env` file**: Removed `.env` from the Git index using `git rm --cached` and ignored it in `.gitignore` to prevent database credentials and Meta API secret tokens from being exposed to the public GitHub repository.
