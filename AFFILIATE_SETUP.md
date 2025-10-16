# Affiliate Program Setup Guide

This guide will help you replace the placeholder affiliate IDs with real ones from each partner program.

## 🎯 Quick Start

All affiliate IDs are stored in `.env.local`. After obtaining your IDs, replace the placeholder values and restart your dev server.

---

## 📦 Domain Registrars

### 1. **Namecheap** (Recommended)
- **Sign up:** https://www.namecheap.com/affiliates/
- **Commission:** ~$15-50 per domain sale
- **ID Format:** Numeric affiliate ID
- **Env Variable:** `AFF_NAMECHEAP_ID`
- **Notes:** Popular registrar, requires approval

### 2. **GoDaddy**
- **Sign up:** https://www.godaddy.com/affiliates
- **Commission:** 5-15% + bonuses
- **ID Format:** Affiliate ID from dashboard
- **Env Variable:** `AFF_GODADDY_ID`
- **Notes:** Largest registrar, requires CJ (Commission Junction) account

### 3. **Bluehost**
- **Sign up:** https://www.bluehost.com/affiliates
- **Commission:** $65-$130 per sale
- **ID Format:** Tracking ID from dashboard
- **Env Variable:** `AFF_BLUEHOST_ID`
- **Notes:** Excellent commissions, hosting + domains, WordPress recommended

### 4. **Domain.com**
- **Sign up:** https://www.domain.com/affiliates
- **Commission:** $50-100 per domain
- **ID Format:** Affiliate ID
- **Env Variable:** `AFF_DOMAIN_COM_ID`
- **Notes:** High payouts, easy approval, clean interface

### 5. **Hostinger**
- **Sign up:** https://www.hostinger.com/affiliates
- **Commission:** 60% recurring
- **ID Format:** Your referral ID
- **Env Variable:** `AFF_HOSTINGER_ID`
- **Notes:** High commissions, hosting + domains

### 6. **Spaceship**
- **Sign up:** https://spaceship.com/affiliates
- **Commission:** Up to 20%
- **ID Format:** Referral code
- **Env Variable:** `AFF_SPACESHIP_ID`
- **Notes:** Clean UI, good for startups

---

## 🎨 Logo Creator Tools

### 1. **LogoAI**
- **Sign up:** https://www.logoai.com/affiliates
- **Commission:** 30-40%
- **ID Format:** Coupon code (e.g., "DomainHunk")
- **Env Variable:** `AFF_LOGOAI_ID`
- **Notes:** AI-powered logo generation, uses coupon parameter for tracking
- **Example URL:** `https://www.logoai.com/?coupon=YourCode`

### 2. **Zoviz**
- **Sign up:** https://ui.awin.com/merchant-profile/24648 (via Awin network)
- **Commission:** Varies by Awin tier
- **ID Format:** Awin affiliate ID
- **Env Variable:** `AFF_ZOVIZ_ID`
- **Notes:** Requires Awin publisher account. Apply at https://www.awin.com/gb/publishers

### 3. **LogoMe (LogoMaker.com)**
- **Sign up:** https://logomaker.com/affiliates
- **Commission:** 20-30%
- **ID Format:** Referral ID
- **Env Variable:** `AFF_LOGOME_ID`
- **Notes:** Established brand, good conversion

---

## ™️ Trademark Services

### 1. **LegalZoom**
- **Sign up:** https://www.legalzoom.com/affiliates
- **Commission:** $50-100+ per sale
- **ID Format:** Affiliate ID
- **Env Variable:** `AFF_LEGALZOOM_ID`
- **Notes:** Most popular, requires approval

### 2. **Trademark Engine**
- **Sign up:** Contact via website
- **Commission:** Varies
- **ID Format:** Referral code
- **Env Variable:** `AFF_TRADEMARKENGINE_ID`
- **Notes:** May need direct contact

### 3. **Trademark Factory**
- **Sign up:** https://trademarkfactory.com/affiliate
- **Commission:** High ticket commissions
- **ID Format:** Affiliate code
- **Env Variable:** `AFF_TRADEMARKFACTORY_ID`
- **Notes:** Good for serious trademark filers

### 4. **CorpNet**
- **Sign up:** https://www.corpnet.com/affiliates
- **Commission:** 15-20%
- **ID Format:** Partner ID
- **Env Variable:** `AFF_CORPNET_ID`
- **Notes:** Business formation + trademarks

### 5. **Rocket Lawyer**
- **Sign up:** https://www.rocketlawyer.com/affiliates
- **Commission:** Recurring + per-sale
- **ID Format:** Affiliate ID
- **Env Variable:** `AFF_ROCKETLAWYER_ID`
- **Notes:** Subscription model, recurring revenue

---

## 📱 Social Media Management Tools

### 1. **Buffer**
- **Sign up:** https://buffer.com/affiliates
- **Commission:** 15% recurring
- **ID Format:** Referral code
- **Env Variable:** `AFF_BUFFER_ID`
- **Notes:** Easy approval, recurring commissions

### 2. **Hootsuite**
- **Sign up:** https://www.hootsuite.com/partners
- **Commission:** Varies by plan
- **ID Format:** Partner ID
- **Env Variable:** `AFF_HOOTSUITE_ID`
- **Notes:** Enterprise focus, requires approval

### 3. **Later**
- **Sign up:** https://later.com/affiliates
- **Commission:** 30% recurring
- **ID Format:** Affiliate code
- **Env Variable:** `AFF_LATER_ID`
- **Notes:** Instagram/visual focus

### 4. **Linktree**
- **Sign up:** https://linktr.ee/affiliates
- **Commission:** 20% recurring
- **ID Format:** Referral code
- **Env Variable:** `AFF_LINKTREE_ID`
- **Notes:** Popular for creators

---

## 🔧 Testing Your Affiliate Links

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Each Partner
Click through affiliate buttons in your app and verify the URL contains your affiliate ID:
- Domain links: `?affid=YOUR_ID` or `?affId=YOUR_ID`
- Logo/SaaS links: `?ref=YOUR_ID`

### 3. Check Analytics
Your app tracks all affiliate clicks in the database:
```bash
npx prisma studio
```
Navigate to `AffiliateClick` table to see tracked clicks.

---

## 📊 Tracking & Analytics

The app automatically tracks:
- ✅ Affiliate clicks (which partner, when, session)
- ✅ Source tracking (UTM parameters)
- ✅ Conversion attribution (30-day cookie)
- ✅ Geographic data (IP-based)

View analytics:
```bash
npx prisma studio
# Check tables: AffiliateClick, Session, AnalyticsEvent
```

---

## 🚀 Optimization Tips

### 1. **A/B Test Partner Order**
The first partner in each dropdown is the default. Test different orders to see what converts best.

### 2. **Add Custom UTM Parameters**
All links include UTM tracking. Customize in:
- `src/lib/services/affiliates.ts`
- Look for `utm_source`, `utm_medium`, `utm_campaign`

### 3. **Monitor Performance**
Track which partners generate the most clicks/revenue:
```sql
SELECT partner, COUNT(*) as clicks
FROM AffiliateClick
GROUP BY partner
ORDER BY clicks DESC;
```

### 4. **Update Commission Rates**
Some programs have performance tiers. As you grow, negotiate higher rates.

---

## ⚠️ Important Notes

1. **Replace ALL Placeholders:** The current IDs like `brandvalidator123` are fake and won't work
2. **Read Terms:** Each program has specific terms about cookie windows, payouts, etc.
3. **Disclosure:** Add affiliate disclosure to your site footer (legal requirement)
4. **Testing:** Test in incognito mode to avoid tracking your own clicks
5. **Cookie Duration:** Most programs track 30-90 days after click

---

## 🆘 Troubleshooting

### Links Don't Include Affiliate ID
- Check `.env.local` has correct variable names (must match exactly)
- Restart dev server after changing `.env.local`
- Check browser console for errors

### Clicks Not Tracked
- Verify database is running: `npx prisma studio`
- Check `AffiliateClick` table for entries
- Ensure CORS isn't blocking API calls

### Partner Rejects Application
- Apply with a live domain (not localhost)
- Explain your niche: "brand validation tool for entrepreneurs"
- Show traffic metrics if you have them
- Some programs have minimum traffic requirements

---

## 📈 Growth Strategy

1. **Start Small:** Get approved by 2-3 programs in each category
2. **Test:** See which partners convert best for your audience
3. **Optimize:** Focus on high-converting partners
4. **Expand:** Add more partners as you grow
5. **Negotiate:** Once you have volume, negotiate exclusive deals

---

## 📝 Example: Complete Setup for Namecheap

1. Go to https://www.namecheap.com/affiliates/
2. Click "Join Program"
3. Fill out application with:
   - Website: yourdomain.com
   - Description: "Brand validation tool helping entrepreneurs check domain availability"
   - Traffic: Your monthly visitors
4. Get approved (usually 24-48 hours)
5. Copy your affiliate ID from dashboard
6. Update `.env.local`:
   ```bash
   AFF_NAMECHEAP_ID=your_real_namecheap_id_here
   ```
7. Restart dev server
8. Test by clicking "Continue" button on Domain Verify panel
9. Verify URL includes `affId=your_real_namecheap_id_here`

Repeat for each partner!

---

## 💰 Revenue Estimates

With 1000 monthly users:
- **Domain Sales (2% conversion):** 20 sales × $15 avg = **$300/mo**
- **Logo Sales (1% conversion):** 10 sales × $40 avg = **$400/mo**
- **Trademark Sales (0.5% conversion):** 5 sales × $75 avg = **$375/mo**
- **Social Tools (3% conversion):** 30 signups × $5 avg = **$150/mo**

**Total Potential:** ~$1,225/month from 1000 users

Scale this based on your traffic!
