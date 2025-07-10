/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('chats', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.string('name', 255).nullable() //TODO: может надо сделать обязательным
      table.string('type', 50).notNullable().defaultTo('private');
      table.uuid('created_by_user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now())
      table.check("type IN ('private', 'group')");
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('chats');
};
