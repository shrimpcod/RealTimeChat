const TRIGGER_FUNCTION_NAME = 'update_chat_updated_at_column';
const TRIGGER_NAME = 'update_chat_modtime';
const TABLE_NAME = 'messages';
const TARGET_TABLE_NAME = 'chats';

exports.up = function(knex) {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION ${TRIGGER_FUNCTION_NAME}()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE ${TARGET_TABLE_NAME}
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.chat_id;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER ${TRIGGER_NAME}
        BEFORE INSERT ON ${TABLE_NAME}
        FOR EACH ROW
        EXECUTE FUNCTION ${TRIGGER_FUNCTION_NAME}();
  `
  )
};

exports.down = function(knex) {
    return knex.raw(`
        DROP TRIGGER IF EXISTS ${TRIGGER_NAME} ON ${TABLE_NAME};
        DROP FUNCTION IF EXISTS ${TRIGGER_FUNCTION_NAME}();
  `);
};
