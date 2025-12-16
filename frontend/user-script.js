// DOM Elements
const form = document.getElementById('workSummaryForm');
const previewBtn = document.getElementById('previewBtn');
const generateBtn = document.getElementById('generateBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.querySelector('.close-modal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('screenshotUpload');
const previewContainer = document.getElementById('previewContainer');
const documentPreview = document.getElementById('documentPreview');
const toast = document.getElementById('toast');
const closePreview = document.getElementById('closePreview');
const downloadFromPreview = document.getElementById('downloadFromPreview');

// Set today's date as default
document.getElementById('date').valueAsDate = new Date();

// Event Listeners
form.addEventListener('submit', handleSubmit);
previewBtn.addEventListener('click', previewDocument);
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

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3498db';
    uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ddd';
    uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ddd';
    uploadArea.style.backgroundColor = 'transparent';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
    }
    
    // Display preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <div class="preview-image-container">
                <img src="${e.target.result}" alt="Screenshot Preview" class="preview-image">
                <button type="button" class="remove-image" onclick="removeImage()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        previewContainer.classList.add('active');
        uploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    previewContainer.innerHTML = '';
    previewContainer.classList.remove('active');
    uploadArea.style.display = 'block';
    fileInput.value = '';
}

function getFormData() {
    const topicsCoveredRaw = document.getElementById('topicsCovered').value;
    console.log('Raw topics covered value:', topicsCoveredRaw);
    
    const topicsCovered = topicsCoveredRaw
        .split('\n')
        .filter(topic => topic.trim() !== '');
    
    console.log('Processed topics covered:', topicsCovered);
    
    const practiceExamplesRaw = document.getElementById('practiceExamples').value;
    console.log('Raw practice examples value:', practiceExamplesRaw);
    
    const formData = {
        internName: document.getElementById('internName').value,
        date: document.getElementById('date').value,
        taskTitle: document.getElementById('taskTitle').value,
        companyName: document.getElementById('companyName').value,
        introduction: document.getElementById('introduction').value,
        topicsCovered: topicsCovered,
        practiceExamples: practiceExamplesRaw,
        screenshot: previewContainer.querySelector('img')?.src || null
    };
    
    console.log('Complete form data:', formData);
    return formData;
}

function validateForm() {
    const required = ['internName', 'date', 'taskTitle', 'companyName', 'introduction', 'topicsCovered', 'practiceExamples'];
    
    for (const field of required) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.focus();
            showToast('Please fill all required fields', 'error');
            return false;
        }
    }
    
    return true;
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
    console.log('Rendering preview with data:', data);
    console.log('Topics covered:', data.topicsCovered);
    console.log('Practice examples:', data.practiceExamples);
    
    const topicsList = data.topicsCovered.map(topic => `<li>${topic}</li>`).join('');
    console.log('Topics list HTML:', topicsList);
    
    const html = `
        <div class="document-header">
            <img src="assets/default-logo.png" alt="Company Logo">
            <h2 class="document-title">Daily Work Summary</h2>
            <p class="document-subtitle">${data.date}</p>
        </div>
        
        <div class="document-section">
            <h3>Intern Information</h3>
            <p><strong>Name:</strong> ${data.internName}</p>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Task/Project:</strong> ${data.taskTitle}</p>
        </div>
        
        <div class="document-section">
            <h3>Introduction</h3>
            <p>${data.introduction}</p>
        </div>
        
        <div class="document-section">
            <h3>Topics Covered</h3>
            <ul class="bullet-list">
                ${topicsList}
            </ul>
        </div>
        
        <div class="document-section">
            <h3>Practice & Examples</h3>
            <p>${data.practiceExamples}</p>
        </div>
        
        ${data.screenshot ? `
        <div class="document-section">
            <h3>Screenshot</h3>
            <img src="${data.screenshot}" alt="Work Screenshot" style="max-width: 100%; border-radius: 8px;">
        </div>
        ` : ''}
        
        <div class="document-section">
            <p style="text-align: center; font-style: italic; margin-top: 40px;">
                Generated on ${new Date().toLocaleDateString()} by WorkFlow Pro
            </p>
        </div>
    `;
    
    console.log('Complete HTML:', html);
    documentPreview.innerHTML = html;
}

function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    generatePDF(formData);
}

async function generatePDF(data) {
    showToast('Generating PDF...', 'warning');
    console.log('=== GENERATE PDF START ===');
    console.log('Data to send:', data);
    console.log('User authenticated:', auth.isAuthenticated());
    console.log('Current user:', auth.getCurrentUser());
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add all form fields
        Object.keys(data).forEach(key => {
            if (key !== 'screenshot') {
                formData.append(key, data[key]);
            }
        });
        
        // Add file if exists
        const fileInput = document.getElementById('screenshotUpload');
        if (fileInput.files.length > 0) {
            formData.append('screenshot', fileInput.files[0]);
        }
        
        console.log('FormData prepared, making request to /submit...');
        
        // Make authenticated request to backend
        const response = await auth.authenticatedRequest('/submit', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response received:', response);
        
        if (!response) {
            return; // Auth error handled by auth manager
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Document generated successfully!', 'success');
            
            // Store submission locally for reference
            const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
            const submission = {
                id: result.submissionId,
                ...data,
                documentUrl: result.documentUrl,
                submittedBy: auth.getCurrentUser().fullName,
                submittedAt: new Date().toISOString(),
                status: 'generated'
            };
            
            submissions.push(submission);
            localStorage.setItem('submissions', JSON.stringify(submissions));
            
            // Show download option
            setTimeout(() => {
                if (confirm('Document generated successfully! Would you like to download it now?')) {
                    window.open(result.documentUrl, '_blank');
                }
            }, 1000);
            
        } else {
            showToast(result.error || 'Failed to generate document', 'error');
        }
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Failed to generate document. Please try again.', 'error');
        throw error; // re-throw the error
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
