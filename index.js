// Netlify Build Plugin: manifest-generator
//
// Regenerates data/projects/manifest.json and data/keywords/manifest.json
// by scanning their folders for .json files, so the CMS never has to
// (and no one has to remember to) update the manifest by hand.
//
// Runs onPreBuild, before the deploy is assembled, so the regenerated
// manifests are always included in whatever gets published.

const fs = require('fs');
const path = require('path');

// Folders that should get an auto-generated manifest.json.
// Add more { dir: '...' } entries here if new collections need the same treatment.
const TARGETS = [
  { dir: 'data/projects' },
  { dir: 'data/keywords' }
];

function regenerateManifest(absoluteDir) {
  const files = fs
    .readdirSync(absoluteDir)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .sort((a, b) => a.localeCompare(b));

  const manifestPath = path.join(absoluteDir, 'manifest.json');
  const previous = fs.existsSync(manifestPath)
    ? fs.readFileSync(manifestPath, 'utf8')
    : null;

  // Match the existing compact single-line array format used in the repo.
  const next = JSON.stringify(files);

  if (previous !== next) {
    fs.writeFileSync(manifestPath, next);
  }

  return { count: files.length, changed: previous !== next };
}

module.exports = {
  onPreBuild: async ({ utils }) => {
    for (const { dir } of TARGETS) {
      const absoluteDir = path.join(process.cwd(), dir);

      if (!fs.existsSync(absoluteDir)) {
        console.log(`[manifest-generator] Skipping ${dir} — folder not found`);
        continue;
      }

      try {
        const { count, changed } = regenerateManifest(absoluteDir);
        console.log(
          `[manifest-generator] ${dir}/manifest.json — ${count} file(s)` +
            (changed ? ' (updated)' : ' (already up to date)')
        );
      } catch (err) {
        // Fail the build loudly rather than silently shipping a stale manifest.
        utils.build.failBuild(`[manifest-generator] Failed to update ${dir}/manifest.json`, {
          error: err
        });
      }
    }
  }
};
