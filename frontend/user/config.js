// PetMatch Frontend Configuration
const CONFIG = {
    // API Gateway Base URL
    API_BASE_URL: 'https://yy7uzqcse9.execute-api.ap-south-1.amazonaws.com/dev', 

    // AWS Cognito Settings
    COGNITO: {
        REGION: 'ap-south-1',
        USER_POOL_ID: 'ap-south-1_cxxYRwI9X',
        CLIENT_ID: '3cg7oidr4jpl1g22100qapf1og'
    },

    // S3 Bucket for direct uploads
    S3_BUCKET: 'pm-img-anjal-dev'
};

// Export for use in other scripts
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
}