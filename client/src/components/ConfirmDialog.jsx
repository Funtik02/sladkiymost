import Modal from './Modal'

export default function ConfirmDialog({
    open,
    title = 'Подтвердите действие',
    message,
    confirmLabel = 'Подтвердить',
    cancelLabel = 'Отмена',
    danger = false,
    busy = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Modal open={open} title={title} onClose={onCancel} size="sm" closable={!busy}>
            <p className="confirm__message">{message}</p>
            <div className="confirm__actions">
                {/* Для опасных действий фокус по умолчанию — на «Отмене», чтобы случайный Enter ничего не удалил */}
                <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy} data-autofocus={danger || undefined}>
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
                    onClick={onConfirm}
                    disabled={busy}
                    data-autofocus={!danger || undefined}
                >
                    {busy ? 'Выполняем…' : confirmLabel}
                </button>
            </div>
        </Modal>
    )
}
