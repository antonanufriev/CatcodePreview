import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

//Custom component import
import MoreScreen from '../components/more/more-screen';
import Premium from '../containers/premium';

const Stack = createStackNavigator();

function More(props) {
	return(
    <Stack.Navigator>

      <Stack.Screen 
        name="More" 
        component={MoreScreen}
        options={{ 
          headerShown: false
        }} />        
      
      <Stack.Screen 
        name="Premium" 
        component={Premium} 
        options={{ 
          title: '',
          headerStyle: {
            backgroundColor: '#00CD88',
          },
          headerTintColor: '#FFFFFF'
        }}
      />

    </Stack.Navigator>

	)
}

export default More