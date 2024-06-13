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
      `CREATE TABLE IF NOT EXISTS Locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        datetime TEXT,
        latitude REAL,
        longitude REAL
      );`
    );
  } catch (error) {
    console.log('Error initializing database', error);
  }
};

export const insertLocation = async (data) => {
  try {
    await db.executeSql(
      `INSERT INTO Locations (datetime, latitude, longitude) VALUES (?, ?, ?);`,
      [data.datetime, data.latitude, data.longitude]
    );
  } catch (error) {
    console.log('Error inserting location', error);
  }
};

export const getLocations = async () => {
  try {
    let results = await db.executeSql(`SELECT * FROM Locations;`);
    let locations = [];
    results[0].rows.raw().forEach((row) => {
      locations.push(row);
    });
    return locations;
  } catch (error) {
    console.log('Error fetching locations', error);
    return [];
  }
};

export const deleteLocation = async (id) => {
  try {
    await db.executeSql(`DELETE FROM Locations WHERE id = ?;`, [id]);
  } catch (error) {
    console.log('Error deleting location', error);
  }
};

export const clearLocations = async () => {
  try {
    await db.executeSql(`DELETE FROM Locations;`);
  } catch (error) {
    console.log('Error clearing locations', error);
  }
};