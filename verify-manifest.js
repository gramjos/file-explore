const fs = require('fs');
const path = require('path');
const m = require('./m.json');

const errors = [];
const ids = new Set(Object.keys(m.items));
const referenced = new Set([m.rootId]);

// Check each item
for (const [id, item] of Object.entries(m.items)) {
  // Required fields
  for (const field of ['id', 'type', 'title', 'content_path']) {
    if (!item[field]) errors.push(`${id}: missing "${field}"`);
  }
  if (item.id !== id) errors.push(`${id}: id field "${item.id}" doesn't match key`);

  // Validate content_path exists on disk
  const filePath = path.join(__dirname, 'content-store', item.content_path);
  if (!fs.existsSync(filePath)) errors.push(`${id}: file not found → content-store${item.content_path}`);

  // Check children references
  if (item.children) {
    if (item.type !== 'directory') errors.push(`${id}: has children but type is "${item.type}"`);
    for (const childId of item.children) {
      referenced.add(childId);
      if (!ids.has(childId)) errors.push(`${id}: child "${childId}" not found in items`);
    }
  }
}

// Orphan check — items that exist but are never referenced
const orphans = [...ids].filter(id => !referenced.has(id));
if (orphans.length) errors.push(`Orphan items (unreachable): ${orphans.join(', ')}`);

// Print tree
console.log('\n=== File Tree ===');
function printTree(id, depth = 0) {
  const item = m.items[id];
  if (!item) return;
  const indent = '  '.repeat(depth);
  const icon = item.type === 'directory' ? '📁' : '📄';
  console.log(`${indent}${icon} ${item.content_path}`);
  if (item.children) {
    item.children.forEach(childId => printTree(childId, depth + 1));
  }
}
printTree(m.rootId);

// Report
console.log('\n=== Validation ===');
if (errors.length) {
  console.error(`✗ ${errors.length} issue(s) found:`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`✓ Manifest valid — ${ids.size} items, all paths resolved.`);
}
