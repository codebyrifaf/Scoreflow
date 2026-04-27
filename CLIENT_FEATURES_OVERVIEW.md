# ScoreFlow - Current Feature Overview

This document explains what has already been built in ScoreFlow in simple language.

## 1) What Is Working Right Now

### Account Access
- New users can create an account with name, email, and password.
- Users can log in with their email and password.
- Users can log out securely.
- After signup, users are guided to a **"check your email"** step.

### Smart Login Experience
- If someone tries to open a private page without logging in, they are sent to the login page.
- After login, they are sent back to the page they originally wanted.

### Role-Based Access (Who Can See What)
- The system now checks user role before allowing entry to platform admin pages.
- If someone is not a platform admin, they are automatically sent to the regular dashboard.

### Platform Admin Area (Structure Ready)
- A dedicated platform section is now available at `/platform`.
- It includes a full layout shell with:
  - top header
  - left navigation menu
  - main content area
- Initial pages are in place:
  - Overview
  - Agencies
  - Platform Analytics
  - System Status

> Note: these pages are currently placeholders ("Coming soon") and are ready for real content in the next sub-steps.

## 2) Security Foundations Already Implemented

- Session handling and private-route protection are active.
- Admin-only pages are protected by a second check at layout level.
- Sign-in redirects are protected against unsafe redirect links.
- Core user data is tied to authenticated identity in the database.

## 3) Product Data Model Is Already Prepared

The backend is already structured to support all major ScoreFlow entities, including:
- agencies
- users and roles
- businesses
- locations
- NFC tags
- reviews and sentiment
- subscriptions
- audit logs

This means core business data can be stored in a scalable way as feature pages are added.

## 4) Partially Ready / In Progress

- Forgot password **request** flow is present (user can request reset email).
- The final password reset page is not yet released.
- Public marketing/landing experience is not finalized yet.

## 5) What This Means for You (Business View)

ScoreFlow already has the critical building blocks for:
- secure account access,
- role-based platform control,
- and a ready admin area structure.

The next steps are mainly filling real business content and workflows into the pages that are now scaffolded and protected.