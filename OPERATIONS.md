# Phase 12 — Store Operations, Monitoring & Maintenance

This document outlines the standard operating procedures for the Apna Mart POS running in its online production environment. **Normal POS operation currently requires an active internet connection.**

---

## 1. Daily Check Checklist
Every morning before the first customer arrives, the primary cashier or store manager should perform these checks:
- [ ] **Internet & POS Available:** Ensure the store computer is connected to Wi-Fi and the POS URL loads.
- [ ] **Login:** Verify the cashier can log into their account.
- [ ] **Barcode Scanner:** Scan one product in the POS to ensure it adds to the cart automatically.
- [ ] **Thermal Printer:** Ensure the printer is turned on, has paper, and prints a test receipt clearly.
- [ ] **Product Search:** Type a product name in the POS to verify the catalog loads quickly.
- [ ] **Payment QR:** Verify the physical Payment QR code is on the counter and the digital one displays on the receipt screen.
- [ ] **System Health:** Ensure there are no red error banners and the "Backup Status" under Settings shows successful automated backups.

---

## 2. Daily Backup Strategy
Because the POS relies on a Managed Cloud Database (Render/Supabase/Neon), manual file downloads are disabled to prevent data corruption.
- **Frequency:** Automated Daily Snapshots (configured via your Database Provider dashboard).
- **Retention:** 7 Days of Point-in-Time Recovery (PITR) + Weekly full snapshots retained for 30 days.
- **Restore Procedure:** In the event of catastrophic data loss, the Store Admin must log into the Database Provider console (e.g., Neon.tech dashboard) and click "Restore to Point in Time".
- **Backup Failure Procedure:** If the DB provider emails an alert about a backup failure, immediately contact technical support. Do not attempt to run manual pg_dumps during peak store hours.

---

## 3. System Monitoring
The application is monitored for the following key metrics (Note: No sensitive customer data, PII, or raw passwords are logged):
- **Backend Availability:** Monitored via HTTP health checks to the `/health` API.
- **Database Availability:** Monitored via connection pool stats in the Prisma client.
- **API Errors:** Unexpected 500 errors are captured in the server console logs on Render.
- **Security Events:** Failed login attempts, unauthorized access, and stock tampering are recorded in the in-app Audit Logs.
- **Transaction Failures:** Order creation failures, inventory shortage errors, and payment inconsistencies are flagged in the Audit Logs.

---

## 4. Incident Procedures (Emergency Playbook)
Because this is an ONLINE-FIRST POS, **the internet is required for operation.** Do not pretend offline functionality exists.

*   **Internet Fails / Store Offline:**
    1. Cashiers must immediately switch their mobile phones to act as Wi-Fi Hotspots and connect the store computer to the hotspot.
    2. If cellular networks are also down, the store must halt digital operations and process sales manually via a written ledger until connectivity is restored.
*   **Backend or Database Unavailable:**
    1. If the website loads but shows a red "Server Disconnected" error, the Admin must check the Render and Neon dashboards.
    2. If Render is down, wait for their status page to update. Do not attempt to reset the database.
*   **Printer Fails:**
    1. Turn the printer off and on. Check paper roll. Check USB cable.
    2. If unresolvable, continue billing customers and offer to text/email them their receipt via screenshot, or ask them to take a photo of the screen.
*   **Scanner Fails:**
    1. Unplug the USB scanner and plug it back in. Ensure cursor is in the POS search bar.
    2. If unresolvable, cashiers must manually type the product name or SKU into the POS search bar.
*   **Payment App (UPI) Unavailable:**
    1. If the customer's UPI app is down, ask for Cash or an alternative card. The POS will record whatever payment method is successfully completed.

---

## 5. Data Integrity
The system actively prevents silent data modification. The `/api/integrity/check` endpoint runs periodically to scan for:
- Negative stock variants
- Duplicate SKUs or Barcodes (2D Codes)
- Invalid/Empty orders
- Completed orders with missing payment records
- Inventory inconsistencies

If integrity issues are found, they are reported in the Admin Settings dashboard and must be reconciled manually via the Stock Adjustment tools.

---

## 6. Safe Update Policy
Never update production blindly during operating hours. Every software update must follow this strict pipeline:
1. **BACKUP:** Verify a recent automated cloud snapshot exists.
2. **TEST:** Run all unit and integration tests locally.
3. **DEPLOY:** Push code to GitHub and trigger Render deployment.
4. **MIGRATE:** Allow Prisma to run `npx prisma migrate deploy` safely against the schema.
5. **SMOKE TEST:** Add a test product to the cart, checkout, and verify the receipt prints correctly.
6. **MONITOR:** Watch the Render logs for 15 minutes post-deployment for 500 errors.

---

## 7. Future Architectural Roadmap: Offline Mode
Offline synchronization is **NOT** currently implemented. It is planned as a future architectural project to allow the store to survive internet outages without relying on mobile hotspots.

*Potential Future Architecture:*
1. **Cloud PostgreSQL (Master)** ? *Bi-directional Sync* ? **Local Store Database (Replica)**
2. The Local POS will talk exclusively to the Local Store Database.
3. A background synchronization engine (e.g., ElectricSQL or CRDTs) will handle reconciliation when the internet reconnects.
