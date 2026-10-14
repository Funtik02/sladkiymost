const fs = require('fs/promises')
const path = require('path')

// Все данные лежат в JSON-файлах server/data/*.json.
// Другие модули не трогают файлы напрямую — только через read/write/transaction.

const DATA_DIR = path.join(__dirname, 'data')
const COLLECTIONS = ['products', 'waves', 'orders', 'pickup-points']

function filePath(name) {
    if (!COLLECTIONS.includes(name)) {
        throw new Error(`Неизвестная коллекция: ${name}`)
    }

    return path.join(DATA_DIR, `${name}.json`)
}

async function read(name) {
    let raw

    try {
        raw = await fs.readFile(filePath(name), 'utf8')
    } catch (error) {
        // Нет файла — значит коллекция пока пустая
        if (error.code === 'ENOENT') return []
        throw error
    }

    try {
        return JSON.parse(raw)
    } catch {
        throw new Error(`Файл data/${name}.json повреждён: некорректный JSON`)
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function write(name, data) {
    const target = filePath(name)
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`

    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

    // Пишем во временный файл и подменяем им основной: читатель никогда
    // не увидит наполовину записанный JSON. На Windows файл может быть
    // кратковременно занят антивирусом — поэтому несколько попыток.
    for (let attempt = 0; ; attempt += 1) {
        try {
            await fs.rename(tmp, target)
            return
        } catch (error) {
            const busy = ['EPERM', 'EBUSY', 'EACCES'].includes(error.code)

            if (!busy || attempt >= 5) {
                await fs.rm(tmp, { force: true })
                throw error
            }

            await sleep(30 * (attempt + 1))
        }
    }
}

// Очередь транзакций: «прочитать → изменить → записать» выполняются строго
// по одной. Без этого два одновременных заказа могли бы прочитать один и тот же
// вес волны и затереть изменения друг друга.
let queue = Promise.resolve()

function transaction(fn) {
    const run = queue.then(() => fn({ read, write }))
    queue = run.catch(() => {})
    return run
}

module.exports = {
    read,
    write,
    transaction,
}
