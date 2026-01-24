import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export class HTMLParser {
  constructor(filePath) {
    this.filePath = filePath;
    this.html = fs.readFileSync(filePath, 'utf-8');
    this.$ = cheerio.load(this.html);
    this.products = [];
    this.restaurantName = null;
  }

  extractRestaurantFromFilename() {
    const filename = path.basename(this.filePath, path.extname(this.filePath));
    let cleanName = filename.replace(/^\d{10,13}-/, '');
    cleanName = cleanName.replace(/[_-]/g, ' ').trim();
    
    if (cleanName.length > 2 && cleanName.length < 100) {
      return cleanName;
    }
    return null;
  }

  parse() {
    console.log('🔍 Начинаем парсинг HTML...');

    this.restaurantName = this.extractRestaurantFromFilename();
    if (this.restaurantName) {
      console.log(`✓ Ресторан: ${this.restaurantName}`);
    }

    const $ = this.$;
    let currentProduct = null;
    let currentProductCode = null;

    // Ищем все строки таблицы
    $('table tr').each((index, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      // === СТРОКА С КОДОМ ТОВАРА ===
      // Ищем ячейку с классом s33 или s7 (код товара)
      let foundCode = false;
      cells.each((i, cell) => {
        const $cell = $(cell);
        const className = $cell.attr('class') || '';
        const text = $cell.text().trim();
        
        // Если это ячейка с кодом товара
        if ((className.includes('s33') || className.includes('s7')) && /^\d{2,6}$/.test(text)) {
          currentProductCode = text;
          // Следующая ячейка должна содержать название
          const $nextCell = $cell.next();
          if ($nextCell.length) {
            const nameClass = $nextCell.attr('class') || '';
            const colspan = parseInt($nextCell.attr('colspan')) || 1;
            if ((nameClass.includes('s34') || nameClass.includes('s6')) && colspan >= 10) {
              currentProduct = $nextCell.text().trim();
              if (currentProduct.length > 3) {
                console.log(`✓ Товар [${currentProductCode}] ${currentProduct.substring(0, 60)}...`);
                foundCode = true;
              }
            }
          }
        }
      });

      // Если нашли код товара, не обрабатываем эту строку дальше
      if (foundCode) {
        return;
      }

      // === СТРОКА С ДАННЫМИ ПОСТАВКИ ===
      if (!currentProduct || !currentProductCode || cells.length < 10) {
        return;
      }

      try {
        let supplier = '';
        let quantity = 0;
        let priceWholesale = 0;
        let priceVat = 0;
        let sumVat = 0;
        let invoiceType = '';
        let invoiceNumber = '';
        let invoiceDate = null;

        // Проходимся по всем ячейкам
        cells.each((i, cell) => {
          const $cell = $(cell);
          const className = $cell.attr('class') || '';
          const text = $cell.text().trim();
          const colspan = parseInt($cell.attr('colspan')) || 1;

          // ПОСТАВЩИК - первая ячейка с classs23 или classs8 с colspan >= 2
          if (!supplier && (className.includes('s23') || className.includes('s8')) && colspan >= 2 && text.length > 0) {
            // Проверяем, что это не "Итого" и не накладная
            if (!text.includes('Итого') && !text.includes('итого') && !/^\d+$/.test(text) && !text.includes('.')) {
              supplier = text;
            }
          }

          // КОЛИЧЕСТВО - в classs25 или classs9
          if ((className.includes('s25') || className.includes('s9')) && /[\d,\.]/.test(text)) {
            const parsed = parseFloat(text.replace(/,/g, '.'));
            if (!isNaN(parsed) && parsed > 0) {
              quantity = parsed;
            }
          }

          // ЦЕНЫ - в classs26 или classs10
          if ((className.includes('s26') || className.includes('s10')) && /[\d,\.]/.test(text)) {
            const parsed = parseFloat(text.replace(/,/g, '.'));
            if (!isNaN(parsed) && parsed > 0) {
              if (priceWholesale === 0) {
                priceWholesale = parsed;
              } else if (priceVat === 0) {
                priceVat = parsed;
              } else if (sumVat === 0) {
                sumVat = parsed;
              }
            }
          }

          // ТИП НАКЛАДНОЙ - в classs27
          if (className.includes('s27')) {
            invoiceType = text;
          }

          // НОМЕР НАКЛАДНОЙ - в classs23, НО после поставщика
          if (supplier && className.includes('s23') && text !== supplier && text.length > 0 && text.length < 50) {
            if (!text.includes('.') && !text.includes('Итого')) {
              invoiceNumber = text;
            }
          }

          // ДАТА - в classs28 или classs13, формат XX.XX.XXXX
          if ((className.includes('s28') || className.includes('s13')) && /\d{2}\.\d{2}\.\d{4}/.test(text)) {
            invoiceDate = this.parseDate(text);
          }
        });

        // Если нашли минимально необходимые данные - сохраняем
        if (supplier && quantity > 0 && invoiceNumber && invoiceDate) {
          this.products.push({
            code: currentProductCode,
            name: currentProduct,
            supplier,
            quantity,
            price_wholesale: priceWholesale,
            price_vatincluded: priceVat,
            sum_vatincluded: sumVat,
            invoice_type: invoiceType,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate
          });
        }
      } catch (error) {
        // Тихо пропускаем ошибки
      }
    });

    console.log(`✅ Извлечено записей: ${this.products.length}`);
    return this.products;
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  getSuppliers() {
    return [...new Set(this.products.map(p => p.supplier))];
  }

  getInvoices() {
    const invoicesMap = new Map();
    this.products.forEach(product => {
      const key = `${product.invoice_number}_${product.invoice_date}_${product.supplier}`;
      if (!invoicesMap.has(key)) {
        invoicesMap.set(key, {
          number: product.invoice_number,
          date: product.invoice_date,
          supplier: product.supplier
        });
      }
    });
    return Array.from(invoicesMap.values());
  }

  getStats() {
    return {
      products: this.products.length,
      suppliers: new Set(this.products.map(p => p.supplier)).size,
      invoices: this.getInvoices().length,
      restaurantName: this.restaurantName
    };
  }
}

export const parseInvoiceHTML = (filePath) => {
  const parser = new HTMLParser(filePath);
  const products = parser.parse();
  
  return {
    products,
    suppliers: parser.getSuppliers(),
    invoices: parser.getInvoices(),
    stats: parser.getStats(),
    restaurantName: parser.restaurantName
  };
};

export default HTMLParser;
