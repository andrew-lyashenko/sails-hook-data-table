# Sails hook
### Install
```cli
npm i git+https://kube.gitlab.p2h.com/sails-js/data-table.git
```

OR

```json
  "dependencies": {
    "sails-hook-data-table": "git+https://kube.gitlab.p2h.com/sails-js/data-table.git"
  }
```

### Example usage
```postman
/organizations/data-table?where={ "users": {"in": [1,2]}, "users.firstName": "Serhii"}
/organizations/data-table?where={ "users": {"in": [1,2]}}
/organizations/data-table?where={ "users.firstName": "Serhii"}
/organizations/data-table?where={"name": "p2h"}
```