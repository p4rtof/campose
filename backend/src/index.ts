import 'dotenv/config'
const { httpServer } = await import('./app.js')

const port = Number(process.env.PORT ?? 4000)
httpServer.listen(port, () => console.log(`Campose API berjalan di http://localhost:${port}/api/v1`))
