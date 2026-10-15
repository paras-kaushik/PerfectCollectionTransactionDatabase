# Implementation Plan: Pre-fill Phone Number to `9971313547`

**Date**: October 15, 2026  
**Goal**: Pre-fill the Customer Phone input on the POS billing screen with the shop owner's phone number `9971313547`, so the operator doesn't need to type it every time (they can still overwrite it for different customers).

---

## 1. Goal

The shop owner currently types `9971313547` (or the store contact `9899258797`) manually for most transactions. By pre-filling the phone input with `9971313547`, the operator can:

- **Skip phone entry entirely** for routine/owner transactions (just press Enter).
- **Overwrite it** by clearing the field and typing a different customer's number when needed.

This is a single-line change in the frontend — no backend modifications required.

---

## 2. Affected Files

- [x] [`views/home.ejs`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/views/home.ejs) — Add `value="9971313547"` to the phone `<input>` element.

**No other files are affected.** The backend ([`controllers/transaction_controller.js`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/controllers/transaction_controller.js)) already reads `x.phoneNumber` from the request body, and the client-side JavaScript ([`assets/js/pdf.js`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/assets/js/pdf.js)) reads the phone input's `.value` at billing time — both work identically whether the value was typed or pre-filled.

---

## 3. Technical Education: How HTML `value` Attribute Works

### The Current Phone Input (Line 60-63 of `home.ejs`)

```html
<input type="tel" id="phone-input" class="phone-field" name="phone-input"
  placeholder="Customer Phone" autofocus required maxlength="10"
  style="height: 5rem; margin: 1rem; font-size: 1.5rem; border: 3px solid green; background: #e8f5e9;"
  onkeyup="phoneFieldEnter(event)" />
```

#### Key Attributes Explained:

| Attribute | Current Value | Purpose |
|---|---|---|
| `type="tel"` | `tel` | Tells browsers to show a telephone-optimized keyboard on mobile devices. Unlike `type="number"`, it allows leading zeros and doesn't add spinners. |
| `placeholder="Customer Phone"` | `Customer Phone` | Grey hint text shown **only when the field is empty**. Disappears the moment the user types or when a `value` is present. |
| `autofocus` | *(boolean)* | Automatically places the cursor in this field when the page loads. |
| `maxlength="10"` | `10` | Prevents typing more than 10 characters. |
| `value` | **Not set** | The initial text content of the input. **This is what we're adding.** |

### What Adding `value="9971313547"` Does:

1. **On page load**: The input renders with `9971313547` already visible (replacing the grey placeholder text).
2. **Cursor position**: Because `autofocus` is set, the cursor lands in the field — the operator can immediately press Enter to accept the pre-filled number, or select-all and type a different number.
3. **Validation**: The existing `phoneFieldEnter()` function in [`pdf.js:305-316`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/assets/js/pdf.js#L305-L316) checks `phoneVal.length !== 10`. Since `"9971313547"` is exactly 10 digits, it passes validation immediately.
4. **Billing flow**: At billing time ([`pdf.js:187`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/assets/js/pdf.js#L187)), `document.getElementById("phone-input").value.trim()` reads whatever is currently in the field — whether pre-filled or overwritten — so the backend receives the correct number.
5. **Digits-only sanitizer**: The `input` event listener at [`pdf.js:299-301`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/assets/js/pdf.js#L299-L301) strips non-digit characters on keyup. Since `"9971313547"` is pure digits, the sanitizer has no effect on the pre-filled value.

---

## 4. Proposed Concrete Code Change

### [`views/home.ejs`](file:///Users/paraskaushik/Developer/PerfectCollectionTransactionDatabase/views/home.ejs) — Line 60

**Before:**
```html
<input type="tel" id="phone-input" class="phone-field" name="phone-input"
  placeholder="Customer Phone" autofocus required maxlength="10"
```

**After:**
```html
<input type="tel" id="phone-input" class="phone-field" name="phone-input"
  placeholder="Customer Phone" value="9971313547" autofocus required maxlength="10"
```

This is a single attribute addition (`value="9971313547"`) on the existing `<input>` tag. Nothing else changes.

---

## 5. Verification Plan

1. **The app is already running locally** at [http://localhost:8000](http://localhost:8000).
2. After the change is saved, reload the page in the browser.
3. **Verify**: The phone input field should show `9971313547` pre-filled (not greyed-out placeholder text).
4. **Verify Enter flow**: Press Enter — focus should jump to the Item Number field without an alert.
5. **Verify overwrite**: Clear the field, type a different 10-digit number, press Enter — should work normally.
6. **Verify billing**: Add an item, press Shift (bill shortcut) — the transaction should save with the pre-filled (or overwritten) phone number.
