import jsPDF from 'jspdf';
import { Order } from '../types';

export const generateOrderPDF = (order: Order, userName: string) => {
  const doc = new jsPDF();
  
  // Set up colors to match the receipt design
  const primaryColor = [139, 69, 19]; // Brown header
  const borderColor = [139, 69, 19]; // Brown borders
  const lightBrown = [245, 240, 230]; // Light cream background for table headers
  const textColor = [51, 51, 51]; // Dark gray text
  const headerTextColor = [255, 255, 255]; // White text for header
  
  // Header section with brown background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Header text - properly positioned
  doc.setTextColor(...headerTextColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('KIOSCO ESCOLAR', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Pedidos Online', 20, 35);
  
  // Main title
  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE PEDIDO', 20, 60);
  
  // Order details box with proper border
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(2);
  doc.rect(20, 70, 170, 60);

  // Order details content - properly spaced
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);

  // Left column
  doc.text('Número de Pedido:', 25, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(order.id, 25, 89);

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 25, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(userName, 25, 107);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', 25, 118);
  doc.setFont('helvetica', 'normal');
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR');
  doc.text(orderDate, 25, 125);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Horario de Retiro:', 110, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(order.scheduledTime, 110, 89);

  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', 110, 100);
  doc.setFont('helvetica', 'normal');
  const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ');
  doc.text(statusText, 110, 107);

  doc.setFont('helvetica', 'bold');
  doc.text('Método de Pago:', 110, 118);
  doc.setFont('helvetica', 'normal');
  const paymentText = order.paymentMethod === 'tarjeta' ? 'Tarjeta de Crédito' :
                     order.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Efectivo';
  doc.text(paymentText, 110, 125);
  
  // Products section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PRODUCTOS PEDIDOS', 20, 150);
  
  // Table header with background
  doc.setFillColor(...lightBrown);
  doc.rect(20, 160, 170, 10, 'F');

  // Table header borders
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(1);
  doc.rect(20, 160, 170, 10);

  // Table header text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Producto', 25, 167);
  doc.text('Cant.', 120, 167);
  doc.text('Precio Unit.', 140, 167);
  doc.text('Subtotal', 170, 167);

  // Table content
  let yPosition = 180;
  doc.setFont('helvetica', 'normal');
  
  order.items.forEach((item, index) => {
    // Calculate row height based on content
    let rowHeight = 12;
    let hasCustomizations = item.customizations && 
      ((item.customizations.ingredients && item.customizations.ingredients.length > 0) ||
       (item.customizations.condiments && item.customizations.condiments.length > 0));
    
    if (hasCustomizations) {
      rowHeight += 8; // Extra space for customizations
    }
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPosition - 5, 170, rowHeight, 'F');
    }
    
    // Row border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(20, yPosition - 5, 170, rowHeight);
    
    // Product name (truncate if too long)
    let productName = item.product.name;
    if (productName.length > 25) {
      productName = productName.substring(0, 22) + '...';
    }
    
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.text(productName, 25, yPosition);
    doc.text(item.quantity.toString(), 125, yPosition);
    doc.text(`$${item.product.price.toLocaleString()}`, 145, yPosition);
    doc.text(`$${(item.product.price * item.quantity).toLocaleString()}`, 175, yPosition);
    
    // Add customizations if any
    if (hasCustomizations) {
      yPosition += 8;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      if (item.customizations.ingredients && item.customizations.ingredients.length > 0) {
        let ingredientsText = `Ingredientes: ${item.customizations.ingredients.join(', ')}`;
        if (ingredientsText.length > 60) {
          ingredientsText = ingredientsText.substring(0, 57) + '...';
        }
        doc.text(ingredientsText, 30, yPosition);
      }
      
      if (item.customizations.condiments && item.customizations.condiments.length > 0) {
        yPosition += 4;
        let condimentsText = `Condimentos: ${item.customizations.condiments.join(', ')}`;
        if (condimentsText.length > 60) {
          condimentsText = condimentsText.substring(0, 57) + '...';
        }
        doc.text(condimentsText, 30, yPosition);
      }
      
      doc.setTextColor(...textColor);
    }
    
    yPosition += rowHeight;
  });
  
  // Total section with proper spacing
  yPosition += 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.line(20, yPosition, 190, yPosition);
  
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.text('TOTAL:', 140, yPosition);
  doc.setFontSize(18);
  doc.text(`$${order.totalAmount.toLocaleString()}`, 170, yPosition);
  
  // Footer section
  yPosition += 25;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Gracias por tu compra. Presenta este comprobante al retirar tu pedido.', 20, yPosition);

  yPosition += 6;
  doc.text('Kiosco Escolar - Sistema de Pedidos Online', 20, yPosition);

  yPosition += 6;
  doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 20, yPosition);
  
  // Save the PDF with proper filename
  doc.save(`comprobante-${order.id}.pdf`);
};