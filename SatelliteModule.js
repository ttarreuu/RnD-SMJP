import { NativeModules } from 'react-native';

const { SatelliteModule } = NativeModules;

const getSatelliteCount = async () => {
  try {
    const count = await SatelliteModule.getSatelliteCount();
    return count;
  } catch (error) {
    console.error('Error fetching satellite count: ', error);
    throw error;
  }
};

export default {
  getSatelliteCount,
};
