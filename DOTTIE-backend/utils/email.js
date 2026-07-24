const { Resend } = require('resend');
let resendClient = null;

function getResendClient() {
    if (resendClient) return resendClient;
    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    if (!apiKey) {
        console.warn('⚠️  [EMAIL_SERVICE] NOT_CONFIGURED: Missing RESEND_API_KEY / EMAIL_API_KEY. All emails will be suppressed (stubbed).');
        return null;
    }
    console.log(`🔑 [EMAIL_SERVICE] Configured with key prefix: ${String(apiKey).slice(0, 6)}... (from ${process.env.RESEND_API_KEY ? 'RESEND_API_KEY' : 'EMAIL_API_KEY'})`);
    resendClient = new Resend(apiKey);
    return resendClient;
}

async function sendEmail({ email, subject, message, html }) {
    const client = getResendClient();
    if (!client) {
        console.warn('⚠️  [EMAIL_SERVICE] NOT_CONFIGURED: Missing RESEND_API_KEY. Email suppressed.');
        console.log(`[STUB] To: ${email}\n[STUB] Subject: ${subject}`);
        return;
    }

    try {
        console.log(`📨 [EMAIL_SERVICE] Attempting delivery to: ${email}...`);

        const data = await getResendClient().emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: subject,
            html: html || message
        });

        console.log(`✅ [EMAIL_SERVICE] Success for ${email}:`, data.data?.id);
        return data;
    } catch (error) {
        // Resend SDK errors often include a structured `error` array with reasons
        const detail = error?.response?.data || error?.error || error?.message || error;
        console.error(`❌ [EMAIL_SERVICE] Delivery failed for ${email}:`, detail);
        throw error;
    }
}

async function notifyNewDrop(userEmails, dropDetails) {
    const { title, name, description, image_url } = dropDetails;
    const dropName = title || name || 'New Collection';
    const dropDesc = description || 'Our latest collection has arrived. Premium streetwear from Kigali.';
    const dropImage = image_url || 'https://placehold.co/600x400/000000/FFFFFF/png?text=F%3ef+NEW+DROP';
    const shopUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://DOTTIE.YZ.rw';

    const subject = `NEW DROP: ${dropName} - Now Live`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #1a1a1a;">
                            <!-- Header -->
                            <tr>
                                <td align="center" style="padding: 40px 40px 20px;">
                                    <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #fff; letter-spacing: -1px; font-family: 'Space Grotesk', sans-serif;">DOTTIE<span style="color: #2563eb;">.</span>YZ</h1>
                                    <p style="margin: 8px 0 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 4px; font-weight: 600;">Premium Streetwear</p>
                                </td>
                            </tr>
                            
                            <!-- Image -->
                            <tr>
                                <td align="center" style="padding: 20px 40px;">
                                    <div style="display: inline-block; overflow: hidden; border: 1px solid #1a1a1a;">
                                        <img src="${dropImage}" alt="${dropName}" width="520" style="display: block; max-width: 100%; height: auto;">
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td align="center" style="padding: 20px 40px 30px;">
                                    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1px; font-family: 'Space Grotesk', sans-serif;">${dropName}</h2>
                                    <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; max-width: 400px;">${dropDesc}</p>
                                </td>
                            </tr>
                            
                            <!-- CTA Button -->
                            <tr>
                                <td align="center" style="padding: 0 40px 40px;">
                                    <a href="https://DOTTIE.YZrw.netlify.app/shop" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 16px 40px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-family: 'Space Grotesk', sans-serif;">Shop the Drop</a>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td align="center" style="padding: 30px 40px; border-top: 1px solid #1a1a1a;">
                                    <p style="margin: 0 0 12px; font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 2px;">
                                        <a href="https://instagram.com/dottie.yz" style="color: #71717a; text-decoration: none; margin: 0 8px;">Instagram</a>
                                        <span style="color: #333;">|</span>
                                        <a href="mailto:dottieyz01@gmail.com" style="color: #71717a; text-decoration: none; margin: 0 8px;">Email</a>
                                    </p>
                                    <p style="margin: 0; font-size: 10px; color: #444; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 DOTTIE.YZ. All Rights Reserved.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    console.log(`[BATCH_NOTIFY] Initializing mailing for ${userEmails.length} subscribers...`);
    const results = await Promise.allSettled(userEmails.map(email => sendEmail({ email, subject, html })));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[BATCH_NOTIFY] Completed. Success: ${successful} | Failed: ${failed}`);
}

async function notifyLiveDrop(userEmails, dropDetails) {
    const { title, name, description, image_url } = dropDetails;
    const dropName = title || name || 'New Drop';
    const dropImage = image_url || 'https://placehold.co/600x400/000000/FFFFFF/png?text=F%3EF+LIVE+NOW';
    const shopUrl = process.env.CLIENT_URL || 'https://DOTTIE.YZ.rw';

    const subject = `🔥 ${dropName} IS LIVE NOW!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center; border: 1px solid #1a1a1a;">
            <h1 style="letter-spacing: -1px; font-size: 36px; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif;">DOTTIE<span style="color: #2563eb;">.</span>YZ</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #2563eb; margin-top: 0; font-weight: 700;">Now Live</p>
            
            <div style="margin: 40px 0;">
                <img src="${dropImage}" alt="${dropName}" style="width: 100%; max-height: 400px; object-fit: cover; border: 1px solid #444;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 24px; margin-bottom: 10px; font-family: 'Space Grotesk', sans-serif;">NOW LIVE.</h2>
            <p style="font-size: 14px; color: #aaa; margin-bottom: 30px;">The <strong>${dropName}</strong> collection is officially live. Quantities are limited.</p>
            
            <a href="${shopUrl}/shop.html" style="background: #2563eb; color: #fff; text-decoration: none; padding: 16px 48px; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; font-family: 'Space Grotesk', sans-serif; display: inline-block;">Shop Now</a>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1a1a1a; font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 1px;">
                &copy; 2026 DOTTIE.YZ. All Rights Reserved.
            </div>
        </div>
    `;

    console.log(`[LIVE_BATCH] Broadcasting live alert to ${userEmails.length} users...`);
    const results = await Promise.allSettled(userEmails.map(email => sendEmail({ email, subject, html })));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[LIVE_BATCH] Broadcasting finished. Success: ${successful} | Failed: ${failed}`);
}

async function notifyReservation(userEmail, reservationData, productData) {
    const { fullName, phone, size, color, quantity, storeMode } = reservationData;
    const productName = productData?.name || 'Product';
    const productPrice = productData?.price ? `${productData.price.toLocaleString()} FRW` : 'N/A';
    const productImage = (productData?.image_urls && productData.image_urls.length > 0) ? productData.image_urls[0] : 'https://placehold.co/400x400?text=F%3EF+Reservations';

    const subject = `RESERVATION CONFIRMED: ${productName}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; text-align: center;">
            <h1 style="letter-spacing: -1px; font-size: 36px; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif;">DOTTIE<span style="color: #2563eb;">.</span>YZ</h1>
            <p style="text-transform: uppercase; letter-spacing: 5px; font-size: 10px; color: #2563eb; margin-top: 0; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">Reservation Confirmed</p>
            
            <div style="margin: 30px 0;">
                <img src="${productImage}" alt="${productName}" style="width: 100%; max-width: 250px; border: 1px solid #1a1a1a;">
            </div>
            
            <h2 style="text-transform: uppercase; font-size: 20px; margin-bottom: 10px; font-family: 'Space Grotesk', sans-serif;">${productName}</h2>
            <p style="font-size: 14px; color: #a1a1aa; margin-bottom: 30px;">
                Reservation confirmed for <strong>${productName}</strong>.<br>
                Mode: <span style="color: #fff; text-transform: uppercase;">${storeMode}</span>
            </p>
            
            <div style="background: #111; padding: 20px; border: 1px solid #1a1a1a; text-align: left; margin-bottom: 30px;">
                <p style="margin: 5px 0; font-size: 12px; color: #71717a;">Size: <span style="color: #fff;">${size}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #71717a;">Color: <span style="color: #fff;">${color}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #71717a;">Quantity: <span style="color: #fff;">${quantity}</span></p>
                <p style="margin: 5px 0; font-size: 12px; color: #71717a;">Price: <span style="color: #fff;">${productPrice}</span></p>
            </div>
            
            <p style="font-size: 13px; color: #71717a; margin-bottom: 30px;">Our team will contact you shortly via ${phone} for final fulfillment details.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1a1a1a; font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 1px;">
                &copy; 2026 DOTTIE.YZ. All Rights Reserved.
            </div>
        </div>
    `;

    await sendEmail({ email: userEmail, subject, html });

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim() !== '') {
        await sendEmail({
            email: process.env.ADMIN_EMAIL,
            subject: `🚨 NEW RESERVATION ALERT: ${fullName}`,
            message: `New reservation received from ${fullName} (${userEmail}) for ${productName}. Phone: ${phone}. Mode: ${storeMode}.`
        });
    }
}

module.exports = {
    sendEmail,
    notifyNewDrop,
    notifyLiveDrop,
    notifyReservation
};
