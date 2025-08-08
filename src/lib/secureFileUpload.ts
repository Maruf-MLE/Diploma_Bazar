/**
 * 🔒 Secure File Upload Service
 * Integrates malware scanning with Supabase storage
 */

import { supabase } from './supabase';
import { scanFileForThreats, quickSecurityCheck, FileValidationOptions, SecurityScanResult } from './malwareScanner';
import { toast } from '@/hooks/use-toast';

export interface SecureUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  error?: string;
  securityScan?: SecurityScanResult;
}

export interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
  enableDeepScan?: boolean;
  customFileName?: string;
}

/**
 * 🛡️ Secure file upload with comprehensive malware scanning
 */
export async function secureUploadFile(
  file: File, 
  options: UploadOptions
): Promise<SecureUploadResult> {
  
  console.log('🔒 Starting secure file upload:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    options
  });

  try {
    // 1. Quick security pre-check (fast)
    const quickCheck = quickSecurityCheck(file);
    if (!quickCheck.passed) {
      const error = `Security pre-check failed: ${quickCheck.reason}`;
      console.warn('🚨 Quick security check failed:', error);
      
      toast({
        title: "File Upload Blocked",
        description: quickCheck.reason || "File failed security check",
        variant: "destructive"
      });
      
      return {
        success: false,
        error
      };
    }

    // 2. Comprehensive security scan
    const scanOptions: FileValidationOptions = {
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'],
      strictValidation: false, // Disable strict validation for compatibility
      scanContent: options.enableDeepScan || false,
      quarantineOnThreat: true
    };

    console.log('🔍 Starting deep security scan...');
    const securityScan = await scanFileForThreats(file, scanOptions);
    
    // Log security scan results
    console.log('🛡️ Security scan completed:', {
      isSecure: securityScan.isSecure,
      riskLevel: securityScan.riskLevel,
      threats: securityScan.threats,
      allowUpload: securityScan.allowUpload
    });

    // 3. Handle security threats
    if (!securityScan.allowUpload) {
      const error = `Upload blocked due to security threats: ${securityScan.details}`;
      console.error('🚨 Upload blocked by security scan:', securityScan);
      
      // Show specific error messages based on risk level
      let userMessage = "File upload blocked for security reasons.";
      let description = securityScan.details;
      
      switch (securityScan.riskLevel) {
        case 'CRITICAL':
          userMessage = "🚨 Critical Security Threat Detected";
          description = "This file contains malicious content and cannot be uploaded.";
          break;
        case 'HIGH':
          userMessage = "⚠️ High Risk File Detected";
          description = "This file type or content poses security risks.";
          break;
        case 'MEDIUM':
          userMessage = "⚠️ File Security Issue";
          description = "Please check your file and try again.";
          break;
      }
      
      toast({
        title: userMessage,
        description,
        variant: "destructive"
      });
      
      return {
        success: false,
        error,
        securityScan
      };
    }

    // 4. Generate secure file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    const sanitizedFileName = securityScan.sanitizedFileName || 
      `secure_${timestamp}_${randomId}.${fileExt}`;
    
    const filePath = options.folder 
      ? `${options.folder}/${sanitizedFileName}`
      : sanitizedFileName;

    console.log('📁 Uploading to path:', filePath);

    // 5. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        // Add metadata about security scan
        metadata: {
          'security-scanned': 'true',
          'scan-timestamp': new Date().toISOString(),
          'risk-level': securityScan.riskLevel,
          'original-filename': file.name
        }
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
        securityScan
      };
    }

    if (!uploadData) {
      const error = 'Upload completed but no data returned';
      console.error('❌', error);
      return {
        success: false,
        error,
        securityScan
      };
    }

    console.log('✅ File uploaded successfully:', uploadData.path);

    // 6. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);

    // 7. Ensure HTTPS
    let secureUrl = publicUrl;
    if (secureUrl.startsWith('http://') && secureUrl.includes('supabase')) {
      secureUrl = secureUrl.replace('http://', 'https://');
    }

    // 8. Log successful upload
    console.log('🎉 Secure upload completed:', {
      originalName: file.name,
      sanitizedName: sanitizedFileName,
      publicUrl: secureUrl,
      securityScan: {
        isSecure: securityScan.isSecure,
        riskLevel: securityScan.riskLevel,
        threatsDetected: securityScan.threats.length
      }
    });

    // 9. Show success message (only if there were no threats)
    if (securityScan.isSecure) {
      toast({
        title: "✅ File Uploaded Successfully",
        description: "Your file has been scanned and uploaded securely.",
        variant: "default"
      });
    } else {
      toast({
        title: "⚠️ File Uploaded with Warnings",
        description: "File uploaded but some security issues were noted.",
        variant: "default"
      });
    }

    return {
      success: true,
      publicUrl: secureUrl,
      fileName: sanitizedFileName,
      securityScan
    };

  } catch (error) {
    console.error('❌ Secure upload failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    
    toast({
      title: "Upload Error",
      description: "An error occurred during file upload. Please try again.",
      variant: "destructive"
    });
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 📸 Secure image upload (optimized for images)
 */
export async function secureImageUpload(
  file: File,
  bucket: string = 'books',
  folder: string = 'images'
): Promise<SecureUploadResult> {
  
  return secureUploadFile(file, {
    bucket,
    folder,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ],
    enableDeepScan: true // Enable deep scanning for images
  });
}

/**
 * 📄 Secure document upload
 */
export async function secureDocumentUpload(
  file: File,
  bucket: string = 'messages',
  folder: string = 'documents'
): Promise<SecureUploadResult> {
  
  return secureUploadFile(file, {
    bucket,
    folder,
    maxSize: 50 * 1024 * 1024, // 50MB for documents
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    enableDeepScan: true
  });
}

/**
 * 👤 Secure profile photo upload
 */
export async function secureProfilePhotoUpload(
  file: File,
  userId: string
): Promise<SecureUploadResult> {
  
  return secureUploadFile(file, {
    bucket: 'verification_photos',
    folder: userId,
    maxSize: 5 * 1024 * 1024, // 5MB for profile photos
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png'
    ],
    enableDeepScan: true
  });
}

/**
 * 🔍 Validate file before upload (client-side pre-check)
 */
export function validateFileBeforeUpload(
  file: File,
  maxSize: number = 10 * 1024 * 1024,
  allowedTypes: string[] = ['image/jpeg', 'image/png']
): { valid: boolean; error?: string } {
  
  // Size check
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds limit (${(maxSize / (1024 * 1024)).toFixed(2)}MB)`
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Empty file'
    };
  }
  
  // Type check
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }
  
  // Quick security check
  const securityCheck = quickSecurityCheck(file);
  if (!securityCheck.passed) {
    return {
      valid: false,
      error: securityCheck.reason
    };
  }
  
  return { valid: true };
}

/**
 * 🗑️ Secure file deletion (with logging)
 */
export async function secureDeleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    console.log('🗑️ Securely deleting file:', { bucket, filePath });
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error('❌ File deletion failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('✅ File deleted successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ File deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 📊 Get upload security statistics for admin dashboard
 */
export function getUploadSecurityStats() {
  try {
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    const uploadEvents = events.filter((event: any) => event.type === 'FILE_UPLOAD_THREAT_DETECTED');
    
    const last24h = uploadEvents.filter((event: any) => 
      new Date(event.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const last7days = uploadEvents.filter((event: any) => 
      new Date(event.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    return {
      totalThreats: uploadEvents.length,
      threatsLast24h: last24h.length,
      threatsLast7days: last7days.length,
      riskDistribution: uploadEvents.reduce((acc: any, event: any) => {
        acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1;
        return acc;
      }, {}),
      fileTypeThreats: uploadEvents.reduce((acc: any, event: any) => {
        acc[event.fileType] = (acc[event.fileType] || 0) + 1;
        return acc;
      }, {}),
      commonThreats: uploadEvents.reduce((acc: any, event: any) => {
        event.threats.forEach((threat: string) => {
          acc[threat] = (acc[threat] || 0) + 1;
        });
        return acc;
      }, {})
    };
  } catch (error) {
    return {
      totalThreats: 0,
      threatsLast24h: 0,
      threatsLast7days: 0,
      riskDistribution: {},
      fileTypeThreats: {},
      commonThreats: {}
    };
  }
}
