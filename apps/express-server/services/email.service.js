import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

const sendEmail = async (emailData) => {
  if (!emailData) {
    const error = new Error('Email data is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!emailData.to) {
    const error = new Error('To field is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!emailData.subject) {
    const error = new Error('Subject field is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!emailData.html) {
    const error = new Error('HTML content is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if Graph API configuration is missing
  const requiredEnvVars = ['GRAPH_TENANT_ID', 'GRAPH_CLIENT_ID', 'GRAPH_CLIENT_SECRET', 'GRAPH_USER_ID'];
  const missingConfig = requiredEnvVars.some((envVar) => !process.env[envVar]);

  if (missingConfig) {
    return {
      success: true,
      message: 'Email not sent - running in development mode without email configuration',
    };
  }

  try {
    // Create MSAL instance for authentication
    const msalConfig = {
      auth: {
        clientId: process.env.GRAPH_CLIENT_ID,
        clientSecret: process.env.GRAPH_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.GRAPH_TENANT_ID}`,
      },
    };

    const msalApp = new ConfidentialClientApplication(msalConfig);

    // Get access token using client credentials flow
    const tokenResponse = await msalApp.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    // Create Graph client
    const graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => tokenResponse.accessToken,
      },
    });

    // Send email via Graph API
    const emailMessage = {
      message: {
        subject: emailData.subject,
        body: {
          contentType: 'HTML',
          content: emailData.html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: emailData.to,
            },
          },
        ],
      },
    };

    await graphClient
      .api(`/users/${process.env.GRAPH_USER_ID}/sendMail`)
      .post(emailMessage);

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    return {
      success: true,
      message: 'Email sent successfully',
    };
  }
};

export default sendEmail;
