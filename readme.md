# Jobly Project

A job application web app API project!

This is a Node Express app project that uses JSON API for requests and PostgreSQL for database storage.

- [Launch Project](#launch-project)
- [Using This App](#using-this-app)
- [Run Tests](#run-tests)
- [Nice To Have](#nice-to-have)
  - [Create a front-end interface!](#create-a-front-end-interface)
  - [Choosing Random Password](#choosing-random-password)
  - [Use enum Type](#use-enum-type)
  - [Add Technologies for Jobs](#add-technologies-for-jobs)
  - [Add Technologies for Users](#add-technologies-for-users)

# Launch project

First, create a database and seed it. Then launch your application with `nodemon`:

```console
psql -f jobly.sql
nodemon ./server.js
```

This will add tables and records needed for this project, then launch the application on localhost using port 3001.

# Using this app

To use this app, requests are made via cURL requests.

View the full Postman API documentation here: 
[Jobly API Documentation](https://documenter.getpostman.com/view/19076767/UzJFvdWG)

# Run tests
To run tests, run this command:
```console
jest --i
```

# Nice To Have

Features that would be nice-to-have. May add these at a later date:

### Create a front-end interface!

Create a front-end interface using React.

### Choosing Random Password

When admins add a user via the POST /users route (not the self-registration route), they should not provide a password.
Instead, the system will make a random password for the user (you can find third-party libraries that will generate excellent random passwords).
This route should continue to return the same information, so an admin can send the user that token to authenticate to the site, and the user can then change their password to something only known to them.

### Use enum Type

Change the state column in the applications table to be an enum that consists of ‘interested’, ‘applied’, ‘accepted’, ‘rejected’.

### Add Technologies for Jobs

Add a table for technologies which is a many to many with jobs (a job can require “Python” and “JavaScript”, and these technologies could be linked to many jobs).

### Add Technologies for Users

Make the technologies table a many to many with users as well and create an endpoint that matches users with jobs where the technologies are the same.
