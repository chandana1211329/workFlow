const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    
    async sendEmailWithAttachment(managerEmail, submission) {
        try {
            // Read the generated document
            const documentPath = submission.documentPath;
            if (!fs.existsSync(documentPath)) {
                throw new Error('Document not found');
            }
            
            const mailOptions = {
                from: `"Document Generator" <${process.env.SMTP_USER}>`,
                to: managerEmail,
                subject: `Daily Work Summary – ${submission.internName} - ${submission.date}`,
                html: this.createEmailTemplate(submission),
                attachments: [
                    {
                        filename: path.basename(documentPath),
                        path: documentPath
                    }
                ]
            };
            
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return info;
            
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    
    createEmailTemplate(submission) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .info-item { margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Daily Work Summary Report</h1>
                        <p>${submission.companyName}</p>
                    </div>
                    
                    <div class="content">
                        <h2>New Submission from Intern</h2>
                        
                        <div class="info-item">
                            <strong>Intern Name:</strong> ${submission.internName}
                        </div>
                        
                        <div class="info-item">
                            <strong>Date:</strong> ${new Date(submission.date).toLocaleDateString()}
                        </div>
                        
                        <div class="info-item">
                            <strong>Task Title:</strong> ${submission.taskTitle}
                        </div>
                        
                        <div class="info-item">
                            <strong>Introduction:</strong><br>
                            ${submission.introduction}
                        </div>
                        
                        <div class="info-item">
                            <strong>Topics Covered:</strong><br>
                            ${Array.isArray(submission.topicsCovered) 
                                ? submission.topicsCovered.map(topic => `• ${topic}`).join('<br>')
                                : submission.topicsCovered}
                        </div>
                        
                        <p>The complete document is attached to this email.</p>
                        
                        <p style="margin-top: 30px;">
                            <a href="${process.env.APP_URL}/dashboard" 
                               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                View in Dashboard
                            </a>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This email was sent automatically from the Document Generator System.</p>
                        <p>&copy; ${new Date().getFullYear()} ${submission.companyName}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('Email server connection verified');
            return true;
        } catch (error) {
            console.error('Email server connection failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();