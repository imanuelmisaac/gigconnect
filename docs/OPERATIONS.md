# GigConnect Operational Runbook

This document outlines procedures for production observability, disaster recovery, and incident response for the GigConnect platform.

## 1. Disaster Recovery & Backups

### Firestore Backups
The database should be backed up daily to Google Cloud Storage.
- **Service**: Google Cloud Scheduled Jobs
- **Command**: `gcloud firestore export gs://gigconnect-backups`
- **Retention Policy**: 30 days.

### Restore Procedure
1. Create a staging project.
2. Import the latest backup: `gcloud firestore import gs://gigconnect-backups/[TIMESTAMP]`
3. Verify data integrity before pointing the production DNS.

## 2. Incident Runbooks

### Incident: Payment Not Reflecting
**Symptoms**: Artist pays for Pro but is still on the Free tier.
**Diagnosis**: 
1. Check the `system/config` for active specials that might have changed prices.
2. Verify if the admin received the WhatsApp screenshot.
**Resolution**:
- Admin must manually update the user's `subscriptionTier` in the Admin Dashboard > User Base.

### Incident: Application Limits Erroneously Reached
**Symptoms**: Artist claims they have remaining applications but the UI blocks them.
**Diagnosis**:
1. Check the `artists/{uid}` document `subscriptionTier`.
2. Check the `applications` collection group for the current month.
**Resolution**:
- If a discrepancy exists, the admin can manually increase the tier to override limits or prune accidental double-applications.

### Incident: Sync Failures / 403 Forbidden
**Symptoms**: Users see "Security Rules Error" toasts.
**Diagnosis**:
1. Open Google Cloud Console > Logging.
2. Search for `method: create` or `method: update` failures.
**Resolution**:
- Update `firestore.rules` if a new feature requires more permissive access.
- Deploy rules via `firebase deploy --only firestore:rules`.

## 3. Cost & Performance Monitoring

### Firestore Read Quotas
- Monitor `collectionGroup` queries in the Firebase Console. These are the most expensive operations.
- Ensure `useMemoFirebase` is used for all dynamic Firestore references to prevent infinite render/read loops.

### Alerting Recommendations
Set up Google Cloud Alerts for:
1. **Firestore Usage**: Trigger alert at 80% of daily free tier quota.
2. **Crash Rate**: Alert if global error catch rate exceeds 1% of sessions.
3. **Admin Actions**: Log and alert on all `system/config` changes.

## 4. Rollback Plan
- **Application**: Revert the last Git commit and redeploy to Firebase App Hosting.
- **Database**: Use the daily export to restore a specific collection if a bulk deletion occurs.
- **Security Rules**: Revert `firestore.rules` to the previous version and deploy immediately.
