// Lambda: Admin - Get All Pet Reports
// Handler: getAllPets

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PETS_TABLE = process.env.PETS_TABLE || 'pets';

exports.getAllPets = async (event) => {
    console.log('Get all pets request');
    
    const type = event.queryStringParameters?.type;
    const status = event.queryStringParameters?.status;
    const search = event.queryStringParameters?.search;
    
    try {
        let params = {
            TableName: PETS_TABLE
        };
        
        const result = await dynamodb.scan(params).promise();
        
        let pets = result.Items;
        
        if (type) {
            pets = pets.filter(p => p.type === type);
        }
        
        if (status) {
            pets = pets.filter(p => p.status === status);
        }
        
        if (search) {
            pets = pets.filter(p => 
                (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
                (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
            );
        }
        
        // Add user name to each pet (in production, you'd join with users table)
        pets = pets.map(p => ({
            ...p,
            userName: p.userId
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                pets: pets,
                count: pets.length
            })
        };
    } catch (error) {
        console.error('Get all pets error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to get pets', error: error.message })
        };
    }
};
