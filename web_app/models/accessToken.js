const db = require('../db');

const accessTokenSchema = new db.Schema({
    name: String,
    value: String, // The access token value is a string
    expiresAt: Date // Field to store when the access token will expire
});

const accessToken = db.model('AccessToken', accessTokenSchema, 'accessTokens');

module.exports = accessToken;
