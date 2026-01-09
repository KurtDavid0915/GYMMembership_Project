
---

# 📄 `TECHNICAL_SPECS.md`

```md
# Technical Specifications

## Functional Requirements
- The system shall allow users to add, update, delete, and list members
- The system shall manage membership plans with duration and pricing
- The system shall assign membership subscriptions to members
- The system shall prevent check-in for expired memberships (Optional)
- The system shall export and import data using JSON files

## Non-Functional Requirements
- The application must run in a Node.js environment
- All logic must be written in TypeScript
- Proper error handling must be implemented
- Input validation must be enforced
- Data must persist in a database

## File Structure
- src/cli – CLI parsing logic
- src/commands – Individual command handlers
- src/services – Business logic
- src/database – Database connection and queries
- src/models – Data models
- src/utils – Helper utilities
- data/ – JSON files

## API / Interface Design
- addMember(name, phone, email)
- addPlan(name, duration, price)
- subscribeMember(memberId, planId)
- checkIn(memberId)
- exportData()
- importData(filePath)
