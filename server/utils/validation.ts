import { z } from 'zod'

export const OrderSchema = z.object({
    nama: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama terlalu panjang"),
    wa: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{7,12}$/, "Nomor WhatsApp tidak valid"),
    alamat: z.string().min(5, "Alamat minimal 5 karakter").max(500, "Alamat terlalu panjang"),
    qty: z.union([z.string(), z.number()]).transform(val => Number(val)),
    produkItems: z.array(z.object({
        id: z.string().optional(),
        produkId: z.string().optional()
    })).min(1, "Pilih minimal satu produk"),
    metodePembayaran: z.enum(['cash', 'qris']),
    buktiPembayaran: z.string().optional().refine(val => {
        if (!val) return true
        return /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(val) && val.length <= 4_000_000
    }, "Bukti pembayaran tidak valid atau terlalu besar (maks 4MB)"),
    catatan: z.string().max(500, "Catatan terlalu panjang").optional(),
    batchId: z.union([z.string(), z.number()]).optional(),
    important_field: z.string().optional()
})

export const ProductSchema = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    image: z.string().optional(),
    badge: z.string().optional().nullable(),
    active: z.boolean().optional()
})

export const BatchSchema = z.object({
    name: z.string().min(1),
    note: z.string().optional(),
    openNow: z.boolean().optional()
})

export const TestimonialSchema = z.object({
    name: z.string().min(1, 'Nama pelanggan wajib diisi'),
    text: z.string().min(5, 'Testimoni minimal 5 karakter'),
    image: z.string().optional(),
    active: z.boolean().optional()
})

