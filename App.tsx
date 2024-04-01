import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, PermissionsAndroid, Modal, Button } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const App = () => {
  const [location, setLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);


  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geolocation Permission',
          message: 'Can we access your location?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === 'granted') {
        // console.log('Geolocation Active');
        return true;
      } else {
        // console.log('Geolocation Non Active');
        return false;
      }
    } catch (err) {
      return false;
    }
  };


  const getLocation = async () => {
    const result = await requestLocationPermission();
    if(result){
      Geolocation.getCurrentPosition(
        position => {
          if(position.mocked == false) {
            console.log(position);
            setLocation(position);
          }else{
            console.log("Fake GPS Detected");
            setModalVisible(true);
          }
        },
        error => {
          console.log(error.code, error.message);
          setLocation(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getLocation();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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