# System Design Documentation

## Application Architecture
GymTrack CLI follows a modular architecture consisting of:
- CLI Command Layer
- Service Layer
- Database Access Layer
- JSON File Handler
- Utility & Validation Layer

The CLI receives user commands, validates input, executes business logic, interacts with the database, and outputs results to the console.

## Component Interaction
1. User enters a CLI command
2. Command parser validates input
3. Service layer processes business logic
4. Database layer performs CRUD operations
5. Results are displayed in the terminal

## Database Schema Design

### Members
- id (PK)
- full_name
- phone
- email
- join_date

### MembershipPlans
- id (PK)
- name
- duration_days
- price

### MemberSubscriptions
- id (PK)
- member_id (FK)
- plan_id (FK)
- start_date
- end_date
- status

### Attendance (Optional)
- id (PK)
- member_id (FK)
- check_in_date

## Data Flow Overview
User Command → Validation → Business Logic → Database → Console Output

## JSON File Structure

### backup.json
Purpose: Full database backup

```json
{
  "members": [],
  "plans": [],
  "subscriptions": [],
  "attendance": []
}
