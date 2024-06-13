import { StyleSheet, Text, View, PermissionsAndroid, Button, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import ReactNativeForegroundService from "@supersami/rn-foreground-service";

const App = () => {
  const [location, setLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    requestLocationPermission()
    

    const interval = setInterval(() => {
      startForegroundService();
    }, 10000);

    return () => {
      clearInterval(interval);
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
      delay: 1000,
      onLoop: true,
      taskId: "taskid",
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
          console.log(position);
          setLocation(position);
        } else {
          console.log("Fake GPS Detected");
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

  return (
    <View style={styles.container}>
      <Text>Latitude: {location ? location.coords.latitude : null}</Text>
      <Text>Longitude: {location ? location.coords.longitude : null}</Text>
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
});

export default App;
