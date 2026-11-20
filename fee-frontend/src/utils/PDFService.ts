import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export const generateGlobalPDF = async (
  element: HTMLElement,
  fileName: string,
  orientation: 'p' | 'l' = 'p'
) => {
  try {
    // 1. Fonts ko load hone ka intezar karein
    await document.fonts.ready;

    // 2. Image Capture karein (Exact A4 size and high resolution)
    const imgData = await toPng(element, {
      pixelRatio: 3, 
      backgroundColor: '#ffffff',
      width: element.offsetWidth,   // Exact width lein
      height: element.offsetHeight, // Exact height lein
      style: {
        transform: 'none', // Koi scaling na ho
        margin: '0',       // Koi margin na ho
      }
    });

    // 3. PDF Document banayein
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // 4. Height ko proportionally calculate karein
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // 5. PDF mein bilkul (0,0) se (Top-Left) add karein
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};