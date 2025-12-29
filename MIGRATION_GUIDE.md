# Database Migration Guide

This guide explains how to migrate your MongoDB database from one connection string to another using the provided migration script.

## Overview

The migration script (`src/scripts/migrate-database.ts`) will:
- Connect to both source and destination databases
- Copy all collections from source to destination
- Preserve indexes and data integrity
- Verify the migration was successful
- Provide a detailed summary report

## Prerequisites

- Node.js and npm installed
- Access to both source and destination MongoDB instances
- Connection strings for both databases
- Sufficient permissions to read from source and write to destination

## Usage Methods

### Method 1: Using Environment Variables (Recommended)

1. Create a `.env.migration` file or add to your existing `.env`:

```bash
SOURCE_MONGO_URI=mongodb+srv://user:password@source-cluster.mongodb.net/database?appName=App
DESTINATION_MONGO_URI=mongodb+srv://user:password@destination-cluster.mongodb.net/database?appName=App
```

2. Run the migration:

```bash
npm run migrate:db
```

### Method 2: Using Command Line Arguments

Run the migration by passing connection strings as arguments:

```bash
npm run migrate:db -- "mongodb+srv://user:pass@source.mongodb.net/db" "mongodb+srv://user:pass@dest.mongodb.net/db"
```

## Important Notes

### Before Migration

1. **Backup Your Data**: Always create a backup of both databases before migration
2. **Test First**: Run a test migration with a small dataset or non-production database
3. **Check Permissions**: Ensure you have read access to source and write access to destination
4. **Network Access**: Verify your IP is whitelisted on both MongoDB clusters (if using MongoDB Atlas)
5. **Review Connection Strings**: Double-check both connection strings are correct

### During Migration

1. The script will wait 5 seconds before starting - this gives you time to cancel (Ctrl+C) if needed
2. Monitor the console output for any errors
3. Large databases may take significant time to migrate
4. The script will show progress for each collection

### After Migration

1. Review the migration summary for any failed collections
2. Verify data integrity in the destination database
3. Update your application's `.env` file with the new connection string
4. Test your application with the new database

## What Gets Migrated

- All documents in all collections
- Collection indexes (custom indexes, not the default `_id` index)
- Collection structure

## What Doesn't Get Migrated

- Database users and permissions
- Database-level configuration
- System collections (these are excluded by default)

## Migration Output

The script provides detailed output:

```
📦 Migrating collection: users
   Source documents: 1523
   ✅ Migrated 1523 documents
   📑 Copying 3 indexes...
      ✅ Index created: email_1
      ✅ Index created: businessId_1_role_1
   ✅ Verification passed: 1523 documents in destination

================================================================================
📊 MIGRATION SUMMARY
================================================================================

Collections processed: 10
✅ Successful: 10
❌ Failed: 0
📄 Total documents migrated: 15234
```

## Troubleshooting

### Error: "MONGO_URI environment variable is not defined"

Make sure your environment variables are set correctly. Use `.env.migration` or pass connection strings as arguments.

### Error: "Authentication failed"

- Verify your database username and password
- Check if your IP address is whitelisted
- Ensure the database user has proper permissions

### Error: "Connection timeout"

- Check your network connection
- Verify the MongoDB instance is running
- Check firewall settings

### Error: "Insufficient permissions"

- Source database: Needs `read` permission
- Destination database: Needs `readWrite` permission

### Collections show count mismatch

- Check if migration was interrupted
- Verify network stability
- Re-run the migration for specific collections

## Safety Features

1. **5-Second Delay**: Gives you time to cancel before migration starts
2. **Masked Credentials**: Connection strings in logs have credentials masked
3. **Verification Step**: Automatically verifies document counts after migration
4. **Detailed Logging**: Comprehensive logs for troubleshooting
5. **Error Handling**: Continues migrating other collections even if one fails

## Example Migration Workflow

```bash
# 1. Backup your databases (MongoDB Atlas example)
# Use MongoDB Atlas UI to create a snapshot or export

# 2. Set environment variables
export SOURCE_MONGO_URI="mongodb+srv://wadii:oldpass@old-cluster.mongodb.net/wadii-db"
export DESTINATION_MONGO_URI="mongodb+srv://wadii:newpass@new-cluster.mongodb.net/wadii-db"

# 3. Run the migration
npm run migrate:db

# 4. Wait for completion and review summary

# 5. Test the new database
# Update .env to use DESTINATION_MONGO_URI
# Run your application and verify everything works

# 6. Update production when ready
# Update .env.production with new connection string
```

## Rollback

If you need to rollback:

1. If you have a backup, restore it to the destination database
2. If migration is in progress, press Ctrl+C to cancel
3. The source database is never modified, so it remains intact

## Post-Migration Checklist

- [ ] All collections migrated successfully (check summary)
- [ ] Document counts match between source and destination
- [ ] Application connects to new database
- [ ] Application functionality works correctly
- [ ] Performance is acceptable
- [ ] Update `.env.production` with new connection string
- [ ] Update any external services or scripts using the old connection string
- [ ] Monitor application logs for any database-related errors

## Advanced Usage

### Migrate Specific Collections Only

Modify the script to include only specific collections:

```typescript
// In migrate-database.ts, modify the migrateAll call:
await migration.migrateAll(['system.views', 'temp_collection']); // Exclude these
```

### Custom Verification

You can add custom verification logic after migration by modifying the `verifyMigration` method.

## Support

If you encounter issues not covered in this guide:
1. Check MongoDB logs on both source and destination
2. Review the detailed error messages in the migration output
3. Ensure your MongoDB driver version is compatible
4. Test connectivity to both databases independently

## Security Best Practices

1. Never commit connection strings to version control
2. Use environment variables for sensitive data
3. Rotate database credentials after migration
4. Use MongoDB Atlas IP whitelist for additional security
5. Enable MongoDB authentication and use strong passwords
6. Use SSL/TLS for connections (included in `mongodb+srv://` protocol)
