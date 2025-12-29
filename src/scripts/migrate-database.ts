import mongoose, { Connection } from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationStats {
  collectionName: string;
  sourceCount: number;
  destinationCount: number;
  migrated: number;
  success: boolean;
  error?: string;
}

class DatabaseMigration {
  private sourceConnection: Connection | null = null;
  private destinationConnection: Connection | null = null;
  private stats: MigrationStats[] = [];

  /**
   * Connect to source and destination databases
   */
  async connect(sourceUri: string, destinationUri: string): Promise<void> {
    try {
      console.log('🔌 Connecting to source database...');
      this.sourceConnection = await mongoose.createConnection(sourceUri).asPromise();
      console.log('✅ Source database connected');

      console.log('🔌 Connecting to destination database...');
      this.destinationConnection = await mongoose.createConnection(destinationUri).asPromise();
      console.log('✅ Destination database connected');
    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw error;
    }
  }

  /**
   * Get all collection names from source database
   */
  async getCollections(): Promise<string[]> {
    if (!this.sourceConnection) {
      throw new Error('Source connection not established');
    }

    const collections = await this.sourceConnection.db.listCollections().toArray();
    return collections.map(col => col.name);
  }

  /**
   * Migrate a single collection
   */
  async migrateCollection(collectionName: string): Promise<MigrationStats> {
    const stat: MigrationStats = {
      collectionName,
      sourceCount: 0,
      destinationCount: 0,
      migrated: 0,
      success: false,
    };

    try {
      if (!this.sourceConnection || !this.destinationConnection) {
        throw new Error('Database connections not established');
      }

      console.log(`\n📦 Migrating collection: ${collectionName}`);

      // Get source collection
      const sourceCollection = this.sourceConnection.db.collection(collectionName);
      const sourceCount = await sourceCollection.countDocuments();
      stat.sourceCount = sourceCount;

      console.log(`   Source documents: ${sourceCount}`);

      if (sourceCount === 0) {
        console.log(`   ⏭️  Skipping empty collection`);
        stat.success = true;
        return stat;
      }

      // Get destination collection
      const destCollection = this.destinationConnection.db.collection(collectionName);

      // Fetch all documents from source
      const documents = await sourceCollection.find({}).toArray();

      // Check if destination collection already has data
      const existingCount = await destCollection.countDocuments();
      if (existingCount > 0) {
        console.log(`   ⚠️  Warning: Destination collection already contains ${existingCount} documents`);
        console.log(`   🗑️  Clearing destination collection...`);
        await destCollection.deleteMany({});
      }

      // Insert documents into destination
      if (documents.length > 0) {
        await destCollection.insertMany(documents, { ordered: false });
        stat.migrated = documents.length;
        console.log(`   ✅ Migrated ${documents.length} documents`);
      }

      // Verify migration
      const destCount = await destCollection.countDocuments();
      stat.destinationCount = destCount;

      if (destCount === sourceCount) {
        stat.success = true;
        console.log(`   ✅ Verification passed: ${destCount} documents in destination`);
      } else {
        stat.success = false;
        stat.error = `Count mismatch: source=${sourceCount}, destination=${destCount}`;
        console.log(`   ❌ Verification failed: ${stat.error}`);
      }

      // Copy indexes
      await this.copyIndexes(collectionName);

    } catch (error) {
      stat.success = false;
      stat.error = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Migration failed: ${stat.error}`);
    }

    return stat;
  }

  /**
   * Copy indexes from source to destination collection
   */
  async copyIndexes(collectionName: string): Promise<void> {
    try {
      if (!this.sourceConnection || !this.destinationConnection) {
        throw new Error('Database connections not established');
      }

      const sourceCollection = this.sourceConnection.db.collection(collectionName);
      const destCollection = this.destinationConnection.db.collection(collectionName);

      // Get indexes from source
      const indexes = await sourceCollection.indexes();

      // Filter out the default _id index
      const customIndexes = indexes.filter(idx => idx.name !== '_id_');

      if (customIndexes.length > 0) {
        console.log(`   📑 Copying ${customIndexes.length} indexes...`);

        for (const index of customIndexes) {
          try {
            // Remove name and version fields as they are auto-generated
            const { key, name, ...options } = index;

            // Create index on destination
            await destCollection.createIndex(key, options);
            console.log(`      ✅ Index created: ${name}`);
          } catch (error) {
            console.log(`      ⚠️  Warning: Could not create index ${index.name}:`,
              error instanceof Error ? error.message : String(error));
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Warning: Could not copy indexes:`,
        error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Migrate all collections
   */
  async migrateAll(excludeCollections: string[] = []): Promise<void> {
    try {
      const collections = await this.getCollections();
      const collectionsToMigrate = collections.filter(
        col => !excludeCollections.includes(col)
      );

      console.log(`\n📋 Found ${collections.length} collections`);
      console.log(`   Migrating: ${collectionsToMigrate.length} collections`);

      if (excludeCollections.length > 0) {
        console.log(`   Excluded: ${excludeCollections.join(', ')}\n`);
      }

      for (const collection of collectionsToMigrate) {
        const stat = await this.migrateCollection(collection);
        this.stats.push(stat);
      }

      this.printSummary();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Print migration summary
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));

    const successful = this.stats.filter(s => s.success).length;
    const failed = this.stats.filter(s => !s.success).length;
    const totalDocuments = this.stats.reduce((sum, s) => sum + s.migrated, 0);

    console.log(`\nCollections processed: ${this.stats.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📄 Total documents migrated: ${totalDocuments}\n`);

    // Detailed breakdown
    console.log('Detailed Results:');
    console.log('-'.repeat(80));
    console.log(
      'Collection'.padEnd(30) +
      'Source'.padEnd(12) +
      'Migrated'.padEnd(12) +
      'Destination'.padEnd(12) +
      'Status'
    );
    console.log('-'.repeat(80));

    this.stats.forEach(stat => {
      const status = stat.success ? '✅ Success' : `❌ Failed: ${stat.error}`;
      console.log(
        stat.collectionName.padEnd(30) +
        stat.sourceCount.toString().padEnd(12) +
        stat.migrated.toString().padEnd(12) +
        stat.destinationCount.toString().padEnd(12) +
        status
      );
    });

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      if (this.sourceConnection) {
        await this.sourceConnection.close();
        console.log('🔌 Source connection closed');
      }
      if (this.destinationConnection) {
        await this.destinationConnection.close();
        console.log('🔌 Destination connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing connections:', error);
    }
  }

  /**
   * Verify migration by comparing document counts
   */
  async verifyMigration(): Promise<boolean> {
    if (!this.sourceConnection || !this.destinationConnection) {
      throw new Error('Database connections not established');
    }

    console.log('\n🔍 Running verification...\n');

    const collections = await this.getCollections();
    let allValid = true;

    for (const collectionName of collections) {
      const sourceCollection = this.sourceConnection.db.collection(collectionName);
      const destCollection = this.destinationConnection.db.collection(collectionName);

      const sourceCount = await sourceCollection.countDocuments();
      const destCount = await destCollection.countDocuments();

      const status = sourceCount === destCount ? '✅' : '❌';
      console.log(
        `${status} ${collectionName}: source=${sourceCount}, destination=${destCount}`
      );

      if (sourceCount !== destCount) {
        allValid = false;
      }
    }

    console.log(allValid ? '\n✅ Verification passed!\n' : '\n❌ Verification failed!\n');
    return allValid;
  }
}

// Main execution
async function main() {
  const migration = new DatabaseMigration();

  try {
    // Get connection strings from environment variables or command line arguments
    const sourceUri = process.env.SOURCE_MONGO_URI || process.argv[2];
    const destinationUri = process.env.DESTINATION_MONGO_URI || process.argv[3];

    if (!sourceUri || !destinationUri) {
      console.error('❌ Error: Missing connection strings');
      console.log('\nUsage:');
      console.log('  npm run migrate:db -- <source-uri> <destination-uri>');
      console.log('Or set environment variables:');
      console.log('  SOURCE_MONGO_URI=<source-uri>');
      console.log('  DESTINATION_MONGO_URI=<destination-uri>');
      process.exit(1);
    }

    // Confirm before proceeding
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  DATABASE MIGRATION');
    console.log('='.repeat(80));
    console.log(`\nSource:      ${sourceUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.log(`Destination: ${destinationUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    console.log('\n⚠️  WARNING: This will overwrite data in the destination database!');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Connect to databases
    await migration.connect(sourceUri, destinationUri);

    // Collections to exclude (typically system collections)
    const excludeCollections = ['system.views'];

    // Perform migration
    await migration.migrateAll(excludeCollections);

    // Verify migration
    const isValid = await migration.verifyMigration();

    if (isValid) {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Migration completed with errors. Please review the summary above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default DatabaseMigration;
