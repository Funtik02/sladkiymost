// Рисует SVG-заглушки «упаковок» для товаров, у которых в поле photo указан
// локальный .svg-файл. Запуск: npm run images (из папки server).

const fs = require('fs/promises')
const path = require('path')
const db = require('../db')

const OUT_DIR = path.join(__dirname, '..', 'public', 'images')

const EMOJI = {
    'Шоколадные конфеты': '🍬',
    Конфеты: '🍬',
    Шоколад: '🍫',
    Пряники: '🍪',
    Печенье: '🍪',
    Зефир: '🍡',
    Торты: '🎂',
    Карамель: '🍭',
    Вафли: '🧇',
    Мармелад: '🍑',
}

const THEMES = {
    Якутия: { bg1: '#E6EEF8', bg2: '#C3D5EE', accent: '#1F4E8C', deco: '❄' },
    ДНР: { bg1: '#F3EAE2', bg2: '#E3CBB4', accent: '#6B4226', deco: '✿' },
}

const escape = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text, maxChars, maxLines) {
    const lines = []
    let line = ''

    for (const word of text.split(' ')) {
        if ((line + ' ' + word).trim().length > maxChars && line) {
            lines.push(line)
            line = word
        } else {
            line = (line + ' ' + word).trim()
        }
    }
    lines.push(line)

    if (lines.length > maxLines) {
        lines.length = maxLines
        lines[maxLines - 1] += '…'
    }

    return lines
}

function render(product) {
    const theme = THEMES[product.region]
    const emoji = EMOJI[product.category] ?? '🍰'
    const lines = wrap(product.name, 24, 2)
    const firstLineY = lines.length === 1 ? 236 : 224

    const decorations = [
        [40, 60, 22], [352, 48, 28], [330, 150, 18], [62, 170, 16], [372, 250, 20], [24, 262, 18],
    ]
        .map(([x, y, size]) => `<text x="${x}" y="${y}" font-size="${size}" fill="${theme.accent}" opacity="0.18">${theme.deco}</text>`)
        .join('')

    const title = lines
        .map((line, i) => `<text x="200" y="${firstLineY + i * 24}" text-anchor="middle" font-size="19" font-weight="700" fill="#2B1D14">${escape(line)}</text>`)
        .join('')

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="${escape(product.name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.bg1}"/>
      <stop offset="1" stop-color="${theme.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  ${decorations}
  <rect x="16" y="16" rx="12" width="${Math.max(80, product.manufacturer.length * 9 + 28)}" height="28" fill="${theme.accent}"/>
  <text x="30" y="35" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF">${escape(product.manufacturer)}</text>
  <text x="200" y="168" text-anchor="middle" font-size="92">${emoji}</text>
  <g font-family="Segoe UI, Arial, sans-serif">${title}</g>
</svg>
`
}

async function main() {
    const products = await db.read('products')
    await fs.mkdir(OUT_DIR, { recursive: true })

    const local = products.filter((p) => /^[\w.-]+\.svg$/i.test(p.photo))

    for (const product of local) {
        await fs.writeFile(path.join(OUT_DIR, product.photo), render(product), 'utf8')
    }

    console.log(`Готово: ${local.length} изображений в public/images`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
