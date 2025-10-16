# Affiliate Account Tracking

Track your affiliate account setup progress and credentials here.

---

## 🎯 Setup Progress

### Domain Registrars

- [ ] **Namecheap**
  - Status: ⏳ Pending signup
  - Program: https://www.namecheap.com/affiliates/
  - ID Format: Numeric (e.g., `12345`)
  - Env Variable: `AFF_NAMECHEAP_ID`
  - Current Value: `brandvalidator456` (placeholder)

- [ ] **GoDaddy**
  - Status: ⏳ Pending signup
  - Program: https://www.godaddy.com/affiliates (via CJ)
  - ID Format: Affiliate ID from CJ dashboard
  - Env Variable: `AFF_GODADDY_ID`
  - Current Value: `brandvalidator789` (placeholder)

- [ ] **Bluehost**
  - Status: ⏳ Pending signup
  - Program: https://www.bluehost.com/affiliates
  - ID Format: Tracking ID
  - Env Variable: `AFF_BLUEHOST_ID`
  - Current Value: `brandvalidator_bluehost` (placeholder)
  - **High Priority:** $65-130 per sale!

- [ ] **Domain.com**
  - Status: ⏳ Pending signup
  - Program: https://www.domain.com/affiliates
  - ID Format: Affiliate ID
  - Env Variable: `AFF_DOMAIN_COM_ID`
  - Current Value: `brandvalidator_domaincom` (placeholder)
  - **High Priority:** $50-100 per domain!

- [ ] **Hostinger**
  - Status: ⏳ Pending signup
  - Program: https://www.hostinger.com/affiliates
  - ID Format: Referral ID
  - Env Variable: `AFF_HOSTINGER_ID`
  - Current Value: `brandvalidator_hostinger` (placeholder)

- [ ] **Spaceship**
  - Status: ⏳ Pending signup
  - Program: https://spaceship.com/affiliates
  - ID Format: Referral code
  - Env Variable: `AFF_SPACESHIP_ID`
  - Current Value: `brandvalidator_spaceship` (placeholder)

### Logo Creators

- [x] **LogoAI** ✅
  - Status: ✅ **CONFIRMED**
  - Program: https://www.logoai.com/affiliates
  - ID Format: Coupon code
  - Env Variable: `AFF_LOGOAI_ID`
  - Current Value: `DomainHunk`
  - URL Parameter: `?coupon=DomainHunk`

- [ ] **Zoviz**
  - Status: ⏳ Pending signup
  - Program: https://ui.awin.com/merchant-profile/24648 (Awin Network)
  - ID Format: Awin affiliate ID
  - Env Variable: `AFF_ZOVIZ_ID`
  - Current Value: `brandvalidator_zoviz` (placeholder)
  - **Note:** Requires Awin publisher account first: https://www.awin.com/gb/publishers

- [ ] **LogoMe (LogoMaker)**
  - Status: ⏳ Pending signup
  - Program: https://logomaker.com/affiliates
  - ID Format: Referral ID
  - Env Variable: `AFF_LOGOME_ID`
  - Current Value: `brandvalidator_logome` (placeholder)

### Trademark Services

- [ ] **LegalZoom**
  - Status: ⏳ Pending signup
  - Program: https://www.legalzoom.com/affiliates
  - ID Format: Affiliate ID
  - Env Variable: `AFF_LEGALZOOM_ID`
  - Current Value: `brandvalidator_legalzoom` (placeholder)

- [ ] **Trademark Engine**
  - Status: ⏳ Pending signup
  - Program: Contact via website
  - ID Format: Referral code
  - Env Variable: `AFF_TRADEMARKENGINE_ID`
  - Current Value: `brandvalidator_tmengine` (placeholder)

- [ ] **Trademark Factory**
  - Status: ⏳ Pending signup
  - Program: https://trademarkfactory.com/affiliate
  - ID Format: Affiliate code
  - Env Variable: `AFF_TRADEMARKFACTORY_ID`
  - Current Value: `brandvalidator_tm` (placeholder)

- [ ] **CorpNet**
  - Status: ⏳ Pending signup
  - Program: https://www.corpnet.com/affiliates
  - ID Format: Partner ID
  - Env Variable: `AFF_CORPNET_ID`
  - Current Value: `brandvalidator_corpnet` (placeholder)

- [ ] **Rocket Lawyer**
  - Status: ⏳ Pending signup
  - Program: https://www.rocketlawyer.com/affiliates
  - ID Format: Affiliate ID
  - Env Variable: `AFF_ROCKETLAWYER_ID`
  - Current Value: `brandvalidator_rocketlawyer` (placeholder)

### Social Media Management

- [ ] **Buffer**
  - Status: ⏳ Pending signup
  - Program: https://buffer.com/affiliates
  - ID Format: Referral code
  - Env Variable: `AFF_BUFFER_ID`
  - Current Value: `brandvalidator_buffer` (placeholder)

- [ ] **Hootsuite**
  - Status: ⏳ Pending signup
  - Program: https://www.hootsuite.com/partners
  - ID Format: Partner ID
  - Env Variable: `AFF_HOOTSUITE_ID`
  - Current Value: `brandvalidator_hootsuite` (placeholder)

- [ ] **Later**
  - Status: ⏳ Pending signup
  - Program: https://later.com/affiliates
  - ID Format: Affiliate code
  - Env Variable: `AFF_LATER_ID`
  - Current Value: `brandvalidator_later` (placeholder)

- [ ] **Linktree**
  - Status: ⏳ Pending signup
  - Program: https://linktr.ee/affiliates
  - ID Format: Referral code
  - Env Variable: `AFF_LINKTREE_ID`
  - Current Value: `brandvalidator_linktree` (placeholder)

---

## 📊 Priority Order

### High Priority (Start Here)
1. ✅ **LogoAI** - DONE
2. **Bluehost** - $65-130/sale
3. **Domain.com** - $50-100/domain
4. **Namecheap** - Most popular registrar
5. **GoDaddy** - Largest market share

### Medium Priority
6. **LegalZoom** - $50-100 per trademark
7. **Buffer** - 15% recurring
8. **Hostinger** - 60% recurring
9. **Later** - 30% recurring

### Lower Priority
10. All remaining partners

---

## 🔄 Update Process

When you get approved for a new affiliate program:

1. Update this document with:
   - ✅ Check the box
   - Change status to "✅ Confirmed"
   - Add your actual affiliate ID/code

2. Update `.env.local`:
   ```bash
   # Example
   AFF_NAMECHEAP_ID=your_actual_id_here
   ```

3. Restart dev server:
   ```bash
   # Kill the running server (Ctrl+C)
   npm run dev
   ```

4. Test the affiliate link:
   - Open http://localhost:3001
   - Search for a test domain/brand
   - Click the affiliate button
   - Verify URL contains your affiliate ID

5. Check database tracking:
   ```bash
   npx prisma studio
   # Navigate to AffiliateClick table
   ```

---

## 📝 Notes Section

Use this space to track application dates, approval status, etc:

### AWIN Network ✅
- **Network ID:** 2618584
- **Platform:** https://www.awin.com
- Status: ✅ Approved
- Notes: Many partners available through AWIN (Namecheap, Bluehost, etc.)
- Available Programs to Join:
  - Namecheap (Program ID: check AWIN dashboard)
  - Bluehost (Program ID: check AWIN dashboard)
  - Domain.com (may be available)
  - Check AWIN for other domain/hosting programs

### Impact.com Network ✅
- **Platform:** https://impact.com
- **Verification:** ✅ Meta tag deployed to https://domainhunk.com
- **Verification Code:** 315d124e-5765-432e-b58f-621ae04015b7
- Status: ⏳ Awaiting final approval after verification
- Notes: Major affiliate network with many domain/hosting partners
- Available Programs to Join:
  - GoDaddy (likely available)
  - Hostinger (likely available)
  - Various domain/hosting services

### LogoAI ✅
- Applied: [Already set up]
- Approved: [Already approved]
- Affiliate URL: https://www.logoai.com/?coupon=DomainHunk
- Notes: Uses coupon parameter, confirmed working

### [Partner Name]
- Applied: YYYY-MM-DD
- Approved: YYYY-MM-DD
- Dashboard: [URL]
- Notes: [Any special requirements or observations]

---

## 🎯 Revenue Tracking

Once you have real IDs, track which partners perform best:

| Partner | Clicks | Conversions | Revenue | Best Performing Offer |
|---------|--------|-------------|---------|----------------------|
| LogoAI  | -      | -           | $0      | Logo creation        |
| Bluehost| -      | -           | $0      | -                    |
| ...     | -      | -           | $0      | -                    |

Update monthly from your affiliate dashboards.

---

Last Updated: 2025-10-16
