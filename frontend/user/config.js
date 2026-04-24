// PetMatch Frontend Configuration
const CONFIG = {
    // API Gateway Base URL - UPDATE THIS after deployment
    // Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
    API_BASE_URL: '', 

    // AWS Cognito Settings - UPDATE THESE with your User Pool details
    COGNITO: {
        REGION: 'us-east-1',
        USER_POOL_ID: 'us-east-1_xxxxxxxxx',
        CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
    },

    // S3 Bucket for direct uploads (if needed by frontend directly)
    S3_BUCKET: 'petmatch-images-dev'
};

// Export for use in other scripts
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
}
