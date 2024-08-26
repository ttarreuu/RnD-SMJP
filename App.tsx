import { StyleSheet, Text, View, PermissionsAndroid, Button, Modal, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
import NetInfo from '@react-native-community/netinfo';
import {
  initDatabase,
  insertLocalDB,
  getLocalDB,
  deleteLocalDB,
} from './database';

const App = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [list, setList] = useState([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    getApi();
    initDatabase();
    requestLocationPermission();
    startForegroundService();

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
      delay: 10000, // tiap 1 mnt
      onLoop: true,
      taskId: "getLocation",
      onError: (e) => console.log(`Error logging:`, e),
    });

    ReactNativeForegroundService.add_task(() => syncDataWithAPI(), {
      delay: 60000, // tiap 5 mnt
      onLoop: true,
      taskId: "syncWithAPI",
      onError: (e) => console.log(`Error logging:`, e),
    });
  };

  const getCurrentLocation = () => {
    const currentDate = new Date();
    const dateTime = currentDate.toLocaleString();
    console.log(dateTime);

    Geolocation.getCurrentPosition(
      position => {
        if (position.mocked === false) {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const newData = {
            dateTime,
            latitude,
            longitude,
          };

          console.log(newData);
          sendDataToLocalDB(newData);
        } else {
          const latitude = 0;
          const longitude = 0;
          const newData = {
            dateTime,
            latitude,
            longitude,
          };

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

  const sendDataToLocalDB = async (newData) => {
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
          "longitude": LogTracking.longitude
        });
        await deleteLocalDB(LogTracking.id);
      }
      getApi();
    } 
  };

  
  const sendDataToApi = async (newData:any) => {
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


  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemDate}>DATE   : {item.dateTime}</Text>
        <Text>LAT       : {item.latitude}</Text>
        <Text>LONG    : {item.longitude}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <View style={styles.noInternetContainer}>
          <Text style={styles.noInternetText}>Opss! No internet</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Fake GPS Location Detected!</Text>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',  // Center items vertically
  },
  noInternetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noInternetText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemDate: {
    fontWeight: 'bold',
  },
});

export default App;