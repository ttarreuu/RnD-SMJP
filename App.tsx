import { StyleSheet, Text, View, PermissionsAndroid, Button, Modal, FlatList, TextInput, Alert, SafeAreaView } from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation, { PositionError } from 'react-native-geolocation-service';
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
import NetInfo from '@react-native-community/netinfo';
import {
  initDatabase,
  insertLocalDB,
  getLocalDB,
  deleteLocalDB,
  getLocalApiURL,
  insertLocalApiURL,
} from './database';
import Mapbox from '@rnmapbox/maps';
// import SatelliteModule from './SatelliteModule'; 
import RNFS from 'react-native-fs';

Mapbox.setAccessToken('pk.eyJ1IjoiYnJhZGkyNSIsImEiOiJjbHloZXlncTUwMmptMmxvam16YzZpYWJ2In0.iAua4xmCQM94oKGXoW2LgA');

const App = () => {
  // const [modalVisible, setModalVisible] = useState(false);
  const [list, setList] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  // const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState([106.8231756, -6.1913702]);
const [varTemp, setVarTemp] = useState({
  logTracking: [] as {
    dateTime: any;
    latitude: any;
    longitude: any;
    altitude: any;
    speed: any;
    accuracy: any;
  }[],
});
  const folderPath = RNFS.DownloadDirectoryPath + '/logTracking';
  const filePath = folderPath + '/data.json'

  useEffect(() => {
    getApi();
    initDatabase();
    initializeFolderStorage();
    initializeFileStorage();
    requestLocationPermission();    
    // startForegroundService();
    

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
 
    return () => {
      unsubscribe();
    };
  }, []);

  const initializeFolderStorage = async () => {
    try {
      const folderExists = await RNFS.exists(folderPath);
      if (!folderExists) {
        await RNFS.mkdir(folderPath);
        console.log('Folder created: ', folderPath);
      }
    } catch (error) {
      console.error("error initializing folder:", error);
    }
  };

  const initializeFileStorage = async () => {
    try {
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        const initialData = JSON.stringify({ logTracking: [] });
        await RNFS.writeFile(filePath, initialData, 'utf8');
        console.log('File created: ', filePath);
      }
    } catch (error) {
      console.error('Error initializing file:', error);
    }
  };

  const requestLocationPermission = async () => {
    Geolocation.requestAuthorization('always');
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        startForegroundService();
      } else {
        console.log('Location permission denied');
      }

      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location Permission',
          message: 'We need access to your location so you can get live quality updates.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      ); 
    } catch (err) {
      console.warn(err);
    }
  };

  const startForegroundService = () => {
    ReactNativeForegroundService.start({
      id: 1244,
      title: 'Location Tracking',
      message: 'Location Tracking',
      icon: 'ic_launcher',  
      button: false,
      button2: false,
      color: '#000000',
    });
 
    ReactNativeForegroundService.add_task(() => getCurrentLocation(),  {
      onLoop: false,
      taskId: "getLocation",
      onError: (e) => console.log(`Error logging:`, e),
      
    });

    ReactNativeForegroundService.add_task(() => syncDataWithAPI(), {
      delay: 60000, // tiap 1 menit
      onLoop: true,
      taskId: "syncWithAPI",
      onError: (e) => console.log(`Error logging:`, e),
    });
  };

  // const stopForegroundService = () => {
  //   ReactNativeForegroundService.stop();
  //   ReactNativeForegroundService.remove_task("getLocation");
  //   ReactNativeForegroundService.remove_task("syncWithAPI");
  // };

  const getCurrentLocation = () => {
    // const numberOfSatellites = SatelliteModule.getSatelliteCount();
    Geolocation.watchPosition(
      position => {
        if (position.mocked === false) {
          const currentDate = new Date();
          const dateTime = currentDate.toLocaleString();
          console.log(dateTime);
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const altitude = position.coords.altitude;
          const speed = position.coords.speed;
          const accuracy = position.coords.accuracy;
          const newData = {
            dateTime,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            // numberOfSatellites,
          };
          
          console.log(newData);

          if (accuracy <= 15) {
            sendDataToLocalDB(newData);
          }
          setUserLocation([longitude, latitude]); 
        } else {
          const currentDate = new Date();
          const dateTime = currentDate.toLocaleString();
          console.log(dateTime);
          const latitude = 0;
          const longitude = 0;
          const altitude = 0;
          const speed = 0;
          const accuracy = 0;
          // const numberOfSatellites = 0;
          const newData = {
            dateTime,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            // numberOfSatellites,
          };

          console.log(dateTime);
          console.log("Fake GPS Detected");
          sendDataToLocalDB(newData);
          // setModalVisible(true);
        }
      },
      error => {
        console.log(error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 10000,
        fastestInterval: 10000,
        forceRequestLocation: true,
      }
    );
  };

  const sendDataToLocalDB = async (newData: { dateTime: string; latitude: number; longitude: number; altitude: number; speed: number; accuracy: number}) => {
    try {
      await insertLocalDB(newData);
    } catch (error) {
      console.log(error);
    }
  };

  const checkInternetConnection = async () => {
    return await NetInfo.fetch().then((state) => state.isConnected);
  };

  const addDataToStorage = async () => {
    try {
      const fileExists = await RNFS.exists(filePath);
      let existingData = { logTracking: [] };

      if (fileExists) {
        const fileContent = await RNFS.readFile(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      }

      const localDB = await getLocalDB();
      const newData = localDB.map(item => ({
        dateTime: item.dateTime,
        latitude: item.latitude,
        longitude: item.longitude,
        altitude: item.altitude,
        speed: item.speed,
        accuracy: item.accuracy,
      }));

      const updatedData = { logTracking: [...existingData.logTracking, ...newData] };

      await RNFS.writeFile(filePath, JSON.stringify(updatedData), 'utf8');
      setVarTemp(updatedData);
    } catch (error) {
      console.error("Error adding data to storage:", error);
    }
  };


  const readStorage = async () => {
    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(fileContent);
      setVarTemp(parsedData);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const syncDataWithAPI = async () => {
    readStorage();
    addDataToStorage();
    const isConnected = await checkInternetConnection();
    if(isConnected) { 
      const localDB = await getLocalDB();
      for (const LogTracking of localDB) {
        await sendDataToApi({
          "dateTime": LogTracking.dateTime, 
          "latitude": LogTracking.latitude, 
          "longitude": LogTracking.longitude,
          "altitude": LogTracking.altitude, 
          "speed": LogTracking.speed,
          "accuracy": LogTracking.accuracy, 
          // "numberOfSatellites": LogTracking.numberOfSatellites,
        });
        await deleteLocalDB(LogTracking.id);
      }
      getApi();
    } 
  };

  const sendDataToApi = async (newData: {dateTime: string; latitude: number; longitude: number; altitude: number; speed: number; accuracy: number}) => {
    let apiURL = await getLocalApiURL();
    try {
      const response = await fetch(apiURL + "/1", {
        method: 'GET',
      });
      
      let existingData;
      
      if (!response.ok) {
        existingData = {
          id: 1,
          logTracking: [newData],
        };
        
        await fetch(apiURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(existingData),
        });
        
        return;
      }
      
      existingData = await response.json();
      
      if (!Array.isArray(existingData.logTracking)) {
        existingData.logTracking = [];
      }
      
      existingData.logTracking.unshift(newData);
      
      await fetch(apiURL + "/1", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(existingData),
      });
    } catch (error) {
      console.error('Error sending data to API:', error);
    }
  };

  const getApi = async () => {
    let apiURL = await getLocalApiURL();
    console.log(apiURL);
    try {
      const response = await fetch(apiURL + "/1", {
        method: 'GET',
      });
      const json = await response.json();
      const logTrackingData = json.logTracking;
      setList(logTrackingData);
    } catch (err) {
      console.log(err);
    }
  };

  // const toggleTracking = () => {
  //   if (isTracking) {
  //     stopForegroundService();
  //   } else {
  //     startForegroundService();
  //   }
  //   setIsTracking(!isTracking);
  // };

  const createGeoJSON = (coordinates: any) => ({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
      },
    ],
  });

  const getCoordinates = (list: any[]) => {
    return list.map(item => [item.longitude, item.latitude]);
  };

  return (
    <View style={styles.container}>
      {/* <Button title={isTracking ? "Stop Tracking" : "Start Tracking"} onPress={toggleTracking} />*/}
      <SafeAreaView>
        <TextInput
          style = {styles.input}
          placeholder="http://example.com"
          onChangeText={(val) => insertLocalApiURL(val)}
        />
      </SafeAreaView>
      <Mapbox.MapView 
        style={styles.map}
        styleURL='mapbox://styles/mapbox/satellite-v9'
      >
        <Mapbox.Camera
          zoomLevel={18}
          centerCoordinate={userLocation}
          pitch={60}
          animationMode={'flyTo'}
          animationDuration={6000}
        />
        <Mapbox.PointAnnotation
          coordinate={userLocation}
          id="userLocation"
          title="You are here"
        >
          <View style={styles.marker} />
        </Mapbox.PointAnnotation>
        {list && list.length > 1 && (
          <Mapbox.ShapeSource id="lineSource" shape={createGeoJSON(getCoordinates(list))}>
            <Mapbox.LineLayer id="routeLine" style={styles.routeLine} />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  separator: {
    paddingTop: 20
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center', 
  },
  routeLine: {
    lineColor: 'red',
    lineWidth: 3,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'blue',
    borderColor: 'white',
    borderWidth: 2,
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  input: { 
    height: 50, 
    borderColor: 'gray', 
    borderWidth: 1, 
    width: '100%', 
    paddingHorizontal: 4 ,
    justifyContent: 'center'
  },
});

export default App;