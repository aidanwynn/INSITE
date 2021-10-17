import { StatusBar } from 'expo-status-bar';
import React, { useState, Component } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button, FlatList } from 'react-native';
import * as Location from 'expo-location';
import moment from 'moment';
import { NavigationContainer } from '@react-navigation/native';

import { styles } from '../../styles';

function settings({ navigation }) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={() => navigation.goBack()} title="Go back home" />
      </View>
    );
  }

export default settings;