# 🥏 DiscMaster Table & API Plan

## Overview

This document tracks the plan for building the DiscMaster (disc catalog) feature for the DiscBaboons app.

---

## 1. DiscMaster Table (Database)

- **Table:** `DiscMaster`
- **Fields:**
  - `id` (UUID, PK)
  - `brand` (String)
  - `model` (String)
  - `plasticType` (String)
  - `speed` (Int)
  - `glide` (Int)
  - `turn` (Int)
  - `fade` (Int)
  - `approved` (Boolean, default: false)
  - `addedById` (UUID, FK to User)
  - `description` (String, optional)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

---

## 2. Endpoints

- **POST `/api/discs/master`**
  - Add new disc to master catalog (pending approval)
  - Requires authentication

- **GET `/api/discs/master`**
  - List all approved discs (optionally filter by approval status for admins)

- **POST `/api/discs/master/:id/approve`**
  - Approve a disc (admin only)

---

## 3. Admin Approval

- Add `isAdmin` boolean to `User` model (or use a role/enum)
- Only admin users can approve or edit discs in the master catalog

---

## 4. Implementation Steps

1. **Add DiscMaster model to Prisma schema**
2. **Create migration and apply to database**
3. **Implement endpoints in Express**
4. **Add admin check middleware**
5. **Write integration tests**
6. **Document API usage**

---

## 5. Notes

- All new discs are created with `approved: false`
- Only admins can approve or edit discs
- Users can only add new discs (not approve)
- Consider logging all approval actions for audit trail

---

## 6. Next Steps

- [ ] Design DiscMaster Prisma model
- [ ] Write migration SQL
- [ ] Implement Express routes
- [ ] Add admin middleware
- [ ] Test with Postman & integration tests

---

*Last updated: