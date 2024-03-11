import * as React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { registerRootComponent } from 'expo';
import AuthState from './services/auth/context/authState';
import Router from './components/navigation/Router';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';


export default function App() {
  console.log(theme);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ?  DarkTheme : DefaultTheme;

  return (
      <AuthState>
        <NavigationContainer theme={theme}>
          <StatusBar backgroundColor={theme.colors.background}/>
          <Router />
        </NavigationContainer>
      </AuthState>
  );
}

registerRootComponent(App);
