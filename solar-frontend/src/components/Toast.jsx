import styles from './Toast.module.css'

export default function Toast({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={styles.toast}>
          <span className={styles.icon}>{t.icon}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
