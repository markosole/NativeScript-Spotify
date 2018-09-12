# Spotify with NativeScript for Android and iOS 
This is simple NativeScript app for controling Spotify
NOTE: (ios not tested for latest version)

# Befor you begin
This app requires nodejs server as backend. Please check here: https://github.com/markosole/nodejs-spotify
Make sure that you alter settings for your needs (server URLs).

    const kljuc = "BLYNK_DEVICE_ID"; //Blynk server device key  leave empty if not used
    const blynkURL = "http://YOUR_SERVER:PORT"; // leave empty if not used
    const nodeURL = "http://YOUR_SERVER:8888";
    
App supports Blynk IoT device control. If you do not have any Blynk servers set, make sure you leave settings empty. 

# How it works
App does not require nor ask for any login data. All authentification goes over backend server. To control spotify, all you have to do is login to spotif from any device (PC, mobile.. etc), only once and using your browser. Please check backend server documentation. 

# Wahat you can control?
 - Play
 - Pause
 - Prev/Next song
 - Volume
 - Get data about artist, album, etc. 
 
 ToDo: Seek bar control. Will be released in next version. Please make sure to update server as well, as new features requires latest server backend. 
 
 

