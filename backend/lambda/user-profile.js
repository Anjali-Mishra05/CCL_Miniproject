// Lambda: Get User Profile
// Handler: getUserProfile

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'pm-users-dev';

exports.getUserProfile = async (event) => {
    console.log('Get user profile request');
    
    // Get info from Cognito claims (passed by API Gateway authorizer)
    const claims = event.requestContext.authorizer.claims;
    const userId = claims.sub;
    
    try {
        // Try to get from DynamoDB
        let result = await dynamodb.get({
            TableName: USERS_TABLE,
            Key: { id: userId }
        }).promise();
        
        // If not in DynamoDB, use Cognito claims (JIT provisioning)
        if (!result.Item) {
            const newUser = {
                id: userId,
                email: claims.email,
                name: claims.name || claims['custom:name'] || 'User',
                phone: claims.phone_number || '',
                createdAt: new Date().toISOString()
            };
            
            // Save to DynamoDB for future use
            await dynamodb.put({
                TableName: USERS_TABLE,
                Item: newUser
            }).promise();
            
            result.Item = newUser;
        }
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Get profile error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: 'Failed to get profile', error: error.message })
        };
    }
};
