// Lambda: Image Recognition and Pet Matching using Rekognition DetectLabels
// Handler: matchPets

const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const PETS_TABLE = process.env.PETS_TABLE || 'pets';
const MATCHES_TABLE = process.env.MATCHES_TABLE || 'pet-matches';
const S3_BUCKET = process.env.S3_BUCKET || 'petmatch-images';

exports.matchPets = async (event) => {
    console.log('Match pets request:', event);
    
    // Can be triggered via API or SNS
    let lostPetId, foundPetId;
    
    if (event.Records) {
        // SNS Trigger
        const message = JSON.parse(event.Records[0].Sns.Message);
        lostPetId = message.lostPetId;
        foundPetId = message.foundPetId;
    } else {
        // API Trigger
        const body = JSON.parse(event.body);
        lostPetId = body.lostPetId;
        foundPetId = body.foundPetId;
    }
    
    if (!lostPetId || !foundPetId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Lost pet ID and found pet ID required' })
        };
    }
    
    try {
        // Get both pet records
        const [lostPet, foundPet] = await Promise.all([
            dynamodb.get({ TableName: PETS_TABLE, Key: { id: lostPetId } }).promise(),
            dynamodb.get({ TableName: PETS_TABLE, Key: { id: foundPetId } }).promise()
        ]);
        
        if (!lostPet.Item || !foundPet.Item) {
            return { statusCode: 404, body: JSON.stringify({ message: 'One or both pets not found' }) };
        }
        
        // Extract image keys from URLs
        const lostImageKey = extractS3Key(lostPet.Item.imageUrl);
        const foundImageKey = extractS3Key(foundPet.Item.imageUrl);
        
        // Get labels for both images
        const [lostLabels, foundLabels] = await Promise.all([
            getLabels(lostImageKey),
            getLabels(foundImageKey)
        ]);
        
        // Calculate similarity based on overlapping labels
        const matchScore = calculateSimilarity(lostLabels, foundLabels);
        
        // Save match result
        const matchId = uuid.v4();
        const timestamp = new Date().toISOString();
        
        const matchItem = {
            id: matchId,
            lostPetId: lostPetId,
            foundPetId: foundPetId,
            lostPetName: lostPet.Item.name,
            foundPetName: foundPet.Item.name,
            lostUserEmail: lostPet.Item.userId, // Usually we'd look up the user's email
            foundUserEmail: foundPet.Item.userId,
            matchScore: matchScore,
            status: matchScore > 0.6 ? 'high-confidence' : 'manual-review',
            createdAt: timestamp,
            updatedAt: timestamp
        };
        
        await dynamodb.put({
            TableName: MATCHES_TABLE,
            Item: matchItem
        }).promise();
        
        // If high confidence match, send SNS notification
        if (matchScore > 0.6) {
            const sns = new AWS.SNS();
            await sns.publish({
                TopicArn: process.env.MATCHES_TOPIC_ARN,
                Message: `Possible Pet Match Found!\n\nLost Pet: ${lostPet.Item.name} (${lostPet.Item.species})\nFound Pet: ${foundPet.Item.name || 'Unknown'}\nConfidence Score: ${Math.round(matchScore * 100)}%\n\nPlease check the PetMatch app for details.`,
                Subject: 'Pet Match Alert!'
            }).promise();
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Match analysis completed',
                matchId: matchId,
                matchScore: matchScore,
                status: matchItem.status
            })
        };
    } catch (error) {
        console.error('Match error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to process match', error: error.message })
        };
    }
};

async function getLabels(imageKey) {
    const params = {
        Image: { S3Object: { Bucket: S3_BUCKET, Name: imageKey } },
        MaxLabels: 20,
        MinConfidence: 70
    };
    const response = await rekognition.detectLabels(params).promise();
    return response.Labels.map(l => ({ name: l.Name.toLowerCase(), confidence: l.Confidence }));
}

function calculateSimilarity(labelsA, labelsB) {
    const namesA = labelsA.map(l => l.name);
    const namesB = labelsB.map(l => l.name);
    
    // Common labels (weighted by confidence if we wanted to be fancy)
    const intersection = namesA.filter(name => namesB.includes(name));
    
    // Filter out generic labels like "pet", "animal", "mammal" to focus on specifics like "golden retriever"
    const generics = ['pet', 'animal', 'mammal', 'canine', 'feline', 'vertebrate'];
    const specificIntersection = intersection.filter(name => !generics.includes(name));
    const specificA = namesA.filter(name => !generics.includes(name));
    
    if (specificA.length === 0) return 0;
    
    // Simple Jaccard-ish similarity for specific labels
    return specificIntersection.length / Math.max(specificA.length, 1);
}

function extractS3Key(imageUrl) {
    try {
        const url = new URL(imageUrl);
        return url.pathname.substring(1); // Remove leading slash
    } catch (e) {
        return imageUrl.split('.s3.amazonaws.com/')[1] || imageUrl;
    }
}
