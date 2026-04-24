// Lambda: Admin - Get Pet Matches
// Handler: getMatches

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const MATCHES_TABLE = process.env.MATCHES_TABLE || 'pet-matches';

exports.getMatches = async (event) => {
    console.log('Get matches request');
    
    const status = event.queryStringParameters?.status;
    
    try {
        let params = {
            TableName: MATCHES_TABLE
        };
        
        const result = await dynamodb.scan(params).promise();
        
        let matches = result.Items;
        
        if (status) {
            matches = matches.filter(m => m.status === status);
        }
        
        // Sort by match score (highest first)
        matches.sort((a, b) => b.matchScore - a.matchScore);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                matches: matches,
                count: matches.length
            })
        };
    } catch (error) {
        console.error('Get matches error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get matches', error: error.message })
        };
    }
};
