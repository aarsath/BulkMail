import * as XLSX from 'xlsx';
import axios from 'axios';
import { useState } from 'react';

// local backend by default — change to your deployed backend URL when you host it
const API_BASE = 'https://bulkmail-l71v.onrender.com';

function App() {
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [status, setStatus] = useState(false);
  const [Emailslist, setEmailslist] = useState([]);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const totalEmails = jsonData
        .map((row) => row[0])
        .filter((cell) => typeof cell === 'string' && cell.includes('@'));
      setEmailslist(totalEmails);
    };
    reader.readAsBinaryString(file);
  }

  function validate() {
    if (!subject.trim()) return 'Please enter a subject';
    if (!emailContent.trim()) return 'Please enter the email content';
    if (Emailslist.length === 0) return 'Please upload a file with recipient emails';
    return null;
  }

  async function submit() {
    const error = validate();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    setStatus(true);
    setMessage(null);

    try {
      const { data } = await axios.post(`${API_BASE}/sendemail`, {
        subject,
        msg: emailContent,
        Emailslist,
      });

      if (data.success) {
        setMessage({
          type: 'success',
          text: `${data.successCount} email(s) sent successfully${
            data.failedCount ? `, ${data.failedCount} failed` : ''
          }.`,
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send email' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Server error, please try again',
      });
    } finally {
      setStatus(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/history`);
      setHistory(data.data || []);
      setShowHistory(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not load email history' });
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="bg-blue-950 text-white text-center">
        <h1 className="text-2xl md:text-3xl font-medium py-2 px-2">Bulk Mail</h1>
      </div>
      <div className="bg-blue-900 text-white text-center">
        <h1 className="font-medium py-2 px-2">
          We can help your business with sending multiple emails at once....!
        </h1>
      </div>
      <div className="bg-blue-600 text-white text-center">
        <h1 className="font-medium py-2 px-2">Drop and Drag</h1>
      </div>

      <div className="bg-blue-400 text-center py-8 px-4">
        <input
          className="bg-white w-full max-w-6xl p-2 border border-black-500 rounded-md text-black mb-4"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="bg-white w-full max-w-6xl h-30 p-2 border border-black-500 rounded-md text-black"
          placeholder="Enter the email content here..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        ></textarea>

        <div>
          <input
            type="file"
            onChange={handleFileChange}
            className="border-4 border-white border-dashed py-4 px-4 mt-5 mb-5"
          />
          <p>Total Emails in the file: {Emailslist.length}</p>

          <button
            onClick={submit}
            disabled={status}
            className="bg-blue-950 text-white py-2 px-4 rounded-md mt-5 mb-5 disabled:opacity-50"
          >
            {status ? 'Sending...' : 'Send'}
          </button>

          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="bg-white text-blue-950 py-2 px-4 rounded-md mt-5 mb-5 ml-3"
          >
            {historyLoading ? 'Loading...' : 'View History'}
          </button>
        </div>

        {message && (
          <p
            className={
              message.type === 'success'
                ? 'text-green-800 font-semibold mt-2'
                : 'text-red-800 font-semibold mt-2'
            }
          >
            {message.text}
          </p>
        )}
      </div>

      {showHistory && (
        <div className="bg-blue-100 p-6 text-left">
          <h2 className="text-xl font-semibold mb-3">Email History</h2>
          {history.length === 0 && <p>No emails sent yet.</p>}
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h._id} className="bg-white p-3 rounded-md shadow">
                <p className="font-medium">{h.subject}</p>
                <p className="text-sm text-gray-600">{new Date(h.sentAt).toLocaleString()}</p>
                <p className="text-sm">
                  Status:{' '}
                  <span
                    className={
                      h.status === 'success'
                        ? 'text-green-700'
                        : h.status === 'partial'
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }
                  >
                    {h.status}
                  </span>
                </p>
                <p className="text-sm">
                  Recipients: {h.recipients.length} ({h.successCount} sent
                  {h.failedRecipients?.length ? `, ${h.failedRecipients.length} failed` : ''})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
