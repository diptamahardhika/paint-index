# Google Authentication Migration Plan

## Primary Goal
Add Google authentication with cloud-persistent inventories using a simple and maintainable architecture.

## Architectural Decision
Cloud inventory becomes the authoritative source.

This intentionally replaces local browser inventory after authentication.

Reason:
- Simpler architecture
- Lower maintenance burden
- Less synchronization complexity
- Easier multi-device support
- Reduced edge cases
- Safer long-term scaling

## Current State
The application currently stores inventory data in browser localStorage:

```js
const INVENTORY_STORAGE_KEY = "paint-index.inventory.v1";
```

## New Model

```text
Anonymous user
→ local inventory only

Authenticated user
→ Firestore inventory authoritative
→ localStorage used as cache only
```

## User Experience Strategy

### Anonymous Users
Anonymous users can still:
- Browse paints
- Create local inventory
- Export inventory

But inventory remains device-local only.

### Authentication Warning
Before Google sign-in:

```text
Signing in will replace your current local inventory
with your Google account inventory.

Export your inventory first if needed.
```

Recommended buttons:
- Export & Continue
- Continue
- Cancel

This intentionally encourages users to authenticate early.

## Recommended Stack

### Authentication
- Firebase Authentication
- Google OAuth Provider

### Cloud Storage
- Firestore

## Firestore Structure

```text
users/{uid}/inventory/default
```

## Authentication Flow

```text
App Start
  ↓
Load local inventory cache
  ↓
Check Firebase auth session
  ↓
If authenticated:
    Fetch Firestore inventory
    Replace local inventory state
    Save cloud inventory into localStorage cache
  ↓
Render app
```

## First Login Behavior

### No Cloud Inventory Exists
Create default empty inventory in Firestore.

### Cloud Inventory Exists
Replace local inventory with cloud inventory.

No merge operation occurs.

## Local Cache Policy
localStorage remains enabled for:
- Faster startup
- Reduced Firestore reads
- Temporary offline cache

But cloud state remains authoritative.

## Required UI Changes

Inventory tab should contain:

- Google sign-in button
- User avatar/email
- Cloud sync status
- Sign out button
- Local inventory warning banner for anonymous users

## Recommended New Files

```text
js/auth.js
js/cloud-sync.js
js/firebase-config.js
js/inventory-store.js
```

## Recommended Refactor
Move inventory logic out of `app.js` before implementing authentication.

Current inventory logic is tightly coupled to rendering.

Authentication and sync logic should remain isolated.

## Suggested Inventory Store Responsibilities

### inventory-store.js
- load inventory
- save inventory
- replace inventory
- inventory listeners/subscribers
- local cache handling

### auth.js
- Firebase initialization
- Google login/logout
- auth session listener

### cloud-sync.js
- fetch cloud inventory
- upload inventory
- initialize Firestore inventory

## Important Constraint
The application is currently a fully static frontend.

Firebase is appropriate because:
- No backend required
- Works on GitHub Pages
- Handles OAuth directly
- Firestore supports realtime sync

## Risk Areas

### Primary Risk
User signs in after building large local inventory.

Mitigation:
- Explicit warning dialog
- Export inventory option before login

## Recommended Rollout

### Phase 1
- Add Firebase Auth
- Add Google login/logout UI

### Phase 2
- Add Firestore persistence
- Replace local inventory with cloud inventory after login

### Phase 3
- Add realtime multi-device synchronization
- Add account settings/profile management
