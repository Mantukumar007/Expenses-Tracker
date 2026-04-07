const fs = require('fs');
const path = require('path');

const source = 'd:\\Mantu_code\\AI_Expense_Tracker\\frontend';
const destination = 'd:\\Mantu_code\\Ready_To_Upload_Expense_Tracker';

// Create destination folder
if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination, { recursive: true });
}

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (path.basename(src) === 'node_modules' || path.basename(src) === 'dist' || path.basename(src) === '.git') {
       return; // skip these folders
    }
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // skip env files
    if (path.basename(src) === '.env.local') return;
    
    fs.copyFileSync(src, dest);
  }
};

copyRecursiveSync(source, destination);

// Copy the true database script there too 
const dbSql = 'd:\\Mantu_code\\AI_Expense_Tracker\\database.sql';
if (fs.existsSync(dbSql)) {
  fs.copyFileSync(dbSql, path.join(destination, 'database_setup.sql'));
}

console.log('Successfully created ready folder at: ' + destination);
