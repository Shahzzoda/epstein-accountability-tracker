#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

async function main() {
  const assetsDir = path.join(process.cwd(), '.open-next', 'assets');
  const filePath = path.join(assetsDir, '.assetsignore');
  const contents = ['maps/districts/png/**', ''].join('\n');

  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(filePath, contents, 'utf8');
  console.log(`Wrote ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
