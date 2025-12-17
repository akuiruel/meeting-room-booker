# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

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
- Firebase (Firestore & Authentication)

## Firebase Setup

This project uses Firebase for database and authentication. To set up Firebase:

### 1. Firestore Database Structure

Create the following collections in your Firestore database:

**`bookings` collection:**
```
{
  booking_date: string (YYYY-MM-DD),
  usage_date: string (YYYY-MM-DD),
  room: string ('ruang_diskusi_1' | 'ruang_diskusi_2' | 'ruang_diskusi_3'),
  booker_name: string,
  department: string ('PRTH' | 'DIRI' | 'SETTAMA' | 'PUSDATIN' | 'LAINNYA'),
  participant_count: number,
  start_time: string (HH:MM),
  end_time: string (HH:MM),
  notes: string (optional),
  status: string ('confirmed' | 'cancelled'),
  created_at: timestamp,
  updated_at: timestamp
}
```

**`user_roles` collection (for admin access):**
```
{
  // Document ID should be the user's UID
  role: string ('admin' | 'user')
}
```

### 2. Create Composite Indexes

Go to Firebase Console > Firestore Database > Indexes and create these composite indexes:

1. **For booking queries by date:**
   - Collection: `bookings`
   - Fields: `status` (Ascending), `usage_date` (Ascending), `start_time` (Ascending)

2. **For all bookings:**
   - Collection: `bookings`
   - Fields: `usage_date` (Descending), `start_time` (Ascending)

3. **For availability check:**
   - Collection: `bookings`
   - Fields: `usage_date` (Ascending), `room` (Ascending), `status` (Ascending)

### 3. Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    match /user_roles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only admins can write via Firebase Console
    }
  }
}

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
