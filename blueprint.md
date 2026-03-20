# Project Blueprint

## Overview

This document outlines the blueprint of the Next.js application, including its structure, features, and design.

## Initial Setup & Error Fix

### Purpose & Capabilities

The primary purpose of this Next.js application is to provide a modern, visually appealing, and interactive user experience.

### Implemented Features, Styles, and Design

*   **Framework:** Next.js with App Router
*   **Styling:** Tailwind CSS for styling, with `tw-animate-css` for animations.
*   **UI Components:** A rich set of UI components from `radix-ui` and other libraries.
*   **Theme:** A dark theme with a custom color palette.
*   **Fonts:** `Geist` font for both sans-serif and monospace.

## Firebase Integration & Linter Fixes

### Purpose & Capabilities

This section addresses the Firebase integration and linter errors that were encountered.

### Implemented Features, Styles, and Design

*   **Firebase Configuration:** Created a `.env.local` file to securely store Firebase credentials.
*   **Linter Fixes:** Resolved an error in `components/ui/sidebar.tsx` by replacing the use of `Math.random()` with a fixed value.
*   **Firebase Database Rules:** Created a `database.rules.json` file to allow public read and write access to the database.

## Visitor Control Enhancement

### Purpose & Capabilities

This section outlines the enhancements made to the visitor control feature.

### Implemented Features, Styles, and Design

*   **Added New Fields:** The visitor control now includes fields for "Nota Fiscal", "Placa", and "Observações".
*   **Updated UI:** The form for adding new visitors and the table for displaying visitor data have been updated to include the new fields.
*   **Date Display:** The visitor table now displays the entry date along with the entry and exit times.

## Authentication with Firebase

### Purpose & Capabilities

This section details the implementation of a secure authentication system using Firebase Authentication, restricting access to the main dashboard.

### Implemented Features, Styles, and Design

*   **Login Page:** A new, dedicated login page was created at `/app/login/page.tsx`, featuring a clean and modern UI consistent with the application's design.
*   **Firebase Configuration:** A central Firebase configuration file was established at `lib/firebase.ts` to initialize and export Firebase services, including Authentication and Realtime Database.
*   **Authentication Hook (`useAuth`):** A custom React hook, `hooks/use-auth.tsx`, was developed to manage the global authentication state. It provides the user object, loading status, and `login`/`logout` functions.
*   **Global Auth Provider:** The entire application is wrapped with an `AuthProvider` in `app/layout.tsx` to make the authentication context available to all components.
*   **Route Protection:** The main dashboard page (`/app/page.tsx`) is now a protected route. The `useAuth` hook checks for an authenticated user, and the `AuthProvider` automatically redirects unauthenticated users to the `/login` page.

### Plan and Steps for the Current Change

1.  **Install Dependencies:** The `firebase-admin` package was installed to handle server-side authentication tasks in the future.
2.  **Create Login Page:** The file `app/login/page.tsx` was created with a form for email and password, including input validation and error handling.
3.  **Configure Firebase:** The `lib/firebase.ts` file was created to initialize the Firebase app using environment variables.
4.  **Create `useAuth` Hook:** The `hooks/use-auth.tsx` file was implemented to create an `AuthContext` and a `useAuth` hook, handling user state changes with `onAuthStateChanged` and providing `signInWithEmailAndPassword` and `signOut` functionalities.
5.  **Implement `AuthProvider`:** The root layout (`app/layout.tsx`) was wrapped with the `AuthProvider` to provide global access to the authentication context.
6.  **Secure Dashboard:** The dashboard page (`app/page.tsx`) was modified to use the `useAuth` hook, displaying a loading state and protecting the content from unauthenticated access.
