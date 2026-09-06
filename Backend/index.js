require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; // put your real connection string in Backend/.env, NEVER hardcode it here

if (!MONGO_URI) {
  console.error('MONGO_URI is missing. Create a Backend/.env file (see .env.example).');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// ---- Admin Gmail credentials (same collection as before) ----
const authSchema = new mongoose.Schema(
  {
    user: String,
    pass: String,
  },
  { strict: false }
);
const Authentication = mongoose.model('Authentication', authSchema, 'bulkmail');

// ---- NEW: every bulk send gets logged here ----
const emailRecordSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  recipients: { type: [String], required: true },
  status: { type: String, enum: ['success', 'partial', 'failed'], default: 'failed' },
  successCount: { type: Number, default: 0 },
  failedRecipients: { type: [String], default: [] },
  sentAt: { type: Date, default: Date.now },
});
const EmailRecord = mongoose.model('EmailRecord', emailRecordSchema, 'email_history');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/sendemail', async (req, res) => {
  const { subject, msg, Emailslist } = req.body;

  // ---- validation ----
  if (!subject || !subject.trim()) {
    return res.status(400).json({ success: false, message: 'Subject is required' });
  }
  if (!msg || !msg.trim()) {
    return res.status(400).json({ success: false, message: 'Email body is required' });
  }
  if (!Array.isArray(Emailslist) || Emailslist.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one recipient email is required' });
  }

  const validRecipients = Emailslist.filter(
    (e) => typeof e === 'string' && emailRegex.test(e.trim())
  ).map((e) => e.trim());

  if (validRecipients.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid email addresses found in the list' });
  }

  try {
    const creds = await Authentication.findOne();
    if (!creds || !creds.user || !creds.pass) {
      return res.status(500).json({ success: false, message: 'Admin mail credentials are not configured in the database' });
    }

   const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, 
  auth: { user: creds.user, pass: creds.pass },
});
    let successCount = 0;
    const failedRecipients = [];

    for (const recipient of validRecipients) {
      try {
        await transporter.sendMail({
          from: creds.user,
          to: recipient,
          subject,
          text: msg,
        });
        successCount++;
        console.log(`Email sent to ${recipient}`);
      } catch (err) {
        console.error(`Failed to send to ${recipient}:`, err.message);
        failedRecipients.push(recipient);
      }
    }

    const status =
      successCount === validRecipients.length ? 'success' : successCount > 0 ? 'partial' : 'failed';

    // ---- save the record so it shows up in history ----
    const record = await EmailRecord.create({
      subject,
      body: msg,
      recipients: validRecipients,
      status,
      successCount,
      failedRecipients,
    });

    return res.status(200).json({
      success: successCount > 0,
      status,
      successCount,
      failedCount: failedRecipients.length,
      failedRecipients,
      recordId: record._id,
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending emails' });
  }
});

// ---- NEW: fetch sent email history ----
app.get('/history', async (req, res) => {
  try {
    const records = await EmailRecord.find().sort({ sentAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Could not fetch history' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
