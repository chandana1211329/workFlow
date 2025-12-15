const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Import modules
const emailService = require('./emailService');
const documentGenerator = require('./documentGenerator');
const Submission = require('./models/Submission');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const { authenticateToken, requireAdmin, requireIntern } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/document-generator')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/home', (req, res) => {
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document Generator</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff}
    .navbar{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:rgba(255,255,255,.10);backdrop-filter:blur(10px)}
    .brand{font-weight:700;letter-spacing:.2px}
    .links{display:flex;gap:12px;align-items:center}
    a{color:#fff;text-decoration:none}
    .btn{display:inline-block;padding:10px 14px;border-radius:8px;font-weight:600}
    .btn-outline{border:2px solid rgba(255,255,255,.9)}
    .btn-primary{background:#3498db;border:2px solid #3498db}
    .hero{max-width:1100px;margin:0 auto;padding:56px 24px;display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:center}
    h1{margin:0 0 10px;font-size:44px;line-height:1.1}
    h2{margin:0 0 14px;font-size:20px;font-weight:600;opacity:.95}
    p{margin:0 0 22px;opacity:.9}
    .card{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-radius:14px;overflow:hidden}
    .img{width:100%;height:260px;object-fit:cover;display:block}
    @media(max-width:900px){.hero{grid-template-columns:1fr}.img{height:220px}}
  </style>
</head>
<body>
  <div class="navbar">
    <div class="brand">WorkFlow Pro</div>
    <div class="links">
      <a class="btn btn-outline" href="/user-login.html">User Login</a>
      <a class="btn btn-primary" href="/admin-login.html">Admin Login</a>
    </div>
  </div>
  <div class="hero">
    <div>
      <h1>Document Generator</h1>
      <h2>Daily Work Summary Automation System</h2>
      <p>Submit your daily work summary in seconds and generate professional documents automatically.</p>
      <div class="links">
        <a class="btn btn-primary" href="/user-login.html">User Login</a>
        <a class="btn btn-outline" href="/admin-login.html">Admin Login</a>
      </div>
    </div>
    <div class="card">
      <img class="img" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80" alt="Document Automation" />
    </div>
  </div>
</body>
</html>`);
});

app.get('/', (req, res) => {
    res.redirect('/home');
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend'), { index: false }));

// Create necessary directories
const directories = ['uploads', 'generated_docs'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Routes
app.use('/api/auth', authRoutes);

// Protected routes
app.post('/api/submit', authenticateToken, requireIntern, upload.single('screenshot'), async (req, res) => {
    try {
        console.log('=== SUBMISSION REQUEST ===');
        console.log('User:', req.user.email, req.user.role);
        console.log('Form data:', req.body);
        console.log('File:', req.file ? req.file.originalname : 'No file');
        
        const formData = req.body;
        
        // Add user information to submission
        formData.userId = req.user._id;
        formData.userEmail = req.user.email;
        formData.userName = `${req.user.firstName} ${req.user.lastName}`;
        
        // If there's a file, add its path to formData
        if (req.file) {
            formData.screenshot = req.file.path;
        }
        
        console.log('Processing topicsCovered:', formData.topicsCovered);
        
        // Generate document
        const documentPath = await documentGenerator.generatePDF(formData);
        console.log('Document generated at:', documentPath);
        
        // Store submission in MongoDB
        const submission = new Submission({
            userId: req.user._id,
            userEmail: req.user.email,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            internName: formData.internName,
            date: formData.date,
            taskTitle: formData.taskTitle,
            companyName: formData.companyName,
            introduction: formData.introduction,
            topicsCovered: Array.isArray(formData.topicsCovered) ? formData.topicsCovered : formData.topicsCovered.split(',').map(t => t.trim()),
            practiceExamples: formData.practiceExamples,
            screenshot: formData.screenshot,
            documentPath: documentPath,
            status: 'generated'
        });
        
        await submission.save();
        console.log('Submission saved to MongoDB with ID:', submission._id);
        
        // Emit real-time update to admin clients
        emitNewSubmission(submission);
        
        res.json({
            success: true,
            message: 'Document generated successfully',
            documentUrl: `/api/download/${path.basename(documentPath)}`,
            submissionId: submission._id
        });
        
    } catch (error) {
        console.error('Error in submission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate document'
        });
    }
});

app.post('/api/send-email', authenticateToken, async (req, res) => {
    try {
        const { submissionId, managerEmail } = req.body;
        
        // Find submission
        const submissions = JSON.parse(fs.readFileSync('submissions.json', 'utf8') || '[]');
        const submission = submissions.find(s => s.id === submissionId);
        
        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }
        
        // Only admins can send emails or users can send their own submissions
        if (req.user.role !== 'admin' && submission.userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // Send email with attachment
        const emailResult = await emailService.sendEmailWithAttachment(
            managerEmail || process.env.MANAGER_EMAIL,
            submission
        );
        
        res.json({
            success: true,
            message: 'Email sent successfully',
            emailId: emailResult.messageId
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send email'
        });
    }
});

app.get('/api/submissions', authenticateToken, async (req, res) => {
    try {
        let submissions;
        if (req.user.role === 'admin') {
            // Admins can see all submissions
            submissions = await Submission.find({}).populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
        } else {
            // Interns can only see their own submissions
            submissions = await Submission.find({ userId: req.user._id }).sort({ createdAt: -1 });
        }
        
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch submissions'
        });
    }
});

app.get('/api/download/:filename', authenticateToken, async (req, res) => {
    const filePath = path.join(__dirname, 'generated_docs', req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({
            success: false,
            error: 'File not found'
        });
    }
});

app.get('/api/uploads/:filename', async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({
            success: false,
            error: 'Image not found'
        });
    }
});

app.delete('/api/submissions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const submissionId = req.params.id;
        console.log('=== DELETE SUBMISSION ===');
        console.log('Deleting submission:', submissionId);
        
        // Find the submission first
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }
        
        // Delete the associated document file if it exists
        if (submission.documentPath) {
            try {
                const filePath = path.join(__dirname, '..', submission.documentPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('Document file deleted:', filePath);
                }
            } catch (fileError) {
                console.error('Error deleting document file:', fileError);
            }
        }
        
        // Delete the screenshot file if it exists
        if (submission.screenshot) {
            try {
                if (fs.existsSync(submission.screenshot)) {
                    fs.unlinkSync(submission.screenshot);
                    console.log('Screenshot file deleted:', submission.screenshot);
                }
            } catch (fileError) {
                console.error('Error deleting screenshot file:', fileError);
            }
        }
        
        // Delete the submission from MongoDB
        await Submission.findByIdAndDelete(submissionId);
        console.log('Submission deleted from MongoDB:', submissionId);
        
        res.json({
            success: true,
            message: 'Submission deleted permanently'
        });
        
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete submission'
        });
    }
});

// Real-time update notification system
const adminClients = new Set();

// Function to emit new submission to admin clients
function emitNewSubmission(submission) {
    console.log('=== EMITTING NEW SUBMISSION TO ADMIN CLIENTS ===');
    console.log('Active admin clients:', adminClients.size);
    
    // Notify all connected admin clients
    adminClients.forEach(clientId => {
        // In a real implementation, you'd use WebSocket or Server-Sent Events
        // For now, we'll use a simple polling approach
        console.log('Notifying admin client:', clientId);
    });
}

// Endpoint for admin clients to register for real-time updates
app.post('/api/admin/register', authenticateToken, requireAdmin, (req, res) => {
    const clientId = req.headers['x-client-id'] || req.user._id.toString();
    adminClients.add(clientId);
    console.log('Admin client registered:', clientId);
    res.json({ success: true, message: 'Admin client registered' });
});

// Endpoint for admin clients to unregister
app.post('/api/admin/unregister', authenticateToken, requireAdmin, (req, res) => {
    const clientId = req.headers['x-client-id'] || req.user._id.toString();
    adminClients.delete(clientId);
    console.log('Admin client unregistered:', clientId);
    res.json({ success: true, message: 'Admin client unregistered' });
});

// Initialize submissions file if it doesn't exist
if (!fs.existsSync('submissions.json')) {
    fs.writeFileSync('submissions.json', '[]');
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});