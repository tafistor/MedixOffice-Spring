import jsPDF from 'jspdf';

export const generateInvoicePDF = (invoiceData) => {
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const primaryColor = [41, 128, 185]; // Bleu
  const secondaryColor = [52, 73, 94]; // Gris foncé
  const lightGray = [236, 240, 241]; // Gris clair
  
  // En-tête
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE MÉDICALE', 20, 25);
  
  // Numéro de facture
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoiceData.invoiceNumber}`, 150, 25);
  
  // Informations du cabinet médical
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.text('Cabinet Médical', 20, 55);
  doc.text('123 Rue de la Santé', 20, 62);
  doc.text('75000 Paris', 20, 69);
  doc.text('Tél: 01 23 45 67 89', 20, 76);
  
  // Date
  doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString('fr-FR')}`, 150, 55);
  
  // Informations patient
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT:', 20, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const patientName = `${invoiceData.Patient?.User?.firstName || ''} ${invoiceData.Patient?.User?.lastName || ''}`;
  doc.text(patientName, 20, 105);
  
  // Informations docteur si disponible
  if (invoiceData.consultation?.Doctor) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉDECIN:', 20, 125);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const doctorName = `Dr. ${invoiceData.consultation.Doctor.User?.firstName || ''} ${invoiceData.consultation.Doctor.User?.lastName || ''}`;
    doc.text(doctorName, 20, 135);
    doc.text(`Spécialité: ${invoiceData.consultation.Doctor.specialization || 'Non spécifiée'}`, 20, 142);
  }
  
  // Tableau des services
  const startY = 165;
  
  // En-tête du tableau
  doc.setFillColor(...lightGray);
  doc.rect(20, startY, 170, 10, 'F');
  
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION DU SERVICE', 25, startY + 7);
  doc.text('MONTANT', 160, startY + 7);
  
  // Ligne du service
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.service, 25, startY + 20);
  doc.text(`${Number(invoiceData.amount).toFixed(2)} €`, 160, startY + 20);
  
  // Ligne de séparation
  doc.setDrawColor(...secondaryColor);
  doc.line(20, startY + 25, 190, startY + 25);
  
  // Total
  doc.setFillColor(...primaryColor);
  doc.rect(130, startY + 30, 60, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 135, startY + 40);
  doc.text(`${Number(invoiceData.amount).toFixed(2)} €`, 160, startY + 40);
  
  // Statut de paiement
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Télécharger le PDF
  doc.save(`Facture_${invoiceData.invoiceNumber}.pdf`);
};