export default async function handler(req, res) {
    // Set CORS headers so it works smoothly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        
        // Vercel auto-detected geolocation headers
        const city = req.headers['x-vercel-ip-city'] || body.city || 'Unknown City';
        const region = req.headers['x-vercel-ip-country-region'] || '';
        const country = req.headers['x-vercel-ip-country'] || body.country || 'India';
        
        const isLead = body.isLead === true;
        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        let message;
        if (isLead) {
            message = 
`🔥 *NEW CLIENT INQUIRY RECEIVED!*
━━━━━━━━━━━━━━━━━━
👤 *Client Name:* ${body.name || 'Anonymous'}
📧 *Email:* ${body.email || 'N/A'}
📞 *Phone / WhatsApp:* ${body.phone || 'Not provided'}
💬 *Project Details:*
"${body.message || 'No details provided'}"
📍 *Location:* ${city}${region ? ', ' + region : ''}, ${country}
⏱️ *Time:* ${time} (IST)
━━━━━━━━━━━━━━━━━━
✉️ [Reply via Email](mailto:${body.email || ''})`;
        } else {
            const clientTag = body.client || 'Direct / Organic';
            const page = body.page || '/';
            const referrer = body.referrer || 'Direct Link / Bio';
            const device = body.device || 'Mobile / Desktop';
            const resolution = body.resolution || 'N/A';

            message = 
`🚨 *NEW PORTFOLIO VISITOR!*
━━━━━━━━━━━━━━━━━━
🎯 *Target Client:* \`${clientTag}\`
📍 *Location:* ${city}${region ? ', ' + region : ''}, ${country}
📱 *Device:* ${device} (${resolution})
🔗 *Source:* ${referrer}
📄 *Page:* \`${page}\`
⏱️ *Time:* ${time} (IST)
━━━━━━━━━━━━━━━━━━
🌐 [Open Live Site](https://jesnowbijuportfolio.vercel.app/)`;
        }

        const botToken = '8749893348:AAEYI6xG49BWwZbzPPzcKp1DmhF0FYrrrwI';
        const chatId = '938770367';

        const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const data = await telegramRes.json();
        return res.status(200).json({ success: true, telegram: data });
    } catch (err) {
        console.error('Telegram notification error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
