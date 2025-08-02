# File Attachments in Messaging System

## Overview
This document describes the implementation of file attachments in the messaging system of Boi Chapa Bazar. Users can now share images and documents through the messaging interface.

## Features
- Image sharing (JPEG, PNG, GIF)
- Document sharing (PDF, Word, Excel, PowerPoint, Text)
- Preview of images in chat
- Download option for all attachments
- Size limit: 10MB per file

## Technical Implementation

### Database Changes
The `messages` table has been extended with the following columns:
- `file_url`: URL of the uploaded file in Supabase Storage
- `file_type`: Type of file ('image' or 'document')
- `file_name`: Original filename of the attachment

### Storage
Files are stored in Supabase Storage in the `messages` bucket with the following structure:
- Images: `/message_images/{senderId}-{timestamp}-{random}.{extension}`
- Documents: `/message_documents/{senderId}-{timestamp}-{random}.{extension}`

### User Interface Components
- Image upload button in the chat interface
- Document upload button in the chat interface
- Image previews in chat messages
- Document link displays in chat messages with file icon and name

### File Types Support
**Images:**
- JPEG/JPG
- PNG
- GIF

**Documents:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- Text files (.txt)

## Setup Instructions

### Migration
To enable file attachments support, run the migration:
```
node run_file_attachments_migration.js
```

This adds the necessary columns to the `messages` table.

### Storage Bucket
A Supabase Storage bucket named `messages` must be created with appropriate permissions:
1. Navigate to the Supabase dashboard
2. Go to Storage section
3. Create a new bucket named `messages`
4. Set the following policies:
   - Allow authenticated users to upload files
   - Allow authenticated users to read files

If you have admin privileges, you can create the bucket programmatically:
```
node create_messages_bucket.js
```

## Usage

### Sending Files
1. Click the image button (🖼️) to send an image
2. Click the paperclip button (📎) to send a document
3. Select the file from your device
4. The file will be automatically uploaded and sent

### Viewing Files
- Images appear as thumbnails in the chat and can be clicked to view in full size
- Documents appear as links with file icons and can be clicked to download or view

## Security Considerations
- Only authenticated users can upload and access files
- File size is limited to 10MB to prevent abuse
- Only specific file types are allowed
- Each file has a unique filename to prevent overwriting

## Known Limitations
1. No progress indicator during file upload except for a simple loading state
2. No ability to cancel an in-progress upload
3. No direct preview for document files within the app

## Future Enhancements
1. Multiple file uploads at once
2. Drag and drop file upload support
3. In-app preview for PDF and other document types
4. Image compression before upload
5. Ability to delete sent file attachments 