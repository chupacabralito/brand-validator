# Affiliate Link Testing Checklist

Use this checklist to verify all your affiliate links are working correctly.

## 🔍 Before Testing

- [ ] All affiliate IDs added to `.env.local`
- [ ] Dev server restarted: `npm run dev`
- [ ] Using incognito/private browsing window
- [ ] Browser console open (F12) to check for errors

---

## 🌐 Domain Registrars (6 partners)

Test by searching for a domain like "example-test-123.com"

### Continue Button Dropdown
- [ ] **Porkbun** - Click Continue → dropdown → Porkbun
  - URL should contain: `porkbun.com` + `affid=YOUR_PORKBUN_ID`

- [ ] **Namecheap** - Click Continue → dropdown → Namecheap
  - URL should contain: `namecheap.com` + `affId=YOUR_NAMECHEAP_ID`

- [ ] **GoDaddy** (Default) - Click Continue (direct)
  - URL should contain: `godaddy.com` + `affid=YOUR_GODADDY_ID`

- [ ] **Hostinger** - Click Continue → dropdown → Hostinger
  - URL should contain: `hostinger.com` + `affid=YOUR_HOSTINGER_ID`

- [ ] **Network Solutions** - Click Continue → dropdown → Network Solutions
  - URL should contain: `networksolutions.com` + `affid=YOUR_NETSOL_ID`

- [ ] **Spaceship** - Click Continue → dropdown → Spaceship
  - URL should contain: `spaceship.com` + `affid=YOUR_SPACESHIP_ID`

---

## 🎨 Logo Creators (3 partners)

Test by entering an idea like "coffee shop startup"

### Create Logo Button Dropdown
- [ ] **LogoAI** (Default) - Click Create Logo (direct)
  - URL should contain: `logoai.com` + `ref=YOUR_LOGOAI_ID`

- [ ] **Zoviz** - Click Create Logo → dropdown → Zoviz
  - URL should contain: `zoviz.com` + `ref=YOUR_ZOVIZ_ID`

- [ ] **LogoMe** - Click Create Logo → dropdown → LogoMe
  - URL should contain: `logomaker.com` + `ref=YOUR_LOGOME_ID`

---

## ™️ Trademark Services (5 partners)

Test by entering a brand name

### File Trademark Button Dropdown
- [ ] **LegalZoom** (Default) - Click File Trademark (direct)
  - URL should contain: `legalzoom.com` + `aid=YOUR_LEGALZOOM_ID`

- [ ] **Trademark Engine** - Click File Trademark → dropdown → Trademark Engine
  - URL should contain: `trademarkengine.com` + `ref=YOUR_TMENGINE_ID`

- [ ] **Trademark Factory** - Click File Trademark → dropdown → Trademark Factory
  - URL should contain: `trademarkfactory.com` + `ref=YOUR_TMFACTORY_ID`

- [ ] **CorpNet** - Click File Trademark → dropdown → CorpNet
  - URL should contain: `corpnet.com` + `ref=YOUR_CORPNET_ID`

- [ ] **Rocket Lawyer** - Click File Trademark → dropdown → Rocket Lawyer
  - URL should contain: `rocketlawyer.com` + `aid=YOUR_ROCKETLAWYER_ID`

---

## 📱 Social Media Tools (4 partners)

Test by entering a brand handle

### Manage Handles Button Dropdown
- [ ] **Buffer** (Default) - Click Manage Handles (direct)
  - URL should contain: `buffer.com` + `ref=YOUR_BUFFER_ID`

- [ ] **Hootsuite** - Click Manage Handles → dropdown → Hootsuite
  - URL should contain: `hootsuite.com` + `ref=YOUR_HOOTSUITE_ID`

- [ ] **Later** - Click Manage Handles → dropdown → Later
  - URL should contain: `later.com` + `ref=YOUR_LATER_ID`

- [ ] **Linktree** - Click Manage Handles → dropdown → Linktree
  - URL should contain: `linktr.ee` + `ref=YOUR_LINKTREE_ID`

---

## 📊 Verify Database Tracking

After clicking a few links, verify they're being tracked:

```bash
npx prisma studio
```

Check these tables:
- [ ] **AffiliateClick** - Should have entries with partner names
- [ ] **Session** - Should have your session ID
- [ ] **AnalyticsEvent** - Should log 'affiliate_click' events

Sample query to verify:
```sql
SELECT partner, offer, target_url, created_at
FROM AffiliateClick
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Common Issues & Fixes

### ❌ Affiliate ID missing from URL
**Problem:** URL doesn't contain your affiliate ID
**Fix:**
1. Check `.env.local` has correct variable name (e.g., `AFF_PORKBUN_ID` not `AFF_PORKBUN`)
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache

### ❌ Button doesn't work
**Problem:** Clicking button does nothing
**Fix:**
1. Check browser console (F12) for JavaScript errors
2. Verify `onAffiliateClick` prop is passed to component
3. Check network tab for failed API calls to `/api/affiliate/click`

### ❌ Wrong URL format
**Problem:** URL goes to wrong page or 404s
**Fix:**
1. Verify partner accepts the URL format (some don't support all parameters)
2. Check `src/lib/services/affiliates.ts` for correct URL template
3. Some partners may have changed their affiliate link format

### ❌ Database not tracking clicks
**Problem:** Clicks work but don't appear in database
**Fix:**
1. Verify database connection: `npx prisma studio`
2. Check server logs for errors
3. Ensure `pg_aff_src` cookie is being set
4. Check CORS settings if using different domain

---

## ✅ Success Criteria

You're all set when:
- [x] All 18 affiliate links contain your affiliate IDs
- [x] Clicks are tracked in database
- [x] No console errors when clicking buttons
- [x] Partners can see your traffic in their dashboards (24-48 hours)

---

## 🔄 Regular Testing

Perform this checklist:
- **Weekly:** Spot-check 3-5 random links
- **Monthly:** Full test of all partners
- **After updates:** Full test if you modify affiliate code

---

## 📝 Notes Section

Use this space to track issues or observations:

```
Date: ___________
Issue: ___________
Resolution: ___________

Date: ___________
Issue: ___________
Resolution: ___________
```

---

## 🎉 Ready for Production?

Before deploying:
- [ ] All affiliate IDs are REAL (not placeholders)
- [ ] Tested each partner at least once
- [ ] Added affiliate disclosure to site footer
- [ ] Set up conversion tracking with each partner
- [ ] Configured production environment variables
- [ ] Tested in production environment before going live
