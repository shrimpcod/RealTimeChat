/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('chat_participants', function(table) {
        table.bigIncrements('id').primary();
        table.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE');
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.timestamp('joined_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('last_read_at', { useTz: true }).nullable();
        table.unique(['chat_id', 'user_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('chat_participants');
};
