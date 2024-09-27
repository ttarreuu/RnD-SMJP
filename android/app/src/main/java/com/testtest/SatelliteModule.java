package com.testtest;

import android.location.GnssStatus;
import android.location.LocationManager;
import android.content.Context;
import android.os.Build;
import androidx.annotation.RequiresApi;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class SatelliteModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private LocationManager locationManager;

    public SatelliteModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.locationManager = (LocationManager) reactContext.getSystemService(Context.LOCATION_SERVICE);
    }

    @Override
    public String getName() {
        return "SatelliteModule";
    }

    @RequiresApi(api = Build.VERSION_CODES.N)
    @ReactMethod
    public void getSatelliteCount(final Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                GnssStatus.Callback gnssStatusCallback = new GnssStatus.Callback() {
                    @Override
                    public void onSatelliteStatusChanged(GnssStatus status) {
                        int count = status.getSatelliteCount();
                        promise.resolve(count); // Send the satellite count back to JS
                        locationManager.unregisterGnssStatusCallback(this); // Unregister callback once we get the count
                    }
                };

                locationManager.registerGnssStatusCallback(gnssStatusCallback);
            } else {
                promise.reject("Error", "API level is too low to access GNSS status");
            }
        } catch (Exception e) {
            promise.reject("Error", e.getMessage());
        }
    }
}
