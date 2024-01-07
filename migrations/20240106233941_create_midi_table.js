/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('messages', (table) => {
        table.increments('id').primary();
        table.integer('byte1').unsigned().notNullable();
        table.integer('byte2').unsigned().notNullable();
        table.integer('byte3').unsigned().notNullable();
        table.datetime('timestamp').notNullable();
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('messages');
};
