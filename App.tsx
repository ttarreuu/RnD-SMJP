import { StyleSheet, Text, View, PermissionsAndroid, Button, Modal, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation, { PositionError } from 'react-native-geolocation-service';
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
import NetInfo from '@react-native-community/netinfo';
import {
  initDatabase,
  insertLocalDB,
  getLocalDB,
  deleteLocalDB,
} from './database';
import Mapbox from '@rnmapbox/maps';
import SatelliteModule from './SatelliteModule'; // Import the module

Mapbox.setAccessToken('pk.eyJ1IjoiYnJhZGkyNSIsImEiOiJjbHloZXlncTUwMmptMmxvam16YzZpYWJ2In0.iAua4xmCQM94oKGXoW2LgA');

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [list, setList] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState([106.8650, -6.1751]); 

  useEffect(() => {
    getApi();
    initDatabase();
    requestLocationPermission();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
 
    return () => {
      unsubscribe();
    };
  }, []);

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

    ReactNativeForegroundService.add_task(() => getCurrentLocation(), {
      delay: 10000, // tiap 10 detik
      onLoop: true,
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

  const stopForegroundService = () => {
    ReactNativeForegroundService.stop();
    ReactNativeForegroundService.remove_task("getLocation");
    ReactNativeForegroundService.remove_task("syncWithAPI");
  };

  const getCurrentLocation = () => {
    const currentDate = new Date();
    const dateTime = currentDate.toLocaleString();
    
    Geolocation.getCurrentPosition(
      async position => {
        if (position.mocked === false) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const numberOfSatellites = await SatelliteModule.getSatelliteCount();
          const altitude = position.coords.altitude;
          const speed = position.coords.speed;
          const newData = {
            dateTime,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            numberOfSatellites,
          };
          
          console.log(dateTime);
          console.log(newData);
          sendDataToLocalDB(newData);
          setUserLocation([longitude, latitude]); 
        } else {
          const latitude = 0;
          const longitude = 0;
          const altitude = 0;
          const speed = 0;
          const accuracy = 0;
          const numberOfSatellites = 0;
          const newData = {
            dateTime,
            latitude,
            longitude,
            altitude,
            speed,
            accuracy,
            numberOfSatellites,
          };

          console.log(dateTime);
          console.log("Fake GPS Detected");
          sendDataToLocalDB(newData);
          setModalVisible(true);
        }
      },
      error => {
        console.log(error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      }
    );
  };

  const sendDataToLocalDB = async (newData: { dateTime: string; latitude: number; longitude: number; altitude: number; speed: number; accuracy: number; numberOfSatellites: number }) => {
    try {
      await insertLocalDB(newData);
    } catch (error) {
      console.log(error);
    }
  };

  const checkInternetConnection = async () => {
    return await NetInfo.fetch().then((state) => state.isConnected);
  };

  const syncDataWithAPI = async () => {
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
          "numberOfSatellites": LogTracking.numberOfSatellites,
        });
        await deleteLocalDB(LogTracking.id);
      }
      getApi();
    } 
  };

  const sendDataToApi = async (newData: {dateTime: string; latitude: number; longitude: number; altitude: number; speed: number; accuracy: number; numberOfSatellites: number }) => {
    try {
      const response = await fetch('https://6662b64562966e20ef09a745.mockapi.io/location/v2/logTracking/1', {
        method: 'GET',
      });
      
      let existingData;
      
      if (!response.ok) {
        existingData = {
          id: 1,
          logTracking: [newData],
        };
        
        await fetch('https://6662b64562966e20ef09a745.mockapi.io/location/v2/logTracking', {
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
      
      await fetch('https://6662b64562966e20ef09a745.mockapi.io/location/v2/logTracking/1', {
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
    try {
      const response = await fetch('https://6662b64562966e20ef09a745.mockapi.io/location/v2/logTracking/1', {
        method: 'GET',
      });
      const json = await response.json();
      const logTrackingData = json.logTracking;
      setList(logTrackingData);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopForegroundService();
    } else {
      startForegroundService();
    }
    setIsTracking(!isTracking);
  };

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
      <Button title={isTracking ? "Stop Tracking" : "Start Tracking"} onPress={toggleTracking} />
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
});

export default App;