import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { companyService } from './company'
import { partyService } from './party'
import { UploadService } from './upload'
import React from 'react'

// Define styles for PDF documents
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#6366f1',
    color: 'white',
    padding: 30,
    textAlign: 'center',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  companyDescription: {
    fontSize: 16,
    marginBottom: 20,
    color: 'white',
    opacity: 0.9,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  number: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 15,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBlock: {
    flex: 1,
    marginRight: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 10,
    borderBottom: '2px solid #6366f1',
    paddingBottom: 5,
  },
  infoItem: {
    marginBottom: 8,
    fontSize: 14,
    flexDirection: 'row',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#666666',
    marginRight: 5,
  },
  infoValue: {
    color: '#333333',
  },
  table: {
    width: '100%',
    marginVertical: 20,
  },
  tableHeader: {
    backgroundColor: '#6366f1',
    color: 'white',
    flexDirection: 'row',
    padding: 15,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
  },
  tableCellLeft: {
    flex: 1,
    fontSize: 12,
    textAlign: 'left',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    fontSize: 16,
    width: '50%',
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#6b7280',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
    borderTop: '2px solid #e5e7eb',
    paddingTop: 10,
    marginTop: 10,
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1px solid #e5e7eb',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signatureSection: {
    alignItems: 'center',
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 10,
  },
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: '#6b7280',
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paymentDetails: {
    backgroundColor: '#f0f9ff',
    border: '2px solid #6366f1',
    borderRadius: 12,
    padding: 24,
    marginVertical: 20,
  },
  paymentDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 16,
    textAlign: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottom: '1px solid #6366f1',
  },
  paymentLabel: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 16,
  },
  paymentAmount: {
    fontWeight: 'bold',
    color: '#6366f1',
    fontSize: 18,
  },
})

export class BasePDFGenerator {
  static async getCompanyDetails() {
    try {
      const response = await companyService.getCompanyDetails()
      return response.data || null
    } catch (error) {
      console.error('Error loading company details:', error)
      return null
    }
  }

  // Helper function to format numbers without weird symbols
  static formatNumber(number) {
    if (typeof number !== 'number') return '0'
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Helper function to calculate bags (30kg = 1 bag)
  static calculateBags(quantity) {
    if (typeof quantity !== 'number') return '0'
    const bags = quantity / 30
    return Math.ceil(bags).toString()
  }

  // Invoice PDF Generation
  static async generateInvoicePDF(invoice) {
    try {
      console.log('Starting invoice PDF generation for:', invoice.invoiceNo)
      
      const companyDetails = await this.getCompanyDetails()
      const currentDate = new Date().toLocaleDateString('en-IN')
      const invoiceDate = invoice.date || currentDate
      
      const InvoiceDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.companyName}>
                {companyDetails?.businessName || 'Your Business Name'}
              </Text>
              <Text style={styles.title}>TAX INVOICE</Text>
              <Text style={styles.number}>Invoice #{invoice.invoiceNo}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoTitle}>Bill To</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{invoice.partyName}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{invoice.phoneNumber}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{invoiceDate}</Text>
                  </View>
                </View>
                
                <View style={styles.infoBlock}>
                  <Text style={styles.infoTitle}>From</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Business:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.businessName || 'Your Business Name'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.phoneNumber1 || 'Phone Number'}</Text>
                  </View>
                </View>
              </View>

              {/* Items Table */}
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Items</Text>
                  <Text style={styles.tableHeaderCell}>Quantity</Text>
                  <Text style={styles.tableHeaderCell}>Bags</Text>
                  <Text style={styles.tableHeaderCell}>Rate</Text>
                  <Text style={styles.tableHeaderCell}>Amount</Text>
                </View>
                {invoice.items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCellLeft}>{item.itemName}</Text>
                    <Text style={styles.tableCell}>{this.formatNumber(item.quantity)}</Text>
                    <Text style={styles.tableCell}>{this.calculateBags(item.quantity)}</Text>
                    <Text style={styles.tableCellRight}>{this.formatNumber(item.rate)}</Text>
                    <Text style={styles.tableCellRight}>{this.formatNumber(item.total)}</Text>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalAmount}>{this.formatNumber(invoice.totalAmount)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal]}>
                  <Text style={styles.totalLabel}>Grand Total:</Text>
                  <Text style={styles.totalAmount}>{this.formatNumber(invoice.totalAmount)}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.signatureSection}>
                  <Text style={styles.signatureTitle}>Authorized Signature</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>
                    {companyDetails?.businessName || 'Authorized Person'}
                  </Text>
                </View>
              </View>
            </View>
          </Page>
        </Document>
      )

      const pdfBlob = await pdf(<InvoiceDocument />).toBlob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const fileName = `invoice-${invoice.invoiceNo}-${Date.now()}.pdf`

      return {
        success: true,
        pdfBlob,
        pdfUrl,
        fileName
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invoice PDF'
      }
    }
  }

  // Purchase Bill PDF Generation
  static async generatePurchaseBillPDF(bill) {
    try {
      const companyDetails = await this.getCompanyDetails()
      const currentDate = new Date().toLocaleDateString('en-IN')
      const billDate = bill.date || currentDate
      
      const PurchaseBillDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.companyName}>
                {companyDetails?.businessName || 'Your Business Name'}
              </Text>
              <Text style={styles.title}>PURCHASE BILL</Text>
              <Text style={styles.number}>Bill #{bill.billNo}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoTitle, { color: '#dc2626', borderBottom: '2px solid #dc2626' }]}>Bill From</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Supplier:</Text>
                    <Text style={styles.infoValue}>{bill.partyName}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{bill.phoneNumber}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{billDate}</Text>
                  </View>
                </View>
                
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoTitle, { color: '#dc2626', borderBottom: '2px solid #dc2626' }]}>Bill To</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Business:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.businessName || 'Your Business Name'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.phoneNumber1 || 'Phone Number'}</Text>
                  </View>
                </View>
              </View>

              {/* Items Table */}
              <View style={styles.table}>
                <View style={[styles.tableHeader, { backgroundColor: '#dc2626' }]}>
                  <Text style={styles.tableHeaderCell}>Items</Text>
                  <Text style={styles.tableHeaderCell}>Quantity</Text>
                  <Text style={styles.tableHeaderCell}>Bags</Text>
                  <Text style={styles.tableHeaderCell}>Rate</Text>
                  <Text style={styles.tableHeaderCell}>Amount</Text>
                </View>
                {bill.items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCellLeft}>{item.itemName}</Text>
                    <Text style={styles.tableCell}>{this.formatNumber(item.quantity)}</Text>
                    <Text style={styles.tableCell}>{this.calculateBags(item.quantity)}</Text>
                    <Text style={styles.tableCellRight}>{this.formatNumber(item.rate)}</Text>
                    <Text style={styles.tableCellRight}>{this.formatNumber(item.total)}</Text>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalAmount}>{this.formatNumber(bill.totalAmount)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal, { color: '#dc2626' }]}>
                  <Text style={styles.totalLabel}>Grand Total:</Text>
                  <Text style={styles.totalAmount}>{this.formatNumber(bill.totalAmount)}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.signatureSection}>
                  <Text style={styles.signatureTitle}>Authorized Signature</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>
                    {companyDetails?.businessName || 'Authorized Person'}
                  </Text>
                </View>
              </View>
            </View>
          </Page>
        </Document>
      )

      const pdfBlob = await pdf(<PurchaseBillDocument />).toBlob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const fileName = `purchase-bill-${bill.billNo}-${Date.now()}.pdf`

      return {
        success: true,
        pdfBlob,
        pdfUrl,
        fileName
      }
    } catch (error) {
      console.error('Error generating purchase bill PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate purchase bill PDF'
      }
    }
  }

  // Payment In PDF Generation
  static async generatePaymentInPDF(payment) {
    try {
      const companyDetails = await this.getCompanyDetails()
      const currentDate = new Date().toLocaleDateString('en-IN')
      const paymentDate = payment.date || currentDate
      
      // Fetch the actual party balance from the database
      let partyBalance = 0
      try {
        const partiesResponse = await partyService.getParties()
        if (partiesResponse.success && partiesResponse.data) {
          const party = partiesResponse.data.find(p => 
            p.name === payment.partyName && p.phoneNumber === payment.phoneNumber
          )
          if (party) {
            partyBalance = party.balance
          }
        }
      } catch (error) {
        console.error('Error fetching party balance:', error)
        // Fallback to calculated balance if party fetch fails
        partyBalance = payment.totalAmount + payment.received
      }
      
      const PaymentInDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#059669' }]}>
              <Text style={styles.companyName}>
                {companyDetails?.businessName || 'Your Business Name'}
              </Text>
              <Text style={styles.title}>PAYMENT RECEIPT</Text>
              <Text style={styles.number}>Receipt #{payment.paymentNo}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoTitle, { color: '#059669', borderBottom: '2px solid #059669' }]}>Received From</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Customer Name:</Text>
                    <Text style={styles.infoValue}>{payment.partyName}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone Number:</Text>
                    <Text style={styles.infoValue}>{payment.phoneNumber}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{paymentDate}</Text>
                  </View>
                </View>
                
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoTitle, { color: '#059669', borderBottom: '2px solid #059669' }]}>Business Details</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Business:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.businessName || 'Your Business Name'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.phoneNumber1 || 'Phone Number'}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Details */}
              <View style={[styles.paymentDetails, { backgroundColor: '#f0fdf4', border: '2px solid #059669' }]}>
                <Text style={[styles.paymentDetailsTitle, { color: '#059669' }]}>Payment Summary</Text>
                
                <View style={[styles.paymentRow, { borderBottom: '1px solid #059669' }]}>
                  <Text style={styles.paymentLabel}>Outstanding Balance:</Text>
                  <Text style={[styles.paymentAmount, { color: '#059669' }]}>{this.formatNumber(partyBalance + payment.received)}</Text>
                </View>
                
                <View style={[styles.paymentRow, { borderBottom: '1px solid #059669' }]}>
                  <Text style={styles.paymentLabel}>Amount Received:</Text>
                  <Text style={[styles.paymentAmount, { color: '#059669' }]}>{this.formatNumber(payment.received)}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Remaining Balance:</Text>
                  <Text style={[styles.paymentAmount, { color: '#059669' }]}>{this.formatNumber(partyBalance)}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.signatureSection}>
                  <Text style={styles.signatureTitle}>Authorized Signature</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>
                    {companyDetails?.businessName || 'Authorized Person'}
                  </Text>
                </View>
              </View>
            </View>
          </Page>
        </Document>
      )

      const pdfBlob = await pdf(<PaymentInDocument />).toBlob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const fileName = `payment-receipt-${payment.paymentNo}-${Date.now()}.pdf`

      return {
        success: true,
        pdfBlob,
        pdfUrl,
        fileName
      }
    } catch (error) {
      console.error('Error generating payment receipt PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate payment receipt PDF'
      }
    }
  }

  // Payment Out PDF Generation
  static async generatePaymentOutPDF(payment) {
    try {
      const companyDetails = await this.getCompanyDetails()
      const currentDate = new Date().toLocaleDateString('en-IN')
      const paymentDate = payment.date || currentDate
      
      // Fetch the actual party balance from the database
      let partyBalance = 0
      try {
        const partiesResponse = await partyService.getParties()
        if (partiesResponse.success && partiesResponse.data) {
          const party = partiesResponse.data.find(p => 
            p.name === payment.partyName && p.phoneNumber === payment.phoneNumber
          )
          if (party) {
            partyBalance = party.balance
          }
        }
      } catch (error) {
        console.error('Error fetching party balance:', error)
        // Fallback to calculated balance if party fetch fails
        partyBalance = payment.totalAmount - payment.paid
      }
      
      const PaymentOutDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#dc2626' }]}>
              <Text style={styles.companyName}>
                {companyDetails?.businessName || 'Your Business Name'}
              </Text>
              <Text style={styles.title}>PAYMENT VOUCHER</Text>
              <Text style={styles.number}>Voucher #{payment.paymentNo}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoTitle, { color: '#dc2626', borderBottom: '2px solid #dc2626' }]}>Paid To</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Supplier Name:</Text>
                    <Text style={styles.infoValue}>{payment.partyName}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone Number:</Text>
                    <Text style={styles.infoValue}>{payment.phoneNumber}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{paymentDate}</Text>
                  </View>
                </View>
                
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoTitle, { color: '#dc2626', borderBottom: '2px solid #dc2626' }]}>Business Details</Text>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Business:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.businessName || 'Your Business Name'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{companyDetails?.phoneNumber1 || 'Phone Number'}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Details */}
              <View style={[styles.paymentDetails, { backgroundColor: '#fef2f2', border: '2px solid #dc2626' }]}>
                <Text style={[styles.paymentDetailsTitle, { color: '#dc2626' }]}>Payment Summary</Text>
                
                <View style={[styles.paymentRow, { borderBottom: '1px solid #dc2626' }]}>
                  <Text style={styles.paymentLabel}>Outstanding Balance:</Text>
                  <Text style={[styles.paymentAmount, { color: '#dc2626' }]}>{this.formatNumber(partyBalance + payment.paid)}</Text>
                </View>
                
                <View style={[styles.paymentRow, { borderBottom: '1px solid #dc2626' }]}>
                  <Text style={styles.paymentLabel}>Amount Paid:</Text>
                  <Text style={[styles.paymentAmount, { color: '#dc2626' }]}>{this.formatNumber(payment.paid)}</Text>
                </View>
                
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Remaining Balance:</Text>
                  <Text style={[styles.paymentAmount, { color: '#dc2626' }]}>{this.formatNumber(partyBalance)}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.signatureSection}>
                  <Text style={styles.signatureTitle}>Authorized Signature</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureName}>
                    {companyDetails?.businessName || 'Authorized Person'}
                  </Text>
                </View>
              </View>
            </View>
          </Page>
        </Document>
      )

      const pdfBlob = await pdf(<PaymentOutDocument />).toBlob()
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const fileName = `payment-voucher-${payment.paymentNo}-${Date.now()}.pdf`

      return {
        success: true,
        pdfBlob,
        pdfUrl,
        fileName
      }
    } catch (error) {
      console.error('Error generating payment voucher PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate payment voucher PDF'
      }
    }
  }

  // Download PDF helper method
  static downloadPDF(pdfBlob, fileName) {
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Detect if the current device is mobile
  static isMobileDevice() {
    if (typeof window === 'undefined') return false
    
    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    
    // Check for mobile keywords in user agent
    const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword))
    
    // Check screen size (mobile devices typically have smaller screens)
    const isSmallScreen = window.innerWidth <= 768
    
    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    return hasMobileKeyword || (isSmallScreen && hasTouch)
  }

  // Download PDF directly (works on all devices - mobile and desktop)
  static downloadPDFDirectly(pdfUrl, fileName = 'document.pdf') {
    try {
      console.log('Downloading PDF:', pdfUrl)
      
      // Always download the PDF directly - works on mobile and desktop
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log('PDF downloaded successfully')
      
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  // Legacy method name for backward compatibility - now just downloads
  static openPDFInNewTab(pdfUrl, fileName = 'document.pdf') {
    return this.downloadPDFDirectly(pdfUrl, fileName)
  }

  // Simplified method: Generate PDF and send via WhatsApp only (no opening)
  static async generateAndSendPDFOnly(documentData, documentType, partyPhoneNumber, customMessage = '') {
    try {
      // Generate PDF based on document type
      let pdfResult
      switch (documentType) {
        case 'invoice':
          pdfResult = await this.generateInvoicePDF(documentData)
          break
        case 'purchase-bill':
          pdfResult = await this.generatePurchaseBillPDF(documentData)
          break
        case 'payment-receipt':
          pdfResult = await this.generatePaymentInPDF(documentData)
          break
        case 'payment-voucher':
          pdfResult = await this.generatePaymentOutPDF(documentData)
          break
        default:
          throw new Error(`Unsupported document type: ${documentType}`)
      }

      if (!pdfResult.success) {
        return {
          success: false,
          error: pdfResult.error || 'Failed to generate PDF'
        }
      }

      // Prepare WhatsApp data
      const whatsappData = {
        phoneNumber: partyPhoneNumber,
        documentUrl: '', // Will be set after upload
        fileName: pdfResult.fileName,
        message: customMessage || UploadService.generateDefaultMessage(documentType, pdfResult.fileName),
        documentType: documentType,
        ...this.extractDocumentSpecificData(documentData, documentType)
      }

      // Upload and send via WhatsApp
      const result = await UploadService.uploadAndSendPDF(pdfResult.pdfBlob, pdfResult.fileName, whatsappData)
      return result
    } catch (error) {
      console.error('Error in generateAndSendPDFOnly:', error)
      return {
        success: false,
        error: error.message || 'Failed to generate and send PDF'
      }
    }
  }

  // Convenience methods for generating and downloading
  static async generateAndDownloadInvoice(invoice) {
    const result = await this.generateInvoicePDF(invoice)
    if (result.success && result.pdfBlob) {
      this.downloadPDF(result.pdfBlob, `Invoice_${invoice.invoiceNo}_${Date.now()}.pdf`)
      return true
    }
    return false
  }

  static async generateAndDownloadPurchaseBill(bill) {
    const result = await this.generatePurchaseBillPDF(bill)
    if (result.success && result.pdfBlob) {
      this.downloadPDF(result.pdfBlob, `PurchaseBill_${bill.billNo}_${Date.now()}.pdf`)
      return true
    }
    return false
  }

  static async generateAndDownloadPaymentReceipt(payment) {
    const result = await this.generatePaymentInPDF(payment)
    if (result.success && result.pdfBlob) {
      this.downloadPDF(result.pdfBlob, `PaymentReceipt_${payment.paymentNo}_${Date.now()}.pdf`)
      return true
    }
    return false
  }

  static async generateAndDownloadPaymentVoucher(payment) {
    const result = await this.generatePaymentOutPDF(payment)
    if (result.success && result.pdfBlob) {
      this.downloadPDF(result.pdfBlob, `PaymentVoucher_${payment.paymentNo}_${Date.now()}.pdf`)
      return true
    }
    return false
  }

  // Convenience methods for generating and downloading PDFs (works on mobile and desktop)
  static async generateAndOpenInvoice(invoice) {
    const result = await this.generateInvoicePDF(invoice)
    if (result.success) {
      if (result.pdfUrl) {
        this.downloadPDFDirectly(result.pdfUrl, `Invoice_${invoice.invoiceNo}_${Date.now()}.pdf`)
      } else {
        console.log('PDF generated successfully')
      }
      return true
    }
    return false
  }

  static async generateAndOpenPurchaseBill(bill) {
    const result = await this.generatePurchaseBillPDF(bill)
    if (result.success) {
      if (result.pdfUrl) {
        this.downloadPDFDirectly(result.pdfUrl, `PurchaseBill_${bill.billNo}_${Date.now()}.pdf`)
      } else {
        console.log('PDF generated successfully')
      }
      return true
    }
    return false
  }

  static async generateAndOpenPaymentReceipt(payment) {
    const result = await this.generatePaymentInPDF(payment)
    if (result.success) {
      if (result.pdfUrl) {
        this.downloadPDFDirectly(result.pdfUrl, `PaymentReceipt_${payment.paymentNo}_${Date.now()}.pdf`)
      } else {
        console.log('PDF generated successfully')
      }
      return true
    }
    return false
  }

  static async generateAndOpenPaymentVoucher(payment) {
    const result = await this.generatePaymentOutPDF(payment)
    if (result.success) {
      if (result.pdfUrl) {
        this.downloadPDFDirectly(result.pdfUrl, `PaymentVoucher_${payment.paymentNo}_${Date.now()}.pdf`)
      } else {
        console.log('PDF generated successfully')
      }
      return true
    }
    return false
  }

  // ===== NEW UPLOAD AND WHATSAPP METHODS =====

  /**
   * Generate PDF and upload to backend
   * @param documentData - Document data
   * @param documentType - Type of document
   * @returns Promise<UploadResult>
   */
  static async generateAndUploadPDF(documentData, documentType) {
    try {
      // Generate PDF based on document type
      let pdfResult
      switch (documentType) {
        case 'invoice':
          pdfResult = await this.generateInvoicePDF(documentData)
          break
        case 'purchase-bill':
          pdfResult = await this.generatePurchaseBillPDF(documentData)
          break
        case 'payment-receipt':
          pdfResult = await this.generatePaymentInPDF(documentData)
          break
        case 'payment-voucher':
          pdfResult = await this.generatePaymentOutPDF(documentData)
          break
        default:
          throw new Error(`Unsupported document type: ${documentType}`)
      }

      if (!pdfResult.success) {
        return {
          success: false,
          error: pdfResult.error || 'Failed to generate PDF'
        }
      }

      // Upload PDF to backend
      const uploadResult = await UploadService.uploadPDF(pdfResult.pdfBlob, pdfResult.fileName)
      return uploadResult
    } catch (error) {
      console.error('Error in generateAndUploadPDF:', error)
      return {
        success: false,
        error: error.message || 'Failed to generate and upload PDF'
      }
    }
  }

  /**
   * Generate PDF, upload, and send via WhatsApp
   * @param documentData - Document data
   * @param documentType - Type of document
   * @param partyPhoneNumber - Party's phone number
   * @param customMessage - Optional custom message
   * @returns Promise<WhatsAppResult>
   */
  static async generateUploadAndSendPDF(documentData, documentType, partyPhoneNumber, customMessage = '') {
    try {
      // Generate PDF based on document type
      let pdfResult
      switch (documentType) {
        case 'invoice':
          pdfResult = await this.generateInvoicePDF(documentData)
          break
        case 'purchase-bill':
          pdfResult = await this.generatePurchaseBillPDF(documentData)
          break
        case 'payment-receipt':
          pdfResult = await this.generatePaymentInPDF(documentData)
          break
        case 'payment-voucher':
          pdfResult = await this.generatePaymentOutPDF(documentData)
          break
        default:
          throw new Error(`Unsupported document type: ${documentType}`)
      }

      if (!pdfResult.success) {
        return {
          success: false,
          error: pdfResult.error || 'Failed to generate PDF'
        }
      }

      // Prepare WhatsApp data
      const whatsappData = {
        phoneNumber: partyPhoneNumber,
        documentUrl: '', // Will be set after upload
        fileName: pdfResult.fileName,
        message: customMessage || UploadService.generateDefaultMessage(documentType, pdfResult.fileName),
        documentType: documentType,
        ...this.extractDocumentSpecificData(documentData, documentType)
      }

      // Upload and send via WhatsApp
      const result = await UploadService.uploadAndSendPDF(pdfResult.pdfBlob, pdfResult.fileName, whatsappData)
      return result
    } catch (error) {
      console.error('Error in generateUploadAndSendPDF:', error)
      return {
        success: false,
        error: error.message || 'Failed to generate, upload, and send PDF'
      }
    }
  }

  /**
   * Extract document-specific data for WhatsApp
   * @param documentData - Document data
   * @param documentType - Type of document
   * @returns Object with document-specific fields
   */
  static extractDocumentSpecificData(documentData, documentType) {
    switch (documentType) {
      case 'invoice':
        return {
          invoiceNo: documentData.invoiceNo,
          customerName: documentData.partyName,
          amount: documentData.totalAmount
        }
      case 'purchase-bill':
        return {
          billNo: documentData.billNo,
          supplierName: documentData.partyName,
          amount: documentData.totalAmount
        }
      case 'payment-receipt':
        return {
          receiptNo: documentData.paymentNo,
          customerName: documentData.partyName,
          amount: documentData.received
        }
      case 'payment-voucher':
        return {
          voucherNo: documentData.paymentNo,
          supplierName: documentData.partyName,
          amount: documentData.paid
        }
      default:
        return {}
    }
  }

  /**
   * Upload existing PDF blob and send via WhatsApp
   * @param pdfBlob - PDF blob
   * @param fileName - File name
   * @param whatsappData - WhatsApp send data
   * @returns Promise<WhatsAppResult>
   */
  static async uploadAndSendExistingPDF(pdfBlob, fileName, whatsappData) {
    try {
      const result = await UploadService.uploadAndSendPDF(pdfBlob, fileName, whatsappData)
      return result
    } catch (error) {
      console.error('Error in uploadAndSendExistingPDF:', error)
      return {
        success: false,
        error: error.message || 'Failed to upload and send existing PDF'
      }
    }
  }

  /**
   * Check upload service status
   * @returns Promise<UploadStatus>
   */
  static async getUploadServiceStatus() {
    try {
      const status = await UploadService.getUploadStatus()
      return status
    } catch (error) {
      console.error('Error checking upload service status:', error)
      return {
        success: false,
        message: error.message || 'Failed to check upload service status'
      }
    }
  }

  /**
   * Test WhatsApp connection
   * @returns Promise<TestResult>
   */
  static async testWhatsAppConnection() {
    try {
      const result = await UploadService.testWhatsAppConnection()
      return result
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error)
      return {
        success: false,
        error: error.message || 'Failed to test WhatsApp connection'
      }
    }
  }
}

export default BasePDFGenerator
