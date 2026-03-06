const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'node_modules');
if (!fs.existsSync(root)) process.exit(0);

fs.readdirSync(root).forEach(d => {
    if (d.startsWith('expo-')) {
        const p = path.join(root, d, 'package.json');
        if (fs.existsSync(p)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
                let c = false;

                // Fields to check for .ts files
                const fields = ['main', 'module', 'react-native', 'source', 'browser'];

                fields.forEach(f => {
                    if (pkg[f] && typeof pkg[f] === 'string' && pkg[f].endsWith('.ts')) {
                        if (f === 'main') {
                            // Try to find a .js replacement
                            const jsPath = pkg[f].replace(/\.ts$/, '.js');
                            const buildPath = pkg[f].replace(/^src\//, 'build/').replace(/\.ts$/, '.js');

                            if (fs.existsSync(path.join(root, d, 'index.js'))) {
                                pkg[f] = 'index.js';
                            } else if (fs.existsSync(path.join(root, d, jsPath))) {
                                pkg[f] = jsPath;
                            } else if (fs.existsSync(path.join(root, d, buildPath))) {
                                pkg[f] = buildPath;
                            } else {
                                // Fallback: create a dummy if it's the main entry
                                fs.writeFileSync(path.join(root, d, 'index.js'), "module.exports = {};");
                                pkg[f] = 'index.js';
                            }
                        } else {
                            delete pkg[f];
                        }
                        c = true;
                    }
                });

                if (c) {
                    fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
                    console.log(`🩹 Fixed ${d}`);
                }
            } catch (e) { }
        }
    }
});
