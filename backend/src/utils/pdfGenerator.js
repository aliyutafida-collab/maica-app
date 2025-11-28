const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₦0';
  const num = Math.round(Number(amount));
  return '₦' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatNumber(value) {
  if (value == null || isNaN(value)) return '0';
  return Math.floor(Number(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatPeriod(type, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (type === 'monthly') {
    return start.toLocaleDateString('en-NG', { year: 'numeric', month: 'long' });
  } else if (type === 'quarterly') {
    const quarter = Math.floor(start.getMonth() / 3) + 1;
    return `Q${quarter} ${start.getFullYear()}`;
  } else if (type === 'yearly') {
    return start.getFullYear().toString();
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

async function generateReportPDF(options) {
  const {
    reportType,
    companyName,
    startDate,
    endDate,
    totalSales,
    totalExpenses,
    netProfit,
    taxCollected,
    transactionCount,
    topProducts = [],
    expenseCategories = [],
    isRTL = false,
    language = 'en'
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const navy = '#0B234A';
      const teal = '#17AEBF';
      const textColor = '#333333';
      const lightGray = '#F5F5F5';

      doc.rect(0, 0, doc.page.width, 120).fill(navy);
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text(companyName || 'MaiCa Business', 50, 35, { 
           align: isRTL ? 'right' : 'left',
           width: pageWidth 
         });
      
      const reportTitles = {
        monthly: 'Monthly Business Report',
        quarterly: 'Quarterly Business Report',
        yearly: 'Annual Business Report',
        investor: 'Investment Summary Report'
      };
      
      doc.fontSize(14)
         .font('Helvetica')
         .text(reportTitles[reportType] || 'Business Report', 50, 70, {
           align: isRTL ? 'right' : 'left',
           width: pageWidth
         });
      
      doc.text(formatPeriod(reportType, startDate, endDate), 50, 90, {
        align: isRTL ? 'right' : 'left',
        width: pageWidth
      });

      let y = 150;
      
      doc.fillColor(navy)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Financial Summary', 50, y, { align: isRTL ? 'right' : 'left', width: pageWidth });
      
      y += 30;
      
      doc.rect(50, y, pageWidth, 140).fill(lightGray);
      
      const summaryItems = [
        { label: 'Total Sales', value: formatCurrency(totalSales), color: '#22C55E' },
        { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: '#EF4444' },
        { label: 'Net Profit', value: formatCurrency(netProfit), color: netProfit >= 0 ? '#22C55E' : '#EF4444' },
        { label: 'Tax Collected (7.5%)', value: formatCurrency(taxCollected), color: textColor }
      ];
      
      const colWidth = pageWidth / 2;
      summaryItems.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const xPos = isRTL ? (50 + pageWidth - colWidth * (col + 1) + 20) : (50 + colWidth * col + 20);
        const yPos = y + 20 + row * 60;
        
        doc.fillColor('#666666')
           .fontSize(11)
           .font('Helvetica')
           .text(item.label, xPos, yPos, { width: colWidth - 40 });
        
        doc.fillColor(item.color)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(item.value, xPos, yPos + 18, { width: colWidth - 40 });
      });
      
      y += 160;
      
      doc.rect(50, y, pageWidth / 2 - 10, 50).fill(teal);
      doc.fillColor('#FFFFFF')
         .fontSize(11)
         .font('Helvetica')
         .text('Total Transactions', 70, y + 10);
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(formatNumber(transactionCount), 70, y + 25);
      
      const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';
      doc.rect(50 + pageWidth / 2 + 10, y, pageWidth / 2 - 10, 50).fill(navy);
      doc.fillColor('#FFFFFF')
         .fontSize(11)
         .font('Helvetica')
         .text('Profit Margin', 70 + pageWidth / 2, y + 10);
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(`${profitMargin}%`, 70 + pageWidth / 2, y + 25);

      y += 80;
      
      if (topProducts && topProducts.length > 0) {
        doc.fillColor(navy)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Top Selling Products', 50, y, { align: isRTL ? 'right' : 'left', width: pageWidth });
        
        y += 30;
        
        doc.rect(50, y, pageWidth, 25).fill(navy);
        doc.fillColor('#FFFFFF')
           .fontSize(10)
           .font('Helvetica-Bold');
        
        if (isRTL) {
          doc.text('Revenue', 60, y + 8, { width: 100 });
          doc.text('Units Sold', 170, y + 8, { width: 80 });
          doc.text('Product', 260, y + 8, { width: pageWidth - 220, align: 'right' });
        } else {
          doc.text('Product', 60, y + 8, { width: pageWidth - 220 });
          doc.text('Units Sold', pageWidth - 150, y + 8, { width: 80, align: 'right' });
          doc.text('Revenue', pageWidth - 60, y + 8, { width: 100, align: 'right' });
        }
        
        y += 25;
        
        topProducts.slice(0, 5).forEach((product, index) => {
          const bgColor = index % 2 === 0 ? '#FFFFFF' : lightGray;
          doc.rect(50, y, pageWidth, 25).fill(bgColor);
          
          doc.fillColor(textColor)
             .fontSize(10)
             .font('Helvetica');
          
          if (isRTL) {
            doc.text(formatCurrency(product.revenue || 0), 60, y + 8, { width: 100 });
            doc.text(formatNumber(product.unitsSold || 0), 170, y + 8, { width: 80 });
            doc.text(product.name || 'Unknown', 260, y + 8, { width: pageWidth - 220, align: 'right' });
          } else {
            doc.text(product.name || 'Unknown', 60, y + 8, { width: pageWidth - 220 });
            doc.text(formatNumber(product.unitsSold || 0), pageWidth - 150, y + 8, { width: 80, align: 'right' });
            doc.text(formatCurrency(product.revenue || 0), pageWidth - 60, y + 8, { width: 100, align: 'right' });
          }
          
          y += 25;
        });
        
        y += 20;
      }

      if (expenseCategories && expenseCategories.length > 0 && y < doc.page.height - 200) {
        doc.fillColor(navy)
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Expense Breakdown', 50, y, { align: isRTL ? 'right' : 'left', width: pageWidth });
        
        y += 30;
        
        const maxAmount = Math.max(...expenseCategories.map(c => c.amount || 0), 1);
        const barMaxWidth = pageWidth - 150;
        
        expenseCategories.slice(0, 6).forEach((category) => {
          const barWidth = ((category.amount || 0) / maxAmount) * barMaxWidth;
          
          doc.fillColor(textColor)
             .fontSize(10)
             .font('Helvetica')
             .text(category.name || 'Other', 50, y, { width: 100 });
          
          doc.rect(160, y, barWidth, 15).fill(teal);
          
          doc.fillColor(textColor)
             .text(formatCurrency(category.amount || 0), 170 + barMaxWidth, y, { width: 80, align: 'right' });
          
          y += 25;
        });
      }

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        doc.fillColor('#999999')
           .fontSize(9)
           .font('Helvetica')
           .text(
             `Generated by MaiCa on ${formatDate(new Date())} | Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 40,
             { align: 'center', width: pageWidth }
           );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generateInvestorSummaryPDF(options) {
  const {
    companyName,
    businessCategory,
    yearData = [],
    growthRate,
    projectedRevenue,
    isRTL = false
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const navy = '#0B234A';
      const teal = '#17AEBF';
      const textColor = '#333333';

      doc.rect(0, 0, doc.page.width, 140).fill(navy);
      
      doc.fillColor('#FFFFFF')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text(companyName || 'MaiCa Business', 50, 40, { 
           align: 'center',
           width: pageWidth 
         });
      
      doc.fontSize(16)
         .font('Helvetica')
         .text('Investment-Ready Business Summary', 50, 80, {
           align: 'center',
           width: pageWidth
         });
      
      doc.fontSize(12)
         .text(businessCategory || 'Retail Business', 50, 105, {
           align: 'center',
           width: pageWidth
         });

      let y = 170;
      
      doc.fillColor(navy)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('Business Performance Overview', 50, y);
      
      y += 40;
      
      if (yearData && yearData.length > 0) {
        doc.fillColor(textColor)
           .fontSize(12)
           .font('Helvetica');
        
        yearData.forEach((year) => {
          doc.font('Helvetica-Bold')
             .text(`${year.year}:`, 50, y);
          doc.font('Helvetica')
             .text(`Revenue: ${formatCurrency(year.revenue)} | Expenses: ${formatCurrency(year.expenses)} | Profit: ${formatCurrency(year.profit)}`, 120, y);
          y += 25;
        });
        
        y += 20;
      }
      
      doc.rect(50, y, pageWidth, 80).fill('#F0FDF4');
      
      doc.fillColor('#166534')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Growth Metrics', 70, y + 15);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Year-over-Year Growth Rate: ${growthRate || 0}%`, 70, y + 38);
      doc.text(`Projected Annual Revenue: ${formatCurrency(projectedRevenue || 0)}`, 70, y + 55);

      y += 110;
      
      doc.fillColor(navy)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Key Investment Highlights', 50, y);
      
      y += 25;
      
      const highlights = [
        'Consistent revenue growth trajectory',
        'Strong profit margins in target market',
        'Scalable business model with low overhead',
        'Established customer base with retention',
        'Technology-enabled operations via MaiCa platform'
      ];
      
      doc.fillColor(textColor)
         .fontSize(11)
         .font('Helvetica');
      
      highlights.forEach((highlight) => {
        doc.circle(60, y + 5, 3).fill(teal);
        doc.fillColor(textColor)
           .text(highlight, 75, y);
        y += 20;
      });

      doc.fillColor('#999999')
         .fontSize(9)
         .font('Helvetica')
         .text(
           `Generated by MaiCa Business Platform | ${formatDate(new Date())}`,
           50,
           doc.page.height - 40,
           { align: 'center', width: pageWidth }
         );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateReportPDF,
  generateInvestorSummaryPDF,
  formatCurrency,
  formatNumber
};
