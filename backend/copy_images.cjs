const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Harshith Gadipelli\\.gemini\\antigravity-ide\\brain\\d93bd691-d607-4585-89c1-d88581bc3248';
const destDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.readdirSync(srcDir).forEach(file => {
    if (file.endsWith('.jpg') && file.startsWith('ai_')) {
        // file format is like ai_tomato_1787683773884.jpg
        // We want to strip the timestamp: ai_tomato.jpg
        // Note: ai_farm_landscape_1_... -> ai_farm_landscape_1.jpg
        const baseNameMatch = file.match(/^(ai_.+?)_\d+\.jpg$/);
        let newName = baseNameMatch ? `${baseNameMatch[1]}.jpg` : file;
        
        // special renames to match previous config:
        if (newName.startsWith('ai_farmer_portrait_1')) newName = 'ai_farmer_1.jpg';
        if (newName.startsWith('ai_farm_landscape_1')) newName = 'ai_farm_1.jpg';
        
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, newName);
        
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to ${newName}`);
    }
});
console.log("Image copy complete.");
