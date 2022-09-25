# api.eauw.org

An API gateway to facilitate automations and services relevant to our organization including adding emails to the mailing list, sending emails, tracking engagement, and contacting the leadership team. 

## Getting Started

### Requirements

#### Create a `.env` file

```sh
cp .env.example .env
```

#### Google Service Account Credentials

1. Create a new project in the Google Cloud Console.
2. Enable the Admin SDK API, the Google Spreadsheets API, and other APIs as needed.
3. Create a new service account and export the JSON credentials.
   - A valid JSON will have `"type": "service_account"` as the first key-value pair.
4. Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON.

> Note: API calls can only be made if the "subject" field in the body is set to an admin of the Google Workspace. Set `GOOGLE_WORKSPACE_ADMIN_ACCOUNT` to the email address of an admin in your workspace.

#### SMTP Credentials

Set the environment variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS`.

#### Set resources

1. Set the environment variable `SPREADSHEET_ID` to the ID of the Google Spreadsheet you'd like to append to.
2. Set the environment variable `GROUP_ID` to the ID of the Google Group you'd like to add members to.

#### Configure admin account for Bull Board access

Set the environment variables `BOARD_USER` and `BOARD_PASS` to a new user account that you would like to use to access the Bull Board dashboard where you'll be able to view and manage incoming requests. You can also set `BOARD_SECRET` to the secret string to be used for the Express session. The dashboard is available at `/admin`.

### Running

#### Option 1 — Using Docker (Preferred)

```sh
docker-compose build
```

```sh
docker-compose up
```

#### Option 2 — Using Node and `pm2`

```sh
npm i
```

```sh
npm i -g pm2
```

```sh
npm run build && pm2 start
```
