# RuangBook - Sistem Pemesanan Ruang Diskusi

Sistem reservasi ruang diskusi modern yang efisien untuk mengelola penggunaan ruang di unit kerja Anda.

## Fitur Utama

- **Pemesanan Ruang**: Form reservasi yang intuitif dengan pilihan ruang dan waktu.
- **Dashboard Admin**: Kelola semua booking, batalkan, atau hapus data dengan mudah.
- **Laporan Otomatis**: Ekspor data booking ke format PDF dan CSV.
- **Statistik Penggunaan**: Visualisasi penggunaan ruang per bulan dan statistik real-time.

## Teknologi Terkait

Proyek ini dibangun menggunakan:

- **Vite**: Build tool modern untuk frontend.
- **TypeScript**: Superset JavaScript untuk pengetikan yang aman.
- **React**: Library UI populer.
- **shadcn-ui**: Komponen UI yang indah dan aksesibel.
- **Tailwind CSS**: Framework CSS utility-first.
- **Firebase**: Backend-as-a-service untuk database dan autentikasi.

## Cara Menjalankan Secara Lokal

1. **Clone repository**:
   ```sh
   git clone <URL_REPO>
   cd <NAMA_DIREKTORI>
   ```

2. **Instal dependensi**:
   ```sh
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```sh
   npm run dev
   ```

## Konfigurasi Firebase

Proyek ini menggunakan Firebase untuk database dan autentikasi.

### 1. Struktur Koleksi Firestore

Buat koleksi berikut di database Firestore Anda:

**Koleksi `bookings`:**
```json
{
  "booking_date": "string (YYYY-MM-DD)",
  "usage_date": "string (YYYY-MM-DD)",
  "room": "string ('ruang_diskusi_1' | 'ruang_diskusi_2' | 'ruang_diskusi_3')",
  "booker_name": "string",
  "department": "string",
  "participant_count": "number",
  "start_time": "string (HH:MM)",
  "end_time": "string (HH:MM)",
  "notes": "string (opsional)",
  "status": "string ('confirmed' | 'cancelled')",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Koleksi `user_roles`:**
```json
{
  "role": "string ('admin' | 'user')"
}
```

### 2. Aturan Keamanan (Security Rules)

Gunakan aturan berikut untuk Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    match /user_roles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```
