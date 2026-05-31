import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const sourceFolder = path.join(process.cwd(), 'proyectos');
const appDir = process.cwd();
const publicDir = path.join(appDir, 'public');
const thumbsDir = path.join(publicDir, 'thumbnails');
const projectsDestDir = path.join(publicDir, 'projects');
const dataDir = path.join(appDir, 'src/data');
const targetDatabase = path.join(process.cwd(), 'src/data/projects.json');

// Supported extensions
const imageExtensions = ['.jpg', '.jpeg', '.png'];

// Neon color list for cyclic grouping
const GLOW_COLORS = [
  '#00ffff', // Cyan
  '#ff007f', // Pink
  '#9d4edd', // Purple
  '#2ec4b6', // Green
  '#ffb703', // Yellow
  '#fb8500', // Orange
];

// Clean a string into a clean kebab-case ID
function toKebabCase(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with -
    .replace(/(^-|-$)/g, ''); // trim hyphens
}

async function optimizeImages() {
  console.log('--- STARTING MULTI-PROJECT ASSET OPTIMIZATION PIPELINE ---');
  console.log(`Source Folder: ${sourceFolder}`);
  console.log(`Target database: ${targetDatabase}`);

  if (!fs.existsSync(sourceFolder)) {
    console.error(`[ERROR] Projects source folder does not exist at: ${sourceFolder}`);
    return;
  }

  // Read subfolders in sourceFolder
  const items = fs.readdirSync(sourceFolder);
  const subfolders = items.filter((item) => {
    return fs.statSync(path.join(sourceFolder, item)).isDirectory();
  });

  console.log(`Found ${subfolders.length} project groups.`);

  const database = [];
  let colorIndex = 0;

  for (const folder of subfolders) {
    const folderPath = path.join(sourceFolder, folder);
    const projectId = toKebabCase(folder);
    const projectTitle = folder;
    const projectColor = GLOW_COLORS[colorIndex % GLOW_COLORS.length];
    colorIndex++;

    console.log(`\nProcessing Group: [${projectTitle}] -> ID: [${projectId}] (Color: ${projectColor})`);

    // Ensure output directories exist for this projectId
    const groupThumbDir = path.join(thumbsDir, projectId);
    const groupProjectDir = path.join(projectsDestDir, projectId);

    [groupThumbDir, groupProjectDir, dataDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Read images in this folder
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext) && fs.statSync(path.join(folderPath, file)).isFile();
    });

    console.log(` - Found ${imageFiles.length} images.`);

    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const sourcePath = path.join(folderPath, filename);

      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);
      const cleanFileId = toKebabCase(baseName);
      const elementId = `${projectId}-${cleanFileId}`;

      const targetFileName = `${cleanFileId}.webp`;
      const targetFullUrl = `/projects/${projectId}/${targetFileName}`;
      const targetThumbUrl = `/thumbnails/${projectId}/${targetFileName}`;

      const destFullPath = path.join(groupProjectDir, targetFileName);
      const destThumbPath = path.join(groupThumbDir, targetFileName);

      try {
        console.log(`   [${i + 1}/${imageFiles.length}] Processing: ${filename}`);

        // Read dimensions
        const imageInstance = sharp(sourcePath);
        const metadata = await imageInstance.metadata();
        const width = metadata.width || 1000;
        const height = metadata.height || 1000;
        const aspectRatio = width / height;

        // 1. Generate full-size compressed WebP
        if (width > 2048 || height > 2048) {
          await sharp(sourcePath)
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(destFullPath);
        } else {
          await sharp(sourcePath)
            .webp({ quality: 82 })
            .toFile(destFullPath);
        }

        // 2. Generate thumbnail WebP
        await sharp(sourcePath)
          .resize(512, 512, { fit: 'inside' })
          .webp({ quality: 70 })
          .toFile(destThumbPath);

        // Generate coordinates and angles
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 35;
        const rotation = (Math.random() - 0.5) * 0.25;

        // Clean title
        let title = baseName.replace(/_/g, ' ').replace(/-/g, ' ').trim();
        title = title.replace(/^\d+[\s_-]/, ''); // remove dates
        title = title.charAt(0).toUpperCase() + title.slice(1);

        database.push({
          id: elementId,
          title: `${projectTitle} // ${title}`,
          filename,
          projectId,
          projectTitle,
          glowColor: projectColor,
          year: folder.includes('2022') || folder.toLowerCase().includes('m1') || folder.toLowerCase().includes('morfologia') ? 2022 : (folder.includes('2023') ? 2023 : 2024),
          type: filename.toUpperCase().includes('RENDER') ? 'Render' : (filename.toUpperCase().includes('DIAGRAMA') ? 'Diagram' : 'Blueprint'),
          aspectRatio,
          width,
          height,
          thumbnail: targetThumbUrl,
          fullImage: targetFullUrl,
          initialPosition: [x, y, 0],
          initialRotation: rotation,
          scale: aspectRatio > 1 ? [4 * aspectRatio, 4, 1] : [3, 3 / aspectRatio, 1]
        });

        console.log(`     Success -> ID: ${elementId}`);
      } catch (err) {
        console.error(`     [ERROR] Failed to process ${filename}:`, err.message);
      }
    }
  }

  // Write database
  fs.writeFileSync(targetDatabase, JSON.stringify(database, null, 2), 'utf-8');
  console.log(`\nDatabase generated successfully at: ${targetDatabase}`);
  console.log(`Optimized database contains ${database.length} entries.`);
  console.log('--- MULTI-PROJECT PIPELINE COMPLETED ---');
}

optimizeImages().catch((err) => {
  console.error('Fatal pipeline error:', err);
});
