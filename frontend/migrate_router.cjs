const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function migrateFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. Links
  // import { Link } from "react-router-dom" -> import Link from "next/link"
  // Needs to handle if it imports multiple things like import { Link, useNavigate }
  if (content.includes('react-router-dom')) {
    // If it imports Link specifically
    if (/import\s+{.*?\bLink\b.*?}\s+from\s+['"]react-router-dom['"]/.test(content)) {
      content = content.replace(/import\s+{.*?\bLink\b.*?}\s+from\s+['"]react-router-dom['"];?/, (match) => {
        let imports = match.match(/{(.*?)}/)[1].split(',').map(s => s.trim()).filter(s => s !== 'Link');
        let res = `import Link from "next/link";\n`;
        if (imports.length > 0) {
          res += `import { ${imports.join(', ')} } from "react-router-dom";`;
        }
        return res;
      });
    }
  }

  // <Link to= -> <Link href=
  content = content.replace(/<Link\s+to=/g, '<Link href=');
  // <Link className="xyz" to= -> <Link className="xyz" href=
  content = content.replace(/<Link([^>]*?)to=/g, '<Link$1href=');

  // 2. Hooks
  if (content.includes('useNavigate') || content.includes('useLocation')) {
    // Ensure next/navigation is imported
    if (!content.includes('next/navigation')) {
      content = content.replace(/(import .*?;?\n)/, `$1import { useRouter, usePathname, useSearchParams } from "next/navigation";\n`);
    }

    // Replace usages
    content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const router = useRouter();');
    content = content.replace(/\bnavigate\(/g, 'router.push(');

    // Replace useLocation
    content = content.replace(/const\s+location\s*=\s*useLocation\(\);?/g, 'const pathname = usePathname();\n  const searchParams = useSearchParams();\n  const location = { pathname, search: searchParams?.toString() || "" };');
  }

  // Remove remaining react-router-dom if empty
  content = content.replace(/import\s+{\s*}\s+from\s+['"]react-router-dom['"];?\n?/g, '');
  
  // Also generic react-router-dom imports if no longer needed
  if (content.includes('react-router-dom') && !content.includes('useParams') && !content.includes('Navigate')) {
      content = content.replace(/import\s+{.*?}\s+from\s+['"]react-router-dom['"];?\n?/g, '');
  }

  // Also brute-force remove useSearchParams if it snuck in from react-router-dom
  content = content.replace(/import\s+{([^}]*?)useSearchParams([^}]*?)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1, p2) => {
    let remains = p1.trim() + p2.trim();
    if (remains.replace(/,/, '').trim() === '') return '';
    return `import { ${remains.replace(/^,|,$/g, '').trim()} } from "react-router-dom";`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Migrated: ${filePath}`);
  }
}

const srcDir = path.join(__dirname, 'src');
walkDir(srcDir, migrateFile);

// Also migrate app/providers.jsx
migrateFile(path.join(__dirname, 'app', 'providers.jsx'));
