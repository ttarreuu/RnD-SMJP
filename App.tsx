import { StyleSheet, Text, View, PermissionsAndroid, Button, Modal, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
import NetInfo from '@react-native-community/netinfo';
import {
  initDatabase,
  insertLocation,
  getLocations,
  deleteLocation,
  clearLocations,
} from './database';

const App = () => {
  const [location, setLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [list, setList] = useState([]);

  useEffect(() => {
    requestLocationPermission();
    startForegroundService();
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
      delay: 10000,
      onLoop: true,
      taskId: "taskid",
      onError: (e) => console.log(`Error logging:`, e),
    });
  };

  const checkInternetConnection = async () => {
    return await NetInfo.fetch().then((state) => state.isConnected);
  };

  const sendDataToApi = async (data) => {
    try {
      await fetch('https://6639cbd81ae792804beccbdc.mockapi.io/location/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getData = () => {
    fetch('https://6662b64562966e20ef09a745.mockapi.io/location/v2/users', {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((res) => {
        setList(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const sendDataToLocalDB = async (data) => {
    try {
      await insertLocation(data);
    } catch (error) {
      console.log(error);
    }
  };

  const syncDataWithApi = async () => {
    const localDB = await getLocations();
    for (const location of localDB) {
      await sendDataToApi(location);
      await deleteLocation(location.id);
    }
  };

  const handleData = async ({dateTime, latitude, longitude}) => {
    const isConnected = await checkInternetConnection();

    if(isConnected) {
      await syncDataWithApi();
      await sendDataToApi({dateTime, latitude, longitude});
      getData();
    }else {
      await sendDataToLocalDB({dateTime, latitude, longitude});
    }
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
          const currDateTime = dateTime;

          console.log(position);
          setLocation(position);
          handleData({dateTime, latitude, longitude});
        } else {
          const latitude = 0;
          const longitude = 0;
          const currDateTime = dateTime;

          console.log("Fake GPS Detected");
          setModalVisible(true);
          handleData({dateTime, latitude, longitude});
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

  return (
    <View style={styles.container}>
      <ScrollView>
        {list.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemDate}>DATE   : {item.dateTime}</Text>
              <Text>LAT       : {item.latitude}</Text>
              <Text>LONG    : {item.longitude}</Text>
            </View>
            <View style={styles.buttonContainer}>
            </View>
          </View>
        ))}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomColor: '#ddd',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemDate: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export default App;
