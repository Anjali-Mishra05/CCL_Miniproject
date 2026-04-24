# PetMatch - Lost & Found Pet Recovery System

A comprehensive AWS-powered web application for helping lost pets find their way home through image recognition and community support.

## Features

- **User Module**
  - Report lost/found pets with image uploads
  - Real-time alerts and notifications via SNS
  - Browse lost & found pets
  - Secure authentication via AWS Cognito
  - Image-based pet matching using AWS Rekognition

- **Admin Module**
  - Manage user accounts and pet listings
  - Monitor alerts and matches
  - Analytics dashboard
  - System configuration

## AWS Services Used

- **S3**: Store pet images
- **Lambda**: Backend business logic
- **API Gateway**: RESTful APIs
- **DynamoDB**: NoSQL database for pet data
- **Cognito**: User authentication & authorization
- **SNS**: Alert notifications
- **Rekognition**: AI-powered image matching

## Project Structure

```
.
├── frontend/
│   ├── user/           # User interface
│   └── admin/          # Admin interface
├── backend/
│   ├── lambda/         # Lambda functions
│   └── layers/         # Lambda layers (shared code)
├── config/             # AWS configurations
└── docs/               # Documentation
```

## Prerequisites

- AWS Account
- Node.js 18+ (for Lambda)
- AWS CLI configured
- Serverless Framework (optional)

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

## API Documentation

See [API.md](docs/API.md) for complete API reference.
