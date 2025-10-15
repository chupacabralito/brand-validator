import { IPGuidance } from '../models/DomainResult';

export class IPService {
  generateGuidance(brandName: string, categories: string[] = []): IPGuidance {
    const classesGuess = this.guessNiceClasses(categories);
    
    return {
      tmRiskNotes: this.generateTMRiskNotes(brandName, categories),
      classesGuess,
      officialSearchLinks: this.generateSearchLinks(brandName),
      copyrightNotes: this.generateCopyrightNotes(),
      nextStepsChecklist: this.generateChecklist(),
      disclaimer: this.getDisclaimer()
    };
  }

  private guessNiceClasses(categories: string[]): number[] {
    // Common Nice classes for tech/business
    const classMap: Record<string, number[]> = {
      'technology': [9, 35, 42],
      'software': [9, 35, 42],
      'app': [9, 35, 42],
      'saas': [35, 42],
      'ecommerce': [35, 36],
      'consulting': [35, 42],
      'education': [41, 42],
      'healthcare': [5, 10, 44],
      'finance': [36, 42],
      'entertainment': [41, 42],
      'media': [41, 42],
      'marketing': [35, 42],
      'design': [35, 42],
      'food': [29, 30, 43],
      'fashion': [25, 35, 42],
      'fitness': [41, 44],
      'travel': [39, 43],
      'real estate': [36, 37, 42],
      'legal': [45],
      'nonprofit': [35, 42, 45]
    };

    const foundClasses = new Set<number>();
    
    categories.forEach(category => {
      const lowerCategory = category.toLowerCase();
      Object.entries(classMap).forEach(([key, classes]) => {
        if (lowerCategory.includes(key)) {
          classes.forEach(cls => foundClasses.add(cls));
        }
      });
    });

    // Default to common business classes if no specific match
    if (foundClasses.size === 0) {
      return [35, 42]; // Advertising & business services, Scientific & technological services
    }

    return Array.from(foundClasses).slice(0, 5);
  }

  private generateTMRiskNotes(brandName: string, categories: string[]): string[] {
    const notes = [
      `"${brandName}" appears to be a ${brandName.length <= 6 ? 'short' : 'medium-length'} brand name`,
      'Consider checking for similar marks in your industry categories',
      'Avoid marks that are merely descriptive of your goods/services',
      'Ensure the name is distinctive and not generic'
    ];

    if (brandName.length <= 3) {
      notes.push('Very short names may face higher rejection rates');
    }

    if (categories.length > 0) {
      notes.push(`Focus trademark searches on classes related to: ${categories.join(', ')}`);
    }

    return notes;
  }

  private generateSearchLinks(brandName: string) {
    const encodedName = encodeURIComponent(brandName);
    
    return {
      usptoTESS: `https://tmsearch.uspto.gov/bin/gate.exe?f=tess&state=4803:${Math.random().toString(36).substr(2, 9)}&p_s_ALL=${encodedName}`,
      euipoEsearch: `https://euipo.europa.eu/eSearch/#basic/1+1+1+1/${encodedName}`,
      ukipoSearch: `https://trademarks.ipo.gov.uk/search-result?searchText=${encodedName}`,
      wipoGlobal: `https://www3.wipo.int/branddb/en/index.jsp?query=${encodedName}`
    };
  }

  private generateCopyrightNotes(): string[] {
    return [
      'Copyright protects original creative works like logos, designs, and written content',
      'Your logo design may be copyrightable if it contains sufficient creative elements',
      'Copyright does not protect names, slogans, or short phrases alone',
      'Consider registering copyright for significant creative works',
      'Copyright protection is automatic upon creation but registration provides additional benefits'
    ];
  }

  private generateChecklist(): string[] {
    return [
      'Run exact trademark search in USPTO TESS database',
      'Search for similar marks using variations and synonyms',
      'Check your product/service classes using Nice classification',
      'Review results for potential conflicts or confusing similarity',
      'Consider international searches if expanding globally',
      'Consult with a trademark attorney for comprehensive clearance',
      'File trademark application early if you commit to the name',
      'Monitor for new conflicting applications after filing'
    ];
  }

  private getDisclaimer(): string {
    return "This tool provides general information on trademarks and copyrights and does not constitute legal advice. For clearance, consult a qualified attorney.";
  }
}
