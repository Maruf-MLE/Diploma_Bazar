/**
 * 🖼️ Lightweight Image Scanner
 * Simple and fast image validation for book cover uploads
 * No false positives, just basic safety checks
 */

export interface LightweightScanResult {
  isValid: boolean;
  allowUpload: boolean;
  error?: string;
  sanitizedFileName?: string;
}

/**
 * 📸 Simple image validation for book covers
 */
export function validateImageForBookCover(file: File): LightweightScanResult {
  try {
    // 1. Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        allowUpload: false,
        error: 'File size too large (max 10MB)'
      };
    }

    // 2. Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        allowUpload: false,
        error: 'Empty file'
      };
    }

    // 3. Check MIME type (allow common image formats)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp'
    ];

    const isImageType = allowedTypes.some(type => 
      file.type === type || 
      file.type.toLowerCase() === type ||
      (type === 'image/jpeg' && file.type === 'image/jpg') ||
      (type === 'image/jpg' && file.type === 'image/jpeg')
    );

    if (!isImageType) {
      return {
        isValid: false,
        allowUpload: false,
        error: `File type ${file.type} is not supported. Please use JPG, PNG, GIF, WebP, or BMP.`
      };
    }

    // 4. Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.jpg') || 
                             fileName.endsWith('.jpeg') || 
                             fileName.endsWith('.png') || 
                             fileName.endsWith('.gif') || 
                             fileName.endsWith('.webp') || 
                             fileName.endsWith('.bmp');

    if (!hasValidExtension) {
      return {
        isValid: false,
        allowUpload: false,
        error: 'File must have a valid image extension (.jpg, .png, .gif, .webp, .bmp)'
      };
    }

    // 5. Basic filename sanitization
    let sanitizedFileName = file.name
      .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid chars
      .replace(/^\.+/, '') // Remove leading dots
      .trim();

    if (!sanitizedFileName) {
      sanitizedFileName = `book_cover_${Date.now()}.jpg`;
    }

    // 6. All checks passed
    console.log('✅ Image validation successful:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      sanitizedFileName
    });

    return {
      isValid: true,
      allowUpload: true,
      sanitizedFileName
    };

  } catch (error) {
    console.error('Image validation error:', error);
    return {
      isValid: false,
      allowUpload: false,
      error: 'Failed to validate image'
    };
  }
}

/**
 * 🚀 Fast image upload validation (no deep scanning)
 */
export function quickImageCheck(file: File): { passed: boolean; reason?: string } {
  // Size check (max 15MB for quick check)
  if (file.size > 15 * 1024 * 1024) {
    return { passed: false, reason: 'File too large (max 15MB)' };
  }

  if (file.size === 0) {
    return { passed: false, reason: 'Empty file' };
  }

  // Basic type check
  if (!file.type.startsWith('image/')) {
    return { passed: false, reason: 'Not an image file' };
  }

  // Dangerous extension check (very basic)
  const fileName = file.name.toLowerCase();
  if (fileName.includes('.exe') || fileName.includes('.php') || fileName.includes('.js')) {
    return { passed: false, reason: 'Suspicious file name' };
  }

  return { passed: true };
}
