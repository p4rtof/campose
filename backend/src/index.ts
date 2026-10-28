import 'dotenv/config'
const { app } = await import('./app.js') // dimuat setelah dotenv supaya env terbaca

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => console.log(`Campose API berjalan di http://localhost:${port}/api/v1`))
