# Standalone MFA with CIC (Auth0)

This is plain vanilla **JavaScript** and **HTML** sample implementation of a standalone MFA scenario using **Okta Customer Identity Cloud (Auth0)**.

**Scenario:**
The application uses its own login process. After primary authentication, it calls Auth0 API for MFA and obtains Auth0 ID and access tokens. In the sample, primary authentication is done from `users.json` file that holds user credentials. In practical use cases, it would possibly use an LDAP, database, or a legacy identity providers.

## Generate a keypair for signed token

## Configure Auth0 connection

## Configure an CIC Application

## Deploy Sample Application

Install [Node.js](https://nodejs.org/en/download/) on the system

Move to the App directory - `cd Standalone-MFA/`

Run - `npm install`

Run - `node app.js`

Access the application at - [http://localhost:3000](http://localhost:3000)