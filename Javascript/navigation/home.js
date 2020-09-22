
//React import
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';

//Custom component import
import Camera from '../containers/camera';
import List from '../containers/list';
import More from './more';

const Tab = createBottomTabNavigator();

function Home(props) {

	return (
		<Tab.Navigator 
			initialRouteName="Scan"
			tabBarOptions={{
            activeTintColor: '#00CD88',
         }}>
			<Tab.Screen 
				name="List"
				component={List} 
				options={{
					tabBarIcon: ({ color, size }) => (
						<Icon name="circle-o" size={size} color={color}/>
					),
					tabBarOptions: { activeTintColor:'red'}
				}}
			/>
			<Tab.Screen 
				name="Scan" 
				component={Camera}
				options={{
					tabBarIcon: ({ color, size }) => (
						<Icon name="dot-circle-o" size={size} color={color}/>
					),
					tabStyle:{fontFamily: 'monospace'}
				}}
			/>
			<Tab.Screen 
				name="More" 
				component={More}
				options={{
					tabBarIcon: ({ color, size }) => (
						<Icon name="circle" size={size} color={color} />
					),
				}}
			/>
		</Tab.Navigator>
	);  
}

export default Home;
