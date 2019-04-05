# Sails hook
### Install
```cli
npm install git+ssh://git@code.qpard.com:easyscat/sailsjs-data-table.git
```


### Example usage
```postman
/organizations/data-table?where={ "users": {"in": [1,2]}, "users.firstName": "Serhii"}
/organizations/data-table?where={ "users": {"in": [1,2]}}
/organizations/data-table?where={ "users.firstName": "Serhii"}
/organizations/data-table?where={"name": "p2h"}
```