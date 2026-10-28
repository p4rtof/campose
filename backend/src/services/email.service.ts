import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const sendInvoiceEmail = async (email: string, nama: string, orderId: string) => {
  await transporter.sendMail({
    from: '"Campose Photobooth" <hello@campose.id>',
    to: email,
    subject: `Pembayaran Berhasil - Booking #${orderId}`,
    html: `<h3>Halo ${nama}!</h3>
           <p>Pembayaran untuk booking Photobooth <b>#${orderId}</b> sudah LUNAS.</p>
           <p>Terima kasih sudah memilih Campose. Sampai jumpa di acaramu!</p>`,
  });
};