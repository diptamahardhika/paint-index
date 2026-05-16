# Google Authentication Migration Plan

## Primary Goal
Add Google authentication without destroying or overwriting existing browser-local inventories.

## Current State
The application currently stores inventory data in:

```js
const INVENTORY_STORAGE_KEY = "paint-index.inventory.v1";
```

inside browser localStorage.

This means existing users already have persistent inventories locally.

## Migration-Safe Strategy

Do NOT replace localStorage immediately after login.

Instead:

1. Load local inventory first.
2. Authenticate user.
3. Check whether remote cloud inventory exists.
4. Merge inventories safely.
5. Upload merged result.
6. Keep local cache enabled.

## Recommended Stack

### Authentication
- Firebase Authentication
- Google OAuth Provider

### Cloud Storage
- Firestore

Document structure:

```text
users/{uid}/inventory/default
```

## Merge Rules

### First Login
If remote inventory does not exist:
- Upload local inventory directly.
- Preserve all local paints.

### Existing Remote Inventory
If both local and remote inventories exist:
- Merge paint items by key.
- Prefer latest updatedAt timestamp.
- Never delete local entries automatically.

## Safe Merge Example

```js
function mergeInventory(localInventory, remoteInventory) {
  const merged = structuredClone(remoteInventory);

  for (const [key, localItem] of Object.entries(localInventory.items || {})) {
    const remoteItem = remoteInventory.items?.[key];

    if (!remoteItem) {
      merged.items[key] = localItem;
      continue;
    }

    const localUpdated = new Date(localItem.updatedAt || 0).getTime();
    const remoteUpdated = new Date(remoteItem.updatedAt || 0).getTime();

    merged.items[key] = localUpdated >= remoteUpdated
      ? localItem
      : remoteItem;
  }

  return merged;
}
```

## Required UI Changes

### Add Authentication Area
Inventory tab should contain:

- Sign in with Google button
- Signed-in account email/avatar
- Sync status
- Sign out button

## Local Cache Policy
Always keep localStorage enabled.

Reason:
- Faster startup
- Offline usability
- Recovery fallback
- Prevent accidental data loss

## Sync Flow

```text
App Start
  ↓
Load local inventory
  ↓
Check auth session
  ↓
If signed in:
  ↓
Fetch cloud inventory
  ↓
Merge local + remote
  ↓
Render merged inventory
  ↓
Persist to localStorage
  ↓
Upload merged state to Firestore
```

## Important Constraint
The application is currently a fully static frontend.

Firebase is appropriate because:
- No custom backend required
- Works with GitHub Pages/static hosting
- OAuth handled by Firebase
- Firestore provides realtime persistence

## Suggested New Files

```text
js/auth.js
js/cloud-sync.js
js/firebase-config.js
```

## Recommended Refactor
Move inventory state logic from `app.js` into:

```text
js/inventory-store.js
```

This reduces risk before introducing cloud synchronization.

## Risk Areas

### Highest Risk
- Overwriting local inventories during first login
- Race conditions between local save and cloud sync
- Empty cloud state replacing populated local state

### Required Protection
Cloud inventory must NEVER overwrite a populated local inventory automatically.

## Recommended Rollout

### Phase 1
- Add Google sign-in only
- Keep local inventory authoritative

### Phase 2
- Add Firestore sync
- Enable merge logic

### Phase 3
- Add multi-device synchronization
- Add sync conflict notifications
