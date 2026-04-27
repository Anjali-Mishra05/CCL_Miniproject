// Lambda: Get User's Pet Reports
// Handler: getUserPets

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE || 'pets';

exports.getUserPets = async (event) => {
    console.log('Get user pets request');
    
    const userId = event.requestContext.authorizer.claims.sub;
    
    try {
        const result = await dynamodb.query({
            TableName: PETS_TABLE,
            IndexName: 'userIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({
                pets: result.Items,
                count: result.Items.length
            })
        };
    } catch (error) {
        console.error('Get user pets error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: 'Failed to get pets', error: error.message })
        };
    }
};
