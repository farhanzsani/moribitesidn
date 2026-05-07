import ExcelJS from 'exceljs'
import { query } from '../../utils/db'

function formatDateForFilename(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

export default defineEventHandler(async (event) => {
  const batchId = getQuery(event).batchId as string | undefined

  const params: unknown[] = []
  let batchLabel = 'Semua Batch'
  let whereClause = ''

  if (batchId && batchId !== 'all') {
    if (batchId === 'none') {
      batchLabel = 'Tanpa Batch'
      whereClause = 'WHERE p.batch_id IS NULL'
    } else {
      params.push(batchId)
      whereClause = 'WHERE p.batch_id = $1'
    }
  }

  const result = await query(`
    SELECT p.id, p.batch_id, b.nama_batch, p.nama_lengkap, p.no_wa, p.alamat, p.produk_nama,
           p.jumlah, p.total_harga, p.catatan, p.status, p.created_at
    FROM pesanan p
    LEFT JOIN po_batches b ON b.id = p.batch_id
    ${whereClause}
    ORDER BY p.created_at DESC, p.id DESC
  `, params)

  if (batchId && batchId !== 'all' && batchId !== 'none') {
    batchLabel = result.rows[0]?.nama_batch || `Batch ${batchId}`
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MoriBites Admin'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Pesanan', {
    views: [{ state: 'frozen', ySplit: 6 }]
  })

  worksheet.mergeCells('A1:K1')
  worksheet.getCell('A1').value = 'LAPORAN PESANAN MORIBITES'
  worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF621C64' } }
  worksheet.getRow(1).height = 30

  worksheet.mergeCells('A2:K2')
  worksheet.getCell('A2').value = `Filter: ${batchLabel} | Diekspor: ${new Date().toLocaleString('id-ID')}`
  worksheet.getCell('A2').font = { italic: true, color: { argb: 'FF555555' } }
  worksheet.getCell('A2').alignment = { horizontal: 'center' }

  const totalOrders = result.rows.length
  const totalQty = result.rows.reduce((sum, row) => sum + Number(row.jumlah || 0), 0)
  const totalRevenue = result.rows.reduce((sum, row) => sum + Number(row.total_harga || 0), 0)

  const summary = [
    ['Total Pesanan', totalOrders],
    ['Total Item', totalQty],
    ['Total Omzet', totalRevenue]
  ]

  summary.forEach(([label, value], index) => {
    const rowNumber = index + 3
    worksheet.getCell(`A${rowNumber}`).value = label
    worksheet.getCell(`A${rowNumber}`).font = { bold: true, color: { argb: 'FF621C64' } }
    worksheet.getCell(`B${rowNumber}`).value = value
    worksheet.getCell(`B${rowNumber}`).font = { bold: true }
    if (label === 'Total Omzet') worksheet.getCell(`B${rowNumber}`).numFmt = '"Rp" #,##0'
  })

  const headerRow = worksheet.getRow(6)
  headerRow.values = [
    'No',
    'Tanggal',
    'Batch',
    'Nama Pelanggan',
    'WhatsApp',
    'Alamat',
    'Produk',
    'Jumlah',
    'Total Harga',
    'Status',
    'Catatan'
  ]
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B2E8E' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
    }
  })

  result.rows.forEach((order, index) => {
    const row = worksheet.addRow([
      index + 1,
      new Date(order.created_at),
      order.nama_batch || 'Tanpa Batch',
      order.nama_lengkap,
      order.no_wa,
      order.alamat,
      order.produk_nama,
      Number(order.jumlah || 0),
      Number(order.total_harga || 0),
      order.status,
      order.catatan || ''
    ])

    row.getCell(2).numFmt = 'dd/mm/yyyy hh:mm'
    row.getCell(8).numFmt = '#,##0'
    row.getCell(9).numFmt = '"Rp" #,##0'
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE7E7E7' } },
        left: { style: 'thin', color: { argb: 'FFE7E7E7' } },
        bottom: { style: 'thin', color: { argb: 'FFE7E7E7' } },
        right: { style: 'thin', color: { argb: 'FFE7E7E7' } }
      }
    })
  })

  worksheet.columns = [
    { width: 6 },
    { width: 18 },
    { width: 16 },
    { width: 24 },
    { width: 18 },
    { width: 34 },
    { width: 28 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
    { width: 34 }
  ]

  worksheet.autoFilter = 'A6:K6'

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `pesanan-moribites-${sanitizeFilename(batchLabel)}-${formatDateForFilename()}.xlsx`

  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return buffer
})
