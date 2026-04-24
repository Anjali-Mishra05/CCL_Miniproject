// Lambda: Admin - Get All Users
// Handler: getUsers

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'users';

exports.getUsers = async (event) => {
    console.log('Get users request');
    
    // Check admin authorization (this should be done via API Gateway authorizer)
    const searchTerm = event.queryStringParameters?.search;
    
    try {
        let params = {
            TableName: USERS_TABLE
        };
        
        const result = await dynamodb.scan(params).promise();
        
        let users = result.Items;
        
        if (searchTerm) {
            users = users.filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                users: users,
                count: users.length
            })
        };
    } catch (error) {
        console.error('Get users error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get users', error: error.message })
        };
    }
};
