export default {
  subject: 'Password Reset Request - Don\'t be a baboon!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Password Reset Request</h2>
            <p>Hello there!</p>
            <p>Your password reset code is: <strong>{{resetCode}}</strong></p>
            <p>This code will expire in 30 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>If you did request this, please don't forget your password again, you baboon.</p>
            <hr>
            <p><small>DiscBaboons Team</small></p>
        </div>
    </body>
    </html>
  `,
};
