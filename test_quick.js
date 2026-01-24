import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('Krylatskoe.html', 'utf-8');
const $ = cheerio.load(html);

let count = 0;
$('table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length === 4) {
        const code = $(cells[1]).text().trim();
        if (/^\d{3,6}$/.test(code)) {
            count++;
            if (count <= 5) {
                console.log(`[${code}] ${$(cells[2]).text().trim().substring(0, 50)}`);
            }
        }
    }
});

console.log(`\nВсего найдено товаров: ${count}`);
