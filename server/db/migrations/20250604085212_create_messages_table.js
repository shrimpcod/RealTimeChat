/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
      table.bigIncrements('id').primary();
      table.uuid('chat_id').notNullable().references('id').inTable('chats').onDelete('CASCADE');
      table.uuid('sender_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('content_type',50).notNullable().defaultTo('text');
      table.text('text_content').nullable();
      table.string('file_url', 255).nullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
      table.index(['chat_id', 'created_at']);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('messages');
};
