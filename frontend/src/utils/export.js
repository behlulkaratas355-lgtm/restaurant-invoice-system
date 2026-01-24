import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Экспорт в Excel
export const exportToExcel = (data, filename, sheetName = 'Аномалии') => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    
    // Устанавливаем ширину колонок
    const colWidths = {};
    if (data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        colWidths[key] = Math.max(
          key.length,
          Math.max(...data.map(row => String(row[key] || '').length))
        ) + 2;
      });
    }
    ws['!cols'] = Object.values(colWidths).map(width => ({ wch: Math.min(width, 50) }));
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    
    return true;
  } catch (error) {
    console.error('Ошибка экспорта в Excel:', error);
    throw error;
  }
};

// Экспорт в PDF
export const exportToPDF = async (htmlElement, filename) => {
  try {
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;
    
    // Добавляем изображения на страницы
    while (heightLeft >= 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm
      if (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
      }
    }
    
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Ошибка экспорта в PDF:', error);
    throw error;
  }
};

// Создание временного контейнера для рендеринга таблицы в PDF
export const createTableForPDF = (title, data, columns) => {
  const div = document.createElement('div');
  div.style.padding = '20px';
  div.style.backgroundColor = 'white';
  
  // Заголовок
  const header = document.createElement('h2');
  header.textContent = title;
  header.style.marginBottom = '20px';
  div.appendChild(header);
  
  // Информация о дате
  const dateInfo = document.createElement('p');
  dateInfo.textContent = `Дата отчёта: ${new Date().toLocaleString('ru-RU')}`;
  dateInfo.style.color = '#666';
  dateInfo.style.marginBottom = '20px';
  div.appendChild(dateInfo);
  
  // Таблица
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#f0f0f0';
  
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.padding = '10px';
    th.style.textAlign = 'left';
    th.style.borderBottom = '2px solid #ddd';
    th.style.fontWeight = 'bold';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    if (idx % 2 === 0) {
      tr.style.backgroundColor = '#f9f9f9';
    }
    
    Object.values(row).forEach((value, colIdx) => {
      const td = document.createElement('td');
      td.textContent = value;
      td.style.padding = '8px 10px';
      td.style.borderBottom = '1px solid #eee';
      if (colIdx > 0) {
        td.style.textAlign = 'right';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  div.appendChild(table);
  
  return div;
};
