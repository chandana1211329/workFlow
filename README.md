# Document Generator

A daily work summary automation system that allows interns to submit their daily work and generate professional documents automatically.

## Features

- User authentication (login/register)
- Admin dashboard for managing submissions
- Document generation in PDF format
- Email notifications
- File upload support
- MongoDB database integrationyez

## 1.Decoration

## Setup

1. Clone this repository
2. Install dependencies: `cd backend && npm install`
3. Set environment variables in Render dashboard
4. Deploy to Render

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time
- `SMTP_USER`: Email for notifications
- `SMTP_PASS`: Email app password
- `MANAGER_EMAIL`: Manager email address

## Deployment

This project is configured for Render deployment with automatic builds from GitHub.
