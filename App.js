import { StatusBar } from 'expo-status-bar';
import React, { useState, Component } from 'react';
import { Text, View, ActivityIndicator, Button, FlatList, TextInput, ScrollView, RefreshControl} from 'react-native';
import * as Location from 'expo-location';
import moment from 'moment';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import Geocoder from 'react-native-geocoding';
import config from './config.js';
import SelectDropdown from 'react-native-select-dropdown'

// Hide API key in gitignored config file. 
Geocoder.init(config.REACT_APP_GOOGLE_API_KEY);

import { styles } from './styles';

var id;
const Separator = () => (
  <View style={styles.separator} />
);
function calcDist(lat1, lon1, lat2, lon2){
  var R = 6371; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}
function toRad(Value){
    return Value * Math.PI / 180;
}
function getUniqueListBy(arr, key) {
  return [...new Map(arr.map(item => [item[key], item])).values()]
}
function getColorDist(dist){
  if (dist <= 3){
    return '#EC7063';
  } else if ((dist > 3) && (dist <= 8)){
    return '#E59866';
  } else if ((dist > 8) && (dist <= 15)){
    return '#F8C471';
  } else if ((dist > 15) && (dist <= 25)){
    return '#A3E4D7';
  } else if ((dist > 25) && (dist <= 40)){
    return '#7FB3D5';
  } else {
    return '#82E0AA';
  }
}
function getColorCount(count){
  if (count >= 20){
    return '#EC7063';
  } else if ((count < 20) && (count >= 15)){
    return '#E59866';
  } else if ((count < 15) && (count >= 10)){
    return '#F8C471';
  } else if ((count < 10) && (count >= 5)){
    return '#17A589';
  } else if ((count < 5) && (count >= 0)){
    return '#7DCEA0';
  } else {
    return '#82E0AA';
  }
}
function getColorRisk(count){
  if (count >= 75){
    return '#EC7063';
  } else if ((count < 75) && (count >= 55)){
    return '#E59866';
  } else if ((count < 55) && (count >= 40)){
    return '#F8C471';
  } else if ((count < 40) && (count >= 20)){
    return '#17A589';
  } else if ((count < 20) && (count >= 0)){
    return '#7DCEA0';
  } else {
    return '#82E0AA';
  }
}

global.location = {lat: null, lng: null};
global.fakeLocation = {lat: null, lng: null};
global.refresh = false;
global.fake = false;
global.address = null;
global.personal = { 
  age:0,
  vax:0,
  hyper_t:0,
  obesity:0,
  diabetes:0,
  lung_d:0,
  cardio_v:0,
  neuro_l:0,
  renal:0,
  immuno_comp:0,
  blood_d:0,
  sex_M:0
}
global.loc = {
  poscode: null,
  venue: null,
  hour: null,
  day: null
}
global.Prediction = {
  Cases: 0,
  Risk: 0,
  Pers: 0
}


const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="INSITE">
        <Drawer.Screen name="INSITE" onPress={() => this.getCaseLocAsync()} component={Home} />
        <Drawer.Screen name="INSITE AI" component={ai} />
        <Drawer.Screen name="Settings" component={settings} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

class Home extends React.Component{
  // constructor(){
  //   super();
  state = {
    ready: false, 
    // location: {lat: null, lng: null},
    // fakeLocation: {lat: null, lng: null},
    address: null,
    error: null,
    data: [], 
    latest: null,
    dataReceived: false,
    searching: false,
    refreshing: false,
    PredictionCases: null,
    PredictionRisk: null,
    PredictionPers: null,
  }
  // PredictionCases = null;
  // PredictionRisk = null;
  // PredictionPers = null;
  // }
  updateFakeLoc(lat, lng){
      global.fakeLocation =  { lat: lat, lng: lng};
      this.getCaseLocAsync();
  }
  updatePers(age,vax,hyper_t,obesity,diabetes,lung_d,cardio_v,neuro_l,renal,immuno_comp,blood_d,sex_M){
      global.personal = { 
        age:age,
        vax:vax,
        hyper_t:hyper_t,
        obesity:obesity,
        diabetes:diabetes,
        lung_d:lung_d,
        cardio_v:cardio_v,
        neuro_l:neuro_l,
        renal:renal,
        immuno_comp:immuno_comp,
        blood_d:blood_d,
        sex_M:sex_M
      };
      this.pers_predict(global.personal);
  };
  updateLoc(poscode, venue, hour, day){
      global.loc = { 
        poscode: poscode,
        venue: venue,
        hour: hour,
        day: day
      };
      this.loc_predict(global.loc);
      console.log(global.loc)
  };
  
  loc_predict = async (loc) => {
    try {
      const response = await fetch(
        'http://192.168.0.61:80/predict/location', {
          method: 'POST',
          headers: new Headers({
            'accept':       'application/json', 
            'Content-type': 'application/json'
          }), 
          body: JSON.stringify({
            "poscode": 0,
            "venue": loc.venue,
            "hour": loc.hour,
            "day": loc.day
          })
        }
      );
      const result = await response.json();
      global.Prediction.Cases = parseFloat(JSON.stringify(result.PredictionCases)).toFixed(0);
      global.Prediction.Risk = parseFloat(JSON.stringify(result.PredictionRisk)).toFixed(1);
      this.setState({
        PredictionCases: global.Prediction.Cases,
        PredictionRisk: global.Prediction.Risk
      });
      console.log(this.state.PredictionCases);
      console.log(this.state.PredictionRisk);
    } catch (error) {
      console.error(error);
    }
    return;
  };
  pers_predict = async (person) => {
    try {
      const response = await fetch(
        'http://192.168.0.61:80/predict/personal', {
          method: 'POST',
          headers: new Headers({
            'accept':       'application/json', 
            'Content-Type': 'application/json'
          }), 
          body: JSON.stringify({
            "age": person.age,
            "vax": person.vax,
            "hyper_t": person.hyper_t,
            "obesity": person.obesity,
            "diabetes": person.diabetes,
            "lung_d": person.lung_d,
            "cardio_v": person.cardio_v,
            "neuro_l": person.neuro_l,
            "renal": person.renal,
            "immuno_comp": person.immuno_comp,
            "blood_d": person.blood_d,
            "sex_M": person.sex_M
          })
        }
      );
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
    return;
  };

  componentDidMount(){
    let geoOptions = {
      enableHighAccuracy: true,
      timeout: 2000,
      maximumAge: 60 * 60
    };
    this.setState({ready: false, error: null});
    Location.requestForegroundPermissionsAsync();
    Location.installWebGeolocationPolyfill();
    id = navigator.geolocation.watchPosition(this.geoSuccess, this.geoFail, geoOptions);
  }
  componentWillUnmount(){
    navigator.geolocation.clearWatch(id);
  }
  geoSuccess = (location) => {
    console.log("Location found.");
    // console.log(location);
    this.setState({
      ready:true
    });
    global.location = { lat: location.coords.latitude, lng: location.coords.longitude}
    this.getCaseLocAsync();
  }
  geoFail = (err) => {
    this.setState({error: err.message});
  }
  getCaseLocAsync = async () => {
    this.setState({searching: true, data: []})
    console.log("Requesting data...");
    try {
      const response = await fetch(
        'https://data.nsw.gov.au/data/dataset/0a52e6c1-bc0b-48af-8b45-d791a6d8e289/resource/f3a28eed-8c2a-437b-8ac1-2dab3cf760f9/download/covid-case-locations-20210913-1400.json'
      );
      const result = await response.json();
      var time = moment((result.date + " " + result.time), "YYYY-MM-DD h:mm a");
      time = time.fromNow();
      var list = result.data.monitor;
      console.log("Data received.");

      var lat; var lng;
      // Check if we're using a fake Location
      if  (global.fakeLocation.lat != null){
        lat = global.fakeLocation.lat;
        lng = global.fakeLocation.lng;
        global.fake = true;
      }
      else {
        lat = global.location.lat;
        lng = global.location.lng;
        global.fake = false;
      } 
      //console.log("using: " + lat + ", "+ lng);
      list.sort((a, b) => (
        calcDist(lat,lng,a.Lat,a.Lon) > calcDist(lat,lng,b.Lat,b.Lon)    
        ) ? 1 : -1);
      for (let i = 0; i < list.length; i++) { // get number of occurrences
        var count = 0;
        list[i].times = [];
        list.forEach((sites) => {
          if (list[i].Venue == sites.Venue){
            count++;
            var timeLast;
            var time = moment((sites.Date), "dddd D MMMM YYYY");  // time now
            if (list[i].times.length > 0){
              timeLast = moment((list[i].times[ list[i].times.length - 1 ]), "dddd D MMMM YYYY"); 
              if (moment(time).isAfter(timeLast)){
                list[i].recent = time.fromNow();
              }
            }
            else {
              list[i].recent = time.fromNow();
            }
            list[i].times.push((sites.Date +" "+ sites.Time));
          }
        })
        list[i].count = count
      };
      list = getUniqueListBy(list, 'Venue') //Show only unique venues
      list.forEach((site) => {  // get distance from user (km)
        site.dist = Math.round(calcDist(lat, lng, site.Lat, site.Lon) * 1) / 1;
      });
      for (let i = list.length - 1; i >= 0; --i) {  // filter out values above certain X km
        if (list[i].dist > 70) {
          list.splice(i, 1);      // Remove the element
        }
      }

      this.setState({data: list, dataReceived: true, latest: time, refreshing: false});
    } catch (error) {
      console.error(error);
    }
  }
  handleRefresh = () => {
    console.log('Refreshing...');
    this.setState({refreshing: true}
    );
    this.getCaseLocAsync();
  };
  renderHeader = () => {
    if (!this.state.refreshing) return null; 
    
    return (
      <View style={{paddingVertical: 20}}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  };

  render(){
    return (
      <View>
        <View style={styles.container}>
          { this.state.error && (
            <Text style={styles.info}>Error: {this.state.error}</Text>
          )}
          
          { this.state.searching && !this.state.dataReceived && (
            // create loading wheel
            <Text style={styles.info}>Requesting data...</Text>
          )}

          { this.state.dataReceived && !this.state.refreshing && (
            <View style={{}}>  
              {(global.address != null) ?
                (<Text style={styles.updated}>
                      <Text>{`${global.address} | `}{this.state.latest}</Text>
                </Text>) : <Text style={styles.updated}>{this.state.latest}</Text>
              }
              
              <FlatList
                data={this.state.data}
                extraData={global.refresh}
                keyExtractor={item => item.Venue}
                renderItem={({ item }) => (
                  <View style={styles.listItem}>
                    <View style={styles.SiteCont}>
                      <Text style={styles.SiteText}>
                        {`${item.Venue}`}
                      </Text>
                      <View style={{flexDirection: 'row'}}>
                        <Text style={styles.SubText}>
                          {`${item.Suburb}`}
                        </Text>
                        <Text style={styles.recentText}>
                          {`${item.recent}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoCont}>
                      <Text style={[styles.DistText, {backgroundColor: getColorDist(item.dist)} ]}>
                        {`${item.dist}km\n Away`}
                      </Text>
                      <Text style={[styles.siteCount, {backgroundColor: getColorCount(item.count)} ]}>
                      {`${item.count}\n`}{item.count > 1? 'Cases': 'Case' }
                      </Text>
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={this.renderSeparator}
                refreshing={this.state.refreshing}
                onRefresh={() => this.handleRefresh()}
                // ListHeaderComponent={this.renderHeader}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
}

class settings extends Home{

  getLatLong = (lookup) => {
    Geocoder.from(lookup, {
      southwest: {lat: -37.5, lng: 140.0},
      northeast: {lat: -27.9, lng: 153.8}})
      .then(json => {
        var fakeLocation = json.results[0].geometry.location;
        console.log("fakeLocation found.");
        this.updateFakeLoc(fakeLocation.lat, fakeLocation.lng);
        console.log(fakeLocation.lat +", "+ fakeLocation.lng);
      })
      .catch(error => console.warn(error));
  }

  render(){
    return (
      <View>

         
        <View style={styles.searchLoc}>
          {/* <TextInput 
            placeholder="Enter address"
            style={styles.input}
            onChangeText={(value) => global.address = value}
          /> */}
          <SelectDropdown
            data={['Monday','Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
            onSelect={(selectedItem, index) => {
              global.loc.day = selectedItem
              console.log(global.loc.day)
            }}
            
          />
          <SelectDropdown
            data={[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]}
            onSelect={(selectedItem, index) => {
              global.loc.hour = selectedItem
              console.log(global.loc.hour)
            }}
            
          />
          <SelectDropdown
            data={[
              "Ernest by Hemingway",
              "Panizzi",
              "Rush Cedar's Courtyard",
              "Ugly Duckling",
              "UOW UniBar",
              "UOW Library",
              "UniActive",
              "UOW IGA",
              "Early Start Discovery Space",
              'Wollongong Botanic Garden',
              'Cleaver and Co Quality Meats'
            ]}
            onSelect={(selectedItem, index) => {
              global.loc.venue = selectedItem
              console.log(global.loc.venue)
            }}
            
          />
          
          <Button 
            title="Enter Details"
            onPress={() => this.updateLoc(0, global.loc.venue, global.loc.hour, global.loc.day)}
          />
          <Text style={styles.infoAddress}>
              {`Cases: ${global.Prediction.Cases}\n`}
              {`Risk: ${global.Prediction.Risk}%`}
          </Text>
        </View>
      </View>
    );
  }
}

class ai extends Home{
  
  onRefresh = () => {
    this.setState({ refreshing: true });
    // In actual case set refreshing to false when whatever is being refreshed is done!
    setTimeout(() => {
      this.setState({ refreshing: false });
    }, 500);
  };
  render(){
    return (
      <View>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
              title="Pull to refresh"
            />
          }

          // style={styles.container}
          >
          <View style={styles.containerNew}>
            <View style={styles.infoCont}>
              <Text style={[styles.DistText, {backgroundColor: getColorDist(12)} ]}>
                {`${global.Prediction.Cases}\nCases`}
              </Text>
              <Text style={[styles.siteCount, {backgroundColor: getColorRisk(global.Prediction.Risk)} ]}>
              {`${global.Prediction.Risk}%`}
              </Text>
            </View>
          </View>
          {/* <Text style={styles.infoAddress}>
              {`Cases: ${global.Prediction.Cases}\n`}
              {`Risk: ${global.Prediction.Risk}%`}
          </Text> */}
          
        </ScrollView>
      </View>
    );
  }
}
