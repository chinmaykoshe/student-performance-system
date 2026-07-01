const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');
const componentsPath = path.join(__dirname, 'src', 'components');

function cleanDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      cleanDirectory(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Regex to remove dark:[any-class-name]
      const regex = /\bdark:[a-zA-Z0-9\-\/\[\]:]+\b/g;
      if (regex.test(content)) {
        content = content.replace(regex, '');
        // Also clean up multiple spaces created by removal
        content = content.replace(/ +/g, ' ');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned ${file}`);
      }
    }
  });
}

cleanDirectory(directoryPath);
cleanDirectory(componentsPath);
console.log('Finished removing dark mode classes.');
