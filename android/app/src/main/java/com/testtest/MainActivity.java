package com.testtest;


import android.content.Intent;
import android.util.Log;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "testtest";
  }

  public boolean isOnNewIntent = false;

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    isOnNewIntent = true;
    ForegroundEmitter();
  }

  @Override
  public void onStart() {
    super.onStart();
    if(isOnNewIntent == true) {

    } else {
      ForegroundEmitter();
    }
  }

  public void ForegroundEmitter(){
    String main = getIntent().getStringExtra("mainOnPress");
    String btn = getIntent().getStringExtra("buttonOnPress");
    WritableMap map = Arguments.createMap();
    if(main != null){
      map.putString("main", main);
    }
    if(btn != null){
      map.putString("button", btn);
    }
    try{
      getReactInstanceManager().getCurrentReactContext()
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("notificationClickHandle", map);
    }catch (Exception e) {
      Log.e("Superlog", "Caught Exception " + e.getMessage());
    }
  }

}