export default {
  subject: 'Your DiscBaboons Username',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Username Recovery</title>
    </head>
    <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Username Recovery</h2>
            <p>Hello!</p>
            <p>Your username is: <strong>{{username}}</strong>, you baboon.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p><small style="color: #666;">DiscBaboons Team</small></p>
        </div>
    </body>
    </html>
  `,
};
