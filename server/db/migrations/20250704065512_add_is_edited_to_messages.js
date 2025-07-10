/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('messages', function(table) {
        // Добавляем новое поле `is_edited`
        // Тип boolean, по умолчанию false, не может быть null
        table.boolean('is_edited').defaultTo(false).notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('messages', function(table) {
        // Код для отката миграции
        table.dropColumn('is_edited');
    });
};