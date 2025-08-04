const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to create a simple icon
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background color (blue)
  ctx.fillStyle = '#2F5DEA';
  ctx.fillRect(0, 0, size, size);
  
  // Draw white text
  ctx.fillStyle = 'white';
  ctx.font = `${size/2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📚', size/2, size/2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(iconsDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Created ${filename}`);
}

try {
  createIcon(192, 'icon-192.png');
  createIcon(512, 'icon-512.png');
  console.log('\n✅ Icons created successfully!');
} catch (error) {
  console.error('Error creating icons:', error);
  console.log('\nAlternative: Please create icons manually or use the HTML generator.');
}
