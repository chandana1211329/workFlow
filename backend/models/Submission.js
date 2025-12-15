const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    internName: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    taskTitle: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    introduction: {
        type: String,
        required: true
    },
    topicsCovered: [{
        type: String,
        required: true
    }],
    practiceExamples: {
        type: String,
        required: true
    },
    screenshot: {
        type: String
    },
    documentPath: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['generated', 'downloaded', 'emailed'],
        default: 'generated'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
