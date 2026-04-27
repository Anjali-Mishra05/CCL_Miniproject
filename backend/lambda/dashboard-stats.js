// Lambda: Get Dashboard Stats
// Handler: getDashboardStats

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE || 'pets';
const MATCHES_TABLE = process.env.MATCHES_TABLE || 'pet-matches';

exports.getDashboardStats = async (event) => {
    console.log('Dashboard stats request');
    
    try {
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
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'confirmed'
            },
            Select: 'COUNT'
        }).promise();
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({
                lostCount: lostResult.Count,
                foundCount: foundResult.Count,
                matchedCount: matchesResult.Count
            })
        };
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: 'Failed to get stats', error: error.message })
        };
    }
};
