const { sendCustomEmail, baseEmailTemplate } = require("../utils/email");

exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Ensure toEmail resolves to either EMAIL_USER or OAUTH_EMAIL depending on env config
        const toEmail = process.env.SUPPORT_EMAIL || process.env.OAUTH_EMAIL;

        if (!toEmail) {
            return res.status(500).json({ message: "Admin email not configured in environment." });
        }

        const emailSubject = `Contact Form: ${subject}`;
        const htmlContent = `
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                    <p style="margin-top: 0;"><strong>From Name:</strong> ${name}</p>
                    <p><strong>Reply-To Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p style="margin-bottom: 0;"><strong>Subject:</strong> ${subject}</p>
                </div>
                <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Message Content</h3>
                <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message.replace(/\n/g, '<br/>')}</p>
        `;
        const html = baseEmailTemplate("New Contact Us Message", htmlContent, 'contact');

        await sendCustomEmail({ to: toEmail, subject: emailSubject, html });

        res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
