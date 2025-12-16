document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const submissionsTable = document.getElementById('submissionsTable');
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const userFilter = document.getElementById('userFilter');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardLink = document.getElementById('dashboardLink');
    const submissionsLink = document.getElementById('submissionsLink');
    const totalSubmissionsEl = document.getElementById('totalSubmissions');
    const activeUsersEl = document.getElementById('activeUsers');
    const todaySubmissionsEl = document.getElementById('todaySubmissions');
    const viewModal = document.getElementById('viewModal');
    const closeModal = document.querySelector('.close-modal');
    const submissionDetails = document.getElementById('submissionDetails');

    const adminContent = document.querySelector('.admin-content');

    let submissions = [];
    let users = [];
    let pollingInterval;
    let lastSubmissionCount = 0;

    // Initialize the dashboard
    function initDashboard() {
        loadSubmissions();
        registerForRealTimeUpdates();
        startRealTimePolling();
        setActiveNav('dashboard');
    }

    function setActiveNav(active) {
        if (dashboardLink) dashboardLink.classList.toggle('active', active === 'dashboard');
        if (submissionsLink) submissionsLink.classList.toggle('active', active === 'submissions');
    }

    function showSubmissionsView() {
        if (adminContent) adminContent.style.display = '';
        setActiveNav('submissions');

        const tableContainer = document.querySelector('.submissions-table-container');
        if (tableContainer) {
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function showDashboardView() {
        if (adminContent) adminContent.style.display = '';
        setActiveNav('dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Load submissions from API
    async function loadSubmissions() {
        try {
            console.log('Loading submissions from API...');
            const response = await auth.authenticatedRequest('/submissions');
            if (!response) return;
            
            submissions = await response.json();
            console.log('Submissions loaded:', submissions);
            users = [...new Set(submissions.map(s => s.userName || s.internName))];
            
            updateStats();
            updateUserFilter();
            renderSubmissions();
        } catch (error) {
            console.error('Error loading submissions:', error);
            showToast('Failed to load submissions', 'error');
        }
    }

    // Update statistics
    function updateStats() {
        const today = new Date().toDateString();
        const todaySubmissions = submissions.filter(s => 
            new Date(s.date).toDateString() === today
        ).length;

        totalSubmissionsEl.textContent = submissions.length;
        activeUsersEl.textContent = users.length;
        todaySubmissionsEl.textContent = todaySubmissions;
    }

    // Update user filter dropdown
    function updateUserFilter() {
        userFilter.innerHTML = '<option value="">All Users</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            userFilter.appendChild(option);
        });
    }

    // Render submissions table
    function renderSubmissions(filteredSubmissions = submissions) {
        submissionsTable.innerHTML = '';

        if (filteredSubmissions.length === 0) {
            submissionsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">No submissions found</td>
                </tr>
            `;
            return;
        }

        // Sort by date (newest first)
        const sortedSubmissions = [...filteredSubmissions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        sortedSubmissions.forEach(submission => {
            const row = document.createElement('tr');
            const date = new Date(submission.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${submission.internName}</td>
                <td>${submission.taskTitle}</td>
                <td>${submission.companyName}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="viewSubmission('${submission._id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteSubmission('${submission._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;

            submissionsTable.appendChild(row);
        });
    }

    // Filter submissions based on search and filters
    function filterSubmissions() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedDate = dateFilter.value;
        const selectedUser = userFilter.value;

        const filtered = submissions.filter(submission => {
            // Search filter
            if (searchTerm && !(
                submission.internName.toLowerCase().includes(searchTerm) ||
                submission.taskTitle.toLowerCase().includes(searchTerm) ||
                submission.companyName.toLowerCase().includes(searchTerm) ||
                submission.introduction.toLowerCase().includes(searchTerm)
            )) {
                return false;
            }

            // Date filter
            if (selectedDate) {
                const submissionDate = new Date(submission.date);
                const today = new Date();
                
                switch(selectedDate) {
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

            // User filter
            if (selectedUser && submission.internName !== selectedUser) {
                return false;
            }

            return true;
        });

        renderSubmissions(filtered);
    }

    // View submission details
    window.viewSubmission = function(id) {
        const submission = submissions.find(s => s._id === id);
        if (!submission) return;

        const date = new Date(submission.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        submissionDetails.innerHTML = `
            <h2>Submission Details</h2>
            <div class="submission-detail">
                <h3>Intern Information</h3>
                <p><strong>Name:</strong> ${submission.internName}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Task Title:</strong> ${submission.taskTitle}</p>
                <p><strong>Company:</strong> ${submission.companyName}</p>
            </div>
            
            <div class="submission-detail">
                <h3>Introduction</h3>
                <p>${submission.introduction}</p>
            </div>
            
            <div class="submission-detail">
                <h3>Topics Covered</h3>
                <ul>
                    ${(submission.topicsCovered || []).map(topic => `<li>${topic}</li>`).join('')}
                </ul>
            </div>
            
            <div class="submission-detail">
                <h3>Practice & Examples</h3>
                <p>${submission.practiceExamples}</p>
            </div>
            
            ${submission.screenshot ? `
                <div class="submission-detail">
                    <h3>Screenshot</h3>
                    <img src="/api/uploads/${submission.screenshot.replace(/^.*[\\\/]/, '')}" style="max-width: 100%; border-radius: 8px; margin-top: 1rem; border: 1px solid #ddd;" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; color: #666; font-style: italic;">Image not available</div>
                </div>
            ` : ''}
            
            <div class="submission-actions">
                <button class="action-btn" onclick="downloadSubmission('${submission._id}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;

        viewModal.style.display = 'flex';
    };

    // Delete submission
    window.deleteSubmission = async function(id) {
        if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
            try {
                console.log('Deleting submission:', id);
                
                // Call the delete API endpoint
                const response = await auth.authenticatedRequest(`/submissions/${id}`, {
                    method: 'DELETE'
                });
                
                if (!response) return;
                
                const result = await response.json();
                
                if (result.success) {
                    // Remove from local array
                    submissions = submissions.filter(s => s._id !== id);
                    filterSubmissions();
                    updateStats();
                    showToast('Submission deleted permanently', 'success');
                    console.log('Submission deleted successfully');
                } else {
                    showToast(result.error || 'Failed to delete submission', 'error');
                }
            } catch (error) {
                console.error('Error deleting submission:', error);
                showToast('Failed to delete submission', 'error');
            }
        }
    };

    // Download submission
    window.downloadSubmission = async function(id) {
        const submission = submissions.find(s => s._id === id);
        if (!submission) return;

        try {
            // Open the document URL in a new tab
            if (submission.documentPath) {
                const filename = submission.documentPath.split('/').pop();
                window.open(`/api/download/${filename}`, '_blank');
            } else {
                showToast('Document not available for download', 'error');
            }
        } catch (error) {
            console.error('Error downloading submission:', error);
            showToast('Failed to download document', 'error');
        }
    };

    // Send email with submission
    window.sendEmail = async function(id) {
        const submission = submissions.find(s => s.id === id);
        if (!submission) return;

        try {
            const response = await auth.authenticatedRequest('/send-email', {
                method: 'POST',
                body: JSON.stringify({
                    submissionId: id
                })
            });

            if (!response) return;

            const result = await response.json();
            
            if (result.success) {
                showToast('Email sent successfully!', 'success');
            } else {
                showToast(result.error || 'Failed to send email', 'error');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            showToast('Failed to send email', 'error');
        }
    };

    // Close modal
    closeModal.addEventListener('click', () => {
        viewModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) {
            viewModal.style.display = 'none';
        }
    });

    // Event listeners
    searchInput.addEventListener('input', filterSubmissions);
    dateFilter.addEventListener('change', filterSubmissions);
    userFilter.addEventListener('change', filterSubmissions);

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }

    // Top navigation
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            showDashboardView();
        });
    }

    if (submissionsLink) {
        submissionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSubmissionsView();
        });
    }

    // Real-time update functions
    async function registerForRealTimeUpdates() {
        try {
            const response = await auth.authenticatedRequest('/admin/register', {
                method: 'POST',
                headers: {
                    'X-Client-ID': Date.now().toString()
                }
            });
            if (response) {
                console.log('Registered for real-time updates');
            }
        } catch (error) {
            console.error('Failed to register for real-time updates:', error);
        }
    }

    function startRealTimePolling() {
        // Poll every 5 seconds for new submissions
        pollingInterval = setInterval(async () => {
            try {
                const response = await auth.authenticatedRequest('/submissions');
                if (!response) return;
                
                const newSubmissions = await response.json();
                
                // If we have new submissions, refresh the display
                if (newSubmissions.length !== lastSubmissionCount) {
                    console.log('New submissions detected, refreshing...');
                    submissions = newSubmissions;
                    lastSubmissionCount = newSubmissions.length;
                    renderSubmissions();
                    updateStats();
                    
                    // Show notification for new submissions
                    if (newSubmissions.length > lastSubmissionCount) {
                        showToast('New submission received!', 'success');
                    }
                }
            } catch (error) {
                console.error('Error polling for submissions:', error);
            }
        }, 5000); // Poll every 5 seconds
    }

    // Clean up polling when page unloads
    window.addEventListener('beforeunload', async () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        try {
            await auth.authenticatedRequest('/admin/unregister', {
                method: 'POST',
                headers: {
                    'X-Client-ID': Date.now().toString()
                }
            });
        } catch (error) {
            console.error('Failed to unregister from real-time updates:', error);
        }
    });

    // Initialize the dashboard
    initDashboard();
});
