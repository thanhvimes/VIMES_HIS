const { query } = require('./src/config/database');
query(`
  SELECT table_schema, table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' OR table_name LIKE '%health%'
`)
  .then(res => {
      console.log('Tables:', res.rows.map(r => `${r.table_schema}.${r.table_name}`));
      process.exit(0);
  })
  .catch(err => {
      console.error('Database Error:', err);
      process.exit(1);
  });
