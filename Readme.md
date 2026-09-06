# Bulk Mail 📧 (Fixed Version)

A full-stack MERN app to send bulk emails, with email history stored in MongoDB.

## What's new in this fixed version
- ✅ Subject field added on the frontend
- ✅ Sent emails now get saved in MongoDB (`email_history` collection: subject, body, recipients, status, success/fail counts, timestamp)
- ✅ `GET /history` API + a "View History" button on the frontend
- ✅ Input validation (subject/body/recipient checks, email format filtering)
- ✅ Proper error handling with HTTP status codes and JSON messages
- ✅ MongoDB URI moved out of source code into `.env` (never commit `.env`)

## Setup

### 1. Backend
```bash
cd Backend
npm install
cp .env.example .env
# edit .env and put your real MongoDB connection string
node index.js
```
Runs on `http://localhost:5000`.

Your MongoDB `bulkmail` collection still needs one document with your Gmail credentials:
```json
{ "user": "your-email@gmail.com", "pass": "your-16-character-app-password" }
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. It talks to `http://localhost:5000` by default — change `API_BASE` in `src/App.jsx` when you deploy the backend elsewhere.

## Usage
1. Enter a **Subject**.
2. Enter the **email body**.
3. Upload an Excel/CSV file with recipient emails in the first column.
4. Click **Send**.
5. Click **View History** to see previously sent emails and their status.

## Security note
⚠️ Rotate your Gmail app password and MongoDB credentials if they were ever committed to a public repo, and make sure `.env` is in `.gitignore` (it already is in `Backend/.gitignore`).
