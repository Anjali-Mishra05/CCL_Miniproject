// Lambda: Create Pet Report
// Handler: createPet

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const PETS_TABLE = process.env.PETS_TABLE || 'pets';

exports.createPet = async (event) => {
    console.log('Create pet request:', event);
    
    const userId = event.requestContext.authorizer.claims.sub;
    const body = JSON.parse(event.body);
    
    if (!body.type || !body.species || !body.location) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields' })
        };
    }
    
    const petId = uuid.v4();
    const timestamp = new Date().toISOString();
    
    const petItem = {
        id: petId,
        userId: userId,
        type: body.type,
        species: body.species,
        name: body.name || 'Unknown',
        description: body.description,
        location: body.location,
        date: body.date,
        imageUrl: body.imageUrl,
        contactPhone: body.contactPhone,
        receiveNotifications: body.receiveNotifications || true,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp
    };
    
    try {
        await dynamodb.put({
            TableName: PETS_TABLE,
            Item: petItem
        }).promise();
        
        // Send SNS notification if enabled
        if (body.receiveNotifications) {
            const sns = new AWS.SNS();
            await sns.publish({
                TopicArn: process.env.PETS_TOPIC_ARN,
                Message: `New ${body.type} pet report: ${body.name || 'Unknown'} in ${body.location}`,
                Subject: `New Pet Alert: ${body.type.toUpperCase()}`
            }).promise();
        }
        
        // --- AUTOMATIC MATCHING TRIGGER ---
        // Find potential matches of the opposite type (lost vs found)
        const oppositeType = body.type === 'lost' ? 'found' : 'lost';
        const potentialMatches = await dynamodb.scan({
            TableName: PETS_TABLE,
            FilterExpression: '#type = :type AND species = :species AND #status = :status',
            ExpressionAttributeNames: { '#type': 'type', '#status': 'status' },
            ExpressionAttributeValues: { 
                ':type': oppositeType, 
                ':species': body.species,
                ':status': 'active'
            }
        }).promise();

        // Trigger matching for each potential candidate
        if (potentialMatches.Items.length > 0) {
            const sns = new AWS.SNS();
            for (const candidate of potentialMatches.Items) {
                await sns.publish({
                    TopicArn: process.env.MATCHES_TOPIC_ARN,
                    Message: JSON.stringify({
                        lostPetId: body.type === 'lost' ? petId : candidate.id,
                        foundPetId: body.type === 'found' ? petId : candidate.id
                    }),
                    Subject: 'New Pet Match Job'
                }).promise();
            }
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Pet report created and matching triggered',
                petId: petId,
                matchJobsStarted: potentialMatches.Items.length
            })
        };
    } catch (error) {
        console.error('Create pet error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to create pet report', error: error.message })
        };
    }
};
