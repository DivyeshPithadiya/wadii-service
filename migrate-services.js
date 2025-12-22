// Quick migration runner
require('ts-node/register');
require('dotenv').config();

require('./src/scripts/migrateServicesToObjectId.ts');
