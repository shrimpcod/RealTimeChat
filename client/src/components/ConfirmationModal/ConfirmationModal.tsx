import styles from "./ConfirmationModal.module.css";

interface ConfirmationModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
}

const ConfirmationModal = ({ message, onConfirm, onCancel, confirmText, cancelText, isDanger }: ConfirmationModalProps) => (
    <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
            <p>{message}</p>
            <div className={styles.modalActions}>
                <button onClick={onConfirm} className={`${styles.actionButton} ${isDanger ? styles.dangerButton : styles.confirmButton}`}>{confirmText}</button>
                <button onClick={onCancel} className={`${styles.actionButton} ${styles.cancelButton}`}>{cancelText}</button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;