export interface InsightRow {
  creator_id: number;
  brand_id: number;
  theme_id: string;
  metric: string;
  value: number;
}

export interface CreatorRow {
  creator_id: number;
  name: string;
}

export interface BrandRow {
  brand_id: number;
  brand_name: string;
  logo_url?: string;
  website_url?: string;
}

export interface SurveyResponse {
  timestamp: string;
  creator_id: string;
  q1_value_rating: number;
  q2_actionability: string;
  q3_themes: string;
  q4_missing_info: string;
  q5_barriers?: string;
  q6_open_feedback?: string;
}

export interface CSVParseResult<T> {
  data: T[];
  errors: string[];
  success: boolean;
}

class CSVParser {
  private static parseCSVText(csvText: string): string[][] {
    const lines = csvText.trim().split('\n');
    const result: string[][] = [];
    
    for (const line of lines) {
      // Simple CSV parsing - handles basic comma separation
      const fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
      result.push(fields);
    }
    
    return result;
  }

  private static validateInsightsHeaders(headers: string[]): string[] {
    const requiredHeaders = ['creator_id', 'brand_id', 'theme_id', 'metric', 'value'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    return missingHeaders;
  }

  private static validateCreatorsHeaders(headers: string[]): string[] {
    const requiredHeaders = ['creator_id', 'name'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    return missingHeaders;
  }

  private static validateBrandsHeaders(headers: string[]): string[] {
    const requiredHeaders = ['brand_id', 'brand_name'];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    return missingHeaders;
  }

  private static validateSurveyHeaders(headers: string[]): string[] {
    const requiredHeaders = ['timestamp', 'creator_id', 'q1_useful', 'q2_intent', 'q3_themes'];
    
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    
    return missingHeaders;
  }

  static parseInsightsCSV(csvText: string): CSVParseResult<InsightRow> {
    const errors: string[] = [];
    const data: InsightRow[] = [];

    try {
      const rows = this.parseCSVText(csvText);
      
      if (rows.length === 0) {
        return { data: [], errors: ['CSV file is empty'], success: false };
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const missingHeaders = this.validateInsightsHeaders(headers);
      
      if (missingHeaders.length > 0) {
        return {
          data: [],
          errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
          success: false
        };
      }

      const headerMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue;
        }

        try {
          const insight: InsightRow = {
            creator_id: parseInt(row[headerMap['creator_id']]) || 0,
            brand_id: parseInt(row[headerMap['brand_id']]) || 0,
            theme_id: row[headerMap['theme_id']] || '',
            metric: row[headerMap['metric']] || '',
            value: parseFloat(row[headerMap['value']]) || 0
          };

          if (!insight.creator_id || !insight.brand_id || !insight.theme_id) {
            errors.push(`Row ${i + 1}: Missing required data`);
            continue;
          }

          data.push(insight);
        } catch (error) {
          errors.push(`Row ${i + 1}: Error parsing data - ${error}`);
        }
      }

      return {
        data,
        errors,
        success: errors.length === 0 && data.length > 0
      };

    } catch (error) {
      return {
        data: [],
        errors: [`Failed to parse CSV: ${error}`],
        success: false
      };
    }
  }

  static parseCreatorsCSV(csvText: string): CSVParseResult<CreatorRow> {
    const errors: string[] = [];
    const data: CreatorRow[] = [];

    try {
      const rows = this.parseCSVText(csvText);
      
      if (rows.length === 0) {
        return { data: [], errors: ['CSV file is empty'], success: false };
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const missingHeaders = this.validateCreatorsHeaders(headers);
      
      if (missingHeaders.length > 0) {
        return {
          data: [],
          errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
          success: false
        };
      }

      const headerMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue;
        }

        try {
          const creator: CreatorRow = {
            creator_id: parseInt(row[headerMap['creator_id']]) || 0,
            name: row[headerMap['name']] || ''
          };

          if (!creator.creator_id || !creator.name) {
            errors.push(`Row ${i + 1}: Missing creator_id or name`);
            continue;
          }

          data.push(creator);
        } catch (error) {
          errors.push(`Row ${i + 1}: Error parsing data - ${error}`);
        }
      }

      return {
        data,
        errors,
        success: errors.length === 0 && data.length > 0
      };

    } catch (error) {
      return {
        data: [],
        errors: [`Failed to parse CSV: ${error}`],
        success: false
      };
    }
  }

  static parseBrandsCSV(csvText: string): CSVParseResult<BrandRow> {
    const errors: string[] = [];
    const data: BrandRow[] = [];

    try {
      const rows = this.parseCSVText(csvText);
      
      if (rows.length === 0) {
        return { data: [], errors: ['CSV file is empty'], success: false };
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const missingHeaders = this.validateBrandsHeaders(headers);
      
      if (missingHeaders.length > 0) {
        return {
          data: [],
          errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
          success: false
        };
      }

      const headerMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue;
        }

        try {
          const brand: BrandRow = {
            brand_id: parseInt(row[headerMap['brand_id']]) || 0,
            brand_name: row[headerMap['brand_name']] || '',
            logo_url: row[headerMap['logo_url']] || undefined,
            website_url: row[headerMap['website_url']] || undefined
          };

          if (!brand.brand_id || !brand.brand_name) {
            errors.push(`Row ${i + 1}: Missing brand_id or brand_name`);
            continue;
          }

          data.push(brand);
        } catch (error) {
          errors.push(`Row ${i + 1}: Error parsing data - ${error}`);
        }
      }

      return {
        data,
        errors,
        success: errors.length === 0 && data.length > 0
      };

    } catch (error) {
      return {
        data: [],
        errors: [`Failed to parse CSV: ${error}`],
        success: false
      };
    }
  }

  static parseSurveyCSV(csvText: string): CSVParseResult<SurveyResponse> {
    const errors: string[] = [];
    const data: SurveyResponse[] = [];

    try {
      const rows = this.parseCSVText(csvText);
      
      if (rows.length === 0) {
        return { data: [], errors: ['CSV file is empty'], success: false };
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const missingHeaders = this.validateSurveyHeaders(headers);
      
      if (missingHeaders.length > 0) {
        return {
          data: [],
          errors: [`Missing required columns: ${missingHeaders.join(', ')}`],
          success: false
        };
      }

      // Create header index map
      const headerMap: Record<string, number> = {};
      headers.forEach((header, index) => {
        headerMap[header] = index;
      });

      // Parse data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue; // Skip empty rows
        }

        try {
          const survey: SurveyResponse = {
            timestamp: row[headerMap['timestamp']] || '',
            creator_id: row[headerMap['creator_id']] || '',
            q1_value_rating: parseInt(row[headerMap['q1_value_rating']] || '0'),
            q2_actionability: row[headerMap['q2_actionability']] || '',
            q3_themes: row[headerMap['q3_themes']] || '',
            q4_missing_info: row[headerMap['q4_missing_info']] || '',
            q5_barriers: row[headerMap['q5_barriers']] || undefined,
            q6_open_feedback: row[headerMap['q6_open_feedback']] || undefined
          };

          // Validate required fields
          if (!survey.creator_id || !survey.q1_value_rating) {
            errors.push(`Row ${i + 1}: Missing required data`);
            continue;
          }

          data.push(survey);
        } catch (error) {
          errors.push(`Row ${i + 1}: Error parsing data - ${error}`);
        }
      }

      return {
        data,
        errors,
        success: errors.length === 0
      };

    } catch (error) {
      return {
        data: [],
        errors: [`Failed to parse CSV: ${error}`],
        success: false
      };
    }
  }

  static generateSampleInsightsCSV(): string {
    const headers = [
      'creator_id', 'theme_id', 'theme_title', 'icon', 'tagline',
      'color', 'brand_name', 'logo_url', 'metric', 'value'
    ];
    
    const sampleData = [
      ['creator123', 'top_trending', 'Top Trending Brands', 'TrendingUp', 'Most popular brands this month', '#FF6F3D', 'Nike', 'https://logo.clearbit.com/nike.com', 'Engagement', '95.5'],
      ['creator123', 'best_reach', 'Best Reach', 'Users', 'Brands with highest audience reach', '#FF3E6C', 'Adidas', 'https://logo.clearbit.com/adidas.com', 'Reach', '85.2'],
      ['creator123', 'high_engagement', 'High Engagement', 'Heart', 'Most engaging brand partnerships', '#FFB84D', 'Coca-Cola', 'https://logo.clearbit.com/coca-cola.com', 'Engagement Rate', '78.9']
    ];

    return [headers, ...sampleData].map(row => row.join(',')).join('\n');
  }

  static generateSampleSurveyCSV(): string {
    const headers = ['timestamp', 'creator_id', 'q1_useful', 'q2_intent', 'q3_themes'];
    
    const sampleData = [
      ['2024-01-15T10:30:00Z', 'creator123', 'very_useful', 'likely', 'top_trending,best_reach'],
      ['2024-01-16T14:20:00Z', 'creator456', 'somewhat_useful', 'neutral', 'high_engagement']
    ];

    return [headers, ...sampleData].map(row => row.join(',')).join('\n');
  }

  static parseBrandLogosCSV(csvText: string): { data: Record<string, string>; errors: string[] } {
    // Legacy function for backward compatibility
    const result = this.parseBrandsCSV(csvText);
    const data: Record<string, string> = {};
    result.data.forEach(brand => {
      data[brand.brand_name] = brand.logo_url || '';
    });
    return { data, errors: result.errors };
  }
}

export { CSVParser };
export const parseInsightsCSV = CSVParser.parseInsightsCSV.bind(CSVParser);
export const parseCreatorsCSV = CSVParser.parseCreatorsCSV.bind(CSVParser);
export const parseBrandsCSV = CSVParser.parseBrandsCSV.bind(CSVParser);
export const parseSurveyCSV = CSVParser.parseSurveyCSV.bind(CSVParser);
export const parseBrandLogosCSV = CSVParser.parseBrandLogosCSV.bind(CSVParser);