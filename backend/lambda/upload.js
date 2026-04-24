// Lambda: Upload to S3 (Presigned URL)
// Handler: getPresignedUrl

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const uuid = require('uuid');

const S3_BUCKET = process.env.S3_BUCKET || 'petmatch-images';

exports.getPresignedUrl = async (event) => {
    console.log('Presigned URL request:', event);
    
    const userId = event.requestContext.authorizer.claims.sub;
    const { fileName, fileType } = JSON.parse(event.body);
    
    if (!fileName || !fileType) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'fileName and fileType required' })
        };
    }
    
    try {
        const fileExtension = fileName.split('.').pop();
        const fileKey = `${userId}/${uuid.v4()}.${fileExtension}`;
        
        const presignedUrl = s3.getSignedUrl('putObject', {
            Bucket: S3_BUCKET,
            Key: fileKey,
            ContentType: fileType,
            Expires: 3600 // 1 hour
        });
        
        const fileUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${fileKey}`;
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                presignedUrl: presignedUrl,
                fileUrl: fileUrl,
                fileKey: fileKey
            })
        };
    } catch (error) {
        console.error('Presigned URL error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to generate presigned URL', error: error.message })
        };
    }
};
