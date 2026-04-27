const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

async function fixUrls() {
    const TableName = 'pm-pets-dev';
    const scan = await dynamodb.scan({ TableName }).promise();
    
    for (const item of scan.Items) {
        if (item.imageUrl && !item.imageUrl.includes('.ap-south-1.')) {
            const newUrl = item.imageUrl.replace('.s3.amazonaws.com', '.s3.ap-south-1.amazonaws.com');
            console.log(`Fixing URL for ${item.name}: ${newUrl}`);
            await dynamodb.update({
                TableName,
                Key: { id: item.id },
                UpdateExpression: 'set imageUrl = :u',
                ExpressionAttributeValues: { ':u': newUrl }
            }).promise();
        }
    }
    console.log('Done fixing URLs!');
}

fixUrls();
