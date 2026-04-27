const ALERTS_TABLE = process.env.ALERTS_TABLE || 'pm-alerts';

const AWS = require('aws-sdk');
const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

exports.sendNotification = async (event) => {
    console.log('Send notification request:', event);
    
    const { message, phone, topic } = JSON.parse(event.body);
    
    if (!message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Message required' })
        };
    }
    
    try {
        let publishParams = {
            Message: message
        };
        
        if (phone) {
            publishParams.TopicArn = topic || process.env.ALERTS_TOPIC_ARN;
        } else if (topic) {
            publishParams.TopicArn = topic;
        } else {
            publishParams.TopicArn = process.env.ALERTS_TOPIC_ARN;
        }
        
        const result = await sns.publish(publishParams).promise();
        
        // Log notification in DynamoDB
        const notificationId = uuid.v4();
        const timestamp = new Date().toISOString();
        
        await dynamodb.put({
            TableName: ALERTS_TABLE,
            Item: {
                id: notificationId,
                message: message,
                phone: phone,
                status: 'sent',
                messageId: result.MessageId,
                sentAt: timestamp,
                ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
            }
        }).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Notification sent successfully',
                messageId: result.MessageId
            })
        };
    } catch (error) {
        console.error('Send notification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to send notification', error: error.message })
        };
    }
};
