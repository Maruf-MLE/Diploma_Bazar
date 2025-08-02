# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/37371f07-e1ce-4560-81a2-79c90a423435

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/37371f07-e1ce-4560-81a2-79c90a423435) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Authentication, Database, Storage)

## Recent Updates

### File Attachments in Messages (New Feature)
The messaging system now supports file attachments:

- **Image Sharing**: Users can now send images through the messaging interface
- **Document Sharing**: Support for sharing PDF, Word, Excel, PowerPoint, and text documents
- **Implementation Details**:
  - Files are securely stored in Supabase Storage
  - Size limit: 10MB per file
  - Supported document types: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX

**Note for Administrators:**  
To enable file attachments in messages, please ensure the following:

1. Run the migration: `node run_file_attachments_migration.js`
2. Create a storage bucket named "messages" in your Supabase dashboard
3. Set appropriate bucket policies for authenticated users to upload and read files

### Verification System

We've added a verification system to ensure secure transactions. Now only verified users can:
- Sell books
- Send messages to other users

For more details, see [VERIFICATION_SYSTEM.md](./VERIFICATION_SYSTEM.md)

### Rating System

We've implemented a transaction-based rating system to build trust among users. Now users can:
- Rate buyers/sellers after completing a transaction
- View ratings on user profiles
- Leave comments about their experience

For more details, see [RATING_SYSTEM.md](./RATING_SYSTEM.md)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/37371f07-e1ce-4560-81a2-79c90a423435) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Important Setup Instructions for File Attachments

To enable file attachments in messaging, you must create a storage bucket in Supabase:

1. **Create the Database Columns**:
   ```bash
   node run_file_attachments_migration.js
   ```
   This adds the necessary columns to the messages table.

2. **Create the Storage Bucket**:
   
   You must manually create a storage bucket in the Supabase dashboard:
   
   - Sign in to your Supabase dashboard at https://supabase.com/dashboard
   - Navigate to Storage section
   - Click "New Bucket"
   - Name the bucket `messages` (exactly this name)
   - Uncheck "Public bucket" option
   - Click "Create bucket"
   
3. **Set Bucket Policies**:

   After creating the bucket, add these policies:
   
   - Go to the "messages" bucket
   - Click "Policies"
   - Add a policy for authenticated users to upload files:
     - Policy name: "Allow authenticated users to upload files"
     - Allowed operations: SELECT, INSERT
     - Policy definition: `(auth.role() = 'authenticated')`
   
4. **Create Folders**:
   
   Create these folders inside the bucket:
   - `message_images/`
   - `message_documents/`

5. **Restart the Development Server**:
   ```bash
   npm run dev
   ```

Once these steps are completed, the file attachment feature will work properly.
