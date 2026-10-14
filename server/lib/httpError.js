// Ошибка с HTTP-статусом: обработчик ошибок в server.js превращает её в { error }
class HttpError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

module.exports = HttpError
