/**
 * Accessibility Utilities
 * Helper functions for enhancing accessibility across the app
 * Following established utility patterns from the codebase
 */

/**
 * Format text for optimal screen reader pronunciation
 * @param {string} text - Input text to format
 * @returns {string} Formatted text with proper pauses and pronunciation
 */
export function formatForScreenReader(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Replace special characters with pauses
    .replace(/[|:;]/g, ' ')
    // Remove excessive punctuation
    .replace(/[!]{2,}/g, '')
    .replace(/[?]{2,}/g, '')
    // Add commas for better pacing
    .replace(/\s+/g, ', ')
    // Clean up any double commas
    .replace(/,+/g, ',')
    // Remove trailing comma
    .replace(/,$/, '');
}

/**
 * Calculate color contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
export function calculateColorContrast(color1, color2) {
  // Convert hex to RGB
  const getRGB = (hex) => {
    const cleanHex = hex.replace('#', '');
    const fullHex = cleanHex.length === 3
      ? cleanHex.split('').map((c) => c + c).join('')
      : cleanHex;

    return {
      r: parseInt(fullHex.substr(0, 2), 16),
      g: parseInt(fullHex.substr(2, 2), 16),
      b: parseInt(fullHex.substr(4, 2), 16),
    };
  };

  // Calculate relative luminance
  const getLuminance = (rgb) => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const normalized = c / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = getRGB(color1);
  const rgb2 = getRGB(color2);
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Get detailed contrast ratio information with WCAG compliance
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {object} Detailed contrast information
 */
export function getContrastRatio(color1, color2) {
  const ratio = calculateColorContrast(color1, color2);

  const meetsAA = ratio >= 4.5;
  const meetsAAA = ratio >= 7;

  let grade = 'Fail';
  if (meetsAAA) {
    grade = 'AAA';
  } else if (meetsAA) {
    grade = 'AA';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    meetsAA,
    meetsAAA,
    grade,
  };
}

/**
 * Validate touch target size for accessibility
 * @param {number} width - Target width in dp
 * @param {number} height - Target height in dp
 * @param {boolean} detailed - Return detailed info or just boolean
 * @returns {boolean|object} Validation result
 */
export function isValidTouchTarget(width, height, detailed = false) {
  const minSize = 44; // Minimum recommended touch target size
  const isValid = width >= minSize && height >= minSize;

  if (!detailed) {
    return isValid;
  }

  return {
    isValid,
    suggestedWidth: Math.max(width, minSize),
    suggestedHeight: Math.max(height, minSize),
    currentWidth: width,
    currentHeight: height,
  };
}

/**
 * Create descriptive ARIA labels for components
 * @param {object} data - Data to include in label
 * @param {string} type - Component type (disc, button, etc.)
 * @param {string} template - Custom template string
 * @returns {string} Formatted ARIA label
 */
export function createAriaLabel(data, type, template = null) {
  if (template) {
    return template.replace(/\$\{(\w+)\}/g, (match, key) => data[key] || '');
  }

  switch (type) {
    case 'disc':
      return createDiscAriaLabel(data);
    case 'button':
      return createButtonAriaLabel(data);
    default:
      return 'Interactive element';
  }
}

/**
 * Create ARIA label for disc components
 * @private
 */
function createDiscAriaLabel(disc) {
  const parts = [];

  if (disc.brand) parts.push(disc.brand);
  if (disc.model) parts.push(disc.model);

  const flightNumbers = [];
  if (typeof disc.speed === 'number') flightNumbers.push(`speed ${disc.speed}`);
  if (typeof disc.glide === 'number') flightNumbers.push(`glide ${disc.glide}`);
  if (typeof disc.turn === 'number') flightNumbers.push(`turn ${disc.turn}`);
  if (typeof disc.fade === 'number') flightNumbers.push(`fade ${disc.fade}`);

  if (flightNumbers.length > 0) {
    parts.push(`with flight numbers ${flightNumbers.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Disc golf disc';
}

/**
 * Create ARIA label for button components
 * @private
 */
function createButtonAriaLabel(action) {
  const parts = [];

  if (action.action) parts.push(action.action);
  if (action.itemName) parts.push(action.itemName);
  if (action.target) parts.push(`to ${action.target}`);

  return parts.length > 0 ? parts.join(' ') : 'Action button';
}

/**
 * Optimize text for screen reader pronunciation
 * @param {string} text - Input text
 * @returns {string} Optimized text
 */
export function optimizeScreenReaderText(text) {
  if (!text) return '';

  return text
    // Expand common abbreviations
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bMr\./g, 'Mister')
    .replace(/\bMs\./g, 'Miss')
    // Expand disc golf terminology
    .replace(/\bPDGA\b/g, 'Professional Disc Golf Association')
    // Replace symbols with words
    .replace(/&/g, 'and')
    .replace(/@/g, 'at')
    // Handle single letters followed by numbers
    .replace(/\b([A-Z])(\d+)\b/g, (match, letter, number) => {
      const numberWord = formatNumberForScreenReader(parseInt(number, 10));
      return `${letter} ${numberWord}`;
    });
}

/**
 * Format list items for screen reader with proper separators
 * @param {string[]} items - List items
 * @param {string} finalSeparator - Word to use before last item (default: 'and')
 * @returns {string} Formatted list
 */
export function formatListForScreenReader(items, finalSeparator = 'and') {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${finalSeparator} ${items[1]}`;

  const allButLast = items.slice(0, -1);
  const last = items[items.length - 1];

  return `${allButLast.join(', ')}, ${finalSeparator} ${last}`;
}

/**
 * Convert numbers to words for better screen reader pronunciation
 * @param {number} num - Number to convert
 * @param {string} context - Context for the number (optional)
 * @returns {string} Number as words
 */
export function formatNumberForScreenReader(num, context = null) {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertToWords = (n) => {
    if (n < 0) return `negative ${convertToWords(-n)}`;
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const tenDigit = Math.floor(n / 10);
      const oneDigit = n % 10;
      return oneDigit === 0 ? tens[tenDigit] : `${tens[tenDigit]} ${ones[oneDigit]}`;
    }
    if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      return remainder === 0
        ? `${ones[hundreds]} hundred`
        : `${ones[hundreds]} hundred ${convertToWords(remainder)}`;
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      return remainder === 0
        ? `${convertToWords(thousands)} thousand`
        : `${convertToWords(thousands)} thousand ${convertToWords(remainder)}`;
    }
    return n.toString(); // Fallback for very large numbers
  };

  // Handle decimal numbers
  if (num % 1 !== 0) {
    const [whole, decimal] = num.toString().split('.');
    return `${convertToWords(parseInt(whole, 10))} point ${decimal.split('').map((d) => ones[parseInt(d, 10)]).join(' ')}`;
  }

  const result = convertToWords(num);

  if (context) {
    return `${result} ${context}`;
  }

  return result;
}
