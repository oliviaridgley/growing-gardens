'use strict';

exports.up = function (knex, Promise) {
  return knex.schema.createTable('posts', table => {
    table.increments();
    table.text('category').notNullable().defaultTo('miscellaneous');
    table.text('description').notNullable().defaultTo('');
    table.text('contact');
    table.text('name').notNullable().defaultTo('');
    table.boolean('want').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('posts');
};
