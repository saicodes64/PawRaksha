const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // This will serve your HTML files

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });  

// Configure email transporter (you'll need to add your email credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or another service like Outlook
  auth: {
    user: 'example@gmail.com', // Replace with your email
    pass: 'xxxxxxxxxxxxxxxx' // Use app password for Gmail
  }
});

// API endpoint to send reminder emails
app.post('/api/send-reminder', async (req, res) => {
  const { petName, ownerEmail, reminderText, reminderTime } = req.body;
  
  try {
    // Format the date for email
    const reminderDate = new Date(reminderTime);
    const formattedDate = reminderDate.toLocaleString();
    
    // Send email
    await sendReminderEmail(petName, ownerEmail, reminderText, formattedDate);
    
    res.json({ success: true, message: 'Reminder email sent successfully' });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    res.status(500).json({ success: false, message: 'Failed to send reminder email' });
  }
});

// API endpoint to generate and send bill
app.post('/api/generate-pet-bill', async (req, res) => {
  const { ownerName, email, petName, petType, vaccineType, price, date } = req.body;
  
  if (!ownerName || !email || !petName || !vaccineType || !price) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Generate the PDF bill
    const pdfPath = await generatePetBill(ownerName, petName, petType, vaccineType, price, date);
    
    // Send the bill via email
    await sendBillEmail(ownerName, email, petName, vaccineType, pdfPath);
    
    // Remove the temporary PDF file
    fs.unlinkSync(pdfPath);
    
    res.json({ success: true, message: 'Bill generated and sent successfully' });
  } catch (error) {
    console.error('Error generating or sending bill:', error);
    res.status(500).json({ success: false, message: 'Failed to generate or send bill' });
  }
});

// Function to send reminder emails
async function sendReminderEmail(petName, email, reminderText, formattedDate) {
  const mailOptions = {
    from: 'example@gmail.com',
    to: email,
    subject: `Pet Care Reminder for ${petName}`,
    html: `
      <h2>Pet Care Reminder</h2>
      <p>Hello,</p>
      <p>This is a friendly reminder about your pet ${petName}:</p>
      <p><strong>${reminderText}</strong> - scheduled for ${formattedDate}</p>
      <p>Please make sure to take care of this important task for your pet's wellbeing.</p>
      <p>Best regards,<br>Your Pet Wellness Team</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Function to generate PDF bill
async function generatePetBill(ownerName, petName, petType, vaccineType, price, date) {
  return new Promise((resolve, reject) => {
    try {
      const billDate = date || new Date().toISOString().split('T')[0];
      const invoiceNumber = 'PET-INV-' + Date.now();
      const pdfPath = path.join(__dirname, 'bills', `${invoiceNumber}.pdf`);
      
      // Ensure bills directory exists
      if (!fs.existsSync(path.join(__dirname, 'bills'))) {
        fs.mkdirSync(path.join(__dirname, 'bills'));
      }
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(pdfPath);
      
      doc.pipe(writeStream);
      
      // Add content to PDF
      doc.fontSize(25).text('PET CARE INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
      doc.text(`Date: ${billDate}`);
      doc.moveDown();
      doc.text(`Owner Name: ${ownerName}`);
      doc.text(`Pet Name: ${petName}`);
      doc.text(`Pet Type: ${petType}`);
      doc.moveDown();
      doc.text('Service Details:');
      doc.text(`Vaccine Type: ${vaccineType}`);
      doc.text(`Price: ₹${price}`);
      doc.moveDown();
      doc.text(`Total Amount: ₹${price}`);
      doc.moveDown(2);
      doc.text('Thank you for choosing our pet wellness services!', { align: 'center' });
      
      // Finalize the PDF
      doc.end();
      
      writeStream.on('finish', () => {
        resolve(pdfPath);
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to send bill email with attachment
async function sendBillEmail(ownerName, email, petName, vaccineType, pdfPath) {
  const mailOptions = {
    from: 'example@gmail.com',
    to: email,
    subject: `Pet Vaccination Bill for ${petName}`,
    html: `
      <h2>Hello ${ownerName},</h2>
      <p>Thank you for getting your pet ${petName} vaccinated with ${vaccineType}.</p>
      <p>Please find your bill attached to this email.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Your Pet Wellness Team</p>
    `,
    attachments: [
      {
        filename: 'pet-vaccination-bill.pdf',
        path: pdfPath,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
