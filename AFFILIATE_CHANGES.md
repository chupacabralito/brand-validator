# Affiliate Program Updates

## ❌ Removed Partners

### Porkbun
- **Reason:** Affiliate program discontinued/inactive
- **Previous Commission:** ~25% recurring
- **Replacement:** Bluehost & Domain.com

## ✅ Added Partners

### Bluehost
- **Program:** https://www.bluehost.com/affiliates
- **Commission:** $65-$130 per sale
- **Why Added:** Excellent conversion rates, trusted brand, WordPress recommended
- **Env Variable:** `AFF_BLUEHOST_ID`

### Domain.com
- **Program:** https://www.domain.com/affiliates
- **Commission:** $50-100 per domain
- **Why Added:** High payouts, easy approval, good brand recognition
- **Env Variable:** `AFF_DOMAIN_COM_ID`

---

## Updated Domain Registrar List

Current Active Partners (in order of dropdown):
1. **GoDaddy** - Industry leader, CJ network
2. **Namecheap** - Popular choice, good commissions
3. **Bluehost** - High payouts, hosting bundles
4. **Domain.com** - Strong conversion, easy approval
5. **Hostinger** - 60% recurring, hosting + domains
6. **Spaceship** - Clean UX, startup-friendly

---

## Migration Checklist

If you had Porkbun configured:

- [x] Remove `AFF_PORKBUN_ID` from `.env.local` ✅
- [x] Add `AFF_BLUEHOST_ID` to `.env.local` ✅
- [x] Add `AFF_DOMAIN_COM_ID` to `.env.local` ✅
- [x] Update `affiliates.ts` service ✅
- [x] Update API route validation ✅
- [x] Update DomainRail component ✅
- [x] Update documentation ✅
- [ ] Sign up for Bluehost affiliate program
- [ ] Sign up for Domain.com affiliate program
- [ ] Replace placeholder IDs with real ones
- [ ] Test new affiliate links
- [ ] Update any analytics/tracking

---

## Code Changes Summary

### Files Modified:
1. `.env.local` - Removed Porkbun, added Bluehost & Domain.com
2. `src/lib/services/affiliates.ts` - Updated partner functions and config
3. `src/app/api/affiliate/click/route.ts` - Updated partner validation and cases
4. `src/app/components/DomainRail.tsx` - Updated registrar dropdown
5. `AFFILIATE_SETUP.md` - Updated partner list and instructions

### URL Changes:
- **Bluehost:** `https://www.bluehost.com/track/{affiliateId}/domain?domain={domain}`
- **Domain.com:** `https://www.domain.com/domains/search/?search={domain}&affid={affiliateId}`

### UTM Source Updated:
Changed from `utm_source=domainhunk` to `utm_source=brandvalidator` across all partners for consistency.

---

## Testing New Partners

```bash
# Test Bluehost affiliate link
curl -X POST http://localhost:3001/api/affiliate/click \
  -H "Content-Type: application/json" \
  -d '{"partner":"bluehost","offer":"domain","url":"example.com"}' | jq .

# Expected output:
# {
#   "success": true,
#   "affiliateUrl": "https://www.bluehost.com/track/brandvalidator_bluehost/domain?domain=example.com&utm_source=brandvalidator...",
#   "partner": "bluehost",
#   "offer": "domain",
#   "url": "example.com"
# }

# Test Domain.com affiliate link
curl -X POST http://localhost:3001/api/affiliate/click \
  -H "Content-Type: application/json" \
  -d '{"partner":"domaincom","offer":"domain","url":"example.com"}' | jq .

# Expected output:
# {
#   "success": true,
#   "affiliateUrl": "https://www.domain.com/domains/search/?search=example.com&affid=brandvalidator_domaincom&utm_source=brandvalidator...",
#   "partner": "domaincom",
#   "offer": "domain",
#   "url": "example.com"
# }
```

---

## Revenue Impact

### Before (with Porkbun):
- Porkbun: ~25% recurring = ~$3-5 per domain
- Limited to registered domains only

### After (with Bluehost & Domain.com):
- **Bluehost:** $65-$130 per sale (massive improvement!)
- **Domain.com:** $50-100 per domain
- Higher conversion rates due to brand recognition

**Estimated Impact:** 10-20x higher revenue per conversion with Bluehost/Domain.com compared to Porkbun's commission structure.

---

## Next Steps

1. ✅ Code changes complete
2. ⏳ Sign up for Bluehost affiliate program
3. ⏳ Sign up for Domain.com affiliate program
4. ⏳ Replace placeholder IDs in `.env.local`
5. ⏳ Test affiliate links in browser
6. ⏳ Monitor conversions and optimize partner order

---

## Questions?

- **Why remove Porkbun?** Their affiliate program is no longer active/advertised
- **Why these specific replacements?** Higher commissions and better conversion rates
- **Will old Porkbun links break?** Yes, but they weren't working anyway
- **Do I need to update live site?** Yes, redeploy with new environment variables

---

Last Updated: 2025-10-16
