import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const resourcesDir = join(__dirname, '..', 'resources');

async function generateAssets() {
  console.log('Generating app icon (1024x1024)...');
  const iconSvg = readFileSync(join(resourcesDir, 'icon.svg'));
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(join(resourcesDir, 'icon.png'));
  console.log('✓ icon.png created');

  console.log('Generating splash screen (2732x2732)...');
  const splashSvg = readFileSync(join(resourcesDir, 'splash.svg'));
  await sharp(splashSvg)
    .resize(2732, 2732)
    .png()
    .toFile(join(resourcesDir, 'splash.png'));
  console.log('✓ splash.png created');

  // Also create a dark splash for consistency
  await sharp(splashSvg)
    .resize(2732, 2732)
    .png()
    .toFile(join(resourcesDir, 'splash-dark.png'));
  console.log('✓ splash-dark.png created');

  console.log('\nAll assets generated successfully!');
}

generateAssets().catch(console.error);
