/**
 * Migration Script: Add detailed closure columns
 * Date: 2025-10-11
 * Description: Adds parking_details and carwash_details columns to cash_closures table
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../src/database/pos_system.db');

console.log('🔧 Running migration: add_closure_details');
console.log('📁 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  
  console.log('✅ Database opened successfully');
  
  // Check if columns already exist
  db.all("PRAGMA table_info(cash_closures)", [], (err, rows: any[]) => {
    if (err) {
      console.error('❌ Error checking table info:', err);
      db.close();
      process.exit(1);
    }
    
    const hasDetails = rows.some((col: any) => 
      col.name === 'parking_details' || col.name === 'carwash_details'
    );
    
    if (hasDetails) {
      console.log('✅ Columns already exist, skipping migration');
      db.close();
      process.exit(0);
      return;
    }
    
    console.log('📝 Adding parking_details column...');
    db.run(`ALTER TABLE cash_closures ADD COLUMN parking_details TEXT DEFAULT '[]';`, (err) => {
      if (err) {
        console.error('❌ Error adding parking_details column:', err);
        db.close();
        process.exit(1);
        return;
      }
      
      console.log('✅ parking_details column added');
      console.log('📝 Adding carwash_details column...');
      
      db.run(`ALTER TABLE cash_closures ADD COLUMN carwash_details TEXT DEFAULT '[]';`, (err) => {
        if (err) {
          console.error('❌ Error adding carwash_details column:', err);
          db.close();
          process.exit(1);
          return;
        }
        
        console.log('✅ carwash_details column added');
        console.log('✅ Migration completed successfully!');
        
        // Verify columns were added
        db.all("PRAGMA table_info(cash_closures)", [], (err, updatedRows: any[]) => {
          if (err) {
            console.error('❌ Error verifying columns:', err);
          } else {
            const columns = updatedRows.map((col: any) => col.name);
            console.log('📋 Cash closures columns:', columns.join(', '));
          }
          
          db.close(() => {
            console.log('🎉 Database migration finished!');
            process.exit(0);
          });
        });
      });
    });
  });
});
