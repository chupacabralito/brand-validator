export const affiliate = {
  porkbun(domain: string, affiliateId: string) {
    return `https://porkbun.com/checkout?domain=${domain}&affid=${affiliateId}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=domain`;
  },
  
  namecheap(domain: string, affiliateId: string) {
    return `https://namecheap.com/domains/registration/results/?domain=${domain}&affId=${affiliateId}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=domain`;
  },
  
  godaddy(domain: string, affiliateId: string) {
    return `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${domain}&affid=${affiliateId}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=domain`;
  },
  
  logoai(brand: string, affiliateId: string) {
    return `https://www.logoai.com/?ref=${affiliateId}&brand=${encodeURIComponent(brand)}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=logo`;
  },
  
  zoviz(brand: string, affiliateId: string) {
    return `https://zoviz.com/?ref=${affiliateId}&brand=${encodeURIComponent(brand)}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=logo`;
  },
  
  logome(brand: string, affiliateId: string) {
    return `https://logomaker.com/?ref=${affiliateId}&brand=${encodeURIComponent(brand)}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=logo`;
  },
  
  hostinger(domain: string, affiliateId: string) {
    return `https://hostinger.com/domain-checker?domain=${domain}&affid=${affiliateId}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=domain`;
  },
  
  networksolutions(domain: string, affiliateId: string) {
    return `https://networksolutions.com/domain-name-registration/?domain=${domain}&affid=${affiliateId}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=domain`;
  },
  
  spaceship(domain: string, affiliateId: string) {
    return `https://spaceship.com/domains/register?domain=${domain}&affid=${affiliateId}&utm_source=brandvalidator&utm_medium=affiliate&utm_campaign=domain`;
  }
};

export interface AffiliateConfig {
  porkbun: string;
  namecheap: string;
  godaddy: string;
  logoai: string;
  zoviz: string;
  logome: string;
}

export class AffiliateService {
  private config: AffiliateConfig;

  constructor(config: AffiliateConfig) {
    this.config = config;
  }

  generateLink(partner: keyof AffiliateConfig, offer: 'domain' | 'brandkit' | 'logo', params: { domain?: string; brand?: string }): string {
    const affiliateId = this.config[partner];
    
    if (offer === 'domain' && params.domain) {
      switch (partner) {
        case 'porkbun':
          return affiliate.porkbun(params.domain, affiliateId);
        case 'namecheap':
          return affiliate.namecheap(params.domain, affiliateId);
        case 'godaddy':
          return affiliate.godaddy(params.domain, affiliateId);
        default:
          throw new Error(`Domain affiliate not supported for ${partner}`);
      }
    }
    
    if (offer === 'logo' && params.brand) {
      switch (partner) {
        case 'logoai':
          return affiliate.logoai(params.brand, affiliateId);
        case 'zoviz':
          return affiliate.zoviz(params.brand, affiliateId);
        case 'logome':
          return affiliate.logome(params.brand, affiliateId);
        default:
          throw new Error(`Logo affiliate not supported for ${partner}`);
      }
    }
    
    throw new Error(`Invalid offer type ${offer} for partner ${partner}`);
  }

  generateUTMParams(source: string = 'brandvalidator', medium: string = 'affiliate', campaign: string = 'click') {
    return {
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      utm_content: new Date().toISOString().split('T')[0]
    };
  }
}
