import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { partyService } from './party'
import { UploadService } from './upload'
import React from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY = {
  businessName: 'Vignaharta Plastics',
  phoneNumber1: '+919834049202',
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:         { flexDirection: 'column', backgroundColor: '#fafaf8', padding: 0, fontFamily: 'Helvetica' },
  // Header band
  headerBand:   { paddingHorizontal: 36, paddingVertical: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerLeft:   { flex: 1 },
  companyName:  { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#fff', letterSpacing: 0.5 },
  companyPhone: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  headerRight:  { alignItems: 'flex-end' },
  docLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  docNumber:    { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#fff' },
  // Divider stripe
  stripe:       { height: 4, opacity: 0.15, backgroundColor: '#000' },
  // Body
  body:         { paddingHorizontal: 36, paddingTop: 28, paddingBottom: 20 },
  // Info section
  infoRow:      { flexDirection: 'row', marginBottom: 28, gap: 20 },
  infoBox:      { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e8e5df' },
  infoBoxLabel: { fontSize: 8, letterSpacing: 1.8, color: '#9ca3af', fontFamily: 'Helvetica-Bold', marginBottom: 10, textTransform: 'uppercase' },
  infoLine:     { flexDirection: 'row', marginBottom: 6 },
  infoKey:      { fontSize: 11, color: '#6b7280', width: 55 },
  infoVal:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', flex: 1 },
  // Table
  tableWrap:    { marginBottom: 24 },
  tableHead:    { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 6 },
  tableHeadCell:{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.95)', fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'center', textTransform: 'uppercase' },
  tableHeadL:   { textAlign: 'left' },
  tableHeadR:   { textAlign: 'right' },
  tableRow:     { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 11, borderBottom: '1px solid #eeece7' },
  tableRowAlt:  { backgroundColor: '#fff' },
  tableCell:    { flex: 1, fontSize: 11, textAlign: 'center', color: '#374151' },
  tableCellL:   { textAlign: 'left', fontFamily: 'Helvetica-Bold', color: '#111827' },
  tableCellR:   { textAlign: 'right' },
  tableFoot:    { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, marginTop: 2 },
  tableFootCell:{ flex: 1, fontSize: 10, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  // Totals
  totalsBox:    { alignSelf: 'flex-end', width: 260, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e8e5df', overflow: 'hidden', marginBottom: 28 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, borderBottom: '1px solid #f0ede8' },
  totalLabel:   { fontSize: 11, color: '#6b7280' },
  totalAmt:     { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151' },
  grandRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  grandLabel:   { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#fff' },
  grandAmt:     { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#fff' },
  // Payment card
  payCard:      { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e8e5df', padding: 20, marginBottom: 24 },
  payCardTitle: { fontSize: 9, letterSpacing: 1.8, color: '#9ca3af', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 14 },
  payRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottom: '1px solid #f0ede8' },
  payRowLast:   { borderBottom: 'none', paddingVertical: 14 },
  payKey:       { fontSize: 12, color: '#6b7280' },
  payVal:       { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  payValXl:     { fontSize: 18 },
  // Footer
  footer:       { paddingHorizontal: 36, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', justifyContent: 'flex-end', borderTop: '1px solid #e8e5df', marginTop: 'auto' },
  sigTitle:     { fontSize: 9, color: '#9ca3af', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 28, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  sigLine:      { height: 1, backgroundColor: '#d1d5db', width: 140, marginBottom: 6 },
  sigName:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151', textAlign: 'center' },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '0')
const bags = (qty) => (typeof qty === 'number' ? Math.ceil(qty / 30) : 0)
const totalBags = (items) => items.reduce((acc, item) => acc + bags(item.quantity), 0)

// ─── Layout Component ─────────────────────────────────────────────────────────

const DocLayout = ({ accent, label, number, billFrom, billTo, children }) => (
  <Document>
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={[s.headerBand, { backgroundColor: accent }]}>
        <View style={s.headerLeft}>
          <Text style={s.companyName}>{COMPANY.businessName}</Text>
          <Text style={s.companyPhone}>{COMPANY.phoneNumber1}</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.docLabel}>{label}</Text>
          <Text style={s.docNumber}>#{number}</Text>
        </View>
      </View>
      <View style={[s.stripe, { backgroundColor: accent }]} />

      <View style={s.body}>
        {/* Info cards */}
        <View style={s.infoRow}>
          {[billFrom, billTo].map((info, i) => (
            <View key={i} style={s.infoBox}>
              <Text style={s.infoBoxLabel}>{info.title}</Text>
              {info.rows.map((r, j) => (
                <View key={j} style={s.infoLine}>
                  <Text style={s.infoKey}>{r.k}</Text>
                  <Text style={s.infoVal}>{r.v}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {children}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.sigTitle}>Authorized Signature</Text>
          <View style={s.sigLine} />
          <Text style={s.sigName}>{COMPANY.businessName}</Text>
        </View>
      </View>
    </Page>
  </Document>
)

// ─── Shared Items Table ───────────────────────────────────────────────────────

const ItemsTable = ({ items, accent, footBg }) => (
  <View style={s.tableWrap}>
    <View style={[s.tableHead, { backgroundColor: accent }]}>
      {['Item', 'Qty (kg)', 'Bags', 'Rate', 'Amount'].map((h, i) => (
        <Text key={i} style={[s.tableHeadCell, i === 0 && s.tableHeadL, i === 4 && s.tableHeadR]}>{h}</Text>
      ))}
    </View>
    {items.map((item, i) => (
      <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
        <Text style={[s.tableCell, s.tableCellL]}>{item.itemName}</Text>
        <Text style={s.tableCell}>{fmt(item.quantity)}</Text>
        <Text style={s.tableCell}>{bags(item.quantity)}</Text>
        <Text style={[s.tableCell, s.tableCellR]}>{fmt(item.rate)}</Text>
        <Text style={[s.tableCell, s.tableCellR]}>{fmt(item.total)}</Text>
      </View>
    ))}
    <View style={[s.tableFoot, { backgroundColor: footBg }]}>
      <Text style={[s.tableFootCell, { textAlign: 'left', color: accent }]}>Total Bags</Text>
      <Text style={s.tableFootCell}></Text>
      <Text style={[s.tableFootCell, { color: accent }]}>{totalBags(items)}</Text>
      <Text style={s.tableFootCell}></Text>
      <Text style={s.tableFootCell}></Text>
    </View>
  </View>
)

// ─── Totals Box ───────────────────────────────────────────────────────────────

const TotalsBox = ({ amount, accent }) => (
  <View style={s.totalsBox}>
    <View style={s.totalRow}>
      <Text style={s.totalLabel}>Subtotal</Text>
      <Text style={s.totalAmt}>{fmt(amount)}</Text>
    </View>
    <View style={[s.grandRow, { backgroundColor: accent }]}>
      <Text style={s.grandLabel}>Grand Total</Text>
      <Text style={s.grandAmt}>{fmt(amount)}</Text>
    </View>
  </View>
)

// ─── PDF Generators ───────────────────────────────────────────────────────────

export class BasePDFGenerator {
  static formatNumber = fmt

  static async generateInvoicePDF(inv) {
    const accent = '#4f46e5'
    const doc = (
      <DocLayout
        accent={accent}
        label="Tax Invoice"
        number={inv.invoiceNo}
        billFrom={{ title: 'From', rows: [{ k: 'Business', v: COMPANY.businessName }, { k: 'Phone', v: COMPANY.phoneNumber1 }] }}
        billTo={{ title: 'Bill To', rows: [{ k: 'Name', v: inv.partyName }, { k: 'Phone', v: inv.phoneNumber }, { k: 'Date', v: inv.date || new Date().toLocaleDateString('en-IN') }] }}
      >
        <ItemsTable items={inv.items} accent={accent} footBg="#eef2ff" />
        <TotalsBox amount={inv.totalAmount} accent={accent} />
      </DocLayout>
    )
    return this._blob(doc, `Invoice-${inv.invoiceNo}.pdf`)
  }

  static async generatePurchaseBillPDF(bill) {
    const accent = '#dc2626'
    const doc = (
      <DocLayout
        accent={accent}
        label="Purchase Bill"
        number={bill.billNo}
        billFrom={{ title: 'Bill From', rows: [{ k: 'Supplier', v: bill.partyName }, { k: 'Phone', v: bill.phoneNumber }, { k: 'Date', v: bill.date || new Date().toLocaleDateString('en-IN') }] }}
        billTo={{ title: 'Bill To', rows: [{ k: 'Business', v: COMPANY.businessName }, { k: 'Phone', v: COMPANY.phoneNumber1 }] }}
      >
        <ItemsTable items={bill.items} accent={accent} footBg="#fef2f2" />
        <TotalsBox amount={bill.totalAmount} accent={accent} />
      </DocLayout>
    )
    return this._blob(doc, `Purchase-Bill-${bill.billNo}.pdf`)
  }

  static async generatePaymentReceiptPDF(payment) {
    const isIn = payment.type === 'payment-in'
    const accent = isIn ? '#059669' : '#dc2626'
    const label = isIn ? 'Payment Receipt' : 'Payment Voucher'
    const prefix = isIn ? 'Payment-Receipt' : 'Payment-Voucher'

    let remainingBalance = 0
    try {
      const parties = (await partyService.getParties())?.data || []
      const match = parties.find(p => p.name === payment.partyName && p.phoneNumber === payment.phoneNumber)
                 || parties.find(p => p.name === payment.partyName)
      remainingBalance = match?.balance ?? 0
    } catch { /* proceed without balance */ }

    const balanceBefore = isIn
      ? remainingBalance + (payment.amount || 0)
      : remainingBalance - (payment.amount || 0)

    const doc = (
      <DocLayout
        accent={accent}
        label={label}
        number={payment.paymentNo}
        billFrom={{ title: isIn ? 'Received From' : 'Paid To', rows: [{ k: 'Name', v: payment.partyName }, { k: 'Phone', v: payment.phoneNumber }, { k: 'Date', v: payment.date || new Date().toLocaleDateString('en-IN') }] }}
        billTo={{ title: isIn ? 'Received By' : 'Paid By', rows: [{ k: 'Business', v: COMPANY.businessName }, { k: 'Phone', v: COMPANY.phoneNumber1 }] }}
      >
        {/* Payment detail card */}
        <View style={s.payCard}>
          <Text style={s.payCardTitle}>Payment Details</Text>
          {[
            { k: 'Type',                v: isIn ? 'Payment In' : 'Payment Out' },
            { k: 'Outstanding Before',  v: fmt(balanceBefore) },
            { k: isIn ? 'Received' : 'Paid', v: fmt(payment.amount) },
          ].map((r, i) => (
            <View key={i} style={s.payRow}>
              <Text style={s.payKey}>{r.k}</Text>
              <Text style={[s.payVal, { color: accent }]}>{r.v}</Text>
            </View>
          ))}
          <View style={[s.payRow, s.payRowLast]}>
            <Text style={s.payKey}>Remaining Balance</Text>
            <Text style={[s.payVal, s.payValXl, { color: accent }]}>{fmt(remainingBalance)}</Text>
          </View>
        </View>

        {/* Grand total */}
        <View style={[s.totalsBox, { alignSelf: 'flex-end' }]}>
          <View style={[s.grandRow, { backgroundColor: accent }]}>
            <Text style={s.grandLabel}>Total {isIn ? 'Received' : 'Paid'}</Text>
            <Text style={s.grandAmt}>{fmt(payment.amount)}</Text>
          </View>
        </View>
      </DocLayout>
    )
    return this._blob(doc, `${prefix}-${payment.paymentNo}.pdf`)
  }

  // ─── Internal blob helper ──────────────────────────────────────────────────

  static async _blob(docElement, fileName) {
    try {
      const pdfBlob = await pdf(docElement).toBlob()
      return { success: true, pdfBlob, fileName }
    } catch (error) {
      console.error('PDF generation error:', error)
      return { success: false, error: error?.message || 'Failed to generate PDF' }
    }
  }

  // ─── WhatsApp / Upload ─────────────────────────────────────────────────────

  static async generateAndSendPDFOnly(documentData, documentType, partyPhoneNumber, customMessage = '') {
    const generators = {
      'invoice':          () => this.generateInvoicePDF(documentData),
      'purchase-bill':    () => this.generatePurchaseBillPDF(documentData),
      'payment-receipt':  () => this.generatePaymentReceiptPDF(documentData),
      'payment-voucher':  () => this.generatePaymentReceiptPDF(documentData),
    }
    const generate = generators[documentType]
    if (!generate) return { success: false, error: `Unsupported document type: ${documentType}` }

    const pdfResult = await generate()
    if (!pdfResult.success) return pdfResult

    const whatsappData = {
      phoneNumber: partyPhoneNumber,
      documentUrl: '',
      fileName: pdfResult.fileName,
      message: customMessage || UploadService.generateDefaultMessage(documentType, pdfResult.fileName),
      documentType,
      ...this._documentMeta(documentData, documentType),
    }
    return UploadService.uploadAndSendPDF(pdfResult.pdfBlob, pdfResult.fileName, whatsappData)
  }

  static _documentMeta(data, type) {
    const map = {
      'invoice':         { invoiceNo: data.invoiceNo,  customerName: data.partyName,  amount: data.totalAmount },
      'purchase-bill':   { billNo: data.billNo,        supplierName: data.partyName,  amount: data.totalAmount },
      'payment-receipt': { receiptNo: data.paymentNo,  customerName: data.partyName,  amount: data.amount },
      'payment-voucher': { voucherNo: data.paymentNo,  supplierName: data.partyName,  amount: data.amount },
    }
    return map[type] || {}
  }

  static async uploadAndSendExistingPDF(pdfBlob, fileName, whatsappData) {
    try {
      return await UploadService.uploadAndSendPDF(pdfBlob, fileName, whatsappData)
    } catch (error) {
      return { success: false, error: error?.message || 'Failed to upload and send PDF' }
    }
  }

  static async getUploadServiceStatus() {
    try { return await UploadService.getUploadStatus() }
    catch (error) { return { success: false, message: error?.message || 'Failed to check status' } }
  }

  static async testWhatsAppConnection() {
    try { return await UploadService.testWhatsAppConnection() }
    catch (error) { return { success: false, error: error?.message || 'Failed to test connection' } }
  }
}

export default BasePDFGenerator