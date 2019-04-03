# Sails hook
### Example
```postman
/organizations/data-table?where={ "users": {"in": [1,2]}, "users.firstName": "Serhii"}
/organizations/data-table?where={ "users": {"in": [1,2]}}
/organizations/data-table?where={ "users.firstName": "Serhii"}
```