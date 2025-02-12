# SnipShare

SnipShare is a web application for sharing code snippets in an easy, fast and secure way.
It allows developers to send a code snippet to others simply  by saving it in the application, which in
turn returns a unique identifier in the form of a URL. 
Developers share this URL instead of the actual code snippet, enabling recipients to view it and comment it 
through the application.

## Pre-requisites

The application requires the installation of a MySQL database that stores the code snippets and their relevant details. 

## How to run 

SnipShare can be executed as a standalone web application using NodeJs, or through Docker.
Before running the application it is required to configure: 
(a) the connection details for MySQL and 
(b) the base URL of the application. 

To configure the connection details for MySQL, edit the file [server.js](server.js) by editing the constant value `db` that 
contains all the required connection details for MySQL. 
More specifically, the following values are needed: 
```
const db=mysql.createConnection({
   host: '1.2.3.4'
   user: 'mysql_username'
   password: 'mysql_password'
   database: 'snipshare_database'
   port: 3306
});
```

Moreover, a series of resources 

### Configuration 

### Using NodeJs

### Using Docker
