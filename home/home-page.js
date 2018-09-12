// Nativescript Spotify app
// Version: 1.01
// Author: Marko S. @ https://github.com/markosole
// Server required for this app: https://github.com/markosole/nodejs-spotify 

const app = require("application"); 
const http = require("http");
const timerModule = require("tns-core-modules/timer");
const HomeViewModel = require("./home-view-model");
const observableModule = require("data/observable"); 
var utilityModule = require("utils/utils");

// Blynk Device ID key - CHANGE THIS TO YOUR KEY
const kljuc = "BLYNK_DEVICE_ID_KEY"; //Blynk server device key 
const blynkURL = "http://YOUR_BLYNK_SERVER:8088";
const nodeURL = "http://YOUR_BACKEND_SERVER:8888";
// define seek/progress bar calculation variables to 0;
let seekServer      = 0;
let songDuration    = 0;

//# settings - not implemented in this version
const vm = new observableModule.Observable(); 
let MySettings = observableModule.fromObject({ 
    // kartica: function(args){
    //     return appSettings.getString("serverURL", "000");
    // } 
});  
Object.defineProperty(MySettings, "blynk", {
    get: function () {                       
              return "unknown";  
    }, 
    enumerable: true,
    configurable: true
 });
 

function onNavigatingTo(args) {
    const page = args.object;
    page.bindingContext = new HomeViewModel(); 

    vm.set("loginRequested", "yes"); // init set to yes (requires login)
    if((kljuc !== "") && (blynkURL !== "")) {
        vm.set("blynkConfigured", "yes");
    } else {
        vm.set("blynkConfigured", "no");
    }
   
    // Light slider 
    vm.set("currentValue", 20); 
    vm.set("sliderValue", 20);
    ambientLightStatus(); // checks room light %
    // What is playing...
    vm.set("playingArtist", "");
    vm.set("playingSong", "");
    // volume settings
    vm.set("volumeSlider", 30);
    vm.set("volumeLevel", 30);
    // time and duration
    vm.set("progressSong", 0);
    vm.set("progressSongTime", "00:00");
    vm.set("durationSong", 3000);
    vm.set("durationSongTime", "00:00"); 
    // palying device info
    vm.set("deviceName", "");
    vm.set("deviceType", "");
    vm.set("artistImage", "");
    vm.set("albumName", "");
    vm.set("albumYear",  "");
    vm.set("albumTracks",  "");
    // light slider params
    vm.set("fontSize", 20);
    vm.set("firstMinValue", 0);
    vm.set("firstMaxValue", 100);
    // handle value change
    vm.on(observableModule.Observable.propertyChangeEvent, (propertyChangeData) => {
        if (propertyChangeData.propertyName === "sliderValue") {
            vm.set("currentValue", propertyChangeData.value);
            // Call function and pass value parameter
            getRequest(propertyChangeData.value);
        }
        if (propertyChangeData.propertyName === "volumeSlider") {
            vm.set("volumeLevel", propertyChangeData.value);
            // Call function and pass value parameter           
            volumeChange(propertyChangeData.value);
        }
    });
    page.bindingContext = vm;
    vm.bindingContext = MySettings; 
    whatsPlaying();
    // checks light every 30 sec
    id = timerModule.setInterval(() => { 
        ambientLightStatus(); 
    }, 30000);
    
    // Pulls what is playing on spotify every 10 seconds. Automatic detection (socket) is not yet implemented
    id2 = timerModule.setInterval(() => {       
        whatsPlaying();
    }, 10000);
} 

function onDrawerButtonTap(args) {
    const sideDrawer = app.getRootView();
    sideDrawer.showDrawer();
} 

//## Spotify 
function komande(args){
    const komanda = args.object.komanda;
    const tip = args.object.tip; 
    http.request({
        url: nodeURL+"/komande",
        method: 'POST', // Must be POST to NodeJS server! Server will translate POST and PUT sent to Spotify servers
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify({ 
            komanda: komanda,
            tip: tip    
        })
        
    }).then((response) => {        
        const result = response.content.toJSON();
        var obj = JSON.parse(result); 
        // Show login required messages from server
        console.log(obj.login); 
        console.log(result); 
    }, (e) => {
    }); 
    // Add Timeout 500ms and give some time to Spotify server to publish data
    setTimeout(() => {        
        whatsPlaying();
    }, 500); 
}
// get player info (device, volume, etc.)
function getPlayerInfo(){
    const komanda = ""; // send empty to get device info 
    const tip = "GET";
    http.request({
        url: nodeURL+"/komande",
        method: 'POST', // Must be POST to NodeJS server! Server will translate POST and PUT sent to Spotify servers
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify({ 
            komanda: komanda,
            tip: tip   
        }) 
    }).then((response) => {        
          const result = response.content.toJSON();
         var obj = JSON.parse(result); 
        // Show login required messages from server
          console.log(obj); 
    }, (e) => {
    });
    
    // Add Timeout 500ms and give some time to Spotify server to publish data
    setTimeout(() => {        
        whatsPlaying();
    }, 500); 
}

function volumeChange(val){
    const komanda = "volume?volume_percent";
    const value = val;
    const tip = "PUT";
    http.request({
        url: nodeURL+"/komande",
        method: 'POST', // Must be POST to NodeJS server! Server will translate POST and PUT sent to Spotify servers
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify({ 
            komanda: komanda,
            tip: tip,
            value: value    
        }) 
    }).then((response) => {  
        // console.log(response); 
    }, (e) => {
    }); 
    // Add Timeout 500ms and give some time to Spotify server to publish data
    setTimeout(() => {        
        whatsPlaying();
    }, 500); 
}

// Mod: 12/09 - player info returns more data
function whatsPlaying(){
    const komanda = '';  // original: currently-playing   Must be '' for info from player (more data incl volume)
    const tip = 'GET';
    http.request({
        url: nodeURL+"/komande",
        method: 'POST', // Must be POST to NodeJS server! Server will translate POST and PUT sent to Spotify servers
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify({ 
            komanda: komanda,
            tip: tip   
        })
    }).then((response) => {
        const result = response.content.toJSON();
        var obj = JSON.parse(result); 
        console.log("Artist: " + obj.item.album.artists[0].name + "\nSong: "+obj.item.name); 
        //console.log(response); // test display all data in response

        vm.set("progressSong", obj.progress_ms);
        seekServer = obj.progress_ms; // update calculation variable as well
        vm.set("durationSong", obj.item.duration_ms);
        songDuration = obj.item.duration_ms;

        // calculate ms in minutes (UI display)
        vm.set("progressSongTime", millisToMinutesAndSeconds(obj.progress_ms));        
        vm.set("durationSongTime", millisToMinutesAndSeconds(obj.item.duration_ms)); 

        // update playing song info in UI
        vm.set("playingArtist", obj.item.album.artists[0].name);
        vm.set("playingSong", obj.item.name);
        // update volume settings on UI Mod: 12/09
        vm.set("volumeSlider", obj.device.volume_percent);
        vm.set("volumeLevel", obj.device.volume_percent);
        // set GUI to media controll enabled
        vm.set("loginRequested", "no");
        // Get device info (name, etc.) and update UI
        vm.set("deviceName", obj.device.name);
        vm.set("deviceType", obj.device.type);
        vm.set("artistImage", obj.item.album.images[1].url);
        vm.set("albumName",  obj.item.album.name); 
        vm.set("albumYear",  obj.item.album.release_date);
        vm.set("albumTracks",  obj.item.album.total_tracks);
        // update seek bar on UI
        seekTimer();

    }, (e) => {
        console.log("login to spot required, Local app console log notif.");
        // set login GUI and require user login to Spotify
        vm.set("loginRequested", "yes");
    }); 
   
}

function millisToMinutesAndSeconds(millis) { 
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  } 

// open login URL
function LoginToSpotify() {
    utilityModule.openUrl(nodeURL+"/login");
} 
 
// handle Slider value change
function onSliderLoaded(args) { 
    const sliderComponent = args.object;
    sliderComponent.on("valueChange", (sargs) => { 
        const page = sargs.object.page;
        const vm = page.bindingContext;
        vm.set("fontSize", sargs.object.value); 
    });
}


// calculate progress and visualize it on seek bar (smoothing)  
id = timerModule.setInterval(() => {
    const millisTmp = seekServer; 
    if(seekServer < songDuration) {
        seekServer = seekServer + 1000; // add 1s and visualy move seek bar
        // due incremential, this will run only once (last time) and request from server new playing song (details)
        // This is work-around because we do not have realtime server communication (socket), we request and update data every 10s instead
        if(seekServer < songDuration) { 
            whatsPlaying();
        }
    }  
    // stop UI updates on pause or stop (checks current progress time from server)
    if(millisTmp !== seekServer) {
         vm.set("progressSong", millisTmp);
         vm.set("progressSongTime", millisToMinutesAndSeconds(millisTmp)); 
    } else {
         vm.set("progressSong", seekServer);
         vm.set("progressSongTime", millisToMinutesAndSeconds(seekServer));         
    } 
}, 1000); // spin every 1000 ms (1s) 

//# Blynk Server - Light
// Send new light level to server
function getRequest(vrijednost) {
    http.getJSON(blynkURL+"/"+kljuc+"/update/V1?value=" + vrijednost).then(function(result) {
        console.log(JSON.stringify(result));
    }, function(error) {
       // console.error(JSON.stringify(error));
    });
} 

// checks light status on Blynk server
function ambientLightStatus() {
    let vrati = 0;
    http.getJSON(blynkURL+"/"+kljuc+"/pin/V1").then(function(result) {     
        vrati = JSON.parse(result);       
        vm.set("currentValue", vrati);
        vm.set("sliderValue", vrati);        
    }, function(error) {
        console.error(JSON.stringify(error));
    });
    //return vrati;    
}

// Call this function to force next song without JSON POST
function playNext(){  
    http.getJSON(nodeURL+"/next").then(function(result) { 
        console.log(result.status);  
    }, function(error) {
        console.error(JSON.stringify(error));
    });
}

exports.volumeChange = volumeChange;
exports.getPlayerInfo = getPlayerInfo;
exports.millisToMinutesAndSeconds = millisToMinutesAndSeconds;
exports.whatsPlaying = whatsPlaying;
exports.komande = komande;
exports.LoginToSpotify = LoginToSpotify;
exports.playNext = playNext;
exports.onSliderLoaded = onSliderLoaded;
exports.ambientLightStatus = ambientLightStatus;
exports.getRequest = getRequest;
exports.onNavigatingTo = onNavigatingTo;
exports.onDrawerButtonTap = onDrawerButtonTap;