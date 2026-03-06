const fs = require('fs');
const path = require('path');

// This script fixes a bug in some Expo modules where they accidentally point to 
// .ts source files instead of compiled .js binaries.
const root = path.join(__dirname, 'node_modules');

if (!fs.existsSync(root)) {
    console.log('node_modules not found, skipping patch.');
    process.exit(0);
}

const folders = fs.readdirSync(root);

folders.forEach(d => {
    if (d.startsWith('expo-')) {
        const p = path.join(root, d, 'package.json');
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, 'utf8');
                const pkg = JSON.parse(content);
                let changed = false;

                // Force expo-modules-core to use its secondary entry point if the main one is broken
                if (d === 'expo-modules-core' && pkg.main && typeof pkg.main === 'string' && pkg.main.endsWith('.ts')) {
                    pkg.main = 'index.js';
                    changed = true;
                }

                // Strip "source" and "react-native" fields if they point to .ts files
                ['react-native', 'source'].forEach(key => {
                    if (pkg[key] && typeof pkg[key] === 'string' && pkg[key].endsWith('.ts')) {
                        delete pkg[key];
                        changed = true;
                    }
                });

                if (changed) {
                    fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
                    console.log(`🩹 Patched ${d}`);
                }
            } catch (e) {
                console.warn(`Failed to patch ${d}: ${e.message}`);
            }
        }
    }
});
