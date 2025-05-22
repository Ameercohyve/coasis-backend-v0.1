const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
];

function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );
}

function getAuthUrl() {
    const oauth2Client = getOAuthClient();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });
    return { authUrl, oauth2Client };
}

module.exports = { getOAuthClient, getAuthUrl };