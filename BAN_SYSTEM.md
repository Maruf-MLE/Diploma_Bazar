# User Ban System Documentation

## Overview

The User Ban System allows administrators to ban users who violate platform rules. When a user is banned, they will be:

1. Prevented from accessing most parts of the application
2. Redirected to a ban information page explaining their ban status
3. Unable to use platform features until the ban is lifted
4. **Automatically logged out** if they are currently using the system when banned

## Features

- **Ban Duration Options**: Temporary (7, 30, 90 days) or permanent bans
- **Ban Reason Tracking**: Record and display reasons for banning
- **Automatic Expiration**: Temporary bans automatically expire
- **Admin Interface**: Easy-to-use interface for managing bans
- **Appeal Information**: Users can see how to appeal their ban
- **Real-time Ban Detection**: System automatically detects when a user is banned while they're using the application
- **Automatic Logout**: Users are automatically logged out when banned, with a notification explaining why

## Technical Implementation

### Database Structure

The system uses a `user_ban_status` table with the following structure:

| Column         | Type                   | Description                              |
|----------------|------------------------|------------------------------------------|
| user_id        | UUID                   | Primary key, references auth.users(id)   |
| is_banned      | BOOLEAN                | Whether the user is currently banned     |
| banned_at      | TIMESTAMP WITH TIME ZONE | When the user was banned                 |
| banned_by      | TEXT                   | ID of admin who banned the user          |
| ban_reason     | TEXT                   | Reason for ban                           |
| ban_expires_at | TIMESTAMP WITH TIME ZONE | When the ban expires (null = permanent)  |
| created_at     | TIMESTAMP WITH TIME ZONE | Record creation timestamp                |
| updated_at     | TIMESTAMP WITH TIME ZONE | Record update timestamp                  |

### SQL Functions

1. `is_user_banned(user_id)`: Checks if a user is banned
2. `ban_user(target_user_id, ban_status, ban_reason, ban_duration, admin_id)`: Bans or unbans a user

### Frontend Components

1. `BannedUserPage.tsx`: Displays ban information to banned users
2. `BannedUserCheck` component in `App.tsx`: Redirects banned users
3. Ban status checking in `AuthContext.tsx`: Checks ban status on login/session
4. `useBanStatusListener` hook: Sets up real-time listener for ban status changes

## User Flow

### For Banned Users

1. User attempts to log in
2. System checks ban status
3. If banned, user is redirected to the ban information page
4. Ban page shows reason, duration, and appeal information

### For Users Banned While Active

1. User is actively using the system
2. Admin bans the user from the admin panel
3. Real-time listener detects the ban status change
4. System shows a notification to the user
5. User is automatically logged out and redirected to the ban page
6. Ban page shows reason, duration, and appeal information with a message explaining they were automatically logged out

### For Admins

1. Admin views user reports in the admin panel
2. Admin selects a user to ban
3. Admin sets ban duration and reason
4. System records the ban and applies it immediately
5. If user is currently active, they are automatically logged out

## Setup Instructions

1. Run the SQL migrations to create the necessary tables and functions
2. Apply the JavaScript changes to implement the ban system
3. Test the system by banning and unbanning a test user

## API Reference

### `checkUserBanStatus(userId)`

Checks if a user is banned and returns ban information.

```typescript
async function checkUserBanStatus(userId: string) {
  // Returns { isBanned: boolean, banInfo: object | null, error: Error | null }
}
```

### `checkAndUpdateBanStatus(userId)`

Checks ban status and updates expired bans.

```typescript
async function checkAndUpdateBanStatus(userId: string) {
  // Returns { isBanned: boolean, banInfo: object | null }
}
```

### `useBanStatusListener()`

React hook that sets up a real-time listener for ban status changes.

```typescript
function useBanStatusListener() {
  // Sets up Supabase realtime subscription for ban status changes
}
```

## Troubleshooting

### Common Issues

1. **Ban not applying**: Check database permissions and RLS policies
2. **Ban not expiring**: Verify the date handling in the code
3. **Redirect not working**: Check the BannedUserCheck component in App.tsx
4. **Real-time updates not working**: Ensure Supabase realtime is properly configured

### Debugging

Enable console logging by setting `DEBUG_BAN_SYSTEM=true` in the environment variables.

## Security Considerations

1. All ban operations are protected by RLS policies
2. Only admins can ban/unban users
3. Users can only view their own ban status
4. Real-time updates are scoped to the user's own ban status 