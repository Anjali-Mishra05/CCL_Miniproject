const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const MATCHES_TABLE = process.env.MATCHES_TABLE || 'matches';
const PETS_TABLE = process.env.PETS_TABLE || 'pets';

exports.getUserMatches = async (event) => {
    console.log('Get user matches request');
    
    const userId = event.requestContext.authorizer.claims.sub;
    
    try {
        // 1. Get all of user's pets first to have their IDs
        const userPets = await dynamodb.query({
            TableName: PETS_TABLE,
            IndexName: 'userIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();
        
        const userPetIds = userPets.Items.map(p => p.id);
        
        if (userPetIds.length === 0) {
            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
                body: JSON.stringify({ matches: [], count: 0 })
            };
        }
        
        // 2. Scan matches table for any matches involving these pet IDs
        // In a real production app, you'd use a more efficient indexing strategy,
        // but for this MVP, we'll scan and filter for simplicity.
        const allMatches = await dynamodb.scan({
            TableName: MATCHES_TABLE
        }).promise();
        
        const userMatches = allMatches.Items.filter(m => 
            userPetIds.includes(m.lostPetId) || userPetIds.includes(m.foundPetId)
        );
        
        // 3. Fetch full pet details for each match to display images
        const enrichedMatches = await Promise.all(userMatches.map(async (match) => {
            const lostPet = await dynamodb.get({
                TableName: PETS_TABLE,
                Key: { id: match.lostPetId }
            }).promise();
            
            const foundPet = await dynamodb.get({
                TableName: PETS_TABLE,
                Key: { id: match.foundPetId }
            }).promise();
            
            return {
                ...match,
                lostPet: lostPet.Item,
                foundPet: foundPet.Item
            };
        }));
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({
                matches: enrichedMatches,
                count: enrichedMatches.length
            })
        };
    } catch (error) {
        console.error('Get user matches error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": true
            },
            body: JSON.stringify({ message: 'Failed to get matches', error: error.message })
        };
    }
};
