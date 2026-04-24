# PetMatch - Setup & Deployment Guide

## Project Overview

**PetMatch** is a premium pet-finding application that helps users find lost and found pets using AI-powered image matching, location-based search, and smart notifications.

### Features

**User Features:**
- 🔐 Secure signup/login with JWT authentication
- 📱 Report lost/found pets with photos
- 🔍 Browse and filter pets by type, species, location
- 🎯 AI-powered pet matching based on image recognition
- 💬 Direct contact with pet owners
- ⭐ Saved matches and favorites
- 📧 Real-time notifications

**Admin Features:**
- 👥 User management and monitoring
- ✅ Pet report verification and moderation
- 📊 Dashboard with statistics
- 🚩 Flag and manage inappropriate reports
- 📢 Send notifications to users
- ⚙️ System settings and configuration

## Technology Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Font Awesome 6.4.0 for icons
- Responsive design with mobile-first approach

**Backend:**
- Node.js 18.x runtime
- AWS Lambda for serverless functions
- AWS DynamoDB for NoSQL database
- AWS Cognito for authentication
- AWS S3 for image storage
- AWS Rekognition for image matching

**Infrastructure:**
- AWS API Gateway for REST API
- AWS CloudWatch for logging
- AWS SNS for notifications

## Prerequisites

### Required Software
- **Node.js** 18.x LTS
- **npm** 8.x or higher
- **AWS CLI** v2
- **Serverless Framework** 3.x

### AWS Account Setup
- AWS Account with programmatic access keys
- IAM user with EC2, Lambda, DynamoDB, Cognito, S3, and SNS permissions
- Configured AWS CLI (`aws configure`)

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/yourusername/petmatch.git
cd CCL_Miniproject

# Install dependencies
npm install

# Install Serverless globally
npm install -g serverless
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure
# Enter: Access Key ID
# Enter: Secret Access Key
# Enter: Default region (us-east-1 recommended)
# Enter: Default output format (json)

# Verify configuration
aws sts get-caller-identity
```

### 3. Setup Environment Variables

Create `.env` file in project root:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Cognito
COGNITO_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=your_client_id_here
COGNITO_CLIENT_SECRET=your_client_secret_here

# DynamoDB Tables
USERS_TABLE=PetMatch-Users
PETS_TABLE=PetMatch-Pets
MATCHES_TABLE=PetMatch-Matches
NOTIFICATIONS_TABLE=PetMatch-Notifications

# S3
S3_BUCKET=petmatch-images-unique-name
S3_REGION=us-east-1

# API
API_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
API_STAGE=dev

# Frontend URLs
USER_APP_URL=http://localhost:8000/frontend/user
ADMIN_APP_URL=http://localhost:8000/frontend/admin

# Notifications
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxxx:petmatch-notifications
EMAIL_FROM=noreply@petmatch.com
```

### 4. Create AWS Resources

Follow the detailed AWS setup guide in `config/AWS_SETUP.md`:

```bash
# Quick setup script (optional)
bash scripts/setup-aws.sh
```

This will:
- Create Cognito User Pool and App Client
- Create DynamoDB tables
- Create S3 bucket for images
- Create IAM roles for Lambda
- Create SNS topic for notifications

### 5. Deploy Backend

```bash
# Deploy all Lambda functions
serverless deploy

# Deploy specific function
serverless deploy function -f userSignUp

# View deployment status
serverless info
```

### 6. Update Frontend Configuration

Update API endpoints in frontend files:

**frontend/user/auth.js** and **frontend/admin/admin-auth.js:**
```javascript
// Replace with your API endpoint
const API_ENDPOINT = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/dev';
```

## Running Locally

### Option 1: Using Local Server

```bash
# Start local development server
npm run dev

# Access applications:
# User App: http://localhost:3000/frontend/user/
# Admin App: http://localhost:3000/frontend/admin/
```

### Option 2: Using Serverless Offline

```bash
# Install serverless offline plugin
npm install --save-dev serverless-offline

# Run local Lambda server
serverless offline start

# API available at: http://localhost:3000
```

### Option 3: Using HTTP Server (Frontend Only)

```bash
# Using Python
python -m http.server 8000

# Using Node
npx http-server -p 8000

# Access: http://localhost:8000
```

## Project Structure

```
CCL_Miniproject/
├── frontend/
│   ├── user/                      # User application
│   │   ├── index.html            # Main HTML
│   │   ├── styles.css            # CSS styles
│   │   ├── auth.js               # Authentication logic
│   │   └── app.js                # Application logic
│   └── admin/                     # Admin dashboard
│       ├── index.html            # Admin HTML
│       ├── admin-styles.css      # Admin CSS
│       ├── admin-auth.js         # Admin auth logic
│       └── admin-app.js          # Admin app logic
│
├── backend/
│   ├── lambda/                    # AWS Lambda functions
│   │   ├── auth.js               # Authentication endpoints
│   │   ├── admin-dashboard.js    # Admin dashboard stats
│   │   ├── pets-*.js             # Pet management
│   │   ├── user-*.js             # User management
│   │   ├── upload.js             # Image upload
│   │   └── sns-notify.js         # Notifications
│   └── layers/                    # Lambda layers (shared code)
│
├── config/
│   ├── AWS_SETUP.md              # AWS infrastructure guide
│   ├── aws-setup.md              # AWS configuration
│   └── dynamodb-schema.md        # Database schema
│
├── docs/
│   ├── API.md                    # API documentation
│   ├── ARCHITECTURE.md           # Architecture overview
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── PROJECT_STRUCTURE.md      # Project structure
│
├── package.json                  # Dependencies and scripts
├── serverless.yml                # Serverless configuration
└── README.md                     # This file
```

## API Endpoints

### Authentication

```
POST   /auth/signup              # User signup
POST   /auth/signin              # User login
POST   /auth/refresh             # Refresh JWT token
POST   /api/admin/signin         # Admin login
POST   /api/admin/request-access # Request admin access
```

### User API

```
GET    /api/pets/stats           # Get home statistics
GET    /api/pets                 # Get pets with filters
POST   /api/pets/report          # Report new pet
GET    /api/matches              # Get pet matches
GET    /api/users/profile        # Get user profile
PUT    /api/users/profile        # Update user profile
GET    /api/users/my-pets        # Get user's reported pets
```

### Admin API

```
GET    /api/admin/stats          # Dashboard statistics
GET    /api/admin/users          # List all users
GET    /api/admin/pets           # List pet reports
GET    /api/admin/matches        # List matches for review
GET    /api/admin/reports        # Get flagged reports
GET    /api/admin/notifications  # Get notifications
```

## Testing

### Test User Signup

```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test@12345",
    "name": "Test User",
    "phone": "+1234567890"
  }'
```

### Test User Signin

```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/dev/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test@12345"
  }'
```

### Test with Bearer Token

```bash
curl -X GET https://your-api.execute-api.us-east-1.amazonaws.com/dev/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Deployment

### Deploy to AWS

```bash
# Production deployment
serverless deploy --stage prod

# View logs
serverless logs -f userSignUp --tail

# Remove deployment
serverless remove
```

### Update Frontend

```bash
# Build (if using build tools)
npm run build

# Deploy to S3
aws s3 sync frontend/user s3://petmatch-frontend/user --delete
aws s3 sync frontend/admin s3://petmatch-frontend/admin --delete
```

## Monitoring & Troubleshooting

### View Lambda Logs

```bash
# Real-time logs
serverless logs -f userSignUp --tail

# Specific time range
serverless logs -f userSignIn --startTime 1h
```

### Check DynamoDB

```bash
# List tables
aws dynamodb list-tables

# Scan table
aws dynamodb scan --table-name PetMatch-Users

# Get item
aws dynamodb get-item \
  --table-name PetMatch-Users \
  --key '{"email":{"S":"user@example.com"}}'
```

### Monitor CloudWatch

```bash
# Get metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=petmatch-api-dev-userSignUp \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600
```

## Common Issues

### Issue: "Cognito user pool not found"
**Solution:** Verify COGNITO_POOL_ID in environment variables
```bash
aws cognito-idp list-user-pools --max-results 10
```

### Issue: "DynamoDB table not found"
**Solution:** Create tables or update table name in environment
```bash
aws dynamodb list-tables
```

### Issue: "Lambda execution role lacks permissions"
**Solution:** Update IAM role policies
```bash
aws iam list-attached-role-policies --role-name PetMatch-Lambda-Role
```

### Issue: CORS errors in browser
**Solution:** Update CORS headers in Lambda responses
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## Performance Optimization

1. **Lambda:**
   - Use reserved concurrency for predictable load
   - Optimize code for cold start
   - Use Lambda layers for common code

2. **DynamoDB:**
   - Use on-demand billing for variable workloads
   - Implement query optimization
   - Use batch operations for multiple items

3. **Frontend:**
   - Enable compression in API Gateway
   - Use CloudFront for static content
   - Implement lazy loading for images

## Security Best Practices

1. ✅ Use HTTPS for all endpoints
2. ✅ Implement rate limiting on API
3. ✅ Validate input on frontend and backend
4. ✅ Use environment variables for secrets
5. ✅ Enable encryption for data in transit and at rest
6. ✅ Implement CSRF tokens for forms
7. ✅ Use API Gateway authorization
8. ✅ Monitor CloudTrail for audit logs

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## Support

For issues and questions:
- Check [API.md](docs/API.md) for endpoint documentation
- Review [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- See [AWS_SETUP.md](config/AWS_SETUP.md) for AWS configuration

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Next Steps

1. ✅ Setup AWS resources
2. ✅ Configure environment variables
3. ✅ Deploy Lambda functions
4. ⬜ Setup custom domain with Route53
5. ⬜ Implement CI/CD pipeline
6. ⬜ Setup monitoring and alerts
7. ⬜ Implement advanced features (notifications, image matching)
