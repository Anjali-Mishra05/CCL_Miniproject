// Lambda: Admin - Get Dashboard Analytics
// Handler: getAdminDashboard

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE || 'pets';
const USERS_TABLE = process.env.USERS_TABLE || 'users';
const MATCHES_TABLE = process.env.MATCHES_TABLE || 'pet-matches';

exports.getAdminDashboard = async (event) => {
    console.log('Admin dashboard request');
    
    try {
        // Get users count
        const usersResult = await dynamodb.scan({
            TableName: USERS_TABLE,
            Select: 'COUNT'
        }).promise();
        
        // Get lost pets count
        const lostResult = await dynamodb.scan({
            TableName: PETS_TABLE,
            FilterExpression: '#type = :type AND #status = :status',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':type': 'lost',
                ':status': 'active'
            },
            Select: 'COUNT'
        }).promise();
        
        // Get found pets count
        const foundResult = await dynamodb.scan({
            TableName: PETS_TABLE,
            FilterExpression: '#type = :type AND #status = :status',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':type': 'found',
                ':status': 'active'
            },
            Select: 'COUNT'
        }).promise();
        
        // Get matches count
        const matchesResult = await dynamodb.scan({
            TableName: MATCHES_TABLE,
            Select: 'COUNT'
        }).promise();
        
        // Get recent activity
        const recentPetsResult = await dynamodb.scan({
            TableName: PETS_TABLE,
            Limit: 10
        }).promise();
        
        const recentActivity = recentPetsResult.Items.map(pet => ({
            userName: pet.userId,
            action: `Reported ${pet.type} pet`,
            petName: pet.name,
            timestamp: pet.createdAt
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalUsers: usersResult.Count,
                totalLost: lostResult.Count,
                totalFound: foundResult.Count,
                totalMatches: matchesResult.Count,
                recentActivity: recentActivity
            })
        };
    } catch (error) {
        console.error('Admin dashboard error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get dashboard', error: error.message })
        };
    }
};
