export interface InsightRow {
  creator_id: string;
  theme_id: 'top_trending' | 'best_reach' | 'high_engagement' | 'top_spending';
  theme_title: string;
  icon: string;
  tagline: string;
  color: string;
  brand_name: string;
  logo_url: string;
  metric: string;
  value: number;
}

export interface SurveyResponse {
  timestamp: string;
  creator_id: string;
  q1_useful: string;
  q2_intent: string;
  q3_themes: string;
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
    const requiredHeaders = [
      'creator_id', 'theme_id', 'theme_title', 'icon', 'tagline', 
      'color', 'brand_name', 'logo_url', 'metric', 'value'
    ];
    
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
          const insight: InsightRow = {
            creator_id: row[headerMap['creator_id']] || '',
            theme_id: row[headerMap['theme_id']] as InsightRow['theme_id'],
            theme_title: row[headerMap['theme_title']] || '',
            icon: row[headerMap['icon']] || '',
            tagline: row[headerMap['tagline']] || '',
            color: row[headerMap['color']] || '',
            brand_name: row[headerMap['brand_name']] || '',
            logo_url: row[headerMap['logo_url']] || '',
            metric: row[headerMap['metric']] || '',
            value: parseFloat(row[headerMap['value']]) || 0
          };

          // Validate required fields
          if (!insight.creator_id || !insight.theme_id || !insight.brand_name) {
            errors.push(`Row ${i + 1}: Missing required data (creator_id, theme_id, or brand_name)`);
            continue;
          }

          // Validate theme_id
          const validThemes = ['top_trending', 'best_reach', 'high_engagement', 'top_spending'];
          if (!validThemes.includes(insight.theme_id)) {
            errors.push(`Row ${i + 1}: Invalid theme_id '${insight.theme_id}'. Must be one of: ${validThemes.join(', ')}`);
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
            q1_useful: row[headerMap['q1_useful']] || '',
            q2_intent: row[headerMap['q2_intent']] || '',
            q3_themes: row[headerMap['q3_themes']] || ''
          };

          // Validate required fields
          if (!survey.creator_id || !survey.q1_useful) {
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
    const errors: string[] = [];
    const data: Record<string, string> = {};

    try {
      const rows = this.parseCSVText(csvText);
      
      if (rows.length === 0) {
        return { data: {}, errors: ['CSV file is empty'] };
      }

      const headers = rows[0].map(h => h.toLowerCase());
      
      if (!headers.includes('brand_name') || !headers.includes('logo_url')) {
        return {
          data: {},
          errors: ['Missing required columns: brand_name, logo_url']
        };
      }

      const brandNameIndex = headers.indexOf('brand_name');
      const logoUrlIndex = headers.indexOf('logo_url');

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        if (row.length === 0 || row.every(cell => !cell.trim())) {
          continue;
        }

        const brandName = row[brandNameIndex];
        const logoUrl = row[logoUrlIndex];

        if (brandName) {
          data[brandName] = logoUrl || '';
        }
      }

      return {
        data,
        errors
      };

    } catch (error) {
      return {
        data: {},
        errors: [`Failed to parse CSV: ${error}`]
      };
    }
  }
}

export { CSVParser };
export const parseInsightsCSV = CSVParser.parseInsightsCSV.bind(CSVParser);
export const parseSurveyCSV = CSVParser.parseSurveyCSV.bind(CSVParser);
export const parseBrandLogosCSV = CSVParser.parseBrandLogosCSV.bind(CSVParser);