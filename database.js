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
        longitude REAL, 
        altitude REAL, 
        speed INTEGER, 
        accuracy INTEGER, 
        numberOfSatellites INTEGER
      );`
    );
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database', error);
  }
};

export const insertLocalDB = async (newData) => {
  const { dateTime, latitude, longitude, altitude, speed, accuracy, numberOfSatellites } = newData;
  try {
    await db.executeSql(
      `INSERT INTO LogTracking (dateTime, latitude, longitude, altitude, speed, accuracy, numberOfSatellites) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [dateTime, latitude, longitude, altitude, speed, accuracy, numberOfSatellites]
    );
    console.log('Data inserted successfully');
  } catch (error) {
    console.error('Error inserting data into database', error);
  }
};

export const getLocalDB = async () => {
  try {
    const [results] = await db.executeSql(`SELECT * FROM LogTracking;`);
    let data = [];
    for (let i = 0; i < results.rows.length; i++) {
      data.push(results.rows.item(i));
    }
    return data;
  } catch (error) {
    console.error('Error fetching data from database', error);
    return [];
  }
};

export const deleteLocalDB = async (id) => {
  try {
    await db.executeSql(`DELETE FROM LogTracking WHERE id = ?;`, [id]);
    console.log(`Record with id ${id} deleted successfully`);
  } catch (error) {
    console.error('Error deleting data from database', error);
  }
};
