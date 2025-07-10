/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('users', function(table) {
        table.boolean('is_online').notNullable().defaultTo(false);
        table.timestamp('last_seen', {useTz: true}).nullable()
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table){
      table.dropColumn('is_online');
      table.dropColumn('last_seen');
  })
};
