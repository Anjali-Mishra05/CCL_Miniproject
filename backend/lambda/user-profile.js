// Lambda: Get User Profile
// Handler: getUserProfile

const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'users';
const USER_POOL_ID = process.env.COGNITO_POOL_ID;

exports.getUserProfile = async (event) => {
    console.log('Get user profile request');
    
    const userId = event.requestContext.authorizer.claims.sub;
    
    try {
        const result = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { id: userId }
        }).promise();
        
        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' })
            };
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Get profile error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get profile', error: error.message })
        };
    }
};
