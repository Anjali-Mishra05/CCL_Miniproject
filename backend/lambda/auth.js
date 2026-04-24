'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto');

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const COGNITO_POOL_ID = process.env.COGNITO_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USERS_TABLE = process.env.USERS_TABLE;

// ==================== USER SIGNUP ====================

exports.userSignUp = async (event) => {
    try {
        const { email, password, name, phone } = JSON.parse(event.body);

        // Validate input
        if (!email || !password || !name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Email, password, and name are required' })
            };
        }

        // Create Cognito user
        const cognitoParams = {
            UserPoolId: COGNITO_POOL_ID,
            Username: email,
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS',
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'false' },
                { Name: 'name', Value: name },
                { Name: 'phone_number', Value: phone || '' }
            ]
        };

        await cognito.adminCreateUser(cognitoParams).promise();

        // Set permanent password
        await cognito.adminSetUserPassword({
            UserPoolId: COGNITO_POOL_ID,
            Username: email,
            Password: password,
            Permanent: true
        }).promise();

        // Create user in DynamoDB
        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: {
                userId: crypto.randomUUID(),
                email,
                name,
                phone: phone || '',
                type: 'user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                reports: []
            }
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'User created successfully',
                user: { email, name }
            })
        };
    } catch (error) {
        console.error('Signup error:', error);

        // Handle duplicate user
        if (error.code === 'UsernameExistsException') {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'User already exists' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        };
    }
};

// ==================== USER SIGNIN ====================

exports.userSignIn = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Email and password are required' })
            };
        }

        const authParams = {
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            UserPoolId: COGNITO_POOL_ID,
            ClientId: COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        };

        const authResponse = await cognito.adminInitiateAuth(authParams).promise();

        // Get user details
        const userResponse = await cognito.adminGetUser({
            UserPoolId: COGNITO_POOL_ID,
            Username: email
        }).promise();

        const userAttributes = userResponse.UserAttributes.reduce((acc, attr) => {
            acc[attr.Name] = attr.Value;
            return acc;
        }, {});

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Login successful',
                tokens: {
                    accessToken: authResponse.AuthenticationResult.AccessToken,
                    idToken: authResponse.AuthenticationResult.IdToken,
                    refreshToken: authResponse.AuthenticationResult.RefreshToken
                },
                user: {
                    email: userAttributes.email,
                    name: userAttributes.name,
                    phone: userAttributes.phone_number
                }
            })
        };
    } catch (error) {
        console.error('Signin error:', error);

        if (error.code === 'NotAuthorizedException') {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid email or password' })
            };
        }

        if (error.code === 'UserNotFoundException') {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'User not found' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        };
    }
};

// ==================== REFRESH TOKEN ====================

exports.refreshToken = async (event) => {
    try {
        const { refreshToken } = JSON.parse(event.body);

        if (!refreshToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Refresh token is required' })
            };
        }

        const authParams = {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: COGNITO_CLIENT_ID,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        };

        const authResponse = await cognito.initiateAuth(authParams).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Token refreshed',
                accessToken: authResponse.AuthenticationResult.AccessToken,
                idToken: authResponse.AuthenticationResult.IdToken
            })
        };
    } catch (error) {
        console.error('Token refresh error:', error);
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Invalid or expired refresh token' })
        };
    }
};
