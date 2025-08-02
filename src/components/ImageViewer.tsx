import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Minus, Plus, RotateCw, ZoomIn, ZoomOut, X, Maximize, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface ImageViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  altText?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, isOpen, onClose, altText = 'Image' }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [finalUrl, setFinalUrl] = useState(imageUrl);
  
  // Reset view when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setLoadError(false);
      setIsLoading(true);
      processImageUrl();
    }
  }, [isOpen, imageUrl]);
  
  // Process and optimize image URL
  const processImageUrl = async () => {
    setIsLoading(true);
    setLoadError(false);
    
    try {
      // Force HTTPS for Supabase URLs if they're using HTTP
      let processedUrl = imageUrl;
      if (processedUrl.startsWith('http://') && processedUrl.includes('supabase')) {
        processedUrl = processedUrl.replace('http://', 'https://');
      }
      
      // Remove any query parameters that might cause caching issues
      if (processedUrl.includes('?')) {
        processedUrl = processedUrl.split('?')[0];
      }
      
      // Try to get a signed URL if it's a Supabase storage URL
      if (processedUrl.includes('/storage/v1/object/public/')) {
        const parts = processedUrl.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          const bucketAndPath = parts[1].split('/', 1);
          const bucket = bucketAndPath[0];
          const objectPath = parts[1].substring(bucket.length + 1);
          
          console.log(`Trying to get signed URL for bucket: ${bucket}, path: ${objectPath}`);
          
          try {
            // Try to create a signed URL (which may work better than public URL)
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(objectPath, 300); // 5 minutes expiration
              
            if (data?.signedUrl) {
              console.log('Created signed URL for image viewer:', data.signedUrl);
              processedUrl = data.signedUrl;
            } else {
              console.error('Error creating signed URL:', error);
            }
          } catch (err) {
            console.error('Exception creating signed URL:', err);
          }
        }
      }
      
      // Store the processed URL
      setFinalUrl(processedUrl);
      
    } catch (error) {
      console.error('Error processing image URL:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 5));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = finalUrl;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleRetry = () => {
    processImageUrl();
  };

  // Handle mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.1, 5));
    } else {
      setScale(prev => Math.max(prev - 0.1, 0.5));
    }
  };

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="p-0 border-none max-w-[95vw] max-h-[95vh] overflow-hidden bg-black/90"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <Button variant="outline" size="icon" className="bg-black/50 text-white border-none" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-black/50 text-white border-none" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-black/50 text-white border-none" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-black/50 text-white border-none" onClick={handleReset}>
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-black/50 text-white border-none" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="bg-black/50 text-white border-none" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div 
          className="flex items-center justify-center w-full h-full overflow-hidden"
          onWheel={handleWheel}
        >
          {isLoading && (
            <div className="flex flex-col items-center">
              <div className="animate-spin">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-white">ছবি লোড হচ্ছে...</p>
            </div>
          )}
          
          {loadError && !isLoading && (
            <div className="flex flex-col items-center">
              <p className="text-red-400 mb-2">ছবি লোড করতে সমস্যা হয়েছে</p>
              <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                আবার চেষ্টা করুন
              </Button>
            </div>
          )}
          
          <img
            ref={imageRef}
            src={finalUrl}
            alt={altText}
            className={`max-w-full max-h-full object-contain cursor-move ${isLoading || loadError ? 'hidden' : ''}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
            onLoad={() => {
              console.log('Image loaded successfully in viewer');
              setIsLoading(false);
              setLoadError(false);
            }}
            onError={() => {
              console.error('Error loading image in viewer:', finalUrl);
              setLoadError(true);
              setIsLoading(false);
            }}
            crossOrigin="anonymous"
          />
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-white" onClick={handleZoomOut}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-white" onClick={handleZoomIn}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer; 