// Lambda: Get All Pets with Filtering
// Handler: getPets

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE || 'pets';

exports.getPets = async (event) => {
    console.log('Get pets request:', event);
    
    const type = event.queryStringParameters?.type;
    const species = event.queryStringParameters?.species;
    const location = event.queryStringParameters?.location;
    
    try {
        let params = {
            TableName: PETS_TABLE,
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'active'
            }
        };
        
        if (type) {
            params.FilterExpression += ' AND #type = :type';
            params.ExpressionAttributeNames['#type'] = 'type';
            params.ExpressionAttributeValues[':type'] = type;
        }
        
        if (species) {
            params.FilterExpression += ' AND species = :species';
            params.ExpressionAttributeValues[':species'] = species;
        }
        
        if (location) {
            params.FilterExpression += ' AND contains(#location, :location)';
            params.ExpressionAttributeNames['#location'] = 'location';
            params.ExpressionAttributeValues[':location'] = location;
        }
        
        const result = await dynamodb.scan(params).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                pets: result.Items,
                count: result.Items.length
            })
        };
    } catch (error) {
        console.error('Get pets error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get pets', error: error.message })
        };
    }
};
