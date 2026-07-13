const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Aksigan%4023@db.itqyfxmtqzinkgvqkawm.supabase.co:5432/postgres',
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.end();
  })
  .catch((err) => {
    console.error('Connection error details:', err);
  });
