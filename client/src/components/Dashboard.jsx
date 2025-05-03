// import { useState } from "react"; // useState здесь не используется, можно убрать
import '../styles/styles.css'; // Стили пока не трогаем

function Dashboard() {
    // Определяем имя основного БЛОКА
    const block = "dashboard";

    return (
        // БЛОК: dashboard (замена dashboard-container)
        <div className={block}>
            {/* 
              Здесь пока нет внутреннего содержимого, но если бы оно было,
              например, список иконок, каждая иконка могла бы быть элементом:
              <ul className={`${block}__icon-list`}>
                <li className={`${block}__icon-item`}>
                  <button className={`${block}__icon-button`}>Icon 1</button>
                </li>
              </ul> 
            */}
        </div>
    );
}

export default Dashboard;