# Testing Plan

## Test Scenarios
- Member creation and deletion
- Membership expiration handling
- Attendance check-in validation
- JSON backup and restore

## Test Cases

### Member Management
1. Add a valid member → Success
2. Add member with missing name → Error
3. Delete non-existing member → Error

### Subscription 
1. Active member check-in → Allowed
2. Expired member check-in → Denied
3. Subscription expiration detection → Correct

### JSON Handling
1. Export data → JSON file created
2. Import valid JSON → Database restored
3. Import invalid JSON → Error handled

## Testing Approach
- Manual CLI testing
- Validation of console output
- Edge-case testing
