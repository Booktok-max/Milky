// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const brevo = require('@getbrevo/brevo');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BREVO_API_KEY = process.env.BREVO_API_KEY;
if (!BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY is missing in .env');
  process.exit(1);
}

// === Brevo Clients ===
const contactsApi = new brevo.ContactsApi();
contactsApi.authentications.apiKey.apiKey = BREVO_API_KEY;

const transactionalApi = new brevo.TransactionalEmailsApi();
transactionalApi.authentications.apiKey.apiKey = BREVO_API_KEY;

app.post('/api/contact', async (req, res) => {
  const { name, email, bookTitle = '', genre = '', message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  try {
    // 1. Add / update contact in Brevo
    const createContact = new brevo.CreateContact();
    createContact.email = email;
    createContact.attributes = {
      FIRSTNAME: name.split(' ')[0],
      LASTNAME: name.split(' ').slice(1).join(' ') || '',
      BOOKTITLE: bookTitle,
      GENRE: genre
    };
    createContact.listIds = [2];           // ← CHANGE TO YOUR ACTUAL LIST ID
    createContact.updateEnabled = true;    // update if email already exists

    await contactsApi.createContact(createContact);

    // 2. Email to you (the agency)
    const adminEmail = new brevo.SendSmtpEmail();
    adminEmail.subject = `New Inquiry: ${name} – ${genre || 'General'}`;
    adminEmail.htmlContent = `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Book Title:</strong> ${bookTitle || '—'}</p>
      <p><strong>Genre:</strong> ${genre || '—'}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${message}</p>
      <hr>
      <small>Sent via Atomic-Shelf website</small>
    `;
    adminEmail.sender = { name: 'Atomic-Shelf Website', email: 'noreply@atomic-shelf.com' }; // must be verified in Brevo
    adminEmail.to = [{ email: 'nick@atomic-shelf.com', name: 'Nick' }];
    // adminEmail.cc = [{ email: 'powerpages30@gmail.com' }]; // uncomment if you want

    await transactionalApi.sendTransacEmail(adminEmail);

    // 3. Thank-you email to the user
    const thankYou = new brevo.SendSmtpEmail();
    thankYou.subject = 'Thank you – Atomic-Shelf';
    thankYou.htmlContent = `
      <h2>Thank you, ${name.split(' ')[0]}!</h2>
      <p>We have received your message about <strong>${bookTitle || 'your book'}</strong>.</p>
      <p>Our team will review it and reply within 24 hours.</p>
      <p>Best regards,<br><strong>Atomic-Shelf Team</strong></p>
    `;
    thankYou.sender = { name: 'Atomic-Shelf', email: 'noreply@atomic-shelf.com' };
    thankYou.to = [{ email: email, name: name }];

    await transactionalApi.sendTransacEmail(thankYou);

    res.json({ success: true, message: 'Thank you! Your message has been sent.' });

  } catch (error) {
    console.error('Brevo error:', error.body || error);
    res.status(500).json({ 
      error: 'Something went wrong. Please try again or email us directly at nick@atomic-shelf.com.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Brevo contact server running on http://localhost:${PORT}`);
  console.log('   → POST to /api/contact');
});