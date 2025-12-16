// DOM Elements
const form = document.getElementById('workSummaryForm');
const previewBtn = document.getElementById('previewBtn');
const generateBtn = document.getElementById('generateBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.querySelector('.close-modal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('screenshotUpload');
const previewContainer = document.getElementById('previewContainer');
const documentPreview = document.getElementById('documentPreview');
const toast = document.getElementById('toast');
const closePreview = document.getElementById('closePreview');
const downloadFromPreview = document.getElementById('downloadFromPreview');

// Sample submissions data
let submissions = JSON.parse(localStorage.getItem('submissions')) || [];
let selectedFile = null;

// Initialize date field with today's date
document.getElementById('date').valueAsDate = new Date();

// Event Listeners
form.addEventListener('submit', handleSubmit);
previewBtn.addEventListener('click', previewDocument);
sendEmailBtn.addEventListener('click', sendEmail);
closeModal.addEventListener('click', () => previewModal.style.display = 'none');
uploadArea.addEventListener('click', () => fileInput.click());
closePreview.addEventListener('click', () => previewModal.style.display = 'none');
downloadFromPreview.addEventListener('click', () => {
    const formData = getFormData();
    generatePDF(formData);
    previewModal.style.display = 'none';
});

// File upload handling
fileInput.addEventListener('change', handleFileUpload);

// Modal close on background click
previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.style.display = 'none';
    }
});

// Functions
function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const formData = getFormData();
    generatePDF(formData);
}

function validateForm() {
    const requiredFields = ['internName', 'date', 'taskTitle', 'companyName', 'introduction', 'topicsCovered', 'practiceExamples'];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.focus();
            return false;
        }
    }
    
    return true;
}

function getFormData() {
    return {
        internName: document.getElementById('internName').value,
        date: document.getElementById('date').value,
        taskTitle: document.getElementById('taskTitle').value,
        companyName: document.getElementById('companyName').value,
        introduction: document.getElementById('introduction').value,
        topicsCovered: document.getElementById('topicsCovered').value.split('\n').filter(t => t.trim()),
        practiceExamples: document.getElementById('practiceExamples').value,
        screenshot: selectedFile
    };
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size should be less than 5MB', 'error');
        return;
    }
    
    selectedFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <div class="preview-image">
                <img src="${e.target.result}" alt="Preview" style="max-width: 200px; border-radius: 12px;">
                <button onclick="removeImage()" style="margin-top: 10px; color: #ef4444;">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
        previewContainer.classList.add('active');
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedFile = null;
    fileInput.value = '';
    previewContainer.innerHTML = '';
    previewContainer.classList.remove('active');
}

function previewDocument() {
    if (!validateForm()) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const formData = getFormData();
    renderPreview(formData);
    previewModal.style.display = 'flex';
}

function renderPreview(data) {
    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    documentPreview.innerHTML = `
        <div class="document-header">
            <img src="assets/default-logo.png" alt="Company Logo">
            <h1 class="document-title">${data.companyName}</h1>
            <h2 class="document-subtitle">Daily Work Summary Report</h2>
        </div>
        
        <div class="document-section">
            <h3>Intern Information</h3>
            <p><strong>Name:</strong> ${data.internName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Task Title:</strong> ${data.taskTitle}</p>
        </div>
        
        <div class="document-section">
            <h3>Introduction</h3>
            <p>${data.introduction}</p>
        </div>
        
        <div class="document-section">
            <h3>Topics Covered</h3>
            <ul class="bullet-list">
                ${data.topicsCovered.map(topic => `<li>${topic}</li>`).join('')}
            </ul>
        </div>
        
        <div class="document-section">
            <h3>Practice & Examples</h3>
            <p>${data.practiceExamples}</p>
        </div>
        
        <div class="document-section">
            <h3>Summary</h3>
            <p>This daily summary report was generated using the Document Generator System. The intern demonstrated progress in the mentioned areas and actively participated in the learning process.</p>
        </div>
        
        <div class="document-section">
            <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
        </div>
    `;
}

// Function to generate PDF from HTML content
function generatePDFFromHTML(html, filename) {
    // Create a new window with the HTML content
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Work Summary - PDF</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                .document { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { margin: 0; color: #2c3e50; }
                .document-section { margin-bottom: 20px; }
                .document-section h2 { 
                    color: #3498db; 
                    border-bottom: 2px solid #3498db; 
                    padding-bottom: 5px; 
                    margin-top: 30px;
                }
                .task-list { margin-left: 20px; }
                .task-item { margin-bottom: 10px; }
                .signature-line { 
                    border-top: 1px solid #000; 
                    width: 200px; 
                    margin: 50px 0 10px 0; 
                }
                .signature-label { 
                    font-style: italic; 
                    margin-top: 0;
                }
                .document-footer { 
                    margin-top: 50px; 
                    text-align: center; 
                    font-size: 0.9em; 
                    color: #7f8c8d;
                }
            </style>
        </head>
        <body>
            <div class="document">
                ${html}
            </div>
            <script>
                // Trigger print and close after a short delay
                setTimeout(() => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }, 500);
            </script>
        </body>
        </html>
    `);
    
    // Create a version for download
    setTimeout(() => {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Work Summary - ${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
                    .document { max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; color: #2c3e50; }
                    .document-section { margin-bottom: 20px; }
                    .document-section h2 { 
                        color: #3498db; 
                        border-bottom: 2px solid #3498db; 
                        padding-bottom: 5px; 
                        margin-top: 30px;
                    }
                    .task-list { margin-left: 20px; }
                    .task-item { margin-bottom: 10px; }
                    .signature-line { 
                        border-top: 1px solid #000; 
                        width: 200px; 
                        margin: 50px 0 10px 0; 
                    }
                    .signature-label { 
                        font-style: italic; 
                        margin-top: 0;
                    }
                    .document-footer { 
                        margin-top: 50px; 
                        text-align: center; 
                        font-size: 0.9em; 
                        color: #7f8c8d;
                    }
                </style>
            </head>
            <body>
                <div class="document">
                    ${html}
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 1000);
}

async function generatePDF(data) {
    showToast('Generating PDF...', 'warning');
    
    // Create HTML content that matches the preview
    const htmlContent = `
        <div class="document-header">
            <img src="assets/default-logo.png" alt="Company Logo">
            <h1 class="document-title">${data.companyName}</h1>
            <h2 class="document-subtitle">Daily Work Summary Report</h2>
        </div>
        
        <div class="document-section">
            <h3>Intern Information</h3>
            <p><strong>Name:</strong> ${data.internName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Task Title:</strong> ${data.taskTitle}</p>
        </div>
        
        <div class="document-section">
            <h3>Introduction</h3>
            <p>${data.introduction}</p>
        </div>
        
        <div class="document-section">
            <h3>Topics Covered</h3>
            <ul class="bullet-list">
                ${data.topicsCovered.map(topic => `<li>${topic}</li>`).join('')}
            </ul>
        </div>
        
        <div class="document-section">
            <h3>Practice & Examples</h3>
            <p>${data.practiceExamples}</p>
        </div>
        
        <div class="document-section">
            <h3>Summary</h3>
            <p>This daily summary report was generated using the Document Generator System. The intern demonstrated progress in the mentioned areas and actively participated in the learning process.</p>
        </div>
        
        <div class="document-section">
            <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    // Add any images if present
    if (data.screenshot) {
        const imgSection = `
            <div class="document-section">
                <h3>Screenshot</h3>
                <img src="${data.screenshot}" style="max-width: 100%; height: auto;" />
            </div>
        `;
        htmlContent += imgSection;
    }
    
    // Generate the PDF
    const filename = `Work_Summary_${data.internName}_${data.date}`;
    generatePDFFromHTML(htmlContent, filename);
    
    // Save submission
    const submission = {
        id: Date.now(),
        ...data,
        generatedAt: new Date().toISOString(),
        status: 'generated',
        documentUrl: `saved/${filename}.html`
    };
    
    submissions.push(submission);
    localStorage.setItem('submissions', JSON.stringify(submissions));
    
    // Update dashboard
    updateDashboard();
    
    showToast('Document generated successfully!', 'success');
}

async function sendEmail() {
    if (!validateForm()) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const formData = getFormData();
    
    showToast('Sending email to manager...', 'warning');
    
    try {
        // In a real application, this would call the backend API
        // For demo purposes, we'll simulate the API call
        const response = await simulateEmailAPI(formData);
        
        if (response.success) {
            showToast('Email sent successfully to manager!', 'success');
            
            // Save submission
            const submission = {
                id: Date.now(),
                ...formData,
                generatedAt: new Date().toISOString(),
                status: 'emailed',
                emailedAt: new Date().toISOString()
            };
            
            submissions.push(submission);
            localStorage.setItem('submissions', JSON.stringify(submissions));
            
            // Update dashboard
            updateDashboard();
        }
    } catch (error) {
        showToast('Failed to send email. Please try again.', 'error');
    }
}

function simulateEmailAPI(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: 'Email sent successfully',
                emailId: `email_${Date.now()}`
            });
        }, 2000);
    });
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show';
    toast.classList.add(type);
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Dashboard Functions
function updateDashboard() {
    const tableBody = document.getElementById('submissionsTable');
    const internFilter = document.getElementById('internFilter');
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get unique interns for filter
    const interns = [...new Set(submissions.map(s => s.internName))];
    
    // Update intern filter
    internFilter.innerHTML = '<option value="">All Interns</option>';
    interns.forEach(intern => {
        const option = document.createElement('option');
        option.value = intern;
        option.textContent = intern;
        internFilter.appendChild(option);
    });
    
    if (submissions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">No submissions yet. Documents will appear here after generation.</td>
            </tr>
        `;
    } else {
        // Sort by date (newest first)
        submissions.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
        
        submissions.forEach(submission => {
            const row = document.createElement('tr');
            
            const date = new Date(submission.date);
            const formattedDate = date.toLocaleDateString('en-US');
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${submission.internName}</td>
                <td>${submission.taskTitle}</td>
                <td>${submission.companyName}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewSubmission(${submission.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn download" onclick="downloadSubmission(${submission.id})">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="action-btn delete" onclick="deleteSubmission(${submission.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Update statistics
    updateStatistics();
}

function updateStatistics() {
    const today = new Date().toDateString();
    const todaySubmissions = submissions.filter(s => 
        new Date(s.date).toDateString() === today
    ).length;
    
    const uniqueInterns = new Set(submissions.map(s => s.internName)).size;
    
    document.getElementById('totalSubmissions').textContent = submissions.length;
    document.getElementById('activeInterns').textContent = uniqueInterns;
    document.getElementById('todaySubmissions').textContent = todaySubmissions;
}

function viewSubmission(id) {
    const submission = submissions.find(s => s.id === id);
    if (submission) {
        renderPreview(submission);
        previewModal.classList.add('active');
    }
}

function downloadSubmission(id) {
    const submission = submissions.find(s => s.id === id);
    if (submission) {
        const blob = new Blob([JSON.stringify(submission, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Work_Summary_${submission.internName}_${submission.date}_${submission.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Document downloaded!', 'success');
    }
}

function deleteSubmission(id) {
    if (confirm('Are you sure you want to delete this submission?')) {
        submissions = submissions.filter(s => s.id !== id);
        localStorage.setItem('submissions', JSON.stringify(submissions));
        updateDashboard();
        showToast('Submission deleted!', 'success');
    }
}

// Filter functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterSubmissions();
});

document.getElementById('dateFilter').addEventListener('change', filterSubmissions);
document.getElementById('internFilter').addEventListener('change', filterSubmissions);

function filterSubmissions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    const internFilter = document.getElementById('internFilter').value;
    
    const filteredSubmissions = submissions.filter(submission => {
        // Search filter
        if (searchTerm && !(
            submission.internName.toLowerCase().includes(searchTerm) ||
            submission.taskTitle.toLowerCase().includes(searchTerm) ||
            submission.companyName.toLowerCase().includes(searchTerm)
        )) {
            return false;
        }
        
        // Date filter
        if (dateFilter) {
            const submissionDate = new Date(submission.date);
            const today = new Date();
            
            switch(dateFilter) {
                case 'today':
                    if (submissionDate.toDateString() !== today.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    if (submissionDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    if (submissionDate < monthAgo) return false;
                    break;
            }
        }
        
        // Intern filter
        if (internFilter && submission.internName !== internFilter) {
            return false;
        }
        
        return true;
    });
    
    updateFilteredTable(filteredSubmissions);
}

function updateFilteredTable(filteredSubmissions) {
    const tableBody = document.getElementById('submissionsTable');
    tableBody.innerHTML = '';
    
    if (filteredSubmissions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">No submissions match your filters</td>
            </tr>
        `;
        return;
    }
    
    filteredSubmissions.forEach(submission => {
        const row = document.createElement('tr');
        
        const date = new Date(submission.date);
        const formattedDate = date.toLocaleDateString('en-US');
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${submission.internName}</td>
            <td>${submission.taskTitle}</td>
            <td>${submission.companyName}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewSubmission(${submission.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn download" onclick="downloadSubmission(${submission.id})">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="action-btn delete" onclick="deleteSubmission(${submission.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});