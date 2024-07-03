import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'LocationData.db';
const database_version = '1.0';
const database_displayname = 'Location Data';
const database_size = 200000;

let db;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    );
    await db.executeSql(
      `CREATE TABLE IF NOT EXISTS LogTracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        dateTime TEXT, 
        latitude REAL, 
        longitude REAL
      );`
    );
  } catch (error) {
    console.log('Error initializing database', error);
  }
};

export const insertLocalDB = async (newData) => {
  const { dateTime, latitude, longitude } = newData;
  try {
    await db.executeSql(
      `INSERT INTO LogTracking (dateTime, latitude, longitude) VALUES (?, ?, ?);`,
      [dateTime, latitude, longitude]
    );
  } catch (error) {
    console.log('Error inserting location', error);
  }
};

export const getLocalDB = async () => {
  try {
    let results = await db.executeSql(`SELECT * FROM LogTracking;`);
    let data = [];
    results[0].rows.raw().forEach((row) => {
      data.push(row);
    });
    return data;
  } catch (error) {
    console.log('Error fetching data', error);
    return [];
  }
};

export const deleteLocalDB = async (id) => {
  try {
    await db.executeSql(`DELETE FROM LogTracking WHERE id = ?;`, [id]);
  } catch (error) {
    console.log('Error deleting data', error);
  }
};