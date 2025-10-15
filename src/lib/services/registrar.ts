import { DomainResult } from '../models/DomainResult';

export interface RegistrarConfig {
  porkbun: {
    apiKey: string;
    secretKey: string;
  };
  namecheap: {
    apiUser: string;
    apiKey: string;
    username: string;
  };
}

export class RegistrarService {
  private config: RegistrarConfig;

  constructor(config: RegistrarConfig) {
    this.config = config;
  }

  async checkAvailability(domain: string): Promise<DomainResult> {
    const { root, tld } = this.parseDomain(domain);
    
    try {
      // Primary check: WHOIS lookup
      const whoisResult = await this.checkWhois(domain);
      
      // Secondary checks: Try registrar APIs if we have keys, otherwise use DNS
      const [porkbunResult, namecheapResult, dnsResult] = await Promise.allSettled([
        this.checkPorkbun(domain),
        this.checkNamecheap(domain),
        this.checkDNS(domain)
      ]);

      // Determine availability - domain is available if WHOIS says so AND DNS confirms
      const isAvailable = whoisResult.available && (dnsResult.status === 'fulfilled' ? dnsResult.value.available : true);
      console.log(`${domain} - Final availability: ${isAvailable} (WHOIS: ${whoisResult.available}, DNS: ${dnsResult.status === 'fulfilled' ? dnsResult.value.available : 'N/A'})`);

      // Collect pricing from successful API calls
      const registrarPrices = [];
      
      if (porkbunResult.status === 'fulfilled' && porkbunResult.value.price > 0) {
        registrarPrices.push({
          registrar: 'porkbun' as const,
          priceUsd: porkbunResult.value.price,
          promo: porkbunResult.value.promo
        });
      }

      if (namecheapResult.status === 'fulfilled' && namecheapResult.value.price > 0) {
        registrarPrices.push({
          registrar: 'namecheap' as const,
          priceUsd: namecheapResult.value.price,
          promo: namecheapResult.value.promo
        });
      }

      // If no API pricing available, use estimated pricing
      if (registrarPrices.length === 0 && isAvailable) {
        registrarPrices.push(
          { registrar: 'porkbun' as const, priceUsd: this.estimatePrice(tld) },
          { registrar: 'namecheap' as const, priceUsd: this.estimatePrice(tld) + 1 }
        );
      }

      // Generate alternates with availability checks
      const alternates = await this.generateAlternatesWithAvailability(root, tld);

      return {
        query: domain,
        root,
        tld,
        available: isAvailable,
        registrarPrices: registrarPrices.length > 0 ? registrarPrices : undefined,
        alternates,
        dnsHistoryFlag: whoisResult.dnsHistoryFlag
      };

    } catch (error) {
      console.error('Domain check error:', error);
      
      // Fallback: basic DNS check
      const dnsResult = await this.checkDNS(domain);
      const alternates = this.generateAlternates(root, tld);

      return {
        query: domain,
        root,
        tld,
        available: dnsResult.available,
        alternates,
        dnsHistoryFlag: 'unknown'
      };
    }
  }

  private parseDomain(domain: string): { root: string; tld: string } {
    const parts = domain.toLowerCase().split('.');
    if (parts.length < 2) {
      throw new Error('Invalid domain format');
    }
    return {
      root: parts[0],
      tld: '.' + parts.slice(1).join('.')
    };
  }

  private async checkWhois(domain: string): Promise<{ available: boolean; dnsHistoryFlag: 'clean' | 'unknown' | 'risky' }> {
    try {
      console.log(`Checking WHOIS for: ${domain}`);
      
      // Use a WHOIS service API (free tier available)
      const response = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {
        headers: {
          'User-Agent': 'BrandValidator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`WHOIS API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`WHOIS data for ${domain}:`, data);
      
      // Check if domain is registered
      const isRegistered = data.registered || 
                          data.creation_date || 
                          data.registrar || 
                          (data.status && data.status.length > 0);

      console.log(`${domain} - isRegistered: ${isRegistered}, available: ${!isRegistered}`);

      // Check for suspicious history
      let dnsHistoryFlag: 'clean' | 'unknown' | 'risky' = 'unknown';
      if (isRegistered) {
        const suspiciousKeywords = ['spam', 'malware', 'phishing', 'suspended', 'banned'];
        const statusText = JSON.stringify(data).toLowerCase();
        if (suspiciousKeywords.some(keyword => statusText.includes(keyword))) {
          dnsHistoryFlag = 'risky';
        } else {
          dnsHistoryFlag = 'clean';
        }
      }

      return {
        available: !isRegistered,
        dnsHistoryFlag
      };

    } catch (error) {
      console.error('WHOIS check error:', error);
      
      // Fallback: try alternative WHOIS service
      try {
        const response = await fetch(`https://api.whoisjson.com/v1/whois?domain=${domain}`);
        const data = await response.json();
        return {
          available: !data.registered,
          dnsHistoryFlag: 'unknown'
        };
      } catch (fallbackError) {
        console.error('WHOIS fallback error:', fallbackError);
        return {
          available: true, // Assume available if we can't check
          dnsHistoryFlag: 'unknown'
        };
      }
    }
  }

  private async checkDNS(domain: string): Promise<{ available: boolean }> {
    try {
      // Try to resolve the domain
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
        headers: {
          'User-Agent': 'BrandValidator/1.0'
        }
      });

      if (!response.ok) {
        return { available: true }; // If we can't check DNS, assume available
      }

      const data = await response.json();
      
      // If we get DNS records, domain is likely registered
      const hasRecords = data.Answer && data.Answer.length > 0;
      
      return { available: !hasRecords };

    } catch (error) {
      console.error('DNS check error:', error);
      return { available: true }; // Assume available if we can't check
    }
  }

  private async checkPorkbun(domain: string): Promise<{ available: boolean; price: number; promo?: string }> {
    // Only try API if we have valid keys
    if (!this.config.porkbun.apiKey || !this.config.porkbun.secretKey) {
      return { available: false, price: 0 };
    }

    try {
      const response = await fetch('https://porkbun.com/api/json/v3/domain/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          apiKey: this.config.porkbun.apiKey,
          secretKey: this.config.porkbun.secretKey
        })
      });

      if (!response.ok) {
        throw new Error(`Porkbun API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        available: data.available || false,
        price: data.price || 0,
        promo: data.promo
      };
    } catch (error) {
      console.error('Porkbun API error:', error);
      return { available: false, price: 0 };
    }
  }

  private async checkNamecheap(domain: string): Promise<{ available: boolean; price: number; promo?: string }> {
    // Only try API if we have valid keys
    if (!this.config.namecheap.apiUser || !this.config.namecheap.apiKey) {
      return { available: false, price: 0 };
    }

    try {
      const response = await fetch(`https://api.namecheap.com/xml.response?ApiUser=${this.config.namecheap.apiUser}&ApiKey=${this.config.namecheap.apiKey}&UserName=${this.config.namecheap.username}&Command=namecheap.domains.check&DomainList=${domain}`);
      
      if (!response.ok) {
        throw new Error(`Namecheap API error: ${response.status}`);
      }

      // Parse XML response (simplified)
      const text = await response.text();
      const available = text.includes('Available="true"');
      const price = this.extractPriceFromXML(text);
      
      return {
        available,
        price: price || 0
      };
    } catch (error) {
      console.error('Namecheap API error:', error);
      return { available: false, price: 0 };
    }
  }

  private extractPriceFromXML(xml: string): number {
    const priceMatch = xml.match(/Price="([0-9.]+)"/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  private async generateAlternatesWithAvailability(root: string, tld: string): Promise<{ domain: string; available?: boolean; score: number }[]> {
    const alternates = [];
    const commonTlds = ['.com', '.io', '.co', '.app', '.dev', '.ai', '.tech'];
    
    // Add different TLDs
    for (const newTld of commonTlds) {
      if (newTld !== tld) {
        const domain = root + newTld;
        const availability = await this.checkDNS(domain);
        alternates.push({
          domain,
          available: availability.available,
          score: this.scoreAlternate(domain)
        });
      }
    }

    // Add variations
    if (root.length > 3) {
      const domain = root.slice(0, -1) + tld; // Remove last character
      const availability = await this.checkDNS(domain);
      alternates.push({
        domain,
        available: availability.available,
        score: this.scoreAlternate(domain)
      });
    }

    // Add hyphenated version
    if (root.length > 5) {
      const domain = root.slice(0, 3) + '-' + root.slice(3) + tld;
      const availability = await this.checkDNS(domain);
      alternates.push({
        domain,
        available: availability.available,
        score: this.scoreAlternate(domain)
      });
    }

    return alternates.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private generateAlternates(root: string, tld: string): { domain: string; available?: boolean; score: number }[] {
    const alternates = [];
    const commonTlds = ['.com', '.io', '.co', '.app', '.dev', '.ai', '.tech'];
    
    // Add different TLDs
    for (const newTld of commonTlds) {
      if (newTld !== tld) {
        alternates.push({
          domain: root + newTld,
          score: this.scoreAlternate(root + newTld)
        });
      }
    }

    // Add variations
    if (root.length > 3) {
      alternates.push({
        domain: root.slice(0, -1) + tld, // Remove last character
        score: this.scoreAlternate(root.slice(0, -1) + tld)
      });
    }

    // Add hyphenated version
    if (root.length > 5) {
      const hyphenated = root.slice(0, 3) + '-' + root.slice(3) + tld;
      alternates.push({
        domain: hyphenated,
        score: this.scoreAlternate(hyphenated)
      });
    }

    return alternates.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private estimatePrice(tld: string): number {
    // Estimate pricing based on TLD
    const pricing: Record<string, number> = {
      '.com': 12.99,
      '.io': 39.99,
      '.ai': 89.99,
      '.co': 29.99,
      '.app': 19.99,
      '.dev': 14.99,
      '.tech': 49.99,
      '.org': 12.99,
      '.net': 12.99
    };
    
    return pricing[tld] || 15.99; // Default price
  }

  private scoreAlternate(domain: string): number {
    let score = 100;
    
    // Penalize hyphens
    if (domain.includes('-')) score -= 20;
    
    // Penalize very long domains
    if (domain.length > 15) score -= 10;
    if (domain.length > 20) score -= 20;
    
    // Bonus for .com
    if (domain.endsWith('.com')) score += 10;
    
    // Bonus for short domains
    if (domain.length < 10) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }
}
