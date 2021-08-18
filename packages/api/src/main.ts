import { startServer } from "./server"

(async () => {
    try {
        console.log("Starting server...")
        const address = await startServer()
        console.info("Listening on " + address)
    } catch (error) {
        console.error(error.stack)
    }
})()
