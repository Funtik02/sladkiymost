const CLICKABLE = 'button, .btn, .header__icon, .segmented__option, [role="button"], input[type="submit"], input[type="button"]'
const MIN_INTERVAL_MS = 60

let audioContext = null
let lastPlayedAt = 0

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (!AudioContextClass) return null
        audioContext = new AudioContextClass()
    }
    if (audioContext.state === 'suspended') audioContext.resume()
    return audioContext
}

function playTone(context, frequency, peak, duration, startAt) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + duration + 0.02)
}

export function playClickSound() {
    const context = getAudioContext()
    if (!context) return
    const now = context.currentTime
    playTone(context, 1046.5, 0.08, 0.18, now)
    playTone(context, 2093, 0.025, 0.06, now)
}

function isDisabled(element) {
    return element.disabled || element.getAttribute('aria-disabled') === 'true'
}

export function enableClickSound() {
    const onClick = (event) => {
        if (!(event.target instanceof Element)) return
        const element = event.target.closest(CLICKABLE)
        if (!element || isDisabled(element)) return
        const now = performance.now()
        if (now - lastPlayedAt < MIN_INTERVAL_MS) return
        lastPlayedAt = now
        playClickSound()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
}
