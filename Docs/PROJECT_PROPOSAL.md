# GymTrack CLI – Gym Membership Tracker

## Project Description
GymTrack CLI is a command-line based application developed using TypeScript and Node.js. It allows gym administrators to manage gym members, membership plans, subscriptions, and attendance records using simple CLI commands. The system stores data in a database and supports JSON-based backup and reporting.

The application is intentionally designed as a CLI-only system to focus on backend logic, database operations, file handling, and TypeScript type safety.

## Target Users
- Small gym owners
- Gym staff or administrators
- Fitness studios that do not require a graphical interface

## Problem Statement
Many small gyms rely on manual logs or spreadsheets to track memberships and attendance. This often leads to data inconsistency, missed membership expirations, and lack of proper backups. GymTrack CLI solves this by providing a structured, reliable, and easy-to-use command-line system.

## Key Features
1. Member Management – Add, view, update, and delete gym members
2. Membership Plan Management – Create and manage membership plans
3. Subscription Tracking – Assign plans to members and track expiration dates
4. JSON Backup & Restore – Export and import application data
5. (Optional) Attendance Logging – Record daily member check-ins

## Technology Stack
- TypeScript (Node.js runtime)
- SQLite database
- JSON files for backup and reporting
- npm packages:
  - sqlite3
  - commander
  - fs
- Development Toolz s:
  - Node.js
  - VS Code
