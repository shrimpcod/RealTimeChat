import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
    return (
        <div className={styles.notFoundPageContainer}>
            <div className={styles.errorCode}>404</div>
            <h1 className={styles.notFoundText}>Страница не найдена</h1>
            <p className={styles.subText}>
                Извините, страница, которую вы ищете, не существует или была перемещена.
                Пожалуйста, проверьте URL или вернитесь на главную страницу.
            </p>
            <Link to="/" className={styles.homeLink}>
                Вернуться на главную
            </Link>
        </div>
    );
}

export default NotFoundPage;